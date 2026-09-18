import unittest
import os

import joblib
import pandas as pd

from training.user_context import build_user_context

from training.dataset_builder import (
    is_session_snapshot_invalid,
    clean_text,
    clean_pay_at_location,
    clean_cost,
)


class TestTrainingPipeline(unittest.TestCase):

    def test_invalid_all_zero_session_is_detected(self):
        candidates = [
            {
                "distanceKm": 0,
                "durationMin": 0,
                "durationInTrafficMin": 0,
                "energyNeededKwh": 0,
                "temperatureC": 0,
            },
            {
                "distanceKm": 0,
                "durationMin": 0,
                "durationInTrafficMin": 0,
                "energyNeededKwh": 0,
                "temperatureC": 0,
            },
        ]

        self.assertTrue(
            is_session_snapshot_invalid(candidates)
        )

    def test_valid_session_is_not_rejected(self):
        candidates = [
            {
                "distanceKm": 5.2,
                "durationMin": 10,
                "durationInTrafficMin": 12,
                "energyNeededKwh": 0.8,
                "temperatureC": 16.5,
            },
            {
                "distanceKm": 7.1,
                "durationMin": 14,
                "durationInTrafficMin": 15,
                "energyNeededKwh": 1.1,
                "temperatureC": 16.5,
            },
        ]

        self.assertFalse(
            is_session_snapshot_invalid(candidates)
        )

    def test_clean_text(self):
        self.assertEqual(
            clean_text(" Low "),
            "low"
        )

        self.assertEqual(
            clean_text(None),
            "unknown"
        )

    def test_clean_pay_at_location(self):
        self.assertEqual(
            clean_pay_at_location(True),
            "yes"
        )

        self.assertEqual(
            clean_pay_at_location("NO"),
            "no"
        )

        self.assertEqual(
            clean_pay_at_location(None),
            "unknown"
        )

    def test_clean_cost(self):
        self.assertEqual(
            clean_cost("$0.30/kWh"),
            0.30
        )

        self.assertEqual(
            clean_cost(0.45),
            0.45
        )

        self.assertIsNone(
            clean_cost(None)
        )

    def test_user_without_history(self):
        current_session = {
            "_id": "session-1",
            "userId": "user-1",
            "createdAt": 100,
            "selection": {
                "stationId": "station-a"
            },
        }

        context = build_user_context(
            user_id="user-1",
            current_session=current_session,
            all_sessions=[current_session],
        )

        self.assertEqual(
            context["userPreviousSessions"],
            0,
        )

    def test_user_context_does_not_use_future_sessions(self):
        current_session = {
            "_id": "session-2",
            "userId": "user-1",
            "createdAt": 200,
            "selection": {
                "stationId": "station-b"
            },
        }

        previous_session = {
            "_id": "session-1",
            "userId": "user-1",
            "createdAt": 100,
            "selection": {
                "stationId": "station-a"
            },
        }

        future_session = {
            "_id": "session-3",
            "userId": "user-1",
            "createdAt": 300,
            "selection": {
                "stationId": "station-c"
            },
        }

        context = build_user_context(
            user_id="user-1",
            current_session=current_session,
            all_sessions=[
                previous_session,
                current_session,
                future_session,
            ],
        )

        self.assertEqual(
            context["userPreviousSessions"],
            1,
        )

    def test_user_context_ignores_other_users(self):
        current_session = {
            "_id": "session-2",
            "userId": "user-1",
            "createdAt": 200,
            "selection": {
                "stationId": "station-b"
            },
        }

        other_user_session = {
            "_id": "session-1",
            "userId": "user-2",
            "createdAt": 100,
            "selection": {
                "stationId": "station-a"
            },
        }

        context = build_user_context(
            user_id="user-1",
            current_session=current_session,
            all_sessions=[
                other_user_session,
                current_session,
            ],
        )

        self.assertEqual(
            context["userPreviousSessions"],
            0,
        )

    def test_saved_model_can_be_reloaded_and_predict(self):
        base_dir = os.path.dirname(os.path.abspath(__file__))

        model_path = os.path.join(
            base_dir,
            "model_output",
            "preference_model.joblib",
        )

        dataset_path = os.path.join(
            base_dir,
            "training_dataset.csv",
        )

        model = joblib.load(model_path)
        df = pd.read_csv(dataset_path)

        X = df.drop(
            columns=[
                "sessionId",
                "stationId",
                "selected",
            ]
        ).head(1)

        probabilities = model.predict_proba(X)

        self.assertEqual(
            probabilities.shape,
            (1, 2),
        )

if __name__ == "__main__":
    unittest.main()
