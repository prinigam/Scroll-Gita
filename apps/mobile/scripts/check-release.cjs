const fs = require('node:fs');
const path = require('node:path');
const manifest = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '../assets/content/manifest.json'),
    'utf8',
  ),
);
if (
  process.env.EAS_BUILD_PROFILE === 'production' &&
  (manifest.sample || manifest.production_approved !== true)
) {
  throw new Error(
    'Production build blocked: complete scripture content with recorded rights and editorial approval is required.',
  );
}
