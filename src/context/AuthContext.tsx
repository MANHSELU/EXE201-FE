import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

interface User {
  id: string;
  fullName: string;
  email: string;
  role: "ADMIN" | "LECTURER" | "STUDENT";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  hasFaceData: boolean | null;
  login: (email: string, password: string) => Promise<{ needsFaceRegister: boolean }>;
  logout: () => void;
  isLoading: boolean;
  checkFaceStatus: () => Promise<boolean>;
  setHasFaceData: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [hasFaceData, setHasFaceData] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check face registration status
  const checkFaceStatus = async (): Promise<boolean> => {
    try {
      const response = await api.get("/student/face/status");
      const hasRegistered = response.data.data?.hasRegistered || false;
      setHasFaceData(hasRegistered);
      localStorage.setItem("hasFaceData", JSON.stringify(hasRegistered));
      return hasRegistered;
    } catch {
      // API failed -> check localStorage.faceDescriptors (array of 128-number arrays)
      const storedDescriptors = localStorage.getItem("faceDescriptors");
      let hasRegistered = false;
      if (storedDescriptors) {
        try {
          const arr = JSON.parse(storedDescriptors);
          // Phải là array của arrays, mỗi array có 128 số
          hasRegistered = Array.isArray(arr) && arr.length > 0 && Array.isArray(arr[0]) && arr[0].length === 128;
        } catch {
          hasRegistered = false;
        }
      }
      setHasFaceData(hasRegistered);
      localStorage.setItem("hasFaceData", JSON.stringify(hasRegistered));
      return hasRegistered;
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      
      // Check face data từ faceDescriptors (mới) hoặc faceDescriptor (cũ)
      const storedDescriptors = localStorage.getItem("faceDescriptors");
      if (storedDescriptors) {
        try {
          const arr = JSON.parse(storedDescriptors);
          setHasFaceData(Array.isArray(arr) && arr.length > 0);
        } catch {
          setHasFaceData(false);
        }
      } else {
        setHasFaceData(false);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ needsFaceRegister: boolean }> => {
    const response = await api.post("/login", { email, password });
    const { token: newToken, user: newUser } = response.data;

    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);

    // Check face data for students - LUÔN check mới, không dùng cache
    let needsFaceRegister = false;
    if (newUser.role === "STUDENT") {
      const hasData = await checkFaceStatus();
      needsFaceRegister = !hasData;
      console.log("[Auth] Student login, hasFaceData:", hasData, "needsFaceRegister:", needsFaceRegister);
    }

    return { needsFaceRegister };
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("hasFaceData");
    // KHÔNG xóa faceDescriptor khi logout (dữ liệu khuôn mặt vẫn giữ)
    setToken(null);
    setUser(null);
    setHasFaceData(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      hasFaceData, 
      login, 
      logout, 
      isLoading, 
      checkFaceStatus,
      setHasFaceData 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
