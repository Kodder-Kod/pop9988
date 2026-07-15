"use client"

import React, { useState } from 'react';
import { db } from "../../../config";
import { ref, push } from 'firebase/database';
import { createUserWithEmailAndPassword, sendEmailVerification, getAuth } from 'firebase/auth';
import { FaBuilding, FaUser } from "react-icons/fa";
import { MdEmail } from "react-icons/md"
import { GiPadlock, GiDialPadlock } from "react-icons/gi";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { FaPhoneAlt, FaUserTie } from "react-icons/fa";
import { useRouter } from 'next/navigation';
import { useUserAccountName, useUserEmail, useUserID, useUserName, useUserPhone, useUserRole } from '../../components/zustand/profile';
import Link from 'next/link';
import { useUserTheme } from '../../components/zustand/theme';

const Register = () => {
    const auth = getAuth();
    const router = useRouter();

    const [adminName, setAdminName] = useState('');
    const [role, setRole] = useState('');
    const [adminRealName, setAdminRealName] = useState('');
    const [adminPhone, setAdminPhone] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [confirmpass, setConfirmpass] = useState('');
    const [errorMessage, setErrorMessage] = useState("");

    const theme = useUserTheme((state) => state.userTheme);

    const [showPassword, setShowPassword] = useState(false);

    const registerUser = async () => {
        if ( !adminName || !adminPhone || !adminEmail || !adminPassword || !confirmpass) {
            setErrorMessage("All fields are required!");
            return;
        }
        if (adminPassword.length < 6) {
            setErrorMessage("Password must be at least 6 characters!");
            return;
        }
        if (adminPassword !== confirmpass) {
            setErrorMessage("Passwords do not match!");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
            const user = userCredential.user;

            try {
                await sendEmailVerification(user, {
                    handleCodeInApp: true,
                    url: "https://popservices001-50375-default-rtdb.firebaseio.com",
                });
            } catch (err) {
                console.log("Verification email error:", err);
            }

            const dbRef = ref(db, `web/pos/`);
            const newAdminRef = await push(dbRef, {
                Name: adminName,
                Phone: adminPhone,
                Email: adminEmail,
                Amount: "0",
            });

            const userAccountId = newAdminRef.key;

            useUserID.setState({ userID: userAccountId });
            useUserEmail.setState({ userEmail: adminEmail });
            useUserPhone.setState({ userPhone: adminPhone });
            useUserName.setState({ userName: adminName });
            useUserAccountName.setState({ userAccountName: adminRealName });
            useUserRole.setState({ userRole: role });

            const newbranchRef1 = push(ref(db, `user/accounts/`), {
                Email: adminEmail,
                Id: userAccountId,
                Phone: adminPhone,
                Name: adminName,
                UserName: adminRealName,
                Password: adminPassword,
                Role: role,
                CreatedAt: Date.now(),
            });

            const newCreditKey1 = newbranchRef1.key;
       
            setErrorMessage("");
            router.push('/');

            setAdminName('');
            setAdminRealName('');
            setAdminPhone('');
            setAdminEmail('');
            setAdminPassword('');
            setConfirmpass('');

        } catch (error) {
            console.log("Registration error:", error.message);
            if (error.message.includes("email-already")) {
                setErrorMessage("Email already exists!");
            } else {
                setErrorMessage("Registration failed. Try again.");
            }
        }
    };

    return (


        <div className="relative min-h-screen bg-[#f6f6fb] overflow-hidden">

            {/* Purple Header */}
            <div className="absolute top-0 left-0 w-full h-[340px] bg-gradient-to-r from-purple-700  to-purple-700 rounded-b-[60px] shadow-2xl"></div>

            {/* Decorative Glow */}
            <div className="absolute top-10 left-20 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-[120px]"></div>
            <div className="absolute top-0 right-10 w-72 h-72 bg-purple-400/20 rounded-full blur-[150px]"></div>

            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-5 py-12">

                {/* Header/Logo Section */}
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-extrabold text-white">
                        Pop Services
                    </h1>
                    <p className="text-white/90 mt-2 text-lg">
                        Secure Portal
                    </p>
                </div>

                {/* Main Register Card */}
                <div className="bg-white rounded-[40px] shadow-[0_25px_60px_rgba(124,58,237,0.15)] p-8 sm:p-10 w-full max-w-2xl">

                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-800">
                            Create Account
                        </h2>
                        <p className="text-gray-500 mt-2">
                            Register an account to start managing your Tokens.
                        </p>
                    </div>

                    {/* Error Message */}
                    {errorMessage && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">
                            {errorMessage}
                        </div>
                    )}

                    {/* FORM GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* Account Type / Role Dropdown */}
                        <div>
                            <label className="block text-sm font-bold tracking-wider uppercase text-purple-600 mb-2">
                                Account Type
                            </label>
                            <div className="relative">
                                <FaUserTie className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-purple-500 pointer-events-none" />
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full pl-12 pr-10 py-4 rounded-2xl bg-gray-100 border border-transparent focus:border-purple-500 focus:bg-white outline-none transition text-sm text-black appearance-none cursor-pointer font-medium"
                                >

                                    <option value="">Select Role</option>
                                    <option value="client">Client</option>
                                    <option value="agent">Agent</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 font-bold">
                                    ▼
                                </div>
                            </div>
                        </div>


                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-bold tracking-wider uppercase text-purple-600 mb-2">
                                Phone
                            </label>
                            <div className="relative">
                                <FaPhoneAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-purple-500" />
                                <input
                                    type="text"
                                    placeholder="Enter Phone Number"
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-100 border border-transparent focus:border-purple-500 focus:bg-white outline-none transition text-sm text-black"
                                    value={adminPhone}
                                    onChange={(e) => setAdminPhone(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Owner */}
                        <div>
                            <label className="block text-sm font-bold tracking-wider uppercase text-purple-600 mb-2">
                                Full Name
                            </label>
                            <div className="relative">
                                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-purple-500" />
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-100 border border-transparent focus:border-purple-500 focus:bg-white outline-none transition text-sm text-black"
                                    value={adminName}
                                    onChange={(e) => setAdminName(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-bold tracking-wider uppercase text-purple-600 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <MdEmail className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-purple-500" />
                                <input
                                    type="email"
                                    placeholder="admin@hotel.com"
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-100 border border-transparent focus:border-purple-500 focus:bg-white outline-none transition text-sm text-black"
                                    value={adminEmail}
                                    onChange={(e) => setAdminEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-bold tracking-wider uppercase text-purple-600 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <GiPadlock className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-purple-500" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="6+ chars"
                                    className="w-full pl-12 pr-12 py-4 rounded-2xl bg-gray-100 border border-transparent focus:border-purple-500 focus:bg-white outline-none transition text-sm text-black"
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-600"
                                >
                                    {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-bold tracking-wider uppercase text-purple-600 mb-2">
                                Confirm
                            </label>
                            <div className="relative">
                                <GiDialPadlock className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-purple-500" />
                                <input
                                    type="password"
                                    placeholder="Repeat password"
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-100 border border-transparent focus:border-purple-500 focus:bg-white outline-none transition text-sm text-black"
                                    value={confirmpass}
                                    onChange={(e) => setConfirmpass(e.target.value)}
                                />
                            </div>
                        </div>

                    </div>

                    {/* Register Action Button */}
                    <div className="mt-8">
                        <button
                            onClick={registerUser}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-700 via-fuchsia-600 to-purple-700 text-white font-bold text-lg hover:scale-[1.02] active:scale-95 transition shadow-xl"
                        >
                            Create Account
                        </button>
                    </div>

                    {/* Alternate Link Footer */}
                    <p className="text-center mt-6 text-gray-500 text-sm">
                        Already registered?{" "}
                        <Link href="/user/login" className="text-purple-600 hover:text-purple-800 font-bold transition">
                            Log In
                        </Link>
                    </p>

                    {/* Footer Notice */}
                    <div className="mt-8 pt-6 border-t text-center border-gray-100">
                        <p className="text-gray-400 text-sm">
                            © 2026 Pop Services. All Rights Reserved.
                        </p>
                    </div>

                </div>
            </div>
        </div>

    );
};

export default Register;
