# Elixir extensions

Public source for extensions published to the Elixir extension marketplace.
Every marketplace release names an exact commit in this repository, and each
Elixir server checks the downloaded package against that commit before it
installs anything.

| Folder | Extension | What it does |
| --- | --- | --- |
| `torrentio-source` | Torrentio-Compatible Source | Finds download candidates for movies and TV through a Torrentio-compatible addon. |
| `arr-stack` | Arr Stack | Runs Sonarr, Radarr and Prowlarr from their official images and connects them to Elixir. |

Each folder is a complete extension: `manifest.yaml`, `LICENSE`, the code in
`src/` and its tests in `test/`. The extensions run in Elixir's sandboxed
JavaScript runtime with only the platform SDK; they have no other dependencies.

## Tests

Node.js 22 or later:

```sh
cd torrentio-source && npm test
cd arr-stack && npm test
```

`_shared/test-sdk` is a test-only stand-in for the platform SDK, used by the
Arr Stack tests. It is not part of any extension.

## License

MIT. See `LICENSE` in each extension folder and, for the rest of this repository, `LICENSE` at the root.
