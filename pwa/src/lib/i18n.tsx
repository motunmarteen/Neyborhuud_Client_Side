'use client';

/**
 * The language system (tracker L-07). English ships with the app; Pidgin, Yorùbá, Hausa and
 * Igbo load only when someone picks them. Phrases live in src/locales/<lang>.ts.
 *
 *   t('feed.retry')                                   → "Try again"
 *   t('sentinel.guardians', { count: 3 })             → "3 guardians" (uses _one / _other)
 *   t('sentinel.greeting', { name: 'Ada' })           → "Good morning, Ada"
 *
 * A missing phrase falls back to English, then to the key itself (never a blank).
 * Screens move their text here as they are restyled, so each screen is touched once.
 * `npm run i18n:check` lists what each language is still missing.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { AppLanguage } from '@/types/api';
import en from '@/locales/en';

type Dict = Record<string, string>;
type Vars = Record<string, string | number>;

const LOADERS: Record<Exclude<AppLanguage, 'en'>, () => Promise<{ default: Dict }>> = {
  pcm: () => import('@/locales/pcm'),
  yo: () => import('@/locales/yo'),
  ha: () => import('@/locales/ha'),
  ig: () => import('@/locales/ig'),
};

const loaded: Partial<Record<AppLanguage, Dict>> = { en };

async function loadLanguage(lang: AppLanguage): Promise<Dict> {
  if (loaded[lang]) return loaded[lang]!;
  const mod = await LOADERS[lang as Exclude<AppLanguage, 'en'>]();
  loaded[lang] = mod.default;
  return mod.default;
}

const LANGUAGE_NAMES: Record<AppLanguage, string> = {
  en: 'English',
  ha: 'Hausa',
  yo: 'Yorùbá',
  ig: 'Igbo',
  pcm: 'Pidgin',
};
const AVAILABLE: AppLanguage[] = ['en', 'pcm', 'yo', 'ha', 'ig'];
// Plural rules: Pidgin follows English; Yorùbá, Hausa and Igbo phrases are written to read
// well with the same one / other split.
const plural = new Intl.PluralRules('en');

function fill(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (vars[k] === undefined ? m : typeof vars[k] === 'number' ? (vars[k] as number).toLocaleString('en-NG') : String(vars[k])));
}

/** Look a phrase up: this language, then English, then the key itself. */
export function translate(dict: Dict, key: string, vars?: Vars): string {
  const count = typeof vars?.count === 'number' ? vars.count : undefined;
  if (count !== undefined) {
    const form = `${key}_${plural.select(count)}`;
    const other = `${key}_other`;
    const hit = dict[form] ?? en[form] ?? dict[other] ?? en[other];
    if (hit) return fill(hit, vars);
  }
  const text = dict[key] ?? en[key];
  if (text === undefined) {
    if (process.env.NODE_ENV !== 'production') console.warn(`[i18n] missing key: ${key}`);
    return key;
  }
  return fill(text, vars);
}

interface I18nContextValue {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: string, vars?: Vars) => string;
  languageNames: Record<AppLanguage, string>;
  availableLanguages: AppLanguage[];
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'neyborhuud_language';

function savedLanguage(): AppLanguage | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as AppLanguage | null;
    if (stored && AVAILABLE.includes(stored)) return stored;
    const user = JSON.parse(localStorage.getItem('neyborhuud_user') ?? 'null');
    const fromUser = user?.settings?.language as AppLanguage | undefined;
    return fromUser && AVAILABLE.includes(fromUser) ? fromUser : null;
  } catch {
    return null;
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('en');
  const [dict, setDict] = useState<Dict>(en);

  const apply = useCallback(async (lang: AppLanguage) => {
    try {
      const d = await loadLanguage(lang);
      setDict(d);
      setLanguageState(lang);
      document.documentElement.lang = lang === 'pcm' ? 'pcm' : lang;
    } catch {
      setDict(en);
      setLanguageState('en');
    }
  }, []);

  useEffect(() => {
    const lang = savedLanguage();
    if (lang && lang !== 'en') void apply(lang);
  }, [apply]);

  const setLanguage = useCallback(
    (lang: AppLanguage) => {
      void apply(lang);
      try {
        localStorage.setItem(STORAGE_KEY, lang);
        const userData = localStorage.getItem('neyborhuud_user');
        if (userData) {
          const user = JSON.parse(userData);
          user.settings = { ...user.settings, language: lang };
          localStorage.setItem('neyborhuud_user', JSON.stringify(user));
        }
      } catch {
        /* private mode: this visit only */
      }
    },
    [apply],
  );

  const t = useCallback((key: string, vars?: Vars) => translate(dict, key, vars), [dict]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, languageNames: LANGUAGE_NAMES, availableLanguages: AVAILABLE }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    // Outside the provider (tests, server render): English.
    return {
      language: 'en' as AppLanguage,
      setLanguage: () => {},
      t: (key: string, vars?: Vars) => translate(en, key, vars),
      languageNames: LANGUAGE_NAMES,
      availableLanguages: AVAILABLE,
    };
  }
  return context;
}
