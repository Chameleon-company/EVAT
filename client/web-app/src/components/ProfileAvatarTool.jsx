import { X, Upload, Check } from "lucide-react";
import { useState, useEffect, useRef, useContext } from "react";
import { UserContext } from "../context/user";
import ErrorMessage from "../components/ErrorMessage";
import SuccessMessage from "../components/SuccessMessage";
import { Button } from "./Button";

const DEFAULT_AVATARS = [
  "defaultProfilePictures/default-white.png",
  "defaultProfilePictures/default-green.png",
  "defaultProfilePictures/default-red.png",
  "defaultProfilePictures/default-yellow.png",
  "defaultProfilePictures/default-blue.png",
  "defaultProfilePictures/tesla-black.png",
  "defaultProfilePictures/EVIE.png",
  "defaultProfilePictures/ford.png",
  "defaultProfilePictures/honda.png",
  "defaultProfilePictures/nissan.png",
  "defaultProfilePictures/toyota.png",
];

const RECENT_MESSAGE_LINGER = 5000;
const isDev = import.meta.env.DEV;

const ProfileAvatarTool = ({
  currentAvatar,
  isOpen,
  onClose,
  onAvatarChange,
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [customUrl, setCustomUrl] = useState("");

  const { user: contextUser } = useContext(UserContext);
  const fileInputRef = useRef(null);

  const [isAcceptDisabled, setIsAcceptDisabled] = useState(false);
  const [urlError, setURLError] = useState("");
  const [extensionWarningShown, setExtensionWarningShown] = useState(false);
  const disableTimerRef = useRef(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, RECENT_MESSAGE_LINGER);

      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess("");
      }, RECENT_MESSAGE_LINGER);

      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (isOpen) {
      setError("");
      setSuccess("");
      setSelectedAvatar(currentAvatar);
      setCustomUrl("");
    }
  }, [isOpen, currentAvatar]);

  if (!isOpen) return null;

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getToken = () => {
    const token =
      contextUser?.token ||
      JSON.parse(localStorage.getItem("currentUser") || "null")?.token;

    if (!token) {
      setError("You are not logged in. Please sign in again.");
      return null;
    }

    return token;
  };

  const isValidUrl = (url) => {
    if (!url || !url.trim()) {
      return {
        valid: false,
        message: "Please enter a URL",
      };
    }

    const trimmed = url.trim();

    if (
      !trimmed.startsWith("http://") &&
      !trimmed.startsWith("https://")
    ) {
      return {
        valid: false,
        message: "URL must start with http:// or https://",
      };
    }

    try {
      new URL(trimmed);
    } catch {
      return {
        valid: false,
        message: "Please enter a valid URL",
      };
    }

    return {
      valid: true,
      url: trimmed,
    };
  };

  const hasImageExtension = (url) => {
    const imageExtensions = [
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".webp",
      ".svg",
      ".bmp",
    ];

    return imageExtensions.some((ext) =>
      url.toLowerCase().endsWith(ext)
    );
  };

  const handleAcceptCustomUrl = () => {
    const validation = isValidUrl(customUrl);

    if (!validation.valid) {
      setURLError(validation.message);
      return;
    }

    const finalUrl = customUrl.trim();

    if (!hasImageExtension(finalUrl)) {
      if (!extensionWarningShown) {
        setURLError(
          "Custom avatar URL does not end with a common image extension"
        );
        setExtensionWarningShown(true);
        setIsAcceptDisabled(true);

        if (disableTimerRef.current) {
          clearTimeout(disableTimerRef.current);
        }

        disableTimerRef.current = setTimeout(() => {
          setIsAcceptDisabled(false);
          setURLError("");
        }, RECENT_MESSAGE_LINGER);

        return;
      }
    }

    onAvatarChange(finalUrl);
    setSuccess("Custom avatar URL applied!");
    onClose();
  };

  const handleCustomUrlChange = (e) => {
    setCustomUrl(e.target.value);
    setExtensionWarningShown(false);
    setIsAcceptDisabled(false);

    if (disableTimerRef.current) {
      clearTimeout(disableTimerRef.current);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      resetFileInput();
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB");
      resetFileInput();
      return;
    }

    const token = getToken();

    if (!token) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/profile/avatar/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error(
            "Session expired. Please sign in again."
          );
        }

        throw new Error("Upload failed");
      }

      const data = await res.json();
      const newUrl = data.avatarURL || data.url;

      setSelectedAvatar(newUrl);
      onAvatarChange(newUrl);
      setSuccess("Upload Successful.");
      onClose();
    } catch (err) {
      console.error(err);
      setError(
        "Failed to upload image. Uploading is not supported yet."
      );
    } finally {
      setUploading(false);
      resetFileInput();
    }
  };

  const handleClose = async () => {
    resetFileInput();
    setError("");
    setSuccess("");
    setURLError("");
    setSelectedAvatar(currentAvatar);
    setCustomUrl("");
    setIsAcceptDisabled(false);
    setExtensionWarningShown(false);

    if (disableTimerRef.current) {
      clearTimeout(disableTimerRef.current);
    }

    onClose();
  };

  const handleSave = async () => {
    if (!selectedAvatar) return;

    const token = getToken();

    if (!token) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/profile/avatar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            avatarURL: selectedAvatar,
          }),
        }
      );

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error(
            "Session expired. Please sign in again."
          );
        }

        throw new Error("Failed to save avatar");
      }

      onAvatarChange(selectedAvatar);
      setSuccess("Profile picture updated successfully.");
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to save avatar");
    }
  };

  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-center justify-center
        bg-slate-900/50
        px-4 py-6
        backdrop-blur-sm
        transition-all duration-300

        dark:bg-black/80
      "
      onClick={handleClose}
    >
      <div
        className="
          relative w-full max-w-2xl
          max-h-[90vh] overflow-y-auto
          rounded-3xl border
          border-slate-200
          bg-white/95
          p-5
          shadow-[0_25px_80px_rgba(15,23,42,0.25)]
          backdrop-blur-xl
          sm:p-7

          dark:border-emerald-900/50
          dark:bg-[#050806]/95
          dark:shadow-[0_25px_80px_rgba(0,0,0,0.7)]
        "
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="
            pointer-events-none absolute left-8 right-8 top-0
            h-px
            bg-gradient-to-r
            from-transparent
            via-emerald-400
            to-transparent
            dark:via-emerald-600
          "
        />

        <div
          className="
            mb-6 flex items-center justify-between
            border-b border-slate-200
            pb-4

            dark:border-emerald-900/40
          "
        >
          <div>
            <span
              className="
                inline-flex items-center rounded-full
                border border-emerald-200
                bg-emerald-50
                px-3 py-1
                text-[10px] font-semibold
                uppercase tracking-[0.16em]
                text-emerald-700

                dark:border-emerald-900/60
                dark:bg-emerald-950/40
                dark:text-emerald-400
              "
            >
              Profile
            </span>

            <h4
              className="
                mt-2 text-xl font-bold
                text-slate-900
                dark:text-white
              "
            >
              Choose Profile Picture
            </h4>
          </div>

          <Button
            type="button"
            variant="unstyled"
            className="
              flex h-9 w-9 items-center justify-center
              rounded-lg border
              border-red-200
              bg-white
              text-red-600
              transition-all duration-200
              hover:bg-red-50
              hover:shadow-sm

              dark:border-red-900/60
              dark:bg-[#0b1510]
              dark:text-red-400
              dark:hover:border-red-800
              dark:hover:bg-red-950/30
            "
            onClick={handleClose}
            aria-label="Close profile picture chooser"
          >
            <X size={20} />
          </Button>
        </div>

        <div
          className="
            grid grid-cols-3 gap-3
            sm:grid-cols-4
            md:grid-cols-5
          "
        >
          {DEFAULT_AVATARS.map((url, index) => (
            <button
              key={index}
              type="button"
              className={`
                group relative aspect-square
                overflow-hidden rounded-2xl
                border-2
                bg-slate-50
                p-1
                transition-all duration-200

                dark:bg-[#08100c]

                ${
                  selectedAvatar === url
                    ? `
                      border-emerald-500
                      bg-emerald-50
                      shadow-[0_0_20px_rgba(16,185,129,0.22)]
                      dark:border-emerald-500
                      dark:bg-emerald-950/30
                      dark:shadow-[0_0_20px_rgba(16,185,129,0.16)]
                    `
                    : `
                      border-slate-200
                      hover:-translate-y-1
                      hover:border-emerald-300
                      hover:shadow-md
                      dark:border-gray-800
                      dark:hover:border-emerald-800
                      dark:hover:shadow-[0_0_18px_rgba(16,185,129,0.10)]
                    `
                }
              `}
              onClick={() => setSelectedAvatar(url)}
            >
              <img
                src={url}
                alt={`Avatar ${index + 1}`}
                className="
                  h-full w-full
                  rounded-xl
                  object-cover
                  transition-transform duration-200
                  group-hover:scale-105
                "
              />

              {selectedAvatar === url && (
                <div
                  className="
                    absolute right-2 top-2
                    flex h-7 w-7 items-center justify-center
                    rounded-full
                    bg-emerald-500
                    text-white
                    shadow-lg
                    shadow-emerald-500/30
                  "
                >
                  <Check size={17} strokeWidth={5} />
                </div>
              )}
            </button>
          ))}
        </div>

        <div
          className="
            mt-7 rounded-2xl border
            border-slate-200
            bg-slate-50/80
            p-4
            sm:p-5

            dark:border-emerald-900/40
            dark:bg-[#08100c]/80
          "
        >
          {isDev && (
            <div className="mb-5">
              <div className="mb-3">
                <p
                  className="
                    text-sm font-semibold
                    text-slate-800
                    dark:text-gray-200
                  "
                >
                  Custom Avatar URL
                </p>

                <p
                  className="
                    mt-1 text-xs
                    text-slate-400
                    dark:text-gray-600
                  "
                >
                  Developer option for loading an avatar from a URL.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  className="
                    min-w-0 flex-1 rounded-lg border
                    border-slate-200
                    bg-white
                    px-3 py-2.5
                    text-sm text-slate-900
                    placeholder:text-slate-400
                    outline-none
                    transition-all duration-200
                    focus:border-emerald-500
                    focus:ring-4
                    focus:ring-emerald-500/10

                    dark:border-gray-800
                    dark:bg-[#050806]
                    dark:text-gray-100
                    dark:placeholder:text-gray-600
                    dark:focus:border-emerald-500
                  "
                  placeholder="https://example.com/my-avatar.png"
                  value={customUrl}
                  onChange={handleCustomUrlChange}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !isAcceptDisabled
                    ) {
                      handleAcceptCustomUrl();
                    }
                  }}
                />

                <Button
                  type="button"
                  size="small"
                  onClick={handleAcceptCustomUrl}
                  disabled={
                    isAcceptDisabled || !customUrl.trim()
                  }
                  className="
                    sm:w-24
                    dark:shadow-[0_0_15px_rgba(16,185,129,0.10)]
                  "
                >
                  {isAcceptDisabled ? "Wait 5s..." : "Accept"}
                </Button>
              </div>

              {urlError && (
                <div className="mt-3">
                  <ErrorMessage error={urlError} />
                </div>
              )}

              <p
                className="
                  mt-3 text-center text-xs
                  leading-5 text-slate-400
                  dark:text-gray-500
                "
              >
                Visit this{" "}
                <a
                  href="https://github.com/filippofilip95/car-logos-dataset/tree/master"
                  className="
                    font-medium text-emerald-600
                    underline underline-offset-2
                    transition-colors
                    hover:text-emerald-700

                    dark:text-emerald-400
                    dark:hover:text-emerald-300
                  "
                >
                  Car Logo Dataset
                </a>{" "}
                and use the thumbnail version.
                <br />
                Example:
                <br />
                <span
                  className="
                    break-all
                    text-[11px]
                    dark:text-gray-600
                  "
                >
                  https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/volkswagen.png
                </span>
              </p>
            </div>
          )}

          <label
            className="
              flex w-full cursor-pointer
              items-center justify-center gap-2
              rounded-lg
              border border-emerald-200
              bg-emerald-50
              px-4 py-3
              text-sm font-semibold
              text-emerald-700
              transition-all duration-200
              hover:-translate-y-0.5
              hover:border-emerald-300
              hover:bg-emerald-100
              hover:shadow-md

              dark:border-emerald-900/60
              dark:bg-emerald-950/30
              dark:text-emerald-400
              dark:hover:border-emerald-700
              dark:hover:bg-emerald-950/50
              dark:hover:shadow-[0_0_20px_rgba(16,185,129,0.10)]
            "
          >
            <Upload size={20} />
            Upload Custom Photo

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {uploading && (
            <div
              className="
                mt-3 rounded-lg
                border border-emerald-200
                bg-emerald-50
                px-3 py-2
                text-center text-sm font-medium
                text-emerald-700

                dark:border-emerald-900/50
                dark:bg-emerald-950/30
                dark:text-emerald-400
              "
            >
              Uploading...
            </div>
          )}

          {error && (
            <div className="mt-3">
              <ErrorMessage error={error} />
            </div>
          )}

          {success && (
            <div className="mt-3">
              <SuccessMessage message={success} />
            </div>
          )}
        </div>

        <div
          className="
            mt-6 flex flex-col-reverse
            gap-3 border-t
            border-slate-200
            pt-5
            sm:flex-row sm:justify-end

            dark:border-emerald-900/40
          "
        >
          <Button
            type="button"
            variant="transparent"
            size="small"
            className="
              w-full sm:w-[150px]
              dark:border-gray-800
              dark:bg-[#08100c]
              dark:text-gray-300
              dark:hover:border-emerald-800
              dark:hover:bg-[#0b1510]
            "
            onClick={handleClose}
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="small"
            className="
              w-full sm:w-[150px]
              dark:shadow-[0_0_20px_rgba(16,185,129,0.12)]
            "
            onClick={handleSave}
          >
            Save Picture
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileAvatarTool;