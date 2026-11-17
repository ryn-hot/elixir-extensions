// The Arr Stack's media-manager operations, answering Elixir's general-purpose
// interface (lookup, add, acquisition status, imported files) with Sonarr
// (kind "series") and Radarr (kind "movie"). Each reproduces what the server's
// own Sonarr/Radarr code did, so Find Media behaves the same.
import { ManagerError, get, post, put, records, remove } from "./arr.mjs";

const MANAGED_TAG = "elixir";
const MANAGED_PROFILES = new Set([
  "Elixir TRaSH",
  "Elixir Modern Codecs",
  "Elixir Storage Saver",
  "Elixir TRaSH 4K",
  "Elixir Modern Codecs 4K",
  "Elixir Storage Saver 4K",
]);

// ---- small value helpers (the server's as_id_string / json_nonempty_string)

export function idString(value) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }
  if (typeof value === "number" && Number.isInteger(value)) return String(value);
  return null;
}
function text(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
const int = (value) => (typeof value === "number" && Number.isInteger(value) ? value : null);
const count = (value) => (typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : 0);
/** A present key wins even when its value is null (serde `get().or_else`). */
const present = (object, key, fallback) => (object && object[key] !== undefined ? object[key] : fallback());
function joinPath(root, relative) {
  return `${root.replace(/\/+$/, "")}/${relative.replace(/^\/+/, "")}`;
}
function numeric(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  return null;
}
const normalizeName = (value) => value.trim().toLowerCase().replace(/[ \-_:]/g, "");
const resource = (kind) => {
  if (kind === "series") return "series";
  if (kind === "movie") return "movie";
  throw new ManagerError(400, "unsupported_kind", `unsupported item kind ${kind}`);
};
const itemId = (request) => {
  const id = idString(request.itemId);
  if (!id || !/^[0-9]+$/.test(id)) throw new ManagerError(400, "invalid_item", "a numeric itemId is required");
  return id;
};

// ---- lookup (Find Media search)

function poster(item) {
  const images = Array.isArray(item.images) ? item.images : [];
  const image =
    images.find((entry) => {
      const cover = typeof entry?.coverType === "string" ? entry.coverType.trim().toLowerCase() : "";
      return cover === "poster" || cover === "cover";
    }) ?? images[0];
  const url = typeof image?.url === "string" ? image.url.trim() : "";
  if (url === "") return {};
  return /^https?:\/\//.test(url) ? { posterUrl: url } : { posterPath: url };
}

export async function lookup(member, request) {
  const kind = resource(request.kind);
  const term = text(request.query);
  if (!term) return { items: [] };
  const items = records(await get(member, `${kind}/lookup`, { term }));
  const out = [];
  for (const item of items) {
    const title = text(item?.title);
    if (!title) continue;
    const year =
      int(item.year) ??
      (kind === "series" && typeof item.firstAired === "string" && /^\d{4}/.test(item.firstAired)
        ? Number(item.firstAired.slice(0, 4))
        : null);
    out.push({
      title,
      year,
      overview: typeof item.overview === "string" ? item.overview : null,
      externalIds: {
        tvdb: idString(item.tvdbId),
        tmdb: idString(item.tmdbId),
        imdb: idString(item.imdbId),
      },
      ...poster(item),
      popularity: numeric(item.ratings?.value) ?? numeric(item.popularity) ?? numeric(item.voteCount),
    });
  }
  return { items: out };
}

// ---- add (Find Media add)

/** The server's lookup_terms_for_add_request. */
export function lookupTerms(request) {
  const kind = resource(request.kind);
  const implementation = kind === "series" ? "sonarr" : "radarr";
  const terms = [];
  const seen = new Set();
  const push = (value) => {
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (trimmed !== "" && !seen.has(trimmed.toLowerCase())) {
      seen.add(trimmed.toLowerCase());
      terms.push(trimmed);
    }
  };
  const prefixed = (prefix, value) => {
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (trimmed !== "") push(`${prefix}:${trimmed}`);
  };
  const ids = request.externalIds;
  if (ids) {
    if (implementation === "radarr") {
      prefixed("tmdb", ids.tmdb);
      prefixed("tvdb", ids.tvdbMovie ?? ids.tvdb);
      prefixed("imdb", ids.imdb);
    } else {
      if (request.mediaType === "movie") prefixed("tvdb", ids.tvdbMovie ?? ids.tvdb);
      else prefixed("tvdb", ids.tvdbSeries ?? ids.tvdb);
      prefixed("imdb", ids.imdb);
      prefixed("tmdb", ids.tmdb);
    }
    for (const value of [ids.tvdbMovie, ids.tvdbSeries, ids.tvdb, ids.tmdb, ids.imdb, ids.anilist]) push(value);
  }
  const title = typeof request.title === "string" ? request.title : "";
  if (int(request.year) !== null) push(`${title.trim()} ${request.year}`);
  push(title);
  return terms;
}

function titleYearMatches(item, request) {
  if (typeof item.title !== "string" || normalizeName(item.title) !== normalizeName(request.title ?? "")) return false;
  const left = int(item.year);
  const right = int(request.year);
  return right === null || left === null || left === right;
}

/** The server's select_lookup_item: an ID or title/year match, else the first. */
export function selectLookupItem(items, request) {
  const ids = request.externalIds;
  const same = (value, wanted) => typeof wanted === "string" && idString(value) === wanted.trim();
  for (const item of items) {
    if (!ids) {
      if (titleYearMatches(item, request)) return item;
      continue;
    }
    if (same(item.tvdbId, ids.tvdbSeries)) return item;
    if (request.mediaType === "movie") {
      if (same(item.tvdbId, ids.tvdbMovie ?? ids.tvdb)) return item;
    } else if (same(item.tvdbId, ids.tvdb)) return item;
    if (same(item.tmdbId, ids.tmdb)) return item;
    if (typeof ids.imdb === "string" && idString(item.imdbId)?.toLowerCase() === ids.imdb.trim().toLowerCase()) return item;
    if (request.mediaType === "anime" && same(item.tvdbId, ids.anilist)) return item;
    if (titleYearMatches(item, request)) return item;
  }
  return items[0] ?? null;
}

async function lookupCandidates(member, kind, terms) {
  let last = [];
  for (const term of terms) {
    let items;
    try {
      items = records(await get(member, `${kind}/lookup`, { term }));
    } catch (error) {
      if (error?.code === "manager_endpoint_missing") continue;
      throw error;
    }
    if (items.length > 0) return items;
    last = items;
  }
  return last;
}

async function managedTagId(member) {
  const tags = records(await get(member, "tag"));
  const existing = tags.find((tag) => typeof tag?.label === "string" && tag.label.trim().toLowerCase() === MANAGED_TAG);
  if (int(existing?.id) !== null) return existing.id;
  const created = await post(member, "tag", { label: MANAGED_TAG });
  if (int(created?.id) === null) throw new ManagerError(502, "manager_tag_failed", "tag creation did not return id");
  return created.id;
}

export async function add(member, request) {
  const kind = resource(request.kind);
  const items = await lookupCandidates(member, kind, lookupTerms(request));
  const selected = selectLookupItem(items, request);
  if (!selected || typeof selected !== "object") {
    throw new ManagerError(404, "not_found", "unable to resolve title in manager lookup");
  }
  let qualityProfileId = int(request.qualityProfileId);
  if (qualityProfileId === null) {
    const profiles = records(await get(member, "qualityprofile"));
    const managed = profiles.find((profile) => typeof profile?.name === "string" && MANAGED_PROFILES.has(profile.name.trim()));
    qualityProfileId = int(managed?.id) ?? int(profiles[0]?.id);
    if (qualityProfileId === null) throw new ManagerError(502, "manager_setup_incomplete", "unable to determine qualityprofile");
  }
  let rootFolderPath = text(request.rootFolderPath);
  if (!rootFolderPath) {
    rootFolderPath = text(records(await get(member, "rootfolder"))[0]?.path);
    if (!rootFolderPath) throw new ManagerError(502, "manager_setup_incomplete", "unable to determine rootfolder");
  }
  const tag = await managedTagId(member);
  const payload = { ...selected, qualityProfileId, rootFolderPath, monitored: request.monitor === true };
  if (kind === "series") {
    payload.seasonFolder = true;
    payload.addOptions = {
      searchForMissingEpisodes: request.search === true,
      monitor: request.monitor === true ? "all" : "none",
    };
  } else {
    payload.addOptions = { searchForMovie: request.search === true };
  }
  const tags = Array.isArray(payload.tags) ? payload.tags.filter((value) => int(value) !== null) : [];
  if (!tags.includes(tag)) payload.tags = [...tags, tag];
  const created = await post(member, kind, payload);
  return { itemId: idString(int(created?.id)) };
}

// ---- acquisition status (Find Media's 4-second refresh)

/** The server's queue_entry_* reads, as one general-purpose entry. */
export function queueEntry(kind, entry) {
  const lower = (value) => (typeof value === "string" ? value.trim().toLowerCase() : "");
  const owner =
    kind === "series"
      ? present(entry, "seriesId", () => entry.series?.id)
      : present(entry, "movieId", () => entry.movie?.id);
  const errorText = text(entry.errorMessage);
  const status = lower(entry.status);
  const tracked = lower(entry.trackedDownloadStatus);
  let errorMessage = null;
  if (status.includes("downloadclientunavailable")) {
    errorMessage = errorText ?? "Manager could not hand this release to a download client.";
  } else if (tracked.includes("warning") || tracked.includes("error") || tracked.includes("unavailable")) {
    errorMessage = errorText ?? "Downloader reported a problem for this item.";
  }
  return {
    itemId: idString(owner),
    episodeId: idString(entry.episodeId),
    entryId: idString(entry.id),
    downloadId: text(entry.downloadId),
    downloader: text(present(entry, "downloadClient", () => entry.downloadClientName)),
    protocol: text(entry.protocol),
    state: ["trackedDownloadState", "trackedDownloadStatus", "status"]
      .map((key) => lower(entry[key]))
      .filter((value) => value !== "")
      .join(" "),
    statusMessage: errorText && tracked === "ok" ? errorText : null,
    errorMessage,
    title: text(entry.title),
  };
}

export function itemStatus(kind, item) {
  if (kind === "series") {
    const stats = item?.statistics ?? {};
    return {
      hasFiles: (int(stats.episodeFileCount) ?? 0) > 0 || count(stats.sizeOnDisk) > 0,
      fileCount: count(stats.episodeFileCount),
      totalCount: count(stats.episodeCount),
    };
  }
  return {
    hasFiles: item?.hasFile === true || (int(item?.movieFileId) ?? 0) > 0 || count(item?.sizeOnDisk) > 0,
    fileCount: 0,
    totalCount: 0,
  };
}

export async function acquisitionStatus(member, request) {
  const kind = resource(request.kind);
  const id = itemId(request);
  const item = await get(member, `${kind}/${id}`);
  let queue = [];
  try {
    queue = records(await get(member, "queue", { page: 1, pageSize: 250 }))
      .map((entry) => queueEntry(kind, entry))
      .filter((entry) => entry.itemId === id);
  } catch {
    queue = [];
  }
  let episodes = null;
  if (kind === "series" && queue.length > 0) {
    try {
      episodes = {};
      for (const episode of records(await get(member, "episode", { seriesId: id }))) {
        const key = idString(int(episode?.id));
        if (key === null || int(episode.seasonNumber) === null || int(episode.episodeNumber) === null) continue;
        episodes[key] = {
          season: episode.seasonNumber,
          episode: episode.episodeNumber,
          title: typeof episode.title === "string" ? episode.title : "",
        };
      }
    } catch {
      episodes = null;
    }
  }
  return { item: itemStatus(kind, item), queue, episodes };
}

// ---- imported files (linking the manager's imports into Elixir's library)

export async function importedFiles(member, request) {
  const kind = resource(request.kind);
  const id = itemId(request);
  const item = await get(member, `${kind}/${id}`);
  if (kind === "movie") {
    const file = item?.movieFile;
    const root = text(item?.path);
    const relative = text(file?.relativePath);
    const managerPath = text(file?.path) ?? (root && relative ? joinPath(root, relative) : null);
    return {
      externalIds: {
        imdb: text(item?.imdbId),
        tmdb: idString(int(item?.tmdbId)) ?? text(item?.tmdbId),
        tvdb: text(item?.tvdbId),
      },
      raw: item,
      files: managerPath ? [{ managerPath, sizeBytes: int(file?.size), raw: null }] : [],
    };
  }
  const externalIds = {
    imdb: text(item?.imdbId),
    tmdb: null,
    tvdb: idString(int(item?.tvdbId)) ?? text(item?.tvdbId),
  };
  if (!itemStatus("series", item).hasFiles) return { externalIds, raw: item, files: [] };
  const episodes = records(await get(member, "episode", { seriesId: id }));
  const byId = new Map();
  for (const file of records(await get(member, "episodefile", { seriesId: id }))) {
    if (int(file?.id) !== null) byId.set(file.id, file);
  }
  const root = text(item?.path);
  const files = [];
  for (const episode of episodes) {
    const fileId = int(episode?.episodeFileId);
    if (fileId === null || fileId <= 0 || !byId.has(fileId)) continue;
    const file = byId.get(fileId);
    const relative = text(file.relativePath);
    const managerPath = text(file.path) ?? (root && relative ? joinPath(root, relative) : null);
    if (!managerPath) continue;
    const codec = (value) => text(value)?.toLowerCase() ?? null;
    files.push({
      managerPath,
      sizeBytes: int(file.size),
      season: int(episode.seasonNumber),
      episode: int(episode.episodeNumber),
      absoluteEpisode: int(episode.absoluteEpisodeNumber),
      episodeTitle: text(episode.title),
      videoCodec: codec(file.mediaInfo?.videoCodec),
      audioCodec: codec(file.mediaInfo?.audioCodec),
      raw: { episode, episodeFile: file },
    });
  }
  return { externalIds, raw: item, files };
}

// ---- release recovery

/** The whole first queue page, as general-purpose entries. */
export async function queue(member, request) {
  const kind = resource(request.kind);
  return { entries: records(await get(member, "queue", { page: 1, pageSize: 250 })).map((entry) => queueEntry(kind, entry)) };
}

/** The newest 100 history entries: grabs, failures and imports. */
export async function history(member, request) {
  const kind = resource(request.kind);
  const value = await get(member, "history", { page: 1, pageSize: 100, sortDirection: "descending", sortKey: "date" });
  const entries = [];
  for (const entry of records(value)) {
    const historyId = idString(int(entry?.id));
    if (historyId === null) continue;
    entries.push({
      historyId,
      itemId: idString(kind === "series" ? entry.seriesId : entry.movieId),
      eventType: typeof entry.eventType === "string" ? entry.eventType.trim().toLowerCase() : "",
      downloadId: typeof entry.downloadId === "string" ? entry.downloadId : null,
    });
  }
  return { entries };
}

const numericId = (value, name) => {
  const id = idString(value);
  if (!id || !/^[0-9]+$/.test(id)) throw new ManagerError(400, "invalid_request", `a numeric ${name} is required`);
  return id;
};

/** Marks a grabbed release failed; the manager blocklists it and searches again. */
export async function markFailed(member, request) {
  await post(member, `history/failed/${numericId(request.historyId, "historyId")}`, {});
  return {};
}

const COMMANDS = {
  series: {
    search_missing: () => ({ name: "MissingEpisodeSearch" }),
    refresh_manager: () => ({ name: "RefreshSeries" }),
    search_item: (id) => ({ name: "SeriesSearch", seriesId: id }),
    refresh_item: (id) => ({ name: "RefreshSeries", seriesId: id }),
  },
  movie: {
    search_missing: () => ({ name: "MissingMoviesSearch" }),
    refresh_manager: () => ({ name: "RefreshMovie" }),
    search_item: (id) => ({ name: "MoviesSearch", movieIds: [id] }),
    refresh_item: (id) => ({ name: "RefreshMovie", movieId: id }),
  },
};
const MESSAGES = {
  sonarr: {
    search_missing: "Sonarr started a missing episode search.",
    refresh_manager: "Sonarr refresh started.",
    search_item: "Sonarr started a search for this series.",
    refresh_item: "Sonarr refresh started for this series.",
    remove_item: "Sonarr removed this series.",
  },
  radarr: {
    search_missing: "Radarr started a missing movie search.",
    refresh_manager: "Radarr refresh started.",
    search_item: "Radarr started a search for this movie.",
    refresh_item: "Radarr refresh started for this movie.",
    remove_item: "Radarr removed this movie.",
  },
};

/** One manager command; item commands need itemId. Returns a message. */
export async function command(member, request) {
  const kind = resource(request.kind);
  const build = COMMANDS[kind][request.command];
  if (!build || !Object.hasOwn(COMMANDS[kind], request.command)) {
    throw new ManagerError(400, "unsupported_command", `unsupported command ${String(request.command)}`);
  }
  const itemCommand = request.command === "search_item" || request.command === "refresh_item";
  const id = itemCommand ? Number(numericId(request.itemId, "itemId")) : undefined;
  await post(member, "command", build(id));
  return { message: MESSAGES[member]?.[request.command] ?? "Command started." };
}

/** Starts a search for one item (release recovery's fallback). */
export async function searchItem(member, request) {
  return command(member, { ...request, command: "search_item" });
}

/** Stops managing one item; its files stay where they are. */
export async function removeItem(member, request) {
  const kind = resource(request.kind);
  await remove(member, `${kind}/${numericId(request.itemId, "itemId")}`, { deleteFiles: false });
  return { message: MESSAGES[member]?.remove_item ?? "Removed." };
}

// ---- control screens

export async function status(member, request) {
  const kind = resource(request.kind);
  const system = await get(member, "system/status");
  const items = await get(member, kind);
  return {
    version: typeof system?.version === "string" ? system.version : null,
    itemCount: Array.isArray(items) ? items.length : 0,
  };
}

const integer = (value) => {
  if (int(value) !== null) return value;
  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) return Number(value.trim());
  return null;
};
function field(value, name) {
  const fields = Array.isArray(value?.fields) ? value.fields : [];
  return fields.find((entry) => typeof entry?.name === "string" && entry.name.toLowerCase() === name.toLowerCase());
}
const fieldText = (value, name) => {
  const entry = field(value, name);
  return text(entry?.value) ?? text(entry);
};
export function protocolOf(value) {
  const normalized = value.trim().toLowerCase();
  if (["usenet", "nzb", "sab", "newshost"].some((part) => normalized.includes(part))) return "usenet";
  if (["torrent", "qbittorrent", "transmission", "deluge", "utorrent", "rtorrent", "vuze", "hadouken"].some((part) => normalized.includes(part))) return "torrent";
  return "unknown";
}

/** The server's parse_arr_control_download_client. */
export function downloadClient(value) {
  const id = integer(value?.id);
  if (id === null) return null;
  const implementation = text(present(value, "implementation", () => value.implementationName));
  return {
    id,
    name: text(value.name) ?? "Download client",
    implementation,
    protocol: typeof value.protocol === "string" ? protocolOf(value.protocol) : implementation ? protocolOf(implementation) : "unknown",
    priority: integer(value.priority) ?? integer(field(value, "priority")?.value) ?? integer(field(value, "priority")) ?? 1,
    enabled: typeof present(value, "enable", () => value.enabled) === "boolean" ? present(value, "enable", () => value.enabled) : true,
  };
}

/** The server's host/port and category reads of one client's settings. */
export function clientTarget(detail) {
  let host = null;
  let port = null;
  const url = fieldText(detail, "baseUrl") ?? fieldText(detail, "url");
  const parsed = url ? /^([a-z][a-z0-9+.-]*):\/\/(?:[^@/]*@)?(\[[^\]]+\]|[^:/?#]+)(?::(\d+))?/i.exec(url) : null;
  if (parsed) {
    host = parsed[2].toLowerCase();
    const scheme = parsed[1].toLowerCase();
    port = parsed[3] ? Number(parsed[3]) : scheme === "https" ? 443 : 80;
  } else {
    const fieldHost = fieldText(detail, "host");
    const fieldPort = integer(field(detail, "port")?.value) ?? integer(field(detail, "port"));
    if (fieldHost && fieldPort !== null && fieldPort >= 0 && fieldPort <= 65535) {
      host = fieldHost;
      port = fieldPort;
    }
  }
  const category = ["category", "tvCategory", "movieCategory"].map((name) => fieldText(detail, name)).find(Boolean) ?? null;
  return { host, port, category };
}

/** Download clients; with `details`, each client's host, port and category. */
export async function downloadClients(member, request) {
  resource(request.kind);
  const value = await get(member, "downloadclient");
  if (!Array.isArray(value)) throw new ManagerError(502, "manager_reply_shape", "download client inventory response was not an array");
  const clients = value.map(downloadClient).filter(Boolean);
  if (request.details === true) {
    for (const client of clients) Object.assign(client, clientTarget(await get(member, `downloadclient/${client.id}`)));
  }
  return { clients };
}

/** The server's set_arr_control_download_client_priority, then PUT. */
export async function setDownloadClientPriority(member, request) {
  resource(request.kind);
  const id = numericId(request.id, "id");
  const priority = integer(request.priority);
  if (priority === null) throw new ManagerError(400, "invalid_request", "an integer priority is required");
  const detail = await get(member, `downloadclient/${id}`);
  let updated = false;
  if (detail && typeof detail === "object" && Object.hasOwn(detail, "priority")) {
    detail.priority = priority;
    updated = true;
  }
  for (const entry of Array.isArray(detail?.fields) ? detail.fields : []) {
    if (entry?.name === "priority" && entry && typeof entry === "object") {
      entry.value = priority;
      updated = true;
    }
  }
  if (!updated) throw new ManagerError(409, "priority_unavailable", "download client priority is unavailable for this manager");
  await put(member, `downloadclient/${id}`, detail);
  return {};
}

export const operations = {
  lookup,
  add,
  acquisition_status: acquisitionStatus,
  imported_files: importedFiles,
  queue,
  history,
  mark_failed: markFailed,
  search_item: searchItem,
  command,
  remove_item: removeItem,
  status,
  download_clients: downloadClients,
  set_download_client_priority: setDownloadClientPriority,
};
