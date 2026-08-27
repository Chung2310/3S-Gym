import dotenv from 'dotenv';
import { loadEnv } from './config/env.js';

dotenv.config();
loadEnv();
await import('./server.js');
