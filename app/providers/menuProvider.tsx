"use client";
import { createContext, useContext, useState } from "react";

const MenuProvider = ({ children }: { children: React.ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <MenuContext.Provider value={{ isCollapsed, setIsCollapsed }}>{children}</MenuContext.Provider>
  );
};

const MenuContext = createContext({
  isCollapsed: false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setIsCollapsed: (_collapsed: boolean) => {
    // Placeholder function
  },
});

export const useMenu = () => {
  return useContext(MenuContext);
};

export default MenuProvider;
