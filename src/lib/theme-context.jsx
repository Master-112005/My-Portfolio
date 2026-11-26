"use client";
import { createContext, useContext, useEffect, useState } from "react";
const THEME_COOKIE_KEY = "interactive-storytelling-portfolio-theme";
function readCookie(name) {
    if (typeof document === "undefined") {
        return null;
    }
    const prefix = `${encodeURIComponent(name)}=`;
    const cookie = document.cookie
        .split("; ")
        .find((entry) => entry.startsWith(prefix));
    return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}
function writeCookie(name, value, options = {}) {
    if (typeof document === "undefined") {
        return;
    }
    const { maxAgeSeconds, path = "/", sameSite = "Lax" } = options;
    const segments = [
        `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
        `Path=${path}`,
        `SameSite=${sameSite}`,
    ];
    if (typeof maxAgeSeconds === "number") {
        segments.push(`Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`);
    }
    document.cookie = segments.join("; ");
}
const ThemeContext = createContext(null);
export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState("system");
    const [resolvedTheme, setResolvedTheme] = useState("dark");
    useEffect(() => {
        const storedTheme = readCookie(THEME_COOKIE_KEY);
        if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
            setThemeState(storedTheme);
        }
    }, []);
    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const syncTheme = () => {
            const nextResolved = theme === "system" ? (media.matches ? "dark" : "light") : theme;
            setResolvedTheme(nextResolved);
            document.documentElement.dataset.theme = nextResolved;
        };
        syncTheme();
        media.addEventListener("change", syncTheme);
        return () => media.removeEventListener("change", syncTheme);
    }, [theme]);
    const setTheme = (nextTheme) => {
        setThemeState(nextTheme);
        writeCookie(THEME_COOKIE_KEY, nextTheme, {
            maxAgeSeconds: 60 * 60 * 24 * 365,
        });
    };
    return (<ThemeContext.Provider value={{
            theme,
            resolvedTheme,
            setTheme,
            toggleTheme: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
        }}>
      {children}
    </ThemeContext.Provider>);
}
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within ThemeProvider");
    }
    return context;
}
