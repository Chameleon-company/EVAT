# Charging Station Recommendation

Feature package that filters and ranks EV charging-station candidates. Its
endpoint is exposed by the combined Python API in `server/python-services/main.py`.

## Setup

```sh
npm run python:sync
```

## Run

```sh
npm run dev:python
```

Health: [http://127.0.0.1:5000/](http://127.0.0.1:5000/)

Swagger docs: [http://127.0.0.1:5000/docs](http://127.0.0.1:5000/docs)

## Endpoint

`POST /charging-station-recommendations/rank`

The Node API supplies enriched station candidates, the user profile, and their
recommendation history. This service filters ineligible stations, applies the
current fixed-weight ranking, and returns ranked station IDs, scores, and
reasons.

## Tests

```sh
npm run test:python
```
