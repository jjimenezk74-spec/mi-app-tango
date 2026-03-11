import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";

const app = new Hono<{ Bindings: Env }>();

// Simple session store (in production, use a proper session store)
// For local auth, we use a simple approach with session cookies

interface LocalUser {
  id: number;
  username: string;
  name: string | null;
  role: 'admin' | 'cashier';
  is_active: number;
}

// ============ LOCAL AUTH API ============

// Login with username/password
app.post("/api/auth/login", async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const { username, password } = body;

  if (!username || !password) {
    return c.json({ error: "Usuario y contraseña requeridos" }, 400);
  }

  const user = await db.prepare(
    "SELECT * FROM local_users WHERE username = ? AND is_active = 1"
  ).bind(username).first<LocalUser & { password_hash: string }>();

  if (!user || user.password_hash !== password) {
    return c.json({ error: "Usuario o contraseña incorrectos" }, 401);
  }

  // Create session token (simple base64 encoded user id + timestamp)
  const sessionData = JSON.stringify({ userId: user.id, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  const sessionToken = btoa(sessionData);

  // Set cookie for backwards compatibility
  setCookie(c, "local_session", sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: false,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return c.json({ 
    success: true,
    token: sessionToken, // Return token for localStorage storage
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    }
  });
});

// Get current user
app.get("/api/auth/me", async (c) => {
  const db = c.env.DB;
  const sessionToken = getCookie(c, "local_session");

  if (!sessionToken) {
    return c.json({ error: "No session" }, 401);
  }

  try {
    const sessionData = JSON.parse(atob(sessionToken));
    
    if (sessionData.exp < Date.now()) {
      return c.json({ error: "Session expired" }, 401);
    }

    const user = await db.prepare(
      "SELECT id, username, name, role, is_active FROM local_users WHERE id = ? AND is_active = 1"
    ).bind(sessionData.userId).first<LocalUser>();

    if (!user) {
      return c.json({ error: "User not found" }, 401);
    }

    return c.json({ user });
  } catch {
    return c.json({ error: "Invalid session" }, 401);
  }
});

// Logout
app.post("/api/auth/logout", async (c) => {
  setCookie(c, "local_session", "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: false,
    maxAge: 0,
  });

  return c.json({ success: true });
});

// Check if system is in initial setup mode (only default user exists)
app.get("/api/system/setup-status", async (c) => {
  const db = c.env.DB;
  const result = await db.prepare("SELECT COUNT(*) as count FROM local_users").first<{ count: number }>();
  const userCount = result?.count || 0;
  
  // System is in setup mode if there's only 1 user (the seeded admin)
  return c.json({ 
    isInitialSetup: userCount <= 1,
    userCount 
  });
});

// Helper to get current user from session
async function getCurrentUser(c: any): Promise<LocalUser | null> {
  // Check Authorization header first, then fall back to cookie
  const authHeader = c.req.header("Authorization");
  let sessionToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  
  if (!sessionToken) {
    sessionToken = getCookie(c, "local_session");
  }
  
  if (!sessionToken) return null;

  try {
    const sessionData = JSON.parse(atob(sessionToken));
    if (sessionData.exp < Date.now()) return null;

    const db = c.env.DB;
    return await db.prepare(
      "SELECT id, username, name, role, is_active FROM local_users WHERE id = ? AND is_active = 1"
    ).bind(sessionData.userId).first() as LocalUser | null;
  } catch {
    return null;
  }
}

// ============ USER MANAGEMENT API ============

// Get all users (admin only)
app.get("/api/users", async (c) => {
  const currentUser = await getCurrentUser(c);
  if (!currentUser || currentUser.role !== 'admin') {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const db = c.env.DB;
  const { results } = await db.prepare(
    "SELECT id, username, password_hash, name, role, is_active, created_at, updated_at FROM local_users ORDER BY created_at DESC"
  ).all();
  
  return c.json(results);
});

// Create user (admin only)
app.post("/api/users", async (c) => {
  const currentUser = await getCurrentUser(c);
  if (!currentUser || currentUser.role !== 'admin') {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const db = c.env.DB;
  const body = await c.req.json();
  const { username, password, name, role } = body;

  if (!username || !password) {
    return c.json({ error: "Usuario y contraseña requeridos" }, 400);
  }

  // Check if username exists
  const existing = await db.prepare(
    "SELECT id FROM local_users WHERE username = ?"
  ).bind(username).first();

  if (existing) {
    return c.json({ error: "El usuario ya existe" }, 400);
  }

  const result = await db.prepare(
    `INSERT INTO local_users (username, password_hash, name, role)
     VALUES (?, ?, ?, ?)`
  ).bind(username, password, name || null, role || 'cashier').run();

  return c.json({ id: result.meta.last_row_id, success: true });
});

// Update user (admin only)
app.put("/api/users/:id", async (c) => {
  const currentUser = await getCurrentUser(c);
  if (!currentUser || currentUser.role !== 'admin') {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const db = c.env.DB;
  const id = c.req.param("id");
  const body = await c.req.json();
  const { name, role, password, is_active } = body;

  if (password) {
    await db.prepare(
      `UPDATE local_users SET name = ?, role = ?, password_hash = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(name, role, password, is_active ? 1 : 0, id).run();
  } else {
    await db.prepare(
      `UPDATE local_users SET name = ?, role = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(name, role, is_active ? 1 : 0, id).run();
  }

  return c.json({ success: true });
});

// Delete user (admin only)
app.delete("/api/users/:id", async (c) => {
  const currentUser = await getCurrentUser(c);
  if (!currentUser || currentUser.role !== 'admin') {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const db = c.env.DB;
  const id = c.req.param("id");

  // Don't allow deleting yourself
  if (parseInt(id) === currentUser.id) {
    return c.json({ error: "No puedes eliminar tu propio usuario" }, 400);
  }

  await db.prepare(
    "DELETE FROM local_users WHERE id = ?"
  ).bind(id).run();

  return c.json({ success: true });
});

// ============ CUSTOMERS API ============

// Get all customers
app.get("/api/customers", async (c) => {
  const db = c.env.DB;
  const search = c.req.query("search");
  
  let query = "SELECT * FROM customers";
  const params: string[] = [];
  
  if (search) {
    query += " WHERE name LIKE ? OR ruc_ci LIKE ? OR phone LIKE ?";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  query += " ORDER BY name ASC";
  
  const { results } = await db.prepare(query).bind(...params).all();
  return c.json(results);
});

// Get single customer
app.get("/api/customers/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const result = await db.prepare(
    "SELECT * FROM customers WHERE id = ?"
  ).bind(id).first();
  
  if (!result) {
    return c.json({ error: "Cliente no encontrado" }, 404);
  }
  return c.json(result);
});

// Create customer
app.post("/api/customers", async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  
  const { name, ruc_ci, phone, email, address, notes } = body;
  
  if (!name) {
    return c.json({ error: "El nombre es requerido" }, 400);
  }
  
  const result = await db.prepare(
    `INSERT INTO customers (name, ruc_ci, phone, email, address, notes)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(name, ruc_ci || null, phone || null, email || null, address || null, notes || null).run();
  
  const newCustomer = await db.prepare(
    "SELECT * FROM customers WHERE id = ?"
  ).bind(result.meta.last_row_id).first();
  
  return c.json({ id: result.meta.last_row_id, customer: newCustomer, success: true });
});

// Update customer
app.put("/api/customers/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const body = await c.req.json();
  
  const { name, ruc_ci, phone, email, address, notes } = body;
  
  await db.prepare(
    `UPDATE customers SET 
     name = ?, ruc_ci = ?, phone = ?, email = ?, address = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(name, ruc_ci || null, phone || null, email || null, address || null, notes || null, id).run();
  
  return c.json({ success: true });
});

// Delete customer
app.delete("/api/customers/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  
  await db.prepare(
    "DELETE FROM customers WHERE id = ?"
  ).bind(id).run();
  
  return c.json({ success: true });
});

// ============ SUPPLIERS API ============

// Get all suppliers
app.get("/api/suppliers", async (c) => {
  const db = c.env.DB;
  const search = c.req.query("search");
  
  let query = "SELECT * FROM suppliers";
  const params: string[] = [];
  
  if (search) {
    query += " WHERE name LIKE ? OR ruc LIKE ? OR phone LIKE ?";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  query += " ORDER BY name ASC";
  
  const { results } = await db.prepare(query).bind(...params).all();
  return c.json(results);
});

// Get single supplier
app.get("/api/suppliers/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const result = await db.prepare(
    "SELECT * FROM suppliers WHERE id = ?"
  ).bind(id).first();
  
  if (!result) {
    return c.json({ error: "Proveedor no encontrado" }, 404);
  }
  return c.json(result);
});

// Create supplier
app.post("/api/suppliers", async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  
  const { name, ruc, phone, email, address, contact_name, notes } = body;
  
  if (!name) {
    return c.json({ error: "El nombre es requerido" }, 400);
  }
  
  const result = await db.prepare(
    `INSERT INTO suppliers (name, ruc, phone, email, address, contact_name, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(name, ruc || null, phone || null, email || null, address || null, contact_name || null, notes || null).run();
  
  const newSupplier = await db.prepare(
    "SELECT * FROM suppliers WHERE id = ?"
  ).bind(result.meta.last_row_id).first();
  
  return c.json({ id: result.meta.last_row_id, supplier: newSupplier, success: true });
});

// Update supplier
app.put("/api/suppliers/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const body = await c.req.json();
  
  const { name, ruc, phone, email, address, contact_name, notes } = body;
  
  await db.prepare(
    `UPDATE suppliers SET 
     name = ?, ruc = ?, phone = ?, email = ?, address = ?, contact_name = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(name, ruc || null, phone || null, email || null, address || null, contact_name || null, notes || null, id).run();
  
  return c.json({ success: true });
});

// Delete supplier
app.delete("/api/suppliers/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  
  await db.prepare(
    "DELETE FROM suppliers WHERE id = ?"
  ).bind(id).run();
  
  return c.json({ success: true });
});

// ============ PRODUCTS API ============

// Get all products
app.get("/api/products", async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare(
    "SELECT * FROM products WHERE is_active = 1 ORDER BY name"
  ).all();
  return c.json(results);
});

// Get single product
app.get("/api/products/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const result = await db.prepare(
    "SELECT * FROM products WHERE id = ?"
  ).bind(id).first();
  
  if (!result) {
    return c.json({ error: "Product not found" }, 404);
  }
  return c.json(result);
});

// Create product
app.post("/api/products", async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  
  const { sku, name, category, cost_price, sale_price, stock, min_stock, expiration_date, is_combo } = body;
  
  const result = await db.prepare(
    `INSERT INTO products (sku, name, category, cost_price, sale_price, stock, min_stock, expiration_date, is_combo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(sku, name, category, cost_price, sale_price, stock, min_stock, expiration_date || null, is_combo ? 1 : 0).run();
  
  return c.json({ id: result.meta.last_row_id, success: true });
});

// Update product
app.put("/api/products/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const body = await c.req.json();
  
  const { sku, name, category, cost_price, sale_price, stock, min_stock, expiration_date, is_combo } = body;
  
  await db.prepare(
    `UPDATE products SET 
     sku = ?, name = ?, category = ?, cost_price = ?, sale_price = ?, 
     stock = ?, min_stock = ?, expiration_date = ?, is_combo = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(sku, name, category, cost_price, sale_price, stock, min_stock, expiration_date || null, is_combo ? 1 : 0, id).run();
  
  return c.json({ success: true });
});

// Delete product (soft delete)
app.delete("/api/products/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  
  await db.prepare(
    "UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(id).run();
  
  return c.json({ success: true });
});

// Update stock
app.patch("/api/products/:id/stock", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const body = await c.req.json();
  const { quantity, movement_type, reason } = body;
  
  // Get current stock
  const product = await db.prepare(
    "SELECT stock FROM products WHERE id = ?"
  ).bind(id).first<{ stock: number }>();
  
  if (!product) {
    return c.json({ error: "Product not found" }, 404);
  }
  
  const previousStock = product.stock;
  const newStock = movement_type === 'in' ? previousStock + quantity : previousStock - quantity;
  
  // Update product stock
  await db.prepare(
    "UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(newStock, id).run();
  
  // Record inventory movement
  await db.prepare(
    `INSERT INTO inventory_movements (product_id, movement_type, quantity, previous_stock, new_stock, reason)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(id, movement_type, quantity, previousStock, newStock, reason || null).run();
  
  return c.json({ success: true, newStock });
});

// ============ SALES API ============

// Get all sales (with pagination and search)
app.get("/api/sales", async (c) => {
  const db = c.env.DB;
  const limit = parseInt(c.req.query("limit") || "50");
  const offset = parseInt(c.req.query("offset") || "0");
  const date = c.req.query("date"); // Optional date filter YYYY-MM-DD
  const search = c.req.query("search"); // Search by receipt number or customer
  
  let query = "SELECT * FROM sales";
  const conditions: string[] = [];
  const params: (string | number)[] = [];
  
  if (date) {
    conditions.push("DATE(created_at) = ?");
    params.push(date);
  }
  
  if (search) {
    conditions.push("(receipt_number LIKE ? OR customer_name LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  
  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }
  
  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  
  const stmt = db.prepare(query);
  const { results } = await stmt.bind(...params).all() as { results: { id: number }[] };
  
  // Get items summary for each sale
  const salesWithItems = await Promise.all(
    results.map(async (sale: { id: number }) => {
      const itemsResult = await db.prepare(`
        SELECT si.quantity, p.name 
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = ?
        ORDER BY si.quantity DESC
        LIMIT 3
      `).bind(sale.id).all();
      
      const items = itemsResult.results as { name: string; quantity: number }[];
      const totalItemsResult = await db.prepare(
        "SELECT COUNT(*) as count FROM sale_items WHERE sale_id = ?"
      ).bind(sale.id).first() as { count: number } | null;
      
      const totalItems = totalItemsResult?.count || 0;
      
      let itemsSummary = "";
      if (items.length > 0) {
        const firstItems = items.slice(0, 2).map(i => i.name).join(", ");
        if (totalItems > 2) {
          itemsSummary = `${firstItems} +${totalItems - 2} más`;
        } else {
          itemsSummary = firstItems;
        }
      }
      
      return { ...sale, items_summary: itemsSummary };
    })
  );
  
  return c.json(salesWithItems);
});

// Get single sale with items
app.get("/api/sales/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  
  const sale = await db.prepare(
    "SELECT * FROM sales WHERE id = ?"
  ).bind(id).first();
  
  if (!sale) {
    return c.json({ error: "Sale not found" }, 404);
  }
  
  const { results: items } = await db.prepare(
    "SELECT * FROM sale_items WHERE sale_id = ?"
  ).bind(id).all();
  
  return c.json({ ...sale, items });
});

// Create sale
app.post("/api/sales", async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  
  const { items, subtotal, iva, total, payment_method, cash_received, change_amount, cashier_name, notes, customer_id, customer_name, customer_ruc_ci } = body;
  
  // Generate receipt number
  const receiptNumber = `R-${Date.now().toString().slice(-8)}`;
  
  // Insert sale
  const saleResult = await db.prepare(
    `INSERT INTO sales (receipt_number, subtotal, iva, total, payment_method, cash_received, change_amount, cashier_name, notes, customer_id, customer_name, customer_ruc_ci)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(receiptNumber, subtotal, iva, total, payment_method, cash_received || null, change_amount || null, cashier_name || null, notes || null, customer_id || null, customer_name || null, customer_ruc_ci || null).run();
  
  const saleId = saleResult.meta.last_row_id;
  
  // Insert sale items and update stock
  for (const item of items) {
    // Insert sale item
    await db.prepare(
      `INSERT INTO sale_items (sale_id, product_id, product_name, product_sku, quantity, unit_price, total_price)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(saleId, item.product_id, item.product_name, item.product_sku, item.quantity, item.unit_price, item.total_price).run();
    
    // Update product stock
    const product = await db.prepare(
      "SELECT stock FROM products WHERE id = ?"
    ).bind(item.product_id).first<{ stock: number }>();
    
    if (product) {
      const previousStock = product.stock;
      const newStock = previousStock - item.quantity;
      
      await db.prepare(
        "UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(newStock, item.product_id).run();
      
      // Record inventory movement
      await db.prepare(
        `INSERT INTO inventory_movements (product_id, movement_type, quantity, previous_stock, new_stock, reason, reference_id)
         VALUES (?, 'sale', ?, ?, ?, 'Venta', ?)`
      ).bind(item.product_id, item.quantity, previousStock, newStock, saleId).run();
    }
  }
  
  // If payment is cash, record movement in open cash session
  if (payment_method === "efectivo") {
    const openSession = await db.prepare(
      "SELECT id FROM cash_sessions WHERE status = 'open' ORDER BY created_at DESC LIMIT 1"
    ).first<{ id: number }>();
    
    if (openSession) {
      await db.prepare(
        `INSERT INTO cash_movements (session_id, movement_type, amount, description, sale_id)
         VALUES (?, 'venta_efectivo', ?, ?, ?)`
      ).bind(openSession.id, total, `Venta ${receiptNumber}`, saleId).run();
    }
  }
  
  return c.json({ id: saleId, receipt_number: receiptNumber, success: true });
});

// ============ REPORTS API ============

// Daily summary
app.get("/api/reports/daily", async (c) => {
  const db = c.env.DB;
  const date = c.req.query("date") || new Date().toISOString().split('T')[0];
  
  // Get sales summary
  const salesSummary = await db.prepare(`
    SELECT 
      COUNT(*) as total_transactions,
      COALESCE(SUM(total), 0) as total_sales,
      COALESCE(SUM(iva), 0) as total_iva,
      payment_method,
      COUNT(*) as count
    FROM sales 
    WHERE DATE(created_at) = ?
    GROUP BY payment_method
  `).bind(date).all();
  
  const totals = await db.prepare(`
    SELECT 
      COUNT(*) as total_transactions,
      COALESCE(SUM(total), 0) as total_sales,
      COALESCE(SUM(iva), 0) as total_iva
    FROM sales 
    WHERE DATE(created_at) = ?
  `).bind(date).first();
  
  return c.json({
    date,
    ...totals,
    by_payment_method: salesSummary.results
  });
});

// Low stock products
app.get("/api/reports/low-stock", async (c) => {
  const db = c.env.DB;
  
  const { results } = await db.prepare(`
    SELECT * FROM products 
    WHERE is_active = 1 AND stock <= min_stock
    ORDER BY stock ASC
  `).all();
  
  return c.json(results);
});

// Detailed sales report with items and profit
app.get("/api/reports/sales-detail", async (c) => {
  const db = c.env.DB;
  const date = c.req.query("date") || new Date().toISOString().split('T')[0];
  
  const { results } = await db.prepare(`
    SELECT 
      si.id,
      si.sale_id,
      si.product_name,
      si.product_sku,
      si.quantity,
      si.unit_price,
      si.total_price,
      s.receipt_number,
      s.cashier_name,
      s.created_at,
      p.cost_price,
      p.category
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    LEFT JOIN products p ON si.product_id = p.id
    WHERE DATE(s.created_at) = ?
    ORDER BY s.created_at ASC, si.id ASC
  `).bind(date).all();
  
  return c.json(results);
});

// Expiring products
app.get("/api/reports/expiring", async (c) => {
  const db = c.env.DB;
  const days = parseInt(c.req.query("days") || "30");
  
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  const { results } = await db.prepare(`
    SELECT * FROM products 
    WHERE is_active = 1 
    AND expiration_date IS NOT NULL 
    AND expiration_date <= ?
    ORDER BY expiration_date ASC
  `).bind(futureDate.toISOString().split('T')[0]).all();
  
  return c.json(results);
});

// Inventory movements
app.get("/api/inventory-movements", async (c) => {
  const db = c.env.DB;
  const productId = c.req.query("product_id");
  const limit = parseInt(c.req.query("limit") || "50");
  
  let query = `
    SELECT im.*, p.name as product_name, p.sku as product_sku
    FROM inventory_movements im
    LEFT JOIN products p ON im.product_id = p.id
  `;
  const params: (string | number)[] = [];
  
  if (productId) {
    query += " WHERE im.product_id = ?";
    params.push(productId);
  }
  
  query += " ORDER BY im.created_at DESC LIMIT ?";
  params.push(limit);
  
  const { results } = await db.prepare(query).bind(...params).all();
  return c.json(results);
});

// ============ COMBOS API ============

// Get combo items for a product
app.get("/api/combos/:id/items", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  
  const { results } = await db.prepare(`
    SELECT ci.*, p.name as product_name, p.sku as product_sku, p.sale_price, p.stock
    FROM combo_items ci
    JOIN products p ON ci.component_product_id = p.id
    WHERE ci.combo_product_id = ?
  `).bind(id).all();
  
  return c.json(results);
});

// Set combo items (replace all items for a combo)
app.post("/api/combos/:id/items", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const body = await c.req.json();
  const { items } = body; // Array of { component_product_id, quantity }
  
  // Delete existing items
  await db.prepare(
    "DELETE FROM combo_items WHERE combo_product_id = ?"
  ).bind(id).run();
  
  // Insert new items
  for (const item of items) {
    await db.prepare(
      `INSERT INTO combo_items (combo_product_id, component_product_id, quantity)
       VALUES (?, ?, ?)`
    ).bind(id, item.component_product_id, item.quantity).run();
  }
  
  return c.json({ success: true });
});

// Create combo product with items
app.post("/api/combos", async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  
  const { sku, name, category, cost_price, sale_price, stock, min_stock, items } = body;
  
  // Create combo product
  const result = await db.prepare(
    `INSERT INTO products (sku, name, category, cost_price, sale_price, stock, min_stock, is_combo)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
  ).bind(sku, name, category, cost_price, sale_price, stock, min_stock).run();
  
  const comboId = result.meta.last_row_id;
  
  // Insert combo items
  for (const item of items) {
    await db.prepare(
      `INSERT INTO combo_items (combo_product_id, component_product_id, quantity)
       VALUES (?, ?, ?)`
    ).bind(comboId, item.component_product_id, item.quantity).run();
  }
  
  return c.json({ id: comboId, success: true });
});

// Update combo product with items
app.put("/api/combos/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const body = await c.req.json();
  
  const { sku, name, category, cost_price, sale_price, stock, min_stock, items } = body;
  
  // Update combo product
  await db.prepare(
    `UPDATE products SET 
     sku = ?, name = ?, category = ?, cost_price = ?, sale_price = ?, 
     stock = ?, min_stock = ?, is_combo = 1, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(sku, name, category, cost_price, sale_price, stock, min_stock, id).run();
  
  // Delete existing items
  await db.prepare(
    "DELETE FROM combo_items WHERE combo_product_id = ?"
  ).bind(id).run();
  
  // Insert new items
  for (const item of items) {
    await db.prepare(
      `INSERT INTO combo_items (combo_product_id, component_product_id, quantity)
       VALUES (?, ?, ?)`
    ).bind(id, item.component_product_id, item.quantity).run();
  }
  
  return c.json({ success: true });
});

// ============ EXPENSE CATEGORIES API ============

// Get all expense categories
app.get("/api/expense-categories", async (c) => {
  const db = c.env.DB;
  const categoryType = c.req.query("type"); // Optional filter by type
  
  let query = "SELECT * FROM expense_categories WHERE is_active = 1";
  const params: string[] = [];
  
  if (categoryType) {
    query += " AND category_type = ?";
    params.push(categoryType);
  }
  
  query += " ORDER BY category_type, name ASC";
  
  const { results } = await db.prepare(query).bind(...params).all();
  return c.json(results);
});

// Create expense category
app.post("/api/expense-categories", async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const { name, category_type } = body;
  
  if (!name || !category_type) {
    return c.json({ error: "Nombre y tipo requeridos" }, 400);
  }
  
  const result = await db.prepare(
    `INSERT INTO expense_categories (name, category_type)
     VALUES (?, ?)`
  ).bind(name, category_type).run();
  
  const newCategory = await db.prepare(
    "SELECT * FROM expense_categories WHERE id = ?"
  ).bind(result.meta.last_row_id).first();
  
  return c.json({ id: result.meta.last_row_id, category: newCategory, success: true });
});

// ============ CASH SESSIONS API ============

// Get current open session
app.get("/api/cash-sessions/current", async (c) => {
  const db = c.env.DB;
  
  const session = await db.prepare(
    "SELECT * FROM cash_sessions WHERE status = 'open' ORDER BY opened_at DESC LIMIT 1"
  ).first();
  
  if (!session) {
    return c.json({ session: null });
  }
  
  // Get movements for this session
  const { results: movements } = await db.prepare(
    "SELECT * FROM cash_movements WHERE session_id = ? ORDER BY created_at ASC"
  ).bind(session.id).all();
  
  return c.json({ session, movements });
});

// Get all sessions (history)
app.get("/api/cash-sessions", async (c) => {
  const db = c.env.DB;
  const limit = parseInt(c.req.query("limit") || "30");
  
  const { results } = await db.prepare(
    "SELECT * FROM cash_sessions ORDER BY opened_at DESC LIMIT ?"
  ).bind(limit).all();
  
  return c.json(results);
});

// Open cash session
app.post("/api/cash-sessions/open", async (c) => {
  const currentUser = await getCurrentUser(c);
  if (!currentUser) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  
  const db = c.env.DB;
  const body = await c.req.json();
  const { opening_amount, notes } = body;
  
  // Check if there's already an open session
  const existing = await db.prepare(
    "SELECT id FROM cash_sessions WHERE status = 'open'"
  ).first();
  
  if (existing) {
    return c.json({ error: "Ya hay una caja abierta. Debe cerrarla primero." }, 400);
  }
  
  const result = await db.prepare(
    `INSERT INTO cash_sessions (user_id, user_name, opening_amount, status, notes)
     VALUES (?, ?, ?, 'open', ?)`
  ).bind(currentUser.id, currentUser.name || currentUser.username, opening_amount, notes || null).run();
  
  return c.json({ id: result.meta.last_row_id, success: true });
});

// Close cash session
app.post("/api/cash-sessions/:id/close", async (c) => {
  const currentUser = await getCurrentUser(c);
  if (!currentUser) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  
  const db = c.env.DB;
  const id = c.req.param("id");
  const body = await c.req.json();
  const { closing_amount, notes } = body;
  
  // Get session with movements to calculate expected
  const session = await db.prepare(
    "SELECT * FROM cash_sessions WHERE id = ? AND status = 'open'"
  ).bind(id).first<{ id: number; opening_amount: number }>();
  
  if (!session) {
    return c.json({ error: "Sesión no encontrada o ya cerrada" }, 404);
  }
  
  // Calculate expected amount from movements
  const movements = await db.prepare(
    "SELECT movement_type, amount FROM cash_movements WHERE session_id = ?"
  ).bind(id).all<{ movement_type: string; amount: number }>();
  
  let expected = session.opening_amount;
  for (const m of movements.results) {
    if (m.movement_type === 'venta_efectivo' || m.movement_type === 'ingreso') {
      expected += m.amount;
    } else if (m.movement_type === 'retiro' || m.movement_type === 'egreso') {
      expected -= m.amount;
    }
  }
  
  const difference = closing_amount - expected;
  
  await db.prepare(
    `UPDATE cash_sessions SET 
     closing_amount = ?, expected_amount = ?, difference = ?, 
     status = 'closed', notes = ?, closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(closing_amount, expected, difference, notes || null, id).run();
  
  return c.json({ success: true, expected_amount: expected, difference });
});

// Add cash movement (withdrawal/deposit)
app.post("/api/cash-movements", async (c) => {
  const currentUser = await getCurrentUser(c);
  if (!currentUser) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  
  const db = c.env.DB;
  const body = await c.req.json();
  const { session_id, movement_type, amount, description, sale_id, invoice_number } = body;
  
  // Verify session is open
  const session = await db.prepare(
    "SELECT id FROM cash_sessions WHERE id = ? AND status = 'open'"
  ).bind(session_id).first();
  
  if (!session) {
    return c.json({ error: "No hay caja abierta" }, 400);
  }
  
  const result = await db.prepare(
    `INSERT INTO cash_movements (session_id, movement_type, amount, description, sale_id, user_id, user_name, invoice_number)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(session_id, movement_type, amount, description || null, sale_id || null, currentUser.id, currentUser.name || currentUser.username, invoice_number || null).run();
  
  return c.json({ id: result.meta.last_row_id, success: true });
});

// Search cash movement by invoice number
app.get("/api/cash-movements/by-invoice", async (c) => {
  const currentUser = await getCurrentUser(c);
  if (!currentUser) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  
  const db = c.env.DB;
  const invoiceNumber = c.req.query("invoice_number");
  
  if (!invoiceNumber) {
    return c.json({ error: "invoice_number es requerido" }, 400);
  }
  
  const movement = await db.prepare(
    `SELECT cm.*, cs.opened_at, cs.closed_at 
     FROM cash_movements cm
     JOIN cash_sessions cs ON cm.session_id = cs.id
     WHERE cm.invoice_number = ? AND cm.movement_type = 'egreso'
     ORDER BY cm.created_at DESC LIMIT 1`
  ).bind(invoiceNumber).first();
  
  if (!movement) {
    return c.json({ found: false });
  }
  
  return c.json({ found: true, movement });
});

// Get session details with movements
app.get("/api/cash-sessions/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  
  const session = await db.prepare(
    "SELECT * FROM cash_sessions WHERE id = ?"
  ).bind(id).first();
  
  if (!session) {
    return c.json({ error: "Sesión no encontrada" }, 404);
  }
  
  const { results: movements } = await db.prepare(
    "SELECT * FROM cash_movements WHERE session_id = ? ORDER BY created_at ASC"
  ).bind(id).all();
  
  return c.json({ session, movements });
});

// ============ PURCHASES API ============

// Get all purchases
app.get("/api/purchases", async (c) => {
  const db = c.env.DB;
  const limit = parseInt(c.req.query("limit") || "50");
  const offset = parseInt(c.req.query("offset") || "0");
  
  const { results } = await db.prepare(
    "SELECT * FROM purchases ORDER BY created_at DESC LIMIT ? OFFSET ?"
  ).bind(limit, offset).all();
  
  return c.json(results);
});

// Get single purchase with items
app.get("/api/purchases/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  
  const purchase = await db.prepare(
    "SELECT * FROM purchases WHERE id = ?"
  ).bind(id).first();
  
  if (!purchase) {
    return c.json({ error: "Compra no encontrada" }, 404);
  }
  
  const { results: items } = await db.prepare(
    "SELECT * FROM purchase_items WHERE purchase_id = ?"
  ).bind(id).all();
  
  return c.json({ ...purchase, items });
});

// Create purchase - handles stock updates and cost averaging
app.post("/api/purchases", async (c) => {
  const currentUser = await getCurrentUser(c);
  if (!currentUser || currentUser.role !== 'admin') {
    return c.json({ error: "Unauthorized" }, 403);
  }
  
  const db = c.env.DB;
  const body = await c.req.json();
  const { supplier_name, supplier_id, receipt_type, receipt_number, notes, items } = body;
  
  if (!items || items.length === 0) {
    return c.json({ error: "Debe agregar al menos un producto" }, 400);
  }
  
  if (!receipt_number) {
    return c.json({ error: "Número de comprobante requerido" }, 400);
  }
  
  // Calculate total
  const total = items.reduce((sum: number, item: { quantity: number; unit_cost: number }) => 
    sum + (item.quantity * item.unit_cost), 0);
  
  // Create purchase record
  const purchaseResult = await db.prepare(
    `INSERT INTO purchases (supplier_name, supplier_id, receipt_type, receipt_number, total, notes, user_id, user_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    supplier_name || null,
    supplier_id || null,
    receipt_type, 
    receipt_number, 
    total, 
    notes || null, 
    currentUser.id, 
    currentUser.name || currentUser.username
  ).run();
  
  const purchaseId = purchaseResult.meta.last_row_id;
  
  // Process each item
  for (const item of items) {
    let productId = item.product_id;
    let previousCost = 0;
    let newAvgCost = item.unit_cost;
    let previousStock = 0;
    
    if (item.is_new) {
      // Create new product
      const productResult = await db.prepare(
        `INSERT INTO products (sku, name, category, cost_price, sale_price, stock, min_stock)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        item.sku, 
        item.name, 
        item.category, 
        item.unit_cost, 
        item.sale_price || item.unit_cost, 
        item.quantity, 
        5 // Default min_stock
      ).run();
      
      productId = productResult.meta.last_row_id;
      previousCost = 0;
      newAvgCost = item.unit_cost;
      previousStock = 0;
    } else {
      // Get existing product
      const product = await db.prepare(
        "SELECT id, stock, cost_price FROM products WHERE id = ?"
      ).bind(item.product_id).first<{ id: number; stock: number; cost_price: number }>();
      
      if (!product) {
        continue; // Skip if product not found
      }
      
      previousStock = product.stock;
      previousCost = product.cost_price;
      
      // Calculate weighted average cost
      // Formula: ((current_stock * current_cost) + (new_qty * new_cost)) / (current_stock + new_qty)
      const totalValue = (previousStock * previousCost) + (item.quantity * item.unit_cost);
      const newTotalStock = previousStock + item.quantity;
      newAvgCost = newTotalStock > 0 ? Math.round(totalValue / newTotalStock) : item.unit_cost;
      
      // Update product stock and cost
      await db.prepare(
        `UPDATE products SET 
         stock = ?, cost_price = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).bind(newTotalStock, newAvgCost, item.product_id).run();
    }
    
    // Insert purchase item
    await db.prepare(
      `INSERT INTO purchase_items (purchase_id, product_id, product_name, product_sku, quantity, unit_cost, total_cost, previous_cost, new_avg_cost, is_new_product)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      purchaseId, 
      productId, 
      item.name, 
      item.sku, 
      item.quantity, 
      item.unit_cost, 
      item.quantity * item.unit_cost,
      previousCost,
      newAvgCost,
      item.is_new ? 1 : 0
    ).run();
    
    // Record inventory movement
    await db.prepare(
      `INSERT INTO inventory_movements (product_id, movement_type, quantity, previous_stock, new_stock, reason, reference_id)
       VALUES (?, 'purchase', ?, ?, ?, ?, ?)`
    ).bind(
      productId, 
      item.quantity, 
      previousStock, 
      previousStock + item.quantity, 
      `Compra ${receipt_number}`,
      purchaseId
    ).run();
  }
  
  return c.json({ id: purchaseId, success: true });
});

// Dashboard stats
app.get("/api/dashboard/stats", async (c) => {
  const db = c.env.DB;
  const today = new Date().toISOString().split('T')[0];
  
  // Today's sales
  const todaySales = await db.prepare(`
    SELECT COUNT(*) as transactions, COALESCE(SUM(total), 0) as total
    FROM sales WHERE DATE(created_at) = ?
  `).bind(today).first();
  
  // Total products
  const productCount = await db.prepare(`
    SELECT COUNT(*) as count FROM products WHERE is_active = 1
  `).first();
  
  // Low stock count
  const lowStockCount = await db.prepare(`
    SELECT COUNT(*) as count FROM products 
    WHERE is_active = 1 AND stock <= min_stock
  `).first();
  
  // Expiring soon (30 days)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  
  const expiringCount = await db.prepare(`
    SELECT COUNT(*) as count FROM products 
    WHERE is_active = 1 AND expiration_date IS NOT NULL AND expiration_date <= ?
  `).bind(futureDate.toISOString().split('T')[0]).first();
  
  // Total inventory value
  const inventoryValue = await db.prepare(`
    SELECT COALESCE(SUM(stock * sale_price), 0) as value FROM products WHERE is_active = 1
  `).first();
  
  return c.json({
    today_transactions: todaySales?.transactions || 0,
    today_sales: todaySales?.total || 0,
    total_products: productCount?.count || 0,
    low_stock_count: lowStockCount?.count || 0,
    expiring_count: expiringCount?.count || 0,
    inventory_value: inventoryValue?.value || 0
  });
});

export default app;
