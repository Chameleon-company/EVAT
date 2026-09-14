/* =========================================================
   USER LOCATION
   ========================================================= */

let userLocation = null;


/* ---------- Resolve browser location ---------- */

function resolveUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            userLocation = null;
            reject(new Error("Geolocation is not supported."));
            return;
        }

        const locationResolved = (position) => {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };

            resolve(userLocation);
        };

        const locationFailed = (error) => {
            console.warn("Location permission/error:", error);
            userLocation = null;
            reject(error);
        };

        const retryWithNetworkLocation = (error) => {
            if (error.code !== 3) {
                locationFailed(error);
                return;
            }

            console.warn(
                "High-accuracy location timed out; retrying with network location."
            );

            navigator.geolocation.getCurrentPosition(
                locationResolved,
                locationFailed,
                {
                    enableHighAccuracy: false,
                    timeout: 20000,
                    maximumAge: 600000,
                }
            );
        };

        navigator.geolocation.getCurrentPosition(
            locationResolved,
            retryWithNetworkLocation,
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000,
            }
        );
    });
}


/* ---------- Get current stored location ---------- */

function getUserLocation() {
    return userLocation;
}
