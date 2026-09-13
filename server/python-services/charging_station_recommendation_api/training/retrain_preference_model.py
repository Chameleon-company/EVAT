"""Rebuild the preference dataset from MongoDB and retrain its model."""

from dataset_builder import build_dataset
from train_preference_model import main as train_model


def main() -> None:
    """Build the latest dataset before training a compatible model artifact."""
    print("\n========== RETRAINING PREFERENCE MODEL ==========\n")
    build_dataset()
    train_model()


if __name__ == "__main__":
    main()
