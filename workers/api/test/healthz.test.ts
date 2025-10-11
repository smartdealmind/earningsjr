import app from '../src/index';
import { describe, it, expect } from 'vitest';

describe('healthz', () => {
  it('returns ok json', async () => {
    const res = await app.request('/healthz');
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.service).toBe('chorecoins-api');
  });
});

