import os
from dataclasses import dataclass
from functools import lru_cache

from dotenv import load_dotenv

from backend.llm.exceptions import LLMConfigurationError


load_dotenv()


@dataclass(frozen=True)
class LLMSettings:
    provider: str
    model: str
    timeout_seconds: float
    temperature: float

    ollama_base_url: str

    hosted_base_url: str
    hosted_api_key: str


@lru_cache(maxsize=1)
def get_llm_settings() -> LLMSettings:
    provider = os.getenv("LLM_PROVIDER", "ollama").strip().lower()
    model = os.getenv("LLM_MODEL", "qwen3:8b").strip()

    if not model:
        raise LLMConfigurationError("LLM_MODEL cannot be empty.")

    try:
        timeout_seconds = float(
            os.getenv("LLM_TIMEOUT_SECONDS", "120")
        )
        temperature = float(
            os.getenv("LLM_TEMPERATURE", "0.2")
        )
    except ValueError as exc:
        raise LLMConfigurationError(
            "LLM timeout and temperature must be numbers."
        ) from exc

    if timeout_seconds <= 0:
        raise LLMConfigurationError(
            "LLM_TIMEOUT_SECONDS must be greater than zero."
        )

    if not 0 <= temperature <= 2:
        raise LLMConfigurationError(
            "LLM_TEMPERATURE must be between 0 and 2."
        )

    return LLMSettings(
        provider=provider,
        model=model,
        timeout_seconds=timeout_seconds,
        temperature=temperature,
        ollama_base_url=os.getenv(
            "OLLAMA_BASE_URL",
            "http://127.0.0.1:11434",
        ).rstrip("/"),
        hosted_base_url=os.getenv(
            "HOSTED_LLM_BASE_URL",
            "",
        ).rstrip("/"),
        hosted_api_key=os.getenv(
            "HOSTED_LLM_API_KEY",
            "",
        ),
    )