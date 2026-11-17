// Test-only stand-in for the runner's `@elixir/sdk/v1`. Responses have exactly
// the real SDK fetch shape ({status, ok, headers: [{name, value}], text, json}).
// Tests configure it through globalThis.__elixirTestSdk = {secrets, routes, log}.
const config = () => globalThis.__elixirTestSdk ?? {};

export const sdkVersion = 1;

export async function getSecret(key) {
  const secrets = config().secrets ?? {};
  return Object.hasOwn(secrets, key) ? secrets[key] : null;
}

export const state = Object.freeze({
  async get() { return null; },
  async set() { return true; },
  async delete() { return true; }
});

export async function fetch(url, options = {}) {
  config().log?.push(url);
  // Optional: record method/headers/body, and match a route's `method`.
  const method = options.method ?? "GET";
  config().requests?.push({ url, method, headers: options.headers ?? {}, body: options.body ?? null });
  const route = (config().routes ?? []).find(
    (entry) => String(url).includes(entry.contains) && (entry.method === undefined || entry.method === method)
  );
  const status = route ? route.status ?? 200 : 404;
  const body = route?.body ?? "";
  return Object.freeze({
    status,
    ok: status >= 200 && status < 300,
    headers: route?.headers ?? [],
    async text() { return body; },
    async json() { return JSON.parse(body); }
  });
}
