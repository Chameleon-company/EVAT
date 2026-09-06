# Congestion Prediction Service

This service provides EV charging station congestion predictions using the existing RandomForest regression model and FastAPI inference pipeline.

## Model

The service uses a RandomForestRegressor with:

- 175 trees
- Maximum depth of 15
- 23 input features
- 3-hour EV arrival prediction horizon
- Congestion output mapped to low, medium, or high

The optimized model preserves the same feature interface and prediction API used by the existing congestion prediction pipeline.

## Efficiency Optimisation

The original Random Forest configuration used 300 trees. Multiple tree-count configurations were benchmarked using the same training split, feature set, sample weighting, and model parameters.

The 175-tree configuration was selected as the best efficiency/performance trade-off.

| Metric | Existing Model | Optimized Model |
|---|---:|---:|
| Trees | 300 | 175 |
| Training time | 0.1037 s | 0.0645 s |
| Mean inference time | 0.0260 s | 0.0136 s |
| Median inference time | 0.0262 s | 0.0136 s |
| Model artifact size | 573.22 KB | 423.14 KB |
| R² | 0.9113 | 0.9139 |
| RMSE | 0.4837 | 0.4766 |
| MAE | 0.1840 | 0.1877 |
| WAPE | 11.69% | 11.93% |

This represents:

- 41.67% fewer trees
- 37.79% faster training in the controlled benchmark
- approximately 48% faster model inference on the repeated 10,000-row benchmark
- 26.18% smaller model artifact
- comparable predictive performance

The inference timing above measures Random Forest model prediction time only and does not represent total end-to-end API latency, which also depends on external data sources and feature generation.

## Files

- `model_api.py` - FastAPI inference service
- `random_forest_model.pkl` - optimized 175-tree Random Forest model
- `EVAT.chargers.csv` - charging station coordinate data
- `requirements.txt` - Python dependencies
- `train_optimized_rf.py` - reproducible optimized model training script
- `rf_efficiency_benchmark.py` - tree-count efficiency and performance benchmark
- `rf_inference_benchmark.py` - repeated inference timing benchmark
- `rf_efficiency_benchmark_results.csv` - benchmark results

## Running the Service

Install dependencies:

```bash
pip install -r requirements.txt