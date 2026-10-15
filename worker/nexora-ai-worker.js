/**
 * Nexora AI Tutor — Cloudflare Worker + Workers AI
 * Create an AI binding named AI in the Cloudflare dashboard.
 * Never put provider secrets in index.html.
 */
const MAX_MESSAGE_CHARS = 4000;
const MAX_HISTORY = 8;
const ALLOWED_ORIGIN = "https://soumentechuniverse.github.io";

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}
function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...corsHeaders(origin) }
  });
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== "POST") return json({ error: "Use POST to chat with Nexora AI." }, 405, origin);
    if (origin && origin !== ALLOWED_ORIGIN) return json({ error: "This website is not allowed to use this endpoint." }, 403, origin);
    if (!env.AI) return json({ error: "Cloudflare Workers AI binding named AI is not configured yet." }, 503, origin);

    let body;
    try { body = await request.json(); } catch { return json({ error: "Please send valid JSON." }, 400, origin); }
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) return json({ error: "Please enter a question." }, 400, origin);
    if (message.length > MAX_MESSAGE_CHARS) return json({ error: "Your message is too long. Please keep it under 4,000 characters." }, 413, origin);

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
      if (typeof reply !== "string" || !reply.trim()) return json({ error: "The AI returned an empty answer. Please try again." }, 502, origin);
      return json({ reply: reply.trim() }, 200, origin);
    } catch (error) {
      return json({ error: "The AI service is temporarily unavailable. Check the Worker AI binding and Cloudflare usage limits, then try again." }, 502, origin);
    }
  }
};
