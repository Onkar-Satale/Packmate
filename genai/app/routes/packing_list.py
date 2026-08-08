# Route definitions for AI packing list generation and Word document download endpoints

import json
import time
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from app.dependencies import verify_api_key
from app.schemas.schemas import TripRequestGenerate, DownloadRequest
from app.services.packing_list import generation_cache, generate_packing_data, create_docx
from app.config.settings import logger

router = APIRouter()


@router.post("/generate-packing-list", dependencies=[Depends(verify_api_key)])
def api_generate_packing_list(request: Request, trip: TripRequestGenerate):
    """
    Primary API Endpoint to generate an AI-driven packing list.
    
    Expected Body (TripRequestGenerate format): 
      JSON with location, days, trip_type, budget, food, luggage, travelers, etc.
      
    Returns: 
      JSON response containing:
      {
         "packing_list": ["SECTION", "Item", "Item", ...]
      }
    """
    data = trip.dict()
    
    cache_key = json.dumps(data, sort_keys=True)
    current_time = time.time()
    
    # Check cache first to save AI calls
    if cache_key in generation_cache:
        cached_data, timestamp = generation_cache[cache_key]
        if current_time - timestamp < 300: # 5 minute TTL
            logger.info("Serving generated list from cache.")
            return cached_data
        else:
            del generation_cache[cache_key]

    ai_result = generate_packing_data(data)
    generation_cache[cache_key] = (ai_result, current_time)
    
    return ai_result

@router.post("/download-packing-list", dependencies=[Depends(verify_api_key)])
def api_download_packing_list(req: DownloadRequest):
    """
    Endpoint that packages the provided packing list directly into a downloadable .docx file.
    
    Expected Body: 
      JSON with packing_list.
      
    Returns:
      StreamingResponse serving a Word Document file as an attachment.
    """
    # Create DOCX and stream it back
    doc = create_docx(req.packing_list)
    return StreamingResponse(
        doc,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": "attachment; filename=Smart_Packing_List.docx"}
    )
