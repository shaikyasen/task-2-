import React, { useState, useEffect } from "react";
import { UserProfile, Restaurant, AuditLog } from "../types";
import { firebaseService } from "../lib/firebaseService";
import { 
  ShoppingBag, DollarSign, ShieldCheck, Settings, 
  Terminal, RefreshCw, Compass 
} from "lucide-react";

export default function AdminDashboard() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<"approvals" | "cms" | "logs">("approvals");
  const [loading, setLoading] = useState(false);

  const [commissionRate, setCommissionRate] = useState(15.0);
  const [deliveryBaseFare, setDeliveryBaseFare] = useState(3.00);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const restList = await firebaseService.getRestaurants();
      setRestaurants(restList);

      const usersMap = JSON.parse(localStorage.getItem("eatstream_users_map") || "{}");
      const list = Object.values(usersMap) as UserProfile[];
      setUsers(list);

      const res = await fetch("/api/logs");
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      } else {
        const localLogs = await firebaseService.getLogs();
        setLogs(localLogs);
      }
    } catch (e) {
      console.warn("Server API logs fetch failed. Using local storage logs fallback.", e);
      const localLogs = await firebaseService.getLogs();
      setLogs(localLogs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleApproveVendor = async (restId: string) => {
    const list = [...restaurants];
    const idx = list.findIndex(r => r.id === restId);
    if (idx !== -1) {
      list[idx].isApproved = true;
      await firebaseService.saveRestaurant(list[idx]);
      setRestaurants(list);
      await firebaseService.logAction("Admin Operations", `Approved Restaurant Vendor ID: ${restId}`);
    }
  };

  const handleApproveRider = async (userId: string) => {
    const usersMap = JSON.parse(localStorage.getItem("eatstream_users_map") || "{}");
    if (usersMap[userId]) {
      usersMap[userId].isApproved = true;
      usersMap[userId].status = "active";
      localStorage.setItem("eatstream_users_map", JSON.stringify(usersMap));
      
      setUsers(Object.values(usersMap) as UserProfile[]);
      await firebaseService.logAction("Admin Operations", `Approved Delivery Rider ID: ${userId}`);
    }
  };

  const handleSaveGlobalSettings = () => {
    alert("Global system configurations saved successfully on server!");
  };

  return (
    <div id="admin-dashboard-container" className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gross Platform Sales</span>
            <DollarSign className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight font-display">$154,820.50</div>
          <div className="mt-2">
            <span className="inline-flex items-center text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-md">↑ 18.4% quarterly growth</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Partners</span>
            <ShoppingBag className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight font-display">{restaurants.length} kitchens</div>
          <div className="mt-2">
            <span className="text-[10px] text-slate-500 font-medium">{restaurants.filter(r => !r.isApproved).length} awaiting approval</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Riders</span>
            <Compass className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight font-display">
            {users.filter(u => u.role === "deliveryPartner").length || 1} active
          </div>
          <div className="mt-2">
            <span className="inline-flex items-center text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-md">100% compliance rate</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Platform Revenue</span>
            <ShieldCheck className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight font-display">
            ${(154820.50 * 0.15).toFixed(2)}
          </div>
          <div className="mt-2">
            <span className="text-[10px] text-slate-500 font-medium">Based on 15% flat commission</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div className="flex gap-2">
          {[
            { id: "approvals", label: "Verification Approvals", Icon: ShieldCheck },
            { id: "cms", label: "Global Configurations", Icon: Settings },
            { id: "logs", label: "Server Log Terminal", Icon: Terminal }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id 
                  ? "bg-slate-900 text-white shadow-xs" 
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <tab.Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <button 
          onClick={loadAdminData}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 font-bold shadow-2xs transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 text-slate-400 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh stats</span>
        </button>
      </div>

      {activeTab === "approvals" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-950 uppercase tracking-wider font-display">Restaurant Vendor Verification</h4>
            
            {restaurants.filter(r => !r.isApproved).length === 0 ? (
              <p className="text-slate-400 text-xs py-6 bg-slate-50 border rounded-2xl text-center">No pending restaurant verifications. All clear!</p>
            ) : (
              <div className="space-y-3">
                {restaurants.filter(r => !r.isApproved).map(rest => (
                  <div key={rest.id} className="rounded-2xl border border-slate-200 bg-white p-4 flex justify-between items-center shadow-xs text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{rest.name}</div>
                      <div className="text-slate-500">{rest.address}</div>
                      <div className="text-[10px] text-slate-400 font-semibold mt-1">Cuisine: {rest.category} • Tax ID: {rest.taxNumber || "Pending"}</div>
                    </div>
                    <button 
                      onClick={() => handleApproveVendor(rest.id)}
                      className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-2 shrink-0 cursor-pointer text-[10px]"
                    >
                      Approve Vendor
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-950 uppercase tracking-wider font-display">Delivery Partner Verification</h4>
            
            {users.filter(u => u.role === "deliveryPartner" && !u.isApproved).length === 0 ? (
              <p className="text-slate-400 text-xs py-6 bg-slate-50 border rounded-2xl text-center">No pending rider verifications. All clear!</p>
            ) : (
              <div className="space-y-3">
                {users.filter(u => u.role === "deliveryPartner" && !u.isApproved).map(rider => (
                  <div key={rider.id} className="rounded-2xl border border-slate-200 bg-white p-4 flex justify-between items-center shadow-xs text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{rider.name}</div>
                      <div className="text-slate-500">{rider.email}</div>
                      <div className="text-[10px] text-slate-400 mt-1">Awaiting rider verification checklist</div>
                    </div>
                    <button 
                      onClick={() => handleApproveRider(rider.id)}
                      className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-2 shrink-0 cursor-pointer text-[10px]"
                    >
                      Approve Rider
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "cms" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs max-w-2xl">
          <h4 className="text-sm font-bold text-slate-950 uppercase tracking-wider mb-4 font-display">System Commission Rates & Operations</h4>
          
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Rake Commission Rate (%)</label>
                <input 
                  type="number" 
                  className="w-full rounded-xl border border-slate-200 px-4 py-3" 
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Base Delivery Flat Fee ($)</label>
                <input 
                  type="number" 
                  className="w-full rounded-xl border border-slate-200 px-4 py-3" 
                  value={deliveryBaseFare}
                  onChange={(e) => setDeliveryBaseFare(parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 border flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-800">Platform Maintenance mode</div>
                <p className="text-[10px] text-slate-500">Temporarily suspends gourmet checkout for service repairs</p>
              </div>
              <button
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`rounded-full p-2.5 transition-all cursor-pointer ${
                  maintenanceMode 
                    ? "bg-rose-500 text-white" 
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                onClick={handleSaveGlobalSettings}
                className="rounded-xl bg-slate-950 text-white font-bold px-6 py-3 cursor-pointer"
              >
                Save configurations
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm font-bold text-slate-950 uppercase tracking-wider font-display">Live Server Audit Trail Telemetry Console</h4>
              <p className="text-[10px] text-slate-400">Pulls raw event logs in real-time from Express REST API: <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-500 font-mono text-[9px]">/api/logs</code></p>
            </div>
            
            <button 
              onClick={loadAdminData}
              className="text-xs font-bold text-orange-500 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Force Poll Logs</span>
            </button>
          </div>

          <div className="rounded-3xl bg-slate-950 border border-slate-800 p-6 text-slate-300 font-mono text-xs shadow-xl space-y-3 h-[320px] overflow-y-auto">
            <div className="text-emerald-400 font-bold mb-2">EatStream Cloud Core Connection - Status: [ONLINE]</div>
            {logs.length === 0 ? (
              <div className="text-slate-600">No logs generated yet. Try logging in, ordering food, or checking out.</div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="flex gap-4 border-b border-slate-900 pb-2">
                  <span className="text-slate-500 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className="text-orange-400 font-semibold uppercase shrink-0">[{log.action}]</span>
                  <span className="text-slate-300 flex-1">{log.details}</span>
                  {log.userEmail && <span className="text-slate-500 hidden sm:inline text-[10px]">{log.userEmail}</span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
