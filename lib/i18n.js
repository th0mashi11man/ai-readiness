"use client";
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getPreferredLocale, normalizeLocale } from "@/lib/locale";

const I18nContext = createContext(null);

export function I18nProvider({ children, uiStrings, initialLocale }) {
    const fallbackLocale = normalizeLocale(initialLocale) || normalizeLocale(uiStrings.defaultLocale) || 'en';
    const [locale, setLocaleState] = useState(fallbackLocale);

    useEffect(() => {
        const saved = localStorage.getItem('locale');
        if (saved === 'sv' || saved === 'en') {
            setLocaleState(saved);
        } else {
            const browserLocales = Array.isArray(navigator.languages) && navigator.languages.length > 0
                ? navigator.languages
                : [navigator.language];

            setLocaleState(getPreferredLocale(browserLocales, fallbackLocale));
        }
    }, [fallbackLocale]);

    useEffect(() => {
        document.documentElement.lang = locale;
    }, [locale]);

    const setLocale = useCallback((loc) => {
        if (loc !== 'sv' && loc !== 'en') return;
        setLocaleState(loc);
        localStorage.setItem('locale', loc);
    }, []);

    const t = useCallback((pathOrObj, replacements) => {
        let node;
        if (typeof pathOrObj === 'object' && pathOrObj !== null && !Array.isArray(pathOrObj)) {
            node = pathOrObj;
        } else if (typeof pathOrObj === 'string') {
            node = resolvePath(uiStrings, pathOrObj);
        }
        if (node === undefined || node === null) return typeof pathOrObj === 'string' ? pathOrObj : '';

        let str = typeof node === 'object' ? (node[locale] ?? node['sv'] ?? '') : String(node);

        if (replacements) {
            for (const [key, val] of Object.entries(replacements)) {
                str = str.replaceAll(`{${key}}`, val);
            }
        }
        return str;
    }, [uiStrings, locale]);

    return (
        <I18nContext.Provider value={{ locale, setLocale, t, uiStrings }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const ctx = useContext(I18nContext);
    if (!ctx) throw new Error('useI18n must be used within I18nProvider');
    return ctx;
}

function resolvePath(obj, path) {
    return path.split('.').reduce((o, k) => (o != null ? o[k] : undefined), obj);
}
