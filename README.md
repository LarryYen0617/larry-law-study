# 羽澤法律與閱讀研習室：每日更新分享版

這是可獨立架站、公開分享的完整版本，不依賴 ChatGPT 私人網站，不需要登入，也不需要把 API 金鑰交給朋友。

## 先分清楚兩種更新

1. **六科每日練習與深讀輪替**：網站本身依臺灣時間每天上午9點切換研讀主題，不需要後端排程。18個主題、18題選擇、18題三級申論；六篇自編法律概念深讀依科目輪替。不是每天新增法條、題目或全新文章。法規審閱日保留在文章內，沒有每日自動宣稱重新查證。
2. **官方消息更新**：需啟用完整專案內的 GitHub Actions。排程在外部執行，從行政院、消費者保護資訊、賦稅署官方RSS取得近七日標題、發布時間與連結。不抓私人資料，不編造事件分析。這是官方消息，不是涵蓋所有國際大事的完整新聞服務。

網站沒有每日自動撰寫全新書評或使用付費AI。深度導讀是本專案自編概念文章輪替，含反面檢驗、案例分析、法源連結及應用問題。

## 方案 A：直接用 GitHub Pages，最省事

1. 建立自己的 **public** GitHub repository，預設分支用 `main`。
2. 解壓「完整專案」ZIP，將裡面的檔案與資料夾放到 repository 根目錄。不要只上傳 ZIP 本身，也不要只上傳 `site/`。必須包含 `.github/workflows/daily.yml`、`scripts/`、`tests/`、`content/`、`site/`。
3. 到 repository 的 **Settings → Pages → Build and deployment → Source**，選擇 **GitHub Actions**。
4. 到 **Actions → 每日九點更新與發布 → Run workflow**，先手動執行一次。
5. 打開成功部署步驟提供的 Pages 網址，就是可分享給朋友的網站。這個方案 `site/config.js` 的 `feedUrl` 保持空字串即可。
6. 首次檢查今日閱讀頁的「查看更新狀態與來源」。資料中的 `newsState` 不應再是 `offline`。若全部來源失敗，網站會保留能用的舊內容，工作流程會明確標示失敗，不能當成成功更新。

GitHub 官方使用說明：https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## 方案 B：網站放 InfinityFree，消息由外部更新

1. 解壓「InfinityFree上傳包」，將**所有檔案與子資料夾**放進你的 `htdocs/`，讓 `index.html` 位於 `htdocs/` 根目錄。不要再多包一層同名資料夾。
2. 直接打開你的 InfinityFree 網址：六科、深讀輪替、每日題目、筆記、錯題與進度即可使用。
3. 要讓官方消息每日更新，另依方案 A 完成 GitHub Pages 設定。GitHub Pages 在這裡是公開資料來源；它不會定時呼叫 InfinityFree，不需要也不應在 InfinityFree 上模擬 cron。
4. 在已啟用的 Pages 網址後加上 `/updates/daily.json`，以瀏覽器確認能讀到 JSON。請使用部署服務實際回傳的網址，不要自行猜網域。
5. 編輯 InfinityFree 上的 `config.js`，將公開網址填入 `feedUrl`，保留引號並儲存。該檔案只含公開設定，不得放密碼或金鑰。
6. 回到 InfinityFree 網站，點「今日閱讀 → 更新消息」，確認來源狀態及時間。之後朋友開啟網站會讀取同一份外部公開資料。外部站必須允許瀏覽器跨站讀取（CORS）；如果你的自訂資料站不允許，畫面會明確提示連線失敗。

在「資料與設定」輸入網址，只會改目前瀏覽器；要讓所有朋友共用，必須修改網站的 `config.js`。

InfinityFree 官方公告指出免費方案停用 cron，且禁止定時背景呼叫。因此本專案不提供對 InfinityFree 的 webhook、cron URL、FTP排程上傳或規避機制。外部處理完畢後，只由訪客瀏覽器正常讀取外部資料。

官方公告：https://forum.infinityfree.com/t/cron-job-feature-is-now-disabled/80495

## 九點的意思

- 研讀庫主題以裝置時間計算臺灣時間上午9點的分界；請維持裝置時間正確。已開啟頁面也會在分界後切換內容。
- GitHub 排程設定為 UTC 01:00，亦即臺灣09:00，是啟動時間，不保證內容在09:00整完成。GitHub可能延遲或丟棄高峰期排程。
- GitHub 官方也說明，公開 repository 長時間沒有活動，排程可能在60天後停用；請定期確認 Actions。
- 只有當來源抓取成功、資料發布可讀，才能稱消息更新成功。畫面會區分成功、部分成功、失敗、前次保留與尚未啟用。

官方排程限制：https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule

## 分享與個人紀錄

上傳到公開網址後，可用「分享」按鈕。分享只包含網址，不含個人進度、筆記或作答。各朋友使用自己的瀏覽器紀錄，彼此不會自動同步。

離線直接開啟 `site/index.html` 也可學習，但本機路徑不能當成朋友可開啟的網址。離線或瀏覽器限制儲存時，請匯出備份。不要把含個人教材、筆記的學習備份當作公開網站檔案上傳。

## 維護內容

- 六科題目：`site/data.js`；後端每日選題索引的對應資料：`content/subjects.json`。如果更動題目順序、科目或章節數，兩者必須同步。
- 深讀來源：`content/readings.json`。排程會生成 `site/reading-library.js`；部署後同站會使用新版本。InfinityFree 靜態檔若要全面更新研讀庫，也要重新上傳相關檔案。
- 消息來源：`content/feeds.json`。預設僅接受官方 HTTPS 政府RSS，不使用已停用的司法院RSS。資料若沒有可靠發布日期，不會冒充今日消息。
- 法條：`site/statutes.js` 及官方連結。消息抓取不等於法條自動修正，仍需人工核對法規版本及施行日。

## 目前驗證狀態

本地已完成後端離線測試與前端模擬互動測試，包含日期切換、18日循環、來源解析、來源失敗回退、惡意連結及文字跳脫。附帶快照明確標為 `offline`，沒有假新聞。

更新流程會再次執行10項後端測試與前端互動檢查，通過後才抓取消息並發布。

尚未在你的 GitHub、InfinityFree 帳號執行，沒有聲稱雲端排程、CORS、官方RSS端到端抓取或實際瀏覽器版面已驗證。啟用方法見上方兩種方案。

## 本機測試（選用）

需要 Python 3.12 或相容版本，無第三方套件。

```text
python -m unittest discover -s tests -v
node tests/frontend.cjs
python scripts/update_daily.py --offline
```

`--offline` 只測試打包與輪替，不抓取新聞，狀態會明確保留 offline。正式資料由 GitHub排程執行不帶 `--offline` 的版本。
