import 'dotenv/config';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { seedProgressDemo } from '../services/progressDemoSeedService.js';

try {
  await connectDatabase();
  const result = await seedProgressDemo();
  console.log(JSON.stringify(result, null, 2));
} finally {
  await disconnectDatabase();
}
