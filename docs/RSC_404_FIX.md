# Fix: 404 errors for ?_rsc requests (e.g., /pricing?_rsc=...)

Symptom
- Browser console shows 404s for routes like `/pricing?_rsc=...` and `/blog?_rsc=...` in production only (Render / Vercel). Locally (dev) there are no errors.

Cause
- In the Next.js App Router, client navigations request the server component payloads (React Server Components) via URLs with `?_rsc=...` when performing RSC transitions. If a route (e.g. `/pricing` or `/blog`) has no `app/<route>/page.jsx` server component, the server returns 404 for the `?_rsc` request in production.
- Dev server can be more forgiving (on-demand behavior) and client-side navigation may not trigger the same failing requests, which is why this only fails in production.

What I changed
- Added minimal server components:
  - `app/pricing/page.jsx` (minimal Pricing page)
  - `app/blog/page.jsx` (minimal Blog page)

Why this fixes production but not required locally
- Production builds rely on server-rendered RSC payloads for client navigation; missing server components mean the `?_rsc` request returns 404. Adding the `page.jsx` server components ensures the RSC payloads are served for those routes.
- Locally, Next dev server may handle missing routes differently which can mask the issue during development.

Verification steps
1. Commit and deploy to Render (or Vercel) using an actual Next.js Web Service (not a static export). Build with `npm run build` and `npm start` (or auto-deploy settings).
2. After deployment, open the site and navigate to `/pricing` and `/blog`.
   - In DevTools Network, confirm there are no 404 requests for `?_rsc`.
   - The pages should render normally.
3. If 404s persist, verify no rewrites/redirects or CDN rules are rewriting `/_next` or `?` paths.

Notes
- This change is minimal and safe; feel free to expand the pages with your components.
- If you prefer, I can add basic content from the homepage or wire the blog and pricing components to CMS data.

---
Document created by GitHub Copilot (Raptor mini).