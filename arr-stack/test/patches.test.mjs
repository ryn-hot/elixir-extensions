import assert from "node:assert/strict";
import test from "node:test";

import { forgetKeys } from "../src/arr.mjs";
import { applyPatch, evaluatePatch } from "../src/patches.mjs";
import radarrFormats from "../src/quality-policy-radarr-formats.mjs";
import sonarrFormats from "../src/quality-policy-sonarr-formats.mjs";

const SECRETS = { "sonarr.api_key": "s", "radarr.api_key": "r", "prowlarr.api_key": "p" };
const clone = (value) => JSON.parse(JSON.stringify(value));

/**
 * A stateful stand-in for one Arr app behind the shared stub. `data` maps an
 * API path (after api/<version>/) to its JSON: GET returns it, POST to a list
 * adds the body with the next id, PUT <list>/<id> replaces that item. Every
 * other path and version answers 404. `intercept(request)` may answer first.
 */
function arr(member, version, data, intercept = () => undefined) {
  forgetKeys();
  const state = { secrets: SECRETS, log: [], requests: [] };
  const route = (request) => {
    const prefix = `http://${member}.stack/api/${version}/`;
    if (!request.url.startsWith(prefix)) return { status: 404 };
    const path = request.url.slice(prefix.length);
    const body = request.body === null ? undefined : JSON.parse(request.body);
    const early = intercept({ method: request.method, path, body });
    if (early) return early;
    if (request.method === "GET" && Object.hasOwn(data, path)) return { body: data[path] };
    if (request.method === "POST" && Array.isArray(data[path])) {
      const created = { ...body, id: Math.max(0, ...data[path].map((item) => item.id ?? 0)) + 1 };
      data[path].push(created);
      return { status: 201, body: created };
    }
    const match = /^(.*)\/(\d+)$/.exec(path);
    if (request.method === "PUT" && match && Array.isArray(data[match[1]])) {
      const index = data[match[1]].findIndex((item) => item.id === Number(match[2]));
      if (index >= 0) {
        data[match[1]][index] = body;
        return { status: 202, body };
      }
    }
    return { status: 404 };
  };
  let seen = null;
  let reply = null;
  const respond = () => {
    const last = state.requests[state.requests.length - 1];
    if (last !== seen) {
      seen = last;
      reply = route(last);
    }
    return reply;
  };
  // One catch-all route whose reply is computed from the request just recorded.
  state.routes = [{
    contains: "",
    get status() { return respond().status ?? 200; },
    get body() { return respond().body === undefined ? "" : JSON.stringify(respond().body); },
  }];
  globalThis.__elixirTestSdk = state;
  return state;
}

const calls = (state) => state.requests.map(({ method, url }) => `${method} ${url.replace(/^http:\/\/[a-z]+\.stack\//, "")}`);
const sent = (state, method, path) =>
  state.requests.filter((request) => request.method === method && request.url.endsWith(`/${path}`)).map((request) => JSON.parse(request.body));
const writes = (state) => calls(state).filter((call) => !call.startsWith("GET "));
const inSync = { status: "in_sync", message: null, nonComparableFields: [] };
const drifted = (message) => ({ status: "drifted", message, nonComparableFields: [] });

// ---- unsupported ops

test("ops a member does not serve are refused before any request", async () => {
  const state = arr("sonarr", "v3", {});
  const cases = [
    ["sonarr", "set_tags"],
    ["sonarr", "set_custom_formats"],
    ["radarr", "register_apps"],
    ["prowlarr", "set_root_folders"],
    ["prowlarr", "register_indexer_proxies"],
    ["qbittorrent", "set_categories"],
  ];
  for (const [member, op] of cases) {
    for (const call of [evaluatePatch, applyPatch]) {
      await assert.rejects(call(member, { patch: { op } }), (error) => error.status === 400 && error.code === "unsupported_patch");
    }
  }
  assert.equal(state.requests.length, 0);
});

// ---- set_root_folders

test("Sonarr probes v3 then v4 once, reads its version, then uses that API version", async () => {
  const state = arr("sonarr", "v4", { "system/status": { version: "4.0.14.2939" }, rootfolder: [{ id: 1, path: "/tv" }] });
  const result = await evaluatePatch("sonarr", { patch: { op: "set_root_folders", roots: [{ path: "/tv", default: true }] } });
  assert.deepEqual(result, inSync);
  assert.deepEqual(calls(state), ["GET api/v3/system/status", "GET api/v4/system/status", "GET api/v4/system/status", "GET api/v4/rootfolder"]);
});

test("Sonarr root folders: exact path match, drift lists each missing path, apply posts them", async () => {
  const data = { "system/status": { version: "4.0.0" }, rootfolder: [{ id: 1, path: "/tv" }] };
  const state = arr("sonarr", "v3", data);
  const patch = { op: "set_root_folders", roots: [{ path: "/tv", default: true }, { path: "/TV", default: false }, { path: "/anime", default: false }] };
  // evaluate_root_folders does not dedup and compares paths exactly.
  assert.deepEqual(
    await evaluatePatch("sonarr", { patch: { ...patch, roots: [...patch.roots, { path: "/anime", default: false }] } }),
    drifted("Sonarr root folders require repair: /TV, /anime, /anime"),
  );
  state.requests.length = 0;
  assert.deepEqual(await applyPatch("sonarr", { patch }), { status: "applied", message: null });
  assert.deepEqual(writes(state), ["POST api/v3/rootfolder", "POST api/v3/rootfolder"]);
  assert.deepEqual(sent(state, "POST", "rootfolder"), [{ path: "/TV" }, { path: "/anime" }]);
  assert.deepEqual(await evaluatePatch("sonarr", { patch }), inSync);
});

test("Radarr root folders compare normalized paths and probe only system/status once", async () => {
  const state = arr("radarr", "v3", { "system/status": { version: "5.2.6" }, rootfolder: [{ id: 1, path: "/Movies " }] });
  const patch = { op: "set_root_folders", roots: [{ path: "/movies", default: true }] };
  assert.deepEqual(await evaluatePatch("radarr", { patch }), inSync);
  assert.deepEqual(calls(state), ["GET api/v3/system/status", "GET api/v3/rootfolder"]);
  state.requests.length = 0;
  await applyPatch("radarr", { patch: { ...patch, roots: [{ path: "/films", default: false }] } });
  assert.deepEqual(sent(state, "POST", "rootfolder"), [{ path: "/films" }]);
});

// ---- set_downloaders

const field = (order, name, label, type, value) => (value === undefined ? { order, name, label, type } : { order, name, label, value, type });
function qbitSchema(category) {
  return {
    enable: false,
    protocol: "torrent",
    priority: 1,
    name: "",
    fields: [
      field(0, "host", "Host", "textbox", "localhost"),
      field(1, "port", "Port", "textbox", 8080),
      field(2, "useSsl", "Use SSL", "checkbox", false),
      field(3, "urlBase", "URL Base", "textbox"),
      field(4, "username", "Username", "textbox"),
      field(5, "password", "Password", "password"),
      field(6, category, "Category", "textbox", "default"),
    ],
    implementationName: "qBittorrent",
    implementation: "QBittorrent",
    configContract: "QBittorrentSettings",
    tags: [],
  };
}
const nzbgetSchema = () => ({ ...qbitSchema("tvCategory"), implementationName: "NZBGet", implementation: "Nzbget", configContract: "NzbgetSettings" });
const downloader = (overrides) => ({
  name: "qBittorrent",
  type: "qbittorrent",
  url: "http://elx-qbittorrent:8080/",
  api_key: null,
  category: "tv",
  tags: ["elixir"],
  enabled: true,
  settings: { username: "admin", password: "pw" },
  ...overrides,
});

test("Sonarr download clients: apply to an empty manager creates the tag and the client, then it is in sync", async () => {
  const data = {
    "system/status": { version: "4.0.0" },
    "downloadclient/schema": [nzbgetSchema(), qbitSchema("tvCategory")],
    downloadclient: [],
    tag: [],
  };
  const state = arr("sonarr", "v3", data);
  const patch = { op: "set_downloaders", downloaders: [downloader()] };
  assert.deepEqual(await evaluatePatch("sonarr", { patch }), drifted("Sonarr download clients require repair: tag:elixir, qBittorrent"));
  state.requests.length = 0;

  assert.deepEqual(await applyPatch("sonarr", { patch }), { status: "applied", message: null });
  assert.deepEqual(calls(state), [
    "GET api/v3/system/status",
    "GET api/v3/system/status",
    "GET api/v3/downloadclient/schema",
    "GET api/v3/downloadclient",
    "GET api/v3/tag",
    "POST api/v3/tag",
    "POST api/v3/downloadclient",
  ]);
  assert.deepEqual(sent(state, "POST", "tag"), [{ label: "elixir" }]);
  // No baseUrl/url field, so host and port come from the URL (apply_url_fields).
  assert.deepEqual(sent(state, "POST", "downloadclient"), [{
    enable: true,
    protocol: "torrent",
    priority: 1,
    name: "qBittorrent",
    fields: [
      field(0, "host", "Host", "textbox", "elx-qbittorrent"),
      field(1, "port", "Port", "textbox", 8080),
      field(2, "useSsl", "Use SSL", "checkbox", false),
      field(3, "urlBase", "URL Base", "textbox"),
      field(4, "username", "Username", "textbox", "admin"),
      field(5, "password", "Password", "password", "pw"),
      field(6, "tvCategory", "Category", "textbox", "tv"),
    ],
    implementationName: "qBittorrent",
    implementation: "QBittorrent",
    configContract: "QBittorrentSettings",
    tags: [1],
  }]);

  state.requests.length = 0;
  assert.deepEqual(await evaluatePatch("sonarr", { patch }), inSync);
  await applyPatch("sonarr", { patch });
  assert.deepEqual(writes(state), []);
});

test("Sonarr download clients drift lists missing tags and clients once (dedup_strings)", async () => {
  const existing = { ...clone(qbitSchema("tvCategory")), id: 4, enable: true, name: "qBittorrent", tags: [1] };
  existing.fields[0].value = "elx-qbittorrent";
  existing.fields[4].value = "admin";
  existing.fields[5].value = "pw";
  existing.fields[6].value = "tv";
  arr("sonarr", "v3", {
    "system/status": { version: "4.0.0" },
    "downloadclient/schema": [qbitSchema("tvCategory"), nzbgetSchema()],
    downloadclient: [existing],
    tag: [{ id: 1, label: "Elixir" }],
  });
  const patch = {
    op: "set_downloaders",
    downloaders: [
      downloader(),
      downloader({ name: "NZBGet", type: "Nzbget", url: "http://elx-nzbget:6789", tags: ["elixir", "usenet"] }),
      downloader({ name: "nzbget", type: "Nzbget", url: "http://elx-nzbget:6789", tags: ["usenet"] }),
    ],
  };
  assert.deepEqual(await evaluatePatch("sonarr", { patch }), drifted("Sonarr download clients require repair: tag:usenet, NZBGet"));
});

test("Radarr download clients: https URL sets host, port and SSL, movieCategory, and PUTs the existing client", async () => {
  const existing = { ...clone(qbitSchema("movieCategory")), id: 3, enable: true, name: "qBittorrent", tags: [1] };
  const data = {
    "system/status": { version: "5.2.6" },
    "downloadclient/schema": [qbitSchema("movieCategory")],
    downloadclient: [existing],
    tag: [{ id: 1, label: "elixir" }],
  };
  const state = arr("radarr", "v3", data);
  const patch = { op: "set_downloaders", downloaders: [downloader({ url: "https://elx-qbittorrent:9443", category: "movies" })] };
  assert.deepEqual(await evaluatePatch("radarr", { patch }), drifted("Radarr download clients require repair: qBittorrent"));
  state.requests.length = 0;

  await applyPatch("radarr", { patch });
  assert.deepEqual(calls(state), [
    "GET api/v3/system/status",
    "GET api/v3/downloadclient/schema",
    "GET api/v3/downloadclient",
    "GET api/v3/tag",
    "PUT api/v3/downloadclient/3",
  ]);
  const [body] = sent(state, "PUT", "downloadclient/3");
  assert.equal(body.id, 3);
  assert.deepEqual(body.fields.map((entry) => [entry.name, entry.value]), [
    ["host", "elx-qbittorrent"],
    ["port", 9443],
    ["useSsl", true],
    ["urlBase", undefined],
    ["username", "admin"],
    ["password", "pw"],
    ["movieCategory", "movies"],
  ]);
  assert.deepEqual(await evaluatePatch("radarr", { patch }), inSync);
});

test("Sonarr apply validates the patch first (drivers/patches.rs) and sends nothing when it is invalid", async () => {
  const state = arr("sonarr", "v3", {});
  const invalid = (message) => (error) => error.status === 400 && error.code === "invalid_patch" && error.message === message;
  await assert.rejects(
    applyPatch("sonarr", { patch: { op: "set_downloaders", downloaders: [downloader({ url: "http://localhost:8080" })] } }),
    invalid("host 'localhost' is not allowed"),
  );
  await assert.rejects(applyPatch("sonarr", { patch: { op: "set_root_folders", roots: [] } }), invalid("roots is required"));
  await assert.rejects(
    applyPatch("sonarr", { patch: { op: "apply_quality_policy_preset", policy: { preset: "modern_codecs", profile_name: " " } } }),
    invalid("quality_policy.profile_name is required"),
  );
  await assert.rejects(
    evaluatePatch("sonarr", { patch: { op: "apply_quality_policy_preset", policy: { preset: "best", profile_name: "x" } } }),
    (error) => error.code === "invalid_patch",
  );
  assert.equal(state.requests.length, 0);
});

// ---- apply_quality_policy_preset

const quality = (id, name, allowed) => ({ quality: { id, name }, items: [], allowed });
const group = (id, name, allowed, items) => ({ id, name, allowed, items });
function anyProfile() {
  return {
    id: 1,
    name: "Any",
    upgradeAllowed: false,
    cutoff: 1,
    minFormatScore: 0,
    cutoffFormatScore: 0,
    minUpgradeFormatScore: 1,
    formatItems: [],
    items: [
      quality(0, "Unknown", false),
      quality(1, "SDTV", true),
      quality(2, "DVD", true),
      quality(4, "HDTV-720p", true),
      quality(9, "HDTV-1080p", true),
      group(1001, "WEB 720p", true, [quality(14, "WEBRip-720p", true), quality(5, "WEBDL-720p", true)]),
      quality(6, "Bluray-720p", true),
      group(1002, "WEB 1080p", true, [quality(15, "WEBRip-1080p", true), quality(3, "WEBDL-1080p", true)]),
      quality(7, "Bluray-1080p", true),
      quality(16, "HDTV-2160p", false),
      group(1003, "WEB 2160p", false, [quality(17, "WEBRip-2160p", false), quality(18, "WEBDL-2160p", false)]),
      quality(19, "Bluray-2160p", false),
    ],
  };
}
/** A vendored format as the driver sends it: `fields` maps become [{name, value}]. */
function vendoredBody(formats, name) {
  const format = Object.values(formats).find((entry) => entry.name === name);
  return {
    name,
    includeCustomFormatWhenRenaming: format.includeCustomFormatWhenRenaming === true,
    specifications: format.specifications.map((spec) => ({
      ...spec,
      fields: Object.entries(spec.fields).map(([key, value]) => ({ name: key, value })),
    })),
  };
}

// The modern_codecs HD plan for Sonarr: TRaSH defaults, x265 (HD) and AV1
// unblocked, x265 (no HDR/DV) added at 0 (quality_policy.rs).
const SONARR_MODERN_CODECS = [
  ["BR-DISK", -10000], ["LQ", -10000], ["LQ (Release Title)", -10000], ["x265 (HD)", 0], ["Extras", -10000], ["AV1", 0],
  ["Repack/Proper", 5], ["Repack2", 6], ["Repack3", 7],
  ...["AMZN", "ATVP", "CC", "DCU", "DSCP", "DSNP", "HBO", "HMAX", "HULU", "iT", "MAX", "NF", "PCOK", "PMTP", "SHO", "STAN", "SYFY", "HD Streaming Boost"].map((name) => [name, 75]),
  ["WEB Tier 01", 1700], ["WEB Tier 02", 1650], ["WEB Tier 03", 1600], ["WEB Scene", 1600], ["x265 (no HDR/DV)", 0],
];

test("Sonarr modern codecs preset on an empty manager: profile from the template, every format, exact scores", async () => {
  const data = { "system/status": { version: "4.0.0" }, qualityprofile: [anyProfile()], customformat: [] };
  const state = arr("sonarr", "v3", data);
  const patch = { op: "apply_quality_policy_preset", policy: { preset: "modern_codecs", profile_name: "Elixir Modern Codecs" } };
  assert.deepEqual(
    await evaluatePatch("sonarr", { patch }),
    drifted(`Sonarr quality policy preset require repair: Elixir Modern Codecs, ${SONARR_MODERN_CODECS.map(([name]) => name).join(", ")}`),
  );
  state.requests.length = 0;

  assert.deepEqual(await applyPatch("sonarr", { patch }), { status: "applied", message: null });
  assert.deepEqual(calls(state), [
    "GET api/v3/system/status",
    "GET api/v3/system/status",
    "GET api/v3/qualityprofile",
    "POST api/v3/qualityprofile",
    "GET api/v3/customformat",
    ...SONARR_MODERN_CODECS.map(() => "POST api/v3/customformat"),
    "GET api/v3/customformat",
    "GET api/v3/qualityprofile",
    "PUT api/v3/qualityprofile/2",
  ]);

  const profile = {
    name: "Elixir Modern Codecs",
    upgradeAllowed: true,
    cutoff: 1002, // the "WEB 1080p" group
    minFormatScore: 0,
    cutoffFormatScore: 10000,
    minUpgradeFormatScore: 1,
    formatItems: [],
    items: [
      quality(0, "Unknown", false),
      quality(1, "SDTV", false),
      quality(2, "DVD", true),
      quality(4, "HDTV-720p", true),
      quality(9, "HDTV-1080p", true),
      group(1001, "WEB 720p", true, [quality(14, "WEBRip-720p", true), quality(5, "WEBDL-720p", true)]),
      quality(6, "Bluray-720p", true),
      group(1002, "WEB 1080p", true, [quality(15, "WEBRip-1080p", true), quality(3, "WEBDL-1080p", true)]),
      quality(7, "Bluray-1080p", true),
      quality(16, "HDTV-2160p", false),
      group(1003, "WEB 2160p", false, [quality(17, "WEBRip-2160p", false), quality(18, "WEBDL-2160p", false)]),
      quality(19, "Bluray-2160p", false),
    ],
  };
  assert.deepEqual(sent(state, "POST", "qualityprofile"), [profile]);

  const formats = sent(state, "POST", "customformat");
  assert.deepEqual(formats, SONARR_MODERN_CODECS.map(([name]) => vendoredBody(sonarrFormats, name)));
  assert.deepEqual(formats[5], {
    name: "AV1",
    includeCustomFormatWhenRenaming: false,
    specifications: [{ name: "AV1", implementation: "ReleaseTitleSpecification", negate: false, required: true, fields: [{ name: "value", value: "\\bAV1\\b" }] }],
  });
  assert.equal(formats[9].includeCustomFormatWhenRenaming, true); // AMZN

  // Formats were created with ids 1..32 in plan order; formatItems are sorted by id.
  assert.deepEqual(sent(state, "PUT", "qualityprofile/2"), [{
    ...profile,
    id: 2,
    formatItems: SONARR_MODERN_CODECS.map(([, score], index) => ({ format: index + 1, score })),
  }]);

  state.requests.length = 0;
  assert.deepEqual(await evaluatePatch("sonarr", { patch }), inSync);
  await applyPatch("sonarr", { patch });
  assert.deepEqual(writes(state), []);

  // A changed score drifts the profile only; a missing format drifts both.
  data.qualityprofile[1].formatItems[5].score = -10000;
  assert.deepEqual(await evaluatePatch("sonarr", { patch }), drifted("Sonarr quality policy preset require repair: Elixir Modern Codecs"));
  data.customformat.splice(5, 1);
  assert.deepEqual(await evaluatePatch("sonarr", { patch }), drifted("Sonarr quality policy preset require repair: AV1, Elixir Modern Codecs"));
});

// The stock TRaSH UHD plan for Radarr (RADARR_UHD_BASE with TRaSH defaults).
const RADARR_STOCK_4K = [
  ["HDR", 500], ["DV Boost", 1000], ["HDR10+ Boost", 100], ["DV (w/o HDR fallback)", -10000], ["Generated Dynamic HDR", -10000],
  ["x265 (no HDR/DV)", -10000], ["BR-DISK", -10000], ["LQ", -10000], ["LQ (Release Title)", -10000], ["Extras", -10000], ["AV1", -10000],
  ["Repack/Proper", 5], ["Repack2", 6], ["Repack3", 7],
  ["AMZN", 0], ["ATV", 0], ["ATVP", 0], ["BCORE", 15], ["CRiT", 20], ["DSNP", 0], ["HBO", 0], ["HMAX", 0], ["Hulu", 0], ["iT", 0],
  ["MA", 20], ["MAX", 0], ["NF", 0], ["PCOK", 0], ["PMTP", 0], ["PLAY", 0], ["ROKU", 0], ["STAN", 0],
  ["UHD Bluray Tier 01", 1800], ["UHD Bluray Tier 02", 1750], ["UHD Bluray Tier 03", 1700],
  ["WEB Tier 01", 1700], ["WEB Tier 02", 1650], ["WEB Tier 03", 1600],
];

test("Radarr stock TRaSH 4K preset on an empty manager: UHD qualities, group flags untouched, exact scores", async () => {
  const template = anyProfile();
  const data = { "system/status": { version: "5.2.6" }, qualityprofile: [template], customformat: [] };
  const state = arr("radarr", "v3", data);
  const patch = { op: "apply_quality_policy_preset", policy: { preset: "stock_trash", profile_name: "Elixir TRaSH 4K" } };
  await applyPatch("radarr", { patch });
  assert.deepEqual(calls(state).slice(0, 4), ["GET api/v3/system/status", "GET api/v3/qualityprofile", "POST api/v3/qualityprofile", "GET api/v3/customformat"]);

  // Radarr's update_quality_items sets only quality entries: groups keep
  // their template flag, and the cutoff is a quality (Bluray-2160p).
  const [profile] = sent(state, "POST", "qualityprofile");
  assert.equal(profile.cutoff, 19);
  assert.equal(profile.id, undefined);
  assert.deepEqual(profile.items, [
    quality(0, "Unknown", false),
    quality(1, "SDTV", false),
    quality(2, "DVD", false),
    quality(4, "HDTV-720p", false),
    quality(9, "HDTV-1080p", false),
    group(1001, "WEB 720p", true, [quality(14, "WEBRip-720p", false), quality(5, "WEBDL-720p", false)]),
    quality(6, "Bluray-720p", false),
    group(1002, "WEB 1080p", true, [quality(15, "WEBRip-1080p", false), quality(3, "WEBDL-1080p", false)]),
    quality(7, "Bluray-1080p", false),
    quality(16, "HDTV-2160p", false),
    group(1003, "WEB 2160p", false, [quality(17, "WEBRip-2160p", true), quality(18, "WEBDL-2160p", true)]),
    quality(19, "Bluray-2160p", true),
  ]);

  assert.deepEqual(sent(state, "POST", "customformat"), RADARR_STOCK_4K.map(([name]) => vendoredBody(radarrFormats, name)));
  const [scored] = sent(state, "PUT", "qualityprofile/2");
  assert.deepEqual(scored.formatItems, RADARR_STOCK_4K.map(([, score], index) => ({ format: index + 1, score })));

  state.requests.length = 0;
  assert.deepEqual(await evaluatePatch("radarr", { patch }), inSync);
  assert.deepEqual(writes(state), []);
});

test("Radarr storage saver preset on a manager that already has it is in sync and writes nothing", async () => {
  const data = { "system/status": { version: "5.2.6" }, qualityprofile: [anyProfile()], customformat: [] };
  const state = arr("radarr", "v3", data);
  const patch = { op: "apply_quality_policy_preset", policy: { preset: "storage_saver", profile_name: "Elixir Storage Saver" } };
  await applyPatch("radarr", { patch });
  const scores = Object.fromEntries(data.customformat.map((format) => [format.name, data.qualityprofile[1].formatItems.find((item) => item.format === format.id).score]));
  assert.equal(scores["x265 (HD)"], 25);
  assert.equal(scores.AV1, 25);
  assert.equal(scores["x265 (no HDR/DV)"], 25);
  assert.equal(scores["WEB Tier 01"], 1700);
  state.requests.length = 0;
  assert.deepEqual(await evaluatePatch("radarr", { patch }), inSync);
  await applyPatch("radarr", { patch });
  assert.deepEqual(writes(state), []);
});

// ---- Prowlarr register_indexers

const torznab = () => ({
  implementation: "Torznab",
  implementationName: "Torznab",
  name: "Generic Torznab",
  configContract: "TorznabSettings",
  enable: false,
  appProfileId: 0,
  priority: 25,
  fields: [{ name: "baseUrl", value: "" }, { name: "apiPath", value: "/api" }, { name: "apiKey" }, { name: "categories", value: [] }],
  tags: [],
});
const limetorrents = () => ({
  implementation: "Cardigann",
  implementationName: "Cardigann",
  name: "LimeTorrents",
  definitionName: "limetorrents",
  configContract: "CardigannSettings",
  enable: false,
  appProfileId: 0,
  fields: [{ name: "definitionFile", value: "limetorrents" }, { name: "baseUrl" }, { name: "downloadlink", value: 0 }],
  tags: [],
});
const indexer = (overrides) => ({
  name: "AnimeTosho",
  implementation: "Torznab",
  url: "https://feed.animetosho.org",
  auth: { requires_account: false, required_fields: [] },
  api_key: null,
  categories: [],
  tags: ["elixir", "public"],
  enabled: true,
  settings: {},
  ...overrides,
});
const prowlarrData = () => ({
  "indexer/schema": [torznab(), limetorrents()],
  indexer: [],
  appProfile: [{ name: "Minimal", id: 2 }, { name: "Standard", id: 1 }],
  tag: [],
});

test("Prowlarr indexers: schema match by name, Standard app profile, created tags; then in sync", async () => {
  const data = prowlarrData();
  const state = arr("prowlarr", "v1", data);
  const patch = {
    op: "register_indexers",
    indexers: [indexer(), indexer({ name: "LimeTorrents", implementation: "limetorrents", url: "https://limetorrents.ninjaproxy1.com/", settings: { downloadlink: 1 } })],
  };
  assert.deepEqual(
    await evaluatePatch("prowlarr", { patch }),
    drifted("Prowlarr indexers require repair: tag:elixir, tag:public, AnimeTosho, LimeTorrents"),
  );
  state.requests.length = 0;

  assert.deepEqual(await applyPatch("prowlarr", { patch }), { status: "applied", message: null });
  assert.deepEqual(calls(state), [
    "GET api/v1/indexer/schema",
    "GET api/v1/indexer",
    "GET api/v1/appProfile",
    "GET api/v1/tag",
    "POST api/v1/tag",
    "POST api/v1/tag",
    "POST api/v1/indexer",
    "GET api/v1/tag",
    "POST api/v1/indexer",
  ]);
  assert.deepEqual(sent(state, "POST", "tag"), [{ label: "elixir" }, { label: "public" }]);
  assert.deepEqual(sent(state, "POST", "indexer"), [
    {
      ...torznab(),
      name: "AnimeTosho",
      enable: true,
      appProfileId: 1,
      tags: [1, 2],
      fields: [{ name: "baseUrl", value: "https://feed.animetosho.org" }, { name: "apiPath", value: "/api" }, { name: "apiKey" }, { name: "categories", value: [] }],
    },
    {
      ...limetorrents(),
      enable: true,
      appProfileId: 1,
      tags: [1, 2],
      fields: [
        { name: "definitionFile", value: "limetorrents" },
        { name: "baseUrl", value: "https://limetorrents.ninjaproxy1.com/" },
        { name: "downloadlink", value: 1 },
      ],
    },
  ]);

  state.requests.length = 0;
  assert.deepEqual(await evaluatePatch("prowlarr", { patch }), inSync);
  await applyPatch("prowlarr", { patch });
  assert.deepEqual(writes(state), []);
});

test("Prowlarr indexers: one failure is reported and the rest applied; all failing is an error", async () => {
  const state = arr("prowlarr", "v1", prowlarrData(), ({ method, path, body }) =>
    method === "POST" && path === "indexer" && body.name === "Broken"
      ? { status: 400, body: [{ errorMessage: "Unable to connect to indexer", severity: "error" }] }
      : undefined);
  const patch = {
    op: "register_indexers",
    indexers: [indexer({ tags: [] }), indexer({ name: "Broken", url: "https://broken.example", tags: [] }), indexer({ name: "SubsPlease", url: "https://subsplease.org", tags: [] })],
  };
  const result = await applyPatch("prowlarr", { patch });
  assert.deepEqual(sent(state, "POST", "indexer").map((body) => body.name), ["AnimeTosho", "Broken", "SubsPlease"]);
  assert.deepEqual(result, {
    status: "applied",
    message:
      "Prowlarr indexers partially applied: 2 realized, 1 failed. Failures: Broken (Torznab): " +
      'POST api/v1/indexer failed (400): [{"errorMessage":"Unable to connect to indexer","severity":"error"}]',
  });

  arr("prowlarr", "v1", prowlarrData());
  await assert.rejects(
    applyPatch("prowlarr", { patch: { op: "register_indexers", indexers: [indexer({ name: "Unsupported", implementation: "Nope", tags: [] })] } }),
    (error) => error.code === "patch_failed" && error.message === "prowlarr could not apply any requested indexers: Unsupported (Nope): schema does not support implementation 'Nope'",
  );
});

test("Prowlarr indexers: an indexer that cannot be evaluated is drift, not an error", async () => {
  const state = arr("prowlarr", "v1", prowlarrData());
  const patch = { op: "register_indexers", indexers: [indexer({ tags: [] }), indexer({ name: "Unsupported", implementation: "Nope", tags: [] })] };
  assert.deepEqual(await evaluatePatch("prowlarr", { patch }), drifted("Prowlarr indexers require repair: AnimeTosho, Unsupported"));
  assert.deepEqual(writes(state), []);
  await assert.rejects(
    applyPatch("prowlarr", { patch: { op: "register_indexers", indexers: [indexer({ auth: { requires_account: null, required_fields: [] } })] } }),
    (error) => error.code === "invalid_patch" && error.message === "indexer.auth.requires_account is required",
  );
});

// ---- Prowlarr register_apps / register_app

const appSchema = (name) => ({
  name,
  implementation: name,
  fields: [{ name: "prowlarrUrl", value: "" }, { name: "baseUrl", value: "" }, { name: "apiKey", value: "" }, { name: "syncCategories", value: [] }],
  tags: [],
});
const app = (overrides) => ({
  name: "Sonarr",
  implementation: "Sonarr",
  url: "http://elx-sonarr:8989",
  api_key: "abc",
  categories: ["5000"],
  tags: [],
  enabled: true,
  settings: {},
  ...overrides,
});

test("Prowlarr apps: an existing tag filter is drift and apply clears it with the normalized prowlarrUrl", async () => {
  const data = {
    "applications/schema": [appSchema("Sonarr"), appSchema("Radarr")],
    applications: [{
      id: 5,
      name: "Sonarr",
      implementation: "Sonarr",
      tags: [2],
      fields: [
        { name: "prowlarrUrl", value: "http://elx-prowlarr:9696/" },
        { name: "baseUrl", value: "http://elx-sonarr:8989" },
        { name: "apiKey", value: "abc" },
        { name: "syncCategories", value: [5000] },
      ],
    }],
    tag: [{ id: 2, label: "elixir" }],
  };
  const state = arr("prowlarr", "v1", data);
  const request = { patch: { op: "register_apps", apps: [app()] }, providerUrl: "http://elx-prowlarr:9696" };
  assert.deepEqual(await evaluatePatch("prowlarr", request), drifted("Prowlarr apps require repair: Sonarr"));
  assert.deepEqual(calls(state), ["GET api/v1/applications/schema", "GET api/v1/applications"]);
  state.requests.length = 0;

  assert.deepEqual(await applyPatch("prowlarr", request), { status: "applied", message: null });
  assert.deepEqual(writes(state), ["PUT api/v1/applications/5"]);
  assert.deepEqual(sent(state, "PUT", "applications/5"), [{
    id: 5,
    name: "Sonarr",
    implementation: "Sonarr",
    tags: [],
    enabled: true,
    configContract: "SonarrSettings",
    fields: [
      { name: "prowlarrUrl", value: "http://elx-prowlarr:9696/" },
      { name: "baseUrl", value: "http://elx-sonarr:8989" },
      { name: "apiKey", value: "abc" },
      { name: "syncCategories", value: [5000] },
    ],
  }]);
  assert.deepEqual(await evaluatePatch("prowlarr", request), inSync);
});

test("Prowlarr register_app: identity needs the same app URL, so a moved app is created from the schema", async () => {
  const data = {
    "applications/schema": [appSchema("Sonarr"), appSchema("Radarr")],
    applications: [{ id: 8, name: "radarr", implementation: "radarr", fields: [{ name: "baseUrl", value: "http://elx-radarr:8888/" }] }],
    tag: [{ id: 2, label: "elixir" }],
  };
  const state = arr("prowlarr", "v1", data);
  // Without request.prowlarrUrl the app's prowlarrUrl is left as Prowlarr has it.
  const request = { patch: { op: "register_app", app: app({ name: "Radarr", implementation: "Radarr", url: "http://elx-radarr:7878", api_key: "def", categories: ["2000"], tags: ["elixir"] }) } };
  assert.deepEqual(await evaluatePatch("prowlarr", request), drifted("Prowlarr apps require repair: Radarr"));
  state.requests.length = 0;
  await applyPatch("prowlarr", request);
  assert.deepEqual(writes(state), ["POST api/v1/applications"]);
  assert.deepEqual(sent(state, "POST", "applications"), [{
    name: "Radarr",
    implementation: "Radarr",
    fields: [
      { name: "prowlarrUrl", value: "" },
      { name: "baseUrl", value: "http://elx-radarr:7878" },
      { name: "apiKey", value: "def" },
      { name: "syncCategories", value: [2000] },
    ],
    tags: [2],
    enabled: true,
    configContract: "RadarrSettings",
  }]);
  assert.deepEqual(await evaluatePatch("prowlarr", request), inSync);
});
