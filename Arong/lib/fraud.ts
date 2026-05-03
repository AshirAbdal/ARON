import pool from '@/lib/db';

let ensured = false;

export async function ensureFraudTables(): Promise<void> {
  if (ensured) return;

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS suspicious_orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT,
      order_number VARCHAR(50),
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      email VARCHAR(255),
      ip VARCHAR(100),
      score INT NOT NULL DEFAULT 0,
      reasons_json TEXT NOT NULL,
      review_status VARCHAR(20) NOT NULL DEFAULT 'pending',
      reviewed_by VARCHAR(100),
      reviewed_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT NOW(),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    )
  `);

  ensured = true;
}

export function getFraudSignal(payload: {
  total: number;
  totalQty: number;
  isFirstOrderByPhone: boolean;
  recentByPhone: number;
  city: string;
  address: string;
}): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (payload.total >= 30000) {
    score += 25;
    reasons.push('high_order_value');
  }

  if (payload.totalQty >= 12) {
    score += 20;
    reasons.push('high_item_quantity');
  }

  if (payload.isFirstOrderByPhone && payload.total >= 15000) {
    score += 20;
    reasons.push('high_value_first_time_phone');
  }

  if (payload.recentByPhone >= 2) {
    score += 25;
    reasons.push('multiple_recent_orders_same_phone');
  }

  if (payload.address.length < 20) {
    score += 10;
    reasons.push('short_address_detail');
  }

  if (payload.city.toLowerCase() === 'dhaka' && payload.address.toLowerCase().includes('test')) {
    score += 20;
    reasons.push('suspicious_test_address');
  }

  return { score, reasons };
}

export async function logSuspiciousOrder(input: {
  orderId?: number | null;
  orderNumber?: string | null;
  fullName: string;
  phone: string;
  email: string;
  ip: string;
  score: number;
  reasons: string[];
}): Promise<void> {
  await ensureFraudTables();

  await pool.execute(
    `INSERT INTO suspicious_orders
      (order_id, order_number, full_name, phone, email, ip, score, reasons_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.orderId || null,
      input.orderNumber || null,
      input.fullName,
      input.phone,
      input.email || null,
      input.ip || null,
      input.score,
      JSON.stringify(input.reasons),
    ]
  );
}
