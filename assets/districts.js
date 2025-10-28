(function () {
  const ABBR_TO_FULL = {
    CW: "Central and Western",
    EW: "Eastern",
    SO: "Southern",
    WC: "Wan Chai",
    KT: "Kwun Tong",
    KC: "Kowloon City",
    SSP: "Sham Shui Po",
    YTM: "Yau Tsim Mong",
    WCY: "Wong Tai Sin",
    IS: "Islands",
    TW: "Tsuen Wan",
    TM: "Tuen Mun",
    YL: "Yuen Long",
    ST: "Sha Tin",
    TP: "Tai Po",
    N: "North",
    SK: "Sai Kung",
    KCW: "Kwai Tsing",
    TMK: "Tseung Kwan O",
    SSPW: "Sham Shui Po West",
    YLNW: "Yuen Long North West",
    KTSE: "Kwun Tong South East",
    CA: "Central and Western", // alias
    YM: "Yau Tsim Mong", // alias
    TPW: "Tai Po West",
  };

  const FULL_TO_ABBR = Object.entries(ABBR_TO_FULL).reduce((map, [abbr, full]) => {
    if (!map[full]) {
      map[full] = abbr;
    }
    return map;
  }, {});

  const DISTRICT_BBOX = {
    "Central and Western": [
      [22.2604, 114.1208],
      [22.2928, 114.1589],
    ],
    Eastern: [
      [22.2676, 114.1985],
      [22.3082, 114.2561],
    ],
    Southern: [
      [22.2105, 114.1357],
      [22.2528, 114.2156],
    ],
    "Wan Chai": [
      [22.2663, 114.1663],
      [22.2869, 114.1907],
    ],
    "Kwun Tong": [
      [22.2839, 114.2205],
      [22.3363, 114.2518],
    ],
    "Kowloon City": [
      [22.3073, 114.1745],
      [22.3356, 114.2022],
    ],
    "Sham Shui Po": [
      [22.3195, 114.1498],
      [22.3444, 114.1752],
    ],
    "Yau Tsim Mong": [
      [22.2905, 114.1583],
      [22.3237, 114.1831],
    ],
    "Wong Tai Sin": [
      [22.3332, 114.1764],
      [22.3622, 114.2166],
    ],
    Islands: [
      [22.1493, 113.8649],
      [22.3043, 114.275],
    ],
    "Tsuen Wan": [
      [22.3375, 114.0821],
      [22.3989, 114.1356],
    ],
    "Tuen Mun": [
      [22.3517, 113.9578],
      [22.4321, 114.0138],
    ],
    "Yuen Long": [
      [22.4146, 113.9839],
      [22.4936, 114.0982],
    ],
    "Sha Tin": [
      [22.3614, 114.1711],
      [22.4285, 114.2426],
    ],
    "Tai Po": [
      [22.4164, 114.1425],
      [22.5077, 114.2186],
    ],
    North: [
      [22.4626, 114.0629],
      [22.5641, 114.2059],
    ],
    "Sai Kung": [
      [22.3269, 114.2492],
      [22.4725, 114.4056],
    ],
    "Kwai Tsing": [
      [22.3302, 114.0849],
      [22.3797, 114.1461],
    ],
  };

  window.DISTRICTS = {
    ABBR_TO_FULL,
    FULL_TO_ABBR,
    DISTRICT_BBOX,
  };
})();
