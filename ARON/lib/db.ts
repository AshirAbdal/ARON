import mysql from 'mysql2/promise';
import path from 'path';
import fs from 'fs';

const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const rawHost = process.env.DB_HOST || 'localhost';
const pool = mysql.createPool({
  host: rawHost === 'localhost' ? '127.0.0.1' : rawHost,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'aron',
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
});

export default pool;
export { uploadsDir };
