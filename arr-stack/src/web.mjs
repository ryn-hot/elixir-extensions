// The apps' own web pages, opened through Elixir's proxy. Elixir signs each
// request in with the member's stored API key in the header the apps expect,
// and rewrites the base path the apps' pages and their initialize.json carry
// so the pages work under the proxy's path ({prefix}).
const PAGE = {
  auth: { header: "X-Api-Key", secret: "api_key" },
  htmlReplace: [
    { find: "urlBase: ''", replace: "urlBase: '{prefix}'" },
    { find: 'urlBase:""', replace: 'urlBase:"{prefix}"' },
  ],
  jsonFiles: [{ path: "initialize.json", set: { urlBase: "{prefix}" }, prefix: ["apiRoot"] }],
};

export const operations = {
  describe: () => JSON.parse(JSON.stringify(PAGE)),
};
