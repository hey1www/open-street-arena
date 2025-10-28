(function () {
  const STORAGE_KEY = "openStreetArenaLang";
  const DEFAULT_LANG = "zh-Hant";

  const translations = {
    "zh-Hant": {
      _locale: "zh-Hant",
      documentTitle: "Open Street Arena 地圖",
      topbar: {
        title: "Open Street Arena",
        languageLabel: "語言",
        navigation: "其他頁面",
      },
      nav: {
        backHome: "返回首頁",
        map: "Open Street Arena",
        leaderboard: "Leaderboard",
        report: "報告遺漏的襲擊事件（未啟用）",
        all: "全部襲擊事件",
      },
      controls: {
        district: "地區",
        allDistricts: "全部地區",
        period: "時段",
        allPeriods: "全部時段",
        heat: "熱力圖",
      },
      periodLabels: {
        morning: "早",
        noon: "午",
        afternoon: "午後",
        evening: "傍晚",
        night: "夜間",
        midnight: "半夜",
        dawn: "黎明",
        unknown: "未知",
      },
      datasetLabels: {
        "local-json": "本地 JSON (./data/incidents.json)",
        "local-csv": "本地 CSV (./data/incidents.csv)",
        "sheets-csv": "Google Sheets CSV",
        fallback: "資料來源",
      },
      summary: "{label} · 顯示 {filtered} / {total}",
      summaryInitial: "{label} · 事件總數 {total}",
      disclaimer: {
        general:
          "數據僅供資訊參考，來源見事件詳情連結；不構成治安判斷或執法依據。",
      },
      popup: {
        time: "時間",
        district: "地區",
        category: "分類",
        source: "來源",
        notes: "備註",
        noTime: "未提供",
        noSource: "未提供",
        noNotes: "暫無補充內容",
        noCategory: "未標註",
        noDistrict: "未標註",
        locationSeparator: " · ",
      },
      messages: {
        loadFailed: "資料載入失敗，請稍後再試。",
      },
    },
  };

  function getStoredLanguage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored && translations[stored] ? stored : null;
    } catch (error) {
      return null;
    }
  }

  function storeLanguage(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (error) {
      // ignore storage errors (e.g. private mode)
    }
  }

  let currentLang = DEFAULT_LANG;

  function resolveKey(lang, key) {
    return key
      .split(".")
      .reduce((acc, segment) => (acc && acc[segment] !== undefined ? acc[segment] : undefined), translations[lang]);
  }

  function formatTemplate(template, replacements = {}) {
    return template.replace(/\{([^}]+)}/g, (_, token) => {
      const value = replacements[token.trim()];
      return value === undefined ? `{${token}}` : value;
    });
  }

  function translate(key, replacements = {}) {
    const value =
      resolveKey(currentLang, key) ??
      resolveKey(DEFAULT_LANG, key) ??
      key;

    if (typeof value === "function") {
      return value(replacements);
    }

    if (typeof value === "string") {
      return formatTemplate(value, replacements);
    }

    return key;
  }

  function applyTranslations(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.getAttribute("data-i18n");
      if (!key) return;
      const attr = element.getAttribute("data-i18n-attr");
      const value = translate(key);
      if (attr) {
        element.setAttribute(attr, value);
      } else {
        element.textContent = value;
      }
    });

    document.title = translate("documentTitle");
  }

  function setLanguage(lang, { skipApply = false, skipStorage = false } = {}) {
    if (!translations[lang]) {
      lang = DEFAULT_LANG;
    }
    if (lang === currentLang) {
      if (!skipApply) {
        applyTranslations();
      }
      document.dispatchEvent(
        new CustomEvent("i18n:change", { detail: { lang: currentLang } })
      );
      return;
    }
    currentLang = lang;
    if (!skipStorage) {
      storeLanguage(currentLang);
    }
    if (!skipApply) {
      applyTranslations();
    }
    document.dispatchEvent(
      new CustomEvent("i18n:change", { detail: { lang: currentLang } })
    );
  }

  function getLocale() {
    return (
      resolveKey(currentLang, "_locale") ||
      resolveKey(DEFAULT_LANG, "_locale") ||
      "en-GB"
    );
  }

  function getDatasetLabel(source, fallback) {
    const key = `datasetLabels.${source}`;
    const translated = resolveKey(currentLang, key);
    if (translated) return translated;
    const defaultTranslated = resolveKey(DEFAULT_LANG, key);
    if (defaultTranslated) return defaultTranslated;
    return (
      fallback ||
      translate("datasetLabels.fallback")
    );
  }

  function syncLanguageToggle() {
    const buttons = document.querySelectorAll("[data-lang]");
    buttons.forEach((button) => {
      const lang = button.getAttribute("data-lang");
      if (lang === currentLang) {
        button.classList.add("is-active");
        button.setAttribute("aria-pressed", "true");
      } else {
        button.classList.remove("is-active");
        button.setAttribute("aria-pressed", "false");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyTranslations();
    syncLanguageToggle();

    document.querySelectorAll("[data-lang]").forEach((button) => {
      if (button.hasAttribute("data-disabled")) {
        return;
      }
      button.addEventListener("click", () => {
        const lang = button.getAttribute("data-lang");
        setLanguage(lang);
        syncLanguageToggle();
      });
    });
  });

  document.addEventListener("i18n:change", syncLanguageToggle);

  window.I18N = {
    t: translate,
    setLanguage,
    getCurrentLanguage: () => currentLang,
    apply: applyTranslations,
    getLocale,
    getDatasetLabel,
    DEFAULT_LANG,
    translations,
  };
})();
