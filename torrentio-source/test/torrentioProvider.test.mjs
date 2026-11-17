import assert from "node:assert/strict";
import test from "node:test";

import {
  buildLookupAttempts,
  buildLookupPlan,
  normalizeConfig,
  normalizeStreams,
  searchCandidates,
  streamEndpointUrl
} from "../src/torrentioProvider.mjs";

const MOVIE_REQUEST = {
  mediaType: "movie",
  title: "Example Movie",
  year: 2026,
  externalIds: {
    imdb: "tt1234567",
    tmdb: "987"
  },
  preferences: {},
  limit: 10
};

test("streamEndpointUrl preserves configured manifest path and Stremio series id", () => {
  const config = normalizeConfig({
    baseUrl: "https://torrentio.strem.fun/providers=yts,nyaa/manifest.json"
  });

  assert.equal(
    streamEndpointUrl(config.baseUrl, config.addonPath, "series", "tt7654321:4:1"),
    "https://torrentio.strem.fun/providers%3Dyts%2Cnyaa/stream/series/tt7654321:4:1.json"
  );
});

test("buildLookupAttempts uses IMDb first and adds TV/anime fallbacks", () => {
  assert.deepEqual(buildLookupAttempts(MOVIE_REQUEST), [
    { type: "movie", id: "tt1234567", label: "IMDb" },
    { type: "movie", id: "tmdb:987", label: "TMDB" }
  ]);

  assert.deepEqual(
    buildLookupAttempts({
      mediaType: "anime",
      title: "Example Anime",
      externalIds: { anilist: "42", tvdb: "321" },
      target: { seasonNumber: 4, episodeNumber: 1, absoluteEpisodeNumber: 37 }
    }),
    [
      { type: "series", id: "tvdb:321:4:1", label: "TVDB series", targetKind: "episode" },
      { type: "series", id: "tvdb:321", label: "TVDB series", targetKind: "absolute_episode" },
      { type: "series", id: "anilist:42:37", label: "AniList", targetKind: "absolute_episode" },
      { type: "series", id: "anilist:42:4:1", label: "AniList", targetKind: "episode" },
      { type: "series", id: "anilist:42", label: "AniList", targetKind: "absolute_episode" }
    ]
  );
});

test("buildLookupPlan creates bounded TV season attempts from Elixir target intent", () => {
  const plan = buildLookupPlan(
    {
      mediaType: "tv",
      title: "Example Show",
      externalIds: { imdb: "tt7654321", tvdbSeries: "321", tmdb: "999" },
      searchIntent: {
        kind: "season_pack",
        seasonNumber: 2,
        targetCount: 10,
        targetKeys: ["S02E01", "S02E02"]
      }
    },
    { maxLookupAttempts: 4 }
  );

  assert.equal(plan.mediaType, "tv");
  assert.equal(plan.target.kind, "season");
  assert.equal(plan.target.season, 2);
  assert.deepEqual(plan.target.targetKeys, ["S02E01", "S02E02"]);
  assert.deepEqual(plan.attempts, [
    { type: "series", id: "tt7654321:2", label: "IMDb", targetKind: "season" },
    { type: "series", id: "tt7654321", label: "IMDb", targetKind: "season" },
    { type: "series", id: "tvdb:321:2", label: "TVDB series", targetKind: "season" },
    { type: "series", id: "tvdb:321", label: "TVDB series", targetKind: "season" }
  ]);
  assert.deepEqual(plan.warnings, ["Lookup plan truncated from 6 to 4 attempts."]);
});

test("buildLookupPlan uses TVDB movie ids without dropping generic TVDB fallback", () => {
  const plan = buildLookupPlan({
    mediaType: "movie",
    title: "Example Movie",
    externalIds: { tvdbMovie: 456, tvdb: "789" }
  });

  assert.deepEqual(plan.attempts, [
    { type: "movie", id: "tvdb:456", label: "TVDB movie" },
    { type: "movie", id: "tvdb:789", label: "TVDB" }
  ]);
});

test("normalizeStreams converts infoHash streams into debrid-first magnet candidates", () => {
  const candidates = normalizeStreams(
    [
      {
        lookup: { type: "movie", id: "tt1234567", label: "IMDb" },
        stream: {
          name: "Torrentio",
          title: "Example Movie 2026 1080p RD+ 14.2 GB Seeders 88 English",
          infoHash: "0123456789abcdef0123456789abcdef01234567",
          fileIdx: 3,
          sources: ["tracker:https://tracker.example/announce"]
        }
      }
    ],
    MOVIE_REQUEST,
    normalizeConfig({}, MOVIE_REQUEST)
  );

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].sourceKind, "magnet");
  assert.equal(candidates[0].infoHash, "0123456789abcdef0123456789abcdef01234567");
  assert.equal(candidates[0].fileIndex, 3);
  assert.equal(candidates[0].quality, "1080p");
  assert.equal(candidates[0].seeders, 88);
  assert.equal(candidates[0].language, "en");
  assert.equal(candidates[0].cachedDebrid, true);
  assert.deepEqual(candidates[0].supportedRoutes, [
    "acquisition.debrid.default",
    "downloaders.torrent.default"
  ]);
  assert.equal(candidates[0].defaultRoute, "acquisition.debrid.default");
  assert.match(candidates[0].source, /^magnet:\?xt=urn%3Abtih%3A0123456789abcdef/);
});

test("normalizeStreams keeps explicit Russian TV/movie streams as language evidence", () => {
  const candidates = normalizeStreams(
    [
      {
        lookup: { type: "series", id: "tt4270492:1:1", label: "IMDb", targetKind: "episode" },
        stream: {
          name: "Torrentio\nWEB-DL",
          title:
            "Миллиарды / Billions [S01-07] WEB-DLRip | LostFilm\nS01/Billions.S01E01.avi\n👤 39 💾 697.13 MB ⚙️ Rutor\n🇷🇺",
          infoHash: "44233bde7c21fb3922a68213fe961a408bb97c7f",
          fileIdx: 0
        }
      },
      {
        lookup: { type: "series", id: "tt4270492:1:1", label: "IMDb", targetKind: "episode" },
        stream: {
          name: "Torrentio",
          title: "Billions.S01E01.1080p.WEB-DL.DD5.1.H.264-GROUP",
          infoHash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          fileIdx: 0
        }
      }
    ],
    {
      mediaType: "tv",
      title: "Billions",
      target: { seasonNumber: 1, episodeNumber: 1 }
    },
    normalizeConfig({ minRequestIntervalMs: 0 })
  );

  assert.equal(candidates.length, 2);
  const russian = candidates.find((candidate) => candidate.language === "ru");
  const unknown = candidates.find(
    (candidate) => candidate.title === "Billions.S01E01.1080p.WEB-DL.DD5.1.H.264-GROUP"
  );
  assert.ok(russian);
  assert.ok(unknown);
  assert.equal(unknown.language, undefined);
});

test("normalizeStreams allows explicit Russian streams when requested", () => {
  const request = {
    mediaType: "tv",
    title: "Billions",
    target: { seasonNumber: 1, episodeNumber: 1 },
    preferences: { requiredLanguages: ["ru"] }
  };
  const candidates = normalizeStreams(
    [
      {
        lookup: { type: "series", id: "tt4270492:1:1", label: "IMDb", targetKind: "episode" },
        stream: {
          name: "Torrentio\nWEB-DL",
          title:
            "Миллиарды / Billions [S01-07] WEB-DLRip | LostFilm\nS01/Billions.S01E01.avi\n👤 39 💾 697.13 MB ⚙️ Rutor\n🇷🇺",
          infoHash: "44233bde7c21fb3922a68213fe961a408bb97c7f",
          fileIdx: 0
        }
      }
    ],
    request,
    normalizeConfig({ minRequestIntervalMs: 0 }, request)
  );

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].language, "ru");
});

test("ES-0 contract: Torrentio normalized magnet output conforms to suite V1 candidate shape", () => {
  const candidates = normalizeStreams(
    [
      {
        lookup: { type: "movie", id: "tt1234567", label: "IMDb" },
        stream: {
          name: "Torrentio",
          title: "Example Movie 2026 1080p RD+ 14.2 GB Seeders 88 English",
          infoHash: "ABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD",
          fileIdx: 3,
          sources: ["tracker:https://tracker.example/announce"]
        }
      }
    ],
    MOVIE_REQUEST,
    normalizeConfig({ minRequestIntervalMs: 0 }, MOVIE_REQUEST)
  );

  assert.equal(candidates.length, 1);
  assertSuiteV1Candidate(candidates[0], {
    sourceKind: "magnet",
    supportedRoutes: ["acquisition.debrid.default", "downloaders.torrent.default"],
    defaultRoute: "acquisition.debrid.default"
  });
  assert.equal(candidates[0].raw.provider, "torrentio_stremio");
  assert.equal(candidates[0].raw.parsedHints.authoritative, false);
  assert.equal(candidates[0].infoHash, "abcdefabcdefabcdefabcdefabcdefabcdefabcd");
});

test("ES-0 contract: Torrentio normalized HTTP output conforms to suite V1 candidate shape", () => {
  const candidates = normalizeStreams(
    [
      {
        lookup: { type: "movie", id: "tt1234567", label: "IMDb" },
        stream: {
          name: "Hoster Provider",
          description: "Example Movie 2026 1080p WEB-DL 8 GB English",
          downloadUrl: "https://hoster.example/movie/file.mkv?token=usable&expires=999"
        }
      }
    ],
    MOVIE_REQUEST,
    normalizeConfig({ minRequestIntervalMs: 0 }, MOVIE_REQUEST)
  );

  assert.equal(candidates.length, 1);
  assertSuiteV1Candidate(candidates[0], {
    sourceKind: "http",
    supportedRoutes: ["acquisition.debrid.default"],
    defaultRoute: "acquisition.debrid.default"
  });
  assert.equal(candidates[0].raw.provider, "torrentio_stremio");
  assert.equal(candidates[0].raw.parsedHints.authoritative, false);
});

test("normalizeStreams extracts rich release hints without making pack hints authoritative", () => {
  const candidates = normalizeStreams(
    [
      {
        lookup: { type: "series", id: "tt7654321:2:1", label: "IMDb", targetKind: "episode" },
        stream: {
          title:
            "[SubsPlease] Example Show S02E01-E03 2160p WEB-DL DV HDR10+ HEVC EAC3 Atmos 12.5 GiB Seeds: 42 -GRP",
          url:
            "magnet:?xt=urn:btih:ABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD&dn=Example",
          files: [
            { index: 0, path: "Example Show/Example.Show.S02E01.mkv", size: "4.1 GiB" },
            { index: 1, path: "Example Show/Example.Show.S02E02.mkv", size: "4.2 GiB" }
          ],
          cachedDebrid: false
        }
      }
    ],
    {
      mediaType: "tv",
      title: "Example Show",
      target: { seasonNumber: 2, episodeNumber: 1 }
    },
    normalizeConfig({ minRequestIntervalMs: 0 })
  );

  assert.equal(candidates.length, 1);
  const candidate = candidates[0];
  assert.equal(candidate.sourceKind, "magnet");
  assert.equal(candidate.infoHash, "abcdefabcdefabcdefabcdefabcdefabcdefabcd");
  assert.equal(candidate.quality, "2160p");
  assert.equal(candidate.sizeBytes, Math.round(12.5 * 1024 ** 3));
  assert.equal(candidate.seeders, 42);
  assert.equal(candidate.cachedDebrid, false);
  assert.deepEqual(candidate.files, [
    {
      fileIndex: 0,
      path: "Example Show/Example.Show.S02E01.mkv",
      sizeBytes: Math.round(4.1 * 1024 ** 3),
      selectable: undefined,
      fileId: undefined
    },
    {
      fileIndex: 1,
      path: "Example Show/Example.Show.S02E02.mkv",
      sizeBytes: Math.round(4.2 * 1024 ** 3),
      selectable: undefined,
      fileId: undefined
    }
  ]);
  assert.equal(candidate.raw.parsedHints.authoritative, false);
  assert.equal(candidate.raw.parsedHints.releaseGroup, "SubsPlease");
  assert.equal(candidate.raw.parsedHints.releaseSource, "webdl");
  assert.deepEqual(candidate.raw.parsedHints.hdr, ["dolby_vision", "hdr10_plus"]);
  assert.equal(candidate.raw.parsedHints.videoCodec, "h265");
  assert.deepEqual(candidate.raw.parsedHints.audioCodecs, ["atmos", "eac3"]);
  assert.deepEqual(candidate.raw.parsedHints.seasonEpisode, {
    season: 2,
    episodes: [1, 2, 3],
    absoluteEpisodes: []
  });
  assert.deepEqual(candidate.raw.parsedHints.pack, {
    kind: "multi_episode",
    season: 2,
    episodes: [1, 2, 3],
    absoluteEpisodes: [],
    authoritative: false
  });
});

test("normalizeStreams preserves season pack and single-file hints as non-authoritative", () => {
  const candidates = normalizeStreams(
    [
      {
        lookup: { type: "series", id: "tvdb:321:1", label: "TVDB", targetKind: "season" },
        stream: {
          title: "Example Show Season 1 Complete Season Pack 1080p BluRay x264 DTS 20 GB",
          infoHash: "9999999999999999999999999999999999999999",
          behaviorHints: {
            filename: "Example.Show.S01.Complete.mkv",
            fileIdx: 7
          }
        }
      }
    ],
    {
      mediaType: "tv",
      title: "Example Show",
      searchIntent: { kind: "season_pack", seasonNumber: 1 }
    },
    normalizeConfig({ minRequestIntervalMs: 0 })
  );

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].fileIndex, 7);
  assert.deepEqual(candidates[0].files, [
    {
      fileIndex: 7,
      path: "Example.Show.S01.Complete.mkv",
      sizeBytes: 20 * 1000 ** 3,
      selectable: true
    }
  ]);
  assert.deepEqual(candidates[0].raw.parsedHints.pack, {
    kind: "season_pack",
    season: 1,
    authoritative: false
  });
  assert.equal(candidates[0].raw.parsedHints.videoCodec, "h264");
  assert.deepEqual(candidates[0].raw.parsedHints.audioCodecs, ["dts"]);
});

test("normalizeStreams exposes file-like stream title as selectable review file", () => {
  const candidates = normalizeStreams(
    [
      {
        lookup: { type: "series", id: "tvdb:70399:1:1", label: "TVDB", targetKind: "episode" },
        stream: {
          title: "Star Wars Clone Wars [2003] Volume 01.mkv",
          infoHash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          name: "Torrentio"
        }
      }
    ],
    {
      mediaType: "tv",
      title: "Star Wars: Clone Wars",
      target: { seasonNumber: 1, episodeNumber: 1 }
    },
    normalizeConfig({ minRequestIntervalMs: 0 })
  );

  assert.equal(candidates.length, 1);
  assert.deepEqual(candidates[0].files, [
    {
      fileIndex: undefined,
      path: "Star Wars Clone Wars [2003] Volume 01.mkv",
      sizeBytes: undefined,
      selectable: true
    }
  ]);
});

test("normalizeConfig clamps timeout, retries, request interval, and result limit", () => {
  const config = normalizeConfig({
    resultLimit: 500,
    timeoutMs: 50,
    retryCount: 99,
    retryBackoffMs: 99999,
    minRequestIntervalMs: 99999,
    maxLookupAttempts: 999,
    releaseDelaySeconds: 9999999
  });

  assert.equal(config.resultLimit, 100);
  assert.equal(config.timeoutMs, 1000);
  assert.equal(config.retryCount, 2);
  assert.equal(config.retryBackoffMs, 5000);
  assert.equal(config.minRequestIntervalMs, 5000);
  assert.equal(config.maxLookupAttempts, 6);
  assert.equal(config.releaseDelaySeconds, 7 * 24 * 60 * 60);
});

test("normalizeConfig is zero setup, debrid-first, bounded, and advanced-config aware", () => {
  const defaults = normalizeConfig({}, MOVIE_REQUEST);

  assert.equal(defaults.baseUrl, "https://torrentio.strem.fun");
  assert.equal(defaults.addonPath, "");
  assert.equal(defaults.routePolicy, "debrid_first");
  assert.equal(defaults.resultLimit, 10);
  assert.equal(defaults.timeoutMs, 12000);
  assert.equal(defaults.retryCount, 1);
  assert.equal(defaults.retryBackoffMs, 300);
  assert.equal(defaults.minRequestIntervalMs, 250);
  assert.equal(defaults.maxLookupAttempts, 6);
  assert.equal(defaults.releaseDelaySeconds, 0);

  const tuned = normalizeConfig(
    {
      baseUrl: "https://source.example/providers=yts/manifest.json",
      routePolicy: "torrent_only",
      allowedQualities: "2160p, 1080p",
      requiredLanguages: "en, ja",
      maxSizeGb: 12.5,
      resultLimit: 25,
      timeoutMs: 8000,
      retryCount: 2,
      retryBackoffMs: 900,
      minRequestIntervalMs: 1000,
      maxLookupAttempts: 3,
      releaseDelaySeconds: 1800
    },
    MOVIE_REQUEST
  );

  assert.equal(tuned.baseUrl, "https://source.example");
  assert.equal(tuned.addonPath, "providers=yts");
  assert.equal(tuned.routePolicy, "torrent_only");
  assert.deepEqual(tuned.allowedQualities, ["2160p", "1080p"]);
  assert.deepEqual(tuned.requiredLanguages, ["en", "ja"]);
  assert.equal(tuned.maxSizeBytes, Math.round(12.5 * 1024 ** 3));
  assert.equal(tuned.resultLimit, 10);
  assert.equal(tuned.timeoutMs, 8000);
  assert.equal(tuned.retryCount, 2);
  assert.equal(tuned.retryBackoffMs, 900);
  assert.equal(tuned.minRequestIntervalMs, 1000);
  assert.equal(tuned.maxLookupAttempts, 3);
  assert.equal(tuned.releaseDelaySeconds, 1800);
});

test("normalizeStreams applies quality and size filters and dedupes repeated hashes", () => {
  const request = {
    ...MOVIE_REQUEST,
    preferences: {
      allowedQualities: ["1080p"],
      maxSizeBytes: 20 * 1000 ** 3
    }
  };
  const config = normalizeConfig({}, request);
  const candidates = normalizeStreams(
    [
      streamEntry("A 2160p 50 GB Seeders 100", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
      streamEntry("B 1080p 10 GB Seeders 20", "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"),
      streamEntry("B duplicate 1080p 10 GB Seeders 15", "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb")
    ],
    request,
    config
  );

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].title, "B 1080p 10 GB Seeders 20");
});

test("normalizeStreams dedupes by info hash, magnet hash, and normalized URL", () => {
  const request = {
    ...MOVIE_REQUEST,
    preferences: {}
  };
  const config = normalizeConfig({}, request);

  const hashCandidates = normalizeStreams(
    [
      {
        lookup: { type: "movie", id: "tt1234567", label: "IMDb" },
        stream: {
          title: "Same torrent file one 1080p",
          infoHash: "abababababababababababababababababababab",
          fileIdx: 1
        }
      },
      {
        lookup: { type: "movie", id: "tt1234567", label: "IMDb" },
        stream: {
          title: "Same torrent file two 1080p",
          infoHash: "abababababababababababababababababababab",
          fileIdx: 2
        }
      }
    ],
    request,
    config
  );

  assert.equal(hashCandidates.length, 1);

  const urlCandidates = normalizeStreams(
    [
      {
        lookup: { type: "movie", id: "tt1234567", label: "IMDb" },
        stream: {
          title: "URL one 720p",
          url: "https://hoster.example/file.mkv?b=2&a=1"
        }
      },
      {
        lookup: { type: "movie", id: "tt1234567", label: "IMDb" },
        stream: {
          title: "URL two 720p",
          externalUrl: "https://HOSTER.example/file.mkv?a=1&b=2"
        }
      }
    ],
    request,
    config
  );

  assert.equal(urlCandidates.length, 1);
});

test("TE-9C fixture: movie hoster URL is debrid-routable without torrent route", () => {
  const candidates = normalizeStreams(
    [
      {
        lookup: { type: "movie", id: "tt1234567", label: "IMDb" },
        stream: {
          name: "Hoster Provider",
          description: "Example Movie 2026 1080p WEB-DL 8 GB English",
          downloadUrl: "https://hoster.example/movie/file.mkv?token=usable&expires=999"
        }
      }
    ],
    MOVIE_REQUEST,
    normalizeConfig({ minRequestIntervalMs: 0 }, MOVIE_REQUEST)
  );

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].sourceKind, "http");
  assert.equal(candidates[0].source, "https://hoster.example/movie/file.mkv?token=usable&expires=999");
  assert.deepEqual(candidates[0].supportedRoutes, ["acquisition.debrid.default"]);
  assert.equal(candidates[0].defaultRoute, "acquisition.debrid.default");
  assert.equal(candidates[0].raw.provider, "torrentio_stremio");
  assert.equal(candidates[0].raw.parsedHints.releaseSource, "webdl");
});

test("TE-9C fixture: TV full-series pack remains one non-authoritative candidate", () => {
  const candidates = normalizeStreams(
    [
      {
        lookup: { type: "series", id: "tt7654321", label: "IMDb", targetKind: "series" },
        stream: {
          title: "Example Show Complete Series Pack S01-S03 1080p BluRay x265 120 GB Seeds 75",
          infoHash: "1212121212121212121212121212121212121212",
          files: [
            "Example Show/Season 01/Example.Show.S01E01.mkv",
            "Example Show/Season 03/Example.Show.S03E10.mkv"
          ]
        }
      }
    ],
    {
      mediaType: "tv",
      title: "Example Show",
      searchIntent: { kind: "series_pack", targetCount: 30 }
    },
    normalizeConfig({ minRequestIntervalMs: 0 })
  );

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].title, "Example Show Complete Series Pack S01-S03 1080p BluRay x265 120 GB Seeds 75");
  assert.deepEqual(candidates[0].raw.parsedHints.pack, {
    kind: "series_pack",
    authoritative: false
  });
  assert.equal(candidates[0].raw.parsedHints.videoCodec, "h265");
  assert.equal(candidates[0].files.length, 2);
});

test("TE-9C fixture: anime absolute episode preserves Shoko-compatible title and hints", () => {
  const candidates = normalizeStreams(
    [
      {
        lookup: {
          type: "series",
          id: "anilist:21:1000",
          label: "AniList",
          targetKind: "absolute_episode"
        },
        stream: {
          title: "[Erai-raws] Example Anime Episode 1000 [1080p][Multiple Subtitle][AAC]",
          infoHash: "3434343434343434343434343434343434343434",
          language: "Japanese"
        }
      }
    ],
    {
      mediaType: "anime",
      title: "Example Anime",
      externalIds: { anilist: "21" },
      target: { absoluteEpisodeNumber: 1000 }
    },
    normalizeConfig({ minRequestIntervalMs: 0 })
  );

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].title, "[Erai-raws] Example Anime Episode 1000 [1080p][Multiple Subtitle][AAC]");
  assert.equal(candidates[0].language, "ja");
  assert.deepEqual(candidates[0].raw.parsedHints.seasonEpisode, {
    season: undefined,
    episodes: [],
    absoluteEpisodes: [1000]
  });
  assert.equal(candidates[0].raw.parsedHints.releaseGroup, "Erai-raws");
  assert.deepEqual(candidates[0].raw.parsedHints.audioCodecs, ["aac"]);
});

test("TE-9C fixture: anime season/cour lookup preserves TV-style episode hints", () => {
  const candidates = normalizeStreams(
    [
      {
        lookup: { type: "series", id: "anilist:222:2:5", label: "AniList", targetKind: "episode" },
        stream: {
          title: "[SubsPlease] Example Anime S02E05 Cour 2 2160p WEBRip AV1 FLAC",
          infoHash: "5656565656565656565656565656565656565656",
          cached_debrid: true
        }
      }
    ],
    {
      mediaType: "anime",
      title: "Example Anime",
      externalIds: { anilist: "222" },
      target: { seasonNumber: 2, episodeNumber: 5 }
    },
    normalizeConfig({ minRequestIntervalMs: 0 })
  );

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].cachedDebrid, true);
  assert.equal(candidates[0].quality, "2160p");
  assert.deepEqual(candidates[0].raw.parsedHints.seasonEpisode, {
    season: 2,
    episodes: [5],
    absoluteEpisodes: []
  });
  assert.equal(candidates[0].raw.parsedHints.videoCodec, "av1");
  assert.deepEqual(candidates[0].raw.parsedHints.audioCodecs, ["flac"]);
});

test("TE-9C fixture: anime TVDB-translated lookup can produce source candidates", async () => {
  const calls = [];
  const result = await searchCandidates(
    {
      schemaVersion: 1,
      provider: {
        config: {
          baseUrl: "https://source.example/addon/manifest.json",
          retryCount: 0,
          minRequestIntervalMs: 0
        }
      },
      request: {
        mediaType: "anime",
        title: "Example Anime",
        externalIds: { tvdbSeries: "321", anilist: "222" },
        target: { seasonNumber: 1, episodeNumber: 2 }
      }
    },
    {
      fetchImpl: async (url) => {
        calls.push(url);
        assert.match(url, /\/stream\/series\/tvdb:321:1:2\.json$/);
        return {
          ok: true,
          async json() {
            return {
              streams: [
                {
                  title: "Example Anime S01E02 1080p 1.4 GB Seeds 50",
                  infoHash: "7878787878787878787878787878787878787878"
                }
              ]
            };
          }
        };
      }
    }
  );

  assert.equal(calls.length, 1);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].raw.lookup.label, "TVDB series");
  assert.equal(result.candidates[0].raw.lookup.targetKind, "episode");
});

test("TE-9C fixture: cached, uncached, and unknown debrid hints stay distinct", () => {
  const candidates = normalizeStreams(
    [
      streamEntry("Cached Movie 1080p RD+ 10 GB Seeds 20", "1111111111111111111111111111111111111111"),
      streamEntry("Uncached Movie 1080p uncached 9 GB Seeds 19", "2222222222222222222222222222222222222222"),
      streamEntry("Unknown Movie 1080p 8 GB Seeds 18", "3333333333333333333333333333333333333333")
    ],
    MOVIE_REQUEST,
    normalizeConfig({ minRequestIntervalMs: 0 }, MOVIE_REQUEST)
  );

  assert.equal(candidates.length, 3);
  assert.equal(candidates.find((candidate) => candidate.infoHash.startsWith("1111")).cachedDebrid, true);
  assert.equal(candidates.find((candidate) => candidate.infoHash.startsWith("2222")).cachedDebrid, false);
  assert.equal(candidates.find((candidate) => candidate.infoHash.startsWith("3333")).cachedDebrid, undefined);
});

test("normalizeStreams demotes trackerless uncached magnets with weak swarm evidence", () => {
  const candidates = normalizeStreams(
    [
      streamEntry(
        "Example Movie 1080p 8 GB Seeds 80",
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
      ),
      {
        lookup: { type: "movie", id: "tt1234567", label: "IMDb" },
        stream: {
          title: "Example Movie 1080p 8 GB Seeds 20",
          infoHash: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          sources: [
            "tracker:udp://tracker.example:1337/announce",
            "tracker:https://tracker.example/announce",
            "tracker:udp://tracker2.example:1337/announce"
          ]
        }
      }
    ],
    MOVIE_REQUEST,
    normalizeConfig({ minRequestIntervalMs: 0 }, MOVIE_REQUEST)
  );

  assert.equal(candidates.length, 2);
  assert.equal(candidates[0].infoHash, "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
  assert.equal(candidates[0].raw.parsedHints.trackerCount, 3);
  assert.equal(candidates[1].raw.parsedHints.trackerCount, 0);
  assert(
    candidates[1].scoreBadges.some((badge) => badge.label === "No trackers"),
    "trackerless candidate should expose its stale-risk penalty"
  );
});

test("TE-9C fixture: malformed streams are rejected without failing normalization", () => {
  const candidates = normalizeStreams(
    [
      { lookup: { type: "movie", id: "tt1234567", label: "IMDb" }, stream: null },
      { lookup: { type: "movie", id: "tt1234567", label: "IMDb" }, stream: { title: "No source" } },
      {
        lookup: { type: "movie", id: "tt1234567", label: "IMDb" },
        stream: { title: "Unsupported source", url: "ftp://files.example/movie.mkv" }
      },
      {
        lookup: { type: "movie", id: "tt1234567", label: "IMDb" },
        stream: {
          title: "Valid fallback 720p",
          link: "https://hoster.example/valid.mkv"
        }
      }
    ],
    MOVIE_REQUEST,
    normalizeConfig({ minRequestIntervalMs: 0 }, MOVIE_REQUEST)
  );

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].title, "Valid fallback 720p");
});

test("TE-9C fixture: empty source payload returns empty candidates with user-safe warning", async () => {
  const result = await searchCandidates(
    {
      schemaVersion: 1,
      provider: { config: { retryCount: 0, minRequestIntervalMs: 0 } },
      request: {
        mediaType: "movie",
        title: "Empty Movie",
        externalIds: { imdb: "tt5555555" }
      }
    },
    {
      fetchImpl: async () => ({
        ok: true,
        async json() {
          return { streams: [] };
        }
      })
    }
  );

  assert.deepEqual(result.candidates, []);
  assert.deepEqual(result.warnings, ["The source returned no candidate streams for this target."]);
});

test("TE-9C fixture: source timeout is reported without throwing", async () => {
  const result = await searchCandidates(
    {
      schemaVersion: 1,
      provider: {
        config: {
          retryCount: 0,
          minRequestIntervalMs: 0
        }
      },
      request: {
        mediaType: "movie",
        title: "Timeout Movie",
        externalIds: { imdb: "tt6666666" }
      }
    },
    {
      fetchImpl: async () => {
        const error = new Error("aborted");
        error.name = "AbortError";
        throw error;
      }
    }
  );

  assert.deepEqual(result.candidates, []);
  assert.deepEqual(result.warnings, ["IMDb: source request timed out"]);
});

test("TE-9C fixture: oversized source result sets are deterministically clamped", () => {
  const candidates = normalizeStreams(
    Array.from({ length: 120 }, (_, index) => ({
      lookup: { type: "movie", id: "tt1234567", label: "IMDb" },
      stream: {
        title: `Clamp Movie 1080p 2 GB Seeds ${index}`,
        infoHash: `${String(index).padStart(40, "0")}`
      }
    })),
    { ...MOVIE_REQUEST, limit: 150 },
    normalizeConfig({ minRequestIntervalMs: 0 }, { ...MOVIE_REQUEST, limit: 150 })
  );

  assert.equal(candidates.length, 100);
  assert.equal(candidates[0].rank, 1);
  assert.equal(candidates[99].rank, 100);
});

test("TE-9C fixture: URL dedupe ignores volatile auth and tracking params", () => {
  const candidates = normalizeStreams(
    [
      {
        lookup: { type: "movie", id: "tt1234567", label: "IMDb" },
        stream: {
          title: "Signed URL one 1080p",
          url: "https://hoster.example/movie/file.mkv?token=one&utm_source=a&safe=1"
        }
      },
      {
        lookup: { type: "movie", id: "tt1234567", label: "IMDb" },
        stream: {
          title: "Signed URL two 1080p",
          url: "https://HOSTER.example/movie/file.mkv?safe=1&token=two&utm_source=b"
        }
      }
    ],
    MOVIE_REQUEST,
    normalizeConfig({ minRequestIntervalMs: 0 }, MOVIE_REQUEST)
  );

  assert.equal(candidates.length, 1);
});

test("searchCandidates fetches first lookup with streams and returns warnings for failed attempts", async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    if (url.includes("tt1234567")) {
      return {
        ok: true,
        async json() {
          return { streams: [] };
        }
      };
    }
    return {
      ok: true,
      async json() {
        return {
          streams: [
            {
              title: "TMDB fallback 720p 2 GB Seeds 9",
              infoHash: "cccccccccccccccccccccccccccccccccccccccc"
            }
          ]
        };
      }
    };
  };

  const result = await searchCandidates(
    {
      schemaVersion: 1,
      provider: {
        config: {
          baseUrl: "https://source.example/addon/manifest.json",
          minRequestIntervalMs: 0
        }
      },
      request: MOVIE_REQUEST
    },
    { fetchImpl }
  );

  assert.equal(calls.length, 2);
  assert.deepEqual(result.warnings, []);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].quality, "720p");
});

test("searchCandidates reports failed lookup warnings while continuing to fallback ids", async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    if (url.includes("tt1234567")) {
      return {
        ok: false,
        status: 502,
        async json() {
          return {};
        }
      };
    }
    return {
      ok: true,
      async json() {
        return {
          streams: [
            {
              title: "TVDB fallback 1080p 8 GB Seeds 22",
              infoHash: "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
            }
          ]
        };
      }
    };
  };

  const result = await searchCandidates(
    {
      schemaVersion: 1,
      provider: {
        config: {
          baseUrl: "https://source.example/addon/manifest.json",
          retryCount: 0,
          minRequestIntervalMs: 0
        }
      },
      request: {
        ...MOVIE_REQUEST,
        externalIds: { imdb: "tt1234567", tvdbMovie: "456" }
      }
    },
    { fetchImpl }
  );

  assert.equal(calls.length, 2);
  assert.deepEqual(result.warnings, ["IMDb: source returned HTTP 502"]);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].quality, "1080p");
});

test("searchCandidates treats empty lookup plans as empty results without source calls", async () => {
  let called = false;
  const result = await searchCandidates(
    {
      schemaVersion: 1,
      provider: {
        config: {
          minRequestIntervalMs: 0
        }
      },
      request: {
        mediaType: "movie",
        title: "No IDs",
        externalIds: {}
      }
    },
    {
      fetchImpl: async () => {
        called = true;
        throw new Error("fetch should not be called");
      }
    }
  );

  assert.equal(called, false);
  assert.deepEqual(result.candidates, []);
  assert.deepEqual(result.warnings, [
    "No supported external id was available for this source lookup."
  ]);
});

test("searchCandidates retries transient source failures with bounded backoff", async () => {
  const calls = [];
  const sleeps = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    if (calls.length === 1) {
      return {
        ok: false,
        status: 503,
        async json() {
          return {};
        }
      };
    }
    return {
      ok: true,
      async json() {
        return {
          streams: [
            {
              title: "Retry success 1080p 4 GB Seeds 12",
              infoHash: "dddddddddddddddddddddddddddddddddddddddd"
            }
          ]
        };
      }
    };
  };

  const result = await searchCandidates(
    {
      schemaVersion: 1,
      provider: {
        config: {
          baseUrl: "https://source.example/addon/manifest.json",
          retryCount: 1,
          retryBackoffMs: 25,
          minRequestIntervalMs: 0
        }
      },
      request: {
        ...MOVIE_REQUEST,
        externalIds: { imdb: "tt1234567" }
      }
    },
    { fetchImpl, sleepImpl: async (ms) => sleeps.push(ms) }
  );

  assert.equal(calls.length, 2);
  assert.deepEqual(sleeps, [25]);
  assert.equal(result.candidates.length, 1);
});

test("normalizeStreams redacts sensitive raw stream provenance", () => {
  const candidates = normalizeStreams(
    [
      {
        lookup: { type: "movie", id: "tt1234567", label: "IMDb" },
        stream: {
          title: "Sensitive URL 1080p",
          url: "https://hoster.example/file.mkv?token=secret-token&safe=visible",
          behaviorHints: {
            filename: "Sensitive URL 1080p",
            proxyHeaders: {
              request: {
                Authorization: "Bearer secret"
              }
            }
          }
        }
      }
    ],
    MOVIE_REQUEST,
    normalizeConfig({ minRequestIntervalMs: 0 }, MOVIE_REQUEST)
  );

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].source, "https://hoster.example/file.mkv?token=secret-token&safe=visible");
  assert.equal(
    candidates[0].raw.stream.url,
    "https://hoster.example/file.mkv?token=%5BREDACTED%5D&safe=visible"
  );
  assert.equal(
    candidates[0].raw.stream.behaviorHints.proxyHeaders.request.Authorization,
    "[REDACTED]"
  );
});

function streamEntry(title, infoHash) {
  return {
    lookup: { type: "movie", id: "tt1234567", label: "IMDb" },
    stream: { title, infoHash }
  };
}

function assertSuiteV1Candidate(candidate, expected) {
  assert.equal(typeof candidate.title, "string");
  assert.ok(candidate.title.length > 0);
  assert.equal(typeof candidate.source, "string");
  assert.ok(candidate.source.length > 0);
  assert.equal(candidate.sourceKind, expected.sourceKind);
  assert.ok(
    ["magnet", "torrent", "nzb", "usenet", "hoster", "http", "url"].includes(
      candidate.sourceKind
    )
  );
  assert.deepEqual(candidate.supportedRoutes, expected.supportedRoutes);
  assert.equal(candidate.defaultRoute, expected.defaultRoute);
  assert.ok(Array.isArray(candidate.files));
  assert.equal(typeof candidate.rank, "number");
  assert.ok(candidate.rank >= 1);
  assert.equal(typeof candidate.score, "number");
  assert.ok(Number.isFinite(candidate.score));
  assert.ok(Array.isArray(candidate.scoreBadges));
  assert.equal(typeof candidate.raw, "object");
  if (candidate.infoHash !== undefined) {
    assert.match(candidate.infoHash, /^[0-9a-f]{40}$/);
  }
  if (candidate.seeders !== undefined) {
    assert.equal(typeof candidate.seeders, "number");
  }
  if (candidate.cachedDebrid !== undefined) {
    assert.equal(typeof candidate.cachedDebrid, "boolean");
  }
}
