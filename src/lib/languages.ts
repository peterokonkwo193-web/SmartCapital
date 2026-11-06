export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  popular?: boolean;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  // Top Popular Languages
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸", popular: true },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", popular: true },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", popular: true },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", popular: true },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹", popular: true },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹", popular: true },
  { code: "zh-CN", name: "Chinese (Simplified)", nativeName: "简体中文", flag: "🇨🇳", popular: true },
  { code: "zh-TW", name: "Chinese (Traditional)", nativeName: "繁體中文", flag: "🇹🇼", popular: true },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", popular: true },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷", popular: true },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", popular: true },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺", popular: true },

  // European & Global
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱" },
  { code: "sv", name: "Swedish", nativeName: "Svenska", flag: "🇸🇪" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", flag: "🇬🇷" },
  { code: "iw", name: "Hebrew", nativeName: "עברית", flag: "🇮🇱" },
  { code: "th", name: "Thai", nativeName: "ไทย", flag: "🇹🇭" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", flag: "🇺🇦" },
  { code: "cs", name: "Czech", nativeName: "Čeština", flag: "🇨🇿" },
  { code: "ro", name: "Romanian", nativeName: "Română", flag: "🇷🇴" },
  { code: "hu", name: "Hungarian", nativeName: "Magyar", flag: "🇭🇺" },
  { code: "da", name: "Danish", nativeName: "Dansk", flag: "🇩🇰" },
  { code: "fi", name: "Finnish", nativeName: "Suomi", flag: "🇫🇮" },
  { code: "no", name: "Norwegian", nativeName: "Norsk", flag: "🇳🇴" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", flag: "🇲🇾" },
];

const STORAGE_KEY = "marketcapital_language";

export function getCurrentLanguageCode(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;

    // Check cookie
    const match = document.cookie.match(/googtrans=\/en\/([a-zA-Z-]+)/);
    if (match && match[1]) {
      return match[1];
    }
  } catch {
    // Ignore storage errors
  }
  return "en";
}

export function getCurrentLanguage(): Language {
  const code = getCurrentLanguageCode();
  const found = SUPPORTED_LANGUAGES.find(
    (l) => l.code.toLowerCase() === code.toLowerCase()
  );
  return found || SUPPORTED_LANGUAGES[0];
}

export function setLanguage(langCode: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, langCode);
  } catch {
    // Ignore storage errors
  }

  const hostname = window.location.hostname;

  if (langCode === "en") {
    // Reset to default English
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname};`;
    if (hostname.includes(".")) {
      const parts = hostname.split(".");
      if (parts.length > 2) {
        const rootDomain = parts.slice(-2).join(".");
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${rootDomain};`;
      }
    }
  } else {
    // Set cookie for Google Translate
    const cookieVal = `/en/${langCode}`;
    document.cookie = `googtrans=${cookieVal}; path=/;`;
    document.cookie = `googtrans=${cookieVal}; path=/; domain=${hostname};`;
    if (hostname.includes(".")) {
      const parts = hostname.split(".");
      if (parts.length > 2) {
        const rootDomain = parts.slice(-2).join(".");
        document.cookie = `googtrans=${cookieVal}; path=/; domain=.${rootDomain};`;
      }
    }
  }

  // Trigger Google Translate dropdown if loaded
  const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (combo) {
    combo.value = langCode;
    combo.dispatchEvent(new Event("change"));
  }

  // Dispatch custom event for React components
  window.dispatchEvent(
    new CustomEvent("marketcapital_language_changed", { detail: langCode })
  );

  // Reload page to ensure clean re-translation of dynamic React state
  window.location.reload();
}

