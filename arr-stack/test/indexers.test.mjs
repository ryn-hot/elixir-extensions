import assert from "node:assert/strict";
import test from "node:test";

import { forgetKeys } from "../src/arr.mjs";
import { invoke } from "../src/main.mjs";

function sdk(routes) {
  forgetKeys();
  const state = { secrets: { "prowlarr.api_key": "p" }, routes, log: [], requests: [] };
  globalThis.__elixirTestSdk = state;
  return state;
}
const call = (operation, request = {}) =>
  invoke({ schema_version: 1, capability: "indexer.list", member: "prowlarr", operation, request });
const json = (contains, body, extra = {}) => ({ contains, status: 200, body: JSON.stringify(body), ...extra });

test("indexer list is only Prowlarr's", async () => {
  sdk([]);
  const wrong = await invoke({ schema_version: 1, capability: "indexer.list", member: "sonarr", operation: "status", request: {} });
  assert.equal(wrong.status, 404);
  const mixed = await invoke({ schema_version: 1, capability: "media.manager", member: "prowlarr", operation: "lookup", request: {} });
  assert.equal(mixed.status, 404);
});

test("status, indexers and names read Prowlarr's v1 API", async () => {
  const state = sdk([
    json("api/v1/system/status", { version: "1.30" }),
    json("api/v1/indexerProxy", [{ id: 1, name: "FlareSolverr" }]),
    json("api/v1/indexer", [{ name: "1337x", implementation: "Cardigann", enable: false, appProfileId: 1 }, { id: 2 }]),
    json("api/v1/applications", [{ id: 1 }]),
  ]);
  assert.deepEqual((await call("status")).body, { version: "1.30", indexerCount: 2, appCount: 1 });
  assert.deepEqual((await call("indexers")).body.indexers, [
    { name: "1337x", implementation: "Cardigann", enabled: false, appProfileId: 1 },
    { name: "Indexer", implementation: "Unknown", enabled: true, appProfileId: null },
  ]);
  assert.deepEqual((await call("indexer_names")).body, { names: ["1337x"] });
  assert.deepEqual((await call("indexer_proxy_names")).body, { names: ["FlareSolverr"] });
  assert.ok(state.log.every((url) => url.startsWith("http://prowlarr.stack/api/v1/")));
});

test("remove_proxies deletes named proxies and only unused named tags", async () => {
  const state = sdk([
    json("api/v1/indexerProxy/7", {}, { method: "DELETE" }),
    json("api/v1/tag/3", {}, { method: "DELETE" }),
    json("api/v1/indexerProxy", [{ id: 7, name: " FlareSolverr ", tags: [4] }, { id: 8, name: "Other", tags: [4] }], { method: "GET" }),
    json("api/v1/tag", [{ id: 3, label: "flaresolverr" }, { id: 4, label: "shared" }], { method: "GET" }),
    json("api/v1/indexer", [{ id: 1, tags: [4] }], { method: "GET" }),
    json("api/v1/applications", [], { method: "GET" }),
  ]);
  const result = await call("remove_proxies", { names: ["flaresolverr"], tags: ["FlareSolverr", "shared"] });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { removedProxies: 1, removedTags: 1 });
  assert.deepEqual(
    state.requests.filter((r) => r.method === "DELETE").map((r) => r.url),
    ["http://prowlarr.stack/api/v1/indexerProxy/7", "http://prowlarr.stack/api/v1/tag/3"]
  );
});
