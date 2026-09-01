import dotenv from 'dotenv';
import { loadEnv } from './config/env.js';

dotenv.config({ quiet: true });
loadEnv();
await import('./server.js');
