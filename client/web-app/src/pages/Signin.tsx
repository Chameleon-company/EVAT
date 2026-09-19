import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Eye, EyeOff, KeyRound } from 'lucide-react';
import { UserContext } from '../context/user';
import { Banner } from '../components/Banner';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import logo from '../assets/logo.png';

type UserData = {
  id: string | number;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  mobile: string;
  createdAt: string;
  avatarURL: string;
  [key: string]: unknown;
};

type SigninErrorResponseType = null
  | 'internal'
  | 'credentials';

const API_URL = import.meta.env.VITE_API_URL;
const url = `${API_URL}/auth/login`;

function Signin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<SigninErrorResponseType>();
  const [submitting, setSubmitting] = useState(false);
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user) {
      navigate('/map');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);
    setSubmitting(true);

    // submit the login
    try {
      const response = await fetch(url, {
        method: 'POST',
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      //need to delete user data then reload it from api after sign in
      const data = await response.json();
      if (response.ok && data?.data) {
        let avatarURL = '';
        try {
          const profileRes = await fetch(`${API_URL}/profile/user-profile`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            avatarURL = profileData?.data?.avatarURL || '';
          }
        } catch {
          // Fall back gracefully if profile extra details fail
        }

        const rawUser = data.data.user || {};
        const safeUserData: UserData = {
          id: rawUser.id || rawUser._id || '',
          email: rawUser.email || '',
          firstName: rawUser.firstName || '',
          lastName: rawUser.lastName || '',
          fullName:
            rawUser.fullName ||
            `${rawUser.firstName || ''} ${rawUser.lastName || ''}`.trim(),
          mobile: rawUser.mobile || '',
          createdAt: rawUser.createdAt || '',
          avatarURL: avatarURL || rawUser.avatarURL || '',
        };

        // Update context and localStorage
        setUser(safeUserData);
        localStorage.setItem('currentUser', JSON.stringify(safeUserData));
        // Navigate to map page after successful login
        navigate('/map');
      }
      else {
        setError('credentials');
        // setError('User does not exist or incorrect password.');
      }
    }
    catch (err) {
      console.error('Error signing in:', err);
      setError('internal');
      // setError('An unexpected error occurred. Please contact this number to resolve: +61 123 456 789.');
    }
    finally {
      setPassword('');
      setSubmitting(false);
    }
  };

  
  //UI Rendering
  return (
    <div
      className="
        flex min-h-full flex-col justify-center
        px-2 py-12 sm:px-6 lg:px-8
      "
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          alt="EVAT"
          src={logo}
          className="mx-auto h-16 w-auto md:h-24"
        />
        <h2 className="mt-8 text-center text-2xl/9 font-bold tracking-tight text-surface-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-120">
        { typeof error === 'string' && error.trim().length > 0 && 
          <div className="pointer-events-none sm:flex sm:justify-center sm:px-6 sm:pb-5 lg:px-8">
            <Banner
              className="sm:w-full sm:max-w-120"
              type="error"
              onDismiss={() => setError(null)}
            >
              { error === 'credentials' && 'Invalid email address or password.' }
              { error === 'internal' && 'An internal server error occured, please try again later.' }
            </Banner>
          </div>
        }
        <div className="bg-background px-6 py-12 border border-surface-200 sm:rounded-lg sm:px-12">
          <form action="javascript:;" className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm/6 font-medium text-surface-900">
                Email address
              </label>
              <div className="relative mt-2">
                <Mail className="absolute left-2 top-1/2 size-5 -mt-2.5 text-surface-300" />

                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="pl-10"
                  placeholder="Enter your email address"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm/6 font-medium text-surface-900">
                Password
              </label>
              <div className="relative mt-2">
                <KeyRound className="absolute left-2 top-1/2 size-5 -mt-2.5 text-surface-300" />

                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="pl-10"
                  placeholder="Enter your password"
                  onChange={e => setPassword(e.target.value)}
                />
                
                <span
                  className="absolute right-2 top-1/2 size-5 -mt-2.5 text-surface-700 transition-colors hover:text-surface-900"
                  onClick={() => setShowPassword(!showPassword)}
                  role="button"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </span>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full"
                loading={submitting}
                loadingLabel='Please wait...'
              >
                Sign in
              </Button>
            </div>
          </form>
        </div>

        <div className="flex justify-center w-full mt-8 gap-x-1.5 text-sm/6 text-surface-600">
          Not a member?
          <button
            type="button"
            className="
              inline-flex
              font-medium
              cursor-pointer
              transition-colors
              border-b border-indigo-600
              text-indigo-600
              hover:border-indigo-500
              hover:text-indigo-500
            "
            onClick={() => navigate('/signup')}
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}

export default Signin;
