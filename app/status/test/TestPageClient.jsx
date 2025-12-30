"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import NavBar from "@/components/NavBar";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function TestPageClient() {
  const searchParams = useSearchParams();
  const interviewId = searchParams?.get("interview") || null;
  const router = useRouter();
  const { data: session, status } = useSession();

  const [jobTitle, setJobTitle] = useState("General Software Engineer");
  const [skillsInput, setSkillsInput] = useState("");
  const [jobSkills, setJobSkills] = useState([]);
  const [skillsEditable, setSkillsEditable] = useState(true);
  const [experienceYears, setExperienceYears] = useState(2);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [showAnswers, setShowAnswers] = useState(false);
  const [selected, setSelected] = useState({});
  const [score, setScore] = useState(null);
  const [interviewInfo, setInterviewInfo] = useState(null);

  // Tests saved in localStorage
  const [tests, setTests] = useState([]); // array of {id, createdAt, interviewId, jobTitle, skills, experienceYears, questions, selected, score, completed}
  const [currentTestId, setCurrentTestId] = useState(null);

  const STORAGE_KEY = 'mcq_tests_v1';

  // Load tests from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setTests(parsed);
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
    setCurrentTestId(test ? test.id : null);
    setQuestions(test?.questions || []);
    setSelected(test?.selected || {});
    setScore(test?.score || null);
    setShowAnswers(Boolean(test?.completed));
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/jobseeker-login');
      return;
    }

    const loadInterview = async () => {
      if (!interviewId) return;
      try {
        const res = await fetch('/api/seeker/interviews');
        if (!res.ok) return;
        const data = await res.json();
        const found = (data.interviews || []).find(i => String(i.id) === String(interviewId));
        if (!found) return;
        setInterviewInfo(found);

        if (found.job_title) setJobTitle(found.job_title);

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
    const nextSelected = { ...selected, [i]: optionIndex };
    setSelected(nextSelected);

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
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Configure the job title, skills and experience below, then generate a test.</p>
            </div>
    
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => generate()} disabled={loading}>
                  {loading ? 'Generating...' : 'Generate Test'}
                </Button>
                <Button variant="outline" onClick={clearCurrentTest}>Clear</Button>
                <Button variant="destructive" onClick={deleteCurrentTest}>Delete</Button>
              </div>
            </div>
          </main>
        </div>
      );
    }