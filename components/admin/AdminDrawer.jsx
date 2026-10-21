"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiShieldCheck,
  HiXMark,
  HiOutlineSparkles,
  HiArrowPath,
  HiPlus,
  HiMinus,
  HiOutlineWrenchScrewdriver,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import { useToast } from "@/components/ui/use-toast";

export default function AdminDrawer({ isOpen, onClose, onRefreshData }) {
  const [loading, setLoading] = useState(false);
  const [adminData, setAdminData] = useState({ products: [], maintenance: false });
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "add"
  const [form, setForm] = useState({
    name: "",
    subtitle: "",
    category: "snacks",
    price: 20,
    stock: 10,
    position: "A1",
    imgSrc: "",
  });
  const { toast } = useToast();

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/actions");
      const data = await res.json();
      if (data.success) {
        setAdminData({
          products: data.products || [],
          maintenance: Boolean(data.maintenance),
        });
      } else {
        toast({
          title: "Admin Notice",
          description: data.error || "Failed to load admin stats",
          variant: "destructive",
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAdminData();
    }
  }, [isOpen]);

  // 1-Click Database Seeding
  const handleSeed = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed_products" }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Shelf Seeded!",
          description: data.message,
          className: "bg-green-600 text-white",
        });
        await fetchAdminData();
        if (onRefreshData) onRefreshData();
      } else {
        toast({
          title: "Seed Failed",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Toggle Realtime Maintenance
  const handleToggleMaintenance = async () => {
    setLoading(true);
    const newStatus = !adminData.maintenance;
    try {
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_maintenance",
          payload: { status: newStatus },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAdminData((prev) => ({ ...prev, maintenance: newStatus }));
        toast({
          title: newStatus ? "Machine in Maintenance" : "Machine is LIVE",
          description: data.message,
          className: newStatus ? "bg-amber-600 text-white" : "bg-green-600 text-white",
        });
      }
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Quick Inline Stock Update
  const handleUpdateStock = async (productId, currentStock, delta) => {
    const nextStock = Math.max(0, currentStock + delta);
    try {
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_stock",
          payload: { productId, newStock: nextStock },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAdminData((prev) => ({
          ...prev,
          products: prev.products.map((p) =>
            p.id === productId ? { ...p, stock: nextStock } : p
          ),
        }));
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      toast({ title: "Stock update failed", description: e.message, variant: "destructive" });
    }
  };

  // Add New Product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_product",
          payload: form,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Product Added",
          description: `${form.name} is now available on shelf!`,
          className: "bg-green-600 text-white",
        });
        setForm({
          name: "",
          subtitle: "",
          category: "snacks",
          price: 20,
          stock: 10,
          position: "A1",
          imgSrc: "",
        });
        setActiveTab("overview");
        await fetchAdminData();
        if (onRefreshData) onRefreshData();
      } else {
        toast({ title: "Failed", description: data.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Inventory Metrics & Visualizations
  const totalProducts = adminData.products.length;
  const totalUnits = adminData.products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
  const outOfStockCount = adminData.products.filter((p) => (Number(p.stock) || 0) === 0).length;
  const snacksCount = adminData.products.filter((p) => p.category === "snacks").length;
  const drinksCount = adminData.products.filter((p) => p.category === "drinks").length;
  const snacksRatio = totalProducts > 0 ? Math.round((snacksCount / totalProducts) * 100) : 50;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer Content */}
          <motion.div
            className="relative flex h-full w-full max-w-lg flex-col bg-dark-100 text-white shadow-2xl overflow-hidden border-l border-neutral-800"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 p-5 bg-dark-200">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-yellow-500/20 p-2 text-yellow-400">
                  <HiShieldCheck size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    Admin Control Suite
                    <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/30">
                      Direct UI Mode
                    </span>
                  </h2>
                  <p className="text-xs text-neutral-400">Authenticated admin session</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
              >
                <HiXMark size={22} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-neutral-800 bg-dark-200/50 px-5 pt-2">
              <button
                onClick={() => setActiveTab("overview")}
                className={`pb-2.5 px-3 text-sm font-medium border-b-2 transition ${
                  activeTab === "overview"
                    ? "border-yellow-400 text-yellow-400"
                    : "border-transparent text-neutral-400 hover:text-white"
                }`}
              >
                Inventory & Viz
              </button>
              <button
                onClick={() => setActiveTab("add")}
                className={`pb-2.5 px-3 text-sm font-medium border-b-2 transition ${
                  activeTab === "add"
                    ? "border-yellow-400 text-yellow-400"
                    : "border-transparent text-neutral-400 hover:text-white"
                }`}
              >
                + Add Snack
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Machine Maintenance Status Bar */}
              <div className="flex items-center justify-between rounded-xl bg-dark-200 p-4 border border-neutral-800">
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-full p-2.5 ${
                      adminData.maintenance
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-emerald-500/20 text-emerald-400"
                    }`}
                  >
                    <HiOutlineWrenchScrewdriver size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Vending Machine Status</h4>
                    <p className="text-xs text-neutral-400">
                      {adminData.maintenance
                        ? "Under Maintenance (Restocking Mode)"
                        : "Machine is Live & Vending"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleToggleMaintenance}
                  disabled={loading}
                  className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition shadow ${
                    adminData.maintenance
                      ? "bg-amber-500 text-dark-200 hover:bg-amber-400"
                      : "bg-emerald-600 text-white hover:bg-emerald-500"
                  }`}
                >
                  {adminData.maintenance ? "Set Live" : "Start Restock"}
                </button>
              </div>

              {activeTab === "overview" ? (
                <>
                  {/* Visual Inventory Metrics */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-dark-200 p-3.5 border border-neutral-800">
                      <p className="text-xs text-neutral-400">Total Snacks</p>
                      <h3 className="text-xl font-bold text-white mt-1">{totalProducts}</h3>
                    </div>
                    <div className="rounded-xl bg-dark-200 p-3.5 border border-neutral-800">
                      <p className="text-xs text-neutral-400">Total Stock</p>
                      <h3 className="text-xl font-bold text-primary mt-1">{totalUnits} units</h3>
                    </div>
                    <div className="rounded-xl bg-dark-200 p-3.5 border border-neutral-800">
                      <p className="text-xs text-neutral-400">Out of Stock</p>
                      <h3
                        className={`text-xl font-bold mt-1 ${
                          outOfStockCount > 0 ? "text-red-400" : "text-emerald-400"
                        }`}
                      >
                        {outOfStockCount}
                      </h3>
                    </div>
                  </div>

                  {/* Category Distribution Visual Meter */}
                  <div className="rounded-xl bg-dark-200 p-4 border border-neutral-800 space-y-2">
                    <div className="flex justify-between text-xs text-neutral-300 font-medium">
                      <span>Snacks ({snacksCount})</span>
                      <span>Drinks ({drinksCount})</span>
                    </div>
                    <div className="h-2.5 w-full bg-neutral-800 rounded-full overflow-hidden flex">
                      <div
                        className="bg-yellow-400 h-full transition-all duration-500"
                        style={{ width: `${snacksRatio}%` }}
                      />
                      <div
                        className="bg-cyan-400 h-full transition-all duration-500"
                        style={{ width: `${100 - snacksRatio}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-neutral-500 text-right">
                      {snacksRatio}% snacks · {100 - snacksRatio}% drinks
                    </p>
                  </div>

                  {/* Seed Database Banner (If empty or whenever desired) */}
                  <div className="rounded-xl bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 p-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-yellow-400 flex items-center gap-1.5">
                        <HiOutlineSparkles size={18} />
                        1-Click Database Seeding
                      </h4>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Populate shelf with Lays, Doritos, Oreo, Monster, etc.
                      </p>
                    </div>
                    <button
                      onClick={handleSeed}
                      disabled={loading}
                      className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-dark-200 font-bold text-xs rounded-lg transition disabled:opacity-50"
                    >
                      {loading ? "Seeding..." : "Seed Products"}
                    </button>
                  </div>

                  {/* Product Stock List with Inline Modifiers */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-neutral-200">
                        Live Inventory & Stock Modifiers
                      </h4>
                      <button
                        onClick={fetchAdminData}
                        className="text-xs text-neutral-400 hover:text-white flex items-center gap-1"
                      >
                        <HiArrowPath size={14} className={loading ? "animate-spin" : ""} />
                        Refresh
                      </button>
                    </div>

                    {adminData.products.length === 0 ? (
                      <div className="text-center py-8 text-neutral-500 text-sm">
                        No products in Firestore yet. Click "Seed Products" above to populate!
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {adminData.products.map((p) => {
                          const stockNum = Number(p.stock) || 0;
                          return (
                            <div
                              key={p.id}
                              className="flex items-center justify-between rounded-lg bg-dark-200 p-3 border border-neutral-800"
                            >
                              <div className="flex-1 pr-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono font-bold bg-neutral-800 px-1.5 py-0.5 rounded text-yellow-400">
                                    {p.position || "A1"}
                                  </span>
                                  <span className="text-sm font-semibold text-white truncate max-w-[150px]">
                                    {p.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1">
                                  <span>₹{p.price}</span>
                                  <span className="capitalize text-neutral-500">{p.category}</span>
                                </div>
                              </div>

                              {/* Inline Stock Counter */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleUpdateStock(p.id, stockNum, -1)}
                                  className="h-7 w-7 rounded bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-300 transition"
                                >
                                  <HiMinus size={14} />
                                </button>
                                <span
                                  className={`min-w-[32px] text-center font-mono font-bold text-sm ${
                                    stockNum === 0
                                      ? "text-red-400"
                                      : stockNum < 5
                                      ? "text-yellow-400"
                                      : "text-emerald-400"
                                  }`}
                                >
                                  {stockNum}
                                </span>
                                <button
                                  onClick={() => handleUpdateStock(p.id, stockNum, 1)}
                                  className="h-7 w-7 rounded bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-300 transition"
                                >
                                  <HiPlus size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Add Snack Form */
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div>
                    <label className="text-xs text-neutral-300 block mb-1">Snack Name</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Lays Gourmet"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-dark-200 rounded-lg p-2.5 text-sm border border-neutral-700 focus:border-yellow-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-neutral-300 block mb-1">Subtitle / Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Lime & Herb Flavour"
                      value={form.subtitle}
                      onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                      className="w-full bg-dark-200 rounded-lg p-2.5 text-sm border border-neutral-700 focus:border-yellow-400 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-neutral-300 block mb-1">Category</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full bg-dark-200 rounded-lg p-2.5 text-sm border border-neutral-700 focus:border-yellow-400 outline-none"
                      >
                        <option value="snacks">Snacks</option>
                        <option value="drinks">Drinks</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-neutral-300 block mb-1">Position in Machine</label>
                      <input
                        type="text"
                        placeholder="e.g. C1"
                        value={form.position}
                        onChange={(e) => setForm({ ...form, position: e.target.value })}
                        className="w-full bg-dark-200 rounded-lg p-2.5 text-sm border border-neutral-700 focus:border-yellow-400 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-neutral-300 block mb-1">Price (₹)</label>
                      <input
                        required
                        type="number"
                        min="1"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        className="w-full bg-dark-200 rounded-lg p-2.5 text-sm border border-neutral-700 focus:border-yellow-400 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-neutral-300 block mb-1">Initial Stock</label>
                      <input
                        required
                        type="number"
                        min="0"
                        value={form.stock}
                        onChange={(e) => setForm({ ...form, stock: e.target.value })}
                        className="w-full bg-dark-200 rounded-lg p-2.5 text-sm border border-neutral-700 focus:border-yellow-400 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-neutral-300 block mb-1">Image URL</label>
                    <input
                      type="url"
                      placeholder="Google Drive link or https://..."
                      value={form.imgSrc}
                      onChange={(e) => setForm({ ...form, imgSrc: e.target.value })}
                      className="w-full bg-dark-200 rounded-lg p-2.5 text-sm border border-neutral-700 focus:border-yellow-400 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-dark-200 font-bold p-3 rounded-lg text-sm transition shadow mt-4 disabled:opacity-50"
                  >
                    {loading ? "Adding Product..." : "Save Product to Shelf"}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
