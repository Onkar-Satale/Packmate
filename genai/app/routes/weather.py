from fastapi import APIRouter, Depends
from groq import Groq
from app.config.settings import GROQ_API_KEY, logger
from app.schemas.schemas import PrefetchWeatherRequest
from app.dependencies import verify_api_key
from app.services.weather import prefetch_and_cache_weather

router = APIRouter()

@router.post("/prefetch-weather", dependencies=[Depends(verify_api_key)])
def api_prefetch_weather(req: PrefetchWeatherRequest):
    """
    Endpoint to correct the city name using Groq, then prefetch the temperature.
    """
    client = Groq(api_key=GROQ_API_KEY)
    
    # 1. Correct city with Groq (Fastest model for simple NLP extraction)
    prompt = f"""
You are a strict location corrector.

Task:
Fix the spelling of the given city or country name.

Input:
{req.destination}

Rules:
1. Return ONLY the corrected name.
2. Do NOT add any extra words, punctuation, or explanation.
3. Output must be a single valid city or country name.
4. If input is already correct, return it unchanged.
5. If the input is invalid or cannot be corrected, return exactly: INVALID.
6. Never return completely new city name as corected city name of user  
7. The corrected output MUST closely match the original input (only minor spelling fixes allowed).
8. Do NOT replace the input with a more popular or well-known city.
9. If unsure, return the original input exactly.
""" 
    try:
        res = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
            max_tokens=20
        )
        raw_response = res.choices[0].message.content.strip()
        
        # Fallback if Groq ignored instructions and wrote a conversational apology
        if len(raw_response.split()) > 4:
            corrected_city = req.destination
        else:
            corrected_city = raw_response.strip(".,'\"")
            
    except Exception as e:
        logger.error(f"Groq city correction error: {e}")
        corrected_city = req.destination # Fallback to original
        
    # 2. Fetch API forecast and populate cache for the corrected city
    temp = prefetch_and_cache_weather(corrected_city)
    
    return {"original": req.destination, "destination": corrected_city, "temperature": temp}
