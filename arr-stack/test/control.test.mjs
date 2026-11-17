import assert from "node:assert/strict";
import test from "node:test";

import { forgetKeys } from "../src/arr.mjs";
import { invoke } from "../src/main.mjs";
import { clientTarget, downloadClient } from "../src/manager.mjs";

function sdk(routes) {
  forgetKeys();
  const state = { secrets: { "sonarr.api_key": "s", "radarr.api_key": "r" }, routes, log: [], requests: [] };
  globalThis.__elixirTestSdk = state;
  return state;
}
const call = (member, operation, request) =>
  invoke({ schema_version: 1, capability: "media.manager", member, operation, request });
const json = (contains, body, extra = {}) => ({ contains, status: 200, body: JSON.stringify(body), ...extra });

test("queue returns every entry and history keeps only identified entries", async () => {
  sdk([
    json("api/v3/queue", { records: [{ seriesId: 1, downloadId: "a" }, { seriesId: 2, downloadId: "b" }] }),
    json("api/v3/history?page=1&pageSize=100&sortDirection=descending&sortKey=date", {
      records: [
        { id: 22, eventType: "downloadFailed", seriesId: 1, downloadId: "BBB" },
        { eventType: "grabbed", seriesId: 1 },
        { id: 23, eventType: " Grabbed ", seriesId: "1", downloadId: 5 },
      ],
    }),
  ]);
  const queue = await call("sonarr", "queue", { kind: "series" });
  assert.deepEqual(queue.body.entries.map((entry) => entry.itemId), ["1", "2"]);
  const history = await call("sonarr", "history", { kind: "series" });
  assert.deepEqual(history.body.entries, [
    { historyId: "22", itemId: "1", eventType: "downloadfailed", downloadId: "BBB" },
    { historyId: "23", itemId: "1", eventType: "grabbed", downloadId: null },
  ]);
});

test("mark_failed and search_item post the manager's own commands", async () => {
  const state = sdk([json("api/v3/history/failed/22", {}, { method: "POST" }), json("api/v3/command", { id: 1 }, { method: "POST" })]);
  assert.equal((await call("radarr", "mark_failed", { kind: "movie", historyId: "22" })).status, 200);
  const searched = await call("radarr", "search_item", { kind: "movie", itemId: "6" });
  assert.equal(searched.body.message, "Radarr started a search for this movie.");
  const bodies = state.requests.map((request) => JSON.parse(request.body));
  assert.deepEqual(bodies, [{}, { name: "MoviesSearch", movieIds: [6] }]);
  assert.equal((await call("radarr", "mark_failed", { kind: "movie", historyId: "1/../2" })).status, 400);
});

test("commands map to Sonarr and Radarr names and messages", async () => {
  const state = sdk([json("api/v3/command", { id: 1 }, { method: "POST" })]);
  const missing = await call("sonarr", "command", { kind: "series", command: "search_missing" });
  assert.equal(missing.body.message, "Sonarr started a missing episode search.");
  await call("sonarr", "command", { kind: "series", command: "refresh_item", itemId: "42" });
  await call("radarr", "command", { kind: "movie", command: "refresh_manager" });
  assert.deepEqual(
    state.requests.map((request) => JSON.parse(request.body)),
    [{ name: "MissingEpisodeSearch" }, { name: "RefreshSeries", seriesId: 42 }, { name: "RefreshMovie" }]
  );
  assert.equal((await call("sonarr", "command", { kind: "series", command: "toString" })).status, 400);
  assert.equal((await call("sonarr", "command", { kind: "series", command: "search_item" })).status, 400);
});

test("remove_item deletes without files", async () => {
  const state = sdk([{ contains: "api/v3/series/42?deleteFiles=false", status: 200, body: "", method: "DELETE" }]);
  const result = await call("sonarr", "remove_item", { kind: "series", itemId: "42" });
  assert.equal(result.body.message, "Sonarr removed this series.");
  assert.equal(state.requests[0].method, "DELETE");
  assert.equal(state.requests[0].body, null);
});

test("status reports the version and item count", async () => {
  sdk([json("api/v3/system/status", { version: "4.0.9" }), json("api/v3/movie", [{}, {}, {}])]);
  assert.deepEqual((await call("radarr", "status", { kind: "movie" })).body, { version: "4.0.9", itemCount: 3 });
});

test("download clients parse like the server, with optional targets", async () => {
  assert.deepEqual(downloadClient({ id: "3", implementationName: "SABnzbd", fields: [{ name: "priority", value: "5" }], enable: false }), {
    id: 3, name: "Download client", implementation: "SABnzbd", protocol: "usenet", priority: 5, enabled: false,
  });
  assert.equal(downloadClient({ name: "x" }), null);
  assert.deepEqual(clientTarget({ fields: [{ name: "url", value: "https://NZB.example/api" }, { name: "tvCategory", value: "tv" }] }), {
    host: "nzb.example", port: 443, category: "tv",
  });
  assert.deepEqual(clientTarget({ fields: [{ name: "host", value: "qbittorrent" }, { name: "port", value: 8080 }] }), {
    host: "qbittorrent", port: 8080, category: null,
  });
  sdk([
    json("api/v3/downloadclient/1", { id: 1, fields: [{ name: "host", value: "nzbget" }, { name: "port", value: 6789 }, { name: "category", value: "movies" }] }),
    json("api/v3/downloadclient", [{ id: 1, name: "NZBGet", implementation: "Nzbget", protocol: "usenet", priority: 1 }]),
  ]);
  const result = await call("radarr", "download_clients", { kind: "movie", details: true });
  assert.deepEqual(result.body.clients, [
    { id: 1, name: "NZBGet", implementation: "Nzbget", protocol: "usenet", priority: 1, enabled: true, host: "nzbget", port: 6789, category: "movies" },
  ]);
});

test("priority updates the top-level value and the field, then puts", async () => {
  const state = sdk([
    json("api/v3/downloadclient/4", { id: 4, priority: 1, fields: [{ name: "priority", value: 1 }] }, { method: "GET" }),
    json("api/v3/downloadclient/4", {}, { method: "PUT" }),
  ]);
  assert.equal((await call("sonarr", "set_download_client_priority", { kind: "series", id: 4, priority: 9 })).status, 200);
  const put = JSON.parse(state.requests.find((request) => request.method === "PUT").body);
  assert.equal(put.priority, 9);
  assert.equal(put.fields[0].value, 9);
  sdk([json("api/v3/downloadclient/4", { id: 4, fields: [] })]);
  assert.equal((await call("sonarr", "set_download_client_priority", { kind: "series", id: 4, priority: 9 })).status, 409);
});
