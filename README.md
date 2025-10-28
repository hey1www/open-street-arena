# Open Street Arena

結合 Leaflet、MarkerCluster 與 Heatmap 的靜態實驗站，用以示範「Open Street Area」項目的地圖介面。採 GitHub Pages 雙倉（路線 B）部署：`hey1www/hey1www.github.io` 為 Link Tree 首頁，`hey1www/open-street-arena` 為專案頁並透過 Pages 發佈至 `https://hey1www.github.io/open-street-arena/`。

> ⚠️ **聲明**：本專案僅為資訊整理示例，不構成治安判斷、執法依據或實際通報渠道。若需回報緊急事件，請直接聯絡警方或可信媒體。

## 目錄結構

```
open-street-arena/
├─ index.html            # 地圖主頁（Leaflet）
├─ leaderboard.html      # 各區統計排行（Top N）
├─ all.html              # 全部事件列表 + 搜尋
├─ report.html           # 占位報告表單（未連後端）
├─ assets/
│  ├─ style.css          # 統一深色樣式
│  ├─ app.js             # 地圖邏輯、聚合、熱力圖
│  ├─ data-loaders.js    # JSON / CSV / Sheets 來源切換
│  ├─ ui.js              # 右上控制條、互動橋接
│  └─ districts.js       # 區名映射與 bbox
├─ data/
│  ├─ incidents.json     # 範例資料（可直接使用）
│  └─ incidents.csv      # 與 JSON 等價的 CSV
└─ README.md             # 本文件
```

## 路線 B：部署流程

1. **倉庫 A（hey1www/hey1www.github.io）**
   - 分支：`main`
   - Pages 設定：Source = `main` / root
   - 內容：Link Tree 首頁 `index.html` 與 `assets/style.css`（本專案頁面按鈕已預設指向 `/open-street-arena/`）

2. **倉庫 B（hey1www/open-street-arena）**
   - 建議分支：`main`（或建立 `gh-pages` 亦可）
   - Pages 設定：Source = `main` / root
   - 發佈 URL：`https://hey1www.github.io/open-street-arena/`
   - `index.html`、`leaderboard.html`、`all.html`、`report.html` 皆使用 **相對路徑**（`./assets/...`、`./data/...`），當倉庫以子路徑部署時不會 404。

> ✅ 小提醒：每次增修頁面或資料後，只需推送至相對應倉庫，GitHub Pages 會自動重新部署。

## 地圖配置

- `assets/app.js` 內建 `MAP_CENTER`、`MAP_ZOOM`、`tileUrl()`、`tileAttribution()` 等統一設定。所有瓦片載入應透過這些函式，避免散落硬編碼。
- 預設 MapTiler Key（`UsHFuxPyoK1ACJQPfu6N`）已配置允許 `hey1www.github.io` / `localhost` / `127.0.0.1`，若需替換，直接修改檔案頂部 `MAPTILER_KEY` 即可。
- 可在瀏覽器主控台呼叫 `__setStyle('outdoor')` 等指令切換 MapTiler 樣式，會自動更新在頁面中顯示的瓦片。
- 若將 Key 清空（或移除），`tileUrl()` 會自動改用 OpenStreetMap 公共瓦片作為 fallback（僅建議開發 / 低流量使用）。
- 仍需遵守相對路徑引用規範，例如 `./assets/app.js`、`./assets/style.css`，以確保 GitHub Pages 子路徑正常運作。

## 資料來源切換

`assets/data-loaders.js` 提供三種模式，會在載入地圖、排行榜、列表時共用：

| 模式          | 設定方式                                   | 備註 |
|---------------|---------------------------------------------|------|
| 本地 JSON     | `CONFIG.DATA_SOURCE = "local-json"`         | 預設值，讀取 `./data/incidents.json` |
| 本地 CSV      | `CONFIG.DATA_SOURCE = "local-csv"`          | 讀取 `./data/incidents.csv`，由 Papa Parse 解析 |
| Google Sheets | `CONFIG.DATA_SOURCE = "sheets-csv"` <br> 或 URL 攜帶 `?source=sheets` | 需於 `CONFIG.SHEETS_CSV_URL` 填入公開的 CSV 下載連結 |

### 快速切換流程

1. **修改程式常數**：直接編輯 `assets/data-loaders.js` 中的 `CONFIG.DATA_SOURCE`。
2. **URL 參數覆寫**：任何頁面加上 `?source=sheets`，將強制使用 Sheets CSV。
3. **匯入 Sheets CSV**：
   - 在 Google Sheets 中依照範本欄位建立試算表。
   - 選單「分享 → 發佈到網頁 → 逗號分隔值 (CSV) → 複製公開 URL」。
   - 將 URL 貼入 `CONFIG.SHEETS_CSV_URL`。
   - 佈署後，每次載入頁面都會從該 CSV 即時抓取資料（瀏覽器端解析）。

> 📌 牢記：所有資源引用皆以相對路徑呈現，例如 `./assets/app.js`、`./data/incidents.json`。在子路徑部署時若使用 `/assets/...` 會造成 404。

## 資料格式

欄位順序（CSV）與 JSON 屬性相同：

```
id, title, date, time, period_zh, location, district_abbr, lat, lng, category, source, notes
```

`data-loaders.js` 會標準化為下列物件供前端使用：

```js
{
  id,
  title,
  datetime: "YYYY-MM-DDTHH:MM:SS+08:00",
  period: "morning|noon|afternoon|evening|night|midnight|dawn|unknown",
  district: "Yau Tsim Mong",
  district_abbr: "YM",
  location,
  lat,
  lng,
  category,
  source,
  notes
}
```

### 新增事件

1. 擇一維護 `data/incidents.json` 或 `data/incidents.csv`（建議僅使用其中一種，避免雙邊不同步）。
2. `district_abbr` 必須對應 `assets/districts.js` 內的縮寫（可追加映射）。
3. 若不想公開精確座標，可自行加入 ±20–60 m 的抖動後再填入。
4. 推送後重新整理頁面即可看到更新。

## Link Tree 新增按鈕

- 倉庫 A 的 `index.html` 目前只有「Open Street Arena」一鍵開啟本專案。
- 若要擴充更多頁面，複製 `<a class="link-button">...</a>` 節點即可，並維持相對或完整 URL。
- 樣式共用 `hey1www.github.io/assets/style.css`，如需不同色系可另加修飾類別。

## 隱私與來源合規

- 僅收錄已公開、可驗證的資訊來源（新聞、官方公告、社群公開貼文等）。
- 避免透露個人資料；若包含人像或敏感畫面，請確保已獲授權或做適度模糊。
- 建議對精確座標作數十公尺內的隨機偏移，以降低誤用風險。
- 在 README 與頁面底部皆保留免責聲明，提醒讀者資料僅供參考。

## 驗收清單

部署後請自測以下互動皆正常：

- Link Tree 首頁按鈕能跳轉至 `/open-street-arena/`。
- 地圖頁（index.html）：
  - 頂欄導覽與右上篩選器可用。
  - 香港為預設焦點，縮放控制存在右下角。
  - 熱力圖與聚合互斥切換正常。
  - `?district=`、`?id=`、`?source=` 參數生效。
  - 未填 MapTiler Key 時自動使用 OSM 瓦片。
- 頂欄語言切換支援「中文 / English」，繁體中文按鈕為灰色占位不可點擊。
- 排行榜頁（leaderboard.html）：顯示統計並可點擊帶回地圖且自動套用篩選。
- 全部事件頁（all.html）：表格搜尋即時篩選，點選列回地圖可高亮事件。
- 報告頁（report.html）：顯示外部連結與禁用表單，明確告知不收集資料。

如需更多功能（例如真實後端表單、權限管控、數據版本化），可在此靜態基礎上再外掛伺服器或無伺服器服務。祝部署順利！🎯
