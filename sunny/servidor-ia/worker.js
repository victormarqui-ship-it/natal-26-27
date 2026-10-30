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
 *
 * Voz de alta qualidade (opcional) — a mesma voz em português, inglês e espanhol:
 *   ElevenLabs:  npx wrangler secret put ELEVENLABS_API_KEY   (e, se quiser outra voz, ELEVENLABS_VOICE_ID)
 *   ou OpenAI:   npx wrangler secret put OPENAI_API_KEY
 *   Sem nenhuma dessas chaves, o app usa a melhor voz do próprio celular.
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
    if (new URL(req.url).pathname.replace(/\/+$/, "") === "/tts") return tts(body, env, cors);
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

/* voz: transforma o texto da resposta em áudio (mp3) */
async function tts(body, env, cors) {
  const text = String(body.text || "").slice(0, 900);
  const lang = String(body.lang || "pt-BR");
  if (!text) return new Response("Empty", { status: 400, headers: cors });
  let r = null;
  if (env.ELEVENLABS_API_KEY) {
    const voice = env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL"; // voz feminina calorosa; troque pelo ID de outra voz se preferir
    r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "content-type": "application/json", "xi-api-key": env.ELEVENLABS_API_KEY, accept: "audio/mpeg" },
      body: JSON.stringify({ text, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.25 } }),
    });
  } else if (env.OPENAI_API_KEY) {
    const accent = { "pt-BR": "português do Brasil", "pt-PT": "português de Portugal", "es-ES": "espanhol da Espanha", "es-MX": "espanhol latino-americano", "en-US": "inglês americano" }[lang] || lang;
    r = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: "gpt-4o-mini-tts", voice: "nova", input: text, response_format: "mp3",
        instructions: `Fale em ${accent}, com voz calorosa, animada e natural de um guia de viagem amigo. Ritmo tranquilo.` }),
    });
  } else {
    return new Response("No voice provider", { status: 501, headers: cors });
  }
  if (!r.ok) return new Response("Voice error", { status: 502, headers: cors });
  return new Response(r.body, { headers: { ...cors, "content-type": "audio/mpeg", "cache-control": "no-store" } });
}
