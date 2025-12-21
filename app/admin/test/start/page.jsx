"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function StartTestPage() {
  const search = useSearchParams();
  const router = useRouter();
  const skillParam = search.get("skill") || "";
  const titleParam = search.get("jobTitle") || "Skill Test";
  const jobIdParam = search.get("jobId") || null;

  const [skillInput, setSkillInput] = useState(skillParam);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState(null);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [jobSkills, setJobSkills] = useState(null);
  const [jobTitle, setJobTitle] = useState(titleParam);
  const [testStarted, setTestStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes in seconds
  const [saving, setSaving] = useState(false);
  const [savedIndex, setSavedIndex] = useState([]);
  const [selectedSavedKey, setSelectedSavedKey] = useState(null);
  const [selectedSavedPayload, setSelectedSavedPayload] = useState(null);

  useEffect(() => {
    // If a jobId is provided, fetch the job and extract skills
    const fetchJob = async () => {
      if (!jobIdParam) return;
      try {
        const res = await fetch(`/api/jobs/${encodeURIComponent(jobIdParam)}`);
        if (!res.ok) return;
        const job = await res.json();
        setJobTitle(job.title || titleParam);
        // Expecting job.skills as array or comma-separated string
        let skills = null;
        if (Array.isArray(job.skills)) skills = job.skills;
        else if (typeof job.skills === 'string') skills = job.skills.split(',').map(s=>s.trim()).filter(Boolean);
        if (skills && skills.length > 0) {
          setJobSkills(skills);
          setSkillInput(skills.join(', '));
        }
      } catch (e) {
        console.warn('Failed to load job for test start', e);
      }
    };
    fetchJob();
    // load saved test index from localStorage
    try {
      const raw = localStorage.getItem('admin_test_saves_index');
      const idx = raw ? JSON.parse(raw) : [];
      setSavedIndex(idx);
    } catch (e) {
      console.warn('Failed to load saved tests index', e);
      setSavedIndex([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobIdParam]);

  const startTest = async () => {
    if (!skillInput.trim()) return alert("Please provide a skill to generate questions");
    try {
      setLoading(true);
      setQuestions(null);
      setScore(null);

      // If jobSkills are present, use them (non-editable), otherwise use skillInput
      const skillsToUse = jobSkills && jobSkills.length > 0 ? jobSkills : skillInput.split(',').map(s=>s.trim()).filter(Boolean);

      const res = await fetch("/api/test/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle: jobTitle || titleParam, skills: skillsToUse, count: 20 }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body?.error || "Failed to generate questions");
      setQuestions(body.questions || []);
      // start timer
      setTestStarted(true);
      setTimeRemaining(30 * 60);
    } catch (err) {
      console.error(err);
      alert("Failed to generate test: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  // Timer effect
  useEffect(() => {
    if (!testStarted) return;
    const iv = setInterval(() => {
      setTimeRemaining((t) => {
        if (t <= 1) {
          clearInterval(iv);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [testStarted]);

  const selectOption = (qi, idx) => {
    setAnswers(a => ({ ...a, [qi]: idx }));
  };

  const submitAnswers = () => {
    if (!questions) return;
    let correct = 0;
    questions.forEach((q, i) => {
      const sel = answers[i];
      if (typeof sel === 'number' && sel === q.correctIndex) correct++;
    });
    setScore({ correct, total: questions.length, percent: Math.round((correct / questions.length) * 100) });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-2">Start Test</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Generate a 20-question MCQ test based on a skill keyword.</p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Skill</label>
            <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="e.g. React, Node.js, SQL" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700" readOnly={!!jobSkills} disabled={!!jobSkills} />
            {jobSkills && <p className="mt-2 text-xs text-slate-500">Skills provided by job: not editable</p>}
          </div>

          <div className="flex items-center space-x-3 mb-6">
            <button onClick={startTest} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center" disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Start Test</button>
            <Link href="/admin/test" className="px-4 py-2 bg-white dark:bg-slate-700 border rounded-lg">Cancel</Link>
          </div>

          {questions && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Questions</h2>
              <ol className="space-y-6">
                {questions.map((q, i) => (
                  <li key={i} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <div className="mb-2 font-medium">{i+1}. {q.q}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(q.options || []).map((opt, oi) => (
                        <label key={oi} className="flex items-center space-x-2 p-2 bg-white dark:bg-slate-800 border rounded">
                          <input type="radio" name={`q_${i}`} checked={answers[i]===oi} onChange={() => selectOption(i, oi)} />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-4 flex items-center space-x-3">
                <button onClick={submitAnswers} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Submit</button>
                {score && <div className="text-sm">Score: <strong>{score.correct}/{score.total}</strong> ({score.percent}%)</div>}
                {score && (
                  <button
                    onClick={() => {
                      setSaving(true);
                      try {
                        const payload = {
                          jobId: jobIdParam,
                          jobTitle: jobTitle || titleParam,
                          questions: questions || [],
                          answers: answers || {},
                          score: score || null,
                          correctAnswers: score?.correct ?? null,
                          totalQuestions: score?.total ?? null,
                          savedAt: new Date().toISOString(),
                        };
                        const key = `admin_test_save_${jobIdParam || 'manual'}_${Date.now()}`;
                        localStorage.setItem(key, JSON.stringify(payload));

                        // maintain a small index of saved items for quick lookup in the UI later
                        const indexKey = 'admin_test_saves_index';
                        try {
                          const raw = localStorage.getItem(indexKey);
                          const idx = raw ? JSON.parse(raw) : [];
                          idx.unshift({ key, jobId: jobIdParam, jobTitle: payload.jobTitle, savedAt: payload.savedAt });
                          const sliced = idx.slice(0, 50);
                          localStorage.setItem(indexKey, JSON.stringify(sliced));
                          setSavedIndex(sliced);
                        } catch (e) {
                          console.warn('Failed to update save index', e);
                        }

                        alert('Saved test results to localStorage (' + key + ')');
                      } catch (e) {
                        console.error('Save error:', e);
                        alert('Failed to save to localStorage: ' + (e?.message || e));
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                    className="px-3 py-1 bg-green-600 text-white rounded-lg"
                  >
                    {saving ? 'Saving...' : 'Save Results'}
                  </button>
                )}
                {/* Timer display */}
                {testStarted && (
                  <div className="ml-auto text-sm text-gray-700">
                    Time left: <strong>{Math.floor(timeRemaining/60)}:{String(timeRemaining%60).padStart(2,'0')}</strong>
                  </div>
                )}
              </div>
              
            </div>
          )}

          {/* Saved results list */}
          {savedIndex && savedIndex.length > 0 && (
            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <h3 className="font-semibold mb-3">Saved Tests</h3>
              <ul className="space-y-2">
                {savedIndex.map((it) => (
                  <li key={it.key} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 border rounded">
                    <div>
                      <div className="text-sm font-medium">{it.jobTitle || 'Manual'}</div>
                      <div className="text-xs text-slate-500">{it.savedAt ? new Date(it.savedAt).toLocaleString() : ''}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const raw = localStorage.getItem(it.key);
                          if (!raw) return alert('Saved data not found');
                          try {
                            const p = JSON.parse(raw);
                            setSelectedSavedPayload(p);
                            setSelectedSavedKey(it.key);
                          } catch (e) {
                            console.error('Failed to parse saved payload', e);
                            alert('Failed to load saved data');
                          }
                        }}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => {
                          localStorage.removeItem(it.key);
                          const newIdx = savedIndex.filter((s) => s.key !== it.key);
                          setSavedIndex(newIdx);
                          localStorage.setItem('admin_test_saves_index', JSON.stringify(newIdx));
                          if (selectedSavedKey === it.key) {
                            setSelectedSavedKey(null);
                            setSelectedSavedPayload(null);
                          }
                        }}
                        className="px-2 py-1 bg-red-600 text-white rounded text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Selected saved payload details */}
          {selectedSavedPayload && (
            <div className="mt-6 p-4 bg-white dark:bg-slate-800 rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Saved Result: {selectedSavedPayload.jobTitle || 'Manual'}</h3>
                <div className="text-sm text-slate-500">{selectedSavedPayload.savedAt ? new Date(selectedSavedPayload.savedAt).toLocaleString() : ''}</div>
              </div>
              <div className="mt-2 text-sm">Score: <strong>{selectedSavedPayload.score?.percent ?? selectedSavedPayload.score ?? `${selectedSavedPayload.correctAnswers}/${selectedSavedPayload.totalQuestions}`}</strong></div>
              <div className="mt-4 space-y-4">
                {(selectedSavedPayload.questions || []).map((q, i) => {
                  const sel = selectedSavedPayload.answers?.[i];
                  return (
                    <div key={i} className="p-3 bg-slate-50 dark:bg-slate-700 rounded">
                      <div className="font-medium">{i + 1}. {q.q}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {(q.options || []).map((opt, oi) => {
                          const isSelected = sel === oi;
                          const isCorrect = q.correctIndex === oi;
                          return (
                            <div key={oi} className={`p-2 border rounded ${isCorrect ? 'bg-green-100 dark:bg-green-900' : isSelected ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-white dark:bg-slate-800'}`}>
                              <div className="flex items-center justify-between">
                                <div>{opt}</div>
                                <div className="text-xs">
                                  {isCorrect && <span className="text-green-700">✓ correct</span>}
                                  {isSelected && !isCorrect && <span className="text-red-600">your answer</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
