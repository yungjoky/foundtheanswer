"use client"
import React, { useState } from "react";
import { createClient } from "../utils/supabase/client";
import { useRouter } from "next/navigation";
import Squares from "../components/Squares";
export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      const user = data?.user;
      if (user) {
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();
        if (!existingProfile) {
          await supabase.from("profiles").insert({
            id: user.id,
            username: username
          });
        }
      }
      router.push("/login");
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-black">
      <div className="pointer-events-none absolute inset-0 z-0">
        <Squares speed={0.1} squareSize={40} direction="diagonal" borderColor="#080808" hoverFillColor="#000" />
      </div>
      <form
        onSubmit={handleRegister}
        className="relative z-10 bg-[#101010]/80 backdrop-blur p-8 rounded-lg shadow-lg flex flex-col w-full max-w-sm border border-gray-800"
      >
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Register</h2>
        <input
          type="email"
          placeholder="Email"
          className="mb-4 p-3 rounded bg-[#181818] text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Username"
          className="mb-4 p-3 rounded bg-[#181818] text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={username}
          onChange={e => setUsername(e.target.value)}
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
          {loading ? "Registering..." : "Register"}
        </button>
        <p className="text-gray-400 mt-4 text-center text-sm">
          Already have an account? <a href="/login" className="text-blue-400 hover:underline">Login</a>
        </p>
      </form>
    </main>
  );
}
