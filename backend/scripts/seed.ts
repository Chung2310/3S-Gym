import 'dotenv/config';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { seedReferenceData } from '../services/migrationService.js';

try { await connectDatabase(); await seedReferenceData(); console.log('Reference seed completed.'); }
finally { await disconnectDatabase(); }
