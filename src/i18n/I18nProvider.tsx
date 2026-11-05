import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getPrefs, setPrefs, subscribe, type Language } from '../storage/db';
import { STRINGS, type Strings } from './strings';

const LS_KEY = 'massageatlas.lang';

interface I18n { lang: Language; s: Strings; setLang: (l: Language) => void }
const Ctx = createContext<I18n>({ lang: 'da', s: STRINGS.da, setLang: () => {} });

function readMirror(): Language {
  try {
    const v = localStorage.getItem(LS_KEY);
    return v === 'en' ? 'en' : 'da';
  } catch {
    return 'da';
  }
}
function writeMirror(l: Language) {
  try { localStorage.setItem(LS_KEY, l); } catch { /* private mode – IndexedDB still holds it */ }
}

/**
 * Language state. Source of truth is the IndexedDB preference (persists with
 * the user's other data); localStorage only mirrors it so the first paint is
 * already in the right language. Switching language never touches notes,
 * favourites or quiz history.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(readMirror);

  useEffect(() => {
    const load = () => getPrefs().then((p) => { setLangState(p.language); writeMirror(p.language); }).catch(() => {});
    void load();
    const unsub = subscribe((store) => { if (store === 'prefs') void load(); });
    return () => { unsub(); };
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    writeMirror(l);
    void setPrefs({ language: l });
  }, []);

  const value = useMemo(() => ({ lang, s: STRINGS[lang], setLang }), [lang, setLang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);

export function LanguageSwitch({ className }: { className?: string }) {
  const { lang, s, setLang } = useI18n();
  return (
    <div className={`segmented lang-switch ${className ?? ''}`} role="group" aria-label={s.lang.label}>
      {(['da', 'en'] as const).map((l) => (
        <button key={l} type="button" lang={l} className={lang === l ? 'on' : ''} aria-pressed={lang === l}
          aria-label={s.lang.switchTo[l]} title={STRINGS[l].langName} onClick={() => setLang(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
