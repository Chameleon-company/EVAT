from dataclasses import dataclass, field
from typing import Any, Dict, List, Literal, Optional


MessageRole = Literal["system", "user", "assistant", "tool"]


@dataclass(frozen=True)
class LLMToolCall:
    name: str
    arguments: Dict[str, Any]
    id: Optional[str] = None


@dataclass(frozen=True)
class LLMMessage:
    role: MessageRole
    content: str = ""
    tool_calls: List[LLMToolCall] = field(default_factory=list)
    tool_name: Optional[str] = None
    tool_call_id: Optional[str] = None


@dataclass(frozen=True)
class LLMResponse:
    content: str
    provider: str
    model: str
    finish_reason: Optional[str] = None
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    tool_calls: List[LLMToolCall] = field(default_factory=list)