/**
 * LocalStorage utilities for managing saved jobs
 * All job data is stored in localStorage under the key "savedJobs"
 */

const STORAGE_KEY = "savedJobs";

/**
 * Get all saved jobs from localStorage
 * @returns {Array} Array of saved job objects
 */
export const getSavedJobs = () => {
  try {
    if (typeof window === "undefined") return [];
    const savedJobs = localStorage.getItem(STORAGE_KEY);
    return savedJobs ? JSON.parse(savedJobs) : [];
  } catch (error) {
    console.error("Error reading saved jobs from localStorage:", error);
    return [];
  }
};

/**
 * Save a job to localStorage
 * @param {Object} job - The complete job object to save
 * @returns {Object} { success: boolean, message: string }
 */
export const saveJob = (job) => {
  try {
    if (typeof window === "undefined") {
      return { success: false, message: "localStorage not available" };
    }

    const savedJobs = getSavedJobs();
    
    // Check if job is already saved
    const isAlreadySaved = savedJobs.some(
      (savedJob) => savedJob._id === job._id || savedJob.id === job.id
    );

    if (isAlreadySaved) {
      return { success: false, message: "Job already saved" };
    }

    // Add job to the array
    const updatedJobs = [...savedJobs, job];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedJobs));

    return { success: true, message: "Job saved successfully!" };
  } catch (error) {
    console.error("Error saving job to localStorage:", error);
    return { success: false, message: "Failed to save job" };
  }
};

/**
 * Remove a job from localStorage
 * @param {string} jobId - The ID of the job to remove
 * @returns {Object} { success: boolean, message: string }
 */
export const removeJob = (jobId) => {
  try {
    if (typeof window === "undefined") {
      return { success: false, message: "localStorage not available" };
    }

    const savedJobs = getSavedJobs();
    const updatedJobs = savedJobs.filter(
      (job) => job._id !== jobId && job.id !== jobId
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedJobs));

    return { success: true, message: "Job removed from saved list" };
  } catch (error) {
    console.error("Error removing job from localStorage:", error);
    return { success: false, message: "Failed to remove job" };
  }
};

/**
 * Check if a job is saved
 * @param {string} jobId - The ID of the job to check
 * @returns {boolean} True if job is saved, false otherwise
 */
export const isJobSaved = (jobId) => {
  try {
    if (typeof window === "undefined") return false;
    
    const savedJobs = getSavedJobs();
    return savedJobs.some(
      (job) => job._id === jobId || job.id === jobId
    );
  } catch (error) {
    console.error("Error checking if job is saved:", error);
    return false;
  }
};

/**
 * Get count of saved jobs
 * @returns {number} Number of saved jobs
 */
export const getSavedJobsCount = () => {
  try {
    const savedJobs = getSavedJobs();
    return savedJobs.length;
  } catch (error) {
    console.error("Error getting saved jobs count:", error);
    return 0;
  }
};

/**
 * Clear all saved jobs
 * @returns {Object} { success: boolean, message: string }
 */
export const clearAllSavedJobs = () => {
  try {
    if (typeof window === "undefined") {
      return { success: false, message: "localStorage not available" };
    }

    localStorage.removeItem(STORAGE_KEY);
    return { success: true, message: "All saved jobs cleared" };
  } catch (error) {
    console.error("Error clearing saved jobs:", error);
    return { success: false, message: "Failed to clear saved jobs" };
  }
};
