import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { seed } from './seed/seed.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import templateRoutes from './routes/templates.js';
import taskRoutes from './routes/tasks.js';
import equipmentRoutes from './routes/equipment.js';
import incidentRoutes from './routes/incidents.js';
import reportRoutes from './routes/reports.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const uploadDir = path.join(__dirname, '../uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    try {
      const host = new URL(origin).hostname;
      const vercelPreview = host.endsWith('.vercel.app') && host.startsWith('drdo-amc-monitoring-portal');
      if (host === 'amcportal.iamrohitsingh.com' || vercelPreview) return callback(null, true);
    } catch {
      // Ignore malformed origins and reject them below.
    }
    return callback(null, false);
  },
}));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(uploadDir));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'amc-monitoring-portal' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/reports', reportRoutes);

const clientDist = path.resolve(__dirname, '../../client/dist');
const clientIndex = path.join(clientDist, 'index.html');
const clientReady = fs.existsSync(clientIndex);

if (clientReady) {
  app.use(express.static(clientDist));
}

app.use((req, res) => {
  const wantsPage =
    clientReady &&
    (req.method === 'GET' || req.method === 'HEAD') &&
    !req.path.startsWith('/api') &&
    !req.path.startsWith('/uploads') &&
    !path.extname(req.path);
  if (wantsPage) return res.sendFile(clientIndex);
  res.status(404).json({ message: 'Not found' });
});

app.use((err, _req, res, _next) => {
  if (err.status) return res.status(err.status).json({ message: err.message });
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ message: err.name === 'CastError' ? 'That record was not found' : err.message });
  }
  if (err.code === 11000) return res.status(409).json({ message: 'That record already exists' });
  console.error(err);
  return res.status(500).json({ message: 'Something went wrong' });
});

const port = Number(process.env.PORT) || 5000;

await connectDB();
if (process.env.SEED !== 'false') {
  const result = await seed({ reset: process.env.SEED_RESET === 'true' });
  console.log(result?.skipped ? 'Seed skipped, desk data already present' : 'Database seeded');
}

app.listen(port, '0.0.0.0', () => {
  console.log(`AMC API listening on http://0.0.0.0:${port}`);
});
