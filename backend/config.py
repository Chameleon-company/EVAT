"""
Configuration file for EVAT Chatbot
Centralizes configurable values and removes hardcoded business logic
Uses only data available in charger_info_mel.csv
"""

# Charging Configuration - Based on CSV data``
CHARGING_CONFIG = {
    # Standard EV battery capacity estimates (kWh) - will be replaced by vehicle-specific data later
    'STANDARD_BATTERY_CAPACITY': 60,  # Average EV battery capacity
    'CHARGE_PERCENTAGE': 0.8,  # 80% charge target
    'MIN_CHARGE_AMOUNT': 40,  # Minimum kWh for 80% charge
    'MAX_CHARGE_AMOUNT': 60,  # Maximum kWh for 80% charge

    # Charging time estimates based on power (minutes) - derived from Power (kW) column
    'CHARGING_TIME_ESTIMATES': {
        # 150kW+ (Tesla Superchargers, etc.)
        'ultra_fast': (150, 999, "15-25 minutes"),
        # 50-149kW (Most modern stations)
        'fast': (50, 149, "30-60 minutes"),
        # 22-49kW (Standard public chargers)
        'standard': (22, 49, "1-2 hours"),
        # 0-21kW (Slow chargers)
        'slow': (0, 21, "2-4 hours")
    },

    # Cost calculation - will use actual values from Usage Cost column
    'COST_MARGIN': 1.2,  # 20% margin for cost estimates
}

# Search Configuration - Based on actual data coverage
SEARCH_CONFIG = {
    'DEFAULT_RADIUS_KM': 8.0,
    'EMERGENCY_RADIUS_KM': 15.0,
    'ROUTE_RADIUS_KM': 12.0,
    'PREFERENCE_RADIUS_KM': 10.0,
    'PREFERENCE_PREFILTER_KM': 10.0,
    'MAX_RESULTS': 20,
    'EMERGENCY_MAX_RESULTS': 5,
}

# Location Configuration
LOCATION_CONFIG = {
    'EARTH_RADIUS_KM': 6371,  # Scientific constant
    'COORDINATE_PRECISION': 6,  # Decimal places for coordinates
}

# Cache Configuration
CACHE_CONFIG = {
    'DEFAULT_DURATION_SECONDS': 300,  # 5 minutes
    'LOCATION_CACHE_DURATION': 3600,  # 1 hour
    'STATION_CACHE_DURATION': 1800,   # 30 minutes
}

# API Configuration (for future TomTom integration)
API_CONFIG = {
    'TOMTOM_API_KEY': None,  # Will be set from environment
    'TOMTOM_BASE_URL': 'https://api.tomtom.com',
    'TOMTOM_VERSION': '1',
    'REQUEST_TIMEOUT': 30,
    'MAX_RETRIES': 3,
}

# Data Source Configuration - Only use available CSV data
DATA_CONFIG = {
    'CHARGER_CSV_PATH': 'data/raw/charger_info_mel.csv',
    'COORDINATES_CSV_PATH': 'data/raw/Co-ordinates.csv',
    'ML_DATASET_PATH': 'data/raw/ml_ev_charging_dataset.csv',

    # CSV column mappings for charger_info_mel.csv
    'CSV_COLUMNS': {
        'CHARGER_NAME': 'Charger Name',
        'ADDRESS': 'Address',
        'SUBURB': 'Suburb',
        'STATE': 'State',
        'POSTAL_CODE': 'Postal Code',
        'POWER_KW': 'Power (kW)',
        'USAGE_COST': 'Usage Cost',
        'NUMBER_OF_POINTS': 'Number of Points',
        'CONNECTION_TYPES': 'Connection Types',
        'LATITUDE': 'Latitude',
        'LONGITUDE': 'Longitude'
    }
}
