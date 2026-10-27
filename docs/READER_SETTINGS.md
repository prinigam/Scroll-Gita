# Reader settings

Open the gear button in the reader header. Preferences are available offline and restored before navigation opens on the next launch.

| Preference      | Default  | Options                                    | SQLite key             |
| --------------- | -------- | ------------------------------------------ | ---------------------- |
| Translation     | English  | English, Hindi                             | `language`             |
| Appearance      | System   | System, Light, Dark                        | `theme`                |
| Verse text size | Standard | Standard, Large (1.2×), Extra large (1.4×) | `text_size`            |
| Transliteration | Off      | Off, On when supplied by the content       | `show_transliteration` |

The existing version 1 `gita_user.db` settings table stores these values; no database migration or reset is needed. Existing language selections, bookmarks and reading progress are preserved. Missing or invalid values use the defaults above without deleting unfamiliar settings. Writes are serialized. The visible selection changes only after a successful write; a failed save leaves the old selection and shows a retry message.

Appearance applies to screen surfaces, navigation headers and status bar. System follows the phone's current appearance; explicit Light/Dark override it. Verse sizing applies to Sanskrit, translation and supplied transliteration in both feed and details. The preview is labeled as a layout example. Transliteration is never generated when content lacks it. The bundled content remains the clearly labeled non-scriptural fixture release while corpus approval is pending.

OS font scaling stays enabled in addition to the app's verse size. The reader disables outer swipe paging when a screen reader is active or OS scale × verse scale exceeds 1.25. Internal scrolling exposes overflow text; Previous/Next remain available. Header controls wrap, and the footer stacks at OS scale above 1.75. Scripture text is never truncated.

## Validation

Automated checks cover real SQLite restart persistence, legacy/invalid settings, preservation of bookmarks/progress, write ordering and recovery, theme resolution, settings controls, preview sizes, feed/details typography and transliteration, and explicit navigation with large text or a screen reader. These checks do not prove native layout or VoiceOver behavior.

## Physical iPhone checklist

1. Reload Expo Go and open the gear button. Change language, appearance, verse size and transliteration; return to the feed and open verse details.
2. Close and reopen the app. Confirm preferences, saved verses and reading position survive.
3. Select System appearance, change iOS appearance, then check explicit Light/Dark overrides.
4. Try the largest iOS text size, narrow portrait and landscape. Read every line using internal scrolling; confirm Previous/Next and navigation controls remain reachable.
5. Enable VoiceOver. Check labels, focus order, settings selection announcements and verse navigation. Disable VoiceOver and confirm swipe paging returns at normal text size.
6. The current fixtures have no transliteration. Toggling it should add no invented text; supplied-text rendering is covered by automated tests until approved content is bundled.

Native layout and VoiceOver checks remain pending on a physical device.
