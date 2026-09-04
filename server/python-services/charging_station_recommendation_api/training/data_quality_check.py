import os
import pandas as pd


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATASET_PATH = os.path.join(
    BASE_DIR,
    "training_dataset.csv"
)


NUMERIC_COLUMNS = [
    "distanceKm",
    "durationMin",
    "durationInTrafficMin",
    "energyNeededKwh",
    "chargingPoints",
    "cost",
    "temperatureC",
    "windSpeedMs",
]


CATEGORICAL_COLUMNS = [
    "roadTrafficCondition",
    "congestionLevel",
    "payAtLocation",
    "operator",
]


def main():
    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(
            f"Training dataset not found: {DATASET_PATH}"
        )

    df = pd.read_csv(DATASET_PATH)

    print("\n========== DATA QUALITY REPORT ==========\n")

    print(f"Total rows               : {len(df)}")

    if "sessionId" in df.columns:
        print(
            f"Unique sessions          : "
            f"{df['sessionId'].nunique()}"
        )

    # ---------------------------------------------------------
    # LABEL DISTRIBUTION
    # ---------------------------------------------------------
    print("\n---------- LABEL DISTRIBUTION ----------")

    if "selected" in df.columns:
        print(
            df["selected"]
            .value_counts(dropna=False)
        )
    else:
        print("selected column not found")

    # ---------------------------------------------------------
    # MISSING VALUES
    # ---------------------------------------------------------
    print("\n---------- MISSING VALUES ----------")

    missing_found = False

    for column in df.columns:
        missing_count = df[column].isna().sum()

        if missing_count > 0:
            missing_found = True

            percentage = (
                missing_count / len(df)
            ) * 100

            print(
                f"{column:25} "
                f"{missing_count:4} "
                f"({percentage:.2f}%)"
            )

    if not missing_found:
        print("No missing values found.")

    # ---------------------------------------------------------
    # ZERO VALUES
    # ---------------------------------------------------------
    print("\n---------- ZERO VALUES ----------")

    for column in NUMERIC_COLUMNS:

        if column not in df.columns:
            continue

        numeric_series = pd.to_numeric(
            df[column],
            errors="coerce"
        )

        zero_count = (
            numeric_series == 0
        ).sum()

        percentage = (
            zero_count / len(df)
        ) * 100

        print(
            f"{column:25} "
            f"{zero_count:4} "
            f"({percentage:.2f}%)"
        )

    # ---------------------------------------------------------
    # UNKNOWN VALUES
    # ---------------------------------------------------------
    print("\n---------- UNKNOWN VALUES ----------")

    for column in CATEGORICAL_COLUMNS:

        if column not in df.columns:
            continue

        values = (
            df[column]
            .astype(str)
            .str.strip()
            .str.lower()
        )

        unknown_count = (
            values == "unknown"
        ).sum()

        percentage = (
            unknown_count / len(df)
        ) * 100

        print(
            f"{column:25} "
            f"{unknown_count:4} "
            f"({percentage:.2f}%)"
        )

    # ---------------------------------------------------------
    # DUPLICATE CHECK
    # ---------------------------------------------------------
    print("\n---------- DUPLICATES ----------")

    if (
        "sessionId" in df.columns
        and "stationId" in df.columns
    ):
        duplicate_count = df.duplicated(
            subset=[
                "sessionId",
                "stationId"
            ]
        ).sum()

        print(
            "Duplicate session/station rows : "
            f"{duplicate_count}"
        )

    else:
        print(
            "sessionId or stationId column not found."
        )

    # ---------------------------------------------------------
    # LABEL VALIDATION
    # ---------------------------------------------------------
    print("\n---------- LABEL VALIDATION ----------")

    if (
        "sessionId" in df.columns
        and "selected" in df.columns
    ):

        positives_per_session = (
            df.groupby("sessionId")["selected"]
            .sum()
        )

        valid_sessions = (
            positives_per_session == 1
        ).sum()

        invalid_sessions = positives_per_session[
            positives_per_session != 1
        ]

        print(
            "Sessions with exactly one positive : "
            f"{valid_sessions}"
        )

        print(
            "Invalid sessions                   : "
            f"{len(invalid_sessions)}"
        )

        if len(invalid_sessions) > 0:
            print("\nInvalid session details:")

            print(
                invalid_sessions.to_string()
            )

    else:
        print(
            "sessionId or selected column not found."
        )

    # ---------------------------------------------------------
    # SUSPICIOUS ZERO ROWS
    # ---------------------------------------------------------
    print("\n---------- SUSPICIOUS ZERO ROWS ----------")

    key_numeric_columns = [
        "distanceKm",
        "durationMin",
        "durationInTrafficMin",
        "energyNeededKwh",
        "temperatureC",
    ]

    existing_key_columns = [
        column
        for column in key_numeric_columns
        if column in df.columns
    ]

    if existing_key_columns:

        numeric_check_df = df[
            existing_key_columns
        ].apply(
            pd.to_numeric,
            errors="coerce"
        )

        zero_mask = (
            numeric_check_df
            .eq(0)
            .all(axis=1)
        )

        suspicious_rows = df[
            zero_mask
        ]

        print(
            "Rows where all key numeric fields "
            f"are zero: {len(suspicious_rows)}"
        )

        if len(suspicious_rows) > 0:

            print("\nAffected sessions / stations:")

            display_columns = [
                column
                for column in [
                    "sessionId",
                    "stationId",
                    "distanceKm",
                    "durationMin",
                    "durationInTrafficMin",
                    "energyNeededKwh",
                    "temperatureC",
                    "selected",
                ]
                if column in suspicious_rows.columns
            ]

            print(
                suspicious_rows[
                    display_columns
                ].to_string(
                    index=False
                )
            )

            print(
                "\nSuspicious rows grouped by session:"
            )

            if "sessionId" in suspicious_rows.columns:

                grouped = (
                    suspicious_rows
                    .groupby("sessionId")
                    .size()
                    .sort_values(
                        ascending=False
                    )
                )

                print(
                    grouped.to_string()
                )

        else:
            print(
                "No rows found where all key "
                "numeric fields are zero."
            )

    else:
        print(
            "Required numeric columns were not found."
        )

    # ---------------------------------------------------------
    # SESSION SIZE CHECK
    # ---------------------------------------------------------
    print("\n---------- SESSION SIZE CHECK ----------")

    if "sessionId" in df.columns:

        session_sizes = (
            df.groupby("sessionId")
            .size()
        )

        print(
            f"Minimum candidates in session : "
            f"{session_sizes.min()}"
        )

        print(
            f"Maximum candidates in session : "
            f"{session_sizes.max()}"
        )

        print(
            f"Average candidates per session : "
            f"{session_sizes.mean():.2f}"
        )

        unusual_sessions = session_sizes[
            session_sizes < 5
        ]

        if len(unusual_sessions) > 0:

            print(
                "\nSessions with fewer than "
                "5 candidates:"
            )

            print(
                unusual_sessions.to_string()
            )

    # ---------------------------------------------------------
    # FEATURE SUMMARY
    # ---------------------------------------------------------
    print("\n---------- FEATURE SUMMARY ----------")

    for column in NUMERIC_COLUMNS:

        if column not in df.columns:
            continue

        numeric_series = pd.to_numeric(
            df[column],
            errors="coerce"
        )

        valid_values = (
            numeric_series
            .dropna()
        )

        if len(valid_values) == 0:
            continue

        print(
            f"\n{column}"
        )

        print(
            f"  min    : {valid_values.min():.4f}"
        )

        print(
            f"  median : {valid_values.median():.4f}"
        )

        print(
            f"  mean   : {valid_values.mean():.4f}"
        )

        print(
            f"  max    : {valid_values.max():.4f}"
        )

    print(
        "\n========== CHECK COMPLETE ==========\n"
    )


if __name__ == "__main__":
    main()