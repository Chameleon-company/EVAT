import asyncio
import sys

from backend.llm.exceptions import LLMError
from backend.llm.service import get_llm_service


async def main() -> None:
    service = get_llm_service()

    print(
        "Provider:",
        service.provider.provider_name,
    )
    print(
        "Model:",
        service.provider.model_name,
    )

    print("Checking model availability...")

    if not await service.health_check():
        print(
            "The configured provider or model is unavailable.\n"
            "Check that Ollama is running and the model is installed."
        )
        sys.exit(1)

    print("Model is available.")
    print("Sending test request...\n")

    try:
        response = await service.chat(
            "What can EVAT help an electric vehicle driver with?"
        )
    except LLMError as exc:
        print(f"LLM test failed: {exc}")
        sys.exit(1)

    print("Response:")
    print(response.content)
    print()
    print("Provider:", response.provider)
    print("Model:", response.model)
    print("Finish reason:", response.finish_reason)
    print("Prompt tokens:", response.prompt_tokens)
    print("Completion tokens:", response.completion_tokens)


if __name__ == "__main__":
    asyncio.run(main())