// KrishiBot — Cloudflare Worker
// API Key यहाँ नहीं है — Cloudflare Secret में Safe है!

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Only /api/chat route handle करो
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      const GROQ_KEY = env.GROQ_API_KEY; // ← Cloudflare Secret

      if (!GROQ_KEY) {
        return new Response(JSON.stringify({
          error: { message: 'GROQ_API_KEY not set in Cloudflare Secrets' }
        }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      try {
        const body = await request.json();

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + GROQ_KEY,
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: body.messages,
            temperature: 0.7,
            max_tokens: 600,
          }),
        });

        const data = await groqRes.json();

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (err) {
        return new Response(JSON.stringify({
          error: { message: 'Worker Error: ' + err.message }
        }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Static files serve करो (index.html etc.)
    return new Response('KrishiBot API is running!', {
      status: 200,
      headers: corsHeaders,
    });
  }
};
