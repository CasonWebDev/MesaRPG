

import { createChallenge } from 'altcha-lib';

export async function GET() {
  const challenge = await createChallenge({
    hmacKey: process.env.ALTCHA_HMAC_KEY,
  });
  return new Response(JSON.stringify(challenge), {
    headers: { 'content-type': 'application/json' },
  });
}
