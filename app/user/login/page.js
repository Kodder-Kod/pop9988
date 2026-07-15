"use client"

import React, { useState } from 'react';
import { db } from "../../../config";
import { signInWithEmailAndPassword, sendPasswordResetEmail, getAuth } from "firebase/auth";
import { ref, get } from 'firebase/database';
import { useUserAccountName, useUserEmail, useUserID, useUserName, useUserPhone, useUserRole } from '../../components/zustand/profile';
import { MdEmail } from "react-icons/md";
import { GiPadlock } from "react-icons/gi";
import { useUserTheme } from '../../components/zustand/theme';
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import Link from 'next/link';

const LogIn = () => {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [forgotemail, setForgetemail] = useState("");
    const [isModalOpen, setModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const theme = useUserTheme((state) => state.userTheme);
    const auth = getAuth();

    const handleForgotPassword = () => setModalOpen(true);
    const closeModal = () => setModalOpen(false);



    const changepassword = async () => {
        if (!forgotemail) return;
        try {
            await sendPasswordResetEmail(auth, forgotemail);
            setForgetemail("");
            setErrorMessage("Reset link sent!");
        } catch (error) {
            console.log("error on reset", error);
            setForgetemail("");
            setErrorMessage("Failed to send reset link!");
        }
    };


    const LoginUser = async () => {
        if (!name || !password) {
            setErrorMessage("Email and Password are required!");
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, name, password);
            const user = userCredential.user;

            setErrorMessage("");
            setName('');
            setPassword('');

            await fetchRole(name);

        } catch (error) {
            console.log(error.message);
            setErrorMessage("Invalid email or password!");
            setName('');
            setPassword('');
        }
    };

    const fetchRole = async (email) => {
        const snapshot = await get(ref(db, `user/accounts/`));
        const data = snapshot.val();

        if (data) {
            let emailUser = null, id = null, accountUser = null, nameUser = null, phoneUser = null, roleUser = null;
            Object.entries(data).forEach(([key, value]) => {
                if (value.Email === email) {
                    emailUser = value.Email;
                    nameUser = value.Name;
                    phoneUser = value.Phone;
                    id = value.Id;
                    roleUser = value.Role;
                    accountUser = value.UserName
                }
            });
            useUserID.setState({ userID: id });
            useUserEmail.setState({ userEmail: emailUser });
            useUserPhone.setState({ userPhone: phoneUser });
            useUserName.setState({ userName: nameUser });
            useUserAccountName.setState({ userAccountName: accountUser });
            useUserRole.setState({ userRole: roleUser });

        }

    };


    const [showPassword, setShowPassword] = useState(false);

    return (


        <div className="relative min-h-screen bg-[#f6f6fb] overflow-hidden">

            {/* Purple Header */}
            <div className="absolute top-0 left-0 w-full h-[340px] bg-gradient-to-r from-purple-700 to-purple-700 rounded-b-[60px] shadow-2xl"></div>

            {/* Decorative Glow */}
            <div className="absolute top-10 left-20 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-[120px]"></div>
            <div className="absolute top-0 right-10 w-72 h-72 bg-purple-400/20 rounded-full blur-[150px]"></div>

            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-5">

                {/* Logo */}
                <div className="mb-10 text-center">
                 

                    <h1 className="text-4xl mt-20 font-extrabold text-white">
                        Pop Services
                    </h1>

                    <p className="text-white/90 mt-2 text-lg">
                        Secure Business Portal
                    </p>

                </div>

                {/* Login Card */}

                <div className="bg-white rounded-[40px] shadow-[0_25px_60px_rgba(124,58,237,0.15)] p-10 w-full max-w-md">

                    <div className="mb-8">

                        <h2 className="text-3xl font-bold text-gray-800">
                            Welcome Back
                        </h2>

                        <p className="text-gray-500 mt-2">
                            Sign in to continue to your dashboard.
                        </p>

                    </div>

                    {/* Error */}

                    {errorMessage && (

                        <div className="mb-5 bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">

                            {errorMessage}

                        </div>

                    )}

                    <div className="space-y-6">

                        {/* Email */}

                        <div>

                            <label className="block text-sm font-bold tracking-wider uppercase text-purple-600 mb-2">

                                Email Address

                            </label>

                            <div className="relative">

                                <MdEmail className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-purple-500" />

                                <input
                                    type="email"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="example@company.com"
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-100 border border-transparent focus:border-purple-500 focus:bg-white outline-none transition"
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
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-12 py-4 rounded-2xl bg-gray-100 border border-transparent focus:border-purple-500 focus:bg-white outline-none transition"
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

                        {/* Login Button */}

                        <button
                            onClick={LoginUser}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-700 via-fuchsia-600 to-purple-700 text-white font-bold text-lg hover:scale-[1.02] active:scale-95 transition shadow-xl"
                        >

                            Sign In

                        </button>

                    </div>

                    {/* Forgot */}

                    <button
                        onClick={handleForgotPassword}
                        className="block mx-auto mt-6 text-purple-600 hover:text-purple-800 font-medium transition"
                    >

                        Forgot Password?

                    </button>


                           {/* Create Account */}

                    <p className="text-center mt-3 text-gray-500 text-sm">

                        No account?{" "}

                          <Link href="/user/register   " className="text-purple-600 hover:text-purple-800 font-bold transition">
                              Create account
                        </Link>

                    </p>

                    {/* Footer */}

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

export default LogIn;
