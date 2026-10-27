import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildContent } from './build.mjs';
import { contentSha256 } from './approval.mjs';
import { validateContent } from './validate.mjs';

const catalog = JSON.parse(
  readFileSync(new URL('../source-candidates.json', import.meta.url), 'utf8'),
);
export const candidateSource = catalog.candidates.find(
  (source) => source.id === 'hansi-gita-corpus',
);

export function importHansi(buffer) {
  const checksum = createHash('sha256').update(buffer).digest('hex');
  if (checksum !== candidateSource.sha256)
    throw new Error(
      'Publisher data changed: review the new download and update its pinned checksum explicitly',
    );
  const raw = JSON.parse(buffer.toString('utf8'));
  if (
    raw.publisher !== candidateSource.publisher ||
    raw.generated !== candidateSource.publisher_generated_date ||
    raw.counts?.verses !== 700 ||
    raw.counts?.chapters !== 18
  ) {
    throw new Error(
      'Unexpected publisher identity, version or declared coverage',
    );
  }
  const data = mapHansi(raw, checksum);
  validateContent(data);
  for (const verse of data.verses) {
    if (
      !/[\u0900-\u097f]/u.test(verse.sanskrit) ||
      !/[\u0900-\u097f]/u.test(verse.translations.hi.text) ||
      !/[A-Za-z]/u.test(verse.translations.en.text) ||
      !verse.transliteration?.trim()
    ) {
      throw new Error(
        `Missing expected script/transliteration at ${verse.ref}`,
      );
    }
    if (JSON.stringify(verse).includes('\ufffd'))
      throw new Error(`Unicode replacement character at ${verse.ref}`);
  }
  return data;
}

// Pure field mapping; importHansi supplies identity, checksum and coverage validation.
export function mapHansi(raw, checksum) {
  const version = `${raw.generated};sha256:${checksum}`;
  const source = (id, title, license) => ({
    id,
    title,
    author: raw.publisher,
    url: candidateSource.terms_url,
    license,
    attribution: `${raw.publisher}. ${title}. Source revision ${raw.generated}. ${candidateSource.terms_url}`,
    version,
  });
  return {
    schema_version: 1,
    content_version: '0.1.0-hansi-review',
    sample: false,
    sources: [
      source(
        'hansi-sanskrit-iast',
        'Bhagavad Gita Sanskrit transcription and mechanically generated IAST',
        'LicenseRef-Publisher-Public-Domain-Claim',
      ),
      source(
        'hansi-english',
        'Bhagavad Gita English translation',
        'LicenseRef-Hansi-Attribution-Terms',
      ),
      source(
        'hansi-hindi',
        'Bhagavad Gita Hindi translation',
        'LicenseRef-Hansi-Attribution-Terms',
      ),
    ],
    chapters: raw.chapters.map((chapter) => ({
      number: chapter.n,
      title: chapter.sanskrit,
      verse_count: chapter.verses,
    })),
    verses: raw.verses.map((verse) => ({
      ref: verse.ref,
      chapter: verse.chapter,
      verse: verse.verse,
      sanskrit: verse.sanskrit,
      source_id: 'hansi-sanskrit-iast',
      transliteration: verse.iast,
      translations: {
        en: { text: verse.english, source_id: 'hansi-english' },
        hi: { text: verse.hindi, source_id: 'hansi-hindi' },
      },
    })),
  };
}

export function reviewHansi(buffer, outputDirectory) {
  const data = importHansi(buffer);
  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(
    join(outputDirectory, 'hansi.candidate.json'),
    JSON.stringify(data, null, 2) + '\n',
  );
  const manifest = buildContent(
    data,
    join(outputDirectory, 'hansi.candidate.db'),
  );
  const report = {
    status: 'review-required',
    publisher: candidateSource.publisher,
    source_url: candidateSource.download_url,
    terms_url: candidateSource.terms_url,
    upstream_sha256: candidateSource.sha256,
    content_sha256: contentSha256(data),
    manifest,
    coverage: data.chapters.map((chapter) => ({
      chapter: chapter.number,
      expected: chapter.verse_count,
      actual: data.verses.filter((verse) => verse.chapter === chapter.number)
        .length,
    })),
    scripts_and_encoding: 'checked',
    exact_upstream_mapping: true,
    release_blockers: [
      'Explicit commercial/offline redistribution permission for modern translations',
      'Sanskrit edition identification and editorial review of all three languages',
    ],
    numbering_note:
      '700-verse edition; 13.1 begins idam sariram. Do not merge a 701-verse edition by numeric reference alone.',
  };
  writeFileSync(
    join(outputDirectory, 'report.json'),
    JSON.stringify(report, null, 2) + '\n',
  );
  return report;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const input = resolve(
    root,
    process.argv[2] ?? '.local/content-sources/hansi-gita-corpus.json',
  );
  const output = resolve(root, '.local/content-review/hansi');
  const report = reviewHansi(readFileSync(input), output);
  console.log({
    status: report.status,
    verses: report.manifest.verses,
    chapters: report.manifest.chapters,
    production_approved: report.manifest.production_approved,
    output,
  });
}
