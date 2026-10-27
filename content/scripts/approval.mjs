import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const approvals = JSON.parse(
  readFileSync(new URL('../release-approvals.json', import.meta.url), 'utf8'),
);

function sorted(value) {
  if (Array.isArray(value)) return value.map(sorted);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sorted(value[key])]),
    );
  }
  return value;
}

// Whitespace and object-key order do not change approval; text, array order and sources do.
export function contentSha256(data) {
  return createHash('sha256')
    .update(JSON.stringify(sorted(data)))
    .digest('hex');
}

export function requireReleaseApproval(data, register = approvals) {
  const review =
    register.schema_version === 1
      ? register.approved_releases?.[data.content_version]
      : null;
  if (!review)
    throw new Error(
      `Content release ${data.content_version} has no recorded approval`,
    );
  if (review.content_sha256 !== contentSha256(data))
    throw new Error('Content changed after approval; a new review is required');
  if (
    review.rights_status !== 'approved' ||
    review.editorial_status !== 'approved' ||
    !review.reviewed_by?.trim() ||
    !/^\d{4}-\d{2}-\d{2}$/.test(review.reviewed_on ?? '')
  ) {
    throw new Error('Release requires recorded rights and editorial approval');
  }
  for (const source of data.sources) {
    const permission = review.sources?.[source.id];
    if (
      !permission ||
      permission.version !== source.version ||
      permission.license !== source.license ||
      permission.commercial_redistribution !== true ||
      permission.offline_redistribution !== true ||
      !permission.evidence?.trim()
    ) {
      throw new Error(
        `Source ${source.id} lacks documented commercial/offline permission`,
      );
    }
  }
  return review;
}
