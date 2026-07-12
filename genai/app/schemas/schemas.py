from typing import Optional
from pydantic import BaseModel, Field

class TripRequestGenerate(BaseModel):
    """
    Expected input format for generating a packing list or downloading it.
    """
    location: str = Field(..., max_length=150)
    days: int = Field(..., ge=1, le=120)
    trip_type: str = Field(..., max_length=50)
    purpose: str = Field(..., max_length=50)
    activities: str = Field(..., max_length=300)
    stay_type: str = Field(..., max_length=50)
    budget: str = Field(..., max_length=50)
    food: str = Field(..., max_length=100)
    luggage: str = Field(..., max_length=100)
    travel_type: str = Field(..., max_length=100)
    people: str = Field(..., max_length=1000)  # A flat string describing all travelers (e.g. "John, 25 years, Male")
    temperature: Optional[float] = None
    start_date: Optional[str] = Field(None, max_length=20)
    end_date: Optional[str] = Field(None, max_length=20)

class PrefetchWeatherRequest(BaseModel):
    """
    Payload for fetching weather and correcting city names
    """
    location: str = Field(..., max_length=150)

class DownloadRequest(BaseModel):
    """
    Expected input format for downloading a generated packing list.
    """
    packing_list: list

class SuitcaseAnalysisRequest(BaseModel):
    """
    Expected input format for suitcase analyzer.
    """
    image_base64: str
    packing_list: list
    destination: str
    duration: int
    activities: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
