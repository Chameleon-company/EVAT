const API_URL = import.meta.env.VITE_API_URL;
const baseUrl = `${API_URL}/support-requests`;
import DOMPurify from "dompurify";

/**
 * Submit support request to backend
 * @param {Object} supportData
 * @returns {Promise<Object>}
 */

export const submitSupportRequest = async (supportData) => {
    try {
        supportData.description = DOMPurify.sanitize(supportData.description);
        if (supportData.description.trim() === "") {
            throw new Error("Cannot submit feedback with potentially malicious Javascript/HTML.");
        }
        const userId = supportData.userId;
        delete supportData.userId;
        const response = await fetch(baseUrl, {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            "x-user-id": String(userId),
            },
            body: JSON.stringify(supportData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        return result;
    }
    catch (error) {
        console.error('Error submitting feedback:', error);
        throw error;
    }
};