import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  onSnapshot,
  orderBy 
} from "firebase/firestore";
import { db } from "../firebase";
import { 
  UserProfile, 
  Restaurant, 
  FoodItem, 
  Order, 
  Coupon, 
  Review, 
  ChatMessage, 
  WalletEarnings, 
  AuditLog,
  OrderStatus,
  Coordinates
} from "../types";

const INITIAL_RESTAURANTS: Restaurant[] = [
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

const INITIAL_FOODS: FoodItem[] = [
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

const INITIAL_COUPONS: Coupon[] = [
  { code: "EATNEW50", discount: 5.00, type: "flat", minOrder: 15.00, description: "Flat $5.00 OFF on your first gourmet meal", isAvailable: true },
  { code: "SUPERDEAL30", discount: 30, type: "percent", minOrder: 25.00, description: "30% OFF up to $15 on orders above $25", isAvailable: true },
  { code: "FREESHIP", discount: 3.99, type: "flat", minOrder: 20.00, description: "Zero Delivery Fee on ordering premium food", isAvailable: true }
];

const INITIAL_REVIEWS: Review[] = [
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

class PersistenceEngine {
  private localPrefix = "eatstream_";

  constructor() {
    this.bootstrapLocalStorage();
  }

  private bootstrapLocalStorage() {
    if (!localStorage.getItem(this.localPrefix + "seeded")) {
      localStorage.setItem(this.localPrefix + "restaurants", JSON.stringify(INITIAL_RESTAURANTS));
      localStorage.setItem(this.localPrefix + "foods", JSON.stringify(INITIAL_FOODS));
      localStorage.setItem(this.localPrefix + "coupons", JSON.stringify(INITIAL_COUPONS));
      localStorage.setItem(this.localPrefix + "reviews", JSON.stringify(INITIAL_REVIEWS));
      localStorage.setItem(this.localPrefix + "orders", JSON.stringify([]));
      localStorage.setItem(this.localPrefix + "messages", JSON.stringify([]));
      localStorage.setItem(this.localPrefix + "logs", JSON.stringify([
        { id: "log-init", action: "Database Bootstrapped", details: "EatStream dynamic records successfully seeded", timestamp: new Date().toISOString() }
      ]));
      localStorage.setItem(this.localPrefix + "earnings", JSON.stringify({
        "driver-1": { userId: "driver-1", balance: 142.50, totalEarned: 450.00, transactions: [] },
        "owner-1": { userId: "owner-1", balance: 1250.00, totalEarned: 4200.00, transactions: [] }
      }));
      localStorage.setItem(this.localPrefix + "seeded", "true");
    }
  }

  public getLocal<T>(key: string): T[] {
    const val = localStorage.getItem(this.localPrefix + key);
    return val ? JSON.parse(val) : [];
  }

  public setLocal<T>(key: string, data: T[] | object) {
    localStorage.setItem(this.localPrefix + key, JSON.stringify(data));
  }

  public async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, "users", userId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
    } catch (e) {
      console.warn("Firestore Read Failed. Falling back to memory profiles.", e);
    }
    
    const usersMap = JSON.parse(localStorage.getItem(this.localPrefix + "users_map") || "{}");
    return usersMap[userId] || null;
  }

  public async saveProfile(profile: UserProfile): Promise<void> {
    try {
      const docRef = doc(db, "users", profile.id);
      await setDoc(docRef, profile, { merge: true });
    } catch (e) {
      console.warn("Firestore Save Profile Failed. Saving locally.", e);
    }

    const usersMap = JSON.parse(localStorage.getItem(this.localPrefix + "users_map") || "{}");
    usersMap[profile.id] = profile;
    localStorage.setItem(this.localPrefix + "users_map", JSON.stringify(usersMap));
  }

  public async getRestaurants(): Promise<Restaurant[]> {
    try {
      const res = await fetch("/api/restaurants");
      if (res.ok) {
        const list = await res.json();
        this.setLocal("restaurants", list);
        return list;
      }
    } catch (e) {
      console.warn("API GET /api/restaurants failed. Falling back to direct Firestore.", e);
    }

    try {
      const snap = await getDocs(collection(db, "restaurants"));
      const list: Restaurant[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) } as Restaurant));
      if (list.length > 0) {
        this.setLocal("restaurants", list);
        return list;
      }
    } catch (e) {
      console.warn("Firestore Get Restaurants failed, loading offline.", e);
    }
    return this.getLocal<Restaurant>("restaurants");
  }

  public async saveRestaurant(restaurant: Restaurant): Promise<void> {
    try {
      const res = await fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(restaurant)
      });
      if (res.ok) {
        const list = this.getLocal<Restaurant>("restaurants");
        const idx = list.findIndex(r => r.id === restaurant.id);
        if (idx !== -1) {
          list[idx] = restaurant;
        } else {
          list.push(restaurant);
        }
        this.setLocal("restaurants", list);
        await this.logAction("Restaurant Update", `Saved details for ${restaurant.name}`);
        return;
      }
    } catch (e) {
      console.warn("API POST /api/restaurants failed. Falling back to direct Firestore.", e);
    }

    try {
      await setDoc(doc(db, "restaurants", restaurant.id), restaurant, { merge: true });
    } catch (e) {
      console.warn("Firestore Save Restaurant failed, writing offline.", e);
    }

    const list = this.getLocal<Restaurant>("restaurants");
    const idx = list.findIndex(r => r.id === restaurant.id);
    if (idx !== -1) {
      list[idx] = restaurant;
    } else {
      list.push(restaurant);
    }
    this.setLocal("restaurants", list);
    await this.logAction("Restaurant Update", `Saved details for ${restaurant.name}`);
  }

  public async getFoods(restaurantId?: string): Promise<FoodItem[]> {
    try {
      const url = restaurantId ? `/api/foods?restaurantId=${restaurantId}` : "/api/foods";
      const res = await fetch(url);
      if (res.ok) {
        const list = await res.json();
        if (!restaurantId) this.setLocal("foods", list);
        return list;
      }
    } catch (e) {
      console.warn("API GET /api/foods failed. Falling back to direct Firestore.", e);
    }

    try {
      let q;
      if (restaurantId) {
        q = query(collection(db, "foods"), where("restaurantId", "==", restaurantId));
      } else {
        q = collection(db, "foods");
      }
      const snap = await getDocs(q);
      const list: FoodItem[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) } as FoodItem));
      if (list.length > 0) {
        if (!restaurantId) this.setLocal("foods", list);
        return list;
      }
    } catch (e) {
      console.warn("Firestore Get Foods failed, loading offline.", e);
    }

    const localFoods = this.getLocal<FoodItem>("foods");
    return restaurantId ? localFoods.filter(f => f.restaurantId === restaurantId) : localFoods;
  }

  public async saveFood(food: FoodItem): Promise<void> {
    try {
      const res = await fetch("/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(food)
      });
      if (res.ok) {
        const list = this.getLocal<FoodItem>("foods");
        const idx = list.findIndex(f => f.id === food.id);
        if (idx !== -1) {
          list[idx] = food;
        } else {
          list.push(food);
        }
        this.setLocal("foods", list);
        await this.logAction("Menu Management", `Added/Modified menu item ${food.name}`);
        return;
      }
    } catch (e) {
      console.warn("API POST /api/foods failed. Falling back to direct Firestore.", e);
    }

    try {
      await setDoc(doc(db, "foods", food.id), food, { merge: true });
    } catch (e) {
      console.warn("Firestore Save Food failed, writing offline.", e);
    }

    const list = this.getLocal<FoodItem>("foods");
    const idx = list.findIndex(f => f.id === food.id);
    if (idx !== -1) {
      list[idx] = food;
    } else {
      list.push(food);
    }
    this.setLocal("foods", list);
    await this.logAction("Menu Management", `Added/Modified menu item ${food.name}`);
  }

  public async deleteFood(foodId: string): Promise<void> {
    try {
      const res = await fetch(`/api/foods/${foodId}`, { method: "DELETE" });
      if (res.ok) {
        const list = this.getLocal<FoodItem>("foods");
        const filtered = list.filter(f => f.id !== foodId);
        this.setLocal("foods", filtered);
        await this.logAction("Menu Management", `Deleted item ID: ${foodId}`);
        return;
      }
    } catch (e) {
      console.warn("API DELETE /api/foods failed. Falling back to local storage.", e);
    }

    const list = this.getLocal<FoodItem>("foods");
    const filtered = list.filter(f => f.id !== foodId);
    this.setLocal("foods", filtered);
    await this.logAction("Menu Management", `Deleted item ID: ${foodId}`);
  }

  public async getOrders(userId: string, role: string): Promise<Order[]> {
    try {
      const res = await fetch(`/api/orders?userId=${userId}&role=${role}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("API GET /api/orders failed. Falling back to direct Firestore.", e);
    }

    try {
      let field = "customerId";
      if (role === "restaurantOwner") field = "restaurantOwnerId";
      if (role === "deliveryPartner") field = "deliveryPartnerId";
      if (role === "admin") {
        const snap = await getDocs(collection(db, "orders"));
        const list: Order[] = [];
        snap.forEach(d => list.push({ id: d.id, ...(d.data() as any) } as Order));
        if (list.length > 0) return list;
      } else {
        const q = query(collection(db, "orders"), where(field, "==", userId));
        const snap = await getDocs(q);
        const list: Order[] = [];
        snap.forEach(d => list.push({ id: d.id, ...(d.data() as any) } as Order));
        if (list.length > 0) return list;
      }
    } catch (e) {
      console.warn("Firestore get orders failed, loading offline.", e);
    }

    const orders = this.getLocal<Order>("orders");
    if (role === "admin") return orders;
    if (role === "customer") return orders.filter(o => o.customerId === userId);
    if (role === "restaurantOwner") return orders.filter(o => o.restaurantOwnerId === userId);
    if (role === "deliveryPartner") return orders.filter(o => o.deliveryPartnerId === userId);
    return [];
  }

  public async createOrder(order: Order): Promise<void> {
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order)
      });
      if (res.ok) {
        const orders = this.getLocal<Order>("orders");
        orders.unshift(order);
        this.setLocal("orders", orders);
        await this.logAction("Order Placed", `Order ${order.id} placed at ${order.restaurantName} for $${order.total}`);
        return;
      }
    } catch (e) {
      console.warn("API POST /api/orders failed. Falling back to direct Firestore.", e);
    }

    try {
      await setDoc(doc(db, "orders", order.id), order);
    } catch (e) {
      console.warn("Firestore create order failed, writing offline.", e);
    }

    const orders = this.getLocal<Order>("orders");
    orders.unshift(order);
    this.setLocal("orders", orders);
    await this.logAction("Order Placed", `Order ${order.id} placed at ${order.restaurantName} for $${order.total}`);
  }

  public async updateOrderStatus(orderId: string, status: OrderStatus, deliveryPartner?: { id: string, name: string, phone: string, coords: Coordinates }): Promise<void> {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, deliveryPartner })
      });
      if (res.ok) {
        const orders = this.getLocal<Order>("orders");
        const idx = orders.findIndex(o => o.id === orderId);
        if (idx !== -1) {
          orders[idx].status = status;
          orders[idx].updatedAt = new Date().toISOString();
          if (deliveryPartner) {
            orders[idx].deliveryPartnerId = deliveryPartner.id;
            orders[idx].deliveryPartnerName = deliveryPartner.name;
            orders[idx].deliveryPartnerPhone = deliveryPartner.phone;
            orders[idx].deliveryPartnerCoords = deliveryPartner.coords;
          }
          this.setLocal("orders", orders);
        }
        await this.logAction("Order Status Change", `Order ${orderId} updated to state: ${status}`);
        return;
      }
    } catch (e) {
      console.warn("API PATCH /api/orders failed. Falling back to direct Firestore.", e);
    }

    try {
      const docRef = doc(db, "orders", orderId);
      const updates: any = { status, updatedAt: new Date().toISOString() };
      if (deliveryPartner) {
        updates.deliveryPartnerId = deliveryPartner.id;
        updates.deliveryPartnerName = deliveryPartner.name;
        updates.deliveryPartnerPhone = deliveryPartner.phone;
        updates.deliveryPartnerCoords = deliveryPartner.coords;
      }
      await updateDoc(docRef, updates);
    } catch (e) {
      console.warn("Firestore updateOrderStatus failed, updating offline.", e);
    }

    const orders = this.getLocal<Order>("orders");
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      orders[idx].status = status;
      orders[idx].updatedAt = new Date().toISOString();
      if (deliveryPartner) {
        orders[idx].deliveryPartnerId = deliveryPartner.id;
        orders[idx].deliveryPartnerName = deliveryPartner.name;
        orders[idx].deliveryPartnerPhone = deliveryPartner.phone;
        orders[idx].deliveryPartnerCoords = deliveryPartner.coords;
      }
      this.setLocal("orders", orders);
    }
    await this.logAction("Order Status Change", `Order ${orderId} updated to state: ${status}`);
  }

  public async sendChatMessage(msg: ChatMessage): Promise<void> {
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msg)
      });
      if (res.ok) {
        const msgs = this.getLocal<ChatMessage>("messages");
        msgs.push(msg);
        this.setLocal("messages", msgs);
        return;
      }
    } catch (e) {
      console.warn("API POST /api/messages failed. Falling back to direct Firestore.", e);
    }

    try {
      await setDoc(doc(db, "messages", msg.id), msg);
    } catch (e) {
      console.warn("Firestore send message failed, saving offline.", e);
    }

    const msgs = this.getLocal<ChatMessage>("messages");
    msgs.push(msg);
    this.setLocal("messages", msgs);
  }

  public getChatMessages(orderId: string, callback: (msgs: ChatMessage[]) => void) {
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/messages/${orderId}`);
        if (res.ok) {
          const list = await res.json();
          callback(list);
          return;
        }
      } catch (e) {
        console.warn("API GET /api/messages failed, falling back to local list.", e);
      }
      // Local list polling
      const msgs = this.getLocal<ChatMessage>("messages").filter(m => m.orderId === orderId);
      callback(msgs);
    }, 1500);

    return () => clearInterval(pollInterval);
  }

  public trackDriverLocation(orderId: string, callback: (coords: Coordinates) => void) {
    const orders = this.getLocal<Order>("orders");
    const order = orders.find(o => o.id === orderId);
    if (!order) return () => {};

    const start = order.restaurantCoords;
    const end = order.customerCoords;
    let progress = 0;

    const timer = setInterval(() => {
      progress += 0.05;
      if (progress > 1.0) {
        progress = 1.0;
        clearInterval(timer);
      }
      
      const currentLat = start.lat + (end.lat - start.lat) * progress;
      const currentLng = start.lng + (end.lng - start.lng) * progress;
      
      const currentOrders = this.getLocal<Order>("orders");
      const orderIdx = currentOrders.findIndex(o => o.id === orderId);
      if (orderIdx !== -1) {
        currentOrders[orderIdx].deliveryPartnerCoords = { lat: currentLat, lng: currentLng };
        this.setLocal("orders", currentOrders);
      }
      
      callback({ lat: currentLat, lng: currentLng });
    }, 2000);

    return () => clearInterval(timer);
  }

  public async logAction(action: string, details: string, profile?: UserProfile): Promise<void> {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: profile?.id || "anonymous",
      userName: profile?.name || "Anonymous User",
      userEmail: profile?.email || "anonymous@eatstream.io",
      action,
      details,
      timestamp: new Date().toISOString()
    };

    try {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(log)
      });
      if (res.ok) {
        const logs = this.getLocal<AuditLog>("logs");
        logs.unshift(log);
        this.setLocal("logs", logs);
        return;
      }
    } catch (e) {
      console.warn("API POST /api/logs failed. Falling back to direct Firestore.", e);
    }

    try {
      await setDoc(doc(db, "logs", log.id), log);
    } catch (e) {
    }

    const logs = this.getLocal<AuditLog>("logs");
    logs.unshift(log);
    this.setLocal("logs", logs);
  }

  public async getLogs(): Promise<AuditLog[]> {
    try {
      const res = await fetch("/api/logs");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.logs) {
          return data.logs;
        }
      }
    } catch (e) {
      console.warn("API GET /api/logs failed. Falling back to direct Firestore.", e);
    }

    try {
      const snap = await getDocs(collection(db, "logs"));
      const list: AuditLog[] = [];
      snap.forEach(d => list.push(d.data() as AuditLog));
      if (list.length > 0) return list.sort((a,b) => b.timestamp.localeCompare(a.timestamp));
    } catch (e) {}
    return this.getLocal<AuditLog>("logs").sort((a,b) => b.timestamp.localeCompare(a.timestamp));
  }

  public async getReviews(restaurantId: string): Promise<Review[]> {
    try {
      const res = await fetch(`/api/reviews/${restaurantId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("API GET /api/reviews failed. Falling back to direct Firestore.", e);
    }

    try {
      const q = query(collection(db, "reviews"), where("restaurantId", "==", restaurantId));
      const snap = await getDocs(q);
      const list: Review[] = [];
      snap.forEach(d => list.push({ id: d.id, ...(d.data() as any) } as Review));
      if (list.length > 0) return list;
    } catch (e) {}

    return this.getLocal<Review>("reviews").filter(r => r.restaurantId === restaurantId);
  }

  public async saveReview(review: Review): Promise<void> {
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(review)
      });
      if (res.ok) {
        const list = this.getLocal<Review>("reviews");
        list.unshift(review);
        this.setLocal("reviews", list);

        const restaurants = this.getLocal<Restaurant>("restaurants");
        const rest = restaurants.find(r => r.id === review.restaurantId);
        if (rest) {
          const restReviews = list.filter(r => r.restaurantId === review.restaurantId);
          const sum = restReviews.reduce((acc, r) => acc + r.rating, 0);
          rest.ratingCount = restReviews.length;
          rest.rating = parseFloat((sum / restReviews.length).toFixed(1));
          this.setLocal("restaurants", restaurants);
        }
        return;
      }
    } catch (e) {
      console.warn("API POST /api/reviews failed. Falling back to direct Firestore.", e);
    }

    try {
      await setDoc(doc(db, "reviews", review.id), review);
    } catch (e) {}

    const list = this.getLocal<Review>("reviews");
    list.unshift(review);
    this.setLocal("reviews", list);

    const restaurants = this.getLocal<Restaurant>("restaurants");
    const rest = restaurants.find(r => r.id === review.restaurantId);
    if (rest) {
      const restReviews = list.filter(r => r.restaurantId === review.restaurantId);
      const sum = restReviews.reduce((acc, r) => acc + r.rating, 0);
      rest.ratingCount = restReviews.length;
      rest.rating = parseFloat((sum / restReviews.length).toFixed(1));
      this.saveRestaurant(rest);
    }
  }

  public async getEarnings(userId: string): Promise<WalletEarnings> {
    try {
      const res = await fetch(`/api/earnings/${userId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("API GET /api/earnings failed. Falling back to local storage.", e);
    }

    const earningsMap = JSON.parse(localStorage.getItem(this.localPrefix + "earnings") || "{}");
    if (!earningsMap[userId]) {
      earningsMap[userId] = {
        userId,
        balance: 0,
        totalEarned: 0,
        transactions: []
      };
      localStorage.setItem(this.localPrefix + "earnings", JSON.stringify(earningsMap));
    }
    return earningsMap[userId];
  }

  public async addTransaction(userId: string, amount: number, type: "credit" | "debit", description: string, orderId?: string): Promise<void> {
    try {
      const res = await fetch("/api/earnings/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount, type, description, orderId })
      });
      if (res.ok) {
        return;
      }
    } catch (e) {
      console.warn("API POST /api/earnings/transaction failed. Falling back to local storage.", e);
    }

    const earningsMap = JSON.parse(localStorage.getItem(this.localPrefix + "earnings") || "{}");
    if (!earningsMap[userId]) {
      earningsMap[userId] = { userId, balance: 0, totalEarned: 0, transactions: [] };
    }
    
    const wallet = earningsMap[userId] as WalletEarnings;
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

    earningsMap[userId] = wallet;
    localStorage.setItem(this.localPrefix + "earnings", JSON.stringify(earningsMap));
  }

  public resetToFactorySeeds() {
    localStorage.removeItem(this.localPrefix + "seeded");
    this.bootstrapLocalStorage();
  }
}

export const firebaseService = new PersistenceEngine();
