from typing import Any, Dict, Optional, Sequence

import httpx

from backend.llm.exceptions import (
    LLMConnectionError,
    LLMInvalidResponseError,
    LLMModelNotFoundError,
    LLMTimeoutError,
)
from backend.llm.models import LLMMessage, LLMResponse, LLMToolCall
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
        tools: Optional[Sequence[Dict[str, Any]]] = None,
    ) -> LLMResponse:
        serialized_messages = []

        for message in messages:
            serialized_message: Dict[str, Any] = {
                "role": message.role,
                "content": message.content,
            }

            # Preserve assistant tool calls when sending the
            # conversation back to Ollama.
            if message.tool_calls:
                serialized_message["tool_calls"] = [
                    {
                        "type": "function",
                        "function": {
                            "name": tool_call.name,
                            "arguments": tool_call.arguments,
                        },
                    }
                    for tool_call in message.tool_calls
                ]

            # Tool result messages need the name of the tool
            # that produced the result.
            if message.role == "tool" and message.tool_name:
                serialized_message["tool_name"] = message.tool_name

            serialized_messages.append(serialized_message)

        payload: Dict[str, Any] = {
            "model": self._model,
            "stream": False,
            "messages": serialized_messages,
            "options": {
                "temperature": temperature,
            },
        }

        if tools:
            payload["tools"] = list(tools)

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
            content = message.get("content", "")
            raw_tool_calls = message.get("tool_calls", [])
        except (KeyError, TypeError, ValueError) as exc:
            raise LLMInvalidResponseError(
                "Ollama returned an unexpected response."
            ) from exc

        if not isinstance(content, str):
            raise LLMInvalidResponseError(
                "Ollama returned invalid message content."
            )

        tool_calls = []

        if raw_tool_calls:
            if not isinstance(raw_tool_calls, list):
                raise LLMInvalidResponseError(
                    "Ollama returned invalid tool calls."
                )

            for raw_call in raw_tool_calls:
                try:
                    function = raw_call["function"]
                    name = function["name"]
                    arguments = function.get("arguments", {})
                except (KeyError, TypeError) as exc:
                    raise LLMInvalidResponseError(
                        "Ollama returned an invalid tool call."
                    ) from exc

                if not isinstance(name, str) or not name.strip():
                    raise LLMInvalidResponseError(
                        "Ollama returned a tool call without a valid name."
                    )

                if not isinstance(arguments, dict):
                    raise LLMInvalidResponseError(
                        "Ollama returned invalid tool arguments."
                    )

                tool_calls.append(
                    LLMToolCall(
                        name=name.strip(),
                        arguments=arguments,
                        id=raw_call.get("id"),
                    )
                )

        # A tool call can legitimately have empty text content.
        if not content.strip() and not tool_calls:
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
            tool_calls=tool_calls,
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