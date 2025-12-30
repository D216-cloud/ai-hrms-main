"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SharedTestPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(null);

  // Test flow state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [testStarted, setTestStarted] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [testCompleted, setTestCompleted] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/tests/share?token=${encodeURIComponent(params.token)}`);
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error || 'Not found');
        setTest(body.test);
        // don't start the timer or set answers until candidate clicks Start
        setShowIntro(true);
        setTestStarted(false);
        setTestCompleted(false);
      } catch (err) {
        console.error('Failed to load shared test', err);
      } finally {
        setLoading(false);
      }
    }
    if (params.token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.token]);

  const selectAnswer = (i, idx) => {
    if (!testStarted) return; // disable selecting before start
    const a = [...answers];
    a[i] = idx;
    setAnswers(a);
  };

  const submit = () => {
    if (!test) return;
    let correct = 0;
    test.questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) correct++;
    });
    const percent = Math.round((correct / test.questions.length) * 100);
    setScore({ correct, total: test.questions.length, percent });
    setTestCompleted(true);
    setTestStarted(false);
  };

  // Start the test: initialize answers and timer
  const startTest = () => {
    if (!test) return;
    setAnswers(new Array(test.questions.length).fill(null));
    setTimeRemaining((test.duration_minutes || 30) * 60);
    setTestStarted(true);
    setShowIntro(false);
    setCurrentQuestion(0);
  };

  // Timer effect
  useEffect(() => {
    if (!testStarted) return;
    const iv = setInterval(() => {
      setTimeRemaining(t => {
        if (t <= 1) {
          clearInterval(iv);
          submit(); // auto-submit when time runs out
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(iv);
  }, [testStarted]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-teal-600" /></div>;
  if (!test) return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 text-center">
        <h2 className="text-lg font-semibold mb-2">Test not found</h2>
        <p className="text-sm text-slate-600 mb-4">This test link is invalid or has expired. Please contact the hiring team for a new link.</p>
        <a href="mailto:hr@yourcompany.com" className="inline-flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded">Contact HR</a>
      </div>
    </div>
  );

  // Intro / instructions page before starting
  if (showIntro && !testCompleted) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold mb-2">{test.job_title || 'Shared Test'}</h1>
            <p className="text-sm text-slate-600 mb-4">This assessment was created by the hiring team. Read the instructions below and click <strong>Start Test</strong> when you're ready.</p>

            <div className="space-y-3 mb-4">
              <div><strong>Questions:</strong> {test.questions.length}</div>
              <div><strong>Duration:</strong> {test.duration_minutes || 30} minutes</div>
              <div><strong>Format:</strong> Multiple choice, one correct answer per question</div>
              <div><strong>Instructions:</strong> Work independently. Timer starts when you press Start. Your answers will be submitted when you click Submit or when time runs out.</div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => startTest()} className="px-4 py-2 bg-blue-600 text-white rounded">Start Test</button>
              <a href="/" className="px-4 py-2 bg-white border rounded">Return to Jobs</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Test view (after starting)
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">{test.job_title || 'Shared Test'}</h1>
            <div className="text-sm text-slate-600">Time left: <strong>{timeRemaining !== null ? `${Math.floor(timeRemaining/60)}:${String(timeRemaining%60).padStart(2,'0')}` : '—'}</strong></div>
          </div>

          <ol className="space-y-6">
            {test.questions.map((q, i) => (
              <li key={i} className="p-4 bg-slate-50 dark:bg-slate-700 rounded">
                <div className="font-medium mb-2">{i+1}. {q.q}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, oi) => (
                    <label key={oi} className={`p-2 border rounded ${answers[i]===oi ? 'bg-teal-100 dark:bg-teal-900' : 'bg-white dark:bg-slate-800'}`}>
                      <input type="radio" name={`q_${i}`} checked={answers[i]===oi} onChange={() => selectAnswer(i, oi)} /> <span className="ml-2">{opt}</span>
                    </label>
                  ))}
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-4 flex items-center gap-3">
            <button onClick={() => submit()} className="px-4 py-2 bg-blue-600 text-white rounded">Submit</button>
            {score && <div className="text-sm">Score: <strong>{score.correct}/{score.total}</strong> ({score.percent}%)</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
