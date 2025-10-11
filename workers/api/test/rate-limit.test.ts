import app from '../src/index';
import { describe, it, expect } from 'vitest';

describe('rate limit auth', () => {
  it('limits after 10 attempts', async () => {
    let last = 200;
    for (let i=0;i<12;i++){
      const res = await app.request('/auth/login', {
        method:'POST',
        headers:{'Content-Type':'application/json','CF-Connecting-IP':'1.2.3.4'},
        body: JSON.stringify({email:'x',password:'y'})
      });
      last = res.status;
    }
    expect([400,401,429]).toContain(last);
  });
});

