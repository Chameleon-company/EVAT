from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, Sequence

from backend.llm.models import LLMMessage, LLMResponse


class LLMProvider(ABC):
    """Common interface implemented by every EVAT LLM provider."""

    @abstractmethod
    async def chat(
        self,
        messages: Sequence[LLMMessage],
        temperature: float = 0.2,
        tools: Optional[Sequence[Dict[str, Any]]] = None,
    ) -> LLMResponse:
        """Generate an assistant response, optionally using backend tools."""

    @abstractmethod
    async def health_check(self) -> bool:
        """Check whether the provider and configured model are available."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return the provider's stable name."""

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Return the configured model name."""