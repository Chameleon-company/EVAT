// NOTE: For security reasons, card payment details are NOT stored in the backend.

// This section only saves card information locally in the browser.
// Full backend integration can be implemented
// in the future when actual payments need to be made.

import { useState, useEffect, useContext  } from 'react';
import { UserContext } from "../context/user";
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, House, KeyRound, CalendarDays, User, CreditCard, Phone, CircleUserRound, Car, BookText, LogOut, Pencil, Check, X, ArrowLeft } from 'lucide-react';
import NavBar from '../components/NavBar';
import ChatBubble from "../components/ChatBubble";
import BookingHistoryTable from "../components/BookingHistoryTable";
import EnvironmentalImpact from "../components/EnvironmentalImpact";
import ErrorMessage from '../components/ErrorMessage';
import SuccessMessage from '../components/SuccessMessage';
import ProfileAvatarTool from '../components/ProfileAvatarTool';
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
const RECENT_SUCCESS_MESSAGE_LINGER = 5000; // 5 seconds * 1000

function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  // Get user from Context
  const { user: contextUser, setUser: setContextUser, updateUser: updateContextUser } = useContext(UserContext);

  // Local editable copy for forms
  const [localUser, setLocalUser] = useState(null);
  const [originalUser, setOriginalUser] = useState(null);
  // Local state management
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("dashboard");
  const [editingCar, setEditingCar] = useState(false);
  const [editingPayment, setEditingPayment] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  const [history, setHistory] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  // New state for car dropdowns
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [allVehicles, setAllVehicles] = useState([]);
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);
  // Payment information
  const [paymentErrors, setPaymentErrors] = useState({});
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState("");
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
  // success and failure messages
  const [recentSuccess, setRecentSuccess] = useState(false);
  const [success, setSuccess] = useState('');
  // profile image tool
  const [showAvatarTool, setShowAvatarTool] = useState(false);
  // achievement information
  const [recentAchievements, setRecentAchievements] = useState([]);
  const [achievementsLoading, setAchievementsLoading] = useState(true);
  // user stats information
  const [userStats, setUserStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Sync context user and local user
  useEffect(() => {
    if (contextUser) {
      setLocalUser(contextUser);
    }
  }, [contextUser]);

  // format a given date
  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleChangeImage = () => {
    // display profile pic options that are provided by the app
    setShowAvatarTool(true);
  };

  // Reset tab to "dashboard" if user navigates back with reset flag
  useEffect(() => {
    if (location.pathname === "/profile" && location.state?.resetDashboard) {
      setActiveTab("dashboard");
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  // get token from context if available, otherwise get from local storage
  const token = contextUser?.token || JSON.parse(localStorage.getItem("currentUser"))?.token;

  // auto-clear the warning after 5 seconds
  useEffect(() => {
    if (isPaymentSuccess) {
      const timer = setTimeout(() => {
        setIsPaymentSuccess(false);
        setPaymentSuccessMessage(false);
      }, RECENT_SUCCESS_MESSAGE_LINGER);
      return () => clearTimeout(timer);
    }
  }, [isPaymentSuccess]);

  // Fetch user profile on load
  useEffect(() => {
    if (!token) {
      navigate("/signin");
      return;
    }

    const fetchUserProfile = async () => {
      try {
        // Fetch basic user profile (id, name, email, mobile, role)
        const authRes = await fetch(`${API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!authRes.ok) throw new Error("Failed to fetch auth profile");
        const authData = await authRes.json();

        // Fetch detailed profile (car model, favourite stations)
        const profileRes = await fetch(`${API_URL}/profile/user-profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!profileRes.ok)
          throw new Error("Failed to fetch user profile details");
        const profileData = await profileRes.json();

        // Normalize car for the UI
        let car = profileData?.data?.user_car_model ?? null;

        if (car && typeof car === "string") {
          // car is an ID - fetch full vehicle
          const vRes = await fetch(`${API_URL}/vehicle/${car}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (vRes.ok) {
            const v = await vRes.json();
            car = {
              ...v,
              id: v.id || v._id,
              year: v.year || v.model_release_year,
            };
          } else {
            car = null;
          }
        } else if (car && typeof car === "object") {
          // car is an object - normalize fields
          car = {
            ...car,
            id: car.id || car._id,
            year: car.year || car.model_release_year,
          };
        }

        const nextUser = {
          id: authData.data.id,
          firstName: authData.data.firstName || "",
          lastName: authData.data.lastName || "",
          email: authData.data.email || "",
          mobile: authData.data.mobile || "",
          role: authData.data.role || "",
          createdAt: authData.data.createdAt,
          car,
          favourites: profileData.data.favourite_stations || [],
          avatarURL: profileData.data.avatarURL,
          token: token,
        };

        setLocalUser(nextUser);
        setContextUser(nextUser);
      } catch (err) {
        console.error("Profile fetch error:", err);
        navigate("/signin");
      }
    };

    fetchUserProfile();
  }, [navigate, token]);

  // Fetch user stats when profile loads
  useEffect(() => {
    if (token) {
      fetchUserStats();
    }
  }, [token]);

  // Fetch user stats
  const fetchUserStats = async () => {
    if (!token) return;

    try {
      setStatsLoading(true);
      const res = await fetch(`${API_URL}/user-stats/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch stats");

      const data = await res.json();
      setUserStats(data.data || null);
    } catch (err) {
      console.error("Failed to fetch user stats:", err);
      setUserStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch recent achievements when profile loads
  useEffect(() => {
    if (token) {
      fetchRecentAchievements();
    }
  }, [token]);
  
  // Fetch recent achievements
  const fetchRecentAchievements = async () => {
    if (!token) return;

    try {
      setAchievementsLoading(true);
      const res = await fetch(`${API_URL}/achievements/me-recent?limit=6`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      setRecentAchievements(data.data || []);
    } catch (err) {
      console.error("Failed to fetch recent achievements:", err);
      setRecentAchievements([]);
    } finally {
      setAchievementsLoading(false);
    }
  };

  // Fetch vehicles when editing car OR when opening Environmental Impact tab
  useEffect(() => {
    if (editingCar || activeTab === "env-impact") {
      fetchAllVehicles();
    }
  }, [activeTab, editingCar, localUser?.token]);

  // Reusable function to load all vehicles
  const fetchAllVehicles = async () => {
    if (!localUser?.token || loadingVehicles) return;

    setLoadingVehicles(true);
    try {
      const res = await fetch(`${API_URL}/vehicle`, {
        headers: { Authorization: `Bearer ${localUser.token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch vehicles");

      const data = await res.json();
      const items = (data.data || []).map((v) => ({
        ...v,
        id: v.id || v._id,
        year: v.year || v.model_release_year,
      }));

      setAllVehicles(items);
      setMakes(["Select", ...new Set(items.map((v) => v.make))]);
    } catch (err) {
      console.error("Failed to load vehicles:", err);
    } finally {
      setLoadingVehicles(false);
    }
  };

  // Fetch all vehicles when editing starts (to populate dropdown list)
  useEffect(() => {
    if (localUser?.car?.make) {
      const filteredModels = allVehicles
        .filter((v) => v.make === localUser.car.make)
        .map((v) => v.model);
      setModels(["Select", ...new Set(filteredModels)]);

      if (localUser?.car?.model) {
        const filteredYears = allVehicles
          .filter((v) => v.make === localUser.car.make && v.model === localUser.car.model)
          .map((v) => v.year)
          .filter(Boolean);
        setYears(["Select", ...new Set(filteredYears.map(String))]);
      } else {
        setYears(["Select"]);
      }
    } else {
      setModels(["Select"]);
      setYears(["Select"]);
    }
  }, [localUser?.car?.make, localUser?.car?.model, allVehicles]);

  // Reset editing states when switching tabs
  useEffect(() => {
    if (activeTab !== "payment") setEditingPayment(false);
    if (activeTab !== "car") setEditingCar(false);
    if (activeTab !== "about") setEditingAbout(false);
  }, [activeTab]);

  const handleSignOut = () => {
    localStorage.removeItem("currentUser");
    navigate("/signin");
  };

  // To make sure mobile follows Au format
  const isValidMobile = (mobile) => {
    // Starts with 04 and has 10 digits total
    const regex = /^04\d{8}$/;
    return regex.test(mobile);
  };
  const validateAboutForm = () => {
    const newErrors = {};

    if (!localUser.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!localUser.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!localUser.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(localUser.email)) {
      newErrors.email = "Enter a valid email";
    }

    if (!localUser.mobile.trim()) {
      newErrors.mobile = "Phone number is required";
    } else if (!isValidMobile(localUser.mobile)) {
      newErrors.mobile = "Phone must start with 04 and be 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePaymentForm = () => {
    const errors = {};

    const cardNum = (localUser.cardNumber || "").replace(/\s+/g, "");
    if (!cardNum) {
      errors.cardNumber = "Card number is required";
    } else if (!/^\d{16}$/.test(cardNum)) {
      errors.cardNumber = "Card number must be 16 digits";
    }

    if (!localUser.expiryDate) {
      errors.expiryDate = "Expiry date is required";
    } else if (!/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(localUser.expiryDate)) {
      errors.expiryDate = "Expiry must be in MM/YY format";
    } else {
      const [mm, yy] = localUser.expiryDate.split("/").map(Number);
      const now = new Date();
      const currentYear = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;

      if (yy < currentYear || (yy === currentYear && mm < currentMonth)) {
        errors.expiryDate = "Card has expired";
      }
    }

    if (!localUser.cvv) {
      errors.cvv = "CVV is required";
    } else if (!/^\d{3}$/.test(localUser.cvv)) {
      errors.cvv = "CVV must be 3 digits";
    }

    if (!localUser.billingAddress) {
      errors.billingAddress = "Billing address is required";
    }

    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAbout = async () => {
    if (!validateAboutForm()) return;

    try {
      const payload = {
        id: localUser.id,
        email: localUser.email,
        firstName: localUser.firstName,
        lastName: localUser.lastName,
        mobile: localUser.mobile,
      };

      const response = await fetch(`${API_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localUser.token}`,
        },
        body: JSON.stringify(payload),
      });


      if (!response.ok) {
        toast.error(
          <div>
            Failed to update profile info
          </div>,
          { position: "top-center", autoClose: 2000, closeOnClick: true, draggable: true, closeButton: true, toastId: "profile-update-error" }
        );
        throw new Error("Failed to update profile info");
      }

      setEditingAbout(false);
      toast.success(
        <div>
          Profile information updated successfully!
        </div>,
        { position: "top-center", autoClose: 2000, closeOnClick: true, draggable: true, closeButton: true, toastId: "profile-update-success" }
      );
      setIsSuccess(true);
      setErrors({});

    } catch (err) {
      setSuccessMessage("");
      setIsSuccess(false);
      console.error(err);
      toast.error(
        <div>
          Failed to update profile: {err.message}
        </div>,
        { position: "top-center", autoClose: 2000, closeOnClick: true, draggable: true, closeButton: true, toastId: "profile-update-error" }
      );
    }
  };

  const handleSaveCar = async () => {
    try {
      const token = localUser?.token;

      let newErrors = {};

      if (localUser.car.make == "Select") {
        newErrors.carMake = "Please select a make";
      }

      if (localUser.car.model == "Select" || localUser.car.model === "") {
        newErrors.carModel = "Please select a model";
      }
      if (localUser.car.year == "Select" || localUser.car.year === "") {
        newErrors.carYear = "Please select a year";
      }
      setErrors(newErrors);

      // The car selected must exist in allVehicles (fro /api/vehicle)
      const selectedVehicle = allVehicles.find(
        (v) =>
          v.make === localUser.car?.make &&
          v.model === localUser.car?.model &&
          String(v.model_release_year || v.year) === String(localUser.car?.year)
      );

      if (!selectedVehicle) {
        toast.error(
          <div>
            Invalid vehicle selection
          </div>,
          { position: "top-center", autoClose: 2000, closeOnClick: true, draggable: true, closeButton: true, toastId: "vehicle-invalid-error" }
        );
        return;
      }

      const payload = {
        vehicleId: selectedVehicle.id, // API requires only this
      };

      const response = await fetch(`${API_URL}/profile/vehicle-model`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to update vehicle");

      const data = await response.json();

      // Update user state with the selected vehicle
      const normalizedCar = {
        ...selectedVehicle,
        id: selectedVehicle.id ?? selectedVehicle._id ?? vehicleId,
        year:
          selectedVehicle.year ?? selectedVehicle.model_release_year ?? null,
      };

      setLocalUser((prev) => {
        const next = { ...prev, car: normalizedCar };
        localStorage.setItem("currentUser", JSON.stringify(next));
        return next;
      });

      setEditingCar(false);
      toast.success(
        <div>
          Vehicle updated successfully!
        </div>,
        { position: "top-center", autoClose: 2000, closeOnClick: true, draggable: true, closeButton: true, toastId: "vehicle-update-success" }
      );
    } catch (err) {
      console.error(err);
      toast.error(
        <div>
          Failed to update vehicle: {err.message}
        </div>,
        { position: "top-center", autoClose: 2000, closeOnClick: true, draggable: true, closeButton: true, toastId: "vehicle-update-error" }
      );
    }
  };

  const handleSavePayment = () => {
    if (!validatePaymentForm()) return;

    const cardNum = (localUser.cardNumber || "").replace(/\s+/g, "");

    setLocalUser(prev => {
      const next = { ...prev, cardNumber: cardNum };
      localStorage.setItem("currentUser", JSON.stringify(next));
      return next;
    });

    setEditingPayment(false);
    setPaymentErrors({});
    setPaymentSuccessMessage("Payment information updated successfully!");
    setIsPaymentSuccess(true);

    // ✅ Auto-hide after 3 seconds
    setTimeout(() => {
      setPaymentSuccessMessage("");
      setIsPaymentSuccess(false);
    }, 3000);
  };

  // update avatar
    const handleAvatarChange = (newUrl) => {
        updateContextUser({ avatarURL: newUrl });
        setLocalUser(prev => ({ ...prev, avatarURL: newUrl }));
        setShowAvatarTool(false);
    };

  if (!localUser) return null;

  return (
    <div>
      <NavBar />
      {/* background */}
      <div className="background-image" />
      <div className='spacer' />
      <div className="container horizontal">
        {/* left container */}
        <div className="inner-left ">

          {/* Profile image */}
          <div className="profile-image-wrapper">
            <img 
              src={localUser.avatarURL || "defaultProfilePictures/default-white.png"} 
              alt="User Avatar"
              className="profile-image" 
            />
            {/* Edit profile image icon */} 
            <button className="edit-icon" onClick={handleChangeImage}>
              <Pencil />
            </button>

            {/* INSERT COMPONENT FOR CHOOSING PROFILE IMAGES */}
            <input
              id="fileInput"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files[0];
                // if (file) {
                //   setProfileImage(URL.createObjectURL(file));
                // }
              }}
            />
          </div>

          {/* Name */}
          <div className='h6 capitalize'>
            {editingAbout ? (
              <div className='icon-inside-input two-hundred-width'>
                <User className="input-icon" />
                <input
                  className="input"
                  type="text"
                  value={localUser.firstName || ""}
                  onChange={(e) => {
                    setLocalUser({ ...localUser, firstName: e.target.value });
                    setErrors({ ...errors, firstName: "" });
                  }}
                />
              </div>
            ) : (
              `${localUser.firstName === "true" ? "" : localUser.firstName}`
            )}
            {/* First Name Error Message  */}
            {errors.firstName && editingAbout && <ErrorMessage error={errors.firstName}/>}

            {editingAbout ? (
              <div className='icon-inside-input two-hundred-width'>
                <User className="input-icon" />
                <input
                  className="input"
                  type="text"
                  placeholder="Enter your last name"
                  value={localUser.lastName || ""}
                  onChange={(e) => {
                    setLocalUser({ ...localUser, lastName: e.target.value });
                    setErrors({ ...errors, lastName: "" });
                  }}
                />
              </div>
            ) : (
              ` ${localUser.lastName === "true" ? "" : localUser.lastName}`
            )}
            {/* Last Name Error Message  */}
            {errors.lastName && editingAbout && <ErrorMessage error={errors.lastName}/>}
          </div>

          {/* Email */}
          <div className='lowercase font-regular text-small'>
            <Mail size='14'/> {`${localUser.email === "true" ? "N/A" : localUser.email}`}
          </div>

          {/* Phone */}
          <div className='font-regular text-small'>
            {editingAbout ? (
              <div className='icon-inside-input two-hundred-width'>
                <Phone className="input-icon" />
                <input
                  className="input"
                  type="text"
                  value={localUser.mobile || ""}
                  placeholder="Enter your phone"
                  onChange={(e) => {
                    setLocalUser({ ...localUser, mobile: e.target.value });
                    setErrors({ ...errors, mobile: "" });
                  }}
                />
              </div>
            ) : (
              <>
                <Phone size='14'/> {` ${localUser.mobile === "true" ? "N/A" : localUser.mobile}`}
              </>
            )}
            {/* Mobile Error Message  */}
            {errors.mobile && editingAbout && <ErrorMessage error={errors.mobile}/>}
          </div>

          {/* Edit details button */}
          { (!editingAbout) && (
            <Button
              variant="transparent"
              size="tiny"
              className="one-hundred-25-width spread"
              onClick={() => {
                if (originalUser != null){
                  setLocalUser(originalUser); // reset the details in case other edits are in progress
                  setErrors({});
                }
                setEditingCar(false);         // stop car edit
                setEditingPayment(false);     // stop payment edit
                setOriginalUser(localUser);   // save the current values before editing
                setEditingAbout(true);        // enter edit details mode
              }}
            >
              <Pencil size='14'/>Edit Profile
            </Button>
          )}

          {/* Save details button */}
          { (editingAbout) && (
            <Button
              size="tiny"
              className="one-hundred-25-width spread uppercase"
              onClick={() => handleSaveAbout()}
            >
              <Check size='16'/> Save
            </Button>
          )}

          {/* Cancel edit detials button */}
          { (editingAbout) && (
            <Button
              variant="danger"
              size="tiny"
              className="one-hundred-25-width spread uppercase"
              onClick={() => {
                setEditingAbout(false);
                setLocalUser(originalUser);
                setErrors({});
              }}
            >
              <X size='16'/> CANCEL
            </Button>
          )}
          <div className='spacer' />


          <div className='h6 capitalize'>
            {`${localUser.car === "true" ? "" : "My Vehicle:"}`}
          </div>
          {/* Car Make */}
          <div className='font-regular text-small'>
            {editingCar ? (
              <select
                className="input two-hundred-width"
                value={localUser.car?.make || "Select"}
                onChange={(e) => {
                  setLocalUser({ ...localUser, car: { ...localUser.car, make: e.target.value, model: "", year: "" } });
                }}
              >
                {makes.map((make, idx) => (
                  <option key={idx} value={make}>
                    {make}
                  </option>
                ))}
              </select>
            ) : (
              `${localUser.car?.make === "true" ? "" : localUser.car?.make}`
            )}
            {/* Car Make Error Message  */}
            {errors.carMake && editingCar && <ErrorMessage error={errors.carMake}/>}
          </div>

          {/* Car model */}
          <div className='font-regular text-small'>
            {editingCar ? (
              <select
                className="input two-hundred-width"
                value={localUser.car?.model || "Select"}
                onChange={(e) => {
                  setLocalUser({...localUser, car: { ...localUser.car, model: e.target.value, year: "" }});
                  setErrors({ ...errors, carMake: "" });
                }}
              >
                {models.map((model, idx) => (
                  <option key={idx} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            ) : (
              `${localUser.car?.model === "true" ? "N/A" : localUser.car?.model}`
            )}
            {/* Car Model Error Message  */}
            {errors.carModel && editingCar && <ErrorMessage error={errors.carModel}/>}
          </div>

          {/* Car year */}
          <div className='font-regular text-small'>
            {editingCar ? (
              <select
                className="input two-hundred-width"
                value={String(localUser.car?.year) || "Select"}
                onChange={(e) =>
                  setLocalUser({ ...localUser, car: { ...localUser.car, year: e.target.value } })
                }
                
              >
                {years.map((year, idx) => (
                  <option key={idx} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            ) : (
              `${localUser.car?.year === "true" ? "N/A" : localUser.car?.year}`
            )}
            {/* Car Year Error Message  */}
            {errors.carYear && editingCar && <ErrorMessage error={errors.carYear}/>}
          </div>

          {/* Edit car button */}
          { (!editingCar) && (
            <Button
              variant="transparent"
              size="tiny"
              className="one-hundred-25-width spread"
              onClick={() => {
                if (originalUser != null){
                  setLocalUser(originalUser); // reset the details in case other edits are in progress
                  setErrors({});
                }
                setEditingAbout(false);       // stop details edit
                setEditingPayment(false);     // stop payment edit
                setOriginalUser(localUser);   // save the current values before editing
                setEditingCar(true);          // enter edit car mode
              }}
            >
              <Pencil size='14'/>Edit Vehcile
            </Button>
          )}

          {/* Save car button */}
          { (editingCar) && (
            <Button
              size="tiny"
              className="one-hundred-25-width spread uppercase"
              onClick={() => handleSaveCar()}
            >
              <Check size='16'/> Save
            </Button>
          )}

          {/* Cancel edit car button */}
          { (editingCar) && (
            <Button
              variant="danger"
              size="tiny"
              className="one-hundred-25-width spread uppercase"
              onClick={() => {
                setEditingCar(false);
                setLocalUser(originalUser);
                setErrors({});
              }}
            >
              <X size='16'/> CANCEL
            </Button>
          )}

          <div className='spacer' />
          
          {/* Other Buttons */}
          <Button size="tiny" className="one-hundred-50-width spread" onClick={() => setActiveTab("payment")}> <CreditCard /> Payment</Button>
          <Button size="tiny" className="one-hundred-50-width spread" onClick={() => setActiveTab("history")}> <BookText /> Booking History</Button>
          <Button size="tiny" className="one-hundred-50-width spread" onClick={() => setActiveTab("env-impact")}> Environmental Impact</Button>

          <div className='spacer' />
          <div className='font-regular text-tiny'>
            Joined: {formatDate(localUser.createdAt)}
          </div>
        </div>
        
        {/* center container - details*/}
        <div className="inner-center ">
          {activeTab === "dashboard" && (
            <>
              {/* Recent Unlocked Achievements */}
              <div className="recent-achievements-section">
                <div className="section-header">
                  <h5>Recent Unlocked Achievements</h5>
                  <button onClick={() => navigate("/achievements")} className="see-all-link">
                    (See full achievement list)
                  </button>
                </div>

                {achievementsLoading ? (
                  <p>Loading achievements...</p>
                ) : recentAchievements.length > 0 ? (
                  <div className="achievements-grid">   {/* 2-column grid */}
                    {recentAchievements.map((ach) => (
                      <div key={ach._id} className="achievement-card">
                        <div className="achievement-icon">
                          <img 
                            src={ach.icon || "/default-badge.png"} 
                            alt={ach.name}
                            className="achievement-icon-img"
                          />
                        </div>
                        <div className="achievement-info">
                          <h4>{ach.name}</h4>
                          <p className="achievement-description">{ach.description}</p>
                          
                          <div className="progress-container">
                            <div className="progress-bar">
                              <div className="progress-fill" style={{ width: "100%" }}></div>
                            </div>
                            <span className="completed-date">
                              Completed: {new Date(ach.unlockedAt).toLocaleDateString('en-AU')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>You haven't unlocked any achievements yet. Start charging or updating your profile!</p>
                )}
              </div>
              
              <div className='spacer' />

              {/* User Stats Section */}
              <div className="user-stats-section">
                <h3>Your Impact</h3>
                
                {statsLoading ? (
                  <p>Loading your stats...</p>
                ) : userStats ? (
                  <div className="stats-grid">
                    <div className="stat-card">
                      <strong>Total Charging Sessions: </strong>
                      <span>{userStats.counters.totalChargingSessions}</span>
                    </div>
                    
                    <div className="stat-card">
                      <strong>Total kWh Charged: </strong>
                      <span>{(userStats.counters.totalWhCharged / 1000).toFixed(1)}</span>
                    </div>

                    <div className="stat-card">
                      <strong>Total Distance Travelled: </strong>
                      <span>{(userStats.counters.totalMetresTravelled / 1000).toFixed(1)} km</span>
                    </div>

                    <div className="stat-card">
                      <strong>CO₂ Avoided: </strong>
                      <span>{userStats.counters.totalCO2KgAvoided} kg</span>
                    </div>

                    <div className="stat-card">
                      <strong>Petrol Savings: </strong>
                      <span>${(userStats.counters.totalPetrolSavingsCents / 100).toFixed(2)}</span>
                    </div>

                    <div className="stat-card">
                      <strong>Consecutive Login Days: </strong>
                      <span>{userStats.counters.consecutiveLoginDays} days</span>
                    </div>
                  </div>
                ) : (
                  <p>Unable to load stats.</p>
                )}
              </div>
            </>
          )}

          {/* Payment */}
          {activeTab === "payment" && (
            <div>
              <h3>Payment Information</h3>
              {/* CARD NUMBER */}
              <div className="input-and-label-same-line">
                <label className='form-label required'>Card: </label>
                {editingPayment ? (
                  <div className='icon-inside-input'>
                    <CreditCard className="input-icon" />
                    <input
                      className="input two-hundred-width"
                      type="text"
                      value={localUser.cardNumber || ""}
                      placeholder="1234 5678 9012 3456"
                      onChange={(e) => {
                        // Only digits, max 16
                        let val = e.target.value.replace(/\D/g, '').slice(0, 16);
                        // Add spaces every 4 digits for display
                        val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
                        setLocalUser({ ...localUser, cardNumber: val });
                        setPaymentErrors({ ...paymentErrors, cardNumber: "" });
                      }}
                    />
                  </div>
                ) : (
                  localUser.cardNumber
                    ? "**** **** **** " + localUser.cardNumber.replace(/\s/g, '').slice(-4)
                    : "**** **** **** 1234"
                )}
              </div>
              {/* Card Number Error Message  */}
              {paymentErrors.cardNumber && editingPayment && <ErrorMessage error={paymentErrors.cardNumber}/>}

              {/* EXPIRY DATE */}
              <div className="input-and-label-same-line">
                <label className='form-label required'>Expiry Date: </label>
                {editingPayment ? (
                  <div className='icon-inside-input'>
                    <CalendarDays className="input-icon" />
                    <input
                      className="input two-hundred-width"
                      type="text"
                      value={localUser.expiryDate || ""}
                      placeholder="MM/YY"
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '').slice(0, 4);        // digits only, max 4
                        if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2); // insert '/'
                        setLocalUser({ ...localUser, expiryDate: val });
                        setPaymentErrors({ ...paymentErrors, expiryDate: "" });
                      }}
                    />
                  </div>
                ) : (
                  localUser.expiryDate || "MM/YY"
                )}
              </div>
              {/* Card Expiry Error Message  */}
              {paymentErrors.expiryDate && editingPayment && <ErrorMessage error={paymentErrors.expiryDate}/>}

              {/* CVV */}
              <div className="input-and-label-same-line">
                <label className='form-label required'>CVV: </label>
                {editingPayment ? (
                  <div className='icon-inside-input'>
                    <KeyRound className="input-icon" />
                    <input
                      className="input two-hundred-width"
                      type="text"
                      value={localUser.cvv || ""}
                      placeholder="123"
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                        setLocalUser({ ...localUser, cvv: val });
                        setPaymentErrors({ ...paymentErrors, cvv: "" });
                      }}
                    />
                  </div>
                ) : (
                  "***"
                )}
              </div>
              {/* Card CVV Error Message  */}
              {paymentErrors.cvv && editingPayment && <ErrorMessage error={paymentErrors.cvv}/>}

              {/* BILLING ADDRESS */}
              <div className="input-and-label-same-line">
                <label className='form-label required'>Billing Address: </label>
                {editingPayment ? (
                  <div className='icon-inside-input'>
                    <House className="input-icon" />
                    <input
                      className="input two-hundred-width"
                      type="text"
                      value={localUser.billingAddress || ""}
                      placeholder="Enter your billing address"
                      onChange={(e) => {
                        setLocalUser({ ...localUser, billingAddress: e.target.value });
                        setPaymentErrors({ ...paymentErrors, billingAddress: "" });
                      }}
                    />
                  </div>
                ) : (
                  localUser.billingAddress || "N/A"
                )}
              </div>
              {/* Billing Address Error Message  */}
              {paymentErrors.billingAddress && editingPayment && <ErrorMessage error={paymentErrors.billingAddress}/>}
              {paymentSuccessMessage && <SuccessMessage message={paymentSuccessMessage}/>}
            </div>
          )}

          {/* History */}
          {activeTab === "history" && (
            <div>
              <h3>Booking History</h3>
              <div>
                <BookingHistoryTable />
              </div>
            </div>
          )}

          {/* Environmental Impact */}
          {activeTab === "env-impact" && (
            <div>
              <h3>Environmental Impact</h3>
              <div>
                <EnvironmentalImpact 
                  user={localUser}
                  allElectricVehicles={allVehicles}
                  makes={makes}
                />
              </div>
            </div>
          )}
          
          <div className='spacer' />

          {/* Payment */}
          {activeTab === "payment" && (
            <>
              {/* Save/Edit button */}
              <Button
                className="one-hundred-50-width spread uppercase"
                onClick={() => {
                  if (editingPayment) {
                    handleSavePayment();
                  } else {
                    if (originalUser != null){
                      setLocalUser(originalUser); // reset the details in case other edits are in progress
                      setErrors({});
                    }
                    setEditingCar(false);         // stop car edit
                    setEditingAbout(false);       // stop details edit
                    setOriginalUser(localUser);   // save the current values before editing
                    setEditingPayment(true);      // enter edit details mode
                  }
                }}
              >
                {editingPayment ? <Check /> : <Pencil /> }
                {editingPayment ? "SAVE" : "EDIT"}
              </Button>
            </>
          )}

          {/* Handle Cancel button */}
          { ((activeTab === "payment" && editingPayment)      // payment and editing
            ) && (
            // Cancel button
            <Button
              variant="transparent"
              className="one-hundred-50-width spread uppercase"
              onClick={() => {
                if (activeTab === "payment") {
                  setEditingPayment(false);
                } 
                setLocalUser(originalUser);
                setErrors({});
              }}
            >
              <X /> CANCEL
            </Button>
          )}

          {/* Handle Back button */}
          { (activeTab === "history" ||                       // history
            activeTab === "env-impact" ||                     // environmental impact
            (activeTab === "payment" && !editingPayment)      // payment but not editing
            ) && (
            // Back button
            <Button
              variant="tertiary"
              className="one-hundred-50-width spread uppercase"
              onClick={() => setActiveTab("dashboard")}
            >
              <ArrowLeft /> BACK
            </Button>
          )}

        </div> 
      </div>
      <ProfileAvatarTool
        currentAvatar={localUser?.avatarURL}
        isOpen={showAvatarTool}
        onClose={() => setShowAvatarTool(false)}
        onAvatarChange={handleAvatarChange}
      />
      <ChatBubble />
      
    </div >
  );
}

export default Profile;
