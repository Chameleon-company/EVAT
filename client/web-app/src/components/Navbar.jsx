
import React, { useState, useEffect, useRef, useContext } from 'react';
import { UserContext } from "../context/user";
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';
import { Menu, LogOut} from "lucide-react";

function NavBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [mainMenu, setMainMenuOpen] = useState(false);
    const [devMenu, setDevMenuOpen] = useState(false);
    const isDev = import.meta.env.DEV; // check if in dev mode

    const { user, updateUser } = useContext(UserContext);
    
    // Handle Sign out
    const handleSignOut = () => {
        localStorage.removeItem("currentUser");
        navigate("/signin");
    };

    // Highlight active button
    const isActive = (path) => location.pathname === path;

    const toggleMainMenu = () => {
        setMainMenuOpen(!mainMenu);
        setDevMenuOpen(false);
    }

    const toggleDevMenu = () => {
        setDevMenuOpen(!devMenu);
        setMainMenuOpen(false);
    }

    return (
        <nav className="navbar">
            <div className="left-navbar">
                <div className='dropdown-wrapper'>
                    <div className='dropdown-container'>
                        {/* Main Menu Button */}
                        <button 
                            className='btn btn-navbar navbar-menu-option' 
                            onClick={toggleMainMenu}
                        >
                            {<Menu />}
                        </button>
                        {/* Main Menu Options */}
                        {mainMenu && (
                            <div className={`dropdown-list ${mainMenu ? 'show' : ''}`}>
                                <button className='dropdown-item' onClick={() => navigate('/profile')}>
                                    Profile
                                </button>
                                <button className='dropdown-item' onClick={() => navigate('/map')}>
                                    Map
                                </button>
                                <button className='dropdown-item' onClick={() => navigate('/dashboard')}>
                                    Dashboard
                                </button>
                                <button className='dropdown-item' onClick={() => navigate('/favourites')}>
                                    Favourite Chargers
                                </button>
                                <button className='dropdown-item' onClick={() => navigate('/game')}>
                                    Rewards
                                </button>
                                <button className='dropdown-item' onClick={() => navigate('/feedback')}>
                                    Feedback
                                </button>
                                <button className='dropdown-item' onClick={() => navigate('/support')}>
                                    Support
                                </button>
                            </div>
                        )}

                        {/* ==================== DEVELOPER MENU ==================== */}
                        {isDev && (
                            <>
                                <div className='dropdown-container'>
                                    {/* Developer Menu Button */}
                                    <button 
                                        className='btn btn-navbar navbar-menu-option' 
                                        onClick={toggleDevMenu}
                                    >
                                        Developer Pages
                                    </button>

                                    {/* Developer Menu Options */}
                                    {devMenu && (
                                        <div className={`dropdown-list ${devMenu ? 'show' : ''}`}>
                                            <button className='dropdown-item' onClick={() => navigate('/use-cases')}>
                                                Use Case Dashboard
                                            </button>
                                            <button className='dropdown-item' onClick={() => navigate('/apitester')}>
                                                API Tester
                                            </button>
                                            <button className='dropdown-item' onClick={() => navigate('/voice-query')}>
                                                Voice Query
                                            </button>
                                            <button className='dropdown-item' onClick={() => navigate('/cost-comparison')}>
                                                Cost Comparison
                                            </button>                                         \
                                            <button className='dropdown-item' onClick={() => navigate('/environmental-impact')}>
                                                Environmental Impact
                                            </button>
                                            <button className='dropdown-item' onClick={() => navigate('/demand-forecasting')}>
                                                Demand Forecasting
                                            </button>
                                            <button className='dropdown-item' onClick={() => navigate('/congestion-prediction')}>
                                                Congestion Prediction
                                            </button>
                                            <button className='dropdown-item' onClick={() => navigate('/weather-routing')}>
                                                Weather Routing
                                            </button>
                                            <button className='dropdown-item' onClick={() => navigate('/chatbot')}>
                                                Chatbot
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                        {/* ======================================================= */}

                         
                    </div>
                </div>
            </div>


            {/* Center Navbar */}
            <div className="center-navbar center" >
                <button 
                    // Change this navigation to /map when complete
                    className={`btn-navbar `} 
                    onClick={() => navigate('/map')}
                >
                    <img src={logo} alt="Logo" className="logo-navbar"/>
                    <h5 className='title-navbar'>Electric Vehicle Adoption Tool</h5>
                </button>
            </div>


            {/* Right Navbar */}
            {/* Right Navbar */}
            <div className="right-navbar">
                <img 
                    src={user?.avatarURL || "defaultProfilePictures/default-white.png"}
                    alt="User Avatar"
                    className="icon-navbar middle" 
                    onClick={() => navigate('/profile')}
                    key={user?.avatarURL}
                />
                <button 
                    alt="Sign Out"
                    className={`btn btn-navbar`} 
                    onClick={handleSignOut}
                ><LogOut/></button>
            </div>
        </nav>
    );
}

export default NavBar;


