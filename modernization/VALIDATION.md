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
- 實際瀏覽器端搜尋、手機操作、長文效能與無障礙鍵盤流程尚未做 E2E 測試。
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
正式資料無破壞、CI 綠燈、瀏覽器/手機 E2E 驗收、法規來源核對、部署與回滾路徑明確後才可合併 main。未達條件保持草稿 PR。
