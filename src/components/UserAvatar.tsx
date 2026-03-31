"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const avatarUrlCache = new Map<string, string | null>();
const avatarUrlRequestCache = new Map<string, Promise<string | null>>();
const SESSION_STORAGE_KEY_PREFIX = "taskmaster:avatar-url:";
const SESSION_CACHE_TTL_MS = 55 * 60 * 1000;
let browserSupabaseClient: ReturnType<typeof createClient> | null = null;

function getBrowserSupabaseClient() {
  if (!browserSupabaseClient) {
    browserSupabaseClient = createClient();
  }
  return browserSupabaseClient;
}

function readPersistedAvatarUrl(avatarPath: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    const rawValue = window.sessionStorage.getItem(
      `${SESSION_STORAGE_KEY_PREFIX}${avatarPath}`,
    );
    if (!rawValue) return null;

    const parsedValue = JSON.parse(rawValue) as {
      signedUrl?: string | null;
      expiresAt?: number;
    };

    if (!parsedValue.signedUrl || !parsedValue.expiresAt) {
      window.sessionStorage.removeItem(`${SESSION_STORAGE_KEY_PREFIX}${avatarPath}`);
      return null;
    }

    if (Date.now() >= parsedValue.expiresAt) {
      window.sessionStorage.removeItem(`${SESSION_STORAGE_KEY_PREFIX}${avatarPath}`);
      return null;
    }

    return parsedValue.signedUrl;
  } catch {
    return null;
  }
}

function persistAvatarUrl(avatarPath: string, signedUrl: string | null) {
  if (typeof window === "undefined" || !signedUrl) return;

  try {
    window.sessionStorage.setItem(
      `${SESSION_STORAGE_KEY_PREFIX}${avatarPath}`,
      JSON.stringify({
        signedUrl,
        expiresAt: Date.now() + SESSION_CACHE_TTL_MS,
      }),
    );
  } catch {
    // Ignore storage quota and private mode errors.
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

  useEffect(() => {
    let cancelled = false;

    if (!avatarUrl) {
      setLoading(false);
      setResolvedUrl(null);
      return;
    }

    if (avatarUrl.startsWith("http")) {
      avatarUrlCache.set(avatarUrl, avatarUrl);
      setLoading(false);
      setResolvedUrl(avatarUrl);
      return;
    }

    const cachedUrl = avatarUrlCache.get(avatarUrl);
    if (cachedUrl !== undefined) {
      setLoading(false);
      setResolvedUrl(cachedUrl);
      return;
    }

    const persistedUrl = readPersistedAvatarUrl(avatarUrl);
    if (persistedUrl) {
      avatarUrlCache.set(avatarUrl, persistedUrl);
      setLoading(false);
      setResolvedUrl(persistedUrl);
      return;
    }

    const getSignedUrl = () => {
      const cachedRequest = avatarUrlRequestCache.get(avatarUrl);
      if (cachedRequest) {
        return cachedRequest;
      }

      const request = (async () => {
        const { data, error } = await getBrowserSupabaseClient().storage
          .from("avatar")
          .createSignedUrl(avatarUrl, 3600);

        if (error) {
          console.error("Failed to create signed avatar URL:", error);
          avatarUrlCache.set(avatarUrl, null);
          return null;
        }

        const signedUrl = data?.signedUrl || null;
        avatarUrlCache.set(avatarUrl, signedUrl);
        persistAvatarUrl(avatarUrl, signedUrl);
        return signedUrl;
      })().finally(() => {
        avatarUrlRequestCache.delete(avatarUrl);
      });

      avatarUrlRequestCache.set(avatarUrl, request);
      return request;
    };

    const fetchSignedUrl = async () => {
      try {
        setResolvedUrl(null);
        setLoading(true);
        const signedUrl = await getSignedUrl();

        if (!cancelled) {
          setResolvedUrl(signedUrl);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to resolve avatar URL:", error);
          avatarUrlCache.set(avatarUrl, null);
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
  }, [avatarUrl]);

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
        loading="lazy"
        decoding="async"
        fetchPriority="low"
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
