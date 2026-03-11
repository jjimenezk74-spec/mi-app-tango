import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface LocalUser {
  id: number;
  username: string;
  name: string | null;
  role: 'admin' | 'cashier';
  is_active?: number;
}

interface AuthContextValue {
  user: LocalUser | null;
  isPending: boolean;
  isAdmin: boolean;
  isCashier: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AUTH_TOKEN_KEY = "tango_terere_token";

const AuthContext = createContext<AuthContextValue | null>(null);

// Helper to get auth headers for fetch calls
export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    return { "Authorization": `Bearer ${token}` };
  }
  return {};
}

// Helper for authenticated fetch
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };
  return fetch(url, { ...options, headers });
}

export function AppAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        setIsPending(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/me", {
          headers: { "Authorization": `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // Token invalid, clear it
          localStorage.removeItem(AUTH_TOKEN_KEY);
        }
      } catch (error) {
        console.error("Session check error:", error);
      }
      setIsPending(false);
    };

    checkSession();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.user && data.token) {
        // Store token in localStorage
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error || "Error de autenticación" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Error de conexión" };
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      await fetch("/api/auth/logout", { 
        method: "POST",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
  };

  const value: AuthContextValue = {
    user,
    isPending,
    isAdmin: user?.role === 'admin',
    isCashier: user?.role === 'cashier',
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAppAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAppAuth must be used within an AppAuthProvider");
  }
  return context;
}
