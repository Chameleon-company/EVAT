import React, { createContext, useState, useEffect, useContext } from 'react';
import { UserContext } from "./user";
const API_URL = import.meta.env.VITE_API_URL;

export const FavouritesContext = createContext();

export function FavouritesProvider({ children }) {
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user } = useContext(UserContext);

  // Fetch favourites from backend
  useEffect(() => {
    const fetchFavourites = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_URL}/profile/user-profile`, {
          credentials: "include",
          headers: { "Content-Type": "application/json", },
        });

        if (!res.ok) throw new Error("Failed to load favourites");

        const data = await res.json();
        setFavourites(data.data.favourite_stations || []);
      } catch (err) {
        console.error("Fetch favourites error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFavourites();
  }, [user]);

  // Toggle favourite station (save/remove in DB)
  const toggleFavourite = async (station) => {
    if (!user) {
      setError("Not authenticated");
      return;
    }

    const isFav = favourites.some((s) => s._id === station._id);
    const url = isFav
      ? `${API_URL}/profile/remove-favourite-station`
      : `${API_URL}/profile/add-favourite-station`;

    try {
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", },
        body: JSON.stringify({ stationId: station._id }),
      });

      if (!res.ok) throw new Error("Failed to update favourite");

      // Optimistically update UI
      if (isFav) {
        setFavourites((prev) => prev.filter((s) => s._id !== station._id));
      } else {
        setFavourites((prev) => [station, ...prev]);
      }
    } catch (err) {
      console.error("Toggle favourite error:", err);
      setError(err.message);
    }
  };

  return (
    <FavouritesContext.Provider value={{ favourites, toggleFavourite, loading, error }}>
      {children}
    </FavouritesContext.Provider>
  );
}