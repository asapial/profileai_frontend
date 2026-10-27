import assert from 'node:assert/strict';
import { safeRedirectPath, twoFactorLoginPath } from '../src/lib/auth-redirect.ts';

for (const unsafe of ['//evil.test', '/\\evil.test', '/\tevil.test', 'https://evil.test', '/\nevil.test', '/', null]) {
  if (unsafe === '/') assert.equal(safeRedirectPath(unsafe), '/');
  else assert.equal(safeRedirectPath(unsafe), null, String(unsafe));
}
const destination = '/dashboard/worker/authorize?request=abc&state=123';
assert.equal(safeRedirectPath(destination), destination);
const next = new URL(twoFactorLoginPath('person@example.com', destination), 'https://profileai.invalid');
assert.equal(next.searchParams.get('redirect'), destination);
assert.equal(next.searchParams.get('email'), 'person@example.com');
assert.equal(new URL(twoFactorLoginPath('person@example.com', '/\\evil.test'), 'https://profileai.invalid').searchParams.has('redirect'), false);
console.log('Auth redirects: local destination preserved; external and normalized bypasses rejected.');
