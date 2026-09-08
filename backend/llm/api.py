from flask import Flask, request, jsonify
from flask_cors import CORS
import asyncio

from backend.llm.service import get_llm_service


app = Flask(__name__)
CORS(app)


@app.get("/health")
def health():
    return jsonify({
        "ok": True,
        "service": "EVAT Qwen3 LLM API"
    })


@app.post("/api/chat")
def chat():
    data = request.get_json(silent=True) or {}

    message = (data.get("message") or "").strip()
    metadata = data.get("metadata") or {}

    if not isinstance(metadata, dict):
        metadata = {}

    if not message:
        return jsonify({
            "ok": False,
            "error": "Message cannot be empty."
        }), 400

    try:
        service = get_llm_service()

        response = asyncio.run(
            service.chat_with_tools(
                message,
                metadata=metadata,
            )
        )

        return jsonify({
            "ok": True,
            "reply": response.content,
            "provider": response.provider,
            "model": response.model,
            "finish_reason": response.finish_reason
        })

    except ValueError as exc:
        return jsonify({
            "ok": False,
            "error": str(exc)
        }), 400

    except Exception:
        import traceback

        print("LLM API ERROR:")
        traceback.print_exc()

        return jsonify({
            "ok": False,
            "error": "The chatbot service could not complete the request."
        }), 500


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=8000,
        debug=True
    )