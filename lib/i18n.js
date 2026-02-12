"use client";
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const I18nContext = createContext(null);

export function I18nProvider({ children, uiStrings }) {
    const [locale, setLocaleState] = useState('sv');

    useEffect(() => {
        const saved = localStorage.getItem('locale');
        if (saved === 'sv' || saved === 'en') {
            setLocaleState(saved);
        } else {
            setLocaleState(uiStrings.defaultLocale || 'sv');
        }
    }, [uiStrings]);

    const setLocale = useCallback((loc) => {
        if (loc !== 'sv' && loc !== 'en') return;
        setLocaleState(loc);
        localStorage.setItem('locale', loc);
        document.documentElement.lang = loc;
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
