(function () {
  const PERIOD_ZH_TO_KEY = {
    早: "morning",
    中: "noon",
    下: "afternoon",
    晚: "evening",
    夜: "night",
    半夜: "midnight",
    凌晨: "dawn",
  };

  const PERIOD_LABELS = {
    morning: "早",
    noon: "中",
    afternoon: "下",
    evening: "晚",
    night: "夜",
    midnight: "半夜",
    dawn: "凌晨",
  };

  const CONFIG = {
    DATA_SOURCE: "local-json",
    SHEETS_CSV_URL: "",
  };

  function detectDataSource(searchParams) {
    const params = searchParams || new URLSearchParams(window.location.search);
    const sourceParam = params.get("source");
    if (sourceParam && sourceParam.toLowerCase() === "sheets") {
      return "sheets-csv";
    }
    return CONFIG.DATA_SOURCE || "local-json";
  }

  function composeDateTime(dateStr, timeStr) {
    if (!dateStr) return null;
    const safeDate = String(dateStr).trim();
    if (!safeDate) return null;
    let safeTime = (timeStr || "").trim();
    if (!safeTime) {
      safeTime = "00:00";
    }
    if (/^\d{1,2}:\d{2}$/.test(safeTime)) {
      safeTime = `${safeTime}:00`;
    }
    if (/^\d{1,2}:\d{2}:\d{2}$/.test(safeTime) === false) {
      safeTime = "00:00:00";
    }
    return `${safeDate}T${safeTime}+08:00`;
  }

  function normalizePeriod(periodZh) {
    if (!periodZh) return "unknown";
    const trimmed = String(periodZh).trim();
    return PERIOD_ZH_TO_KEY[trimmed] || PERIOD_ZH_TO_KEY[trimmed[0]] || "unknown";
  }

  function resolveDistrict(abbr) {
    if (!abbr || !window.DISTRICTS) {
      return { abbr: abbr || "NA", full: abbr || "NA" };
    }
    const upper = String(abbr).trim().toUpperCase();
    const full = window.DISTRICTS.ABBR_TO_FULL[upper] || upper;
    return { abbr: upper, full };
  }

  function toNumber(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }

  function generateId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `inc-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  function normalizeRecord(raw) {
    const districtInfo = resolveDistrict(raw.district_abbr || raw.district);
    const datetime = composeDateTime(raw.date, raw.time);
    return {
      id: String(raw.id || "").trim() || generateId(),
      title: (raw.title || "").trim() || "未命名事件",
      datetime,
      period: normalizePeriod(raw.period_zh),
      district: districtInfo.full,
      district_abbr: districtInfo.abbr,
      location: (raw.location || "").trim(),
      lat: toNumber(raw.lat),
      lng: toNumber(raw.lng),
      category: (raw.category || "").trim(),
      source: (raw.source || "").trim(),
      notes: (raw.notes || "").trim(),
      raw,
    };
  }

  async function loadFromLocalJson() {
    const response = await fetch("./data/incidents.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`無法載入本地 JSON：${response.status}`);
    }
    const data = await response.json();
    const normalized = Array.isArray(data)
      ? data.map(normalizeRecord)
      : Object.values(data || {}).map(normalizeRecord);
    return {
      incidents: normalized,
      source: "local-json",
      label: "本地 JSON (./data/incidents.json)",
    };
  }

  async function loadFromLocalCsv() {
    const response = await fetch("./data/incidents.csv", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`無法載入本地 CSV：${response.status}`);
    }
    const text = await response.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    const normalized = (parsed.data || []).map(normalizeRecord);
    return {
      incidents: normalized,
      source: "local-csv",
      label: "本地 CSV (./data/incidents.csv)",
    };
  }

  async function loadFromSheetsCsv() {
    const url = CONFIG.SHEETS_CSV_URL && CONFIG.SHEETS_CSV_URL.trim();
    if (!url) {
      console.warn("未設定 SHEETS_CSV_URL，回退至本地 JSON");
      return loadFromLocalJson();
    }
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`無法載入 Google Sheets CSV：${response.status}`);
    }
    const text = await response.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    const normalized = (parsed.data || []).map(normalizeRecord);
    return {
      incidents: normalized,
      source: "sheets-csv",
      label: "Google Sheets CSV",
    };
  }

  async function loadIncidents(searchParams) {
    const source = detectDataSource(searchParams);
    switch (source) {
      case "local-csv":
        return loadFromLocalCsv();
      case "sheets-csv":
        return loadFromSheetsCsv();
      case "local-json":
      default:
        return loadFromLocalJson();
    }
  }

  window.DataLoaders = {
    CONFIG,
    PERIOD_LABELS,
    loadIncidents,
    detectDataSource,
  };
})();
