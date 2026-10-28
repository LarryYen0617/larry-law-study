# Larry Law Study — 漸進式升級模組

本目錄包含漸進式升級模組。全站搜尋頁與發布前驗證已接入正式 GitHub Pages 流程；TypeScript 搜尋核心仍為獨立模組。既有教材來源保留。

## 已新增
- `src/legal-search.ts`：零外部依賴的 TypeScript 法律筆記搜尋核心。
- 支援繁體中文關鍵字、全半形正規化、跨欄位 AND 搜尋、科目篩選、結果排序與數量上限。
- `examPriority` 可提高期中／期末考重點的排序，但不會隱藏其他結果。

## 後續工作
1. 取得並盤點正式網站檔案結構及現有教材來源。
2. 建立教材匯入轉換器，避免直接修改原始筆記。
3. 建立自動化測試，檢查搜尋結果、重複題目、缺漏與手機版。
4. 後續改動先通過預覽與自動化測試，再發布到 main。
5. AI 批改與跨裝置同步需要另外規劃後端、權限、資料保護與成本。

## 資料格式
```ts
import { searchLawNotes, type LawNote } from "./src/legal-search";
const notes: LawNote[] = [{
  id: "civil-property-757",
  subject: "民法物權",
  title: "物權法定原則",
  statute: "民法第757條",
  body: "物權除依法律或習慣外，不得創設。",
  tags: ["期中考", "物權"],
  examPriority: 5,
}];
const hits = searchLawNotes(notes, "物權", { subject: "民法物權" });
```

> 本範例只是示範資料格式；法律內容與現行法版本在正式上線前仍需逐條核對。

## 全站搜尋（已合併）

- `site/search-preview.html` 直接讀取既有 `site/search-index.json`，不覆蓋原始資料。2026-10-29 依課程建置重建的索引有 3,796 筆：筆記、重點卡片、題目、教師教材、資料庫、閱讀、申論及小說。
- 支援科目／類型篩選、AND 關鍵字搜尋、分頁、手機版版面、安全相對 HTML 連結驗證與失敗重試；所有結果文字使用 `textContent`，避免把資料內容當 HTML 執行。
- `site/courses.html` 提供搜尋入口；已在 GitHub Actions 的 Chromium E2E 驗證桌面及 390px 手機視窗搜尋；仍需實機與無障礙驗收，已透過 PR #1、#2 合併並成功發布。
- `modernization/scripts/audit-production-index.py` 以只讀方式檢查原有資料結構、至少 3,602 筆記錄、唯一 ID 與安全連結。
- `modernization/scripts/build-search-index.py` 仍可產生九個 HTML 頁面的輕量預覽索引，供開發驗證；產物 `site/search-preview-index.json` **不納入 Git**，CI 每次重新產生、檢查並確認一致性，不再使用過期的手工 JSON。
- 請勿放入私人講義、個資、未授權教師教材或 API 金鑰。搜尋只是檢索既有內容，**不代表法條與答案已全部查核**。

## 既有正式部署流程
- 原專案已透過 `.github/workflows/daily.yml` 在 main push 及定時任務建置並部署 GitHub Pages；**不得再啟動第二個競爭的 Pages 部署工作流程**。
- 原有流程的正式上傳前已加入 TypeScript、Chromium E2E、至少 3,602 筆索引基線及實際建置筆數一致性、HTML 連結與九科覆蓋驗證；只有這些檢查成功才會進入原有發布步驟。
- 回復方式：將 main 還原至上一次已驗收提交，再由原有 daily.yml 重新發布。定時發布仍須持續觀察。

## 2026-10-29 發布驗收紀錄（臺北時間）

- main：`02fb08329a1b7a99aaf67624a816c923d430646a`；PR #2 已合併。
- 正式發布 run `40758060480` 與 Modernization checks run `40758060355` 均成功；發布工作的 Chromium 測試與 Pages 部署步驟均通過。
- 本地重建法學英文、課程目錄及搜尋索引後，共 3,796 筆；資料結構、唯一 ID、安全連結驗證無問題。
- 24 個 HTML 頁面檢查無阻斷問題；五個申論欄位動態錨點須依 Chromium E2E 驗證，靜態掃描不視為通過證據。
- 上述為建置及部署工作結果，尚未完成正式網址實機、完整無障礙與逐條法律內容查核；資料覆蓋統計不等於原始教材逐份完整性認證。
