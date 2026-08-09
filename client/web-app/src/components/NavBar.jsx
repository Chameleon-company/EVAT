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

    const handleNavigate = (path) => {
    navigate(path);
    setMainMenuOpen(false);
    setDevMenuOpen(false);
    };


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
                                <button className={`dropdown-item ${isActive('/profile') ? 'dropdown-item-active' : ''}`} 
                                onClick={() => handleNavigate('/profile')}
                                >
                                    Profile
                                </button>
                                <button className={`dropdown-item ${isActive('/map') ? 'dropdown-item-active' : ''}`} 
                                onClick={() => handleNavigate('/map')}>
                                    Map
                                </button>
                                <button className={`dropdown-item ${isActive('/dashboard') ? 'dropdown-item-active' : ''}`} 
                                onClick={() => handleNavigate('/dashboard')}>
                                    Dashboard
                                </button>
                                <button className={`dropdown-item ${isActive('/favourites') ? 'dropdown-item-active' : ''}`} 
                                onClick={() => handleNavigate('/favourites')}>
                                    Favourite Chargers
                                </button>
                                <button className={`dropdown-item ${isActive('/game') ? 'dropdown-item-active' : ''}`} 
                                onClick={() => handleNavigate('/game')}>
                                    Rewards
                                </button>
                                <button className={`dropdown-item ${isActive('/feedback') ? 'dropdown-item-active' : ''}`} 
                                onClick={() => handleNavigate('/feedback')}>
                                    Feedback
                                </button>
                                <button className={`dropdown-item ${isActive('/support') ? 'dropdown-item-active' : ''}`} 
                                onClick={() => handleNavigate('/support')}>
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
                                            <button className= {`dropdown-item ${isActive('/use-case') ? 'dropdown-item-active' : ''}`}
                                            onClick={() => handleNavigate('/use-cases')}>
                                                Use Case Dashboard
                                            </button>
                                            <button className={`dropdown-item ${isActive('/apitester') ? 'dropdown-item-active' : ''}`} 
                                            onClick={() => handleNavigate('/apitester')}>
                                                API Tester
                                            </button>
                                            <button className={`dropdown-item ${isActive('/voice-query') ? 'dropdown-item-active' : ''}`} 
                                            onClick={() => handleNavigate('/voice-query')}>
                                                Voice Query
                                            </button>
                                            <button className={`dropdown-item ${isActive('/cost-comparison') ? 'dropdown-item-active' : ''}`}
                                            onClick={() => handleNavigate('/cost-comparison')}>
                                                Cost Comparison
                                            </button>
                                            <button className={`dropdown-item ${isActive('/environmental-impact') ? 'dropdown-item-active' : ''}`}
                                            onClick={() => handleNavigate('/environmental-impact')}>
                                                Environmental Impact
                                            </button>
                                            <button className={`dropdown-item ${isActive('/demand-forecasting') ? 'dropdown-item-active' : ''}`}
                                            onClick={() => handleNavigate('/demand-forecasting')}>
                                                Demand Forecasting
                                            </button>
                                            <button className={`dropdown-item ${isActive('/price-prediction') ? 'dropdown-item-active' : ''}`}
                                            onClick={() => handleNavigate('/price-prediction')}>
                                              Price Prediction
                                              </button>
                                              <button className={`dropdown-item ${isActive('/congestion-prediction') ? 'dropdown-item-active' : ''}`}
                                              onClick={() => handleNavigate('/congestion-prediction')}>
                                                Congestion Prediction
                                                </button>
                                            <button className={`dropdown-item ${isActive('/weather-routing') ? 'dropdown-item-active' : ''}`}
                                            onClick={() => handleNavigate('/weather-routing')}>
                                                Weather Routing
                                            </button>
                                            <button className={`dropdown-item ${isActive('/chatbot') ? 'dropdown-item-active' : ''}`}
                                            onClick={() => handleNavigate('/chatbot')}>
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
                    onClick={() => handleNavigate('/map')}
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


