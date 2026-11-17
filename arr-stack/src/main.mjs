// Arr Stack module. Elixir's orchestrator runs the stack's containers (Sonarr,
// Radarr, Prowlarr; declared in manifest.yaml under `stack`). This module runs
// in Elixir's long-lived extension executor and answers Elixir's
// general-purpose media-manager interface by calling those containers.
//
// Input:  {schema_version: 1, capability, member, operation, request}, where
//         capability is "media.manager" (members sonarr, radarr),
//         "indexer.list" (member prowlarr) or "web.page" (all three).
// Output: {schema_version: 1, status, body}; errors carry body.error {code, message}.
import { ManagerError } from "./arr.mjs";
import { operations as bootstrapOperations } from "./bootstrap.mjs";
import { operations as indexerOperations } from "./indexers.mjs";
import { operations as managerOperations } from "./manager.mjs";
import { applyPatch, evaluatePatch } from "./patches.mjs";
import { operations as webOperations } from "./web.mjs";

// First-start setup, setup patches and readiness apply to every member.
const SETUP = { ...bootstrapOperations, evaluate_patch: evaluatePatch, apply_patch: applyPatch };
const CAPABILITIES = {
  "media.manager": {
    members: new Set(["sonarr", "radarr"]),
    operations: { ...managerOperations, ...SETUP },
  },
  "indexer.list": {
    members: new Set(["prowlarr"]),
    operations: { ...indexerOperations, ...SETUP },
  },
  "web.page": {
    members: new Set(["sonarr", "radarr", "prowlarr"]),
    operations: webOperations,
  },
};

const reply = (status, body) => ({ schema_version: 1, status, body });
const failure = (status, code, message) => reply(status, { error: { code, message } });

export async function invoke(input) {
  const capability = input?.schema_version === 1 && Object.hasOwn(CAPABILITIES, input.capability)
    ? CAPABILITIES[input.capability]
    : null;
  if (!capability) {
    return failure(404, "unsupported_input", "unsupported capability or schema");
  }
  if (!Object.hasOwn(capability.operations, input.operation)) {
    return failure(404, "unsupported_operation", `unsupported operation ${String(input.operation)}`);
  }
  if (!capability.members.has(input.member)) {
    return failure(404, "unsupported_member", `unsupported member ${String(input.member)}`);
  }
  try {
    return reply(200, await capability.operations[input.operation](input.member, input.request ?? {}));
  } catch (error) {
    if (error instanceof ManagerError) return failure(error.status, error.code, error.message);
    return failure(502, "manager_error", String(error?.message ?? error));
  }
}
