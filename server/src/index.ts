import { createApp } from './app.js';
import { config } from './config.js';
import { initDatabase } from './database/connection.js';

initDatabase();

createApp().listen(config.port, () => {
  console.log(`Rentora API running at http://localhost:${config.port}`);
});
