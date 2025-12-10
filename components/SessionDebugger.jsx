"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function SessionDebugger() {
  const { data: session, status } = useSession();
  const [apiSession, setApiSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApiSession = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/test-session");
        
        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Received non-JSON response from server");
        }
        
        const data = await response.json();
        setApiSession(data);
      } catch (error) {
        console.error("Error fetching API session:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchApiSession();
    }
  }, [status]);

  if (status === "loading") {
    return <div className="p-4 bg-yellow-100">Loading session...</div>;
  }

  // Don't show debugger in production
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-lg font-bold mb-2">Session Debugger</h2>
      
      <div className="mb-4">
        <h3 className="font-semibold">Client Session:</h3>
        <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>
      
      <div className="mb-4">
        <h3 className="font-semibold">API Session:</h3>
        {loading ? (
          <div>Loading API session...</div>
        ) : error ? (
          <div className="bg-red-100 p-2 rounded text-sm text-red-700">
            Error: {error}
          </div>
        ) : (
          <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
            {JSON.stringify(apiSession, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}