# Nexora AI

Nexora AI is a responsive computer-learning and creativity website hosted on GitHub Pages.

## Live site
https://soumentechuniverse.github.io/nexora-ai/

## Features
- Computer Masterclass cards and beginner-friendly lessons
- Interactive website-request learning simulation
- Real-time 3D computer hardware explorer built with Three.js (CPU, RAM, SSD, desktop computer, network nodes)
- Lesson progress, quizzes, glossary search, theme and language controls
- Local chat history, writing studio, study planner, web-search shortcuts and image-prompt builder

## Live AI Tutor
The chat interface is prepared to call a secure backend, but the live endpoint is intentionally blank until a Worker is deployed. Do not place API keys in `index.html`.

Follow [CLOUDFLARE_AI_SETUP.md](CLOUDFLARE_AI_SETUP.md) to deploy the Cloudflare Worker and connect the Workers AI binding. The worker code is in [worker/nexora-ai-worker.js](worker/nexora-ai-worker.js).

## Important limitations
- The image tool builds prompts; it does not generate images itself.
- Web search opens an external search engine; it is not an in-page sourced search service.
- Progress and chat history are stored in this browser/device, not synced to an account.
- The 3D models are illustrative learning models, not exact engineering schematics.
