const API_URL = import.meta.env.VITE_API_URL;
const baseUrl = `${API_URL}/feedback`;

/**
 * Submit feedback to the backend
 * @param {Object} feedbackData - The feedback data containing name, email, and suggestion
 * @returns {Promise<Object>} - The response from the API
 */
export const submitFeedback = async (feedbackData) => {
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedbackData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
};

/**
 * Get all feedbacks (Admin only)
 * @param {Object} options - Query options like page, limit, status
 * @returns {Promise<Object>} - The response from the API
 */
export const getAllFeedbacks = async (options = {}) => {
  try {
    const { page = 1, limit = 10, status } = options;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status })
    });

    const response = await fetch(`${baseUrl}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization header if needed for admin access
        // 'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    throw error;
  }
};

/**
 * Get feedback by ID (Admin only)
 * @param {string} feedbackId - The feedback ID
 * @returns {Promise<Object>} - The response from the API
 */
export const getFeedbackById = async (feedbackId) => {
  try {
    const response = await fetch(`${baseUrl}/${feedbackId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization header if needed for admin access
        // 'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching feedback:', error);
    throw error;
  }
};

/**
 * Get feedbacks by email (Admin only)
 * @param {string} email - The email address
 * @returns {Promise<Object>} - The response from the API
 */
export const getFeedbacksByEmail = async (email) => {
  try {
    const response = await fetch(`${baseUrl}/email?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization header if needed for admin access
        // 'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching feedbacks by email:', error);
    throw error;
  }
};

/**
 * Update feedback status (Admin only)
 * @param {string} feedbackId - The feedback ID
 * @param {string} status - The new status (pending, reviewed, resolved)
 * @returns {Promise<Object>} - The response from the API
 */
export const updateFeedbackStatus = async (feedbackId, status) => {
  try {
    const response = await fetch(`${baseUrl}/${feedbackId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization header if needed for admin access
        // 'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error updating feedback status:', error);
    throw error;
  }
};

/**
 * Delete feedback (Admin only)
 * @param {string} feedbackId - The feedback ID
 * @returns {Promise<Object>} - The response from the API
 */
export const deleteFeedback = async (feedbackId) => {
  try {
    const response = await fetch(`${baseUrl}/${feedbackId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization header if needed for admin access
        // 'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error deleting feedback:', error);
    throw error;
  }
};

/**
 * Get feedback statistics (Admin only)
 * @returns {Promise<Object>} - The response from the API
 */
export const getFeedbackStatistics = async () => {
  try {
    const response = await fetch(`${baseUrl}/statistics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization header if needed for admin access
        // 'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching feedback statistics:', error);
    throw error;
  }
};
