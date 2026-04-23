import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve(process.cwd(), '..', 'db', 'arong.db');
const dbDir = path.dirname(dbPath);
const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');

if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price_min REAL NOT NULL DEFAULT 0,
    price_max REAL,
    brand TEXT,
    category_id INTEGER,
    is_new_arrival INTEGER DEFAULT 0,
    is_featured INTEGER DEFAULT 0,
    free_delivery INTEGER DEFAULT 0,
    discount_label TEXT,
    stock INTEGER DEFAULT 100,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    is_primary INTEGER DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS product_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER DEFAULT 100,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    division TEXT NOT NULL,
    subtotal REAL NOT NULL,
    shipping_cost REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    total REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_method TEXT DEFAULT 'cash_on_delivery',
    notes TEXT,
    coupon_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER,
    product_name TEXT NOT NULL,
    variant_name TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL DEFAULT 'percentage',
    discount_value REAL NOT NULL,
    min_order REAL DEFAULT 0,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed initial data if empty
const catCount = (db.prepare('SELECT COUNT(*) as c FROM categories').get() as { c: number }).c;
if (catCount === 0) {
  const insertCategory = db.prepare(
    'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)'
  );
  const insertProduct = db.prepare(`
    INSERT INTO products (name, slug, description, price_min, price_max, brand, category_id, is_new_arrival, is_featured, free_delivery, discount_label, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertVariant = db.prepare(
    'INSERT INTO product_variants (product_id, name, price, stock) VALUES (?, ?, ?, ?)'
  );
  const insertImage = db.prepare(
    'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)'
  );
  const insertCoupon = db.prepare(
    'INSERT INTO coupons (code, discount_type, discount_value, min_order, is_active) VALUES (?, ?, ?, ?, ?)'
  );

  const seedAll = db.transaction(() => {
    // Categories
    const catSkincare = insertCategory.run('Skincare', 'skincare', 'Nourish and protect your skin');
    const catMakeup = insertCategory.run('Makeup', 'makeup', 'Express your beauty');
    const catFragrance = insertCategory.run('Fragrances', 'fragrances', 'Luxury scents & attars');
    const catHairCare = insertCategory.run('Hair Care', 'hair-care', 'Beautiful hair, every day');
    const catAccessories = insertCategory.run('Accessories', 'accessories', 'Beauty tools & accessories');
    const catBodyCare = insertCategory.run('Body Care', 'body-care', 'Total body wellness');

    const skincareId = catSkincare.lastInsertRowid as number;
    const makeupId = catMakeup.lastInsertRowid as number;
    const fragranceId = catFragrance.lastInsertRowid as number;
    const hairId = catHairCare.lastInsertRowid as number;
    const accessoriesId = catAccessories.lastInsertRowid as number;
    const bodyId = catBodyCare.lastInsertRowid as number;

    const products = [
      // Skincare
      { name: 'Vitamin C Brightening Serum', slug: 'vitamin-c-brightening-serum', desc: 'A powerful antioxidant serum that brightens skin and reduces dark spots.', pMin: 690, pMax: 1290, brand: 'Arong Essentials', catId: skincareId, newArr: 1, feat: 1, freeDel: 0, disc: null, stock: 50 },
      { name: 'Hydrating Rose Face Toner', slug: 'hydrating-rose-face-toner', desc: 'Alcohol-free rose water toner that hydrates and balances skin pH.', pMin: 350, pMax: 650, brand: 'Arong Essentials', catId: skincareId, newArr: 1, feat: 0, freeDel: 0, disc: null, stock: 80 },
      { name: 'Retinol Anti-Aging Cream', slug: 'retinol-anti-aging-cream', desc: 'Clinically proven retinol formula to reduce fine lines and wrinkles.', pMin: 890, pMax: 1590, brand: 'DermaCare', catId: skincareId, newArr: 0, feat: 1, freeDel: 0, disc: '10% OFF', stock: 40 },
      { name: 'Niacinamide Pore Minimizer', slug: 'niacinamide-pore-minimizer', desc: '10% niacinamide + 1% zinc formula for pore minimizing and oil control.', pMin: 590, pMax: 990, brand: 'ClearSkin', catId: skincareId, newArr: 1, feat: 0, freeDel: 0, disc: null, stock: 60 },
      { name: 'SPF 50 Sunscreen Lotion', slug: 'spf-50-sunscreen-lotion', desc: 'Lightweight, non-greasy broad-spectrum SPF 50 sun protection.', pMin: 490, pMax: 890, brand: 'SunGuard', catId: skincareId, newArr: 0, feat: 1, freeDel: 0, disc: null, stock: 70 },
      { name: 'Aloe Vera Gel Moisturizer', slug: 'aloe-vera-gel-moisturizer', desc: 'Pure aloe vera gel for soothing, healing and hydrating all skin types.', pMin: 290, pMax: 490, brand: 'Arong Essentials', catId: skincareId, newArr: 0, feat: 0, freeDel: 0, disc: null, stock: 100 },
      { name: 'Charcoal Deep Cleansing Face Wash', slug: 'charcoal-deep-cleansing-face-wash', desc: 'Activated charcoal face wash that draws out impurities and unclogs pores.', pMin: 380, pMax: 680, brand: 'PureGlow', catId: skincareId, newArr: 1, feat: 0, freeDel: 0, disc: null, stock: 90 },
      { name: 'Hyaluronic Acid Moisturizing Cream', slug: 'hyaluronic-acid-moisturizing-cream', desc: 'Deep hydration cream with 3 types of hyaluronic acid for plump, dewy skin.', pMin: 750, pMax: 1390, brand: 'HydraPlus', catId: skincareId, newArr: 1, feat: 1, freeDel: 1, disc: null, stock: 55 },

      // Makeup
      { name: 'Long-Lasting Matte Lipstick', slug: 'long-lasting-matte-lipstick', desc: '12-hour matte finish lipstick with rich pigment and comfortable wear.', pMin: 290, pMax: 490, brand: 'GlamColor', catId: makeupId, newArr: 1, feat: 1, freeDel: 0, disc: null, stock: 120 },
      { name: 'Flawless Full Coverage Foundation', slug: 'flawless-full-coverage-foundation', desc: 'Buildable, blendable foundation with 24-hour wear and SPF 30.', pMin: 650, pMax: 1190, brand: 'PerfectBase', catId: makeupId, newArr: 0, feat: 1, freeDel: 0, disc: '15% OFF', stock: 60 },
      { name: 'Volumizing Mascara', slug: 'volumizing-mascara', desc: 'Dramatically volumizes and lengthens lashes without clumping.', pMin: 390, pMax: 690, brand: 'LashLux', catId: makeupId, newArr: 1, feat: 0, freeDel: 0, disc: null, stock: 80 },
      { name: 'Precision Liquid Eyeliner', slug: 'precision-liquid-eyeliner', desc: 'Ultra-fine tip liquid eyeliner for precise, long-lasting lines.', pMin: 250, pMax: 450, brand: 'LinePro', catId: makeupId, newArr: 0, feat: 0, freeDel: 0, disc: null, stock: 100 },
      { name: 'Shimmer Eyeshadow Palette', slug: 'shimmer-eyeshadow-palette', desc: '12-shade shimmer and matte palette for endless eye looks.', pMin: 890, pMax: 1490, brand: 'GlamColor', catId: makeupId, newArr: 1, feat: 1, freeDel: 1, disc: null, stock: 45 },
      { name: 'Natural Finish BB Cream', slug: 'natural-finish-bb-cream', desc: 'SPF 25 BB cream that hydrates, conceals and perfects the skin.', pMin: 490, pMax: 890, brand: 'PerfectBase', catId: makeupId, newArr: 0, feat: 0, freeDel: 0, disc: null, stock: 70 },
      { name: 'Contouring & Highlighting Palette', slug: 'contouring-highlighting-palette', desc: 'Professional contour and highlight palette for sculpted, glowing looks.', pMin: 790, pMax: 1390, brand: 'GlamColor', catId: makeupId, newArr: 1, feat: 1, freeDel: 0, disc: '10% OFF', stock: 35 },
      { name: 'Creamy Kohl Kajal Pencil', slug: 'creamy-kohl-kajal-pencil', desc: 'Smooth, smudge-proof kajal pencil for intense, defined eyes.', pMin: 190, pMax: 350, brand: 'LinePro', catId: makeupId, newArr: 0, feat: 0, freeDel: 0, disc: null, stock: 150 },
      { name: 'Nude Lip Gloss Set', slug: 'nude-lip-gloss-set', desc: 'Set of 5 nude shades for naturally gorgeous lips.', pMin: 590, pMax: 990, brand: 'GlamColor', catId: makeupId, newArr: 1, feat: 0, freeDel: 1, disc: null, stock: 60 },

      // Fragrances
      { name: 'Rose Oud Attar', slug: 'rose-oud-attar', desc: 'Traditional Bengali attar blending Damask rose with rich oud. Long-lasting and intense.', pMin: 490, pMax: 1490, brand: 'Arong Essentials', catId: fragranceId, newArr: 1, feat: 1, freeDel: 0, disc: null, stock: 40 },
      { name: 'Jasmine & Sandalwood Perfume', slug: 'jasmine-sandalwood-perfume', desc: 'Elegant floral-woody fragrance perfect for all occasions.', pMin: 590, pMax: 1190, brand: 'ScentHouse', catId: fragranceId, newArr: 0, feat: 1, freeDel: 0, disc: null, stock: 50 },
      { name: 'Fresh Aqua Body Mist', slug: 'fresh-aqua-body-mist', desc: 'Light and refreshing aquatic body mist for everyday freshness.', pMin: 290, pMax: 590, brand: 'ScentHouse', catId: fragranceId, newArr: 1, feat: 0, freeDel: 0, disc: null, stock: 80 },
      { name: 'Midnight Oud EDP', slug: 'midnight-oud-edp', desc: 'Luxurious oriental fragrance with deep oud, amber and musk notes.', pMin: 890, pMax: 1990, brand: 'Arong Noir', catId: fragranceId, newArr: 1, feat: 1, freeDel: 1, disc: null, stock: 30 },
      { name: 'Floral Bloom Eau de Parfum', slug: 'floral-bloom-eau-de-parfum', desc: 'A bouquet of fresh florals — peony, lily, and freesia in a light, airy scent.', pMin: 690, pMax: 1390, brand: 'ScentHouse', catId: fragranceId, newArr: 0, feat: 0, freeDel: 0, disc: null, stock: 45 },
      { name: 'Traditional Musk Attar', slug: 'traditional-musk-attar', desc: 'Pure white musk attar with a gentle, clean scent. Alcohol-free and long-lasting.', pMin: 390, pMax: 990, brand: 'Arong Essentials', catId: fragranceId, newArr: 0, feat: 0, freeDel: 0, disc: null, stock: 60 },

      // Hair Care
      { name: 'Argan Oil Shampoo', slug: 'argan-oil-shampoo', desc: 'Nourishing argan oil shampoo for frizz-free, silky smooth hair.', pMin: 390, pMax: 690, brand: 'HairLux', catId: hairId, newArr: 1, feat: 1, freeDel: 0, disc: null, stock: 70 },
      { name: 'Keratin Repair Hair Mask', slug: 'keratin-repair-hair-mask', desc: 'Intensive keratin treatment mask that repairs and strengthens damaged hair.', pMin: 590, pMax: 990, brand: 'HairLux', catId: hairId, newArr: 0, feat: 1, freeDel: 0, disc: null, stock: 55 },
      { name: 'Black Seed Hair Oil', slug: 'black-seed-hair-oil', desc: 'Traditional black seed (kalonji) oil for hair growth, strength and shine.', pMin: 290, pMax: 590, brand: 'Arong Essentials', catId: hairId, newArr: 1, feat: 0, freeDel: 0, disc: null, stock: 90 },
      { name: 'Anti-Dandruff Conditioner', slug: 'anti-dandruff-conditioner', desc: 'Tea tree and zinc conditioner that eliminates dandruff and soothes scalp.', pMin: 350, pMax: 650, brand: 'ScalpCare', catId: hairId, newArr: 0, feat: 0, freeDel: 0, disc: null, stock: 75 },
      { name: 'Onion Juice Hair Serum', slug: 'onion-juice-hair-serum', desc: 'Clinically proven onion extract serum to reduce hair fall and boost growth.', pMin: 490, pMax: 890, brand: 'HairRevive', catId: hairId, newArr: 1, feat: 1, freeDel: 0, disc: '10% OFF', stock: 60 },
      { name: 'Coconut Deep Conditioning Mask', slug: 'coconut-deep-conditioning-mask', desc: 'Rich coconut and shea butter mask for ultra-moisturized, manageable hair.', pMin: 450, pMax: 850, brand: 'HairLux', catId: hairId, newArr: 0, feat: 0, freeDel: 0, disc: null, stock: 65 },

      // Accessories
      { name: 'Professional Makeup Brush Set (12pc)', slug: 'professional-makeup-brush-set', desc: 'Complete 12-piece professional brush set with synthetic bristles and travel case.', pMin: 890, pMax: 1490, brand: 'BrushMaster', catId: accessoriesId, newArr: 1, feat: 1, freeDel: 1, disc: null, stock: 30 },
      { name: 'Velvet Beauty Blender Sponge', slug: 'velvet-beauty-blender-sponge', desc: 'Ultra-soft, latex-free beauty sponge for flawless, streak-free foundation application.', pMin: 190, pMax: 390, brand: 'BrushMaster', catId: accessoriesId, newArr: 0, feat: 0, freeDel: 0, disc: null, stock: 100 },
      { name: 'Rose Gold Vanity Mirror', slug: 'rose-gold-vanity-mirror', desc: 'LED-lit 10x magnifying vanity mirror with rose gold frame. Perfect for makeup.', pMin: 1190, pMax: 2190, brand: 'BeautyTools', catId: accessoriesId, newArr: 1, feat: 1, freeDel: 1, disc: null, stock: 20 },
      { name: 'Cosmetic Travel Organizer Bag', slug: 'cosmetic-travel-organizer-bag', desc: 'Large capacity waterproof makeup bag with multiple compartments.', pMin: 690, pMax: 1190, brand: 'StyleBag', catId: accessoriesId, newArr: 0, feat: 0, freeDel: 0, disc: null, stock: 40 },
      { name: 'Eyelash Curler', slug: 'eyelash-curler', desc: 'Professional grade stainless steel eyelash curler with silicon pad.', pMin: 290, pMax: 490, brand: 'BeautyTools', catId: accessoriesId, newArr: 0, feat: 0, freeDel: 0, disc: null, stock: 80 },
      { name: 'Facial Massage Roller (Rose Quartz)', slug: 'facial-massage-roller', desc: 'Authentic rose quartz facial roller for lymphatic drainage and skin tightening.', pMin: 590, pMax: 990, brand: 'GlowStone', catId: accessoriesId, newArr: 1, feat: 1, freeDel: 0, disc: null, stock: 35 },
      { name: 'Eyebrow Stencil Kit', slug: 'eyebrow-stencil-kit', desc: 'Set of 12 reusable eyebrow stencils for perfectly shaped brows every time.', pMin: 190, pMax: 350, brand: 'BrushMaster', catId: accessoriesId, newArr: 0, feat: 0, freeDel: 0, disc: null, stock: 120 },

      // Body Care
      { name: 'Shea Butter Body Lotion', slug: 'shea-butter-body-lotion', desc: 'Rich, creamy shea butter lotion that deeply moisturizes and softens skin.', pMin: 390, pMax: 690, brand: 'SoftSkin', catId: bodyId, newArr: 1, feat: 1, freeDel: 0, disc: null, stock: 80 },
      { name: 'Coffee Body Scrub', slug: 'coffee-body-scrub', desc: 'Invigorating arabica coffee scrub that exfoliates, tightens and energizes skin.', pMin: 450, pMax: 790, brand: 'BodyBliss', catId: bodyId, newArr: 1, feat: 0, freeDel: 0, disc: null, stock: 65 },
      { name: 'Turmeric & Honey Soap Bar', slug: 'turmeric-honey-soap-bar', desc: 'Handcrafted turmeric and raw honey soap bar for glowing, even-toned skin.', pMin: 190, pMax: 350, brand: 'Arong Essentials', catId: bodyId, newArr: 0, feat: 0, freeDel: 0, disc: null, stock: 150 },
      { name: 'Collagen Firming Body Oil', slug: 'collagen-firming-body-oil', desc: 'Luxurious body oil with marine collagen and vitamin E for firm, youthful skin.', pMin: 690, pMax: 1290, brand: 'SkinLift', catId: bodyId, newArr: 1, feat: 1, freeDel: 1, disc: null, stock: 40 },
      { name: 'Lavender Relaxing Body Wash', slug: 'lavender-relaxing-body-wash', desc: 'Calming lavender and chamomile body wash for a spa-like shower experience.', pMin: 350, pMax: 650, brand: 'BodyBliss', catId: bodyId, newArr: 0, feat: 0, freeDel: 0, disc: null, stock: 90 },
      { name: 'Lightening Underarm Cream', slug: 'lightening-underarm-cream', desc: 'Gentle brightening cream for underarms, elbows and knees. With AHA and kojic acid.', pMin: 490, pMax: 890, brand: 'BrightSkin', catId: bodyId, newArr: 1, feat: 0, freeDel: 0, disc: null, stock: 55 },
      { name: 'Hand & Nail Repair Cream', slug: 'hand-nail-repair-cream', desc: 'Intensive hand cream with keratin and biotin that repairs nails and softens cuticles.', pMin: 290, pMax: 590, brand: 'SoftSkin', catId: bodyId, newArr: 0, feat: 0, freeDel: 0, disc: null, stock: 70 },
      { name: 'Stretch Mark Reduction Oil', slug: 'stretch-mark-reduction-oil', desc: 'Clinically tested oil with bio-oil, rosehip and vitamin E to fade stretch marks.', pMin: 790, pMax: 1390, brand: 'SkinLift', catId: bodyId, newArr: 1, feat: 1, freeDel: 1, disc: '10% OFF', stock: 35 },
      // Additional products
      { name: 'Charcoal Peel-Off Face Mask', slug: 'charcoal-peel-off-face-mask', desc: 'Deep cleansing charcoal peel-off mask that removes blackheads and deep-seated dirt.', pMin: 390, pMax: 690, brand: 'PureGlow', catId: skincareId, newArr: 1, feat: 0, freeDel: 0, disc: null, stock: 75 },
      { name: 'Under Eye Dark Circle Cream', slug: 'under-eye-dark-circle-cream', desc: 'Caffeine-infused eye cream that reduces puffiness, dark circles and fine lines.', pMin: 590, pMax: 990, brand: 'DermaCare', catId: skincareId, newArr: 1, feat: 1, freeDel: 0, disc: null, stock: 50 },
      { name: 'Blush & Bronzer Duo', slug: 'blush-bronzer-duo', desc: 'Duo palette with a natural blush and sun-kissed bronzer for a healthy glow.', pMin: 490, pMax: 890, brand: 'GlamColor', catId: makeupId, newArr: 0, feat: 1, freeDel: 0, disc: null, stock: 55 },
      { name: 'Waterproof Lip Liner Set', slug: 'waterproof-lip-liner-set', desc: 'Set of 6 long-lasting waterproof lip liners in versatile everyday shades.', pMin: 390, pMax: 690, brand: 'GlamColor', catId: makeupId, newArr: 1, feat: 0, freeDel: 0, disc: null, stock: 85 },
      { name: 'Oud & Amber Luxury Perfume', slug: 'oud-amber-luxury-perfume', desc: 'Sophisticated oriental blend of rare oud, amber resin and warm spices.', pMin: 990, pMax: 2490, brand: 'Arong Noir', catId: fragranceId, newArr: 0, feat: 1, freeDel: 1, disc: null, stock: 25 },
      { name: 'Biotin Hair Growth Supplement Serum', slug: 'biotin-hair-growth-serum', desc: 'Scalp serum with biotin, folic acid and castor oil to stimulate hair growth.', pMin: 590, pMax: 990, brand: 'HairRevive', catId: hairId, newArr: 1, feat: 1, freeDel: 0, disc: null, stock: 50 },
      { name: 'Gua Sha Facial Tool', slug: 'gua-sha-facial-tool', desc: 'Authentic green jade gua sha stone for facial contouring and lymphatic drainage.', pMin: 490, pMax: 890, brand: 'GlowStone', catId: accessoriesId, newArr: 1, feat: 0, freeDel: 0, disc: null, stock: 45 },
      { name: 'Vitamin E Body Butter', slug: 'vitamin-e-body-butter', desc: 'Ultra-rich whipped body butter with vitamin E and sweet almond oil.', pMin: 490, pMax: 890, brand: 'BodyBliss', catId: bodyId, newArr: 0, feat: 1, freeDel: 0, disc: null, stock: 60 },
    ];

    for (const p of products) {
      const res = insertProduct.run(
        p.name, p.slug, p.desc, p.pMin, p.pMax,
        p.brand, p.catId, p.newArr, p.feat, p.freeDel, p.disc, p.stock
      );
      const pid = res.lastInsertRowid as number;
      insertImage.run(pid, '/placeholder.jpg', 1);
      // Add variants if price range
      if (p.pMax && p.pMax !== p.pMin) {
        insertVariant.run(pid, '30ml', p.pMin, 100);
        insertVariant.run(pid, '50ml', Math.round((p.pMin + p.pMax) / 2), 100);
        insertVariant.run(pid, '100ml', p.pMax, 100);
      }
    }

    // Coupons
    insertCoupon.run('ARONG10', 'percentage', 10, 500, 1);
    insertCoupon.run('WELCOME50', 'flat', 50, 300, 1);
    insertCoupon.run('BEAUTY15', 'percentage', 15, 1000, 1);
  });

  seedAll();
}

export default db;
export { uploadsDir };
