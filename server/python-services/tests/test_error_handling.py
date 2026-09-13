from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from pydantic import BaseModel

from common.error_handlers import register_error_handlers
from common.errors import ModelUnavailableError


app = FastAPI()
register_error_handlers(app)


class ValidationRequest(BaseModel):
    value: int


@app.post("/test/validation")
def validation_endpoint(request: ValidationRequest):
    return {"value": request.value}

@app.get("/test/internal-error")
def internal_error_endpoint():
    raise RuntimeError("SECRET_INTERNAL_DATABASE_FAILURE")

@app.get("/test/model-unavailable")
def model_unavailable_endpoint():
    raise ModelUnavailableError("Test model is unavailable.")

@app.get("/test/not-found")
def not_found_endpoint():
    raise HTTPException(
        status_code=404,
        detail="Test resource was not found.",
    )

client = TestClient(app, raise_server_exceptions=False)

def test_validation_error_uses_standard_format():
    response = client.post(
        "/test/validation",
        json={},
    )

    assert response.status_code == 422

    assert response.json() == {
        "error": {
            "code": "VALIDATION_ERROR",
            "message": "The request contains invalid or missing fields.",
        }
    }


def test_model_unavailable_uses_standard_format():
    response = client.get("/test/model-unavailable")

    assert response.status_code == 503

    assert response.json() == {
        "error": {
            "code": "MODEL_UNAVAILABLE",
            "message": "Test model is unavailable.",
        }
    }

def test_internal_error_does_not_expose_exception_details():
    response = client.get("/test/internal-error")

    assert response.status_code == 500

    assert response.json() == {
        "error": {
            "code": "INTERNAL_ERROR",
            "message": "An unexpected error occurred.",
        }
    }

    assert "SECRET_INTERNAL_DATABASE_FAILURE" not in response.text

def test_existing_http_exception_uses_standard_format():
    response = client.get("/test/not-found")

    assert response.status_code == 404

    assert response.json() == {
        "error": {
            "code": "NOT_FOUND",
            "message": "Test resource was not found.",
        }
    }