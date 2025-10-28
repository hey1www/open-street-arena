export const MAP_CENTER = [22.3193, 114.1694];
export const MAP_ZOOM = 11;

// 你的 MapTiler Key（已做域名白名单：hey1www.github.io / localhost / 127.0.0.1）
export const MAPTILER_KEY = "UsHFuxPyoK1ACJQPfu6N";

// 可选样式: 'streets' | 'basic' | 'outdoor' | 'dataviz' | 'toner' ...
export let MAPTILER_STYLE = "streets";

export function tileUrl() {
  const isRetina = (window.devicePixelRatio || 1) > 1.3;
  if (MAPTILER_KEY) {
    const suffix = isRetina ? "@2x.png" : ".png";
    return `https://api.maptiler.com/maps/${MAPTILER_STYLE}/{z}/{x}/{y}${suffix}?key=${MAPTILER_KEY}`;
  }
  // fallback（仅開發/小流量）：OSM 公共瓦片
  return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
}

export function tileAttribution() {
  if (MAPTILER_KEY) {
    return '© <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors, © <a href="https://www.maptiler.com/copyright/">MapTiler</a>';
  }
  return "© OpenStreetMap contributors";
}

// （可选）切换样式的调试工具：在浏览器控制台运行 __setStyle('outdoor')
window.__setStyle = (style) => {
  MAPTILER_STYLE = style;
  if (window.__tiles) window.__tiles.setUrl(tileUrl());
};

const HEAT_OPTIONS = {
  radius: 22,
  blur: 16,
  minOpacity: 0.25,
  maxZoom: 17,
};

const state = {
  map: null,
  markersLayer: null,
  heatLayer: null,
  incidents: [],
  filteredIncidents: [],
  filters: { district: "all", period: "all" },
  heatEnabled: false,
  markerIndex: new Map(),
  datasetLabel: "",
  datasetSource: "",
  highlightId: null,
  highlightResolved: false,
  lastFitDistrict: null,
  i18nBound: false,
};

function t(key, replacements) {
  if (window.I18N && typeof window.I18N.t === "function") {
    return window.I18N.t(key, replacements);
  }
  return key;
}

function getLocale() {
  if (window.I18N && typeof window.I18N.getLocale === "function") {
    return window.I18N.getLocale();
  }
  return "zh-CN";
}

function getDatasetLabel() {
  if (window.I18N && typeof window.I18N.getDatasetLabel === "function") {
    return window.I18N.getDatasetLabel(state.datasetSource, state.datasetLabel);
  }
  return state.datasetLabel || state.datasetSource || "Data source";
}

function updateDatasetSummary() {
  if (!window.UIControls || typeof window.UIControls.updateDatasetInfo !== "function") {
    return;
  }
  const total = state.incidents.length;
  const filtered = state.filteredIncidents.length;
  let summaryText;
  if (window.I18N && typeof window.I18N.t === "function") {
    const key = filtered === total ? "summaryInitial" : "summary";
    summaryText = window.I18N.t(key, {
      label: getDatasetLabel(),
      filtered,
      total,
    });
  } else {
    summaryText =
      filtered === total
        ? `${getDatasetLabel()} · Total ${total}`
        : `${getDatasetLabel()} · Showing ${filtered} / ${total}`;
  }
  window.UIControls.updateDatasetInfo(summaryText);
}

function isValidLatLng(incident) {
  return (
    typeof incident.lat === "number" &&
    typeof incident.lng === "number" &&
    !Number.isNaN(incident.lat) &&
    !Number.isNaN(incident.lng)
  );
}

function formatDateTime(datetime) {
  const fallback = t("popup.noTime");
  if (!datetime) return fallback;
  const date = new Date(datetime);
  if (Number.isNaN(date.getTime())) return fallback;
  const locale = getLocale();
  try {
    return date.toLocaleString(locale, { timeZone: "Asia/Hong_Kong" });
  } catch (error) {
    return date.toLocaleString(undefined, { timeZone: "Asia/Hong_Kong" });
  }
}

function computeHeatWeight(datetime) {
  if (!datetime) return 1;
  const eventDate = new Date(datetime);
  if (Number.isNaN(eventDate.getTime())) return 1;
  const now = new Date();
  const diffMonths =
    (now.getFullYear() - eventDate.getFullYear()) * 12 +
    (now.getMonth() - eventDate.getMonth());
  if (diffMonths <= 3) return 1;
  if (diffMonths <= 12) return 0.6;
  if (diffMonths <= 24) return 0.3;
  return 0.15;
}

function createPopupContent(incident) {
  const title = incident.title || "—";
  const district = incident.district || t("popup.noDistrict");
  const locationSuffix = incident.location
    ? `${t("popup.locationSeparator")}${incident.location}`
    : "";
  const category = incident.category || t("popup.noCategory");
  const sourceLink = incident.source
    ? `<a href="${incident.source}" target="_blank" rel="noopener">${t("popup.source")}</a>`
    : t("popup.noSource");
  const notes =
    incident.notes && incident.notes.trim().length
      ? incident.notes
      : t("popup.noNotes");

  return `
    <article class="popup">
      <h3 style="margin:0 0 0.5rem;font-size:1.05rem;color:#f8fafc;">${title}</h3>
      <p style="margin:0.3rem 0;color:#cbd5f5;font-size:0.9rem;">
        <strong>${t("popup.time")}:</strong> ${formatDateTime(incident.datetime)}
      </p>
      <p style="margin:0.3rem 0;color:#cbd5f5;font-size:0.9rem;">
        <strong>${t("popup.district")}:</strong> ${district}${locationSuffix}
      </p>
      <p style="margin:0.3rem 0;color:#cbd5f5;font-size:0.9rem;">
        <strong>${t("popup.category")}:</strong> ${category}
      </p>
      <p style="margin:0.3rem 0;color:#cbd5f5;font-size:0.9rem;">
        <strong>${t("popup.source")}:</strong> ${sourceLink}
      </p>
      <p style="margin:0.6rem 0 0;color:#a5b4fc;font-size:0.85rem;line-height:1.4;">
        <strong>${t("popup.notes")}:</strong> ${notes}
      </p>
    </article>
  `;
}

function updateLayers() {
  if (!state.markersLayer || !state.heatLayer) return;
  state.markerIndex.clear();
  state.markersLayer.clearLayers();

  const heatPoints = [];

  state.filteredIncidents.forEach((incident) => {
    if (!isValidLatLng(incident)) return;
    const latlng = [incident.lat, incident.lng];
    const marker = L.marker(latlng, { title: incident.title });
    marker.bindPopup(createPopupContent(incident));
    state.markersLayer.addLayer(marker);
    state.markerIndex.set(incident.id, marker);
    heatPoints.push([incident.lat, incident.lng, computeHeatWeight(incident.datetime)]);
  });

  state.heatLayer.setLatLngs(heatPoints);
  syncLayers();
  maybeHighlightIncident();
}

function syncLayers() {
  if (!state.map) return;
  const map = state.map;
  const usingHeat = state.heatEnabled;
  if (usingHeat) {
    if (map.hasLayer(state.markersLayer)) {
      map.removeLayer(state.markersLayer);
    }
    if (!map.hasLayer(state.heatLayer)) {
      state.heatLayer.addTo(map);
    }
  } else {
    if (map.hasLayer(state.heatLayer)) {
      map.removeLayer(state.heatLayer);
    }
    if (!map.hasLayer(state.markersLayer)) {
      state.markersLayer.addTo(map);
    }
  }
}

function filterIncidents(filters) {
  return state.incidents.filter((incident) => {
    if (filters.district !== "all" && incident.district !== filters.district) {
      return false;
    }
    if (filters.period !== "all" && incident.period !== filters.period) {
      return false;
    }
    return true;
  });
}

function fitToDistrict(district) {
  if (!state.map || !district) return;
  if (district === state.lastFitDistrict) return;
  const bounds =
    (window.DISTRICTS &&
      window.DISTRICTS.DISTRICT_BBOX &&
      window.DISTRICTS.DISTRICT_BBOX[district]) ||
    null;
  if (bounds) {
    state.map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
    state.lastFitDistrict = district;
    return;
  }
  const points = state.filteredIncidents
    .filter((incident) => incident.district === district && isValidLatLng(incident))
    .map((incident) => [incident.lat, incident.lng]);
  if (points.length > 0) {
    state.map.fitBounds(L.latLngBounds(points), { padding: [24, 24], maxZoom: 15 });
    state.lastFitDistrict = district;
  }
}

function maybeHighlightIncident() {
  if (!state.highlightId || state.highlightResolved) return;
  const marker = state.markerIndex.get(state.highlightId);
  if (!marker) return;
  state.markersLayer.zoomToShowLayer(marker, () => {
    marker.openPopup();
    state.highlightResolved = true;
  });
}

function updateQueryParams() {
  const params = new URLSearchParams(window.location.search);
  if (state.filters.district && state.filters.district !== "all") {
    params.set("district", state.filters.district);
  } else {
    params.delete("district");
  }
  if (state.filters.period && state.filters.period !== "all") {
    params.set("period", state.filters.period);
  } else {
    params.delete("period");
  }
  params.delete("id");
  const newQuery = params.toString();
  const newUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ""}`;
  window.history.replaceState({}, "", newUrl);
}

function applyFilters(filters, { skipUrl = false, triggeredBy = "controls" } = {}) {
  const prevDistrict = state.filters.district;
  state.filters = { ...state.filters, ...filters };
  state.filteredIncidents = filterIncidents(state.filters);
  if (!skipUrl) {
    updateQueryParams();
  }
  if (state.filters.district !== "all" && state.filters.district !== prevDistrict) {
    fitToDistrict(state.filters.district);
  }
  if (state.filters.district === "all") {
    state.lastFitDistrict = null;
  }
  updateLayers();
  updateDatasetSummary();
}

function setupHeatToggle() {
  const heatToggle = document.getElementById("heatToggle");
  if (!heatToggle) return;
  heatToggle.checked = state.heatEnabled;
}

function resolveDistrictParam(param, districtNames) {
  if (!param) return null;
  const trimmed = param.trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  if (window.DISTRICTS && window.DISTRICTS.ABBR_TO_FULL[upper]) {
    return window.DISTRICTS.ABBR_TO_FULL[upper];
  }
  const match = districtNames.find(
    (name) => name.toLowerCase() === trimmed.toLowerCase()
  );
  return match || null;
}

function resolvePeriodParam(param) {
  if (!param) return "all";
  const lower = param.toLowerCase();
  if (window.UIControls && window.UIControls.PERIOD_ORDER.includes(lower)) {
    return lower;
  }
  return "all";
}

function handleLanguageChange() {
  if (!state.incidents.length) return;
  if (window.__tiles) {
    window.__tiles.setAttribution(tileAttribution());
    window.__tiles.setUrl(tileUrl());
  }
  updateDatasetSummary();
  updateLayers();
}

function initMap() {
  const map = L.map("map", {
    zoomControl: false,
    preferCanvas: true,
  }).setView(MAP_CENTER, MAP_ZOOM);

  const tiles = L.tileLayer(tileUrl(), {
    attribution: tileAttribution(),
    maxZoom: 20,
    detectRetina: false,
  });
  tiles.addTo(map);
  window.__tiles = tiles;

  L.control.zoom({ position: "bottomright" }).addTo(map);

  state.map = map;
  state.markersLayer = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 48,
  });
  state.heatLayer = L.heatLayer([], HEAT_OPTIONS);
  state.markersLayer.addTo(map);
}

function bootstrap() {
  initMap();
  setupHeatToggle();
  const searchParams = new URLSearchParams(window.location.search);
  state.highlightId = searchParams.get("id");

  const loaders = window.DataLoaders;
  if (!loaders || typeof loaders.loadIncidents !== "function") {
    console.error("DataLoaders 未初始化，無法載入資料來源。");
    return;
  }

  loaders
    .loadIncidents(searchParams)
    .then(({ incidents, label, source }) => {
      state.incidents = incidents;
      state.filteredIncidents = incidents;
      state.datasetLabel = label || "";
      state.datasetSource = source || state.datasetSource || "";

      const districtNames = Array.from(
        new Set(incidents.map((incident) => incident.district).filter(Boolean))
      );

      const initialDistrict =
        resolveDistrictParam(searchParams.get("district"), districtNames) || "all";
      const initialPeriod = resolvePeriodParam(searchParams.get("period"));

      const districtOptions = districtNames.map((name) => ({
        value: name,
        label: name,
      }));

      const presetSummary =
        window.I18N && typeof window.I18N.t === "function"
          ? window.I18N.t("summaryInitial", {
              label: getDatasetLabel(),
              filtered: incidents.length,
              total: incidents.length,
            })
          : `${getDatasetLabel()} · Total ${incidents.length}`;

      let initialFilters = { district: initialDistrict, period: initialPeriod };

      let initialApplied = false;

      const controls = window.UIControls;
      if (!controls || typeof controls.setupControls !== "function") {
        console.error("UIControls 未初始化，無法建立控制面板。");
        return;
      }

      controls.setupControls({
        districts: districtOptions,
        initialFilters,
        datasetLabel: presetSummary,
        onFilterChange: (filters) => {
          const skipUrl = !initialApplied;
          applyFilters(filters, {
            skipUrl,
            triggeredBy: initialApplied ? "controls" : "init",
          });
          initialApplied = true;
        },
        onHeatToggle: (checked) => {
          state.heatEnabled = checked;
          syncLayers();
        },
      });

      // Ensure filters applied even if setupControls exits early
      if (!initialApplied) {
        applyFilters(initialFilters, { skipUrl: true, triggeredBy: "init" });
        initialApplied = true;
      }

      if (!state.i18nBound) {
        document.addEventListener("i18n:change", handleLanguageChange);
        state.i18nBound = true;
      }
    })
    .catch((error) => {
      console.error("資料載入失敗", error);
      if (window.UIControls && typeof window.UIControls.updateDatasetInfo === "function") {
        const message =
          window.I18N && typeof window.I18N.t === "function"
            ? window.I18N.t("messages.loadFailed")
            : "資料載入失敗，請稍後再試。";
        window.UIControls.updateDatasetInfo(message);
      }
    });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
