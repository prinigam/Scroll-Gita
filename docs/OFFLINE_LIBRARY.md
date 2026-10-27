# Offline chapter navigation and bookmarks

Implemented 2026-10-28. This milestone extends the reader foundation with local chapter browsing and saved verses. The dataset is unchanged: **three non-scriptural sample references across two chapter fixtures**, not the complete Gita.

## User-visible changes

- Tap **GITA / Chapters ⌄** at the top of the reader to browse bundled chapters. Each chapter shows actual available sample coverage rather than implying the whole chapter is present.
- Open a chapter and select a verse to return directly to that page in the feed. The chapter explorer also offers Resume when the saved reference is available.
- Tap **Save verse** in the feed or verse details. A successful write changes the button to **Saved ✓** on both screens.
- Open **Saved ↗** in the reader header to view bookmarks, open a saved verse, or remove one. The empty state explains how to save a verse.
- A saved reference missing from a future content release is retained with an unavailable message and can still be removed.
- Loading, retry and write-failure states distinguish an unavailable library from an empty saved list. Failed writes do not falsely change the saved indicator.

## Data and navigation behavior

SQLite remains authoritative. Zustand mirrors bookmark references in memory after startup and successful writes; it is not a second durable store. Bookmarks remain device-local. No API calls, accounts or network dependencies were added.

The existing version-1 bookmark schema is sufficient, so no migration or content database replacement is required. Existing reading progress and settings are preserved.

The repository serializes progress writes and bookmark writes separately. A failed write is returned to its caller while the internal queue recovers for the next operation. Progress reads wait for pending writes. Browsing chapter/saved lists never changes reading position; selecting a reference validates and persists it before returning to the reader.

The reader reloads its saved position on focus. Viewability callbacks from an old or blurred feed cannot overwrite a later selection. Route loading ignores responses after blur/unmount. This matters because stack navigation can retain the previous reader component in memory.

## Files

- `apps/mobile/src/app/chapters/index.tsx`, `chapters/[number].tsx`, `bookmarks.tsx`: library routes.
- `apps/mobile/src/repositories/reader.ts`: chapter queries, bookmark persistence and write ordering.
- `apps/mobile/src/components/BookmarkButton.tsx`, `VerseRow.tsx`: shared accessible actions and list rows.
- Reader, verse-card, study route, provider and store: navigation and shared saved state.
- `useFocusedResource.ts`, `useOpenVerse.ts`: local focus refresh and validated return-to-reader flow.
- Mobile component/hook/screen tests and `packages/storage/test/library.test.mjs`: regressions and real SQLite integration coverage.
- `.prettierignore`: excludes generated `expo-env.d.ts` from formatting checks.

## Verification

Automated verification for this milestone:

- 12 real SQLite/content tests: chapter ordering/coverage, both languages, idempotent saves, removal, restart persistence, orphan retention, sort order and slow progress-write ordering, alongside the existing content/migration checks.
- 14 mobile tests: existing verse rendering/navigation plus bookmark state/failure/retry, delayed selection, chapter/saved routes, empty saved state, removal refresh and reader focus restoration.
- Strict TypeScript, ESLint, Prettier, bundled content/source/checksum checks.
- iOS JavaScript/Hermes export including all library routes.

This is a JavaScript bundle check, not a native build or a physical-device UI test. The base reader was confirmed on the user's iPhone earlier; the new navigation/bookmark flows still require the following device review. Existing content licensing and upstream dependency-advisory notes in `VALIDATION.md` remain applicable. Rails code and API contracts were not changed.

## iPhone review

Reload the existing Expo Go session. No dependency install or Rails server is required.

1. Read sample `1.2`, browse Chapters, then go back without selecting anything. Confirm the reader remains at `1.2`.
2. Open Chapters → Chapter 2 → `2.47`. Confirm the reader shows page `3 / 3`.
3. Save `2.47`, open verse details, and confirm **Saved ✓** is selected there too.
4. Open Saved, select `2.47`, then remove it from the reader or details. Return to Saved and confirm the empty state.
5. Save two references, switch English/Hindi, and confirm their translations and saved indicators agree across screens.
6. Close and reopen the app. Confirm bookmarks and the last selected reading position remain.
7. Check light/dark appearance, larger text, long-page scrolling and reachable action buttons. Standalone airplane-mode startup still needs a development/production build because Expo Go development sessions depend on Metro to load code.

After this review, the next product dependency is approved scripture content, followed by the remaining reader settings/accessibility work. Full reference-app parity remains the overall target.
