/**
 * Runtime XOR + Base64 deobfuscation utility.
 * The XOR key MUST match the one used in scripts/encode-api-key.js.
 */

const XOR_KEY = 'P1uM4n4g3rX0rK3y!';

export function deobfuscate(encoded: string): string {
  const binaryStr = atob(encoded);
  let result = '';
  for (let i = 0; i < binaryStr.length; i++) {
    result += String.fromCharCode(binaryStr.charCodeAt(i) ^ XOR_KEY.charCodeAt(i % XOR_KEY.length));
  }
  return result;
}
