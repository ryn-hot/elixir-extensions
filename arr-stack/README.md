# Arr Stack

One marketplace extension that runs Sonarr, Radarr and Prowlarr from their
official linuxserver.io images, each pinned by digest, and wires them to
Elixir's built-in qBittorrent and NZBGet. It loads ten public indexers into
Prowlarr and offers NZBGeek as an optional add-on.

- `manifest.yaml` declares everything under `stack`: the three container
  modules, fourteen connectors and the setup steps (blueprint). Elixir's
  orchestrator runs the containers in its sandbox: no Docker socket, minimal
  capabilities, memory and process limits, web pages on the server only.
- `src/main.mjs` runs in Elixir's long-lived extension executor and answers
  Elixir's general-purpose interfaces:
  - `media.manager`, for Sonarr (`kind: "series"`) and Radarr (`kind:
    "movie"`), in `src/manager.mjs`: Find Media's `lookup`, `add`,
    `acquisition_status` and `imported_files`; release recovery's `queue`,
    `history`, `mark_failed` and `search_item`; the control screens'
    `status`, `download_clients`, `set_download_client_priority`, `command`
    and `remove_item`.
  - `indexer.list`, for Prowlarr, in `src/indexers.mjs`: `status`,
    `indexers`, `indexer_names`, `indexer_proxy_names` and `remove_proxies`
    (uninstall cleanup).

  - Setup, for every member (Elixir's orchestrator drives it): first start
    (`bootstrap_files`, `bootstrap` in `src/bootstrap.mjs`: read the API key
    from `config.xml`, require a login for remote web access), readiness
    (`read_state`) and the connectors' setup patches (`evaluate_patch`,
    `apply_patch` in `src/patches.mjs`: root folders, download clients and the
    quality policy for Sonarr/Radarr, indexers and app links for Prowlarr).
    The quality policy's custom formats are in `src/quality-policy*.mjs`.
  - `web.page`, for every member, in `src/web.mjs`: how Elixir's proxy opens
    the app's own web page (the `X-Api-Key` header with the member's stored
    key, and the base path in its pages and `initialize.json`).

  It reaches the containers only as
  `http://<member>.stack/...`, which Elixir maps to that member on this
  computer, and reads each member's API key with `getSecret('<member>.api_key')`
  (`src/arr.mjs`).

Prowlarr's app links name the other members as `http://<member>.stack:<port>`;
Elixir fills in each member's address and stored key.

Tests: `npm test` (scripted replies). `test/live/check.mjs` runs the same
operations against real Sonarr and Radarr; the server's live Arr Stack test
runs it, and also drives Elixir's own Find Media, control-screen and web-page
routes through this module against the real apps.
