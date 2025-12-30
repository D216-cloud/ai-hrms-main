"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function MessagePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Candidates to show (filtered to those selected for interview/shortlisted)
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [showComposer, setShowComposer] = useState(true);

  // Test modal and workflow state
  const [showTestModal, setShowTestModal] = useState(false);
  const [testCandidateId, setTestCandidateId] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testData, setTestData] = useState(null); // { questions, id, duration_minutes }
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);

  // Ad-hoc generation & sharing
  const [testCount, setTestCount] = useState(20);
  const [generatedQuestions, setGeneratedQuestions] = useState(null);
  const [creatingShare, setCreatingShare] = useState(false);
  const [shareResult, setShareResult] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/hr-login");
    if (status === "authenticated") setLoading(false);
  }, [status, router]);

  // Fetch applications (HR-owned) and filter to interview candidates
  const [messages, setMessages] = useState([]);
  const [emailConfig, setEmailConfig] = useState({ configured: null });

  useEffect(() => {
    async function loadCandidates() {
      try {
        setLoading(true);
        const res = await fetch('/api/job-applications');
        const json = await res.json();
        const apps = json?.applications || [];
        // Show candidates HR selected for interview or shortlisted
        const filtered = apps.filter(a => ['shortlisted', 'interviewing'].includes((a.status || '').toLowerCase()));
        setCandidates(filtered);
      } catch (err) {
        console.error('Failed to load candidates for messaging:', err);
      } finally {
        setLoading(false);
      }
    }

    async function loadMessages() {
      try {
        const res = await fetch('/api/messages');
        const json = await res.json();
        setMessages(json.messages || []);
      } catch (err) {
        console.error('Failed to load messages for hr:', err);
      }
    }

    async function loadEmailConfig() {
      try {
        const res = await fetch('/api/email/config');
        const json = await res.json();
        setEmailConfig(json || { configured: false });
      } catch (err) {
        console.error('Failed to load email config:', err);
        setEmailConfig({ configured: false, reason: 'error' });
      }
    }

    if (status === 'authenticated') {
      loadCandidates();
      loadMessages();
      loadEmailConfig();
    }
  }, [status]);

  function toggleSelect(c) {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(c.id)) s.delete(c.id);
      else s.add(c.id);
      return s;
    });
  }

  function selectAll() {
    setSelected(new Set(candidates.map(c => c.id)));
  }

  async function handleSend() {
    setSendResult(null);
    if (selected.size === 0) {
      setSendResult({ success: false, message: 'Select at least one recipient.' });
      return;
    }

    const recipients = candidates.filter(c => selected.has(c.id)).map(c => ({ id: c.id, source: c.source || 'seeker', email: c.email, name: c.name, interview_id: c.raw?.interview_id || null }));

    try {
      setSending(true);
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients, subject, body }),
      });
      const json = await res.json();
      if (json?.success) {
        let msg = `Sent to ${json.inserted} recipients.`;
        if (json.emailWarnings && json.emailWarnings.length > 0) {
          msg += ` (Email warnings: ${json.emailWarnings.slice(0,3).join('; ')})`;
        }
        setSendResult({ success: true, message: msg });
        setSelected(new Set());
        setSubject('');
        setBody('');
      } else {
        setSendResult({ success: false, message: json?.error || 'Failed to send message.' });
        if (json?.details) setSendResult({ success: false, message: `${json?.error || 'Failed to send message.'} — ${json.details}` });
      }
    } catch (err) {
      console.error('Send message error:', err);
      setSendResult({ success: false, message: 'Unexpected error sending message.' });
    } finally {
      setSending(false);
    }
  }

  // Open the test modal. If exactly one candidate is selected, pre-select them and load their job's test if any.
  function openTestModal() {
    setInviteResult(null);
    setTestData(null);
    setTestCandidateId(null);

    if (selected.size === 1) {
      const id = [...selected][0];
      setTestCandidateId(id);
      loadTestForCandidate(id);
    }

    setShowTestModal(true);
  }

  async function loadTestForCandidate(applicationId) {
    setTestLoading(true);
    setTestData(null);
    setInviteResult(null);
    try {
      const c = candidates.find(x => String(x.id) === String(applicationId));
      if (!c) throw new Error('Candidate not found');
      const jobId = c.job_id;
      if (!jobId) throw new Error('Candidate missing job id');

      const res = await fetch(`/api/tests/generate?jobId=${encodeURIComponent(jobId)}`);
      if (res.ok) {
        const body = await res.json();
        setTestData(body);
      } else if (res.status === 404) {
        setTestData(null);
      } else {
        const b = await res.json();
        throw new Error(b?.error || 'Failed to load test');
      }
    } catch (err) {
      console.error('Load test', err);
      setTestData({ error: err.message || 'Failed to load test' });
    } finally {
      setTestLoading(false);
    }
  }

  async function createTestForCandidate() {
    setTestLoading(true);
    setTestData(null);
    try {
      const c = candidates.find(x => String(x.id) === String(testCandidateId));
      if (!c) throw new Error('Candidate not found');
      const jobId = c.job_id;
      if (!jobId) throw new Error('Candidate missing job id');

      const res = await fetch('/api/tests/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, count: testCount || 20 }),
      });
      const b = await res.json();
      if (!res.ok) throw new Error(b?.error || 'Failed to generate test');

      // Fetch the saved test details
      const testRes = await fetch(`/api/tests/generate?jobId=${encodeURIComponent(jobId)}`);
      if (testRes.ok) {
        const tb = await testRes.json();
        setTestData(tb);
      } else {
        setTestData({ error: 'Generated but failed to fetch test details' });
      }
    } catch (err) {
      console.error('Generate test error', err);
      setTestData({ error: err.message || 'Failed to generate test' });
    } finally {
      setTestLoading(false);
    }
  }

  async function inviteCandidateToTest(applicationId) {
    setInviting(true);
    setInviteResult(null);
    try {
      const res = await fetch('/api/tests/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId }),
      });
      const b = await res.json();
      if (!res.ok) throw new Error(b?.error || 'Failed to invite');

      setInviteResult({ success: true, url: b.testUrl, token: b.testToken, message: b.message });
    } catch (err) {
      console.error('Invite error', err);
      setInviteResult({ success: false, message: err.message || 'Invite failed' });
    } finally {
      setInviting(false);
    }
  }

  // Generate ad-hoc questions using AI (no DB save)
  async function generateAdHocTest() {
    setTestLoading(true);
    setGeneratedQuestions(null);
    setShareResult(null);
    try {
      const jobTitleToUse = (testCandidateId && candidates.find(x => String(x.id) === String(testCandidateId))?.job_title) || '';
      const res = await fetch('/api/test/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle: jobTitleToUse || 'Technical Skill', count: testCount }),
      });
      const b = await res.json();
      if (!res.ok) throw new Error(b?.error || 'Failed to generate questions');
      setGeneratedQuestions(b.questions || []);
    } catch (err) {
      console.error('Ad-hoc generate error', err);
      setGeneratedQuestions([]);
      alert('Failed to generate questions: ' + (err?.message || err));
    } finally {
      setTestLoading(false);
    }
  }

  // Create a small share resource and return url
  async function createSharedLink() {
    if (!generatedQuestions || generatedQuestions.length === 0) return;
    setCreatingShare(true);
    setShareResult(null);
    try {
      const jobTitleToUse = (testCandidateId && candidates.find(x => String(x.id) === String(testCandidateId))?.job_title) || '';
      const res = await fetch('/api/tests/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle: jobTitleToUse || 'Ad-hoc Test', questions: generatedQuestions, duration_minutes: 30 }),
      });
      const b = await res.json();
      if (!res.ok) {
        const msg = `${b?.error || 'Failed to create link'}${b?.details ? ' — ' + b.details : ''}${b?.advice ? ' — ' + b.advice : ''}`;
        setShareResult({ success: false, message: msg });
        return;
      }
      setShareResult({ success: true, url: b.url, token: b.token });
    } catch (err) {
      console.error('Create share link error', err);
      setShareResult({ success: false, message: err?.message || 'Failed to create link' });
    } finally {
      setCreatingShare(false);
    }
  }

  function copyLinkToClipboard() {
    if (!inviteResult?.url) return;
    try {
      navigator.clipboard.writeText(inviteResult.url);
      alert('Copied link to clipboard');
    } catch (e) {
      console.warn('Copy failed', e);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Hero */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Messages</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Compose messages to selected candidates and view recent sends.</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowComposer(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl font-semibold">New Message</button>
              <button onClick={() => openTestModal()} className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-sm">Generate Test</button>
              <button className="px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-sm">Filters</button>
            </div>
          </div>
        </div>

        {/* Stats/Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md">
            <p className="text-sm text-slate-500">Total Sent</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{messages.length}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md">
            <p className="text-sm text-slate-500">Recipients</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{candidates.length}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md">
            <p className="text-sm text-slate-500">Unsent/Email Warnings</p>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">{'' /* placeholder */}</p>
          </div>
        </div>

        {/* Main panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent messages */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Recent Messages</h2>
              {messages.length === 0 ? (
                <p className="text-sm text-slate-500">No messages yet.</p>
              ) : (
                <ul className="space-y-3">
                  {messages.slice(0,8).map(m => (
                    <li key={m.id} className="p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 cursor-default">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{m.subject || 'No subject'}</div>
                      <div className="text-xs text-slate-500 mt-1">{m.to_name || m.to_email} • {m.sent_at ? new Date(m.sent_at).toLocaleString() : ''}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Composer + Candidates */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Send Message</h3>
                <div className="text-sm text-slate-500">Recipients: <strong className="text-slate-900 dark:text-white">{selected.size}</strong></div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <div className="mb-4">
                    <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" />
                  </div>

                  <div className="mb-4">
                    <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder="Write your message here" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" />
                  </div>

                  <div className="flex items-center gap-3">
                    <button onClick={() => handleSend()} disabled={sending} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg">{sending ? 'Sending...' : 'Send Message'}</button>
                    <button onClick={() => setShowComposer(false)} className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg">Cancel</button>
                  </div>

                  {sendResult && (
                    <div className={`mt-4 text-sm ${sendResult.success ? 'text-green-600' : 'text-red-600'}`}>{sendResult.message}</div>
                  )}
                </div>

                <div className="lg:col-span-1">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-slate-900 dark:text-white">Interview Candidates</h4>
                      <button className="text-sm text-teal-600" onClick={() => selectAll()}>Select all</button>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">Tap to select who will receive the message</p>
                    <div className="space-y-2 max-h-[56vh] overflow-y-auto">
                      {candidates.length === 0 ? (
                        <div className="text-sm text-slate-500">No candidates selected for interview yet.</div>
                      ) : (
                        candidates.map(c => (
                          <button key={c.id} onClick={() => toggleSelect(c)} className={`w-full text-left p-3 rounded-lg border ${selected.has(c.id) ? 'border-teal-400 bg-slate-50 dark:bg-slate-900' : 'border-slate-200 dark:border-slate-700'} hover:shadow-sm` }>
                            <div className="font-medium text-slate-900 dark:text-white truncate">{c.name}</div>
                            <div className="text-xs text-slate-500 mt-1">{c.job_title} • {c.location || 'Remote'}</div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>

        {showTestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowTestModal(false)} />
            <div className="relative z-10 max-w-3xl w-full mx-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Generate Test & Invite</h2>
                    <p className="text-sm text-slate-500">Preview questions for the job and generate a shareable test link for a candidate.</p>
                  </div>
                  <button onClick={() => setShowTestModal(false)} className="text-slate-500 hover:text-slate-700">Close</button>
                </div>

                {/* Candidate selector */}
                <div className="mb-4">
                  <label className="block text-sm text-slate-600 mb-2">Candidate</label>
                  {testCandidateId ? (
                    <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded">{candidates.find(x => String(x.id) === String(testCandidateId))?.name || 'Selected candidate'}</div>
                  ) : (
                    <select value={testCandidateId || ''} onChange={(e) => { const val = e.target.value; setTestCandidateId(val); setInviteResult(null); setTestData(null); if (val) loadTestForCandidate(val); }} className="w-full border rounded p-2 dark:bg-slate-800">
                      <option value="">-- Select candidate --</option>
                      {candidates.map(c => (
                        <option key={c.id} value={c.id}>{c.name} — {c.job_title}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Test preview / generate */}
                <div className="mb-4 max-h-[50vh] overflow-y-auto">
                  <div className="mb-3 flex items-center gap-3">
                    <label className="text-sm text-slate-600">Questions</label>
                    <input type="number" min={5} max={100} value={testCount || 20} onChange={(e) => setTestCount(Number(e.target.value))} className="w-24 p-1 border rounded" />
                    <button onClick={() => generateAdHocTest()} className="px-3 py-1 bg-teal-600 text-white rounded">Generate Questions</button>
                    <button onClick={() => createSharedLink()} disabled={!generatedQuestions || generatedQuestions.length===0 || creatingShare} className="px-3 py-1 bg-blue-600 text-white rounded">Create Share Link</button>
                    {creatingShare && <div className="text-sm text-slate-500">Creating link...</div>}
                  </div>

                  {testLoading ? (
                    <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin text-teal-600" /> Loading test...</div>
                  ) : testData && testData.error ? (
                    <div className="text-sm text-rose-600">{testData.error}</div>
                  ) : !testData && (!generatedQuestions || generatedQuestions.length===0) ? (
                    <div className="text-sm text-slate-500">No test exists for this candidate's job. You can generate questions using the controls above.</div>
                  ) : (
                    <div>
                      <div className="mb-3 text-sm text-slate-700">Questions ({(generatedQuestions || testData?.questions || []).length})</div>
                      <ol className="space-y-4">
                        {(generatedQuestions || testData?.questions || []).map((q, i) => (
                          <li key={i} className="p-3 bg-slate-50 dark:bg-slate-700 rounded">
                            <div className="font-medium">{i+1}. {q.q}</div>
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                              {(q.options || []).map((opt, oi) => (
                                <div key={oi} className="p-2 border rounded bg-white dark:bg-slate-800">{opt}</div>
                              ))}
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {shareResult && (
                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700 rounded">
                      {shareResult.success ? (
                        <div>
                          <div className="text-sm mb-2">Share link created:</div>
                          <div className="flex items-center gap-2">
                            <input readOnly value={shareResult.url} className="flex-1 p-2 border rounded dark:bg-slate-800" />
                            <button onClick={() => { try { navigator.clipboard.writeText(shareResult.url); alert('Copied'); } catch(e){console.warn('copy failed',e);} }} className="px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded">Copy</button>
                            <button onClick={() => { setBody(b => (b ? b + '\n\n' : '') + (shareResult.url || '')); setShowTestModal(false); setShowComposer(true); try { navigator.clipboard.writeText(shareResult.url); } catch(e){}; alert('Inserted link into message composer'); }} className="px-3 py-2 bg-emerald-600 text-white rounded">Insert into Message</button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-rose-600">Failed to create link: {shareResult.message}</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {!testData && (
                    <button onClick={() => createTestForCandidate()} className="px-4 py-2 bg-teal-600 text-white rounded" disabled={!testCandidateId || testLoading}>Generate Test for Job</button>
                  )}

                  {testData && (
                    <button onClick={() => inviteCandidateToTest(testCandidateId)} className="px-4 py-2 bg-blue-600 text-white rounded" disabled={!testCandidateId || inviting}>{inviting ? 'Inviting...' : 'Invite Candidate'}</button>
                  )}

                  <button onClick={() => setShowTestModal(false)} className="px-3 py-2 bg-white dark:bg-slate-700 border rounded">Close</button>
                </div>

                {inviteResult && (
                  <div className="mt-4 p-3 rounded bg-slate-50 dark:bg-slate-700">
                    {inviteResult.success ? (
                      <div>
                        <div className="mb-2 text-sm">Test invited successfully. Share this link with the candidate:</div>
                        <div className="flex items-center gap-2">
                          <input readOnly value={inviteResult.url} className="flex-1 p-2 border rounded dark:bg-slate-800" />
                          <button onClick={() => { try { navigator.clipboard.writeText(inviteResult.url); alert('Copied link'); } catch(e){console.warn('copy failed',e);} }} className="px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded">Copy</button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-rose-600">Invite failed: {inviteResult.message}</div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
