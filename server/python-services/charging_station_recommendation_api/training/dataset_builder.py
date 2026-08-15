import os
import re
from pathlib import Path

import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv


# ============================================================
# CONFIGURATION
# ============================================================

DATABASE_NAME = "EVAT"
COLLECTION_NAME = "recommendationsessions"

CURRENT_FILE = Path(__file__).resolve()
TRAINING_DIR = CURRENT_FILE.parent

# Project structure:
#
# EVAT/
# ├── .env
# └── server/
#     └── python-services/
#         └── charging_station_recommendation_api/
#             └── training/
#                 └── dataset_builder.py
#
# parents[0] = training
# parents[1] = charging_station_recommendation_api
# parents[2] = python-services
# parents[3] = server
# parents[4] = EVAT

PROJECT_ROOT = CURRENT_FILE.parents[4]
ENV_PATH = PROJECT_ROOT / ".env"

OUTPUT_PATH = TRAINING_DIR / "training_dataset.csv"


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv(ENV_PATH)

MONGO_URI = os.getenv("MONGODB_URI")

if not MONGO_URI:
    raise ValueError(
        f"MONGODB_URI was not found in: {ENV_PATH}"
    )


# ============================================================
# FEATURES USED TO DETECT INVALID SNAPSHOT SESSIONS
# ============================================================

CORE_NUMERIC_FIELDS = [
    "distanceKm",
    "durationMin",
    "durationInTrafficMin",
    "energyNeededKwh",
    "temperatureC",
]


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def safe_float(value):
    """
    Convert a value to float.

    Missing or invalid values remain None instead of being
    incorrectly converted to 0.
    """

    if value is None:
        return None

    try:
        return float(value)

    except (TypeError, ValueError):
        return None


def clean_text(value):
    """
    Standardise categorical text.

    Examples:
        " Light " -> "light"
        None      -> "unknown"
    """

    if value is None:
        return "unknown"

    text = str(value).strip().lower()

    missing_values = {
        "",
        "none",
        "null",
        "nan",
        "n/a",
        "na",
    }

    if text in missing_values:
        return "unknown"

    return text


def clean_pay_at_location(value):
    """
    Standardise payAtLocation into:
        yes
        no
        unknown
    """

    if value is None:
        return "unknown"

    if isinstance(value, bool):
        return "yes" if value else "no"

    text = str(value).strip().lower()

    yes_values = {
        "yes",
        "y",
        "true",
        "1",
    }

    no_values = {
        "no",
        "n",
        "false",
        "0",
    }

    if text in yes_values:
        return "yes"

    if text in no_values:
        return "no"

    return "unknown"


def clean_cost(value):
    """
    Convert cost into a numeric value where possible.

    Examples:
        "$0.30/kWh" -> 0.30
        "0.45"      -> 0.45
        0.50        -> 0.50
        None        -> None
    """

    if value is None:
        return None

    if isinstance(value, (int, float)):
        return float(value)

    text = str(value).strip()

    if text.lower() in {
        "",
        "none",
        "null",
        "nan",
        "unknown",
        "n/a",
        "na",
    }:
        return None

    match = re.search(
        r"-?\d+(?:\.\d+)?",
        text
    )

    if not match:
        return None

    try:
        return float(match.group())

    except ValueError:
        return None


def ids_match(first_id, second_id):
    """
    Compare MongoDB IDs safely.
    """

    if first_id is None or second_id is None:
        return False

    return str(first_id) == str(second_id)


def is_zero_or_missing(value):
    """
    Return True if a numeric value is missing or exactly zero.
    """

    numeric_value = safe_float(value)

    if numeric_value is None:
        return True

    return numeric_value == 0.0


def is_session_snapshot_invalid(candidates):
    """
    Detect sessions where every candidate contains zero/missing
    values for all important numeric snapshot fields.

    We reject the entire session only when ALL candidates are
    unusable.

    Legitimate individual zero values are preserved.

    For example:
        windSpeedMs = 0

    is valid and should not cause a session to be removed.
    """

    if not candidates:
        return True

    for candidate in candidates:

        all_core_values_zero_or_missing = all(
            is_zero_or_missing(
                candidate.get(field)
            )
            for field in CORE_NUMERIC_FIELDS
        )

        # At least one candidate has useful numeric information.
        if not all_core_values_zero_or_missing:
            return False

    # Every candidate was zero/missing for every core field.
    return True


# ============================================================
# BUILD DATASET
# ============================================================

def build_dataset():

    print("\n========== BUILDING TRAINING DATASET ==========\n")

    print(f"Project root       : {PROJECT_ROOT}")
    print(f"Environment file   : {ENV_PATH}")
    print(f"Database           : {DATABASE_NAME}")
    print(f"Collection         : {COLLECTION_NAME}")

    # --------------------------------------------------------
    # CONNECT TO MONGODB
    # --------------------------------------------------------

    client = MongoClient(
        MONGO_URI,
        serverSelectionTimeoutMS=10000
    )

    try:
        client.admin.command("ping")
        print("MongoDB connection : successful")

    except Exception as error:

        client.close()

        raise ConnectionError(
            "Could not connect to MongoDB. "
            "Check MONGODB_URI in the root .env file."
        ) from error

    db = client[DATABASE_NAME]

    collection = db[COLLECTION_NAME]

    # --------------------------------------------------------
    # LOAD RECOMMENDATION SESSIONS
    # --------------------------------------------------------

    sessions = list(
        collection.find({})
    )

    total_sessions = len(sessions)

    # --------------------------------------------------------
    # CLEANING COUNTERS
    # --------------------------------------------------------

    skipped_no_selection = 0
    skipped_no_candidates = 0
    skipped_invalid_snapshot = 0
    skipped_selection_not_found = 0

    dropped_missing_station_id = 0
    dropped_duplicate_candidates = 0

    rows = []

    # ========================================================
    # PROCESS EACH RECOMMENDATION SESSION
    # ========================================================

    for session in sessions:

        session_id = str(
            session.get("_id")
        )

        # ----------------------------------------------------
        # GET SELECTION
        # ----------------------------------------------------

        selection = session.get(
            "selection"
        ) or {}

        selected_station_id = selection.get(
            "stationId"
        )

        # A training label cannot be generated without
        # knowing which station was selected.
        if selected_station_id is None:

            skipped_no_selection += 1

            continue

        # ----------------------------------------------------
        # GET CANDIDATES
        # ----------------------------------------------------

        candidates = session.get(
            "candidates"
        ) or []

        if len(candidates) == 0:

            skipped_no_candidates += 1

            continue

        # ----------------------------------------------------
        # INVALID SNAPSHOT DETECTION
        # ----------------------------------------------------

        if is_session_snapshot_invalid(candidates):

            skipped_invalid_snapshot += 1

            print(
                f"Skipping invalid snapshot session: {session_id}"
            )

            continue

        # ----------------------------------------------------
        # PROCESS CANDIDATES
        # ----------------------------------------------------

        session_rows = []

        seen_station_ids = set()

        selected_candidate_found = False

        for candidate in candidates:

            station_id_raw = candidate.get(
                "stationId"
            )

            # ------------------------------------------------
            # MISSING STATION ID
            # ------------------------------------------------

            if station_id_raw is None:

                dropped_missing_station_id += 1

                continue

            station_id = str(
                station_id_raw
            )

            # ------------------------------------------------
            # DUPLICATE STATION
            # ------------------------------------------------

            if station_id in seen_station_ids:

                dropped_duplicate_candidates += 1

                continue

            seen_station_ids.add(
                station_id
            )

            # ------------------------------------------------
            # GENERATE LABEL
            # ------------------------------------------------

            selected = (
                1
                if ids_match(
                    station_id_raw,
                    selected_station_id
                )
                else 0
            )

            if selected == 1:
                selected_candidate_found = True

            # ------------------------------------------------
            # BUILD TRAINING ROW
            # ------------------------------------------------

            row = {

                # IDs
                "sessionId": session_id,
                "stationId": station_id,

                # Numerical features
                "distanceKm": safe_float(
                    candidate.get("distanceKm")
                ),

                "durationMin": safe_float(
                    candidate.get("durationMin")
                ),

                "durationInTrafficMin": safe_float(
                    candidate.get("durationInTrafficMin")
                ),

                "energyNominalKwh": safe_float(
                    candidate.get("energyNominalKwh")
                ),

                "energyNeededKwh": safe_float(
                    candidate.get("energyNeededKwh")
                ),

                "chargingPoints": safe_float(
                    candidate.get("chargingPoints")
                ),

                "temperatureC": safe_float(
                    candidate.get("temperatureC")
                ),

                "windSpeedMs": safe_float(
                    candidate.get("windSpeedMs")
                ),

                "windDirectionDeg": safe_float(
                    candidate.get("windDirectionDeg")
                ),

                "cost": clean_cost(
                    candidate.get("cost")
                ),

                # Categorical features
                "roadTrafficCondition": clean_text(
                    candidate.get(
                        "roadTrafficCondition"
                    )
                ),

                "congestionLevel": clean_text(
                    candidate.get(
                        "congestionLevel"
                    )
                ),

                "payAtLocation": clean_pay_at_location(
                    candidate.get(
                        "payAtLocation"
                    )
                ),

                "operator": clean_text(
                    candidate.get("operator")
                ),

                "connectionType": clean_text(
                    candidate.get(
                        "connectionType"
                    )
                ),

                "currentType": clean_text(
                    candidate.get(
                        "currentType"
                    )
                ),

                # Binary classification label
                "selected": selected,
            }

            session_rows.append(row)

        # ----------------------------------------------------
        # VERIFY SELECTED STATION EXISTS
        # ----------------------------------------------------

        if not selected_candidate_found:

            skipped_selection_not_found += 1

            continue

        # ----------------------------------------------------
        # VERIFY EXACTLY ONE POSITIVE PER SESSION
        # ----------------------------------------------------

        positive_count = sum(
            row["selected"]
            for row in session_rows
        )

        if positive_count != 1:

            skipped_selection_not_found += 1

            continue

        # Valid session.
        rows.extend(session_rows)

    # ========================================================
    # CREATE DATAFRAME
    # ========================================================

    df = pd.DataFrame(rows)

    if df.empty:

        client.close()

        raise ValueError(
            "No valid training records were generated."
        )

    # ========================================================
    # FINAL DUPLICATE CHECK
    # ========================================================

    rows_before_duplicate_check = len(df)

    df = df.drop_duplicates(
        subset=[
            "sessionId",
            "stationId"
        ],
        keep="first"
    )

    final_duplicates_removed = (
        rows_before_duplicate_check
        - len(df)
    )

    dropped_duplicate_candidates += (
        final_duplicates_removed
    )

    # ========================================================
    # ENSURE LABEL IS INTEGER
    # ========================================================

    df["selected"] = (
        df["selected"]
        .astype(int)
    )

    # ========================================================
    # FINAL SESSION LABEL VALIDATION
    # ========================================================

    positives_per_session = (
        df.groupby("sessionId")["selected"]
        .sum()
    )

    valid_session_ids = (
        positives_per_session[
            positives_per_session == 1
        ]
        .index
    )

    invalid_final_sessions = (
        positives_per_session[
            positives_per_session != 1
        ]
        .index
    )

    if len(invalid_final_sessions) > 0:

        print(
            "\nRemoving sessions that failed final "
            "label validation:"
        )

        for invalid_session_id in invalid_final_sessions:

            print(
                f"  - {invalid_session_id}"
            )

    df = df[
        df["sessionId"].isin(
            valid_session_ids
        )
    ].copy()

    # ========================================================
    # SORT OUTPUT
    # ========================================================

    df = df.sort_values(
        by=[
            "sessionId",
            "selected",
            "stationId"
        ],
        ascending=[
            True,
            False,
            True
        ]
    )

    df = df.reset_index(
        drop=True
    )

    # ========================================================
    # SAVE CSV
    # ========================================================

    df.to_csv(
        OUTPUT_PATH,
        index=False
    )

    # ========================================================
    # FINAL STATISTICS
    # ========================================================

    final_sessions = (
        df["sessionId"]
        .nunique()
    )

    positive_rows = int(
        df["selected"].sum()
    )

    negative_rows = int(
        (df["selected"] == 0).sum()
    )

    # ========================================================
    # REPORT
    # ========================================================

    print(
        "\n========== DATA CLEANING REPORT ==========\n"
    )

    print(
        f"Total MongoDB sessions             : "
        f"{total_sessions}"
    )

    print(
        f"Skipped (no selection)             : "
        f"{skipped_no_selection}"
    )

    print(
        f"Skipped (no candidates)            : "
        f"{skipped_no_candidates}"
    )

    print(
        f"Skipped (invalid all-zero session) : "
        f"{skipped_invalid_snapshot}"
    )

    print(
        f"Skipped (selection not found)      : "
        f"{skipped_selection_not_found}"
    )

    print(
        f"Dropped (missing stationId)        : "
        f"{dropped_missing_station_id}"
    )

    print(
        f"Dropped (duplicate candidates)     : "
        f"{dropped_duplicate_candidates}"
    )

    print("--------------------------------------------")

    print(
        f"Completed sessions                 : "
        f"{final_sessions}"
    )

    print(
        f"Final cleaned rows                 : "
        f"{len(df)}"
    )

    print(
        f"Positive rows (selected=1)         : "
        f"{positive_rows}"
    )

    print(
        f"Negative rows (selected=0)         : "
        f"{negative_rows}"
    )

    if positive_rows > 0:

        imbalance_ratio = (
            negative_rows
            / positive_rows
        )

        print(
            f"Class imbalance ratio              : "
            f"1 : {imbalance_ratio:.2f}"
        )

    print(
        f"\nSaved to: {OUTPUT_PATH}"
    )

    print(
        "\n========== DATASET BUILD COMPLETE ==========\n"
    )

    # --------------------------------------------------------
    # CLOSE MONGODB CONNECTION
    # --------------------------------------------------------

    client.close()


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":
    build_dataset()