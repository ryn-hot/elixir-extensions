// Runs the Arr Stack module's media-manager operations against real Sonarr and
// Radarr: lookup, add, acquisition status and imported files. Prints one JSON
// line per step; exits non-zero on the first failure.
import { invoke } from "../../src/main.mjs";

const call = async (member, operation, request) => {
  const capability = member === "prowlarr" ? "indexer.list" : "media.manager";
  const result = await invoke({ schema_version: 1, capability, member, operation, request });
  console.log(JSON.stringify({ member, operation, status: result.status, body: result.body }).slice(0, 600));
  if (result.status !== 200) process.exit(1);
  return result.body;
};

// Sonarr's and Radarr's metadata services sometimes time out; retry a lookup.
const lookup = async (member, request) => {
  for (let attempt = 1; ; attempt += 1) {
    const result = await invoke({ schema_version: 1, capability: "media.manager", member, operation: "lookup", request });
    console.log(JSON.stringify({ member, operation: "lookup", attempt, status: result.status, body: result.body }).slice(0, 600));
    if (result.status === 200) return result.body;
    if (attempt >= 5 || !/SkyHook|timed out|unavailable|\(50[234]\)/i.test(JSON.stringify(result.body))) process.exit(1);
    await new Promise((resolve) => setTimeout(resolve, 10_000));
  }
};

const series = await lookup("sonarr", { kind: "series", query: "The Expanse" });
const expanse = series.items.find((item) => item.externalIds.tvdb === "280619");
if (!expanse) { console.log("lookup did not find The Expanse (tvdb 280619)"); process.exit(1); }
const addedSeries = await call("sonarr", "add", {
  kind: "series", mediaType: "series", title: expanse.title, year: expanse.year,
  externalIds: { tvdb: "280619" }, monitor: false, search: false,
});
const seriesStatus = await call("sonarr", "acquisition_status", { kind: "series", itemId: addedSeries.itemId });
if (seriesStatus.item.totalCount < 1 && seriesStatus.item.hasFiles !== false) process.exit(1);
await call("sonarr", "imported_files", { kind: "series", itemId: addedSeries.itemId });

const movies = await lookup("radarr", { kind: "movie", query: "Heat 1995" });
const heat = movies.items.find((item) => item.externalIds.tmdb === "949");
if (!heat) { console.log("lookup did not find Heat (tmdb 949)"); process.exit(1); }
const addedMovie = await call("radarr", "add", {
  kind: "movie", mediaType: "movie", title: heat.title, year: heat.year,
  externalIds: { tmdb: "949" }, monitor: false, search: false,
});
await call("radarr", "acquisition_status", { kind: "movie", itemId: addedMovie.itemId });
await call("radarr", "imported_files", { kind: "movie", itemId: addedMovie.itemId });
// Slice 2: recovery reads, control screens and Prowlarr.
for (const [member, kind, added] of [["sonarr", "series", addedSeries], ["radarr", "movie", addedMovie]]) {
  await call(member, "queue", { kind });
  await call(member, "history", { kind });
  const status = await call(member, "status", { kind });
  if (!status.version || status.itemCount < 1) { console.log(`${member} status is incomplete`); process.exit(1); }
  const clients = await call(member, "download_clients", { kind, details: true });
  if (clients.clients.length < 1 || !clients.clients.every((client) => client.host && client.port)) {
    console.log(`${member} download clients lack targets`); process.exit(1);
  }
  const first = clients.clients[0];
  await call(member, "set_download_client_priority", { kind, id: first.id, priority: first.priority });
  await call(member, "command", { kind, command: "refresh_item", itemId: added.itemId });
  await call(member, "search_item", { kind, itemId: added.itemId });
  await call(member, "remove_item", { kind, itemId: added.itemId });
  const after = await call(member, "status", { kind });
  if (after.itemCount !== status.itemCount - 1) { console.log(`${member} remove_item did not remove`); process.exit(1); }
}
const prowlarr = await call("prowlarr", "status", {});
if (!prowlarr.version || prowlarr.indexerCount < 1) { console.log("prowlarr status is incomplete"); process.exit(1); }
const indexers = await call("prowlarr", "indexers", {});
const names = await call("prowlarr", "indexer_names", {});
if (names.names.length !== indexers.indexers.length) process.exit(1);
await call("prowlarr", "indexer_proxy_names", {});
await call("prowlarr", "remove_proxies", { names: ["Elixir live check absent proxy"], tags: [] });
console.log("LIVE_CHECK_OK");
