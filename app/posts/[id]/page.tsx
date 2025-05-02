'use client'
import React, { useEffect, useState } from "react";
import { createClient } from "../../utils/supabase/client";
import Squares from "../../components/Squares";
import { useParams } from "next/navigation";
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

interface Like {
  id: string;
  post_id: string;
  user_id: string | null;
  ip_address: string | null;
}

export default function PostDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<unknown>(null);
  const [like, setLike] = useState<Like | null>(null);

  const unwrappedParams = { id };

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError("");
      const supabase = createClient();
      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select("id, user_id, content, created_at, likes, profiles:profiles(username, avatar_url)")
        .eq("id", unwrappedParams.id)
        .single();
      if (postError) {
        setError("Post not found");
        setLoading(false);
        return;
      }
      setPost({
        ...postData,
        profiles: Array.isArray(postData.profiles) ? postData.profiles[0] : postData.profiles
      });
      setLoading(false);
    };
    fetchPost();
  }, [unwrappedParams.id]);

  useEffect(() => {
    const fetchUserAndLike = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      if (data.user) {
        const { data: likeData } = await supabase
          .from("likes")
          .select("id, post_id, user_id, ip_address")
          .eq("post_id", unwrappedParams.id)
          .eq("user_id", data.user.id)
          .maybeSingle();
        setLike(likeData || null);
      }
    };
    fetchUserAndLike();
  }, [unwrappedParams.id]);

  const handleLikeToggle = async () => {
    if (!user || !post) return;
    const supabase = createClient();
    if (!like) {
      await supabase.from("likes").insert({ post_id: post.id, user_id: (user as { id: string }).id });
    } else {
      await supabase.from("likes").delete().eq("id", like.id);
    }
    const { count } = await supabase.from("likes").select("*", { count: "exact", head: true }).eq("post_id", post.id);
    await supabase.from("posts").update({ likes: count }).eq("id", post.id);
    const { data: likeData } = await supabase
      .from("likes")
      .select("id, post_id, user_id, ip_address")
      .eq("post_id", post.id)
      .eq("user_id", (user as { id: string }).id)
      .maybeSingle();
    setLike(likeData || null);
    const { data: postData } = await supabase
      .from("posts")
      .select("likes")
      .eq("id", post.id)
      .single();
    setPost(prev => prev ? { ...prev, likes: postData?.likes } : prev);
  };

  function parsePostContent(content: string) {
    const urlRegex = /\[url=(https:\/\/(imgur\.com|fbi-scanner\.live\/f)\/[^"]*)\]([^\[]+?)\[\/url\]/g;
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
      <div className="relative w-full max-w-2xl flex flex-col items-center z-10">
        {loading ? (
          <div className="text-white text-center">Loading...</div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : post ? (
          <div className="w-full bg-white/10 border border-white/20 rounded-xl p-6 shadow-lg backdrop-blur mb-8">
            <div className="flex items-center mb-4">
              <Image
                src={post.profiles?.avatar_url || "/file.svg"}
                alt="avatar"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full border border-blue-500 mr-3 object-cover"
              />
              <span className="text-white font-semibold text-base">{post.profiles?.username || "User"}</span>
              <span className="ml-auto text-xs text-gray-300">{new Date(post.created_at).toLocaleString()}</span>
            </div>
            <div className="text-white text-lg whitespace-pre-line mb-2">{parsePostContent(post.content)}</div>
            <div className="text-xs text-blue-400 flex items-center gap-2">
              <button
                onClick={handleLikeToggle}
                className={`text-blue-400 hover:text-blue-600 focus:outline-none ${like ? 'font-bold underline' : ''}`}
                title={like ? "Unlike" : "Like"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" className="w-5 h-5 inline">
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 18.343l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
              </button>
              <span>{post.likes || 0} likes</span>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
