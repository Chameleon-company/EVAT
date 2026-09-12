/**
 * EVAT Charging Station Cards
 *
 * Responsible for:
 * - Rendering charging station results
 * - Showing distance, cost, power and availability
 * - Glassmorphism styling
 * - Handling the "Get Directions" action
 */


/* =========================================================
   DISTANCE
   ========================================================= */

function formatStationDistance(km) {

  if (km == null) {
    return "—";
  }

  const distance =
    Number(km);

  if (Number.isNaN(distance)) {
    return "—";
  }

  return distance < 1
    ? `${Math.round(distance * 1000)} m`
    : `${distance.toFixed(1)} km`;
}


/* =========================================================
   AVAILABILITY
   ========================================================= */

function getAvailabilityBadge(
  availability
) {

  const value =
    (availability || "")
      .toString()
      .toLowerCase();


  if (
    value === "yes" ||
    value === "available" ||
    value === "operational"
  ) {

    return {
      text: "Available",
      className: "available",
    };

  }


  if (
    value === "no" ||
    value === "busy"
  ) {

    return {
      text: "Busy",
      className: "busy",
    };

  }


  return {
    text: "Unknown",
    className: "unknown",
  };
}


/* =========================================================
   STATION CARDS
   ========================================================= */

function addStationCards(
  stations = [],
  options = {}
) {

  const chat =
    document.getElementById("chat");


  if (!chat) {

    console.error(
      "Chat container not found."
    );

    return;
  }


  /* -------------------------------------------------------
     Empty state
     ------------------------------------------------------- */

  if (
    !Array.isArray(stations) ||
    stations.length === 0
  ) {

    addMessage(
      "No stations found nearby.",
      "bot"
    );

    return;
  }


  /* -------------------------------------------------------
     Message row
     ------------------------------------------------------- */

  const row =
    document.createElement("div");


  row.className =
    `
      evat-in
      mb-5
      flex
      items-start
      gap-3
    `;


  /* =======================================================
     EVAT AVATAR
     ======================================================= */

  const avatar =
    document.createElement("div");


  avatar.className =
    `
      flex
      h-8
      w-8
      shrink-0
      items-center
      justify-center
      rounded-xl
      border
      border-emerald-300/15
      bg-emerald-400/[0.06]
      text-sm
      text-emerald-300
      shadow-[0_0_25px_rgba(16,185,129,0.08)]
      backdrop-blur-xl
    `;


  avatar.textContent =
    "⚡";


  /* =======================================================
     STATION LIST
     ======================================================= */

  const container =
    document.createElement("div");


  container.className =
    `
      w-full
      max-w-[90%]
      space-y-3
    `;


  /* =======================================================
     CREATE EACH STATION
     ======================================================= */

  stations.forEach(
    (station) => {

      const badge =
        getAvailabilityBadge(
          station.availability
        );


      const card =
        document.createElement("div");


      /* ---------------------------------------------------
         GLASS CARD
         --------------------------------------------------- */

      card.className =
        `
          overflow-hidden
          rounded-[22px]
          border
          border-white/[0.09]
          bg-white/[0.045]
          p-4
          shadow-[0_18px_50px_rgba(0,0,0,0.28)]
          backdrop-blur-2xl
          transition-all
          duration-200
          hover:border-emerald-300/20
          hover:bg-white/[0.055]
          hover:shadow-[0_20px_55px_rgba(0,0,0,0.35)]
        `;


      /* ---------------------------------------------------
         Safe station values
         --------------------------------------------------- */

      const safeName =
        station.name ||
        "Unnamed station";


      const safeAddress =
        station.address ||
        "Address unavailable";


      /* ---------------------------------------------------
         Availability colours
         --------------------------------------------------- */

      const availabilityClass =
        badge.className === "available"

          ? `
              border-emerald-400/20
              bg-emerald-400/[0.07]
              text-emerald-300
            `

          : badge.className === "busy"

            ? `
                border-amber-400/20
                bg-amber-400/[0.07]
                text-amber-300
              `

            : `
                border-white/[0.08]
                bg-white/[0.035]
                text-white/40
              `;


      /* =================================================
         CARD HTML
         ================================================= */

      card.innerHTML =
        `

          <!-- ===========================================
               STATION HEADER
               =========================================== -->

          <div
            class="
              flex
              items-start
              gap-3
            "
          >


            <!-- =========================================
                 GLASS STATION ICON
                 ========================================= -->

            <div
              class="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-emerald-300/15
                bg-emerald-400/[0.06]
                text-lg
                text-emerald-300
                shadow-[0_0_25px_rgba(16,185,129,0.06)]
                backdrop-blur-xl
              "
            >
              ⚡
            </div>


            <!-- =========================================
                 STATION INFORMATION
                 ========================================= -->

            <div
              class="
                min-w-0
                flex-1
              "
            >


              <!-- Station heading -->

              <div
                class="
                  flex
                  items-start
                  justify-between
                  gap-3
                "
              >

                <div
                  class="
                    min-w-0
                  "
                >

                  <h3
                    class="
                      truncate
                      text-sm
                      font-semibold
                      tracking-[-0.01em]
                      text-white
                    "
                  >
                    ${safeName}
                  </h3>


                  <p
                    class="
                      mt-1
                      text-xs
                      leading-5
                      text-white/40
                    "
                  >
                    ${safeAddress}
                  </p>

                </div>


                ${
                  options.show_availability
                    ? `

                      <span
                        class="
                          shrink-0
                          rounded-full
                          border
                          px-2.5
                          py-1
                          text-[10px]
                          font-medium
                          tracking-wide
                          ${availabilityClass}
                          backdrop-blur-xl
                        "
                      >
                        ${badge.text}
                      </span>

                    `
                    : ""
                }

              </div>


              <!-- =======================================
                   LIVE ROUTE DETAILS
                   ======================================= -->

              <div
                class="
                  mt-2
                  grid
                  grid-cols-2
                  gap-2
                "
              >

                <div
                  class="
                    rounded-xl
                    border
                    border-white/[0.06]
                    bg-black/[0.14]
                    p-2.5
                    backdrop-blur-xl
                  "
                >
                  <p class="text-[10px] font-medium uppercase tracking-wider text-white/25">
                    Travel time
                  </p>
                  <p class="mt-1 text-xs font-medium text-white/80">
                    ${
                      station.travel_time_minutes != null
                        ? `${station.travel_time_minutes} min`
                        : "—"
                    }
                  </p>
                </div>

                <div
                  class="
                    rounded-xl
                    border
                    border-white/[0.06]
                    bg-black/[0.14]
                    p-2.5
                    backdrop-blur-xl
                  "
                >
                  <p class="text-[10px] font-medium uppercase tracking-wider text-white/25">
                    Traffic
                  </p>
                  <p class="mt-1 text-xs font-medium text-white/80">
                    ${station.traffic || "—"}
                  </p>
                </div>

              </div>


              <!-- =======================================
                   STATION DETAILS
                   ======================================= -->

              <div
                class="
                  mt-4
                  grid
                  grid-cols-3
                  gap-2
                "
              >


                <!-- Distance -->

                <div
                  class="
                    rounded-xl
                    border
                    border-white/[0.06]
                    bg-black/[0.14]
                    p-2.5
                    backdrop-blur-xl
                  "
                >

                  <p
                    class="
                      text-[10px]
                      font-medium
                      uppercase
                      tracking-wider
                      text-white/25
                    "
                  >
                    Distance
                  </p>


                  <p
                    class="
                      mt-1
                      text-xs
                      font-medium
                      text-white/80
                    "
                  >
                    ${formatStationDistance(
                      station.distance_km
                    )}
                  </p>

                </div>


                <!-- Cost -->

                <div
                  class="
                    rounded-xl
                    border
                    border-white/[0.06]
                    bg-black/[0.14]
                    p-2.5
                    backdrop-blur-xl
                  "
                >

                  <p
                    class="
                      text-[10px]
                      font-medium
                      uppercase
                      tracking-wider
                      text-white/25
                    "
                  >
                    Cost
                  </p>


                  <p
                    class="
                      mt-1
                      text-xs
                      font-medium
                      text-emerald-300
                    "
                  >
                    ${station.cost || "—"}
                  </p>

                </div>


                <!-- Power -->

                <div
                  class="
                    rounded-xl
                    border
                    border-white/[0.06]
                    bg-black/[0.14]
                    p-2.5
                    backdrop-blur-xl
                  "
                >

                  <p
                    class="
                      text-[10px]
                      font-medium
                      uppercase
                      tracking-wider
                      text-white/25
                    "
                  >
                    Power
                  </p>


                  <p
                    class="
                      mt-1
                      text-xs
                      font-medium
                      text-white/80
                    "
                  >
                    ${
                      station.power != null
                        ? `${station.power} kW`
                        : "—"
                    }
                  </p>

                </div>

              </div>


              <!-- =======================================
                   DIRECTIONS BUTTON
                   ======================================= -->

              <button
                type="button"
                class="
                  station-directions
                  mt-3
                  w-full
                  rounded-xl
                  border
                  border-emerald-300/15
                  bg-emerald-400/[0.06]
                  px-4
                  py-2.5
                  text-xs
                  font-medium
                  tracking-wide
                  text-emerald-300
                  shadow-[0_8px_25px_rgba(16,185,129,0.04)]
                  backdrop-blur-xl
                  transition-all
                  duration-200
                  hover:border-emerald-300/25
                  hover:bg-emerald-400/[0.11]
                  hover:text-emerald-200
                  hover:shadow-[0_8px_30px_rgba(16,185,129,0.10)]
                  active:scale-[0.99]
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-emerald-400/50
                "
                data-id="${station.station_id}"
                data-latitude="${station.latitude ?? ""}"
                data-longitude="${station.longitude ?? ""}"
              >
                Get Directions
              </button>


            </div>

          </div>

        `;


      container.appendChild(
        card
      );

    }
  );


  /* =======================================================
     ADD TO CHAT
     ======================================================= */

  row.append(
    avatar,
    container
  );


  chat.appendChild(
    row
  );


  /* =======================================================
     BUTTON HANDLERS
     ======================================================= */

  attachStationDirectionsHandlers();


  /* =======================================================
     SAVE / SCROLL
     ======================================================= */

  if (
    typeof persistChat ===
    "function"
  ) {

    persistChat();

  }


  if (
    typeof scrollToBottom ===
    "function"
  ) {

    scrollToBottom();

  }

}


/* =========================================================
   DIRECTIONS BUTTON HANDLERS
   ========================================================= */

function attachStationDirectionsHandlers() {

  document
    .querySelectorAll(
      ".station-directions"
    )
    .forEach(
      (button) => {

        /* -----------------------------------------------
           Prevent duplicate listeners
           ----------------------------------------------- */

        if (
          button.dataset.bound
        ) {

          return;

        }


        button.dataset.bound =
          "1";


        /* -----------------------------------------------
           Click handler
           ----------------------------------------------- */

        button.addEventListener(
          "click",
          () => {

            const stationId = button.getAttribute("data-id");
            const latitudeValue = button.getAttribute("data-latitude");
            const longitudeValue = button.getAttribute("data-longitude");
            const destinationLatitude = Number(latitudeValue);
            const destinationLongitude = Number(longitudeValue);


            if (!stationId) {

              return;

            }


            if (
              !latitudeValue ||
              !longitudeValue ||
              !Number.isFinite(destinationLatitude) ||
              !Number.isFinite(destinationLongitude)
            ) {
              addMessage(
                "Directions are unavailable for this station.",
                "bot"
              );
              return;
            }

            const params = new URLSearchParams({
              api: "1",
              destination: `${destinationLatitude},${destinationLongitude}`,
              travelmode: "driving",
            });

            if (
              userLocation &&
              Number.isFinite(Number(userLocation.lat)) &&
              Number.isFinite(Number(userLocation.lng))
            ) {
              params.set(
                "origin",
                `${userLocation.lat},${userLocation.lng}`
              );
            }

            window.open(
              `https://www.google.com/maps/dir/?${params.toString()}`,
              "_blank",
              "noopener,noreferrer"
            );

          }
        );

      }
    );

}
