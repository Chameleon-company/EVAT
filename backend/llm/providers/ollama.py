from typing import Any, Dict, Sequence

import httpx

from backend.llm.exceptions import (
    LLMConnectionError,
    LLMInvalidResponseError,
    LLMModelNotFoundError,
    LLMTimeoutError,
)
from backend.llm.models import LLMMessage, LLMResponse
from backend.llm.providers.base import LLMProvider


class OllamaProvider(LLMProvider):
    def __init__(
        self,
        base_url: str,
        model: str,
        timeout_seconds: float = 120,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._model = model
        self._timeout = httpx.Timeout(timeout_seconds)

    @property
    def provider_name(self) -> str:
        return "ollama"

    @property
    def model_name(self) -> str:
        return self._model

    async def chat(
        self,
        messages: Sequence[LLMMessage],
        temperature: float = 0.2,
    ) -> LLMResponse:
        payload: Dict[str, Any] = {
            "model": self._model,
            "stream": False,
            "messages": [
                {
                    "role": message.role,
                    "content": message.content,
                }
                for message in messages
            ],
            "options": {
                "temperature": temperature,
            },
        }

        try:
            async with httpx.AsyncClient(
                timeout=self._timeout
            ) as client:
                response = await client.post(
                    f"{self._base_url}/api/chat",
                    json=payload,
                )

        except httpx.TimeoutException as exc:
            raise LLMTimeoutError(
                f"Ollama exceeded the configured timeout "
                f"while running '{self._model}'."
            ) from exc

        except httpx.ConnectError as exc:
            raise LLMConnectionError(
                "Could not connect to Ollama. Check that Ollama "
                "is installed and running."
            ) from exc

        except httpx.HTTPError as exc:
            raise LLMConnectionError(
                f"Ollama request failed: {exc}"
            ) from exc

        if response.status_code == 404:
            raise LLMModelNotFoundError(
                f"Ollama model '{self._model}' was not found. "
                f"Run: ollama pull {self._model}"
            )

        if response.status_code >= 400:
            raise LLMConnectionError(
                f"Ollama returned HTTP {response.status_code}: "
                f"{response.text}"
            )

        try:
            data = response.json()
            message = data["message"]
            content = message["content"]
        except (KeyError, TypeError, ValueError) as exc:
            raise LLMInvalidResponseError(
                "Ollama returned an unexpected response."
            ) from exc

        if not isinstance(content, str) or not content.strip():
            raise LLMInvalidResponseError(
                "Ollama returned an empty response."
            )

        return LLMResponse(
            content=content.strip(),
            provider=self.provider_name,
            model=data.get("model", self._model),
            finish_reason=data.get("done_reason"),
            prompt_tokens=data.get("prompt_eval_count"),
            completion_tokens=data.get("eval_count"),
        )

    async def health_check(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(
                    f"{self._base_url}/api/tags"
                )
                response.raise_for_status()

            data = response.json()
            models = data.get("models", [])

            installed_names = {
                model.get("name")
                for model in models
                if isinstance(model, dict)
            }

            return self._model in installed_names

        except (
            httpx.HTTPError,
            TypeError,
            ValueError,
        ):
            return False