import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';
import profileImage from '../assets/profileImage.png';

function NavBar() {
    const navigate = useNavigate();
    const location = useLocation();

    const [menuOpen, setMenuOpen] = useState(false);

    // Highlight active button
    const isActive = (path) => location.pathname === path;

    // Handle navigation + close mobile menu
    const handleNavigate = (path, options = {}) => {
        navigate(path, options);
        setMenuOpen(false);
    };

    return (
        <nav className="navbar">
            <div className="left-navbar">
                <img src={logo} alt="Logo" className="logo-navbar" />
                <h5 className='title-navbar'>Electric Vehicle Adoption Tool</h5>
            </div>

            {/* Mobile menu button */}
            <button 
                className="mobile-menu-btn"
                onClick={() => setMenuOpen(!menuOpen)}
            >
                ☰
            </button>

            <div className={`right-navbar ${menuOpen ? 'open' : ''}`}>
                <div className="nav-links">
                    
                    <button 
                        className={`btn btn-navbar ${isActive('/profile') ? 'active' : ''}`} 
                        onClick={() => handleNavigate('/profile', { state: { resetDashboard: true } })}
                    >
                        My Dashboard
                    </button>

                    <button 
                        className={`btn btn-navbar ${isActive('/map') ? 'active' : ''}`} 
                        onClick={() => handleNavigate('/map')}
                    >
                        Map
                    </button>

                    <button 
                        className={`btn btn-navbar ${isActive('/favourites') ? 'active' : ''}`} 
                        onClick={() => handleNavigate('/favourites')}
                    >
                        Favourites
                    </button>

                    <button 
                        className={`btn btn-navbar ${isActive('/game') ? 'active' : ''}`} 
                        onClick={() => handleNavigate('/game')}
                    >
                        Rewards
                    </button>

                    <button 
                        className={`btn btn-navbar ${isActive('/cost') ? 'active' : ''}`} 
                        onClick={() => handleNavigate('/cost')}
                    >
                        Vehicle Analysis
                    </button>

                    <button 
                        className={`btn btn-navbar ${isActive('/feedback') ? 'active' : ''}`} 
                        onClick={() => handleNavigate('/feedback')}
                    >
                        Feedback
                    </button>

                    <button 
                        className={`btn btn-navbar ${isActive('/support') ? 'active' : ''}`} 
                        onClick={() => handleNavigate('/support')}
                    >
                        Contact Support
                    </button>

                </div>

                <img src={profileImage} alt="Profile" className="icon-navbar middle" />
            </div>
        </nav>
    );
}

export default NavBar;