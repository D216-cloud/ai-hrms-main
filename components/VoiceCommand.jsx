"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * VoiceCommand component
 * - Uses Web Speech API (SpeechRecognition) to listen for voice commands
 * - Maps recognized phrases to routes and navigates using next/router
 * - Handles permissions, unsupported browsers, start/stop controls, and logs
 *
 * Usage: add <VoiceCommand /> somewhere in your app (e.g. in layout) to enable voice navigation.
 *
 * Notes:
 * - Initializes SpeechRecognition safely: window.SpeechRecognition || window.webkitSpeechRecognition
 * - Uses continuous listening with interimResults disabled
 * - Normalizes recognized text and matches against a mapping object
 */

export default function VoiceCommand({ commands = null, autoStart = true }) {
  const router = useRouter();
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState('idle');
  const [logs, setLogs] = useState([]);
  // start collapsed by default (collapsed icon only on page load); expands when user opens
  const [panelOpen, setPanelOpen] = useState(false);
  const recognitionRef = useRef(null);

  // Default commands mapping if not provided
  const commandMap = commands || {
    // Admin / HR commands


    // Job seeker commands
    'open job dashboard': '/seeker/dashboard',
    'open jobseeker dashboard': '/seeker/dashboard',
    'open job seeker dashboard': '/seeker/dashboard',
    'open seeker dashboard': '/seeker/dashboard',
    'open job profile': '/seeker/profile',
    'open jobseeker profile': '/seeker/profile',
    'open job login': '/auth/jobseeker-login',
    'show jobs': '/jobs',

    // Generic
    'logout': '/auth/signout',
    'home': '/',
  };

  useEffect(() => {
    // Safe initialization
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      setStatus('unsupported');
      return;
    }

    const recog = new SpeechRecognition();
    recog.continuous = true; // keep listening
    recog.interimResults = false; // only final results
    recog.lang = 'en-US';

    recog.onstart = () => {
      setListening(true);
      setStatus('listening');
      pushLog('Listening started');
      // auto-collapse panel into a small icon when listening
      setPanelOpen(false);
    };

    recog.onend = () => {
      setListening(false);
      setStatus('stopped');
      pushLog('Listening stopped');
      // expand panel when listening stops
      setPanelOpen(true);
    };

    recog.onerror = (e) => {
      pushLog(`Error: ${e.error}`);
      if (e.error === 'not-allowed' || e.error === 'permission-denied') {
        setStatus('permission-denied');
      }
    };

    recog.onresult = (event) => {
      // handle final results
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const text = String(event.results[i][0].transcript || '').toLowerCase().trim();
          pushLog(`Heard: ${text}`);
          handleCommand(text);
        }
      }
    };

    recognitionRef.current = recog;

    // Auto start if requested
    if (autoStart) {
      // request permission gracefully by trying to start
      tryStart();
    }

    return () => {
      try {
        recog.onresult = null;
        recog.onend = null;
        recog.onerror = null;
        recog.onstart = null;
        recog.stop();
      } catch (e) {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pushLog(msg) {
    setLogs((l) => [
      { time: new Date().toLocaleTimeString(), text: msg },
      ...l.slice(0, 49),
    ]);
    // also console.log for debugging
    console.debug('[VoiceCommand]', msg);
  }

  function tryStart() {
    const recog = recognitionRef.current;
    if (!recog) return;
    try {
      recog.start();
    } catch (e) {
      // may throw if already started; ignore
      console.debug('start ignore', e.message || e);
    }
  }

  function startListening() {
    setStatus('starting');
    tryStart();
  }

  function stopListening() {
    const recog = recognitionRef.current;
    if (!recog) return;
    try {
      recog.stop();
    } catch (e) {
      console.debug('stop ignore', e.message || e);
    }
  }

  function handleCommand(text) {
    // normalize text
    const normalized = text.toLowerCase().trim();

    // exact match first
    if (commandMap[normalized]) {
      pushLog(`Matched command -> ${commandMap[normalized]}`);
      navigate(commandMap[normalized]);
      return;
    }

    // try fuzzy matching: look for known phrase within the spoken text
    for (const phrase of Object.keys(commandMap)) {
      if (normalized.includes(phrase)) {
        pushLog(`Fuzzy matched "${phrase}" -> ${commandMap[phrase]}`);
        navigate(commandMap[phrase]);
        return;
      }
    }

    pushLog('No matching command found');
  }

  function navigate(route) {
    try {
      router.push(route);
      pushLog(`Navigated to ${route}`);
    } catch (e) {
      pushLog(`Navigation error: ${e.message || e}`);
    }
  }

  // UI
  if (!supported) {
    return (
      <div className="fixed left-6 bottom-6 z-50">
        <div className="p-3 bg-yellow-100 text-yellow-900 rounded shadow">Voice commands not supported in this browser.</div>
      </div>
    );
  }

  // When panelOpen is false but supported, show a small floating icon (collapsed state)
  if (!panelOpen) {
    return (
      <div className="fixed left-6 bottom-6 z-50">
        <button
          onClick={() => {
            setPanelOpen(true);
            // start listening immediately when opening from collapsed icon for convenience
            startListening();
          }}
          title={`Voice listening — ${status}. Click to open panel and start listening`}
          aria-label="Open voice commands"
          className="w-12 h-12 rounded-full bg-teal-600 text-white shadow-lg flex items-center justify-center ring-2 ring-teal-300/50"
        >
          <span className="text-lg">🎙️</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed left-6 bottom-6 z-50 w-80">
      <div className="bg-white dark:bg-slate-800 border rounded-lg shadow p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">Voice Commands 🎙️</div>
          <div className="text-xs text-slate-500">{status}</div>
        </div>

        <div className="flex gap-2 mb-3">
          <button onClick={startListening} className="px-3 py-1 bg-teal-600 text-white rounded text-sm">Start</button>
          <button onClick={stopListening} className="px-3 py-1 bg-gray-200 dark:bg-slate-700 rounded text-sm">Stop</button>
          <button onClick={() => setPanelOpen(false)} className="px-2 py-1 ml-auto text-xs text-slate-500">Collapse</button>
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">Try commands: <span className="font-medium">Open job dashboard</span>, <span className="font-medium">Open job profile</span>, <span className="font-medium">Show jobs</span></div>

        <div className="h-36 overflow-auto bg-slate-50 dark:bg-slate-900 p-2 rounded text-xs">
          {logs.length === 0 ? (
            <div className="text-slate-500">No activity yet.</div>
          ) : (
            <ul className="space-y-1">
              {logs.map((l, i) => (
                <li key={i}><span className="text-slate-400 mr-2">{l.time}</span>{l.text}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
