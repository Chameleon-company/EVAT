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

        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };

                resolve(userLocation);
            },
            (error) => {
                console.warn("Location permission/error:", error);

                userLocation = null;
                reject(error);
            },
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