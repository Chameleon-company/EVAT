import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Eye, EyeOff, KeyRound } from 'lucide-react';
import { UserContext } from '../context/user';
import { Banner } from '../components/Banner';
import { Input } from '../components/Input';

type UserData = {
  id: string | number;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  mobile: string;
  token: string;
  createdAt: string;
  avatarURL: string;
  [key: string]: unknown;
};
type SigninResponseType = {
  accessToken: string | { accessToken: string };
  user?: Partial<UserData>;
  [key: string]: unknown;
};
type SigninErrorResponseType = null
  | 'internal'
  | 'credentials';

const API_URL = import.meta.env.VITE_API_URL;
const url = `${API_URL}/auth/login`;
const jwtUrl = `${API_URL}/auth/jwt-login`;

function Signin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<SigninErrorResponseType>();
  const [submitting, setSubmitting] = useState(false);
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();
  
  const _extractAccessToken = (parsed: SigninResponseType): string => {
    if (typeof parsed.accessToken === 'string') {
      return parsed.accessToken;
    }
    if (typeof parsed.accessToken === 'object' && parsed.accessToken !== null && 'accessToken' in parsed.accessToken) {
      return (parsed.accessToken as { accessToken: string }).accessToken;
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);
    setSubmitting(true);

    // submit the login
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      //need to delete user data then reload it from api after sign in
      const data = await response.json();
      if (response.ok && data?.data) {
        const parsed: SigninResponseType = {
          accessToken: '',
          ...data.data,
        };

        // TS-safe way to extract access token from possibly nested structure
        const accessToken = _extractAccessToken(parsed);

        if (accessToken.trim() === '') {
          throw new Error('Invalid access token returned from the server!');
        }

        // Fetch detailed profile
        const profileRes = await fetch(`${API_URL}/profile/user-profile`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!profileRes.ok) {
          throw new Error('Failed to fetch user profile details');
        }
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

  useEffect(() => { // useEffect should run on page load
    // console.log('JWT auto-login effect running');

    const userData = localStorage.getItem('currentUser');
    if (!userData) return; // if no user, do nothing (stay on login page)

    let parsedUser;
    try {
      parsedUser = JSON.parse(userData);
    } catch (e) {
      // console.error('Invalid user JSON', e);
      return;
    }

    const { token } = parsedUser; // access the token of user JSON
    if (!token) return; // if no token, do nothing

    (async () => {
      const res = await fetch(jwtUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      try {
        const data = await res.json();
        // console.log('JWT login response:', data);
        if (data.data?.accessToken) {
          parsedUser.token = data.data.accessToken;
          // update accessToken if it had to be updated
          localStorage.setItem('currentUser', JSON.stringify(parsedUser));
          // redirect to map
          navigate('/map');
        }
      }
      catch (err) {
        console.error('JWT login error: ', err);
      };
    })();
  });
  
  //UI Rendering
  return (
    <div
      className="
        flex min-h-full flex-col justify-center
        bg-gray-50
        px-2 py-12 sm:px-6 lg:px-8
      "
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          alt="Your Company"
          src="../src/assets/logo.png"
          className="mx-auto h-16 w-auto md:h-24"
        />
        <h2 className="mt-8 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-120">
        { typeof error === 'string' && error.trim().length > 0 && 
          <Banner
            className="sm:w-full sm:max-w-120"
            type="error"
            onDismiss={() => setError(null)}
          >
            { error === 'credentials' && 'Invalid email address or password.' }
            { error === 'internal' && 'An internal server error occured, please try again later.' }
          </Banner>
        }
        <div className="bg-white px-6 py-12 border border-surface-200 sm:rounded-lg sm:px-12">
          <form action="javascript:;" className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900">
                Email address
              </label>
              <div className="relative mt-2">
                <Mail className="absolute left-2 top-1/2 size-5 -mt-2.5 text-gray-300" />

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
              <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900">
                Password
              </label>
              <div className="relative mt-2">
                <KeyRound className="absolute left-2 top-1/2 size-5 -mt-2.5 text-gray-300" />

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
                  className="absolute right-2 top-1/2 size-5 -mt-2.5 text-gray-700 transition-colors hover:text-gray-900"
                  onClick={() => setShowPassword(!showPassword)}
                  role="button"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </span>
              </div>
            </div>

            <div>
              <button 
                type="submit"
                className="
                  flex w-full justify-center
                  rounded-md
                  bg-indigo-600
                  px-3 py-1.5
                  text-sm/6 font-semibold text-white
                  shadow-xs
                  hover:bg-indigo-500
                  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600
                  disabled:opacity-50
                  disabled:hover:bg-indigo-600
                  disabled:cursor-not-allowed!
                "
                disabled={submitting}
              >
                {submitting ? 'Please wait...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>

        <div className="flex justify-center w-full mt-8 gap-x-1.5 text-sm/6 text-gray-600">
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
