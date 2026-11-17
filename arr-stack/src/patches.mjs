// Stack setup of the Arr Stack's own members. Elixir's orchestrator resolves a
// connector's driver patch (manifest.yaml, stack.connectors[].actions[].patch)
// with credentials and peer URLs filled in, then calls evaluatePatch and, only
// when that is not in sync, applyPatch. Both reproduce the server's own
// drivers request for request:
//   sonarr   elixir-server/src/drivers/media_manager_tv.rs
//   radarr   elixir-server/src/drivers/media_manager_movies.rs
//   prowlarr elixir-server/src/drivers/indexer_registry.rs
// Only these patch ops are served: set_downloaders, set_root_folders and
// apply_quality_policy_preset (Sonarr, Radarr); register_indexers,
// register_app and register_apps (Prowlarr). Patch fields keep the server's
// serde names (drivers/patches.rs), so they are snake_case.
//
// evaluatePatch -> {status: "in_sync" | "drifted" | "unknown", message, nonComparableFields}
// applyPatch    -> {status: "applied" | "deferred", message}
//
// Deliberate deviations from the Rust drivers:
// - HTTP goes through arr.mjs request() (member reached as http://<member>.stack,
//   API key from Elixir's secrets), so HTTP error texts are request()'s, not the
//   drivers' describe_error_body text. The requests themselves are the same.
// - register_app(s) set the app's prowlarrUrl from request.providerUrl: the
//   member's own address as the other containers reach it, which Elixir sends
//   with every patch (the Rust driver read the same value from the Prowlarr
//   provider's endpoint). Without it, prowlarrUrl is left as Prowlarr has it.
// - JSON equality cannot tell 1 from 1.0 (serde_json can); Arr APIs send
//   integers, so drift decisions are the same in practice.
// - URLs are parsed by a small parser (no URL global in the executor) that
//   covers http(s) URLs as Url::parse reads them; exotic forms (IDNA,
//   percent-encoding) are not normalized.
import { ManagerError, request } from "./arr.mjs";
import { PRESETS, buildRadarrQualityPolicyPlan, buildSonarrQualityPolicyPlan } from "./quality-policy.mjs";

// ---- value helpers (serde_json Value access)

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const get = (value, key) => (isObject(value) && Object.hasOwn(value, key) ? value[key] : undefined);
const asStr = (value) => (typeof value === "string" ? value : null);
const asI64 = (value) => (Number.isInteger(value) ? value : null);
const clone = (value) => JSON.parse(JSON.stringify(value));
const asciiLower = (value) => value.replace(/[A-Z]/g, (c) => c.toLowerCase());
const trimLower = (value) => asciiLower(value.trim());
const messageOf = (error) => String(error?.message ?? error);

/** serde_json Value equality: objects ignore key order, arrays do not. */
export function jsonEqual(left, right) {
  if (left === right) return true;
  if (Array.isArray(left)) {
    return Array.isArray(right) && left.length === right.length && left.every((value, index) => jsonEqual(value, right[index]));
  }
  if (isObject(left)) {
    if (!isObject(right)) return false;
    const keys = Object.keys(left);
    return keys.length === Object.keys(right).length && keys.every((key) => Object.hasOwn(right, key) && jsonEqual(left[key], right[key]));
  }
  return false;
}

const fail = (message) => new ManagerError(502, "patch_failed", message);
const invalid = (message) => new ManagerError(400, "invalid_patch", message);

// ---- URLs (Url::parse as the drivers use it: scheme, host, port, path)

const DEFAULT_PORTS = { http: 80, https: 443, ws: 80, wss: 443, ftp: 21 };
const knownPort = (scheme) => (Object.hasOwn(DEFAULT_PORTS, scheme) ? DEFAULT_PORTS[scheme] : null);

/** {scheme, userinfo, host, port, path, query, fragment}, or null when Url::parse would fail. */
export function parseUrl(input) {
  if (typeof input !== "string") return null;
  const text = input.replace(/^[\u0000- ]+|[\u0000- ]+$/g, "").replace(/[\t\n\r]/g, "");
  const match = /^([A-Za-z][A-Za-z0-9+.-]*):([\s\S]*)$/.exec(text);
  if (!match) return null;
  const scheme = asciiLower(match[1]);
  const special = knownPort(scheme) !== null;
  let rest = match[2];
  let query = null;
  let fragment = null;
  const hash = rest.indexOf("#");
  if (hash >= 0) {
    fragment = rest.slice(hash + 1);
    rest = rest.slice(0, hash);
  }
  const question = rest.indexOf("?");
  if (question >= 0) {
    query = rest.slice(question + 1);
    rest = rest.slice(0, question);
  }
  if (special) rest = rest.replace(/\\/g, "/");
  if (!special && !rest.startsWith("//")) return { scheme, userinfo: null, host: null, port: null, path: rest, query, fragment };
  const body = special ? rest.replace(/^\/+/, "") : rest.slice(2);
  const slash = body.indexOf("/");
  const authority = slash >= 0 ? body.slice(0, slash) : body;
  let path = slash >= 0 ? body.slice(slash) : "";
  const at = authority.lastIndexOf("@");
  const userinfo = at >= 0 ? authority.slice(0, at) : null;
  const parts = /^(\[[^\]]*\]|[^:]*)(?::(\d*))?$/.exec(authority.slice(at + 1));
  if (!parts) return null;
  let host = parts[1];
  let port = parts[2] ? Number(parts[2]) : null;
  if (port !== null && port > 65535) return null;
  if (special) {
    if (host === "") return null;
    host = asciiLower(host);
    if (port === knownPort(scheme)) port = null;
    if (path === "") path = "/";
  }
  return { scheme, userinfo, host, port, path, query, fragment };
}

const portOrKnownDefault = (url) => url.port ?? knownPort(url.scheme);

function serializeUrl(url) {
  const authority = url.host === null
    ? ""
    : `//${url.userinfo !== null ? `${url.userinfo}@` : ""}${url.host}${url.port !== null ? `:${url.port}` : ""}`;
  return `${url.scheme}:${authority}${url.path}${url.query !== null ? `?${url.query}` : ""}${url.fragment !== null ? `#${url.fragment}` : ""}`;
}

/** indexer_registry.rs normalize_root_url, serialized. */
function normalizeProwlarrRootUrl(value) {
  const parsed = parseUrl(value);
  if (!parsed) throw fail("parsing prowlarr base_url");
  let path = parsed.path.replace(/\/+$/, "");
  if (path.endsWith("/api/v1")) {
    while (path.endsWith("/api/v1")) path = path.slice(0, -"/api/v1".length);
  }
  return serializeUrl({ ...parsed, path: path === "" ? "/" : path });
}

/** indexer_registry.rs normalize_url (app and proxy identity). */
function normalizeUrl(value) {
  const trimmed = value.trim();
  const parsed = parseUrl(trimmed);
  if (!parsed) return asciiLower(trimmed);
  let normalized = `${parsed.scheme}://${asciiLower(parsed.host ?? "")}`;
  const port = portOrKnownDefault(parsed);
  if (port !== null) normalized += `:${port}`;
  const path = parsed.path.replace(/\/+$/, "");
  if (path !== "") normalized += path;
  return normalized;
}

// ---- HTTP: the drivers' clients

function apiClient(member, prefix) {
  const call = async (method, path, body) => {
    const value = await request(member, method, [`${prefix}${path.replace(/^\/+/, "")}`], body === undefined ? {} : { body });
    if (value === null) throw fail(`${member} ${method} ${path} returned empty response`);
    return value;
  };
  return {
    get: (path) => call("GET", path),
    async list(path) {
      const value = await call("GET", path);
      if (!Array.isArray(value)) throw fail(`parsing GET ${path} response`);
      return value;
    },
    post: (path, body) => call("POST", path, body),
    put: (path, body) => call("PUT", path, body),
  };
}

/** probe_api: true when system/status answers, false on 404. */
async function probeApi(member, version) {
  try {
    await request(member, "GET", [`api/${version}/system/status`]);
    return true;
  } catch (error) {
    if (error?.code === "manager_endpoint_missing") return false;
    throw error;
  }
}

/** parse_sonarr_major */
export function parseSonarrMajor(status) {
  const version = asStr(get(status, "version"));
  if (version === null) return null;
  const major = version.split(".")[0].trim();
  if (!/^\+?\d+$/.test(major) || Number(major) > 4294967295) return null;
  return Number(major);
}

/**
 * SonarrClient/RadarrClient::from_config: the API version is detected once
 * (system/status on v3, then v4) and every later call uses it. Sonarr then
 * reads its product major (load_product_major). The ops served here do not
 * depend on it (ensure_sonarr_v3 only gates language and release profiles),
 * but the request is kept so both sides send the same calls.
 */
async function managerClient(member) {
  let version = null;
  for (const candidate of ["v3", "v4"]) {
    if (await probeApi(member, candidate)) {
      version = candidate;
      break;
    }
  }
  if (version === null) throw fail(`${member} api version could not be detected`);
  const client = apiClient(member, `api/${version}/`);
  client.apiVersion = version;
  client.productMajor = member === "sonarr" ? parseSonarrMajor(await client.get("system/status")) : null;
  return client;
}

// ---- shared driver helpers

function findByName(items, name, normalize) {
  const needle = normalize(name);
  for (const item of items) {
    const current = asStr(get(item, "name"));
    if (current !== null && normalize(current) === needle) return item;
  }
  return null;
}

function setField(target, field, value) {
  if (!isObject(target)) throw fail(`expected object for field '${field}'`);
  target[field] = value;
}

function setEnabled(target, enabled) {
  if (!isObject(target)) throw fail("expected object for enabled update");
  if (Object.hasOwn(target, "enable")) target.enable = enabled;
  else target.enabled = enabled;
}

function ensureSchemaFields(target, implementation) {
  if (!isObject(target)) return;
  if (!Object.hasOwn(target, "implementation")) target.implementation = implementation;
  if (!Object.hasOwn(target, "configContract")) target.configContract = `${implementation}Settings`;
}

function removeReadonlyFields(target) {
  if (!isObject(target)) return;
  delete target.id;
  delete target.warnings;
  delete target.validationFailures;
}

function setFieldValueOptional(fields, name, value) {
  for (const field of fields) {
    if (asStr(get(field, "name")) === name) {
      field.value = value;
      return true;
    }
  }
  return false;
}

function parseIntList(values) {
  return values.map((value) => {
    const trimmed = value.trim();
    if (!/^[+-]?\d+$/.test(trimmed)) throw fail(`invalid category '${value}'`);
    return Number(trimmed);
  });
}

function dedupStrings(values, normalize) {
  const seen = new Set();
  return values.filter((value) => {
    const key = normalize(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function driftEvaluation(subject, drift) {
  if (drift.length === 0) return { status: "in_sync", message: null, nonComparableFields: [] };
  return { status: "drifted", message: `${subject} require repair: ${drift.join(", ")}`, nonComparableFields: [] };
}

function tagIndex(existing, normalize) {
  const byName = new Map();
  for (const tag of existing) {
    const label = asStr(get(tag, "label"));
    const id = asI64(get(tag, "id"));
    if (label !== null && id !== null) byName.set(normalize(label), id);
  }
  return byName;
}

/** ensure_tags: ids of the named tags, creating missing ones. */
async function ensureTags(client, tags, normalize) {
  if (tags.length === 0) return [];
  const byName = tagIndex(await client.list("tag"), normalize);
  const ids = [];
  const seen = new Set();
  for (const tag of tags) {
    const normalized = normalize(tag);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    if (byName.has(normalized)) {
      ids.push(byName.get(normalized));
      continue;
    }
    const id = asI64(get(await client.post("tag", { label: tag }), "id"));
    if (id === null) throw fail("tag creation did not return id");
    byName.set(normalized, id);
    ids.push(id);
  }
  return ids;
}

/** resolve_existing_tag_ids: ids of existing tags, and the missing names. */
async function resolveExistingTagIds(client, tags, normalize) {
  if (tags.length === 0) return { ids: [], missing: [] };
  const byName = tagIndex(await client.list("tag"), normalize);
  const ids = [];
  const missing = [];
  const seen = new Set();
  for (const tag of tags) {
    const normalized = normalize(tag);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    if (byName.has(normalized)) ids.push(byName.get(normalized));
    else missing.push(tag);
  }
  return { ids, missing };
}

/** The drivers' write step: nothing when unchanged, PUT by id, else POST. */
async function upsert(client, path, target, existingItem) {
  if (existingItem !== null && jsonEqual(target, existingItem)) return;
  const id = asI64(get(target, "id"));
  if (id !== null) {
    await client.put(`${path}/${id}`, target);
  } else {
    removeReadonlyFields(target);
    await client.post(path, target);
  }
}

const changed = (existingItem, target) => existingItem === null || !jsonEqual(existingItem, target);

// ---- Sonarr and Radarr

function updateSonarrQualityItems(items, allowed, cutoff, normalize) {
  let cutoffId = null;
  for (const item of items) {
    let nestedCutoff = null;
    let groupHasAllowedChild = null;
    const children = get(item, "items");
    if (Array.isArray(children)) {
      nestedCutoff = updateSonarrQualityItems(children, allowed, cutoff, normalize);
      groupHasAllowedChild = children.some((child) => get(child, "allowed") === true);
    }
    const quality = get(item, "quality");
    if (quality !== undefined) {
      const name = asStr(get(quality, "name"));
      const id = asI64(get(quality, "id"));
      if (name !== null) {
        const normalized = normalize(name);
        item.allowed = allowed.has(normalized);
        if (cutoff !== null && normalized === normalize(cutoff)) cutoffId = id;
      }
    }
    const groupName = asStr(get(item, "name"));
    const groupId = asI64(get(item, "id"));
    if (groupName !== null) {
      if (groupHasAllowedChild !== null) item.allowed = groupHasAllowedChild;
      if (cutoff !== null && normalize(groupName) === normalize(cutoff)) cutoffId = groupId;
    }
    if (cutoffId === null) cutoffId = nestedCutoff;
  }
  return cutoffId;
}

function updateRadarrQualityItems(items, allowed, cutoff, normalize) {
  let cutoffId = null;
  for (const item of items) {
    const quality = get(item, "quality");
    if (quality !== undefined) {
      const name = asStr(get(quality, "name"));
      const id = asI64(get(quality, "id"));
      if (name !== null) {
        const normalized = normalize(name);
        item.allowed = allowed.has(normalized);
        if (cutoff !== null && normalized === normalize(cutoff)) cutoffId = id;
      }
    }
    const children = get(item, "items");
    if (Array.isArray(children)) {
      const nestedCutoff = updateRadarrQualityItems(children, allowed, cutoff, normalize);
      if (cutoffId === null) cutoffId = nestedCutoff;
    }
  }
  return cutoffId;
}

// What differs between the two media-manager drivers.
const MANAGERS = {
  sonarr: {
    label: "Sonarr",
    normalize: trimLower,
    findByPath: (items, path) => items.find((item) => asStr(get(item, "path")) === path.trim()) ?? null,
    findIdByName(items, name) {
      const needle = trimLower(name);
      for (const item of items) {
        const current = asStr(get(item, "name"));
        if (current !== null && trimLower(current) === needle && asI64(get(item, "id")) !== null) return item.id;
      }
      return null;
    },
    notFound: (name) => `entry '${name}' not found`,
    categoryFields: ["category", "tvCategory"],
    updateQualityItems: updateSonarrQualityItems,
    buildPlan: buildSonarrQualityPolicyPlan,
    validatesApply: true,
  },
  radarr: {
    label: "Radarr",
    normalize: (value) => trimLower(value).replace(/ /g, ""),
    findByPath(items, path) {
      const needle = this.normalize(path);
      return items.find((item) => asStr(get(item, "path")) !== null && this.normalize(item.path) === needle) ?? null;
    },
    findIdByName(items, name) {
      return asI64(get(findByName(items, name, this.normalize), "id"));
    },
    notFound: (name) => `'${name}' not found`,
    categoryFields: ["category", "movieCategory", "tvCategory"],
    updateQualityItems: updateRadarrQualityItems,
    buildPlan: buildRadarrQualityPolicyPlan,
    // The Radarr driver's apply_patch does not call patch.validate().
    validatesApply: false,
  },
};

// root folders: evaluate_root_folders / ensure_root_folders

async function evaluateRootFolders(client, manager, roots) {
  if (roots.length === 0) return [];
  const existing = await client.list("rootfolder");
  return roots.filter((root) => manager.findByPath(existing, root.path) === null).map((root) => root.path);
}

async function ensureRootFolders(client, manager, roots) {
  if (roots.length === 0) return;
  const existing = await client.list("rootfolder");
  for (const root of roots) {
    if (manager.findByPath(existing, root.path) !== null) continue;
    await client.post("rootfolder", { path: root.path });
  }
}

// download clients: evaluate_downloaders / upsert_downloaders

function findManagerSchema(items, implementation, normalize) {
  const needle = normalize(implementation);
  for (const item of items) {
    const current = asStr(get(item, "implementation")) ?? asStr(get(item, "implementationName"));
    if (current !== null && normalize(current) === needle) return item;
  }
  throw fail(`implementation '${implementation}' not found`);
}

function applyUrlFields(fields, url) {
  const parsed = parseUrl(url);
  if (!parsed) throw fail("parsing downloader url");
  const hasBase = setFieldValueOptional(fields, "baseUrl", url);
  const hasUrl = setFieldValueOptional(fields, "url", url);
  if (parsed.host === null) throw fail("downloader url host missing");
  const port = portOrKnownDefault(parsed) ?? 80;
  if (!hasBase && !hasUrl) {
    setFieldValueOptional(fields, "host", parsed.host);
    setFieldValueOptional(fields, "port", port);
    if (parsed.scheme === "https") setFieldValueOptional(fields, "useSsl", true);
  }
}

function applyDownloaderFields(manager, fields, spec) {
  applyUrlFields(fields, spec.url);
  if (spec.api_key !== null) setFieldValueOptional(fields, "apiKey", spec.api_key);
  if (spec.category !== null) manager.categoryFields.some((name) => setFieldValueOptional(fields, name, spec.category));
  for (const [key, value] of Object.entries(spec.settings)) setFieldValueOptional(fields, key, clone(value));
}

function downloaderTarget(manager, schema, existing, downloader, tags) {
  const schemaItem = findManagerSchema(schema, downloader.type, manager.normalize);
  const existingItem = findByName(existing, downloader.name, manager.normalize);
  const target = clone(existingItem ?? schemaItem);
  setEnabled(target, downloader.enabled ?? true);
  setField(target, "name", downloader.name);
  setField(target, "tags", [...tags]);
  ensureSchemaFields(target, downloader.type);
  const fields = get(target, "fields");
  if (!Array.isArray(fields)) throw fail("download client fields missing");
  applyDownloaderFields(manager, fields, downloader);
  return { target, existingItem };
}

async function evaluateDownloaders(client, manager, downloaders) {
  if (downloaders.length === 0) return [];
  const schema = await client.list("downloadclient/schema");
  const existing = await client.list("downloadclient");
  const drift = [];
  for (const downloader of downloaders) {
    const { ids, missing } = await resolveExistingTagIds(client, downloader.tags, manager.normalize);
    drift.push(...missing.map((tag) => `tag:${tag}`));
    const { target, existingItem } = downloaderTarget(manager, schema, existing, downloader, ids);
    if (changed(existingItem, target)) drift.push(downloader.name);
  }
  return dedupStrings(drift, manager.normalize);
}

async function upsertDownloaders(client, manager, downloaders) {
  if (downloaders.length === 0) return;
  const schema = await client.list("downloadclient/schema");
  const existing = await client.list("downloadclient");
  for (const downloader of downloaders) {
    const tags = await ensureTags(client, downloader.tags, manager.normalize);
    const { target, existingItem } = downloaderTarget(manager, schema, existing, downloader, tags);
    await upsert(client, "downloadclient", target, existingItem);
  }
}

// quality profiles: evaluate_quality_profiles / upsert_quality_profiles

function qualityProfileTarget(manager, existing, template, profile) {
  const existingItem = findByName(existing, profile.name, manager.normalize);
  const target = clone(existingItem ?? template);
  if (existingItem === null && isObject(target)) delete target.id;
  setField(target, "name", profile.name);
  if (profile.upgrade_allowed !== null) setField(target, "upgradeAllowed", profile.upgrade_allowed);
  if (profile.min_format_score !== null) setField(target, "minFormatScore", profile.min_format_score);
  if (profile.min_upgrade_format_score !== null) setField(target, "minUpgradeFormatScore", profile.min_upgrade_format_score);
  if (profile.cutoff_format_score !== null) setField(target, "cutoffFormatScore", profile.cutoff_format_score);
  const allowed = new Set(profile.allowed.map(manager.normalize));
  const cutoffName = profile.cutoff !== null ? manager.normalize(profile.cutoff) : null;
  const items = get(target, "items");
  if (!Array.isArray(items)) throw fail("quality profile items missing");
  const cutoffId = manager.updateQualityItems(items, allowed, cutoffName, manager.normalize);
  if (cutoffId !== null) setField(target, "cutoff", cutoffId);
  else if (profile.cutoff !== null) throw fail(`quality cutoff '${profile.cutoff}' not found`);
  return { target, existingItem };
}

async function qualityProfiles(client) {
  const existing = await client.list("qualityprofile");
  if (existing.length === 0) throw fail("quality profile template missing");
  return existing;
}

async function evaluateQualityProfiles(client, manager, profiles) {
  if (profiles.length === 0) return [];
  const existing = await qualityProfiles(client);
  const drift = [];
  for (const profile of profiles) {
    const { target, existingItem } = qualityProfileTarget(manager, existing, existing[0], profile);
    if (changed(existingItem, target)) drift.push(profile.name);
  }
  return dedupStrings(drift, manager.normalize);
}

async function upsertQualityProfiles(client, manager, profiles) {
  if (profiles.length === 0) return;
  const existing = await qualityProfiles(client);
  for (const profile of profiles) {
    const { target, existingItem } = qualityProfileTarget(manager, existing, existing[0], profile);
    await upsert(client, "qualityprofile", target, existingItem);
  }
}

// custom formats: evaluate_custom_formats / upsert_custom_formats

/** normalize_custom_format_specifications: `fields` maps become [{name, value}]. */
function normalizeSpecification(specification) {
  if (!isObject(specification)) throw fail("custom_format.specifications entries must be objects");
  const normalized = clone(specification);
  if (!Object.hasOwn(normalized, "fields") || Array.isArray(normalized.fields)) return normalized;
  if (!isObject(normalized.fields)) throw fail("custom_format.specifications[].fields must be an object or array");
  normalized.fields = Object.entries(normalized.fields).map(([name, value]) => ({ name, value }));
  return normalized;
}

function customFormatSpec(pattern, negate) {
  if (pattern.trim() === "") throw fail("custom format pattern is required");
  return {
    name: "Release Title",
    implementation: "ReleaseTitleSpecification",
    negate,
    required: true,
    fields: [{ name: "value", value: pattern }],
  };
}

function buildCustomFormatSpecs(format) {
  if (format.specifications.length > 0) return format.specifications.map(normalizeSpecification);
  return [...format.include.map((pattern) => customFormatSpec(pattern, false)), ...format.exclude.map((pattern) => customFormatSpec(pattern, true))];
}

function customFormatTarget(manager, existing, format) {
  const existingItem = findByName(existing, format.name, manager.normalize);
  const target = existingItem !== null ? clone(existingItem) : {};
  setField(target, "name", format.name);
  setField(target, "includeCustomFormatWhenRenaming", format.include_custom_format_when_renaming ?? false);
  target.specifications = buildCustomFormatSpecs(format);
  return { target, existingItem };
}

async function evaluateCustomFormats(client, manager, formats) {
  if (formats.length === 0) return [];
  const existing = await client.list("customformat");
  const drift = [];
  for (const format of formats) {
    const { target, existingItem } = customFormatTarget(manager, existing, format);
    if (changed(existingItem, target)) drift.push(format.name);
  }
  return dedupStrings(drift, manager.normalize);
}

async function upsertCustomFormats(client, manager, formats) {
  if (formats.length === 0) return;
  const existing = await client.list("customformat");
  for (const format of formats) {
    const { target, existingItem } = customFormatTarget(manager, existing, format);
    await upsert(client, "customformat", target, existingItem);
  }
}

// exact custom-format scores of one profile:
// evaluate_exact_custom_format_scores / apply_exact_custom_format_scores

/** build_named_score_map(_if_present): format id (as text) -> score. */
function namedScoreMap(manager, formats, customFormats, ifPresent) {
  const scores = new Map();
  for (const format of formats) {
    if (format.score === null || format.score === undefined) continue;
    const id = manager.findIdByName(customFormats, format.name);
    if (id === null) {
      if (ifPresent) return null;
      throw fail(manager.notFound(format.name));
    }
    scores.set(String(id), format.score);
  }
  return scores;
}

function extractNamedFormatScores(profile) {
  const scores = new Map();
  const items = get(profile, "formatItems");
  if (!Array.isArray(items)) return scores;
  for (const item of items) {
    const format = get(item, "format");
    const id = asI64(format) ?? asI64(get(format, "id")) ?? asI64(get(item, "formatId"));
    const score = asI64(get(item, "score"));
    if (id === null || score === null) continue;
    scores.set(String(id), score);
  }
  return scores;
}

const sameScores = (left, right) => left.size === right.size && [...left].every(([id, score]) => right.get(id) === score);

function setExactFormatItems(profile, scores) {
  const items = [...scores].map(([id, score]) => ({ format: Number(id), score })).sort((left, right) => left.format - right.format);
  if (!isObject(profile)) throw fail("quality profile must be an object");
  profile.formatItems = items;
}

async function evaluateExactCustomFormatScores(client, manager, profileName, formats) {
  const expected = namedScoreMap(manager, formats, await client.list("customformat"), true);
  if (expected === null) return [profileName];
  const profile = findByName(await client.list("qualityprofile"), profileName, manager.normalize);
  if (profile === null) return [profileName];
  return sameScores(extractNamedFormatScores(profile), expected) ? [] : [profileName];
}

async function applyExactCustomFormatScores(client, manager, profileName, formats) {
  const expected = namedScoreMap(manager, formats, await client.list("customformat"), false);
  const profile = findByName(await client.list("qualityprofile"), profileName, manager.normalize);
  if (profile === null) throw fail(`quality profile '${profileName}' not found`);
  const updated = clone(profile);
  setExactFormatItems(updated, expected);
  if (jsonEqual(updated, profile)) return;
  const id = asI64(get(updated, "id"));
  if (id === null) throw fail("quality profile id missing");
  await client.put(`qualityprofile/${id}`, updated);
}

async function evaluateManagerPatch(member, patch) {
  const manager = MANAGERS[member];
  const client = await managerClient(member);
  switch (patch.op) {
    case "set_downloaders":
      return driftEvaluation(`${manager.label} download clients`, await evaluateDownloaders(client, manager, patch.downloaders));
    case "set_root_folders":
      return driftEvaluation(`${manager.label} root folders`, await evaluateRootFolders(client, manager, patch.roots));
    default: {
      const plan = manager.buildPlan(patch.policy);
      const drift = await evaluateQualityProfiles(client, manager, [plan.qualityProfile]);
      drift.push(...(await evaluateCustomFormats(client, manager, plan.customFormats)));
      drift.push(...(await evaluateExactCustomFormatScores(client, manager, plan.qualityProfile.name, plan.customFormats)));
      return driftEvaluation(`${manager.label} quality policy preset`, dedupStrings(drift, manager.normalize));
    }
  }
}

async function applyManagerPatch(member, patch) {
  const manager = MANAGERS[member];
  if (manager.validatesApply) validatePatch(patch);
  const client = await managerClient(member);
  switch (patch.op) {
    case "set_downloaders":
      await upsertDownloaders(client, manager, patch.downloaders);
      break;
    case "set_root_folders":
      await ensureRootFolders(client, manager, patch.roots);
      break;
    default: {
      const plan = manager.buildPlan(patch.policy);
      await upsertQualityProfiles(client, manager, [plan.qualityProfile]);
      await upsertCustomFormats(client, manager, plan.customFormats);
      await applyExactCustomFormatScores(client, manager, plan.qualityProfile.name, plan.customFormats);
    }
  }
  return { status: "applied", message: null };
}

// ---- Prowlarr

const SCHEMA_KEYS = ["implementation", "implementationName", "name", "definitionName", "definitionFile"];

/** find_schema_optional: an exact name match, else the one prefix match. */
function findRegistrySchema(items, implementation) {
  const needle = trimLower(implementation);
  const candidates = (item) => SCHEMA_KEYS.map((key) => asStr(get(item, key))).filter((value) => value !== null).map(trimLower);
  const exact = items.find((item) => candidates(item).some((candidate) => candidate === needle));
  if (exact !== undefined) return exact;
  const fuzzy = items.filter((item) => candidates(item).some((candidate) => candidate.startsWith(needle) || needle.startsWith(candidate)));
  return fuzzy.length === 1 ? fuzzy[0] : null;
}

/** field_string_value: a field's text (or number as text); stops at a nameless field. */
function fieldStringValue(fields, key) {
  for (const field of fields) {
    const name = asStr(get(field, "name"));
    if (name === null) return null;
    if (asciiLower(name) !== asciiLower(key)) continue;
    if (!Object.hasOwn(field, "value")) return null;
    const value = field.value;
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
  }
  return null;
}

function appUrlFromItem(item) {
  const fields = get(item, "fields");
  if (!Array.isArray(fields)) return null;
  for (const key of ["baseUrl", "url", "serverUrl", "prowlarrUrl"]) {
    // As in the driver, a key the app does not have ends the search.
    const value = fieldStringValue(fields, key);
    if (value === null) return null;
    if (value.trim() !== "") return value.trim();
  }
  return null;
}

/** find_app_by_identity: same name, implementation and app URL. */
function findAppByIdentity(items, app) {
  const targetName = trimLower(app.name);
  const targetImplementation = trimLower(app.implementation);
  const targetUrl = normalizeUrl(app.url);
  for (const item of items) {
    const name = asStr(get(item, "name"));
    if (name === null || trimLower(name) !== targetName) continue;
    const raw = asStr(get(item, "implementation")) ?? asStr(get(item, "implementationName")) ?? asStr(get(item, "configContract"));
    const implementation = raw === null ? "" : trimLower(raw);
    if (implementation !== targetImplementation && !implementation.includes(targetImplementation)) continue;
    const url = appUrlFromItem(item);
    if (url === null || normalizeUrl(url) !== targetUrl) continue;
    return item;
  }
  return null;
}

async function resolveDefaultAppProfileId(client) {
  const profiles = await client.list("appProfile");
  for (const profile of profiles) {
    const name = asStr(get(profile, "name"));
    const id = asI64(get(profile, "id"));
    if (name !== null && id !== null && trimLower(name) === "standard" && id > 0) return id;
  }
  for (const profile of profiles) {
    const id = asI64(get(profile, "id"));
    if (id !== null && id > 0) return id;
  }
  return null;
}

function applyIndexerDefaults(target, defaultAppProfileId) {
  if (!isObject(target)) throw fail("expected object for indexer defaults");
  if (!Object.hasOwn(target, "appProfileId")) return;
  if ((asI64(target.appProfileId) ?? 0) > 0) return;
  if (defaultAppProfileId === null) throw fail("prowlarr requires an app profile for this indexer, but none are available");
  target.appProfileId = defaultAppProfileId;
}

function applyIndexerFields(fields, spec) {
  if (!setFieldValueOptional(fields, "baseUrl", spec.url) && !setFieldValueOptional(fields, "url", spec.url)) {
    throw fail("indexer requires baseUrl or url field");
  }
  if (spec.api_key !== null) setFieldValueOptional(fields, "apiKey", spec.api_key);
  if (spec.categories.length > 0) setFieldValueOptional(fields, "categories", parseIntList(spec.categories));
  for (const [key, value] of Object.entries(spec.settings)) setFieldValueOptional(fields, key, clone(value));
}

function applyAppFields(fields, spec, prowlarrUrl) {
  if (prowlarrUrl !== null) setFieldValueOptional(fields, "prowlarrUrl", normalizeProwlarrRootUrl(prowlarrUrl));
  if (!setFieldValueOptional(fields, "baseUrl", spec.url) && !setFieldValueOptional(fields, "url", spec.url)) {
    throw fail("app requires baseUrl or url field");
  }
  if (spec.api_key !== null) setFieldValueOptional(fields, "apiKey", spec.api_key);
  if (spec.categories.length > 0) setFieldValueOptional(fields, "syncCategories", parseIntList(spec.categories));
  for (const [key, value] of Object.entries(spec.settings)) setFieldValueOptional(fields, key, clone(value));
}

function indexerTarget(base, indexer, tags, defaultAppProfileId) {
  const target = clone(base);
  setEnabled(target, indexer.enabled ?? true);
  setField(target, "name", indexer.name);
  setField(target, "tags", [...tags]);
  ensureSchemaFields(target, indexer.implementation);
  applyIndexerDefaults(target, defaultAppProfileId);
  const fields = get(target, "fields");
  if (!Array.isArray(fields)) throw fail("indexer fields missing");
  applyIndexerFields(fields, indexer);
  return target;
}

/** evaluate_indexers: an indexer that cannot be evaluated counts as drifted. */
async function evaluateIndexers(client, indexers) {
  if (indexers.length === 0) return [];
  const schema = await client.list("indexer/schema");
  const existing = await client.list("indexer");
  const defaultAppProfileId = await resolveDefaultAppProfileId(client);
  const drift = [];
  for (const indexer of indexers) {
    try {
      const existingItem = findByName(existing, indexer.name, trimLower);
      const base = findRegistrySchema(schema, indexer.implementation) ?? existingItem;
      if (base === null) throw fail(`schema does not support requested indexer '${indexer.name}' (${indexer.implementation})`);
      const { ids, missing } = await resolveExistingTagIds(client, indexer.tags, trimLower);
      const indexerDrift = missing.map((tag) => `tag:${tag}`);
      const target = indexerTarget(existingItem ?? base, indexer, ids, defaultAppProfileId);
      if (changed(existingItem, target)) indexerDrift.push(indexer.name);
      drift.push(...indexerDrift);
    } catch {
      drift.push(indexer.name);
    }
  }
  return dedupStrings(drift, trimLower);
}

/** upsert_indexers: each indexer is tried; failures are reported, not fatal, unless all fail. */
async function upsertIndexers(client, indexers) {
  const report = { realized: 0, failures: [] };
  if (indexers.length === 0) return report;
  const schema = await client.list("indexer/schema");
  const existing = await client.list("indexer");
  const defaultAppProfileId = await resolveDefaultAppProfileId(client);
  for (const indexer of indexers) {
    try {
      const existingItem = findByName(existing, indexer.name, trimLower);
      const base = findRegistrySchema(schema, indexer.implementation) ?? existingItem;
      if (base === null) throw fail(`schema does not support implementation '${indexer.implementation}'`);
      const tags = await ensureTags(client, indexer.tags, trimLower);
      const target = indexerTarget(existingItem ?? base, indexer, tags, defaultAppProfileId);
      await upsert(client, "indexer", target, existingItem);
      report.realized += 1;
    } catch (error) {
      report.failures.push(`${indexer.name} (${indexer.implementation}): ${messageOf(error)}`);
    }
  }
  if (report.realized === 0) {
    if (report.failures.length === 0) throw fail("prowlarr did not apply any requested indexers");
    throw fail(`prowlarr could not apply any requested indexers: ${report.failures.join("; ")}`);
  }
  return report;
}

function appTarget(schema, existing, app, tags, prowlarrUrl) {
  const schemaItem = findRegistrySchema(schema, app.implementation);
  if (schemaItem === null) throw fail(`implementation '${app.implementation}' not found`);
  const existingItem = findAppByIdentity(existing, app);
  const target = clone(existingItem ?? schemaItem);
  setEnabled(target, app.enabled ?? true);
  setField(target, "name", app.name);
  if (get(target, "tags") !== undefined || tags.length > 0) setField(target, "tags", [...tags]);
  ensureSchemaFields(target, app.implementation);
  const fields = get(target, "fields");
  if (!Array.isArray(fields)) throw fail("app fields missing");
  applyAppFields(fields, app, prowlarrUrl);
  return { target, existingItem };
}

async function evaluateApps(client, apps, prowlarrUrl) {
  if (apps.length === 0) return [];
  const schema = await client.list("applications/schema");
  const existing = await client.list("applications");
  const drift = [];
  for (const app of apps) {
    const { ids, missing } = await resolveExistingTagIds(client, app.tags, trimLower);
    drift.push(...missing.map((tag) => `tag:${tag}`));
    const { target, existingItem } = appTarget(schema, existing, app, ids, prowlarrUrl);
    if (changed(existingItem, target)) drift.push(app.name);
  }
  return dedupStrings(drift, trimLower);
}

async function upsertApps(client, apps, prowlarrUrl) {
  if (apps.length === 0) return;
  const schema = await client.list("applications/schema");
  const existing = await client.list("applications");
  for (const app of apps) {
    const tags = app.tags.length === 0 ? [] : await ensureTags(client, app.tags, trimLower);
    const { target, existingItem } = appTarget(schema, existing, app, tags, prowlarrUrl);
    await upsert(client, "applications", target, existingItem);
  }
}

const prowlarrUrlOf = (request) =>
  typeof request?.providerUrl === "string" && request.providerUrl.trim() !== "" ? request.providerUrl : null;
const prowlarrClient = () => apiClient("prowlarr", "api/v1/");

async function evaluateRegistryPatch(patch, request) {
  if (patch.op === "register_indexers") {
    return driftEvaluation("Prowlarr indexers", await evaluateIndexers(prowlarrClient(), patch.indexers));
  }
  return driftEvaluation("Prowlarr apps", await evaluateApps(prowlarrClient(), patch.apps, prowlarrUrlOf(request)));
}

async function applyRegistryPatch(patch, request) {
  validatePatch(patch);
  if (patch.op === "register_indexers") {
    const report = await upsertIndexers(prowlarrClient(), patch.indexers);
    if (report.failures.length === 0) return { status: "applied", message: null };
    return {
      status: "applied",
      message: `Prowlarr indexers partially applied: ${report.realized} realized, ${report.failures.length} failed. Failures: ${report.failures.join("; ")}`,
    };
  }
  await upsertApps(prowlarrClient(), patch.apps, prowlarrUrlOf(request));
  return { status: "applied", message: null };
}

// ---- patch parsing (serde's shape checks) and validation (patches.rs validate)

const OPS = {
  sonarr: ["set_downloaders", "set_root_folders", "apply_quality_policy_preset"],
  radarr: ["set_downloaders", "set_root_folders", "apply_quality_policy_preset"],
  prowlarr: ["register_indexers", "register_app", "register_apps"],
};

function str(object, key, where) {
  const value = get(object, key);
  if (typeof value !== "string") throw invalid(`${where}.${key} must be a string`);
  return value;
}
function optional(object, key, where, type) {
  const value = get(object, key);
  if (value === undefined || value === null) return null;
  if (typeof value !== type) throw invalid(`${where}.${key} must be a ${type}`);
  return value;
}
function strings(object, key, where) {
  const value = get(object, key);
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string")) throw invalid(`${where}.${key} must be a list of strings`);
  return value;
}
function settings(object, where) {
  const value = get(object, "settings");
  if (value === undefined || value === null) return {};
  if (!isObject(value)) throw invalid(`${where}.settings must be an object`);
  return value;
}
function entries(object, key, where) {
  const value = get(object, key);
  if (!Array.isArray(value) || !value.every(isObject)) throw invalid(`${where}.${key} must be a list of objects`);
  return value;
}
function object(value, where) {
  if (!isObject(value)) throw invalid(`${where} must be an object`);
  return value;
}

const downloaderSpec = (value) => ({
  name: str(value, "name", "downloader"),
  type: str(value, "type", "downloader"),
  url: str(value, "url", "downloader"),
  api_key: optional(value, "api_key", "downloader", "string"),
  category: optional(value, "category", "downloader", "string"),
  tags: strings(value, "tags", "downloader"),
  enabled: optional(value, "enabled", "downloader", "boolean"),
  settings: settings(value, "downloader"),
});
const rootSpec = (value) => ({ path: str(value, "path", "root_folder"), default: optional(value, "default", "root_folder", "boolean") ?? false });
function policySpec(value) {
  const preset = str(value, "preset", "policy");
  if (!PRESETS.includes(preset)) throw invalid(`unknown quality policy preset ${JSON.stringify(preset)}`);
  return { preset, profile_name: str(value, "profile_name", "policy") };
}
function indexerSpec(value) {
  const auth = get(value, "auth") === undefined || get(value, "auth") === null ? {} : object(value.auth, "indexer.auth");
  return {
    name: str(value, "name", "indexer"),
    implementation: str(value, "implementation", "indexer"),
    url: str(value, "url", "indexer"),
    auth: { requires_account: optional(auth, "requires_account", "indexer.auth", "boolean"), required_fields: strings(auth, "required_fields", "indexer.auth") },
    api_key: optional(value, "api_key", "indexer", "string"),
    categories: strings(value, "categories", "indexer"),
    tags: strings(value, "tags", "indexer"),
    enabled: optional(value, "enabled", "indexer", "boolean"),
    settings: settings(value, "indexer"),
  };
}
const appSpec = (value) => ({
  name: str(value, "name", "app"),
  implementation: str(value, "implementation", "app"),
  url: str(value, "url", "app"),
  api_key: optional(value, "api_key", "app", "string"),
  categories: strings(value, "categories", "app"),
  tags: strings(value, "tags", "app"),
  enabled: optional(value, "enabled", "app", "boolean"),
  settings: settings(value, "app"),
});

/** request.patch as the server's typed patch; unsupported ops are refused. */
function parsePatch(member, request) {
  const patch = request?.patch;
  if (!isObject(patch) || typeof patch.op !== "string") throw invalid("request.patch with an op is required");
  if (!Object.hasOwn(OPS, member) || !OPS[member].includes(patch.op)) {
    throw new ManagerError(400, "unsupported_patch", `${member} does not support patch op ${patch.op}`);
  }
  switch (patch.op) {
    case "set_downloaders":
      return { op: patch.op, downloaders: entries(patch, "downloaders", "patch").map(downloaderSpec) };
    case "set_root_folders":
      return { op: patch.op, roots: entries(patch, "roots", "patch").map(rootSpec) };
    case "apply_quality_policy_preset":
      return { op: patch.op, policy: policySpec(object(patch.policy, "patch.policy")) };
    case "register_indexers":
      return { op: patch.op, indexers: entries(patch, "indexers", "patch").map(indexerSpec) };
    case "register_app":
      return { op: patch.op, single: true, apps: [appSpec(object(patch.app, "patch.app"))] };
    default:
      return { op: patch.op, apps: entries(patch, "apps", "patch").map(appSpec) };
  }
}

function ensureNonEmpty(value, field) {
  if (value.trim() === "") throw invalid(`${field} is required`);
}
function ensureOptionalNonEmpty(value, field) {
  if (value !== null) ensureNonEmpty(value, field);
}
function ensureNonEmptyList(values, field) {
  if (values.length === 0) throw invalid(`${field} is required`);
}
function validateTags(values, field) {
  for (const value of values) ensureNonEmpty(value, field);
}
function validateUrl(value) {
  if (value.trim() === "") throw invalid("url is required");
  const parsed = parseUrl(value);
  if (!parsed) throw invalid("parsing url");
  if (parsed.scheme !== "http" && parsed.scheme !== "https") throw invalid(`unsupported url scheme '${parsed.scheme}'`);
  if (parsed.host === null) throw invalid("url host is required");
  const host = parsed.host.trim();
  if (host === "") throw invalid("host is required");
  if (["localhost", "127.0.0.1", "0.0.0.0", "::1", "host.docker.internal"].includes(asciiLower(host))) {
    throw invalid(`host '${host}' is not allowed`);
  }
}
const CREDENTIAL_FIELDS = new Set(["username", "password", "api_key", "apikey"]);
function validateIndexer(indexer) {
  ensureNonEmpty(indexer.name, "indexer.name");
  ensureNonEmpty(indexer.implementation, "indexer.implementation");
  validateUrl(indexer.url);
  ensureOptionalNonEmpty(indexer.api_key, "indexer.api_key");
  const requiresAccount = indexer.auth.requires_account;
  if (requiresAccount === null) throw invalid("indexer.auth.requires_account is required");
  if (!requiresAccount && indexer.auth.required_fields.length > 0) {
    throw invalid("indexer.auth.required_fields is only allowed when requires_account is true");
  }
  if (requiresAccount) {
    const fields = indexer.auth.required_fields.length > 0 ? indexer.auth.required_fields : ["username", "password"];
    for (const field of fields) {
      if (!CREDENTIAL_FIELDS.has(trimLower(field))) throw invalid(`unsupported indexer auth field '${field}'`);
    }
  }
  validateTags(indexer.categories, "indexer.categories");
  validateTags(indexer.tags, "indexer.tags");
}
function validateApp(app) {
  ensureNonEmpty(app.name, "app.name");
  ensureNonEmpty(app.implementation, "app.implementation");
  validateUrl(app.url);
  ensureOptionalNonEmpty(app.api_key, "app.api_key");
  validateTags(app.categories, "app.categories");
  validateTags(app.tags, "app.tags");
}

/** The served ops' validate() from drivers/patches.rs. */
function validatePatch(patch) {
  switch (patch.op) {
    case "set_downloaders":
      ensureNonEmptyList(patch.downloaders, "downloaders");
      for (const downloader of patch.downloaders) {
        ensureNonEmpty(downloader.name, "downloader.name");
        ensureNonEmpty(downloader.type, "downloader.type");
        validateUrl(downloader.url);
        ensureOptionalNonEmpty(downloader.api_key, "downloader.api_key");
        ensureOptionalNonEmpty(downloader.category, "downloader.category");
        validateTags(downloader.tags, "downloader.tags");
      }
      return;
    case "set_root_folders":
      ensureNonEmptyList(patch.roots, "roots");
      for (const root of patch.roots) ensureNonEmpty(root.path, "root_folder.path");
      return;
    case "apply_quality_policy_preset":
      ensureNonEmpty(patch.policy.profile_name, "quality_policy.profile_name");
      return;
    case "register_indexers":
      ensureNonEmptyList(patch.indexers, "indexers");
      patch.indexers.forEach(validateIndexer);
      return;
    default:
      if (!patch.single) ensureNonEmptyList(patch.apps, "apps");
      patch.apps.forEach(validateApp);
  }
}

// ---- entry points

/** The member's drift for request.patch (the server's DriftEvaluation). */
export async function evaluatePatch(member, request) {
  const patch = parsePatch(member, request);
  if (member === "prowlarr") return evaluateRegistryPatch(patch, request);
  return evaluateManagerPatch(member, patch);
}

/** Applies request.patch to the member (the server's ApplyResult). */
export async function applyPatch(member, request) {
  const patch = parsePatch(member, request);
  if (member === "prowlarr") return applyRegistryPatch(patch, request);
  return applyManagerPatch(member, patch);
}
