/**
 * QuickDash Razorpay Payment Verification Backend
 * ------------------------------------------------
 * Run:
 *   1) Copy .env.example -> .env and set RAZORPAY_KEY_SECRET
 *   2) node backend/payment-verification-server.js
 */

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '0.0.0.0';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

loadDotEnv();

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_SECRET) {
  console.error('Missing RAZORPAY_KEY_SECRET in environment.');
  process.exit(1);
}

const server = http.createServer(async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    return sendJson(res, 200, { ok: true, service: 'quickdash-payment-verifier' });
  }

  if (req.method === 'POST' && req.url === '/api/payments/verify') {
    try {
      const body = await parseJsonBody(req);
      const {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature
      } = body || {};

      if (!orderId || !paymentId || !signature) {
        return sendJson(res, 400, {
          ok: false,
          error: 'razorpay_order_id, razorpay_payment_id and razorpay_signature are required.'
        });
      }

      const payload = `${orderId}|${paymentId}`;
      const expected = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(payload)
        .digest('hex');

      const isValid = safeEqual(expected, signature);
      return sendJson(res, isValid ? 200 : 401, {
        ok: isValid,
        verified: isValid,
        orderId,
        paymentId
      });
    } catch (err) {
      return sendJson(res, 400, { ok: false, error: err.message || 'Invalid request body.' });
    }
  }

  sendJson(res, 404, { ok: false, error: 'Not found' });
});

server.listen(PORT, HOST, () => {
  console.log(`QuickDash payment verifier running at http://${HOST}:${PORT}`);
  console.log('Health: GET /health');
  console.log('Verify: POST /api/payments/verify');
});

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function sendJson(res, statusCode, payload) {
  const data = JSON.stringify(payload);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(data);
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error('Payload too large.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(new Error('Body must be valid JSON.'));
      }
    });
    req.on('error', reject);
  });
}

function safeEqual(expectedHex, providedHex) {
  try {
    const a = Buffer.from(expectedHex, 'utf8');
    const b = Buffer.from(String(providedHex || ''), 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (e) {
    return false;
  }
}

function loadDotEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const clean = line.trim();
    if (!clean || clean.startsWith('#')) return;
    const idx = clean.indexOf('=');
    if (idx === -1) return;
    const key = clean.slice(0, idx).trim();
    let value = clean.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  });
}
