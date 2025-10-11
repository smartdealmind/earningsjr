import app from '../src/index';
import { describe, it, expect } from 'vitest';

describe('achievements listing', () => {
  it('requires auth', async () => {
    const r = await app.request('/achievements');
    expect([401, 403]).toContain(r.status);
  });
});

