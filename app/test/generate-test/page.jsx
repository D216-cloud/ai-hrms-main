"use client";

import { useState } from "react";

export default function GenerateTestPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testGenerate = async () => {
    setLoading(true);
    try {
      console.log("Starting generate test request...");
      
      const response = await fetch("/api/jobs/test-generate", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Test Position",
          location: "Test Location",
          experienceMin: 2,
          experienceMax: 5,
        }),
      });
      
      console.log("Generate test response received:", response);
      console.log("Response status:", response.status);
      
      const data = await response.json();
      console.log("Response data:", data);
      
      setResult({
        status: response.status,
        data: data
      });
    } catch (error) {
      console.error("Generate test error:", error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Generate JD Test Page</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <button
          onClick={testGenerate}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 mb-4"
        >
          Test Generate JD Request
        </button>
        
        {loading && <p>Testing...</p>}
        
        {result && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Generate Test Result:</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}