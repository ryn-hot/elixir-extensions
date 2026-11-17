// Elixir's quality policy presets (stock TRaSH, modern codecs, storage saver)
// as plans for Sonarr and Radarr: one quality profile and the TRaSH custom
// formats with their scores. Mirrors the server's
// elixir-server/src/drivers/quality_policy.rs; the vendored custom formats are
// in ./quality-policy-*-formats.mjs. Specs use the server's patch field names
// (QualityProfileSpec, CustomFormatSpec in drivers/patches.rs).
import { ManagerError } from "./arr.mjs";
import radarrFormats from "./quality-policy-radarr-formats.mjs";
import sonarrFormats from "./quality-policy-sonarr-formats.mjs";

export const ELIXIR_STOCK_TRASH_PROFILE = "Elixir TRaSH";
export const ELIXIR_MODERN_CODECS_PROFILE = "Elixir Modern Codecs";
export const ELIXIR_STORAGE_SAVER_PROFILE = "Elixir Storage Saver";
export const ELIXIR_MODERN_CODECS_4K_PROFILE = "Elixir Modern Codecs 4K";
export const ELIXIR_STORAGE_SAVER_4K_PROFILE = "Elixir Storage Saver 4K";
export const ELIXIR_STOCK_TRASH_4K_PROFILE = "Elixir TRaSH 4K";

export const PRESETS = Object.freeze(["stock_trash", "modern_codecs", "storage_saver"]);

// Sonarr should prefer modern WEB releases, but still accept viable legacy TV
// sources so older catalog content does not become undiscoverable.
const SONARR_HD_ALLOWED = [
  "WEBDL-1080p", "WEBRip-1080p", "Bluray-1080p", "WEBDL-720p", "WEBRip-720p", "Bluray-720p", "HDTV-1080p", "HDTV-720p", "DVD",
];
const SONARR_UHD_ALLOWED = ["WEBDL-2160p", "WEBRip-2160p", "Bluray-2160p"];

const SONARR_WEB_1080P_BASE = [
  "br-disk", "lq", "lq-release-title", "x265-hd", "extras", "av1", "repack-proper", "repack2", "repack3",
  "amzn", "atvp", "cc", "dcu", "dscp", "dsnp", "hbo", "hmax", "hulu", "it", "max", "nf", "pcok", "pmtp",
  "sho", "stan", "syfy", "hd-streaming-boost", "web-tier-01", "web-tier-02", "web-tier-03", "web-scene",
];
const SONARR_WEB_2160P_BASE = [
  "hdr", "br-disk", "lq", "lq-release-title", "x265-hd", "extras", "av1", "repack-proper", "repack2", "repack3",
  "amzn", "atvp", "cc", "dcu", "dscp", "dsnp", "hbo", "hmax", "hulu", "it", "max", "nf", "pcok", "pmtp",
  "sho", "stan", "syfy", "uhd-streaming-boost", "hd-streaming-boost", "web-tier-01", "web-tier-02", "web-tier-03", "web-scene",
];

// Radarr should prefer modern HD/UHD releases, but still accept viable
// fallback movie sources so older catalog titles do not become undiscoverable.
const RADARR_HD_ALLOWED = ["Bluray-1080p", "WEBDL-1080p", "WEBRip-1080p", "Bluray-720p", "WEBDL-720p", "WEBRip-720p", "DVD"];
const RADARR_UHD_ALLOWED = ["Bluray-2160p", "WEBDL-2160p", "WEBRip-2160p"];

const RADARR_HD_BASE = [
  "x265-hd", "br-disk", "lq", "lq-release-title", "extras", "av1", "repack-proper", "repack2", "repack3",
  "amzn", "atv", "atvp", "bcore", "crit", "dsnp", "hbo", "hmax", "hulu", "it", "ma", "max", "nf", "pcok",
  "pmtp", "play", "roku", "stan", "hd-bluray-tier-01", "hd-bluray-tier-02", "hd-bluray-tier-03",
  "web-tier-01", "web-tier-02", "web-tier-03",
];
const RADARR_UHD_BASE = [
  "hdr", "dv-boost", "hdr10plus-boost", "dv-wo-hdr-fallback", "generated-dynamic-hdr", "x265-no-hdrdv",
  "br-disk", "lq", "lq-release-title", "extras", "av1", "repack-proper", "repack2", "repack3",
  "amzn", "atv", "atvp", "bcore", "crit", "dsnp", "hbo", "hmax", "hulu", "it", "ma", "max", "nf", "pcok",
  "pmtp", "play", "roku", "stan", "uhd-bluray-tier-01", "uhd-bluray-tier-02", "uhd-bluray-tier-03",
  "web-tier-01", "web-tier-02", "web-tier-03",
];

const SOURCES = { sonarr: sonarrFormats, radarr: radarrFormats };

const fail = (message) => new ManagerError(502, "patch_failed", message);
/** The server's normalize_name here: trim + ASCII lowercase. */
const normalizeName = (value) => value.trim().replace(/[A-Z]/g, (c) => c.toLowerCase());

/** build_sonarr_quality_policy_plan */
export function buildSonarrQualityPolicyPlan(policy) {
  const uhd = isUhdProfileName(policy.profile_name);
  const qualityProfile = uhd
    ? buildProfileSpec(policy, SONARR_UHD_ALLOWED, "WEB 2160p")
    : buildProfileSpec(policy, SONARR_HD_ALLOWED, "WEB 1080p");
  const customFormats = (uhd ? SONARR_WEB_2160P_BASE : SONARR_WEB_1080P_BASE).map((slug) => loadVendoredCustomFormat("sonarr", slug, null));
  applyModernCodecOverrides("sonarr", policy, uhd, customFormats);
  return { qualityProfile, customFormats };
}

/** build_radarr_quality_policy_plan */
export function buildRadarrQualityPolicyPlan(policy) {
  const uhd = isUhdProfileName(policy.profile_name);
  const qualityProfile = uhd
    ? buildProfileSpec(policy, RADARR_UHD_ALLOWED, "Bluray-2160p")
    : buildProfileSpec(policy, RADARR_HD_ALLOWED, "Bluray-1080p");
  const customFormats = (uhd ? RADARR_UHD_BASE : RADARR_HD_BASE).map((slug) => loadVendoredCustomFormat("radarr", slug, null));
  applyModernCodecOverrides("radarr", policy, uhd, customFormats);
  return { qualityProfile, customFormats };
}

function buildProfileSpec(policy, allowed, cutoff) {
  return {
    name: policy.profile_name,
    cutoff,
    allowed: [...allowed],
    upgrade_allowed: true,
    min_format_score: 0,
    min_upgrade_format_score: null,
    cutoff_format_score: 10000,
  };
}

function applyModernCodecOverrides(source, policy, uhd, customFormats) {
  switch (policy.preset) {
    case "stock_trash":
      return;
    case "modern_codecs":
      if (!uhd) {
        overrideScore(customFormats, "x265 (HD)", 0);
        overrideScore(customFormats, "AV1", 0);
        customFormats.push(loadVendoredCustomFormat(source, "x265-no-hdrdv", 0));
      } else {
        overrideScore(customFormats, "AV1", 0);
      }
      return;
    case "storage_saver":
      if (!uhd) {
        overrideScore(customFormats, "x265 (HD)", 25);
        overrideScore(customFormats, "AV1", 25);
        customFormats.push(loadVendoredCustomFormat(source, "x265-no-hdrdv", 25));
      } else {
        overrideScore(customFormats, "AV1", 25);
      }
      return;
    default:
      // serde rejects an unknown QualityPolicyPresetId while parsing the patch.
      throw new ManagerError(400, "invalid_patch", `unknown quality policy preset ${JSON.stringify(policy.preset)}`);
  }
}

function overrideScore(formats, name, score) {
  const normalized = normalizeName(name);
  const format = formats.find((entry) => normalizeName(entry.name) === normalized);
  if (!format) throw fail(`custom format '${name}' is missing`);
  format.score = score;
}

function isUhdProfileName(profileName) {
  const normalized = normalizeName(profileName);
  return normalized.includes("2160") || normalized.includes("4k") || normalized.includes("uhd");
}

/** load_vendored_custom_format: a CustomFormatSpec with the TRaSH default score. */
function loadVendoredCustomFormat(source, slug, scoreOverride) {
  const formats = SOURCES[source];
  if (!Object.hasOwn(formats, slug)) throw fail(`unknown vendored custom format '${slug}'`);
  const parsed = JSON.parse(JSON.stringify(formats[slug]));
  const defaultScore = Number.isInteger(parsed.trash_scores?.default) ? parsed.trash_scores.default : 0;
  if (!Array.isArray(parsed.specifications) || parsed.specifications.length === 0) {
    throw fail(`vendored custom format '${slug}' has no specifications`);
  }
  return {
    name: parsed.name,
    include: [],
    exclude: [],
    score: scoreOverride ?? defaultScore,
    include_custom_format_when_renaming:
      parsed.include_custom_format_when_renaming === true || parsed.includeCustomFormatWhenRenaming === true,
    specifications: parsed.specifications,
  };
}
