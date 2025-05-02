'use client'
import React from "react";
import Squares from "./components/Squares";
import { createClient } from "./utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  const handleFindFix = async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      router.push("/posts");
    } else {
      router.push("/register");
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-30 bg-black/60 backdrop-blur-md py-3 shadow-md">
        <div className="flex justify-center items-center gap-8">
          <Link href="/" className="text-white text-lg font-semibold hover:text-blue-400 transition">Home</Link>
          <Link href="/posts" className="text-white text-lg font-semibold hover:text-blue-400 transition">Posts</Link>
          <Link href="/register" className="text-white text-lg font-semibold hover:text-blue-400 transition">Register</Link>
          <Link href="/login" className="text-white text-lg font-semibold hover:text-blue-400 transition">Login</Link>
        </div>
      </nav>
      <main className="relative min-h-screen overflow-hidden bg-black flex items-center justify-center">
        <div className="pointer-events-none absolute inset-0 z-0">
          <Squares speed={0.1} squareSize={40} direction="diagonal" borderColor="#080808" hoverFillColor="#000" />
        </div>
        <div className="pointer-events-none absolute top-[-4rem] left-1/2 -translate-x-1/2 z-10 w-[600px] h-[400px]" style={{ filter: 'blur(80px)' }}>
          <div className="w-full h-full bg-gradient-to-b from-blue-500/80 via-blue-400/40 to-transparent rounded-full opacity-80" />
        </div>
        <section className="relative z-20 flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-5xl font-bold text-white drop-shadow-[0_0_40px_rgba(80,180,255,0.4)]">
            Welcome to <span className="animate-fadeUpGlow inline-block">&apos; Stuff I didn&apos;t Find Online &apos;</span>
          </h1>
          <p className="mt-4 text-lg text-gray-300">Dedicated to helping you fix stuff you haven&apos;t found the solution to 😎</p>
          <button
            onClick={handleFindFix}
            className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg text-lg transition-all backdrop-blur border border-blue-400/40"
          >
            Find the fix for your issue now
          </button>
        </section>
      </main>
    </>
  );
}
