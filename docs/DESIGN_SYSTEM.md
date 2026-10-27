# Design system — reader foundation

## Experience

Functional reference: Scroll The Bible. Original visual direction: quiet typography, warm paper, forest-charcoal dark surfaces, restrained gold, generous spacing. The first screen should make reading immediately obvious. Do not copy competitor artwork or branding. Prototype title is internal, not a cleared commercial mark.

## Tokens

| Role           | Light   | Dark    |
| -------------- | ------- | ------- |
| background     | #F7F3EA | #171D19 |
| surface        | #EEE7D9 | #242D26 |
| primary text   | #262820 | #F3ECDC |
| secondary text | #6C6E62 | #ACAFA0 |
| accent         | #8B592C | #DFBA7E |
| border         | #D9D2C3 | #3D473E |

Spacing scale: 4, 8, 12, 16, 24, 32, 40. Minimum interactive target 44×44 points. Avoid layout relying on color alone. Contrast requires automated/manual review before release.

## Typography

Use platform fonts in the prototype; verify Devanagari shaping on physical iPhones. Starting sizes: Sanskrit 27/43, translation 20/31, metadata 11. Allow font scaling and full wrapping; no `numberOfLines` truncation on scripture. Select and bundle a licensed Devanagari font only after visual and license review. Transliteration and vocabulary views come in later milestones.

## Reader composition

Safe-area header with project wordmark and language control; chapter/verse reference; Sanskrit; subtle divider; translation; attribution/reference. Full-height vertical paging uses available reader height, not assumed screen height. Internal scrolling exposes text longer than a page. At larger text scales and with VoiceOver, outer paging is disabled and explicit next/previous controls remain reachable. Final behavior must be checked for touch, VoiceOver and small screens.

Sample content has a persistent visible warning. Empty, initialization, content failure and persistence failure states must state what happened and offer an appropriate recovery. The app must never display fake success for bookmarking, sharing, study or payments.

## Screen roadmap

Prototype: initialization, reader, a local verse-details route with explicit study-content availability, and recovery states. Core MVP: onboarding, reader, chapter explorer/list, saved verses and settings. Study milestone: Deep Study and guide. Commercial release: paywall/restoration, daily verse and sharing. Parity expansion: Discover, search, reading plans, notes, widgets and comparison.

## Accessibility and motion

Preserve Dynamic Type, reading order, named controls, disabled button states, safe areas and meaningful error announcements. Respect reduced motion for any added animation. Existing navigation controls use no animated programmatic jump. Never require a gesture as the only way to navigate. Audit landscape and the largest supported text size before beta.
