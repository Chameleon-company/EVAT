from backend.llm.config import LLMSettings, get_llm_settings
from backend.llm.exceptions import LLMConfigurationError
from backend.llm.providers.base import LLMProvider
from backend.llm.providers.hosted import FutureHostedProvider
from backend.llm.providers.ollama import OllamaProvider


def create_llm_provider(
    settings: LLMSettings = None,
) -> LLMProvider:
    current_settings = settings or get_llm_settings()

    if current_settings.provider == "ollama":
        return OllamaProvider(
            base_url=current_settings.ollama_base_url,
            model=current_settings.model,
            timeout_seconds=current_settings.timeout_seconds,
        )

    if current_settings.provider == "hosted":
        return FutureHostedProvider(
            base_url=current_settings.hosted_base_url,
            api_key=current_settings.hosted_api_key,
            model=current_settings.model,
            timeout_seconds=current_settings.timeout_seconds,
        )

    raise LLMConfigurationError(
        f"Unsupported LLM_PROVIDER: "
        f"'{current_settings.provider}'. "
        f"Supported values are 'ollama' and 'hosted'."
    )