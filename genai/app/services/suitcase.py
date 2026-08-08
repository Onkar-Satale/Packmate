# Vision service module for AI suitcase capacity validation and packing list optimization

import re
import json
from fastapi import HTTPException
from groq import Groq
from app.config.settings import GROQ_API_KEY, logger


def clean_item_name(item: str) -> str:
    """
    Strips emojis, ticks, and formatting symbols from an item's name.
    """
    # Remove surrogate pairs (non-BMP characters), other symbols, and variation selectors
    clean = re.sub(r'[^\u0000-\uFFFF]|[\u2600-\u27BF]|[\u2300-\u23FF]|[\u2B50-\u2B55]|[\u2934-\u2935]|[\uFE00-\uFE0F]', '', item)
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean


def build_vision_prompt(destination: str, weather: str, duration: int, activities: str, packing_list: list) -> str:
    """
    Builds the vision prompt instructions for the AI suitcase analyzer.
    """
    packing_list_str = "\n".join([f"- {item}" for item in packing_list])
    return f"""
You are an AI Travel suitcase capacity analyzer. You are given an image that may contain one or multiple suitcases/bags (up to 3 bags).
Analyze the suitcase(s) in the image and estimate:
1. The size of EACH suitcase/bag identified in the photo (e.g. Small, Medium, Large).
2. The approximate capacity of EACH suitcase/bag (e.g. in Liters).
3. The total combined capacity of all suitcases/bags shown in the photo.

Then, compare this total suitcase capacity against the traveler's details and proposed packing list:
- Destination: {destination}
- Weather/Temperature Forecast: {weather}
- Trip Duration: {duration} days
- Activities planned: {activities}

Here is the proposed packing list of items to categorize:
{packing_list_str}

Perform the following tasks:
1. Estimate the size and capacity of each bag, and state the combined total capacity (e.g. "Small (40L) and Medium (70L) - Total 110L"). Set "suitcase_size" to represent the overall sizing (e.g. "Medium", "Large", "2x Medium", "Small + Large" etc.) and "approximate_capacity" to represent the total combined capacity (e.g. "Total approx. 110 liters").
2. Assess whether the generated packing list can realistically fit in the identified suitcase(s) for the given duration and trip details. Provide a "comparison_summary".
3. Review each item from the proposed packing list and categorize it into one of these three lists:
   - "Must Pack": Items that are absolutely essential for the trip based on weather, duration, activities, and will fit.
   - "Optional": Items that are nice-to-have, but can be skipped if space is limited.
   - "Remove": Items that should be removed (e.g., because they are redundant, inappropriate for the weather, or won't fit in the suitcase).
4. For each categorized item, provide a "explanation" explaining why it is in that category.
5. EXTREMELY IMPORTANT: Categorize EVERY single item listed in the proposed packing list. Do not miss, omit, or rename any item. Strip all emojis and symbols from the item names in the final arrays (keep only name and quantity).
6. DISTRIBUTION RULE: You must realistically distribute the items across all three categories. Do not put all or almost all items in "Must Pack". Mark duplicate layers, extra toiletries, secondary footwear, and non-essential gadgets as "Optional". Mark items unsuitable for the forecast weather, duplicate primary items, or bulky items exceeding capacity constraints as "Remove".

You must respond ONLY with a JSON object of this structure:
{{
  "suitcase_size": "Description of suitcase size(s)",
  "approximate_capacity": "Total combined capacity description",
  "comparison_summary": "Your capacity review...",
  "categorized_items": {{
    "Must Pack": [
      {{"item": "cleaned item name (no emojis)", "explanation": "explanation string"}}
    ],
    "Optional": [
      {{"item": "cleaned item name (no emojis)", "explanation": "explanation string"}}
    ],
    "Remove": [
      {{"item": "cleaned item name (no emojis)", "explanation": "explanation string"}}
    ]
  }}
}}
Do not include any markup, markdown wrapper, or code fence. Just return the JSON object directly.
"""


def call_groq_vision_model(prompt: str, image_base64: str) -> dict:
    """
    Sends the prompt and base64-encoded image to the Groq Vision LLM.
    Queries the active qwen/qwen3.6-27b model.
    """
    client = Groq(api_key=GROQ_API_KEY)
    
    # Ensure correct format for inline image data
    if not image_base64.startswith("data:image/"):
        image_url = f"data:image/jpeg;base64,{image_base64}"
    else:
        image_url = image_base64

    model_name = "qwen/qwen3.6-27b"

    try:
        logger.info(f"Attempting to query Groq vision model: {model_name}")
        res = client.chat.completions.create(
            model=model_name,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_url
                            }
                        }
                    ]
                }
            ],
            temperature=0.2,
            max_completion_tokens=2048,
            reasoning_effort="none"
        )
        return res
    except Exception as e:
        logger.error(f"Error calling Groq vision model: {e}")
        raise


def parse_vision_response(raw_response: str) -> dict:
    """
    Parses and sanitizes the JSON response returned by the vision LLM.
    """
    try:
        cleaned = raw_response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        
        return json.loads(cleaned)
    except Exception as e:
        logger.error(f"JSON parsing error: {e}. Raw response: {raw_response}")
        raise HTTPException(status_code=500, detail="Invalid JSON response from vision model")


def optimize_packing_list(suitcase_info: dict, categorized_items: dict, original_items: list) -> dict:
    """
    Merges suitcase information and categorized packing list recommendations.
    Ensures 100% of original items are categorized without omission or duplicates,
    and strips any emojis/symbols from their names.
    """
    # Clean the category names
    must_pack_raw = categorized_items.get("Must Pack", [])
    optional_raw = categorized_items.get("Optional", [])
    remove_raw = categorized_items.get("Remove", [])
    
    # Help map items by matching their cleaned names (lowercase, stripped)
    def normalize(name):
        # Strip parenthesized text (like quantities (5) or (1 per traveler)) to prevent mismatch
        name_no_parens = re.sub(r'\(.*?\)', '', name)
        return "".join(c for c in name_no_parens.lower() if c.isalnum())
        
    # Build maps of LLM explanations
    explanations = {}
    llm_categories = {}
    
    for cat_name, items_list in [("Must Pack", must_pack_raw), ("Optional", optional_raw), ("Remove", remove_raw)]:
        for entry in items_list:
            if isinstance(entry, dict):
                item_name = entry.get("item", "")
                explanation = entry.get("explanation", "")
            else:
                item_name = str(entry)
                explanation = "Recommended recommendation based on suitcase capacity and trip details."
                
            clean_name = clean_item_name(item_name)
            norm_name = normalize(clean_name)
            if norm_name:
                explanations[norm_name] = explanation
                llm_categories[norm_name] = cat_name

    # Now, process every single original item
    final_categories = {
        "Must Pack": [],
        "Optional": [],
        "Remove": []
    }
    
    for item in original_items:
        clean_name = clean_item_name(item)
        norm_name = normalize(clean_name)
        
        # Retrieve explanation
        exp = explanations.get(norm_name, "Essential item for the trip details.")
        
        # Determine category (defaulting to Must Pack if LLM missed it)
        cat = llm_categories.get(norm_name, "Must Pack")
        
        final_categories[cat].append({
            "item": clean_name,
            "original_item": item, # Keep original string with emojis for frontend checkboxes
            "explanation": exp
        })
        
    return {
        "suitcase_size": suitcase_info.get("suitcase_size", "Medium"),
        "approximate_capacity": suitcase_info.get("approximate_capacity", "N/A"),
        "comparison_summary": suitcase_info.get("comparison_summary", ""),
        "categorized_items": final_categories
    }


def build_validation_prompt() -> str:
    """
    Builds the vision validation prompt to verify the uploaded image.
    """
    return """
Analyze the uploaded image and verify whether it contains suitable travel bags for analysis:
1. The image must contain at least one suitcase, travel bag, duffel bag, backpack, or carry-on.
2. The bag(s) must be clearly visible and not excessively blurry, obscured, or dark, so that their size can be estimated.
3. The image must be a photo of physical bag(s), not a completely unrelated scene (like food, documents, landscapes, screenshots, or random people without bags).
4. It is perfectly fine if the bag is open or closed, empty or partially packed, or if there are multiple bags (up to 3), or if there is a normal indoor/outdoor background (like a bedroom floor, bed, or hotel room).

You must respond ONLY with a JSON object of this structure:
{
  "valid": true or false,
  "reason": "A short, user-friendly explanation of why the image was accepted or specifically why it was rejected."
}
Do not include any markup, markdown wrapper, or code fence. Just return the JSON object directly.
"""

def validate_suitcase_image(image_base64: str) -> dict:
    """
    Validates if the image contains a single, empty, open suitcase/travel bag.
    """
    prompt = build_validation_prompt()
    try:
        response = call_groq_vision_model(prompt, image_base64)
        content = response.choices[0].message.content
        parsed = parse_vision_response(content)
        logger.info(f"Vision validation parsed: {parsed}")
        return {
            "valid": bool(parsed.get("valid", False)),
            "reason": str(parsed.get("reason", "Unknown validation error."))
        }
    except Exception as e:
        logger.error(f"Error in validate_suitcase_image: {e}")
        return {
            "valid": False,
            "reason": "Failed to validate suitcase image due to model query error."
        }


def analyze_suitcase_image(image_base64: str, packing_list: list, destination: str, duration: int, activities: str, weather: str) -> dict:
    """
    Main controller for analyzing a suitcase image and matching its capacity.
    """
    prompt = build_vision_prompt(destination, weather, duration, activities, packing_list)
    res = call_groq_vision_model(prompt, image_base64)
    content = res.choices[0].message.content
    parsed = parse_vision_response(content)
    
    suitcase_info = {
        "suitcase_size": parsed.get("suitcase_size", "Medium"),
        "approximate_capacity": parsed.get("approximate_capacity", "N/A"),
        "comparison_summary": parsed.get("comparison_summary", "")
    }
    categorized = parsed.get("categorized_items", {
        "Must Pack": [],
        "Optional": [],
        "Remove": []
    })
    
    return optimize_packing_list(suitcase_info, categorized, packing_list)
