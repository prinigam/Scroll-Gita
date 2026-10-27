# Scripture sourcing and review

Research date: 2026-10-28. Status: a complete local candidate has been imported and structurally checked; **no production source or content release is approved yet**.

## Findings

| Candidate                                        | Evidence                                                                                                                                                                                                            | Project decision                                                                                                                                                                                                          |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hansi Gita Bhawan Trust publisher download       | [Terms](https://gitabhawan.org.in/gita/research), [JSON](https://gitabhawan.org.in/data/gita-corpus.json); original-translation claim and attribution reuse statement                                               | Best modern-language candidate; request explicit commercial/offline permission and editorial information                                                                                                                  |
| Annie Besant, fourth edition, 1922               | [Edition and rights notice](<https://en.wikisource.org/wiki/Bhagavad-Gita_(Besant_4th)>); [chapter 13](<https://en.wikisource.org/wiki/Bhagavad-Gita_(Besant_4th)/Discourse_13>)                                    | Historical English/Sanskrit alternative. The site identifies US public-domain status; assess intended distribution territories and transcription rights. Chapter 13 numbers differ from the selected 700-verse convention |
| Madhavrao Sapre's Hindi Gita Rahasya translation | [Wikisource author](https://hi.wikisource.org/wiki/लेखक:माधवराव_सप्रे), [project bibliography documenting 1917 first publication](https://hi.wikisource.org/wiki/विकिस्रोत:भारतीय_विकिस्रोत_संपादनोत्सव/नवंबर_२०२०) | Historical Hindi candidate; requires edition-specific extraction, proofreading, verse alignment and rights review rather than assuming a scan is app-ready                                                                |
| AdiyogiArts/gita-json                            | [Repository](https://github.com/AdiyogiArts/gita-json) names multiple modern translators alongside its MIT label                                                                                                    | Not cleared for use: independently establish rights to translations rather than treating a repository label as sufficient                                                                                                 |
| vedicscriptures/bhagavad-gita                    | [Repository](https://github.com/vedicscriptures/bhagavad-gita) lists many translation/commentary authors                                                                                                            | Not cleared for this project; code/data licensing and upstream text rights require separate verification                                                                                                                  |
| JDhruv14/Bhagavad-Gita_Dataset                   | [Dataset card](https://huggingface.co/datasets/JDhruv14/Bhagavad-Gita_Dataset/blob/main/README.md) references an IGNCA scan                                                                                         | Not cleared: translator/edition/license evidence is incomplete for our use                                                                                                                                                |

These are sourcing decisions, not legal determinations about other projects. No competitor app was scraped. No translation or missing verse was generated.

## What was actually verified

The publisher file dated 2026-09-17 was downloaded into `.local/content-sources/hansi-gita-corpus.json`, pinned by SHA-256 and imported without changing text or reference coordinates.

- 18 chapters and 700 unique, ordered references, with all expected chapter counts.
- 700 Sanskrit entries, 700 IAST strings, 700 English and 700 Hindi translations; no missing required fields or Unicode replacement characters.
- Expected Devanagari/Latin script presence, without claiming grammatical or translation accuracy.
- A local SQLite database was generated and passed its integrity/foreign-key checks. Source provenance and per-language source IDs are preserved.
- Complete counts are independent of publication permission and editorial accuracy. Full review of all verses/translations has not been performed.

The committed [review report](../content/reviews/hansi-2026-10-28.json) records the exact download/content/database hashes and chapter coverage. The raw corpus, mapped candidate and SQLite candidate remain in ignored `.local` storage while permission is unresolved.

## Numbering decision

The candidate follows the chosen 700-verse convention: chapter 13 has 34 numbered verses, and `13.1` begins with the body/field teaching. Besant's chapter includes Arjuna's preceding question as `13.1`, with that body/field teaching at `13.2`. Importing the latter by numeric reference alone would shift citations. Preserve source numbering and record any reviewed crosswalk; never silently drop or relabel scripture to make row counts fit.

## Reproduce the local review

From the repository root, download the publisher-offered file:

```sh
mkdir -p .local/content-sources
curl --fail --location --output .local/content-sources/hansi-gita-corpus.json https://gitabhawan.org.in/data/gita-corpus.json
npm run content:review
```

The importer refuses any download whose bytes differ from the pinned revision. It writes only `.local/content-review/hansi/`: `hansi.candidate.json`, `hansi.candidate.db`, and `report.json`. It does not replace the mobile bundle. Review a changed upstream release explicitly before updating its checksum.

## Remaining actions

1. Await the publisher's response to the [permission request](../content/licenses/HANSI_PERMISSION_REQUEST.md). The user confirmed sending the email themselves; no email was sent through the app connector. Permission remains pending.
2. Preserve the actual license/grant and record intended territories, commercial/offline rights, attribution, modifications/sharing and AI-context permissions. [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) is one possible standard grant for sharing/adaptation, including commercial uses, with its attribution and other conditions; the publisher has **not** chosen it for this corpus.
3. Identify the Sanskrit source editions and conduct editorial review, including chapter-13 alignment, Sanskrit errors, Hindi/English faithfulness and interpretive tradition.
4. Add reader-facing source attribution/license notices and a reviewed active-content selection path.
5. Record approval for the exact content hash, build a new immutable content version, and then replace the three fixtures. Existing user data must remain intact; language/navigation/bookmark tests must run against the full release before activation.

## Enforced release gate

`content/release-approvals.json` currently contains no approvals. Production validation now requires a matching content fingerprint, named/dating reviewer record, rights and editorial decisions, and version/license-specific commercial/offline evidence for every source. Changing text or provenance invalidates approval.

Generated manifests include `production_approved`; the EAS production hook refuses missing/false approval, as well as fixtures. An ordinary content build may create review artifacts, but it cannot confer release approval. `npm run content:release` remains blocked with the current bundled sample data.

## Verification

Run `npm run check` for the content, SQLite and mobile suite. Additional tests cover approval binding, missing commercial/offline/editorial decisions, pinned downloads, lossless field mapping and EAS production refusal. The real candidate import is a separately executed local review, not a synthetic test pretending to verify translation accuracy.
