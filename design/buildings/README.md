# 勇者經紀人｜建築（斜 45 度，v1 草稿，2026-11-26）

總表：`_斜角建築總表_v1.png`（右邊放勇者對照比例）
重新產生：`python3 design/buildings/tools/export.py 輸出資料夾`（單張 PNG）、`python3 design/buildings/tools/run2.py 總表.png`

## 方向（開發者已決定）

- 視角：**跟「獵魔村」建築一樣斜 45 度**（2:1 等角，正面朝左下、側面朝右下）
- 畫法：**跟目前的 Kenney 角色、怪物同風格**：Kenney Tiny Town 配色、深棕外框 (63,38,49)、兩三階平塗，不加金邊和細碎陰影
- 窗戶要少（開發者覺得窗戶太多，每面牆最多 1～2 扇）
- 過程：正面版 A／B／C 三選一 → 選 A（Kenney Tiny Town 拼貼）→ 嫌窗戶太多 → 看過獵魔村素材後改成「斜角＋Kenney 風格」。草稿在 `drafts/`

## 檔案（1 格＝1 像素，透明背景，已裁切到內容大小；遊戲裡請用最近鄰放大、底邊對齊地面）

| 檔名 | 建築 | 備註 |
| --- | --- | --- |
| village/mayor | 村長家 | 石基＋木骨灰泥、藍屋頂、旗子 |
| village/arena | 鬥技場 | 四面石牆、沙地、紅旗 |
| village/temple | 神殿 | 山牆正面＋玫瑰窗、後面鐘塔 |
| village/clinic | 藥局 | 綠屋頂、藥水吊牌、綠白遮雨棚 |
| village/inn | 旅館 | 兩層、床吊牌 |
| village/plaza | 廣場 | 石板地＋噴水池 |
| village/tavern | 酒館 | 啤酒吊牌、木桶 |
| village/guild | 冒險者公會 | 藍屋頂山牆、交叉劍招牌、紅旗幟 |
| village/smith | 鐵匠鋪 | 開放火爐、煙囪冒煙、鐵砧 |
| village/house_0～3 | 民宅 ×4 | 紅／藍／綠／棕屋頂 |
| village/shop_0～3 | 民宅變店面 | 同一棟加遮雨棚＋木桶（村民開店時換） |
| village/home_0_rent～home_3_kid | 勇者的家 | 租屋（小破屋）→ 買房 → 結婚（花圃、信箱）→ 有小孩（加蓋小房間、鞦韆） |
| village/stable | 馬廄 | 三格馬房、乾草堆 |
| village/station | 驛馬車站 | 小站房＋候車棚＋站牌 |
| village/telepad / telepad_lot | 傳送陣 / 傳送陣預定地 | 開通前是空石台 |
| village/gate | 村口 | 兩座石柱＋木牌 |
| village/office_1_local～office_4_continent | 你的事務所 | 地方 → 王都 → 王國 → 大陸，越來越大、越來越金 |
| village/office_dark | 事務所（惡名高） | 暗石牆、紫屋頂、亮窗、月亮吊牌 |
| capital/castle | 王都城堡 | 城牆、主塔、四角塔 |
| capital/house_0～1 | 王都民房 | 石基木骨、山牆朝前 |
| capital/station | 王都驛站 | 馬車停在旁邊 |

## 注意

- 目前遊戲村子是「正面看的橫向街道」（`js/map.js` 的 `VSLOTS`、`BLD_ART`），換成斜角圖時，街道和地面也要改成斜角配合；建築大小和 `VSLOTS` 的 w/h 不一樣，要重排
- 程式畫法：`tools/iso.py`（盒子、山牆屋頂、尖頂、牆面局部座標上的門窗招牌），各建築在 `tools/bld.py`
- 這是 **v1 草稿**，開發者還沒逐棟確認

## 待討論

- [ ] 逐棟確認造型（尤其鬥技場、驛馬車站、地方事務所、民宅開店版的遮雨棚）
- [x] 晚上的亮窗版本：遊戲裡依窗戶遮罩自動上色（v17.32）
- [x] 遊戲裡街道改成斜角：選 A（水平街道＋菱形石板）（v17.32）
- [ ] 馬（`horse_iso`）縮小後像一團，要重畫
- [x] 野外道路：A 自然土路，寬度和村子車道一樣、不規則草邊、每區自己的顏色（v17.34）
- [x] 王都換成斜角城堡、民房、驛站＋菱形石板路（v17.34，`game_export.py` 的 cap_*）
- [ ] 野外各區背景物（田、樹、遺跡、礦坑口、沉船、雪山、魔王城）還是正面畫法，要不要重畫成斜角

## 接進遊戲（v17.32，2026-11-26）

- `tools/game_export.py <輸出資料夾>`：輸出遊戲用的 PNG＋`meta.json`（窗戶像素、門的位置與寬度、地基角）。**輸出時左右翻轉，正面朝右下**（遊戲世界往右延伸）；馬和馬車本來就朝右不翻
- main 的 `tools/build_art.py` 會呼叫它，打包進 `js/art.js` 的 `bld`／`bpal`
- 開發者的決定：建築正面朝右；道路走 A（水平街道、菱形石板、路緣石），車道縮窄；建築整張圖不壓到人行道；門前小路和門同寬；**村口不用石門，改成道路上下兩根木樁**（`gate_post`）；**傳送陣不放在村子裡**
- 街邊小物也換成斜角：`prop_lamp`、`prop_crate`、`prop_barrel`、`prop_bench`、`prop_flowers`
