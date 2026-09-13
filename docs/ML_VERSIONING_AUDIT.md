# EVAT ML Dataset and Model Versioning Audit

**Planner task:** 059S1 — Version Machine Learning Datasets and Models  
**Author:** Jason Fallon  
**Date:** 26 August 2026  
**Status:** Initial audit

## Purpose

This document records the current handling of datasets, trained model artefacts,
training workflows, and reproducibility across EVAT Python services. It identifies
initial gaps and proposes a lightweight versioning approach.

## Initial service inventory

| Service | Runtime type | Data / artefact | Training availability | Initial versioning finding |
|---|---|---|---|---|
| Cost comparison | Regression model trained at API startup | `costComparison/data/dummy_data.csv`; selected model remains in memory | Training code is available | Dataset and training run should be versioned; selected model and evaluation results are not persisted |
| Environmental impact | Offline notebook-trained model | `co2_savings_model.pkl` | Notebook is available | Training dataset, notebook execution, artefact, and verification steps need a standard record |
| Price prediction | Saved-artifact inference | `price_best_model_latest.joblib` and related artefacts | Complete training pipeline is not available in this repository | Artefact provenance, feature schema, validation, and replacement instructions need recording |
| Personalised EV insights | Saved-artifact inference | `kproto_bundle.pkl` | Complete training pipeline is not available in this repository | Artefact provenance and required training assets need recording |
| Demand forecasting | Saved-artifact inference | `ev_demand_model.pkl` | Complete training pipeline is not available in this repository | Artefact provenance and required training assets need recording |
| Charging recommendation | Deterministic filtering and weighted scoring | Runtime request and station data | Not a trained model | Version rules, weights, configuration, and unit tests |
| Reliability scoring | Deterministic scoring | `EVAT-Final-Enriched.csv` and source code | Not a trained model | Version data source, scoring weights, configuration, and tests |

## Initial reproducibility gaps

1. Dataset and model identifiers are not standardised across services.
2. Some saved model artefacts do not have complete training code or original data available in the repository.
3. Model metadata, such as feature schema, preprocessing, metrics, random seed, dependency versions, and validation date, is not consistently stored beside artefacts.
4. Cost-comparison training runs at service startup, but the selected model and training-run information are not persisted as a traceable release.
5. Dataset source, licence, schema, and preprocessing history are not consistently documented.

## Proposed minimum metadata standard

Use one dataset ID and one model or configuration ID per release:

- Dataset: `<service>-data-v<major>.<minor>.<patch>`
- Model/configuration: `<service>-model-v<major>.<minor>.<patch>`

Each metadata record should include:

- Dataset source, licence, schema, and preprocessing
- Code commit or release reference
- Feature list/schema and target definition
- Model algorithm or scoring rules
- Training configuration and random seed, where applicable
- Evaluation metrics and validation date
- Python and dependency versions
- Artefact path and checksum, where an artefact is stored
- Verification and rollback/replacement instructions

## Next steps

1. Verify this inventory against the individual Python-service source code.
2. Inspect `server/python-services/costComparison/model_runner.py` and the training dataset to record the actual feature set, split strategy, random seed, and evaluation output.
3. Add a verified metadata example for the cost-comparison service.
4. Discuss a central model-registry document with the team after the initial audit.