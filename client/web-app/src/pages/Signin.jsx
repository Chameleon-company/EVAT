import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Eye, EyeOff, KeyRound, User as UserIcon } from 'lucide-react';
import { UserContext } from '../context/user';
import ErrorMessage from '../components/ErrorMessage'
import SuccessMessage from '../components/SuccessMessage'

import '../styles/Root.css';
import '../styles/Buttons.css';
import '../styles/Elements.css';
import '../styles/Fonts.css';
import '../styles/Forms.css';
import '../styles/NavBar.css';
import '../styles/Sidebar.css';
import '../styles/Tables.css';
import '../styles/Validation.css';

import logo from '../assets/logo.png';

const API_URL = import.meta.env.VITE_API_URL;
const url = `${API_URL}/auth/login`;
const jwtUrl = `${API_URL}/auth/jwt-login`;

function Signin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [isEmailEmpty, setIsEmailEmpty] = useState(false);
  const [isPasswordEmpty, setIsPasswordEmpty] = useState(false);

  const handleValidation = (e) => {
    e.preventDefault();

    const isEmailEmpty = email.trim() === '';
    const isPasswordEmpty = password.trim() === '';

    setIsEmailEmpty(isEmailEmpty);
    setIsPasswordEmpty(isPasswordEmpty);
    setError(null); // Clear previous errors

    if (!isEmailEmpty && !isPasswordEmpty) {
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitted(true); //to indicate the form is now submitting

    // submit the login
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      //need to delete user data then reload it from api after sign in
      const data = await response.json();
      if (response.ok) {
        // Extract access token from possibly nested structure
        const accessToken =
          data?.data?.accessToken?.accessToken || data?.data?.accessToken;

        if (!accessToken) {
          setError('Login succeeded but no access token was returned.');
          setSubmitted(false);
          return;
        }

        // Fetch detailed profile
        const profileRes = await fetch(`${API_URL}/profile/user-profile`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!profileRes.ok)
          throw new Error("Failed to fetch user profile details");
        const profileData = await profileRes.json();

        // Construct user data with token included
        const userData = {
          ...(data?.data?.user || {}),
          fullName: data?.data?.user?.fullName || 
                    `${data?.data?.user?.firstName || ''} ${data?.data?.user?.lastName || ''}`.trim(),
          mobile: data?.data?.user?.mobile,
          token: accessToken,
          createdAt: data?.data?.user?.createdAt,
          avatarURL: profileData?.data?.avatarURL,
        };

        // Update context and localStorage
        setUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        // Navigate to map page after successful login
        navigate('/map');
      } else {
        setError('User does not exist or incorrect password.');
      }
    } catch (err) {
      console.error('Error signing in:', err);
      setError('An unexpected error occurred. Please contact this number to resolve: +61 123 456 789.');
    } finally {
      setSubmitted(false);
    }
  };

  useEffect(() => {
    console.log("JWT auto-login effect running");

    // Fire the request blindly, the browser will automatically attach the HttpOnly cookie
    fetch(jwtUrl, {
        method: "POST",
        credentials: 'include', 
        headers: { 'Content-Type': 'application/json' },
    })
        .then(res => {
            if (!res.ok) throw new Error("Session expired or invalid");
            return res.json();
        })
        .then(data => {
            console.log("JWT login response:", data);
            if (data.data?.user) {
                // Read safe user data from local storage to keep names/avatars
                const storedUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
                
                // Navigate to map without needing to manually save a token string
                navigate("/map");
            }
        })
        .catch(err => {
            console.error("JWT login error:", err);
            // clear safe user data if the cookie is expired
            localStorage.removeItem("currentUser"); 
        });
  }, []);
  
  //UI Rendering
  return (
    <div className="container vertical center">
      <img src={logo} alt="EV Adoption Tool" className="logo-image" />

      <form onSubmit={handleValidation} className="form-section signin-width">
        {/* Submit Error and Success Messages */}
        {error && <ErrorMessage error={error}/>}
        {submitted && <SuccessMessage message='Signup successful!'/>}
        <div className="spacer-small">  </div>

        {/* Enter Email */}
        <label className='form-label required'>Email</label>
        <div className='icon-inside-input'>
          <Mail className="input-icon" />
          <input
            className="input"
            type="text"
            name="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="spacer-small">  </div>
        {/* Email Error Message */}
        {isEmailEmpty && <ErrorMessage error="Email is required."/>}

        {/* Enter Password */}
        <label className='form-label required'>Password</label>
        <div className='icon-inside-input'>
          <KeyRound className="input-icon" />
          <input
            className="input"
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <span
            className="input-icon-end"
            onClick={() => setShowPassword(!showPassword)}
            role="button"
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </span>
        </div>
        <div className="spacer-small">  </div>
        {/* Password Error Message */}
        {isPasswordEmpty && <ErrorMessage error="Password is required."/>}


        <div className="spacer-small">  </div>
        <button 
          type='submit'
          className="btn btn-primary" 
          disabled={submitted}
        >
          {submitted ? "Signing In..." : "SIGN IN"}
        </button>
        <button
          type='button'
          className="btn btn-primary"
          onClick={() => navigate('/signup')}
        >
          CREATE NEW ACCOUNT
        </button>

      </form>

    </div>
  );
}

export default Signin;
