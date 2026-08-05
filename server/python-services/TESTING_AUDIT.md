# EVAT Python Services Testing Audit

## Purpose

This document records the current testing state of the Python and machine
learning services in EVAT. It will be updated as the standardised testing
framework is introduced.

## Current Services

| Service | Requirements file | Existing tests | Initial status |
|---|---:|---:|---|
| Demand Forecasting | Yes | No | Needs review |
| Charging Station Recommendation | Yes | Yes | Existing reference implementation |
| Cost API | No | No | Needs review |
| Environmental Impact Analysis | Yes | No | Needs review |
| Insights API | Yes | No | Needs review |
| Price API | Yes | No | Needs review |
| Reliability Scoring API | Yes | No | Needs review |
| Weather Route API | No | No | Needs review |

## Current Findings

- Charging Station Recommendation is the only service with an automated test suite.
- Most services do not have a documented test command.
- There is no shared test configuration for Python services.
- Some services do not have a requirements file.
- Model loading, prediction output and invalid input behaviour are not tested consistently.
- API error responses may differ between services.

## Proposed Testing Standard

Each Python service should include tests for:

1. Module import and application startup
2. Model and supporting artefact loading
3. Valid prediction requests
4. Missing or invalid inputs
5. Prediction response structure
6. Expected API status codes
7. Basic model performance or regression checks where suitable

## Initial Implementation Plan

1. Review the existing Charging Station Recommendation tests.
2. Define shared pytest conventions.
3. Add a common test dependency file.
4. Add tests to one additional ML service.
5. Document how tests are run locally.
6. Review future CI integration.