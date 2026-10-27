import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { contentSha256, requireReleaseApproval } from '../scripts/approval.mjs';
import { validateContent } from '../scripts/validate.mjs';
import { importHansi, mapHansi } from '../scripts/review-hansi.mjs';

const sample = () =>
  JSON.parse(
    readFileSync(new URL('../source/sample.json', import.meta.url), 'utf8'),
  );
// Approval-helper fixtures are not an approved release: production validation still rejects samples.
function review(data) {
  return {
    schema_version: 1,
    approved_releases: {
      [data.content_version]: {
        content_sha256: contentSha256(data),
        rights_status: 'approved',
        editorial_status: 'approved',
        reviewed_by: 'TEST ONLY',
        reviewed_on: '2026-10-28',
        sources: Object.fromEntries(
          data.sources.map((source) => [
            source.id,
            {
              version: source.version,
              license: source.license,
              commercial_redistribution: true,
              offline_redistribution: true,
              evidence: 'Test-only evidence; not a real permission grant',
            },
          ]),
        ),
      },
    },
  };
}

test('a source URL or license string cannot self-approve a content release', () => {
  assert.throws(() => requireReleaseApproval(sample()), /no recorded approval/);
});

test('approval is bound to exact text and source metadata, independent of JSON formatting', () => {
  const data = sample();
  const approvals = review(data);
  assert.equal(
    requireReleaseApproval(data, approvals).rights_status,
    'approved',
  );
  const reordered = Object.fromEntries(Object.entries(data).reverse());
  assert.equal(contentSha256(data), contentSha256(reordered));
  data.verses[0].translations.en.text += ' Changed';
  assert.throws(
    () => requireReleaseApproval(data, approvals),
    /changed after approval/,
  );
});

test('commercial, offline and editorial decisions are all required', () => {
  const data = sample();
  const approvals = review(data);
  const release = approvals.approved_releases[data.content_version];
  release.editorial_status = 'not-reviewed';
  assert.throws(
    () => requireReleaseApproval(data, approvals),
    /editorial approval/,
  );
  release.editorial_status = 'approved';
  release.sources[data.sources[0].id].offline_redistribution = false;
  assert.throws(
    () => requireReleaseApproval(data, approvals),
    /commercial\/offline/,
  );
  release.sources[data.sources[0].id].offline_redistribution = true;
  release.sources[data.sources[0].id].commercial_redistribution = false;
  assert.throws(
    () => requireReleaseApproval(data, approvals),
    /commercial\/offline/,
  );
  assert.throws(
    () => validateContent(data, { production: true, approvals: review(data) }),
    /sample/,
  );
});

test('publisher importer rejects changed or unpinned downloads', () => {
  assert.throws(() => importHansi(Buffer.from('{}')), /Publisher data changed/);
});

test('publisher field mapping preserves text and coordinates without generating or renumbering verses', () => {
  const original = sample();
  const raw = {
    generated: 'test',
    publisher: 'Test publisher',
    chapters: original.chapters.map((c) => ({
      n: c.number,
      sanskrit: c.title,
      verses: c.verse_count,
    })),
    verses: original.verses.map((v) => ({
      ref: v.ref,
      chapter: v.chapter,
      verse: v.verse,
      sanskrit: v.sanskrit,
      iast: v.transliteration,
      english: v.translations.en.text,
      hindi: v.translations.hi.text,
    })),
  };
  const mapped = mapHansi(raw, 'test-checksum');
  assert.deepEqual(
    mapped.verses.map((v) => v.ref),
    ['1.1', '1.2', '2.47'],
  );
  assert.equal(mapped.verses[2].translations.hi.text, raw.verses[2].hindi);
  assert.equal(mapped.verses[2].sanskrit, raw.verses[2].sanskrit);
  assert.equal(mapped.verses[2].transliteration, raw.verses[2].iast);
  assert.throws(() => validateContent(mapped), /700 verses/);
});

test('production EAS hook refuses the unapproved bundle while development remains usable', () => {
  const script = new URL(
    '../../apps/mobile/scripts/check-release.cjs',
    import.meta.url,
  );
  const production = spawnSync(process.execPath, [script.pathname], {
    env: { ...process.env, EAS_BUILD_PROFILE: 'production' },
    encoding: 'utf8',
  });
  assert.notEqual(production.status, 0);
  assert.match(production.stderr, /rights and editorial approval/);
  const development = spawnSync(process.execPath, [script.pathname], {
    env: { ...process.env, EAS_BUILD_PROFILE: 'development' },
    encoding: 'utf8',
  });
  assert.equal(development.status, 0);
});
