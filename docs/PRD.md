# Scroll Gita — technical product requirements

Status: Sprint 1 foundation. Working name only. Owner: project team. Updated: 2026-10-27 (India).

## Intent

Reproduce the functional and interaction model of Scroll The Bible for Bhagavad Gita content: open, read one verse, swipe, tap to understand, and resume effortlessly. Build original code, assets, and brand. An existing equivalent does not reduce the target scope. Public listings establish features; exact installed-app flows remain unverified.

## Audience and platform

Readers new to or returning to the Gita; Hindi and English readers; Sanskrit remains alongside translations. iPhone first, TestFlight then App Store. Android follows using the same React Native application. No account required to read. No ads or tracking SDKs in the initial implementation.

## Product target

1. Full-screen, vertically paged feed in canonical order; next/previous, chapter boundaries, saved position, chapter/verse jump, accessible overflow.
2. All 18 chapters and the chosen 700-verse recension bundled offline, with Sanskrit, approved Hindi/English translations, optional transliteration, provenance, and reviewed study material.
3. Deep Study: plain meaning, Sanskrit terms, context, practical application, related references, source attribution. Scripture, reviewed editorial content, and AI interpretations must be visually distinct.
4. AI guide: verse explanation and free-form questions, grounded in approved sources, references validated, generated material labelled. Provider abstraction behind Rails; quotas, failure handling, cost accounting.
5. Saved verses; chapter explorer; verse list; search; progress; theme, language, font size, transliteration and reminder preferences.
6. Sharing text and original image cards; daily verse and opt-in local reminders.
7. Premium study/AI offerings using RevenueCat, purchase restoration, entitlement verification; all scripture remains free.
8. Reference parity backlog: Discover, basic/advanced study, guided/custom reading plans, notes, completion tracking, widgets, translation comparison and auto-scroll. Audio is optional and requires rights. Journal is a possible later feature, not an inferred Sprint 1 requirement.

Required routes over the full roadmap: initialization, onboarding, reader, study, chapters, chapter verses, bookmarks, guide, settings and paywall. Search/Discover/plans are added as parity milestones without changing the offline foundation.

## Sprint 1 scope and acceptance

- Seven engineering/design documents and a research record.
- Expo Router + strict TypeScript scaffold; Rails API + PostgreSQL scaffold.
- Separate versioned content and user SQLite schemas; actual migration infrastructure.
- JSON schema, rights metadata, ordering/uniqueness/completeness checks, database generation and SHA-256 manifest.
- Locally bundled **explicitly non-scriptural fixtures**, light/dark reader, paged feed, references; progress/language persistence provide early end-to-end validation.
- Mobile component/repository tests, real SQLite tests, Rails health/request tests, type checking, lint and iOS JavaScript export.
- No purchased services, deployment, remote publication or accounts created. No placeholder study actions that appear functional.

## Quality gates

Offline reading must survive airplane-mode cold start. Bookmarks/settings/progress must survive restart. Real-device targets: approximately 2-second cold start, smooth 60 FPS paging, stable memory; not established by bundling or simulator tests. VoiceOver, reduced motion, Dynamic Type, long Sanskrit/Hindi wrapping, small screens and API failures require explicit review. Test purchases/restoration, AI quotas, privacy disclosures, content rights and release completeness before launch.

## Dependencies and unresolved decisions

Production Sanskrit edition, licensed Hindi/English translations, commentary review and transliteration source are unapproved. Choose a distinct public brand before release; existing commercial use is established, trademark clearance is not. Need an installed reference walkthrough to verify exact navigation, gestures and paywall timing. Apple Developer account, EAS project, bundle ID ownership, signing, AI credentials, RevenueCat and hosting are external setup tasks. The current bundle identifiers are development placeholders.

## Success criteria

First milestone: a reproducible reader that starts without network, displays only approved fixture data, pages through local verses, switches languages and resumes after restart. Production milestone: complete reviewed content, reliable offline reader, tested subscriptions and grounded guide, successful release checks. Engagement targets will be set after beta feedback; no analytics SDK is assumed.
