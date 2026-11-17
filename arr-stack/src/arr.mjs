// Sonarr/Radarr HTTP from the Arr Stack's long-lived executor. A member is
// reached as http://<member>.stack/...; Elixir maps that to the member's own
// container and refuses every other host. Each member's API key is read from
// Elixir (getSecret('<member>.api_key')) and cached until it is rejected.
import { fetch, getSecret } from "@elixir/sdk/v1";

const keys = new Map();

/** Drops cached keys (they are otherwise kept until a member rejects one). */
export function forgetKeys() {
  keys.clear();
}

export class ManagerError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function apiKey(member) {
  if (!keys.has(member)) {
    const key = await getSecret(`${member}.api_key`);
    if (typeof key !== "string" || key.trim() === "") {
      throw new ManagerError(503, "manager_key_unavailable", `${member} API key is not available yet`);
    }
    keys.set(member, key.trim());
  }
  return keys.get(member);
}

/** `key=value&…` with RFC 3986 encoding; undefined/null values are skipped. */
export function query(params = {}) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
}

/**
 * One API call. `paths` are tried in order and a 404 moves to the next, the
 * same v3-then-v4 fallback the server used. Returns parsed JSON (or null).
 */
export async function request(member, method, paths, { params, body } = {}) {
  const key = await apiKey(member);
  const search = params ? query(params) : "";
  for (const path of paths) {
    const url = `http://${member}.stack/${path.replace(/^\/+/, "")}${search ? `?${search}` : ""}`;
    const headers = { "x-api-key": key, accept: "application/json" };
    if (body !== undefined) headers["content-type"] = "application/json";
    const response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status === 404) continue;
    if (response.status === 401) keys.delete(member);
    const text = await response.text();
    if (!response.ok) {
      const detail = text.trim().slice(0, 300);
      throw new ManagerError(502, "manager_http_error", `${method} ${path} failed (${response.status})${detail ? `: ${detail}` : ""}`);
    }
    return text.trim() === "" ? null : JSON.parse(text);
  }
  throw new ManagerError(502, "manager_endpoint_missing", `${paths[0]} is not available`);
}

/** v3 then v4 forms of one path. */
export function versions(path) {
  return [`api/v3/${path}`, `api/v4/${path}`];
}

export const get = (member, path, params) => request(member, "GET", versions(path), { params });
export const post = (member, path, body) => request(member, "POST", versions(path), { body });
export const put = (member, path, body) => request(member, "PUT", versions(path), { body });
export const remove = (member, path, params) => request(member, "DELETE", versions(path), { params });

/** `records` of a paged reply, or the array itself. */
export function records(value) {
  if (Array.isArray(value)) return value;
  return Array.isArray(value?.records) ? value.records : [];
}
