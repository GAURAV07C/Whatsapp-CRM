export function authFetch(input: RequestInfo, init: RequestInit = {}) {
  const token = localStorage.getItem("authToken");

  return fetch(input, {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...(token && token !== "null" ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
