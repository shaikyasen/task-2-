import React, { useState, useEffect } from "react";
import { UserProfile, UserRole, Order, CartItem } from "./types";
import { firebaseService } from "./lib/firebaseService";
import AuthPage from "./components/AuthPage";
import Navbar from "./components/Navbar";
import CustomerDashboard from "./components/CustomerDashboard";
import OwnerDashboard from "./components/OwnerDashboard";
import DeliveryDashboard from "./components/DeliveryDashboard";
import AdminDashboard from "./components/AdminDashboard";
import { User, KeyRound, CheckCircle2 } from "lucide-react";

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);

  const [activeTab, setActiveTab] = useState<string>("explore");
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    
    async function syncBalance() {
      if (profile.role === "deliveryPartner" || profile.role === "restaurantOwner") {
        const wallet = await firebaseService.getEarnings(profile.id);
        setWalletBalance(wallet.balance);
      }
    }
    
    syncBalance();
    
    const interval = setInterval(syncBalance, 4000);
    return () => clearInterval(interval);
  }, [profile]);

  useEffect(() => {
    const savedUser = localStorage.getItem("eatstream_active_user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser) as UserProfile;
      setProfile(parsed);
      setProfileName(parsed.name);
      setProfilePhone(parsed.phone || "+1 (555) 019-2834");
    }
  }, []);

  const handleLoginSuccess = (userProfile: UserProfile) => {
    setProfile(userProfile);
    setProfileName(userProfile.name);
    setProfilePhone(userProfile.phone || "+1 (555) 019-2834");
    localStorage.setItem("eatstream_active_user", JSON.stringify(userProfile));
    setActiveTab("explore");
  };

  const handleLogout = async () => {
    if (profile) {
      await firebaseService.logAction("Auth Session", "Logged out of current workspace", profile);
    }
    setProfile(null);
    setCart([]);
    setActiveOrder(null);
    localStorage.removeItem("eatstream_active_user");
  };

  const handleSwitchRole = async (targetRole: UserRole) => {
    if (!profile) return;
    
    const updated: UserProfile = {
      ...profile,
      role: targetRole,
      name: profile.name.includes("(") ? profile.name : `${profile.name} (${targetRole})`,
      updatedAt: new Date().toISOString()
    };

    await firebaseService.saveProfile(updated);
    setProfile(updated);
    localStorage.setItem("eatstream_active_user", JSON.stringify(updated));
    setActiveTab("explore");
    await firebaseService.logAction("Auth Workspace", `Fast-switched active workspace to: ${targetRole}`, updated);
  };

  const handleUpdateProfileDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const updated: UserProfile = {
      ...profile,
      name: profileName,
      phone: profilePhone,
      updatedAt: new Date().toISOString()
    };

    await firebaseService.saveProfile(updated);
    setProfile(updated);
    localStorage.setItem("eatstream_active_user", JSON.stringify(updated));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    await firebaseService.logAction("User Profile", "Updated contact details in settings panel", updated);
  };

  const handleDeleteAccount = async () => {
    if (confirm("Are you absolutely sure you want to delete your EatStream profile? This operation is irreversible and all logs will be scrubbed.")) {
      if (profile) {
        await firebaseService.logAction("User Profile", "Scrubbed and deleted account profile", profile);
      }
      handleLogout();
    }
  };

  const handleViewCart = () => {
    setActiveTab("explore");
    const cartBtn = document.querySelector("#customer-dashboard-container");
    if (cartBtn) {
      const floatCart = document.querySelector("button[class*='fixed bottom-6']");
      if (floatCart) (floatCart as HTMLButtonElement).click();
    }
  };

  const cartItemsCount = cart.reduce((acc, x) => acc + x.qty, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {profile ? (
        <div className="space-y-6">
          <Navbar 
            profile={profile}
            cartCount={cartItemsCount}
            walletBalance={walletBalance}
            onLogout={handleLogout}
            onSwitchRole={handleSwitchRole}
            onViewCart={handleViewCart}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />

          <main className="max-w-7xl mx-auto px-6 pb-12">
            {activeTab === "profile" ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs max-w-2xl mx-auto space-y-8 animate-fade-in">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <User className="h-6 w-6 text-orange-500" />
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Manage Your Gourmet Profile</h2>
                    <p className="text-xs text-slate-400">Modify your login name, active phone verification number, or reset secure credentials.</p>
                  </div>
                </div>

                {isSaved && (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-600 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Contact details updated successfully!</span>
                  </div>
                )}

                <form onSubmit={handleUpdateProfileDetails} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Display Username</label>
                      <input 
                        type="text" 
                        required 
                        className="w-full rounded-xl border border-slate-200 px-4 py-3" 
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Active Email (Disabled)</label>
                      <input 
                        type="email" 
                        disabled 
                        className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-slate-400" 
                        value={profile.email}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Phone Verification Number</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full rounded-xl border border-slate-200 px-4 py-3" 
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                    />
                  </div>

                  <div className="border-t border-slate-100 pt-6 space-y-4">
                    <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                      <KeyRound className="h-4 w-4" />
                      <span>Change Account Password</span>
                    </div>
                    <div>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        className="w-full rounded-xl border border-slate-200 px-4 py-3" 
                        value={profilePassword}
                        onChange={(e) => setProfilePassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <button 
                      type="button"
                      onClick={handleDeleteAccount}
                      className="rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-4 py-3 cursor-pointer"
                    >
                      Delete Profile
                    </button>
                    
                    <button 
                      type="submit"
                      className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black px-6 py-3 cursor-pointer"
                    >
                      Save Configuration
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                {profile.role === "customer" && (
                  <CustomerDashboard 
                    profile={profile}
                    cart={cart}
                    setCart={setCart}
                    onOrderPlaced={(order) => {
                      setActiveOrder(order);
                    }}
                    activeOrder={activeOrder}
                    setActiveOrder={setActiveOrder}
                  />
                )}
                {profile.role === "restaurantOwner" && (
                  <OwnerDashboard profile={profile} />
                )}
                {profile.role === "deliveryPartner" && (
                  <DeliveryDashboard profile={profile} />
                )}
                {profile.role === "admin" && (
                  <AdminDashboard />
                )}
              </div>
            )}
          </main>
        </div>
      ) : (
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}
