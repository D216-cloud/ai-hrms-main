"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function MessagePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/hr-login");
    if (status === "authenticated") setLoading(false);
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Messages</h1>
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg">New Message</button>
            <button className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg">Filters</button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-white">Inbox</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">No messages yet.</p>
        </div>
      </div>
    </div>
  );
}
