const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");
const { URL } = require("url");

const ROOT = __dirname;
const DB_FILE = path.join(ROOT, "zmart-db.json");
const PORT = Number(process.env.PORT || 3000);
const TOKEN_SECRET =
  process.env.ZMART_TOKEN_SECRET || "change-this-dev-token-secret";
const RAZORPAY_KEY_ID =
  process.env.RAZORPAY_KEY_ID || "rzp_test_1DP5mmOlF5G5ag";
const RAZORPAY_KEY_SECRET =
  process.env.RAZORPAY_KEY_SECRET || "dev_razorpay_secret";
const UPI_ID = process.env.ZMART_UPI_ID || "zmart@okaxis";

const seedProducts = [
  [
    "Wireless Headphones",
    2999,
    3999,
    "Electronics",
    "ZBeat",
    "Best Seller",
    18,
    "Premium wireless headphones with deep bass, cushioned earcups, and 30-hour battery life.",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700",
  ],
  [
    "Running Shoes",
    1999,
    2799,
    "Fashion",
    "Runova",
    "Sale",
    9,
    "Lightweight running shoes with breathable mesh and cushioned soles for daily training.",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700",
  ],
  [
    "Smart Watch",
    4999,
    6499,
    "Electronics",
    "WristIQ",
    "New",
    6,
    "Fitness-ready smart watch with heart-rate tracking, notifications, and a bright touch display.",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700",
  ],
  [
    "Leather Backpack",
    1499,
    1999,
    "Accessories",
    "UrbanPack",
    "",
    13,
    "Durable everyday backpack with laptop sleeve, organizer pockets, and clean leather finish.",
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700",
  ],
  [
    "Bluetooth Speaker",
    1299,
    1799,
    "Electronics",
    "ZBeat",
    "Sale",
    21,
    "Portable speaker with punchy sound, splash resistance, and all-day playback.",
    "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=700",
  ],
  [
    "Sunglasses",
    899,
    1199,
    "Accessories",
    "ShadeCo",
    "",
    4,
    "UV-protected sunglasses with lightweight frame and scratch-resistant lenses.",
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=700",
  ],
  [
    "Yoga Mat",
    699,
    999,
    "Sports",
    "FlexFit",
    "Best Seller",
    25,
    "Non-slip yoga mat with extra cushioning for home workouts and studio sessions.",
    "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=700",
  ],
  [
    "Casual T-Shirt",
    499,
    799,
    "Fashion",
    "CottonLane",
    "",
    30,
    "Soft cotton T-shirt with a relaxed everyday fit and fade-resistant color.",
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700",
  ],
  [
    "Gaming Mouse",
    1599,
    2299,
    "Electronics",
    "ClickPro",
    "New",
    8,
    "RGB gaming mouse with adjustable DPI, programmable buttons, and low-latency tracking.",
    "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=700",
  ],
  [
    "Desk Lamp",
    1199,
    1699,
    "Home",
    "GlowDesk",
    "",
    12,
    "Modern desk lamp with adjustable arm, warm LED light, and compact footprint.",
    "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=700",
  ],
  [
    "Denim Jacket",
    2499,
    3499,
    "Fashion",
    "CottonLane",
    "Sale",
    5,
    "Classic denim jacket with sturdy stitching and a comfortable year-round layer.",
    "https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=700",
  ],
  [
    "Travel Duffel Bag",
    1899,
    2599,
    "Accessories",
    "UrbanPack",
    "",
    10,
    "Spacious duffel bag for weekend trips with reinforced handles and shoe compartment.",
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700",
  ],
  [
    "Resistance Bands",
    599,
    899,
    "Sports",
    "FlexFit",
    "Best Seller",
    35,
    "Set of resistance bands for strength training, stretching, and mobility routines.",
    "https://images.unsplash.com/photo-1598971639058-a582a08a0081?w=700",
  ],
  [
    "Coffee Maker",
    3499,
    4499,
    "Home",
    "Brewly",
    "New",
    7,
    "Compact coffee maker with fast brewing, reusable filter, and easy-clean carafe.",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=700",
  ],
  [
    "Portable Charger",
    999,
    1499,
    "Electronics",
    "VoltGo",
    "Sale",
    16,
    "Slim power bank with fast charging support and dual USB outputs.",
    "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=700",
  ],
  [
    "Ceramic Plant Pot",
    449,
    699,
    "Home",
    "NestHome",
    "",
    0,
    "Minimal ceramic plant pot for desks, shelves, and indoor greenery.",
    "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=700",
  ],
].map((p, i) => ({
  id: i + 1,
  name: p[0],
  price: p[1],
  originalPrice: p[2],
  category: p[3],
  brand: p[4],
  badge: p[5],
  stock: p[6],
  description: p[7],
  image: p[8],
  rating: [
    4.5, 4.2, 4.7, 4.3, 4.4, 4.0, 4.6, 4.1, 4.5, 4.3, 4.4, 4.2, 4.6, 4.5, 4.4,
    4.1,
  ][i],
  reviews: [
    128, 85, 210, 64, 97, 43, 155, 72, 118, 56, 91, 61, 134, 78, 162, 39,
  ][i],
  active: true,
}));

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto
    .pbkdf2Sync(password, salt, 120000, 32, "sha256")
    .toString("hex");
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  const [salt] = String(stored || "").split(":");
  return crypto.timingSafeEqual(
    Buffer.from(hashPassword(password, salt)),
    Buffer.from(stored || "x"),
  );
}
function now() {
  return new Date().toISOString();
}
function loadDb() {
  if (!fs.existsSync(DB_FILE)) {
    const adminPass = hashPassword("Admin@123");
    const db = {
      next: {
        user: 3,
        product: 17,
        order: 1001,
        message: 1,
        review: 1,
        address: 3,
        coupon: 4,
      },
      products: seedProducts,
      users: [
        {
          id: 1,
          role: "admin",
          name: "ZMart Admin",
          email: "admin@zmart.com",
          phone: "9999999999",
          passwordHash: adminPass,
          createdAt: now(),
          addresses: [],
        },
        {
          id: 2,
          role: "user",
          name: "Demo User",
          email: "demo@zmart.com",
          phone: "9876543210",
          passwordHash: hashPassword("Demo@123"),
          createdAt: now(),
          addresses: [
            {
              id: 1,
              label: "Home",
              line1: "221 Market Street",
              city: "New Delhi",
              state: "Delhi",
              pincode: "110001",
              phone: "9876543210",
            },
          ],
        },
      ],
      carts: {},
      wishlists: {},
      orders: [],
      contactMessages: [],
      reviews: [],
      coupons: [
        {
          id: 1,
          code: "ZMART200",
          type: "flat",
          value: 200,
          minOrder: 999,
          expiresAt: "2099-12-31",
          active: true,
        },
        {
          id: 2,
          code: "SAVE10",
          type: "percent",
          value: 10,
          minOrder: 1500,
          expiresAt: "2099-12-31",
          active: true,
        },
        {
          id: 3,
          code: "FASHION15",
          type: "percent",
          value: 15,
          minOrder: 2000,
          expiresAt: "2099-12-31",
          active: true,
        },
      ],
    };
    saveDb(db);
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}
function saveDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}
function publicUser(u) {
  return (
    u && {
      id: u.id,
      role: u.role,
      name: u.name,
      email: u.email,
      phone: u.phone,
      addresses: u.addresses || [],
    }
  );
}
function signToken(user) {
  const payload = Buffer.from(
    JSON.stringify({
      id: user.id,
      role: user.role,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    }),
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}
function getUser(req, db) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(payload)
    .digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)))
    return null;
  const data = JSON.parse(Buffer.from(payload, "base64url").toString());
  if (data.exp < Date.now()) return null;
  return db.users.find((u) => u.id === data.id) || null;
}
function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}
function requireAuth(req, res, db) {
  const user = getUser(req, db);
  if (!user) json(res, 401, { error: "Please login to continue." });
  return user;
}
function requireAdmin(req, res, db) {
  const user = requireAuth(req, res, db);
  if (!user) return null;
  if (user.role !== "admin") {
    json(res, 403, { error: "Admin access required." });
    return null;
  }
  return user;
}
function calcCoupon(db, code, subtotal) {
  if (!code) return { discount: 0, coupon: null };
  const coupon = db.coupons.find(
    (c) => c.code.toUpperCase() === String(code).toUpperCase() && c.active,
  );
  if (!coupon) throw new Error("Coupon not found.");
  if (new Date(coupon.expiresAt) < new Date())
    throw new Error("Coupon has expired.");
  if (subtotal < coupon.minOrder)
    throw new Error(`Minimum order value is Rs.${coupon.minOrder}.`);
  const discount =
    coupon.type === "percent"
      ? Math.round((subtotal * coupon.value) / 100)
      : coupon.value;
  return { discount: Math.min(discount, subtotal), coupon };
}
function totals(db, items, couponCode) {
  const rows = items.map((i) => {
    const p = db.products.find(
      (x) => x.id === i.productId && x.active !== false,
    );
    if (!p) throw new Error("Product not found.");
    if (i.quantity > p.stock)
      throw new Error(`${p.name} has only ${p.stock} left.`);
    return {
      productId: p.id,
      name: p.name,
      image: p.image,
      price: p.price,
      quantity: Number(i.quantity),
      total: p.price * Number(i.quantity),
    };
  });
  const subtotal = rows.reduce((s, i) => s + i.total, 0);
  const liveDiscount =
    subtotal >= 10000
      ? Math.round(subtotal * 0.1)
      : subtotal >= 5000
        ? Math.round(subtotal * 0.05)
        : 0;
  const couponInfo = calcCoupon(db, couponCode, subtotal - liveDiscount);
  const deliveryCharge = subtotal >= 999 ? 0 : 49;
  return {
    items: rows,
    subtotal,
    liveDiscount,
    couponDiscount: couponInfo.discount,
    coupon: couponInfo.coupon && couponInfo.coupon.code,
    deliveryCharge,
    total: subtotal - liveDiscount - couponInfo.discount + deliveryCharge,
  };
}
function createOrder(db, user, body, paymentStatus, paymentRef) {
  const cart = db.carts[user.id] || [];
  if (!cart.length) throw new Error("Cart is empty.");
  const address = (user.addresses || []).find(
    (a) => a.id === Number(body.addressId),
  );
  if (!address) throw new Error("Select a delivery address.");
  const t = totals(db, cart, body.couponCode);
  t.items.forEach((i) => {
    const p = db.products.find((x) => x.id === i.productId);
    p.stock -= i.quantity;
  });
  const order = {
    id: "ZM" + db.next.order++,
    userId: user.id,
    date: now(),
    items: t.items,
    subtotal: t.subtotal,
    liveDiscount: t.liveDiscount,
    coupon: t.coupon,
    couponDiscount: t.couponDiscount,
    deliveryCharge: t.deliveryCharge,
    total: t.total,
    address,
    paymentMethod: body.paymentMethod,
    paymentStatus,
    paymentRef: paymentRef || "",
    deliveryStatus: "Placed",
    orderStatus: "Placed",
  };
  db.orders.unshift(order);
  db.carts[user.id] = [];
  saveDb(db);
  return order;
}
function enrichProduct(db, p) {
  const reviews = db.reviews.filter((r) => r.productId === p.id);
  const avg = reviews.length
    ? reviews.reduce((s, r) => s + Number(r.rating), 0) / reviews.length
    : p.rating;
  return {
    ...p,
    rating: Math.round(avg * 10) / 10,
    reviews: reviews.length || p.reviews,
    reviewList: reviews.map((r) => ({
      ...r,
      userName:
        (db.users.find((u) => u.id === r.userId) || {}).name || "Customer",
    })),
  };
}
function fuzzyMatch(text, q) {
  text = text.toLowerCase();
  q = q.toLowerCase();
  if (text.includes(q)) return true;
  let j = 0;
  for (let i = 0; i < text.length && j < q.length; i++)
    if (text[i] === q[j]) j++;
  return j >= Math.max(2, q.length - 1);
}
async function api(req, res, pathname, url) {
  const db = loadDb();
  try {
    if (req.method === "GET" && pathname === "/api/config")
      return json(res, 200, { razorpayKeyId: RAZORPAY_KEY_ID, upiId: UPI_ID });
    if (req.method === "POST" && pathname === "/api/auth/signup") {
      const b = await readBody(req);
      if (!b.name || !b.email || !b.password)
        return json(res, 400, {
          error: "Name, email and password are required.",
        });
      if (db.users.some((u) => u.email.toLowerCase() === b.email.toLowerCase()))
        return json(res, 409, { error: "Email already registered." });
      const u = {
        id: db.next.user++,
        role: "user",
        name: b.name,
        email: b.email.toLowerCase(),
        phone: b.phone || "",
        passwordHash: hashPassword(b.password),
        createdAt: now(),
        addresses: [],
      };
      db.users.push(u);
      saveDb(db);
      return json(res, 201, { token: signToken(u), user: publicUser(u) });
    }
    if (req.method === "POST" && pathname === "/api/auth/login") {
      const b = await readBody(req);
      const u = db.users.find(
        (x) => x.email.toLowerCase() === String(b.email || "").toLowerCase(),
      );
      if (!u || !verifyPassword(b.password || "", u.passwordHash))
        return json(res, 401, { error: "Invalid email or password." });
      return json(res, 200, { token: signToken(u), user: publicUser(u) });
    }
    if (req.method === "GET" && pathname === "/api/profile") {
      const u = requireAuth(req, res, db);
      if (!u) return;
      return json(res, 200, { user: publicUser(u) });
    }
    if (req.method === "PUT" && pathname === "/api/profile") {
      const u = requireAuth(req, res, db);
      if (!u) return;
      const b = await readBody(req);
      Object.assign(u, { name: b.name || u.name, phone: b.phone || u.phone });
      if (Array.isArray(b.addresses))
        u.addresses = b.addresses.map((a, i) => ({
          id: a.id || db.next.address++,
          label: a.label || "Address",
          line1: a.line1 || "",
          city: a.city || "",
          state: a.state || "",
          pincode: a.pincode || "",
          phone: a.phone || u.phone,
        }));
      saveDb(db);
      return json(res, 200, { user: publicUser(u) });
    }
    if (req.method === "GET" && pathname === "/api/products") {
      let list = db.products
        .filter((p) => p.active !== false)
        .map((p) => enrichProduct(db, p));
      const q = url.searchParams.get("q");
      if (q)
        list = list.filter((p) =>
          fuzzyMatch(`${p.name} ${p.category} ${p.brand}`, q),
        );
      ["category", "brand"].forEach((k) => {
        const v = url.searchParams.get(k);
        if (v && v !== "All") list = list.filter((p) => p[k] === v);
      });
      const min = Number(url.searchParams.get("minPrice") || 0),
        max = Number(url.searchParams.get("maxPrice") || 999999),
        rating = Number(url.searchParams.get("rating") || 0);
      list = list.filter(
        (p) => p.price >= min && p.price <= max && p.rating >= rating,
      );
      if (url.searchParams.get("stock") === "in")
        list = list.filter((p) => p.stock > 0);
      return json(res, 200, {
        products: list,
        categories: [...new Set(db.products.map((p) => p.category))],
        brands: [...new Set(db.products.map((p) => p.brand))],
      });
    }
    const productId = (pathname.match(/^\/api\/products\/(\d+)$/) || [])[1];
    if (req.method === "GET" && productId) {
      const p = db.products.find((x) => x.id === Number(productId));
      return p
        ? json(res, 200, { product: enrichProduct(db, p) })
        : json(res, 404, { error: "Product not found." });
    }
    if (req.method === "GET" && pathname === "/api/cart") {
      const u = requireAuth(req, res, db);
      if (!u) return;
      const items = (db.carts[u.id] || [])
        .map((i) => ({
          ...i,
          product: db.products.find((p) => p.id === i.productId),
        }))
        .filter((i) => i.product);
      return json(res, 200, { items });
    }
    if (req.method === "POST" && pathname === "/api/cart/items") {
      const u = requireAuth(req, res, db);
      if (!u) return;
      const b = await readBody(req);
      const p = db.products.find((x) => x.id === Number(b.productId));
      if (!p || p.active === false)
        return json(res, 404, { error: "Product not found." });
      db.carts[u.id] = db.carts[u.id] || [];
      const item = db.carts[u.id].find((i) => i.productId === p.id);
      const qty = Math.max(
        1,
        Number(b.quantity || (item ? item.quantity : 0) + 1),
      );
      if (qty > p.stock)
        return json(res, 400, { error: `${p.name} has only ${p.stock} left.` });
      if (item) item.quantity = qty;
      else db.carts[u.id].push({ productId: p.id, quantity: qty });
      saveDb(db);
      return json(res, 200, { ok: true });
    }
    const cartId = (pathname.match(/^\/api\/cart\/items\/(\d+)$/) || [])[1];
    if (req.method === "DELETE" && cartId) {
      const u = requireAuth(req, res, db);
      if (!u) return;
      db.carts[u.id] = (db.carts[u.id] || []).filter(
        (i) => i.productId !== Number(cartId),
      );
      saveDb(db);
      return json(res, 200, { ok: true });
    }
    if (req.method === "POST" && pathname === "/api/coupons/validate") {
      const u = requireAuth(req, res, db);
      if (!u) return;
      const b = await readBody(req);
      const t = totals(db, db.carts[u.id] || [], b.code);
      return json(res, 200, t);
    }
    if (req.method === "GET" && pathname === "/api/wishlist") {
      const u = requireAuth(req, res, db);
      if (!u) return;
      const ids = db.wishlists[u.id] || [];
      return json(res, 200, {
        products: ids
          .map((id) => db.products.find((p) => p.id === id))
          .filter(Boolean)
          .map((p) => enrichProduct(db, p)),
      });
    }
    if (req.method === "POST" && pathname === "/api/wishlist") {
      const u = requireAuth(req, res, db);
      if (!u) return;
      const b = await readBody(req);
      db.wishlists[u.id] = db.wishlists[u.id] || [];
      if (!db.wishlists[u.id].includes(Number(b.productId)))
        db.wishlists[u.id].push(Number(b.productId));
      saveDb(db);
      return json(res, 200, { ok: true });
    }
    const wishId = (pathname.match(/^\/api\/wishlist\/(\d+)$/) || [])[1];
    if (req.method === "DELETE" && wishId) {
      const u = requireAuth(req, res, db);
      if (!u) return;
      db.wishlists[u.id] = (db.wishlists[u.id] || []).filter(
        (id) => id !== Number(wishId),
      );
      saveDb(db);
      return json(res, 200, { ok: true });
    }
    if (req.method === "POST" && pathname === "/api/orders") {
      const u = requireAuth(req, res, db);
      if (!u) return;
      const b = await readBody(req);
      const status =
        b.paymentMethod === "cod" ? "Pending" : "Pending verification";
      const order = createOrder(db, u, b, status, b.upiReference || "");
      return json(res, 201, { order });
    }
    if (req.method === "GET" && pathname === "/api/orders") {
      const u = requireAuth(req, res, db);
      if (!u) return;
      return json(res, 200, {
        orders: db.orders.filter((o) => o.userId === u.id),
      });
    }
    const invoiceId = (pathname.match(/^\/api\/orders\/([^/]+)\/invoice$/) ||
      [])[1];
    if (req.method === "GET" && invoiceId) {
      const u = requireAuth(req, res, db);
      if (!u) return;
      const o = db.orders.find(
        (x) => x.id === invoiceId && (x.userId === u.id || u.role === "admin"),
      );
      return o
        ? json(res, 200, { order: o })
        : json(res, 404, { error: "Order not found." });
    }
    if (req.method === "POST" && pathname === "/api/payments/razorpay-order") {
      const u = requireAuth(req, res, db);
      if (!u) return;
      const b = await readBody(req);
      const t = totals(db, db.carts[u.id] || [], b.couponCode);
      return json(res, 200, {
        keyId: RAZORPAY_KEY_ID,
        orderId: "order_zmart_" + Date.now(),
        amount: t.total * 100,
        currency: "INR",
      });
    }
    if (req.method === "POST" && pathname === "/api/payments/verify") {
      const u = requireAuth(req, res, db);
      if (!u) return;
      const b = await readBody(req);
      const expected = crypto
        .createHmac("sha256", RAZORPAY_KEY_SECRET)
        .update(`${b.razorpay_order_id}|${b.razorpay_payment_id}`)
        .digest("hex");
      if (expected !== b.razorpay_signature)
        return json(res, 400, { error: "Payment verification failed." });
      const order = createOrder(
        db,
        u,
        { ...b, paymentMethod: "razorpay" },
        "Paid",
        b.razorpay_payment_id,
      );
      return json(res, 201, { order });
    }
    if (req.method === "POST" && pathname === "/api/reviews") {
      const u = requireAuth(req, res, db);
      if (!u) return;
      const b = await readBody(req);
      const bought = db.orders.some(
        (o) =>
          o.userId === u.id &&
          o.items.some((i) => i.productId === Number(b.productId)),
      );
      if (!bought)
        return json(res, 403, {
          error: "Only purchased products can be reviewed.",
        });
      const review = {
        id: db.next.review++,
        productId: Number(b.productId),
        userId: u.id,
        rating: Number(b.rating),
        text: b.text || "",
        date: now(),
      };
      db.reviews.push(review);
      saveDb(db);
      return json(res, 201, { review });
    }
    if (req.method === "POST" && pathname === "/api/contact") {
      const b = await readBody(req);
      if (!b.name || !b.email || !b.message)
        return json(res, 400, {
          error: "Name, email and message are required.",
        });
      const msg = {
        id: db.next.message++,
        name: b.name,
        email: b.email,
        message: b.message,
        date: now(),
        status: "New",
      };
      db.contactMessages.unshift(msg);
      saveDb(db);
      return json(res, 201, { message: msg });
    }
    if (pathname.startsWith("/api/admin/")) {
      const a = requireAdmin(req, res, db);
      if (!a) return;
      if (req.method === "GET" && pathname === "/api/admin/orders")
        return json(res, 200, { orders: db.orders });
      if (req.method === "GET" && pathname === "/api/admin/messages")
        return json(res, 200, { messages: db.contactMessages });
      if (req.method === "POST" && pathname === "/api/admin/products") {
        const b = await readBody(req);
        const p = {
          id: db.next.product++,
          active: true,
          rating: 0,
          reviews: 0,
          ...b,
          price: Number(b.price),
          originalPrice: Number(b.originalPrice || b.price),
          stock: Number(b.stock || 0),
        };
        db.products.push(p);
        saveDb(db);
        return json(res, 201, { product: p });
      }
      const aid = (pathname.match(/^\/api\/admin\/products\/(\d+)$/) || [])[1];
      if (aid && req.method === "PUT") {
        const p = db.products.find((x) => x.id === Number(aid));
        if (!p) return json(res, 404, { error: "Product not found." });
        Object.assign(p, await readBody(req));
        p.price = Number(p.price);
        p.originalPrice = Number(p.originalPrice);
        p.stock = Number(p.stock);
        saveDb(db);
        return json(res, 200, { product: p });
      }
      if (aid && req.method === "DELETE") {
        const p = db.products.find((x) => x.id === Number(aid));
        if (p) p.active = false;
        saveDb(db);
        return json(res, 200, { ok: true });
      }
    }
    json(res, 404, { error: "API route not found." });
  } catch (e) {
    json(res, 400, { error: e.message || "Request failed." });
  }
}
function serveStatic(req, res, pathname) {
  const file =
    pathname === "/" ? "index.html" : decodeURIComponent(pathname.slice(1));
  const full = path.normalize(path.join(ROOT, file));
  if (!full.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  fs.readFile(full, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("Not found");
    }
    const ext = path.extname(full).toLowerCase();
    const types = {
      ".html": "text/html",
      ".js": "text/javascript",
      ".css": "text/css",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
    };
    res.writeHead(200, {
      "Content-Type": types[ext] || "application/octet-stream",
    });
    res.end(data);
  });
}
http
  .createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/"))
      return api(req, res, url.pathname, url);
    serveStatic(req, res, url.pathname);
  })
  .listen(PORT, () => console.log(`ZMart running at http://localhost:${PORT}`));
