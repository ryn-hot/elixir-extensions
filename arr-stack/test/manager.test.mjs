import assert from "node:assert/strict";
import test from "node:test";

import { forgetKeys } from "../src/arr.mjs";
import { invoke } from "../src/main.mjs";
import { lookupTerms, queueEntry, selectLookupItem } from "../src/manager.mjs";

function sdk(routes, secrets = { "sonarr.api_key": "sonarr-key", "radarr.api_key": "radarr-key" }) {
  forgetKeys();
  const state = { secrets, routes, log: [], requests: [] };
  globalThis.__elixirTestSdk = state;
  return state;
}
const call = (member, operation, request) =>
  invoke({ schema_version: 1, capability: "media.manager", member, operation, request });
const json = (contains, body, extra = {}) => ({ contains, status: 200, body: JSON.stringify(body), ...extra });

test("rejects unknown capabilities, operations and members", async () => {
  sdk([]);
  assert.equal((await invoke({ schema_version: 1, capability: "live.catalog_provider" })).status, 404);
  assert.equal((await call("sonarr", "drop_tables", {})).status, 404);
  assert.equal((await call("prowlarr", "lookup", { kind: "series", query: "x" })).status, 404);
});

test("lookup normalizes Sonarr series with poster paths and year fallback", async () => {
  const state = sdk([
    json("series/lookup?term=The%20Expanse", [
      {
        title: " The Expanse ",
        firstAired: "2015-12-14T00:00:00Z",
        tvdbId: 280619,
        imdbId: "tt3230854",
        overview: "Space.",
        images: [{ coverType: "fanart", url: "/f.jpg" }, { coverType: "Poster", url: "/MediaCover/1/poster.jpg" }],
        ratings: { value: 8.4 },
      },
      { title: "", tvdbId: 1 },
    ]),
  ]);
  const result = await call("sonarr", "lookup", { kind: "series", query: "The Expanse" });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.items, [
    {
      title: "The Expanse",
      year: 2015,
      overview: "Space.",
      externalIds: { tvdb: "280619", tmdb: null, imdb: "tt3230854" },
      posterPath: "/MediaCover/1/poster.jpg",
      popularity: 8.4,
    },
  ]);
  assert.equal(state.log[0], "http://sonarr.stack/api/v3/series/lookup?term=The%20Expanse");
  assert.equal(state.requests[0].headers["x-api-key"], "sonarr-key");
});

test("lookup falls back to v4 when v3 is missing", async () => {
  const state = sdk([json("api/v4/movie/lookup", [{ title: "Heat", year: 1995, tmdbId: 949, images: [{ coverType: "poster", url: "https://image.tmdb.org/p.jpg" }] }])]);
  const result = await call("radarr", "lookup", { kind: "movie", query: "Heat" });
  assert.equal(result.body.items[0].posterUrl, "https://image.tmdb.org/p.jpg");
  assert.equal(result.body.items[0].externalIds.tmdb, "949");
  assert.deepEqual(state.log.map((url) => url.split("?")[0]), [
    "http://radarr.stack/api/v3/movie/lookup",
    "http://radarr.stack/api/v4/movie/lookup",
  ]);
});

test("a missing API key is reported, not sent", async () => {
  const state = sdk([], {});
  const result = await call("sonarr", "lookup", { kind: "series", query: "x" });
  assert.equal(result.status, 503);
  assert.equal(result.body.error.code, "manager_key_unavailable");
  assert.equal(state.log.length, 0);
});

test("add terms and selection match the server's driver", () => {
  const request = {
    kind: "movie",
    mediaType: "movie",
    title: "Scream",
    year: 1996,
    externalIds: { imdb: "tt0117571", tmdb: "4232" },
  };
  assert.deepEqual(lookupTerms(request), ["tmdb:4232", "imdb:tt0117571", "4232", "tt0117571", "Scream 1996", "Scream"]);
  const series = { kind: "series", mediaType: "series", title: "Dark", externalIds: { tvdb: "334824" } };
  assert.deepEqual(lookupTerms(series), ["tvdb:334824", "334824", "Dark"]);
  const items = [{ title: "Other", tvdbId: 1 }, { title: "Dark", tvdbId: 334824 }];
  assert.equal(selectLookupItem(items, series).tvdbId, 334824);
  assert.equal(selectLookupItem([{ title: "Nope" }], series).title, "Nope");
});

test("add posts the selected series with the managed profile, root folder and tag", async () => {
  const state = sdk([
    json("series/lookup?term=tvdb%3A334824", [{ title: "Dark", tvdbId: 334824, tags: [7] }]),
    json("api/v3/qualityprofile", [{ id: 1, name: "Any" }, { id: 4, name: "Elixir TRaSH" }]),
    json("api/v3/rootfolder", [{ path: "/tv" }]),
    json("api/v3/tag", [{ id: 3, label: "Elixir" }], { method: "GET" }),
    json("api/v3/series", { id: 42 }, { method: "POST" }),
  ]);
  const result = await call("sonarr", "add", {
    kind: "series",
    mediaType: "series",
    title: "Dark",
    externalIds: { tvdb: "334824" },
    monitor: true,
    search: true,
  });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { itemId: "42" });
  const posted = JSON.parse(state.requests.find((r) => r.method === "POST").body);
  assert.equal(posted.qualityProfileId, 4);
  assert.equal(posted.rootFolderPath, "/tv");
  assert.equal(posted.monitored, true);
  assert.equal(posted.seasonFolder, true);
  assert.deepEqual(posted.addOptions, { searchForMissingEpisodes: true, monitor: "all" });
  assert.deepEqual(posted.tags, [7, 3]);
});

test("add creates the elixir tag when missing and uses given profile and folder", async () => {
  const state = sdk([
    json("movie/lookup?term=tmdb%3A949", [{ title: "Heat", tmdbId: 949 }]),
    json("api/v3/tag", [], { method: "GET" }),
    json("api/v3/tag", { id: 9, label: "elixir" }, { method: "POST" }),
    json("api/v3/movie", { id: 5 }, { method: "POST" }),
  ]);
  const result = await call("radarr", "add", {
    kind: "movie",
    mediaType: "movie",
    title: "Heat",
    externalIds: { tmdb: "949" },
    monitor: false,
    search: false,
    rootFolderPath: " /movies ",
    qualityProfileId: 2,
  });
  assert.deepEqual(result.body, { itemId: "5" });
  const posts = state.requests.filter((r) => r.method === "POST");
  assert.deepEqual(JSON.parse(posts[0].body), { label: "elixir" });
  const movie = JSON.parse(posts[1].body);
  assert.equal(movie.qualityProfileId, 2);
  assert.equal(movie.rootFolderPath, "/movies");
  assert.deepEqual(movie.addOptions, { searchForMovie: false });
  assert.deepEqual(movie.tags, [9]);
});

test("queue entries keep the server's status rules", () => {
  assert.deepEqual(
    queueEntry("series", {
      id: 11,
      seriesId: 42,
      episodeId: 100,
      downloadId: " ABC ",
      downloadClient: "qBittorrent",
      protocol: "torrent",
      trackedDownloadState: "Downloading",
      trackedDownloadStatus: "Ok",
      status: "downloading",
      errorMessage: "Seeding slowly",
      title: "Dark.S01E01",
    }),
    {
      itemId: "42",
      episodeId: "100",
      entryId: "11",
      downloadId: "ABC",
      downloader: "qBittorrent",
      protocol: "torrent",
      state: "downloading ok downloading",
      statusMessage: "Seeding slowly",
      errorMessage: null,
      title: "Dark.S01E01",
    }
  );
  const warning = queueEntry("movie", { movie: { id: 5 }, trackedDownloadStatus: "Warning" });
  assert.equal(warning.itemId, "5");
  assert.equal(warning.errorMessage, "Downloader reported a problem for this item.");
  const unavailable = queueEntry("movie", { movieId: 5, status: "downloadClientUnavailable", errorMessage: "down" });
  assert.equal(unavailable.errorMessage, "down");
  // A present-but-empty client name does not fall back (serde get().or_else).
  assert.equal(queueEntry("movie", { downloadClient: "", downloadClientName: "x" }).downloader, null);
});

test("acquisition status returns the item, its queue entries and episode titles", async () => {
  sdk([
    json("api/v3/series/42", { id: 42, statistics: { episodeFileCount: 2, episodeCount: 10, sizeOnDisk: 5 } }),
    json("api/v3/queue?page=1&pageSize=250", {
      records: [
        { seriesId: 42, episodeId: 100, downloadId: "a", status: "queued" },
        { seriesId: 7, episodeId: 200, downloadId: "b" },
      ],
    }),
    json("api/v3/episode?seriesId=42", [{ id: 100, seasonNumber: 1, episodeNumber: 3, title: "Past and Present" }]),
  ]);
  const result = await call("sonarr", "acquisition_status", { kind: "series", itemId: "42" });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.item, { hasFiles: true, fileCount: 2, totalCount: 10 });
  assert.equal(result.body.queue.length, 1);
  assert.equal(result.body.queue[0].downloadId, "a");
  assert.deepEqual(result.body.episodes, { 100: { season: 1, episode: 3, title: "Past and Present" } });
});

test("a failing queue does not fail the status, and movies skip episodes", async () => {
  const state = sdk([json("api/v3/movie/5", { id: 5, hasFile: false, movieFileId: 0, sizeOnDisk: 0 })]);
  const result = await call("radarr", "acquisition_status", { kind: "movie", itemId: "5" });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { item: { hasFiles: false, fileCount: 0, totalCount: 0 }, queue: [], episodes: null });
  assert.ok(!state.log.some((url) => url.includes("episode")));
  assert.equal((await call("radarr", "acquisition_status", { kind: "movie", itemId: "../x" })).status, 400);
});

test("imported files join relative paths and lower-case codecs", async () => {
  sdk([
    json("api/v3/series/42", { id: 42, path: "/tv/Dark/", tvdbId: 334824, imdbId: "tt5753856", statistics: { episodeFileCount: 1 } }),
    json("api/v3/episode?seriesId=42", [
      { id: 100, episodeFileId: 9, seasonNumber: 1, episodeNumber: 1, absoluteEpisodeNumber: 1, title: "Secrets" },
      { id: 101, episodeFileId: 0, seasonNumber: 1, episodeNumber: 2 },
    ]),
    json("api/v3/episodefile?seriesId=42", [{ id: 9, relativePath: "Season 1/Dark.S01E01.mkv", size: 123, mediaInfo: { videoCodec: "HEVC", audioCodec: "EAC3" } }]),
  ]);
  const result = await call("sonarr", "imported_files", { kind: "series", itemId: "42" });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.externalIds, { imdb: "tt5753856", tmdb: null, tvdb: "334824" });
  assert.equal(result.body.files.length, 1);
  const file = result.body.files[0];
  assert.equal(file.managerPath, "/tv/Dark/Season 1/Dark.S01E01.mkv");
  assert.equal(file.videoCodec, "hevc");
  assert.equal(file.audioCodec, "eac3");
  assert.equal(file.season, 1);
  assert.equal(file.episode, 1);
  assert.equal(file.raw.episodeFile.id, 9);
});

test("imported movie file uses movieFile.path first", async () => {
  sdk([json("api/v3/movie/5", { id: 5, path: "/movies/Heat (1995)", tmdbId: 949, movieFile: { path: "/movies/Heat (1995)/Heat.mkv", size: 77 } })]);
  const result = await call("radarr", "imported_files", { kind: "movie", itemId: "5" });
  assert.deepEqual(result.body.files, [{ managerPath: "/movies/Heat (1995)/Heat.mkv", sizeBytes: 77, raw: null }]);
  assert.equal(result.body.externalIds.tmdb, "949");
});
