import unittest

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


if __name__ == "__main__":
    unittest.main()