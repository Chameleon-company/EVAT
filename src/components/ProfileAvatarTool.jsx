// components/ProfileAvatarTool.jsx
import { X, Upload, Check } from 'lucide-react';
import { useState, useEffect, useRef, useContext  } from 'react';
import { UserContext } from "../context/user";
import ErrorMessage from '../components/ErrorMessage';
import SuccessMessage from '../components/SuccessMessage';

// found a github repo that has 100s of car brand logos
// https://github.com/filippofilip95/car-logos-dataset/tree/master
// they can be embedded directly using the URLs
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
  // Get user from Context
  const { user: contextUser } = useContext(UserContext);

  const fileInputRef = useRef(null);   // reference for uploaded image

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
    setSelectedAvatar(currentAvatar);   // reset the selected option
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
          <button 
            className="btn btn-transparent btn-small one-hundred-50-width" 
            onClick={handleClose}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary btn-small one-hundred-50-width" 
            onClick={handleSave}
          >
            Save Picture
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileAvatarTool;