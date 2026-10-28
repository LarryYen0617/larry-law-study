# Larry Law Study — 漸進式升級模組

本目錄是獨立開發中的新模組，**尚未接入正式網站**。現有筆記、題庫、網址與部署流程不受影響。

## 已新增
- `src/legal-search.ts`：零外部依賴的 TypeScript 法律筆記搜尋核心。
- 支援繁體中文關鍵字、全半形正規化、跨欄位 AND 搜尋、科目篩選、結果排序與數量上限。
- `examPriority` 可提高期中／期末考重點的排序，但不會隱藏其他結果。

## 接入前的必要工作
1. 取得並盤點正式網站檔案結構及現有教材來源。
2. 建立教材匯入轉換器，避免直接修改原始筆記。
3. 建立自動化測試，檢查搜尋結果、重複題目、缺漏與手機版。
4. 先於預覽環境測試，再決定是否合併到 main。
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

## 全站搜尋（開發分支）

- `site/search-preview.html` 直接讀取既有 `site/search-index.json`，不覆蓋原始資料。正式索引目前有 3,602 筆：筆記、重點卡片、題目、教師教材、資料庫、閱讀、申論及小說。
- 支援科目／類型篩選、AND 關鍵字搜尋、分頁、手機版版面、結果網址白名單與失敗重試；所有結果文字使用 `textContent`，避免把資料內容當 HTML 執行。
- `site/courses.html` 提供搜尋入口；已在 GitHub Actions 的 Chromium E2E 驗證桌面及 390px 手機視窗搜尋；仍需實機與無障礙驗收，**尚未合併正式站**。
- `modernization/scripts/audit-production-index.py` 以只讀方式檢查原有資料結構、至少 3,602 筆記錄、唯一 ID 與安全連結。
- `modernization/scripts/build-search-index.py` 仍可產生九個 HTML 頁面的輕量預覽索引，供開發驗證；產物 `site/search-preview-index.json` **不納入 Git**，CI 每次重新產生、檢查並確認一致性，不再使用過期的手工 JSON。
- 請勿放入私人講義、個資、未授權教師教材或 API 金鑰。搜尋只是檢索既有內容，**不代表法條與答案已全部查核**。

## 部署流程（尚未啟用正式部署）
- `.github/workflows/deploy-pages.yml` 提供 main 分支限定的 GitHub Pages 發布流程，包含 TypeScript、Chromium E2E、正式索引及預覽索引驗證。
- 合併 main 後的站點相關變更會觸發驗證及部署；若 GitHub Pages 未設定為 GitHub Actions 發布來源，仍需在儲存庫設定中調整。不得以工作流程存在推定已部署。
- 回復方法：將 main 還原至上一次已驗收提交，再由同一工作流程重新部署；保留舊版原始資料及備份。
