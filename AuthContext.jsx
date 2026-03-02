import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("hr_user")) || null; }
    catch { return null; }
  });

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem("hr_user", JSON.stringify(userData));
    localStorage.setItem("hr_token", token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("hr_user");
    localStorage.removeItem("hr_token");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);