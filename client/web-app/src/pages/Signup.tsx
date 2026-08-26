import { useState, type ChangeEvent, type SubmitEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Eye, EyeOff, KeyRound, User, Phone } from 'lucide-react';
import { Banner } from '../components/Banner';
import { Input } from '../components/Input';

const API_URL = import.meta.env.VITE_API_URL;
const url = `${API_URL}/auth/register`;

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password: string;
  passwordConfirmation: string;
};

type ValidationErrors = Omit<Record<keyof FormData, string>, 'passwordConfirmation'>;

type RegisterResponse = {
  message?: string;
};

const initialForm: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  mobile: '',
  password: '',
  passwordConfirmation: '',
};

const initialValidationErrors: ValidationErrors = {
  firstName: '',
  lastName: '',
  email: '',
  mobile: '',
  password: '',
};

function Signup() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] =
    useState<ValidationErrors>(initialValidationErrors);

  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const field = name as keyof FormData;

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrorMessage('');

    setValidationErrors((prev) => ({
      ...prev,
      [field]: '',
    }));
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = { ...initialValidationErrors };
    let isValid = true;

    if (
      form.firstName.trim().length < 1 ||
      form.firstName.trim().length > 40
    ) {
      errors.firstName =
        'Given name must be at least 1 character and no more than 40 characters.';
      isValid = false;
    }

    if (
      form.lastName.trim().length < 1 ||
      form.lastName.trim().length > 40
    ) {
      errors.lastName =
        'Surname must be at least 1 character and no more than 40 characters.';
      isValid = false;
    }

    if (form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
      isValid = false;
    }
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      errors.password =
        'Password must contain uppercase, lowercase, and number.';
      isValid = false;
    }
    else if (form.password !== form.passwordConfirmation) {
      errors.password =
        'Password confirmation does not match.';
      isValid = false;
    }

    setValidationErrors(errors);

    return isValid;
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          mobile: form.mobile,
        }),
      });

      const data: RegisterResponse = await response.json();

      if (response.ok) {
        alert(
          `Sign Up successful: ${data.message}, welcome ${form.firstName}`,
        );
        navigate('/signin');
      } else {
        setErrorMessage(data.message || 'Sign up failed');
      }
    }
    catch (err) {
      console.error('Error signing up:', err);
      setErrorMessage('internal')
      // if (err instanceof TypeError && err.message.includes('fetch')) {
      //   setErrorMessage(
      //     'Cannot connect to server. Please check if the backend is running and VITE_API_URL is configured correctly.',
      //   );
      // } else if (err instanceof Error) {
      //   setErrorMessage(
      //     `An unexpected error occurred: ${err.message || 'Network error'}`,
      //   );
      // } else {
      //   setErrorMessage('An unexpected error occurred');
      // }
    }
    finally {
      setSubmitting(false);
    }
  };

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
          Create a new account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-120">
        { typeof errorMessage === 'string' && errorMessage.trim().length > 0 && 
          <Banner
            className="sm:w-full sm:max-w-120"
            type="error"  
            onDismiss={() => setErrorMessage(null)}
          >
            { errorMessage.includes('@') && errorMessage.includes('already exist')
              ? 'An account with that email already exists.'
              : 'An internal server error occured, please try again later.'
            }
          </Banner>
        }
        <div className="bg-white px-6 py-12 border border-surface-200 sm:rounded-lg sm:px-12">
          <form action="javascript:;" className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="first-name" className="block text-sm/6 font-medium text-gray-900">
                Given name
              </label>
              <div className="relative mt-2">
                <User className="absolute left-2 top-1/2 size-5 -mt-2.5 text-gray-300" />

                <Input
                  id="first-name"
                  name="firstName"
                  type="text"
                  required
                  autoComplete="given-name"
                  className="pl-10"
                  placeholder="Enter your first name"
                  value={form.firstName}
                  onChange={handleChange}
                  hasError={!!validationErrors.firstName}
                />
              </div>
              {validationErrors.firstName &&
                <p className="mt-px text-sm/6 text-danger">
                  {validationErrors.firstName}
                </p>
              }
            </div>
            
            <div>
              <label htmlFor="last-name" className="block text-sm/6 font-medium text-gray-900">
                Surname
              </label>
              <div className="relative mt-2">
                <User className="absolute left-2 top-1/2 size-5 -mt-2.5 text-gray-300" />

                <Input
                  id="last-name"
                  name="lastName"
                  type="text"
                  required
                  autoComplete="family-name"
                  className="pl-10"
                  placeholder="Enter your last name"
                  value={form.lastName}
                  onChange={handleChange}
                  hasError={!!validationErrors.lastName}
                />
              </div>
              {validationErrors.lastName &&
                <p className="mt-px text-sm/6 text-danger">
                  {validationErrors.lastName}
                </p>
              }
            </div>
            
            <div>
              <label htmlFor="mobile" className="block text-sm/6 font-medium text-gray-900">
                Mobile number
              </label>
              <div className="relative mt-2">
                <Phone className="absolute left-2 top-1/2 size-5 -mt-2.5 text-gray-300" />

                <Input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  required
                  autoComplete="tel"
                  className="pl-10"
                  placeholder="Enter your mobile number, e.g. 0412 345 678"
                  pattern="04\d{8}"
                  value={form.mobile}
                  onChange={handleChange}
                  hasError={!!validationErrors.mobile}
                />
              </div>
              {validationErrors.mobile &&
                <p className="mt-px text-sm/6 text-danger">
                  {validationErrors.mobile}
                </p>
              }
            </div>

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
                  value={form.email}
                  onChange={handleChange}
                  hasError={!!validationErrors.email}
                />
              </div>
              {validationErrors.email &&
                <p className="mt-px text-sm/6 text-danger">
                  {validationErrors.email}
                </p>
              }
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
                  className="pl-10"
                  placeholder="Enter a password"
                  value={form.password}
                  onChange={handleChange}
                  hasError={!!validationErrors.password}
                />
                
                <span
                  className="absolute right-2 top-1/2 size-5 -mt-2.5 text-gray-700 transition-colors hover:text-gray-900"
                  onClick={() => setShowPassword(!showPassword)}
                  role="button"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </span>
              </div>
              {validationErrors.password &&
                <p className="mt-px text-sm/6 text-danger">
                  {validationErrors.password}
                </p>
              }
            </div>

            <div>
              <label htmlFor="password-confirmation" className="block text-sm/6 font-medium text-gray-900">
                Confirm password
              </label>
              <div className="relative mt-2">
                <KeyRound className="absolute left-2 top-1/2 size-5 -mt-2.5 text-gray-300" />

                <Input
                  id="password-confirmation"
                  name="passwordConfirmation"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="pl-10"
                  placeholder="Confirm your password"
                  value={form.passwordConfirmation}
                  onChange={handleChange}
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
                {submitting ? 'Please wait...' : 'Sign up'}
              </button>
            </div>
          </form>
        </div>

        <div className="flex justify-center w-full mt-8 gap-x-1.5 text-sm/6 text-gray-600">
          Already a member?
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
            onClick={() => navigate('/signin')}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>

    // <label className='form-label required'>First Name</label>
    //   <div className='icon-inside-input'>
    //     <User className="input-icon" />
    //     <input
    //       className="input"
    //       type="text"
    //       name="firstName"
    //       placeholder="First Name"
    //       value={form.firstName}
    //       onChange={handleChange}
    //     />
    //   </div>
    //   <div className="spacer-small">  </div>
    //   {validationErrors.firstName && <ErrorMessage error={validationErrors.firstName}/>}

    //   <label className='form-label required'>Last Name</label>
    //   <div className='icon-inside-input'>
    //     <User className="input-icon" />
    //     <input
    //       className="input"
    //       type="text"
    //       name="lastName"
    //       placeholder="Last Name"
    //       value={form.lastName}
    //       onChange={handleChange}
    //     />
    //   </div>
    //   <div className="spacer-small">  </div>
    //   {validationErrors.lastName && <ErrorMessage error={validationErrors.lastName}/>}

    //   <label className='form-label required'>Mobile Number</label>
    //   <div className='icon-inside-input'>
    //     <Phone className="input-icon" />
    //     <input
    //       className="input"
    //       type="tel"
    //       name="mobile"
    //       placeholder="04XXXXXXXX"
    //       value={form.mobile}
    //       onChange={handleChange}
    //     />
    //   </div>
    //   <div className="spacer-small">  </div>
    //   {validationErrors.mobile && <ErrorMessage error={validationErrors.mobile}/>}

    //   <label className='form-label required'>Email</label>
    //   <div className='icon-inside-input'>
    //     <Mail className="input-icon"/>
    //     <input
    //       className="input"
    //       name="email"
    //       type="email"
    //       placeholder="Email"
    //       value={form.email}
    //       onChange={handleChange}
    //     />
    //   </div>
    //   <div className="spacer-small">  </div>
    //   {validationErrors.email && <ErrorMessage error={validationErrors.email}/>}

    //   <label className='form-label required'>Password</label>
    //   <div className='icon-inside-input'>
    //     <KeyRound className="input-icon" />
    //     <input
    //       className="input"
    //       type={showPassword ? 'text' : 'password'}
    //       name="password"
    //       placeholder="Minimum 8 characters"
    //       value={form.password}
    //       onChange={handleChange}
    //     />
    //     <span
    //       className="input-icon-end"
    //       onClick={() => setShowPassword(!showPassword)}
    //       style={{ cursor: 'pointer' }}
    //     >
    //       {showPassword ? <EyeOff /> : <Eye />}
    //     </span>
    //   </div>
    //   <div className="spacer-small">  </div>
    //   {validationErrors.password && <ErrorMessage error={validationErrors.password}/>}

    //   <div className="spacer-small">  </div>
    //   <button 
    //     type="submit" 
    //     className="btn btn-primary"
    //   >
    //     CREATE ACCOUNT
    //   </button>
    //   <button
    //     type='button'
    //     className="btn btn-transparent"
    //     onClick={() => navigate('/')}
    //   >
    //     BACK TO SIGN IN
    //   </button>
  );
}

export default Signup;
