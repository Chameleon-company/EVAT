# Personalised Preference Model Training Pipeline

## Overview

This folder contains the training pipeline for the EVAT personalised
charging-station preference model.

The pipeline uses historical recommendation sessions stored in MongoDB and
trains a Logistic Regression model to learn which candidate station
characteristics are associated with user selections.

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
7. Build user-context features
8. Clean numerical and categorical values
9. Save the cleaned dataset to CSV
10. Run data-quality checks
11. Preprocess model features
12. Split the data by recommendation session
13. Train Logistic Regression
14. Evaluate the model
15. Export the trained model
16. Export learned model coefficients and training metadata

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

## User Context

File:

`user_context.py`

The training pipeline includes the user-context feature:

`userPreviousSessions`

This feature represents the number of previous recommendation sessions in
which the user actually selected a charging station.

Only sessions belonging to the current user and occurring before the current
session are counted.

The current session is not counted as a previous session.

Future sessions are not counted.

Sessions belonging to other users are not counted.

This prevents future information and other users' behaviour from leaking into
the training features.

The same user-context definition is used during live FastAPI inference so that
the training and prediction feature definitions remain consistent.

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

Every valid recommendation session must contain exactly one positive
candidate.

---

## Dataset Cleaning

The dataset builder performs several cleaning and validation steps.

### Sessions without a selection

Recommendation sessions without a selected station cannot provide a valid
target label.

These sessions are excluded.

### Missing station IDs

Candidates without a station ID are excluded because they cannot be compared
with the selected station.

### Duplicate candidates

Duplicate station candidates inside the same recommendation session are
removed.

### Invalid all-zero recommendation snapshots

During data-quality analysis, one recommendation session was identified where
all 10 candidate stations had zero or missing values for all key snapshot
fields:

- `distanceKm`
- `durationMin`
- `durationInTrafficMin`
- `energyNeededKwh`
- `temperatureC`

This session contained no meaningful candidate information that could explain
the user's choice, so the full session was excluded from the training dataset.

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
- invalid `userPreviousSessions` values

The user-context validation also checks that
`userPreviousSessions` does not contain negative values.

The current cleaned dataset contains:

- 42 valid recommendation sessions
- 396 candidate rows
- 42 selected candidates
- 354 non-selected candidates

---

## Feature Selection

### Numeric features used

The current Preference Model v1 uses:

- `userPreviousSessions`
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

However, a large proportion of the current candidate records do not contain a
cost value.

Using large-scale imputation for this feature could introduce artificial
values into a substantial portion of the training data.

Therefore, `cost` is excluded from Preference Model v1.

The feature can be reconsidered later when more complete historical records are
available.

### congestionLevel

The `congestionLevel` feature currently contains `unknown` for the cleaned
training records.

Because the feature has no useful variation, the current model cannot learn a
meaningful congestion preference from it.

It is therefore excluded from Preference Model v1.

---

## Preprocessing

File:

`preprocessing.py`

### Numeric features

Numerical preprocessing uses:

1. Median imputation for missing values
2. Standard scaling

Median imputation allows a small number of missing numerical values to be
handled without deleting otherwise valid recommendation candidates.

### Categorical features

Categorical preprocessing uses:

1. Normalised string values
2. One-hot encoding

The encoder uses:

`handle_unknown="ignore"`

so that a category not seen during training does not cause the prediction
pipeline to fail.

---

## Class Imbalance

The training dataset is naturally imbalanced.

Each recommendation session normally contains:

- 1 selected candidate
- several non-selected candidates

The current dataset contains:

- 42 positive examples
- 354 negative examples

To help handle the imbalance, Logistic Regression is configured using:

`class_weight="balanced"`

This gives the minority selected class more importance during model training.

---

## Train/Test Split

The dataset is split using complete recommendation sessions rather than
individual candidate rows.

File:

`train_preference_model.py`

The model uses:

`GroupShuffleSplit`

with:

`sessionId`

as the grouping variable.

This prevents candidates from the same recommendation session from appearing
in both the training and testing sets.

This is important because splitting individual candidate rows could allow
information from the same recommendation session to appear in both datasets.

The current split contains:

- 31 training sessions
- 11 testing sessions
- 292 training candidate rows
- 104 testing candidate rows

---

## Model

The current model is:

`LogisticRegression`

The model was chosen because:

- the target is binary
- the model is simple and reproducible
- coefficients can be inspected
- learned coefficients can be exported
- the model can be integrated into the recommendation FastAPI service

Current training configuration:

- Split method: `GroupShuffleSplit by sessionId`
- Test size: `0.25`
- Random state: `42`
- Class weight: `balanced`
- Maximum iterations: `2000`

---

## Data Sufficiency Threshold

The training pipeline includes a minimum completed-session threshold.

Current threshold:

`30 completed sessions`

The current dataset contains:

`42 completed sessions`

so the dataset meets the minimum threshold for pipeline training.

This threshold is an initial engineering safeguard and can be revised as more
recommendation history becomes available.

---

## Evaluation Metrics

The current model reports:

- Accuracy
- Precision
- Recall
- F1 Score
- ROC-AUC

These metrics are more useful than relying only on accuracy because the
dataset is imbalanced.

---

## Current Model Results

Using the current cleaned dataset and session-based train/test split:

- Completed sessions: `42`
- Training sessions: `31`
- Testing sessions: `11`
- Candidate rows: `396`
- Training rows: `292`
- Testing rows: `104`
- Positive rows: `42`
- Negative rows: `354`

Evaluation metrics:

- Accuracy: `0.8365`
- Precision: `0.3750`
- Recall: `0.8182`
- F1 Score: `0.5143`
- ROC-AUC: `0.9326`

The selected-station class has high recall, meaning the current model identifies
most selected candidates in the test data.

However, the dataset currently contains only 42 positive user selections.
These results should therefore be treated as initial model-validation results
rather than production-level model performance.

More completed recommendation sessions should improve the reliability of future
models.

The complete training metadata, configuration, metrics, intercept, and learned
coefficients are stored in:

`model_output/preference_weights.json`

---

## Model Outputs

The training script exports:

### Trained pipeline

`model_output/preference_model.joblib`

This contains the fitted preprocessing and Logistic Regression pipeline.

The FastAPI recommendation service loads this artifact during inference.

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

The learned coefficients can be inspected to understand how the model uses
the transformed features.

---

## FastAPI Integration

The trained model is used by the recommendation service through:

`services/preference_model.py`

The live ranking process receives:

- station candidates
- favourite station IDs
- user recommendation history

The ranking service calculates:

`userPreviousSessions`

from the user's previous selected sessions and passes the value to the
preference model.

The preference model then builds the same feature structure used during
training and generates a selection probability for each candidate.

The resulting probability is used as the model-based ranking score.

The existing personalization layer is then applied on top of the model score.

The final candidates are sorted and returned with:

- station ID
- rank
- score
- human-readable reasons

If the trained model is unavailable or model inference fails, the ranking
service falls back to the existing heuristic scoring.

---

## Ranking Flow

The current ranking flow is:

```text
Node API
   |
   | candidates + user profile + recommendation history
   v
FastAPI recommendation service
   |
   v
Filter eligible candidates
   |
   v
Calculate heuristic scores
   |
   v
Calculate userPreviousSessions
   |
   v
Preference model prediction
   |
   +---- model available ----> model selection probability
   |
   +---- model unavailable --> heuristic score fallback
   |
   v
Apply existing user personalization
   |
   v
Sort by final score
   |
   v
Return ranked recommendations + reasons