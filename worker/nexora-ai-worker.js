/**
 * Nexora AI Tutor — Cloudflare Worker + Workers AI.
 * Keep AI/provider credentials in server-side bindings only.
 *
 * The in-memory throttle below is a small extra guard, not a substitute
 * for Cloudflare's edge rate-limiting/WAF rules (Worker isolates can reset).
 */
const MAX_MESSAGE_CHARS = 4000;
const MAX_HISTORY = 8;
const MAX_BODY_BYTES = 32000;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_REQUESTS = 20;
const ALLOWED_ORIGIN = "https://soumentechuniverse.github.io";
const recentRequests = new Map();

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}
function json(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      ...corsHeaders()
    }
  });
}
function rateLimited(ip, now = Date.now()) {
  if (!ip) return false;
  const record = recentRequests.get(ip);
  if (!record || now - record.start >= RATE_WINDOW_MS) {
    recentRequests.set(ip, { start: now, count: 1 });
    if (recentRequests.size > 2000) {
      for (const [key, value] of recentRequests) {
        if (now - value.start >= RATE_WINDOW_MS) recentRequests.delete(key);
      }
    }
    return false;
  }
  record.count += 1;
  return record.count > RATE_MAX_REQUESTS;
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (origin !== ALLOWED_ORIGIN) {
      return new Response("Forbidden", {
        status: 403,
        headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
      });
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method !== "POST") return json({ error: "Use POST to chat with Nexora AI." }, 405);
    if (!(request.headers.get("Content-Type") || "").toLowerCase().includes("application/json")) {
      return json({ error: "Content-Type must be application/json." }, 415);
    }
    const declaredLength = Number(request.headers.get("Content-Length") || 0);
    if (declaredLength > MAX_BODY_BYTES) return json({ error: "Request is too large." }, 413);

    const ip = request.headers.get("CF-Connecting-IP") || "";
    if (rateLimited(ip)) {
      return new Response(JSON.stringify({ error: "Too many requests. Please wait a few minutes and try again." }), {
        status: 429,
        headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Retry-After": "600", ...corsHeaders() }
      });
    }
    if (!env.AI) return json({ error: "Cloudflare Workers AI binding named AI is not configured yet." }, 503);

    let raw;
    try {
      raw = await request.text();
      if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return json({ error: "Request is too large." }, 413);
    } catch {
      return json({ error: "Please send a valid request body." }, 400);
    }
    let body;
    try { body = JSON.parse(raw); } catch { return json({ error: "Please send valid JSON." }, 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Invalid request format." }, 400);
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) return json({ error: "Please enter a question." }, 400);
    if (message.length > MAX_MESSAGE_CHARS) return json({ error: "Your message is too long. Please keep it under 4,000 characters." }, 413);

    const history = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY).map(item => {
      const role = item && (item.role === "assistant" || item.role === "ai") ? "assistant" : "user";
      const content = typeof (item && item.content) === "string" ? item.content.slice(0, 2000) : "";
      return content ? { role, content } : null;
    }).filter(Boolean) : [];

    const system = "You are Nexora AI Tutor, a friendly, accurate, multilingual learning assistant. Explain computer science and digital skills in simple English unless the user writes in another language; reply in the user's language. Use clear steps and examples. Be honest about uncertainty and current information. Never claim you performed actions you did not perform. For dangerous cyber activity, credential theft, tracking people, or bypassing security, refuse and redirect to safe learning. Keep answers useful and reasonably concise.";
    try {
      const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [{ role: "system", content: system }, ...history, { role: "user", content: message }],
        max_tokens: 900,
        temperature: 0.45
      });
      const reply = result && (result.response || result.output_text);
      if (typeof reply !== "string" || !reply.trim()) return json({ error: "The AI returned an empty answer. Please try again." }, 502);
      return json({ reply: reply.trim() }, 200);
    } catch {
      return json({ error: "The AI service is temporarily unavailable. Check the Worker AI binding, model availability, and Cloudflare usage limits, then try again." }, 502);
    }
  }
};
