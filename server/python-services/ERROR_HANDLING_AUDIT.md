# EVAT Python/ML Error Handling Audit

## Purpose

This document records the review, implementation, and validation of standardised error handling across the EVAT Python and machine-learning services.

The goal is to ensure API failures return predictable JSON responses containing:

- an error code
- a clear and safe message
- an appropriate HTTP status

The implementation also aims to prevent unexpected internal exception details from being exposed to API clients.

---

## Initial Findings

Before implementing the shared error-handling approach, the Python/ML services used different methods for reporting failures.

| Service | Initial handling | Main issue |
|---|---|---|
| Price Prediction | HTTPException, generic exceptions | Plain `detail` responses and inconsistent runtime handling |
| Personalised EV Insights | HTTPException and exception re-wrapping | Inconsistent status handling and exception conversion |
| Reliability Scoring | HTTPException | Raw exception messages could be returned to clients |
| Cost Comparison | HTTPException with generic exception handling | Internal exception text could be exposed through 500 responses |
| Demand Forecasting | ValueError and HTTPException | Different error mechanisms used within the same service |
| Weather-Aware Routing | HTTPException | Service-specific response format |
| Charging Station Recommendation | Limited explicit API error handling | No common structured error contract |
| Environmental Impact Analysis | Primarily prediction-level exceptions | No common API error contract |

## Main Problems Identified

1. Error responses were not structured consistently across Python services.
2. Some services returned FastAPI's default `detail` format while others raised normal Python exceptions.
3. Raw internal exception messages could be exposed to API clients.
4. Similar failures could return different HTTP status codes between services.
5. There was no shared list of machine-learning service error codes.
6. There was no shared exception-handling layer for the consolidated FastAPI application.

---

## Standard Error Response

Handled API errors now follow the common structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable safe message"
  }
}
```

This provides a predictable response structure for frontend clients and other consumers of the Python APIs.

## Standard Error Types

The shared error framework defines the following error categories:

| Error code | HTTP status | Purpose |
|---|---:|---|
| `INVALID_INPUT` | 400 | Request contains invalid application-level input |
| `VALIDATION_ERROR` | 422 | Request fails FastAPI/Pydantic validation |
| `NOT_FOUND` | 404 | Requested resource cannot be found |
| `MODEL_UNAVAILABLE` | 503 | Required machine-learning model is unavailable |
| `SERVICE_UNAVAILABLE` | 503 | Required EVAT service or data is unavailable |
| `EXTERNAL_SERVICE_ERROR` | 502 | Failure involving an external dependency |
| `PREDICTION_ERROR` | 500 | Prediction operation fails |
| `INTERNAL_ERROR` | 500 | Unexpected internal application failure |

---

## Shared Error-Handling Framework

Reusable error handling was introduced under:

```text
server/python-services/common/
```

The implementation contains:

- `errors.py` - shared typed service exceptions
- `error_handlers.py` - shared FastAPI exception handlers

The consolidated FastAPI application registers the shared handlers using:

```python
register_error_handlers(app)
```

This allows the application to convert expected service errors, request-validation failures, existing HTTP exceptions, and unexpected runtime exceptions into the common JSON structure.

Unexpected internal exceptions are logged for developers while the client receives a safe generic message.

For example, an unexpected failure returns:

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred."
  }
}
```

Internal exception details are not included in this response.

---

## Service Changes

### Price Prediction

Price Prediction model and schema availability failures were migrated to the shared `ModelUnavailableError`.

Examples include:

- model not loaded
- prediction schema not loaded

These failures now use:

- HTTP 503
- `MODEL_UNAVAILABLE`

Existing defensive conversion helpers and model-loading logging were retained because they serve internal processing purposes rather than exposing raw API errors.

### Cost Comparison

Generic API-level exception handling previously exposed internal exception text through HTTP 500 responses.

These API operations were migrated to `PredictionError` with safe client-facing messages.

Internal failures are therefore separated from the public API response.

### Personalised EV Insights

Invalid payload handling was migrated to `InvalidInputError`.

The previous duplicate HTTP exception handling was removed.

Unexpected model/runtime failures are no longer converted into raw HTTP error messages at the service level. They are allowed to reach the shared application error handler.

### Reliability Scoring

Reliability Scoring was migrated from service-specific HTTP exceptions to shared typed errors.

The implementation now distinguishes between:

- unavailable reliability data -> `SERVICE_UNAVAILABLE`
- missing station -> `NOT_FOUND`
- invalid request values -> `INVALID_INPUT`

Raw filesystem exception details are no longer returned as API error messages.

### Demand Forecasting

Demand Forecasting retains internal `ValueError` validation where it is useful inside prediction logic.

At the API boundary these failures are classified into the shared error types:

- unknown postcode/resource -> `NOT_FOUND`
- invalid prediction request -> `INVALID_INPUT`

Unexpected prediction failures are no longer swallowed and converted into error strings. They can reach the central error handler instead.

### Weather-Aware Routing

The route-not-found response was migrated from a service-specific HTTP exception to `ResourceNotFoundError`.

This produces:

- HTTP 404
- `NOT_FOUND`

The existing weather and charging-station fallback behaviour was intentionally retained.

A temporary weather API failure falls back to neutral weather values, while a charging-station lookup failure returns an empty station list. These behaviours allow the main trip prediction to continue instead of failing the complete request.

The Google Maps client was also changed from import-time initialization to lazy initialization. The API key is still required when Google Maps functionality is used, but importing the Python module no longer requires the external client to be created immediately.

### Charging Station Recommendation

Existing recommendation tests remain part of the broader standardised ML testing framework.

Training scripts were not changed as part of API error standardisation because they are offline model-development utilities rather than client-facing API error handlers.

### Environmental Impact Analysis

Existing prediction validation remains covered by the standardised ML testing framework.

No unnecessary service-level changes were introduced where the shared application error-handling layer already provides the required protection for unexpected API failures.

---

## Validation Approach

The error-handling implementation was validated with automated tests covering both expected errors and deliberately introduced runtime failures.

The validation includes:

- invalid request handling
- missing model/schema handling
- resource-not-found handling
- service/data availability failures
- prediction failures
- unexpected runtime failures
- standard JSON response structure
- prevention of internal error-detail exposure

### Fault Injection

Some tests deliberately introduce failures rather than only checking successful execution.

Examples include:

- forcing internal runtime exceptions
- forcing model prediction failures
- simulating unavailable reliability data
- injecting sensitive-looking internal error information
- forcing unexpected Demand Forecasting model failures

The tests verify that internal implementation details are not exposed through public API responses and that unexpected failures are not incorrectly swallowed by individual services.

This provides additional validation that the tests can detect failure behaviour rather than only confirming successful paths.

---

## Current Automated Test Result

The focused error-handling and Price Prediction validation suite contains:

```text
37 tests
37 passed
33 warnings
```

The warnings are primarily existing dependency and deprecation warnings involving:

- scikit-learn model version differences
- joblib/NumPy deprecations
- XGBoost model serialization
- `datetime.utcnow()` deprecation

That distinction is stronger evidence because it shows **26 focused tests** and **37 tests when integrated with the existing framework**.

---

## Current Outcome

The implementation establishes a reusable error-handling foundation for the EVAT Python/ML APIs.

The main improvements are:

1. A common JSON error-response structure.
2. Shared error codes and HTTP status mappings.
3. Reusable typed service exceptions.
4. Central FastAPI exception handlers.
5. Safer handling of unexpected internal failures.
6. Reduced exposure of internal exception information.
7. Service-level migration where inconsistent handling was identified.
8. Automated tests including deliberate fault injection.
9. Preservation of appropriate graceful fallback behaviour where a complete API failure is unnecessary.

The next step is to include the new error-handling tests in the existing pull-request CI workflow so the standard is automatically checked when future changes are submitted.