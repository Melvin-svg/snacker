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
  HiOutlineBanknotes,
  HiOutlineSquares2X2,
  HiOutlineSquaresPlus,
  HiOutlineCube,
  HiOutlineExclamationTriangle,
  HiOutlineTicket,
  HiMagnifyingGlass,
} from "react-icons/hi2";
import { useToast } from "@/components/ui/use-toast";

const NAV_ITEMS = [
  { id: "overview", label: "Inventory", hint: "Stock & metrics", icon: HiOutlineSquares2X2 },
  { id: "add", label: "Add Product", hint: "New snack or drink", icon: HiOutlineSquaresPlus },
  { id: "credits", label: "Credits", hint: "User wallets", icon: HiOutlineTicket },
];

export default function AdminDrawer({ isOpen, onClose, onRefreshData }) {
  const [loading, setLoading] = useState(false);
  const [adminData, setAdminData] = useState({ products: [], maintenance: false });
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "add" | "credits"
  const [users, setUsers] = useState([]);
  const [userQuery, setUserQuery] = useState("");
  const [creditInputs, setCreditInputs] = useState({});
  const [creditBusy, setCreditBusy] = useState(null);
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

  const fetchUsers = async (query = userQuery) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list_users", payload: { query } }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      } else {
        toast({ title: "Could not load users", description: data.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === "credits") {
      fetchUsers();
    }
  }, [isOpen, activeTab]);

  const handleAddCredits = async (u) => {
    const amount = Number(creditInputs[u.id]);
    if (!Number.isInteger(amount) || amount < 1) {
      toast({ title: "Invalid amount", description: "Enter a whole number of rupees.", variant: "destructive" });
      return;
    }
    if (!window.confirm(`Add ₹${amount} to ${u.name} (${u.email})?`)) return;

    setCreditBusy(u.id);
    try {
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_credits", payload: { userId: u.id, amount } }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((x) => (x.id === u.id ? { ...x, credit: data.credit, hasWallet: true } : x)),
        );
        setCreditInputs((prev) => ({ ...prev, [u.id]: "" }));
        toast({ title: "Credits added", description: data.message, className: "bg-green-600 text-white" });
      } else {
        toast({ title: "Failed", description: data.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setCreditBusy(null);
    }
  };

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

  const stats = [
    {
      label: "Total Products",
      value: totalProducts,
      icon: HiOutlineSquares2X2,
      tone: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    },
    {
      label: "Units in Stock",
      value: `${totalUnits}`,
      suffix: "units",
      icon: HiOutlineCube,
      tone: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Out of Stock",
      value: outOfStockCount,
      icon: HiOutlineExclamationTriangle,
      tone:
        outOfStockCount > 0
          ? "text-red-400 bg-red-500/10 border-red-500/20"
          : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  const activeNavItem = NAV_ITEMS.find((n) => n.id === activeTab);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Dashboard Modal */}
          <motion.div
            className="relative flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-dark-100 text-white shadow-2xl"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
          >
            {/* Top Bar */}
            <header className="flex shrink-0 items-center justify-between border-b border-neutral-800 bg-dark-200 px-5 py-3.5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg border border-yellow-500/25 bg-yellow-500/10 p-2 text-yellow-400">
                  <HiShieldCheck size={22} />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight sm:text-lg">
                    Admin Control Suite
                  </h2>
                  <p className="hidden text-[11px] text-neutral-500 sm:block">
                    Authenticated admin session · Direct control of shelves, wallets & machine status
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
                aria-label="Close admin panel"
              >
                <HiXMark size={22} />
              </button>
            </header>

            <div className="flex min-h-0 flex-1">
              {/* Sidebar (desktop) */}
              <aside className="hidden w-60 shrink-0 flex-col border-r border-neutral-800 bg-dark-200 p-4 md:flex">
                <nav className="space-y-1.5">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                          isActive
                            ? "bg-yellow-500/10 text-yellow-300 ring-1 ring-inset ring-yellow-500/30"
                            : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                        }`}
                      >
                        <span
                          className={`rounded-lg p-2 text-base transition ${
                            isActive ? "bg-yellow-500/15 text-yellow-400" : "text-neutral-500 group-hover:text-neutral-300"
                          }`}
                        >
                          <Icon size={18} />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{item.label}</span>
                          <span className="block truncate text-[11px] text-neutral-500">{item.hint}</span>
                        </span>
                      </button>
                    );
                  })}
                </nav>

                {/* Machine status widget */}
                <div className="mt-auto space-y-3 pt-4">
                  <div className="rounded-xl border border-neutral-800 bg-dark-100 p-3.5">
                    <p className="mb-2 text-xs font-semibold text-neutral-300">Vending Machine</p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          adminData.maintenance ? "animate-pulse bg-amber-400" : "bg-emerald-400"
                        }`}
                      />
                      <span className={`text-xs font-medium ${adminData.maintenance ? "text-amber-300" : "text-emerald-300"}`}>
                        {adminData.maintenance ? "Maintenance mode" : "Live & vending"}
                      </span>
                    </div>
                    <button
                      onClick={handleToggleMaintenance}
                      disabled={loading}
                      className={`mt-3 w-full rounded-lg py-2 text-xs font-bold transition shadow disabled:opacity-50 ${
                        adminData.maintenance
                          ? "bg-amber-500 text-dark-200 hover:bg-amber-400"
                          : "bg-emerald-600 text-white hover:bg-emerald-500"
                      }`}
                    >
                      {adminData.maintenance ? "Set Live" : "Start Restock"}
                    </button>
                  </div>
                  <p className="px-1 text-[10px] leading-relaxed text-neutral-600">
                    Changes to stock & maintenance go live instantly across the shop.
                  </p>
                </div>
              </aside>

              {/* Mobile tab bar */}
              <div className="absolute left-1/2 top-[68px] flex w-max -translate-x-1/2 gap-1 rounded-full border border-neutral-800 bg-dark-200 p-1 shadow-xl md:hidden">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        isActive
                          ? "bg-yellow-500/15 text-yellow-300"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      <Icon size={14} />
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Main Content */}
              <main className="min-w-0 flex-1 overflow-y-auto">
                {/* Section heading */}
                <div className="flex items-center justify-between gap-3 px-5 pb-1 pt-5 sm:px-7 sm:pt-6">
                  <div className="flex items-center gap-2 md:hidden">
                    {/* Maintenance pill (mobile, since sidebar is hidden) */}
                    <button
                      onClick={handleToggleMaintenance}
                      disabled={loading}
                      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition disabled:opacity-50 ${
                        adminData.maintenance
                          ? "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/30"
                          : "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/30"
                      }`}
                    >
                      <HiOutlineWrenchScrewdriver size={13} />
                      {adminData.maintenance ? "Maintenance" : "Live"}
                    </button>
                  </div>
                  <h3 className="hidden text-lg font-bold tracking-tight md:block">
                    {activeNavItem?.label}
                  </h3>
                  {activeTab === "overview" && (
                    <button
                      onClick={fetchAdminData}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-neutral-400 transition hover:bg-neutral-900 hover:text-white"
                    >
                      <HiArrowPath size={14} className={loading ? "animate-spin" : ""} />
                      Refresh
                    </button>
                  )}
                </div>

                <div className="px-5 pb-8 pt-3 sm:px-7">
                  {activeTab === "overview" ? (
                    <div className="space-y-5">
                      {/* Stat Cards */}
                      <div className="grid grid-cols-3 gap-3 sm:gap-4">
                        {stats.map((s) => {
                          const Icon = s.icon;
                          return (
                            <div
                              key={s.label}
                              className="rounded-xl border border-neutral-800 bg-dark-200 p-4 transition hover:border-neutral-700"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                                    {s.label}
                                  </p>
                                  <h3 className="mt-1.5 text-2xl font-bold tracking-tight text-white">
                                    {s.value}
                                    {s.suffix && (
                                      <span className="ml-1 text-xs font-medium text-neutral-500">
                                        {s.suffix}
                                      </span>
                                    )}
                                  </h3>
                                </div>
                                <span className={`rounded-lg border p-2 ${s.tone}`}>
                                  <Icon size={16} />
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Category Distribution */}
                      <section className="rounded-xl border border-neutral-800 bg-dark-200 p-4 sm:p-5">
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="flex items-center gap-2 text-sm font-semibold text-neutral-200">
                            <span className="h-1 w-6 rounded-full bg-yellow-400" />
                            Category Distribution
                          </h4>
                          <span className="text-xs text-neutral-500">
                            {totalProducts} products on shelf
                          </span>
                        </div>
                        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-neutral-800">
                          <div
                            className="bg-yellow-400 transition-all duration-500"
                            style={{ width: `${snacksRatio}%` }}
                          />
                          <div
                            className="bg-cyan-400 transition-all duration-500"
                            style={{ width: `${100 - snacksRatio}%` }}
                          />
                        </div>
                        <div className="mt-2.5 flex flex-wrap justify-between gap-2 text-xs">
                          <span className="flex items-center gap-1.5 text-neutral-300">
                            <span className="h-2 w-2 rounded-full bg-yellow-400" />
                            Snacks · {snacksCount} ({snacksRatio}%)
                          </span>
                          <span className="flex items-center gap-1.5 text-neutral-300">
                            <span className="h-2 w-2 rounded-full bg-cyan-400" />
                            Drinks · {drinksCount} ({100 - snacksRatio}%)
                          </span>
                        </div>
                      </section>

                      {/* Seed Database */}
                      <section className="flex flex-col gap-3 rounded-xl border border-yellow-500/20 bg-gradient-to-r from-yellow-500/10 to-transparent p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                        <div className="flex items-start gap-3">
                          <span className="rounded-lg border border-yellow-500/25 bg-yellow-500/10 p-2 text-yellow-400">
                            <HiOutlineSparkles size={16} />
                          </span>
                          <div>
                            <h4 className="text-sm font-semibold text-yellow-300">
                              1-Click Database Seeding
                            </h4>
                            <p className="mt-0.5 text-xs text-neutral-400">
                              Populate the shelf with Lays, Doritos, Oreo, Monster and more.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleSeed}
                          disabled={loading}
                          className="shrink-0 rounded-lg bg-yellow-400 px-4 py-2 text-xs font-bold text-dark-200 shadow transition hover:bg-yellow-500 disabled:opacity-50"
                        >
                          {loading ? "Seeding..." : "Seed Products"}
                        </button>
                      </section>

                      {/* Inventory List */}
                      <section>
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="flex items-center gap-2 text-sm font-semibold text-neutral-200">
                            <span className="h-1 w-6 rounded-full bg-yellow-400" />
                            Live Inventory
                          </h4>
                          <span className="text-xs text-neutral-500">Tap + / − to adjust stock</span>
                        </div>

                        {adminData.products.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-neutral-800 py-10 text-center text-sm text-neutral-500">
                            No products in Firestore yet. Click “Seed Products” above to populate!
                          </div>
                        ) : (
                          <div className="overflow-hidden rounded-xl border border-neutral-800">
                            {adminData.products.map((p, i) => {
                              const stockNum = Number(p.stock) || 0;
                              return (
                                <div
                                  key={p.id}
                                  className={`flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-neutral-900/60 ${
                                    i !== 0 ? "border-t border-neutral-800" : ""
                                  }`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-[11px] font-bold text-yellow-400">
                                        {p.position || "A1"}
                                      </span>
                                      <span className="truncate text-sm font-semibold text-white">
                                        {p.name}
                                      </span>
                                    </div>
                                    <div className="mt-0.5 flex items-center gap-3 text-[11px] text-neutral-500">
                                      <span className="text-neutral-400">₹{p.price}</span>
                                      <span className="capitalize">{p.category}</span>
                                      {stockNum === 0 && (
                                        <span className="rounded-full bg-red-500/15 px-2 py-0.5 font-medium text-red-300">
                                          Out of stock
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex shrink-0 items-center gap-2">
                                    <button
                                      onClick={() => handleUpdateStock(p.id, stockNum, -1)}
                                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300 transition hover:bg-neutral-700 hover:text-white"
                                      aria-label={`Decrease stock of ${p.name}`}
                                    >
                                      <HiMinus size={14} />
                                    </button>
                                    <span
                                      className={`min-w-[34px] text-center font-mono text-sm font-bold ${
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
                                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300 transition hover:bg-neutral-700 hover:text-white"
                                      aria-label={`Increase stock of ${p.name}`}
                                    >
                                      <HiPlus size={14} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </section>
                    </div>
                  ) : activeTab === "credits" ? (
                    /* User Wallet Credits */
                    <div className="mx-auto max-w-2xl space-y-4">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          fetchUsers(userQuery);
                        }}
                        className="flex gap-2"
                      >
                        <div className="relative flex-1">
                          <HiMagnifyingGlass
                            size={16}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                          />
                          <input
                            type="text"
                            placeholder="Search name or email"
                            value={userQuery}
                            onChange={(e) => setUserQuery(e.target.value)}
                            className="w-full rounded-lg border border-neutral-700 bg-dark-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-yellow-400"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={loading}
                          className="rounded-lg bg-neutral-800 px-4 text-neutral-200 transition hover:bg-neutral-700 disabled:opacity-50"
                        >
                          <HiArrowPath size={16} className={loading ? "animate-spin" : ""} />
                        </button>
                      </form>
                      <p className="text-[11px] leading-relaxed text-neutral-500">
                        Everyone who has signed in with Clerk, most recent first. Users without a
                        wallet get one on their first top-up.
                      </p>

                      {users.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-neutral-800 py-10 text-center text-sm text-neutral-500">
                          {loading ? "Loading users..." : "No users found."}
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {users.map((u) => (
                            <div
                              key={u.id}
                              className="rounded-xl border border-neutral-800 bg-dark-200 p-4 transition hover:border-neutral-700"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-3">
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-500/10 text-sm font-bold text-yellow-300 ring-1 ring-inset ring-yellow-500/25">
                                    {(u.name || "?").trim().charAt(0).toUpperCase()}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-white">
                                      {u.name}
                                    </p>
                                    <p className="truncate text-xs text-neutral-400">{u.email}</p>
                                  </div>
                                </div>
                                <div className="shrink-0 text-right">
                                  <p className="font-mono text-sm font-bold text-emerald-400">
                                    ₹{u.credit}
                                  </p>
                                  {!u.hasWallet && (
                                    <span className="text-[10px] text-amber-300">no wallet yet</span>
                                  )}
                                </div>
                              </div>
                              <div className="mt-3 flex gap-2 pl-0 sm:pl-12">
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  placeholder="₹ amount"
                                  value={creditInputs[u.id] ?? ""}
                                  onChange={(e) =>
                                    setCreditInputs((prev) => ({ ...prev, [u.id]: e.target.value }))
                                  }
                                  className="min-w-0 flex-1 rounded-lg border border-neutral-700 bg-dark-100 p-2 text-sm outline-none transition focus:border-yellow-400"
                                />
                                <button
                                  onClick={() => handleAddCredits(u)}
                                  disabled={creditBusy === u.id}
                                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-yellow-400 px-3.5 text-xs font-bold text-dark-200 transition hover:bg-yellow-500 disabled:opacity-50"
                                >
                                  <HiOutlineBanknotes size={15} />
                                  {creditBusy === u.id ? "Adding..." : "Add"}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Add Snack Form */
                    <form onSubmit={handleAddProduct} className="mx-auto max-w-2xl space-y-5">
                      <section className="rounded-xl border border-neutral-800 bg-dark-200 p-4 sm:p-5">
                        <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-neutral-200">
                          <span className="h-1 w-6 rounded-full bg-yellow-400" />
                          Product Details
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <label className="mb-1.5 block text-xs font-medium text-neutral-300">
                              Snack Name
                            </label>
                            <input
                              required
                              type="text"
                              placeholder="e.g. Lays Gourmet"
                              value={form.name}
                              onChange={(e) => setForm({ ...form, name: e.target.value })}
                              className="w-full rounded-lg border border-neutral-700 bg-dark-100 p-2.5 text-sm outline-none transition focus:border-yellow-400"
                            />
                          </div>

                          <div>
                            <label className="mb-1.5 block text-xs font-medium text-neutral-300">
                              Subtitle / Description
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Lime & Herb Flavour"
                              value={form.subtitle}
                              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                              className="w-full rounded-lg border border-neutral-700 bg-dark-100 p-2.5 text-sm outline-none transition focus:border-yellow-400"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="mb-1.5 block text-xs font-medium text-neutral-300">
                                Category
                              </label>
                              <select
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                className="w-full rounded-lg border border-neutral-700 bg-dark-100 p-2.5 text-sm outline-none transition focus:border-yellow-400"
                              >
                                <option value="snacks">Snacks</option>
                                <option value="drinks">Drinks</option>
                              </select>
                            </div>

                            <div>
                              <label className="mb-1.5 block text-xs font-medium text-neutral-300">
                                Position in Machine
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. C1"
                                value={form.position}
                                onChange={(e) => setForm({ ...form, position: e.target.value })}
                                className="w-full rounded-lg border border-neutral-700 bg-dark-100 p-2.5 font-mono text-sm uppercase outline-none transition focus:border-yellow-400"
                              />
                            </div>
                          </div>
                        </div>
                      </section>

                      <section className="rounded-xl border border-neutral-800 bg-dark-200 p-4 sm:p-5">
                        <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-neutral-200">
                          <span className="h-1 w-6 rounded-full bg-yellow-400" />
                          Pricing & Stock
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1.5 block text-xs font-medium text-neutral-300">
                              Price (₹)
                            </label>
                            <input
                              required
                              type="number"
                              min="1"
                              value={form.price}
                              onChange={(e) => setForm({ ...form, price: e.target.value })}
                              className="w-full rounded-lg border border-neutral-700 bg-dark-100 p-2.5 text-sm outline-none transition focus:border-yellow-400"
                            />
                          </div>

                          <div>
                            <label className="mb-1.5 block text-xs font-medium text-neutral-300">
                              Initial Stock
                            </label>
                            <input
                              required
                              type="number"
                              min="0"
                              value={form.stock}
                              onChange={(e) => setForm({ ...form, stock: e.target.value })}
                              className="w-full rounded-lg border border-neutral-700 bg-dark-100 p-2.5 text-sm outline-none transition focus:border-yellow-400"
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="mb-1.5 block text-xs font-medium text-neutral-300">
                            Image URL
                          </label>
                          <input
                            type="url"
                            placeholder="Google Drive link or https://..."
                            value={form.imgSrc}
                            onChange={(e) => setForm({ ...form, imgSrc: e.target.value })}
                            className="w-full rounded-lg border border-neutral-700 bg-dark-100 p-2.5 text-sm outline-none transition focus:border-yellow-400"
                          />
                        </div>
                      </section>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-yellow-400 p-3 text-sm font-bold text-dark-200 shadow transition hover:bg-yellow-500 disabled:opacity-50"
                      >
                        {loading ? "Adding Product..." : "Save Product to Shelf"}
                      </button>
                    </form>
                  )}
                </div>
              </main>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
