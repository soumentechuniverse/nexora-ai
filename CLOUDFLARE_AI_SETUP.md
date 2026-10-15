# Nexora AI — secure AI Tutor setup

Nexora's public website is hosted on GitHub Pages. GitHub Pages is static hosting, so **never put private API keys, passwords, or provider secrets in `index.html`**. The Worker backend calls Cloudflare Workers AI through a server-side binding.

## 1. Create the Worker
1. Sign in to Cloudflare and open **Workers & Pages**.
2. Choose **Create → Worker**, name it `nexora-ai-tutor`, and deploy the starter Worker.
3. Open the Worker, select **Edit code**, replace the starter code with the complete contents of [worker/nexora-ai-worker.js](worker/nexora-ai-worker.js), and deploy.
4. In Worker settings, open **Bindings → Add → Workers AI**. Set the binding name to exactly `AI`, save, and deploy again if requested.
5. Copy the Worker URL, for example `https://nexora-ai-tutor.YOUR-SUBDOMAIN.workers.dev`.

## 2. Connect the website
1. In `index.html`, find `const NEXORA_AI_ENDPOINT = "";`.
2. Replace the empty string with the Worker URL, e.g. `const NEXORA_AI_ENDPOINT = "https://nexora-ai-tutor.YOUR-SUBDOMAIN.workers.dev";`.
3. Commit to `main`, wait for GitHub Pages to publish, and test the Tutor with “Explain what RAM does”.

## 3. Security checklist (important)
- **Do not promise that any website is impossible to hack.** Security is risk reduction and ongoing maintenance, not a guarantee.
- The Worker accepts browser requests only from `https://soumentechuniverse.github.io`, checks JSON/content type and request size, caps message/history length, avoids exposing internal errors, sends no-store responses, and has a small in-memory request throttle.
- **Origin/CORS checks are not authentication**: non-browser clients can forge an Origin header. The in-memory throttle is best-effort and can reset or vary between Worker instances.
- For stronger protection, open Cloudflare **Security → WAF → Rate limiting rules** (menu names may vary) and create a rule scoped to the Worker hostname/path. Start with a conservative per-IP limit (for example 20 POST requests per 10 minutes), then adjust based on real use and Cloudflare's plan/features. Enable available managed protections and review security events.
- If abuse becomes a concern, add a server-verified Cloudflare Turnstile challenge or durable, shared rate limiting before allowing broad public use. Do not rely on a hidden frontend URL as a secret.
- Keep the GitHub repository free of API keys, tokens, passwords, and personal data. If a secret is ever committed, remove it **and rotate/revoke it immediately**; deleting the line alone is not enough.
- Keep GitHub account two-factor authentication enabled; review repository collaborators and GitHub Actions permissions; never share login codes.
- Keep the Worker and dependencies updated, review Cloudflare logs/usage, and set usage/billing alerts or limits where the account supports them.
- Do not send passwords, OTPs, payment data, or private information to the AI Tutor.
- GitHub Pages serves HTTPS, but repository code is public. Anything placed in frontend HTML/JavaScript is visible to visitors.

## 4. Troubleshooting
- **403 Forbidden:** check that the website is opened from `https://soumentechuniverse.github.io/nexora-ai/` and that the Worker `ALLOWED_ORIGIN` matches the site origin exactly.
- **503 binding not configured:** create the Workers AI binding named `AI`.
- **429 too many requests:** wait and retry; configure Cloudflare edge rate limiting for stronger protection.
- **502 AI unavailable:** check Worker logs, model availability, and current Workers AI limits.
- The Worker deploys separately from GitHub Pages. Committing the Worker file to GitHub does **not** automatically deploy it to Cloudflare.
