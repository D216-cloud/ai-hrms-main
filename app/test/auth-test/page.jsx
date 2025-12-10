"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

export default function AuthTestPage() {
  const { data: session, status } = useSession();
  const [apiTestResult, setApiTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testApiRoute = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/test-session");
      const data = await response.json();
      setApiTestResult(data);
    } catch (error) {
      console.error("Error testing API route:", error);
      setApiTestResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testGenerateJdRoute = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/jobs/generate-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test Position",
          location: "Test Location",
          experienceMin: 2,
          experienceMax: 5,
        }),
        credentials: "include",
      });
      const data = await response.json();
      setApiTestResult(data);
    } catch (error) {
      console.error("Error testing generate JD route:", error);
      setApiTestResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Client Session Status</h2>
        {status === "loading" ? (
          <p>Loading session...</p>
        ) : status === "authenticated" ? (
          <div>
            <p className="text-green-600">✅ Authenticated</p>
            <p><strong>Email:</strong> {session?.user?.email}</p>
            <p><strong>Role:</strong> {session?.user?.role}</p>
            <p><strong>ID:</strong> {session?.user?.id}</p>
          </div>
        ) : (
          <p className="text-red-600">❌ Not authenticated</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">API Tests</h2>
        
        <div className="flex gap-4 mb-4">
          <button
            onClick={testApiRoute}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Test Session API
          </button>
          
          <button
            onClick={testGenerateJdRoute}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Test Generate JD API
          </button>
        </div>
        
        {loading && <p>Testing...</p>}
        
        {apiTestResult && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">API Response:</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
              {JSON.stringify(apiTestResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}