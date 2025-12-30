const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function rmrf(p) {
  try {
    if (fs.existsSync(p)) {
      fs.rmSync(p, { recursive: true, force: true });
      console.log('Removed', p);
    }
  } catch (err) {
    console.error('Failed to remove', p, err?.message || err);
    process.exit(1);
  }
}

try {
  const root = process.cwd();
  console.log('=== Regenerating lockfile (relock) on Linux runner ===');
  rmrf(path.join(root, 'node_modules'));
  rmrf(path.join(root, 'package-lock.json'));

  console.log('Running `npm install --no-optional` to generate a new lockfile on this platform...');
  execSync('npm install --no-optional', { stdio: 'inherit' });
  console.log('npm install completed. New package-lock.json generated.');
  console.log('Exiting success.');
} catch (err) {
  console.error('Re-lock failed:', err?.message || err);
  process.exit(1);
}
