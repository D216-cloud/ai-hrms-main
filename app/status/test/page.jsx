import { Suspense } from "react";
import TestPageClient from "./TestPageClient";

export default function TestPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center">Loading...</div>}>
      <TestPageClient />
    </Suspense>
  );
}

  // Load tests from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setTests(parsed);
        // Do NOT auto-open the last test on page load. User should click Open to load a saved test.
      }
    } catch (err) {
      console.error('Failed to load tests from localStorage', err);
    }
  }, []);

  const saveTestsToStorage = (nextTests) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTests));
    } catch (err) {
      console.error('Failed to save tests to localStorage', err);
    }
  };

  const setCurrentTest = (test) => {
    // Update local state for current test
    setCurrentTestId(test ? test.id : null);
    setQuestions(test?.questions || []);
    setSelected(test?.selected || {});
    setScore(test?.score || null);
    setShowAnswers(Boolean(test?.completed));
  };

  useEffect(() => {
    // Redirect to login if unauthenticated
    if (status === 'unauthenticated') {
      router.push('/auth/jobseeker-login');
      return;
    }

    // If interview query param present, prefill job title/skills from server
    const loadInterview = async () => {
      if (!interviewId) return;
      try {
        const res = await fetch('/api/seeker/interviews');
        if (!res.ok) return;
        const data = await res.json();
        const found = (data.interviews || []).find(i => String(i.id) === String(interviewId));
        if (!found) return;
        setInterviewInfo(found);

        // Set job title
        if (found.job_title) setJobTitle(found.job_title);

        // If job_id available, fetch full job details to get skills
        if (found.job_id) {
          const jobRes = await fetch(`/api/jobs/${found.job_id}`);
          if (jobRes.ok) {
            const jobData = await jobRes.json();
            if (jobData) {
              if (jobData.title) setJobTitle(jobData.title);
              if (Array.isArray(jobData.skills) && jobData.skills.length > 0) {
                setJobSkills(jobData.skills);
                setSkillsInput(jobData.skills.join(", "));
                setSkillsEditable(false);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load interview/job info:', err);
      }
    };

    loadInterview();
  }, [interviewId, status, router]);

  const generate = async (count = 30) => {
    setLoading(true);
    setQuestions([]);
    setSelected({});
    setScore(null);

    try {
      const skills = skillsEditable ? skillsInput.split(",").map(s => s.trim()).filter(Boolean) : jobSkills.slice();
      const res = await fetch("/api/generate-mcqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, skills, experienceYears, count }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        console.error("API error:", data);
        toast.error(data.error || "Failed to generate MCQs");
        return;
      }

      const qs = Array.isArray(data.questions) ? data.questions : [];

      // Create a new test entry and persist to localStorage
      const newTest = {
        id: String(Date.now()),
        createdAt: new Date().toISOString(),
        interviewId: interviewId || null,
        jobTitle,
        skills,
        experienceYears,
        questions: qs,
        selected: {},
        score: null,
        completed: false,
      };

      const nextTests = [...tests, newTest];
      setTests(nextTests);
      saveTestsToStorage(nextTests);

      // Set as current
      setCurrentTest(newTest);

      toast.success(`Generated ${qs.length} questions and saved test`);
    } catch (err) {
      console.error("Error generating MCQs:", err);
      toast.error("Failed to generate MCQs. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (i, optionIndex) => {
    // Update local state
    const nextSelected = { ...selected, [i]: optionIndex };
    setSelected(nextSelected);

    // Persist to current test
    if (!currentTestId) return;
    const nextTests = tests.map(t => {
      if (t.id !== currentTestId) return t;
      return { ...t, selected: nextSelected };
    });
    setTests(nextTests);
    saveTestsToStorage(nextTests);
  };

  const submitAnswers = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      const s = selected[idx];
      if (typeof s === 'number' && typeof q.correctIndex === 'number') {
        if (s === q.correctIndex) correct++;
      }
    });

    const scoreObj = { correct, total: questions.length };
    setScore(scoreObj);
    setShowAnswers(true);

    // Persist to current test
    if (!currentTestId) return;
    const nextTests = tests.map(t => {
      if (t.id !== currentTestId) return t;
      return { ...t, selected: selected, score: scoreObj, completed: true };
    });
    setTests(nextTests);
    saveTestsToStorage(nextTests);
  };

  const clearCurrentTest = () => {
    if (!currentTestId) {
      setQuestions([]);
      setSelected({});
      setScore(null);
      setShowAnswers(false);
      return;
    }

    const nextTests = tests.map(t => t.id === currentTestId ? { ...t, selected: {}, score: null, completed: false } : t);
    setTests(nextTests);
    saveTestsToStorage(nextTests);
    setSelected({});
    setScore(null);
    setShowAnswers(false);
  };

  const deleteCurrentTest = () => {
    if (!currentTestId) return;
    const next = tests.filter(x => x.id !== currentTestId);
    setTests(next);
    saveTestsToStorage(next);
    setCurrentTestId(null);
    setQuestions([]);
    setSelected({});
    setScore(null);
    setShowAnswers(false);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <NavBar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Start Test {interviewId ? `(Interview: ${interviewId})` : ''}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Generate multiple-choice questions for a role and take the test. Uses OpenAI to generate questions.
          </p>
          <p className="text-sm text-gray-500 mt-2">Saved tests are stored to your browser (localStorage). Open any saved test to view previous answers, see what was correct/wrong, and read a short tip explaining the correct answer.</p>
        </div>

        <Card className="mb-6">
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Job Title</label>
                <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} readOnly={!skillsEditable && !!jobSkills.length} className="mt-1 w-full border rounded-md px-3 py-2 bg-white dark:bg-gray-800" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Skills</label>
                {skillsEditable ? (
                  <input value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} placeholder="e.g., React, Node.js, SQL" className="mt-1 w-full border rounded-md px-3 py-2" />
                ) : (
                  <div className="mt-2 flex gap-2 flex-nowrap overflow-x-auto py-1">
                    {jobSkills && jobSkills.length > 0 ? jobSkills.map((s, idx) => (
                      <div key={idx} className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 flex-shrink-0">
                        {s}
                      </div>
                    )) : (
                      <div className="text-sm text-gray-500">Not specified</div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Experience (years)</label>
                <input type="number" value={experienceYears} onChange={(e) => setExperienceYears(Number(e.target.value) || 0)} className="mt-1 w-full border rounded-md px-3 py-2" />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button onClick={() => generate(30)} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">{loading ? 'Generating...' : 'Generate 30 MCQs'}</Button>
              <Button onClick={() => generate(10)} disabled={loading} className="bg-slate-200">Generate 10</Button>
              <Button onClick={() => {
                // Clear current test answers (persisted)
                if (!currentTestId) {
                  setQuestions([]);
                  setSelected({});
                  setScore(null);
                  setShowAnswers(false);
                } else {
                  const nextTests = tests.map(t => t.id === currentTestId ? { ...t, selected: {}, score: null, completed: false } : t);
                  setTests(nextTests);
                  saveTestsToStorage(nextTests);
                  setSelected({});
                  setScore(null);
                  setShowAnswers(false);
                }
              }} className="bg-red-50">Clear Answers</Button>
              {interviewInfo && (
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  <strong>Interview:</strong> {interviewInfo.company || 'Company'} • <span>{interviewInfo.status}</span>
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        {questions.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold">Questions ({questions.length})</h2>
                <div className="text-sm text-gray-600 dark:text-gray-400">Saved tests: <strong>{tests.length}</strong></div>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={() => setShowAnswers(s => !s)} className="bg-slate-50">{showAnswers ? 'Hide Answers' : 'Show Answers'}</Button>
                <Button onClick={submitAnswers} className="bg-cyan-600 text-white">Submit Answers</Button>
              </div>
            </div>

            {tests.length > 0 && (
              <div className="flex gap-2 overflow-x-auto py-2">
                {tests.slice().reverse().map(t => (
                  <div key={t.id} className={`px-3 py-2 rounded-md border ${t.id === currentTestId ? 'bg-slate-100 dark:bg-slate-800 border-slate-300' : 'bg-transparent border-slate-100 dark:border-slate-700'}`}>
                    <div className="text-sm font-medium">{new Date(t.createdAt).toLocaleString()}</div>
                    <div className="text-xs text-gray-600">Questions: <strong>{(t.questions || []).length}</strong></div>
                    {t.completed ? (
                      <div className="text-xs text-green-700">Score: {t.score?.correct}/{t.score?.total}</div>
                    ) : (
                      <div className="text-xs text-gray-500">Draft</div>
                    )}
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" onClick={() => {
                        // load test
                        const found = tests.find(x => x.id === t.id);
                        if (found) setCurrentTest(found);
                        // scroll to questions
                        const el = document.querySelector('h2');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }} className="bg-slate-50">Open</Button>
                      <Button size="sm" onClick={() => {
                        // delete test
                        const next = tests.filter(x => x.id !== t.id);
                        setTests(next);
                        saveTestsToStorage(next);
                        if (t.id === currentTestId) {
                          // if removed current, clear UI
                          setCurrentTestId(null);
                          setQuestions([]);
                          setSelected({});
                          setScore(null);
                          setShowAnswers(false);
                        }
                      }} className="bg-red-50">Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-4">
              {questions.map((q, i) => (
                <div key={i} className="p-4 bg-white dark:bg-slate-800 border rounded-md">
                  <div className="mb-2 font-medium">{i + 1}. {q.q}</div>
                  <div className="grid gap-2">
                    {(Array.isArray(q.options) ? q.options : []).map((opt, oi) => {
                      const isSelected = selected[i] === oi;
                      const isCorrect = q.correctIndex === oi;
                      const show = showAnswers;

                      // Determine classes
                      let baseCls = 'flex items-center gap-2 p-3 rounded-md cursor-pointer border';
                      let extra = 'hover:bg-slate-50';

                      if (show) {
                        if (isCorrect) {
                          extra = 'bg-emerald-50 border-emerald-300';
                        } else if (isSelected && !isCorrect) {
                          extra = 'bg-rose-50 border-rose-300';
                        } else {
                          extra = 'bg-transparent border-slate-100 dark:border-slate-700';
                        }
                      } else if (isSelected) {
                        extra = 'bg-teal-50 border-teal-300';
                      }

                      return (
                        <label key={oi} className={`${baseCls} ${extra}`}>
                          <input type="radio" name={`q-${i}`} checked={isSelected} onChange={() => toggleSelect(i, oi)} disabled={show} />
                          <span className="flex-1">{opt}</span>

                          {show && isCorrect && (
                            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                              <CheckCircle className="w-4 h-4" /> Correct
                            </span>
                          )}

                          {show && isSelected && !isCorrect && (
                            <span className="flex items-center gap-1 text-rose-600 font-semibold">
                              <XCircle className="w-4 h-4" /> Your answer
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>

                  {/* Show explanation / tip when answers are revealed */}
                  {showAnswers && (
                    <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                      <strong>Tip:</strong> {q.explanation ? q.explanation : `Correct answer: ${Array.isArray(q.options) ? q.options[q.correctIndex] : ''}`}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {score && (
              <div className="p-4 bg-green-50 rounded-md">
                <strong>Score:</strong> {score.correct} / {score.total}
              </div>
            )}
          </div>
        )}

        {questions.length === 0 && (
          <div className="mt-6 text-gray-600 dark:text-gray-400">No questions generated yet. Click &quot;Generate 30 MCQs&quot; to begin.</div>
        )}

        {/* Bottom sticky action bar when there's an active test */}
        {questions.length > 0 && (
          <div className="fixed bottom-4 left-0 right-0 flex justify-center pointer-events-none">
            <div className="pointer-events-auto bg-white dark:bg-slate-900 border rounded-md px-4 py-3 shadow-lg flex items-center gap-3">
              <Button onClick={submitAnswers} className="bg-cyan-600 text-white">Submit Answers</Button>
              <Button onClick={clearCurrentTest} className="bg-red-50">Clear Answers</Button>
              <Button onClick={deleteCurrentTest} className="bg-rose-50">Delete Test</Button>
              {score && (
                <div className="text-sm text-gray-700 dark:text-gray-300">Score: <strong>{score.correct}</strong> / {score.total}</div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
