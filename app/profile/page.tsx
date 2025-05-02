"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "../utils/supabase/client";
import Squares from "../components/Squares";
import Image from "next/image";

interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: {
    username?: string;
    avatar_url?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export default function ProfilePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUser(data.user as unknown as SupabaseUser);
        setEmail(data.user.email || "");
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", data.user.id)
          .single();
        setUsername(profile?.username || "");
        setAvatarUrl(profile?.avatar_url || "");
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    if (!user) return;
    const { error } = await supabase.from('profiles').update({ username }).eq('id', user.id);
    if (error) {
      setMessage(error.message);
    } else {
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .single();
      setUsername(profile?.username || "");
      setAvatarUrl(profile?.avatar_url || "");
      setMessage("Profile updated!");
      if (fetchError) {
        setMessage("Profile updated, but failed to fetch new data: " + fetchError.message);
      }
    }
    setLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const supabase = createClient();
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    setMessage("");
    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${user.id}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    if (uploadError) {
      setMessage("Failed to upload avatar.");
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    if (data?.publicUrl) {
      const cacheBustedUrl = data.publicUrl + "?t=" + Date.now();
      setAvatarUrl(cacheBustedUrl);
      await supabase.from('profiles').update({ avatar_url: cacheBustedUrl }).eq('id', user.id);
      await supabase.auth.updateUser({ data: { avatar_url: cacheBustedUrl } });
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData.user as unknown as SupabaseUser);
      setMessage("Avatar uploaded!");
    }
    setUploading(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage("");
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (signInError) {
      setPasswordMessage("Current password is incorrect.");
      setPasswordLoading(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    if (error) {
      setPasswordMessage(error.message);
    } else {
      setPasswordMessage("Password updated!");
      setCurrentPassword("");
      setNewPassword("");
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-black">
      <div className="pointer-events-none absolute inset-0 z-0">
        <Squares speed={0.1} squareSize={40} direction="diagonal" borderColor="#080808" hoverFillColor="#000" />
      </div>
      <div className="relative z-10 w-full max-w-md bg-white/10 border border-white/20 rounded-2xl shadow-2xl backdrop-blur-md p-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold text-white mb-6">Edit Profile</h1>
        <form onSubmit={handleSave} className="w-full flex flex-col gap-4">
          <div className="flex flex-col items-center mb-4">
            <label htmlFor="avatar-upload" className="cursor-pointer">
              <Image
                src={avatarUrl || "/file.svg"}
                alt="Profile"
                width={80}
                height={80}
                className="w-20 h-20 rounded-full border-2 border-blue-500 mb-2 shadow-lg bg-black/40 object-cover"
              />
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploading}
            />       
          </div>
          <label className="text-white font-semibold">Username</label>
          <input
            type="text"
            className="p-3 rounded bg-black/40 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <label className="text-white font-semibold">Email</label>
          <input
            type="email"
            className="p-3 rounded bg-black/40 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            disabled
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded shadow-lg mt-4 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          {message && <p className="text-center text-blue-400 mt-2">{message}</p>}
        </form>
        <form onSubmit={handlePasswordChange} className="w-full flex flex-col gap-4 mt-8">
          <h2 className="text-lg font-bold text-white mb-2">Change Password</h2>
          <input
            type="password"
            className="p-3 rounded bg-black/40 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Current Password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            required
          />
          <input
            type="password"
            className="p-3 rounded bg-black/40 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="New Password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded shadow-lg disabled:opacity-50"
            disabled={passwordLoading}
          >
            {passwordLoading ? "Changing..." : "Change Password"}
          </button>
          {passwordMessage && <p className="text-center text-blue-400 mt-2">{passwordMessage}</p>}
        </form>
      </div>
    </main>
  );
}
