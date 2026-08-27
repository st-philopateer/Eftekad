import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeService, setActiveService] = useState(() => {
    return localStorage.getItem('activeService') || '';
  });

  const [activeStage, setActiveStage] = useState(() => {
    return localStorage.getItem('activeStage') || '';
  });

  const [activeYear, setActiveYear] = useState(() => {
    return localStorage.getItem('activeServiceYear') || new Date().getFullYear().toString();
  });

  const login = (user, service = '', stage = '', year = '') => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    if (service) {
      setActiveService(service);
      localStorage.setItem('activeService', service);
    }
    if (stage) {
      setActiveStage(stage);
      localStorage.setItem('activeStage', stage);
    }
    if (year) {
      setActiveYear(year);
      localStorage.setItem('activeServiceYear', year);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('activeService');
    localStorage.removeItem('activeStage');
    window.location.href = '/login';
  };

  const updateCurrentUser = (updatedData) => {
    const newUser = { ...currentUser, ...updatedData };
    setCurrentUser(newUser);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
  };

  const hasPermission = (permissionKey) => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin' || currentUser.role === 'admin' || currentUser.role === 'priest') return true;
    if (currentUser.permissions && currentUser.permissions[permissionKey] !== undefined) {
      return !!currentUser.permissions[permissionKey];
    }
    return true; // Default fallback
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser: updateCurrentUser,
        activeService,
        setActiveService,
        activeStage,
        setActiveStage,
        activeYear,
        setActiveYear,
        login,
        logout,
        hasPermission,
        isAuthenticated: !!currentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
