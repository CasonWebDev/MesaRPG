

import { createChallenge } from 'altcha-lib';

export async function GET() {
  try {
    const hmacKey = process.env.ALTCHA_HMAC_KEY;
    
    console.log('ALTCHA_HMAC_KEY exists:', !!hmacKey);
    console.log('ALTCHA_HMAC_KEY length:', hmacKey?.length || 0);
    
    if (!hmacKey || hmacKey.length === 0) {
      console.error('ALTCHA_HMAC_KEY is not set or empty');
      return new Response(JSON.stringify({ error: 'ALTCHA_HMAC_KEY not configured' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }
    
    const challenge = await createChallenge({
      hmacKey: hmacKey,
    });
    
    return new Response(JSON.stringify(challenge), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating ALTCHA challenge:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create challenge',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
