# 孤勇者

手機直式放置型人生模擬遊戲。你是勇者的經紀人。

- 線上遊玩：https://wj4jw4990022.github.io/renee0911/
- 存檔存在各自瀏覽器裡（localStorage）。

## 檔案結構（v17.27 起拆檔）

| 檔案 | 內容 |
| --- | --- |
| `index.html` | 頁面骨架，依序載入下面的檔案 |
| `css/style.css` | 全部樣式 |
| `js/data.js` | 基本設定、資料表（區域、職業、個性、天賦、寶物、事務所等級、NPC） |
| `js/sim.js` | 狀態、每天的流程、戰鬥、傷病、事件、人際、委託、結局與下一代 |
| `js/art.js` | 圖檔資料：Kenney 角色、表情泡泡、裝備圖示、斜角建築、怪物（v17.33，由 `tools/build_art.py` 產生，不要手改） |
| `js/map.js` | 地圖、鏡頭、角色／怪物／建築造型、任務演出、交通、事件小窗格 |
| `js/ui.js` | 介面：上方資訊、對話、底部選單各分頁、設定 |
| `js/life.js` | v17.102：每天一件小事、點勇者給指示、陪他、聊心事、相簿、新玩法（選秀、賽馬、拍賣會、防衛戰、成就……） |
| `js/main.js` | 存檔、主迴圈、開始遊戲（要最後載入） |
| `manifest.webmanifest`、`icons/` | 加到主畫面用的名稱、圖示（v17.28） |
| 角色圖 | Kenney Tiny Dungeon（CC0，https://kenney.nl），換色、拼裝在遊戲裡即時做 |
| `fonts/` | 俐方體11號（Cubic 11）點陣字，SIL Open Font License（見 `fonts/Cubic_11-OFL.txt`） |
| `tools/build_art.py` | 從 design-wip 分支的 `design/` 重新產生 `js/art.js` |
| `sw.js` | App 模式：有網路拿最新版，沒網路用上次存下的（v17.28） |

注意：

- 幾個 js 檔共用同一個全域範圍，`index.html` 裡的載入順序不能換（data → sim → art → map → ui → life → main）。
- 接手先看 `交接_從這裡開始.md`；討論決議與待辦在 `docs/`。
- 改版時把 `index.html` 裡每個檔名後面的 `?v=` 一起改掉，玩家才不會讀到瀏覽器快取的舊檔。
