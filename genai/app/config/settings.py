import os
from pathlib import Path
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Resolve base directory to locate the .env file containing API keys
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = BASE_DIR / ".env"

# Load environment variables from the .env file into the os.environ dictionary
load_dotenv(dotenv_path=ENV_PATH, override=True)


# Retrieve API keys from environment variables
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Ensure the Groq API key is present before starting the app.
if not GROQ_API_KEY:
    raise Exception("GROQ_API_KEY not loaded!")

GENAI_API_SECRET = os.getenv("GENAI_API_SECRET", "")

