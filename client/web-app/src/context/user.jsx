import React, { createContext, useState, useEffect } from 'react';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const UserContext = createContext({
  user: null,
  setUser: () => null,
  updateUser: () => null,
});

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored currentUser', e);
        localStorage.removeItem('currentUser'); // remove corrupted entry
      }
    }

    // Silently verify the secure cookie in the background
    fetch(`${API_URL}/auth/jwt-login`, {
        method: "POST",
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
    })
    .then(res => {
        if (!res.ok) throw new Error("Session expired");
        return res.json();
    })
    .then(data => {
        if (data.data?.user) {
            setUser(prev => ({ ...prev, ...data.data.user }));
        }
    })
    .catch(err => {
        console.error("Silent auth check failed:", err);
        setUser(null);
        localStorage.removeItem("currentUser");
    });
  }, []);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      const { token, ...safeUser } = user;
      localStorage.setItem('currentUser', JSON.stringify(safeUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [user]);

  // Listen for changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'currentUser') {
        if (e.newValue) {
          try {
            setUser(JSON.parse(e.newValue));
          } catch (err) {
            console.error('Failed to parse user from storage event', err);
          }
        } else {
          setUser(null);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Helper to update user safely
  const updateUser = (newData) => {
    setUser(prevUser => {
      if (!prevUser) return newData;
      const updated = { ...prevUser, ...newData };
      return updated;
    });
  };

  return (
    <UserContext.Provider value={{ user, setUser, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};
