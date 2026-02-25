import { useEffect, useState } from 'react';
import { getThemeBySlug } from '../api/appearanceApi';

const DEFAULT_THEME = {
    preset: 'holoplate-classic',
    colors: {
        primary: '#f59e0b',
        secondary: '#1e293b',
        accent: '#d97706',
        background: '#ffffff',
    },
    typography: {
        fontFamily: 'Inter',
        fontSize: 'medium',
    },
    layout: {},
};

function getContrastColor(hexColor) {
    if (!hexColor || hexColor.length < 6) return '#000000';
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#1e293b' : '#ffffff';
}

function applyThemeToDOM(theme) {
    const root = document.documentElement;
    const bg = theme.colors.background || '#ffffff';
    const primary = theme.colors.primary || '#f59e0b';
    const textColor = getContrastColor(bg);
    const primaryTextColor = getContrastColor(primary);

    root.style.setProperty('--menu-primary', primary);
    root.style.setProperty('--menu-primary-text', primaryTextColor);
    root.style.setProperty('--menu-secondary', textColor);
    root.style.setProperty('--menu-accent', theme.colors.accent);
    root.style.setProperty('--menu-bg', bg);
    root.style.setProperty('--menu-font', `"${theme.typography.fontFamily}", sans-serif`);
    root.style.setProperty('--menu-font-size', theme.typography.fontSize);
}

export function useMenuTheme(slug) {
    const [theme, setTheme] = useState(DEFAULT_THEME);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!slug) {
            applyThemeToDOM(DEFAULT_THEME);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);

        getThemeBySlug(slug)
            .then((fetchedTheme) => {
                if (!cancelled) {
                    const merged = { ...DEFAULT_THEME, ...fetchedTheme };
                    setTheme(merged);
                    applyThemeToDOM(merged);
                }
            })
            .catch(() => {
                // Silently fall back to defaults — menu still works
                if (!cancelled) {
                    applyThemeToDOM(DEFAULT_THEME);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [slug]);

    return { theme, loading };
}

export { DEFAULT_THEME, applyThemeToDOM };
