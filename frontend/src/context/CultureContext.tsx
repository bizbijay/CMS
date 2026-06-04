import { createContext, useContext, useState } from "react";
import { type Locale, translations } from "../i18n/translations";

const LOCALE_KEY = "cms.locale";

function loadLocale(): Locale {
  const stored = localStorage.getItem(LOCALE_KEY);
  return stored === "en" || stored === "np" ? stored : "en";
}

interface CultureContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: typeof translations.en;
}

const CultureContext = createContext<CultureContextValue>({
  locale: "en",
  setLocale: () => {},
  t: translations.en,
});

export function CultureProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(loadLocale);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem(LOCALE_KEY, l);
  }

  return (
    <CultureContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </CultureContext.Provider>
  );
}

export function useCulture() {
  return useContext(CultureContext);
}
