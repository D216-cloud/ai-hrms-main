"use client";

import Link from "next/link";
import { Mail, Home } from "lucide-react";

export default function AdminTestPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
      <div className="max-w-3xl w-full bg-white dark:bg-slate-800 rounded-lg shadow-md p-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center text-red-600 dark:text-red-200 font-bold text-xl">!</div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Unable to Open Test</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Invalid test link</p>
          </div>
        </div>

        <p className="text-slate-700 dark:text-slate-300 mb-6">If you believe this link is valid, contact HR for a new test link.</p>

        <div className="flex flex-col sm:flex-row sm:space-x-4 gap-3">
          <a href="mailto:hr@yourcompany.com" className="flex items-center justify-center px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg">
            <Mail className="w-4 h-4 mr-2" /> Contact HR
          </a>
          <Link href="/admin/dashboard" className="flex items-center justify-center px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200">
            <Home className="w-4 h-4 mr-2" /> Return Home
          </Link>
        </div>

        <div className="mt-6 text-sm text-slate-500 dark:text-slate-400">If you continue to see this message, please contact your HR administrator.</div>
      </div>
    </div>
  );
}
