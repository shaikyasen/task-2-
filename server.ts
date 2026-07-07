import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Support ES modules variables in Node
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Backend Firestore connection using firebase-admin
let db: any = null;
try {
  if (getApps().length === 0) {
    initializeApp({
      projectId: "gen-lang-client-0051040402"
    });
  }
  db = getFirestore("ai-studio-b97817a2-9048-4e8d-b96e-ab595226504e");
  console.log("[EatStream Server] Admin Firestore database connection active.");
} catch (error) {
  console.error("[EatStream Server] Failed to initialize backend Admin Firestore:", error);
}

// Memory database for fast fallbacks and caching
const INITIAL_RESTAURANTS = [
  {
    id: "rest-1",
    name: "Spicy Fusion & Grill",
    description: "Premium North Indian & Mughlai culinary arts. Famous for Charcoal-grilled Kebabs & Handi Biryanis.",
    category: "North Indian",
    rating: 4.8,
    ratingCount: 248,
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=60",
    timings: "11:00 AM - 11:30 PM",
    businessHours: { open: "11:00", close: "23:30" },
    ownerId: "owner-1",
    isApproved: true,
    address: "102, Culinary Boulevard, Foodie Street",
    coords: { lat: 12.9716, lng: 77.5946 },
    featured: true,
    offers: "50% OFF up to $10",
    taxNumber: "GSTIN9382019A",
    bankDetails: {
      bankName: "National Merchant Bank",
      accountNumber: "987654321098",
      ifscCode: "NMB0001294",
      accountHolderName: "Spicy Fusion Pvt Ltd"
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "rest-2",
    name: "The Pizzeria & Trattoria",
    description: "Authentic Neapolitan wood-fired pizzas, handcrafted pastas, and fresh Italian gelato.",
    category: "Italian",
    rating: 4.6,
    ratingCount: 189,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=60",
    timings: "12:00 PM - 11:00 PM",
    businessHours: { open: "12:00", close: "23:00" },
    ownerId: "owner-2",
    isApproved: true,
    address: "45, Rome Avenue, Sector 3",
    coords: { lat: 12.9825, lng: 77.6084 },
    featured: true,
    offers: "Free Garlic Bread on orders > $30",
    taxNumber: "GSTIN4829103B",
    bankDetails: {
      bankName: "Imperial Alliance Bank",
      accountNumber: "554433221100",
      ifscCode: "IAB0004920",
      accountHolderName: "The Pizzeria Group"
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "rest-3",
    name: "Dragon Wok & Sushi Bar",
    description: "Sizzling Cantonese woks, freshly rolled Sashimi, and specialty bubble teas.",
    category: "Chinese",
    rating: 4.5,
    ratingCount: 132,
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=60",
    timings: "11:30 AM - 10:30 PM",
    businessHours: { open: "11:30", close: "22:30" },
    ownerId: "owner-3",
    isApproved: true,
    address: "78, Lotus Boulevard, Central Market",
    coords: { lat: 12.9592, lng: 77.5714 },
    featured: false,
    offers: "20% OFF on Sushi Platters",
    taxNumber: "GSTIN7744110C",
    bankDetails: {
      bankName: "Metro Trust Bank",
      accountNumber: "112233445566",
      ifscCode: "MTB0007812",
      accountHolderName: "Dragon Wok F&B"
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const INITIAL_FOODS = [
  {
    id: "food-1",
    restaurantId: "rest-1",
    name: "Spicy Paneer Tikka Masala",
    description: "Clay-oven roasted cottage cheese chunks simmered in a rich, spiced tomato-onion cream sauce.",
    price: 14.99,
    category: "Main Course",
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=60",
    isVeg: true,
    isAvailable: true,
    rating: 4.8,
    addons: [
      { id: "add-1", name: "Extra Cheese", price: 1.99 },
      { id: "add-2", name: "Double Butter", price: 0.99 }
    ],
    variants: [
      { id: "var-1", name: "Regular", price: 14.99 },
      { id: "var-2", name: "Jumbo Pack", price: 19.99 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "food-2",
    restaurantId: "rest-1",
    name: "Garlic Butter Naan",
    description: "Classic Indian flatbread cooked in tandoor clay-oven, topped with minced garlic and melted butter.",
    price: 3.49,
    category: "Breads",
    image: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=500&auto=format&fit=crop&q=60",
    isVeg: true,
    isAvailable: true,
    rating: 4.9,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "food-3",
    restaurantId: "rest-1",
    name: "Chicken Dum Biryani",
    description: "Slow-cooked basmati rice layered with spiced marinated chicken and exotic herbs, served with raita.",
    price: 16.99,
    category: "Main Course",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60",
    isVeg: false,
    isAvailable: true,
    rating: 4.7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "food-4",
    restaurantId: "rest-1",
    name: "Mango Lassi Special",
    description: "Refreshing yogurt beverage blended with ripe sweet mango pulp and a touch of cardamom.",
    price: 4.50,
    category: "Beverages",
    image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop&q=60",
    isVeg: true,
    isAvailable: true,
    rating: 4.6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "food-5",
    restaurantId: "rest-2",
    name: "Margherita Neapolitana Pizza",
    description: "Simple Italian masterpiece with fresh San Marzano tomato sauce, buffalo mozzarella, fresh basil, and extra virgin olive oil.",
    price: 15.99,
    category: "Pizzas",
    image: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=500&auto=format&fit=crop&q=60",
    isVeg: true,
    isAvailable: true,
    rating: 4.8,
    addons: [
      { id: "add-3", name: "Extra Fresh Mozzarella", price: 2.50 },
      { id: "add-4", name: "Mushroom Medley", price: 1.50 }
    ],
    variants: [
      { id: "var-3", name: "10 inch Personal", price: 15.99 },
      { id: "var-4", name: "14 inch Large Share", price: 22.99 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "food-6",
    restaurantId: "rest-2",
    name: "Double Pepperoni & Hot Honey",
    description: "Generous premium pepperoni slices, dry-cured salami, mozzarella, topped with hot spicy honey drizzle.",
    price: 18.49,
    category: "Pizzas",
    image: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&auto=format&fit=crop&q=60",
    isVeg: false,
    isAvailable: true,
    rating: 4.9,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "food-7",
    restaurantId: "rest-2",
    name: "Creamy Fettuccine Carbonara",
    description: "Fresh egg pasta tossed in carbonara egg emulsion, pancetta strips, and freshly grated Pecorino Romano.",
    price: 17.50,
    category: "Pastas",
    image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500&auto=format&fit=crop&q=60",
    isVeg: false,
    isAvailable: true,
    rating: 4.5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "food-8",
    restaurantId: "rest-3",
    name: "Special Dragon Wok Hakka Noodles",
    description: "Sizzling high-flame wok noodles tossed with crisp garden juliennes, sprouts, and dark rich premium soy sauce.",
    price: 12.99,
    category: "Wok & Rice",
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=60",
    isVeg: true,
    isAvailable: true,
    rating: 4.4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "food-9",
    restaurantId: "rest-3",
    name: "Premium Chef's Sushi Platter",
    description: "Handcrafted collection of 4 Salmon Nigiri, 4 Spicy Tuna Uramaki rolls, and 2 Tamago slices.",
    price: 24.00,
    category: "Sushi Bar",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop&q=60",
    isVeg: false,
    isAvailable: true,
    rating: 4.8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let memoryRestaurants = [...INITIAL_RESTAURANTS];
let memoryFoods = [...INITIAL_FOODS];
let memoryOrders: any[] = [];
let memoryReviews: any[] = [
  {
    id: "rev-1",
    orderId: "ord-old-1",
    customerId: "cust-1",
    customerName: "Alex Mercer",
    customerAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60",
    restaurantId: "rest-1",
    rating: 5,
    comment: "The Spicy Paneer Tikka Masala is pure heaven! Generous portions, authentic spices and arrived blazing hot. Will definitely order again!",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: "rev-2",
    orderId: "ord-old-2",
    customerId: "cust-2",
    customerName: "Samantha Reed",
    customerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60",
    restaurantId: "rest-2",
    rating: 4,
    comment: "Wood-fired crust is amazing. Loved the hot honey pepperoni, but I wish the delivery was slightly faster. Pizzas were delicious!",
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];
let memoryMessages: any[] = [];
let memoryLogs: any[] = [
  { id: "log-init", action: "API Bootstrapped", details: "Core EatStream backend endpoints successfully mapped", timestamp: new Date().toISOString() }
];
let memoryEarnings: any = {
  "driver-1": { userId: "driver-1", balance: 142.50, totalEarned: 450.00, transactions: [] },
  "owner-1": { userId: "owner-1", balance: 1250.00, totalEarned: 4200.00, transactions: [] }
};

// Auto seed Firestore if database connections are fresh
async function seedFirestoreIfEmpty() {
  if (!db) return;
  try {
    const rSnap = await db.collection("restaurants").get();
    if (rSnap.empty) {
      console.log("[EatStream Server] Seeding initial restaurants to Firestore...");
      for (const r of INITIAL_RESTAURANTS) {
        await db.collection("restaurants").doc(r.id).set(r);
      }
    }
    const fSnap = await db.collection("foods").get();
    if (fSnap.empty) {
      console.log("[EatStream Server] Seeding initial menu items to Firestore...");
      for (const f of INITIAL_FOODS) {
        await db.collection("foods").doc(f.id).set(f);
      }
    }
  } catch (err) {
    console.warn("[EatStream Server] Auto-seeding check skipped/failed (likely security rules):", err);
  }
}

// Perform seeding in background
seedFirestoreIfEmpty();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // REST API: Health Check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "Food Delivery & Restaurant Management Platform API",
      environment: process.env.NODE_ENV || "development",
    });
  });

  // REST API: Restaurants (Query and Creation)
  app.get("/api/restaurants", async (req, res) => {
    try {
      if (db) {
        const snap = await db.collection("restaurants").get();
        const list: any[] = [];
        snap.forEach((d: any) => list.push({ id: d.id, ...d.data() }));
        if (list.length > 0) {
          memoryRestaurants = list;
          return res.json(list);
        }
      }
    } catch (error) {
      console.warn("[EatStream Server] GET /api/restaurants Firestore fetch error, fallback to memory:", error);
    }
    res.json(memoryRestaurants);
  });

  app.post("/api/restaurants", async (req, res) => {
    const rest = req.body;
    if (!rest || !rest.id) {
      return res.status(400).json({ error: "Invalid restaurant payload" });
    }
    try {
      if (db) {
        await db.collection("restaurants").doc(rest.id).set(rest, { merge: true });
      }
    } catch (error) {
      console.warn("[EatStream Server] POST /api/restaurants Firestore error:", error);
    }

    const idx = memoryRestaurants.findIndex((r: any) => r.id === rest.id);
    if (idx !== -1) {
      memoryRestaurants[idx] = rest;
    } else {
      memoryRestaurants.push(rest);
    }
    res.json({ success: true, restaurant: rest });
  });

  // REST API: Food / Menu Items
  app.get("/api/foods", async (req, res) => {
    const { restaurantId } = req.query;
    try {
      if (db) {
        let snap;
        if (restaurantId) {
          snap = await db.collection("foods").where("restaurantId", "==", restaurantId).get();
        } else {
          snap = await db.collection("foods").get();
        }
        const list: any[] = [];
        snap.forEach((d: any) => list.push({ id: d.id, ...d.data() }));
        if (list.length > 0) {
          return res.json(list);
        }
      }
    } catch (error) {
      console.warn("[EatStream Server] GET /api/foods Firestore error, fallback to memory:", error);
    }

    if (restaurantId) {
      res.json(memoryFoods.filter((f: any) => f.restaurantId === restaurantId));
    } else {
      res.json(memoryFoods);
    }
  });

  app.post("/api/foods", async (req, res) => {
    const food = req.body;
    if (!food || !food.id) {
      return res.status(400).json({ error: "Invalid food payload" });
    }
    try {
      if (db) {
        await db.collection("foods").doc(food.id).set(food, { merge: true });
      }
    } catch (error) {
      console.warn("[EatStream Server] POST /api/foods Firestore error:", error);
    }

    const idx = memoryFoods.findIndex((f: any) => f.id === food.id);
    if (idx !== -1) {
      memoryFoods[idx] = food;
    } else {
      memoryFoods.push(food);
    }
    res.json({ success: true, food });
  });

  app.delete("/api/foods/:id", async (req, res) => {
    const { id } = req.params;
    try {
      if (db) {
        await db.collection("foods").doc(id).delete();
      }
    } catch (error) {
      console.warn("[EatStream Server] DELETE /api/foods Firestore error:", error);
    }

    memoryFoods = memoryFoods.filter((f: any) => f.id !== id);
    res.json({ success: true, id });
  });

  // REST API: Orders (Placing, Filtering and Dispatch status updates)
  app.get("/api/orders", async (req, res) => {
    const { userId, role } = req.query;
    try {
      if (db) {
        let snap;
        if (role === "admin" || !role || !userId) {
          snap = await db.collection("orders").get();
        } else {
          let field = "customerId";
          if (role === "restaurantOwner") field = "restaurantOwnerId";
          if (role === "deliveryPartner") field = "deliveryPartnerId";
          snap = await db.collection("orders").where(field, "==", userId).get();
        }
        const list: any[] = [];
        snap.forEach((d: any) => list.push({ id: d.id, ...d.data() }));
        memoryOrders = list;
        return res.json(list);
      }
    } catch (error) {
      console.warn("[EatStream Server] GET /api/orders Firestore error, fallback to memory:", error);
    }

    if (role === "admin" || !role || !userId) {
      res.json(memoryOrders);
    } else {
      let field = "customerId";
      if (role === "restaurantOwner") field = "restaurantOwnerId";
      if (role === "deliveryPartner") field = "deliveryPartnerId";
      res.json(memoryOrders.filter((o: any) => o[field] === userId));
    }
  });

  app.post("/api/orders", async (req, res) => {
    const order = req.body;
    if (!order || !order.id) {
      return res.status(400).json({ error: "Invalid order payload" });
    }
    try {
      if (db) {
        await db.collection("orders").doc(order.id).set(order);
      }
    } catch (error) {
      console.warn("[EatStream Server] POST /api/orders Firestore error:", error);
    }

    const idx = memoryOrders.findIndex((o: any) => o.id === order.id);
    if (idx !== -1) {
      memoryOrders[idx] = order;
    } else {
      memoryOrders.unshift(order);
    }
    res.json({ success: true, order });
  });

  app.patch("/api/orders/:id", async (req, res) => {
    const { id } = req.params;
    const { status, deliveryPartner } = req.body;
    try {
      if (db) {
        const updates: any = { status, updatedAt: new Date().toISOString() };
        if (deliveryPartner) {
          updates.deliveryPartnerId = deliveryPartner.id;
          updates.deliveryPartnerName = deliveryPartner.name;
          updates.deliveryPartnerPhone = deliveryPartner.phone;
          updates.deliveryPartnerCoords = deliveryPartner.coords;
        }
        await db.collection("orders").doc(id).update(updates);
      }
    } catch (error) {
      console.warn("[EatStream Server] PATCH /api/orders Firestore error:", error);
    }

    const idx = memoryOrders.findIndex((o: any) => o.id === id);
    if (idx !== -1) {
      memoryOrders[idx].status = status;
      memoryOrders[idx].updatedAt = new Date().toISOString();
      if (deliveryPartner) {
        memoryOrders[idx].deliveryPartnerId = deliveryPartner.id;
        memoryOrders[idx].deliveryPartnerName = deliveryPartner.name;
        memoryOrders[idx].deliveryPartnerPhone = deliveryPartner.phone;
        memoryOrders[idx].deliveryPartnerCoords = deliveryPartner.coords;
      }
    }
    res.json({ success: true, orderId: id, status });
  });

  // REST API: Chat Messages
  app.get("/api/messages/:orderId", async (req, res) => {
    const { orderId } = req.params;
    try {
      if (db) {
        const snap = await db.collection("messages").where("orderId", "==", orderId).get();
        const list: any[] = [];
        snap.forEach((d: any) => list.push(d.data()));
        list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        return res.json(list);
      }
    } catch (error) {
      console.warn("[EatStream Server] GET /api/messages Firestore error:", error);
    }

    const filtered = memoryMessages
      .filter((m: any) => m.orderId === orderId)
      .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    res.json(filtered);
  });

  app.post("/api/messages", async (req, res) => {
    const msg = req.body;
    if (!msg || !msg.id) {
      return res.status(400).json({ error: "Invalid message payload" });
    }
    try {
      if (db) {
        await db.collection("messages").doc(msg.id).set(msg);
      }
    } catch (error) {
      console.warn("[EatStream Server] POST /api/messages Firestore error:", error);
    }

    memoryMessages.push(msg);
    res.json({ success: true, message: msg });
  });

  // REST API: Reviews and Star Ratings
  app.get("/api/reviews/:restaurantId", async (req, res) => {
    const { restaurantId } = req.params;
    try {
      if (db) {
        const snap = await db.collection("reviews").where("restaurantId", "==", restaurantId).get();
        const list: any[] = [];
        snap.forEach((d: any) => list.push({ id: d.id, ...d.data() }));
        if (list.length > 0) {
          return res.json(list);
        }
      }
    } catch (error) {
      console.warn("[EatStream Server] GET /api/reviews Firestore error:", error);
    }
    res.json(memoryReviews.filter((r: any) => r.restaurantId === restaurantId));
  });

  app.post("/api/reviews", async (req, res) => {
    const review = req.body;
    if (!review || !review.id) {
      return res.status(400).json({ error: "Invalid review payload" });
    }
    try {
      if (db) {
        await db.collection("reviews").doc(review.id).set(review);
        
        // Auto recalculate average ratings in background on Firestore
        const snap = await db.collection("reviews").where("restaurantId", "==", review.restaurantId).get();
        const list: any[] = [];
        snap.forEach((d: any) => list.push(d.data()));
        
        const restReviews = list.length > 0 ? list : [...memoryReviews, review].filter((r: any) => r.restaurantId === review.restaurantId);
        const sum = restReviews.reduce((acc, r) => acc + r.rating, 0);
        const ratingCount = restReviews.length;
        const rating = parseFloat((sum / restReviews.length).toFixed(1));

        await db.collection("restaurants").doc(review.restaurantId).update({ rating, ratingCount });
      }
    } catch (error) {
      console.warn("[EatStream Server] POST /api/reviews Firestore auto-recalculation error:", error);
    }

    memoryReviews.unshift(review);
    const restIdx = memoryRestaurants.findIndex((r: any) => r.id === review.restaurantId);
    if (restIdx !== -1) {
      const restReviews = memoryReviews.filter((r: any) => r.restaurantId === review.restaurantId);
      const sum = restReviews.reduce((acc, r) => acc + r.rating, 0);
      memoryRestaurants[restIdx].ratingCount = restReviews.length;
      memoryRestaurants[restIdx].rating = parseFloat((sum / restReviews.length).toFixed(1));
    }
    res.json({ success: true, review });
  });

  // REST API: Wallet Earnings
  app.get("/api/earnings/:userId", (req, res) => {
    const { userId } = req.params;
    let wallet = memoryEarnings[userId];
    if (!wallet) {
      wallet = {
        userId,
        balance: 0,
        totalEarned: 0,
        transactions: []
      };
      memoryEarnings[userId] = wallet;
    }
    res.json(wallet);
  });

  app.post("/api/earnings/transaction", (req, res) => {
    const { userId, amount, type, description, orderId } = req.body;
    if (!userId || amount === undefined || !type) {
      return res.status(400).json({ error: "Invalid transaction payload" });
    }
    let wallet = memoryEarnings[userId];
    if (!wallet) {
      wallet = { userId, balance: 0, totalEarned: 0, transactions: [] };
    }
    if (type === "credit") {
      wallet.balance += amount;
      wallet.totalEarned += amount;
    } else {
      wallet.balance -= amount;
    }
    wallet.transactions.unshift({
      id: `tx-${Date.now()}`,
      orderId,
      amount,
      type,
      description,
      date: new Date().toISOString()
    });
    memoryEarnings[userId] = wallet;
    res.json({ success: true, wallet });
  });

  // REST API: Download Invoice HTML/PDF Data
  app.get("/api/invoice/:orderId", (req, res) => {
    const { orderId } = req.params;
    
    // Sample Invoice Data Generation
    const mockInvoice = {
      invoiceId: `INV-${Date.now().toString().slice(-6)}`,
      orderId: orderId,
      date: new Date().toLocaleDateString(),
      customerName: "Demo Customer",
      customerEmail: "customer@demo.com",
      restaurantName: "Spicy Fusion & Grill",
      restaurantAddress: "102, Culinary Boulevard, Foodie Street",
      items: [
        { name: "Spicy Paneer Tikka Masala", qty: 2, price: 14.99 },
        { name: "Garlic Butter Naan", qty: 3, price: 3.49 },
        { name: "Mango Lassi Special", qty: 2, price: 4.50 }
      ],
      deliveryFee: 3.99,
      tax: 2.80,
      discount: 5.00,
      totalAmount: 36.19,
      paymentMethod: "Credit Card (Mock Payment)",
      status: "Paid",
    };

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${mockInvoice.invoiceId}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 40px; line-height: 1.4; background-color: #fafafa; }
          .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; background-color: #fff; box-shadow: 0 0 10px rgba(0, 0, 0, .15); border-radius: 8px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f97316; padding-bottom: 20px; margin-bottom: 20px; }
          .logo { font-size: 28px; font-weight: bold; color: #f97316; }
          .title { font-size: 24px; text-align: right; color: #4b5563; }
          .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; }
          .info-block { flex: 1; }
          .info-block h4 { margin: 0 0 8px 0; color: #1f2937; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px; }
          .table { width: 100%; border-collapse: collapse; text-align: left; margin-bottom: 30px; }
          .table th { background-color: #f3f4f6; color: #374151; font-weight: 600; padding: 12px; border-bottom: 1px solid #e5e7eb; }
          .table td { padding: 12px; border-bottom: 1px solid #f3f4f6; }
          .table tr:last-child td { border-bottom: none; }
          .totals { width: 300px; margin-left: auto; font-size: 14px; }
          .totals-row { display: flex; justify-content: space-between; padding: 6px 0; }
          .totals-row.grand { border-top: 2px solid #f97316; padding-top: 12px; font-size: 18px; font-weight: bold; color: #f97316; }
          .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          @media print {
            body { background: none; padding: 0; }
            .invoice-box { box-shadow: none; border: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <div>
              <div class="logo">EATSTREAM</div>
              <div>Swiggy + Zomato Inspired Platform</div>
            </div>
            <div class="title">
              <strong>INVOICE</strong><br>
              <span style="font-size: 14px; color: #9ca3af;">#${mockInvoice.invoiceId}</span>
            </div>
          </div>
          
          <div class="info-section">
            <div class="info-block">
              <h4>Billed To</h4>
              <strong>${mockInvoice.customerName}</strong><br>
              ${mockInvoice.customerEmail}<br>
              Payment: ${mockInvoice.paymentMethod}
            </div>
            <div class="info-block" style="text-align: center;">
              <h4>Restaurant</h4>
              <strong>${mockInvoice.restaurantName}</strong><br>
              ${mockInvoice.restaurantAddress}
            </div>
            <div class="info-block" style="text-align: right;">
              <h4>Details</h4>
              Date: ${mockInvoice.date}<br>
              Order ID: ${mockInvoice.orderId}<br>
              Status: <span style="background-color: #def7ec; color: #03543f; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">${mockInvoice.status}</span>
            </div>
          </div>
          
          <table class="table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${mockInvoice.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td style="text-align: center;">${item.qty}</td>
                  <td style="text-align: right;">$${item.price.toFixed(2)}</td>
                  <td style="text-align: right;">$${(item.qty * item.price).toFixed(2)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          
          <div class="totals">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span>$${mockInvoice.items.reduce((acc, x) => acc + (x.qty * x.price), 0).toFixed(2)}</span>
            </div>
            <div class="totals-row">
              <span>Delivery Fee:</span>
              <span>$${mockInvoice.deliveryFee.toFixed(2)}</span>
            </div>
            <div class="totals-row">
              <span>GST & Restaurant Tax (5%):</span>
              <span>$${mockInvoice.tax.toFixed(2)}</span>
            </div>
            <div class="totals-row" style="color: #10b981;">
              <span>Promo Discount Applied:</span>
              <span>-$${mockInvoice.discount.toFixed(2)}</span>
            </div>
            <div class="totals-row grand">
              <span>Total Paid:</span>
              <span>$${mockInvoice.totalAmount.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="footer">
            Thank you for ordering with EatStream! If you have any support issues regarding this order,<br>
            please contact support via our live chat client in your dashboard or mail support@eatstream.io.
          </div>
        </div>
      </body>
      </html>
    `);
  });

  // REST API: Retrieve logs and security audits
  app.get("/api/logs", async (req, res) => {
    try {
      if (db) {
        const snap = await db.collection("logs").get();
        const list: any[] = [];
        snap.forEach((d: any) => list.push(d.data()));
        if (list.length > 0) {
          memoryLogs = list.sort((a: any, b: any) => b.timestamp.localeCompare(a.timestamp));
        }
      }
    } catch (error) {
      console.warn("[EatStream Server] GET /api/logs Firestore fetch error:", error);
    }
    res.json({
      success: true,
      logs: memoryLogs
    });
  });

  app.post("/api/logs", async (req, res) => {
    const log = req.body;
    if (!log || !log.id) {
      return res.status(400).json({ error: "Invalid log payload" });
    }
    try {
      if (db) {
        await db.collection("logs").doc(log.id).set(log);
      }
    } catch (error) {
      console.warn("[EatStream Server] POST /api/logs Firestore save error:", error);
    }
    memoryLogs.unshift(log);
    res.json({ success: true, log });
  });

  // REST API: Admin Reports Data
  app.get("/api/reports", (req, res) => {
    res.json({
      success: true,
      summary: {
        totalRevenue: 154820.50,
        totalOrders: 12480,
        activeRestaurants: memoryRestaurants.length,
        activeDrivers: 89,
        customerGrowthRate: "18.4%",
      },
      monthlyBreakdown: [
        { month: "Jan", revenue: 18400, orders: 1100 },
        { month: "Feb", revenue: 21200, orders: 1300 },
        { month: "Mar", revenue: 25800, orders: 1650 },
        { month: "Apr", revenue: 24900, orders: 1500 },
        { month: "May", revenue: 31000, orders: 2100 },
        { month: "Jun", revenue: 33520, orders: 2430 }
      ],
      popularCategories: [
        { name: "Biryani & Rice", percentage: 35 },
        { name: "Burgers & Fast Food", percentage: 22 },
        { name: "Pizzas & Italian", percentage: 18 },
        { name: "Indian Curries", percentage: 15 },
        { name: "Desserts & Shakes", percentage: 10 }
      ]
    });
  });

  // REST API: System Settings
  app.get("/api/settings", (req, res) => {
    res.json({
      success: true,
      settings: {
        commissionRate: 15.0, // 15% platform commission
        taxRate: 5.0, // 5% GST
        deliveryBaseFare: 3.00,
        deliveryPerKmFare: 1.50,
        freeDeliveryThreshold: 40.00,
        supportEmail: "support@eatstream.io",
        smsEnabled: true,
        pushNotificationsEnabled: true,
        maintenanceMode: false
      }
    });
  });

  // Serve static UI assets and handle dev server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA Fallback for all other requests
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[EatStream Server] Backend APIs and Web UI active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start full stack Express + Vite server:", err);
});
