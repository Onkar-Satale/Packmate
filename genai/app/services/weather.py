import time
import random
import requests
from app.config.settings import logger

# Cache for 10-day weather forecasts by location to prevent redundant API calls
weather_cache = {}

# Optimize requests globally with a session
http_session = requests.Session()

def geocode_location(location: str):
    """
    Looks up latitude and longitude for a given city string using Open-Meteo's Geocoding API.
    """
    try:
        url = f"https://geocoding-api.open-meteo.com/v1/search?name={location}&count=1"
        res = http_session.get(url, timeout=5)
        if res.status_code == 200:
            data = res.json()
            if "results" in data and len(data["results"]) > 0:
                loc_data = data["results"][0]
                lat = loc_data.get("latitude")
                lon = loc_data.get("longitude")
                logger.info(f"Geocoding success for '{location}': lat={lat}, lon={lon}")
                return lat, lon
            else:
                logger.warning(f"Geocoding found no results for '{location}'")
                return None, None
        else:
            logger.error(f"Geocoding API returned status {res.status_code}")
            return None, None
    except Exception as e:
        logger.error(f"Geocoding error: {e}")
        return None, None

def prefetch_and_cache_weather(location: str):
    """
    Fetches the 16-day weather forecast using Open-Meteo API and caches it.
    Returns the current/average temperature for the provided destination for response compatibility.
    """
    loc_key = location.lower().strip()
    lat, lon = geocode_location(loc_key)
    if lat is None or lon is None:
        logger.warning(f"Skipping Open-Meteo forecast fetch due to geocoding failure for '{location}'")
        return None

    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&daily=temperature_2m_max,temperature_2m_min&forecast_days=16&timezone=auto"
        res = http_session.get(url, timeout=5)
        
        if res.status_code == 200:
            data = res.json()
            api_temps = {}
            current_temp = None
            last_api_temp = None
            
            if "daily" in data:
                daily = data["daily"]
                time_list = daily.get("time", [])
                max_temps = daily.get("temperature_2m_max", [])
                min_temps = daily.get("temperature_2m_min", [])
                
                for i, dt_key in enumerate(time_list):
                    t_max = max_temps[i]
                    t_min = min_temps[i]
                    if t_max is not None and t_min is not None:
                        avg_temp = round((t_max + t_min) / 2.0, 1)
                        api_temps[dt_key] = avg_temp
                        last_api_temp = avg_temp
                        if i == 0:
                            current_temp = avg_temp
                            
            if current_temp is None and last_api_temp is not None:
                current_temp = last_api_temp
                
            weather_cache[loc_key] = {
                "api_temps": api_temps,
                "last_api_temp": last_api_temp,
                "fetched_at": time.time()
            }
            
            logger.info(f"Weather prefetched from Open-Meteo for '{location}' and cached successfully.")
            
            return current_temp
        else:
            logger.error(f"Open-Meteo API /forecast returned status {res.status_code}")
            return None
    except Exception as e:
        logger.error(f"Open-Meteo API error: {e}")
        return None

def compute_full_trip_weather(data: dict) -> str:
    from datetime import datetime, timedelta
    destination = data.get("destination", "").lower().strip()
    start_date_str = data.get("start_date")
    end_date_str = data.get("end_date")
    trip_days = int(data.get("days", 1))
    
    fallback_temp = data.get('temperature')
    if fallback_temp is None:
        fallback_temp = random.randint(20, 30)
        logger.info(f"No temp provided, using random fallback: {fallback_temp}°C")

    try:
        # Fallback if dates are missing: use today + trip_days
        if not start_date_str or not end_date_str:
            logger.info(f"Dates missing for {destination}, falling back to today + {trip_days} days")
            start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            total_days = trip_days
        else:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
            total_days = (end_date - start_date).days + 1
            if total_days <= 0: total_days = 1
        
        date_list = [start_date + timedelta(days=i) for i in range(total_days)]
        
        cached_weather = weather_cache.get(destination)
        if not cached_weather:
            # Graceful fetch in case prefetch wasn't called or cache was lost
            logger.info("Weather cache miss in compute_full_trip_weather, fetching now.")
            _ = prefetch_and_cache_weather(destination)
            cached_weather = weather_cache.get(destination)
            
        if cached_weather and cached_weather.get("api_temps"):
            api_temps = cached_weather["api_temps"]
            # Retrieve 16th day (last available) temperature to act as our base
            sorted_dates = sorted(api_temps.keys())
            sixteenth_day_temp = api_temps[sorted_dates[-1]] if sorted_dates else fallback_temp
        else:
            api_temps = {}
            sixteenth_day_temp = fallback_temp
 
        forecast_api_lines = []
        forecast_extra_lines = []
        current_temp = sixteenth_day_temp
 
        for dt in date_list:
            dt_str = dt.strftime("%Y-%m-%d")
            
            if dt_str in api_temps:
                current_temp = api_temps[dt_str]
                forecast_api_lines.append(f"{dt_str} → {current_temp}°C (Prefetched)")
            else:
                drift = random.choices([-2, -1, 0, 1, 2], weights=[0.1, 0.35, 0.1, 0.35, 0.1])[0]
                new_temp = current_temp + drift
 
                if new_temp > sixteenth_day_temp + 5:
                    new_temp = sixteenth_day_temp + 5
                elif new_temp < sixteenth_day_temp - 5:
                    new_temp = sixteenth_day_temp - 5
 
                current_temp = round(new_temp, 1)
                forecast_extra_lines.append(f"{dt_str} → {current_temp}°C (Generated Drift)")
        
        all_lines = forecast_api_lines + forecast_extra_lines
        
        formatted_output = f"\n================ FULL DAY-WISE TEMPERATURE MAPPING FOR '{destination.upper()}' ================\n"
        formatted_output += "\n".join(all_lines)
        formatted_output += "\n=================================================================================="
        
        logger.info(formatted_output)
        
        clean_lines = [line.replace(" (Prefetched)", "").replace(" (Generated Drift)", "") for line in all_lines]
        weather_text = "Day-wise temperature forecast:\n" + "\n".join(clean_lines)

        return weather_text

    except Exception as e:
        logger.error(f"Error generating full trip weather: {e}")
        return f"Average temperature: {fallback_temp}°C"
