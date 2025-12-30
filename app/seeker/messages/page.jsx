"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function SeekerMessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [showList, setShowList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Convert URLs in the message body to clickable links safely
  function linkifyText(text) {
    if (!text) return '';
    const urlRegex = /((https?:\/\/|www\.)[^\s]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = urlRegex.exec(text)) !== null) {
      const url = match[0];
      const idx = match.index;
      if (idx > lastIndex) parts.push(text.slice(lastIndex, idx));
      const href = url.startsWith('http') ? url : `http://${url}`;
      parts.push(
        <a key={idx} href={href} target="_blank" rel="noopener noreferrer" className="text-teal-600 underline">
          {url}
        </a>
      );
      lastIndex = idx + url.length;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts;
  }

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/jobseeker-login");
    if (status === "authenticated") setLoading(false);
  }, [status, router]);

  useEffect(() => {
    let polling;
    async function loadMessages() {
      if (status !== 'authenticated' || !session?.user?.email) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/messages?email=${encodeURIComponent(session.user.email)}`);
        const json = await res.json();
        const msgs = (json.messages || []).map(m => ({
          id: m.id,
          fromName: m.from_name || m.from_email || 'HR',
          preview: (m.content || m.body || '').slice(0, 120),
          time: m.sent_at ? new Date(m.sent_at).toLocaleString() : '',
          body: m.body || m.content || '',
          subject: m.subject || '',
          is_read: !!m.is_read
        }));
        setConversations(msgs);
        if (msgs.length > 0 && active === null) setActive(msgs[0].id);
      } catch (err) {
        console.error('Failed to load messages for seeker:', err);
      } finally {
        setLoading(false);
      }
    }

    // Initial load
    loadMessages();
    // Poll for new messages every 8 seconds while on the page
    polling = setInterval(loadMessages, 8000);
    return () => clearInterval(polling);
  }, [status, session, active]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-linear-to-tr from-cyan-600 to-teal-500 text-white flex items-center justify-center font-bold text-lg">{(session?.user?.name || session?.user?.email || 'S').charAt(0)}</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Messages</h1>
              <div className="text-sm text-slate-500 dark:text-slate-400">{session?.user?.name || session?.user?.email}</div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <a href="/seeker/profile" className="px-3 py-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-sm">View Profile</a>
            <div className="text-sm text-slate-500 dark:text-slate-400">Read-only view</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
          <div className="flex flex-col sm:flex-row h-[72vh]">
            {/* Conversations list */}
            <div className={`w-full sm:w-1/3 border-b sm:border-b-0 sm:border-r border-slate-100 dark:border-slate-700 p-4 sm:p-6 overflow-y-auto ${showList ? 'block' : 'hidden'} sm:block`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1">
                  <input
                    aria-label="Search messages"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search messages or senders"
                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
                  />
                </div>
                <div className="hidden sm:block">
                  <button onClick={() => { setSearchQuery(''); }} className="px-3 py-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-sm">Clear</button>
                </div>
              </div>

              {conversations.filter(c => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                return (c.fromName || '').toLowerCase().includes(q) || (c.preview || '').toLowerCase().includes(q) || (c.subject || '').toLowerCase().includes(q);
              }).length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-sm text-slate-500">No messages yet — when HR sends you a message it will appear here.</div>
                </div>
              ) : (
                <ul className="space-y-2">
                  {conversations.filter(c => {
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    return (c.fromName || '').toLowerCase().includes(q) || (c.preview || '').toLowerCase().includes(q) || (c.subject || '').toLowerCase().includes(q);
                  }).map((c) => (
                    <li
                      key={c.id}
                      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-900 ${active === c.id ? 'ring-2 ring-teal-400 bg-slate-50 dark:bg-slate-900' : ''}`}
                      onClick={async () => { setActive(c.id); if (!c.is_read) { try { await fetch('/api/messages', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id }) }); setConversations(prev => prev.map(p => p.id === c.id ? { ...p, is_read: true } : p)); } catch (err) { console.error('Failed to mark message read:', err); } } if (window.innerWidth < 640) setShowList(false); }}
                    >
                      <div className="w-12 h-12 rounded-full bg-linear-to-tr from-cyan-600 to-teal-500 text-white flex items-center justify-center font-bold text-lg">{(c.fromName || 'H').charAt(0)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{c.fromName}</div>
                          <div className="text-xs text-slate-400 ml-2">{c.time}</div>
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 truncate">{c.preview}</div>
                        <div className="mt-2 flex items-center gap-2">
                          {c.is_read ? null : <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">New</span>}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Message view */}
            <div className={`w-full sm:w-2/3 p-4 sm:p-6 flex flex-col ${showList ? 'block' : 'block'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { if (!showList && window.innerWidth < 640) setShowList(true); }}
                    className="sm:hidden p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-900"
                    aria-label="Back to list"
                  >
                    ←
                  </button>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Message</div>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Read-only</div>
              </div>

              {active === null ? (
                <div className="flex-1 flex items-center justify-center text-center p-6">
                  <div>
                    <div className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No message selected</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Select a message from the left to read it here.</div>
                  </div>
                </div>
              ) : (
                (() => {
                  const msg = conversations.find(m => m.id === active);
                  if (!msg) return null;
                  return (
                    <div className="flex-1 flex flex-col">
                      <div className="mb-4">
                        <div className="text-sm text-slate-500">From: <span className="font-medium text-slate-900 dark:text-white">{msg.fromName}</span></div>
                        <div className="text-xs text-slate-400">{msg.time}</div>
                        {msg.subject && <div className="text-lg font-semibold text-slate-900 dark:text-white mt-2">{msg.subject}</div>}
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-800 dark:text-slate-200">
                        <div className="prose dark:prose-invert max-w-none">
                          <p className="whitespace-pre-wrap break-words">{Array.isArray(linkifyText(msg.body)) ? linkifyText(msg.body) : linkifyText(String(msg.body))}</p>
                        </div>
                      </div>

                      <div className="mt-4 text-sm text-slate-500">This is a read-only message from HR. You cannot reply here yet.</div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
