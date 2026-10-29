// En desarrollo la API se sirve por proxy bajo /api en el mismo origen que el
// frontend (ver vite.config.ts), así funciona igual desde el portátil que desde
// el móvil por la red local, sin CORS ni contenido mixto. En producción se puede
// apuntar a otro host con VITE_API_URL.
// En producción la propia API sirve la interfaz, así que las rutas van al mismo
// origen sin prefijo ("/organizaciones"). VITE_API_URL permite apuntar a otro
// host si algún día se separan los despliegues.
const BASE_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? "" : "/api");

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const detalle = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${detalle}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
