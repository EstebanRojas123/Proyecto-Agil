"use client";
import { createContext, useState, ReactNode, useEffect } from "react";
import { loginService } from "@/services/AuthServices";

interface User {
  rut: string;
  carreras: { codigo: string; nombre: string; catalogo: string }[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (Date.now() < payload.exp * 1000) {
          setUser(JSON.parse(storedUser));
        } else {
          logout();
        }
      } catch {
        logout();
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await loginService(email, password);
    if (res?.access_token && res?.user) {
      setUser(res.user);
      localStorage.setItem("token", res.access_token);
      localStorage.setItem("user", JSON.stringify(res.user));
    } else {
      throw new Error("Login fallido");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
