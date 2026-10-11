import { spawn } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mongoBin = path.resolve(
  __dirname,
  '../vendor/mongo/mongodb-linux-x86_64-ubuntu2204-7.0.16/bin/mongod',
);

function wantsLocalMongo() {
  if (process.env.RENDER !== 'true') return false;
  const uri = process.env.MONGODB_URI || '';
  if (!uri) return true;
  return /127\.0\.0\.1|localhost/.test(uri);
}

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port }, () => {
      socket.end();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
  });
}

async function waitForPort(port) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (await portOpen(port)) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`MongoDB did not accept connections on 127.0.0.1:${port}`);
}

if (wantsLocalMongo()) {
  if (!existsSync(mongoBin)) {
    throw new Error('MongoDB binary is missing. The Render build should download it before start.');
  }
  const dbpath = '/tmp/amc-mongo';
  mkdirSync(dbpath, { recursive: true });
  const child = spawn(
    mongoBin,
    [
      '--dbpath', dbpath,
      '--bind_ip', '127.0.0.1',
      '--port', '27017',
      '--wiredTigerCacheSizeGB', '0.25',
      '--nounixsocket',
    ],
    { stdio: 'inherit' },
  );
  child.on('error', (err) => {
    console.error('Failed to start MongoDB', err);
    process.exit(1);
  });
  child.on('exit', (code, signal) => {
    console.error(`MongoDB exited (${signal || code})`);
    process.exit(code || 1);
  });
  await waitForPort(27017);
  if (!process.env.MONGODB_URI) {
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/amc-portal';
  }
  console.log('Local MongoDB is accepting connections');
}

await import('./index.js');
