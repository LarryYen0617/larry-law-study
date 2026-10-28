# Larry Law Study 現代化驗收紀錄

## 已實作（尚未合併）
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
- 正式網站部署管道、域名解析、回復版本與線上實際操作須在合併前確認。

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

## 線上站點檢查（2026-10-29 臺灣時間）
- GitHub Pages：`https://larryyen0617.github.io/larry-law-study/` 可讀取首頁、`courses.html`、`discover.html`、`search-index.json`、物權期中筆記頁。
- `search-preview.html` 在正式站回傳 404，符合尚未部署的現況；本 PR 中已建立此頁，但不應聲稱正式上線。
- `https://larry-law-study.larry20070617.chatgpt.site/` 回傳 HTTP 401，不能當成公開可用的正式站。
- 儲存庫 main 沒有根目錄 `index.html`、也沒有找到常見的 `deploy.yml`／`pages.yml` 工作流程；GitHub Pages 目前如何從 `site/` 發布尚待確認，不能直接假設合併 main 就會自動部署。
