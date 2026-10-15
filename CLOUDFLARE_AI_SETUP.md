# Nexora AI — free AI Tutor setup

The public website is hosted on GitHub Pages. GitHub Pages is static hosting, so **do not put a private API key in `index.html`**. This repository includes a Cloudflare Worker backend that uses a Workers AI binding; it does not require exposing a provider key in the browser.

## 1. Create the Worker
1. Sign in to Cloudflare and open **Workers & Pages**.
2. Choose **Create → Worker**, name it `nexora-ai-tutor`, and deploy the starter Worker.
3. Open the Worker, select **Edit code**, replace the starter code with the complete contents of `worker/nexora-ai-worker.js`, then deploy.
4. In the Worker settings, open **Bindings → Add → Workers AI**. Set the variable/binding name to exactly `AI`, save, and redeploy if requested.
5. Copy the Worker URL, for example `https://nexora-ai-tutor.YOUR-SUBDOMAIN.workers.dev`.

## 2. Connect the website
1. In this repository, open `index.html` and find `const NEXORA_AI_ENDPOINT = "";`.
2. Replace the empty string with your actual Worker URL plus `/chat` only if you configured a route that includes it. For the code supplied here, use the Worker URL itself, e.g. `const NEXORA_AI_ENDPOINT = "https://nexora-ai-tutor.YOUR-SUBDOMAIN.workers.dev";`.
3. Save the file to the `main` branch. Wait for GitHub Pages to publish, then open the site and test with “Explain what RAM does”.

## 3. Important notes
- Cloudflare's free allowance and model availability can change; check the limits shown in your Cloudflare dashboard.
- The Worker validates the origin, message size, and request format, and sends only a short recent conversation history.
- The origin check is a basic browser-origin safeguard, **not authentication or a complete abuse-prevention system**. Do not treat it as a substitute for rate limiting if the endpoint is widely shared.
- Do not send passwords, OTPs, payment data, or private information to the tutor.
- If the AI binding or allowance is unavailable, the website should show an error and keep the chat history locally.
- The Worker is deployed separately from GitHub Pages. Committing this file does not deploy it to Cloudflare automatically.

## Troubleshooting
- **503 binding not configured:** create the Workers AI binding named `AI`.
- **AI temporarily unavailable:** check the Cloudflare Worker logs, model availability, and your account's current Workers AI limits.
- **CORS error:** the website origin in the Worker is set to `https://soumentechuniverse.github.io`. If the site moves to a custom domain, update `ALLOWED_ORIGIN` in the Worker.
