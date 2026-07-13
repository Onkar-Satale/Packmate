from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import verify_api_key
from app.schemas.schemas import SuitcaseAnalysisRequest
from app.services.packing_list import is_section_heading
from app.services.weather import compute_full_trip_weather
from app.services.suitcase import validate_suitcase_image, analyze_suitcase_image

router = APIRouter()

@router.post("/analyze-suitcase", dependencies=[Depends(verify_api_key)])
def api_analyze_suitcase(req: SuitcaseAnalysisRequest):
    """
    Endpoint that processes the suitcase analyzer request.
    """
    # 1. Validate the uploaded image first
    validation = validate_suitcase_image(req.image_base64)
    if not validation.get("valid"):
        raise HTTPException(
            status_code=400,
            detail="Invalid image detected. Please upload a clear photo of your own empty, open suitcase or travel bag for analysis."
        )
        
    # 2. Fetch/compute weather
    weather_info = compute_full_trip_weather({
        "destination": req.destination,
        "start_date": req.start_date,
        "end_date": req.end_date,
        "days": req.duration
    })
    
    # 3. Filter out category headers from packing list
    actual_items = [item for item in req.packing_list if not is_section_heading(item)]
    
    # 4. Run analysis
    result = analyze_suitcase_image(
        image_base64=req.image_base64,
        packing_list=actual_items,
        destination=req.destination,
        duration=req.duration,
        activities=req.activities,
        weather=weather_info
    )
    
    return result
