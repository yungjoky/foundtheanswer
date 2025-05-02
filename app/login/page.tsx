"use client"
import React, { useState } from "react";
import { createClient } from "../utils/supabase/client";
import { useRouter } from "next/navigation";
import Squares from "../components/Squares";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      router.push("/posts");
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0">
        <Squares speed={0.1} squareSize={40} direction="diagonal" borderColor="#080808" hoverFillColor="#000" />
      </div>
      
      <form
        onSubmit={handleLogin}
        className="relative z-10 bg-white/10 border border-white/20 backdrop-blur-md p-8 rounded-xl shadow-2xl flex flex-col w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Login</h2>
        <input
          type="email"
          placeholder="Email"
          className="mb-4 p-3 rounded bg-[#181818] text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="mb-4 p-3 rounded bg-[#181818] text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-red-500 mb-2 text-center">{error}</p>}
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        <p className="text-gray-400 mt-4 text-center text-sm">
          Don&apos;t have an account? <a href="/register" className="text-blue-400 hover:underline">Register</a>
        </p>
      </form>
    </main>
  );
}
