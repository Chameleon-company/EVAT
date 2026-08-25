// components/ProfileAvatarTool.jsx
import { X, Upload, Check } from 'lucide-react';
import { useState, useEffect, useRef, useContext  } from 'react';
import { UserContext } from "../context/user";
import ErrorMessage from '../components/ErrorMessage';
import SuccessMessage from '../components/SuccessMessage';
import { Button } from './Button';

// a small list of provided profile images
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

const RECENT_MESSAGE_LINGER = 5000; // 5 seconds * 1000
const isDev = import.meta.env.DEV;   // Show dev tools only in development

const ProfileAvatarTool = ({ 
  currentAvatar, 
  isOpen, 
  onClose, 
  onAvatarChange 
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  // Get user from Context
  const { user: contextUser } = useContext(UserContext);
  const fileInputRef = useRef(null);   // reference for uploaded image
  // states for extension warning logic
  const [isAcceptDisabled, setIsAcceptDisabled] = useState(false);
  const [urlError, setURLError] = useState("");
  const [extensionWarningShown, setExtensionWarningShown] = useState(false);
  const disableTimerRef = useRef(null);

  // auto-clear the error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, RECENT_MESSAGE_LINGER);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // auto-clear the success after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess("");
      }, RECENT_MESSAGE_LINGER);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Reset when tool opens
  useEffect(() => {
    if (isOpen){
      setError("");                       // reset any error messages
      setSuccess("");                     // reset any success messages
      setSelectedAvatar(currentAvatar);   // reset the selected option
      setCustomUrl("");                   // reset custome URL input
    }
  }, [isOpen, currentAvatar]);
  
  if (!isOpen) return null;

  // reset the file input, otherwise the file will be remembered and it will fail silently
  const resetFileInput = () => {
    if (fileInputRef.current) {
    fileInputRef.current.value = "";   // This forces onChange next time
    }
  };

  // validate token
  const getToken = () => {
    const token = contextUser?.token || JSON.parse(localStorage.getItem("currentUser") || "null")?.token;
    
    if (!token) {
      setError("You are not logged in. Please sign in again.");
      return null;
    }
    return token;
  };

  // validating URL given for the custom URL
  const isValidUrl = (url) => {
    // handle empty string
    if (!url || !url.trim()) return { valid: false, message: "Please enter a URL" };

    const trimmed = url.trim();
    // start with http:// or https://
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return { 
        valid: false, 
        message: "URL must start with http:// or https://" 
      };
    }

    // use URL javascript class to parse the given string as a URL
    // and error is thrown if the string is not valid
    try {
      new URL(trimmed);
    } catch {
      return { valid: false, message: "Please enter a valid URL" };
    }
    return { valid: true, url: trimmed };
  };

  const hasImageExtension = (url) => {
    // check if it doesn't look like an image
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'];
    return imageExtensions.some(ext => url.toLowerCase().endsWith(ext)
  )};

  // accepting the custom url from a developer
  const handleAcceptCustomUrl = () => {
    const validation = isValidUrl(customUrl);
    if (!validation.valid) {
      setURLError(validation.message);
      return;
    }
    const finalUrl = customUrl.trim();

    // check extension
    if (!hasImageExtension(finalUrl)) {
      // show the extension warning if it has not been shown for the URL given
      if (!extensionWarningShown) {
        setURLError("Custom avatar URL does not end with a common image extension");
        setExtensionWarningShown(true);
        // disable the accept button while warning is shown
        setIsAcceptDisabled(true);
        // Re-enable button after 5 seconds
        if (disableTimerRef.current) clearTimeout(disableTimerRef.current);
        disableTimerRef.current = setTimeout(() => {
          setIsAcceptDisabled(false);
          setURLError("");
        }, RECENT_MESSAGE_LINGER);

        return; // stop here on first attempt
      }
      // allow bypass on second press
    }

    // if we reach here: either URL has extension OR user confirmed bypass
    onAvatarChange(finalUrl);
    setSuccess("Custom avatar URL applied!");
    onClose();
  };

  // reset warning when user types something new
  const handleCustomUrlChange = (e) => {
    setCustomUrl(e.target.value);
    setExtensionWarningShown(false);   // Reset warning on any change
    setIsAcceptDisabled(false);
    if (disableTimerRef.current) {
      clearTimeout(disableTimerRef.current);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      setError("Please upload an image file");
      resetFileInput();
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB
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

      const res = await fetch(`${import.meta.env.VITE_API_URL}/profile/avatar/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("Session expired. Please sign in again.");
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
      setError("Failed to upload image. Uploading is not supported yet.");
    } finally {
      setUploading(false);
      resetFileInput();
    }
  };

  const handleClose = async () => {
    resetFileInput();                   // reset any file inputs
    setError("");                       // reset any error messages
    setSuccess("");                     // reset any success messages
    setURLError("");                     // reset any warning messages
    setSelectedAvatar(currentAvatar);   // reset the selected option
    setCustomUrl("");                   // reset custome URL input
    setIsAcceptDisabled(false);         // reset accept button disable
    setExtensionWarningShown(false);    // reset extension warning
    if (disableTimerRef.current) clearTimeout(disableTimerRef.current); // reset timer
    onClose();
  };

  const handleSave = async () => {
    if (!selectedAvatar) return;

    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/profile/avatar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatarURL: selectedAvatar }),
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("Session expired. Please sign in again.");
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
    <div className="avatar-tool-overlay">
      <div className="avatar-tool-content avatar-tool">
        <div className="avatar-tool-header">
          <h4>Choose Profile Picture</h4>
          <button className="btn btn-danger filter-btn-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="avatar-grid">
          {DEFAULT_AVATARS.map((url, index) => (
            <div
              key={index}
              className={`avatar-option ${selectedAvatar === url ? 'selected' : ''}`}
              onClick={() => setSelectedAvatar(url)}
            >
              <img src={url} alt={`Avatar ${index + 1}`} />
              {selectedAvatar === url && (
                <div className="selected-check">
                  <Check size={18} strokeWidth={6} />
                </div>
              )}
            </div>
          ))}
        </div>


        <div className="upload-section">
          {/* ==================== DEVELOPER SECTION ==================== */}
          {isDev && (
            <>
              <div className="custom-url-input-group">
                <input
                  type="text"
                  className="input"
                  placeholder="https://example.com/my-avatar.png"
                  value={customUrl}
                  onChange={handleCustomUrlChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isAcceptDisabled) handleAcceptCustomUrl();
                  }}
                />
                <Button
                  size="small"
                  onClick={handleAcceptCustomUrl}
                  disabled={isAcceptDisabled || !customUrl.trim()}
                >
                  {isAcceptDisabled ? "Wait 5s..." : "Accept"}
                </Button>
              </div>
              {/* Failed Upload Error Message  */}
              {urlError && <ErrorMessage error={urlError}/>}
              <p className="text-tiny center">
                Visit this <a 
                  href='https://github.com/filippofilip95/car-logos-dataset/tree/master' 
                  className='clickable-text'
                > Car Logo Dataset </a> 
                and use the thumbnail version. Example:  <br/> 
                https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/volkswagen.png
              </p>
              <div className='spacer-small' />
            </>
          )}
          {/* ======================================================== */}

          <label className="btn btn-primary btn-force-flex btn-small upload-btn">
            <Upload size={20} />
            Upload Custom Photo
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
          {uploading && <p>Uploading...</p>}
          {/* Failed Upload Error Message  */}
          {error && <ErrorMessage error={error}/>}
          {/* Success Upload Message  */}
          {success && <SuccessMessage message={success}/>}
        </div>

        <div className="avatar-tool-actions">
          <Button
            variant="transparent"
            size="small"
            className="one-hundred-50-width"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            size="small"
            className="one-hundred-50-width"
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
