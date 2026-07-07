import React, { useState, useEffect } from "react";
import { UserProfile, Order, WalletEarnings } from "../types";
import { firebaseService } from "../lib/firebaseService";
import GoogleMapComponent from "./GoogleMapComponent";
import { 
  Truck, Clock, MapPin, Power, Check, Navigation, UserCheck 
} from "lucide-react";

interface DeliveryDashboardProps {
  profile: UserProfile;
}

export default function DeliveryDashboard({ profile }: DeliveryDashboardProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [wallet, setWallet] = useState<WalletEarnings | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [step, setStep] = useState<"navigate_to_rest" | "navigate_to_cust" | "verify">("navigate_to_rest");

  useEffect(() => {
    async function loadDriverData() {
      const allOrders = await firebaseService.getOrders(profile.id, "deliveryPartner");
      const pendingRiderOrders = allOrders.filter(
        o => o.status !== "delivered" && o.status !== "cancelled"
      );
      setAssignedOrders(pendingRiderOrders);
      
      const balanceObj = await firebaseService.getEarnings(profile.id);
      setWallet(balanceObj);

      const currentActive = pendingRiderOrders.find(
        o => o.status === "cooking" || o.status === "readyForPickup" || o.status === "pickedUp"
      );
      if (currentActive) {
        setActiveOrder(currentActive);
        if (currentActive.status === "pickedUp") {
          setStep("navigate_to_cust");
        } else {
          setStep("navigate_to_rest");
        }
      }
    }
    loadDriverData();
  }, [profile.id]);

  useEffect(() => {
    if (activeOrder || !isOnline) return;

    const timer = setInterval(async () => {
      const allOrders = firebaseService.getLocal<Order>("orders");
      const unassigned = allOrders.filter(o => o.status === "accepted" && !o.deliveryPartnerId);
      if (unassigned.length > 0) {
        const target = unassigned[0];
        setAssignedOrders([target]);
      }
    }, 8000);

    return () => clearInterval(timer);
  }, [activeOrder, isOnline]);

  const handleAcceptTrip = async (order: Order) => {
    const driverDetails = {
      id: profile.id,
      name: profile.name,
      phone: profile.phone || "+1 (555) 392-1204",
      coords: order.restaurantCoords
    };

    await firebaseService.updateOrderStatus(order.id, "cooking", driverDetails);
    
    const updatedOrder = { 
      ...order, 
      status: "cooking" as const,
      deliveryPartnerId: profile.id,
      deliveryPartnerName: profile.name,
      deliveryPartnerPhone: driverDetails.phone,
      deliveryPartnerCoords: driverDetails.coords
    };
    
    setActiveOrder(updatedOrder);
    setAssignedOrders([]);
    setStep("navigate_to_rest");
  };

  const handleArrivedAtRestaurant = async () => {
    if (!activeOrder) return;
    await firebaseService.updateOrderStatus(activeOrder.id, "pickedUp");
    setActiveOrder({ ...activeOrder, status: "pickedUp" });
    setStep("navigate_to_cust");
    await firebaseService.logAction("Delivery Transit", `Collected package at ${activeOrder.restaurantName}`, profile);
  };

  const handleCompleteDelivery = async () => {
    if (!activeOrder) return;
    setOtpError("");

    if (otpInput.trim() !== activeOrder.otp) {
      setOtpError("Incorrect delivery verification code. Please check with customer.");
      return;
    }

    await firebaseService.updateOrderStatus(activeOrder.id, "delivered");
    
    const tripPayout = 5.50;
    await firebaseService.addTransaction(profile.id, tripPayout, "credit", `Trip fare for order ${activeOrder.id}`, activeOrder.id);
    
    const updatedWallet = await firebaseService.getEarnings(profile.id);
    setWallet(updatedWallet);

    setActiveOrder(null);
    setOtpInput("");
    alert("Gourmet delivery confirmed and verified successfully! Earnings credited to wallet.");
    await firebaseService.logAction("Delivery Completed", `Order ${activeOrder.id} successfully delivered`, profile);
  };

  return (
    <div id="delivery-dashboard-container" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex justify-between items-center animate-fade-in">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rider Duty Status</span>
            <h3 className="text-base font-bold text-slate-900 font-display">
              {isOnline ? (
                <span className="text-emerald-600 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Online & Active</span>
                </span>
              ) : (
                <span className="text-slate-400">Offline (On Break)</span>
              )}
            </h3>
          </div>
          
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`rounded-full p-2.5 transition-all cursor-pointer ${
              isOnline 
                ? "bg-emerald-500 text-white shadow-sm hover:bg-emerald-600" 
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            <Power className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-2xl bg-slate-900 text-white p-6 border border-slate-800 shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Rider Wallet Balance</div>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-md px-2 py-0.5 text-[10px] font-bold">Fast Cashout</span>
          </div>
          <div className="text-3xl font-bold text-slate-100 flex items-baseline gap-1 font-display">
            <span>${wallet ? wallet.balance.toFixed(2) : "0.00"}</span>
            <span className="text-[10px] text-slate-400 font-medium">net balance</span>
          </div>

          <div className="border-t border-slate-800/85 pt-4 flex justify-between text-xs text-slate-400">
            <div>
              <span className="block font-medium">Total Earned</span>
              <span className="font-bold text-slate-200">${wallet ? wallet.totalEarned.toFixed(2) : "0.00"}</span>
            </div>
            <div>
              <span className="block font-medium">Completed Trips</span>
              <span className="font-bold text-slate-200">{wallet ? wallet.transactions.length : 0} rides</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest font-display">Recent Earnings logs</h4>
          {wallet && wallet.transactions.length === 0 ? (
            <p className="text-slate-400 text-xs text-center py-6">No recent trip logs. Accept an order to earn!</p>
          ) : (
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2">
              {wallet?.transactions.map(tx => (
                <div key={tx.id} className="flex justify-between items-center border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                  <div>
                    <div className="text-xs font-bold text-slate-800">{tx.description}</div>
                    <div className="text-[10px] text-slate-400">{new Date(tx.date).toLocaleDateString()}</div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">+${tx.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-8 space-y-6">
        {!activeOrder && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-display">
              <Truck className="h-5 w-5 text-slate-400" />
              <span>Available Delivery Trips near Bangalore</span>
            </h3>

            {!isOnline ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 py-16 text-center text-slate-400 text-xs">
                You are currently offline. Toggle Online to start receiving gourmet trip dispatches.
              </div>
            ) : assignedOrders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center animate-pulse"><Clock className="h-5 w-5 text-slate-400" /></div>
                <div>
                  <div className="font-bold text-slate-600 mb-0.5">Scanning dispatch requests feed...</div>
                  <p className="text-[10px]">A active order will automatically appear here as soon as a customer orders.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {assignedOrders.map(order => (
                  <div key={order.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-8 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-orange-50 text-orange-600 border border-orange-100 text-[10px] font-black uppercase px-2.5 py-0.5 tracking-wider rounded-md">New Trip Request</span>
                        <span className="text-xs text-slate-400">Order #{order.id}</span>
                      </div>
                      <h4 className="text-lg font-bold text-slate-950 font-display">Gourmet Dispatch: {order.restaurantName}</h4>
                      <div className="space-y-1.5 text-xs text-slate-500 font-semibold">
                        <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-orange-500" /> <span>Pickup: {order.restaurantAddress}</span></div>
                        <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-blue-500" /> <span>Delivery: {order.customerAddress}</span></div>
                      </div>
                    </div>
                    <div className="md:col-span-4 flex flex-col gap-3 justify-end items-stretch md:items-end">
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Estimated Trip Payout</span>
                        <span className="text-2xl font-bold text-emerald-600 font-display">$5.50</span>
                      </div>
                      <button
                        onClick={() => handleAcceptTrip(order)}
                        className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 text-white py-3 text-xs font-bold shadow-md cursor-pointer transition-all hover:scale-[1.02]"
                      >
                        Accept & Start Ride
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeOrder && (
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">Active Trip Navigation</span>
                  <span className="text-xs text-slate-400">Order: {activeOrder.id}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-100 font-display">{activeOrder.restaurantName}</h3>
                <p className="text-xs text-slate-400">Delivery Fare: <strong className="text-emerald-400">$5.50 cash credit</strong> • Status: <strong className="text-orange-400 capitalize">{activeOrder.status}</strong></p>
              </div>

              <div className="rounded-xl bg-slate-950 border border-slate-800 px-4 py-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-400 animate-spin" />
                <span className="text-xs font-bold text-slate-300">
                  {step === "navigate_to_rest" ? "Navigating to Kitchen" : step === "navigate_to_cust" ? "Navigating to Customer" : "Verifying PIN code"}
                </span>
              </div>
            </div>

            <div className="w-full h-[320px] rounded-2xl overflow-hidden shadow-xs">
              <GoogleMapComponent 
                mode="tracking"
                restaurantCoords={activeOrder.restaurantCoords}
                customerCoords={activeOrder.customerCoords}
                restaurantName={activeOrder.restaurantName}
                customerName={activeOrder.customerName}
                status={activeOrder.status}
              />
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-display">Active Delivery Tasks checklist</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    activeOrder.status !== "placed" 
                      ? "bg-orange-500 text-white" 
                      : "bg-slate-800 text-slate-400"
                  }`}>
                    {activeOrder.status !== "placed" ? <Check className="h-4 w-4" /> : "1"}
                  </div>
                  <div>
                    <span className="block text-xs font-bold">Accept dispatch</span>
                    <span className="text-[10px] text-slate-400">Trip confirmed</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    activeOrder.status === "pickedUp" || activeOrder.status === "delivered"
                      ? "bg-orange-500 text-white" 
                      : "bg-slate-800 text-slate-400"
                  }`}>
                    {(activeOrder.status === "pickedUp" || activeOrder.status === "delivered") ? <Check className="h-4 w-4" /> : "2"}
                  </div>
                  <div>
                    <span className="block text-xs font-bold">Collect package</span>
                    <span className="text-[10px] text-slate-400">Arrived at kitchen</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    activeOrder.status === "delivered"
                      ? "bg-orange-500 text-white" 
                      : "bg-slate-800 text-slate-400"
                  }`}>
                    {activeOrder.status === "delivered" ? <Check className="h-4 w-4" /> : "3"}
                  </div>
                  <div>
                    <span className="block text-xs font-bold">Verify Door OTP</span>
                    <span className="text-[10px] text-slate-400">Arrived at door</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                {step === "navigate_to_rest" && (
                  <button
                    onClick={handleArrivedAtRestaurant}
                    className="flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 text-xs font-bold shadow-md cursor-pointer"
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>ARRIVED: COLLECTED MEAL BOX</span>
                  </button>
                )}

                {step === "navigate_to_cust" && (
                  <button
                    onClick={() => setStep("verify")}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 text-xs font-bold shadow-md cursor-pointer"
                  >
                    <Navigation className="h-4 w-4" />
                    <span>ARRIVED AT DOORSTEP: ENTER PIN</span>
                  </button>
                )}

                {step === "verify" && (
                  <div className="w-full max-w-sm space-y-3">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Customer Delivery Code (OTP)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter 4-digit code (e.g. customer's code)"
                        className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-4 py-3 text-xs text-white"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                      />
                      <button
                        onClick={handleCompleteDelivery}
                        className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 text-xs font-bold cursor-pointer"
                      >
                        Verify OTP
                      </button>
                    </div>
                    {otpError && <p className="text-xs text-rose-400 font-semibold">{otpError}</p>}
                    <p className="text-[10px] text-slate-500">To assist testing, the correct code for this order is: <strong className="text-slate-300">{activeOrder.otp}</strong></p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
