"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function DatabaseTestPage() {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testDatabaseConnection = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      const response = await fetch("/api/test-db");
      const data = await response.json();
      
      setTestResult({
        success: data.success,
        message: data.message,
        error: data.error,
        sampleData: data.sampleData,
        code: data.code,
        details: data.details
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Database Connection Test</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Test the connection to the Supabase database
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Run Database Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            Click the button below to test the connection to your Supabase database.
            This will verify that the environment variables are correctly configured
            and that the database is accessible.
          </p>
          <Button 
            onClick={testDatabaseConnection} 
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              "Test Database Connection"
            )}
          </Button>
        </CardContent>
      </Card>

      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              <h3 className={`font-semibold text-lg ${testResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                {testResult.success ? '✅ Connection Successful' : '❌ Connection Failed'}
              </h3>
              
              {testResult.message && (
                <p className="mt-2 text-gray-700 dark:text-gray-300">
                  <strong>Message:</strong> {testResult.message}
                </p>
              )}
              
              {testResult.error && (
                <div className="mt-3">
                  <p className="text-red-700 dark:text-red-300">
                    <strong>Error:</strong> {testResult.error}
                  </p>
                  {testResult.code && (
                    <p className="text-red-700 dark:text-red-300 mt-1">
                      <strong>Code:</strong> {testResult.code}
                    </p>
                  )}
                  {testResult.details && (
                    <p className="text-red-700 dark:text-red-300 mt-1">
                      <strong>Details:</strong> {testResult.details}
                    </p>
                  )}
                </div>
              )}
              
              {testResult.sampleData && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">Sample Data:</h4>
                  <pre className="mt-2 p-3 bg-gray-800 text-gray-100 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(testResult.sampleData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Troubleshooting Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
            <li>Ensure your <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">.env.local</code> file contains the correct Supabase credentials</li>
            <li>Check your internet connection</li>
            <li>Verify that your Supabase project is active and accessible</li>
            <li>Confirm that the Supabase URL and keys are correctly formatted</li>
            <li>If using a firewall or VPN, ensure it's not blocking the connection</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}