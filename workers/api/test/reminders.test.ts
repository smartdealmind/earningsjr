import app from '../src/index';
import { describe, it, expect } from 'vitest';

describe('reminders endpoints basic auth', () => {
  it('rejects unauth prefs list', async () => {
    const r = await app.request('/reminders/prefs');
    expect([401, 403]).toContain(r.status);
  });
  it('rejects unauth reminders list', async () => {
    const r = await app.request('/reminders');
    expect([401, 403]).toContain(r.status);
  });
});

