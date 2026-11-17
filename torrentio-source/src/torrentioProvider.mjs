// Ported to source-js-v1 (QuickJS): no Node built-ins, timers or globals;
// URL comes from a vendored, parity-tested helper.
import { URL, URLSearchParams } from "./lib/url.mjs";

const DEFAULT_BASE_URL = "https://torrentio.strem.fun";
const DEFAULT_RESULT_LIMIT = 50;
const MAX_RESULT_LIMIT = 100;
const DEFAULT_TIMEOUT_MS = 12000;
const MIN_TIMEOUT_MS = 1000;
const MAX_TIMEOUT_MS = 30000;
const DEFAULT_RETRY_COUNT = 1;
const MAX_RETRY_COUNT = 2;
const DEFAULT_RETRY_BACKOFF_MS = 300;
const MAX_RETRY_BACKOFF_MS = 5000;
const DEFAULT_MIN_REQUEST_INTERVAL_MS = 250;
const MAX_MIN_REQUEST_INTERVAL_MS = 5000;
const DEFAULT_MAX_LOOKUP_ATTEMPTS = 6;
const MAX_LOOKUP_ATTEMPTS = 6;
const DEFAULT_RELEASE_DELAY_SECONDS = 0;
const MAX_RELEASE_DELAY_SECONDS = 7 * 24 * 60 * 60;
const BYTES_IN_GB = 1024 ** 3;

const DEBRID_ROUTE = "acquisition.debrid.default";
const TORRENT_ROUTE = "downloaders.torrent.default";
const lastSourceCallAtByOrigin = new Map();

export function normalizeConfig(providerConfig = {}, request = {}) {
  const config = providerConfig && typeof providerConfig === "object" ? providerConfig : {};
  const preferences =
    request.preferences && typeof request.preferences === "object" ? request.preferences : {};
  const endpoint = normalizeAddonEndpoint(
    firstText(
      config.manifestUrl,
      config.addonManifestUrl,
      config.baseUrl,
      undefined,
      DEFAULT_BASE_URL
    ),
    firstText(config.addonPath, undefined, "")
  );
  const allowedQualities = normalizeStringList(
    preferences.allowedQualities?.length
      ? preferences.allowedQualities
      : config.allowedQualities ?? config.qualityAllowlist
  );
  const requiredLanguages = normalizeStringList(
    preferences.requiredLanguages?.length
      ? preferences.requiredLanguages
      : config.requiredLanguages ?? config.languageAllowlist
  );
  const maxSizeBytes =
    numericOrNull(preferences.maxSizeBytes) ??
    numericOrNull(config.maxSizeBytes) ??
    sizeGbToBytes(config.maxSizeGb);
  const limit =
    positiveInteger(request.limit) ??
    positiveInteger(config.resultLimit) ??
    positiveInteger(config.limit) ??
    DEFAULT_RESULT_LIMIT;
  const timeoutMs =
    positiveInteger(config.timeoutMs) ??
    positiveInteger(undefined) ??
    DEFAULT_TIMEOUT_MS;

  return {
    baseUrl: endpoint.baseUrl,
    addonPath: endpoint.addonPath,
    routePolicy: normalizeRoutePolicy(preferences.routePolicy ?? config.routePolicy),
    allowedQualities: allowedQualities.map((value) => value.toLowerCase()),
    maxSizeBytes,
    requiredLanguages: requiredLanguages.map((value) => value.toLowerCase()),
    resultLimit: clampInteger(limit, 1, MAX_RESULT_LIMIT),
    timeoutMs: clampInteger(timeoutMs, MIN_TIMEOUT_MS, MAX_TIMEOUT_MS),
    retryCount: clampInteger(
      nonNegativeInteger(config.retryCount) ??
        nonNegativeInteger(undefined) ??
        DEFAULT_RETRY_COUNT,
      0,
      MAX_RETRY_COUNT
    ),
    retryBackoffMs: clampInteger(
      nonNegativeInteger(config.retryBackoffMs) ??
        nonNegativeInteger(undefined) ??
        DEFAULT_RETRY_BACKOFF_MS,
      0,
      MAX_RETRY_BACKOFF_MS
    ),
    minRequestIntervalMs: clampInteger(
      nonNegativeInteger(config.minRequestIntervalMs) ??
        nonNegativeInteger(undefined) ??
        DEFAULT_MIN_REQUEST_INTERVAL_MS,
      0,
      MAX_MIN_REQUEST_INTERVAL_MS
    ),
    maxLookupAttempts: clampInteger(
      positiveInteger(config.maxLookupAttempts) ??
        positiveInteger(undefined) ??
        DEFAULT_MAX_LOOKUP_ATTEMPTS,
      1,
      MAX_LOOKUP_ATTEMPTS
    ),
    releaseDelaySeconds: clampInteger(
      nonNegativeInteger(config.releaseDelaySeconds) ??
        nonNegativeInteger(undefined) ??
        DEFAULT_RELEASE_DELAY_SECONDS,
      0,
      MAX_RELEASE_DELAY_SECONDS
    )
  };
}

export async function searchCandidates(invocation, options = {}) {
  const request = invocation?.request ?? {};
  validateSearchRequest(request);
  const config = normalizeConfig(invocation?.provider?.config, request);
  const lookupPlan = buildLookupPlan(request, config);
  const lookupAttempts = lookupPlan.attempts;
  if (lookupAttempts.length === 0) {
    return {
      candidates: [],
      warnings: [
        ...lookupPlan.warnings,
        "No supported external id was available for this source lookup."
      ]
    };
  }

  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const warnings = [...lookupPlan.warnings];
  const streams = [];
  for (const attempt of lookupAttempts) {
    const url = streamEndpointUrl(config.baseUrl, config.addonPath, attempt.type, attempt.id);
    const result = await fetchStreams(url, config, fetchImpl, options);
    if (!result.ok) {
      warnings.push(`${attempt.label}: ${result.warning}`);
      continue;
    }
    if (result.streams.length > 0) {
      streams.push(
        ...result.streams.map((stream) => ({
          stream,
          lookup: attempt,
          url
        }))
      );
      break;
    }
  }

  const candidates = normalizeStreams(streams, request, config);
  if (candidates.length === 0 && warnings.length === 0) {
    warnings.push("The source returned no candidate streams for this target.");
  }
  return { candidates, warnings };
}

export function buildLookupAttempts(request) {
  return buildLookupPlan(request).attempts;
}

export function buildLookupPlan(request, config = {}) {
  const mediaType = normalizeMediaType(request.mediaType);
  const ids = normalizeExternalIds(request.externalIds);
  const target = normalizeLookupTarget(request);
  const attempts = [];
  const warnings = [];

  if (mediaType === "movie") {
    addMovieAttempt(attempts, ids.imdb, "IMDb");
    addMovieAttempt(attempts, idWithPrefix("tmdb", ids.tmdb), "TMDB");
    addMovieAttempt(attempts, idWithPrefix("tvdb", ids.tvdbMovie), "TVDB movie");
    addMovieAttempt(attempts, idWithPrefix("tvdb", ids.tvdb), "TVDB");
    return finalizeLookupPlan(mediaType, target, attempts, warnings, config);
  }

  const conventionalSeriesIds = [
    ["IMDb", ids.imdb],
    ["TVDB series", idWithPrefix("tvdb", ids.tvdbSeries)],
    ["TVDB", idWithPrefix("tvdb", ids.tvdb)],
    ["TMDB", idWithPrefix("tmdb", ids.tmdb)]
  ];

  for (const [label, id] of conventionalSeriesIds) {
    addSeriesAttempts(attempts, id, label, target);
  }

  if (mediaType === "anime") {
    for (const [label, id] of [
      ["Kitsu", idWithPrefix("kitsu", ids.kitsu)],
      ["AniList", idWithPrefix("anilist", ids.anilist)]
    ]) {
      addAnimeNativeAttempts(attempts, id, label, target);
    }
  }

  return finalizeLookupPlan(mediaType, target, attempts, warnings, config);
}

export function streamEndpointUrl(baseUrl, addonPath, type, id) {
  const url = new URL(baseUrl);
  const parts = [
    ...pathParts(addonPath),
    "stream",
    encodeURIComponent(type),
    `${encodeIdSegment(id)}.json`
  ];
  url.pathname = `/${parts.join("/")}`;
  url.search = "";
  url.hash = "";
  return url.toString();
}

export function normalizeStreams(streamEntries, request, config) {
  const seen = new Set();
  const candidates = [];

  for (const entry of streamEntries) {
    const candidate = candidateFromStream(entry.stream, entry.lookup, request, config);
    if (!candidate) {
      continue;
    }
    if (config.allowedQualities.length > 0) {
      const quality = candidate.quality?.toLowerCase();
      if (!quality || !config.allowedQualities.includes(quality)) {
        continue;
      }
    }
    if (config.maxSizeBytes && candidate.sizeBytes && candidate.sizeBytes > config.maxSizeBytes) {
      continue;
    }
    const key = candidateDedupeKey(candidate);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    candidates.push(candidate);
  }

  candidates.sort((left, right) => {
    const leftScore = typeof left.score === "number" ? left.score : 0;
    const rightScore = typeof right.score === "number" ? right.score : 0;
    return rightScore - leftScore || (right.seeders ?? 0) - (left.seeders ?? 0);
  });

  return candidates.slice(0, config.resultLimit).map((candidate, index) => ({
    ...candidate,
    rank: index + 1
  }));
}

export function candidateFromStream(stream, lookup, request, config) {
  if (!stream || typeof stream !== "object") {
    return null;
  }
  const rawTitle = releaseTitle(stream, request);
  const explicitInfoHash = normalizeInfoHash(stream.infoHash ?? stream.info_hash);
  const source = sourceForStream(stream, explicitInfoHash, rawTitle);
  if (!source) {
    return null;
  }
  const infoHash = explicitInfoHash ?? infoHashFromMagnet(source);
  const sourceKind = source.startsWith("magnet:") ? "magnet" : "http";
  const combinedText = streamText(stream);
  const parsedHints = parseReleaseHints(stream, combinedText, {
    lookup,
    request,
    source,
    sourceKind,
    infoHash
  });
  const quality = parsedHints.quality;
  const sizeBytes = parsedHints.sizeBytes;
  const seeders = parsedHints.seeders;
  const language = parsedHints.language;
  const cachedDebrid = parsedHints.cachedDebrid;
  const fileIndex = parsedHints.fileIndex;
  const trackerCount = trackerCountForSource(source, stream.sources);
  parsedHints.trackerCount = trackerCount;
  const files = candidateFilesFromStream(stream, { fileIndex, sizeBytes });
  const supportedRoutes = supportedRoutesForSource(sourceKind, config.routePolicy);
  const defaultRoute = defaultRouteForPolicy(supportedRoutes, config.routePolicy);
  const scoreData = scoreCandidate({
    quality,
    seeders,
    sizeBytes,
    cachedDebrid,
    sourceKind,
    trackerCount
  });
  const id = infoHash
    ? infoHash
    : magnetInfoHashDedupeKey(source) ?? stableSourceId(normalizedSourceForDedupe(source) ?? source);

  return {
    id,
    title: rawTitle,
    source,
    sourceKind,
    infoHash: infoHash ?? undefined,
    fileIndex: fileIndex ?? undefined,
    quality: quality ?? undefined,
    sizeBytes: sizeBytes ?? undefined,
    seeders: seeders ?? undefined,
    language: language ?? undefined,
    cachedDebrid: cachedDebrid ?? undefined,
    score: scoreData.score,
    scoreBadges: scoreData.badges,
    files,
    supportedRoutes,
    defaultRoute,
    raw: {
      provider: "torrentio_stremio",
      lookup,
      parsedHints,
      stream: redactSensitiveValue(stream)
    }
  };
}

function validateSearchRequest(request) {
  if (!request || typeof request !== "object") {
    throw Object.assign(new Error("request is required"), { statusCode: 400 });
  }
  if (!firstText(request.mediaType)) {
    throw Object.assign(new Error("request.mediaType is required"), { statusCode: 400 });
  }
  if (!firstText(request.title)) {
    throw Object.assign(new Error("request.title is required"), { statusCode: 400 });
  }
}

async function fetchStreams(url, config, fetchImpl, options = {}) {
  let lastWarning = null;
  for (let attempt = 0; attempt <= config.retryCount; attempt += 1) {
    if (attempt > 0 && config.retryBackoffMs > 0) {
      await sleep(config.retryBackoffMs * attempt, options.sleepImpl);
    }
    await applyRateLimit(url, config.minRequestIntervalMs, options.sleepImpl);
    const result = await fetchStreamsOnce(url, config.timeoutMs, fetchImpl);
    if (result.ok || !result.retryable || attempt >= config.retryCount) {
      return result;
    }
    lastWarning = result.warning;
  }
  return { ok: false, warning: lastWarning ?? "source request failed" };
}

async function fetchStreamsOnce(url, timeoutMs, fetchImpl) {
  // The runner has no timers or AbortController; its broker enforces the
  // request deadline.
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeout =
    controller && typeof setTimeout === "function"
      ? setTimeout(() => controller.abort(), timeoutMs)
      : null;
  try {
    const response = await fetchImpl(url, {
      headers: {
        accept: "application/json",
        "user-agent": "Elixir Torrentio-Compatible Source/0.1.0"
      },
      signal: controller?.signal
    });
    if (!response.ok) {
      return {
        ok: false,
        retryable: response.status >= 500 || response.status === 429,
        warning: `source returned HTTP ${response.status}`
      };
    }
    const payload = await response.json();
    const streams = Array.isArray(payload?.streams) ? payload.streams : [];
    return { ok: true, streams };
  } catch (error) {
    const message =
      error?.name === "AbortError" ? "source request timed out" : error?.message ?? String(error);
    return { ok: false, retryable: true, warning: message };
  } finally {
    if (timeout != null && typeof clearTimeout === "function") {
      clearTimeout(timeout);
    }
  }
}

async function applyRateLimit(url, minRequestIntervalMs, sleepImpl) {
  if (minRequestIntervalMs <= 0) {
    return;
  }
  const origin = sourceOrigin(url);
  const now = Date.now();
  const lastCallAt = lastSourceCallAtByOrigin.get(origin) ?? 0;
  const waitMs = Math.max(0, minRequestIntervalMs - (now - lastCallAt));
  if (waitMs > 0) {
    await sleep(waitMs, sleepImpl);
  }
  lastSourceCallAtByOrigin.set(origin, Date.now());
}

function sourceOrigin(url) {
  try {
    return new URL(url).origin;
  } catch {
    return "unknown";
  }
}

function sleep(ms, sleepImpl) {
  // No timers in the runner: pacing and backoff are best-effort there.
  const sleeper =
    sleepImpl ??
    (typeof setTimeout === "function"
      ? (duration) => new Promise((resolve) => setTimeout(resolve, duration))
      : () => Promise.resolve());
  return sleeper(ms);
}

function normalizeAddonEndpoint(baseUrl, addonPath) {
  let parsed = parseAddonUrl(baseUrl);
  let path = normalizePath(addonPath);

  if (parsed.pathname.endsWith("/manifest.json")) {
    const manifestPath = parsed.pathname.slice(0, -"/manifest.json".length);
    if (!path) {
      path = normalizePath(manifestPath);
    }
    parsed.pathname = "/";
  } else if (parsed.pathname !== "/" && parsed.pathname.trim() !== "") {
    path = joinPaths(parsed.pathname, path);
    parsed.pathname = "/";
  }

  parsed.search = "";
  parsed.hash = "";
  return {
    baseUrl: parsed.origin,
    addonPath: path
  };
}

function parseAddonUrl(value) {
  const text = firstText(value, DEFAULT_BASE_URL);
  const normalized = text.startsWith("stremio://")
    ? `https://${text.slice("stremio://".length)}`
    : text;
  try {
    return new URL(normalized);
  } catch {
    return new URL(DEFAULT_BASE_URL);
  }
}

function redactSensitiveValue(value) {
  if (Array.isArray(value)) {
    return value.map(redactSensitiveValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        isSensitiveKey(key) ? "[REDACTED]" : redactSensitiveValue(child)
      ])
    );
  }
  if (typeof value === "string") {
    return redactSensitiveUrl(value);
  }
  return value;
}

function redactSensitiveUrl(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return value;
  }
  if (!parsed.search) {
    return value;
  }
  const pairs = [];
  for (const [key, rawValue] of parsed.searchParams.entries()) {
    pairs.push([key, isSensitiveKey(key) ? "[REDACTED]" : redactSensitiveUrl(rawValue)]);
  }
  parsed.search = "";
  for (const [key, redactedValue] of pairs) {
    parsed.searchParams.append(key, redactedValue);
  }
  return parsed.toString();
}

function isSensitiveKey(key) {
  const normalized = String(key).toLowerCase().replace(/[-_\s]/g, "");
  return (
    normalized.includes("token") ||
    normalized.includes("apikey") ||
    normalized.includes("secret") ||
    normalized.includes("password") ||
    normalized === "key" ||
    normalized === "pass" ||
    normalized === "auth" ||
    normalized === "authorization" ||
    normalized === "signature" ||
    normalized === "sig"
  );
}

function addMovieAttempt(attempts, id, label) {
  if (id) {
    attempts.push({ type: "movie", id, label });
  }
}

function addSeriesAttempts(attempts, id, label, target) {
  if (!id) {
    return;
  }
  if (target.season && target.episode) {
    attempts.push({
      type: "series",
      id: `${id}:${target.season}:${target.episode}`,
      label,
      targetKind: "episode"
    });
  }
  if (target.season && !target.episode) {
    attempts.push({
      type: "series",
      id: `${id}:${target.season}`,
      label,
      targetKind: "season"
    });
  }
  attempts.push({
    type: "series",
    id,
    label,
    targetKind: target.kind
  });
}

function addAnimeNativeAttempts(attempts, id, label, target) {
  if (!id) {
    return;
  }
  if (target.absolute) {
    attempts.push({
      type: "series",
      id: `${id}:${target.absolute}`,
      label,
      targetKind: "absolute_episode"
    });
  }
  if (target.season && target.episode) {
    attempts.push({
      type: "series",
      id: `${id}:${target.season}:${target.episode}`,
      label,
      targetKind: "episode"
    });
  }
  if (target.season && !target.episode) {
    attempts.push({
      type: "series",
      id: `${id}:${target.season}`,
      label,
      targetKind: "season"
    });
  }
  attempts.push({
    type: "series",
    id,
    label,
    targetKind: target.kind
  });
}

function normalizeExternalIds(rawIds = {}) {
  const ids = rawIds && typeof rawIds === "object" ? rawIds : {};
  return {
    imdb: idText(ids.imdb),
    tmdb: idText(ids.tmdb),
    tvdb: idText(ids.tvdb),
    tvdbSeries: idText(ids.tvdbSeries, ids.tvdb_series, ids.tvdb),
    tvdbMovie: idText(ids.tvdbMovie, ids.tvdb_movie, ids.tvdb),
    anilist: idText(ids.anilist),
    anidb: idText(ids.anidb),
    mal: idText(ids.mal),
    kitsu: idText(ids.kitsu)
  };
}

function normalizeLookupTarget(request) {
  const target = request.target && typeof request.target === "object" ? request.target : {};
  const intent =
    request.searchIntent && typeof request.searchIntent === "object" ? request.searchIntent : {};
  const season = positiveInteger(target.seasonNumber) ?? positiveInteger(intent.seasonNumber);
  const episode =
    positiveInteger(target.episodeNumber) ??
    singleRangeValue(intent.episodeStart, intent.episodeEnd);
  const absolute =
    positiveInteger(target.absoluteEpisodeNumber) ??
    singleRangeValue(intent.absoluteEpisodeStart, intent.absoluteEpisodeEnd);
  const intentKind = firstText(intent.kind, "");
  const kind = lookupTargetKind({ season, episode, absolute, intentKind });
  return {
    kind,
    season,
    episode,
    absolute,
    intentKind,
    targetCount: positiveInteger(intent.targetCount) ?? 0,
    targetKeys: Array.isArray(intent.targetKeys)
      ? intent.targetKeys.map((value) => idText(value)).filter(Boolean)
      : []
  };
}

function lookupTargetKind({ season, episode, absolute, intentKind }) {
  const normalizedIntent = intentKind.toLowerCase();
  if (absolute) {
    return "absolute_episode";
  }
  if (season && episode) {
    return "episode";
  }
  if (season || normalizedIntent.includes("season")) {
    return "season";
  }
  if (normalizedIntent.includes("series")) {
    return "series";
  }
  return "title";
}

function finalizeLookupPlan(mediaType, target, attempts, warnings, config) {
  const maxLookupAttempts = clampInteger(
    positiveInteger(config.maxLookupAttempts) ?? DEFAULT_MAX_LOOKUP_ATTEMPTS,
    1,
    MAX_LOOKUP_ATTEMPTS
  );
  const deduped = dedupeAttempts(attempts);
  if (deduped.length > maxLookupAttempts) {
    warnings.push(
      `Lookup plan truncated from ${deduped.length} to ${maxLookupAttempts} attempts.`
    );
  }
  return {
    mediaType,
    target,
    attempts: deduped.slice(0, maxLookupAttempts),
    warnings
  };
}

function normalizeMediaType(value) {
  const text = firstText(value, "").toLowerCase();
  if (text === "movies") {
    return "movie";
  }
  if (text === "series") {
    return "tv";
  }
  return text;
}

function sourceForStream(stream, infoHash, title) {
  if (infoHash) {
    return magnetFromStream(stream, infoHash, title);
  }
  const source = firstText(
    stream.url,
    stream.externalUrl,
    stream.external_url,
    stream.link,
    stream.downloadUrl,
    stream.download_url,
    stream.streamUrl,
    stream.stream_url
  );
  if (source && isSupportedSource(source)) {
    return source;
  }
  const magnet = Array.isArray(stream.sources)
    ? stream.sources.find((item) => typeof item === "string" && item.startsWith("magnet:"))
    : null;
  return magnet ?? null;
}

function isSupportedSource(source) {
  return /^https?:\/\//i.test(source) || source.startsWith("magnet:");
}

function infoHashFromMagnet(source) {
  if (!source.startsWith("magnet:")) {
    return null;
  }
  const query = source.includes("?") ? source.slice(source.indexOf("?") + 1) : "";
  const params = new URLSearchParams(query);
  for (const xt of params.getAll("xt")) {
    const hash = normalizeInfoHash(xt);
    if (hash) {
      return hash;
    }
  }
  return null;
}

function magnetFromStream(stream, infoHash, title) {
  const params = new URLSearchParams();
  params.set("xt", `urn:btih:${infoHash}`);
  if (title) {
    params.set("dn", title);
  }
  for (const tracker of trackerSources(stream.sources)) {
    params.append("tr", tracker);
  }
  return `magnet:?${params.toString()}`;
}

function trackerSources(sources) {
  if (!Array.isArray(sources)) {
    return [];
  }
  return sources
    .filter((source) => typeof source === "string" && source.startsWith("tracker:"))
    .map((source) => source.slice("tracker:".length))
    .filter(Boolean);
}

function trackerCountForSource(source, sources) {
  const trackers = new Set();
  if (typeof source === "string" && source.startsWith("magnet:")) {
    const query = source.split("?")[1] ?? "";
    const params = new URLSearchParams(query);
    for (const tracker of params.getAll("tr")) {
      if (tracker.trim() !== "") {
        trackers.add(tracker.trim());
      }
    }
  }
  for (const tracker of trackerSources(sources)) {
    trackers.add(tracker);
  }
  return trackers.size;
}

function candidateFilesFromStream(stream, { fileIndex, sizeBytes }) {
  const files = [];
  if (Array.isArray(stream.files)) {
    for (const file of stream.files) {
      const normalized = candidateFileFromValue(file);
      if (normalized) {
        files.push(normalized);
      }
    }
  }
  const filename = firstText(
    stream.behaviorHints?.filename,
    stream.filename,
    stream.fileName
  );
  if (filename && files.length === 0) {
    files.push({
      fileIndex: fileIndex ?? undefined,
      path: filename,
      sizeBytes: sizeBytes ?? undefined,
      selectable: fileIndex !== undefined ? true : undefined
    });
  }
  const title = releaseTitle(stream, {});
  if (!filename && files.length === 0 && looksLikeMediaFile(title)) {
    files.push({
      fileIndex: fileIndex ?? undefined,
      path: title,
      sizeBytes: sizeBytes ?? undefined,
      selectable: true
    });
  }
  return dedupeCandidateFiles(files);
}

function candidateFileFromValue(value) {
  if (typeof value === "string") {
    const path = value.trim();
    return path ? { path, selectable: undefined } : null;
  }
  if (!value || typeof value !== "object") {
    return null;
  }
  const path = firstText(value.path, value.name, value.filename, value.fileName, value.title);
  if (!path) {
    return null;
  }
  const fileIndex = nonNegativeInteger(value.fileIndex ?? value.fileIdx ?? value.index);
  const sizeBytes = parseSizeValue(value.sizeBytes ?? value.size_bytes ?? value.size);
  return {
    fileId: idText(value.fileId, value.id) || undefined,
    fileIndex: fileIndex ?? undefined,
    path,
    sizeBytes: sizeBytes ?? undefined,
    selectable: typeof value.selectable === "boolean" ? value.selectable : undefined
  };
}

function dedupeCandidateFiles(files) {
  const seen = new Set();
  const result = [];
  for (const file of files) {
    const key = `${file.fileIndex ?? ""}:${file.path.toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(file);
  }
  return result;
}

function looksLikeMediaFile(path) {
  return /\.(mkv|mp4|m4v|avi|mov|wmv|ts|m2ts|webm)$/i.test(String(path ?? "").trim());
}

function releaseTitle(stream, request) {
  const title = firstText(
    stream.behaviorHints?.filename,
    stream.filename,
    stream.fileName,
    stream.title,
    stream.name,
    stream.description,
    request.title
  );
  return title.replace(/\s+/g, " ").trim();
}

function streamText(stream) {
  return [
    stream.name,
    stream.title,
    stream.description,
    stream.filename,
    stream.fileName,
    stream.behaviorHints?.filename,
    stream.behaviorHints?.videoHash,
    stream.behaviorHints?.bingeGroup,
    Array.isArray(stream.files)
      ? stream.files.map((file) => (typeof file === "string" ? file : file?.path ?? file?.name)).join(" ")
      : ""
  ]
    .filter((value) => typeof value === "string" && value.trim() !== "")
    .join(" ");
}

function parseReleaseHints(stream, text, context) {
  const episodeHints = parseEpisodeHints(text, context.request);
  const packHint = parsePackHint(text, episodeHints, context.lookup);
  return {
    authoritative: false,
    sourceKind: context.sourceKind,
    infoHash: context.infoHash ?? undefined,
    quality: normalizeQuality(firstText(stream.quality, stream.resolution)) ?? parseQuality(text),
    sizeBytes: parseStreamSizeBytes(stream) ?? parseSizeBytes(text) ?? undefined,
    seeders:
      nonNegativeInteger(stream.seeders ?? stream.seedCount ?? stream.seeds) ??
      parseSeeders(text) ??
      undefined,
    language: parseLanguage(firstText(stream.language, stream.lang, "") + " " + text) ?? undefined,
    cachedDebrid: parseCachedDebrid(stream, text) ?? undefined,
    fileIndex:
      nonNegativeInteger(
        stream.fileIdx ??
          stream.file_index ??
          stream.fileIndex ??
          stream.behaviorHints?.fileIdx ??
          stream.behaviorHints?.fileIndex
      ) ?? undefined,
    releaseGroup: parseReleaseGroup(text) ?? undefined,
    releaseSource: parseReleaseSource(text) ?? undefined,
    edition: parseEdition(text) ?? undefined,
    hdr: parseHdrFormats(text),
    videoCodec: parseVideoCodec(text) ?? undefined,
    audioCodecs: parseAudioCodecs(text),
    seasonEpisode: episodeHints,
    pack: packHint ?? undefined
  };
}

function parseQuality(text) {
  const normalized = text.toLowerCase();
  if (/\b(2160p|4k|uhd)\b/.test(normalized)) {
    return "2160p";
  }
  const match = normalized.match(/\b(1080p|720p|576p|480p|360p)\b/);
  return match ? match[1] : null;
}

function normalizeQuality(value) {
  const text = firstText(value, "").toLowerCase();
  if (!text) {
    return null;
  }
  return parseQuality(text);
}

function parseStreamSizeBytes(stream) {
  for (const value of [
    stream.sizeBytes,
    stream.size_bytes,
    stream.size,
    stream.behaviorHints?.videoSize,
    stream.behaviorHints?.size,
    stream.behaviorHints?.sizeBytes
  ]) {
    const parsed = parseSizeValue(value);
    if (parsed !== null) {
      return parsed;
    }
  }
  return null;
}

function parseSizeValue(value) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = parseSizeBytes(value);
    if (parsed !== null) {
      return parsed;
    }
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) {
      return Math.round(numeric);
    }
  }
  return null;
}

function parseSizeBytes(text) {
  const match = text.match(/(\d+(?:\.\d+)?)\s*(tib|tb|gib|gb|mib|mb)\b/i);
  if (!match) {
    return null;
  }
  const value = Number.parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = {
    tb: 1000 ** 4,
    tib: 1024 ** 4,
    gb: 1000 ** 3,
    gib: 1024 ** 3,
    mb: 1000 ** 2,
    mib: 1024 ** 2
  };
  return Math.round(value * multipliers[unit]);
}

function parseSeeders(text) {
  const patterns = [
    /(?:seeders?|seeds?)\s*[:=]?\s*(\d+)/i,
    /(\d+)\s*(?:seeders?|seeds?)\b/i,
    /[👤👥]\s*(\d+)/
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return Number.parseInt(match[1], 10);
    }
  }
  return null;
}

function parseLanguage(text) {
  const normalized = ` ${text.toLowerCase()} `;
  if (/\b(multi|multi-audio|dual-audio|dual audio)\b/.test(normalized)) {
    return "multi";
  }
  if (hasRussianLanguageHint(text, normalized)) {
    return "ru";
  }
  if (/\b(english|eng|en)\b/.test(normalized)) {
    return "en";
  }
  if (/\b(japanese|jpn|ja)\b/.test(normalized)) {
    return "ja";
  }
  if (/\b(spanish|spa|es)\b/.test(normalized)) {
    return "es";
  }
  if (/\b(french|fre|fra|fr)\b/.test(normalized)) {
    return "fr";
  }
  return null;
}

function hasRussianLanguageHint(rawText, normalizedText) {
  return (
    rawText.includes("🇷🇺") ||
    /[а-яё]{3,}/i.test(rawText) ||
    /\b(?:rus|ru)\b/.test(normalizedText) ||
    /\b(?:lostfilm|rutor|newstudio|kubik|кубик)\b/i.test(rawText)
  );
}

function parseCachedDebrid(stream, text) {
  if (typeof stream.cachedDebrid === "boolean") {
    return stream.cachedDebrid;
  }
  if (typeof stream.debridCached === "boolean") {
    return stream.debridCached;
  }
  if (typeof stream.cached_debrid === "boolean") {
    return stream.cached_debrid;
  }
  if (typeof stream.cached === "boolean") {
    return stream.cached;
  }
  if (/(?:\brd\+|\bcached\b|\breal[\s-]?debrid\b)/i.test(text)) {
    return true;
  }
  if (/\b(rd download|uncached)\b/i.test(text)) {
    return false;
  }
  return null;
}

function parseReleaseGroup(text) {
  const leading = text.match(/^\s*\[([^\]\r\n]{1,64})\]/);
  if (leading) {
    return leading[1].trim();
  }
  const trailing = text.match(/(?:\s|\.|-)-\s*([A-Za-z0-9][A-Za-z0-9._-]{1,40})\s*$/);
  if (trailing && !isCommonReleaseToken(trailing[1])) {
    return trailing[1].replace(/[._-]+$/g, "");
  }
  return null;
}

function isCommonReleaseToken(value) {
  return /^(1080p|720p|2160p|480p|x264|x265|h264|h265|hevc|avc|web-?dl|webrip|bluray)$/i.test(
    value
  );
}

function parseReleaseSource(text) {
  const normalized = text.toLowerCase();
  if (/\b(remux)\b/.test(normalized)) {
    return "remux";
  }
  if (/\b(web[- .]?dl|webdl)\b/.test(normalized)) {
    return "webdl";
  }
  if (/\b(web[- .]?rip|webrip)\b/.test(normalized)) {
    return "webrip";
  }
  if (/\b(bluray|blu[- .]?ray|bdrip|brrip)\b/.test(normalized)) {
    return "bluray";
  }
  if (/\b(hdtv)\b/.test(normalized)) {
    return "hdtv";
  }
  if (/\b(dvdrip|dvd)\b/.test(normalized)) {
    return "dvd";
  }
  return null;
}

function parseEdition(text) {
  const normalized = text.toLowerCase();
  if (/\bextended\b/.test(normalized)) {
    return "extended";
  }
  if (/\bdirectors?[ ._-]?cut\b/.test(normalized)) {
    return "directors_cut";
  }
  if (/\btheatrical\b/.test(normalized)) {
    return "theatrical";
  }
  if (/\bimax\b/.test(normalized)) {
    return "imax";
  }
  return null;
}

function parseHdrFormats(text) {
  const normalized = text.toLowerCase();
  const formats = [];
  if (/\b(dolby[ ._-]?vision|dovi|dv)\b/.test(normalized)) {
    formats.push("dolby_vision");
  }
  if (/(?:^|[^a-z0-9])hdr10\+(?=$|[^a-z0-9])/.test(normalized)) {
    formats.push("hdr10_plus");
  } else if (/\bhdr10\b/.test(normalized)) {
    formats.push("hdr10");
  } else if (/\bhdr\b/.test(normalized)) {
    formats.push("hdr");
  }
  return formats;
}

function parseVideoCodec(text) {
  const normalized = text.toLowerCase();
  if (/\b(av1)\b/.test(normalized)) {
    return "av1";
  }
  if (/\b(hevc|h[ ._-]?265|x265)\b/.test(normalized)) {
    return "h265";
  }
  if (/\b(avc|h[ ._-]?264|x264)\b/.test(normalized)) {
    return "h264";
  }
  if (/\b(vp9)\b/.test(normalized)) {
    return "vp9";
  }
  return null;
}

function parseAudioCodecs(text) {
  const normalized = text.toLowerCase();
  const codecs = [];
  const codecPatterns = [
    ["atmos", /\batmos\b/],
    ["truehd", /\btruehd\b/],
    ["dts_hd", /\bdts[- .]?hd\b/],
    ["dts", /\bdts\b/],
    ["eac3", /\b(e[- .]?ac[- .]?3|ddp|dd\+)\b/],
    ["ac3", /\bac[- .]?3\b/],
    ["flac", /\bflac\b/],
    ["aac", /\baac\b/]
  ];
  for (const [codec, pattern] of codecPatterns) {
    if (pattern.test(normalized) && !codecs.includes(codec)) {
      codecs.push(codec);
    }
  }
  return codecs;
}

function parseEpisodeHints(text, request) {
  const hints = {
    season: undefined,
    episodes: [],
    absoluteEpisodes: []
  };
  const target = request.target && typeof request.target === "object" ? request.target : {};
  const targetSeason = positiveInteger(target.seasonNumber);
  if (targetSeason) {
    hints.season = targetSeason;
  }

  for (const match of text.matchAll(/\bS(\d{1,2})[ ._-]*E(\d{1,3})(?:[ ._-]*(?:-|to|~)[ ._-]*E?(\d{1,3}))?\b/gi)) {
    const season = Number.parseInt(match[1], 10);
    const start = Number.parseInt(match[2], 10);
    const end = match[3] ? Number.parseInt(match[3], 10) : start;
    hints.season = hints.season ?? season;
    if (season === hints.season) {
      pushRange(hints.episodes, start, end);
    }
  }

  for (const match of text.matchAll(/\bSeason[ ._-]*(\d{1,2})\b/gi)) {
    hints.season = hints.season ?? Number.parseInt(match[1], 10);
  }

  for (const match of text.matchAll(/\b(?:EP?|Episode)[ ._-]*(\d{1,4})(?:[ ._-]*(?:-|to|~)[ ._-]*(\d{1,4}))?\b/gi)) {
    const start = Number.parseInt(match[1], 10);
    const end = match[2] ? Number.parseInt(match[2], 10) : start;
    const targetList = hints.season ? hints.episodes : hints.absoluteEpisodes;
    pushRange(targetList, start, end);
  }

  hints.episodes = [...new Set(hints.episodes)].sort((left, right) => left - right);
  hints.absoluteEpisodes = [...new Set(hints.absoluteEpisodes)].sort((left, right) => left - right);
  return hints;
}

function parsePackHint(text, episodeHints, lookup) {
  const normalized = text.toLowerCase();
  const hasSeasonPack =
    /\b(season[ ._-]*pack|complete[ ._-]*season|batch)\b/.test(normalized) ||
    (episodeHints.season && episodeHints.episodes.length === 0 && lookup?.targetKind === "season");
  const hasSeriesPack = /\b(complete[ ._-]*(series|show)|series[ ._-]*pack)\b/.test(normalized);
  if (hasSeriesPack) {
    return {
      kind: "series_pack",
      authoritative: false
    };
  }
  if (hasSeasonPack) {
    return {
      kind: "season_pack",
      season: episodeHints.season ?? undefined,
      authoritative: false
    };
  }
  if (episodeHints.episodes.length > 1 || episodeHints.absoluteEpisodes.length > 1) {
    return {
      kind: "multi_episode",
      season: episodeHints.season ?? undefined,
      episodes: episodeHints.episodes,
      absoluteEpisodes: episodeHints.absoluteEpisodes,
      authoritative: false
    };
  }
  return null;
}

function pushRange(values, start, end) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || start <= 0 || end <= 0) {
    return;
  }
  const normalizedStart = Math.min(start, end);
  const normalizedEnd = Math.max(start, end);
  if (normalizedEnd - normalizedStart > 2000) {
    return;
  }
  for (let value = normalizedStart; value <= normalizedEnd; value += 1) {
    values.push(value);
  }
}

function supportedRoutesForSource(sourceKind, routePolicy) {
  if (sourceKind !== "magnet") {
    return routePolicy === "torrent_only" ? [] : [DEBRID_ROUTE];
  }
  if (routePolicy === "debrid_only") {
    return [DEBRID_ROUTE];
  }
  if (routePolicy === "torrent_only") {
    return [TORRENT_ROUTE];
  }
  return [DEBRID_ROUTE, TORRENT_ROUTE];
}

function defaultRouteForPolicy(routes, routePolicy) {
  if (routes.length === 0) {
    return undefined;
  }
  if (routePolicy === "torrent_only" && routes.includes(TORRENT_ROUTE)) {
    return TORRENT_ROUTE;
  }
  if (routes.includes(DEBRID_ROUTE)) {
    return DEBRID_ROUTE;
  }
  return routes[0];
}

function scoreCandidate({ quality, seeders, sizeBytes, cachedDebrid, sourceKind, trackerCount }) {
  let score = 0.4;
  const badges = [];
  const qualityScores = {
    "2160p": 0.28,
    "1080p": 0.22,
    "720p": 0.14,
    "576p": 0.08,
    "480p": 0.05,
    "360p": 0.02
  };
  if (quality && qualityScores[quality]) {
    score += qualityScores[quality];
    badges.push({
      label: quality,
      detail: "Detected source quality",
      score: qualityScores[quality]
    });
  }
  if (typeof seeders === "number") {
    const seedScore = Math.min(seeders, 400) / 400 * 0.2;
    score += seedScore;
    badges.push({ label: `${seeders} seeders`, detail: "Torrent swarm hint", score: seedScore });
  }
  if (cachedDebrid === true) {
    score += 0.18;
    badges.push({
      label: "Cached debrid",
      detail: "Source marked this stream as cached",
      score: 0.18
    });
  }
  if (sourceKind === "http") {
    score += 0.08;
    badges.push({ label: "HTTP link", detail: "Direct or hoster link", score: 0.08 });
  }
  if (sourceKind === "magnet" && cachedDebrid !== true) {
    const trackerPenalty = trackerCount === 0 ? -0.18 : trackerCount < 3 ? -0.05 : 0;
    if (trackerPenalty !== 0) {
      score += trackerPenalty;
      badges.push({
        label: trackerCount === 0 ? "No trackers" : `${trackerCount} tracker${trackerCount === 1 ? "" : "s"}`,
        detail:
          trackerCount === 0
            ? "Magnet depends on DHT/PEX/LSD discovery and is riskier for uncached downloads"
            : "Limited tracker coverage for uncached torrent fallback",
        score: trackerPenalty
      });
    }
    const seederPenalty =
      typeof seeders !== "number"
        ? -0.05
        : seeders === 0
          ? -0.3
          : seeders < 5
            ? -0.22
            : seeders < 15
              ? -0.14
              : seeders < 50
                ? -0.06
                : 0;
    if (seederPenalty !== 0) {
      score += seederPenalty;
      badges.push({
        label: typeof seeders === "number" ? "Weak swarm" : "Unknown swarm",
        detail: "Uncached magnet has weak or unknown seeder evidence",
        score: seederPenalty
      });
    }
  }
  if (typeof sizeBytes === "number" && sizeBytes > 80 * BYTES_IN_GB) {
    score -= 0.08;
    badges.push({ label: "Large file", detail: "Release is larger than 80 GB", score: -0.08 });
  }
  return {
    score: Math.max(0, Math.min(1, Number(score.toFixed(4)))),
    badges
  };
}

function candidateDedupeKey(candidate) {
  if (candidate.infoHash) {
    return `hash:${candidate.infoHash}`;
  }
  const magnetHash = magnetInfoHashDedupeKey(candidate.source);
  if (magnetHash) {
    return magnetHash;
  }
  const normalizedSource = normalizedSourceForDedupe(candidate.source);
  if (normalizedSource) {
    return `url:${normalizedSource}`;
  }
  const weakTitle = candidate.title.toLowerCase().replace(/\s+/g, " ").trim();
  return `weak:${weakTitle}:${candidate.sizeBytes ?? ""}`;
}

function normalizeInfoHash(value) {
  const text = firstText(value, "").replace(/^urn:btih:/i, "").trim();
  if (/^[a-f0-9]{40}$/i.test(text) || /^[a-z2-7]{32}$/i.test(text)) {
    return text.toLowerCase();
  }
  return null;
}

function stableSourceId(source) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `source-${(hash >>> 0).toString(16)}`;
}

function magnetInfoHashDedupeKey(source) {
  const hash = infoHashFromMagnet(source);
  return hash ? `magnet:${hash}` : null;
}

function normalizedSourceForDedupe(source) {
  if (source.startsWith("magnet:")) {
    return magnetInfoHashDedupeKey(source);
  }
  let parsed;
  try {
    parsed = new URL(source);
  } catch {
    return firstText(source, "").toLowerCase();
  }
  parsed.hash = "";
  parsed.protocol = parsed.protocol.toLowerCase();
  parsed.hostname = parsed.hostname.toLowerCase();
  const pairs = [...parsed.searchParams.entries()]
    .filter(([key]) => !isVolatileDedupeParam(key))
    .sort(([left], [right]) => left.localeCompare(right));
  parsed.search = "";
  for (const [key, value] of pairs) {
    parsed.searchParams.append(key, value);
  }
  return parsed.toString();
}

function isVolatileDedupeParam(key) {
  const normalized = String(key).toLowerCase().replace(/[-_\s]/g, "");
  return (
    isSensitiveKey(key) ||
    normalized === "expires" ||
    normalized === "expiry" ||
    normalized === "expiresat" ||
    normalized === "timestamp" ||
    normalized === "ts" ||
    normalized === "t" ||
    normalized === "session" ||
    normalized === "sessionid" ||
    normalized === "userid" ||
    normalized === "uid" ||
    normalized.startsWith("utm")
  );
}

function idWithPrefix(prefix, value) {
  const text = idText(value);
  if (!text) {
    return null;
  }
  if (text.includes(":") || text.startsWith("tt")) {
    return text;
  }
  return `${prefix}:${text}`;
}

function dedupeAttempts(attempts) {
  const seen = new Set();
  return attempts.filter((attempt) => {
    const key = `${attempt.type}:${attempt.id}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function encodeIdSegment(value) {
  return encodeURIComponent(value).replaceAll("%3A", ":");
}

function pathParts(value) {
  return normalizePath(value).split("/").filter(Boolean).map(encodeURIComponent);
}

function normalizePath(value) {
  return firstText(value, "").replace(/^\/+|\/+$/g, "");
}

function joinPaths(left, right) {
  return [normalizePath(left), normalizePath(right)].filter(Boolean).join("/");
}

function firstText(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }
  return "";
}

function idText(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(Math.trunc(value));
    }
  }
  return "";
}

function singleRangeValue(start, end) {
  const normalizedStart = positiveInteger(start);
  const normalizedEnd = positiveInteger(end);
  if (normalizedStart && (!normalizedEnd || normalizedStart === normalizedEnd)) {
    return normalizedStart;
  }
  return null;
}

function normalizeStringList(value) {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== null && item !== undefined)
      .map((item) => firstText(String(item)))
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function numericOrNull(value) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return null;
}

function integerOrNull(value) {
  const numeric = numericOrNull(value);
  return numeric === null ? null : Math.trunc(numeric);
}

function positiveInteger(value) {
  const numeric = numericOrNull(value);
  return numeric === null ? null : Math.trunc(numeric);
}

function nonNegativeInteger(value) {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.trunc(value);
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return Math.trunc(parsed);
    }
  }
  return null;
}

function clampInteger(value, min, max) {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

function sizeGbToBytes(value) {
  const numeric = numericOrNull(value);
  return numeric === null ? null : Math.round(numeric * BYTES_IN_GB);
}

function normalizeRoutePolicy(value) {
  const text = firstText(String(value ?? "")).toLowerCase();
  if (text === "debrid_only" || text === "torrent_only") {
    return text;
  }
  return "debrid_first";
}
