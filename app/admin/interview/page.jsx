  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [scheduledInterviews, setScheduledInterviews] = useState([]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/hr-login");
    if (status === "authenticated") setLoading(false);
  }, [status, router]);

  useEffect(() => {
    // Fetch recent test submissions for jobs owned by this HR
    let mounted = true;
    const fetchSubmissions = async () => {
      try {
        // Gather application-based submissions
        const resApps = await fetch('/api/job-applications');
        const body = resApps.ok ? await resApps.json().catch(() => null) : null;
        const apps = (body && body.applications) || [];
        // build scheduled interviews list from applications that have scheduled_at
        const now = Date.now();
        const scheduled = apps
          .filter(a => a.scheduled_at || a.raw?.scheduled_at)
          .map(a => ({
            id: a.id,
            name: a.name || a.applicant_name || '—',
            email: a.email || '—',
            job_title: a.job_title || (a.jobs?.title) || '—',
            scheduled_at: a.scheduled_at || a.raw?.scheduled_at || null,
            interviewer: a.interviewer_name || a.raw?.interviewer || (a.interviewer?.name) || null,
            source: 'application',
          }))
          .filter(s => s.scheduled_at && new Date(s.scheduled_at).getTime() >= now)
          .sort((a,b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
        if (mounted) setScheduledInterviews(scheduled.slice(0, 10));
        const appSubmitted = apps.filter(a => a.raw && (a.raw.test_submitted_at || a.raw.test_score !== null)).map(a => ({
          id: a.id,
          name: a.name || '—',
          email: a.email || '—',
          job_title: a.job_title || (a.jobs?.title) || '—',
          test_score: a.raw?.test_score ?? a.overall_score ?? null,
          overall_score: a.overall_score ?? a.raw?.overall_score ?? null,
          created_at: a.raw?.test_submitted_at || a.created_at,
          resume_url: a.resume_url || null,
          source: 'application',
          raw: a.raw || {},
        }));

        // Gather saved test_scores rows
        const resScores = await fetch('/api/test-scores');
        const bodyScores = resScores.ok ? await resScores.json().catch(() => null) : null;
        const scores = (bodyScores && bodyScores.testScores) || [];
        const scoreItems = scores.map(s => ({
          id: s.id,
          name: s.name || '—',
          email: s.email || '—',
          job_title: s.job_title || '—',
          test_score: s.test_score ?? null,
          overall_score: s.overall_score ?? null,
          created_at: s.created_at,
          resume_url: null,
          source: 'test_scores',
        }));

        const combined = [...appSubmitted, ...scoreItems];
        combined.sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        if (mounted) setRecentSubmissions(combined);
      } catch (e) {
        console.warn('Failed to load recent submissions', e);
      }
    };

    fetchSubmissions();
    const iv = setInterval(fetchSubmissions, 30000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);

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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Interviews</h1>
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg">Schedule Interview</button>
            <button className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg">Filters</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h2 className="font-semibold text-lg text-slate-900 dark:text-white">Upcoming Interviews</h2>
            {scheduledInterviews.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">No scheduled interviews yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {scheduledInterviews.map((s) => (
                  <li key={s.id} className="p-3 border rounded">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{s.name}</div>
                        <div className="text-xs text-slate-500">{s.email}</div>
                        <div className="text-xs text-slate-500">Job: {s.job_title}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">Interviewer: <strong>{s.interviewer ?? '—'}</strong></div>
                        <div className="text-sm">When: <strong>{s.scheduled_at ? new Date(s.scheduled_at).toLocaleString() : '—'}</strong></div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h2 className="font-semibold text-lg text-slate-900 dark:text-white">Recent Test Submissions</h2>
            <div className="mt-3 space-y-3">
              {recentSubmissions.length === 0 && (
                <p className="text-sm text-slate-600 dark:text-slate-400">No recent test submissions.</p>
              )}
              {recentSubmissions.map((app) => (
                <div key={app.id} className="border rounded p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{app.name}</div>
                      <div className="text-xs text-slate-500">{app.email}</div>
                      <div className="text-xs text-slate-500">Job: {app.job_title}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">Test: <strong>{(app.test_score ?? app.raw?.test_score) ?? '—'}</strong></div>
                      <div className="text-sm">Overall: <strong>{(app.overall_score ?? app.raw?.overall_score) !== undefined && (app.overall_score ?? app.raw?.overall_score) !== null ? `${app.overall_score ?? app.raw?.overall_score}%` : '—'}</strong></div>
                        <div className="text-xs text-slate-500">Submitted: {app.raw?.test_submitted_at ? new Date(app.raw.test_submitted_at).toLocaleString() : (app.created_at ? new Date(app.created_at).toLocaleString() : '—')}</div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {app.resume_url && (
                      <a href={app.resume_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600">View Resume</a>
                    )}
                    <button className="ml-auto px-3 py-1 bg-teal-600 text-white rounded text-sm" onClick={() => router.push(`/admin/applications/${app.id}`)}>Open</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
