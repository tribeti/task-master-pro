"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const AVATAR_CACHE_PREFIX = "avatar_cache_";
const AVATAR_CACHE_TTL_MS = 50 * 60 * 1000; // 50 minutes (signed URL lasts 60 min)

function getCachedAvatarUrl(key: string): string | null {
  try {
    const raw = localStorage.getItem(AVATAR_CACHE_PREFIX + key);
    if (!raw) return null;
    const { url, exp } = JSON.parse(raw);
    if (Date.now() > exp) {
      localStorage.removeItem(AVATAR_CACHE_PREFIX + key);
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

function setCachedAvatarUrl(key: string, url: string): void {
  try {
    localStorage.setItem(
      AVATAR_CACHE_PREFIX + key,
      JSON.stringify({ url, exp: Date.now() + AVATAR_CACHE_TTL_MS }),
    );
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

interface UserAvatarProps {
  avatarUrl: string | null;
  displayName: string;
  className?: string;
  fallbackClassName?: string;
}

export function UserAvatar({
  avatarUrl,
  displayName,
  className = "w-8 h-8",
  fallbackClassName = "bg-slate-200 text-slate-700",
}: UserAvatarProps) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let cancelled = false;

    if (!avatarUrl) {
      setResolvedUrl(null);
      return;
    }

    if (avatarUrl.startsWith("http")) {
      setResolvedUrl(avatarUrl);
      return;
    }

    // Check localStorage cache first
    const cached = getCachedAvatarUrl(avatarUrl);
    if (cached) {
      setResolvedUrl(cached);
      return;
    }

    const fetchSignedUrl = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.storage
          .from("avatar")
          .createSignedUrl(avatarUrl, 3600);

        if (!cancelled) {
          if (error) {
            console.error("Failed to create signed avatar URL:", error);
            setResolvedUrl(null);
          } else {
            const signedUrl = data?.signedUrl || null;
            setResolvedUrl(signedUrl);
            if (signedUrl) {
              setCachedAvatarUrl(avatarUrl, signedUrl);
            }
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to resolve avatar URL:", error);
          setResolvedUrl(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchSignedUrl();

    return () => {
      cancelled = true;
    };
  }, [avatarUrl, supabase]);

  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "?";

  if (loading) {
    return <div className={`${className} rounded-full bg-slate-100 animate-pulse`} />;
  }

  if (resolvedUrl) {
    return (
      <img
        src={resolvedUrl}
        alt={displayName}
        className={`${className} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${className} rounded-full flex items-center justify-center text-xs font-black ${fallbackClassName}`}
      aria-label={displayName}
      title={displayName}
    >
      {initials}
    </div>
  );
}
