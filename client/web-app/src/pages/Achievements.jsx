import { useState, useEffect, useContext } from 'react';
import { UserContext } from "../context/user";
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import ChatBubble from "../components/ChatBubble";
import { Button } from '../components/Button';

import '../styles/Root.css';
import '../styles/Buttons.css';
import '../styles/Elements.css';
import '../styles/Fonts.css';
import '../styles/Forms.css';
import '../styles/NavBar.css';
import '../styles/Sidebar.css';
import '../styles/Tables.css';
import '../styles/Validation.css';
import '../styles/Achievements.css';

const API_URL = import.meta.env.VITE_API_URL;
const isDev = import.meta.env.DEV;   // Show dev tools only in development

function Achievements() {
    const navigate = useNavigate();
    // Get user from Context
    const { user: contextUser, setUser: setContextUser, updateUser: updateContextUser } = useContext(UserContext);

    const [userStats, setUserStats] = useState(null);
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    // Testing Controls State
    const [selectedCounter, setSelectedCounter] = useState("");
    const [counterValue, setCounterValue] = useState(0);
    const [selectedFlag, setSelectedFlag] = useState("");

    // get token from context if available, otherwise get from local storage
    const token = contextUser?.token || JSON.parse(localStorage.getItem("currentUser"))?.token;

    // Testing Handlers
    const handleAddToCounter = async () => {
        if (!selectedCounter || !userStats?.userId) return;
        try {
            const res = await fetch(`${API_URL}/user-stats/test/increment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId: userStats.userId,
                    counterName: selectedCounter,
                    value: counterValue
                })
            });

            if (res.ok) {
                alert(`Added ${counterValue} to ${selectedCounter}`);
                // reset option and value
                setSelectedCounter("");
                setCounterValue();
                // reload user stats
                await fetchData();
            } else {
                alert("Failed to update");
            }
        } catch (err) {
            alert("Error updating counter");
        }
    };

    const handleSetFlagTrue = async () => {
        if (!selectedFlag || !userStats?.userId) return;

        try {
            const res = await fetch(`${API_URL}/user-stats/test/set-flag`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId: userStats.userId,
                    flagName: selectedFlag
                })
            });

            if (res.ok) {
                alert(`Set ${selectedFlag} to true`);
                // reset flag option
                setSelectedFlag("");
                // reload user stats
                await fetchData();
            }
        } catch (err) {
            alert("Error setting flag");
        }
    };

    const handleResetFlags = async () => {
        if (!userStats?.userId) return;

        try {
            const res = await fetch(`${API_URL}/user-stats/reset-flags`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId: userStats.userId,
                })
            });

            if (res.ok) {
                alert(`Flags have been reset`);
                // reload user stats
                await fetchData();
            }
        } catch (err) {
            alert("Error setting flag");
        }
    };

    const handleResetCounters = async () => {
        if (!userStats?.userId) return;

        try {
            const res = await fetch(`${API_URL}/user-stats/reset-counters`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId: userStats.userId,
                })
            });

            if (res.ok) {
                alert(`Counters have been reset`);
                // reload user stats
                await fetchData();
            }
        } catch (err) {
            alert("Error setting flag");
        }
    };

    const handleResetAll = async () => {
        if (!userStats?.userId) return;
        // confirmation popup
        if (window.confirm("Reset ALL stats?")) {
            try {
                const res = await fetch(`${API_URL}/user-stats/reset`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        userId: userStats.userId
                    })
                });

                if (res.ok) {
                    alert(`All user stats have been reset`);
                    // reload user stats
                    await fetchData();
                }
            } catch (err) {
                alert("Error resetting user stats");
            }
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch User Stats
            const statsRes = await fetch(`${API_URL}/user-stats/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setUserStats(statsData.data);
            }

            // Fetch All Achievements with progress
            const achRes = await fetch(`${API_URL}/achievements`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (achRes.ok) {
                const achData = await achRes.json();
                setAchievements(achData.data || []);
            }
        } catch (err) {
            console.error("Failed to load achievements page:", err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch both user stats and achievements
    useEffect(() => {
        if (!token) {
            navigate("/signin");
            return;
        }
        fetchData();
    }, [token, navigate]);

    if (loading) return <div className="loading">Loading achievements...</div>;

    return (
        <div>
            <NavBar />
            {/* background */}
            <div className="background-image" />
            <div className='spacer' />
            <div className="container horizontal">

                {/* user stats data */}
                <div className="inner-left ">
                    <h5>Profile Stats</h5>

                    {userStats ? (
                        <div className="stats-list">
                        <div className="stat-row">
                            <span>Total Charging Sessions: </span>
                            <strong>{userStats.counters.totalChargingSessions}</strong>
                        </div>
                        <div className="stat-row">
                            <span>Total kWh Charged: </span>
                            <strong>{(userStats.counters.totalWhCharged / 1000).toFixed(1)}</strong>
                        </div>
                        <div className="stat-row">
                            <span>Total Distance Travelled: </span>
                            <strong>{(userStats.counters.totalMetresTravelled / 1000).toFixed(1)} km</strong>
                        </div>
                        <div className="stat-row">
                            <span>CO₂ Avoided: </span>
                            <strong>{userStats.counters.totalCO2KgAvoided} kg</strong>
                        </div>
                        <div className="stat-row">
                            <span>Petrol Savings: </span>
                            <strong>${(userStats.counters.totalPetrolSavingsCents / 100).toFixed(2)}</strong>
                        </div>
                        <div className="stat-row">
                            <span>Consecutive Login Days: </span>
                            <strong>{userStats.counters.consecutiveLoginDays}</strong>
                        </div>
                        </div>
                    ) : (
                        <p>Unable to load stats.</p>
                    )}
                </div>
                
                {/* achievements list */}
                <div className="inner-center ">
                    <h5>Full Achievement List</h5>

                    <div className="achievements-grid">
                        {achievements.map((ach) => (
                        <div 
                            key={ach._id} 
                            className={`achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}`}
                        >
                            <div className="achievement-icon">
                            <img 
                                src={ach.icon || "/default-badge.png"} 
                                alt={ach.name}
                            />
                            </div>

                            <div className="achievement-content">
                            <h6>{ach.name}</h6>
                            <p className="description">{ach.description}</p>

                            {ach.unlocked ? (
                                <div className="unlocked-badge">
                                ✓ Unlocked • {new Date(ach.unlockedAt).toLocaleDateString('en-AU')}
                                </div>
                            ) : (
                                <div className="locked-badge">
                                Locked
                                </div>
                            )}
                            </div>
                        </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT SIDE - TESTING CONTROLS (Developer Only) */}
                {isDev && (
                    <div className="inner-right testing-controls">
                        <h5>Testing Controls</h5>

                        {/* Add to Counter */}
                        <div className="test-section">
                            <h6>Add to a counter value</h6>
                            <select 
                                value={selectedCounter} 
                                onChange={(e) => setSelectedCounter(e.target.value)}
                                className="test-select"
                            >
                                <option value="">Select a Counter</option>
                                {userStats && Object.keys(userStats.counters).map(key => (
                                <option key={key} value={key}>{key}</option>
                                ))}
                            </select>

                            <div className="test-input-group">
                                <input
                                type="number"
                                value={counterValue}
                                onChange={(e) => setCounterValue(Number(e.target.value))}
                                placeholder="Enter value"
                                className="test-input"
                                />
                                <Button
                                onClick={handleAddToCounter}
                                size="tiny"
                                disabled={!selectedCounter || counterValue <= 0}
                                >
                                Add
                                </Button>
                            </div>
                        </div>

                        <div className='spacer' />

                        {/* Set Flag to True */}
                        <div className="test-section">
                            <h6>Set a flag to true</h6>
                            <select 
                                value={selectedFlag} 
                                onChange={(e) => setSelectedFlag(e.target.value)}
                                className="test-select"
                            >
                                <option value="">Select a Flag</option>
                                {userStats && Object.keys(userStats.flags).map(key => (
                                <option key={key} value={key}>{key}</option>
                                ))}
                            </select>

                            <Button
                                onClick={handleSetFlagTrue}
                                size="tiny"
                                disabled={!selectedFlag}
                            >
                                Set True
                            </Button>
                        </div>

                        <div className='spacer' />

                        {/* Reset Controls */}
                        <div className="test-section">
                            <h6>Reset Controllers</h6>
                            <Button variant="transparent" size="tiny" onClick={handleResetFlags}>Reset Flags</Button>
                            <Button variant="transparent" size="tiny" onClick={handleResetCounters}>Reset Counters</Button>
                            <Button variant="danger" size="tiny" onClick={handleResetAll}>Reset All</Button>
                        </div>
                    </div>
                )}

            </div>
            <ChatBubble />
        </div >
    );
}

export default Achievements;
