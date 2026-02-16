"use client";
import { useState, useEffect, useCallback } from 'react';

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/**
 * Custom hook for quiz/survey state with localStorage persistence
 * @param {string} storageKey    - localStorage key (e.g. 'individual_state')
 * @param {Array}  items         - array of item objects from JSON
 * @param {boolean} randomize   - whether to shuffle item order
 */
export function useQuizStore(storageKey, items, randomize) {
    const [state, setState] = useState(null);
    const [initialized, setInitialized] = useState(false);

    // Init: load from localStorage or create new session
    useEffect(() => {
        if (!items || items.length === 0) return;

        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Validate it has the right structure AND all items exist
                if (parsed.sessionId && parsed.itemOrder && parsed.itemOrder.length > 0) {
                    const allItemsExist = parsed.itemOrder.every(id => items.some(it => it.id === id));
                    if (allItemsExist) {
                        setState(parsed);
                        setInitialized(true);
                        return;
                    }
                }
            } catch (e) { /* ignore corrupt data */ }
        }

        // Create new session
        const itemIds = items.map(it => it.id);
        const newState = {
            sessionId: generateId(),
            itemOrder: randomize ? shuffleArray(itemIds) : itemIds,
            answers: {}, // { [itemId]: value }
            currentIndex: 0,
            startedAt: new Date().toISOString(),
            completedAt: null,
        };
        setState(newState);
        setInitialized(true);
    }, [storageKey, items, randomize]);

    // Persist to localStorage on state changes
    useEffect(() => {
        if (state && initialized) {
            localStorage.setItem(storageKey, JSON.stringify(state));
        }
    }, [state, storageKey, initialized]);

    const setAnswer = useCallback((itemId, value) => {
        setState(prev => ({
            ...prev,
            answers: { ...prev.answers, [itemId]: value },
        }));
    }, []);

    const goNext = useCallback(() => {
        setState(prev => {
            const next = Math.min(prev.currentIndex + 1, prev.itemOrder.length - 1);
            return { ...prev, currentIndex: next };
        });
    }, []);

    const goBack = useCallback(() => {
        setState(prev => ({
            ...prev,
            currentIndex: Math.max(prev.currentIndex - 1, 0),
        }));
    }, []);

    const goToIndex = useCallback((idx) => {
        setState(prev => ({
            ...prev,
            currentIndex: Math.max(0, Math.min(idx, prev.itemOrder.length - 1)),
        }));
    }, []);

    const complete = useCallback(() => {
        setState(prev => ({
            ...prev,
            completedAt: new Date().toISOString(),
        }));
    }, []);

    const reset = useCallback(() => {
        localStorage.removeItem(storageKey);
        const itemIds = items.map(it => it.id);
        setState({
            sessionId: generateId(),
            itemOrder: randomize ? shuffleArray(itemIds) : itemIds,
            answers: {},
            currentIndex: 0,
            startedAt: new Date().toISOString(),
            completedAt: null,
        });
    }, [storageKey, items, randomize]);

    return {
        state,
        initialized,
        setAnswer,
        goNext,
        goBack,
        goToIndex,
        complete,
        reset,
    };
}
