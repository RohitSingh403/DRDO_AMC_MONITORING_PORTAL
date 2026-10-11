const base = import.meta.env.VITE_API_URL || '';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${base}${path}`, {
      method,
      headers,
      body: payload,
      signal: AbortSignal.timeout(90000),
    });
  } catch (err) {
    const timedOut = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    throw new ApiError(
      timedOut
        ? 'The desk did not answer in time. Wait a moment and sign in again.'
        : 'The desk could not be reached. Wait a moment and sign in again.',
      0,
    );
  }
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (response.status === 401 && !path.startsWith('/api/auth/login')) {
    localStorage.removeItem('token');
    if (!window.location.pathname.startsWith('/login')) {
      window.location.assign('/login');
    }
  }

  if (!response.ok) {
    throw new ApiError(data?.message || 'Request failed', response.status, data);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  upload: (path, form) => request(path, { method: 'POST', form }),
};

export function fileUrl(filename) {
  return `${base}/uploads/${filename}`;
}
