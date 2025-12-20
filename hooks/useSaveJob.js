import { useState, useEffect, useCallback } from "react";
import {
  getSavedJobs,
  saveJob,
  removeJob,
  isJobSaved,
  getSavedJobsCount,
} from "@/lib/savedJobsStorage";

/**
 * Custom hook for managing saved jobs with localStorage
 * @param {string} jobId - Optional job ID to track saved status
 * @returns {Object} Hook state and methods
 */
export function useSaveJob(jobId = null) {
  const [savedJobs, setSavedJobs] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load all saved jobs from localStorage
  const loadSavedJobs = useCallback(() => {
    const jobs = getSavedJobs();
    setSavedJobs(jobs);
    setSavedCount(jobs.length);
  }, []);

  // Load saved jobs on mount
  useEffect(() => {
    loadSavedJobs();
  }, [loadSavedJobs]);

  // Check if specific job is saved when jobId changes
  useEffect(() => {
    if (jobId) {
      setIsSaved(isJobSaved(jobId));
    }
  }, [jobId, savedJobs]);

  // Toggle save/unsave for a job
  const toggleSaveJob = useCallback(
    (job) => {
      setLoading(true);

      try {
        const jobId = job._id || job.id;
        const isCurrentlySaved = isJobSaved(jobId);

        let result;
        if (isCurrentlySaved) {
          result = removeJob(jobId);
        } else {
          result = saveJob(job);
        }

        // Reload saved jobs to update state
        loadSavedJobs();

        return result;
      } catch (error) {
        console.error("Error toggling save job:", error);
        return { success: false, message: "An error occurred" };
      } finally {
        setLoading(false);
      }
    },
    [loadSavedJobs]
  );

  // Save a specific job
  const handleSaveJob = useCallback(
    (job) => {
      setLoading(true);
      const result = saveJob(job);
      loadSavedJobs();
      setLoading(false);
      return result;
    },
    [loadSavedJobs]
  );

  // Remove a specific job
  const handleRemoveJob = useCallback(
    (jobId) => {
      setLoading(true);
      const result = removeJob(jobId);
      loadSavedJobs();
      setLoading(false);
      return result;
    },
    [loadSavedJobs]
  );

  // Refresh saved jobs (useful for cross-component updates)
  const refreshSavedJobs = useCallback(() => {
    loadSavedJobs();
  }, [loadSavedJobs]);

  return {
    savedJobs,
    isSaved,
    savedCount,
    loading,
    toggleSaveJob,
    handleSaveJob,
    handleRemoveJob,
    refreshSavedJobs,
  };
}
