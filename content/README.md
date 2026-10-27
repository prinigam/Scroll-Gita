# Content pipeline

Requires Node 24+ and `npm install` at the repository root.

```sh
npm run content:validate
npm run content:build
npm run content:verify
npm run test:core
```

The default input is `source/sample.json`. It contains original layout placeholders, **not scripture**. Generation writes `apps/mobile/assets/content/gita_content.db` and its size/checksum manifest. Commit both when input or schema changes. Use `node content/scripts/build.mjs path/to/approved.json --production` to build an approved release. `npm run content:release` intentionally fails with the current sample input.

`schema.json` specifies required fields and rejects unknown properties. Validation additionally enforces unique source/chapter/reference IDs, stable reference coordinates, known source IDs, canonical order, ranges, both languages and complete coverage for non-sample datasets. Whitespace-only text is invalid. Production rejects sample datasets and placeholder sources. Structural validation does not constitute content-rights approval.

Sources require title, author, URL (null allowed for fixtures), license, attribution and source version. Content version and SQLite schema version are distinct. Bump the content version whenever published content changes; published releases are immutable. Explanations exist in the SQL schema but their editorial ingestion/review pipeline is deferred; no AI content is imported as canonical scripture.

Do not download, scrape or substitute text from competitor apps. See `licenses/README.md` for the approval gate.

## Source candidates and approvals

`npm run content:review` imports the pinned Hansi publisher file from ignored local download storage and generates a review-only JSON/SQLite candidate and report in `.local`. It never changes the mobile bundle. See [sourcing instructions](../docs/CONTENT_SOURCING.md). The checksum catalog is `source-candidates.json`; the approval register is `release-approvals.json`.

Production validation requires explicit rights/editorial approval bound to a deterministic SHA-256 of the complete parsed content (object keys sorted recursively, array/text order preserved), plus version/license-specific commercial and offline evidence for every source. Whitespace-only JSON formatting changes do not invalidate approval; changes to text, sources, ordering or release version do. Populate approval records only after real review and permission evidence exist. There are currently no approved releases.

Build manifests now contain `production_approved`. It is computed from production validation and checked by bundled-content verification and the EAS production guard. The sample remains in the app until a complete source is approved and activated.
