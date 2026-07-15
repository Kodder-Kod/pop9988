"use client";

import React, { useState, useMemo } from "react";
import {
  UserCog, Briefcase, User, Building2, Wallet, Coins, TrendingUp,
  Gavel, ShoppingBag, X, CheckCircle2, ArrowUpRight, ArrowDownRight,
  ChevronDown, Plus, Minus, Store, ClipboardList, Percent, Users,
  PiggyBank, Landmark
} from "lucide-react";
import { useUserAccountName, useUserEmail, useUserID, useUserName, useUserPhone, useUserRole } from "../components/zustand/profile";
import { useUserTheme } from "../components/zustand/theme";
import { db } from "../../config";
import { sendPasswordResetEmail, getAuth } from "firebase/auth";
import { ref, update, push, remove } from 'firebase/database';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';


/* ---------------------------------------------------------
   TOKEN RATE (demo economics — Kenyan shilling per token)
--------------------------------------------------------- */
const TOKEN_RATE = 150; // KES per token
const SERVICE_FEE_PCT = 2;

/* ---------------------------------------------------------
   MOCK DATA
--------------------------------------------------------- */
const transactions = [
  { id: "TX-1042", party: "Amina Wanjiru", role: "Client", type: "Buy Tokens", amount: 45000, tokens: 300, status: "Success", date: "Jul 12" },
  { id: "TX-1041", party: "Kevin Otieno", role: "Agent", type: "Property Sale", amount: 128000, tokens: 853, status: "Success", date: "Jul 12" },
  { id: "TX-1039", party: "Grace Mwikali", role: "Client", type: "Bid Won", amount: 62000, tokens: 413, status: "Success", date: "Jul 11" },
  { id: "TX-1035", party: "David Kimani", role: "Agent", type: "Land Sale", amount: 210000, tokens: 1400, status: "Success", date: "Jul 10" },
  { id: "TX-1031", party: "Faith Njeri", role: "Client", type: "Buy Tokens", amount: 15000, tokens: 100, status: "Success", date: "Jul 9" },
];

const buyers = [
  { id: 1, name: "Peter Mwangi", interest: "2BR Apartment · Kilimani", offer: 640, status: "Pending" },
  { id: 2, name: "Susan Achieng", interest: "Commercial Plot · Ruiru", offer: 1120, status: "Pending" },
  { id: 3, name: "James Mutua", interest: "Studio Unit · Westlands", offer: 380, status: "Pending" },
];

const sellers = [
  { id: 1, name: "Nairobi Homes Ltd", item: "3BR Townhouse · Karen", asking: 2400 },
  { id: 2, name: "Coastview Agents", item: "Beach Plot · Diani", asking: 3100 },
  { id: 3, name: "Rift Realty", item: "1BR Apartment · Kileleshwa", asking: 980 },
];

const sellableCategories = [
  { name: "Residential Units", desc: "Apartments, townhouses and bungalows you're licensed to list.", commission: "3.5%" },
  { name: "Land & Plots", desc: "Freehold or leasehold parcels with a verified title.", commission: "2.8%" },
  { name: "Commercial Space", desc: "Retail, office or warehouse listings for business buyers.", commission: "4.0%" },
];




// Every agent and client on the platform, with their live token balance —
// what the admin's "list for all with tokens" view is built from.
const platformUsers = [
  { name: "Kevin Otieno", role: "Agent", tokens: 20000 },
  { name: "David Kimani", role: "Agent", tokens: 1740 },
  { name: "Sarah Kiptoo", role: "Agent", tokens: 905 },
  { name: "Amina Wanjiru", role: "Client", tokens: 620 },
  { name: "Grace Mwikali", role: "Client", tokens: 413 },
  { name: "Faith Njeri", role: "Client", tokens: 288 },
];

const TOKENS_SOLD_TO_AGENTS = 3400; // tokens admin has issued/sold directly to agents

/* ---------------------------------------------------------
   SMALL UI PRIMITIVES
--------------------------------------------------------- */
function TokenChip({ value, size = "md" }) {
  const pad = size === "lg" ? "px-4 py-2 text-lg" : "px-3 py-1 text-sm";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 text-amber-700 font-semibold ${pad}`}
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      <Coins className={size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5"} />
      {value.toLocaleString()}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, tone = "purple" }) {
  const tones = {
    purple: "from-purple-600 to-fuchsia-600",
    emerald: "from-emerald-500 to-teal-500",
    amber: "from-amber-500 to-orange-500",
  };
  return (
    <div className="bg-white rounded-3xl p-5 shadow-[0_10px_30px_rgba(124,58,237,0.08)] border border-purple-50">
      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${tones[tone]} flex items-center justify-center text-white mb-4`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="text-2xl font-extrabold text-gray-800 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-purple-950/40 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white/95 backdrop-blur px-6 sm:px-8 pt-6 sm:pt-7 pb-4 flex items-start justify-between border-b border-gray-100">
          <div>
            <h3 className="text-xl font-extrabold text-gray-800">{title}</h3>
            {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 sm:px-8 py-6">{children}</div>
      </div>
    </div>
  );
}

function PrimaryButton({ children, onClick, full = true }) {
  return (
    <button
      onClick={onClick}
      className={`${full ? "w-full" : ""} py-3.5 rounded-2xl bg-gradient-to-r from-purple-700 via-fuchsia-600 to-purple-700 text-white font-bold hover:scale-[1.02] active:scale-95 transition shadow-lg`}
    >
      {children}
    </button>
  );
}

/* ---------------------------------------------------------
   MAIN APP
--------------------------------------------------------- */
const Homepage = () => {


  const Id = useUserID((state) => state.userID)
  const theme = useUserTheme((state) => state.userTheme)
  const bizName = useUserName((state) => state.userName)
  const role1 = useUserRole((state) => state.userRole)



  const [role, setRole] = useState(role1)

  const [modal, setModal] = useState(null); // { type, payload }
  const [tokenQty, setTokenQty] = useState(50);
  const [bidAmount, setBidAmount] = useState("");
  const [txFilter, setTxFilter] = useState("All");


  const roles = [
    { id: "agent", label: "Agent", icon: Briefcase },
    { id: "client", label: "Client", icon: User },
  ];

  const subtotal = tokenQty * TOKEN_RATE;
  const fee = Math.round(subtotal * (SERVICE_FEE_PCT / 100));
  const total = subtotal + fee;

  const totalRevenue = useMemo(() => transactions.reduce((s, t) => s + t.amount, 0), []);
  const totalTokensMoved = useMemo(() => transactions.reduce((s, t) => s + t.tokens, 0), []);
  const profitMargin = 8.4;
  const totalCirculating = useMemo(() => platformUsers.reduce((s, u) => s + u.tokens, 0) + TOKENS_SOLD_TO_AGENTS, []);
  const soldValue = useMemo(() => transactions.filter(t => t.type.includes("Sale")).reduce((s, t) => s + t.amount, 0), []);
  const earnedValue = Math.round(totalRevenue * (profitMargin / 100));
  const filteredTransactions = useMemo(
    () => (txFilter === "All" ? transactions : transactions.filter((t) => t.role === txFilter)),
    [txFilter]
  );

  const openBid = (party, meta) => setModal({ type: "bid", payload: { party, meta } });
  const closeModal = () => setModal(null);
  const confirmSuccess = (title, lines) => setModal({ type: "success", payload: { title, lines } });


  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



  const router = useRouter();
  const auth = getAuth();


  const handleLogout = async () => {
    try {
      await signOut(auth)
        .then(() => {

          useUserID.persist.clearStorage();
          useUserName.persist.clearStorage();
          useUserEmail.persist.clearStorage();
          useUserPhone.persist.clearStorage();
          useUserRole.persist.clearStorage();
          useUserAccountName.persist.clearStorage();

          router.push('/');

        })

    } catch (error) {
      console.error('Logout failed:', error);
    }
  };


  return (
    <div className="relative min-h-screen bg-[#f6f6fb] overflow-x-hidden pb-16">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap');`}</style>

      {/* Purple header */}
      <div className="absolute top-0 left-0 w-full h-[300px] sm:h-[340px] bg-gradient-to-r from-purple-700 to-fuchsia-700 rounded-b-[40px] sm:rounded-b-[60px] shadow-2xl" />
      <div className="absolute top-10 left-6 sm:left-20 w-56 sm:w-64 h-56 sm:h-64 bg-fuchsia-500/20 rounded-full blur-3xl" />
      <div className="absolute top-0 right-4 sm:right-10 w-64 sm:w-72 h-64 sm:h-72 bg-purple-400/20 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14">
        {/* Brand + name/role */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>Pop Services</h1>
          <p className="text-white/85 mt-1 text-base sm:text-lg">Property token marketplace</p>


          <button
            className={`text-white py-2 px-4 rounded-md text-xs sm:text-base
        ${theme === "Dark"
                ? "bg-red-800 hover:bg-red-600"
                : "bg-red-600 hover:bg-red-700"}
      `}
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>

        {/* Role switcher */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/15 backdrop-blur border border-white/20 rounded-full p-1.5 flex gap-1">
     
          </div>
        </div>

        {/* Identity card */}
        <div className="bg-white rounded-[32px] shadow-[0_25px_60px_rgba(124,58,237,0.15)] p-6 sm:p-8 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-purple-500">Signed in as</p>
            <h2 className="text-2xl font-extrabold text-gray-800 mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>
           {bizName}
            </h2>
            <p className="text-gray-400 text-sm capitalize">{role} account</p>
          </div>
          {role === "client" && (
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs text-gray-400 font-semibold">Your balance</p>
                <TokenChip value={620} size="lg" />
              </div>
              <button
                onClick={() => setModal({ type: "buyTokens" })}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-700 to-fuchsia-600 text-white font-bold text-sm hover:scale-105 active:scale-95 transition shadow-lg whitespace-nowrap"
              >
                Buy Tokens
              </button>
            </div>
          )}
          {role === "agent" && (
            <div className="flex gap-2">
              <button onClick={() => setModal({ type: "wallet" })} className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-purple-50 text-purple-700 font-bold text-sm hover:bg-purple-100 transition">
                <Wallet className="w-4 h-4" /> Wallet
              </button>

            </div>
          )}
        </div>

        {/* ---------------- ADMIN VIEW ---------------- */}
        {role === "admin" && (
          <>
            {/* Circulation overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-gradient-to-br from-purple-700 to-fuchsia-600 rounded-3xl p-6 text-white">
                <div className="flex items-center gap-2 text-white/70 text-xs font-bold uppercase tracking-wider mb-2">
                  <Landmark className="w-4 h-4" /> Total Current Amount
                </div>
                <p className="text-3xl font-extrabold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{totalCirculating.toLocaleString()} <span className="text-base font-semibold">tokens</span></p>
                <p className="text-white/70 text-sm mt-1">≈ KES {(totalCirculating * TOKEN_RATE).toLocaleString()} in circulation</p>
              </div>
              <div className="bg-white rounded-3xl p-6 border border-purple-50 shadow-[0_10px_30px_rgba(124,58,237,0.08)]">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <Briefcase className="w-4 h-4" /> Sold To Agents
                </div>
                <p className="text-3xl font-extrabold text-gray-800" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{TOKENS_SOLD_TO_AGENTS.toLocaleString()} <span className="text-base font-semibold text-gray-400">tokens</span></p>
                <p className="text-gray-400 text-sm mt-1">≈ KES {(TOKENS_SOLD_TO_AGENTS * TOKEN_RATE).toLocaleString()} issued to agents</p>
              </div>
            </div>

            {/* Small dashboard: sold, earned, profit margin */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
              <StatCard icon={ArrowUpRight} label="Sold" value={`KES ${(soldValue / 1000).toFixed(0)}K`} sub="Property sales" tone="purple" />
              <StatCard icon={PiggyBank} label="Earned" value={`KES ${earnedValue.toLocaleString()}`} sub="Platform commission" tone="emerald" />
              <StatCard icon={Percent} label="Margin" value={`${profitMargin}%`} sub="Avg. profit margin" tone="amber" />
            </div>

            <button
              onClick={() => setModal({ type: "userList" })}
              className="w-full flex items-center justify-between gap-3 bg-white rounded-3xl p-5 mb-6 border border-purple-50 shadow-[0_10px_30px_rgba(124,58,237,0.08)] hover:border-purple-200 transition text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-extrabold text-gray-800">All Agents & Clients</p>
                  <p className="text-sm text-gray-400">{platformUsers.length} accounts holding tokens</p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-300 -rotate-90" />
            </button>

            {/*

    <div className="bg-white rounded-[32px] shadow-[0_25px_60px_rgba(124,58,237,0.1)] p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="text-lg font-extrabold text-gray-800" style={{ fontFamily: "'Sora', sans-serif" }}>Transactions — All Roles</h3>
                <div className="flex gap-1 bg-gray-100 rounded-full p-1 self-start">
                  {["All", "Admin", "Agent", "Client"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setTxFilter(f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${txFilter === f ? "bg-white text-purple-700 shadow" : "text-gray-400 hover:text-gray-600"}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="text-left text-gray-400 text-xs uppercase tracking-wider">
                      <th className="px-2 py-2 font-bold">Party</th>
                      <th className="px-2 py-2 font-bold">Type</th>
                      <th className="px-2 py-2 font-bold">Amount</th>
                      <th className="px-2 py-2 font-bold">Tokens</th>
                      <th className="px-2 py-2 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => confirmSuccess("Transaction Detail", [
                          ["Reference", t.id], ["Party", `${t.party} (${t.role})`], ["Type", t.type],
                          ["Amount", `KES ${t.amount.toLocaleString()}`], ["Tokens", t.tokens.toLocaleString()], ["Date", t.date],
                        ])}
                        className="border-t border-gray-50 hover:bg-purple-50/50 cursor-pointer transition"
                      >
                        <td className="px-2 py-3 font-semibold text-gray-700">{t.party}<span className="block text-xs text-gray-400 font-normal">{t.role}</span></td>
                        <td className="px-2 py-3 text-gray-500">{t.type}</td>
                        <td className="px-2 py-3 font-semibold text-gray-700" style={{ fontFamily: "'JetBrains Mono', monospace" }}>KES {t.amount.toLocaleString()}</td>
                        <td className="px-2 py-3"><TokenChip value={t.tokens} /></td>
                        <td className="px-2 py-3">
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredTransactions.length === 0 && (
                      <tr><td colSpan={5} className="text-center text-gray-400 py-6">No {txFilter.toLowerCase()} transactions yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

*/
            }


          </>
        )}

        {/* ---------------- AGENT VIEW ---------------- */}
        {role === "agent" && (
          <>
            {
              /*
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            <StatCard icon={Building2} label="Active Listings" value="7" sub="3 pending review" tone="purple" />
                            <StatCard icon={ArrowUpRight} label="Sold This Month" value="4" sub="KES 610K total" tone="emerald" />
                            <StatCard icon={Coins} label="Tokens Earned" value="2,253" sub="After commission" tone="amber" />
                          </div>
              */
            }


            <div className="bg-white rounded-[32px] shadow-[0_25px_60px_rgba(124,58,237,0.1)] p-6 sm:p-8">
              <h3 className="text-lg font-extrabold text-gray-800 mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>Buyers Interested In Your Listings</h3>
              <p className="text-sm text-gray-400 mb-4">Review offers and respond with a counter-bid.</p>
              <div className="space-y-3">
                {buyers.map((b) => (
                  <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gray-50 hover:bg-purple-50/60 transition">
                    <div>
                      <p className="font-bold text-gray-800">{b.name}</p>
                      <p className="text-sm text-gray-400">{b.interest}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <TokenChip value={b.offer} />
                      <button
                        onClick={() => openBid(b.name, b.interest)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition"
                      >
                        <Gavel className="w-3.5 h-3.5" /> View Bid
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ---------------- CLIENT VIEW ---------------- */}
        {role === "client" && (
          <>
            <div className="bg-white rounded-[32px] shadow-[0_25px_60px_rgba(124,58,237,0.1)] p-6 sm:p-8 mb-6">
              <h3 className="text-lg font-extrabold text-gray-800 mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>Sellers On The Market</h3>
              <p className="text-sm text-gray-400 mb-4">Place a bid in tokens on any active listing.</p>
              <div className="space-y-3">
                {sellers.map((s) => (
                  <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gray-50 hover:bg-purple-50/60 transition">
                    <div>
                      <p className="font-bold text-gray-800">{s.name}</p>
                      <p className="text-sm text-gray-400">{s.item}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-gray-400 font-semibold">Asking</p>
                        <TokenChip value={s.asking} />
                      </div>
                      <button
                        onClick={() => openBid(s.name, s.item)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition"
                      >
                        <Gavel className="w-3.5 h-3.5" /> Bid
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/**

   <div className="bg-white rounded-[32px] shadow-[0_25px_60px_rgba(124,58,237,0.1)] p-6 sm:p-8">
              <h3 className="text-lg font-extrabold text-gray-800 mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>Your Transactions</h3>
              <div className="space-y-2">
                {transactions.filter(t => t.role === "Client").map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                        {t.type === "Buy Tokens" ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700 text-sm">{t.type}</p>
                        <p className="text-xs text-gray-400">{t.date}</p>
                      </div>
                    </div>
                    <TokenChip value={t.tokens} />
                  </div>
                ))}
              </div>
            </div>
 */
            }


          </>
        )}
      </div>

      {/* ---------------- MODALS ---------------- */}
      {modal?.type === "buyTokens" && (
        <Modal title="Buy Tokens" subtitle={`${TOKEN_RATE} KES per token`} onClose={closeModal}>
          <div className="flex items-center justify-center gap-4 mb-6">
            <button onClick={() => setTokenQty((q) => Math.max(10, q - 10))} className="w-11 h-11 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600">
              <Minus className="w-4 h-4" />
            </button>
            <div className="text-center">
              <p className="text-4xl font-extrabold text-gray-800" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{tokenQty}</p>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Tokens</p>
            </div>
            <button onClick={() => setTokenQty((q) => q + 10)} className="w-11 h-11 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-purple-50/70 rounded-2xl p-4 mb-6 space-y-2 text-sm">
            <div className="flex justify-between text-gray-500"><span>{tokenQty} tokens × KES {TOKEN_RATE}</span><span style={{ fontFamily: "'JetBrains Mono', monospace" }}>KES {subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-gray-500"><span>Service fee ({SERVICE_FEE_PCT}%)</span><span style={{ fontFamily: "'JetBrains Mono', monospace" }}>KES {fee.toLocaleString()}</span></div>
            <div className="flex justify-between font-extrabold text-gray-800 pt-2 border-t border-purple-100"><span>Total due</span><span style={{ fontFamily: "'JetBrains Mono', monospace" }}>KES {total.toLocaleString()}</span></div>
          </div>

          <PrimaryButton onClick={() => confirmSuccess("Tokens Purchased", [
            ["Tokens bought", tokenQty.toLocaleString()], ["Total paid", `KES ${total.toLocaleString()}`], ["New balance", `${(620 + tokenQty).toLocaleString()} tokens`],
          ])}>
            Confirm Purchase
          </PrimaryButton>
        </Modal>
      )}

      {modal?.type === "bid" && (
        <Modal title="Place a Bid" subtitle={modal.payload.meta} onClose={closeModal}>
          <div className="mb-5">
            <p className="text-sm text-gray-400 mb-1 font-semibold">Bidding on offer from</p>
            <p className="text-lg font-extrabold text-gray-800">{modal.payload.party}</p>
          </div>
          <label className="block text-xs font-bold uppercase tracking-wider text-purple-600 mb-2">Your Bid (tokens)</label>
          <div className="relative mb-6">
            <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500 w-5 h-5" />
            <input
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-100 border border-transparent focus:border-purple-500 focus:bg-white outline-none transition text-sm text-black"
            />
          </div>
          <PrimaryButton onClick={() => { setBidAmount(""); confirmSuccess("Bid Submitted", [["Recipient", modal.payload.party], ["Bid amount", `${bidAmount || 0} tokens`]]); }}>
            Submit Bid
          </PrimaryButton>
        </Modal>
      )}

      {modal?.type === "wallet" && (
        <Modal title="Agent Wallet" subtitle="Tokens earned from closed sales" onClose={closeModal}>
          <div className="bg-gradient-to-br from-purple-700 to-fuchsia-600 rounded-3xl p-6 text-white mb-6">
            <p className="text-xs uppercase tracking-wider text-white/70 font-bold">Available Balance</p>
            <p className="text-4xl font-extrabold mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>2,253 <span className="text-lg font-semibold">tokens</span></p>
            <p className="text-white/70 text-sm mt-1">≈ KES {(2253 * TOKEN_RATE).toLocaleString()}</p>
          </div>
          <div className="space-y-2 mb-6">


            {transactions.filter(t => t.role === "Agent").map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <div>
                  <p className="font-semibold text-gray-700 text-sm">{t.type}</p>
                  <p className="text-xs text-gray-400">{t.date}</p>
                </div>
                <TokenChip value={t.tokens} />
              </div>
            ))}
          </div>
          <button className="w-full py-3.5 rounded-2xl bg-purple-50 text-purple-700 font-bold hover:bg-purple-100 transition">
            Withdraw to M-Pesa
          </button>
        </Modal>
      )}

      {modal?.type === "sellable" && (
        <Modal title="What Can I Sell?" subtitle="Categories you're licensed to list" onClose={closeModal}>
          <div className="space-y-3">
            {sellableCategories.map((c) => (
              <div key={c.name} className="p-4 rounded-2xl border border-purple-100 hover:border-purple-300 transition">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-gray-800">{c.name}</p>
                  <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">{c.commission} commission</span>
                </div>
                <p className="text-sm text-gray-400">{c.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <PrimaryButton onClick={() => confirmSuccess("Listing Started", [["Next step", "Upload title deed & photos"]])}>
              <span className="flex items-center justify-center gap-2"><ShoppingBag className="w-4 h-4" /> Start a New Listing</span>
            </PrimaryButton>
          </div>
        </Modal>
      )}

      {modal?.type === "userList" && (
        <Modal title="All Agents & Clients" subtitle="Every account and its live token balance" onClose={closeModal}>
          <div className="space-y-2">
            {platformUsers.map((u) => (
              <div key={u.name} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${u.role === "Agent" ? "bg-purple-50 text-purple-600" : "bg-fuchsia-50 text-fuchsia-600"}`}>
                    {u.role === "Agent" ? <Briefcase className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 text-sm">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.role}</p>
                  </div>
                </div>
                <TokenChip value={u.tokens} />
              </div>
            ))}
          </div>
        </Modal>
      )}

      {modal?.type === "success" && (
        <Modal title={modal.payload.title} onClose={closeModal}>
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-9 h-9 text-emerald-500" />
            </div>
            <p className="text-gray-400 text-sm">Everything went through — here's the summary.</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm mb-6">
            {modal.payload.lines.map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-gray-400">{k}</span>
                <span className="font-semibold text-gray-700" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{v}</span>
              </div>
            ))}
          </div>
          <PrimaryButton onClick={closeModal}>Done</PrimaryButton>
        </Modal>
      )}
    </div>
  );
}

export default Homepage