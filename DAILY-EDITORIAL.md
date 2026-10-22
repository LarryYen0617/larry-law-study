# 每日全新導讀

程式已備妥，預設關閉。未設定以下三項之前不會呼叫模型。

## 啟用（不要把金鑰放進網站或聊天）

在 GitHub → Settings → Secrets and variables → Actions：

1. Secrets 新增 `OPENAI_API_KEY`，填入有可用額度的 API 金鑰。
2. Variables 新增 `OPENAI_MODEL`，填入帳戶可使用且支援 Responses API JSON Schema 輸出的模型名稱。選用的 `OPENAI_REVIEW_MODEL` 可指定另一模型；未設定時以同一模型進行第二次複核。
3. 最後新增 Variable `DAILY_AI_ENABLED`，值為 `true`。

接著 Actions → 每日九點更新與發布 → Run workflow。確認執行紀錄及網站顯示文章日期。停用時把 `DAILY_AI_ENABLED` 改為 `false`。

台北時間每天 09:00 排程，GitHub 可能延遲；並非準點保證。每次執行最多兩次模型請求（產生 8,000、複核 2,500 輸出 token 上限），不自動重試。同日已有通過文章時跳過。失敗後手動重跑仍可能再次產生費用；輸入及推理等計費依所選模型規則，這不是金額上限。請在服務帳戶管理用量。

## 內容與查核流程

官方 RSS → 讀取至少兩份七日內原始文件 → 撰寫約 1,400–2,200 字導讀 → 核對引用原文、來源與格式 → 近 14 篇文字去重 → 第二次模型逐項複核 → 通過才發布。

包含五段分析、反面觀點、適用界線、明確虛構案例與涵攝、反思題及事實主張證據。來源不足或任一步失敗時保留前篇與原日期，網站公開顯示本次狀態；沒有前篇就使用明確標示的既有研讀庫。新聞更新與原有六科練習仍可使用；目前沒有每天新增練習題。

自動檢查不等於人工法律審定，也不保證所有事實正確。至少兩份文件不等於獨立消息來源。未提供書籍原文，不生成假書評、假頁碼或假引文；未取得現行法原文，不補寫未查證條號或裁判。

公開資料在 `site/updates/daily.json`；文章內附來源連結、來源內容雜湊、引用證據、產生與複核時間。原始全文及金鑰不放入公開網站。最近文章與去重紀錄由前次 Pages JSON 延續，不提交回原始碼；需要永久完整文章庫時須另建持久儲存。若前次 Pages 無法讀取，去重與同日跳過紀錄可能不完整。

## 驗證與故障

離線測試：`python -m unittest discover -s tests -v`，`node tests/frontend.cjs`。測試用模擬模型，不呼叫付費 API。

`not_enabled`：等待啟用；`not_configured`：缺金鑰或模型；`no_sources`：原文不足；`rejected`：引用、格式、去重或模型複核未通過；`error`：連線等錯誤。錯誤只輸出安全代碼，不輸出金鑰或 API 回應內文。發布網站後，啟用模式的失敗會把 Actions 標記為失敗以便檢查。

API 格式依據：https://developers.openai.com/api/docs/guides/structured-outputs
