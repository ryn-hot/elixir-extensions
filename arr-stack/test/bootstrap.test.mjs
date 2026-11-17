import assert from "node:assert/strict";
import test from "node:test";

import { forgetKeys } from "../src/arr.mjs";
import { parseApiKey, requiresNormalization } from "../src/bootstrap.mjs";
import { invoke } from "../src/main.mjs";

function sdk(routes) {
  forgetKeys();
  const state = { secrets: { "prowlarr.api_key": "p" }, routes, log: [], requests: [] };
  globalThis.__elixirTestSdk = state;
  return state;
}
const call = (capability, member, operation, request = {}) =>
  invoke({ schema_version: 1, capability, member, operation, request });
const json = (contains, body, extra = {}) => ({ contains, status: 200, body: JSON.stringify(body), ...extra });
const XML = "<Config>\n  <Port>8989</Port>\n  <ApiKey> a1b2&amp;c3 </ApiKey>\n</Config>";

test("API key parsing matches the server's", () => {
  assert.equal(parseApiKey(XML), "a1b2&c3");
  assert.equal(parseApiKey("<Config><ApiKey></ApiKey></Config>"), null);
  assert.equal(parseApiKey("<Config/>"), null);
  assert.equal(requiresNormalization({ authenticationMethod: "None" }), true);
  assert.equal(requiresNormalization({ authenticationMethod: "Forms", authenticationRequired: "Enabled" }), true);
  assert.equal(requiresNormalization({ authenticationMethod: "forms", authenticationRequired: "disabledForLocalAddresses" }), false);
});

test("every member names config.xml", async () => {
  sdk([]);
  for (const [capability, member] of [["media.manager", "sonarr"], ["media.manager", "radarr"], ["indexer.list", "prowlarr"]]) {
    assert.deepEqual((await call(capability, member, "bootstrap_files")).body, { files: ["config.xml"] });
  }
});

test("bootstrap returns the key and switches no-login to forms for remote access", async () => {
  const state = sdk([
    json("api/v3/config/host", { authenticationMethod: "none", authenticationRequired: "enabled", port: 8989 }, { method: "GET" }),
    json("api/v3/config/host", {}, { method: "PUT" }),
  ]);
  const result = await call("media.manager", "sonarr", "bootstrap", {
    files: { "config.xml": XML },
    login: { username: "elixir", password: "secret" },
  });
  assert.deepEqual(result.body, { apiKey: "a1b2&c3" });
  assert.equal(state.requests[0].headers["x-api-key"], "a1b2&c3");
  const put = JSON.parse(state.requests.find((r) => r.method === "PUT").body);
  assert.deepEqual(put, {
    authenticationMethod: "forms",
    authenticationRequired: "disabledForLocalAddresses",
    port: 8989,
    username: "elixir",
    password: "secret",
    passwordConfirmation: "secret",
  });
});

test("bootstrap leaves an already-normal login alone and waits without a key", async () => {
  const state = sdk([json("api/v1/config/host", { authenticationMethod: "forms", authenticationRequired: "disabledForLocalAddresses" })]);
  const done = await call("indexer.list", "prowlarr", "bootstrap", { files: { "config.xml": "<Config><ApiKey>k</ApiKey></Config>" } });
  assert.deepEqual(done.body, { apiKey: "k" });
  assert.ok(!state.requests.some((r) => r.method === "PUT"));
  const waiting = await call("media.manager", "radarr", "bootstrap", { files: { "config.xml": "<Config/>" } });
  assert.deepEqual(waiting.body, { apiKey: null });
});

test("Prowlarr's readiness summary matches the server's", async () => {
  sdk([json("api/v1/system/status", { version: "2.3.5" }), json("api/v1/indexer", [{}, {}, {}])]);
  assert.deepEqual((await call("indexer.list", "prowlarr", "read_state")).body, { summary: "Prowlarr v2.3.5 · 3 indexers" });
  assert.deepEqual((await call("media.manager", "sonarr", "read_state")).body, { summary: null });
});
