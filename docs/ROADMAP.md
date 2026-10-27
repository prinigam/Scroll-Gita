# Delivery roadmap

Estimates assume 25–30 focused hours/week; external accounts, content review and store review affect dates. Scope aims for reference parity, delivered in reviewable increments. No production deployment or paid action without approval.

| Sprint         | Goal                           | Measurable acceptance                                                                                                                       |
| -------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1, weeks 1–2   | Foundation and local prototype | Documents, Expo/Rails scaffolds, schema/migrations, validated fixtures, SQLite feed, automated checks; device limitations reported          |
| 2, weeks 3–4   | Core reader                    | Approved offline data or explicit license blocker; chapter/jump navigation, language, progress; restart and navigation tests                |
| 3, weeks 5–6   | Offline MVP and TestFlight     | Bookmarks, settings, font/transliteration, themes, airplane-mode cold start, VoiceOver review; development build and internal beta          |
| 4, weeks 7–8   | Backend and study              | Secure installation auth, curated study, grounded guide adapters, quotas/cost accounting, failure tests and compatible content manifest     |
| 5, weeks 9–10  | Commercial/engagement features | Verified RevenueCat purchases/restoration, daily verse, opt-in reminders, share text/image; clear free/paid boundaries                      |
| 6, weeks 11–12 | iOS release                    | Regression, physical performance, content/legal/privacy gates, beta feedback, screenshots, signing, crash strategy and App Store submission |
| 7, weeks 13–15 | Android                        | Platform/large-text review, Play Billing/restoration, offline regressions, signing and Play submission                                      |

## Milestones

M1 week 2: reproducible foundation. M2 week 3: local mobile/content loop. M3 week 5: reading functionality complete. M4 week 6: internal TestFlight. M5 week 10: agreed iOS release scope complete. M6 week 12: iOS release target subject to review. M7 week 15: Android target subject to testing/review requirements.

## Full parity backlog

Search and theme exploration, basic/advanced study, guided/custom plans, chapter completion, personal notes, widgets, comparison and auto-scroll are explicit product targets. Schedule these after reader quality is established; adding them to the same 12-week release may require extending the estimate. Audio and journal require a separate scope decision. No silent reduction in the overall target.

## Sprint 1 review boundary

Stop after foundation/prototype validation. Report commands, results, blockers and remaining manual checks. No claim of complete scripture, successful native build, measured frame rate, App Store readiness or exact installed-app parity without evidence.

## External setup

Apple Developer/TestFlight, Xcode or EAS credentials, production bundle identifiers, hosting, AI account and RevenueCat must be configured at the appropriate milestone. No notification permission prompt before reminders are requested. Content sourcing proceeds independently of prototype engineering.
