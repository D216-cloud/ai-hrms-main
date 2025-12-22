"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

export default function TestPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [test, setTest] = useState(null);
  const [application, setApplication] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [results, setResults] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (params.token) {
      fetchTestData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.token]);

  // Timer countdown
  useEffect(() => {
    if (testStarted && timeRemaining > 0 && !testCompleted) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmit(); // Auto-submit when time runs out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testStarted, timeRemaining, testCompleted]);

  const fetchTestData = async () => {
    try {
      // Get application by test token
      const appResponse = await fetch(
        `/api/job-applications?testToken=${params.token}`
      );
      const appDataRaw = await appResponse.json();

      if (!appResponse.ok) {
        throw new Error("Invalid test link");
      }

      const appData = Array.isArray(appDataRaw) ? appDataRaw[0] : appDataRaw;
      if (!appData) throw new Error("Invalid test link");

      // Check if test already taken (support token-based stored fields)
      const hasSubmitted = Boolean(
        (appData.test_score !== undefined && appData.test_score !== null) ||
        appData.test_submitted_at ||
        appData.raw?.test_submitted_at ||
        (appData.raw && (appData.raw.test_score !== null && appData.raw.test_score !== undefined))
      );

      if (hasSubmitted) {
        // Determine score values from available fields
        const testScore = appData.test_score ?? appData.raw?.test_score ?? null;
        const overallScore = appData.overall_score ?? appData.raw?.overall_score ?? null;

        setTestCompleted(true);
        setResults({
          score: testScore !== null ? testScore : (overallScore ?? null),
          overallScore: overallScore,
          passed: (testScore !== null ? testScore : (overallScore ?? 0)) >= 60,
          correctAnswers: appData.raw?.correct_answers ?? null,
          totalQuestions: appData.raw?.total_questions ?? null,
        });
        setLoading(false);
        return;
      }

      setApplication(appData);

      // Get test questions from DB (if HR generated and saved)
      const testResponse = await fetch(
        `/api/tests/generate?jobId=${appData.job_id}`
      );

      if (testResponse.ok) {
        const testData = await testResponse.json();
        setTest(testData);
        setAnswers(new Array(testData.questions.length).fill(null));
        setTimeRemaining((testData.duration_minutes || 30) * 60); // Convert to seconds
      } else {
        // If no stored test, request ad-hoc generation (20 MCQ) using the test token
        console.warn('No stored test found, requesting AI-generated test');
        const genResp = await fetch('/api/tests/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ testToken: params.token, count: 20 }),
        });

        const genData = await genResp.json();
        if (!genResp.ok || !genData.questions) {
          throw new Error(genData.error || 'Failed to generate test');
        }

        setTest({
          questions: genData.questions,
          duration_minutes: 30,
          passing_score: 60,
        });
        setAnswers(new Array(genData.questions.length).fill(null));
        setTimeRemaining(30 * 60);
      }
    } catch (error) {
      console.error("Error fetching test:", error);
      const msg = error?.message || "Failed to load test";
      toast.error(msg);
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  };

  const startTest = () => {
    setTestStarted(true);
    toast.success("Test started! Good luck!");
  };

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < test.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    const unansweredCount = answers.filter((a) => a === null).length;
    if (unansweredCount > 0) {
      const confirmSubmit = window.confirm(
        `You have ${unansweredCount} unanswered question(s). Submit anyway?`
      );
      if (!confirmSubmit) return;
    }

    setSubmitting(true);
    const startTs = Date.now();
    try {
      const response = await fetch("/api/tests/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testToken: params.token,
          answers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit test");
      }

      // Ensure at least 2s of loading UI before showing "Saved"
      const elapsed = Date.now() - startTs;
      const waitMs = Math.max(0, 2000 - elapsed);
      if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));

      // Show saved state briefly
      setShowSaved(true);
      setSubmitting(false);
      await new Promise((r) => setTimeout(r, 900));
      setShowSaved(false);

      // Store a local copy of the submission for the candidate (localStorage)
      try {
        const submissionRecord = {
          applicationId: application?.id || null,
          testToken: params.token,
          score: data.score,
          totalQuestions: data.totalQuestions,
          correctAnswers: data.correctAnswers,
          overallScore: data.overallScore || null,
          submittedAt: new Date().toISOString(),
          candidate: {
            name: application?.name || null,
            email: application?.email || null,
            resume_url: application?.resume_url || null,
          },
        };

        const key = `test_submission_${submissionRecord.applicationId || params.token}`;
        localStorage.setItem(key, JSON.stringify(submissionRecord));
      } catch (e) {
        console.warn('Failed to save test submission locally', e);
      }

      setResults(data);
      setTestCompleted(true);
      toast.success("Test submitted successfully!");
    } catch (error) {
      console.error("Error submitting test:", error);
      setSubmitting(false);
      setShowSaved(false);
      toast.error(error.message || "Failed to submit test");
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getAnsweredCount = () => {
    return answers.filter((a) => a !== null).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Loading error
  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md mx-auto px-4">
          <Card>
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Button
                  onClick={() =>
                    router.push(`/status/${application?.application_token}`)
                  }
                >
                  View Application Status
                </Button>

                <Button variant="outline" onClick={() => router.push("/jobs")}>Browse More Jobs</Button>

                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!params.token) return toast.error('Missing token');
                    setSaving(true);
                    try {
                      const res = await fetch('/api/tests/save', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          testToken: params.token,
                          score: results?.score ?? null,
                          overallScore: results?.overallScore ?? null,
                          correctAnswers: results?.correctAnswers ?? null,
                          totalQuestions: results?.totalQuestions ?? null,
                        }),
                      });
                      const body = await res.json();
                      if (!res.ok) throw new Error(body.error || 'Failed to save');
                      toast.success(body.message || 'Saved to database');
                    } catch (e) {
                      console.error('Save error:', e);
                      toast.error(e.message || 'Failed to save');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Results'}
                </Button>
                <Button asChild>
                  <a href={`mailto:hr@company.com?subject=Invalid%20Test%20Link%20%7C%20${params.token}`}>Contact HR</a>
                </Button>
                <Button variant="outline" onClick={() => router.push('/')}>Return Home</Button>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  // Test already completed
  if (testCompleted && results) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardHeader className="text-center">
              {results.passed ? (
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
              ) : (
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
              )}
              <CardTitle className="text-2xl">
                {results.passed ? "Test Completed!" : "Test Completed"}
              </CardTitle>
              <CardDescription>
                {results.passed
                  ? "Congratulations! You've passed the test."
                  : "Thank you for taking the test."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <div className="text-5xl font-bold text-gray-900">
                  {results.score ?? results.overallScore ?? '—'}%
                </div>
                <p className="text-gray-600">
                  {results.correctAnswers ||
                    (results.score ? Math.round((results.score / 100) * (test?.questions?.length || results.totalQuestions || 10)) : null) ||
                    '—'} out of {test?.questions?.length || results.totalQuestions || '—'} questions correct
                </p>
                {results.overallScore !== undefined && results.overallScore !== null && (
                  <p className="text-sm text-gray-500">Overall Score: <strong>{results.overallScore}%</strong></p>
                )}
              </div>

              <div className="border-t pt-6">
                <p className="text-sm text-gray-600 text-center">
                  Our HR team will review your application and contact you via
                  email regarding the next steps.
                </p>
              </div>

              <div className="flex justify-center gap-4">
                <Button
                  onClick={() =>
                    router.push(`/status/${application?.application_token}`)
                  }
                >
                  View Application Status
                </Button>
                <Button variant="outline" onClick={() => router.push("/jobs")}>
                  Browse More Jobs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Test not started yet
  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle>Technical Assessment</CardTitle>
              <CardDescription>
                {application?.jobs?.title || "Job Position"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Test Instructions
                    </p>
                    <ul className="mt-2 text-sm text-gray-600 space-y-1 list-disc list-inside">
                      <li>
                        {test?.questions?.length || 0} multiple choice questions
                      </li>
                      <li>Duration: {test?.duration_minutes || 30} minutes</li>
                      <li>Passing score: {test?.passing_score || 60}%</li>
                      <li>
                        You can review and change answers before submitting
                      </li>
                      <li>Test will auto-submit when time runs out</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Important:</p>
                    <p className="mt-1">
                      Once you start, the timer cannot be paused. Make sure you
                      have a stable internet connection and won&apos;t be
                      interrupted.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Button onClick={startTest} size="lg">
                  Start Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Test in progress
  const question = test.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / test.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header with timer and progress */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {application?.jobs?.title || "Technical Assessment"}
              </h1>
              <p className="text-sm text-gray-600">
                Question {currentQuestion + 1} of {test.questions.length}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs text-gray-500">Time Remaining</div>
              <div className={`flex items-center gap-2 ${timeRemaining < 300 ? 'text-red-600' : 'text-gray-900'}`}>
                <Clock className="h-5 w-5" />
                <span className="text-2xl font-bold">{formatTime(timeRemaining)}</span>
              </div>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-gray-500 mt-2">
            {getAnsweredCount()} of {test.questions.length} questions answered
          </p>
        </div>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Question {currentQuestion + 1}
            </CardTitle>
            <CardDescription className="text-base text-gray-700 mt-2">
              {question.q}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[currentQuestion]?.toString()}
              onValueChange={(value) =>
                handleAnswerSelect(currentQuestion, parseInt(value))
              }
            >
              {question.options.map((option, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-gray-50 cursor-pointer"
                >
                  <RadioGroupItem
                    value={index.toString()}
                    id={`option-${index}`}
                  />
                  <Label
                    htmlFor={`option-${index}`}
                    className="flex-1 cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            {currentQuestion === test.questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={submitting || showSaved}
                size="lg"
                className="min-w-[120px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : showSaved ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                    Saved
                  </>
                ) : (
                  "Submit Test"
                )}
              </Button>
            ) : (
              <Button onClick={handleNext}>Next</Button>
            )}
          </div>
        </div>

        {/* Question navigator */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Question Navigator
          </p>
          <div className="grid grid-cols-10 gap-2">
            {test.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`
                  w-10 h-10 rounded-md border text-sm font-medium transition-colors
                  ${
                    currentQuestion === index
                      ? "bg-blue-600 text-white border-blue-600"
                      : answers[index] !== null
                      ? "bg-green-100 text-green-700 border-green-300"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }
                `}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
