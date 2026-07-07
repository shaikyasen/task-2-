import React, { useState } from "react";
import { UserProfile, UserRole } from "../types";
import { ShoppingBag, Bell, LogOut, Wallet, User } from "lucide-react";

interface NavbarProps {
  profile: UserProfile;
  cartCount: number;
  walletBalance: number;
  onLogout: () => void;
  onSwitchRole: (role: UserRole) => void;
  onViewCart?: () => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export default function Navbar({
  profile,
  cartCount,
  walletBalance,
  onLogout,
  onSwitchRole,
  onViewCart,
  setActiveTab
}: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifications = [
    { id: "1", text: "Order #ORD-4201 accepted by kitchen!", time: "2m ago" },
    { id: "2", text: "Delivery Partner is approaching restaurant", time: "10m ago" },
    { id: "3", text: "Welcome to EatStream! Gourmet foods await", time: "1h ago" }
  ];

  return (
    <nav id="navbar-container" className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm px-8 py-4 flex h-20 items-center justify-between shrink-0">
      <div className="flex items-center gap-3 cursor-pointer animate-fade-in" onClick={() => setActiveTab?.("explore")}>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white shadow-md transition-transform hover:scale-105">
          <ShoppingBag className="h-5 w-5 stroke-[2.5]" />
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight text-slate-900 font-display">EatStream<span className="text-orange-600">HQ</span></span>
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Management Platform</div>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-semibold text-slate-500">System: Healthy</span>
        </div>

        <div className="h-4 w-px bg-slate-200"></div>

        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 border border-slate-200/60">
          <span className="text-xs font-medium text-slate-400">Workspace:</span>
          <span className="text-xs font-bold text-slate-700 capitalize">{profile.role.replace("Owner", " Owner").replace("Partner", " Partner")}</span>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-orange-50/50 p-1 border border-orange-100">
          <div className="text-[9px] font-bold uppercase tracking-widest text-orange-500 px-2">Fast Switch:</div>
          {(["customer", "restaurantOwner", "deliveryPartner", "admin"] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => onSwitchRole(r)}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all capitalize cursor-pointer ${
                profile.role === r 
                  ? "bg-orange-600 text-white shadow-xs" 
                  : "text-orange-600 hover:bg-orange-50"
              }`}
            >
              {r.replace("Owner", "Owner").replace("Partner", "Partner").replace("restaurant", "").replace("delivery", "")}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {(profile.role === "deliveryPartner" || profile.role === "restaurantOwner") && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-emerald-700 font-bold">
            <Wallet className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-black">${walletBalance.toFixed(2)}</span>
          </div>
        )}

        {profile.role === "customer" && onViewCart && (
          <button 
            onClick={onViewCart}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-orange-600 transition-all cursor-pointer"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-[10px] font-black text-white ring-2 ring-white">
                {cartCount}
              </span>
            )}
          </button>
        )}

        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-orange-600 transition-colors cursor-pointer"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-orange-600 rounded-full border-2 border-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50 animate-fade-in">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-slate-800">Alerts & Statuses</span>
                <span className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Realtime Live</span>
              </div>
              <div className="space-y-3">
                {notifications.map(n => (
                  <div key={n.id} className="flex flex-col gap-1 border-b border-slate-50 pb-2 last:border-b-0 last:pb-0">
                    <div className="text-xs text-slate-700 font-medium leading-normal">{n.text}</div>
                    <div className="text-[9px] text-slate-400 font-semibold">{n.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button 
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-3 pl-4 border-l border-slate-200 transition-all cursor-pointer group"
          >
            <div className="hidden md:block text-right">
              <p className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors">{profile.name}</p>
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider leading-none">{profile.role === "restaurantOwner" ? "Chef Owner" : profile.role === "deliveryPartner" ? "Delivery Partner" : profile.role}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden shrink-0">
              <img 
                src={profile.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60"} 
                alt={profile.name} 
                className="h-full w-full object-cover"
              />
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-3">
                <img 
                  src={profile.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60"} 
                  alt={profile.name} 
                  className="h-10 w-10 rounded-xl object-cover border border-slate-100"
                />
                <div>
                  <div className="text-sm font-bold text-slate-800">{profile.name}</div>
                  <div className="text-xs text-slate-400 truncate">{profile.email}</div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-2">Account Control</div>
                <button 
                  onClick={() => {
                    setActiveTab?.("profile");
                    setShowProfileMenu(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <User className="h-4 w-4 text-slate-400" />
                  <span>Profile details</span>
                </button>
                <button 
                  onClick={() => {
                    onLogout();
                    setShowProfileMenu(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4 text-rose-400" />
                  <span>Logout session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
