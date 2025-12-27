const API = import.meta.env.VITE_API_BASE ?? '';

export async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(API + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    ...init
  });
  return res;
}

export const Api = {
  // Auth
  sendVerification: (email: string) =>
    api('/auth/send-verification', { method: 'POST', body: JSON.stringify({ email }) }).then(r => r.json()), // Production endpoint with verified domain
  verifyEmail: (email: string, code: string) =>
    api('/auth/verify-email', { method: 'POST', body: JSON.stringify({ email, code }) }).then(r => r.json()),
  registerParent: (payload: { email: string; password: string; first_name: string; last_name: string; family_name: string }) =>
    api('/auth/register-parent', { method: 'POST', body: JSON.stringify(payload) }).then(r => r.json()),
  login: (payload: { email: string; password: string }) =>
    api('/auth/login', { method: 'POST', body: JSON.stringify(payload) }).then(r => r.json()),
  logout: () => api('/auth/logout', { method: 'POST' }).then(r => r.json()),
  forgotPassword: (email: string) =>
    api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }).then(r => r.json()),
  resetPassword: (token: string, password: string) =>
    api('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }).then(r => r.json()),
  me: () => api('/me').then(r => r.json()),
  
  // Kids
  createKid: (display_name: string, birthdate?: string, pin?: string) =>
    api('/kids', { method: 'POST', body: JSON.stringify({ display_name, birthdate, pin }) }).then(r => r.json()),
  kidLogin: (params: { kid_user_id?: string; display_name?: string; pin: string }) =>
    api('/auth/kid-login', { method: 'POST', body: JSON.stringify(params) }).then(r => r.json()),
  kidsBalances: () => api('/kids/balances').then(r => r.json()),
  
  // Chores
  templates: (age?: number) => api('/templates' + (age != null ? `?age=${age}` : '')).then(r => r.json()),
  createTemplate: (payload: { title: string; description?: string; min_age: number; max_age: number; category: string; default_points: number; is_required_default: boolean }) =>
    api('/templates', { method: 'POST', body: JSON.stringify(payload) }).then(r => r.json()),
  createChoresFromTemplates: (templateIds: string[], kid_user_id?: string, due_at?: number) =>
    api('/chores', { method: 'POST', body: JSON.stringify({ from_template_ids: templateIds, kid_user_id, due_at }) }).then(r => r.json()),
  createChoreFromTemplate: (kid_user_id: string, template_id: string) =>
    api('/chores', { method: 'POST', body: JSON.stringify({ from_template_ids: [template_id], kid_user_id }) }).then(r => r.json()),
  createChore: (kid_user_id: string, title: string, points: number, category: string) =>
    api('/chores', { method: 'POST', body: JSON.stringify({ kid_user_id, title, points, category }) }).then(r => r.json()),
  listChores: (status?: string) => api('/chores' + (status ? `?status=${status}` : '')).then(r => r.json()),
  approve: (id: string) => api(`/chores/${id}/approve`, { method: 'POST' }).then(r => r.json()),
  deny: (id: string) => api(`/chores/${id}/deny`, { method: 'POST' }).then(r => r.json()),
  
  // Points & Rules
  ledger: (kid?: string) => api('/ledger' + (kid ? `?kid=${kid}` : '')).then(r => r.json()),
  exchangeQuote: (payload: { points?: number; amount_cents?: number }) =>
    api('/exchange/quote', { method: 'POST', body: JSON.stringify(payload) }).then(r => r.json()),
  rules: () => api('/exchange/rules').then(r => r.json()),
  updateRules: (payload: any) => api('/exchange/rules', { method:'PATCH', body: JSON.stringify(payload) }).then(r => r.json()),
  
  // Goals & Requests
  eligibility: (kid?: string) => api('/eligibility' + (kid ? `?kid=${kid}` : '')).then(r => r.json()),
  goalsList: (kid?: string) => api('/goals' + (kid ? `?kid=${kid}` : '')).then(r => r.json()),
  goalCreate: (payload: { kid_user_id?: string; title: string; target_amount_cents: number }) =>
    api('/goals', { method:'POST', body: JSON.stringify(payload) }).then(r => r.json()),
  goalCancel: (id: string) => api(`/goals/${id}/cancel`, { method:'POST' }).then(r => r.json()),
  requestsCreate: (payload: { title: string; description?: string; suggested_points?: number }) =>
    api('/requests', { method:'POST', body: JSON.stringify(payload) }).then(r => r.json()),
  requestsList: (status?: string) => api('/requests' + (status ? `?status=${status}` : '')).then(r => r.json()),
  requestsApprove: (id: string) => api(`/requests/${id}/approve`, { method:'POST' }).then(r => r.json()),
  requestsDeny: (id: string) => api(`/requests/${id}/deny`, { method:'POST' }).then(r => r.json()),
  
  // Charts & Achievements
  generateChart: (kidId?: string) => api(`/charts/reward${kidId ? `?kid=${kidId}` : ''}`, { method:'POST' }).then(r => r.json()),
  achievements: (kid?: string) => api('/achievements' + (kid ? `?kid=${kid}` : '')).then(r => r.json()),
  
  // Reminders
  listReminderPrefs: () => api('/reminders/prefs').then(r => r.json()),
  updateReminderPrefs: (payload: any) => api('/reminders/prefs', { method: 'PATCH', body: JSON.stringify(payload) }).then(r => r.json()),
  listReminders: () => api('/reminders').then(r => r.json()),
  ackReminder: (id: string) => api(`/reminders/${id}/ack`, { method: 'POST' }).then(r => r.json()),
  
  // Stripe
  createCheckout: (priceId: string) =>
    api('/stripe/create-checkout', { method: 'POST', body: JSON.stringify({ priceId }) }).then(r => r.json()),
  getSubscription: () => api('/stripe/subscription').then(r => r.json()),
};

