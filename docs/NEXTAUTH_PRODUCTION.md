# NextAuth Production Checklist (Render)

This document explains steps to ensure NextAuth works in production on Render (or similar).

✅ Required environment variables (set in Render dashboard under Environment > Environment Variables):

- NEXTAUTH_URL=https://<your-app-domain>
  - Must EXACTLY match your app URL (including https and any subdomain).
  - Example: `https://ai-hrms-hu16.onrender.com`

- NEXTAUTH_SECRET=<secure-random-string>
  - Generate once and **keep stable** across restarts (openssl rand -base64 32)
  - Used to sign cookies and JWTs. If this changes, existing cookies become invalid.

- NODE_ENV=production (usually already set by Render)

Optional (helpful for debugging and edge-case cookie domains):

- NEXTAUTH_DEBUG=true (temporary) — enables extra NextAuth debug logs
- SESSION_COOKIE_DOMAIN=ai-hrms-hu16.onrender.com (optional)
  - Set this only if you specifically need the cookie `Domain` attribute set for your deployment.
  - If omitted, NextAuth will set cookie for the request host which is generally correct.

Temporary bypass (only for debugging):

- ENABLE_ADMIN_BYPASS=true
  - When set, middleware will skip auth checks for `/admin` routes so you can access them while debugging.
  - **Remove or set to `false` when finished.**

Debugging checklist (in production):

1. Attempt login and inspect the network tab:
   - POST to `/api/auth/callback/credentials` (or OAuth callback) should return a Set-Cookie header (e.g. `next-auth.session-token`).
   - If you don't see Set-Cookie, check `NEXTAUTH_URL` and HTTPS.

2. Call `GET /api/auth/session` or `GET /api/test-session` from the browser (or curl) to confirm session is returned:
   - `GET /api/test-session` will also log request cookies server-side for help.

3. Check middleware logs (server logs on Render) for token and cookie information.
   - The app prints the `Request Cookies` when middleware sees no token.

4. If cookies are set but not sent back to the server, verify the cookie `Domain` and `Secure` attributes and that you're using HTTPS.

Why this typically happens:

- Most common cause: `NEXTAUTH_URL` is left as `http://localhost:3000` in production — NextAuth will generate incorrect callback URLs and cookies that aren't recognized by the deployed host.
- Another cause: `NEXTAUTH_SECRET` missing/rotated — tokens/cookies cannot be validated by middleware.
- Some platforms may require an explicit cookie `Domain` to be set if they front your app with a proxy or custom domain.

Fix summary (recommended order):

1. Set `NEXTAUTH_URL` to your production URL (https://...)
2. Ensure `NEXTAUTH_SECRET` is set and stable
3. Set `NEXTAUTH_DEBUG=true` while debugging
4. Use the `/api/test-session` endpoint and middleware logs to identify missing cookies
5. If necessary, set `SESSION_COOKIE_DOMAIN` and re-test

If you want, I can prepare a small checklist of exact commands and curl tests to run from your machine to validate the deployed behavior.  

---

Document created by GitHub Copilot (Raptor mini).