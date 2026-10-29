/**
 * Sunny Trip — servidor do agente de IA (Cloudflare Worker).
 * Guarda a chave da API da Anthropic em segredo e repassa as conversas do app, com streaming.
 *
 * Como publicar (grátis no plano Workers Free):
 *   1. npm create cloudflare@latest sunny-ai   (escolha "Hello World Worker")
 *   2. Troque o conteúdo de src/index.js por este arquivo.
 *   3. npx wrangler secret put ANTHROPIC_API_KEY      (cole a chave criada em console.anthropic.com)
 *   4. npx wrangler deploy
 *   5. No app: Ajustes → Agente Sunny → cole o endereço https://sunny-ai.<seu-usuario>.workers.dev
 */
const ALLOWED_ORIGINS = ["https://victormarqui-ship-it.github.io"]; // domínios que podem usar o servidor
const ALLOWED_MODELS = ["claude-haiku-5-5", "claude-sonnet-5-5"];
const MAX_TOKENS = 1500;

export default {
  async fetch(req, env) {
    const origin = req.headers.get("origin") || "";
    const okOrigin = ALLOWED_ORIGINS.includes(origin);
    const cors = {
      "access-control-allow-origin": okOrigin ? origin : ALLOWED_ORIGINS[0],
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "vary": "origin",
    };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST" || !okOrigin) return new Response("Forbidden", { status: 403, headers: cors });

    let body;
    try { body = await req.json(); } catch { return new Response("Bad JSON", { status: 400, headers: cors }); }
    const payload = {
      model: ALLOWED_MODELS.includes(body.model) ? body.model : ALLOWED_MODELS[0],
      max_tokens: Math.min(+body.max_tokens || MAX_TOKENS, MAX_TOKENS),
      stream: true,
      system: String(body.system || "").slice(0, 20000),
      tools: Array.isArray(body.tools) ? body.tools.slice(0, 20) : undefined,
      messages: Array.isArray(body.messages) ? body.messages.slice(-30) : [],
    };
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });
    return new Response(r.body, {
      status: r.status,
      headers: { ...cors, "content-type": r.headers.get("content-type") || "text/event-stream", "cache-control": "no-store" },
    });
  },
};
