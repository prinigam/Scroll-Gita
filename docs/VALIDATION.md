# Sprint 1 validation and review

## Scope delivered

Engineering/design documents, research record, npm monorepo, Expo SDK 58 reader scaffold, Rails API scaffold, PostgreSQL configuration, real SQLite schemas, transactional user migration initialization, fixture validation/generation, checksum manifest, repository persistence tests, mobile component tests and CI configuration.

The prototype has local verse paging, references, language switching, system themes, progress restoration, explicit navigation for accessible reading, a local verse-details route, startup/retry/error states and visible fixture labelling. This is the first reader increment, not complete reference-app parity.

## Executed checks

| Check                                                           | Result                                                  |
| --------------------------------------------------------------- | ------------------------------------------------------- |
| Content schema/semantic validation                              | Pass: 3 sample references in 2 chapter fixtures         |
| Generated database/source/checksum consistency                  | Pass                                                    |
| Node real-SQLite content/migration/repository integration tests | 6 passed on Node 26.10 and Node 24.22.1                 |
| Jest/React Native Testing Library                               | 3 passed                                                |
| Strict TypeScript                                               | Pass                                                    |
| ESLint and Prettier                                             | Pass                                                    |
| Expo online dependency compatibility                            | Pass                                                    |
| iOS JavaScript/Hermes export with bundled SQLite                | Pass; includes the final verse-details route            |
| Production content generation using fixtures                    | Expected refusal; sample dataset cannot be released     |
| EAS production build hook using fixtures                        | Expected refusal; no remote build submitted             |
| PostgreSQL local cluster                                        | Initialized and started on isolated Unix socket         |
| Rails dependencies and fresh migrations                         | Pass: Rails 8.1.4; development and test schema migrated |
| Rails migration rollback/reapplication                          | Pass in isolated test database                          |
| Rails request/model tests                                       | 8 passed, 15 assertions, no failures/errors/skips       |
| Rails eager loading / Zeitwerk                                  | Pass                                                    |
| Ruby source syntax                                              | Pass: 23 files                                          |

CI is configured but has not run on GitHub. The local Node test runner emits a benign TypeScript module-detection warning when importing the mobile repository; tests pass. Expo export emits color-environment warnings; export succeeds.

## Known limitations and release blockers

- All text is original layout placeholder material, not scripture or translations. Production source approval, scholarly review and full coverage remain open.
- No Xcode installation; simulator, physical-device UI, airplane-mode cold start, VoiceOver, largest text sizes, nested scrolling and native builds remain untested. No frame-rate or cold-start performance claim is established.
- npm audit reports 3 high-severity entries in the transitive Expo CLI → Zod chain (one underlying advisory, [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)). Expo CLI uses Zod 3; the reported fix is a different major version. Do not force an incompatible override or framework downgrade. Reassess against an upstream compatible fix before release.
- Brand and bundle identifiers are development placeholders. No store account, EAS project, AI provider, RevenueCat or hosting was configured.
- Bookmarks UI, chapter navigation, reviewed study, AI, subscriptions and engagement features are subsequent milestones. Schema presence does not mean those features are implemented.
- API rate limiting uses in-process memory for development; configure shared storage before multi-process production deployment. No business endpoints are exposed yet.

## Next milestone

Review this foundation, verify the reading interaction on an iPhone/development build, approve the content acquisition path, then add chapter navigation and bookmarks. Obtain an installed reference walkthrough for precise screen/interaction mapping as full parity work proceeds.

## Local API environment used for validation

The ignored local Bundler configuration points to `.tools/api-bundle`; it does not require the temporary download helper to run the API. The isolated PostgreSQL server accepts a project-local Unix socket, not TCP connections. For this workspace, run:

```sh
export PGHOST="/Users/PriyanshuNigam/scroll-gita/.local/postgres-socket"
export PGPORT=55432
export PGUSER=PriyanshuNigam
cd services/api
bin/rails server
```

The cluster lives in `.local/postgres`. Start it after a machine restart with:

```sh
/opt/homebrew/opt/postgresql@18/bin/pg_ctl -D .local/postgres -l .local/postgres.log -o '-h "" -k /Users/PriyanshuNigam/scroll-gita/.local/postgres-socket -p 55432' start
```

Run that command from the repository root. The normal fresh-clone PostgreSQL setup is described in the project README.
