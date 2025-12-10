import { useState, useCallback } from "react";

export function useSaveJob() {
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState(null);

  // Check if a job is saved
  const checkIfSaved = useCallback(async (jobId) => {
    if (!jobId) return;

    try {
      const res = await fetch(`/api/seeker/toggle-save-job?jobId=${jobId}`);
      if (!res.ok) throw new Error("Failed to check save status");

      const data = await res.json();
      setIsSaved(data.saved);
    } catch (err) {
      console.error("Error checking saved status:", err);
      setError(err.message);
    }
  }, []);

  // Toggle save/unsave
  const toggleSave = useCallback(async (jobId) => {
    if (!jobId) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/seeker/toggle-save-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          saved: !isSaved,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to toggle save");
      }

      const data = await res.json();
      setIsSaved(data.saved);
      return data;
    } catch (err) {
      console.error("Error toggling save:", err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [isSaved]);

  return {
    isSaved,
    saving,
    error,
    toggleSave,
    checkIfSaved,
  };
}
