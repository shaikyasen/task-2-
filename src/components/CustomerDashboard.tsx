import React, { useState, useEffect } from "react";
import { UserProfile, Restaurant, FoodItem, Order, CartItem, Coupon, Review, ChatMessage } from "../types";
import { firebaseService } from "../lib/firebaseService";
import GoogleMapComponent from "./GoogleMapComponent";
import { 
  Search, Star, Clock, MapPin, Plus, Minus, 
  Trash2, CreditCard, ChevronRight, MessageSquare, Sparkles, 
  FileText, ArrowLeft, Heart, Check, SendHorizontal, ShoppingBag
} from "lucide-react";

interface CustomerDashboardProps {
  profile: UserProfile;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onOrderPlaced: (order: Order) => void;
  activeOrder: Order | null;
  setActiveOrder: (order: Order | null) => void;
}

export default function CustomerDashboard({
  profile,
  cart,
  setCart,
  onOrderPlaced,
  activeOrder,
  setActiveOrder
}: CustomerDashboardProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filterVegOnly, setFilterVegOnly] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<Order["paymentMethod"]>("Card");
  const [ratingVal, setRatingVal] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isReviewed, setIsReviewed] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [chatText, setChatText] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedAddressIdx, setSelectedAddressIdx] = useState(0);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const addresses = [
    { label: "Home", address: "Apt 4B, Silver Heights, Residency Road, Bangalore", coords: { lat: 12.9784, lng: 77.5912 } },
    { label: "Office", address: "Block C, 9th Floor, Tech Park SEZ, Whitefield, Bangalore", coords: { lat: 12.9698, lng: 77.7499 } }
  ];

  useEffect(() => {
    async function loadData() {
      const restList = await firebaseService.getRestaurants();
      const foodList = await firebaseService.getFoods();
      setRestaurants(restList);
      setFoods(foodList);
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!activeOrder) return;
    const unsub = firebaseService.getChatMessages(activeOrder.id, (msgs) => {
      setChatMessages(msgs);
    });
    return () => {
      if (unsub) unsub();
    };
  }, [activeOrder]);

  const toggleWishlist = (restId: string) => {
    if (wishlist.includes(restId)) {
      setWishlist(wishlist.filter(id => id !== restId));
    } else {
      setWishlist([...wishlist, restId]);
    }
  };

  const handleAddToCart = (food: FoodItem, restaurant: Restaurant) => {
    if (cart.length > 0 && cart[0].restaurantId !== restaurant.id) {
      if (confirm("Your cart contains dishes from another restaurant. Would you like to empty it and start a new order with this restaurant?")) {
        setCart([{
          foodId: food.id,
          name: food.name,
          price: food.price,
          qty: 1,
          isVeg: food.isVeg,
          image: food.image,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name
        }]);
      }
      return;
    }

    const idx = cart.findIndex(item => item.foodId === food.id);
    if (idx !== -1) {
      const updated = [...cart];
      updated[idx].qty += 1;
      setCart(updated);
    } else {
      setCart([...cart, {
        foodId: food.id,
        name: food.name,
        price: food.price,
        qty: 1,
        isVeg: food.isVeg,
        image: food.image,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name
      }]);
    }
  };

  const updateCartQty = (foodId: string, delta: number) => {
    const updated = cart.map(item => {
      if (item.foodId === foodId) {
        return { ...item, qty: Math.max(1, item.qty + delta) };
      }
      return item;
    });
    setCart(updated);
  };

  const removeFromCart = (foodId: string) => {
    setCart(cart.filter(item => item.foodId !== foodId));
  };

  const applyPromo = () => {
    const coupons = firebaseService.getLocal<Coupon>("coupons");
    const found = coupons.find(c => c.code.toUpperCase() === couponCode.trim().toUpperCase());
    if (found && found.isAvailable) {
      const subtotal = cart.reduce((acc, x) => acc + (x.qty * x.price), 0);
      if (subtotal >= found.minOrder) {
        setAppliedCoupon(found);
      } else {
        alert(`This promo code requires a minimum order of $${found.minOrder}`);
      }
    } else {
      alert("Invalid coupon code. Try 'EATNEW50' or 'SUPERDEAL30'.");
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const subtotal = cart.reduce((acc, x) => acc + (x.qty * x.price), 0);
    const rest = restaurants.find(r => r.id === cart[0].restaurantId)!;
    const deliveryFee = subtotal > 30 ? 0 : 3.99;
    const tax = parseFloat((subtotal * 0.05).toFixed(2));
    
    let discount = 0;
    if (appliedCoupon) {
      discount = appliedCoupon.type === "flat" 
        ? appliedCoupon.discount 
        : parseFloat((subtotal * (appliedCoupon.discount / 100)).toFixed(2));
    }

    const total = Math.max(0, subtotal + deliveryFee + tax - discount);
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;

    const newOrder: Order = {
      id: orderId,
      customerId: profile.id,
      customerName: profile.name,
      customerPhone: profile.phone || "+1 (555) 019-2834",
      customerAddress: addresses[selectedAddressIdx].address,
      customerCoords: addresses[selectedAddressIdx].coords,
      restaurantId: rest.id,
      restaurantName: rest.name,
      restaurantAddress: rest.address,
      restaurantCoords: rest.coords,
      restaurantOwnerId: rest.ownerId,
      items: cart.map(c => ({
        foodId: c.foodId,
        name: c.name,
        price: c.price,
        qty: c.qty,
        isVeg: c.isVeg
      })),
      subtotal,
      deliveryFee,
      tax,
      discount,
      total,
      status: "placed",
      paymentMethod,
      paymentStatus: paymentMethod === "Cash on Delivery" ? "pending" : "paid",
      otp: Math.floor(1000 + Math.random() * 9000).toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await firebaseService.createOrder(newOrder);
    onOrderPlaced(newOrder);
    setCart([]);
    setAppliedCoupon(null);
    setCouponCode("");
    setShowCart(false);
  };

  const handleSendChat = async () => {
    if (!chatText.trim() || !activeOrder) return;
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      orderId: activeOrder.id,
      senderId: profile.id,
      senderName: profile.name,
      text: chatText,
      timestamp: new Date().toISOString(),
      isSeen: false
    };

    await firebaseService.sendChatMessage(message);
    setChatText("");
  };

  const handleRatingSubmit = async () => {
    if (!activeOrder) return;
    const review: Review = {
      id: `rev-${Date.now()}`,
      orderId: activeOrder.id,
      customerId: profile.id,
      customerName: profile.name,
      restaurantId: activeOrder.restaurantId,
      rating: ratingVal,
      comment: reviewComment,
      createdAt: new Date().toISOString()
    };

    await firebaseService.saveReview(review);
    setIsReviewed(true);
    setTimeout(() => {
      setActiveOrder(null);
      setIsReviewed(false);
      setReviewComment("");
    }, 1500);
  };

  const cartSubtotal = cart.reduce((acc, x) => acc + (x.qty * x.price), 0);

  const filteredRestaurants = restaurants.filter(rest => {
    const matchesSearch = rest.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          rest.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rest.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || rest.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["All", "North Indian", "Italian", "Chinese", "Fast Food"];

  return (
    <div id="customer-dashboard-container" className="space-y-8">
      {activeOrder && (
        <div className="rounded-3xl bg-slate-900 p-6 text-white border border-slate-800 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-full bg-orange-500/10 text-orange-400 px-3 py-1 text-xs font-bold border border-orange-500/20">Live Order Tracking</span>
                <span className="text-slate-400 text-xs">ID: {activeOrder.id}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-100 font-display">Cooking & Delivery at {activeOrder.restaurantName}</h2>
              <p className="text-xs text-slate-400 mt-1">Status: <strong className="text-orange-400 uppercase tracking-widest">{activeOrder.status}</strong></p>
            </div>
            
            <div className="flex items-center gap-2">
              <a 
                href={`/api/invoice/${activeOrder.id}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 text-xs font-bold shadow-md cursor-pointer transition-all"
              >
                <FileText className="h-4 w-4" />
                <span>Invoice PDF Receipt</span>
              </a>
              <button 
                onClick={() => setActiveOrder(null)} 
                className="rounded-xl border border-slate-700 bg-slate-900 text-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Back To Marketplace
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="w-full h-[350px] rounded-2xl overflow-hidden shadow-xs">
                <GoogleMapComponent 
                  mode="tracking"
                  restaurantCoords={activeOrder.restaurantCoords}
                  customerCoords={activeOrder.customerCoords}
                  restaurantName={activeOrder.restaurantName}
                  customerName={profile.name}
                  status={activeOrder.status}
                />
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Milestones & Timeline</h4>
                <div className="flex justify-between relative">
                  <div className="absolute top-4 left-4 right-4 h-1 bg-slate-800 -z-0"></div>
                  
                  {[
                    { label: "Placed", check: ["placed", "accepted", "cooking", "readyForPickup", "pickedUp", "delivered"] },
                    { label: "Kitchen Cook", check: ["accepted", "cooking", "readyForPickup", "pickedUp", "delivered"] },
                    { label: "With Rider", check: ["pickedUp", "delivered"] },
                    { label: "Delivered", check: ["delivered"] }
                  ].map((stage, i) => {
                    const isActive = stage.check.includes(activeOrder.status);
                    return (
                      <div key={i} className="flex flex-col items-center gap-2 z-10 text-center">
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center border font-bold text-xs ${
                          isActive 
                            ? "bg-orange-500 border-orange-400 text-white" 
                            : "bg-slate-900 border-slate-800 text-slate-600"
                        }`}>
                          {isActive ? <Check className="h-4 w-4" /> : i+1}
                        </div>
                        <span className={`text-[10px] font-bold ${isActive ? "text-orange-400" : "text-slate-500"}`}>{stage.label}</span>
                      </div>
                    );
                  })}
                </div>

                {activeOrder.otp && (activeOrder.status === "pickedUp" || activeOrder.status === "readyForPickup") && (
                  <div className="mt-6 rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 flex justify-between items-center">
                    <div>
                      <div className="text-xs text-orange-400 font-bold uppercase tracking-wider">Secret Delivery OTP Verification</div>
                      <p className="text-slate-300 text-xs mt-1">Provide this code to your rider at the door to confirm receipt.</p>
                    </div>
                    <div className="bg-slate-900 rounded-lg px-4 py-2 border border-slate-800 text-sm font-black text-orange-400 tracking-wider">
                      {activeOrder.otp}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-5 h-[440px]">
              <div>
                <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-orange-400" />
                    <span className="text-xs font-bold uppercase tracking-wider">Order Dispatch Support Messenger</span>
                  </div>
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </div>

                <div className="space-y-3 h-[280px] overflow-y-auto pr-2">
                  <div className="rounded-xl bg-slate-900/80 p-3 text-xs leading-normal max-w-[80%] border border-slate-800">
                    <span className="font-bold text-orange-400 block mb-1">EatStream Auto-Bot</span>
                    Hi Alex! Delivery rider Sam has been successfully assigned to your order. You can converse here directly in real-time.
                  </div>
                  {chatMessages.map(msg => (
                    <div 
                      key={msg.id} 
                      className={`rounded-xl p-3 text-xs leading-normal max-w-[80%] border ${
                        msg.senderId === profile.id 
                          ? "bg-orange-500 text-white ml-auto border-orange-400" 
                          : "bg-slate-900 border-slate-800"
                      }`}
                    >
                      <span className="font-bold block mb-1 text-[10px] opacity-80">{msg.senderName}</span>
                      {msg.text}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 border-t border-slate-800 pt-3">
                <input
                  type="text"
                  placeholder="Tell delivery driver details, directions..."
                  className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-4 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500"
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                />
                <button 
                  onClick={handleSendChat}
                  className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white p-3 cursor-pointer"
                >
                  <SendHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {activeOrder.status === "delivered" && !isReviewed && (
            <div className="mt-8 rounded-2xl bg-orange-500/10 border border-orange-500/30 p-6">
              <h3 className="text-lg font-bold text-orange-400 flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5" />
                <span>Rate Your Gourmet Culinary Feast!</span>
              </h3>
              <p className="text-slate-300 text-xs mb-4">Your honest feedback helps the chef and delivery rider deliver exceptional service.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Select Star Score</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star} 
                        onClick={() => setRatingVal(star)}
                        className="p-1 focus:outline-hidden"
                      >
                        <Star className={`h-8 w-8 ${ratingVal >= star ? "fill-orange-400 text-orange-400" : "text-slate-700"}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Comment / Review text</label>
                  <textarea 
                    rows={2}
                    placeholder="Tell us what you liked about the food or packaging..."
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 p-3 text-xs text-white focus:outline-hidden focus:border-orange-500"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button 
                  onClick={handleRatingSubmit}
                  className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 text-xs font-bold shadow-md cursor-pointer"
                >
                  Submit Gourmet Review
                </button>
              </div>
            </div>
          )}
          {isReviewed && (
            <div className="mt-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center text-emerald-400 font-bold text-xs">
              Review submitted successfully! Returning to marketplace...
            </div>
          )}
        </div>
      )}

      {!selectedRestaurant && !activeOrder && (
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-orange-600 to-amber-500 text-white p-8 md:p-12 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-4 max-w-lg">
            <div className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-4 w-4" />
              <span>Gourmet Treats Week</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-none font-display">Craving culinary perfection? Get 50% Off!</h2>
            <p className="text-orange-50 text-xs md:text-sm">Enjoy premium restaurant delicacies delivered to your doorstep in minutes. Use coupon codes below to claim exclusive discounts!</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="rounded-lg bg-slate-950/40 border border-white/25 px-3 py-1.5 text-[10px] font-mono font-bold tracking-wider">CODE: EATNEW50</span>
              <span className="rounded-lg bg-slate-950/40 border border-white/25 px-3 py-1.5 text-[10px] font-mono font-bold tracking-wider">CODE: SUPERDEAL30</span>
            </div>
          </div>
          <img 
            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=60" 
            alt="Food Banner" 
            className="w-48 h-48 rounded-2xl object-cover shadow-lg rotate-3"
          />
        </div>
      )}

      {!selectedRestaurant && !activeOrder && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search restaurants, foods, or cuisines..."
                className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-sm focus:border-orange-500 focus:outline-hidden"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                <button
                  onClick={() => setViewMode("list")}
                  className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "list"
                      ? "bg-orange-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  List View
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "map"
                      ? "bg-orange-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Map View
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                      selectedCategory === cat 
                        ? "bg-orange-500 text-white shadow-xs" 
                        : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 font-display">
              <span>Popular Restaurants Near You</span>
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold">Bangalore Metro</span>
            </h3>

            {viewMode === "map" ? (
              <div className="w-full h-[550px] rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                <GoogleMapComponent
                  mode="marketplace"
                  restaurants={filteredRestaurants}
                  onSelectRestaurant={(rest) => {
                    setSelectedRestaurant(rest);
                  }}
                  customerCoords={addresses[selectedAddressIdx].coords}
                />
              </div>
            ) : filteredRestaurants.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No restaurants found matching your keywords.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRestaurants.map((rest) => (
                  <div 
                    key={rest.id}
                    className="group rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="relative h-44 w-full overflow-hidden">
                      <img 
                        src={rest.image} 
                        alt={rest.name} 
                        className="h-full w-full object-cover group-hover:scale-105 transition-all duration-300"
                      />
                      {rest.featured && (
                        <span className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg">FEATURED</span>
                      )}
                      <button 
                        onClick={() => toggleWishlist(rest.id)}
                        className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-slate-600 hover:text-rose-500 cursor-pointer"
                      >
                        <Heart className={`h-4 w-4 ${wishlist.includes(rest.id) ? "fill-rose-500 text-rose-500" : ""}`} />
                      </button>
                      {rest.offers && (
                        <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-orange-500/30">
                          {rest.offers}
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-900 text-base leading-snug group-hover:text-orange-500 transition-colors font-display">{rest.name}</h4>
                        <div className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-100 shrink-0">
                          <Star className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600" />
                          <span>{rest.rating}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{rest.description}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold pt-1 border-t border-slate-50">
                        <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> <span>{rest.timings}</span></div>
                        <span>•</span>
                        <div>{rest.category}</div>
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <button 
                        onClick={() => setSelectedRestaurant(rest)}
                        className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-700 py-2 text-xs font-bold hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <span>Explore Menu</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedRestaurant && !activeOrder && (
        <div className="space-y-6">
          <button 
            onClick={() => setSelectedRestaurant(null)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-orange-500 transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Restaurants</span>
          </button>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <img 
              src={selectedRestaurant.image} 
              alt={selectedRestaurant.name} 
              className="md:col-span-4 w-full h-44 rounded-2xl object-cover shadow-sm"
            />
            <div className="md:col-span-8 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-0.5">{selectedRestaurant.category}</span>
                <div className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-100">
                  <Star className="h-3 w-3 fill-emerald-600 text-emerald-600" />
                  <span>{selectedRestaurant.rating} ({selectedRestaurant.ratingCount} reviews)</span>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 leading-none font-display">{selectedRestaurant.name}</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xl">{selectedRestaurant.description}</p>
              
              <div className="flex items-center gap-4 text-xs text-slate-400 font-semibold pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1"><MapPin className="h-4 w-4 text-slate-400" /> <span>{selectedRestaurant.address}</span></div>
                <div className="flex items-center gap-1"><Clock className="h-4 w-4 text-slate-400" /> <span>{selectedRestaurant.timings}</span></div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex justify-between items-center font-display">
              <span>Gourmet Dishes</span>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-500">Vegetarian Only</label>
                <input 
                  type="checkbox" 
                  checked={filterVegOnly}
                  onChange={(e) => setFilterVegOnly(e.target.checked)}
                  className="rounded text-orange-500 focus:ring-orange-500"
                />
              </div>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {foods
                .filter(f => f.restaurantId === selectedRestaurant.id && (!filterVegOnly || f.isVeg))
                .map((food) => (
                  <div 
                    key={food.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex justify-between gap-4"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {food.isVeg ? (
                          <span className="inline-block h-4 w-4 border-2 border-emerald-600 p-0.5"><span className="block h-full w-full rounded-full bg-emerald-600"></span></span>
                        ) : (
                          <span className="inline-block h-4 w-4 border-2 border-rose-600 p-0.5"><span className="block h-full w-full rounded-full bg-rose-600"></span></span>
                        )}
                        <span className="text-xs text-slate-400 font-bold uppercase">{food.category}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">{food.name}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{food.description}</p>
                      <div className="text-sm font-bold text-slate-900">${food.price.toFixed(2)}</div>
                    </div>

                    <div className="relative w-28 h-28 shrink-0 flex flex-col items-center">
                      <img 
                        src={food.image} 
                        alt={food.name} 
                        className="w-full h-full rounded-xl object-cover shadow-xs"
                      />
                      <button 
                        onClick={() => handleAddToCart(food, selectedRestaurant)}
                        className="absolute -bottom-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-[11px] uppercase tracking-wider px-4 py-1.5 rounded-lg shadow-md cursor-pointer transition-all hover:scale-105"
                      >
                        ADD TO CART
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                <h3 className="text-base font-bold text-slate-900 font-display">Gourmet Shopping Cart</h3>
                <button 
                  onClick={() => setShowCart(false)}
                  className="rounded-lg text-slate-400 hover:bg-slate-50 p-1 font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  Your cart is empty. Pick dishes to fill it!
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-xs text-slate-400">Ordering from: <strong className="text-slate-800">{cart[0].restaurantName}</strong></div>
                  
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {cart.map(item => (
                      <div key={item.foodId} className="flex justify-between items-center border-b border-slate-50 pb-2">
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="text-xs font-bold text-slate-800 truncate">{item.name}</div>
                          <div className="text-[10px] text-slate-400">${item.price.toFixed(2)} each</div>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          <button 
                            onClick={() => updateCartQty(item.foodId, -1)}
                            className="rounded-md border border-slate-200 bg-slate-50 p-1 hover:bg-slate-100"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                          <button 
                            onClick={() => updateCartQty(item.foodId, 1)}
                            className="rounded-md border border-slate-200 bg-slate-50 p-1 hover:bg-slate-100"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          
                          <button 
                            onClick={() => removeFromCart(item.foodId)}
                            className="text-slate-400 hover:text-rose-500 pl-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-slate-100 p-3 bg-slate-50 space-y-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Choose Destination Address</div>
                    <div className="flex gap-2">
                      {addresses.map((addr, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedAddressIdx(i)}
                          className={`flex-1 text-left rounded-lg p-2 border text-xs transition-all cursor-pointer ${
                            selectedAddressIdx === i 
                              ? "bg-orange-550 border-orange-500/30 text-orange-900 bg-orange-50" 
                              : "bg-white border-slate-200 text-slate-600"
                          }`}
                        >
                          <div className="font-bold mb-0.5">{addr.label}</div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">{addr.address}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Apply Promo Discount</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="EATNEW50, SUPERDEAL30..."
                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs uppercase"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                      />
                      <button
                        onClick={applyPromo}
                        className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                    {appliedCoupon && (
                      <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 rounded-lg p-1.5 border border-emerald-100">
                        <Check className="h-3.5 w-3.5" />
                        <span>Promo Code Applied: {appliedCoupon.code} (-${appliedCoupon.discount} discount)</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gourmet Payment Method</label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                      {["Card", "UPI", "Wallet", "Cash on Delivery"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setPaymentMethod(opt as any)}
                          className={`rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer ${
                            paymentMethod === opt 
                              ? "bg-orange-500 text-white shadow-xs" 
                              : "text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span>${cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Delivery Fee</span>
                    <span>{cartSubtotal > 30 ? "FREE" : "$3.99"}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Taxes (5%)</span>
                    <span>${(cartSubtotal * 0.05).toFixed(2)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Promo Discount</span>
                      <span>-${appliedCoupon.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-900 font-bold text-sm pt-2 border-t border-slate-100">
                    <span>Grand Total</span>
                    <span>
                      ${Math.max(0, cartSubtotal + (cartSubtotal > 30 ? 0 : 3.99) + (cartSubtotal * 0.05) - (appliedCoupon ? appliedCoupon.discount : 0)).toFixed(2)}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={handleCheckout}
                  className="w-full flex justify-center items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white py-3 text-xs font-bold shadow-lg cursor-pointer transition-all"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>PAY & PLACE ORDER</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {cart.length > 0 && !showCart && (
        <button 
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-4 shadow-xl cursor-pointer hover:scale-105 transition-all font-bold border border-orange-400"
        >
          <ShoppingBag className="h-5 w-5" />
          <span>View Gourmet Order ({cart.length})</span>
        </button>
      )}
    </div>
  );
}
