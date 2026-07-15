"use client";

import { useState } from "react";

const HomepageTest = () => {
    const [amount, setAmount] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/mpesa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phoneNumber,
                    total: amount, // send amount as total
                }),
            });

            const data = await res.json();
            console.log(data);
            alert(data.message);
        } catch (err) {
            console.error(err);
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const sendMpesaFun = () => {
        setAmount("");
        setPhoneNumber("");
    };

    return (
        <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-4">
            {/* Decorative Background Element (Optional) */}
            <div className="fixed top-0 left-0 w-full h-1/3 bg-purple-700 rounded-b-[3rem] shadow-lg"></div>

            <div className="relative w-full max-w-md">
                {/* Branding Section */}
                <div className="text-center mb-10 text-white">
                    <h1 className="text-lg sm:text-3xl  font-extrabold tracking-tight mb-2">
                        Pop Services
                    </h1>
                    <p className="text-purple-100 opacity-90 text-sm sm:text-base ">
                        Secure Payment Gateway
                    </p>
                </div>

                {/* Main Form Card */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-purple-200/50 p-8 md:p-10 border border-purple-50">

                    <div className="space-y-6">
                        {/* Amount Field */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-purple-500 mb-3 ml-1">
                                Transaction Amount
                            </label>
                            <div className="group relative">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <span className="text-gray-400 font-semibold">Ksh</span>
                                </div>
                                <input
                                    type="number"
                                    min="1"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                    className="w-full pl-16 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl 
                         text-gray-900 sm:text-lg text-sm font-medium transition-all
                         focus:bg-white focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/10
                         placeholder:text-gray-300"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {/* Phone Field */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-purple-500 mb-3 ml-1">
                                M-Pesa Number
                            </label>
                            <div className="relative">
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    required
                                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl 
                         text-gray-900 text-sm sm:text-lg font-medium transition-all
                         focus:bg-white focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/10
                         placeholder:text-gray-300"
                                    placeholder="07XX XXX XXX"
                                />
                            </div>
                            <p className="mt-2 text-[11px] text-gray-400 ml-1">
                                Enter the registered number for payment prompts.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-4 space-y-4">
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl
                       sm:text-lg text-sm font-bold shadow-xl shadow-purple-200 active:scale-[0.97] 
                       transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    "Pay Now"
                                )}
                            </button>

                            <button
                                onClick={sendMpesaFun}
                                className="w-full py-3 text-gray-400 hover:text-purple-600 font-medium transition-colors  sm:text-lg text-sm"
                            >
                                Cancel Transaction
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-8 text-center text-gray-400 text-xs">
                    &copy; {new Date().getFullYear()}  Pop Services. All rights reserved.
                </div>
            </div>
        </div>
    );
}


export default HomepageTest