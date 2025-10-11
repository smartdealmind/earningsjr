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
  me: () => api('/me').then(r => r.json()),
  templates: (age?: number) => api('/templates' + (age != null ? `?age=${age}` : '')).then(r => r.json()),
  createKid: (display_name: string, birthdate?: string, pin?: string) =>
    api('/kids', { method: 'POST', body: JSON.stringify({ display_name, birthdate, pin }) }).then(r => r.json()),
  createChoresFromTemplates: (templateIds: string[], kid_user_id?: string, due_at?: number) =>
    api('/chores', { method: 'POST', body: JSON.stringify({ from_template_ids: templateIds, kid_user_id, due_at }) }).then(r => r.json()),
  listChores: (status?: string) => api('/chores' + (status ? `?status=${status}` : '')).then(r => r.json()),
  approve: (id: string) => api(`/chores/${id}/approve`, { method: 'POST' }).then(r => r.json()),
  deny: (id: string) => api(`/chores/${id}/deny`, { method: 'POST' }).then(r => r.json()),
  kidLogin: (params: { kid_user_id?: string; display_name?: string; pin: string }) =>
    api('/auth/kid-login', { method: 'POST', body: JSON.stringify(params) }).then(r => r.json()),
  kidsBalances: () => api('/kids/balances').then(r => r.json()),
  ledger: (kid?: string) => api('/ledger' + (kid ? `?kid=${kid}` : '')).then(r => r.json()),
  exchangeQuote: (payload: { points?: number; amount_cents?: number }) =>
    api('/exchange/quote', { method: 'POST', body: JSON.stringify(payload) }).then(r => r.json()),
  rules: () => api('/exchange/rules').then(r => r.json()),
  updateRules: (payload: any) => api('/exchange/rules', { method:'PATCH', body: JSON.stringify(payload) }).then(r => r.json()),
  eligibility: (kid?: string) => api('/eligibility' + (kid ? `?kid=${kid}` : '')).then(r => r.json()),
  goalsList: (kid?: string) => api('/goals' + (kid ? `?kid=${kid}` : '')).then(r => r.json()),
  goalCreate: (payload: { kid_user_id?: string; title: string; target_amount_cents: number }) =>
    api('/goals', { method:'POST', body: JSON.stringify(payload) }).then(r => r.json()),
  goalCancel: (id: string) => api(`/goals/${id}/cancel`, { method:'POST' }).then(r => r.json()),
  requestsCreate: (payload: { title: string; description?: string; suggested_points?: number }) =>
    api('/requests', { method:'POST', body: JSON.stringify(payload) }).then(r => r.json()),
  requestsList: (status?: string) => api('/requests' + (status ? `?status=${status}` : '')).then(r => r.json()),
  requestsApprove: (id: string) => api(`/requests/${id}/approve`, { method:'POST' }).then(r => r.json()),
  requestsDeny: (id: string) => api(`/requests/${id}/deny`, { method:'POST' }).then(r => r.json())
};

