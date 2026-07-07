import React, { useState } from "react";
import { UserRole, UserProfile } from "../types";
import { firebaseService } from "../lib/firebaseService";
import { LogIn, User, ShoppingBag, ShieldAlert, Truck, Sparkles, Smartphone } from "lucide-react";

interface AuthPageProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [role, setRole] = useState<UserRole>("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [name, setName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const demoUsers = [
    {
      role: "customer" as UserRole,
      email: "alex@eatstream.io",
      name: "Alex Mercer (Customer)",
      desc: "Order gourmet food, apply promo codes, track driver, & submit ratings."
    },
    {
      role: "restaurantOwner" as UserRole,
      email: "owner@spicyfusion.io",
      name: "Chef Raj (Restaurant Owner)",
      desc: "Manage menus, accept/reject active orders, update cooking, & view analytics graphs."
    },
    {
      role: "deliveryPartner" as UserRole,
      email: "rider@speedy.io",
      name: "Rider Sam (Delivery Partner)",
      desc: "Toggle availability, accept trip requests, navigate GPS map, & check wallet balance."
    },
    {
      role: "admin" as UserRole,
      email: "admin@eatstream.io",
      name: "Devin (Super Admin)",
      desc: "Approve vendors, view global financial stats, audit system logs, & adjust settings."
    }
  ];

  const handleDemoLogin = async (demo: typeof demoUsers[0]) => {
    setLoading(true);
    setError("");
    try {
      let profile = await firebaseService.getProfile(demo.role + "_id");
      if (!profile) {
        profile = {
          id: demo.role + "_id",
          name: demo.name,
          email: demo.email,
          role: demo.role,
          avatar: `https://images.unsplash.com/photo-${demo.role === "customer" ? "1535713875002-d1d0cf377fde" : demo.role === "restaurantOwner" ? "1577219491135-ce391730fb2c" : "1506794778202-cad84cf45f1d"}?w=100&auto=format&fit=crop&q=60`,
          isApproved: true,
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await firebaseService.saveProfile(profile);
      }
      
      onLoginSuccess(profile);
      await firebaseService.logAction("Auth Session", `Logged in using Quick Demo Fast-Pass`, profile);
    } catch (e: any) {
      setError(e.message || "Failed demo login");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const generatedId = `usr-${Date.now().toString().slice(-6)}`;
      const profile: UserProfile = {
        id: generatedId,
        name: name || email.split("@")[0] || "Gourmet User",
        email: email,
        role: role,
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60",
        isApproved: role !== "restaurantOwner" && role !== "deliveryPartner",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await firebaseService.saveProfile(profile);
      await firebaseService.logAction("Auth Session", `Signed up as ${role}`, profile);
      onLoginSuccess(profile);
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-page-container" className="grid min-h-[calc(100vh-80px)] grid-cols-1 gap-8 lg:grid-cols-12 py-6 animate-fade-in">
      <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl bg-linear-to-b from-orange-500 to-orange-600 p-8 text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <ShoppingBag className="h-8 w-8 stroke-[2.5]" />
            <span className="text-2xl font-black tracking-tight font-display">EATSTREAM</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl leading-tight font-display">
            Order food, manage your restaurant, or deliver with speed.
          </h1>
          <p className="mt-4 text-orange-100 text-sm leading-relaxed">
            The ultimate multi-role full-stack food delivery ecosystem modeled on Swiggy and Zomato. Fully responsive, real-time sync, and rich feature-set built for perfect fidelity.
          </p>
        </div>

        <div className="mt-12 space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white/10 p-2"><Sparkles className="h-5 w-5" /></div>
            <div>
              <h4 className="text-sm font-bold">Hybrid Persistence Engine</h4>
              <p className="text-xs text-orange-100">Synchronized Firestore & localStorage state</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white/10 p-2"><Truck className="h-5 w-5" /></div>
            <div>
              <h4 className="text-sm font-bold">Realtime Driver Tracking</h4>
              <p className="text-xs text-orange-100">Live vector simulated GPS route optimization</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/20 text-xs text-orange-100">
          EatStream Cloud Systems © 2026. All rights reserved.
        </div>
      </div>

      <div className="lg:col-span-7 flex flex-col gap-6 justify-center">
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-md">
          <div className="flex items-center gap-2 text-orange-400 font-bold mb-4">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm uppercase tracking-wider font-display">Instant Demo Fast-Pass Login</span>
          </div>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Choose any pre-configured profile below to immediately log in and explore separate dedicated dashboards, workflows, real-time features, and menus.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {demoUsers.map((demo) => {
              const Icon = demo.role === "customer" ? User : demo.role === "restaurantOwner" ? ShoppingBag : demo.role === "deliveryPartner" ? Truck : ShieldAlert;
              const color = demo.role === "customer" ? "text-blue-400 bg-blue-400/10" : demo.role === "restaurantOwner" ? "text-orange-400 bg-orange-400/10" : demo.role === "deliveryPartner" ? "text-emerald-400 bg-emerald-400/10" : "text-purple-400 bg-purple-400/10";
              
              return (
                <button
                  key={demo.role}
                  onClick={() => handleDemoLogin(demo)}
                  className="flex flex-col text-left rounded-2xl border border-slate-800 bg-slate-950 p-4 transition-all hover:scale-[1.02] hover:border-slate-700 hover:bg-slate-900 focus:outline-hidden cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`rounded-lg p-1.5 ${color}`}><Icon className="h-4 w-4" /></span>
                    <span className="text-xs font-bold text-slate-200 capitalize">{demo.role.replace("Owner", " Owner").replace("Partner", " Partner")}</span>
                  </div>
                  <div className="text-xs text-slate-300 font-bold truncate mb-1">{demo.name}</div>
                  <div className="text-[10px] text-slate-400 leading-normal">{demo.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900 font-display">
              {isRegistering ? "Create your account" : "Sign in to EatStream"}
            </h2>
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-xs font-bold text-orange-500 hover:underline cursor-pointer"
            >
              {isRegistering ? "Already have an account? Sign In" : "New vendor or client? Sign Up"}
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Select Account Role</label>
              <div className="grid grid-cols-4 gap-2 bg-slate-100 p-1 rounded-xl">
                {(["customer", "restaurantOwner", "deliveryPartner", "admin"] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`rounded-lg py-2 text-xs font-bold transition-all capitalize cursor-pointer ${
                      role === r 
                        ? "bg-orange-500 text-white shadow" 
                        : "text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {r.replace("Owner", "").replace("Partner", "")}
                  </button>
                ))}
              </div>
            </div>

            {isRegistering && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Alex Mercer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-orange-500 focus:outline-hidden"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white transition-all hover:bg-orange-600 cursor-pointer"
            >
              <LogIn className="h-4 w-4" />
              <span>{loading ? "Authenticating..." : isRegistering ? "Register Account" : "Access Platform"}</span>
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-6">
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => {
                  setPhone("+1 (555) 019-2834");
                  setShowOtp(true);
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Smartphone className="h-4 w-4 text-slate-500" />
                <span>Phone OTP Demo</span>
              </button>
              <button 
                onClick={() => handleDemoLogin(demoUsers[0])}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-orange-500" />
                <span>Google Login Demo</span>
              </button>
            </div>

            {showOtp && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 animate-fade-in">
                <p className="text-xs text-slate-500 mb-2">Simulated Phone OTP code sent to: <strong className="text-slate-700">{phone}</strong></p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter 4-digit code (any code works)"
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-orange-500"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  <button
                    onClick={() => handleDemoLogin(demoUsers[0])}
                    className="rounded-lg bg-orange-500 px-4 py-2 text-xs font-bold text-white cursor-pointer"
                  >
                    Verify
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
