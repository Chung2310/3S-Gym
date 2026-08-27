import 'dotenv/config';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { migrateDown, migrationStatus, runMigrations } from '../services/migrationService.js';

try {
  await connectDatabase();
  const command = process.argv[2] || 'up';
  if (command === 'up') console.log(JSON.stringify(await runMigrations()));
  else if (command === 'down') console.log(JSON.stringify(await migrateDown()));
  else if (command === 'status') console.log(JSON.stringify(await migrationStatus(), null, 2));
  else throw new Error(`Unsupported migration command: ${command}`);
}
finally { await disconnectDatabase(); }
