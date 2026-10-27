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
