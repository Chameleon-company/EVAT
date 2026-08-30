# Personalised Preference Model Training Pipeline

## Overview

This folder contains the training pipeline for the EVAT personalised charging-station preference model.

The pipeline uses historical recommendation sessions stored in MongoDB and trains a Logistic Regression model to learn which candidate station characteristics are associated with user selections.

The current task treats the recommendation problem as binary classification:

- Selected station = `1`
- Non-selected station = `0`

No external dataset is required.

---

## Data Source

The training data is extracted from MongoDB.

Database:

`EVAT`

Collection:

`recommendationsessions`

Each recommendation session contains:

- a recommendation session ID
- candidate charging stations
- candidate feature snapshots
- a selected station

Each candidate becomes one model-training row.

For a completed recommendation session:

- the selected station receives label `1`
- every other candidate receives label `0`

---

## Training Pipeline

The current workflow is:

1. Extract recommendation sessions from MongoDB
2. Skip sessions without a selected station
3. Validate candidate station IDs
4. Remove duplicate candidate stations
5. Detect invalid recommendation snapshots
6. Generate selected / non-selected labels
7. Clean numerical and categorical values
8. Save the cleaned dataset to CSV
9. Run data-quality checks
10. Preprocess model features
11. Split the data by recommendation session
12. Train Logistic Regression
13. Evaluate the model
14. Export the trained model
15. Export learned model coefficients for later FastAPI integration

---

## Dataset Builder

File:

`dataset_builder.py`

The dataset builder connects to MongoDB using:

`MONGODB_URI`

from the EVAT root `.env` file.

The MongoDB connection string is not hard-coded into the training code.

The builder creates:

`training_dataset.csv`

---

## Label Definition

The target label is:

`selected`

The label is created using the station selected in the recommendation session.

If:

`candidate.stationId == selection.stationId`

then:

`selected = 1`

Otherwise:

`selected = 0`

Every valid recommendation session must contain exactly one positive candidate.

---

## Dataset Cleaning

The dataset builder performs several cleaning and validation steps.

### Sessions without a selection

Recommendation sessions without a selected station cannot provide a valid target label.

These sessions are excluded.

### Missing station IDs

Candidates without a station ID are excluded because they cannot be compared with the selected station.

### Duplicate candidates

Duplicate station candidates inside the same recommendation session are removed.

### Invalid all-zero recommendation snapshots

During data-quality analysis, one recommendation session was identified where all 10 candidate stations had zero or missing values for all key snapshot fields:

- `distanceKm`
- `durationMin`
- `durationInTrafficMin`
- `energyNeededKwh`
- `temperatureC`

This session contained no meaningful candidate information that could explain the user's choice, so the full session was excluded from the training dataset.

Legitimate zero values are not automatically removed.

For example:

`windSpeedMs = 0`

can be a valid observation and is preserved.

---

## Data Quality Checks

File:

`data_quality_check.py`

The data-quality script checks:

- number of candidate rows
- number of recommendation sessions
- class distribution
- missing values
- zero values
- unknown categorical values
- duplicate session/station rows
- number of positive examples per session
- suspicious all-zero records
- recommendation-session sizes
- numeric feature summaries

After cleaning, the dataset contained:

- 35 valid recommendation sessions
- 326 candidate rows
- 35 selected candidates
- 291 non-selected candidates
- 0 duplicate session/station rows
- 0 invalid label sessions
- 0 suspicious all-zero rows

---

## Feature Selection

### Numeric features used

The current Preference Model v1 uses:

- `distanceKm`
- `durationMin`
- `durationInTrafficMin`
- `energyNeededKwh`
- `chargingPoints`
- `temperatureC`
- `windSpeedMs`

### Categorical features used

The current model uses:

- `roadTrafficCondition`
- `payAtLocation`
- `operator`

---

## Features Currently Excluded

### cost

The `cost` feature was considered for training.

However, approximately 68% of the current candidate records do not contain a cost value.

Using large-scale imputation for this feature could introduce artificial values into most of the training data.

Therefore, `cost` is excluded from Preference Model v1.

The feature can be reconsidered later when more complete historical records are available.

### congestionLevel

The `congestionLevel` feature currently contains:

`unknown`

for 100% of the cleaned dataset.

Because the feature has no variation, the current model cannot learn a meaningful congestion preference from it.

It is therefore excluded from Preference Model v1.

---

## Preprocessing

File:

`preprocessing.py`

### Numeric features

Numerical preprocessing uses:

1. Median imputation for missing values
2. Standard scaling

Median imputation allows a small number of missing numerical values to be handled without deleting otherwise valid recommendation candidates.

### Categorical features

Categorical preprocessing uses:

1. Normalised string values
2. One-hot encoding

The encoder uses:

`handle_unknown="ignore"`

so that a category not seen during training does not cause the prediction pipeline to fail.

---

## Class Imbalance

The training dataset is naturally imbalanced.

Each recommendation session normally contains:

- 1 selected candidate
- several non-selected candidates

The final cleaned dataset contains:

- 35 positive examples
- 291 negative examples

To help handle the imbalance, Logistic Regression is configured using:

`class_weight="balanced"`

This gives the minority selected class more importance during model training.

---

## Train/Test Split

The dataset is split using complete recommendation sessions rather than individual candidate rows.

File:

`train_preference_model.py`

The model uses:

`GroupShuffleSplit`

with:

`sessionId`

as the grouping variable.

This prevents candidates from the same recommendation session from appearing in both the training and testing sets.

The current split contains:

- 26 training sessions
- 9 testing sessions
- 240 training candidate rows
- 86 testing candidate rows

---

## Model

The current model is:

`LogisticRegression`

The model was chosen because:

- the target is binary
- the model is simple and reproducible
- coefficients can be inspected
- learned coefficients can later be handed to the recommendation FastAPI

---

## Data Sufficiency Threshold

The training pipeline includes a minimum completed-session threshold.

Current threshold:

`30 completed sessions`

The final cleaned dataset contains:

`35 completed sessions`

so the current dataset meets the minimum threshold for pipeline training.

This threshold is an initial engineering safeguard and can be revised as more recommendation history becomes available.

---

## Evaluation Metrics

The current model reports:

- Accuracy
- Precision
- Recall
- F1 Score
- ROC-AUC

These metrics are more useful than relying only on accuracy because the dataset is imbalanced.

---

## Current Model Results

Using the final cleaned dataset and session-based train/test split:

- Accuracy: `0.8256`
- Precision: `0.3636`
- Recall: `0.8889`
- F1 Score: `0.5161`
- ROC-AUC: `0.8456`

The selected-station class had high recall, meaning the current model identified most selected candidates in the test data.

However, the current dataset contains only 35 positive user selections.

These results should therefore be treated as initial pipeline-validation results rather than production-level model performance.

More completed recommendation sessions should improve the reliability of future models.

---

## Model Outputs

The training script exports:

### Trained pipeline

`model_output/preference_model.joblib`

This contains the fitted preprocessing and Logistic Regression pipeline.

### Learned coefficients

`model_output/preference_weights.json`

The JSON output contains:

- model type
- model version
- label definition
- training session count
- testing session count
- candidate row counts
- training configuration
- evaluation metrics
- Logistic Regression intercept
- learned feature coefficients

The learned coefficients can later be consumed or translated by the recommendation FastAPI.

---

## Automated Tests

File:

`test_training_pipeline.py`

The automated tests currently verify:

- invalid all-zero recommendation sessions are detected
- valid recommendation sessions are retained
- categorical text cleaning works
- `payAtLocation` normalisation works
- cost parsing works

Run the tests using:

```bash
python -m unittest training.test_training_pipeline