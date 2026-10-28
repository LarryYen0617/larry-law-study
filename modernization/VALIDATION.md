# Larry Law Study 現代化驗收紀錄

## 首次升級紀錄（歷史狀態；已由 PR #1、#2 合併）
1. 原有正式搜尋索引 `site/search-index.json` 保持與 main 相同 Git blob SHA `ba57d5391e5eda1c61533a0ab9da6916d7fdbe67`，避免 3,602 筆資料被九頁預覽索引覆蓋。
2. `site/search-preview.html` 改用原有 3,602 筆索引，新增科目、類型篩選、AND 搜尋、排序、分頁、手機排版、安全連結與失敗重試。
3. `site/courses.html` 新增全站搜尋入口；保留原有 `discover.html`。
4. CI 新增正式索引至少 3,602 筆、唯一 ID、必要欄位、相對網址安全性驗證；新增全站搜尋頁靜態無障礙檢查。
5. 九頁開發用索引在 CI 執行 Python 產生器後才進行結構與一致性驗證，不再提交過期的 JSON。
6. 保留原有 TypeScript 搜尋核心、測試、HTML 連結稽核與可下載報告。

## 需要持續核實
- GitHub Actions 必須完整成功；請檢查 PR 最新 commit 的 `Modernization checks`。
- 已在 GitHub Actions 的 Chromium E2E（run #40756354647）驗證 3,602 筆資料載入、關鍵字、科目／類型篩選、分享網址、390px 手機寬度及無未捕捉 JavaScript 錯誤；尚未驗證真實手機觸控、長文效能與完整鍵盤／螢幕閱讀器流程。
- 教師教材授權、法規版本、考試答案及申論品質尚未逐筆查核；資料結構通過不代表內容正確。
- 正式部署管道已確認為 `.github/workflows/daily.yml`；合併後的線上操作與回復版本仍須實際驗證。

## CI 驗證指令
```sh
cd modernization && npm install --no-audit --no-fund && npm test && npm run validate -- examples/notes.sample.json
cd ..
python3 modernization/test/index-builder.test.py
python3 modernization/test/site-audit.test.py
python3 modernization/test/index-audit.test.py
python3 modernization/test/production-audit.test.py
python3 modernization/test/search-page.test.py
python3 modernization/scripts/build-search-index.py
python3 modernization/scripts/audit-index.py
python3 modernization/scripts/audit-production-index.py
python3 modernization/scripts/check-search-index.py
python3 modernization/scripts/audit-site.py site-audit.json
```

## 上線門檻
正式資料無破壞、CI 綠燈、實機手機與無障礙驗收、法規來源核對、部署與回滾路徑明確後才可合併 main。未達條件保持草稿 PR。

## 早期線上站點檢查（歷史觀察，非目前部署狀態）
- GitHub Pages：`https://larryyen0617.github.io/larry-law-study/` 可讀取首頁、`courses.html`、`discover.html`、`search-index.json`、物權期中筆記頁。
- `search-preview.html` 在正式站回傳 404，符合尚未部署的現況；本 PR 中已建立此頁，但不應聲稱正式上線。
- `https://larry-law-study.larry20070617.chatgpt.site/` 回傳 HTTP 401，不能當成公開可用的正式站。
- 已確認正式發布來源為 `.github/workflows/daily.yml`：main push 與每四小時定時執行，先建置課程、題庫、搜尋與前端測試，再將 `site/` 上傳 GitHub Pages。開發分支已在原有發布前插入升級版搜尋及資料安全驗證，避免雙重部署競爭。

## 租稅法源抽樣查核（2026-10-29）
- 中華民國憲法第19條：「人民有依法律納稅之義務。」來源：總統府憲法本文 https://www.president.gov.tw/Page/94 。
- 實質課稅原則及課稅事實舉證責任：現行依《納稅者權利保護法》第7條，官方法條 https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=G0340142&flno=7 。
- 《稅捐稽徵法》第12條之1已刪除，不得作為現行法條引用；來源：https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=G0340001&flno=12-1 。既有租稅筆記已提醒此事，本次未覆蓋原筆記。
- 這是特定條文的抽樣核對，**不是**九科所有題目、法條與實務見解全面查核完成。


## 2026-10-29 搜尋操作改善批次

本批分成五個約 20% 的工作階段，各階段提交可供逐次檢查；百分比僅代表本批範圍，不代表全專案完成比例。

| 階段 | 交付 |
| --- | --- |
| 20% | 移除過期固定筆數，以載入狀態顯示實際筆數 |
| 40% | 搜尋區標示、關鍵字說明、200 字元上限及載入 busy 狀態 |
| 60% | Enter 換頁後聚焦首筆結果、頁碼播報、減少動畫偏好及 44px 按鈕 |
| 80% | Chromium 新增鍵盤、焦點、320px、減少動畫及載入失敗回歸檢查 |
| 100% | 本驗收紀錄與檢查結果，後續依 CI 決定合併 |

- 本機 TypeScript 搜尋測試：7 項通過。
- 本機七個 Python 測試檔案全部通過；搜尋頁靜態檢查含 3 項測試。
- `tests/discover.cjs`、`tests/course-catalog.cjs`、JavaScript 語法與 diff 空白檢查通過。
- 本機重建索引 3,796 筆，原始索引及課程建置產物未納入本批提交。
- 本機缺少 Chromium，下載檔案無法解壓；瀏覽器驗證以本 PR 的 GitHub Actions 結果為準，不將靜態檢查當作瀏覽器實測。
- PR： https://github.com/LarryYen0617/larry-law-study/pull/3 。每次更新須查看最新 head 的 Modernization checks。
- PR #2 的正式發布與自動檢查已成功；早期 404 觀察僅保留作歷史紀錄，不能代表目前站點狀態。
- 本批不代表完整 WCAG 符合性或真實手機／螢幕閱讀器驗收完成，也不代表教材法律內容全面查核完成。
