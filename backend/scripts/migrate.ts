import 'dotenv/config';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { runMigrations } from '../services/migrationService.js';

try { await connectDatabase(); await runMigrations(); console.log('Migration completed.'); }
finally { await disconnectDatabase(); }
