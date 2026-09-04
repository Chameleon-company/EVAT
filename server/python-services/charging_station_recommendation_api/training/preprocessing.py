from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import (
    OneHotEncoder,
    StandardScaler,
)
from sklearn.impute import SimpleImputer


# ---------------------------------------------------------
# Features used by Preference Model v1
# ---------------------------------------------------------
#
# cost:
# Excluded because approximately 69% of the current
# recommendation-history records have no cost value.
#
# congestionLevel:
# Excluded because 100% of the current cleaned records
# contain "unknown", so it provides no predictive signal.
#
# windSpeedMs:
# Zero is retained because zero wind speed is physically
# possible and should not automatically be treated as missing.
# ---------------------------------------------------------


NUMERIC_FEATURES = [
    "distanceKm",
    "durationMin",
    "durationInTrafficMin",
    "energyNeededKwh",
    "chargingPoints",
    "temperatureC",
    "windSpeedMs",
]


CATEGORICAL_FEATURES = [
    "roadTrafficCondition",
    "payAtLocation",
    "operator",
]


def get_model_features():
    return NUMERIC_FEATURES + CATEGORICAL_FEATURES


def build_preprocessor(available_columns=None):

    if available_columns is None:
        available_columns = get_model_features()

    numeric_features = [
        feature
        for feature in NUMERIC_FEATURES
        if feature in available_columns
    ]

    categorical_features = [
        feature
        for feature in CATEGORICAL_FEATURES
        if feature in available_columns
    ]

    numeric_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(
                    strategy="median"
                )
            ),
            (
                "scaler",
                StandardScaler()
            ),
        ]
    )

    categorical_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(
                    strategy="most_frequent"
                )
            ),
            (
                "encoder",
                OneHotEncoder(
                    handle_unknown="ignore"
                )
            ),
        ]
    )

    transformers = []

    if numeric_features:
        transformers.append(
            (
                "numeric",
                numeric_pipeline,
                numeric_features
            )
        )

    if categorical_features:
        transformers.append(
            (
                "categorical",
                categorical_pipeline,
                categorical_features
            )
        )

    if not transformers:
        raise ValueError(
            "No valid features were provided "
            "to the preprocessor."
        )

    return ColumnTransformer(
        transformers=transformers,
        remainder="drop"
    )