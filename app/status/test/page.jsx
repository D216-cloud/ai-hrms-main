import { Suspense } from "react";
import TestPageClient from "./TestPageClient";

export default function TestPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center">Loading...</div>}>
      <TestPageClient />
    </Suspense>
  );
}
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
