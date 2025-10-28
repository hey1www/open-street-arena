(function () {
  const PERIOD_ORDER = [
    "morning",
    "noon",
    "afternoon",
    "evening",
    "night",
    "midnight",
    "dawn",
  ];

  const state = {
    districts: [],
    districtSelect: null,
    periodSelect: null,
  };

  function getCollator() {
    if (typeof Intl === "undefined" || !Intl.Collator) return null;
    if (window.I18N && typeof window.I18N.getLocale === "function") {
      return new Intl.Collator(window.I18N.getLocale(), { sensitivity: "base" });
    }
    return new Intl.Collator(undefined, { sensitivity: "base" });
  }

  function renderDistrictOptions() {
    if (!state.districtSelect) return;
    const select = state.districtSelect;
    const previousValue = select.value || "all";
    select
      .querySelectorAll("option")
      .forEach((opt) => opt.value !== "all" && opt.remove());

    const collator = getCollator();
    const sortedDistricts = [...state.districts].sort((a, b) => {
      if (collator) return collator.compare(a.label, b.label);
      return a.label.localeCompare(b.label);
    });

    sortedDistricts.forEach(({ value, label }) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      select.appendChild(option);
    });

    const allOption = select.querySelector('option[value="all"]');
    if (allOption) {
      allOption.dataset.i18n = "controls.allDistricts";
      if (window.I18N) {
        allOption.textContent = window.I18N.t("controls.allDistricts");
      }
    }

    if (select.querySelector(`option[value="${previousValue}"]`)) {
      select.value = previousValue;
    } else {
      select.value = "all";
    }
  }

  function renderPeriodOptions() {
    if (!state.periodSelect) return;
    const select = state.periodSelect;
    const previousValue = select.value || "all";

    select
      .querySelectorAll("option")
      .forEach((opt) => opt.value !== "all" && opt.remove());

    PERIOD_ORDER.forEach((key) => {
      const option = document.createElement("option");
      option.value = key;
      option.dataset.i18n = `periodLabels.${key}`;
      if (window.I18N) {
        option.textContent = window.I18N.t(`periodLabels.${key}`);
      } else {
        option.textContent = key;
      }
      select.appendChild(option);
    });

    const allOption = select.querySelector('option[value="all"]');
    if (allOption) {
      allOption.dataset.i18n = "controls.allPeriods";
      if (window.I18N) {
        allOption.textContent = window.I18N.t("controls.allPeriods");
      }
    }

    if (select.querySelector(`option[value="${previousValue}"]`)) {
      select.value = previousValue;
    } else {
      select.value = "all";
    }
  }

  function setupControls({
    districts = [],
    initialFilters = { district: "all", period: "all" },
    onFilterChange = () => {},
    onHeatToggle = () => {},
    datasetLabel = "",
  } = {}) {
    const districtSelect = document.getElementById("districtSelect");
    const periodSelect = document.getElementById("periodSelect");
    const heatToggle = document.getElementById("heatToggle");
    const datasetInfo = document.getElementById("datasetInfo");

    if (!districtSelect || !periodSelect || !heatToggle) return;

    state.districtSelect = districtSelect;
    state.periodSelect = periodSelect;
    state.districts = districts;

    renderDistrictOptions();
    renderPeriodOptions();

    if (datasetInfo && datasetLabel) {
      datasetInfo.textContent = datasetLabel;
    }

    if (districtSelect.querySelector(`option[value="${initialFilters.district}"]`)) {
      districtSelect.value = initialFilters.district;
    } else {
      districtSelect.value = "all";
    }

    if (periodSelect.querySelector(`option[value="${initialFilters.period}"]`)) {
      periodSelect.value = initialFilters.period;
    } else {
      periodSelect.value = "all";
    }

    const handleFilterChange = () => {
      onFilterChange({
        district: districtSelect.value,
        period: periodSelect.value,
      });
    };

    districtSelect.addEventListener("change", handleFilterChange);
    periodSelect.addEventListener("change", handleFilterChange);
    heatToggle.addEventListener("change", (event) => {
      onHeatToggle(event.target.checked);
    });

    handleFilterChange();

    document.addEventListener("i18n:change", () => {
      renderDistrictOptions();
      renderPeriodOptions();
    });
  }

  function updateDatasetInfo(text) {
    const datasetInfo = document.getElementById("datasetInfo");
    if (datasetInfo) {
      datasetInfo.textContent = text;
    }
  }

  function setFilters({ district, period }) {
    const districtSelect = document.getElementById("districtSelect");
    const periodSelect = document.getElementById("periodSelect");
    if (district && districtSelect) {
      if (districtSelect.querySelector(`option[value="${district}"]`)) {
        districtSelect.value = district;
      }
    }
    if (period && periodSelect) {
      if (periodSelect.querySelector(`option[value="${period}"]`)) {
        periodSelect.value = period;
      }
    }
  }

  window.UIControls = {
    setupControls,
    updateDatasetInfo,
    setFilters,
    PERIOD_ORDER,
  };
})();
