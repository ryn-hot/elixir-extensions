// The Arr Stack's indexer-list operations (Elixir's `indexer.list`
// interface), answered by Prowlarr. Each reproduces what the server's own
// Prowlarr code did.
import { ManagerError, records, request } from "./arr.mjs";

const v1 = (path) => [`api/v1/${path}`];
const get = (member, path) => request(member, "GET", v1(path));
const remove = (member, path) => request(member, "DELETE", v1(path));
const normalize = (value) => value.trim().toLowerCase();
const entityId = (value) => (typeof value?.id === "number" && Number.isInteger(value.id) ? value.id : null);
const tagIds = (value) => (Array.isArray(value?.tags) ? value.tags.filter((tag) => Number.isInteger(tag)) : []);

async function list(member, path) {
  const value = await get(member, path);
  if (!Array.isArray(value)) throw new ManagerError(502, "manager_reply_shape", `api/v1/${path} response was not an array`);
  return value;
}
const names = (items) => items.map((item) => item?.name).filter((name) => typeof name === "string");

export async function status(member) {
  const system = await get(member, "system/status");
  const indexers = await get(member, "indexer");
  const applications = await get(member, "applications");
  return {
    version: typeof system?.version === "string" ? system.version : null,
    indexerCount: Array.isArray(indexers) ? indexers.length : 0,
    appCount: Array.isArray(applications) ? applications.length : 0,
  };
}

export async function indexers(member) {
  const items = records(await get(member, "indexer"));
  return {
    indexers: items.map((item) => ({
      name: typeof item?.name === "string" ? item.name : "Indexer",
      implementation: typeof item?.implementation === "string" ? item.implementation : "Unknown",
      enabled: typeof item?.enable === "boolean" ? item.enable : true,
      appProfileId: Number.isInteger(item?.appProfileId) ? item.appProfileId : null,
    })),
  };
}

export async function indexerNames(member) {
  return { names: names(await list(member, "indexer")) };
}

export async function indexerProxyNames(member) {
  return { names: names(await list(member, "indexerProxy")) };
}

/**
 * Uninstall cleanup: deletes the named indexer proxies, then the named tags
 * that no indexer, proxy or application still uses.
 */
export async function removeProxies(member, request) {
  const wantedNames = new Set((Array.isArray(request.names) ? request.names : []).filter((n) => typeof n === "string").map(normalize));
  const wantedTags = new Set((Array.isArray(request.tags) ? request.tags : []).filter((t) => typeof t === "string").map(normalize));
  let removedProxies = 0;
  if (wantedNames.size > 0) {
    const ids = (await list(member, "indexerProxy"))
      .filter((item) => typeof item?.name === "string" && wantedNames.has(normalize(item.name)))
      .map(entityId)
      .filter((id) => id !== null);
    for (const id of ids) {
      await remove(member, `indexerProxy/${id}`);
      removedProxies += 1;
    }
  }
  let removedTags = 0;
  if (wantedTags.size > 0) {
    const candidates = [...new Set((await list(member, "tag"))
      .filter((tag) => typeof tag?.label === "string" && wantedTags.has(normalize(tag.label)))
      .map(entityId)
      .filter((id) => id !== null))].sort((a, b) => a - b);
    if (candidates.length > 0) {
      const used = new Set();
      for (const path of ["indexer", "indexerProxy", "applications"]) {
        for (const item of await list(member, path)) for (const id of tagIds(item)) used.add(id);
      }
      for (const id of candidates) {
        if (used.has(id)) continue;
        await remove(member, `tag/${id}`);
        removedTags += 1;
      }
    }
  }
  return { removedProxies, removedTags };
}

export const operations = {
  status,
  indexers,
  indexer_names: indexerNames,
  indexer_proxy_names: indexerProxyNames,
  remove_proxies: removeProxies,
};
