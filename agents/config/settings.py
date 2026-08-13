"""Load environment variables and expose typed settings."""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from repo root (one level above agents/)
_env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(_env_path)


class _Settings:
    GOOGLE_API_KEY: str = os.environ.get("GOOGLE_API_KEY", "")
    GOOGLE_CLOUD_PROJECT: str = os.environ.get("GOOGLE_CLOUD_PROJECT", "researchbrain-497600")
    GOOGLE_CLOUD_REGION: str = os.environ.get("GOOGLE_CLOUD_REGION", "us-central1")
    GEMINI_MODEL: str = "gemini-2.5-flash"
    DIAGNOSIS_TIMEOUT_SECONDS: int = 30
    DIAGNOSIS_MAX_RETRIES: int = 3

    @property
    def auth_mode(self) -> str:
        return "api_key" if self.GOOGLE_API_KEY else "vertex_ai_adc"

    def get_gemini_client(self):
        from google import genai
        from google.genai.types import HttpOptions
        opts = HttpOptions(timeout=25_000)
        if self.GOOGLE_API_KEY:
            return genai.Client(api_key=self.GOOGLE_API_KEY, http_options=opts)
        # No API key — use Application Default Credentials via Vertex AI
        return genai.Client(
            vertexai=True,
            project=self.GOOGLE_CLOUD_PROJECT,
            location=self.GOOGLE_CLOUD_REGION,
            http_options=opts,
        )


settings = _Settings()
