import assert from "node:assert/strict";
import test from "node:test";

import { invoke } from "../src/main.mjs";

const describe = (member) =>
  invoke({ schema_version: 1, capability: "web.page", member, operation: "describe", request: {} });

test("every member's web page signs in with its stored API key and rewrites its base path", async () => {
  for (const member of ["sonarr", "radarr", "prowlarr"]) {
    const reply = await describe(member);
    assert.equal(reply.status, 200, member);
    assert.deepEqual(reply.body.auth, { header: "X-Api-Key", secret: "api_key" });
    assert.ok(reply.body.htmlReplace.some((rule) => rule.replace.includes("{prefix}")));
    assert.deepEqual(reply.body.jsonFiles, [
      { path: "initialize.json", set: { urlBase: "{prefix}" }, prefix: ["apiRoot"] },
    ]);
  }
  assert.equal((await describe("nzbget")).status, 404);
});

test("the description is a copy each time", async () => {
  const first = await describe("sonarr");
  first.body.auth.header = "changed";
  assert.equal((await describe("sonarr")).body.auth.header, "X-Api-Key");
});
