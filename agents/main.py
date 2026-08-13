"""Entry point for GoviHitha ADK agents."""
from agents.config.settings import settings


def main():
    print(f"GoviHitha agents loaded. Project: {settings.GOOGLE_CLOUD_PROJECT}")
    print("Run with: uvicorn agents.server:app --reload --port 8000")
    print("(Not `adk web .` -- these agents are plain Python classes calling")
    print(" google.genai directly, not google.adk.agents.Agent subclasses, so")
    print(" ADK's directory-scanning CLI can't discover a working root_agent here.)")


if __name__ == "__main__":
    main()
