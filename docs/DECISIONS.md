# Decision register

| ID  | Decision                                          | Reason/tradeoff                                                                                             |
| --- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 001 | npm workspaces + separate Rails service           | Familiar monorepo without extra build orchestration                                                         |
| 002 | Expo SDK 58, React Native 0.88, React 19.3        | Official current stable template and compatible Expo-installed native packages; native checks pending       |
| 003 | Ruby 3.4.2, Rails 8.1.4, PostgreSQL 18            | Available modern Ruby; current stable Rails verified from official release page                             |
| 004 | Two SQLite files                                  | Isolate replaceable canonical content from irreplaceable user data; application integrity checks span files |
| 005 | FlatList paging first                             | Standard native primitive; profile on hardware before alternatives                                          |
| 006 | Explicit non-scriptural fixtures                  | No approved translation rights; unblock engineering without inventing scripture                             |
| 007 | JSON Schema + semantic checks + SQLite generation | Validate structure, provenance, coverage and ordering before bundling                                       |
| 008 | Node 24 LTS for tooling, tested locally on 26.10  | Built-in SQLite/TypeScript support; CI must verify the LTS path                                             |
| 009 | Rails-only AI and verified entitlements           | Keep secrets/cost controls server-side; no client premium trust                                             |
| 010 | Rails Minitest and Maestro later                  | Conventional API tests; lightweight device journey tests when runnable app/build exists                     |
| 011 | Functional parity delivered incrementally         | User explicitly wants the reference experience; later features are deferred, not discarded                  |

## Open

- Choose production scripture sources, edition/numbering, reviewers and content license approvals.
- Verify exact reference interactions through an installed-app walkthrough.
- Choose final brand/bundle IDs and approve hosting/release accounts.
- Evaluate additional reference features against the 12-week release estimate.
- Audit dependency findings; do not apply forced framework downgrades to satisfy an advisory mechanically.

## Official version references

- [Expo create-expo-app](https://docs.expo.dev/more/create-expo/)
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Rails releases](https://rubyonrails.org/category/releases)

The lockfiles and executed validation, rather than unbounded package ranges, determine the actual installed baseline. Update this register whenever a meaningful architecture or compatibility decision changes.
