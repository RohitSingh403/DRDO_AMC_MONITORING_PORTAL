import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Render does not ship MongoDB. Download the server binary during the image build
// so the start command can launch it. Local installs skip this.
if (process.env.RENDER !== 'true') {
  process.exit(0);
}

const versionDir = 'mongodb-linux-x86_64-ubuntu2204-7.0.16';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destDir = path.join(root, 'vendor/mongo');
const bin = path.join(destDir, versionDir, 'bin/mongod');

if (existsSync(bin)) {
  process.exit(0);
}

mkdirSync(destDir, { recursive: true });
const tarball = path.join(destDir, `${versionDir}.tgz`);
const url = `https://fastdl.mongodb.org/linux/${versionDir}.tgz`;

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`${command} failed while preparing MongoDB`);
    process.exit(result.status || 1);
  }
}

run('curl', ['--retry', '5', '--retry-delay', '2', '-fL', '--output', tarball, url]);
run('tar', ['-xzf', tarball, '-C', destDir, `${versionDir}/bin/mongod`]);
rmSync(tarball, { force: true });

if (!existsSync(bin)) {
  console.error('MongoDB binary was not unpacked');
  process.exit(1);
}
