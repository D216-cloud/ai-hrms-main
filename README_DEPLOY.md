# Deployment notes — Cross-platform lockfile & build fixes

If you see EBADPLATFORM errors like:

```
npm ERR! notsup Unsupported platform for @next/swc-win32-x64-msvc@16.x: wanted {"os":"win32","cpu":"x64"} (current: {"os":"linux","cpu":"x64"})
```

It usually means the lockfile was generated on Windows and includes platform-specific optional dependencies. To fix:

1. Run the included relock helper (recommended, run on the target platform — Linux for Render/CI):

   ```bash
   npm run relock
   ```

   This removes `node_modules` and `package-lock.json`, then runs `npm install --no-optional` to produce a Linux-friendly lockfile.

2. Commit the new `package-lock.json` if you want the repo to be consistent for Linux builds.

3. Alternatively, set `NPM_CONFIG_OPTIONAL=false` in your CI environment so npm skips optional deps.

Notes:
- `.npmrc` in repo sets `optional=false` to avoid optional package installs; depending on your CI you may also set `NPM_CONFIG_OPTIONAL=false` env var.
- If you need different lockfiles per platform, consider using a platform-specific CI step to generate a lockfile for each deployment target.

---

Database requirements & vector embeddings:
- This project uses `pgvector` for resume/job embeddings. Ensure the `pgvector` extension is installed in your Postgres/Supabase instance.
  - On Supabase you can enable it via the SQL editor: `CREATE EXTENSION IF NOT EXISTS vector;`
- The `applications.resume_embedding` column is defined as `VECTOR(3072)` in the schema to match OpenAI's `text-embedding-3-large` model. If you change the embedding model, update the vector dimension accordingly.
- If you see application submission failures referencing "vector" or "dimension", verify the `pgvector` extension is installed and the column dimension matches the embedding size.

---

If you run into parsing/build errors (e.g., "Expression expected"), ensure pages that use client hooks like `useSearchParams` have been moved to client components and wrapped using `<Suspense>` from a server wrapper page. See `app/status/test/page.jsx` for an example.