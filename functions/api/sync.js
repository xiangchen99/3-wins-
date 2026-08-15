// Cloudflare Pages Serverless Function for Three Wins Sync
// Endpoint: /api/sync

export async function onRequestGet(context) {
  const { env, request } = context;

  // Verify PIN / Passcode from Authorization Header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized. Passcode required.' }), {
      status: 401,
      headers: corsHeaders()
    });
  }

  const userPin = authHeader.replace('Bearer ', '').trim();
  if (!userPin) {
    return new Response(JSON.stringify({ error: 'Invalid Passcode' }), {
      status: 401,
      headers: corsHeaders()
    });
  }

  try {
    // Generate secure hash key for the user's data namespace
    const storageKey = await hashPin(userPin);

    // Fetch from Cloudflare KV
    if (env.THREE_WINS_KV) {
      const rawData = await env.THREE_WINS_KV.get(storageKey);
      if (rawData) {
        return new Response(rawData, {
          status: 200,
          headers: {
            ...corsHeaders(),
            'Content-Type': 'application/json'
          }
        });
      }
    }

    // Return empty state if new user / not found
    return new Response(JSON.stringify({
      days: {},
      parking: [],
      updatedAt: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to retrieve data', details: err.message }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized. Passcode required.' }), {
      status: 401,
      headers: corsHeaders()
    });
  }

  const userPin = authHeader.replace('Bearer ', '').trim();
  if (!userPin) {
    return new Response(JSON.stringify({ error: 'Invalid Passcode' }), {
      status: 401,
      headers: corsHeaders()
    });
  }

  try {
    const payload = await request.json();
    if (!payload || typeof payload !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: corsHeaders()
      });
    }

    const storageKey = await hashPin(userPin);
    const serialized = JSON.stringify({
      days: payload.days || {},
      parking: payload.parking || [],
      updatedAt: new Date().toISOString()
    });

    if (env.THREE_WINS_KV) {
      // Save to Cloudflare KV (never expires)
      await env.THREE_WINS_KV.put(storageKey, serialized);
    }

    return new Response(JSON.stringify({
      ok: true,
      syncedAt: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to save data', details: err.message }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

// Handle CORS Preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}

// SHA-256 helper for user pin isolation
async function hashPin(pin) {
  const msgBuffer = new TextEncoder().encode('three_wins_salt_' + pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return 'user_' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}
