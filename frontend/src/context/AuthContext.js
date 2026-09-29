import React, { createContext, useState, useEffect, useContext } from "react";
import authService from "../services/authService";
import { getSecureItem } from "../utils/storage";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored authentication state on application boot
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      setIsLoading(true);
      const storedToken = await getSecureItem("userToken");
      const storedUser = await getSecureItem("userData");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // Optionally verify token freshness with backend
        try {
          const res = await authService.getMe();
          if (res && res.user) {
            setUser(res.user);
            await authService.saveSession(storedToken, res.user);
          }
        } catch (err) {
          // If token expired or invalid, clear session
          console.log("Session verification failed, logging out:", err.message);
          await logout();
        }
      }
    } catch (error) {
      console.error("Error loading auth state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (identifier, password) => {
    setIsLoading(true);
    try {
      const data = await authService.login(identifier, password);
      
      if (data.requiresVerification) {
        setIsLoading(false);
        return { success: false, requiresVerification: true, identifier: data.identifier, message: data.message };
      }

      if (data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        await authService.saveSession(data.token, data.user);
        setIsLoading(false);
        return { success: true, user: data.user, role: data.user.role };
      }
      setIsLoading(false);
      return { success: false, message: data.message || "Login failed" };
    } catch (error) {
      setIsLoading(false);
      const msg = error.response?.data?.message || "Invalid credentials or connection error";
      const isUnverified = error.response?.data?.requiresVerification;
      const unverifiedIdentifier = error.response?.data?.identifier;
      return {
        success: false,
        requiresVerification: isUnverified,
        identifier: unverifiedIdentifier,
        message: msg,
      };
    }
  };

  const register = async (userData) => {
    try {
      const data = await authService.register(userData);
      return { success: true, data };
    } catch (error) {
      const msg = error.response?.data?.message || "Registration failed";
      return { success: false, message: msg };
    }
  };

  const verifyOTP = async (identifier, otp) => {
    setIsLoading(true);
    try {
      const data = await authService.verifyOTP(identifier, otp);
      if (data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        await authService.saveSession(data.token, data.user);
        setIsLoading(false);
        return { success: true, user: data.user, role: data.user.role };
      }
      setIsLoading(false);
      return { success: true, message: data.message };
    } catch (error) {
      setIsLoading(false);
      const msg = error.response?.data?.message || "OTP verification failed";
      return { success: false, message: msg };
    }
  };

  const resendOTP = async (identifier) => {
    try {
      const data = await authService.resendOTP(identifier);
      return { success: true, message: data.message };
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to resend OTP";
      return { success: false, message: msg };
    }
  };

  const forgotPassword = async (identifier) => {
    try {
      const data = await authService.forgotPassword(identifier);
      return { success: true, message: data.message, identifier: data.identifier };
    } catch (error) {
      const msg = error.response?.data?.message || "Forgot password request failed";
      return { success: false, message: msg };
    }
  };

  const verifyResetOTP = async (identifier, otp) => {
    try {
      const data = await authService.verifyResetOTP(identifier, otp);
      return { success: true, message: data.message };
    } catch (error) {
      const msg = error.response?.data?.message || "Reset OTP verification failed";
      return { success: false, message: msg };
    }
  };

  const resetPassword = async (identifier, otp, newPassword) => {
    try {
      const data = await authService.resetPassword(identifier, otp, newPassword);
      return { success: true, message: data.message };
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to reset password";
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    await authService.clearSession();
    setToken(null);
    setUser(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        userRole: user?.role || null,
        login,
        register,
        verifyOTP,
        resendOTP,
        forgotPassword,
        verifyResetOTP,
        resetPassword,
        logout,
        checkAuthState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
