import React, { useState, useEffect } from "react";
import { UserProfile, Restaurant, FoodItem, Order, Review } from "../types";
import { firebaseService } from "../lib/firebaseService";
import { 
  Plus, Edit3, Trash2, TrendingUp, Landmark, Settings, Coffee, ShoppingBag, Star 
} from "lucide-react";

interface OwnerDashboardProps {
  profile: UserProfile;
}

export default function OwnerDashboard({ profile }: OwnerDashboardProps) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<"orders" | "menu" | "analytics" | "settings">("orders");

  const [showFoodModal, setShowFoodModal] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [foodForm, setFoodForm] = useState({
    name: "",
    description: "",
    price: 9.99,
    category: "Main Course",
    isVeg: true,
    isAvailable: true,
    image: ""
  });

  const [restForm, setRestForm] = useState({
    name: "",
    description: "",
    category: "North Indian",
    timings: "11:00 AM - 11:30 PM",
    address: "",
    taxNumber: "",
    bankName: "",
    accountNumber: "",
    ifscCode: ""
  });

  useEffect(() => {
    async function loadVendorData() {
      const restList = await firebaseService.getRestaurants();
      let myRest = restList.find(r => r.ownerId === profile.id);
      
      if (!myRest) {
        myRest = {
          id: `rest-${profile.id.slice(-4)}`,
          name: "Spicy Fusion & Grill",
          description: "Premium North Indian & Mughlai culinary arts. Famous for Charcoal-grilled Kebabs & Handi Biryanis.",
          category: "North Indian",
          rating: 4.8,
          ratingCount: 248,
          image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=60",
          timings: "11:00 AM - 11:30 PM",
          businessHours: { open: "11:00", close: "23:30" },
          ownerId: profile.id,
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
        };
        await firebaseService.saveRestaurant(myRest);
      }

      setRestaurant(myRest);
      setRestForm({
        name: myRest.name,
        description: myRest.description,
        category: myRest.category,
        timings: myRest.timings,
        address: myRest.address,
        taxNumber: myRest.taxNumber || "",
        bankName: myRest.bankDetails?.bankName || "",
        accountNumber: myRest.bankDetails?.accountNumber || "",
        ifscCode: myRest.bankDetails?.ifscCode || ""
      });

      const allFoods = await firebaseService.getFoods();
      setFoods(allFoods.filter(f => f.restaurantId === myRest!.id));

      const allOrders = await firebaseService.getOrders(profile.id, "restaurantOwner");
      setOrders(allOrders);

      const allReviews = await firebaseService.getReviews(myRest.id);
      setReviews(allReviews);
    }
    
    loadVendorData();
  }, [profile.id]);

  const handleSaveRestaurantSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;
    
    const updated: Restaurant = {
      ...restaurant,
      name: restForm.name,
      description: restForm.description,
      category: restForm.category,
      timings: restForm.timings,
      address: restForm.address,
      taxNumber: restForm.taxNumber,
      bankDetails: {
        bankName: restForm.bankName,
        accountNumber: restForm.accountNumber,
        ifscCode: restForm.ifscCode,
        accountHolderName: restForm.name
      },
      updatedAt: new Date().toISOString()
    };

    await firebaseService.saveRestaurant(updated);
    setRestaurant(updated);
    alert("Restaurant Profile configuration successfully saved!");
  };

  const handleToggleStock = async (foodId: string) => {
    const allFoods = [...foods];
    const idx = allFoods.findIndex(f => f.id === foodId);
    if (idx !== -1) {
      allFoods[idx].isAvailable = !allFoods[idx].isAvailable;
      await firebaseService.saveFood(allFoods[idx]);
      setFoods(allFoods);
    }
  };

  const handleSaveFoodItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    const foodId = editingFood ? editingFood.id : `food-${Date.now()}`;
    const newFood: FoodItem = {
      id: foodId,
      restaurantId: restaurant.id,
      name: foodForm.name,
      description: foodForm.description,
      price: parseFloat(foodForm.price.toString()),
      category: foodForm.category,
      isVeg: foodForm.isVeg,
      isAvailable: foodForm.isAvailable,
      image: foodForm.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=60",
      createdAt: editingFood ? editingFood.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await firebaseService.saveFood(newFood);
    
    if (editingFood) {
      setFoods(foods.map(f => f.id === foodId ? newFood : f));
    } else {
      setFoods([...foods, newFood]);
    }

    setShowFoodModal(false);
    setEditingFood(null);
  };

  const handleDeleteFoodItem = async (foodId: string) => {
    if (confirm("Are you sure you want to remove this dish from your kitchen menu?")) {
      await firebaseService.deleteFood(foodId);
      setFoods(foods.filter(f => f.id !== foodId));
    }
  };

  const handleOpenFoodModal = (food: FoodItem | null) => {
    if (food) {
      setEditingFood(food);
      setFoodForm({
        name: food.name,
        description: food.description,
        price: food.price,
        category: food.category,
        isVeg: food.isVeg,
        isAvailable: food.isAvailable,
        image: food.image
      });
    } else {
      setEditingFood(null);
      setFoodForm({
        name: "",
        description: "",
        price: 9.99,
        category: "Main Course",
        isVeg: true,
        isAvailable: true,
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=60"
      });
    }
    setShowFoodModal(true);
  };

  const handleOrderAction = async (orderId: string, nextStatus: "accepted" | "cooking" | "readyForPickup") => {
    let riderAssigned = undefined;
    if (nextStatus === "cooking") {
      riderAssigned = {
        id: "driver-1",
        name: "Rider Sam (Delivery)",
        phone: "+1 (555) 392-1204",
        coords: restaurant ? restaurant.coords : { lat: 12.9716, lng: 77.5946 }
      };
    }

    await firebaseService.updateOrderStatus(orderId, nextStatus, riderAssigned);
    setOrders(orders.map(o => {
      if (o.id === orderId) {
        return { 
          ...o, 
          status: nextStatus,
          ...(riderAssigned ? {
            deliveryPartnerId: riderAssigned.id,
            deliveryPartnerName: riderAssigned.name,
            deliveryPartnerPhone: riderAssigned.phone,
            deliveryPartnerCoords: riderAssigned.coords
          } : {})
        };
      }
      return o;
    }));

    if (nextStatus === "readyForPickup" && restaurant) {
      const currentOrder = orders.find(o => o.id === orderId);
      if (currentOrder) {
        await firebaseService.addTransaction(profile.id, currentOrder.subtotal, "credit", `Payout for order ${orderId}`, orderId);
      }
    }
  };

  return (
    <div id="owner-dashboard-container" className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm animate-fade-in">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-orange-600 animate-pulse"></span>
            <span className="text-[10px] text-orange-600 font-bold uppercase tracking-widest leading-none">Kitchen Active Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">
            {restaurant ? restaurant.name : "My Spicy Restaurant"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Owner Profile: {profile.name} • Status: <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-100">APPROVED VENDOR</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/50">
          {[
            { id: "orders", label: "Active Orders", Icon: ShoppingBag },
            { id: "menu", label: "Menu CRUD Manager", Icon: Coffee },
            { id: "analytics", label: "Income Analytics", Icon: TrendingUp },
            { id: "settings", label: "Business Details", Icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id 
                  ? "bg-orange-600 text-white shadow-xs" 
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              <tab.Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === "orders" && (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-900 font-display">Incoming Orders & Cook Stations</h3>
          
          {orders.filter(o => o.status !== "delivered" && o.status !== "cancelled").length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 py-16 text-center text-slate-400 text-sm">
              Your kitchen is quiet right now. No incoming orders.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {orders
                .filter(o => o.status !== "delivered" && o.status !== "cancelled")
                .map(order => (
                  <div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-800">#{order.id}</span>
                        <span className="rounded-full bg-orange-50 text-orange-600 border border-orange-100 text-[10px] font-bold uppercase px-2.5 py-0.5 tracking-wider">
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="text-xs text-slate-500 mb-3 font-semibold">
                        Billed To: {order.customerName} • {order.customerPhone}
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-100 mb-4">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="text-slate-700 font-bold">{it.qty}x {it.name}</span>
                            <span className="text-slate-900 font-bold">${(it.qty * it.price).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-xs text-slate-900">
                          <span>Earnings payout</span>
                          <span>${order.subtotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 border-t border-slate-50 pt-4">
                      {order.status === "placed" && (
                        <button 
                          onClick={() => handleOrderAction(order.id, "accepted")}
                          className="flex-1 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2.5 cursor-pointer animate-pulse"
                        >
                          Accept Order
                        </button>
                      )}
                      {order.status === "accepted" && (
                        <button 
                          onClick={() => handleOrderAction(order.id, "cooking")}
                          className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2.5 cursor-pointer"
                        >
                          Start Cooking Dish
                        </button>
                      )}
                      {order.status === "cooking" && (
                        <button 
                          onClick={() => handleOrderAction(order.id, "readyForPickup")}
                          className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2.5 cursor-pointer"
                        >
                          Mark Ready for Pick Up
                        </button>
                      )}
                      {order.status === "readyForPickup" && (
                        <div className="text-center w-full text-slate-400 text-xs py-2 font-semibold bg-slate-50 rounded-xl border">
                          Waiting for Rider to collect order (OTP: {order.otp})
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "menu" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 font-display">Kitchen Dish & Recipe Catalog</h3>
            <button 
              onClick={() => handleOpenFoodModal(null)}
              className="flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 text-xs font-bold shadow-md cursor-pointer transition-all hover:scale-[1.02]"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Recipe</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {foods.map(food => (
              <div key={food.id} className="rounded-2xl border border-slate-200 bg-white p-4 flex gap-4 shadow-xs items-start">
                <img src={food.image} alt={food.name} className="w-20 h-20 rounded-xl object-cover shadow-xs" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-1.5">
                    {food.isVeg ? (
                      <span className="inline-block h-4.5 w-4.5 border-2 border-emerald-600 p-0.5"><span className="block h-full w-full rounded-full bg-emerald-600"></span></span>
                    ) : (
                      <span className="inline-block h-4.5 w-4.5 border-2 border-rose-600 p-0.5"><span className="block h-full w-full rounded-full bg-rose-600"></span></span>
                    )}
                    <h4 className="font-bold text-slate-950 text-sm font-display">{food.name}</h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{food.description}</p>
                  
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-bold text-slate-900">${food.price.toFixed(2)}</span>
                    
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 text-[11px] font-bold text-slate-500 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={food.isAvailable} 
                          onChange={() => handleToggleStock(food.id)}
                          className="rounded text-orange-500 focus:ring-orange-500"
                        />
                        <span>In Stock</span>
                      </label>

                      <button 
                        onClick={() => handleOpenFoodModal(food)}
                        className="text-slate-400 hover:text-slate-600 p-1"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteFoodItem(food.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showFoodModal && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
                  <h3 className="text-base font-bold text-slate-900 font-display">{editingFood ? "Edit Menu Recipe" : "Add Gourmet Recipe"}</h3>
                  <button onClick={() => setShowFoodModal(false)} className="text-slate-400 text-xs font-bold p-1">Close</button>
                </div>

                <form onSubmit={handleSaveFoodItem} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Recipe Title</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full rounded-xl border border-slate-200 px-4 py-3" 
                      value={foodForm.name} 
                      onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Cuisine description</label>
                    <textarea 
                      required 
                      rows={2}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3" 
                      value={foodForm.description} 
                      onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Price ($)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        required 
                        className="w-full rounded-xl border border-slate-200 px-4 py-3" 
                        value={foodForm.price} 
                        onChange={(e) => setFoodForm({ ...foodForm, price: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Menu Category</label>
                      <select 
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold"
                        value={foodForm.category}
                        onChange={(e) => setFoodForm({ ...foodForm, category: e.target.value })}
                      >
                        <option value="Main Course">Main Course</option>
                        <option value="Starters">Starters</option>
                        <option value="Breads">Breads</option>
                        <option value="Beverages">Beverages</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Recipe Image URL</label>
                    <input 
                      type="text" 
                      className="w-full rounded-xl border border-slate-200 px-4 py-3" 
                      value={foodForm.image} 
                      onChange={(e) => setFoodForm({ ...foodForm, image: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-6 pt-2">
                    <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={foodForm.isVeg} 
                        onChange={(e) => setFoodForm({ ...foodForm, isVeg: e.target.checked })}
                      />
                      <span>Vegetarian Dish</span>
                    </label>
                    <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={foodForm.isAvailable} 
                        onChange={(e) => setFoodForm({ ...foodForm, isAvailable: e.target.checked })}
                      />
                      <span>In Stock (Available)</span>
                    </label>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 shadow cursor-pointer"
                  >
                    Save Recipe Item
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-900 font-display">Financial Reports & Performance Charts</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 shadow-xs">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Gross Revenue Earnings</span>
              <div className="text-3xl font-bold text-slate-950 font-display">$4,520.50</div>
              <p className="text-[10px] text-emerald-600 font-bold">↑ 18.2% vs previous quarter</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 shadow-xs">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Kitchen Order Volume</span>
              <div className="text-3xl font-bold text-slate-950 font-display">248 orders</div>
              <p className="text-[10px] text-emerald-600 font-bold">↑ 9.4% average customer growth</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 shadow-xs">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Average Ticket Order Size</span>
              <div className="text-3xl font-bold text-slate-950 font-display">$18.22</div>
              <p className="text-[10px] text-slate-400 font-bold">Includes platform commission deductions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Monthly Revenue Trend ($)</h4>
                <p className="text-[10px] text-slate-400 font-semibold">Custom Vector Line Graphic</p>
              </div>
              <div className="h-60 w-full bg-slate-50 border rounded-xl flex items-center justify-center relative p-4">
                <svg className="w-full h-full" viewBox="0 0 300 150">
                  <path 
                    d="M 30,120 Q 80,100 130,70 T 230,40 T 280,20" 
                    fill="none" 
                    stroke="#f97316" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                  />
                  <path 
                    d="M 30,120 Q 80,100 130,70 T 230,40 T 280,20 L 280,140 L 30,140 Z" 
                    fill="rgba(249,115,22,0.1)" 
                  />
                  <line x1="10" y1="20" x2="290" y2="20" stroke="#eee" strokeWidth="0.5" />
                  <line x1="10" y1="70" x2="290" y2="70" stroke="#eee" strokeWidth="0.5" />
                  <line x1="10" y1="120" x2="290" y2="120" stroke="#eee" strokeWidth="0.5" />
                  
                  <circle cx="30" cy="120" r="4" fill="#f97316" />
                  <circle cx="130" cy="70" r="4" fill="#f97316" />
                  <circle cx="280" cy="20" r="4" fill="#f97316" />

                  <text x="30" y="140" fill="#999" fontSize="8" textAnchor="middle">Jan</text>
                  <text x="80" y="140" fill="#999" fontSize="8" textAnchor="middle">Feb</text>
                  <text x="130" y="140" fill="#999" fontSize="8" textAnchor="middle">Mar</text>
                  <text x="180" y="140" fill="#999" fontSize="8" textAnchor="middle">Apr</text>
                  <text x="230" y="140" fill="#999" fontSize="8" textAnchor="middle">May</text>
                  <text x="280" y="140" fill="#999" fontSize="8" textAnchor="middle">Jun</text>
                </svg>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Daily Kitchen Load Volume</h4>
                <p className="text-[10px] text-slate-400 font-semibold">Custom Vector Histogram Graphic</p>
              </div>
              <div className="h-60 w-full bg-slate-50 border rounded-xl flex items-center justify-center relative p-4">
                <svg className="w-full h-full" viewBox="0 0 300 150">
                  {[
                    { label: "M", val: 40 },
                    { label: "T", val: 55 },
                    { label: "W", val: 80 },
                    { label: "T", val: 75 },
                    { label: "F", val: 110 },
                    { label: "S", val: 135 },
                    { label: "S", val: 125 }
                  ].map((day, idx) => {
                    const barWidth = 24;
                    const spacing = 14;
                    const x = 30 + idx * (barWidth + spacing);
                    const y = 130 - day.val * 0.8;
                    const h = day.val * 0.8;

                    return (
                      <g key={idx}>
                        <rect 
                          x={x} 
                          y={y} 
                          width={barWidth} 
                          height={h} 
                          fill="#f97316" 
                          rx="4"
                          className="hover:fill-orange-600 transition-all cursor-pointer"
                        />
                        <text x={x + barWidth/2} y="145" fill="#999" fontSize="8" textAnchor="middle">{day.label}</text>
                        <text x={x + barWidth/2} y={y - 5} fill="#111" fontSize="8" fontWeight="bold" textAnchor="middle">{day.val}</text>
                      </g>
                    );
                  })}
                  <line x1="20" y1="130" x2="290" y2="130" stroke="#ddd" strokeWidth="1" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs max-w-2xl animate-fade-in">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 font-display">
            <Landmark className="h-5 w-5 text-slate-400" />
            <span>Restaurant Incorporation & Banking details</span>
          </h3>

          <form onSubmit={handleSaveRestaurantSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Trading Vendor Name</label>
                <input 
                  type="text" 
                  required 
                  className="w-full rounded-xl border border-slate-200 px-4 py-3" 
                  value={restForm.name}
                  onChange={(e) => setRestForm({ ...restForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Cuisine Genre Category</label>
                <input 
                  type="text" 
                  required 
                  className="w-full rounded-xl border border-slate-200 px-4 py-3" 
                  value={restForm.category}
                  onChange={(e) => setRestForm({ ...restForm, category: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Kitchen Address Coordinates</label>
              <input 
                type="text" 
                required 
                className="w-full rounded-xl border border-slate-200 px-4 py-3" 
                value={restForm.address}
                onChange={(e) => setRestForm({ ...restForm, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Vendor GSTIN Tax Number</label>
                <input 
                  type="text" 
                  required 
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 uppercase" 
                  placeholder="GSTIN92830182Z"
                  value={restForm.taxNumber}
                  onChange={(e) => setRestForm({ ...restForm, taxNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Service Business Hours</label>
                <input 
                  type="text" 
                  required 
                  className="w-full rounded-xl border border-slate-200 px-4 py-3" 
                  value={restForm.timings}
                  onChange={(e) => setRestForm({ ...restForm, timings: e.target.value })}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Landmark className="h-4 w-4" />
                <span>Rake Payout Bank Details</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Bank Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Merchant Alliance Bank"
                    className="w-full rounded-xl border border-slate-200 px-3 py-3" 
                    value={restForm.bankName}
                    onChange={(e) => setRestForm({ ...restForm, bankName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Account Number</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="8920194821039"
                    className="w-full rounded-xl border border-slate-200 px-3 py-3" 
                    value={restForm.accountNumber}
                    onChange={(e) => setRestForm({ ...restForm, accountNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">IFSC Bank Code</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="MABN001092"
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 uppercase" 
                    value={restForm.ifscCode}
                    onChange={(e) => setRestForm({ ...restForm, ifscCode: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 cursor-pointer"
              >
                Save Details & Bank Settings
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
