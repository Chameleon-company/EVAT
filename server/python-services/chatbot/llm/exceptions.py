class LLMError(Exception):
    """Base exception raised by the EVAT LLM layer."""


class LLMConfigurationError(LLMError):
    """The selected provider is not configured correctly."""


class LLMConnectionError(LLMError):
    """The application could not connect to the LLM provider."""


class LLMTimeoutError(LLMError):
    """The LLM provider did not respond before the timeout."""


class LLMModelNotFoundError(LLMError):
    """The configured model is unavailable."""


class LLMInvalidResponseError(LLMError):
    """The provider returned an unexpected response."""