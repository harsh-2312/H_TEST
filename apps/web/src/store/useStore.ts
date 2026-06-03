"use client";
import { create } from "zustand";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  businessIds: string[];
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setAuth: (payload: { token: string; refreshToken: string; user: any }) => void;
  clearAuth: () => void;
}

// Simple in-memory store (token survives page within session; login page redirects to dashboard)
const getInitialAuthState = () => {
  if (typeof window === "undefined") {
    return { token: null, refreshToken: null, user: null };
  }

  const token = sessionStorage.getItem("lc_token");
  const refreshToken = sessionStorage.getItem("lc_refresh");
  let user = null;

  try {
    const raw = sessionStorage.getItem("lc_user");
    if (raw) {
      user = JSON.parse(raw);
    }
  } catch {
    user = null;
  }

  return {
    token: token || null,
    refreshToken: refreshToken || null,
    user,
  };
};

const initialAuthState = getInitialAuthState();

export const useAuthStore = create<AuthState>((set) => ({
  token: initialAuthState.token,
  refreshToken: initialAuthState.refreshToken,
  user: initialAuthState.user,
  setAuth: (payload) => {
    const user = {
      ...payload.user,
      businessIds: payload.user.businessIds ?? (payload.user.businessId ? [payload.user.businessId] : []),
    };
    if (typeof window !== "undefined") {
      sessionStorage.setItem("lc_token", payload.token);
      sessionStorage.setItem("lc_refresh", payload.refreshToken);
      sessionStorage.setItem("lc_user", JSON.stringify(user));
    }
    set({ token: payload.token, refreshToken: payload.refreshToken, user });
  },
  clearAuth: () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("lc_token");
      sessionStorage.removeItem("lc_refresh");
      sessionStorage.removeItem("lc_user");
    }
    set({ token: null, refreshToken: null, user: null });
  },
}));
