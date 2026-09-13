import { useState, useEffect, useContext } from "react";
import { UserContext } from "../context/user";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Mail,
  House,
  KeyRound,
  CalendarDays,
  User,
  CreditCard,
  Phone,
  BookText,
  Pencil,
  Check,
  X,
  ArrowLeft,
} from "lucide-react";
import { toast } from "react-toastify";

import NavBar from "../components/NavBar";
import ChatBubble from "../components/ChatBubble";
import BookingHistoryTable from "../components/BookingHistoryTable";
import EnvironmentalImpact from "../components/EnvironmentalImpact";
import ErrorMessage from "../components/ErrorMessage";
import SuccessMessage from "../components/SuccessMessage";
import ProfileAvatarTool from "../components/ProfileAvatarTool";
import { Button } from "../components/Button";

const API_URL = import.meta.env.VITE_API_URL;
const RECENT_SUCCESS_MESSAGE_LINGER = 5000;

const inputClass = `
  w-full max-w-[220px] rounded-lg border px-3 py-2
  text-sm outline-none transition
  border-surface-300 bg-white text-surface-900
  placeholder:text-surface-400
  focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20
  dark:border-gray-700 dark:bg-gray-950
  dark:text-white dark:placeholder:text-gray-600
`;

const sectionClass = `
  rounded-2xl border p-5 sm:p-6
  border-surface-200 bg-white
  shadow-sm
  dark:border-gray-800 dark:bg-[#050806]
  dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]
`;

const secondaryTextClass = "text-sm text-surface-500 dark:text-gray-400";

function Profile() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user: contextUser,
    setUser: setContextUser,
    updateUser: updateContextUser,
  } = useContext(UserContext);

  const [localUser, setLocalUser] = useState(null);
  const [originalUser, setOriginalUser] = useState(null);

  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("dashboard");

  const [editingCar, setEditingCar] = useState(false);
  const [editingPayment, setEditingPayment] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);

  const [history, setHistory] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [allVehicles, setAllVehicles] = useState([]);
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);

  const [paymentErrors, setPaymentErrors] = useState({});
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState("");
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);

  const [recentSuccess, setRecentSuccess] = useState(false);
  const [success, setSuccess] = useState("");

  const [showAvatarTool, setShowAvatarTool] = useState(false);

  const [recentAchievements, setRecentAchievements] = useState([]);
  const [achievementsLoading, setAchievementsLoading] = useState(true);

  const [userStats, setUserStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (contextUser) {
      setLocalUser(contextUser);
    }
  }, [contextUser]);

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-AU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleChangeImage = () => {
    setShowAvatarTool(true);
  };

  useEffect(() => {
    if (location.pathname === "/profile" && location.state?.resetDashboard) {
      setActiveTab("dashboard");
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const token =
    contextUser?.token ||
    JSON.parse(localStorage.getItem("currentUser"))?.token;

  useEffect(() => {
    if (isPaymentSuccess) {
      const timer = setTimeout(() => {
        setIsPaymentSuccess(false);
        setPaymentSuccessMessage("");
      }, RECENT_SUCCESS_MESSAGE_LINGER);

      return () => clearTimeout(timer);
    }
  }, [isPaymentSuccess]);

  useEffect(() => {
    if (!token) {
      navigate("/signin");
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const authRes = await fetch(`${API_URL}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!authRes.ok) {
          throw new Error("Failed to fetch auth profile");
        }

        const authData = await authRes.json();

        const profileRes = await fetch(`${API_URL}/profile/user-profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!profileRes.ok) {
          throw new Error("Failed to fetch user profile details");
        }

        const profileData = await profileRes.json();

        let car = profileData?.data?.user_car_model ?? null;

        if (car && typeof car === "string") {
          const vRes = await fetch(`${API_URL}/vehicle/${car}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
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
          token,
        };

        setLocalUser(nextUser);
        setContextUser(nextUser);
      } catch (err) {
        console.error("Profile fetch error:", err);
        navigate("/signin");
      }
    };

    fetchUserProfile();
  }, [navigate, token, setContextUser]);

  useEffect(() => {
    if (token) {
      fetchUserStats();
    }
  }, [token]);

  const fetchUserStats = async () => {
    if (!token) return;

    try {
      setStatsLoading(true);

      const res = await fetch(`${API_URL}/user-stats/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch stats");
      }

      const data = await res.json();
      setUserStats(data.data || null);
    } catch (err) {
      console.error("Failed to fetch user stats:", err);
      setUserStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchRecentAchievements();
    }
  }, [token]);

  const fetchRecentAchievements = async () => {
    if (!token) return;

    try {
      setAchievementsLoading(true);

      const res = await fetch(
        `${API_URL}/achievements/me-recent?limit=6`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

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

  useEffect(() => {
    if (editingCar || activeTab === "env-impact") {
      fetchAllVehicles();
    }
  }, [activeTab, editingCar, localUser?.token]);

  const fetchAllVehicles = async () => {
    if (!localUser?.token || loadingVehicles) return;

    setLoadingVehicles(true);

    try {
      const res = await fetch(`${API_URL}/vehicle`, {
        headers: {
          Authorization: `Bearer ${localUser.token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch vehicles");
      }

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

  useEffect(() => {
    if (localUser?.car?.make) {
      const filteredModels = allVehicles
        .filter((v) => v.make === localUser.car.make)
        .map((v) => v.model);

      setModels(["Select", ...new Set(filteredModels)]);

      if (localUser?.car?.model) {
        const filteredYears = allVehicles
          .filter(
            (v) =>
              v.make === localUser.car.make &&
              v.model === localUser.car.model
          )
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

  useEffect(() => {
    if (activeTab !== "payment") setEditingPayment(false);
    if (activeTab !== "car") setEditingCar(false);
    if (activeTab !== "about") setEditingAbout(false);
  }, [activeTab]);

  const handleSignOut = () => {
    localStorage.removeItem("currentUser");
    navigate("/signin");
  };

  const isValidMobile = (mobile) => {
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
    const newErrors = {};

    const cardNum = (localUser.cardNumber || "").replace(/\s+/g, "");

    if (!cardNum) {
      newErrors.cardNumber = "Card number is required";
    } else if (!/^\d{16}$/.test(cardNum)) {
      newErrors.cardNumber = "Card number must be 16 digits";
    }

    if (!localUser.expiryDate) {
      newErrors.expiryDate = "Expiry date is required";
    } else if (
      !/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(localUser.expiryDate)
    ) {
      newErrors.expiryDate = "Expiry must be in MM/YY format";
    } else {
      const [mm, yy] = localUser.expiryDate.split("/").map(Number);
      const now = new Date();
      const currentYear = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;

      if (
        yy < currentYear ||
        (yy === currentYear && mm < currentMonth)
      ) {
        newErrors.expiryDate = "Card has expired";
      }
    }

    if (!localUser.cvv) {
      newErrors.cvv = "CVV is required";
    } else if (!/^\d{3}$/.test(localUser.cvv)) {
      newErrors.cvv = "CVV must be 3 digits";
    }

    if (!localUser.billingAddress) {
      newErrors.billingAddress = "Billing address is required";
    }

    setPaymentErrors(newErrors);

    return Object.keys(newErrors).length === 0;
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
        toast.error("Failed to update profile info", {
          position: "top-center",
          autoClose: 2000,
          closeOnClick: true,
          draggable: true,
          closeButton: true,
          toastId: "profile-update-error",
        });

        throw new Error("Failed to update profile info");
      }

      const updatedUser = {
        ...localUser,
        firstName: localUser.firstName,
        lastName: localUser.lastName,
        email: localUser.email,
        mobile: localUser.mobile,
      };

      setLocalUser(updatedUser);
      setContextUser(updatedUser);
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));

      setEditingAbout(false);

      toast.success("Profile information updated successfully!", {
        position: "top-center",
        autoClose: 2000,
        closeOnClick: true,
        draggable: true,
        closeButton: true,
        toastId: "profile-update-success",
      });

      setIsSuccess(true);
      setErrors({});
    } catch (err) {
      setSuccessMessage("");
      setIsSuccess(false);

      console.error(err);

      toast.error(`Failed to update profile: ${err.message}`, {
        position: "top-center",
        autoClose: 2000,
        closeOnClick: true,
        draggable: true,
        closeButton: true,
        toastId: "profile-update-error",
      });
    }
  };

  const handleSaveCar = async () => {
    try {
      const token = localUser?.token;
      const newErrors = {};

      if (localUser.car.make === "Select") {
        newErrors.carMake = "Please select a make";
      }

      if (
        localUser.car.model === "Select" ||
        localUser.car.model === ""
      ) {
        newErrors.carModel = "Please select a model";
      }

      if (
        localUser.car.year === "Select" ||
        localUser.car.year === ""
      ) {
        newErrors.carYear = "Please select a year";
      }

      setErrors(newErrors);

      if (Object.keys(newErrors).length > 0) {
        return;
      }

      const selectedVehicle = allVehicles.find(
        (v) =>
          v.make === localUser.car?.make &&
          v.model === localUser.car?.model &&
          String(v.model_release_year || v.year) ===
            String(localUser.car?.year)
      );

      if (!selectedVehicle) {
        toast.error("Invalid vehicle selection", {
          position: "top-center",
          autoClose: 2000,
          closeOnClick: true,
          draggable: true,
          closeButton: true,
          toastId: "vehicle-invalid-error",
        });

        return;
      }

      const payload = {
        vehicleId: selectedVehicle.id,
      };

      const response = await fetch(`${API_URL}/profile/vehicle-model`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to update vehicle");
      }

      await response.json();

      const normalizedCar = {
        ...selectedVehicle,
        id: selectedVehicle.id ?? selectedVehicle._id,
        year:
          selectedVehicle.year ??
          selectedVehicle.model_release_year ??
          null,
      };

      setLocalUser((prev) => {
        const next = {
          ...prev,
          car: normalizedCar,
        };

        localStorage.setItem("currentUser", JSON.stringify(next));

        return next;
      });

      setEditingCar(false);

      toast.success("Vehicle updated successfully!", {
        position: "top-center",
        autoClose: 2000,
        closeOnClick: true,
        draggable: true,
        closeButton: true,
        toastId: "vehicle-update-success",
      });
    } catch (err) {
      console.error(err);

      toast.error(`Failed to update vehicle: ${err.message}`, {
        position: "top-center",
        autoClose: 2000,
        closeOnClick: true,
        draggable: true,
        closeButton: true,
        toastId: "vehicle-update-error",
      });
    }
  };

  const handleSavePayment = () => {
    if (!validatePaymentForm()) return;

    const cardNum = (localUser.cardNumber || "").replace(/\s+/g, "");

    setLocalUser((prev) => {
      const next = {
        ...prev,
        cardNumber: cardNum,
      };

      localStorage.setItem("currentUser", JSON.stringify(next));

      return next;
    });

    setEditingPayment(false);
    setPaymentErrors({});
    setPaymentSuccessMessage(
      "Payment information updated successfully!"
    );
    setIsPaymentSuccess(true);

    setTimeout(() => {
      setPaymentSuccessMessage("");
      setIsPaymentSuccess(false);
    }, 3000);
  };

  const handleAvatarChange = (newUrl) => {
    updateContextUser({
      avatarURL: newUrl,
    });

    setLocalUser((prev) => ({
      ...prev,
      avatarURL: newUrl,
    }));

    setShowAvatarTool(false);
  };

  const startEditing = (type) => {
    if (originalUser !== null) {
      setLocalUser(originalUser);
      setErrors({});
    }

    setOriginalUser(localUser);

    if (type === "about") {
      setEditingCar(false);
      setEditingPayment(false);
      setEditingAbout(true);
    }

    if (type === "car") {
      setEditingAbout(false);
      setEditingPayment(false);
      setEditingCar(true);
    }

    if (type === "payment") {
      setEditingCar(false);
      setEditingAbout(false);
      setEditingPayment(true);
    }
  };

  const cancelEditing = (type) => {
    if (type === "about") {
      setEditingAbout(false);
    }

    if (type === "car") {
      setEditingCar(false);
    }

    if (type === "payment") {
      setEditingPayment(false);
    }

    if (originalUser) {
      setLocalUser(originalUser);
    }

    setErrors({});
    setPaymentErrors({});
  };

  if (!localUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50 text-surface-600 dark:bg-black dark:text-gray-400">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-50 text-surface-900 transition-colors dark:bg-transparent dark:text-white">
      <NavBar />

      <div
        className="
          pointer-events-none fixed inset-0 -z-0
          bg-gradient-to-br from-surface-50 via-white to-emerald-50/60
          dark:bg-none
        "
      />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className={sectionClass}>
            <div className="flex flex-col items-center">
              <div className="relative mb-5">
                <img
                  src={
                    localUser.avatarURL ||
                    "defaultProfilePictures/default-white.png"
                  }
                  alt="User Avatar"
                  className="
                    h-28 w-28 rounded-full object-cover
                    border-4 border-white bg-surface-100
                    shadow-lg
                    dark:border-gray-900 dark:bg-gray-800
                  "
                />

                <Button
                  type="button"
                  variant="unstyled"
                  className="
                    absolute bottom-1 right-1
                    flex h-9 w-9 items-center justify-center
                    rounded-full bg-emerald-600
                    text-white shadow-md
                    transition hover:bg-emerald-700
                    dark:bg-emerald-500 dark:text-black
                    dark:hover:bg-emerald-400
                  "
                  onClick={handleChangeImage}
                  aria-label="Change profile picture"
                >
                  <Pencil size={16} />
                </Button>

                <input
                  id="fileInput"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={() => {}}
                />
              </div>

              <div className="w-full text-center">
                {editingAbout ? (
                  <div className="space-y-2">
                    <div className="relative mx-auto max-w-[220px]">
                      <User
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 dark:text-gray-500"
                      />

                      <input
                        className={`${inputClass} pl-10`}
                        type="text"
                        value={localUser.firstName || ""}
                        placeholder="First name"
                        onChange={(e) => {
                          setLocalUser({
                            ...localUser,
                            firstName: e.target.value,
                          });

                          setErrors({
                            ...errors,
                            firstName: "",
                          });
                        }}
                      />
                    </div>

                    {errors.firstName && (
                      <ErrorMessage error={errors.firstName} />
                    )}

                    <div className="relative mx-auto max-w-[220px]">
                      <User
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 dark:text-gray-500"
                      />

                      <input
                        className={`${inputClass} pl-10`}
                        type="text"
                        placeholder="Last name"
                        value={localUser.lastName || ""}
                        onChange={(e) => {
                          setLocalUser({
                            ...localUser,
                            lastName: e.target.value,
                          });

                          setErrors({
                            ...errors,
                            lastName: "",
                          });
                        }}
                      />
                    </div>

                    {errors.lastName && (
                      <ErrorMessage error={errors.lastName} />
                    )}
                  </div>
                ) : (
                  <h1 className="text-xl font-bold capitalize text-surface-900 dark:text-white">
                    {localUser.firstName === "true"
                      ? ""
                      : localUser.firstName}{" "}
                    {localUser.lastName === "true"
                      ? ""
                      : localUser.lastName}
                  </h1>
                )}

                <div className="mt-4 space-y-3 text-left">
                  <div className={secondaryTextClass}>
                    <div className="flex items-center gap-2">
                      <Mail size={15} />
                      <span className="break-all">
                        {localUser.email === "true"
                          ? "N/A"
                          : localUser.email}
                      </span>
                    </div>
                  </div>

                  <div className={secondaryTextClass}>
                    {editingAbout ? (
                      <>
                        <div className="relative">
                          <Phone
                            size={17}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 dark:text-gray-500"
                          />

                          <input
                            className={`${inputClass} pl-10`}
                            type="text"
                            value={localUser.mobile || ""}
                            placeholder="Enter your phone"
                            onChange={(e) => {
                              setLocalUser({
                                ...localUser,
                                mobile: e.target.value,
                              });

                              setErrors({
                                ...errors,
                                mobile: "",
                              });
                            }}
                          />
                        </div>

                        {errors.mobile && (
                          <ErrorMessage error={errors.mobile} />
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Phone size={15} />

                        <span>
                          {localUser.mobile === "true"
                            ? "N/A"
                            : localUser.mobile}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {!editingAbout && (
                    <Button
                      type="button"
                      variant="transparent"
                      size="tiny"
                      className="w-[125px] justify-around"
                      onClick={() => startEditing("about")}
                    >
                      <Pencil size={14} />
                      Edit Profile
                    </Button>
                  )}

                  {editingAbout && (
                    <>
                      <Button
                        type="button"
                        size="tiny"
                        className="w-[125px] justify-around uppercase"
                        onClick={handleSaveAbout}
                      >
                        <Check size={16} />
                        Save
                      </Button>

                      <Button
                        type="button"
                        variant="danger"
                        size="tiny"
                        className="w-[125px] justify-around uppercase"
                        onClick={() => cancelEditing("about")}
                      >
                        <X size={16} />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="my-6 h-px bg-surface-200 dark:bg-gray-800" />

            <div>
              <h2 className="mb-4 text-base font-semibold text-surface-900 dark:text-white">
                My Vehicle
              </h2>

              <div className="space-y-3">
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-surface-400 dark:text-gray-500">
                    Make
                  </p>

                  {editingCar ? (
                    <select
                      className={inputClass}
                      value={localUser.car?.make || "Select"}
                      onChange={(e) => {
                        setLocalUser({
                          ...localUser,
                          car: {
                            ...localUser.car,
                            make: e.target.value,
                            model: "",
                            year: "",
                          },
                        });
                      }}
                    >
                      {makes.map((make, idx) => (
                        <option key={idx} value={make}>
                          {make}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm font-medium text-surface-700 dark:text-gray-200">
                      {localUser.car?.make === "true"
                        ? "N/A"
                        : localUser.car?.make || "N/A"}
                    </p>
                  )}

                  {errors.carMake && editingCar && (
                    <ErrorMessage error={errors.carMake} />
                  )}
                </div>

                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-surface-400 dark:text-gray-500">
                    Model
                  </p>

                  {editingCar ? (
                    <select
                      className={inputClass}
                      value={localUser.car?.model || "Select"}
                      onChange={(e) => {
                        setLocalUser({
                          ...localUser,
                          car: {
                            ...localUser.car,
                            model: e.target.value,
                            year: "",
                          },
                        });

                        setErrors({
                          ...errors,
                          carModel: "",
                        });
                      }}
                    >
                      {models.map((model, idx) => (
                        <option key={idx} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm font-medium text-surface-700 dark:text-gray-200">
                      {localUser.car?.model === "true"
                        ? "N/A"
                        : localUser.car?.model || "N/A"}
                    </p>
                  )}

                  {errors.carModel && editingCar && (
                    <ErrorMessage error={errors.carModel} />
                  )}
                </div>

                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-surface-400 dark:text-gray-500">
                    Year
                  </p>

                  {editingCar ? (
                    <select
                      className={inputClass}
                      value={String(localUser.car?.year || "Select")}
                      onChange={(e) => {
                        setLocalUser({
                          ...localUser,
                          car: {
                            ...localUser.car,
                            year: e.target.value,
                          },
                        });

                        setErrors({
                          ...errors,
                          carYear: "",
                        });
                      }}
                    >
                      {years.map((year, idx) => (
                        <option key={idx} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm font-medium text-surface-700 dark:text-gray-200">
                      {localUser.car?.year === "true"
                        ? "N/A"
                        : localUser.car?.year || "N/A"}
                    </p>
                  )}

                  {errors.carYear && editingCar && (
                    <ErrorMessage error={errors.carYear} />
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {!editingCar && (
                  <Button
                    type="button"
                    variant="transparent"
                    size="tiny"
                    className="w-[125px] justify-around"
                    onClick={() => startEditing("car")}
                  >
                    <Pencil size={14} />
                    Edit Vehicle
                  </Button>
                )}

                {editingCar && (
                  <>
                    <Button
                      type="button"
                      size="tiny"
                      className="w-[125px] justify-around uppercase"
                      onClick={handleSaveCar}
                    >
                      <Check size={16} />
                      Save
                    </Button>

                    <Button
                      type="button"
                      variant="danger"
                      size="tiny"
                      className="w-[125px] justify-around uppercase"
                      onClick={() => cancelEditing("car")}
                    >
                      <X size={16} />
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="my-6 h-px bg-surface-200 dark:bg-gray-800" />

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                size="tiny"
                className="w-full justify-center gap-2"
                onClick={() => setActiveTab("payment")}
              >
                <CreditCard size={17} />
                Payment
              </Button>

              <Button
                type="button"
                size="tiny"
                className="w-full justify-center gap-2"
                onClick={() => setActiveTab("history")}
              >
                <BookText size={17} />
                Booking History
              </Button>

              <Button
                type="button"
                size="tiny"
                className="w-full justify-center gap-2"
                onClick={() => setActiveTab("env-impact")}
              >
                Environmental Impact
              </Button>
            </div>

            <div className="my-6 h-px bg-surface-200 dark:bg-gray-800" />

            <p className="text-center text-xs text-surface-400 dark:text-gray-500">
              Joined: {formatDate(localUser.createdAt)}
            </p>

            <Button
              type="button"
              variant="danger"
              size="tiny"
              className="mt-4 w-full justify-center gap-2"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </aside>

          <section className="min-w-0 space-y-6">
            {activeTab === "dashboard" && (
              <>
                <div className={sectionClass}>
                  <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                        Achievements
                      </p>

                      <h2 className="mt-1 text-xl font-bold text-surface-900 dark:text-white">
                        Recent Unlocked Achievements
                      </h2>
                    </div>

                    <Button
                      type="button"
                      variant="unstyled"
                      onClick={() => navigate("/achievements")}
                      className="w-fit text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      See full achievement list →
                    </Button>
                  </div>

                  {achievementsLoading ? (
                    <div className="rounded-xl border border-dashed border-surface-200 p-6 text-center text-sm text-surface-500 dark:border-gray-800 dark:text-gray-400">
                      Loading achievements...
                    </div>
                  ) : recentAchievements.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {recentAchievements.map((ach) => (
                        <div
                          key={ach._id}
                          className="
                            flex gap-4 rounded-xl border p-4
                            border-surface-200 bg-surface-50
                            transition-all duration-200
                            hover:-translate-y-0.5
                            hover:border-emerald-200
                            hover:shadow-sm
                            dark:border-gray-800
                            dark:bg-[#020403]
                            dark:hover:border-emerald-900
                            dark:hover:shadow-[0_8px_25px_rgba(16,185,129,0.06)]
                          "
                        >
                          <div
                            className="
                              flex h-14 w-14 shrink-0 items-center
                              justify-center rounded-xl
                              border border-emerald-100
                              bg-emerald-50
                              dark:border-emerald-950
                              dark:bg-emerald-950/50
                            "
                          >
                            <img
                              src={
                                ach.icon || "/default-badge.png"
                              }
                              alt={ach.name}
                              className="h-10 w-10 object-contain"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-surface-900 dark:text-white">
                              {ach.name}
                            </h3>

                            <p className="mt-1 text-sm leading-5 text-surface-500 dark:text-gray-400">
                              {ach.description}
                            </p>

                            <div className="mt-4">
                              <div className="h-2 overflow-hidden rounded-full bg-surface-200 dark:bg-gray-800">
                                <div
                                  className="h-full w-full rounded-full bg-emerald-500"
                                  style={{ width: "100%" }}
                                />
                              </div>

                              <span className="mt-2 block text-xs text-surface-400 dark:text-gray-500">
                                Completed:{" "}
                                {new Date(
                                  ach.unlockedAt
                                ).toLocaleDateString("en-AU")}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-surface-200 p-6 text-center text-sm text-surface-500 dark:border-gray-800 dark:text-gray-400">
                      You haven't unlocked any achievements yet. Start
                      charging or updating your profile!
                    </div>
                  )}
                </div>

                <div className={sectionClass}>
                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                      Your EVAT Activity
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-surface-900 dark:text-white">
                      Your Impact
                    </h2>
                  </div>

                  {statsLoading ? (
                    <div className="rounded-xl border border-dashed border-surface-200 p-6 text-center text-sm text-surface-500 dark:border-gray-800 dark:text-gray-400">
                      Loading your stats...
                    </div>
                  ) : userStats ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-gray-800 dark:bg-[#020403]">
                        <p className="text-xs font-medium uppercase tracking-wide text-surface-400 dark:text-gray-500">
                          Charging Sessions
                        </p>

                        <p className="mt-2 text-2xl font-bold text-surface-900 dark:text-white">
                          {userStats.counters.totalChargingSessions}
                        </p>
                      </div>

                      <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-gray-800 dark:bg-[#020403]">
                        <p className="text-xs font-medium uppercase tracking-wide text-surface-400 dark:text-gray-500">
                          kWh Charged
                        </p>

                        <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {(
                            userStats.counters.totalWhCharged / 1000
                          ).toFixed(1)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-gray-800 dark:bg-[#020403]">
                        <p className="text-xs font-medium uppercase tracking-wide text-surface-400 dark:text-gray-500">
                          Distance Travelled
                        </p>

                        <p className="mt-2 text-2xl font-bold text-surface-900 dark:text-white">
                          {(
                            userStats.counters.totalMetresTravelled /
                            1000
                          ).toFixed(1)}{" "}
                          <span className="text-sm font-medium text-surface-500 dark:text-gray-400">
                            km
                          </span>
                        </p>
                      </div>

                      <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-gray-800 dark:bg-[#020403]">
                        <p className="text-xs font-medium uppercase tracking-wide text-surface-400 dark:text-gray-500">
                          CO₂ Avoided
                        </p>

                        <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {userStats.counters.totalCO2KgAvoided}{" "}
                          <span className="text-sm font-medium text-surface-500 dark:text-gray-400">
                            kg
                          </span>
                        </p>
                      </div>

                      <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-gray-800 dark:bg-[#020403]">
                        <p className="text-xs font-medium uppercase tracking-wide text-surface-400 dark:text-gray-500">
                          Petrol Savings
                        </p>

                        <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          $
                          {(
                            userStats.counters
                              .totalPetrolSavingsCents / 100
                          ).toFixed(2)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-gray-800 dark:bg-[#020403]">
                        <p className="text-xs font-medium uppercase tracking-wide text-surface-400 dark:text-gray-500">
                          Login Streak
                        </p>

                        <p className="mt-2 text-2xl font-bold text-surface-900 dark:text-white">
                          {
                            userStats.counters
                              .consecutiveLoginDays
                          }{" "}
                          <span className="text-sm font-medium text-surface-500 dark:text-gray-400">
                            days
                          </span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-surface-200 p-6 text-center text-sm text-surface-500 dark:border-gray-800 dark:text-gray-400">
                      Unable to load stats.
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === "payment" && (
              <div className={sectionClass}>
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                    Account
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-surface-900 dark:text-white">
                    Payment Information
                  </h2>

                  <p className="mt-2 text-sm text-surface-500 dark:text-gray-400">
                    Your payment details are stored locally in your
                    browser.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-surface-700 dark:text-gray-300">
                      Card
                    </label>

                    {editingPayment ? (
                      <div className="relative w-full max-w-[260px]">
                        <CreditCard
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 dark:text-gray-500"
                          size={17}
                        />

                        <input
                          className={`${inputClass} max-w-none pl-10`}
                          type="text"
                          value={localUser.cardNumber || ""}
                          placeholder="1234 5678 9012 3456"
                          onChange={(e) => {
                            let val = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 16);

                            val = val.replace(
                              /(\d{4})(?=\d)/g,
                              "$1 "
                            );

                            setLocalUser({
                              ...localUser,
                              cardNumber: val,
                            });

                            setPaymentErrors({
                              ...paymentErrors,
                              cardNumber: "",
                            });
                          }}
                        />
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-surface-700 dark:text-gray-200">
                        {localUser.cardNumber
                          ? "**** **** **** " +
                            localUser.cardNumber
                              .replace(/\s/g, "")
                              .slice(-4)
                          : "**** **** **** 1234"}
                      </p>
                    )}

                    {paymentErrors.cardNumber &&
                      editingPayment && (
                        <ErrorMessage
                          error={paymentErrors.cardNumber}
                        />
                      )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-surface-700 dark:text-gray-300">
                      Expiry Date
                    </label>

                    {editingPayment ? (
                      <div className="relative w-full max-w-[220px]">
                        <CalendarDays
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 dark:text-gray-500"
                          size={17}
                        />

                        <input
                          className={`${inputClass} max-w-none pl-10`}
                          type="text"
                          value={localUser.expiryDate || ""}
                          placeholder="MM/YY"
                          onChange={(e) => {
                            let val = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 4);

                            if (val.length > 2) {
                              val =
                                val.slice(0, 2) +
                                "/" +
                                val.slice(2);
                            }

                            setLocalUser({
                              ...localUser,
                              expiryDate: val,
                            });

                            setPaymentErrors({
                              ...paymentErrors,
                              expiryDate: "",
                            });
                          }}
                        />
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-surface-700 dark:text-gray-200">
                        {localUser.expiryDate || "MM/YY"}
                      </p>
                    )}

                    {paymentErrors.expiryDate &&
                      editingPayment && (
                        <ErrorMessage
                          error={paymentErrors.expiryDate}
                        />
                      )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-surface-700 dark:text-gray-300">
                      CVV
                    </label>

                    {editingPayment ? (
                      <div className="relative w-full max-w-[180px]">
                        <KeyRound
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 dark:text-gray-500"
                          size={17}
                        />

                        <input
                          className={`${inputClass} max-w-none pl-10`}
                          type="text"
                          value={localUser.cvv || ""}
                          placeholder="123"
                          onChange={(e) => {
                            const val = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 3);

                            setLocalUser({
                              ...localUser,
                              cvv: val,
                            });

                            setPaymentErrors({
                              ...paymentErrors,
                              cvv: "",
                            });
                          }}
                        />
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-surface-700 dark:text-gray-200">
                        ***
                      </p>
                    )}

                    {paymentErrors.cvv && editingPayment && (
                      <ErrorMessage error={paymentErrors.cvv} />
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-surface-700 dark:text-gray-300">
                      Billing Address
                    </label>

                    {editingPayment ? (
                      <div className="relative w-full max-w-[320px]">
                        <House
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 dark:text-gray-500"
                          size={17}
                        />

                        <input
                          className={`${inputClass} max-w-none pl-10`}
                          type="text"
                          value={localUser.billingAddress || ""}
                          placeholder="Enter your billing address"
                          onChange={(e) => {
                            setLocalUser({
                              ...localUser,
                              billingAddress: e.target.value,
                            });

                            setPaymentErrors({
                              ...paymentErrors,
                              billingAddress: "",
                            });
                          }}
                        />
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-surface-700 dark:text-gray-200">
                        {localUser.billingAddress || "N/A"}
                      </p>
                    )}

                    {paymentErrors.billingAddress &&
                      editingPayment && (
                        <ErrorMessage
                          error={paymentErrors.billingAddress}
                        />
                      )}
                  </div>

                  {paymentSuccessMessage && (
                    <SuccessMessage
                      message={paymentSuccessMessage}
                    />
                  )}
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button
                    type="button"
                    className="w-[150px] justify-around uppercase"
                    onClick={() => {
                      if (editingPayment) {
                        handleSavePayment();
                      } else {
                        startEditing("payment");
                      }
                    }}
                  >
                    {editingPayment ? <Check /> : <Pencil />}
                    {editingPayment ? "SAVE" : "EDIT"}
                  </Button>

                  {editingPayment && (
                    <Button
                      type="button"
                      variant="transparent"
                      className="w-[150px] justify-around uppercase"
                      onClick={() => cancelEditing("payment")}
                    >
                      <X />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className={sectionClass}>
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                    Activity
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-surface-900 dark:text-white">
                    Booking History
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <BookingHistoryTable />
                </div>
              </div>
            )}

            {activeTab === "env-impact" && (
              <div className={sectionClass}>
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                    Sustainability
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-surface-900 dark:text-white">
                    Environmental Impact
                  </h2>
                </div>

                <EnvironmentalImpact
                  user={localUser}
                  allElectricVehicles={allVehicles}
                  makes={makes}
                />
              </div>
            )}

            {(activeTab === "history" ||
              activeTab === "env-impact" ||
              (activeTab === "payment" && !editingPayment)) && (
              <div>
                <Button
                  type="button"
                  variant="tertiary"
                  className="w-[150px] justify-around uppercase"
                  onClick={() => setActiveTab("dashboard")}
                >
                  <ArrowLeft />
                  Back
                </Button>
              </div>
            )}
          </section>
        </div>
      </main>

      <ProfileAvatarTool
        currentAvatar={localUser?.avatarURL}
        isOpen={showAvatarTool}
        onClose={() => setShowAvatarTool(false)}
        onAvatarChange={handleAvatarChange}
      />

      {/* <ChatBubble /> */}
    </div>
  );
}

export default Profile;