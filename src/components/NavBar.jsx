
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';
import { Menu, LogOut} from "lucide-react";

function NavBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [mainMenu, setMainMenuOpen] = useState(false);
    const [devMenu, setDevMenuOpen] = useState(false);
    const isDev = import.meta.env.DEV; // check if in dev mode

    const user = JSON.parse(localStorage.getItem("currentUser"));
    
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
                                <button className='dropdown-item' onClick={() => navigate('/cost')}>
                                    Cost Comparison
                                </button>
                                <button className='dropdown-item' onClick={() => navigate('/favourites')}>
                                    Favourite Chargers
                                </button>
                                <button className='dropdown-item' onClick={() => navigate('/game')}>
                                    Rewards
                                </button>
                                <hr></hr>
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
                                            <button className='dropdown-item' onClick={() => navigate('/apitester')}>
                                                API Tester
                                            </button>
                                            <button className='dropdown-item' onClick={() => navigate('/voice-query')}>
                                                Voice Query
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
            <div className="right-navbar">
                <img 
                    src={`${user.avatarURL}`} 
                    alt={user.avatarURL}
                    className="icon-navbar middle" 
                    onClick={() => navigate('/profile')}
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


