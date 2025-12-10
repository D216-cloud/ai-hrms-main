"use client";

import { useState } from "react";

export default function FetchTestPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testFetch = async () => {
    setLoading(true);
    try {
      console.log("Starting fetch request...");
      
      const response = await fetch("/api/debug-session", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      console.log("Fetch response received:", response);
      console.log("Response status:", response.status);
      console.log("Response headers:", [...response.headers.entries()]);
      
      const data = await response.json();
      console.log("Response data:", data);
      
      setResult({
        status: response.status,
        data: data,
        headers: [...response.headers.entries()]
      });
    } catch (error) {
      console.error("Fetch error:", error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Fetch Test Page</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <button
          onClick={testFetch}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 mb-4"
        >
          Test Fetch Request
        </button>
        
        {loading && <p>Testing...</p>}
        
        {result && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Fetch Result:</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}