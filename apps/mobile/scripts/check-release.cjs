const fs = require('node:fs');
const path = require('node:path');
const manifest = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '../assets/content/manifest.json'),
    'utf8',
  ),
);
if (process.env.EAS_BUILD_PROFILE === 'production' && manifest.sample) {
  throw new Error(
    'Production build blocked: approved, complete scripture content is required. The bundled release contains layout fixtures.',
  );
}
