(function () {
  const STORAGE_KEY = "openStreetArenaLang";
  const DEFAULT_LANG = "zh-Hans";

  const translations = {
    "zh-Hans": {
      _locale: "zh-CN",
      documentTitle: "Open Street Arena 地图",
      language: {
        en: "English",
        zhHans: "中文",
        zhHant: "繁体中文",
      },
      topbar: {
        title: "Open Street Arena",
        languageLabel: "语言",
        navigation: "页面切换",
      },
      nav: {
        backHome: "返回首页",
        map: "擂台地图",
        leaderboard: "开放街头排行榜",
        report: "报告袭击事件",
        all: "查看全部事件",
      },
      controls: {
        district: "地区",
        allDistricts: "全部地区",
        period: "时间段",
        allPeriods: "全部时段",
        heat: "热力图",
      },
      periodLabels: {
        morning: "早",
        noon: "中",
        afternoon: "下",
        evening: "晚",
        night: "夜",
        midnight: "半夜",
        dawn: "凌晨",
        unknown: "未知",
      },
      datasetLabels: {
        "local-json": "本地 JSON (./data/incidents.json)",
        "local-csv": "本地 CSV (./data/incidents.csv)",
        "sheets-csv": "Google Sheets CSV",
        fallback: "资料来源",
      },
      summary: "{label} · 显示 {filtered} / {total}",
      summaryInitial: "{label} · 事件总数 {total}",
      disclaimer: {
        general:
          "数据仅供信息参考，来源见事件详情链接；不构成治安判断或执法依据。",
      },
      popup: {
        time: "时间",
        district: "地区",
        category: "分类",
        source: "来源",
        notes: "备注",
        noTime: "未提供",
        noSource: "未提供",
        noNotes: "暂无补充内容",
        noCategory: "未标注",
        noDistrict: "未标注",
        locationSeparator: " · ",
      },
      messages: {
        loadFailed: "资料载入失败，请稍后再试。",
      },
    },
    en: {
      _locale: "en-GB",
      documentTitle: "Open Street Arena Map",
      language: {
        en: "English",
        zhHans: "Chinese",
        zhHant: "Traditional Chinese",
      },
      topbar: {
        title: "Open Street Arena",
        languageLabel: "Language",
        navigation: "Navigation",
      },
      nav: {
        backHome: "Back to Home",
        map: "Arena Map",
        leaderboard: "Open Street Leaderboard",
        report: "Report an Incident",
        all: "View All Incidents",
      },
      controls: {
        district: "District",
        allDistricts: "All Districts",
        period: "Time Period",
        allPeriods: "All Periods",
        heat: "Heatmap",
      },
      periodLabels: {
        morning: "Morning",
        noon: "Midday",
        afternoon: "Afternoon",
        evening: "Evening",
        night: "Night",
        midnight: "Midnight",
        dawn: "Dawn",
        unknown: "Unknown",
      },
      datasetLabels: {
        "local-json": "Local JSON (./data/incidents.json)",
        "local-csv": "Local CSV (./data/incidents.csv)",
        "sheets-csv": "Google Sheets CSV",
        fallback: "Data source",
      },
      summary: "{label} · Showing {filtered} / {total}",
      summaryInitial: "{label} · Total {total} incidents",
      disclaimer: {
        general:
          "Data is for information only; see incident details for sources. Not an indicator of public safety or law-enforcement advice.",
      },
      popup: {
        time: "Time",
        district: "District",
        category: "Category",
        source: "Source",
        notes: "Notes",
        noTime: "Not provided",
        noSource: "Not provided",
        noNotes: "No additional notes",
        noCategory: "Not specified",
        noDistrict: "Not specified",
        locationSeparator: " · ",
      },
      messages: {
        loadFailed: "Failed to load data. Please try again later.",
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

  let currentLang = getStoredLanguage() || DEFAULT_LANG;

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
