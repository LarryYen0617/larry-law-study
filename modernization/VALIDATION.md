# 驗證範圍與驗收門檻

## 本輪已完成（程式提交）
1. 搜尋索引產生器：排除 head 中非正文資訊，修正巢狀忽略區塊。
2. 搜尋預覽：類別篩選、分享連結 q 參數、搜尋結果網址白名單、結果數提示。
3. 搜尋索引：結構、必要欄位、重複 URL、相對路徑與來源檔案存在檢查。
4. 網站稽核：無 HTML 檔案時明確回報異常；連結與重複 ID 掃描。
5. 自動化測試：索引產生器、索引安全性、網站稽核測試已納入 CI。

## 已實際透過 GitHub 來源核對
- 9 筆索引的對應 HTML 存在。
- 9 筆索引標題與 HTML title 一致。
- 9 筆索引沒有重複 URL、沒有必要欄位缺漏。
- **尚未證明索引正文與目前產生器逐字相同。**

## 待驗證（不可視為已通過）
- GitHub Actions 完整測試成功、Python 腳本實際執行結果。
- `check-search-index.py` 全文一致性。手動建立的初始 JSON 與後續修改過的 Python 擷取規則可能有差異，須重新產生 `site/search-index.json` 並提交。
- 全站所有頁面、題庫題目與答案、教材版權與授權、最新法律條文及實務見解。
- 瀏覽器端行為、手機操作、效能及正式部署。

## 開發者驗收指令
```sh
cd modernization && npm install --no-audit --no-fund && npm test && npm run validate -- examples/notes.sample.json
cd ..
python3 modernization/test/index-builder.test.py
python3 modernization/test/index-audit.test.py
python3 modernization/test/site-audit.test.py
python3 modernization/scripts/audit-index.py
python3 modernization/scripts/build-search-index.py
python3 modernization/scripts/check-search-index.py
python3 modernization/scripts/audit-site.py site-audit.json
```

建議在重新產生索引後檢查 diff，再提交，並於 CI 全綠、瀏覽器驗收與內容校對後才合併主分支。
