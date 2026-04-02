import { createContext, useContext } from "react";

export interface ThemeModeContextType {
  mode: "light" | "dark";
  toggleMode: () => void;
}

export const ThemeModeContext = createContext<ThemeModeContextType>({
  mode: "light",
  toggleMode: () => {},
});

export const useThemeMode = (): ThemeModeContextType => useContext(ThemeModeContext);
