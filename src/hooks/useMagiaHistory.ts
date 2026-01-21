import { useState, useEffect, useCallback } from 'react';

export interface MagiaHistoryItem {
  id: string;
  timestamp: string;
  case_text: string;
  area: string;
  result: DiagnosisResult | null;
}

export interface DiagnosisHypothesis {
  rank: number;
  diagnosis: string;
  justification: string;
  arguments_against: string;
  confirmation_questions: string[];
}

export interface DiagnosisResult {
  summary: string;
  hypotheses: DiagnosisHypothesis[];
  red_flags: string[];
  next_steps: string[];
  confidence: 'alta' | 'média' | 'baixa';
  disclaimer: string;
}

const STORAGE_KEY = 'magia_history';
const MAX_HISTORY_ITEMS = 20;

export function useMagiaHistory() {
  const [history, setHistory] = useState<MagiaHistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading MagIA history:', error);
    }
  }, []);

  // Save to localStorage whenever history changes
  const saveHistory = useCallback((items: MagiaHistoryItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving MagIA history:', error);
    }
  }, []);

  const addToHistory = useCallback((
    case_text: string,
    area: string,
    result: DiagnosisResult | null
  ) => {
    const newItem: MagiaHistoryItem = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      case_text,
      area,
      result,
    };

    setHistory(prev => {
      const updated = [newItem, ...prev].slice(0, MAX_HISTORY_ITEMS);
      saveHistory(updated);
      return updated;
    });
  }, [saveHistory]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { history, addToHistory, clearHistory };
}
