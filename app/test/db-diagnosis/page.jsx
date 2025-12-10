"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function DatabaseDiagnosisPage() {
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runDiagnosis = async () => {
    setLoading(true);
    setDiagnosisResult(null);
    
    try {
      const response = await fetch("/api/diagnose-db");
      const data = await response.json();
      
      setDiagnosisResult({
        success: data.success,
        message: data.message,
        environment: data.environment,
        tables: data.tables,
        insertTest: data.insertTest,
        error: data.error,
        details: data.details
      });
    } catch (error) {
      setDiagnosisResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (success) => {
    if (success === true) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (success === false) return <XCircle className="h-5 w-5 text-red-500" />;
    return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Database Diagnosis</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Run diagnostics to identify issues with database connectivity and permissions
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Run Database Diagnosis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            Click the button below to run a comprehensive database diagnosis. This will:
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-1 text-gray-700 dark:text-gray-300">
            <li>Check environment variables</li>
            <li>Test connection to user and jobs tables</li>
            <li>Verify insert permissions</li>
            <li>Provide detailed error information</li>
          </ul>
          <Button 
            onClick={runDiagnosis} 
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Diagnosis...
              </>
            ) : (
              "Run Database Diagnosis"
            )}
          </Button>
        </CardContent>
      </Card>

      {diagnosisResult && (
        <Card>
          <CardHeader>
            <CardTitle>Diagnosis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-lg mb-4 ${diagnosisResult.success ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              <div className="flex items-center gap-2">
                {getStatusIcon(diagnosisResult.success)}
                <h3 className={`font-semibold text-lg ${diagnosisResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                  {diagnosisResult.success ? 'Diagnosis Completed Successfully' : 'Diagnosis Failed'}
                </h3>
              </div>
              
              {diagnosisResult.message && (
                <p className="mt-2 text-gray-700 dark:text-gray-300">
                  {diagnosisResult.message}
                </p>
              )}
              
              {diagnosisResult.error && (
                <div className="mt-3">
                  <p className="text-red-700 dark:text-red-300">
                    <strong>Error:</strong> {diagnosisResult.error}
                  </p>
                  {diagnosisResult.details && (
                    <p className="text-red-700 dark:text-red-300 mt-1">
                      <strong>Details:</strong> {diagnosisResult.details}
                    </p>
                  )}
                </div>
              )}
            </div>

            {diagnosisResult.environment && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Environment Check</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <span>Supabase URL</span>
                    {getStatusIcon(diagnosisResult.environment.hasSupabaseUrl)}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <span>Anon Key</span>
                    {getStatusIcon(diagnosisResult.environment.hasAnonKey)}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <span>Service Key</span>
                    {getStatusIcon(diagnosisResult.environment.hasServiceKey)}
                  </div>
                </div>
              </div>
            )}

            {diagnosisResult.tables && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Database Tables</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">hr_users</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Exists:</span>
                        {getStatusIcon(diagnosisResult.tables.hr_users.exists)}
                      </div>
                    </div>
                    {diagnosisResult.tables.hr_users.exists && (
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm">Accessible:</span>
                        {getStatusIcon(diagnosisResult.tables.hr_users.accessible)}
                      </div>
                    )}
                    {diagnosisResult.tables.hr_users.error && (
                      <p className="mt-2 text-red-500 text-sm">
                        Error: {diagnosisResult.tables.hr_users.error}
                      </p>
                    )}
                  </div>
                  
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">jobs</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Exists:</span>
                        {getStatusIcon(diagnosisResult.tables.jobs.exists)}
                      </div>
                    </div>
                    {diagnosisResult.tables.jobs.exists && (
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm">Accessible:</span>
                        {getStatusIcon(diagnosisResult.tables.jobs.accessible)}
                      </div>
                    )}
                    {diagnosisResult.tables.jobs.error && (
                      <p className="mt-2 text-red-500 text-sm">
                        Error: {diagnosisResult.tables.jobs.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {diagnosisResult.insertTest && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Insert Permissions</h4>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <span>Working</span>
                  {getStatusIcon(diagnosisResult.insertTest.successful)}
                </div>
                {diagnosisResult.insertTest.error && (
                  <div className="mt-2">
                    <p className="text-red-500 text-sm">
                      Error: {diagnosisResult.insertTest.error}
                    </p>
                    {diagnosisResult.insertTest.code && (
                      <p className="text-red-500 text-sm">
                        Code: {diagnosisResult.insertTest.code}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Troubleshooting Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Common Solutions:</h4>
          <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong>Missing Environment Variables:</strong> Check your <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">.env.local</code> file</li>
            <li><strong>Connection Issues:</strong> Verify internet connectivity and firewall settings</li>
            <li><strong>Permission Errors:</strong> Check Supabase RLS policies and user roles</li>
            <li><strong>Table Issues:</strong> Ensure you have run the database migrations</li>
            <li><strong>Foreign Key Issues:</strong> Make sure the hr_users table has valid entries before creating jobs</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}