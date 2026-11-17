import { dbFile, resetDatabase } from '../database/connection.js';
import { DEMO_PASSWORD } from '../database/seed.js';

resetDatabase();
console.log(`Database reset and seeded: ${dbFile}`);
console.log('Demo accounts: owner@rentora.demo · renter@rentora.demo · admin@rentora.demo');
console.log(`Demo password for all accounts: ${DEMO_PASSWORD}`);
