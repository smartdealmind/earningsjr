import app from '../src/index';
import { describe, it, expect } from 'vitest';

describe('payout lifecycle', () => {
  it('creates payout with points', async () => {
    const res = await app.request('/payouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points: 100 })
    });
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.ok).toBe(true);
    if (j.ok) {
      expect(j.id).toMatch(/^pay_/);
      expect(j.status).toBe('requested');
    }
  });

  it('requires authentication', async () => {
    const res = await app.request('/payouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points: 100 })
    });
    const j = await res.json();
    expect([401, 400]).toContain(res.status);
  });
});

