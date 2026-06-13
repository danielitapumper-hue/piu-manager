/**
 * Utility script to encode/decode Gemini API keys using XOR + Base64 obfuscation.
 *
 * Usage:
 *   node scripts/encode-api-key.js YOUR_GEMINI_API_KEY
 *
 * This will output the obfuscated string to paste into environment.ts.
 * The same XOR key must match the one in src/app/piuscores/services/crypto-utils.ts
 */

const XOR_KEY = 'P1uM4n4g3rX0rK3y!';

function xorEncrypt(text, key) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

function toBase64(str) {
  return Buffer.from(str, 'binary').toString('base64');
}

const apiKey = process.argv[2];

if (!apiKey) {
  console.error('Usage: node scripts/encode-api-key.js YOUR_GEMINI_API_KEY');
  process.exit(1);
}

const encoded = toBase64(xorEncrypt(apiKey, XOR_KEY));
console.log('\n🔑 Obfuscated API Key (paste into environment.ts):\n');
console.log(encoded);
console.log('');
