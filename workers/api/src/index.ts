import { Hono } from 'hono';
import Stripe from 'stripe';
import * as Sentry from '@sentry/cloudflare';
import { uid, hashPassword, verifyPassword, cookieSerialize } from './lib';
import { ok, err, readJson, rateLimit } from './http';
import { audit } from './logger';
import { bumpStatsAndMaybeAward } from './achievements';

type Bindings = {
  DB: D1Database;
  SESSION_KV: KVNamespace;
  ASSETS: R2Bucket;
  RESEND_API_KEY: string;
  SENDER_EMAIL?: string; // e.g., "EarningsJr <noreply@earningsjr.com>"
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET?: string;
  SENTRY_DSN?: string;
};

type Vars = { userId?: string, role?: string, actingAsKidId?: string };

const app = new Hono<{ Bindings: Bindings, Variables: Vars }>();

// CORS with Pages domain allowlist
const ALLOWED_ORIGINS = [
  'http://localhost:5173', // local dev
  'https://earningsjr.pages.dev', // production Pages
  'https://earningsjr.com', // custom domain
  'https://www.earningsjr.com', // www custom domain
  'https://api.earningsjr.com' // API custom domain
];

function isAllowedOrigin(origin?: string) {
  if (!origin) return false;
  try {
    const u = new URL(origin);
    // Allow *.pages.dev for previews and localhost for dev
    return (
      u.hostname.endsWith('.pages.dev') || 
      u.hostname === 'localhost' ||
      ALLOWED_ORIGINS.includes(origin)
    );
  } catch { return false; }
}

app.use('*', async (c, next) => {
  const origin = c.req.header('Origin');
  const allow = isAllowedOrigin(origin) ? origin : null;
  
  if (allow) {
    c.header('Access-Control-Allow-Origin', allow);
    c.header('Vary', 'Origin');
    c.header('Access-Control-Allow-Credentials', 'true');
    c.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS,DELETE');
    c.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Acting-As-Kid-Id');
    c.header('Access-Control-Expose-Headers', 'Set-Cookie');
  }
  
  if (c.req.method === 'OPTIONS') {
    return c.text('', 204);
  }
  
  await next();
});

// --- Session extractor ---
app.use('*', async (c, next) => {
  const cookie = c.req.header('Cookie') || '';
  const match = cookie.split(/;\s*/).find(kv => kv.startsWith('cc_sess='));
  if (match) {
    const token = decodeURIComponent(match.split('=')[1] || '');
    if (token) {
      const raw = await c.env.SESSION_KV.get(`sess:${token}`);
      if (raw) {
        const s = JSON.parse(raw) as { userId: string, role: string, exp: number };
        if (Date.now() < s.exp) {
          c.set('userId', s.userId);
          c.set('role', s.role);
        }
      }
    }
  }
  
  // Extract "Act As Kid" header if present (parent acting as kid)
  const actingAsKidId = c.req.header('X-Acting-As-Kid-Id');
  if (actingAsKidId) {
    // Verify parent is in same family as kid
    const userId = c.get('userId');
    const role = c.get('role');
    if (userId && (role === 'parent' || role === 'helper')) {
      // Verify kid belongs to parent's family
      const kidFam = await getUserFamilyId(c, actingAsKidId);
      const parentFam = await getUserFamilyId(c, userId);
      if (kidFam && parentFam && kidFam === parentFam) {
        c.set('actingAsKidId', actingAsKidId);
      }
    }
  }
  
  await next();
});

// --- Helper functions ---
function requireAuth(c: any) {
  const userId = c.get('userId');
  if (!userId) return c.json({ ok: false, error: 'auth_required' }, 401);
  return null;
}
function requireRole(c: any, roles: string[]) {
  const role = c.get('role');
  if (!role || !roles.includes(role)) return c.json({ ok: false, error: 'forbidden' }, 403);
  return null;
}
async function requireAdmin(c: any) {
  const uid = c.get('userId');
  if (!uid) return c.json({ ok: false, error: 'auth_required' }, 401);
  const u = await c.env.DB.prepare('SELECT is_admin FROM User WHERE id=?').bind(uid).first<{ is_admin: number }>();
  if (!u || (u as any).is_admin !== 1) return c.json({ ok: false, error: 'admin_only' }, 403);
  return null;
}
async function getUserFamilyId(c: any, userId: string) {
  const fm = await c.env.DB.prepare(
    `SELECT family_id FROM FamilyMember WHERE user_id=? LIMIT 1`
  ).bind(userId).first<{ family_id: string }>();
  return (fm as any)?.family_id ?? null;
}

// Check if family has active premium subscription
async function hasPremiumSubscription(c: any, familyId: string): Promise<boolean> {
  const fam = await c.env.DB.prepare(
    `SELECT subscription_status, subscription_current_period_end FROM Family WHERE id=?`
  ).bind(familyId).first<{ subscription_status: string, subscription_current_period_end: number | null }>();
  
  if (!fam) return false;
  
  // Active, trialing, or past_due (still has access) = premium
  const activeStatuses = ['active', 'trialing', 'past_due'];
  if (activeStatuses.includes(fam.subscription_status)) {
    // Check if subscription hasn't expired
    if (fam.subscription_current_period_end) {
      return Date.now() < fam.subscription_current_period_end;
    }
    return true;
  }
  
  return false;
}

// Get subscription limits for a family
async function getSubscriptionLimits(c: any, familyId: string): Promise<{ maxKids: number, maxChores: number, hasGoals: boolean, hasAchievements: boolean }> {
  const isPremium = await hasPremiumSubscription(c, familyId);
  
  if (isPremium) {
    return {
      maxKids: 999, // Unlimited
      maxChores: 999, // Unlimited
      hasGoals: true,
      hasAchievements: true
    };
  }
  
  // Free tier limits
  return {
    maxKids: 2,
    maxChores: 10,
    hasGoals: false,
    hasAchievements: false
  };
}

function nowMs() { return Date.now(); }

function genKidEmail(kidId: string) {
  // Kids may not have real email; use unique placeholder domain
  return `${kidId}@kid.earningsjr.local`;
}

// Reminder helpers
function dayMaskIncludes(mask: number, jsDay: number) {
  // JS: 0=Sun..6=Sat → same bit mapping
  return (mask & (1 << jsDay)) !== 0;
}

function localNowInTz(timezone: string) {
  // Uses Intl to compute local time components
  const d = new Date();
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', weekday: 'short'
  });
  const parts = fmt.formatToParts(d);
  const get = (t: string) => parts.find(p => p.type === t)?.value;
  // weekday: Sun,Mon,... → map to JS 0..6
  const wd = get('weekday');
  const jsDay = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(String(wd));
  return {
    hour: Number(get('hour')), minute: Number(get('minute')),
    jsDay, date: d
  };
}

// Root route
app.get('/', (c) => {
  return c.json({
    name: 'EarningsJr API',
    version: '0.0.1',
    endpoints: {
      health: '/healthz',
      version: '/version',
      auth: ['/auth/register-parent', '/auth/login', '/auth/logout', '/auth/kid-login'],
      resources: ['/me', '/templates', '/kids', '/chores', '/goals', '/requests', '/exchange/rules', '/eligibility', '/ledger', '/kids/balances', '/exchange/quote']
    },
    docs: 'https://github.com/smartdealmind/earningsjr'
  });
});

// Liveness + environment probe
app.get('/healthz', async (c) => {
  let d1Ok = false;
  let kvOk = false;
  let userVersion: number | null = null;
  let tablesOk = false;

  const requiredTables = [
    'User','Family','FamilyMember','KidProfile','ExchangeRule',
    'TaskTemplate','Chore','ChoreEvent','PointsLedger','Goal','TaskRequest','TrustedLink'
  ];

  try {
    // Try to get user_version, but don't fail if it doesn't work
    try {
      const vu = await c.env.DB.prepare('PRAGMA user_version;').first<{ user_version: number }>();
      userVersion = vu ? (vu as any).user_version ?? null : null;
    } catch {
      // PRAGMA might not be supported, skip it
      userVersion = null;
    }

    const res = await c.env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table';"
    ).all<{ name: string }>();

    const have = new Set((res?.results ?? []).map(r => r.name));
    tablesOk = requiredTables.every(t => have.has(t));
    d1Ok = true;
  } catch (err) {
    d1Ok = false;
  }

  try {
    const k = `healthz:${Date.now()}`;
    await c.env.SESSION_KV.put(k, 'ok', { expirationTtl: 60 });
    const v = await c.env.SESSION_KV.get(k);
    kvOk = v === 'ok';
  } catch {
    kvOk = false;
  }

  return c.json({
    ok: d1Ok && kvOk && tablesOk,
    service: 'earningsjr-api',
    d1: { ok: d1Ok, user_version: userVersion, tables_ok: tablesOk },
    kv: { ok: kvOk }
  });
});

// optional: version
app.get('/version', (c) => c.json({ version: '0.0.1' }));

// Helper: Generate verification email HTML
function getVerificationEmailHtml(code: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EarningsJr Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #09090b; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(24,24,27,0.95) 0%, rgba(39,39,42,0.95) 100%); border-radius: 24px; border: 1px solid rgba(63,63,70,0.5); overflow: hidden; box-shadow: 0 0 40px -10px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #fff; letter-spacing: -0.5px;">
                Chore<span style="color: #10b981;">Coins</span>
              </h1>
              <p style="margin: 10px 0 0; font-size: 14px; color: #a1a1aa;">Family Chore Management</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 16px; padding: 30px; text-align: center;">
                <p style="margin: 0 0 20px; font-size: 16px; color: #d4d4d8; line-height: 1.6;">
                  Your verification code is:
                </p>
                <div style="background: rgba(16,185,129,0.15); border: 2px solid rgba(16,185,129,0.4); border-radius: 12px; padding: 20px; margin: 0 auto; display: inline-block;">
                  <span style="font-size: 36px; font-weight: 700; color: #10b981; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                    ${code}
                  </span>
                </div>
                <p style="margin: 20px 0 0; font-size: 14px; color: #a1a1aa;">
                  This code will expire in <strong style="color: #fbbf24;">10 minutes</strong>
                </p>
              </div>
              
              <p style="margin: 30px 0 0; font-size: 15px; color: #d4d4d8; line-height: 1.6; text-align: center;">
                Enter this code on the verification page to complete your registration.
              </p>
            </td>
          </tr>
          
          <!-- Security Notice -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 12px; padding: 20px;">
                <p style="margin: 0; font-size: 13px; color: #fca5a5; line-height: 1.5;">
                  🔒 <strong>Security tip:</strong> Never share this code with anyone. EarningsJr will never ask for your verification code.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px; text-align: center; border-top: 1px solid rgba(63,63,70,0.5);">
              <p style="margin: 0 0 10px; font-size: 12px; color: #71717a;">
                Didn't request this code? You can safely ignore this email.
              </p>
              <p style="margin: 0; font-size: 12px; color: #52525b;">
                © ${new Date().getFullYear()} EarningsJr • Powered by <a href="https://smartdealmind.com" style="color: #10b981; text-decoration: none;">SmartDealMind LLC</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// --- Auth: Send Verification Code (DEV MODE - returns code directly) ---
app.post('/auth/send-verification-dev', async (c) => {
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  if (!(await rateLimit(c, `verify:${ip}`, 10, 60))) {
    return err(c, 429, 'rate_limited', 'Too many attempts, try again soon');
  }

  const { email } = await c.req.json<{ email: string }>();
  if (!email) return c.json({ ok: false, error: 'email_required' }, 400);

  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const key = `verify:${email}`;
  
  // Store code in KV for 10 minutes
  await c.env.SESSION_KV.put(key, code, { expirationTtl: 600 });

  // DEV MODE: Return code directly instead of sending email
  console.log(`[DEV MODE] Verification code for ${email}: ${code}`);
  return c.json({ 
    ok: true, 
    message: 'Verification code generated (dev mode)',
    code: code // Only in dev mode!
  });
});

// --- Auth: Send Verification Code ---
app.post('/auth/send-verification', async (c) => {
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  if (!(await rateLimit(c, `verify:${ip}`, 5, 60))) {
    return err(c, 429, 'rate_limited', 'Too many attempts, try again soon');
  }

  const { email } = await c.req.json<{ email: string }>();
  if (!email) return c.json({ ok: false, error: 'email_required' }, 400);

  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const key = `verify:${email}`;
  
  // Store code in KV for 10 minutes
  await c.env.SESSION_KV.put(key, code, { expirationTtl: 600 });

  // Send email via Resend
  try {
    const emailHtml = getVerificationEmailHtml(code);
    
    // Use verified domain email (required for sending to any email address)
    const senderEmail = c.env.SENDER_EMAIL || 'EarningsJr <onboarding@resend.dev>';
    
    // Debug: Log what sender email is being used
    console.log(`Sending email with sender: ${senderEmail}`);
    console.log(`SENDER_EMAIL env var: ${c.env.SENDER_EMAIL ? 'SET' : 'NOT SET'}`);
    
    const emailPayload = {
      from: senderEmail,
      to: [email],
      subject: `Your EarningsJr verification code: ${code}`,
      html: emailHtml,
      text: `Your EarningsJr verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nEnter this code on the verification page to complete your registration.\n\nIf you didn't request this code, you can safely ignore this email.`
    };

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json();
      console.error('Resend API error:', {
        status: resendResponse.status,
        statusText: resendResponse.statusText,
        error: errorData
      });
      // Don't expose internal errors to user, but log for debugging
      return c.json({ 
        ok: false, 
        error: 'Failed to send email. Please try again.',
        debug: errorData // Temporarily include for debugging
      }, 500);
    }

    const emailResult = await resendResponse.json();
    console.log(`Verification email sent to ${email}`, emailResult);

    return c.json({ 
      ok: true, 
      message: 'Verification code sent to your email'
    });
  } catch (error: any) {
    console.error('Email sending error:', error?.message || error);
    return c.json({ 
      ok: false, 
      error: 'Failed to send email. Please try again.',
      debug: error?.message || String(error) // Temporarily include for debugging
    }, 500);
  }
});

// --- Auth: Verify Email Code ---
app.post('/auth/verify-email', async (c) => {
  const { email, code } = await c.req.json<{ email: string; code: string }>();
  if (!email || !code) return c.json({ ok: false, error: 'missing_fields' }, 400);

  const key = `verify:${email}`;
  const storedCode = await c.env.SESSION_KV.get(key);

  if (!storedCode || storedCode !== code) {
    return c.json({ ok: false, error: 'invalid_or_expired_code' }, 400);
  }

  // Mark as verified (store a flag for 1 hour)
  await c.env.SESSION_KV.put(`verified:${email}`, 'true', { expirationTtl: 3600 });
  await c.env.SESSION_KV.delete(key); // Delete used code

  return c.json({ ok: true, verified: true });
});

// --- Auth: Register parent + family bootstrap ---
app.post('/auth/register-parent', async (c) => {
  // Rate limit
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  if (!(await rateLimit(c, `auth:${ip}`, 10, 60))) {
    return err(c, 429, 'rate_limited', 'Too many attempts, try again soon');
  }

  try {
    const body = await c.req.json<{ email: string, password: string, first_name: string, last_name: string, family_name: string }>();
    const { email, password, first_name, last_name, family_name } = body || {};
    if (!email || !password || !first_name || !last_name || !family_name) {
      return c.json({ ok: false, error: 'Missing required fields' }, 400);
    }

    // Check email verification
    const verified = await c.env.SESSION_KV.get(`verified:${email}`);
    if (!verified) {
      return c.json({ ok: false, error: 'email_not_verified' }, 400);
    }

    const userId = uid('usr');
    const familyId = uid('fam');
    const memberId = uid('mbr');
    const exchangeId = uid('exr');
    const now = Date.now();

    // Unique email guard
    const existing = await c.env.DB.prepare('SELECT id FROM User WHERE email = ?').bind(email).first();
    if (existing) return c.json({ ok: false, error: 'Email already registered' }, 409);

    const pwd = await hashPassword(password);

  try {
    // D1 batch execution
    const result = await c.env.DB.batch([
      c.env.DB.prepare(`
        INSERT INTO User (id,email,password_hash,first_name,last_name,role,created_at) VALUES (?,?,?,?,?,'parent',?);
      `).bind(userId, email, pwd, first_name ?? null, last_name ?? null, now),
      
      c.env.DB.prepare(`INSERT INTO Family (id,name,created_at) VALUES (?,?,?);`).bind(familyId, family_name, now),
      
      c.env.DB.prepare(`
        INSERT INTO FamilyMember (id,family_id,user_id,role,created_at) VALUES (?,?,?,'parent',?);
      `).bind(memberId, familyId, userId, now),
      
      c.env.DB.prepare(`
        INSERT INTO ExchangeRule (id,family_id,points_per_currency,currency_code,rounding,weekly_allowance_points,required_task_min_pct,created_at)
        VALUES (?,?,100,'USD','down',0,20,?);
      `).bind(exchangeId, familyId, now)
    ]);
    
    // Check if any query failed
    const failed = result.find(r => !r.success);
    if (failed) {
      return c.json({ ok: false, error: 'Database error during registration' }, 500);
    }
  } catch (err) {
    return c.json({ ok: false, error: 'Database error' }, 500);
  }

  // Create session
  const token = uid('tok');
  const sess = { userId, role: 'parent', exp: Date.now() + 1000 * 60 * 60 * 24 * 7 }; // 7 days
  await c.env.SESSION_KV.put(`sess:${token}`, JSON.stringify(sess), { expirationTtl: 60 * 60 * 24 * 7 });

  c.header('Set-Cookie', cookieSerialize('cc_sess', encodeURIComponent(token), {
    httpOnly: true, secure: true, sameSite: 'None', path: '/', maxAge: 60 * 60 * 24 * 7
  }));

  await audit(c, { action: 'auth.register', targetId: userId, meta: { role: 'parent' }, familyId });

  // Clean up verification flag
  await c.env.SESSION_KV.delete(`verified:${email}`);

  return c.json({ ok: true, userId, familyId });
  } catch (err: any) {
    console.error('Registration error:', err);
    return c.json({ ok: false, error: err.message || 'Registration failed' }, 500);
  }
});

// --- Auth: Login ---
app.post('/auth/login', async (c) => {
  // Rate limit
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  if (!(await rateLimit(c, `auth:${ip}`, 10, 60))) {
    return err(c, 429, 'rate_limited', 'Too many attempts, try again soon');
  }

  const body = await c.req.json<{ email: string, password: string }>();
  const { email, password } = body || {};
  if (!email || !password) return c.json({ ok: false, error: 'Missing fields' }, 400);

  const row = await c.env.DB.prepare(`SELECT id, password_hash, role FROM User WHERE email = ?`).bind(email).first<{ id: string, password_hash: string, role: string }>();
  if (!row) return c.json({ ok: false, error: 'Invalid credentials' }, 401);

  const ok = await verifyPassword(password, (row as any).password_hash);
  if (!ok) return c.json({ ok: false, error: 'Invalid credentials' }, 401);

  const token = uid('tok');
  const role = (row as any).role as string;
  const sess = { userId: (row as any).id as string, role, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 };
  await c.env.SESSION_KV.put(`sess:${token}`, JSON.stringify(sess), { expirationTtl: 60 * 60 * 24 * 7 });

  c.header('Set-Cookie', cookieSerialize('cc_sess', encodeURIComponent(token), {
    httpOnly: true, secure: true, sameSite: 'None', path: '/', maxAge: 60 * 60 * 24 * 7
  }));

  await audit(c, { action: 'auth.login', targetId: (row as any).id, meta: { role } });

  return c.json({ ok: true });
});

// --- Auth: Logout ---
app.post('/auth/logout', async (c) => {
  const cookie = c.req.header('Cookie') || '';
  const match = cookie.split(/;\s*/).find(kv => kv.startsWith('cc_sess='));
  if (match) {
    const token = decodeURIComponent(match.split('=')[1] || '');
    if (token) await c.env.SESSION_KV.delete(`sess:${token}`);
  }
  c.header('Set-Cookie', cookieSerialize('cc_sess', '', { httpOnly: true, secure: true, sameSite: 'None', path: '/', maxAge: 0 }));
  return c.json({ ok: true });
});

// Helper: Generate password reset email HTML
function getPasswordResetEmailHtml(resetUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your EarningsJr Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #09090b; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(24,24,27,0.95) 0%, rgba(39,39,42,0.95) 100%); border-radius: 24px; border: 1px solid rgba(63,63,70,0.5); overflow: hidden; box-shadow: 0 0 40px -10px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #fff; letter-spacing: -0.5px;">
                Chore<span style="color: #10b981;">Coins</span>
              </h1>
              <p style="margin: 10px 0 0; font-size: 14px; color: #a1a1aa;">Family Chore Management</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 16px; padding: 30px; text-align: center;">
                <p style="margin: 0 0 20px; font-size: 16px; color: #d4d4d8; line-height: 1.6;">
                  You requested to reset your password. Click the button below to create a new password:
                </p>
                <a href="${resetUrl}" style="display: inline-block; background: #10b981; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; margin: 20px 0;">
                  Reset Password
                </a>
                <p style="margin: 20px 0 0; font-size: 14px; color: #a1a1aa;">
                  This link will expire in <strong style="color: #fbbf24;">1 hour</strong>
                </p>
              </div>
              
              <p style="margin: 30px 0 0; font-size: 15px; color: #d4d4d8; line-height: 1.6; text-align: center;">
                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
              
              <p style="margin: 20px 0 0; font-size: 13px; color: #71717a; text-align: center;">
                Or copy and paste this link into your browser:<br>
                <span style="word-break: break-all; color: #10b981;">${resetUrl}</span>
              </p>
            </td>
          </tr>
          
          <!-- Security Notice -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 12px; padding: 20px;">
                <p style="margin: 0; font-size: 13px; color: #fca5a5; line-height: 1.5;">
                  🔒 <strong>Security tip:</strong> Never share this link with anyone. EarningsJr will never ask for your password reset link.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px; text-align: center; border-top: 1px solid rgba(63,63,70,0.5);">
              <p style="margin: 0 0 10px; font-size: 12px; color: #71717a;">
                Didn't request this? You can safely ignore this email.
              </p>
              <p style="margin: 0; font-size: 12px; color: #52525b;">
                © ${new Date().getFullYear()} EarningsJr • Powered by <a href="https://smartdealmind.com" style="color: #10b981; text-decoration: none;">SmartDealMind LLC</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// --- Auth: Forgot Password ---
app.post('/auth/forgot-password', async (c) => {
  // Rate limit
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  if (!(await rateLimit(c, `forgot:${ip}`, 5, 60))) {
    return err(c, 429, 'rate_limited', 'Too many attempts, try again soon');
  }

  const { email } = await c.req.json<{ email: string }>();
  if (!email) return c.json({ ok: false, error: 'email_required' }, 400);

  // Check if user exists (don't reveal if they don't for security)
  const user = await c.env.DB.prepare(`SELECT id, email FROM User WHERE email = ?`).bind(email).first<{ id: string, email: string }>();
  
  // Always return success to prevent email enumeration
  // But only send email if user exists
  if (user) {
    // Generate secure reset token
    const resetToken = uid('rst');
    const key = `reset:${resetToken}`;
    
    // Store token in KV for 1 hour (3600 seconds)
    await c.env.SESSION_KV.put(key, user.id, { expirationTtl: 3600 });
    
    // Generate reset URL
    const origin = c.req.header('Origin') || 'https://earningsjr.pages.dev';
    const resetUrl = `${origin}/reset-password?token=${resetToken}`;
    
    // Send email via Resend
    try {
      const emailHtml = getPasswordResetEmailHtml(resetUrl);
      const senderEmail = c.env.SENDER_EMAIL || 'EarningsJr <onboarding@resend.dev>';
      
      const emailPayload = {
        from: senderEmail,
        to: [email],
        subject: 'Reset Your EarningsJr Password',
        html: emailHtml,
        text: `You requested to reset your password for EarningsJr.\n\nClick this link to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, you can safely ignore this email.`
      };

      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailPayload)
      });

      if (!resendResponse.ok) {
        console.error('Resend API error:', await resendResponse.json());
        // Don't reveal failure to user
      } else {
        await audit(c, { action: 'auth.forgot_password', targetId: user.id, meta: { email } });
      }
    } catch (error: any) {
      console.error('Email sending error:', error?.message || error);
      // Don't reveal failure to user
    }
  }

  // Always return success to prevent email enumeration
  return c.json({ 
    ok: true, 
    message: 'If an account with that email exists, we\'ve sent a password reset link.'
  });
});

// --- Auth: Reset Password ---
app.post('/auth/reset-password', async (c) => {
  // Rate limit
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  if (!(await rateLimit(c, `reset:${ip}`, 5, 60))) {
    return err(c, 429, 'rate_limited', 'Too many attempts, try again soon');
  }

  const body = await c.req.json<{ token: string, password: string }>();
  const { token, password } = body || {};
  
  if (!token || !password) {
    return c.json({ ok: false, error: 'token_and_password_required' }, 400);
  }

  if (password.length < 8) {
    return c.json({ ok: false, error: 'password_too_short' }, 400);
  }

  // Get user ID from token
  const key = `reset:${token}`;
  const userId = await c.env.SESSION_KV.get(key);
  
  if (!userId) {
    return c.json({ ok: false, error: 'invalid_or_expired_token' }, 400);
  }

  // Hash new password
  const newPasswordHash = await hashPassword(password);
  
  // Update password in database
  await c.env.DB.prepare(`UPDATE User SET password_hash = ? WHERE id = ?`)
    .bind(newPasswordHash, userId).run();
  
  // Delete used token
  await c.env.SESSION_KV.delete(key);
  
  // Invalidate all existing sessions for this user (force re-login)
  // Note: This is a simple implementation. For production, you'd want to track all sessions
  // and delete them individually. For now, users will need to log in again.
  
  await audit(c, { action: 'auth.reset_password', targetId: userId, meta: {} });

  return c.json({ ok: true, message: 'Password reset successfully. Please log in with your new password.' });
});

// --- Kid login (PIN) ---
app.post('/auth/kid-login', async (c) => {
  // Rate limit
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  if (!(await rateLimit(c, `auth:${ip}`, 10, 60))) {
    return err(c, 429, 'rate_limited', 'Too many attempts, try again soon');
  }

  const body = await c.req.json<{ kid_user_id?: string; display_name?: string; pin: string }>();
  const { kid_user_id, display_name, pin } = body || {};
  if (!pin || (!kid_user_id && !display_name)) {
    return c.json({ ok: false, error: 'Missing kid_user_id/display_name or pin' }, 400);
  }

  // Resolve kid user
  let row: any;
  if (kid_user_id) {
    row = await c.env.DB.prepare(`SELECT U.id, U.password_hash, U.role 
                                  FROM User U WHERE U.id=? AND U.role='kid'`)
          .bind(kid_user_id).first();
  } else {
    row = await c.env.DB.prepare(`SELECT U.id, U.password_hash, U.role
                                  FROM User U 
                                  JOIN KidProfile K ON K.user_id = U.id
                                  WHERE K.display_name=? AND U.role='kid' LIMIT 1`)
          .bind(display_name).first();
  }
  if (!row) return c.json({ ok:false, error:'kid_not_found' }, 404);

  const ok = await verifyPassword(pin, (row as any).password_hash);
  if (!ok) return c.json({ ok:false, error:'invalid_pin' }, 401);

  // Create session
  const token = uid('tok');
  const sess = { userId: (row as any).id as string, role: 'kid', exp: Date.now() + 1000*60*60*24*7 };
  await c.env.SESSION_KV.put(`sess:${token}`, JSON.stringify(sess), { expirationTtl: 60*60*24*7 });

  c.header('Set-Cookie', cookieSerialize('cc_sess', encodeURIComponent(token), {
    httpOnly: true, secure: true, sameSite: 'None', path: '/', maxAge: 60 * 60 * 24 * 7
  }));
  return c.json({ ok:true, kid_user_id: (row as any).id });
});

// --- Me ---
app.get('/me', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ ok: false, authenticated: false }, 200);

  const actingAsKidId = c.get('actingAsKidId');
  
  // If parent is acting as kid, return kid's info
  if (actingAsKidId) {
    const kid = await c.env.DB.prepare(`SELECT user_id, display_name, points_balance FROM KidProfile WHERE user_id=?`).bind(actingAsKidId).first<any>();
    if (kid) {
      return c.json({ 
        ok: true, 
        authenticated: true, 
        user: { 
          id: kid.user_id, 
          first_name: kid.display_name,
          role: 'kid'
        },
        actingAsKid: true
      });
    }
  }

  const u = await c.env.DB.prepare(`SELECT id,email,first_name,last_name,role,created_at FROM User WHERE id=?`).bind(userId).first();
  if (!u) return c.json({ ok: false, authenticated: false }, 200);

  // find any family for this user
  const fm = await c.env.DB.prepare(`SELECT family_id, role FROM FamilyMember WHERE user_id=? LIMIT 1`).bind(userId).first<{ family_id: string, role: string }>();
  const familyId = (fm as any)?.family_id ?? null;

  return c.json({ ok: true, authenticated: true, user: u, familyId });
});

// --- GET /templates?age= ---
app.get('/templates', async (c) => {
  const ageStr = c.req.query('age');
  const age = ageStr ? parseInt(ageStr, 10) : undefined;

  let q = `SELECT id,title,description,min_age,max_age,category,default_points,is_required_default
           FROM TaskTemplate WHERE is_global = 1`;
  const args: any[] = [];
  if (age != null && !Number.isNaN(age)) {
    q += ` AND (min_age IS NULL OR min_age <= ?) AND (max_age IS NULL OR max_age >= ?)`;
    args.push(age, age);
  }
  q += ` ORDER BY min_age NULLS FIRST, title`;

  const res = await c.env.DB.prepare(q).bind(...args).all();
  return c.json({ ok: true, templates: res.results ?? [] });
});

// Create a new template (user-contributed)
app.post('/templates', async (c) => {
  const a = requireAuth(c);
  if (a) return a;

  const userId = c.get('userId');
  const role = c.get('role');
  
  // Only parents can create templates for now (could expand to admins)
  if (role !== 'parent' && role !== 'admin') {
    return err(c, 403, 'forbidden', 'Only parents can create templates');
  }

  const body = await c.req.json<{
    title: string;
    description?: string;
    min_age: number;
    max_age: number;
    category: string;
    default_points: number;
    is_required_default: boolean;
  }>();

  const { title, description, min_age, max_age, category, default_points, is_required_default } = body || {};

  if (!title || min_age == null || max_age == null || !category || default_points == null) {
    return err(c, 400, 'missing_fields', 'Title, ages, category, and points are required');
  }

  if (min_age < 3 || max_age > 17 || min_age > max_age) {
    return err(c, 400, 'invalid_ages', 'Ages must be between 3-17 and min_age <= max_age');
  }

  const templateId = uid('tmpl');
  const now = Date.now();

  // Save as global template (available to all families)
  await c.env.DB.prepare(`
    INSERT INTO TaskTemplate (id, title, description, min_age, max_age, category, default_points, is_required_default, is_global)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).bind(templateId, title, description || '', min_age, max_age, category, default_points, is_required_default ? 1 : 0).run();

  await audit(c, {
    action: 'template.create',
    targetId: templateId,
    meta: { title, category, min_age, max_age, contributed_by: userId }
  });

  return c.json({ ok: true, template_id: templateId, message: 'Template created and shared with community!' });
});

// --- POST /kids (parent creates kid) ---
app.post('/kids', async (c) => {
  // Guards
  const a = requireAuth(c); if (a) return a;
  const r = requireRole(c, ['parent']); if (r) return r;

  const parentId = c.get('userId');
  const familyId = await getUserFamilyId(c, parentId);
  if (!familyId) return c.json({ ok: false, error: 'family_not_found' }, 400);

  // Check paywall: limit kids on free tier
  const limits = await getSubscriptionLimits(c, familyId);
  const kidCount = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM KidProfile WHERE family_id=?`
  ).bind(familyId).first<{ count: number }>();
  
  if ((kidCount?.count ?? 0) >= limits.maxKids) {
    return c.json({ 
      ok: false, 
      error: 'kid_limit_reached',
      message: `Free tier allows up to ${limits.maxKids} kids. Upgrade to Premium for unlimited kids.`,
      upgradeRequired: true
    }, 403);
  }

  const body = await c.req.json<{ display_name: string; birthdate?: string; pin?: string }>();
  const { display_name, birthdate, pin } = body || {};
  if (!display_name) return c.json({ ok: false, error: 'missing_display_name' }, 400);

  const kidUserId = uid('usr');
  const kidProfileId = uid('kid');
  const memberId = uid('mbr');
  const now = nowMs();
  const email = genKidEmail(kidUserId);
  const pinPwd = await hashPassword(pin && pin.length ? pin : crypto.randomUUID().slice(0,6));

  // Create user (role=kid), member, profile
  await c.env.DB.prepare(`
    INSERT INTO User (id,email,password_hash,first_name,last_name,role,created_at)
    VALUES (?,?,?,?,?,'kid',?)
  `).bind(kidUserId, email, pinPwd, display_name, null, now).run();

  await c.env.DB.prepare(`
    INSERT INTO FamilyMember (id,family_id,user_id,role,created_at)
    VALUES (?,?,?,?,?)
  `).bind(memberId, familyId, kidUserId, 'kid', now).run();

  await c.env.DB.prepare(`
    INSERT INTO KidProfile (id,user_id,family_id,birthdate,display_name,points_balance,created_at)
    VALUES (?,?,?,?,?,0,?)
  `).bind(kidProfileId, kidUserId, familyId, birthdate ?? null, display_name, now).run();

  return c.json({ ok: true, kid_user_id: kidUserId, kid_profile_id: kidProfileId });
});

// --- POST /chores (create one or bulk from templates) ---
app.post('/chores', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const parentId = c.get('userId');
  const role = c.get('role');
  if (!['parent','helper'].includes(role)) return c.json({ ok:false, error:'forbidden' }, 403);

  const familyId = await getUserFamilyId(c, parentId);
  if (!familyId) return c.json({ ok:false, error:'family_not_found' }, 400);

  type Body =
    | { title: string; description?: string; category?: string; is_required?: boolean; points?: number; kid_user_id?: string; due_at?: number; }
    | { from_template_ids: string[]; kid_user_id?: string; due_at?: number; };

  const b = await c.req.json<Body>();

  // Check paywall: limit chores on free tier
  const limits = await getSubscriptionLimits(c, familyId);
  const choreCount = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM Chore WHERE family_id=? AND status NOT IN ('approved', 'denied', 'expired')`
  ).bind(familyId).first<{ count: number }>();
  
  const templatesToCreate = ('from_template_ids' in b) ? (b.from_template_ids?.length || 0) : 0;
  const singleChore = ('title' in b) ? 1 : 0;
  const newChoresCount = templatesToCreate || singleChore;
  
  if ((choreCount?.count ?? 0) + newChoresCount > limits.maxChores) {
    return c.json({ 
      ok: false, 
      error: 'chore_limit_reached',
      message: `Free tier allows up to ${limits.maxChores} active chores. Upgrade to Premium for unlimited chores.`,
      upgradeRequired: true,
      currentCount: choreCount?.count ?? 0,
      maxAllowed: limits.maxChores
    }, 403);
  }

  const created: string[] = [];
  const now = nowMs();

  const make = async (p: { title:string; description?:string; category?:string; is_required?:boolean; points?:number; kid_user_id?:string; due_at?:number; }) => {
    const id = uid('chr');
    await c.env.DB.prepare(`
      INSERT INTO Chore (id,family_id,kid_user_id,title,description,category,is_required,points,status,due_at,created_at,created_by,assigned_by_user_id)
      VALUES (?,?,?,?,?,?,?,?, 'open', ?,?,?,?)
    `).bind(
      id, familyId, p.kid_user_id ?? null, p.title, p.description ?? null, p.category ?? null,
      p.is_required ? 1 : 0, p.points ?? 0, p.due_at ?? null, now, parentId, parentId
    ).run();
    created.push(id);
  };

  if ('from_template_ids' in b) {
    if (!b.from_template_ids?.length) return c.json({ ok:false, error:'missing_templates' }, 400);
    const rows = await c.env.DB.prepare(
      `SELECT id,title,description,category,default_points,is_required_default FROM TaskTemplate WHERE id IN (${b.from_template_ids.map(()=>'?').join(',')})`
    ).bind(...b.from_template_ids).all<{title:string,description:string,category:string,default_points:number,is_required_default:number}>();
    for (const t of (rows.results ?? [])) {
      await make({
        title: t.title,
        description: t.description ?? undefined,
        category: t.category ?? undefined,
        is_required: t.is_required_default === 1,
        points: t.default_points ?? 0,
        kid_user_id: (b as any).kid_user_id,
        due_at: (b as any).due_at
      });
    }
  } else {
    await make(b as any);
  }

  return c.json({ ok:true, chore_ids: created });
});

// --- GET /chores (parent view or kid view) ---
app.get('/chores', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const userId = c.get('userId');
  const role = c.get('role');
  const actingAsKidId = c.get('actingAsKidId');

  const status = c.req.query('status'); // optional
  const where: string[] = [];
  const args: any[] = [];

  // If parent is acting as kid, show that kid's chores
  if (actingAsKidId) {
    where.push(`kid_user_id = ?`);
    args.push(actingAsKidId);
  } else if (role === 'kid') {
    where.push(`kid_user_id = ?`);
    args.push(userId);
  } else {
    // parent/helper: scope to their family
    const familyId = await getUserFamilyId(c, userId);
    if (!familyId) return c.json({ ok:false, error:'family_not_found' }, 400);
    where.push(`family_id = ?`);
    args.push(familyId);
  }
  if (status) { where.push(`status = ?`); args.push(status); }

  const q = `
    SELECT id,family_id,kid_user_id,title,category,is_required,points,status,due_at,created_at
    FROM Chore
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY created_at DESC
  `;
  const res = await c.env.DB.prepare(q).bind(...args).all();
  return c.json({ ok:true, chores: res.results ?? [] });
});

// --- POST /chores/:id/claim (kid claims chore) ---
app.post('/chores/:id/claim', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const userId = c.get('userId');
  const role = c.get('role');
  const actingAsKidId = c.get('actingAsKidId');
  
  // Allow if kid OR parent acting as kid
  const effectiveKidId = actingAsKidId || (role === 'kid' ? userId : null);
  if (!effectiveKidId) return c.json({ ok:false, error:'for_kid_only' }, 403);

  const id = c.req.param('id');
  const now = nowMs();

  // claim open chore for this kid (or unassigned)
  const row = await c.env.DB.prepare(`SELECT family_id,kid_user_id,status FROM Chore WHERE id=?`).bind(id).first<any>();
  if (!row) return c.json({ ok:false, error:'not_found' }, 404);
  if (row.status !== 'open') return c.json({ ok:false, error:'not_open' }, 400);
  if (row.kid_user_id && row.kid_user_id !== effectiveKidId) return c.json({ ok:false, error:'not_assigned_to_you' }, 403);

  await c.env.DB.prepare(`UPDATE Chore SET kid_user_id=?, status='claimed' WHERE id=?`).bind(effectiveKidId, id).run();
  await c.env.DB.prepare(`INSERT INTO ChoreEvent (id,chore_id,actor_user_id,type,created_at) VALUES (?,?,?,?,?)`)
    .bind(uid('cev'), id, effectiveKidId, 'claimed', now).run();

  return c.json({ ok:true });
});

// --- POST /chores/:id/submit (kid submits chore) ---
app.post('/chores/:id/submit', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const userId = c.get('userId'); 
  const role = c.get('role');
  const actingAsKidId = c.get('actingAsKidId');
  
  // Allow if kid OR parent acting as kid
  const effectiveKidId = actingAsKidId || (role === 'kid' ? userId : null);
  if (!effectiveKidId) return c.json({ ok:false, error:'for_kid_only' }, 403);

  const id = c.req.param('id'); 
  const now = nowMs();
  const row = await c.env.DB.prepare(`SELECT family_id,kid_user_id,is_required,points,status FROM Chore WHERE id=?`).bind(id).first<any>();
  if (!row || row.kid_user_id !== effectiveKidId) return c.json({ ok:false, error:'not_found_or_not_yours' }, 404);
  if (!['claimed','open'].includes(row.status)) return c.json({ ok:false, error:'bad_status' }, 400);

  await c.env.DB.prepare(`UPDATE Chore SET status='submitted' WHERE id=?`).bind(id).run();
  await c.env.DB.prepare(`INSERT INTO ChoreEvent (id,chore_id,actor_user_id,type,created_at) VALUES (?,?,?,?,?)`)
    .bind(uid('cev'), id, effectiveKidId, 'submitted', now).run();

  // Auto-approve if parent is acting as kid
  if (actingAsKidId) {
    const approverId = userId; // Parent who is acting as kid
    await c.env.DB.prepare(`UPDATE Chore SET status='approved' WHERE id=?`).bind(id).run();
    await c.env.DB.prepare(`INSERT INTO ChoreEvent (id,chore_id,actor_user_id,type,created_at) VALUES (?,?,?,?,?)`)
      .bind(uid('cev'), id, approverId, 'approved', now).run();

    // credit points if not required
    let pointsAwarded = 0;
    if (row.is_required === 0 && row.kid_user_id) {
      pointsAwarded = row.points;
      // Store that this was auto-approved by parent acting as kid
      await c.env.DB.prepare(`
        INSERT INTO PointsLedger (id,kid_user_id,family_id,delta_points,reason,ref_id,created_at)
        VALUES (?,?,?,?,?,?,?)
      `).bind(uid('plg'), row.kid_user_id, row.family_id, row.points, 'chore_approved', id, now).run();

      await c.env.DB.prepare(`UPDATE KidProfile SET points_balance = points_balance + ? WHERE user_id=?`)
        .bind(row.points, row.kid_user_id).run();
    }

    // Bump stats and check for badge awards
    if (row.kid_user_id) {
      await bumpStatsAndMaybeAward(c, row.kid_user_id, pointsAwarded);
    }

    await audit(c, { action: 'chore.approve', targetId: id, meta: { points: row.points, required: !!row.is_required, auto_approved: true } });
  }

  return c.json({ ok:true });
});

// --- POST /chores/:id/approve (parent approves chore) ---
app.post('/chores/:id/approve', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const r = requireRole(c, ['parent','helper']); if (r) return r;

  const approverId = c.get('userId'); const id = c.req.param('id'); const now = nowMs();

  const row = await c.env.DB.prepare(`SELECT family_id,kid_user_id,is_required,points,status FROM Chore WHERE id=?`).bind(id).first<any>();
  if (!row) return c.json({ ok:false, error:'not_found' }, 404);
  if (row.status !== 'submitted') return c.json({ ok:false, error:'not_submitted' }, 400);

  // family guard: approver must belong to same family
  const famApprover = await getUserFamilyId(c, approverId);
  if (!famApprover || famApprover !== row.family_id) return c.json({ ok:false, error:'wrong_family' }, 403);

  await c.env.DB.prepare(`UPDATE Chore SET status='approved' WHERE id=?`).bind(id).run();
  await c.env.DB.prepare(`INSERT INTO ChoreEvent (id,chore_id,actor_user_id,type,created_at) VALUES (?,?,?,?,?)`)
    .bind(uid('cev'), id, approverId, 'approved', now).run();

  // credit points if not required
  let pointsAwarded = 0;
  if (row.is_required === 0 && row.kid_user_id) {
    pointsAwarded = row.points;
    await c.env.DB.prepare(`
      INSERT INTO PointsLedger (id,kid_user_id,family_id,delta_points,reason,ref_id,created_at)
      VALUES (?,?,?,?,?,?,?)
    `).bind(uid('plg'), row.kid_user_id, row.family_id, row.points, 'chore_approved', id, now).run();

    await c.env.DB.prepare(`UPDATE KidProfile SET points_balance = points_balance + ? WHERE user_id=?`)
      .bind(row.points, row.kid_user_id).run();
  }

  // Bump stats and check for badge awards
  if (row.kid_user_id) {
    await bumpStatsAndMaybeAward(c, row.kid_user_id, pointsAwarded);
  }

  await audit(c, { action: 'chore.approve', targetId: id, meta: { points: row.points, required: !!row.is_required } });

  return c.json({ ok:true });
});

// --- POST /chores/:id/deny (parent denies chore) ---
app.post('/chores/:id/deny', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const r = requireRole(c, ['parent','helper']); if (r) return r;

  const approverId = c.get('userId'); const id = c.req.param('id'); const now = nowMs();

  const row = await c.env.DB.prepare(`SELECT family_id,status FROM Chore WHERE id=?`).bind(id).first<any>();
  if (!row) return c.json({ ok:false, error:'not_found' }, 404);
  if (row.status !== 'submitted') return c.json({ ok:false, error:'not_submitted' }, 400);

  const famApprover = await getUserFamilyId(c, approverId);
  if (!famApprover || famApprover !== row.family_id) return c.json({ ok:false, error:'wrong_family' }, 403);

  await c.env.DB.prepare(`UPDATE Chore SET status='denied' WHERE id=?`).bind(id).run();
  await c.env.DB.prepare(`INSERT INTO ChoreEvent (id,chore_id,actor_user_id,type,created_at) VALUES (?,?,?,?,?)`)
    .bind(uid('cev'), id, approverId, 'denied', now).run();

  await audit(c, { action: 'chore.deny', targetId: id, meta: {} });

  return c.json({ ok:true });
});

// --- Ledger (parent-scoped or kid sees own) ---
app.get('/ledger', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const userId = c.get('userId');
  const role = c.get('role');
  const actingAsKidId = c.get('actingAsKidId');

  const kid = c.req.query('kid'); // optional
  let kidId: string;

  // If parent is acting as kid, use that kid's ID
  if (actingAsKidId) {
    kidId = actingAsKidId;
  } else if (role === 'kid') {
    kidId = userId;
  } else {
    // parent/helper: ensure the requested kid belongs to my family
    if (!kid) return c.json({ ok:false, error:'kid_required' }, 400);
    const myFam = await getUserFamilyId(c, userId);
    const kidFam = await c.env.DB.prepare(
      `SELECT family_id FROM KidProfile WHERE user_id=?`
    ).bind(kid).first<{ family_id: string }>();
    if (!kidFam || (kidFam as any).family_id !== myFam) return c.json({ ok:false, error:'wrong_family' }, 403);
    kidId = kid;
  }

  const rows = await c.env.DB.prepare(`
    SELECT id, delta_points, reason, ref_id, created_at 
    FROM PointsLedger
    WHERE kid_user_id = ?
    ORDER BY created_at DESC
    LIMIT 200
  `).bind(kidId).all();

  return c.json({ ok:true, ledger: rows.results ?? [] });
});

// --- Kids balances (parent view) ---
app.get('/kids/balances', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const r = requireRole(c, ['parent','helper']); if (r) return r;
  const userId = c.get('userId');
  const familyId = await getUserFamilyId(c, userId);
  if (!familyId) return c.json({ ok:false, error:'family_not_found' }, 400);

  const rows = await c.env.DB.prepare(`
    SELECT K.user_id as kid_user_id, K.display_name, K.points_balance
    FROM KidProfile K
    WHERE K.family_id = ?
    ORDER BY K.display_name
  `).bind(familyId).all();

  return c.json({ ok:true, kids: rows.results ?? [] });
});

// --- Exchange quote (points <-> money) ---
app.post('/exchange/quote', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const userId = c.get('userId');

  const familyId = await getUserFamilyId(c, userId);
  if (!familyId) return c.json({ ok:false, error:'family_not_found' }, 400);

  const ex = await c.env.DB.prepare(`
    SELECT points_per_currency, currency_code, rounding FROM ExchangeRule WHERE family_id=?
  `).bind(familyId).first<{ points_per_currency: number; currency_code: string; rounding: string }>();
  if (!ex) return c.json({ ok:false, error:'exchange_rule_missing' }, 400);

  const body = await c.req.json<{ points?: number; amount_cents?: number }>();
  const { points, amount_cents } = body || {};
  const ppc = (ex as any).points_per_currency as number;

  let result: any = { currency: (ex as any).currency_code };

  if (typeof points === 'number') {
    const dollars = points / ppc; // e.g. 100 pts = $1
    result.amount_cents = Math.floor(dollars * 100);
  } else if (typeof amount_cents === 'number') {
    const dollars = amount_cents / 100;
    result.points = Math.ceil(dollars * ppc);
  } else {
    return c.json({ ok:false, error:'provide points or amount_cents' }, 400);
  }

  return c.json({ ok:true, ...result });
});

// --- GET current rules ---
app.get('/exchange/rules', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const r = requireRole(c, ['parent','helper']); if (r) return r;
  const userId = c.get('userId');
  const familyId = await getUserFamilyId(c, userId);
  const row = await c.env.DB.prepare(
    `SELECT points_per_currency, currency_code, rounding, weekly_allowance_points, required_task_min_pct
     FROM ExchangeRule WHERE family_id=?`
  ).bind(familyId).first();
  return c.json({ ok: true, rules: row || null });
});

// --- PATCH rules ---
app.patch('/exchange/rules', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const r = requireRole(c, ['parent']); if (r) return r;
  const userId = c.get('userId');
  const familyId = await getUserFamilyId(c, userId);
  const body = await c.req.json<{
    points_per_currency?: number;
    currency_code?: string;
    rounding?: 'nearest'|'down'|'up';
    weekly_allowance_points?: number;
    required_task_min_pct?: number;
  }>();
  const now = Date.now();
  const current = await c.env.DB.prepare(
    `SELECT * FROM ExchangeRule WHERE family_id=?`
  ).bind(familyId).first<any>();
  if (!current) return c.json({ ok:false, error:'exchange_rule_missing' }, 400);

  const next = {
    points_per_currency: body.points_per_currency ?? current.points_per_currency,
    currency_code: body.currency_code ?? current.currency_code,
    rounding: body.rounding ?? current.rounding,
    weekly_allowance_points: body.weekly_allowance_points ?? current.weekly_allowance_points,
    required_task_min_pct: body.required_task_min_pct ?? current.required_task_min_pct
  };
  await c.env.DB.prepare(
    `UPDATE ExchangeRule SET points_per_currency=?, currency_code=?, rounding=?, weekly_allowance_points=?, required_task_min_pct=?, updated_at=? WHERE family_id=?`
  ).bind(next.points_per_currency, next.currency_code, next.rounding, next.weekly_allowance_points, next.required_task_min_pct, now, familyId).run();

  await audit(c, { action: 'rules.update', meta: next, familyId });

  return c.json({ ok:true, rules: next });
});

// --- Required-chores unlock eligibility ---
app.get('/eligibility', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const userId = c.get('userId');
  const role = c.get('role');
  const kidId = c.req.query('kid') || (role === 'kid' ? userId : null);
  if (!kidId) return c.json({ ok:false, error:'kid_required' }, 400);

  const myFam = await getUserFamilyId(c, role === 'kid' ? kidId : userId);
  const kidFam = await c.env.DB.prepare(`SELECT family_id FROM KidProfile WHERE user_id=?`).bind(kidId).first<any>();
  if (!kidFam || kidFam.family_id !== myFam) return c.json({ ok:false, error:'wrong_family' }, 403);

  const ex = await c.env.DB.prepare(
    `SELECT required_task_min_pct FROM ExchangeRule WHERE family_id=?`
  ).bind(myFam).first<{ required_task_min_pct: number }>();
  const minPct = (ex as any)?.required_task_min_pct ?? 0;

  const since = Date.now() - 7*24*60*60*1000;

  // Count approved chores using approval event time (more accurate)
  const rows = await c.env.DB.prepare(
    `SELECT C.is_required, COUNT(*) AS n
     FROM Chore C
     JOIN ChoreEvent E ON E.chore_id = C.id AND E.type='approved'
     WHERE C.kid_user_id=? AND E.created_at >= ?
     GROUP BY C.is_required`
  ).bind(kidId, since).all<{ is_required: number, n: number }>();
  let req = 0, total = 0;
  for (const r of (rows.results ?? [])) {
    total += r.n; if (r.is_required === 1) req += r.n;
  }
  const pct = total ? Math.round((req / total) * 100) : 0;
  const eligible = pct >= minPct;

  // Also surface outstanding required chores (open/claimed/submitted) for nudges
  const outstanding = await c.env.DB.prepare(
    `SELECT id,title,status FROM Chore
     WHERE kid_user_id=? AND is_required=1 AND status IN ('open','claimed','submitted')
     ORDER BY created_at DESC LIMIT 20`
  ).bind(kidId).all();

  return c.json({ ok:true, eligible, ratio: { required:req, total, pct }, min_required_pct: minPct, outstanding: outstanding.results ?? [] });
});

// --- Create goal ---
app.post('/goals', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const userId = c.get('userId'); 
  const role = c.get('role');
  const actingAsKidId = c.get('actingAsKidId');
  const body = await c.req.json<{ kid_user_id?: string; title: string; target_amount_cents: number }>();
  
  // If parent is acting as kid, use that kid's ID
  const kidId = actingAsKidId || (role === 'kid' ? userId : body.kid_user_id);
  if (!kidId) return c.json({ ok:false, error:'kid_required' }, 400);

  // same-family guard for parent (unless acting as kid)
  if (!actingAsKidId && role !== 'kid') {
    const myFam = await getUserFamilyId(c, userId);
    const kidFam = await c.env.DB.prepare(`SELECT family_id FROM KidProfile WHERE user_id=?`).bind(kidId).first<any>();
    if (!kidFam || kidFam.family_id !== myFam) return c.json({ ok:false, error:'wrong_family' }, 403);
  }

  const familyId = await getUserFamilyId(c, kidId);
  
  // Check paywall: Goals are premium-only
  const limits = await getSubscriptionLimits(c, familyId);
  if (!limits.hasGoals) {
    return c.json({ 
      ok: false, 
      error: 'premium_required',
      message: 'Goals are a Premium feature. Upgrade to Premium to create savings goals.',
      upgradeRequired: true
    }, 403);
  }
  const ex = await c.env.DB.prepare(`SELECT points_per_currency,currency_code FROM ExchangeRule WHERE family_id=?`).bind(familyId).first<any>();
  if (!ex) return c.json({ ok:false, error:'exchange_rule_missing' }, 400);

  const ppc = ex.points_per_currency as number;
  const target_points = Math.ceil((body.target_amount_cents/100) * ppc);
  const goalId = uid('gol'); const now = Date.now();

  await c.env.DB.prepare(`
    INSERT INTO Goal (id,kid_user_id,family_id,title,target_amount_cents,currency_code,target_points,status,created_at)
    VALUES (?,?,?,?,?,?,?,'active',?)
  `).bind(goalId, kidId, familyId, body.title, body.target_amount_cents, ex.currency_code, target_points, now).run();

  return c.json({ ok:true, goal_id: goalId, target_points });
});

// --- Cancel goal ---
app.post('/goals/:id/cancel', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const userId = c.get('userId'); const role = c.get('role');
  const id = c.req.param('id');

  const row = await c.env.DB.prepare(`SELECT kid_user_id,family_id,status FROM Goal WHERE id=?`).bind(id).first<any>();
  if (!row || row.status !== 'active') return c.json({ ok:false, error:'not_found_or_inactive' }, 404);

  // permission
  if (role === 'kid' && row.kid_user_id !== userId) return c.json({ ok:false, error:'forbidden' }, 403);
  if (role !== 'kid') {
    const myFam = await getUserFamilyId(c, userId);
    if (myFam !== row.family_id) return c.json({ ok:false, error:'wrong_family' }, 403);
  }
  await c.env.DB.prepare(`UPDATE Goal SET status='cancelled' WHERE id=?`).bind(id).run();
  return c.json({ ok:true });
});

// --- List goals + ETA ---
app.get('/goals', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const userId = c.get('userId'); 
  const role = c.get('role');
  const actingAsKidId = c.get('actingAsKidId');
  
  // If parent is acting as kid, use that kid's ID
  const kid = actingAsKidId || c.req.query('kid') || (role === 'kid' ? userId : null);
  if (!kid) return c.json({ ok:false, error:'kid_required' }, 400);

  // family guard (skip if acting as kid - already verified in middleware)
  if (!actingAsKidId) {
  const myFam = await getUserFamilyId(c, role === 'kid' ? kid : userId);
  const kidFam = await c.env.DB.prepare(`SELECT family_id, points_balance FROM KidProfile WHERE user_id=?`).bind(kid).first<any>();
  if (!kidFam || kidFam.family_id !== myFam) return c.json({ ok:false, error:'wrong_family' }, 403);
  }

  const goals = await c.env.DB.prepare(`
    SELECT id,title,target_amount_cents,currency_code,target_points,status,created_at,achieved_at
    FROM Goal WHERE kid_user_id=? ORDER BY created_at DESC
  `).bind(kid).all<any>();

  // avg pts/day from last 14 days
  const since = Date.now() - 14*24*60*60*1000;
  const pts = await c.env.DB.prepare(`
    SELECT SUM(delta_points) AS sum FROM PointsLedger
    WHERE kid_user_id=? AND delta_points > 0 AND created_at >= ?
  `).bind(kid, since).first<any>();
  const earned = pts?.sum || 0;
  const avgPerDay = Math.max(1, Math.round(earned / 14)); // avoid /0

  // add computed fields
  const out = (goals.results ?? []).map(g => {
    const remaining = Math.max(0, g.target_points - kidFam.points_balance);
    const etaDays = g.status === 'active' ? Math.ceil(remaining / avgPerDay) : null;
    return { ...g, current_points: kidFam.points_balance, remaining_points: remaining, eta_days: etaDays, avg_pts_per_day: avgPerDay };
  });

  return c.json({ ok:true, goals: out });
});

// --- Create request (kid) ---
app.post('/requests', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const role = c.get('role'); const userId = c.get('userId');
  if (role !== 'kid') return c.json({ ok:false, error:'for_kid_only' }, 403);

  const body = await c.req.json<{ title: string; description?: string; suggested_points?: number }>();
  const familyId = await getUserFamilyId(c, userId);
  const now = Date.now();
  const id = uid('req');

  await c.env.DB.prepare(`
    INSERT INTO TaskRequest (id,family_id,kid_user_id,title,description,suggested_points,status,created_at)
    VALUES (?,?,?,?,?,?,'pending',?)
  `).bind(id, familyId, userId, body.title, body.description ?? null, body.suggested_points ?? null, now).run();

  return c.json({ ok:true, request_id: id });
});

// --- List requests (parent scope) or kid sees own ---
app.get('/requests', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const role = c.get('role'); const userId = c.get('userId');
  const status = c.req.query('status'); // optional
  let q = `SELECT id,kid_user_id,title,description,suggested_points,status,created_at,decided_at,decided_by FROM TaskRequest `;
  const where: string[] = []; const args: any[] = [];

  if (role === 'kid') {
    where.push(`kid_user_id = ?`); args.push(userId);
  } else {
    const fam = await getUserFamilyId(c, userId);
    where.push(`family_id = ?`); args.push(fam);
  }
  if (status) { where.push(`status = ?`); args.push(status); }
  if (where.length) q += `WHERE ` + where.join(' AND ');
  q += ` ORDER BY created_at DESC LIMIT 200`;

  const rows = await c.env.DB.prepare(q).bind(...args).all();
  return c.json({ ok:true, requests: rows.results ?? [] });
});

// --- Approve/Deny requests (parent/helper) ---
app.post('/requests/:id/approve', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const r = requireRole(c, ['parent','helper']); if (r) return r;
  const id = c.req.param('id'); const uid = c.get('userId'); const now = Date.now();

  const row = await c.env.DB.prepare(`SELECT family_id,status FROM TaskRequest WHERE id=?`).bind(id).first<any>();
  if (!row || row.status !== 'pending') return c.json({ ok:false, error:'not_found_or_not_pending' }, 404);

  const fam = await getUserFamilyId(c, uid);
  if (fam !== row.family_id) return c.json({ ok:false, error:'wrong_family' }, 403);

  await c.env.DB.prepare(`UPDATE TaskRequest SET status='approved', decided_at=?, decided_by=? WHERE id=?`).bind(now, uid, id).run();
  return c.json({ ok:true });
});

app.post('/requests/:id/deny', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const r = requireRole(c, ['parent','helper']); if (r) return r;
  const id = c.req.param('id'); const uid = c.get('userId'); const now = Date.now();

  const row = await c.env.DB.prepare(`SELECT family_id,status FROM TaskRequest WHERE id=?`).bind(id).first<any>();
  if (!row || row.status !== 'pending') return c.json({ ok:false, error:'not_found_or_not_pending' }, 404);

  const fam = await getUserFamilyId(c, uid);
  if (fam !== row.family_id) return c.json({ ok:false, error:'wrong_family' }, 403);

  await c.env.DB.prepare(`UPDATE TaskRequest SET status='denied', decided_at=?, decided_by=? WHERE id=?`).bind(now, uid, id).run();
  return c.json({ ok:true });
});

// --- Trusted Relatives Invites ---

// Create invite (parent)
app.post('/trusted/invites', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const r = requireRole(c, ['parent']); if (r) return r;
  const userId = c.get('userId');
  const body = await c.req.json<{ scope: string; email?: string; ttl_hours?: number }>();
  const familyId = await getUserFamilyId(c, userId);
  
  const id = uid('tiv');
  const token = uid('ivt');
  const now = Date.now();
  const expires = now + ((body.ttl_hours ?? 168) * 3600 * 1000); // default 7 days

  await c.env.DB.prepare(`
    INSERT INTO TrustedInvite (id,family_id,scope,token,email,expires_at,created_at)
    VALUES (?,?,?,?,?,?,?)
  `).bind(id, familyId, body.scope, token, body.email ?? null, expires, now).run();

  await audit(c, { action: 'trusted.invite.create', targetId: id, meta: { scope: body.scope }, familyId });

  return c.json({ ok:true, invite: { token, scope: body.scope, expires_at: expires } });
});

// Register helper via invite (new account)
app.post('/auth/register-helper', async (c) => {
  const body = await c.req.json<{ token: string; email: string; password: string; first_name?: string }>();
  
  const inv = await c.env.DB.prepare(`SELECT * FROM TrustedInvite WHERE token=?`).bind(body.token).first<any>();
  if (!inv || inv.expires_at < Date.now() || inv.accepted_by) {
    return c.json({ ok:false, error:'invalid_or_expired' }, 400);
  }

  // Create helper user
  const userId = uid('usr');
  const now = Date.now();
  const pwd = await hashPassword(body.password);
  
  await c.env.DB.prepare(`
    INSERT INTO User (id,email,password_hash,first_name,last_name,role,created_at)
    VALUES (?,?,?,?,?,'helper',?)
  `).bind(userId, body.email, pwd, body.first_name ?? null, null, now).run();

  // Link permission
  const linkId = uid('tlk');
  await c.env.DB.prepare(`
    INSERT INTO TrustedLink (id,granting_family_id,trusted_user_id,scope,created_at)
    VALUES (?,?,?,?,?)
  `).bind(linkId, inv.family_id, userId, inv.scope, now).run();

  await c.env.DB.prepare(`UPDATE TrustedInvite SET accepted_by=? WHERE id=?`).bind(userId, inv.id).run();

  // Create session cookie
  const token = uid('tok');
  await c.env.SESSION_KV.put(
    `sess:${token}`,
    JSON.stringify({ userId, role:'helper', exp: Date.now() + 7*864e5 }),
    { expirationTtl: 7*86400 }
  );
  c.header('Set-Cookie', cookieSerialize('cc_sess', encodeURIComponent(token), {
    httpOnly:true, secure:true, sameSite:'None', path:'/', maxAge:7*86400
  }));

  return c.json({ ok:true, role:'helper' });
});

// Accept invite with existing account (login first)
app.post('/trusted/accept', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const userId = c.get('userId');
  const role = c.get('role');
  
  if (!['parent','helper','kid'].includes(role)) {
    return c.json({ ok:false, error:'forbidden' }, 403);
  }

  const body = await c.req.json<{ token: string }>();
  const inv = await c.env.DB.prepare(`SELECT * FROM TrustedInvite WHERE token=?`).bind(body.token).first<any>();
  
  if (!inv || inv.expires_at < Date.now() || inv.accepted_by) {
    return c.json({ ok:false, error:'invalid_or_expired' }, 400);
  }

  const linkId = uid('tlk');
  const now = Date.now();
  
  await c.env.DB.prepare(`
    INSERT INTO TrustedLink (id,granting_family_id,trusted_user_id,scope,created_at)
    VALUES (?,?,?,?,?)
  `).bind(linkId, inv.family_id, userId, inv.scope, now).run();
  
  await c.env.DB.prepare(`UPDATE TrustedInvite SET accepted_by=? WHERE id=?`).bind(userId, inv.id).run();

  return c.json({ ok:true });
});

// --- SVG Reward Chart Generator ---
function svgChart(opts: { kid: string; displayName: string; weekRequired: number; weekPaid: number; balance: number; currency: string }) {
  const total = opts.weekRequired + opts.weekPaid || 1;
  const reqPct = Math.round((opts.weekRequired/total)*100);
  const paidPct = 100 - reqPct;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="900" height="600" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: 700 32px system-ui, -apple-system, Segoe UI, Roboto; }
    .sub   { font: 500 18px system-ui, -apple-system, Segoe UI, Roboto; }
    .num   { font: 700 20px system-ui, -apple-system, Segoe UI, Roboto; }
  </style>
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="40" y="70" class="title">EarningsJr — Weekly Reward Chart</text>
  <text x="40" y="110" class="sub">Kid: ${opts.displayName}</text>
  <text x="40" y="140" class="sub">Balance: ${opts.balance} pts (~ ${opts.currency})</text>

  <text x="40" y="200" class="sub">This week</text>
  <rect x="40" y="220" width="${reqPct*7}" height="32" fill="#0ea5e9"/>
  <rect x="${40+reqPct*7}" y="220" width="${paidPct*7}" height="32" fill="#22c55e"/>
  <text x="40" y="270" class="num">Required: ${opts.weekRequired} (${reqPct}%)</text>
  <text x="260" y="270" class="num">Paid: ${opts.weekPaid} (${paidPct}%)</text>

  <text x="40" y="330" class="sub">Sign-offs</text>
  <circle cx="60" cy="365" r="8" fill="#0ea5e9"/><text x="80" y="370" class="sub">Required</text>
  <circle cx="220" cy="365" r="8" fill="#22c55e"/><text x="240" y="370" class="sub">Paid</text>

  <text x="40" y="440" class="sub">Parents: You can print and stick this on the fridge!</text>
  <text x="40" y="470" class="sub" fill="#64748b">Generated by EarningsJr</text>
</svg>`;
}

// Generate & upload SVG, return a proxied URL
app.post('/charts/reward', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const role = c.get('role'); const userId = c.get('userId');
  const kid = c.req.query('kid') || (role === 'kid' ? userId : null);
  if (!kid) return c.json({ ok:false, error:'kid_required' }, 400);

  // family guard
  const myFam = await getUserFamilyId(c, role === 'kid' ? kid : userId);
  const kidRow = await c.env.DB.prepare(`SELECT display_name, points_balance, family_id FROM KidProfile WHERE user_id=?`).bind(kid).first<any>();
  if (!kidRow || kidRow.family_id !== myFam) return c.json({ ok:false, error:'wrong_family' }, 403);

  // count approved required/paid in last 7d
  const since = Date.now() - 7*24*60*60*1000;
  const rows = await c.env.DB.prepare(`
    SELECT is_required, COUNT(*) AS n FROM Chore
    WHERE kid_user_id=? AND status='approved' AND created_at >= ?
    GROUP BY is_required
  `).bind(kid, since).all<any>();
  let req=0, paid=0;
  for (const r of (rows.results ?? [])) (r.is_required===1 ? (req+=r.n) : (paid+=r.n));

  const ex = await c.env.DB.prepare(`SELECT currency_code FROM ExchangeRule WHERE family_id=?`).bind(myFam).first<any>();

  const svg = svgChart({
    kid, displayName: kidRow.display_name,
    weekRequired: req, weekPaid: paid,
    balance: kidRow.points_balance,
    currency: ex?.currency_code ?? 'USD'
  });

  const key = `charts/${kid}/${Date.now()}.svg`;
  await c.env.ASSETS.put(key, svg, { httpMetadata: { contentType: 'image/svg+xml' } });

  // Proxy URL from Worker so R2 needn't be public
  return c.json({ ok:true, url: `/charts/${encodeURIComponent(key)}` });
});

// Serve a chart from R2 (public proxy)
app.get('/charts/:key{.+}', async (c) => {
  const key = decodeURIComponent(c.req.param('key'));
  const obj = await c.env.ASSETS.get(key);
  if (!obj) return c.text('Not found', 404);
  return new Response(obj.body, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control':'public, max-age=3600' }});
});

// --- Payout System ---

// Helper: convert points → money
async function pointsToMoney(c: any, familyId: string, pts: number) {
  const ex = await c.env.DB.prepare(`SELECT points_per_currency,currency_code FROM ExchangeRule WHERE family_id=?`)
    .bind(familyId).first<any>();
  const rate = ex?.points_per_currency ?? 100;
  return { cents: Math.round((pts / rate) * 100), currency: ex?.currency_code ?? 'USD' };
}

// Helper: convert money → points
async function moneyToPoints(c: any, familyId: string, cents: number) {
  const ex = await c.env.DB.prepare(`SELECT points_per_currency FROM ExchangeRule WHERE family_id=?`)
    .bind(familyId).first<any>();
  const rate = ex?.points_per_currency ?? 100;
  return Math.round((cents / 100) * rate);
}

// Create payout request
app.post('/payouts', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const role = c.get('role');
  const userId = c.get('userId');
  const body = await c.req.json<{ kid_user_id?: string; points?: number; amount_cents?: number }>();
  
  const kidId = role === 'kid' ? userId : body.kid_user_id;
  if (!kidId) return err(c, 400, 'missing_kid', 'Kid user ID required');
  
  const familyId = await getUserFamilyId(c, kidId);
  if (!familyId) return err(c, 400, 'family_not_found', 'Family not found');
  
  const pts = body.points ?? await moneyToPoints(c, familyId, body.amount_cents ?? 0);
  const { cents, currency } = await pointsToMoney(c, familyId, pts);
  const now = Date.now();
  const id = uid('pay');
  
  await c.env.DB.prepare(
    `INSERT INTO Payout (id,family_id,kid_user_id,points,amount_cents,currency,status,created_at)
     VALUES (?,?,?,?,?,?,?,?)`
  ).bind(id, familyId, kidId, pts, cents, currency, 'requested', now).run();
  
  await audit(c, { action:'payout.request', targetId:id, familyId, meta:{kidId,pts,cents,currency} });
  
  return ok(c, {id, status:'requested', points:pts, amount_cents:cents});
});

// Approve payout
app.post('/payouts/:id/approve', async (c) => {
  const a = await requireAdmin(c); if (a) return a;
  const id = c.req.param('id');
  const now = Date.now();
  const userId = c.get('userId');
  
  const row = await c.env.DB.prepare(`SELECT * FROM Payout WHERE id=?`).bind(id).first<any>();
  if (!row || row.status !== 'requested') return err(c, 400, 'invalid_status', 'Payout not in requested state');
  
  await c.env.DB.prepare(`UPDATE Payout SET status='approved',decided_at=?,decided_by=? WHERE id=?`)
    .bind(now, userId, id).run();
  
  await audit(c, {action:'payout.approve', targetId:id, meta:{points:row.points, amount_cents:row.amount_cents}});
  
  return ok(c, {id, status:'approved'});
});

// Reject payout
app.post('/payouts/:id/reject', async (c) => {
  const a = await requireAdmin(c); if (a) return a;
  const id = c.req.param('id');
  const now = Date.now();
  const userId = c.get('userId');
  
  const row = await c.env.DB.prepare(`SELECT * FROM Payout WHERE id=?`).bind(id).first<any>();
  if (!row || row.status !== 'requested') return err(c, 400, 'invalid_status', 'Payout not in requested state');
  
  await c.env.DB.prepare(`UPDATE Payout SET status='rejected',decided_at=?,decided_by=? WHERE id=?`)
    .bind(now, userId, id).run();
  
  await audit(c, {action:'payout.reject', targetId:id, meta:{points:row.points, amount_cents:row.amount_cents}});
  
  return ok(c, {id, status:'rejected'});
});

// List payouts
app.get('/payouts', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const role = c.get('role');
  const userId = c.get('userId');
  
  const familyId = await getUserFamilyId(c, userId);
  const where = role === 'kid' ? 'kid_user_id=?' : 'family_id=?';
  const val = role === 'kid' ? userId : familyId;
  
  const rows = await c.env.DB.prepare(
    `SELECT * FROM Payout WHERE ${where} ORDER BY created_at DESC`
  ).bind(val).all<any>();
  
  return ok(c, {payouts: rows.results});
});

// Export payouts to CSV
app.get('/payouts/export.csv', async (c) => {
  const a = await requireAdmin(c); if (a) return a;
  
  const rows = await c.env.DB.prepare(
    `SELECT * FROM Payout ORDER BY created_at DESC`
  ).all<any>();
  
  const header = 'id,family_id,kid_user_id,points,amount_cents,currency,status,created_at,decided_at\n';
  const csv = header + (rows.results ?? []).map((r: any) =>
    [r.id, r.family_id, r.kid_user_id, r.points, r.amount_cents, r.currency, r.status, r.created_at, r.decided_at || ''].join(',')
  ).join('\n');
  
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="payouts.csv"'
    }
  });
});

// --- Feature Flags ---

// List all flags
app.get('/admin/flags', async (c) => {
  const a = await requireAdmin(c); if (a) return a;
  const rows = await c.env.DB.prepare(`SELECT * FROM FeatureFlag ORDER BY key`).all<any>();
  return ok(c, {flags: rows.results});
});

// Upsert flag
app.post('/admin/flags', async (c) => {
  const a = await requireAdmin(c); if (a) return a;
  const body = await c.req.json<{key: string; enabled: boolean; description?: string}>();
  const now = Date.now();
  
  await c.env.DB.prepare(`
    INSERT INTO FeatureFlag (key,enabled,description,updated_at)
    VALUES (?,?,?,?)
    ON CONFLICT(key) DO UPDATE SET 
      enabled=excluded.enabled,
      description=excluded.description,
      updated_at=excluded.updated_at
  `).bind(body.key, body.enabled ? 1 : 0, body.description ?? null, now).run();
  
  await audit(c, {action:'flag.update', meta: body});
  
  return ok(c, {key: body.key, enabled: body.enabled});
});

// --- Daily Reminders ---

// GET /reminders/prefs (parent/helper: list family prefs)
app.get('/reminders/prefs', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const r = requireRole(c, ['parent','helper']); if (r) return r;
  const fam = await getUserFamilyId(c, c.get('userId'));
  const rows = await c.env.DB.prepare(`
    SELECT RP.*, K.display_name
    FROM ReminderPref RP JOIN KidProfile K ON K.user_id = RP.kid_user_id
    WHERE RP.family_id=?
    ORDER BY K.display_name
  `).bind(fam).all();
  return c.json({ ok:true, prefs: rows.results ?? [] });
});

// PATCH /reminders/prefs (parent only: upsert for a kid)
app.patch('/reminders/prefs', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const r = requireRole(c, ['parent']); if (r) return r;
  const { kid_user_id, enabled, hour_local, minute_local, days_mask, timezone, channel } =
    await c.req.json<{
      kid_user_id: string; enabled?: boolean; hour_local?: number; minute_local?: number;
      days_mask?: number; timezone?: string; channel?: 'inapp'|'email'|'push';
    }>();
  if (!kid_user_id) return c.json({ ok:false, error:'kid_required' }, 400);

  const fam = await getUserFamilyId(c, c.get('userId'));
  const kidFam = await c.env.DB.prepare(`SELECT family_id FROM KidProfile WHERE user_id=?`).bind(kid_user_id).first<any>();
  if (!kidFam || kidFam.family_id !== fam) return c.json({ ok:false, error:'wrong_family' }, 403);

  const now = Date.now();
  await c.env.DB.prepare(`
    INSERT INTO ReminderPref (id,family_id,kid_user_id,enabled,hour_local,minute_local,days_mask,timezone,channel,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(kid_user_id) DO UPDATE SET
      enabled=COALESCE(?,enabled),
      hour_local=COALESCE(?,hour_local),
      minute_local=COALESCE(?,minute_local),
      days_mask=COALESCE(?,days_mask),
      timezone=COALESCE(?,timezone),
      channel=COALESCE(?,channel),
      updated_at=?
  `).bind(
    uid('rpf'), fam, kid_user_id, enabled?1:0,
    hour_local ?? 19, minute_local ?? 0, days_mask ?? 127,
    timezone ?? 'America/New_York', channel ?? 'inapp', now,
    enabled==null?null:(enabled?1:0), hour_local ?? null, minute_local ?? null,
    days_mask ?? null, timezone ?? null, channel ?? null, now
  ).run();

  await audit(c, { action:'reminder.pref.update', meta: { kid_user_id, enabled, hour_local, minute_local, days_mask, timezone, channel } });
  return c.json({ ok:true });
});

// GET /reminders (parent/helper: family; kid: own)
app.get('/reminders', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const role = c.get('role'); const userId = c.get('userId');

  let where = ''; let arg: any[] = [];
  if (role === 'kid') { 
    where = 'WHERE R.kid_user_id=?'; 
    arg = [userId]; 
  } else {
    // Parent/helper: need family_id
    const fam = await getUserFamilyId(c, userId);
    if (!fam) {
      return c.json({ ok: false, error: 'family_not_found' }, 400);
    }
    where = 'WHERE R.family_id=?'; 
    arg = [fam]; 
  }

  try {
  const rows = await c.env.DB.prepare(`
    SELECT R.*, K.display_name
    FROM ReminderEvent R JOIN KidProfile K ON K.user_id=R.kid_user_id
    ${where}
      ORDER BY R.created_at DESC LIMIT 200
  `).bind(...arg).all();
  return c.json({ ok:true, reminders: rows.results ?? [] });
  } catch (error: any) {
    console.error('Reminders query error:', error);
    return c.json({ ok: false, error: 'database_error', message: error?.message || 'Failed to fetch reminders' }, 500);
  }
});

// POST /reminders/:id/ack (parent/helper to mark handled)
app.post('/reminders/:id/ack', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const role = c.get('role'); const userId = c.get('userId');
  const id = c.req.param('id');

  const fam = await getUserFamilyId(c, userId);
  const row = await c.env.DB.prepare(`SELECT family_id FROM ReminderEvent WHERE id=?`).bind(id).first<any>();
  if (!row || row.family_id !== fam) return c.json({ ok:false, error:'not_found' }, 404);

  const now = Date.now();
  await c.env.DB.prepare(`UPDATE ReminderEvent SET status='acked', acked_at=? WHERE id=? AND status!='acked'`)
    .bind(now, id).run();
  await audit(c, { action:'reminder.ack', targetId:id });
  return c.json({ ok:true });
});

// --- Achievements & Badges ---

// Kid (or parent-scoped) view of badges and stats
app.get('/achievements', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const role = c.get('role'); const userId = c.get('userId');
  const actingAsKidId = c.get('actingAsKidId');
  
  // If parent is acting as kid, use that kid's ID
  const kidId = actingAsKidId || c.req.query('kid') || (role === 'kid' ? userId : null);
  if (!kidId) return c.json({ ok:false, error:'kid_required' }, 400);

  // family guard (skip if acting as kid - already verified in middleware)
  if (!actingAsKidId) {
    const famUser = role === 'kid' ? kidId : userId;
    const fam = await getUserFamilyId(c, famUser);
    const kidFam = await c.env.DB.prepare(`SELECT family_id FROM KidProfile WHERE user_id=?`).bind(kidId).first<any>();
    if (!kidFam || kidFam.family_id !== fam) return c.json({ ok:false, error:'wrong_family' }, 403);
  }
  
  // Get family ID for subscription check
  const fam = actingAsKidId 
    ? (await c.env.DB.prepare(`SELECT family_id FROM KidProfile WHERE user_id=?`).bind(kidId).first<any>())?.family_id
    : await getUserFamilyId(c, role === 'kid' ? kidId : userId);
  
  if (!fam) return c.json({ ok:false, error:'family_not_found' }, 400);

  // Check paywall: Achievements are premium-only
  const limits = await getSubscriptionLimits(c, fam);
  if (!limits.hasAchievements) {
    return c.json({ 
      ok: false, 
      error: 'premium_required',
      message: 'Achievements are a Premium feature. Upgrade to Premium to view badges and stats.',
      upgradeRequired: true
    }, 403);
  }

  const stats = await c.env.DB.prepare(`SELECT * FROM KidStats WHERE kid_user_id=?`).bind(kidId).first<any>();
  const awards = await c.env.DB.prepare(`
    SELECT A.key, A.title, A.description, A.icon, B.awarded_at, B.meta_json
    FROM Achievement A
    LEFT JOIN BadgeAward B ON B.achievement_key=A.key AND B.kid_user_id=?
    ORDER BY A.key
  `).bind(kidId).all<any>();

  return c.json({ ok:true, stats: stats ?? { total_approved:0,total_points_earned:0,streak_days:0 }, badges: awards.results ?? [] });
});

// --- Admin API: Audit Log & Metrics ---

// List audit logs (paginated)
app.get('/admin/audit', async (c) => {
  const a = await requireAdmin(c); if (a) return a;
  const limit = Math.min(parseInt(c.req.query('limit') ?? '50', 10), 200);
  const after = parseInt(c.req.query('after') ?? '0', 10);
  const where = after ? `WHERE ts < ?` : '';
  
  const res = await c.env.DB.prepare(
    `SELECT id,ts,user_id,family_id,action,target_id,meta_json,ip,ua
     FROM AuditLog ${where}
     ORDER BY ts DESC LIMIT ?`
  ).bind(...(after ? [after, limit] : [limit])).all();
  
  return c.json({ ok: true, rows: res.results ?? [] });
});

// Quick metrics snapshot
app.get('/admin/metrics', async (c) => {
  const a = await requireAdmin(c); if (a) return a;
  const now = Date.now();
  const day = now - 86400_000;
  const week = now - 7 * 86400_000;

  const [parents, kids, choresW, approvalsD] = await Promise.all([
    c.env.DB.prepare(`SELECT COUNT(*) as n FROM User WHERE role='parent'`).first<{ n: number }>(),
    c.env.DB.prepare(`SELECT COUNT(*) as n FROM User WHERE role='kid'`).first<{ n: number }>(),
    c.env.DB.prepare(`SELECT COUNT(*) as n FROM Chore WHERE created_at >= ?`).bind(week).first<{ n: number }>(),
    c.env.DB.prepare(`SELECT COUNT(*) as n FROM ChoreEvent WHERE type='approved' AND created_at >= ?`).bind(day).first<{ n: number }>()
  ]);

  return c.json({
    ok: true,
    stats: {
      parents: (parents as any)?.n ?? 0,
      kids: (kids as any)?.n ?? 0,
      chores_created_last7d: (choresW as any)?.n ?? 0,
      approvals_last24h: (approvalsD as any)?.n ?? 0
    }
  });
});

async function emitDueReminders(env: Bindings) {
  // Fetch all enabled prefs
  const prefs = await env.DB.prepare(`
    SELECT id,family_id,kid_user_id,enabled,hour_local,minute_local,days_mask,timezone
    FROM ReminderPref WHERE enabled=1
  `).all<any>();

  for (const p of (prefs.results ?? [])) {
    const { hour, minute, jsDay } = localNowInTz(p.timezone);
    // Only fire on exact minute to avoid duplicates (cron is every 15m)
    if (hour !== p.hour_local || minute !== p.minute_local) continue;
    if (!dayMaskIncludes(p.days_mask, jsDay)) continue;

    // Count outstanding REQUIRED chores (open/claimed/submitted)
    const open = await env.DB.prepare(`
      SELECT COUNT(*) as n FROM Chore
      WHERE kid_user_id=? AND is_required=1 AND status IN ('open','claimed','submitted')
    `).bind(p.kid_user_id).first<any>();
    const due = (open as any)?.n ?? 0;
    if (due <= 0) continue;

    const kid = await env.DB.prepare(`SELECT display_name FROM KidProfile WHERE user_id=?`).bind(p.kid_user_id).first<any>();
    const msg = `${kid?.display_name || 'Your kid'} has ${due} required chore${due>1?'s':''} waiting`;

    const id = uid('rem');
    const now = Date.now();
    await env.DB.prepare(`
      INSERT INTO ReminderEvent (id,family_id,kid_user_id,type,message,due_required_count,created_at,status)
      VALUES (?,?,?,?,?,?,?,'new')
    `).bind(id, p.family_id, p.kid_user_id, 'daily_required', msg, due, now).run();
  }
}

// --- Stripe Integration ---

// Create checkout session
app.post('/stripe/create-checkout', async (c) => {
  const a = requireAuth(c);
  if (a) return a;
  
  const userId = c.get('userId');
  const body = await c.req.json<{ priceId: string }>();
  
  if (!c.env.STRIPE_SECRET_KEY) {
    return err(c, 500, 'stripe_not_configured', 'Stripe is not configured');
  }
  
  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' });
  
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{
        price: body.priceId,
        quantity: 1,
      }],
      customer_email: (await c.env.DB.prepare('SELECT email FROM User WHERE id=?').bind(userId).first<{ email: string }>())?.email,
      success_url: `${c.req.header('Origin') || 'https://earningsjr.pages.dev'}/dashboard?success=true`,
      cancel_url: `${c.req.header('Origin') || 'https://earningsjr.pages.dev'}/pricing`,
      metadata: {
        userId,
      },
    });
    
    return ok(c, { url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return err(c, 500, 'stripe_error', error.message || 'Failed to create checkout session');
  }
});

// Get subscription status
app.get('/stripe/subscription', async (c) => {
  const a = requireAuth(c);
  if (a) return a;
  
  const userId = c.get('userId');
  // TODO: Store Stripe customer ID in User table
  // For now, return mock data
  return ok(c, { 
    hasSubscription: false,
    plan: null,
    status: 'free_trial',
    trialEndsAt: null,
  });
});

// Stripe webhook handler
app.post('/stripe/webhook', async (c) => {
  const signature = c.req.header('stripe-signature');
  if (!signature || !c.env.STRIPE_WEBHOOK_SECRET) {
    return err(c, 400, 'missing_signature', 'Webhook signature required');
  }
  
  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' });
  const body = await c.req.text();
  
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, c.env.STRIPE_WEBHOOK_SECRET);
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error);
    return err(c, 400, 'invalid_signature', 'Invalid signature');
  }
  
  // Handle subscription events
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    if (userId) {
      const familyId = await getUserFamilyId(c, userId);
      if (familyId) {
        // Get subscription from Stripe
        const subscriptionId = session.subscription as string;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const customerId = subscription.customer as string;
          const plan = subscription.items.data[0]?.price?.id || null;
          const status = subscription.status === 'active' ? 'active' : 
                        subscription.status === 'trialing' ? 'trialing' :
                        subscription.status === 'past_due' ? 'past_due' :
                        subscription.status === 'canceled' ? 'canceled' :
                        subscription.status === 'unpaid' ? 'unpaid' : 'free';
          
          await c.env.DB.prepare(`
            UPDATE Family 
            SET stripe_customer_id=?, stripe_subscription_id=?, subscription_status=?, subscription_plan=?,
                subscription_current_period_end=?, subscription_trial_end=?
            WHERE id=?
          `).bind(
            customerId,
            subscriptionId,
            status,
            plan,
            subscription.current_period_end * 1000, // Convert to milliseconds
            subscription.trial_end ? subscription.trial_end * 1000 : null,
            familyId
          ).run();
        }
      }
      await audit(c, { action: 'subscription.created', targetId: userId, meta: { sessionId: session.id } });
    }
  }
  
  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;
    
    // Find family by customer ID
    const fam = await c.env.DB.prepare(
      `SELECT id FROM Family WHERE stripe_customer_id=?`
    ).bind(customerId).first<{ id: string }>();
    
    if (fam) {
      const status = subscription.status === 'active' ? 'active' : 
                    subscription.status === 'trialing' ? 'trialing' :
                    subscription.status === 'past_due' ? 'past_due' :
                    subscription.status === 'canceled' ? 'canceled' :
                    subscription.status === 'unpaid' ? 'unpaid' : 'free';
      const plan = subscription.items.data[0]?.price?.id || null;
      
      await c.env.DB.prepare(`
        UPDATE Family 
        SET subscription_status=?, subscription_plan=?,
            subscription_current_period_end=?, subscription_trial_end=?
        WHERE id=?
      `).bind(
        status,
        plan,
        subscription.current_period_end * 1000,
        subscription.trial_end ? subscription.trial_end * 1000 : null,
        fam.id
      ).run();
    }
    
    await audit(c, { action: 'subscription.updated', meta: { subscriptionId: subscription.id, status: subscription.status } });
  }
  
  return ok(c, { received: true });
});

export default {
  fetch: async (request: Request, env: Bindings, ctx: ExecutionContext) => {
    // Initialize Sentry if DSN is provided (only once per Worker instance)
    if (env.SENTRY_DSN && !(globalThis as any).__SENTRY_INIT__) {
      Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: 'production',
        tracesSampleRate: 1.0,
      });
      (globalThis as any).__SENTRY_INIT__ = true;
    }
    
    try {
      return await app.fetch(request, env, ctx);
    } catch (error) {
      // Capture errors with Sentry
      if (env.SENTRY_DSN) {
        Sentry.captureException(error);
      }
      console.error('Unhandled error:', error);
      return new Response(JSON.stringify({ ok: false, error: 'internal_error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },
  scheduled: async (event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) => {
    // Initialize Sentry if DSN is provided (only once per Worker instance)
    if (env.SENTRY_DSN && !(globalThis as any).__SENTRY_INIT__) {
      Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: 'production',
        tracesSampleRate: 1.0,
      });
      (globalThis as any).__SENTRY_INIT__ = true;
    }
    
    try {
    // Check which cron triggered this
    const cron = event.cron;
    
    // Weekly allowance: only run on Monday 8am cron ("0 8 * * 1")
    if (cron === '0 8 * * 1') {
      const fams = await env.DB.prepare(`
        SELECT family_id, weekly_allowance_points FROM ExchangeRule WHERE weekly_allowance_points > 0
      `).all<{ family_id: string, weekly_allowance_points: number }>();

      const now = Date.now();

      for (const f of (fams.results ?? [])) {
        const kids = await env.DB.prepare(`
          SELECT user_id FROM KidProfile WHERE family_id = ?
        `).bind(f.family_id).all<{ user_id: string }>();

        for (const k of (kids.results ?? [])) {
          const ledgerId = uid('plg');
          await env.DB.prepare(`
            INSERT INTO PointsLedger (id,kid_user_id,family_id,delta_points,reason,ref_id,created_at)
            VALUES (?,?,?,?,?,?,?)
          `).bind(ledgerId, k.user_id, f.family_id, (f as any).weekly_allowance_points, 'weekly_allowance', null, now).run();

          await env.DB.prepare(`
            UPDATE KidProfile SET points_balance = points_balance + ? WHERE user_id=?
          `).bind((f as any).weekly_allowance_points, k.user_id).run();
        }
      }
    }

    // Daily reminders: run on the 15-minute cron ("*/15 * * * *")
    if (cron === '*/15 * * * *') {
      await emitDueReminders(env);
    }
    } catch (error) {
      // Capture cron errors with Sentry
      if (env.SENTRY_DSN) {
        Sentry.captureException(error);
      }
      console.error('Scheduled task error:', error);
      throw error;
    }
  }
};
