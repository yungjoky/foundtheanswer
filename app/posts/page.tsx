"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "../utils/supabase/client";
import Squares from "../components/Squares";
import Link from "next/link";
import Image from "next/image";

interface Post {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  likes?: number;
  profiles?: {
    username?: string;
    avatar_url?: string;
  };
}

// Add a type for Like
interface Like {
  id: string;
  post_id: string;
  user_id: string | null;
  ip_address: string | null;
}

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

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [likes, setLikes] = useState<{ [postId: string]: Like | undefined }>({});
  const [userProfile, setUserProfile] = useState<{ username?: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user as SupabaseUser | null);
      if (data.user) {
        const { data: likeData } = await supabase
          .from("likes")
          .select("id, post_id, user_id, ip_address")
          .eq("user_id", data.user.id);
        const likeMap: { [postId: string]: Like } = {};
        (likeData || []).forEach((like: Like) => {
          likeMap[like.post_id] = like;
        });
        setLikes(likeMap);
      }
    });
    fetchPosts();
    fetchPopularPosts();
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const supabase = createClient();
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();
        setUserProfile(profile);
      }
    };
    fetchUserProfile();
  }, [user]);

  const fetchPosts = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("posts")
      .select(`id, user_id, content, created_at, likes, profiles:profiles(username, avatar_url)`)
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
      console.error("Error fetching posts:", error);
    }
    setPosts(
      (data || []).map(post => ({
        ...post,
        profiles: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
      }))
    );
  };

  const fetchPopularPosts = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("posts")
      .select(`id, user_id, content, created_at, likes, profiles:profiles(username, avatar_url)`)
      .order("likes", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) {
      setError(error.message);
      console.error("Error fetching popular posts:", error);
    }
    setPopularPosts(
      (data || []).map(post => ({
        ...post,
        profiles: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
      }))
    );
  };

  const handleLikePost = async (postId: string) => {
    const supabase = createClient();
    const userId = user?.id || null;
    if (!userId) return;
    const { data: likeData } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!likeData) {
      await supabase.from("likes").insert({ post_id: postId, user_id: userId });
    } else {
      await supabase.from("likes").delete().eq("id", likeData.id);
    }
    const { count } = await supabase.from("likes").select("*", { count: "exact", head: true }).eq("post_id", postId);
    await supabase.from("posts").update({ likes: count }).eq("id", postId);
    const { data: likeDataNew } = await supabase
      .from("likes")
      .select("id, post_id, user_id, ip_address")
      .eq("user_id", userId);
    const likeMap: { [postId: string]: Like } = {};
    (likeDataNew || []).forEach((like: Like) => {
      likeMap[like.post_id] = like;
    });
    setLikes(likeMap);
    fetchPosts();
    fetchPopularPosts();
  };

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    if (!user) {
      setError("You must be logged in to post.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.from("posts").insert({
      content,
      user_id: user.id
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setContent("");
      fetchPosts();
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) {
      setError(error.message);
    } else {
      setPosts(posts => posts.filter(p => p.id !== postId));
      setPopularPosts(posts => posts.filter(p => p.id !== postId));
    }
  };

  function parsePostContent(content: string) {
    const urlRegex = /\[url=(https:\/\/(imgur\.com|fbi-scanner\.live\/f)\/[^\]]+)\]([^\[]+?)\[\/url\]/g;
    const parts: (string | React.JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    while ((match = urlRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }
      parts.push(
        <a
          key={match[1] + match.index}
          href={match[1]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 underline hover:text-blue-300 break-all"
        >
          {match[3]}
        </a>
      );
      lastIndex = urlRegex.lastIndex;
    }
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }
    return parts;
  }

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center bg-black py-10 overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 z-0">
        <Squares speed={0.1} squareSize={40} direction="diagonal" borderColor="#080808" hoverFillColor="#000" />
      </div>
      <div className="relative w-full max-w-4xl flex flex-col items-center z-10">
        <div className="relative w-full flex bg-white/10 border border-white/20 rounded-2xl shadow-2xl backdrop-blur-md" style={{ minHeight: 400 }}>
          <div className="flex-1 p-8 flex flex-col justify-between min-w-[320px]">
            <div>
              <h2 className="text-lg font-bold text-white mb-4 text-left">Share something</h2>
              {user && (
                <form onSubmit={handleAddPost} className="mb-6 flex flex-col gap-2">
                  <textarea
                    className="p-3 rounded bg-black/40 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur"
                    placeholder="What's on your mind?"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    required
                    rows={3}
                  />
                  {error && <p className="text-red-500 text-center">{error}</p>}
                  <button
                    type="submit"
                    className="self-end bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded transition disabled:opacity-50 shadow-lg"
                    disabled={loading}
                  >
                    {loading ? "Posting..." : "Add Post"}
                  </button>
                </form>
              )}
            </div>
          </div>
          <div className="w-80 border-l border-white/20 p-8 flex flex-col justify-between bg-black/30 backdrop-blur rounded-r-2xl">
            {user ? (
              <div className="flex flex-col items-center mb-8">
                <Image
                  src={user.user_metadata?.avatar_url || "/file.svg"}
                  alt="Profile"
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full border-2 border-blue-500 mb-2 shadow-lg"
                />
                <span className="text-white font-semibold text-lg mb-1">
                  {userProfile?.username || user.user_metadata?.username || user.email}
                </span>
                <Link href="/profile">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-4 rounded mb-4 shadow w-full">Profile Settings</button>
                </Link>
              </div>
            ) : (
              <div className="text-gray-400 text-center mb-8">Not logged in</div>
            )}
            <div className="border border-white/20 rounded-xl bg-white/10 p-4 w-full backdrop-blur shadow-lg">
              <div className="font-bold text-blue-400 mb-2 text-center">Most Popular Fixes</div>
              {popularPosts.length === 0 && <div className="text-gray-500 text-sm text-center">No popular posts yet.</div>}
              <ul className="space-y-2">
                {popularPosts.map(post => (
                  <li key={post.id}>
                    <Link href={`/posts/${post.id}`} className="block text-white text-sm border-b border-white/10 pb-1 last:border-b-0 hover:text-blue-400 transition-colors">
                      <span className="font-semibold">{post.content.slice(0, 40)}{post.content.length > 40 ? "..." : ""}</span>
                      <span className="text-blue-400 ml-2">({post.likes || 0} likes)</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="w-full max-w-4xl mt-8 space-y-4">
          {posts.length === 0 && (
            <p className="text-gray-400 text-center">No posts yet.</p>
          )}
          {posts.map(post => (
            <div key={post.id} className={`bg-white/10 border border-white/20 rounded-xl p-4 shadow-lg backdrop-blur relative transition-all duration-300`}>
              {user && post.user_id === user.id && (
              <button
                onClick={() => handleDeletePost(post.id)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                title="Delete post"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              )}
              <div className="flex items-center mb-2">
              <Image
                src={post.profiles?.avatar_url || "/file.svg"}
                alt="avatar"
                width={32}
                height={32}
                className="w-8 h-8 rounded-full border border-blue-500 mr-2 object-cover"
              />
              <span className="text-white font-semibold text-sm">{post.profiles?.username || "User"}</span>
              </div>
              <p className="text-white whitespace-pre-line">
              {parsePostContent(post.content).map((part, i) => (
                <React.Fragment key={i}>{part}</React.Fragment>
              ))}
              </p>
              <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-300">{new Date(post.created_at).toLocaleString()}</span>
              <div className="flex items-center gap-2">
                <button
                onClick={() => handleLikePost(post.id)}
                className={`text-blue-400 hover:text-blue-600 focus:outline-none ${likes[post.id] ? 'font-bold underline' : ''}`}
                title={likes[post.id] ? "Unlike" : "Like"}
                >
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" className="w-5 h-5 inline">
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 18.343l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
                </button>
                <span className="text-xs text-blue-400">{post.likes || 0} likes</span>
              </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
