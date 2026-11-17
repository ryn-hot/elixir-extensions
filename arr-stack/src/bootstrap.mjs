// First start of each member, as Elixir's orchestrator drives it: Elixir reads
// the files named by bootstrapFiles from the member's /config and passes them
// with Elixir's generated web login; this code reads the member's API key and
// requires a login for remote web access (local addresses stay open, as the
// server's own setup did). Elixir stores the key it returns.
import { fetch } from "@elixir/sdk/v1";
import { ManagerError, records, request } from "./arr.mjs";

const CONFIG_HOST = {
  sonarr: ["api/v3/config/host", "api/v4/config/host"],
  radarr: ["api/v3/config/host", "api/v4/config/host"],
  prowlarr: ["api/v1/config/host"],
};

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
function unescapeXml(value) {
  return value.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|amp|lt|gt|quot|apos);/g, (_, name) => {
    if (name.startsWith("#x")) return String.fromCodePoint(parseInt(name.slice(2), 16));
    if (name.startsWith("#")) return String.fromCodePoint(parseInt(name.slice(1), 10));
    return ENTITIES[name];
  });
}

/** The first non-empty <ApiKey> text of config.xml (the server's parse_arr_api_key). */
export function parseApiKey(xml) {
  if (typeof xml !== "string") return null;
  for (const match of xml.matchAll(/<ApiKey(?:\s[^>]*)?>([\s\S]*?)<\/ApiKey>/g)) {
    const text = match[1].trim();
    if (text !== "") return unescapeXml(text);
  }
  return null;
}

/** The server's arr_host_auth_config_requires_normalization. */
export function requiresNormalization(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) return false;
  const lower = (value) => (typeof value === "string" ? value.trim().toLowerCase() : "");
  return lower(config.authenticationMethod) === "none" || lower(config.authenticationRequired) === "enabled";
}

export async function bootstrapFiles() {
  return { files: ["config.xml"] };
}

async function hostCall(member, key, method, path, body) {
  const response = await fetch(`http://${member}.stack/${path}`, {
    method,
    headers: {
      "x-api-key": key,
      accept: "application/json",
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, ok: response.ok, text: await response.text() };
}

export async function bootstrap(member, input) {
  const paths = CONFIG_HOST[member];
  if (!paths) throw new ManagerError(400, "unsupported_member", `no first-start setup for ${member}`);
  const apiKey = parseApiKey(input.files?.["config.xml"]);
  if (!apiKey) return { apiKey: null };
  for (const path of paths) {
    const current = await hostCall(member, apiKey, "GET", path);
    if (current.status === 404) continue;
    if (!current.ok) throw new ManagerError(502, "manager_http_error", `${path} failed (${current.status})`);
    const config = JSON.parse(current.text);
    if (!requiresNormalization(config)) return { apiKey };
    if (config.authenticationMethod.trim().toLowerCase() === "none") {
      const username = input.login?.username;
      const password = input.login?.password;
      if (typeof username !== "string" || typeof password !== "string" || username === "" || password === "") {
        throw new ManagerError(400, "invalid_request", "a web login is required");
      }
      config.authenticationMethod = "forms";
      config.username = username;
      config.password = password;
      config.passwordConfirmation = password;
    }
    config.authenticationRequired = "disabledForLocalAddresses";
    const updated = await hostCall(member, apiKey, "PUT", path, config);
    if (!updated.ok) throw new ManagerError(502, "manager_http_error", `updating ${path} failed (${updated.status})`);
    return { apiKey };
  }
  return { apiKey };
}

/** The orchestrator's readiness probe (Prowlarr reports a summary). */
export async function readState(member) {
  if (member !== "prowlarr") return { summary: null };
  const status = await request(member, "GET", ["api/v1/system/status"]);
  const indexers = records(await request(member, "GET", ["api/v1/indexer"]));
  const version = typeof status?.version === "string" ? status.version : "unknown";
  return { summary: `Prowlarr v${version} · ${indexers.length} indexers` };
}

export const operations = {
  bootstrap_files: bootstrapFiles,
  bootstrap,
  read_state: readState,
};
