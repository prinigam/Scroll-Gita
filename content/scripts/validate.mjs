import Ajv from 'ajv';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const chapterCounts = [
  47, 72, 43, 42, 29, 47, 30, 28, 34, 42, 55, 20, 34, 27, 20, 24, 28, 78,
];
const schema = JSON.parse(
  readFileSync(new URL('../schema.json', import.meta.url), 'utf8'),
);
const checkSchema = new Ajv({ allErrors: true }).compile(schema);

export function validateContent(data, { production = false } = {}) {
  if (!checkSchema(data))
    throw new Error(`Schema validation: ${JSON.stringify(checkSchema.errors)}`);
  const fail = (message) => {
    throw new Error(message);
  };
  if (production && data.sample)
    fail('Production content cannot be sample content');
  const sources = new Set();
  for (const source of data.sources) {
    if (sources.has(source.id)) fail(`Duplicate source: ${source.id}`);
    sources.add(source.id);
    if (
      production &&
      (!source.url ||
        /fixture|placeholder|pending/i.test(JSON.stringify(source)))
    ) {
      fail(`Production source is not approved: ${source.id}`);
    }
  }
  const chapters = new Map();
  for (const chapter of data.chapters) {
    if (chapters.has(chapter.number))
      fail(`Duplicate chapter: ${chapter.number}`);
    if (chapter.verse_count !== chapterCounts[chapter.number - 1])
      fail(`Incorrect verse count for chapter ${chapter.number}`);
    chapters.set(chapter.number, chapter);
  }
  const seen = new Set();
  let previous = 0;
  for (const verse of data.verses) {
    const expectedRef = `${verse.chapter}.${verse.verse}`;
    if (verse.ref !== expectedRef) fail(`Invalid reference: ${verse.ref}`);
    if (seen.has(verse.ref)) fail(`Duplicate verse: ${verse.ref}`);
    seen.add(verse.ref);
    if (!chapters.has(verse.chapter)) fail(`Missing chapter: ${verse.chapter}`);
    if (verse.verse > chapterCounts[verse.chapter - 1])
      fail(`Verse out of range: ${verse.ref}`);
    const order = verse.chapter * 1000 + verse.verse;
    if (order <= previous) fail(`Incorrect verse ordering: ${verse.ref}`);
    previous = order;
    for (const sourceId of [
      verse.source_id,
      ...Object.values(verse.translations).map((t) => t.source_id),
    ]) {
      if (!sources.has(sourceId)) fail(`Unknown source: ${sourceId}`);
    }
  }
  // A non-sample dataset always claims completeness, even outside release mode.
  if (!data.sample) {
    if (chapters.size !== 18 || seen.size !== 700)
      fail('Complete content requires 18 chapters and 700 verses');
    chapterCounts.forEach((count, index) => {
      for (let verse = 1; verse <= count; verse++) {
        if (!seen.has(`${index + 1}.${verse}`))
          fail(`Missing verse: ${index + 1}.${verse}`);
      }
    });
  }
  return {
    verses: seen.size,
    chapters: chapters.size,
    sample: data.sample,
    version: data.content_version,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const path = process.argv.find((arg) => arg.endsWith('.json'));
  const data = JSON.parse(
    readFileSync(
      path ?? new URL('../source/sample.json', import.meta.url),
      'utf8',
    ),
  );
  console.log(
    validateContent(data, {
      production: process.argv.includes('--production'),
    }),
  );
}
