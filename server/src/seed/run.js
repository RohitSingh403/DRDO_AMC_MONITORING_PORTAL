import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from '../config/db.js';
import { seed } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

await connectDB();
const result = await seed({ reset: true });
console.log('Seed complete', result);
process.exit(0);
