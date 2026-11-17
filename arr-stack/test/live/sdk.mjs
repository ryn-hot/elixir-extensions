// Live-check stand-in for `@elixir/sdk/v1`: the same fetch shape as the runner,
// but `http://<member>.stack/...` goes to a real member (base URL and API key
// from ARR_STACK_LIVE_MEMBERS, as Elixir's member directory resolved them).
const members = JSON.parse(process.env.ARR_STACK_LIVE_MEMBERS ?? "{}");
export const sdkVersion = 1;
export async function getSecret(key) {
  const member = key.endsWith(".api_key") ? key.slice(0, -".api_key".length) : null;
  return member && members[member] ? members[member].api_key ?? null : null;
}
export const state = Object.freeze({
  async get() { return null; },
  async set() { return true; },
  async delete() { return true; }
});
export async function fetch(url, options = {}) {
  const parsed = new URL(url);
  const member = parsed.hostname.endsWith(".stack") ? parsed.hostname.slice(0, -".stack".length) : null;
  if (!member || !members[member]) throw new Error(`not a stack member: ${url}`);
  const target = new URL(members[member].base_url);
  target.pathname = `${target.pathname.replace(/\/+$/, "")}${parsed.pathname}`;
  target.search = parsed.search;
  const response = await globalThis.fetch(target, {
    method: options.method ?? "GET",
    headers: options.headers ?? {},
    body: options.body ?? undefined,
    redirect: "manual",
  });
  const body = await response.text();
  return Object.freeze({
    status: response.status,
    ok: response.ok,
    headers: [],
    async text() { return body; },
    async json() { return JSON.parse(body); }
  });
}
