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
依實際變更範圍驗收：正式資料無破壞、最新 CI 綠燈、相關操作與無障礙自動檢查通過，並確認既有部署與回滾路徑後可合併。新增或修改法律內容須另做法規來源核對；介面修正不以全部教材查核為前置。真實手機與螢幕閱讀器測試另行追蹤，未完成時不得聲稱已完成實機或完整無障礙認證。

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


## 2026-10-29 搜尋頁最終驗收補修

- 後續工作採完成一批後統一提交；前段 20% 紀錄僅代表先前批次。
- 修正換頁後焦點已移動、畫面卻捲回頁首的問題；現在直接捲到第一筆結果，減少動畫設定仍會生效。
- 自動無障礙掃描發現狀態文字對比僅 4.38:1；已在搜尋頁改為主要文字色並增加字級，避免影響其他頁面的樣式。
- 已以本機 Chromium 完成 3,796 筆資料 E2E，新增 320px 換頁後焦點可見性驗證。
- 新增 axe-core 掃描至既有 E2E，在桌面、320px 及深色偏好三種狀態檢查 WCAG 2 A/AA、2.1 A/AA 與 2.2 AA 可自動判定項目；本機掃描均無 violations，另行抽查的 incomplete 亦為空。
- 只提交搜尋頁、E2E、測試依賴及本紀錄，教材及產生的搜尋索引保持不變。
- 發布前以 PR 最新提交的 Modernization checks 為準，發布後另確認原有 Pages 工作與正式搜尋頁內容。
- 自動掃描無違規不等於完整 WCAG 符合性認證；真實 iOS／Android 與螢幕閱讀器驗收仍未完成。


## 2026-10-29 行政懲戒教材入口補漏

- 發現 `class-notes/administrative-discipline-remedies.html` 已有整理，但正式 site/、課程清單與搜尋均缺少獨立專題入口。
- 本次重新讀取《2026-10-20 14_02_07.docx》第5–6頁，確認行政懲處、一次記二大過免職、出差安排與費用的課堂脈絡；整理不是逐字原文，也不代表完整期中考公告。
- 法規依全國法規資料庫核對：公務員懲戒法第1–3、9、64、66條；公務人員考績法第12條；公務人員保障法第25、30、77–79條。頁面保留三法官方連結與版本日期。
- 補入憲法法庭釋字第785號的權利救濟說明，避免把管理措施概括解讀為一律不能提行政訴訟；與課堂整理分列。來源：https://cons.judicial.gov.tw/docdata.aspx?fid=100&id=310966 。
- 建置只明列發布這一份已整理的 HTML，不遍歷複製來源目錄；待複核行政法試卷草稿及限制閱覽法英試卷均未發布。
- 11門課、10份課堂資源，重建搜尋3,797筆；索引原始Git檔不提交覆蓋，依既有發布流程重建。
- 課程與教材連結測試通過；新增回歸檢查，確保行政法入口存在、來源與發布頁一致且待複核試卷仍留在發布目錄外。
- 本機 Chromium 搜尋 E2E 以3,797筆通過；新專題在1280px、390px及320px均無頁面橫向溢位，axe可自動檢查項目均無violations。
- 回歸實測另抓到搜尋競態：切換科目已完成搜尋後，舊關鍵字延遲計時仍會重畫結果並把換頁重設到第1頁。立即搜尋時取消舊計時，並檢查按 Enter 換頁後超過延遲窗口仍保持第2頁及焦點。


## 2026-10-29 全站來源重查與教材閱讀設計

- 盤點正式載入的1,872題及109則教師／課堂題目區塊，693題法條填空逐字比對相符；2,897處法條來源引文中，2,896處直接相符，1處憲法增修條文第12條混入網站導覽，已重新閱讀官方單條全文後修正。此處計算引用次數，不代表2,897條不同法條。
- 刷新127條筆記法條快照，所有原有對照均取得內容；保留民法第166-1條尚未施行註記。最新公布條文與已施行條文仍須分辨。
- 移除題庫載入時一律設定source-checked及固定日期的邏輯，保留各題原有證據與日期；新增校訂僅對明列項目生效。
- 物權BOT專題重新查閱市府簽約公告、促參法及細則；區分已取得的公開證據、新聞引述與仍需契約正本／謄本的事實，不以取消警示冒充完成查證。
- 共用閱讀樣式套用10份教材正文，統一字級、行寬、標題、段落、來源區塊與表格；來源說明可展開，法律疑義與證據界線保持可見。所有表格區域可鍵盤聚焦。舊study-hub仍依既有規則導向課程總覽。
- 本機10份正文於1280/390/320px共30種情境無頁面橫向溢位、自動axe掃描無violations；另檢查3種寬度的舊入口導向。已實際檢視桌面及手機截圖。
- 引文比對不是所有案例、學說、裁判及教師範圍全部完成的證明。完整證據與未完成範圍記錄於content/maintenance/verification-2026-10-29.json。
- 另修正建置回歸：知識資料重新產生時不再把canonical中的逐字原題欄位重新帶入網站，公開案例維持改寫形式；來源檔與原題雜湊保留。新增建置測試確保重建不撤銷此處理。
