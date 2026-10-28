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
