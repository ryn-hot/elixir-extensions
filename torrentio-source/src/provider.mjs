// source-js-v1 entrypoint for acquisition.candidate_provider (contract v1).
// The runner passes {schema_version, capability, operation, request}, where
// `request` is the existing candidate-provider invocation envelope
// ({schemaVersion, request, provider}). Network access and the optional addon
// path (which can embed debrid credentials) come from the platform SDK.
import { fetch, getSecret } from "@elixir/sdk/v1";
import { searchCandidates } from "./torrentioProvider.mjs";

const CAPABILITY = "acquisition.candidate_provider";

function reply(status, body) {
  return { schema_version: 1, status, body };
}

function failure(status, code, message) {
  return reply(status, { error: { code, message } });
}

async function optionalSecret(key) {
  try {
    const value = await getSecret(key);
    return typeof value === "string" ? value : "";
  } catch {
    return "";
  }
}

export async function invoke(input) {
  if (input?.schema_version !== 1 || input?.capability !== CAPABILITY) {
    return failure(400, "invalid_request", "Unsupported candidate provider request.");
  }
  if (input.operation === "health") {
    return reply(200, { status: "healthy", contractVersions: [1] });
  }
  if (input.operation !== "search") {
    return failure(400, "unsupported_operation", "Unsupported candidate provider operation.");
  }
  const invocation = input.request && typeof input.request === "object" ? input.request : {};
  const provider = invocation.provider && typeof invocation.provider === "object" ? invocation.provider : {};
  const config = { ...(provider.config && typeof provider.config === "object" ? provider.config : {}) };
  const addonPath = await optionalSecret("addon_path");
  if (addonPath) {
    config.addonPath = addonPath;
  }
  try {
    const result = await searchCandidates(
      { ...invocation, provider: { ...provider, config } },
      { fetchImpl: fetch }
    );
    return reply(200, result);
  } catch (error) {
    const invalid = error?.statusCode === 400;
    return failure(
      invalid ? 400 : 502,
      invalid ? "invalid_request" : "provider_failure",
      String(error?.message ?? "Source search failed.")
    );
  }
}
