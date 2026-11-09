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

  // European, Asian & Global Languages
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
  { code: "tl", name: "Filipino (Tagalog)", nativeName: "Tagalog", flag: "🇵🇭" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇧🇩" },
  { code: "fa", name: "Persian (Farsi)", nativeName: "فارسی", flag: "🇮🇷" },
  { code: "ur", name: "Urdu", nativeName: "اردو", flag: "🇵🇰" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", flag: "🇰🇪" },
];

const STORAGE_KEY = "fxoptions_language";
const LEGACY_STORAGE_KEY = "marketcapital_language";

export function getCurrentLanguageCode(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved) return saved;

    // Check cookie
    const match = document.cookie.match(/googtrans=\/(?:en|auto)\/([a-zA-Z-]+)/);
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

/**
 * Trigger the Google Translate select dropdown directly in the DOM
 */
function triggerTranslateCombo(langCode: string): boolean {
  const combo = document.querySelector<HTMLSelectElement>("select.goog-te-combo");
  if (combo) {
    combo.value = langCode === "en" ? "" : langCode;
    combo.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }
  return false;
}

/**
 * Apply the requested language across cookies, storage, Google Translate, and reload
 */
export function setLanguage(langCode: string): void {
  // 1. Store preference
  try {
    localStorage.setItem(STORAGE_KEY, langCode);
    localStorage.setItem(LEGACY_STORAGE_KEY, langCode);
  } catch {
    // Ignore storage errors
  }

  // 2. Set Google Translate cookies
  const host = window.location.hostname;
  if (langCode === "en") {
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${host};`;
  } else {
    // Set both /en/target and /auto/target
    const pathCookie = `googtrans=/en/${langCode}; path=/;`;
    const pathAutoCookie = `googtrans=/auto/${langCode}; path=/;`;
    document.cookie = pathCookie;
    document.cookie = pathAutoCookie;
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=${host};`;
    document.cookie = `googtrans=/auto/${langCode}; path=/; domain=${host};`;
  }

  // 3. Dispatch custom event for UI updates
  window.dispatchEvent(
    new CustomEvent("fxoptions_language_changed", { detail: langCode })
  );
  window.dispatchEvent(
    new CustomEvent("marketcapital_language_changed", { detail: langCode })
  );

  // 4. Trigger Google Translate dropdown
  triggerTranslateCombo(langCode);

  // 5. Clean reload with tiny timeout to let Google Translate register change & re-render page
  setTimeout(() => {
    window.location.reload();
  }, 250);
}
