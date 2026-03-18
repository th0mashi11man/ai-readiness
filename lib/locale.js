export const SUPPORTED_LOCALES = ["sv", "en"];

export function normalizeLocale(locale) {
    if (typeof locale !== "string") return null;
    const normalized = locale.trim().toLowerCase();
    if (!normalized) return null;

    const [baseLocale] = normalized.split(/[-_]/);
    return SUPPORTED_LOCALES.includes(baseLocale) ? baseLocale : null;
}

export function getPreferredLocale(locales, fallbackLocale = "en") {
    for (const locale of locales || []) {
        const normalized = normalizeLocale(locale);
        if (normalized) return normalized;
    }

    return normalizeLocale(fallbackLocale) || "en";
}

export function parseAcceptLanguage(headerValue) {
    if (typeof headerValue !== "string" || !headerValue.trim()) return [];

    return headerValue
        .split(",")
        .map((entry, index) => {
            const [tag, ...params] = entry.trim().split(";");
            let quality = 1;

            for (const param of params) {
                const [key, value] = param.trim().split("=");
                if (key === "q") {
                    const parsedQuality = Number(value);
                    if (!Number.isNaN(parsedQuality)) {
                        quality = parsedQuality;
                    }
                }
            }

            return { tag, quality, index };
        })
        .filter(({ tag }) => Boolean(tag))
        .sort((a, b) => b.quality - a.quality || a.index - b.index)
        .map(({ tag }) => tag);
}

export function getPreferredLocaleFromHeader(headerValue, fallbackLocale = "en") {
    return getPreferredLocale(parseAcceptLanguage(headerValue), fallbackLocale);
}
