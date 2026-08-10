import json
import os

import joblib
import pandas as pd

from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    classification_report,
)
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline

from preprocessing import build_preprocessor, get_model_features


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATASET_PATH = os.path.join(
    BASE_DIR,
    "training_dataset.csv"
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "model_output"
)

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "preference_model.joblib"
)

WEIGHTS_PATH = os.path.join(
    MODEL_DIR,
    "preference_weights.json"
)


MIN_COMPLETED_SESSIONS = 30


def main():
    print("\n========== PREFERENCE MODEL TRAINING ==========\n")

    # ---------------------------------------------------------
    # 1. Load dataset
    # ---------------------------------------------------------
    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(
            f"Training dataset not found: {DATASET_PATH}"
        )

    df = pd.read_csv(DATASET_PATH)

    print(f"Dataset rows              : {len(df)}")

    # ---------------------------------------------------------
    # 2. Validate required columns
    # ---------------------------------------------------------
    if "selected" not in df.columns:
        raise ValueError(
            "Dataset does not contain the 'selected' label column."
        )

    if "sessionId" not in df.columns:
        raise ValueError(
            "Dataset does not contain 'session_id'. "
            "Session-based splitting requires this column."
        )

    completed_sessions = df["sessionId"].nunique()

    print(f"Completed sessions        : {completed_sessions}")

    # ---------------------------------------------------------
    # 3. Data sufficiency threshold
    # ---------------------------------------------------------
    if completed_sessions < MIN_COMPLETED_SESSIONS:
        raise ValueError(
            f"Insufficient data. "
            f"Need at least {MIN_COMPLETED_SESSIONS} completed sessions, "
            f"but only {completed_sessions} are available."
        )

    positive_count = int(df["selected"].sum())
    negative_count = int(len(df) - positive_count)

    print(f"Positive rows             : {positive_count}")
    print(f"Negative rows             : {negative_count}")

    # ---------------------------------------------------------
    # 4. Identify usable features
    # ---------------------------------------------------------
    all_model_features = get_model_features()

    available_features = [
        feature
        for feature in all_model_features
        if feature in df.columns
    ]

    missing_features = [
        feature
        for feature in all_model_features
        if feature not in df.columns
    ]

    print("\nFeatures available:")

    for feature in available_features:
        print(f"- {feature}")

    if missing_features:
        print("\nFeatures not present in CSV and ignored:")

        for feature in missing_features:
            print(f"- {feature}")

    if not available_features:
        raise ValueError(
            "No usable model features were found in the dataset."
        )

    # ---------------------------------------------------------
    # 5. Create X, y, groups
    # ---------------------------------------------------------
    X = df[available_features]
    y = df["selected"].astype(int)
    groups = df["sessionId"]

    # ---------------------------------------------------------
    # 6. Session-based train/test split
    #
    # IMPORTANT:
    # We split complete recommendation sessions instead of
    # individual candidate rows.
    #
    # This prevents candidates from the same recommendation
    # session appearing in both training and testing datasets.
    # ---------------------------------------------------------
    splitter = GroupShuffleSplit(
        n_splits=1,
        test_size=0.25,
        random_state=42,
    )

    train_index, test_index = next(
        splitter.split(
            X,
            y,
            groups=groups
        )
    )

    X_train = X.iloc[train_index]
    X_test = X.iloc[test_index]

    y_train = y.iloc[train_index]
    y_test = y.iloc[test_index]

    train_groups = groups.iloc[train_index]
    test_groups = groups.iloc[test_index]

    train_sessions = train_groups.nunique()
    test_sessions = test_groups.nunique()

    print("\n========== TRAIN / TEST SPLIT ==========")

    print(f"Training sessions         : {train_sessions}")
    print(f"Testing sessions          : {test_sessions}")

    print(f"Training rows             : {len(X_train)}")
    print(f"Testing rows              : {len(X_test)}")

    print(
        f"Training positive rows    : "
        f"{int(y_train.sum())}"
    )

    print(
        f"Testing positive rows     : "
        f"{int(y_test.sum())}"
    )

    # ---------------------------------------------------------
    # 7. Build preprocessing pipeline
    # ---------------------------------------------------------
    preprocessor = build_preprocessor(
        available_features
    )

    # ---------------------------------------------------------
    # 8. Logistic Regression model
    #
    # class_weight='balanced' helps because our dataset is
    # imbalanced:
    #
    # selected = 1
    # not selected = 0
    # ---------------------------------------------------------
    model = LogisticRegression(
        class_weight="balanced",
        max_iter=2000,
        random_state=42,
    )

    pipeline = Pipeline(
        steps=[
            (
                "preprocessor",
                preprocessor
            ),
            (
                "classifier",
                model
            ),
        ]
    )

    # ---------------------------------------------------------
    # 9. Train model
    # ---------------------------------------------------------
    print("\nTraining Logistic Regression...")

    pipeline.fit(
        X_train,
        y_train
    )

    # ---------------------------------------------------------
    # 10. Generate predictions
    # ---------------------------------------------------------
    predictions = pipeline.predict(
        X_test
    )

    probabilities = pipeline.predict_proba(
        X_test
    )[:, 1]

    # ---------------------------------------------------------
    # 11. Evaluation metrics
    # ---------------------------------------------------------
    accuracy = accuracy_score(
        y_test,
        predictions
    )

    precision = precision_score(
        y_test,
        predictions,
        zero_division=0
    )

    recall = recall_score(
        y_test,
        predictions,
        zero_division=0
    )

    f1 = f1_score(
        y_test,
        predictions,
        zero_division=0
    )

    if len(set(y_test)) > 1:
        roc_auc = roc_auc_score(
            y_test,
            probabilities
        )
    else:
        roc_auc = None

    print("\n========== EVALUATION ==========")

    print(
        f"Accuracy                  : "
        f"{accuracy:.4f}"
    )

    print(
        f"Precision                 : "
        f"{precision:.4f}"
    )

    print(
        f"Recall                    : "
        f"{recall:.4f}"
    )

    print(
        f"F1 Score                  : "
        f"{f1:.4f}"
    )

    if roc_auc is not None:
        print(
            f"ROC-AUC                   : "
            f"{roc_auc:.4f}"
        )
    else:
        print(
            "ROC-AUC                   : N/A"
        )

    print("\nClassification report:\n")

    print(
        classification_report(
            y_test,
            predictions,
            zero_division=0
        )
    )

    # ---------------------------------------------------------
    # 12. Save model
    # ---------------------------------------------------------
    os.makedirs(
        MODEL_DIR,
        exist_ok=True
    )

    joblib.dump(
        pipeline,
        MODEL_PATH
    )

    # ---------------------------------------------------------
    # 13. Export learned Logistic Regression weights
    # ---------------------------------------------------------
    export_weights(
        pipeline=pipeline,
        accuracy=accuracy,
        precision=precision,
        recall=recall,
        f1=f1,
        roc_auc=roc_auc,
        completed_sessions=completed_sessions,
        training_sessions=train_sessions,
        testing_sessions=test_sessions,
        row_count=len(df),
        training_rows=len(X_train),
        testing_rows=len(X_test),
        positive_count=positive_count,
        negative_count=negative_count,
    )

    print("\n========== SAVED OUTPUT ==========")

    print(
        f"Model   : {MODEL_PATH}"
    )

    print(
        f"Weights : {WEIGHTS_PATH}"
    )


def export_weights(
    pipeline,
    accuracy,
    precision,
    recall,
    f1,
    roc_auc,
    completed_sessions,
    training_sessions,
    testing_sessions,
    row_count,
    training_rows,
    testing_rows,
    positive_count,
    negative_count,
):
    """
    Export Logistic Regression coefficients to JSON.

    These coefficients can later be reviewed or consumed
    by the Recommendation FastAPI.
    """

    preprocessor = pipeline.named_steps[
        "preprocessor"
    ]

    classifier = pipeline.named_steps[
        "classifier"
    ]

    # Get transformed feature names after preprocessing
    feature_names = (
        preprocessor.get_feature_names_out()
    )

    coefficients = classifier.coef_[0]

    weights = {}

    for feature_name, coefficient in zip(
        feature_names,
        coefficients
    ):
        weights[
            str(feature_name)
        ] = float(coefficient)

    output = {
        "modelType": "LogisticRegression",
        "modelVersion": "1.0",

        "labelDefinition": {
            "selectedStation": 1,
            "notSelectedStation": 0,
        },

        "trainingData": {
            "completedSessions": int(
                completed_sessions
            ),
            "trainingSessions": int(
                training_sessions
            ),
            "testingSessions": int(
                testing_sessions
            ),
            "candidateRows": int(
                row_count
            ),
            "trainingRows": int(
                training_rows
            ),
            "testingRows": int(
                testing_rows
            ),
            "positiveRows": int(
                positive_count
            ),
            "negativeRows": int(
                negative_count
            ),
        },

        "trainingConfiguration": {
            "splitMethod": "GroupShuffleSplit by sessionId",
            "testSize": 0.25,
            "randomState": 42,
            "classWeight": "balanced",
            "maxIterations": 2000,
        },

        "metrics": {
            "accuracy": float(
                accuracy
            ),
            "precision": float(
                precision
            ),
            "recall": float(
                recall
            ),
            "f1": float(
                f1
            ),
            "rocAuc": (
                float(roc_auc)
                if roc_auc is not None
                else None
            ),
        },

        "intercept": float(
            classifier.intercept_[0]
        ),

        "weights": weights,
    }

    with open(
        WEIGHTS_PATH,
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            output,
            file,
            indent=4
        )


if __name__ == "__main__":
    main()