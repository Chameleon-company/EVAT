class EVATServiceError(Exception):
    """Base exception for expected EVAT service failures."""

    def __init__(
        self,
        code: str,
        message: str,
        status_code: int,
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class InvalidInputError(EVATServiceError):
    def __init__(self, message: str = "The request contains invalid input."):
        super().__init__(
            code="INVALID_INPUT",
            message=message,
            status_code=400,
        )


class ResourceNotFoundError(EVATServiceError):
    def __init__(self, message: str = "The requested resource was not found."):
        super().__init__(
            code="NOT_FOUND",
            message=message,
            status_code=404,
        )


class ModelUnavailableError(EVATServiceError):
    def __init__(self, message: str = "The required model is currently unavailable."):
        super().__init__(
            code="MODEL_UNAVAILABLE",
            message=message,
            status_code=503,
        )


class ExternalServiceError(EVATServiceError):
    def __init__(self, message: str = "An external service is currently unavailable."):
        super().__init__(
            code="EXTERNAL_SERVICE_ERROR",
            message=message,
            status_code=502,
        )


class PredictionError(EVATServiceError):
    def __init__(self, message: str = "The prediction could not be generated."):
        super().__init__(
            code="PREDICTION_ERROR",
            message=message,
            status_code=500,
        )

class ServiceUnavailableError(EVATServiceError):
    def __init__(
        self,
        message: str = "The requested service is currently unavailable.",
    ):
        super().__init__(
            "SERVICE_UNAVAILABLE",
            message,
            503,
        )