import mysql from 'mysql2/promise';
import path from 'path';
import fs from 'fs';

// Admin uploads point to the Arong app's public/uploads folder
const uploadsDir = path.resolve(process.cwd(), '..', 'Arong', 'public', 'uploads');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER!,
  password: process.env.DB_PASS!,
  database: process.env.DB_NAME!,
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
});

export default pool;
export { uploadsDir };
