from typing import Any, Dict, Sequence

import httpx

from backend.llm.exceptions import (
    LLMConfigurationError,
    LLMConnectionError,
    LLMInvalidResponseError,
    LLMModelNotFoundError,
    LLMTimeoutError,
)
from backend.llm.models import LLMMessage, LLMResponse
from backend.llm.providers.base import LLMProvider


class FutureHostedProvider(LLMProvider):
    """
    Provider for hosted services exposing an OpenAI-compatible
    POST /v1/chat/completions endpoint.
    """

    def __init__(
        self,
        base_url: str,
        api_key: str,
        model: str,
        timeout_seconds: float = 120,
    ) -> None:
        if not base_url:
            raise LLMConfigurationError(
                "HOSTED_LLM_BASE_URL is required."
            )

        if not api_key:
            raise LLMConfigurationError(
                "HOSTED_LLM_API_KEY is required."
            )

        self._base_url = base_url.rstrip("/")
        self._api_key = api_key
        self._model = model
        self._timeout = httpx.Timeout(timeout_seconds)

    @property
    def provider_name(self) -> str:
        return "hosted"

    @property
    def model_name(self) -> str:
        return self._model

    async def chat(
        self,
        messages: Sequence[LLMMessage],
        temperature: float = 0.2,
    ) -> LLMResponse:
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

        payload: Dict[str, Any] = {
            "model": self._model,
            "messages": [
                {
                    "role": message.role,
                    "content": message.content,
                }
                for message in messages
            ],
            "temperature": temperature,
        }

        try:
            async with httpx.AsyncClient(
                timeout=self._timeout
            ) as client:
                response = await client.post(
                    f"{self._base_url}/v1/chat/completions",
                    headers=headers,
                    json=payload,
                )

        except httpx.TimeoutException as exc:
            raise LLMTimeoutError(
                "The hosted LLM provider exceeded the timeout."
            ) from exc

        except httpx.ConnectError as exc:
            raise LLMConnectionError(
                "Could not connect to the hosted LLM provider."
            ) from exc

        except httpx.HTTPError as exc:
            raise LLMConnectionError(
                f"Hosted LLM request failed: {exc}"
            ) from exc

        if response.status_code == 404:
            raise LLMModelNotFoundError(
                f"Hosted model '{self._model}' was not found."
            )

        if response.status_code in (401, 403):
            raise LLMConfigurationError(
                "The hosted provider rejected the API key."
            )

        if response.status_code >= 400:
            raise LLMConnectionError(
                f"Hosted provider returned HTTP "
                f"{response.status_code}: {response.text}"
            )

        try:
            data = response.json()
            choice = data["choices"][0]
            content = choice["message"]["content"]
        except (
            KeyError,
            IndexError,
            TypeError,
            ValueError,
        ) as exc:
            raise LLMInvalidResponseError(
                "The hosted provider returned an unexpected response."
            ) from exc

        if not isinstance(content, str) or not content.strip():
            raise LLMInvalidResponseError(
                "The hosted provider returned an empty response."
            )

        usage = data.get("usage", {})

        return LLMResponse(
            content=content.strip(),
            provider=self.provider_name,
            model=data.get("model", self._model),
            finish_reason=choice.get("finish_reason"),
            prompt_tokens=usage.get("prompt_tokens"),
            completion_tokens=usage.get("completion_tokens"),
        )

    async def health_check(self) -> bool:
        # Providers differ in whether they expose a health or models endpoint.
        # Valid configuration is sufficient for this initial implementation.
        return bool(
            self._base_url
            and self._api_key
            and self._model
        )