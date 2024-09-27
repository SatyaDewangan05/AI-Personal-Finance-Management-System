"use client";

import React, { createContext, useState, useContext, useEffect } from "react";
import jwtDecode from "jwt-decode";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (curAccessToken, decodedToken) => {
    // Simulate API call

    // const token = "";
    // console.log("access: ", access_token);
    // const decodedToken = jwtDecode(access_token);

    // console.log("JWT: ", decodedToken);

    // await new Promise((resolve) => setTimeout(resolve, 1000));
    const newUser = { name: decodedToken.name, email: decodedToken.email };
    setUser(newUser);
    localStorage.setItem("accessToken", curAccessToken);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
