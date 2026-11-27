// 孤勇者 · map.js：地圖、鏡頭、角色／怪物／建築造型、任務演出、交通、事件小窗格
// 這幾個檔案共用同一個全域範圍，要照 index.html 裡的順序載入
'use strict';
// ================= 地圖 =================
const cv = $('cv'), ctx = cv.getContext('2d');
cv.addEventListener('click', e => { $('alerts').classList.remove('open'); $('bell').classList.remove('open'); const r = cv.getBoundingClientRect(), sx = (e.clientX - r.left) / r.width * 360, sy = (e.clientY - r.top) / r.height * SH;
  if (performance.now() - V.noClick < 350) return; if (pipHit()) return; if (vilMiniHit(sx, sy)) return; mapClick(cam.x + (sx - 180) / cam.z, cam.y + (sy - SH / 2) / cam.z); });
let mons = [];
// v17.36：每區 4 隻，區域橫切成 4 格、一隻一格，不會擠在一起（打倒的那隻重生前看不到，所以畫面上通常 3～4 隻）
const MON_N = 4;
const monSlot = m => { const R = ZONES[m.z].rect, end = R[2] - 14 - (m.z === 2 || m.z === 6 ? 56 : 0), w = (end - R[0] - 14) / MON_N, i = (m.s ?? 0) % MON_N; return [R[0] + 14 + w * i + 9, R[0] + 14 + w * (i + 1) - 9]; };   // 每格左右各留 9，相鄰兩隻至少隔 18；荒地、魔王城右邊留給魔王
function respawn(m, fade){ const R = ZONES[m.z].rect, [a, b] = monSlot(m); m.x = rand(a, b); m.y = rand(R[1] + 14, R[3] - 14); m.ph = Math.random() * 6; m.wx = m.x; m.born = fade ? performance.now() : 0; }   // fade：剛重生的怪先藏起來再淡入
function initMons(){ mons = []; ZONES.forEach((Z, z) => { for (let i = 0; i < MON_N; i++) { const m = { z, s:i }; respawn(m); mons.push(m); } }); }
const TREES = [[22,40],[70,96],[30,160],[118,30],[112,180],[60,20],[20,110],[95,140],[130,120],[45,70]];
const ROCKS = [[180,30],[250,55],[320,25],[210,70],[300,70]];
const fz = n => +(n / Math.sqrt(Math.max(1, cam.z))).toFixed(1);
// ================= v10：三張地圖（村子／周邊／遠方） =================
let userView = null, viewMan = 0;
const curView = () => heroMap(H());   // v17.11：只有一條路
const MAPN = { vil:'村子', out:'周邊', far:'遠方' };
// ================= v17.5：村子＝一條橫向街道（建築全排在上方，鏡頭跟著勇者左右捲動） =================
// 勇者在模擬裡的座標（h.x / h.y）不動，村子裡另外有一個「街上的位置」V.x / V.y，
// 依照他正在做的事走到對應建築的門口；要進屋的事（睡覺、看病、在家耍廢……）走到門口就進去。
const VH = 170, V_BASE = 118, V_WALK = 144, V_DOOR = 122, V_GAP = 6;
// 依勇者一天的動線排：村口 → 出門前會經過的鐵匠、公會 → 中間的事務所 → 休閒、休息、看病 → 住宅區
const VSLOTS = [   // v17.17：家和民宅搬到村口旁；交通設施在家和村口之間；商店和事務所往左
  { k:'gate',    n:'村口',       w:44, h:58 },
  { k:'station', n:'驛馬車站',   w:46, h:54 },
  { k:'stable',  n:'馬廄',       w:52, h:50 },
  { k:'home',    n:'勇者的家',   w:50, h:52 },
  { k:'house',   n:'民宅', i:0,  w:42, h:44 },
  { k:'house',   n:'民宅', i:1,  w:42, h:44 },
  { k:'house',   n:'民宅', i:2,  w:42, h:44 },
  { k:'house',   n:'民宅', i:3,  w:42, h:44 },
  { k:'smith',   n:'鐵匠鋪',     w:54, h:62 },
  { k:'guild',   n:'冒險者公會', w:66, h:72 },
  { k:'tavern',  n:'酒館',       w:46, h:64 },
  { k:'office',  n:'你的事務所', w:66, h:74 },
  { k:'stage',   n:'廣場',       w:56, h:46 },
  { k:'inn',     n:'旅館',       w:50, h:66 },
  { k:'clinic',  n:'診所',       w:44, h:58 },
  { k:'temple',  n:'神殿',       w:62, h:88 },
  { k:'arena',   n:'鬥技場',     w:60, h:58 },
  { k:'mayor',   n:'村長家',     w:56, h:66 },
];
VSLOTS.reverse();   // v17.11：村口在右端，接著野外
// v17.32：建築換成斜 45 度圖（ART.bld，design/buildings）。每格的寬度取所有造型裡最寬的，升級時整條街不會位移
const V_GROUND = V_BASE - 3, V_ROAD = 124, V_ROAD_B = 150, VD = {};   // V_ROAD～V_ROAD_B：車道（人行道在上面 V_BASE～V_ROAD）   // 建築地基最前面那個角對齊這條線
const ISO_VAR = { office:['office_1', 'office_2', 'office_3', 'office_4', 'office_dark'], home:['home_0', 'home_1', 'home_2', 'home_3'], station:['station'], gate:['post'] };   // v17.32：村口只是道路上下兩根木樁；傳送陣不放在村子裡
const isoVars = b => b.k === 'house' ? ['house_' + b.i, 'shop_' + b.i] : ISO_VAR[b.k] || [b.k];
VSLOTS.forEach(b => { b.w = Math.max(...isoVars(b).map(n => ART.bld[n].w)) + (b.k === 'station' ? 62 : b.k === 'gate' ? 12 : 0); b.h = Math.max(...isoVars(b).map(n => ART.bld[n].h)); });
let VW = 116; VSLOTS.forEach(b => { b.x = VW; VW += b.w + V_GAP; isoPlace(b, isoVars(b)[0]); }); VW += 18;
// 把某個造型擺進這一格：圖置中、地基角放在 V_GROUND，整張圖（含門口的木桶、花圃）都不壓到人行道；算出點擊範圍 b.r、門口 b.door（門前小路接到人行道的位置）
function isoPlace(b, name){ const B = ART.bld[name], cx = b.x + (b.k === 'station' ? (b.w - 62) / 2 : b.w / 2), wx = Math.round(cx - B.w / 2 + B.ax), gy = Math.min(V_GROUND, V_BASE - 2 - (B.h - 1 - B.ay));
  b.iso = name; b.ax = wx; b.gy = gy; b.r = [wx - B.ax, gy - B.ay, B.w, B.h];
  b.dx = wx - B.ax + B.door; b.dy = gy - B.ay + B.dy; b.dw = B.dw;   // 門口（牆腳）在世界座標的位置
  b.path = ['gate', 'stage', 'telepad'].includes(b.k) || B.door === B.ax ? 0 : Math.max(0, V_BASE - b.dy);   // 門前小路往右下延伸到人行道
  b.door = Math.round(b.dx + b.path * 2); if (b.k !== 'house') VD[b.k] = b.door; }
VSLOTS.forEach(b => { if (b.k !== 'house') VD[b.k] = b.door; });
{ const b = VSLOTS.find(b => b.k === 'house' && b.i === 0); if (b) VD.shop = b.door; }
VD.pond = VD.gate - 64;   // v17.90：釣魚的位置（村口內側、驛馬車站前，池塘在右下的草地）   // v17.87：逛街＝第一間民宅（有村民開店時是店面）
// ================= v17.11：一條長路（村子在最左邊，村口在右端直接接著野外） =================
// 村子和野外共用同一條橫軸。勇者「在村子裡」時，模擬座標就停在村口（GX, GY）；x 超過村口就是在野外。
const GX = VD.gate, GY = V_WALK;
const inVil = h => h.x <= GX + 1.5;
const RY0 = 112, RY1 = 148;   // 野外勇者和怪物活動的範圍（v17.34：路面縮成和村子一樣 124～150，怪物站在路上）
// 依序：草原、森林、王都、荒地、礦坑、海岸、雪山、魔王城；越遠越長
const WSEG = [['z', 0, 230], ['z', 1, 260], ['cap', -1, 140], ['z', 2, 290], ['z', 3, 320], ['z', 4, 350], ['z', 5, 390], ['z', 6, 460]];
const CAP = { x0:0, x1:0 };
let WW = VW + 24;
WSEG.forEach(([t, z, w]) => { const x0 = WW, x1 = WW + w; if (t === 'z') { ZONES[z].rect = [x0, RY0, x1, RY1]; ZONES[z].map = 'wild'; } else { CAP.x0 = x0; CAP.x1 = x1; } WW = x1 + 14; });
WW += 40;
const CARX = CAP.x1 - 24;   // 旅行商隊停在王都出口
const MSPOT_B = { endorse:'stage', variety:'stage', meet:'stage', arena:'arena', trial:'clinic', smith:'smith', coach:'arena', charity:'stage', banquet:'station' };   // 村子裡的事務所任務在哪棟
const V = { x:null, y:V_WALK, mv:false, left:false, inside:null, pk:null, p:0, fa:1, cx:null, tagId:null, tagT:0, exiting:0, wander:null, wait:0, pan:null, panT:0, drag:null, noClick:0 };
const vilPos = new Map();
let vilHits = [];
// 原本的判斷（照模擬座標）；外面包一層：勇者要出村子時，畫面上先讓他走到村口
function heroMapRaw(h){
  if (h.act === 'hunt' && h.zone >= 0) return hourOf() < 7 ? 'vil' : ZONES[h.zone].map;   // v17.10：7:00 前在家準備
  if (h.act === 'mission' && h.mission) { if (MSPOT[h.mission.ag] || h.mission.ug) return 'vil'; const z = h.mission.z;
    const ph = mPhase(h); if (ph === 'prep') return 'vil'; if (ph === 'home') return inVil(h) ? 'vil' : 'wild';   // v17.13：還在回村的路上就照實際位置 if (ph === 'back' && z >= 0 && ZONES[z]) return inVil(h) ? 'vil' : 'wild';   // v17.7：通勤，晚上在村子
    if (z >= 0 && ZONES[z]) return ZONES[z].map; }
  return inVil(h) ? 'vil' : 'wild';
}
function heroMap(h){ const m = heroMapRaw(h); return m !== 'vil' && h === H() && V.exiting && performance.now() < V.exiting ? 'vil' : m; }
const villagePos = h => [V.x ?? VD.office, V.y];
// 這件事要去哪棟、要不要進屋
function vilGoal(h){
  const hr = hourOf();
  if (vCarry()) return ['clinic', 1];   // v17.9：失敗受傷，被擡去診所
  if (tourRound() >= 0) return ['arena', 0];   // 武鬥大會
  if (sleeping()) return h.act === 'drink' ? ['tavern', 1] : ['home', 1];
  if (h.act === 'bed') return ['clinic', 1];
  { const z = lzNow(h); if (z) return z; }   // v17.87：收工後的休閒
  if (h.act === 'slack') return ['home', 1];
  if (h.act === 'home') return ['home', hr >= 20 ? 1 : 0];
  if (h.act === 'drink') return ['tavern', hr >= 19 ? 1 : 0];
  if (h.act === 'strike') return ['office', 0];
  if (h.act === 'side') return ['stage', 0];
  if (h.act === 'train') return ['arena', 0];
  if (h.act === 'rest') return ['home', 1];   // v17.89：在家休息就進屋（原本站在家門口的路上）
  if (h.act === 'mission' && h.mission) { const ph = mPhase(h);   // v17.7：任務期間不在工作時，照常在村子裡生活
    if (ph === 'prep') return ['home', 0];
    if (ph === 'nout') return ['gate', 0];
    if (ph === 'home' || ph === 'free' || ph === 'back') return hr >= 22.5 ? ['home', 1] : null; }
  if (h.act === 'mission' && h.mission && h.mission.ag === 'patrol') return null;   // v17.90：夜間巡邏＝在街上來回走
  if (h.act === 'mission' && h.mission && MSPOT_B[h.mission.ag]) return [MSPOT_B[h.mission.ag], h.mission.ag === 'trial' || h.mission.ag === 'banquet' ? 1 : 0];   // v17.51：代言、綜藝、見粉絲都站在廣場前面的路上
  if (h.act === 'hunt' && hr < 7) return ['home', 0];
  if (h.act === 'hunt' || h.act === 'mission') return ['gate', 0];
  return null;   // 閒晃
}
// v17.56：勇者在屋裡時，門口上方冒的表情泡泡（和勇者頭上同一套 Kenney 泡泡；畫在夜色之後，晚上也看得清楚）
function insideEmo(h){ const k = V.inside;
  if (k === 'home') return sleeping() ? '想睡' : h.act === 'slack' ? '累' : h.mood < 35 ? '難過' : '開心';
  if (k === 'tavern') return h.mood < 35 ? '難過' : '喝醉';
  if (k === 'clinic') return h.act === 'mission' && h.mission && h.mission.ag === 'trial' ? '緊張' : '好痛';
  if (k === 'office') return '認真';
  return '開心'; }
function doorEmo(now){ const h = H(), wx = VD[V.inside]; if (wx == null) return; const wy = V_BASE - 22 + Math.sin(now / 500) * 1.5, sx = 180 + (wx - cam.x) * cam.z, sy = SH / 2 + (wy - cam.y) * cam.z;
  drawEmo(ctx, insideEmo(h), sx + 14, sy, now, .8 * cam.z); }
// 每一格畫面更新勇者在街上的位置
// v17.38：門前小路。sx＝小路接到人行道的點（VD[k]），dx、dy＝真正的門口
function vDoor(k){ const b = VSLOTS.find(b => b.k === k && b.door === VD[k]) || VSLOTS.find(b => b.k === k); if (!b || b.dx == null) return null;
  return { sx:VD[k], dx:b.dx, dy:Math.min(b.dy, V_DOOR) }; }
function vOnPath(){ const d = vDoor(V.pk); if (!d) { V.pk = null; V.p = 0; V.fa = 1; return; } V.x = d.sx + (d.dx - d.sx) * V.p; V.y = V_DOOR + (d.dy - V_DOOR) * V.p; }
const vPathLen = k => { const d = vDoor(k); return d ? Math.max(4, Math.hypot(d.dx - d.sx, d.dy - V_DOOR)) : 4; };
// 每一格畫面更新勇者在街上的位置
function vilTick(dt, now){
  const h = H(), raw = heroMapRaw(h), alive = !['dead', 'retired', 'left'].includes(h.act) && !heroHidden(h);
  if (V.lastRaw === 'vil' && raw !== 'vil' && alive && V.x != null && !offline) V.exiting = now + 7000;   // 要出門：先走到村口
  if (V.lastRaw && V.lastRaw !== 'vil' && raw === 'vil') { V.x = VD.gate; V.y = V_WALK; V.exiting = 0; V.pk = null; V.p = 0; V.fa = 1; }   // 回村：從村口走進來
  V.lastRaw = raw;
  if (raw !== 'vil' && !V.exiting) { V.inside = null; V.pk = null; V.p = 0; V.fa = 1; return; }
  if (CH && !V.inside) { const c = chasePos(now); V.x = c.hx; V.y += clamp(V_WALK - V.y, -40 * dt, 40 * dt); V.mv = c.run; V.left = false; V.pk = null; V.p = 0; V.fa = 1; return; }   // v17.90：抓小偷
  let goal = V.exiting ? ['gate', 0] : vilGoal(h), tx;
  const inGoal = goal && goal[1] ? goal[0] : null;
  if (V.x == null && inGoal && vDoor(inGoal)) { V.pk = inGoal; V.p = 1; V.fa = 0; vOnPath(); V.inside = inGoal; return; }   // 剛載入：直接在屋裡
  // 在門前小路上（或屋裡），但現在要去別的地方：先在門口淡入，再沿小路走出來
  if (V.pk && V.pk !== inGoal) { V.inside = null;
    if (V.fa < 1) { V.fa = Math.min(1, V.fa + dt / .4); V.mv = false; vOnPath(); return; }
    V.p = Math.max(0, V.p - dt * 26 / vPathLen(V.pk)); vOnPath(); V.mv = true; const d = vDoor(V.pk); V.left = d ? d.sx < d.dx : false;
    if (V.p > 0) return; V.pk = null; }
  // 正在進門：沿小路走到門口，再淡出
  if (V.pk && V.pk === inGoal) {
    if (V.p < 1) { V.p = Math.min(1, V.p + dt * 26 / vPathLen(V.pk)); vOnPath(); V.mv = true; const d = vDoor(V.pk); V.left = d ? d.dx < d.sx : true; V.inside = null; return; }
    V.mv = false; V.fa = Math.max(0, V.fa - dt / .4); vOnPath(); V.inside = V.fa <= 0 ? V.pk : null;
    if (V.inside === 'clinic' && vCarry()) S.carry.done = 1; return; }
  if (goal) { tx = VD[goal[0]]; V.wander = null; }
  else { if (!V.wander || (Math.abs(V.x - V.wander) < 2 && (V.wait -= dt) <= 0)) { V.wait = rand(2, 6); V.wander = Math.random() < .5 ? pick(VSLOTS).door + rand(-10, 10) : clamp((V.x ?? VD.office) + rand(-60, 60), 20, VW - 20); } tx = V.wander; }
  if (V.x == null) { V.x = tx; }
  const d = tx - V.x, far = Math.abs(d), sp = (V.exiting ? 230 : far > 150 ? 210 : 70) * dt;   // 遠的地方用跑的：一個月只有 30 秒，晚上回家不能走太久
  V.mv = far > 1.5; if (V.mv) { V.left = d < 0; V.x += Math.sign(d) * Math.min(far, sp); }
  const atDoor = goal && far < 3, ty = atDoor && goal[1] ? V_DOOR : atDoor && goal[2] ? goal[2] : V_WALK;
  V.y += clamp(ty - V.y, -40 * dt, 40 * dt); if (Math.abs(ty - V.y) > .5) V.mv = true;
  V.inside = null;
  if (atDoor && inGoal && Math.abs(V.y - V_DOOR) < 1) { if (vDoor(inGoal)) { V.pk = inGoal; V.p = 0; } else { V.inside = inGoal; V.fa = 1; } }   // 走到小路口：接著走小路
  if (V.exiting && Math.abs(V.x - VD.gate) < 3) V.exiting = 0;
}
// 狀態字：要進屋的事（睡覺、喝酒、看病）在勇者還沒進門前寫「回家中」「走去酒館」
function vWalkTxt(h){ if (offline || heroMap(h) !== 'vil' || V.x == null || V.exiting) return ''; const g = vilGoal(h); if (!g || !g[1] || V.inside === g[0]) return '';
  return { home:'回家中', tavern:'走去酒館', clinic:'走去診所' }[g[0]] || '走去' + ((VSLOTS.find(b => b.k === g[0]) || {}).n || ''); }

// ================= v17.87：收工後的休閒（開發者 11/27：勇者自己決定；你「請喝一杯」「一起吃飯」那晚就跟你去） =================
// 收工後到 22:30，一晚選一件；花他自己的錢包；22:00 結算（早點睡隔天早上才加體力）。離線補跑時不演也不算。
const LZ = {
  chat:  { n:'找朋友聊天',   g:['stage', 0], txt:z => `和${z.nm}聊天` },
  date:  { n:'約會',         g:['stage', 0], txt:z => `和${z.nm}約會` },
  drink: { n:'自己去喝一杯', g:['tavern', 1], txt:() => '在酒館喝一杯' },
  tchat: { n:'在酒館聊天',   g:['tavern', 1], txt:z => `在酒館和${z.nm}聊天` },
  walk:  { n:'散步',         g:['stage', 0], txt:() => '在廣場散步' },
  fish:  { n:'釣魚',         g:['pond', 0],  txt:() => '在池塘邊釣魚' },
  shop:  { n:'逛街',         g:['shop', 0],  txt:() => '逛街買東西' },
  train: { n:'自主練習',     g:['arena', 0], txt:() => '在鬥技場自主練習' },
  read:  { n:'看書',         g:['home', 1],  txt:() => '在家看書' },
  sleep: { n:'早點睡',       g:['home', 1],  txt:() => '累了，早點睡' },
  boss:  { n:'和老闆出去',   g:['tavern', 1], txt:z => z.meal ? '和老闆一起吃飯' : '和老闆喝一杯' },
};
const LZ_OFF = {};
const LZ_SAY = { chat:['今天跟朋友聊了好多', '工作完聊個天真放鬆'], date:['今晚約會！', '嘿嘿，今天約好了'], drink:['今天想自己喝一杯', '來一杯就回家'], tchat:['酒館今天好熱鬧'],
  walk:['去廣場走走', '晚上的噴水池很漂亮'], fish:['去池塘釣魚', '今天會釣到大魚嗎'], shop:['去逛逛有什麼新東西', '想買點東西犒賞自己'], train:['再練一下！', '今天的動作還不夠好'], read:['今天在家看書', '這本書好好看'], sleep:['好累……先睡了', '今天早點睡'] };
// 現在是不是收工後的空檔（人在村子裡、22:30 前）
function lzFree(h){ const hr = hourOf();
  if (offline || hr >= 22.5 || hr < 12 || heroMapRaw(h) !== 'vil' || h.jailed || (h.bedDays || 0) > 0) return false;
  if (h.act === 'mission' && h.mission) { const o = h.mission, k = mKind(o); if (!k || o.ug) return false;
    return k === 'slot' ? mPhase(h) === 'free' && hr >= mWin(o)[1] : mPhase(h) === 'home'; }
  return ['idle', 'home', 'rest'].includes(h.act) && hr >= 17.5; }
const lzBoss = h => h.lastDrink === S.day ? { meal:0 } : h.lastMeal === S.day ? { meal:1 } : null;
// 照個性、心情、錢包挑一件
function lzPick(h){
  const X = hx(h, 'X'), O = hx(h, 'O'), C = hx(h, 'C'), w = h.wallet || 0, ok = n => n && n.alive && !n.dark && !['rival', 'rival2'].includes(n.role) && !((n.sick || 0) > S.day);
  if (h.sta < 25) return { k:'sleep' };
  const pt = h.partner && npc(h.partner), fr = S.npcs.filter(n => ok(n) && n.aff >= 50 && n.id !== h.partner), any = S.npcs.filter(ok);
  const W = { chat:fr.length ? .5 + X * 1.5 + (hasP(h, 'social') ? .5 : 0) + dw(h, 'social') : 0,
    date:ok(pt) && w >= 20 ? 1.2 + dw(h, 'romance') : 0,
    drink:w >= 30 ? .3 + (hasP(h, 'drinker') ? 1.5 : 0) + (h.mood < 35 ? .8 : 0) + (h.stress > 60 ? .6 : 0) : 0,
    tchat:w >= 15 && any.length ? .3 + X : 0, walk:.5 + (1 - X) * .6 + (h.trait === 'calm' ? .4 : 0),
    fish:.3 + (1 - X) * .5 + (h.trait === 'lazy' ? .4 : 0), shop:w >= 60 && h.trait !== 'greedy' ? .3 + (h.goal === 'seiko' ? 1 : 0) : 0,
    train:h.sta >= 40 ? .2 + C * .8 + (h.trait === 'hot' ? .4 : 0) + dw(h, 'status') * .5 : 0, read:.3 + (1 - X) * .5 + O * .5, sleep:h.sta < 45 ? .8 : .15 };
  Object.keys(LZ_OFF).forEach(k => W[k] = 0);
  let r = Math.random() * Object.values(W).reduce((a, b) => a + b, 0), k = 'walk';
  for (const [kk, v] of Object.entries(W)) { r -= v; if (v > 0 && r <= 0) { k = kk; break; } }
  const who = k === 'chat' ? pick(fr) : k === 'date' ? pt : k === 'tchat' ? pick(any) : null;
  return { k, id:who ? who.id : null, nm:who ? who.name : '' };
}
// 每一格：挑活動、22:00 結算、隔天早上加減體力
function lzTick(h, hr){
  if (h.lzNext && h.lzNext.day < S.day && hr >= 6.5) { adj('sta', h.lzNext.v); h.lzNext = null; }
  if (S.lz && S.lz.day !== S.day) S.lz = null;
  if (!S.lz) { if (!lzFree(h)) return; const b = lzBoss(h);
    S.lz = b ? { day:S.day, k:'boss', meal:b.meal } : { day:S.day, ...lzPick(h) };
    if (S.lz.k === 'sleep') { h.lzNext = { day:S.day, v:10 }; S.lz.done = 1; }
    if (LZ_SAY[S.lz.k] && chance(.35)) say(pick(LZ_SAY[S.lz.k]));
    return; }
  const z = S.lz; if (z.done) return;
  if (z.k !== 'boss') { const b = lzBoss(h); if (b) { z.k = 'boss'; z.meal = b.meal; return; } }   // 玩家晚上才約：那晚改跟你去
  if (hr < 22 || z.k === 'boss') { if (z.k === 'boss' && hr >= 22) z.done = 1; return; }
  z.done = 1; if (offline) return; const pay = v => { const c = Math.min(h.wallet || 0, v); h.wallet -= c; };
  switch (z.k) {
    case 'chat': adj('mood', 4); adj('stress', -4); affAdd(z.id, 3); break;
    case 'date': adj('mood', 8); adj('stress', -6); affAdd(z.id, 4); pay(20); break;
    case 'drink': adj('mood', 6); adj('stress', -8); pay(30); if (hasP(h, 'drinker') && chance(.5)) { h.lzNext = { day:S.day, v:-10 }; if (chance(.5)) say('……好像喝太多了'); } break;
    case 'tchat': adj('mood', 3); affAdd(z.id, 2); pay(15); break;
    case 'walk': adj('stress', -5); break;
    case 'fish': adj('stress', -6); if (chance(.2)) { const g = ri(10, 40); h.wallet += g; say(`釣到大魚！賣了 ${g} 金`); } break;
    case 'shop': adj('mood', 5); pay(ri(20, 60)); break;
    case 'train': gainExp(2); adj('sta', -5); adj('stress', 2); break;
    case 'read': adj('stress', -4); if (hx(h, 'O') >= .6) adj('mood', 3); break;
  }
}
const lzOn = h => S.lz && S.lz.day === S.day && !S.lz.gone && lzFree(h) ? S.lz : null;
function lzNow(h){ const z = lzOn(h); if (!z) return null; return z.k === 'boss' ? ['tavern', 1] : LZ[z.k].g; }
function lzTxt(h){ const z = lzOn(h); return z ? LZ[z.k].txt(z) : ''; }
const lzAt = (h, k) => { const z = lzOn(h); return z && z.k === k && heroMap(h) === 'vil' && V.x != null && !V.mv && !V.inside && Math.abs(V.x - VD[LZ[k].g[0]]) < 4; };
// 聊天、約會：朋友站在勇者右邊，兩人頭上輪流冒泡泡
function lzGuest(now){ const h = H(); for (const k of ['chat', 'date']) { if (!lzAt(h, k)) continue; const n = npc(S.lz.id); if (!n || !n.alive) return;
  const x = V.x + 16; V.left = false; drawSprite(ctx, n, x, V_WALK, false, now, { moving:false, left:true });
  const t = Math.floor(now / 1600) % 2; emoAt(k === 'date' ? '戀愛' : t ? '開心' : '想到了', t ? x : V.x, V_WALK - 22, now); } }

// ================= v17.90：蹲下、夜間巡邏、抓小偷、釣魚 =================
function heroCrouch(h, now){ const s = SCN; if (!s || s.off || !s.work || h !== H() || h.act !== 'mission') return false;
  return Math.abs((h.tx ?? h.x) - h.x) < .6 && Math.abs((h.ty ?? h.y) - h.y) < .6 && Math.floor(now / 700) % 2 === 0; }   // 到了採集點：一蹲一起
const lzAt2 = (h, k) => { const z = lzOn(h); return !!z && z.k === k; };
const patrolOn = h => h.act === 'mission' && h.mission && h.mission.ag === 'patrol' && mPhase(h) === 'slot' && hourOf() >= 20;
let CH = null;   // 抓小偷的追逐（6.5 秒）
function chaseTick(h, hr, now){
  if (offline) return;
  if (!S.chR || S.chR.day !== S.day) { const pat = h.act === 'mission' && h.mission && h.mission.ag === 'patrol'; S.chR = { day:S.day, at:pat ? rand(20.5, 23) : rand(9, 19), go:chance(pat ? .35 : .04) }; }
  if (CH) { if (now - CH.t0 > 6500) { CH = null; thiefCaught(h); renderAll(); } return; }
  if (!S.chR.go || S.chR.done || hr < S.chR.at || hr >= 24) return;
  if (heroMap(h) !== 'vil' || V.inside || V.x == null || V.exiting || V.mv || sleeping() || vCarry()) return;
  const ok = S.npcs.filter(n => n.alive && !n.dark && !['rival', 'rival2'].includes(n.role));
  S.chR.done = 1; CH = { t0:now, x0:clamp(V.x, 80, VW - 200), vic:ok.length ? pick(ok).id : null }; }
// 追逐中勇者的位置：小偷搶完往右跑，勇者跟在後面，最後撲倒
function chasePos(now){ const p = (now - CH.t0) / 1000, k = clamp((p - .8) / 4.2, 0, 1);
  return { p, hx:CH.x0 + k * 120, tx:CH.x0 + 22 + k * 124 + (p > 5 ? 4 : 0), run:p > .8 && p < 5 }; }
function chaseDraw(now){ if (!CH) return; const c = chasePos(now), y = V_WALK, v = CH.vic && npc(CH.vic);
  if (v) { const vx = CH.x0 - 22; drawSprite(ctx, v, vx, y, false, now, { moving:false, left:false, noEmo:true }); if (c.p < 4) emoAt('驚訝', vx, y - 22, now - CH.t0); }
  if (c.p < 5) { rPerson('hood', c.tx, y + 1, false, null, c.run ? Math.floor(now / 120) % 2 : 0); pR2(c.tx + 4, y - 10, 5, 5, '#3f2631'); pR2(c.tx + 5, y - 9, 3, 3, '#9a7a5a'); }   // 抱著錢袋
  else { const cv = rideCanvas('hood', 'room'); ctx.save(); ctx.translate(c.tx, y); ctx.rotate(Math.PI / 2); ctx.drawImage(cv, -cv.width, -Math.floor(cv.width / 2)); ctx.restore();   // 跌倒、錢袋掉地上
    pR2(c.tx + 10, y - 4, 6, 5, '#3f2631'); pR2(c.tx + 11, y - 3, 4, 3, '#9a7a5a'); pR2(c.tx + 12, y - 2, 2, 1, '#f7c94a'); }
  if (c.run) { for (let i = 0; i < 3; i++) pR2(c.tx - 14 - i * 2, y - 8 + i * 3, 6, 1, 'rgba(255,255,255,.6)'); if (Math.floor(now / 1500) % 2 === 0) emoAt('生氣', c.hx, y - 22, now % 1500); } }
// 夜間巡邏：勇者手上的提燈照出一圈光
// 提燈的光（畫在夜色之後，螢幕座標）
function patrolLight(now){ const h = H(); if (!patrolOn(h) || heroMap(h) !== 'vil' || V.inside || V.x == null) return; const wx = V.x + (V.left ? -7 : 7), wy = V_WALK - 6, f = .85 + .15 * Math.sin(now / 180);
  const x = 180 + (wx - cam.x) * cam.z, y = SH / 2 + (wy - cam.y) * cam.z, r = 40 * cam.z; ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, `rgba(255,200,110,${.5 * f})`); g.addColorStop(1, 'rgba(255,200,110,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, r, r * .7, 0, 0, 7); ctx.fill(); ctx.restore(); }
function patrolDraw(now){ const h = H(); if (!patrolOn(h) || heroMap(h) !== 'vil' || V.inside || V.x == null) return; const x = V.x + (V.left ? -7 : 7), y = V_WALK - 9, f = .85 + .15 * Math.sin(now / 180);
  pR2(x - 2, y - 3, 5, 7, '#3f2631'); pR2(x - 1, y - 2, 3, 5, '#fadc6e'); pR2(x - 1, y - 4, 3, 1, '#8b9bb4'); }
// 釣魚：村口外的小池塘（畫在人物前面），勇者蹲在岸邊甩竿，浮標上下動，偶爾沉下去＋驚訝
function pondDraw(now){ const cx = VD.pond + 30, cy = V_ROAD_B + 11, hw = 180 / cam.z; if (Math.abs(cx - cam.x) > hw + 40) return;
  ctx.fillStyle = '#3f2631'; ctx.beginPath(); ctx.ellipse(cx, cy, 25, 7, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#4082c8'; ctx.beginPath(); ctx.ellipse(cx, cy, 23.5, 5.6, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#549cdc'; ctx.beginPath(); ctx.ellipse(cx + 2, cy + 1, 16, 3.4, 0, 0, 7); ctx.fill(); pR2(cx - 10, cy - 1, 5, 1, '#bee6fa'); pR2(cx + 8, cy + 2, 4, 1, '#bee6fa');
  [[cx - 24, 0], [cx + 22, 1]].forEach(([x, k]) => { for (let i = 0; i < 3; i++) pR2(x + i * 2, cy - 7 - (i + k) % 2 * 2, 1, 7 + (i + k) % 2 * 2, '#3c783c'); });
  const h = H(); if (!lzAt(h, 'fish')) return; const t = (now % 6000) / 6000, bite = t > .8, hx = V.x + 6, hy = V_WALK - 8, bx = cx - 6, by = cy - 1 + (bite ? 2 : Math.round(Math.sin(now / 300)));
  ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + 14, hy - 12); ctx.stroke(); ctx.strokeStyle = 'rgba(240,240,240,.85)'; ctx.beginPath(); ctx.moveTo(hx + 14, hy - 12); ctx.lineTo(bx, by - 1); ctx.stroke();
  pR2(bx - 1, by - 2, 3, 2, '#e84537'); pR2(bx - 1, by, 3, 1, '#f4eee0'); if (bite) emoAt('驚訝', V.x, V_WALK - 18, (t - .8) * 6000); }
// 鏡頭：村子永遠讓整條街的高度剛好塞滿畫面，左右跟著勇者（或玩家滑到的地方）
function vilCam(h, hm, now){
  const z = SH / VH, panning = V.drag || (V.pan != null && now - V.panT < 3500);
  if (!panning) V.pan = null;
  const x = panning ? V.pan : hm === 'vil' && V.x != null ? V.x : VD.office;
  return [x, VH / 2, z];
}
// 手指左右滑：逛街；放開 3.5 秒後鏡頭回到勇者身上
cv.style.touchAction = 'pan-y';
cv.addEventListener('pointerdown', e => { V.drag = { x0:e.clientX, c0:cam.x, moved:false }; });
cv.addEventListener('pointermove', e => { const g = V.drag; if (!g) return; const r = cv.getBoundingClientRect(), dx = (e.clientX - g.x0) / r.width * 360 / cam.z;
  if (!g.moved && Math.abs(e.clientX - g.x0) > 6) g.moved = true;
  if (g.moved) { V.pan = clamp(g.c0 - dx, 0, WW); V.panT = performance.now(); } });
const vEnd = () => { if (V.drag && V.drag.moved) { V.noClick = performance.now(); V.panT = performance.now(); } V.drag = null; };
cv.addEventListener('pointerup', vEnd); cv.addEventListener('pointercancel', vEnd); cv.addEventListener('pointerleave', vEnd);
function drawVillage(now){
  const hr = hourOf(), night = hr >= 20 || hr < 6, bm = night ? (hr >= 23 || hr < 6 ? 'late' : 'night') : 'day', h = H();
  const hw = 180 / cam.z;
  ctx.drawImage(vilStreet(), 0, 0, VW, VH);
  vilHits = [];
  const shops = S.npcs.filter(n => n.alive && n.shop).slice(0, 4), homeO = { own:h.house ? 1 : 0, mar:h.married ? 1 : 0, kid:h.child ? 1 : 0 };
  VSLOTS.forEach(b => { const sh = b.k === 'house' ? shops[b.i] : null, st = stageOf();
    const nm = b.k === 'telepad' ? (teleOpen() ? 'telepad' : 'lot') : b.k === 'office' ? ((S.infamy || 0) >= 60 ? 'office_dark' : 'office_' + Math.max(1, Math.min(4, st))) : b.k === 'home' ? 'home_' + (homeO.kid ? 3 : homeO.mar ? 2 : homeO.own ? 1 : 0) : b.k === 'house' ? (sh ? 'shop_' : 'house_') + b.i : b.k;
    if (b.iso !== nm) isoPlace(b, nm);
    const [x, y, w, hh] = b.r; if (x > cam.x + hw + 30 || x + w < cam.x - hw - 30) { if (b.k !== 'house') vilHits.push({ r:b.r, k:b.k }); return; }
    if (b.k === 'gate') { drawIso(ctx, 'post', b.ax, V_ROAD + 1, 'day'); nameTag(ctx, b.n, b.ax, V_ROAD - 26, 'npc'); vilHits.push({ r:b.r, k:b.k }); return; }
    if (b.path) isoPath(b.dx, b.dy, b.path, b.dw);
    drawIso(ctx, nm, b.ax, b.gy, b.k === 'home' && heroMap(h) !== 'vil' ? 'day' : bm);
    if (b.k === 'smith') for (let i = 0; i < 3; i++) { const t = (now / 900 + i / 3) % 1; ctx.fillStyle = `rgba(210,210,210,${.55 - t * .55})`; ctx.fillRect(x + 13 + Math.sin(t * 6) * 2, y + 6 - t * 20, 3 + t * 3, 3 + t * 3); }
    if (b.k === 'stable' && h.horse && heroMap(h) === 'vil' && !(h.leg && h.leg.mode === 'horse')) drawRideSpr(ctx, 'horse_stand', b.ax + 26, V_BASE - 2, false);   // v17.39：勇者的馬
    if (b.k === 'station') { const B = ART.bld[nm]; drawRideSpr(ctx, 'coach_0', b.ax - B.ax + B.w + 4 + 31, V_BASE - 2, false); }   // v17.39：馬車停在站房旁邊，留一段空
    const label = b.k === 'telepad' && !teleOpen() ? '傳送陣預定地' : b.k === 'home' ? `${h.name}${h.married ? '家' : '的家'}` : sh ? sh.shop.slice(0, 4) : b.k === 'house' ? '' : b.n;
    if (label) nameTag(ctx, label, x + w / 2, y - 3, b.k === 'office' || b.k === 'home' ? 'hero' : 'npc');
    if (sh) vilHits.push({ r:b.r, k:'npc', id:sh.id }); else if (b.k !== 'house') vilHits.push({ r:b.r, k:b.k }); });
  drawVilShow(now); drawTourShow(now); if (H().act === 'train' || lzAt(H(), 'train')) arenaShow(now, 'train'); if (H().act === 'strike' || H().act === 'side') plazaShow(now, H().act); drawVilGuests(now); drawEpisode(now);
  drawVilEnd(now);   // v17.17：左端的河、橋、小山
  // 村民：各自在工作的地方附近，偶爾去別棟；晚上去酒館
  const WORK = { tavern:'tavern', smith:'smith', guild:'guild', priest:'temple', mayor:'mayor', reporter:'stage', fan:'office', merc:'guild', elder:'temple' };
  const ppl = S.npcs.filter(n => n.alive && !n.dark && !['rival', 'rival2'].includes(n.role) && !((n.sick || 0) > S.day));
  const vis = hourOf() >= 24 ? [] : night ? ppl.filter(n => n.role === 'tavern' || n.aff >= 60).slice(0, 4) : ppl.slice(0, 16);
  const gIds = guestIds(), dt = Math.min(.1, (now - (V.vt || now)) / 1000); V.vt = now;
  // v17.38：每人固定在自己工作的那棟門口附近，同一棟的人左右錯開；大多待在原地，偶爾去別棟晃一下；走路時互相讓開
  const LANES = [130, 136, 142, 148], homeOf = {}, cnt = {};
  vis.forEach((n, i) => { const k = WORK[n.role] ? VD[WORK[n.role]] : VSLOTS.filter(b => b.k === 'house')[i % 4].door; homeOf[n.id] = [k, cnt[k] = (cnt[k] || 0) + 1]; });
  const list = [];
  vis.forEach((n, i) => {
    if (gIds.includes(n.id)) return;   // 在村口迎接、來道謝的村民另外畫
    const [hk, ki] = homeOf[n.id], home = hk + ((ki - 1) - (cnt[hk] - 1) / 2) * 18;
    let p = vilPos.get(n.id);
    if (!p || p.v !== 177) { p = { v:177, x:home + rand(-4, 4), tx:home, y:LANES[i % 4], ty:LANES[i % 4], w:rand(2, 8) }; vilPos.set(n.id, p); }
    if (night) { const j = vis.indexOf(n); p.tx = VD.tavern - 21 + j * 14; p.ty = LANES[j % 2]; }
    else if (Math.abs(p.tx - p.x) < 2 && (p.w -= dt) <= 0) { p.w = rand(4, 10); p.tx = Math.random() < .8 ? home + rand(-6, 6) : pick(VSLOTS).door + rand(-6, 6); }
    list.push([n, p, i]); });
  // 互相讓開：靠太近（左右 14、上下 5 以內）就各自往旁邊推，走路的人換一條線
  list.forEach(([n, p]) => list.forEach(([n2, q]) => { if (n === n2) return; const dx = p.x - q.x, dy = p.y - q.y;
    if (Math.abs(dx) < 14 && Math.abs(dy) < 5) { const push = (dx >= 0 ? 1 : -1) * 6 * dt; p.x += push; if (Math.abs(p.tx - p.x) < 4) p.tx += push; const mv = Math.abs(p.tx - p.x) > 2; if (mv && n.id > n2.id && Math.abs(p.ty - q.ty) < 5) p.ty = LANES[(LANES.indexOf(p.ty) + 1 + LANES.length) % LANES.length] ?? LANES[0]; } }));
  // 誰的名牌要顯示：最近點到的那位，或勇者身邊最近的那位（只有一個，不會疊在一起）
  const hv = heroMap(h) === 'vil' && !V.inside ? villagePos(h)[0] : null;
  let near = null, nd = 30; if (hv != null) list.forEach(([n, p]) => { const d = Math.abs(p.x - hv); if (d < nd) { nd = d; near = n.id; } });
  const tagId = V.tagId && now - V.tagT < 4000 ? V.tagId : near;
  list.sort((a, b) => a[1].y - b[1].y).forEach(([n, p, i]) => {
    const mv = Math.abs(p.tx - p.x) > 2; if (mv) p.x += Math.sign(p.tx - p.x) * Math.min(Math.abs(p.tx - p.x), 21 * dt);
    p.y += clamp(p.ty - p.y, -12 * dt, 12 * dt);
    const x = Math.round(p.x), y = Math.round(p.y); if (x < cam.x - hw - 20 || x > cam.x + hw + 20) return;
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(x - 6, y, 12, 2);
    drawSprite(ctx, n, x, y, false, now + i * 137, { moving:mv || Math.abs(p.ty - p.y) > .5, left:mv ? p.tx < p.x : hv != null ? hv < x : false, expr:(n.sick || 0) > S.day ? 'sick' : 'normal' });
    if (n.id === tagId) nameTag(ctx, n.name.slice(0, 4), x, y - KEN_TAG, n.aff >= 50 ? 'friend' : 'npc');
    if (hv != null && n.id === near && !sleeping()) { const ph = Math.floor(now / 1800 + i * 3) % 6; if (ph < 2) { const em = ['…', '♪', '哈', '嗯', '!', '?'][(i + Math.floor(now / 10800)) % 6]; ctx.fillStyle = '#f1ece0'; ctx.fillRect(x + 3, y - 36, 11, 9); ctx.fillStyle = '#161b27'; ctx.font = fz(8) + 'px sans-serif'; ctx.fillText(em, x + 5, y - 29); } }
    vilHits.push({ r:[x - 9, y - 24, 18, 26], k:'npc', id:n.id }); });
}
// 前景（畫在人物前面）：路燈、木箱、花圃
const VPROPS = []; for (let x = 124, i = 0; x < VW - 40; x += 46 + (i * 29) % 30, i++) VPROPS.push([x, i % 3 === 0 ? 'lamp' : ['crate', 'flowers', 'barrel', 'bench', 'flowers'][i % 5]]);
function drawVilFront(now){
  const hr = hourOf(), bm = hr >= 23 || hr < 6 ? 'late' : hr >= 18.5 ? 'night' : 'day', hw = 180 / cam.z;
  VPROPS.forEach(([x, k]) => { if (x < cam.x - hw - 30 || x > cam.x + hw + 30) return;
    drawIso(ctx, 'p_' + k, x, VH - 4, k === 'lamp' ? bm : 'day'); });
  const g = VSLOTS.find(b => b.k === 'gate'); if (g && Math.abs(g.ax - cam.x) < hw + 30) drawIso(ctx, 'post', g.ax, V_ROAD_B + 3, 'day');   // 村口前面那根木樁（蓋在人物前面）
  pondDraw(now);   // v17.90
}
// 小地圖：畫面最上方一條細長條，標出每棟建築、勇者位置和目前看到的範圍；點一下跳過去
const MINI = { x0:120, x1:352, y:3, h:6 };
function drawVilMini(now){
  const { x0, x1, y, h: mh } = MINI, k = (x1 - x0) / VW, hw = 180 / cam.z, hm = heroMap(H());
  ctx.fillStyle = 'rgba(16,20,30,.6)'; ctx.fillRect(x0 - 2, y - 2, x1 - x0 + 4, mh + 4);
  VSLOTS.forEach(b => { ctx.fillStyle = b.k === 'office' ? '#f2c14e' : b.k === 'home' ? '#6fcf97' : b.k === 'gate' ? '#9fd0ff' : 'rgba(241,236,224,.45)'; ctx.fillRect(x0 + b.x * k, y + 1, Math.max(1, b.w * k - .6), mh - 2); });
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = .7; ctx.strokeRect(x0 + (cam.x - hw) * k, y - 1, hw * 2 * k, mh + 2);
  if (hm === 'vil' && V.x != null) { ctx.fillStyle = '#ff7b7b'; ctx.beginPath(); ctx.arc(x0 + V.x * k, y + mh / 2, 2, 0, 7); ctx.fill(); }
  // 勇者在屋裡：門口上方冒一個小泡泡（畫在夜色之後，晚上也看得清楚）
  if (V.inside && hm === 'vil') doorEmo(now);   // v17.56：門口上方冒 Kenney 表情泡泡
}
function vilMiniHit(sx, sy){ const { x0, x1, y, h: mh } = MINI; if (sy > y + mh + 8 || sx < x0 - 6 || sx > x1 + 6) return false; V.pan = clamp((sx - x0) / (x1 - x0) * WW, 0, WW); V.panT = performance.now(); return true; }
function drawFar(now){
  const W = 360, Hh = 270;
  ctx.fillStyle = '#4a5a3a'; ctx.fillRect(0, 0, W, Hh);
  // 王都（中間）
  ctx.fillStyle = '#b9a27a'; ctx.fillRect(166, 0, 28, Hh);
  drawBld(ctx, 'castle', 138, 0, 84, 88, 'day');
  [[146, 110], [196, 120], [146, 170], [198, 186], [150, 226], [196, 238]].forEach(([x, y], i) => drawBld(ctx, 'cottage', x - 2, y, 22, 20, 'day', { roof:['#7a4a3a', '#4f7fb0', '#c0563f'][i % 3], wall:'#c8a070' }));
  ctx.font = fz(10) + 'px Cubic11, sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('王都', 168, 96);
  ZONES.forEach((Z, z) => { if (Z.map !== 'far') return; const [x0, y0, x1, y1] = Z.rect, w = x1 - x0, hh = y1 - y0;
    ctx.fillStyle = Z.c; ctx.fillRect(x0, y0, w, hh);
    if (z === 3) { ctx.fillStyle = '#8a7a6a'; ctx.fillRect(x0 + 10, y0 + 60, 120, 2); for (let k = 14; k < 130; k += 6) ctx.fillRect(x0 + k, y0 + 59, 2, 4); [[20, 30], [80, 70], [40, 95]].forEach(([x, y]) => drawBld(ctx, 'mine', x0 + x, y0 + y, 22, 16, 'day')); }
    if (z === 4) { ctx.fillStyle = '#3d6f9e'; ctx.fillRect(x0, y0, 34, hh); ctx.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 6; i++) ctx.fillRect(x0 + 30 + Math.sin(now / 600 + i) * 3, y0 + 12 + i * 20, 6, 2); }
    if (z === 5) [[60, 40], [10, 60], [100, 70]].forEach(([x, y]) => drawBld(ctx, 'mountain', x0 + x, y0 + y, 48, 50, 'day'));
    if (z === 6) drawBld(ctx, 'darkcastle', x0 + 32, y0 + 2, 76, 90, 'day');
    ctx.font = fz(10) + 'px Cubic11, sans-serif'; ctx.fillStyle = z === 5 ? 'rgba(40,50,70,.8)' : 'rgba(255,255,255,.7)'; ctx.fillText(Z.n, x0 + 6, y1 - 6);
  });
  if (zoneOpen(6) && !S.boss2Done) { const [x0, y0] = ZONES[6].rect; drawMonster(ctx, 'abyss', x0 + 116, y0 + 118, 'idle', Math.floor(now / 260) % 4, false, true); }
}
function drawOut(now){
  const h = H(), W = 360, Hh = 270;
  ctx.drawImage(outGround(), 0, 0, W, Hh);
  ZONES.forEach(Z => { if (Z.map !== 'out') return; ctx.fillStyle = Z.c; const R = Z.rect; ctx.fillRect(R[0], R[1], R[2] - R[0], R[3] - R[1]); });
  ctx.fillStyle = '#3d6f9e'; ctx.fillRect(0, 212, W, 22);
  ctx.fillStyle = '#7a5a3a'; ctx.fillRect(282, 212, 20, 22);
  ctx.fillStyle = '#6b8a4a'; ctx.fillRect(0, 234, 170, 36);
  ctx.fillStyle = '#8a6a46'; ctx.fillRect(170, 234, 190, 36); ctx.fillStyle = '#a3845a'; ctx.fillRect(170, 262, 190, 4);
  const hr0 = hourOf(), bm = hr0 >= 23 || hr0 < 6 ? 'late' : hr0 >= 18.5 ? 'night' : 'day';
  for (let i = 0; i < 6; i++) drawBld(ctx, 'tree', 6 + i * 27, 236, 20, 28, 'day');
  [[184,'#c0563f'],[222,'#4f7fb0'],[260,'#c0563f'],[330,'#8a5aa0'],[296,'#e0a83a']].forEach(([x, c]) => drawBld(ctx, 'cottage', x - 1, 238, 26, 24, bm, { roof:c }));
  ROCKS.forEach(([x, y]) => drawBld(ctx, 'rock', x, y, 14, 10, 'day'));
  TREES.forEach(([x, y]) => drawBld(ctx, 'tree', x - 11, y - 16, 22, 28, 'day'));
  ctx.font = fz(10) + 'px Cubic11, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.fillText('森林', 8, 206); ctx.fillText('草原', 330, 206); ctx.fillText('荒地', 330, 86); ctx.fillText('村子', 178, 266);
  if (!h.bossKill) drawMonster(ctx, 'boneking', 173, 44, 'idle', Math.floor(now / 260) % 4, false, false);
  const hr = hourOf();
}
// v17.35：打怪演出。每回合照 HFX 的結果演約 1 秒：0.3 秒命中（怪物閃白、被擊退）→ 打倒的話倒下淡出；勇者有被打到的話 0.65 秒怪物衝過來
// 沒在打的怪會慢慢走動；被鎖定的那隻會往勇者走過來
let MON_T = 0;
const hfxOn = (h, now, dur = 1.2) => HFX && h && h.act === 'hunt' && now - HFX.t < dur * 1000 ? HFX : null;
// v17.45：路上遭遇：趕路（走路）被怪物偷襲時停下打一回合。encT 後 0.4 秒怪物跳出來，接著揮一下打倒，倒下淡出後再走
const AMB = new WeakMap();
function ambFx(h, now){ const L = h && h.leg; if (!L || L.enc !== 'mon' || !L.encT || offline || L.ex == null) return null; const t = L.encT + 400; if (now < t || now - t > 1200) return null;
  let fx = AMB.get(L); if (!fx) { fx = { t, tg:{ x:L.ex, y:L.ey - 4 }, kill:1, hurt:0, amb:1 }; AMB.set(L, fx); } return fx; }
const heroFx = (h, now) => hfxOn(h, now) || scnFxOn(h, now) || ambFx(h, now);
function drawMons(now, view){
  const h = H(), tg = h && h.act === 'hunt' ? h.target : null, fx = hfxOn(h, now), dt = Math.min(.1, (now - (MON_T || now)) / 1000);
  if (view === 'wild') MON_T = now;
  mons.forEach(m => { if (ZONES[m.z].map !== view || !zoneOpen(m.z) || (SCN && !SCN.off && SCN.z === m.z)) return; const type = zoneMon(m.z), R = ZONES[m.z].rect;
    let a = 1; if (m.born) { const q = (now - m.born) / 1000; if (q < .9) return; a = Math.min(1, (q - .9) / .6); if (a >= 1) m.born = 0; }
    let kind = 'idle', f = Math.floor(now / 240 + m.ph) % 4, left = m.ph > 3, dx = 0;
    if (m === tg && h.fighting) {
      left = h.x < m.x; const gap = monHalf(type) + 13;
      if (Math.abs(h.x - m.x) > gap + 4 && !S.paused) { m.x += Math.sign(h.x - m.x) * 8 * dt; kind = 'idle'; }   // 迎上來
      if (fx && fx.tg === m) { const p = Math.max(0, now - fx.t) / 1000;
        if (p > .3 && p < .55) { kind = 'hurt'; f = p < .42 ? 1 : 0; dx = (left ? 1 : -1) * 2; }
        else if (fx.hurt && !fx.kill && p > .65 && p < .9) { kind = 'attack'; f = Math.min(2, Math.floor((p - .65) / .08)); } } }
    else if (!S.paused) {   // 閒晃
      if (m.wx == null) m.wx = m.x;
      if (h && h.act === 'hunt' && h.zone === m.z && Math.abs(m.x - h.x) < 22 && Math.abs(m.wx - m.x) < .5) { const [a, b] = monSlot(m); m.wx = clamp(m.x + (m.x >= h.x ? 26 : -26), a, b); }   // 別擋在勇者身上（在自己那一格裡讓開）
      if (Math.abs(m.wx - m.x) < .5) { if (Math.random() < dt * .25) { const [sa, sb] = monSlot(m), w = clamp(m.x + rand(-18, 18), sa, sb); if (!(h && h.act === 'hunt' && h.zone === m.z && Math.abs(w - h.x) < 22)) m.wx = w; } }
      else { m.x += Math.sign(m.wx - m.x) * Math.min(Math.abs(m.wx - m.x), 5 * dt); left = m.wx < m.x; } }
    ctx.globalAlpha = a; drawMonster(ctx, type, m.x + dx, m.y + 4, kind, f, false, left, m.ph); ctx.globalAlpha = 1; });
  // 剛被打倒的那隻：原地被擊退、壓扁、淡出
  if (fx && fx.kill && fx.ghost && ZONES[fx.ghost.z] && ZONES[fx.ghost.z].map === view) { const g = fx.ghost, p = Math.max(0, now - fx.t) / 1000, left = h.x < g.x, d = left ? 1 : -1;
    if (p < 1.1) { let kind = 'idle', f = 0, dx = 0, a = 1;
      if (p > .3 && p < .45) { kind = 'hurt'; f = 1; dx = d * 2; } else if (p >= .45) { kind = 'down'; dx = d * 3; a = Math.max(0, 1 - (p - .45) / .65); }
      ctx.globalAlpha = a; drawMonster(ctx, zoneMon(g.z), g.x + dx, g.y + 4, kind, f, false, left, g.ph); ctx.globalAlpha = 1; } }
}
// 地圖上的東西：寶箱、精英怪、迷路的旅人、商隊
function drawThings(now, view){
  const mt = S.mt; if (!mt) return; mtFix(mt);
  mt.chests.forEach(c => { if (ZONES[c.z].map !== view) return; ctx.fillStyle = '#7a4a1a'; ctx.fillRect(c.x - 6, c.y - 5, 12, 9); ctx.fillStyle = '#f2c14e'; ctx.fillRect(c.x - 6, c.y - 2, 12, 2); ctx.fillRect(c.x - 1, c.y - 3, 2, 4);
    if (Math.floor(now / 500) % 2) { ctx.fillStyle = 'rgba(255,240,180,.8)'; ctx.fillRect(c.x + 5, c.y - 8, 2, 2); } });
  const h = H();
  if (mt.elite && !ELX && ZONES[mt.elite.z].map === view) { const e = mt.elite, a = .35 + Math.sin(now / 260) * .15, hz = h.act === 'hunt' && h.zone === e.z;
    // v17.45：勇者在同一區打怪、走到 60 以內：頭上冒「驚訝」、轉過來、往勇者踏兩步；走遠（90 以外）才重來
    if (hz && Math.abs(h.x - e.x) < 60 && ELS.e !== e) { ELS.e = e; ELS.t = now; } else if (ELS.e === e && !(hz && Math.abs(h.x - e.x) < 90)) ELS.e = null;
    const seen = ELS.e === e, p = seen ? (now - ELS.t) / 1000 : 0, left = seen ? h.x < e.x : true, ox = seen ? (left ? -1 : 1) * Math.round(Math.min(1, p / .5) * 4) : 0, hop = seen && ((p > .08 && p < .2) || (p > .3 && p < .42)) ? -1 : 0;
    ctx.fillStyle = `rgba(242,193,78,${a})`; ctx.beginPath(); ctx.ellipse(e.x + ox, e.y + 4, monHalf(zoneMon(e.z)) + 4, 5, 0, 0, 7); ctx.fill(); drawMonster(ctx, zoneMon(e.z), e.x + ox, e.y + 4 + hop, 'idle', Math.floor(now / 200) % 4, true, left);
    if (seen && p < 1.8) emoAt('驚訝', e.x + ox, e.y + 4 - monH(zoneMon(e.z)) - 2, now - ELS.t); }
  if (ELX && ZONES[ELX.e.z].map === view) { const X = ELX, e = X.e, left = h.x < e.x, d = left ? 1 : -1, fx = hfxOn(h, now, 2); let kind = 'idle', f = Math.floor(now / 200) % 4, dx = 0, a = 1;
    if (fx && fx.tg === e) { const p = Math.max(0, now - fx.t) / 1000;
      if (fx.kill) { if (p > .3 && p < .75) { kind = 'hurt'; f = Math.floor(p * 12) % 2; dx = d * 2; } else if (p >= .75) { kind = 'down'; dx = d * 3; a = Math.max(0, 1 - (p - .75) / .9); } }   // 打贏：比雜魚多閃一下、倒得慢一點
      else if (p > .3 && p < .55) { kind = 'hurt'; f = p < .42 ? 1 : 0; dx = d * 2; }
      else if (fx.hurt && p > .65 && p < .9) { kind = 'attack'; f = Math.min(2, Math.floor((p - .65) / .08)); } }
    else if (X.win && X.r >= 3) a = 0;
    if (a > 0) { ctx.globalAlpha = a; ctx.fillStyle = `rgba(242,193,78,${.3 * a})`; ctx.beginPath(); ctx.ellipse(e.x + dx, e.y + 4, monHalf(zoneMon(e.z)) + 4, 5, 0, 0, 7); ctx.fill(); drawMonster(ctx, zoneMon(e.z), e.x + dx, e.y + 4, kind, f, true, left); ctx.globalAlpha = 1; } }
  if (mt.lost && ZONES[mt.lost.z].map === view) { const l = mt.lost; ctx.fillStyle = '#59a8ff'; ctx.fillRect(l.x - 3, l.y - 10, 6, 7); ctx.fillStyle = '#e8b98a'; ctx.fillRect(l.x - 2, l.y - 14, 5, 4); ctx.fillStyle = '#fff'; if (Math.floor(now / 400) % 2) { ctx.font = '10px sans-serif'; ctx.fillText('!', l.x + 4, l.y - 14); } }
  if (mt.caravan) { const x = CARX, y = 150; ctx.fillStyle = '#e8dcc0'; ctx.fillRect(x - 12, y - 14, 24, 10); ctx.fillStyle = '#8a5a3a'; ctx.fillRect(x - 12, y - 4, 24, 4); ctx.fillStyle = '#3a2a1e'; ctx.fillRect(x - 9, y, 5, 5); ctx.fillRect(x + 4, y, 5, 5); ctx.fillStyle = '#c0a060'; ctx.fillRect(x + 14, y - 8, 8, 6);
    ctx.font = fz(9) + 'px Cubic11, sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('商隊', x - 10, y - 17); }
}
function drawWeather(now){
  const W = 360, Hh = SH, w = S.weather, mo = S.day % 12;
  if ([11, 0, 1].includes(mo)) { ctx.fillStyle = 'rgba(240,246,255,.12)'; ctx.fillRect(0, 0, W, Hh); }
  else if ([8, 9, 10].includes(mo)) { ctx.fillStyle = 'rgba(210,130,40,.08)'; ctx.fillRect(0, 0, W, Hh); }
  if (w === 'rain' || w === 'storm') { ctx.fillStyle = w === 'storm' ? 'rgba(20,30,50,.3)' : 'rgba(40,60,90,.15)'; ctx.fillRect(0, 0, W, Hh); ctx.strokeStyle = 'rgba(200,220,255,.45)'; ctx.lineWidth = 1; ctx.beginPath();
    const n = w === 'storm' ? 70 : 40, sl = w === 'storm' ? 6 : 2; for (let i = 0; i < n; i++) { const x = (i * 47 + now / (w === 'storm' ? 3 : 5)) % (W + 20) - 10, y = (i * 83 + now / 2) % Hh; ctx.moveTo(x, y); ctx.lineTo(x - sl, y + 8); } ctx.stroke(); }
  if (w === 'snow') { ctx.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 45; i++) { const x = (i * 61 + Math.sin(now / 900 + i) * 8 + now / 60) % W, y = (i * 37 + now / 25) % Hh; ctx.fillRect(x, y, 2, 2); } }
}
// v10.1：跟拍鏡頭
const cam = { x:180, y:135, z:1, t:0 }, ZOOM = 2.5;   // v17.1：鏡頭拉近一點
let SH = 270;
function fitCanvas(){ const cw = cv.clientWidth, ch = cv.clientHeight; if (!cw || !ch) return; const d = Math.min(2, window.devicePixelRatio || 1), W = Math.round(cw * d), Hc = Math.round(ch * d); if (cv.width !== W || cv.height !== Hc) { cv.width = W; cv.height = Hc; } SH = 360 * ch / cw; }
function camTarget(h, view, hm){
  return worldCam(h, hm, performance.now());   // v17.11：整條路
  const zf = Math.max(1, SH / 270);   // 至少要把畫面塞滿
  if (S.zoomOff || hm !== view || heroHidden(h) || ['dead', 'retired', 'left'].includes(h.act)) { if (hm === view && !heroHidden(h)) { const [x, y] = view === 'vil' ? villagePos(h) : [h.x, h.y]; return [x, y, zf]; } return [180, 135, zf]; }
  const [x, y] = view === 'vil' ? villagePos(h) : [h.x, h.y];
  return [x, y - 4, Math.max(ZOOM, zf * 1.25)];
}
function drawMap(now){
  fitCanvas(); BLD_LIT.length = 0;
  const h = H(), W = 360, Hh = SH, view = curView(), hm = heroMap(h), sc = cv.width / 360;
  const dt = Math.min(.1, (now - (cam.t || now)) / 1000); cam.t = now; vilTick(dt, now); scnTick(dt, now); elxTick(now, dt); bubbleTick(now);
  const [tx, ty, tz] = camTarget(h, view, hm), k = cam.snap ? 1 : 1 - Math.exp(-dt * 3.5); cam.snap = 0;
  cam.z += (tz - cam.z) * k; cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k;
  if (V.drag && V.drag.moved) cam.x = V.pan;
  const MW = WW, MH = VH, hw = 180 / cam.z, hh0 = SH / 2 / cam.z; cam.x = clamp(cam.x, hw, MW - hw); cam.y = hh0 * 2 >= MH ? MH / 2 : clamp(cam.y, hh0, MH - hh0);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#12161f'; ctx.fillRect(0, 0, cv.width, cv.height);
  const shk = SCN && !SCN.off && SCN.fx && SCN.fx.charge && now - SCN.fx.t > 1450 && now - SCN.fx.t < 1750 ? (Math.floor(now / 40) % 2 ? 1.5 : -1.5) : 0;   // v17.45：魔王反擊，畫面晃一下
  ctx.setTransform(sc * cam.z, 0, 0, sc * cam.z, sc * (180 - cam.x * cam.z + shk), sc * (SH / 2 - cam.y * cam.z));
  ctx.imageSmoothingEnabled = false;
  let bub = null;
  drawSky(now); drawVillage(now); drawWild(now);   // v17.11：村子和野外畫在同一條路上
  drawMons(now, 'wild');
  drawThings(now, 'wild');
  drawScene(now, 'wild'); drawCamp(now, 'wild');
  // 勇者
  if (hm === view) {
    const [hx0, hy0] = view === 'vil' ? villagePos(h) : [h.x, h.y];
    if (h.alpha > 0 && !heroHidden(h) && !(view === 'vil' && V.inside)) {
      const vfa = view === 'vil' ? V.fa : 1; ctx.globalAlpha = h.alpha * vfa;
      const lying = view === 'vil' ? h.act === 'dying' || vCarry() : h.act === 'bed' || h.act === 'slack' || h.act === 'dying' || sleeping() || !!(SCN && !SCN.off && SCN.down) || !!(ELX && ELX.down) || (mPhase(h) === 'camp' && (hourOf() >= 22.5 || hourOf() < 6.5));
      if (!lying) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(hx0, hy0 + 1, 8, 2.6, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(242,193,78,' + (.55 + .25 * Math.sin(now / 400)) + ')'; ctx.lineWidth = .8; ctx.beginPath(); ctx.ellipse(hx0, hy0 + 1, 9.5, 3.2, 0, 0, 7); ctx.stroke(); }   // v17.1：主力腳下光圈
      if (view === 'vil' && vCarry()) drawCarry(now, Math.round(hx0), Math.round(hy0));
      RIDE_FRONT = null; RIDE_HA = 1; const ride = view === 'vil' ? 0 : drawRide(now, h, Math.round(hx0), Math.round(hy0));   // v17.12：馬、驛馬車、傳送陣
      ctx.globalAlpha = h.alpha * vfa * RIDE_HA;
      const am = view === 'vil' && !lying ? arenaMode(h) : null, pm = view === 'vil' && !lying && !am ? plazaPose(h, now) : null;
      if (pm) { drawSprite(ctx, h, Math.round(hx0), Math.round(hy0) - pm.hop, false, now, { moving:false, left:pm.left, expr:pm.expr || 'happy', noEmo:!!pm.expr }); if (pm.hand) pm.hand(Math.round(hx0), Math.round(hy0)); }   // v17.51：代言、綜藝、見粉絲
      else if (am && am.fight) { const R = arenaRound(now, am.kind); let ox = 0; if (R.p > .1 && R.p < .38) ox = 3;   // v17.49：鬥技場：踏步揮擊；對手回擊時後退＋閃
        if (!['train', 'coach', 'smith'].includes(am.kind) && R.r % 2 && R.p > .75 && R.p < 1) { ox = -2; if (Math.floor(now / 60) % 2) ctx.globalAlpha = h.alpha * vfa * .35; }
        drawSprite(ctx, h, Math.round(hx0 + ox), Math.round(hy0), false, now, { moving:false, left:false, atkT:R.t0 }); ctx.globalAlpha = h.alpha * vfa; }
      else if (view === 'vil') drawSprite(ctx, h, Math.round(hx0), Math.round(hy0), lying, now, { moving:V.mv, left:V.left, crouch:!V.mv && lzAt(h, 'fish') }); else if (ride !== 'hide') { const fx = heroFx(h, now), foe = h.target || (fx && (fx.ghost || fx.tg)) || scnFoe(h, now), d = foe && foe.x < hx0 ? -1 : 1; let ox = 0;
        if (fx && fx.charge) { const p = Math.max(0, now - fx.t) / 1000; if (p > 1.42 && p < 2.2) { ox = -d * Math.round(6 * Math.min(1, (p - 1.42) * 4) * (p < 1.9 ? 1 : (2.2 - p) / .3)); if (p < 1.75 && Math.floor(now / 60) % 2) ctx.globalAlpha = h.alpha * .35; } }   // v17.45：魔王反擊，被擊退
        else if (fx) { const p = Math.max(0, now - fx.t) / 1000; if (p > .1 && p < .4) ox = d * 2; if (fx.hurt && !fx.kill && p > .72 && p < .95) { ox = -d * 2; if (Math.floor(now / 60) % 2) ctx.globalAlpha = h.alpha * .35; } }   // 出手往前踏、被打到往後退＋閃
        drawHero(ctx, Math.round(hx0 + ox), Math.round(hy0) - (ride || 0), lying, now); if (RIDE_FRONT) drawRideSpr(ctx, RIDE_FRONT[0], RIDE_FRONT[1], RIDE_FRONT[2], RIDE_FRONT[3], RIDE_AX); ctx.globalAlpha = h.alpha * vfa;
        if (fx && foe && !fx.charge) { const p = Math.max(0, now - fx.t) / 1000; if (p > .22 && p < .42) { const k = (p - .22) / .2, cx = hx0 + d * 10, cy = hy0 - 8; ctx.strokeStyle = `rgba(255,255,255,${1 - k * .7})`; ctx.lineWidth = 1.6; ctx.beginPath();   // 揮砍弧線
          if (d > 0) ctx.arc(cx, cy, 9, -1.3, -1.3 + 2.4 * Math.min(1, k * 1.6)); else ctx.arc(cx, cy, 9, Math.PI + 1.3 - 2.4 * Math.min(1, k * 1.6), Math.PI + 1.3); ctx.stroke(); } } }
      if (h.act === 'hunt') { const fx = hfxOn(h, now), hp = fx && fx.hurt && Math.max(0, now - fx.t) < 720 ? fx.hp0 : h.hp;   // 血條等怪物打到才掉
        ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(hx0 - 12, hy0 + 4, 24, 3); ctx.fillStyle = hp > .5 ? '#6fcf97' : hp > .25 ? '#ffb347' : '#ff7b7b'; ctx.fillRect(hx0 - 12, hy0 + 4, 24 * clamp(hp, 0, 1), 3); }
      if (SCN && view !== 'vil') drawScnHero(now, hx0, hy0);
      if (h.mission && h.mission.comp && npc(h.mission.comp) && h.act === 'mission' && !MSPOT[h.mission.ag]) { ctx.fillStyle = '#c8b0ff'; ctx.fillRect(hx0 - 18, hy0 - 12, 7, 8); ctx.fillStyle = '#e8b98a'; ctx.fillRect(hx0 - 17, hy0 - 17, 5, 5); }
      ctx.globalAlpha = 1;
      if (BUB.cur && BUB.h === h && BUB.cur.until > now) bub = [BUB.cur.t, hx0, hy0 - (lying ? 20 : 34)];
      if (cam.z > 1.4 && vfa > .5) nameTag(ctx, h.name, hx0, hy0 - (lying ? 12 : KEN_TAG), 'hero');   // 勇者自己的名牌一直顯示
    }
  }
  drawArtists(now, 'vil', hm); drawArtists(now, 'wild', hm);
  drawVilFront(now);
  ctx.setTransform(sc, 0, 0, sc, 0, 0);
  if (talkFx && (typeof pref === 'undefined' || pref.fx) && hm === view && now - talkFx.t < 2400 && h.alpha > 0 && !heroHidden(h)) { const [hx1, hy1] = view === 'vil' ? villagePos(h) : [h.x, h.y], sx = 180 + (hx1 - cam.x) * cam.z, sy = SH / 2 + (hy1 - cam.y) * cam.z, a = (now - talkFx.t) / 2400;
    ctx.globalAlpha = Math.min(1, (1 - a) * 1.6); ctx.font = 'bold 18px sans-serif'; ctx.fillStyle = talkFx.em.c; ctx.fillText(talkFx.em.t, sx - 6, sy - 26 * cam.z - a * 10);
    ctx.font = 'bold 11.5px sans-serif'; talkFx.items.forEach((it, i) => { ctx.fillStyle = 'rgba(16,20,30,.75)'; const w = ctx.measureText(it.t).width; ctx.fillRect(sx + 12, sy - 24 - i * 16 - a * 22 - 11, w + 8, 15); ctx.fillStyle = it.c; ctx.fillText(it.t, sx + 16, sy - 24 - i * 16 - a * 22); }); ctx.globalAlpha = 1; }
  drawFx(now, h, hm, view);   // v17.29
  if (bub) drawBubble(bub[0], 180 + (bub[1] - cam.x) * cam.z, SH / 2 + (bub[2] - cam.y) * cam.z - (cam.z - 1) * 10);
  drawWeather(now);
  // 晨昏與夜晚
  const hr = hourOf();
  if (hr < 7.5) { ctx.fillStyle = `rgba(30,40,80,${(7.5 - hr) / 1.5 * .35})`; ctx.fillRect(0, 0, W, Hh); ctx.fillStyle = `rgba(255,170,100,${(7.5 - hr) / 1.5 * .15})`; ctx.fillRect(0, 0, W, Hh);
    if (BLD_LIT.length) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = Math.min(1, (7.5 - hr) / 1.5); BLD_LIT.forEach(([cv0, x, y, w, hh]) => ctx.drawImage(cv0, x, y, w, hh)); ctx.restore(); } }
  else if (hr > 16.5 && hr < 19) { ctx.fillStyle = `rgba(255,140,60,${Math.min(1, (hr - 16.5) / 1.5) * .18})`; ctx.fillRect(0, 0, W, Hh); }
  if (hr >= 18) {
    const k = Math.min(1, (hr - 18) / 2.5) * (hr > 28.5 ? Math.max(.4, (30 - hr) / 1.5) : 1);   // v17.16：天快亮了
    ctx.fillStyle = `rgba(10,16,40,${k * .5})`; ctx.fillRect(0, 0, W, Hh);
    if (BLD_LIT.length) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = Math.min(1, k * 1.3); BLD_LIT.forEach(([cv0, x, y, w, hh]) => ctx.drawImage(cv0, x, y, w, hh)); ctx.restore(); }
    if (hr >= 20 && S.weather !== 'rain' && S.weather !== 'storm') { ctx.fillStyle = `rgba(255,255,255,${Math.min(.8, (hr - 20) * .4)})`; [[30,12],[80,30],[140,8],[210,20],[260,10],[330,28],[300,6],[110,50],[60,70],[350,60]].forEach(([x, y], i) => { if ((Math.floor(now / 700) + i) % 5) ctx.fillRect(x, y, 1.5, 1.5); }); }
  }
  try { patrolLight(now); } catch (e) {}   // v17.90
  const m = h.mood, st = h.stress;
  if (m < 50) { ctx.fillStyle = `rgba(50,62,90,${(50 - m) / 50 * .38})`; ctx.fillRect(0, 0, W, Hh); }
  else if (m > 75) { ctx.fillStyle = `rgba(255,190,90,${(m - 75) / 25 * .1})`; ctx.fillRect(0, 0, W, Hh); }
  if (st > 80) { const g = ctx.createRadialGradient(W / 2, Hh / 2, 80, W / 2, Hh / 2, 220); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(60,0,0,${(st - 80) / 20 * .35})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, Hh); }
  drawWorldMini(now);
  drawResBanner(now);
  drawPip(now);
  // v17.11：地圖只有一條路，右側只留「跟拍」：按了鏡頭回到勇者身上
  if (drawMap.k !== 'road') { drawMap.k = 'road';
    $('mtabs').innerHTML = `<button class="pb mbig" data-follow="1" aria-label="鏡頭回到勇者身上">${IC('跟拍', 2)}</button>`;   // v17.58：大圖示
    $('mtabs').querySelector('[data-follow]').onclick = e => { e.stopPropagation(); V.pan = null; V.drag = null; toast(`鏡頭跟著${H().name}`); }; }
}
// 點地圖
function mapClick(x, y){
  const h = H(), view = 'wild', hit = r => x >= r[0] && x <= r[0] + r[2] && y >= r[1] && y <= r[1] + r[3];
  if (x < VW) {   // v17.11：點在村子那一段
    const o = [...vilHits].reverse().find(t => hit(t.r)); if (!o) return;
    if (o.k === 'npc') { V.tagId = o.id; V.tagT = performance.now(); return openNpcPop(o.id); }   // v17.38：點到的村民顯示名牌
    ({ guild:() => openSheet('quest', 'offer'), temple:() => openSheet('gear', 'care'), clinic:() => openSheet('gear', 'care'), smith:() => openSheet('gear', 'gear'), office:() => openSheet('office', 'main'),
       mayor:() => npc('mayor') && npc('mayor').alive ? openNpcPop('mayor') : toast('村長家'), tavern:() => npc('tao') && npc('tao').alive ? openNpcPop('tao') : toast('酒館'),
       arena:() => openSheet('office', 'comp'), stage:() => toast('廣場：代言、上節目、粉絲見面會在這裡辦'), inn:() => toast('旅館：外地來的冒險者和商人住這裡'),
       gate:() => { V.pan = VW + 80; V.panT = performance.now(); },
       stable:() => toast(h.horse ? `${h.name}的馬，每月飼料 ${HORSE_FEED} 金` : `馬一匹 ${HORSE_PRICE} 金，${h.name}存夠錢會自己來買`),
       station:() => toast(`驛馬車：村口 ↔ 王都，一趟 ${COACH_FARE} 金（由${h.name}自己付）`),
       telepad:() => toast(teleOpen() ? `傳送陣：一次 ${TELE_FEE} 金（事務所付），去王都以後很遠的地方時會用` : '傳送陣預定地：事務所升到「王國」階段才會蓋好'), home:() => toast(`${h.name}${h.house ? '自己買的房子' : '租的小房子'}${h.child ? '，一家人住在這裡' : h.married ? '，和另一半一起住' : ''}${V.inside === 'home' ? '（現在在家）' : ''}`) })[o.k]();
    return;
  }
  const mt = S.mt || {};
  if (mt.caravan && Math.hypot(x - CARX, y - 144) < 18) return openCaravan();
  if (mt.elite && ZONES[mt.elite.z].map === view && Math.hypot(x - mt.elite.x, y - mt.elite.y) < 16) return toast(`精英${ZONES[mt.elite.z].mon}王：在${ZONES[mt.elite.z].n}打怪時可能遇上，打贏有大獎，打輸可能重傷`);
  if (mt.lost && ZONES[mt.lost.z].map === view && Math.hypot(x - mt.lost.x, y - mt.lost.y) < 14) return toast(`迷路的旅人：讓${h.name}去${ZONES[mt.lost.z].n}打怪就有機會找到他`);
  if ((mt.chests || []).some(c => ZONES[c.z].map === view && Math.hypot(x - c.x, y - c.y) < 12)) return toast(`寶箱：去那一區打怪時有機會打開`);
  if (x >= CAP.x0 && x <= CAP.x1) return toast('王都：事務所任務的大客戶和武鬥大會都在這裡');
  const z = ZONES.findIndex(Z => x >= Z.rect[0] && x <= Z.rect[2] + 14);
  if (z < 0) return;
  if (!zoneOpen(z)) return toast(`${ZONES[z].n}還沒開放：${ZGATE[z].t}`);
  const d = danger(ratio(h, zD(z))); toast(`${ZONES[z].n}：${ZONES[z].mon}，對${h.name}來說「${d.n}」`);
}
function openNpcPop(id){
  const n = npc(id); if (!n || !n.alive) return;
  const h = H(), line = n.aff >= 50 ? pickS([`「${h.name}最近好嗎？」`, '「有空來坐坐啊」', '「別太勉強自己喔」']) : n.aff >= 25 ? pickS(['「喔，是你啊」', '「今天天氣不錯」']) : pickS(['「……你哪位？」', '「有事嗎？」']);
  openPop(`${npcBody(n)}${pSay(null, line.replace(/[「」]/g, ''))}`, '路上遇到', '人際', 1);
  $('mBox').querySelectorAll('[data-treat]').forEach(b => b.onclick = () => { if (S.gold < 30) return; S.gold -= 30; n.treat = S.day; affAdd(n.id, 4); toast(`${h.name}和${n.name}吃了頓飯`); closeMission(); renderAll(); });
}
// 每天：地圖上的事
function mapTick(){
  S.mt = S.mt || { chests:[], elite:null, lost:null, caravan:null };
  const mt = S.mt, tz = topZ(), bz = bestSafeZone(), near = () => ri(Math.max(0, bz - 1), Math.min(tz, bz + 1)), rp = z => { const R = ZONES[z].rect; return { x:rand(R[0] + 18, R[2] - 18), y:rand(R[1] + 18, R[3] - 18) }; };
  if (mt.elite && S.day > mt.elite.until) mt.elite = null;
  if (mt.lost && S.day > mt.lost.until) { if (!offline) news('warn', `在${ZONES[mt.lost.z].n}迷路的旅人一直沒被找到`); mt.lost = null; }
  if (mt.caravan && S.day > mt.caravan.until) mt.caravan = null;
  mt.chests = mt.chests.filter(c => c.z <= tz);
  if (mt.chests.length < 3 && chance(.1)) { const z = near(); mt.chests.push({ z, ...rp(z) }); }
  if (!mt.elite && chance(.04)) { const z = Math.min(tz, bz + (chance(.5) ? 1 : 0)); mt.elite = { z, until:S.day + ri(4, 8), ...rp(z) }; if (!offline) ev('warn', '精英怪', `${ZONES[z].n}出現了精英${ZONES[z].mon}王，打贏有大獎，但很危險`); }
  if (!mt.lost && chance(.035)) { const z = near(); mt.lost = { z, until:S.day + ri(3, 6), ...rp(z) }; if (!offline) ev('warn', '迷路', `聽說有旅人在${ZONES[z].n}迷路了`); }
  if (!mt.caravan && chance(.04)) { const tk = Object.keys(TREASURES).filter(k => TREASURES[k].z <= tz && !H().charms.includes(k));
    mt.caravan = { until:S.day + ri(2, 4), t:tk.length ? pick(tk) : null }; if (!offline) ev('good', '商隊', '一支遠方來的商隊在草原紮營，點地圖上的商隊可以逛逛'); }
  // 天氣（隔天）
  const mo = (S.day + 1) % 12;
  S.weather = [11, 0, 1].includes(mo) ? (chance(.45) ? 'snow' : 'clear') : [4, 5].includes(mo) ? (chance(.55) ? 'rain' : 'clear') : [6, 7].includes(mo) ? (chance(.12) ? 'storm' : chance(.2) ? 'rain' : 'clear') : chance(.15) ? 'rain' : 'clear';
  if (S.weather === 'storm' && !offline) ev('warn', '颱風', '颱風要來了，下個月出門很危險');
  // 新區域開放
  if (tz > (S.zOpen ?? 2)) { S.zOpen = tz; if (!offline) { ev('good', '新區域', `「${ZONES[tz].n}」開放了！遠方地圖可以去冒險了`); say(pickS([`聽說${ZONES[tz].n}那邊很危險……但報酬也很高`, `老闆！公會說我們可以去${ZONES[tz].n}了！`])); } }
}
// 打怪時碰到地圖上的東西
function huntThings(h){
  const mt = S.mt; if (!mt) return false; const z = h.zone, Z = ZONES[z];
  const ci = mt.chests.findIndex(c => c.z === z);
  if (ci >= 0 && chance(.25)) { mt.chests.splice(ci, 1); const r = Math.random();
    if (r < .55) { const g = Math.round(Z.gold * ri(10, 20)); earn(g); ev('good', '寶箱', `${h.name}在${Z.n}打開寶箱，裡面有 ${fmt(g)} 金`); }
    else if (r < .8) { h.pots += 2; ev('good', '寶箱', `${h.name}在${Z.n}的寶箱裡找到兩瓶藥水`); }
    else if (r < .92) { const k = Object.keys(TREASURES).find(k => TREASURES[k].z === z && !h.charms.includes(k)); if (k) findTreasure(z); else { const g = Math.round(Z.gold * 25); earn(g); ev('good', '寶箱', `${h.name}在${Z.n}找到一個大寶箱，裡面有 ${fmt(g)} 金`); } }
    else { ev('warn', '寶箱', `${Z.n}的寶箱是陷阱！`); injure('light', '打開寶箱時被機關彈到'); return true; }
    if (!offline && chance(.5)) say(pickS(['有寶箱！', '今天運氣不錯', '寶箱！我最喜歡開寶箱了'])); }
  if (mt.lost && mt.lost.z === z && chance(.3)) { mt.lost = null; const g = ri(100, 300) + z * 60; h.wallet += g; addFame(5); adj('mood', 6);
    ev('good', '救人', `${h.name}在${Z.n}找到迷路的旅人，對方塞了 ${g} 金當謝禮`); if (!offline) say(pickS(['找到迷路的人了，還好沒事', '他說他已經在裡面繞三天了'])); }
  if (mt.elite && mt.elite.z === z && chance(.25)) { const e0 = mt.elite; mt.elite = null;
    const r = ratio(h, zD(z) * 2.5), win = chance(clamp(.2 + .5 * r, .05, .95));
    const res = () => { if (win) { const g = Math.round(Z.gold * 30); earn(g); gainExp(Z.exp * 12); addFame(8); remember('elite', { n:Z.mon }); ev('good', '精英怪', `${h.name}在${Z.n}打倒了精英${Z.mon}王！拿到 ${fmt(g)} 金`); logLife(`打倒${Z.n}的精英${Z.mon}王`); if (!offline) say(pickS(['精英怪被我打倒了！', '剛剛那隻好大……但我贏了'])); }
    else injure(!offline && chance(.5) ? 'heavy' : 'light', `在${Z.n}被精英${Z.mon}王打傷`); };
    if (!offline) { eliteDuel(h, e0, win, res); return true; }   // v17.45：當場演完再出結果
    res(); if (!win) return true; }
  return false;
}
// v17.45：精英怪對戰演出：勇者走到精英怪旁邊 → 4 回合（照 HFX 的打法）→ 打贏倒下淡出／打輸勇者倒地 → 結果才生效
let ELX = null; const ELS = { e:null, t:0 };
function eliteDuel(h, e0, win, apply){ ELX = { e:{ x:e0.x, y:e0.y, z:e0.z, ph:0, elite:1 }, win, apply, t0:performance.now(), r:-1, rt:0, down:0 }; h.target = ELX.e; h.fighting = true; ELS.e = null; }
function elxTick(now, dt){
  const X = ELX; if (!X) return; const h = H();
  const end = () => { ELX = null; if (h.target === X.e) h.target = null; h.fighting = false; X.apply(); };
  if (h.act !== 'hunt' || offline) { end(); return; }   // 中途被叫走：直接出結果
  if (S.paused) { const k = dt * 1000; X.t0 += k; X.rt += k; if (X.down) X.down += k; return; }   // 暫停時演出也停
  const e = X.e, gap = monHalf(zoneMon(e.z)) + 13;
  if (X.r < 0) { if ((Math.abs(Math.abs(h.x - e.x) - gap) < 6 && Math.abs(h.y - (e.y + 4)) < 6) || now - X.t0 > 3000) { X.r = 0; X.rt = now; HFX = { t:now, tg:e, kill:0, hurt:0, hp0:h.hp }; } return; }
  if (X.down) { if (now - X.down > 1500) end(); return; }
  if (X.r >= 3) { if (X.win ? now - X.rt > 1800 : now - X.rt > 1000) { if (X.win) end(); else X.down = now; } return; }
  if (now - X.rt > 1000) { X.r++; X.rt = now; HFX = { t:now, tg:e, kill:X.win && X.r === 3 ? 1 : 0, hurt:X.win ? X.r === 1 : 1, hp0:h.hp }; }
}
// 世界座標畫一個表情泡泡（泡泡底部在 yb）
function emoAt(nm, x, yb, now){ const t = ctx.getTransform(); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; drawEmo(ctx, nm, Math.round(t.a * x + t.e), Math.round(t.d * yb + t.f), now, Math.max(1, Math.round(.8 * t.a))); ctx.restore(); }
function openCaravan(){
  const mt = S.mt, c = mt && mt.caravan; if (!c) return; const h = H();
  const items = [['pots', '遠方的藥水 ×3', 120], ['boost', '力量藥劑（戰力永久 +5%）', 900 + rkx() * 300]];
  if (c.t && TREASURES[c.t] && !h.charms.includes(c.t)) items.push(['charm', `${TREASURES[c.t].n}（${TREASURES[c.t].d}）`, 2500 + rkx() * 600]);
  openPop(`<div class="pst f16">${IC('時間', 2)}<b>再 ${Math.max(0, c.until - S.day)} 月就走</b></div>
    ${items.map(([k, n, p]) => { const full = k === 'charm' && h.charms.length >= CHARM_MAX; return `<div class="pb pit"><span class="pitn">${IC(k === 'charm' ? '寶物' : k === 'boost' ? '戰力' : '照顧', 2)}<b class="f16">${esc(n)}</b></span>${priceBtn(`data-buy="${k}" data-p="${p}"`, p, S.gold < p || full, full ? '帶不下了' : '')}</div>`; }).join('')}
    <div class="f14 mu">用事務所的錢買給${esc(h.name)}</div>`, '商隊', '商隊', 1);
  $('mBox').querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { const k = b.dataset.buy, p = +b.dataset.p; if (S.gold < p) return; S.gold -= p;
    if (k === 'pots') h.pots += 3; if (k === 'boost') { h.boost = (h.boost || 0) + .05; } if (k === 'charm') { h.charms.push(c.t); c.t = null; }
    ev('good', '商隊', `你在商隊買了${b.closest('.pit').querySelector('.pitn b').textContent.split('（')[0]}給${h.name}`); closeMission(); openCaravan(); renderAll(); });
}

// ================= v17：角色造型（粗描邊平塗 Q 版，24×32；大頭貼＝上半身特寫） =================
const SPR_OUT = '#262230', SPR_INK = '#262230', SPR_SCALE = .75;   // 地圖上每個造型像素＝0.75 個世界單位（C 中、像素對齊）
const SPR_SKIN = ['#f8d6b6', '#f0c098', '#d9a072', '#a8714a', '#6e4630'];
const SPR_HAIR = ['#2a2a2e', '#3a2a22', '#6a4428', '#c8a070', '#e8c860', '#e8e4d8', '#e07a32', '#b04a32', '#7a2a3a', '#e8a0b8', '#4a3a5a', '#2e4a6a', '#3a5a3a'];
const SPR_GRAY = '#a8a8ae', SPR_WHITE = '#dcdce0';
const SPR_STYLES = ['short', 'side', 'spiky', 'curly', 'bob', 'middle', 'undercut', 'bowl', 'pixie', 'long', 'ponytail', 'hime', 'wave', 'lowtail', 'twin', 'bun'];   // 男女共用
const SPR_CLS = {
  warrior:{ c:'#b84a3a', c2:'#8e9aaa', wp:'sword' }, archer:{ c:'#4f8a4a', c2:'#8a6440', wp:'bow' },
  mage:{ c:'#5e4fa8', c2:'#3e3278', wp:'staff' }, thief:{ c:'#4a566e', c2:'#2e3448', wp:'dagger' },
};
const SPR_ROLE = { guild:'#3f6ea0', priest:'#e8e2d0', mayor:'#7a4a2a', reporter:'#4a8a8a', fan:'#c08a30', merc:'#6a3a3a', elder:'#6a5ab0', rival:'#8a3a3a', rival2:'#5a5aa0', merchant:'#6a6a3a', tavern:'#d0607a', smith:'#5a5a5a', victim:'#4a4a5a' };
const sprMix = (a, b, t) => { const p = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)); const [r1, g1, b1] = p(a), [r2, g2, b2] = p(b); return '#' + [r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t].map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join(''); };
const sprHash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const sprRng = seed => { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
const sprSeed = h => h.seed || (h.seed = (h.name || '') + '#' + Math.floor(Math.random() * 1e9).toString(36));
function sprLooks(h){
  const r = sprRng(sprHash(sprSeed(h))), p = a => a[Math.floor(r() * a.length)];
  return { skin:p(SPR_SKIN), hair:p(SPR_HAIR), pants:p(['#5a4a3a', '#3a4a6a', '#6a6a5a', '#4a3a3a']), style:p(SPR_STYLES) };
}
// 動作關鍵格
const SA = o => ({ by:0, dx:0, lean:0, ra:null, wa:null, lf:0, rf:0, ly:0, ry:0, ...o });
const SPR_POSE = {
  idle:[SA({}), SA({}), SA({ by:1 }), SA({ by:1 })],
  walk:[SA({ lf:-1, rf:1 }), SA({ ry:1, by:1 }), SA({ lf:1, rf:-1 }), SA({ lf:1, rf:-1 }), SA({ ly:1, by:1 }), SA({ lf:-1, rf:1 })],
  hurt:[SA({ dx:-2, flash:1, face:'ouch' }), SA({ dx:-1, flash:.4, face:'ouch' }), SA({})],
};
const SPR_ATK = {
  sword:[SA({ ra:-130, wa:-150, by:1, lean:-1 }), SA({ ra:-100, wa:-115 }), SA({ ra:-40, wa:-30, fx:'arc1', lean:1 }), SA({ ra:15, wa:30, fx:'arc2', lean:1, by:1 }), SA({ ra:50, wa:75, by:1 }), SA({ ra:70, wa:-40 })],
  dagger:[SA({ ra:160, wa:180, lean:-1 }), SA({ ra:5, wa:0, lean:1, fx:'stab' }), SA({ ra:160, wa:175 }), SA({ ra:-5, wa:-5, lean:1, fx:'stab' }), SA({ ra:60, wa:40 }), SA({})],
  bow:[SA({ bow:1 }), SA({ bow:2, lean:-1 }), SA({ bow:3, lean:-1 }), SA({ bow:1, fx:'shot' }), SA({ bow:1 }), SA({})],
  staff:[SA({ ra:-60, wa:-80 }), SA({ ra:-95, wa:-95, fx:'glow1', by:1 }), SA({ ra:-100, wa:-100, fx:'glow2', by:1 }), SA({ ra:-20, wa:-30, fx:'cast', lean:1 }), SA({ ra:30, wa:-40 }), SA({})],
};
// 依狀態決定表情
function exprOf(h){
  if (!h) return 'normal';
  if (h.bedDays > 0 || h.act === 'bed' || h.act === 'dying') return 'hurt';
  if ((h.health ?? 100) < 40) return 'sick';
  if ((h.sta ?? 80) < 20 || (h.burn || 0) > 70) return 'tired';
  if ((h.mood ?? 60) < 15) return 'sad';
  if ((h.trust ?? 60) < 15 || (h.scolded > 0)) return 'angry';
  if ((h.stress ?? 0) > 60) return 'nervous';
  if ((h.mood ?? 60) > 75) return 'happy';
  return 'normal';
}
const EV_EXPR = { love:'blush', propose:'blush', draft:'serious', draft2:'serious', vWanted:'serious', vAudit:'serious', scandal:'down', vCrime:'down', aScandal:'down', family:'sad', plague:'sick', kidnap:'nervous', raid:'nervous', aLeave:'sad', aBreak:'sad' };

function sprGrid(h, kind = 'idle', f = 0, expr = 'normal'){
  const W = 24, H0 = 32, G = Array.from({ length:H0 }, () => Array(W).fill(null));
  const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < W && y >= 0 && y < H0 && c) G[y][x] = c; };
  const rect = (x0, y0, x1, y1, c) => { for (let y = Math.round(y0); y <= Math.round(y1); y++) for (let x = Math.round(x0); x <= Math.round(x1); x++) set(x, y, c); };
  const line = (x0, y0, x1, y1, c, th = 1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; rect(x - (th - 1) / 2, y - (th - 1) / 2, x + (th - 1) / 2, y + (th - 1) / 2, c); } };
  const C = SPR_CLS[h.cls] || null, wp = C ? C.wp : null;
  const list = kind === 'attack' && wp ? SPR_ATK[wp] : SPR_POSE[kind] || SPR_POSE.idle;
  const P = kind === 'down' ? SA({}) : list[f % list.length], L = sprLooks(h), age = h.age || 20, adv = (h.job || 0) > 0 || h.adv;
  const hx0 = k => ((h.hex && h.hex[k] != null) ? h.hex[k] : 50) / 100;
  if (P.face) expr = P.face;
  let sk = L.skin; if (expr === 'sick' || h.addict) sk = sprMix(sk, '#b0d0a0', expr === 'sick' ? .45 : .32);
  if (expr === 'angry') sk = sprMix(sk, '#f07a6a', .28);
  const hc = age >= 60 ? SPR_WHITE : age >= 52 ? SPR_GRAY : L.hair, hk = sprMix(hc, '#000000', .18);
  const style = h.record ? 'buzz' : L.style;
  const ox = P.dx, by = P.by, ux = ox + P.lean;
  const cloth = C ? C.c : (SPR_ROLE[h.role] || (h.sex === 'f' ? '#9a5a80' : '#4a7a5a'));
  // 身後：箭袋、長髮
  if (wp === 'bow') { rect(3 + ux, 8 + by, 4 + ux, 17 + by, C.c2); set(3 + ux, 7 + by, '#f0ece0'); set(4 + ux, 6 + by, '#e05a3a'); set(4 + ux, 7 + by, '#f0ece0'); }
  if (style === 'long') rect(4 + ux, 5 + by, 19 + ux, 17 + by, hc);
  if (style === 'hime') rect(4 + ux, 5 + by, 19 + ux, 19 + by, hk);
  if (style === 'wave') { rect(4 + ux, 5 + by, 19 + ux, 19 + by, hc); for (let y = 8; y <= 19; y++) { const w = (y % 4 < 2) ? 1 : 0; set(3 + ux - w, y + by, hc); set(20 + ux + w, y + by, hc); } }
  if (style === 'lowtail') { rect(17 + ux, 10 + by, 19 + ux, 20 + by, hk); set(18 + ux, 21 + by, hk); rect(17 + ux, 10 + by, 19 + ux, 10 + by, '#e05a78'); }
  if (style === 'twin') { rect(1 + ux, 4 + by, 3 + ux, 16 + by, hc); rect(20 + ux, 4 + by, 22 + ux, 16 + by, hc); set(2 + ux, 17 + by, hc); set(21 + ux, 17 + by, hc); }
  if (style === 'ponytail') rect(18 + ux, 3 + by, 20 + ux, 12 + by, hc);
  // 腿與鞋
  const lx = 8 + ox + P.lf, rx = 12 + ox + P.rf;
  rect(lx, 23, lx + 3, 27 - P.ly, L.pants); rect(rx, 23, rx + 3, 27 - P.ry, L.pants); set(lx + 3, 23, SPR_INK); set(rx, 24, SPR_INK);
  rect(lx - 1, 28 - P.ly, lx + 3, 29 - P.ly, '#3a2e2a'); rect(rx, 28 - P.ry, rx + 4, 29 - P.ry, '#3a2e2a');
  // 身體與服裝
  rect(7 + ux, 13 + by, 16 + ux, 23, cloth);
  rect(7 + ux, 20 + by, 16 + ux, 20 + by, '#4a3626');
  const gold = '#f2c14e', x = ux, y = by;
  if (h.cls === 'warrior') { rect(6 + x, 13 + y, 8 + x, 15 + y, C.c2); rect(15 + x, 13 + y, 17 + x, 15 + y, C.c2); rect(10 + x, 15 + y, 13 + x, 19 + y, C.c2); if (adv) { rect(10 + x, 15 + y, 13 + x, 15 + y, gold); set(11 + x, 17 + y, gold); set(12 + x, 17 + y, gold); } }
  if (h.cls === 'archer') { line(8 + x, 14 + y, 15 + x, 21 + y, C.c2, 1); if (adv) set(11 + x, 17 + y, gold); }
  if (h.cls === 'mage') { rect(11 + x, 14 + y, 12 + x, 22, C.c2); rect(7 + x, 21, 16 + x, 23, C.c); if (adv) rect(7 + x, 23, 16 + x, 23, gold); set(11 + x, 17 + y, gold); }
  if (h.cls === 'thief') { rect(8 + x, 13 + y, 15 + x, 15 + y, C.c2); rect(9 + x, 16 + y, 14 + x, 19 + y, '#3a4458'); set(10 + x, 18 + y, '#c8d0dc'); if (adv) rect(8 + x, 15 + y, 15 + x, 15 + y, '#8a2a3a'); }
  if (!C && h.role === 'priest') { rect(11 + x, 14 + y, 12 + x, 19 + y, gold); rect(10 + x, 15 + y, 13 + x, 15 + y, gold); }
  rect(9 + ux, 13 + by, 14 + ux, 13 + by, SPR_INK);
  // 弓
  if (wp === 'bow') {
    const bx = 20 + ux, cy = P.bow ? 16 + by : 18 + by;
    for (let i = -6; i <= 6; i++) set(bx + Math.round(1.6 - i * i / 22), cy + i, '#9a7048');
    if (adv) { set(bx, cy - 6, gold); set(bx, cy + 6, gold); }
    const pull = P.bow === 2 ? 3 : P.bow === 3 ? 5 : 0, sx = bx - 1;
    line(sx, cy - 5, sx - pull, cy, '#f0ece0'); line(sx - pull, cy, sx, cy + 5, '#f0ece0');
    if (P.bow) { rect(17 + ux, 15 + by, 20 + ux, 16 + by, cloth); set(21 + ux, 15 + by, L.skin); }
    if (P.bow >= 2) { line(sx - pull, cy, bx + 3, cy, '#c8a070'); set(bx + 4, cy, '#d8dee8'); }
  }
  // 手臂
  rect(5 + ux, 14 + by, 6 + ux, 19 + by, cloth); rect(5 + ux, 20 + by, 6 + ux, 21 + by, sk); rect(7 + ux, 15 + by, 7 + ux, 19 + by, SPR_INK);
  let hand = [18 + ux, 21 + by];
  if (P.ra == null || wp === 'bow' || !wp) { if (!P.bow) { rect(17 + ux, 14 + by, 18 + ux, 19 + by, cloth); rect(17 + ux, 20 + by, 18 + ux, 21 + by, sk); rect(16 + ux, 15 + by, 16 + ux, 19 + by, SPR_INK); } }
  else { const a = P.ra * Math.PI / 180, sx = 17 + ux, sy = 15 + by; hand = [sx + Math.cos(a) * 5, sy + Math.sin(a) * 5]; line(sx, sy, hand[0], hand[1], cloth, 2); rect(hand[0] - .5, hand[1] - .5, hand[0] + .5, hand[1] + .5, sk); }
  if (wp && wp !== 'bow') {
    const a = (P.wa != null ? P.wa : -75) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), gc = adv ? gold : '#8a7a5a';
    if (wp === 'sword') { line(hand[0] - s * 2, hand[1] + c * 2, hand[0] + s * 2, hand[1] - c * 2, gc); line(hand[0] + c, hand[1] + s, hand[0] + c * 10, hand[1] + s * 10, '#dde3ec'); line(hand[0] + c * 2 + .6, hand[1] + s * 2, hand[0] + c * 9 + .6, hand[1] + s * 9, '#ffffff'); }
    if (wp === 'dagger') line(hand[0] + c, hand[1] + s, hand[0] + c * 5, hand[1] + s * 5, '#dde3ec');
    if (wp === 'staff') { line(hand[0] - c * 6, hand[1] - s * 6, hand[0] + c * 9, hand[1] + s * 9, '#8a6440'); const tx = hand[0] + c * 10, ty = hand[1] + s * 10; rect(tx - 1, ty - 1, tx + 1, ty + 1, adv ? '#ffe08a' : '#7ad0ff'); }
  }
  if (h.married) { set(10 + ux, 14 + by, '#d8b25a'); set(13 + ux, 14 + by, '#d8b25a'); set(11 + ux, 15 + by, '#f2c14e'); set(12 + ux, 15 + by, '#f2c14e'); }
  // 頭
  const X0 = 5 + ux, Y0 = 1 + by;
  rect(X0 + 1, Y0 + 3, X0 + 12, Y0 + 11, sk); rect(X0 + 2, Y0 + 12, X0 + 11, Y0 + 12, sk); set(X0 + 1, Y0 + 11, null); set(X0 + 12, Y0 + 11, null);
  rect(X0, Y0 + 6, X0, Y0 + 8, sk); rect(X0 + 13, Y0 + 6, X0 + 13, Y0 + 8, sk);
  // 表情
  const mood = expr === 'normal' ? (hx0('X') > .65 ? 'smile' : 'flat') : expr;
  const EL = X0 + 4, ER = X0 + 9, EY = Y0 + 7, my = Y0 + 10, mx = X0 + 6, INK = SPR_INK;
  const both = (pts, c = INK) => { pts.forEach(([a, b]) => set(EL + a, EY + b, c)); pts.forEach(([a, b]) => set(ER - a, EY + b, c)); };
  const shade = sprMix(sk, INK, .3), RED = '#c84a4a', TEAR = '#5ab0f0';
  ({ happy:() => both([[-1, 1], [0, 0], [1, 1]]), blush:() => both([[-1, 1], [0, 0], [1, 1]]),
     tired:() => { both([[-1, 1], [0, 1], [1, 1]]); both([[-1, 2], [0, 2], [1, 2]], shade); },
     sick:() => both([[-1, 0], [0, 1], [1, 0]]), sad:() => { both([[0, 0], [0, 1]]); both([[-1, -1]]); },
     angry:() => both([[-1, 0], [0, 0], [1, 0], [0, 1]]), nervous:() => both([[0, 1]]),
     hurt:() => { [[-1, 0], [0, 1], [1, 0]].forEach(([a, b]) => set(EL + a, EY + b, INK)); set(ER, EY, INK); set(ER, EY + 1, INK); },
     ouch:() => { [[-1, -1], [0, 0], [-1, 1]].forEach(([a, b]) => set(EL + a, EY + b, INK)); [[1, -1], [0, 0], [1, 1]].forEach(([a, b]) => set(ER + a, EY + b, INK)); },
     serious:() => both([[0, 0], [0, 1], [-1, 0], [1, 0]]), down:() => both([[-1, 2], [0, 2]]) }[expr] || (() => both([[0, 0], [0, 1]])))();
  const brow = t => both({ worry:[[-1, -1], [0, -2], [1, -3]], angry:[[-2, -4], [-1, -4], [-1, -3], [0, -3], [1, -3], [1, -2], [2, -2]], flat:[[-1, -2], [0, -2], [1, -2]], up:[[-1, -2], [0, -3], [1, -2]] }[t]);
  if (['sad', 'nervous', 'down'].includes(expr) || (expr === 'normal' && hx0('E') > .7)) brow('worry');
  if (['angry', 'ouch'].includes(expr) || (expr === 'normal' && hx0('A') < .3)) brow('angry');
  if (expr === 'serious') brow('flat');
  if (expr === 'blush') brow('up');
  ({ smile:() => { set(mx - 1, my, INK); rect(mx, my + 1, mx + 1, my + 1, INK); set(mx + 2, my, INK); },
     happy:() => { rect(mx - 1, my, mx + 2, my, INK); set(mx - 1, my + 1, INK); rect(mx, my + 1, mx + 1, my + 1, RED); set(mx + 2, my + 1, INK); rect(mx, my + 2, mx + 1, my + 2, INK); },
     flat:() => rect(mx, my, mx + 1, my, INK), tired:() => { rect(mx, my, mx + 1, my, INK); set(mx + 1, my + 1, '#f4f0e8'); },
     serious:() => rect(mx - 1, my, mx + 2, my, INK),
     sad:() => { rect(mx, my - 1, mx + 1, my - 1, INK); set(mx - 1, my, INK); set(mx + 2, my, INK); set(mx - 2, my + 1, INK); set(mx + 3, my + 1, INK); },
     angry:() => { rect(mx - 2, my, mx + 3, my, INK); set(mx - 2, my + 1, INK); rect(mx - 1, my + 1, mx + 2, my + 1, '#f4f0e8'); set(mx, my + 1, '#c8c0b0'); set(mx + 2, my + 1, '#c8c0b0'); set(mx + 3, my + 1, INK); rect(mx - 2, my + 2, mx + 3, my + 2, INK); },
     nervous:() => { set(mx - 1, my + 1, INK); set(mx, my, INK); set(mx + 1, my + 1, INK); set(mx + 2, my, INK); },
     hurt:() => { set(mx - 1, my + 1, INK); rect(mx, my, mx + 1, my, INK); set(mx + 2, my + 1, INK); },
     ouch:() => { rect(mx, my, mx + 1, my, INK); set(mx - 1, my + 1, INK); rect(mx, my + 1, mx + 1, my + 1, RED); set(mx + 2, my + 1, INK); rect(mx, my + 2, mx + 1, my + 2, INK); },
     sick:() => { set(mx - 1, my + 1, INK); set(mx, my, INK); set(mx + 1, my + 1, INK); set(mx + 2, my, INK); },
     blush:() => { rect(mx, my, mx + 1, my, INK); set(mx - 1, my - 1, INK); set(mx + 2, my - 1, INK); },
     down:() => { set(mx, my + 1, INK); set(mx + 1, my + 1, INK); } }[mood] || (() => {}))();
  if (expr === 'happy') { rect(X0 + 1, Y0 + 10, X0 + 2, Y0 + 10, '#f29a9a'); rect(X0 + 11, Y0 + 10, X0 + 12, Y0 + 10, '#f29a9a'); }
  if (expr === 'blush') { rect(X0 + 1, Y0 + 9, X0 + 3, Y0 + 10, '#ea6478'); rect(X0 + 10, Y0 + 9, X0 + 12, Y0 + 10, '#ea6478'); set(X0 + 2, Y0 + 9, '#ffc0c8'); set(X0 + 11, Y0 + 9, '#ffc0c8'); }
  if (age >= 42) { set(X0 + 2, Y0 + 7, sprMix(sk, INK, .3)); set(X0 + 11, Y0 + 7, sprMix(sk, INK, .3)); }
  if (h.perks && h.perks.includes('scar') || h.scar) { set(X0 + 10, Y0 + 5, '#c0605a'); set(X0 + 11, Y0 + 6, '#c0605a'); set(X0 + 11, Y0 + 9, '#c0605a'); }
  if (h.addict) { set(X0 + 4, Y0 + 9, sprMix(sk, INK, .35)); set(X0 + 9, Y0 + 9, sprMix(sk, INK, .35)); }
  if (expr === 'down') rect(X0 + 1, Y0 + 3, X0 + 12, Y0 + 4, sprMix(sk, INK, .2));
  // 頭髮
  sprHair(style, hc, rect, set, X0, Y0, age);
  // 表情符號
  if (expr === 'sad') { rect(EL, EY + 2, EL, EY + 4, TEAR); rect(ER, EY + 2, ER, EY + 5, TEAR); set(ER, EY + 6, '#a8dcff'); }
  if (expr === 'angry') { const ax = X0 + 11, ay = Y0 - 3; [[1, 0], [3, 0], [0, 1], [1, 1], [3, 1], [4, 1], [0, 3], [1, 3], [3, 3], [4, 3], [1, 4], [3, 4]].forEach(([a, b]) => set(ax + a, ay + b, '#e03030')); [[-2, 2], [-3, 1], [-3, 0], [-2, -1], [15, 2], [16, 1], [16, 0], [15, -1]].forEach(([a, b]) => set(X0 + a, Y0 + b, 'fx#ffffff')); }
  if (expr === 'nervous' || expr === 'ouch') { set(X0 + 14, Y0 + 2, '#bfe6ff'); rect(X0 + 14, Y0 + 3, X0 + 15, Y0 + 4, '#5ab0f0'); set(X0 - 1, Y0 + 5, '#bfe6ff'); set(X0 - 1, Y0 + 6, '#5ab0f0'); }
  if (expr === 'tired') { set(X0 + 14, Y0 + 1, '#a8b8d8'); set(X0 + 15, Y0 + 1, '#a8b8d8'); set(X0 + 15, Y0 + 2, '#a8b8d8'); set(X0 + 14, Y0 + 3, '#a8b8d8'); set(X0 + 15, Y0 + 3, '#a8b8d8'); }
  if (expr === 'hurt') { rect(X0 + 1, Y0 + 4, X0 + 12, Y0 + 4, '#f4eee0'); rect(X0 + 8, Y0 + 3, X0 + 9, Y0 + 4, '#d04a4a'); rect(X0 + 10, Y0 + 10, X0 + 12, Y0 + 11, '#ecd2a6'); set(X0 + 11, Y0 + 10, '#c8a878'); }
  if (expr === 'sick') { set(X0 + 14, Y0 + 5, '#bfe6ff'); set(X0 + 14, Y0 + 6, '#5ab0f0'); }
  if (expr === 'sick' || expr === 'down') { const c = expr === 'sick' ? '#6a9a5a' : '#6a7aa8'; [3, 6, 9].forEach(d => rect(X0 + d, Y0 + 3, X0 + d, Y0 + 5, c)); }
  if (expr === 'blush') { set(X0 + 14, Y0 + 1, '#ea4a6a'); set(X0 + 16, Y0 + 1, '#ea4a6a'); rect(X0 + 14, Y0 + 2, X0 + 16, Y0 + 2, '#ea4a6a'); set(X0 + 15, Y0 + 3, '#ea4a6a'); }
  // 特效
  const F = (a, b, c) => set(a, b, 'fx' + c);
  if (P.fx === 'arc1' || P.fx === 'arc2') { const cx = 17 + ux, cy = 15 + by; for (let d = P.fx === 'arc1' ? -70 : -15; d <= (P.fx === 'arc1' ? -10 : 60); d += 5) { const a = d * Math.PI / 180; F(cx + Math.cos(a) * 11, cy + Math.sin(a) * 11, '#ffffff'); } }
  if (P.fx === 'stab') for (let i = 0; i < 3; i++) F(hand[0] + 6 + i, hand[1] + (i % 2), '#ffffff');
  if (P.fx === 'glow1' || P.fx === 'glow2') { const n = P.fx === 'glow1' ? 3 : 5; for (let i = 0; i < n; i++) { const a = i / n * 6.28; F(hand[0] + Math.cos(a) * 3, hand[1] - 10 + Math.sin(a) * 3, '#bfe8ff'); } }
  if (P.fx === 'cast') { F(hand[0] + 8, hand[1] - 4, '#ffffff'); F(hand[0] + 9, hand[1] - 5, '#bfe8ff'); }
  // 粗描邊
  const O = G.map(r => r.slice());
  for (let yy = 0; yy < H0; yy++) for (let xx = 0; xx < W; xx++) if (!G[yy][xx] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { const c = G[yy + b] && G[yy + b][xx + a]; return c && !String(c).startsWith('fx'); })) O[yy][xx] = SPR_OUT;
  for (let yy = 0; yy < H0; yy++) for (let xx = 0; xx < W; xx++) if (O[yy][xx] && String(O[yy][xx]).startsWith('fx')) O[yy][xx] = O[yy][xx].slice(2);
  if (P.flash) for (let yy = 0; yy < H0; yy++) for (let xx = 0; xx < W; xx++) if (O[yy][xx] && O[yy][xx] !== SPR_OUT) O[yy][xx] = sprMix(O[yy][xx], '#ff4a4a', .45 * P.flash);
  if (kind === 'down') { const R = Array.from({ length:H0 }, () => Array(W).fill(null)); for (let yy = 0; yy < H0; yy++) for (let xx = 0; xx < W; xx++) { const nx = yy - 6, ny = W - 1 - xx + 8; if (O[yy][xx] && nx >= 0 && nx < W && ny >= 0 && ny < H0) R[ny][nx] = O[yy][xx]; } return R; }
  return O;
}
function sprHair(style, hc, rect, set, X0, Y0, age){
  if (style === 'buzz') { const d = sprMix(hc, '#000000', .15); rect(X0 + 1, Y0 + 1, X0 + 12, Y0 + 3, d); rect(X0 + 3, Y0, X0 + 10, Y0, d); return; }
  if (style === 'undercut') { rect(X0 + 2, Y0 - 1, X0 + 11, Y0 + 3, hc); rect(X0 + 1, Y0 - 1, X0 + 12, Y0 + 2, hc); rect(X0 + 4, Y0 - 1, X0 + 9, Y0 - 1, sprMix(hc, '#ffffff', .2)); rect(X0, Y0 + 2, X0, Y0 + 6, sprMix(hc, '#f0c098', .5)); rect(X0 + 13, Y0 + 2, X0 + 13, Y0 + 6, sprMix(hc, '#f0c098', .5)); rect(X0 + 3, Y0 + 4, X0 + 9, Y0 + 4, hc); set(X0 + 3, Y0 + 5, hc); return; }
  if (age >= 62 && !['long', 'hime', 'wave', 'twin', 'bun', 'lowtail'].includes(style)) { rect(X0, Y0 + 3, X0 + 1, Y0 + 7, hc); rect(X0 + 12, Y0 + 3, X0 + 13, Y0 + 7, hc); rect(X0 + 2, Y0 + 1, X0 + 11, Y0 + 2, hc); return; }
  rect(X0 + 1, Y0, X0 + 12, Y0 + 3, hc); rect(X0, Y0 + 1, X0 + 13, Y0 + 4, hc);
  const s = {
    short:() => { rect(X0, Y0 + 5, X0, Y0 + 6, hc); rect(X0 + 13, Y0 + 5, X0 + 13, Y0 + 6, hc); set(X0 + 4, Y0 + 5, hc); set(X0 + 9, Y0 + 5, hc); },
    side:() => { rect(X0 + 1, Y0 + 5, X0 + 6, Y0 + 5, hc); set(X0 + 1, Y0 + 6, hc); rect(X0 + 13, Y0 + 5, X0 + 13, Y0 + 6, hc); },
    spiky:() => { [1, 4, 7, 10].forEach(d => { set(X0 + d, Y0 - 1, hc); set(X0 + d + 1, Y0 - 1, hc); }); rect(X0, Y0 + 5, X0, Y0 + 6, hc); rect(X0 + 13, Y0 + 5, X0 + 13, Y0 + 6, hc); set(X0 + 6, Y0 + 5, hc); },
    curly:() => { [0, 3, 6, 9, 12].forEach(d => set(X0 + d, Y0 - 1, hc)); rect(X0 - 1, Y0 + 2, X0 - 1, Y0 + 6, hc); rect(X0 + 14, Y0 + 2, X0 + 14, Y0 + 6, hc); [2, 5, 8, 11].forEach(d => set(X0 + d, Y0 + 5, hc)); },
    long:() => { rect(X0, Y0 + 5, X0 + 1, Y0 + 13, hc); rect(X0 + 12, Y0 + 5, X0 + 13, Y0 + 13, hc); rect(X0 + 2, Y0 + 5, X0 + 4, Y0 + 5, hc); set(X0 + 2, Y0 + 6, hc); },
    bob:() => { rect(X0, Y0 + 5, X0 + 1, Y0 + 10, hc); rect(X0 + 12, Y0 + 5, X0 + 13, Y0 + 10, hc); rect(X0 + 2, Y0 + 5, X0 + 11, Y0 + 5, hc); set(X0 - 1, Y0 + 9, hc); set(X0 + 14, Y0 + 9, hc); },
    middle:() => { rect(X0 + 1, Y0 + 5, X0 + 5, Y0 + 5, hc); rect(X0 + 8, Y0 + 5, X0 + 12, Y0 + 5, hc); rect(X0, Y0 + 5, X0, Y0 + 8, hc); rect(X0 + 13, Y0 + 5, X0 + 13, Y0 + 8, hc); rect(X0 + 6, Y0 + 2, X0 + 7, Y0 + 4, sprMix(hc, '#000000', .3)); },
    bowl:() => { rect(X0 + 2, Y0 - 1, X0 + 11, Y0 - 1, hc); rect(X0, Y0 + 5, X0 + 13, Y0 + 5, hc); rect(X0 - 1, Y0 + 2, X0, Y0 + 8, hc); rect(X0 + 13, Y0 + 2, X0 + 14, Y0 + 8, hc); },
    pixie:() => { set(X0 + 2, Y0 + 5, hc); set(X0 + 3, Y0 + 6, hc); set(X0 + 5, Y0 + 5, hc); set(X0 + 9, Y0 + 5, hc); set(X0 + 11, Y0 + 5, hc); set(X0 + 12, Y0 + 6, hc); rect(X0, Y0 + 5, X0, Y0 + 7, hc); rect(X0 + 13, Y0 + 5, X0 + 13, Y0 + 7, hc); set(X0 - 1, Y0 + 2, hc); set(X0 + 14, Y0 + 3, hc); },
    hime:() => { rect(X0 + 1, Y0 + 5, X0 + 12, Y0 + 5, hc); rect(X0, Y0 + 5, X0 + 1, Y0 + 12, hc); rect(X0 + 12, Y0 + 5, X0 + 13, Y0 + 12, hc); },
    wave:() => { rect(X0 + 1, Y0 + 5, X0 + 4, Y0 + 5, hc); set(X0 + 1, Y0 + 6, hc); rect(X0 + 10, Y0 + 5, X0 + 12, Y0 + 5, hc); rect(X0 - 1, Y0 + 4, X0, Y0 + 13, hc); rect(X0 + 13, Y0 + 4, X0 + 14, Y0 + 13, hc); set(X0 - 2, Y0 + 9, hc); set(X0 + 15, Y0 + 9, hc); },
    lowtail:() => { rect(X0 + 1, Y0 + 5, X0 + 3, Y0 + 5, hc); rect(X0, Y0 + 5, X0, Y0 + 8, hc); rect(X0 + 13, Y0 + 5, X0 + 13, Y0 + 8, hc); set(X0 + 9, Y0 + 5, hc); },
    twin:() => { rect(X0 + 1, Y0 + 5, X0 + 12, Y0 + 5, hc); set(X0 - 1, Y0 + 3, '#e05a78'); set(X0 + 14, Y0 + 3, '#e05a78'); rect(X0, Y0 + 5, X0, Y0 + 7, hc); rect(X0 + 13, Y0 + 5, X0 + 13, Y0 + 7, hc); },
    bun:() => { rect(X0 + 10, Y0 - 1, X0 + 14, Y0 + 2, hc); rect(X0 + 11, Y0, X0 + 12, Y0, sprMix(hc, '#ffffff', .3)); set(X0 + 10, Y0 + 3, '#e05a78'); set(X0 + 11, Y0 + 3, '#e05a78'); rect(X0 + 1, Y0 + 5, X0 + 5, Y0 + 5, hc); rect(X0, Y0 + 5, X0, Y0 + 9, hc); rect(X0 + 13, Y0 + 5, X0 + 13, Y0 + 9, hc); },
    ponytail:() => { rect(X0, Y0 + 5, X0, Y0 + 7, hc); rect(X0 + 13, Y0 + 5, X0 + 13, Y0 + 6, hc); set(X0 + 3, Y0 + 5, hc); set(X0 + 13, Y0 + 2, '#e05a78'); },
  };
  (s[style] || s.short)();
}
// ================= v17.31：Kenney 換裝小人（CC0）＋walk3 走路＋頭上表情泡泡＋裝備圖示 =================
// 圖檔資料在 js/art.js（tools/build_art.py 產生）。舊的 24×32 程序造型（sprGrid）留著備用，不再畫在地圖上。
const KEN_SCALE = 1, KEN_TAG = 19, KEN_W = 48, KEN_H = 48, KEN_OX = 16, KEN_OY = 23, KEN_FOOT = 39;   // 畫布裡腳底在 y=39、人物中心 x=24
const KEN_COL = { '#':'#3f2631', H:'#bd6c4a', h:'#763b36', S:'#f7c282', s:'#e19a65', C:'#c0cbdc', c:'#8b9bb4', k:'#262b44', P:'#9b4ca3', p:'#d176d0', m:'#52607c', G:'#25956a', g:'#43e1b3', o:'#eaa56c', x:'#aab7cc', r:'#e84537' };
const KEN_LONG = ['long', 'hime', 'wave', 'bob', 'twin', 'lowtail', 'ponytail', 'bun'];
const kenT = n => ART.ken[n];
const kenAt = (n, x, y) => ART.ken[n][y * 16 + x];
// 依每個人的資料拼出 16×16 的樣子（頭＋身體＋職業頭飾＋配件），回傳顏色陣列
function kenGrid(h, expr){
  const L = sprLooks(h), C = SPR_CLS[h.cls], age = h.age || 20, r = sprRng(sprHash(sprSeed(h) + '#k'));
  const style = h.record ? 'buzz' : L.style;
  let head = style === 'buzz' ? '07_02' : ['spiky', 'curly'].includes(style) ? '07_04' : KEN_LONG.includes(style) ? '08_03' : '07_01';
  if (head === '07_01' && h.sex !== 'f' && age >= 45 && r() < .35) head = '07_02';
  const body = h.cls === 'warrior' ? '08_02' : h.cls === 'archer' ? '09_04' : h.cls === 'mage' ? '07_00' : h.cls === 'thief' ? '09_03' : (h.sex === 'f' ? '08_03' : '07_01');
  const cut = head === '08_03' || body === '07_00' || body === '09_03' ? 11 : 10;
  let sk = L.skin; if (expr === 'sick' || h.addict) sk = sprMix(sk, '#b0d0a0', expr === 'sick' ? .45 : .32); if (expr === 'angry') sk = sprMix(sk, '#f07a6a', .28);
  const sk2 = '#' + [1, 3, 5].map((i, j) => Math.round(parseInt(sk.slice(i, i + 2), 16) * [.91, .79, .78][j]).toString(16).padStart(2, '0')).join(''), hc = age >= 60 ? SPR_WHITE : age >= 52 ? SPR_GRAY : L.hair, hk = sprMix(hc, '#1a1020', .42);
  const cl = h._cloth || (C ? C.c : (SPR_ROLE[h.role] || (h.sex === 'f' ? '#9a5a80' : '#4a7a5a'))), cl2 = sprMix(cl, '#000000', .32), clL = sprMix(cl, '#ffffff', .28);
  const TH = { H:'#4a566e', h:'#2e3448', o:'#6a7690', C:'#8a94a8', x:'#8a94a8', c:'#3a4458' };
  const G = [];
  for (let y = 0; y < 16; y++) { const row = []; G.push(row);
    for (let x = 0; x < 16; x++) {
      let ch, col;
      if (y < cut) { ch = kenAt(head, x, y);
        if (h.cls === 'mage' && y <= 5) { ch = kenAt('07_00', x, y); col = ch === '.' ? null : KEN_COL[ch]; row.push(col); continue; }
        if (h.cls === 'thief' && y <= 5) { ch = kenAt('09_03', x, y); col = ch === '.' ? null : (TH[ch] || KEN_COL[ch]); row.push(col); continue; }
        col = ch === '.' ? null : ({ H:hc, h:hk, S:sk, s:sk2, o:'#e8708a' })[ch] || KEN_COL[ch];
      } else { ch = kenAt(body, x, y);
        if (ch === '.') { row.push(null); continue; }
        if (ch === 'S') col = sk; else if (ch === 's') col = sk2;
        else if (body === '07_01') col = ({ C:cl, c:cl2, H:L.pants, h:sprMix(L.pants, '#000000', .3) })[ch];
        else if (body === '08_03') col = ({ P:cl, p:clL, H:head === '08_03' ? hc : cl2, h:head === '08_03' ? hk : cl2 })[ch];
        else if (body === '07_00') col = ({ C:'#d176d0', c:'#9b4ca3', x:'#d176d0' })[ch];
        else if (body === '09_03') col = TH[ch];
        col = col || KEN_COL[ch];
      }
      row.push(col);
    } }
  if (h.cls === 'archer' && head !== '07_02') [4, 5, 6, 7, 8, 9, 10, 11].forEach((x, i) => { if (G[5][x] && G[5][x] !== KEN_COL['#']) G[5][x] = i >= 3 && i <= 5 ? KEN_COL.g : KEN_COL.G; });
  if (h.sex !== 'f' && age >= 35 && head !== '07_02' && h.cls !== 'thief' && r() < .3) { for (let x = 5; x <= 10; x++) if (G[9][x] && G[9][x] !== KEN_COL['#']) G[9][x] = hk; G[8][4] = G[8][11] = hk; }
  if (r() < .12 && h.cls !== 'thief') { for (let x = 5; x <= 10; x++) G[7][x] = KEN_COL['#']; G[8][5] = G[8][10] = '#78c8e6'; }
  if ((h.perks && h.perks.includes('scar')) || h.scar) { G[5][10] = G[6][10] = G[7][11] = '#aa4646'; }
  if (h.married && G[12][12]) G[12][12] = '#f2c14e';
  return G;
}
// walk3：踏地的腳釘住、身體和抬起的腳往上 1 格；回傳 16×17
function kenWalk(G, f){
  const o = Array.from({ length:17 }, () => Array(16).fill(null));
  const put = (x0, y0, x1, y1, dx, dy) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (G[y][x]) o[y - y0 + dy][x - x0 + dx] = G[y][x]; };
  if (f % 2 === 0) { put(0, 0, 16, 16, 0, 1); return o; }
  const lift = f === 1 ? 0 : 1; put(0, 0, 16, 14, 0, 0);
  for (const side of [0, 1]) { const x0 = side ? 8 : 0, x1 = side ? 16 : 8;
    if (side === lift) put(x0, 14, x1, 16, x0, 14); else { put(x0, 14, x1, 16, x0, 15); put(x0, 14, x1, 15, x0, 14); } }
  return o;
}
// 文字圖 → 顏色陣列（表情、裝備共用調色盤）
const ART_IX = {}; for (let i = 0; i < ART.ch.length; i++) ART_IX[ART.ch[i]] = ART.pal[i];
function artGrid(s, w, h, ox = 0, stride = w){ const G = []; for (let y = 0; y < h; y++) { const row = []; for (let x = 0; x < w; x++) { const c = s[y * stride + ox + x]; row.push(c === ' ' ? null : ART_IX[c]); } G.push(row); } return G; }
const EQ_WP = { warrior:'sword', archer:'bow', mage:'staff', thief:'dagger' };
const EQ_G = {};
function eqGrid(n, rot){ const k = n + (rot ? 'r' : ''); if (EQ_G[k]) return EQ_G[k]; const E = artGrid(ART.eq[n], 16, 16);
  return EQ_G[k] = rot ? E.map((row, y) => row.map((_, x) => E[15 - x][y])) : E; }
const eqImg = (n, z = 20) => ART.equrl[n] ? `<img class="eqi" src="${ART.equrl[n]}" width="${z}" height="${z}" alt="">` : '';
// 攻擊動作：武器圖示拿在右手，劍往下砍、匕首往前刺、杖舉高發光、弓拉弦放箭
const KEN_ATK = {
  sword:[{ dy:-3 }, { dy:-3 }, { rot:1, dx:1, fx:'arc' }, { rot:1, dx:2 }, { rot:1, dx:1 }, {}],
  dagger:[{}, { rot:1, dx:2, fx:'stab' }, {}, { rot:1, dx:2, fx:'stab' }, {}, {}],
  staff:[{}, { dy:-3, fx:'glow' }, { dy:-3, fx:'glow2' }, { dx:1, fx:'cast' }, {}, {}],
  bow:[{}, { pull:1 }, { pull:2 }, { fx:'shot' }, {}, {}],   // pull：往後拉、人往後靠 1 格
};
function kenCanvas(h, kind, f, expr){
  const key = 'K|' + sprSig(h) + '|' + (h.sex || '') + '|' + (h._cloth || '') + '|' + (h.wpn || 0) + '|' + kind + '|' + f + '|' + (expr === 'sick' || expr === 'angry' ? expr : '');
  let cv = SPR_CACHE.get(key); if (cv) return cv;
  if (SPR_CACHE.size > 900) SPR_CACHE.clear();
  const B = kenGrid(h, expr), O = Array.from({ length:KEN_H }, () => Array(KEN_W).fill(null));
  const blit = (G, dx, dy) => G.forEach((row, y) => row.forEach((c, x) => { const X = x + dx, Y = y + dy; if (c && X >= 0 && X < KEN_W && Y >= 0 && Y < KEN_H) O[Y][X] = c; }));
  const fx = (x, y, c = '#ffffff') => { if (x >= 0 && x < KEN_W && y >= 0 && y < KEN_H) O[y][x] = c; };
  if (kind === 'down') {   // v17.47：躺著時眼睛瞇著：眼睛上半格塗成膚色、下半格改成往外多一格的橫線
    const E = []; for (let y = 0; y < 10; y++) for (let x = 0; x < 16; x++) if (B[y][x] === KEN_COL.k) E.push([x, y]);
    if (E.length) { const top = Math.min(...E.map(e => e[1])), xs = [...new Set(E.map(e => e[0]))].sort((a, b) => a - b), mid = (xs[0] + xs[xs.length - 1]) / 2;
      E.forEach(([x, y]) => { B[y][x] = y === top ? (B[y][x - 1] || B[y][x + 1]) : KEN_COL['#']; });
      xs.forEach(x => { const xx = x < mid ? x - 1 : x + 1; if (B[top + 1] && B[top + 1][xx]) B[top + 1][xx] = KEN_COL['#']; }); }
    const R = Array.from({ length:16 }, () => Array(16).fill(null)); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) R[15 - x][y] = B[y][x]; blit(R, KEN_OX, KEN_FOOT - 15); }
  else if (kind === 'attack' && h.cls && EQ_WP[h.cls]) {
    const wp = EQ_WP[h.cls], P = KEN_ATK[wp][f % 6], dx = P.dx || 0, hx = KEN_OX + 13 + dx, hy = KEN_OY + 12 + (P.dy || 0), n = wp + clamp(h.wpn || 0, 0, 3);
    const body = kenWalk(B, 0);
    if (wp === 'bow') { blit(body, KEN_OX + dx - (P.pull ? 1 : 0), KEN_OY); blit(eqGrid(n), hx - 6 - (P.pull || 0), hy - 9);
      if (P.fx === 'shot') for (let i = 0; i < 7; i++) fx(hx + 6 + i, hy - 1, i < 5 ? '#c8a070' : '#e8eef6'); }
    else { blit(body, KEN_OX + dx, KEN_OY);
      if (P.rot) blit(eqGrid(n, 1), hx - 1, hy - 3); else blit(eqGrid(n), hx - 3, hy - 14);
      if (P.fx === 'arc') for (let a = -80; a <= 40; a += 12) { const t = a * Math.PI / 180; fx(Math.round(hx + Math.cos(t) * 13), Math.round(hy - 2 + Math.sin(t) * 13)); }
      if (P.fx === 'stab') for (let i = 0; i < 4; i++) fx(hx + 15 + i, hy + 9 + (i % 2));
      if (P.fx === 'glow' || P.fx === 'glow2') { const cx = hx - 3 + 12, cy = hy - 14 + 3, n2 = P.fx === 'glow' ? 4 : 8; for (let i = 0; i < n2; i++) { const t = i / n2 * 6.283; fx(Math.round(cx + Math.cos(t) * 5), Math.round(cy + Math.sin(t) * 5), '#bfe8ff'); } }
      if (P.fx === 'cast') { const cx = hx - 3 + 12, cy = hy - 14 + 3; fx(cx + 5, cy - 2); fx(cx + 6, cy - 3, '#bfe8ff'); fx(cx + 7, cy - 1, '#bfe8ff'); fx(cx + 8, cy - 2); } }
  } else if (kind === 'crouch') { const G = kenWalk(B, 0); blit(G.slice(0, 11), KEN_OX, KEN_OY + 3); blit(G.slice(12).map((r, i) => r), KEN_OX, KEN_OY + 12); }   // v17.90：蹲下（上半身往下壓 3 格）
  else blit(kenWalk(B, kind === 'walk' ? f % 4 : 0), KEN_OX, KEN_OY);
  cv = document.createElement('canvas'); cv.width = KEN_W; cv.height = KEN_H;
  const g = cv.getContext('2d'); O.forEach((row, y) => row.forEach((c, x) => { if (c) { g.fillStyle = c; g.fillRect(x, y, 1, 1); } }));
  SPR_CACHE.set(key, cv); return cv;
}
// 表情泡泡：狀態 → 泡泡名稱
const EMO_OF = { happy:'開心', blush:'害羞', love:'戀愛', angry:'生氣', sad:'難過', nervous:'緊張', tired:'累', sleepy:'想睡', sick:'生病', hurt:'好痛', ouch:'好痛', serious:'認真', down:'沮喪', surprise:'驚訝', puzzled:'疑惑', idea:'想到了', money:'想要錢', speechless:'無言', drunk:'喝醉' };
const EMO_CV = {};
function emoStrip(nm){ if (EMO_CV[nm]) return EMO_CV[nm]; const e = ART.emo[nm]; if (!e) return null;
  const cv = document.createElement('canvas'); cv.width = e.w * e.n; cv.height = e.h; const g = cv.getContext('2d');
  artGrid(e.px, e.w * e.n, e.h).forEach((row, y) => row.forEach((c, x) => { if (c) { g.fillStyle = c; g.fillRect(x, y, 1, 1); } }));
  const tot = e.d.reduce((a, b) => a + b, 0); return EMO_CV[nm] = { cv, e, tot }; }
function emoFrame(nm, now){ const s = emoStrip(nm); if (!s) return null; let t = ((now % s.tot) + s.tot) % s.tot, i = 0; while (i < s.e.n - 1 && t >= s.e.d[i]) { t -= s.e.d[i]; i++; } return { s, i }; }
// 沒有特別狀態的時候，偶爾冒一個小念頭（每 8 秒有 1/5 機會，冒 2.6 秒）
function idleEmo(h, now){
  const ph = sprHash(sprSeed(h)) % 8000, slot = Math.floor((now + ph) / 8000), r = sprHash(sprSeed(h) + '@' + slot) % 100;
  if (r >= 20 || (now + ph) % 8000 > 2600) return null;
  const pool = ['idea', 'puzzled', 'surprise', 'speechless'];
  if ((h.mood ?? 60) > 60) pool.push('happy', 'idea'); if (h.goal === 'rich' || h.goal === 'money' || (h.wallet != null && h.wallet < 50)) pool.push('money', 'money');
  return pool[sprHash(sprSeed(h) + '~' + slot) % pool.length];
}
function emoKey(h, expr, lying, now){
  if (lying) { if (h.act === 'dying') return null; if (expr === 'hurt' || h.bedDays > 0) return 'hurt'; if (expr && expr !== 'normal' && expr !== 'tired') return expr; return h.act === 'drink' ? 'drunk' : 'sleepy'; }
  if (h.act === 'drink' && typeof hourOf === 'function' && hourOf() >= 20) return 'drunk';
  if (expr && expr !== 'normal') return expr;
  return idleEmo(h, now);
}
function drawEmo(c, nm, x, yBottom, now, pe){
  const F = emoFrame(nm, now); if (!F) return; const { s, i } = F, w = s.e.w * pe, hh = s.e.h * pe;
  const sx = Math.round(x - w / 2), sy = Math.max(1, Math.round(yBottom - hh));
  c.drawImage(s.cv, i * s.e.w, 0, s.e.w, s.e.h, sx, sy, w, hh);
}
// 快取：同一個人同一格只畫一次
const SPR_CACHE = new Map();
function sprSig(h){ return [sprSeed(h), h.cls || h.role || '', (h.job || 0) > 0 ? 1 : 0, h.age >= 60 ? 2 : h.age >= 52 ? 1 : 0, h.age >= 62 ? 1 : 0, h.age >= 42 ? 1 : 0, h.married ? 1 : 0, (h.perks && h.perks.includes('scar')) ? 1 : 0, h.record ? 1 : 0, h.addict ? 1 : 0, h.hex ? [h.hex.X > 65, h.hex.E > 70, h.hex.A < 30].join('') : ''].join('|'); }
function sprCanvas(h, kind, f, expr){
  const key = sprSig(h) + '|' + kind + '|' + f + '|' + expr;
  let cv = SPR_CACHE.get(key); if (cv) return cv;
  if (SPR_CACHE.size > 600) SPR_CACHE.clear();
  const G = sprGrid(h, kind, f, expr); cv = document.createElement('canvas'); cv.width = 24; cv.height = 32;
  const g = cv.getContext('2d'); G.forEach((row, y) => row.forEach((c, x) => { if (c) { g.fillStyle = c; g.fillRect(x, y, 1, 1); } }));
  SPR_CACHE.set(key, cv); return cv;
}
// 大頭貼＝Kenney 小人整隻（16×16）
function faceCanvas(h, expr){ const src = kenCanvas(h, 'idle', 0, expr || exprOf(h)), cv = document.createElement('canvas'); cv.width = 16; cv.height = 16; cv.getContext('2d').drawImage(src, KEN_OX, KEN_OY + 1, 16, 16, 0, 0, 16, 16); return cv; }
const URL_CACHE = new Map();
function faceURL(h, expr){ if (!h) return ''; const e = expr || exprOf(h), key = sprSig(h) + '|' + e; let u = URL_CACHE.get(key); if (u) return u; if (URL_CACHE.size > 300) URL_CACHE.clear(); u = faceCanvas(h, e).toDataURL(); URL_CACHE.set(key, u); return u; }
const pimg = (h, expr) => h ? `<img class="pimg" src="${faceURL(h, expr)}" alt="">` : '';
// 在地圖上畫一個人（取代舊的 drawHero）
const NAME_C = { hero:'#f2c14e', artist:'#9fd0ff', friend:'#bff0cf', npc:'rgba(255,255,255,.8)' };
function nameTag(c, t, x, y, kind){ c.font = fz(8) + 'px Cubic11, sans-serif'; const w = c.measureText(t).width; c.fillStyle = 'rgba(16,20,30,.55)'; c.fillRect(x - w / 2 - 2, y - 7, w + 4, 9); c.fillStyle = NAME_C[kind] || NAME_C.npc; c.fillText(t, x - w / 2, y); }
function drawSprite(c, h, x, y, lying, now, opt){
  let kind = 'idle', f = 0;
  const moving = opt ? opt.moving : (Math.abs((h.tx ?? h.x) - h.x) > .6 || Math.abs((h.ty ?? h.y) - h.y) > .6) && !(h.leg && h.leg.stop > now);
  const foe = opt ? null : h.act === 'hunt' && h.fighting ? (h.target || (HFX && HFX.ghost)) : scnFoe(h, now) || (ambFx(h, now) || {}).tg || null;   // v17.37：任務演出也一樣   // 打怪時一律面向怪物（調整站位時也是）
  const left = opt ? opt.left : foe ? foe.x < h.x : moving && (h.tx ?? h.x) < h.x - .6;
  if (lying) kind = 'down';
  else if (opt && opt.atk) { kind = 'attack'; f = Math.floor(now / 100) % 6; }
  else if (opt && opt.atkT != null && now >= opt.atkT && now - opt.atkT < 600) { kind = 'attack'; f = Math.min(5, Math.floor((now - opt.atkT) / 100)); }   // v17.49：指定這一下揮擊的時間（村子裡的鬥技場）
  else if (!opt && heroFx(h, now) && !heroFx(h, now).charge && Math.max(0, now - heroFx(h, now).t) < 600) { const t0 = heroFx(h, now).t; kind = 'attack'; f = Math.min(5, Math.floor(Math.max(0, now - t0) / 100)); }   // v17.35：每回合揮一次
  else if ((h.act === 'hunt' || (h.act === 'mission' && h.mission && !MSPOT[h.mission.ag] && !(SCN && !SCN.off))) && h.flash > 0) { kind = 'attack'; f = Math.floor(now / 100) % 6; }
  else if (opt ? opt.crouch : heroCrouch(h, now)) kind = 'crouch';
  else if (moving) { kind = 'walk'; f = Math.floor(now / 140) % 4; }
  const expr = opt && opt.expr || exprOf(h), cv = kenCanvas(h, kind, f, expr), sc = opt && opt.scale || KEN_SCALE;
  // 像素對齊：在螢幕座標用整數倍放大，每個像素一樣大
  const t = c.getTransform(), p = Math.max(1, Math.round(sc * t.a)), sx = Math.round(t.a * x + t.e), sy = Math.round(t.d * y + t.f);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false;
  if (left) { c.translate(sx, 0); c.scale(-1, 1); c.drawImage(cv, -24 * p, sy - KEN_FOOT * p, KEN_W * p, KEN_H * p); c.setTransform(1, 0, 0, 1, 0, 0); }
  else c.drawImage(cv, sx - 24 * p, sy - KEN_FOOT * p, KEN_W * p, KEN_H * p);
  if (!(opt && opt.noEmo)) { const ph = sprHash(sprSeed(h)) % 997, ek = emoKey(h, expr, lying, now + ph), nm = ek && EMO_OF[ek];
    if (nm) drawEmo(c, nm, sx + (lying ? -4 * p : 0), sy - (lying ? 16 : KEN_TAG + 8) * t.a, now + ph, Math.max(1, Math.round(sc * .8 * t.a))); }
  c.restore();
}

function drawHero(c, x, y, lying, now, hh){ drawSprite(c, hh || H(), x, y, lying, now); }
const monMix = (a, b, t) => { const p = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)); const [r1, g1, b1] = p(a), [r2, g2, b2] = p(b); return '#' + [r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join(''); };
// ================= v17.33：怪物換成 design/monsters 的定案圖（ART.mon，16×16，魔王 24×24，和勇者同比例 1 格＝1 世界單位） =================
// 每區一個「族」z0～z6：雜魚 a、c，強敵 b、d，菁英 e（強敵 b 的菁英版）。同一族裡每隻怪用 seed 固定挑一種
// 圖本身不動，動作用程式做：待機上下彈、攻擊往前衝、受傷閃白／泛紅、倒下壓扁變暗
const zoneMon = z => 'z' + Math.max(0, Math.min(6, z));
const MON_OUT = '#3f2631';
function monKey(type, seed, elite){ if (!/^z\d$/.test(type)) return ART.mon[type] ? type : 'z0a';
  if (elite) return type + 'e';
  const r = ((Math.sin((seed || 0) * 12.9898 + 4.1) * 43758.5453) % 1 + 1) % 1;
  return type + (r < .4 ? 'a' : r < .7 ? 'c' : r < .85 ? 'b' : 'd'); }
const MON_CACHE = new Map();
function monCanvas(key, kind, f){
  const ck = key + '|' + (kind === 'hurt' ? 'hurt' + (f % 2) : kind === 'down' ? 'down' : kind === 'glow' ? 'glow' : 'n'); let cv = MON_CACHE.get(ck); if (cv) return cv;
  const M = ART.mon[key], W = M.w, H = M.h; let G = [];
  for (let y = 0; y < H; y++) { const row = []; for (let x = 0; x < W; x++) { const ch = M.px[y * W + x]; row.push(ch === ' ' ? null : M.pal[ART.mch.indexOf(ch)]); } G.push(row); }
  if (kind === 'glow') G = G.map(r => r.map(c => !c || c === MON_OUT ? c : monMix(c, key === 'abyss' ? '#c0302a' : '#be5aff', .35)));   // v17.45：魔王蓄力
  if (kind === 'hurt') G = G.map(r => r.map(c => !c || c === MON_OUT ? c : f % 2 ? '#ffffff' : monMix(c, '#ff4a4a', .45)));
  if (kind === 'down') { const R = Array.from({ length:H }, () => Array(W).fill(null)), sq = .45;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (G[y][x]) { const ny = H - 1 - Math.floor((H - 1 - y) * sq); R[ny][x] = monMix(G[y][x], '#262230', .35); } G = R; }
  cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  G.forEach((row, y) => row.forEach((c, x) => { if (c) { g.fillStyle = c; g.fillRect(x, y, 1, 1); } }));
  MON_CACHE.set(ck, cv); return cv;
}
const monHalf = type => (/^z\d/.test(type) ? 16 : ART.mon[type] ? ART.mon[type].w : 16) / 2;
const monH = type => /^z\d/.test(type) ? 16 : ART.mon[type] ? ART.mon[type].h : 16;
// seed：同一隻怪每次都畫成同一種（例如 m.ph）；elite：用菁英圖
function drawMonster(c, type, x, y, kind, f, elite, left, seed, sq){
  const key = monKey(type, seed, elite), cv = monCanvas(key, kind, f), t = c.getTransform(), p = Math.max(1, Math.round(t.a));
  const dx = kind === 'attack' ? [1, 3, 1][f % 3] * (left ? -1 : 1) : 0, dy = kind === 'idle' && (f % 4 === 1 || f % 4 === 2) ? -1 : 0;
  const sx = Math.round(t.a * x + t.e) + dx * p, sy = Math.round(t.d * y + t.f) + dy * p, w = cv.width * p, hh = Math.round(cv.height * p * (sq || 1));
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false;
  c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(sx - dx * p, Math.round(t.d * y + t.f), w * .34, Math.max(2, p * 2), 0, 0, 7); c.fill();
  if (left) { c.translate(sx, 0); c.scale(-1, 1); c.drawImage(cv, -Math.round(w / 2), sy - hh, w, hh); }
  else c.drawImage(cv, sx - Math.round(w / 2), sy - hh, w, hh);
  c.restore();
}
// ================= v17.4：建築與地景造型（和人物、怪物同風格：粗描邊、平塗、少陰影） =================
// 每棟建築是一張像素格，像素密度和人物一樣（1 格＝SPR_SCALE 世界單位），快取成小畫布，畫的時候像素對齊。
// 'W' 是窗戶玻璃：白天反光藍、晚上暖黃、深夜暗黃。
const BLD_INK = '#262230';
const BLD_CACHE = new Map(), BLD_LIT = [];   // BLD_LIT：這一格畫面要在夜色上面補畫的窗戶燈光
const bMix = (a, b, t) => monMix(a, b, t);
function bldPainter(W, H){
  const G = Array.from({ length:H }, () => Array(W).fill(null));
  const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < W && y >= 0 && y < H && c) G[y][x] = c; };
  const get = (x, y) => (G[y] && G[y][x]) || null;
  const rect = (x0, y0, x1, y1, c) => { for (let y = Math.round(y0); y <= Math.round(y1); y++) for (let x = Math.round(x0); x <= Math.round(x1); x++) set(x, y, c); };
  const ell = (cx, cy, rx, ry, c) => { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const dx = (x - cx) / rx, dy = (y - cy) / ry; if (dx * dx + dy * dy <= 1) set(x, y, c); } };
  const line = (x0, y0, x1, y1, c) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) set(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c); };
  const poly = (pts, c) => { const ys = pts.map(p => p[1]), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
    for (let y = y0; y <= y1; y++) { const xs = []; for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= y + .5 && by > y + .5) || (by <= y + .5 && ay > y + .5)) xs.push(ax + (y + .5 - ay) * (bx - ax) / (by - ay)); }
      xs.sort((a, b) => a - b); for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] - .5); x <= Math.floor(xs[k + 1] - .5); x++) set(x, y, c); } };
  // 正面看的屋頂（梯形）：yT 屋脊、yB 屋簷；瓦片橫紋＋錯開的縫；屋簷下一排陰影
  const roof = (x0, x1, yT, yB, c, o = {}) => { const top = o.top ?? .28, cx = (x0 + x1) / 2, half = (x1 - x0) / 2, cD = bMix(c, '#1a1420', .25), cL = bMix(c, '#ffffff', .22);
    for (let y = yT; y <= yB; y++) { const t = (y - yT) / Math.max(1, yB - yT), hw = half * (top + (1 - top) * t); rect(cx - hw, y, cx + hw, y, c);
      if (o.tiles !== false && (yB - y) % 3 === 0 && y > yT) rect(cx - hw + 1, y, cx + hw - 1, y, cD);
      else if (o.tiles !== false && y > yT) for (let x = Math.ceil(cx - hw) + ((Math.floor((yB - y) / 3)) % 2 ? 2 : 0); x < cx + hw - 1; x += 4) set(x, y, cD); }
    rect(cx - half * top + 1, yT, cx + half * top - 1, yT, cL);   // 屋脊亮線
    rect(x0, yB + 1, x1, yB + 1, cD); };
  // 牆面：wood 橫板、stone 磚、plaster 灰泥（只有少許斑點）
  const wall = (x0, y0, x1, y1, c, type = 'wood') => { rect(x0, y0, x1, y1, c); const cD = bMix(c, '#1a1420', .16);
    if (type === 'wood') for (let y = y0 + 2; y <= y1; y += 3) rect(x0, y, x1, y, cD);
    else if (type === 'stone') for (let y = y0 + 2, r = 0; y <= y1; y += 4, r++) { rect(x0, y, x1, y, cD); for (let x = x0 + (r % 2 ? 3 : 6); x <= x1; x += 7) rect(x, y - 3, x, y - 1, cD); }
    else for (let k = 0; k < (x1 - x0) * (y1 - y0) / 40; k++) set(x0 + ((k * 37) % (x1 - x0 + 1)), y0 + ((k * 53) % (y1 - y0 + 1)), cD);
    rect(x0, y0, x1, y0, bMix(c, '#1a1420', .3)); };   // 屋簷下陰影
  const win = (x0, y0, w, h, frame = '#6a4428', o = {}) => { rect(x0 - 1, y0 - 1, x0 + w, y0 + h, frame); rect(x0, y0, x0 + w - 1, y0 + h - 1, 'W');
    if (w >= 6) rect(x0 + Math.floor(w / 2), y0, x0 + Math.floor(w / 2), y0 + h - 1, frame);
    if (h >= 5) rect(x0, y0 + Math.floor(h / 2), x0 + w - 1, y0 + Math.floor(h / 2), frame);
    set(x0, y0, 'Wh'); if (o.sill !== false) rect(x0 - 2, y0 + h, x0 + w + 1, y0 + h, bMix(frame, '#ffffff', .25));
    if (o.flowers) for (let x = x0 - 1; x <= x0 + w; x += 2) { set(x, y0 + h - 1, o.flowers); set(x, y0 + h + 1, '#4f8a3a'); } };
  const door = (cx, yB, w, h, c = '#5a3a22', o = {}) => { const x0 = Math.round(cx - w / 2), x1 = x0 + w - 1, y0 = yB - h + 1, fr = o.frame || bMix(c, '#1a1420', .35);
    rect(x0 - 1, y0 - 1, x1 + 1, yB, fr); rect(x0, y0, x1, yB, c);
    if (o.arch) { set(x0, y0, fr); set(x1, y0, fr); }
    if (w >= 8) rect(Math.round(cx), y0, Math.round(cx), yB, fr);
    for (let y = y0 + 2; y < yB; y += 3) { set(x0 + 1, y, bMix(c, '#ffffff', .12)); }
    set(w >= 8 ? Math.round(cx) - 2 : x1 - 1, y0 + Math.round(h * .55), '#f2c14e'); if (w >= 8) set(Math.round(cx) + 1, y0 + Math.round(h * .55), '#f2c14e'); };
  const steps = (x0, x1, yB, n = 2, c = '#a8a090') => { for (let i = 0; i < n; i++) { rect(x0 - i * 2, yB - (n - 1 - i) * 2 - 1, x1 + i * 2, yB - (n - 1 - i) * 2, i % 2 ? c : bMix(c, '#ffffff', .15)); } };
  const base = (x0, x1, yB, h = 3, c = '#8f8a7e') => { rect(x0, yB - h + 1, x1, yB, c); for (let x = x0 + 2; x < x1; x += 5) set(x, yB - h + 1, bMix(c, '#1a1420', .22)); };
  const sign = (x0, y0, w, h, c = '#c89a5a') => { rect(x0, y0, x0 + w - 1, y0 + h - 1, c); rect(x0, y0 + h - 1, x0 + w - 1, y0 + h - 1, bMix(c, '#1a1420', .3)); rect(x0, y0, x0 + w - 1, y0, bMix(c, '#ffffff', .25)); };
  const flag = (x, yB, h, c, wave = 0) => { rect(x, yB - h, x, yB, '#5a4a3a'); poly([[x + 1, yB - h], [x + 7, yB - h + 2 + wave], [x + 1, yB - h + 5]], c); set(x, yB - h - 1, '#f2c14e'); };
  const chimney = (x0, y0, w, h, c = '#8a5a44') => { rect(x0, y0, x0 + w - 1, y0 + h - 1, c); rect(x0 - 1, y0, x0 + w, y0 + 1, bMix(c, '#1a1420', .3)); for (let y = y0 + 3; y < y0 + h; y += 3) rect(x0, y, x0 + w - 1, y, bMix(c, '#1a1420', .18)); };
  return { W, H, G, set, get, rect, ell, line, poly, roof, wall, win, door, steps, base, sign, flag, chimney };
}
// 描邊：外圍一圈墨色（和人物、怪物一致）
function bldOutline(G){ const H = G.length, W = G[0].length, O = G.map(r => r.slice());
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!G[y][x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => G[y + b] && G[y + b][x + a])) O[y][x] = BLD_INK;
  return O; }
const bg = n => Math.max(8, Math.round(n / SPR_SCALE));   // 世界單位 → 造型格數
// ---- 各建築畫法（P 是 painter；格子大小由建築在地圖上的大小換算） ----
const BLD_ART = {
  guild(P){ const { W, H } = P, eave = Math.round(H * .36);
    P.wall(4, eave, W - 5, H - 4, '#ead8ac', 'plaster');
    [4, Math.round(W * .3), Math.round(W * .7), W - 5].forEach(x => P.rect(x - 1, eave, x, H - 4, '#6a4428'));   // 木頭骨架
    P.rect(4, Math.round(H * .64), W - 5, Math.round(H * .64) + 1, '#6a4428');
    P.base(3, W - 4, H - 1, 4);
    P.roof(1, W - 2, 3, eave - 1, '#4a78b0', { top:.36 });
    P.win(Math.round(W * .32) + 3, 8, 6, 6, '#3a5a80');   // 屋頂老虎窗
    P.win(Math.round(W * .62) - 4, 8, 6, 6, '#3a5a80');
    P.win(9, eave + 7, 8, 9); P.win(W - 18, eave + 7, 8, 9);
    P.win(9, Math.round(H * .64) + 6, 8, 9, '#6a4428', { flowers:'#ff7b7b' }); P.win(W - 18, Math.round(H * .64) + 6, 8, 9, '#6a4428', { flowers:'#f2c14e' });
    P.door(W / 2, H - 5, 14, 18, '#7a4a28', { arch:true });
    const sx = Math.round(W / 2) - 10; P.sign(sx, eave + 4, 21, 11, '#2f4f78');   // 公會招牌：交叉的劍
    P.line(sx + 5, eave + 6, sx + 15, eave + 12, '#e8ecf2'); P.line(sx + 15, eave + 6, sx + 5, eave + 12, '#e8ecf2'); P.set(sx + 10, eave + 9, '#f2c14e'); P.rect(sx + 4, eave + 12, sx + 6, eave + 12, '#f2c14e'); P.rect(sx + 14, eave + 12, sx + 16, eave + 12, '#f2c14e');
    P.flag(Math.round(W / 2), 6, 6, '#f2c14e'); },
  temple(P){ const { W, H } = P, cx = Math.round(W / 2), st = '#e8e2d2', stD = '#c9c1ac', hall = Math.round(H * .42);
    // 鐘塔
    P.wall(cx - 9, 16, cx + 9, hall + 2, st, 'stone'); P.roof(cx - 11, cx + 11, 5, 15, '#5a8ab8', { top:.0, tiles:false });
    P.rect(cx - 4, 20, cx + 4, 27, '#3a3450'); P.ell(cx, 24, 3, 3, '#f2c14e'); P.set(cx, 21, '#3a3450');   // 鐘
    P.rect(cx, 0, cx, 5, '#f2c14e'); P.rect(cx - 2, 2, cx + 2, 2, '#f2c14e');   // 塔頂的記號
    // 主殿＋三角山牆
    P.wall(3, hall + 10, W - 4, H - 6, st, 'stone');
    P.poly([[0, hall + 11], [cx, hall - 2], [W - 1, hall + 11]], stD); P.poly([[6, hall + 9], [cx, hall + 2], [W - 7, hall + 9]], st);
    P.ell(cx, hall + 6, 3, 2.4, 'W'); P.rect(0, hall + 11, W - 1, hall + 12, stD);
    [8, 20, W - 21, W - 9].forEach(x => { P.rect(x, hall + 13, x + 4, H - 8, '#f6f2e8'); P.rect(x + 3, hall + 13, x + 4, H - 8, stD); P.rect(x - 1, hall + 13, x + 5, hall + 14, stD); P.rect(x - 1, H - 9, x + 5, H - 8, stD); });   // 柱子
    P.door(cx, H - 7, 12, 22, '#8a6a3a', { arch:true, frame:'#b0a68e' });
    P.win(cx - 4, hall + 16, 3, 7, '#b0a68e', { sill:false }); P.win(cx + 2, hall + 16, 3, 7, '#b0a68e', { sill:false });
    P.steps(6, W - 7, H - 1, 3, '#c9c1ac'); },
  mayor(P){ const { W, H } = P, eave = Math.round(H * .4);
    P.chimney(W - 20, 4, 6, 14, '#9a6a54');
    P.wall(4, eave, W - 5, H - 4, '#d8a46a', 'wood'); P.base(3, W - 4, H - 1, 3);
    P.roof(1, W - 2, 6, eave - 1, '#8a4a32', { top:.22 });
    P.win(10, eave + 7, 9, 9, '#6a4428', { flowers:'#ff9ad0' }); P.win(W - 20, eave + 7, 9, 9, '#6a4428', { flowers:'#ff9ad0' });
    // 門廊
    P.rect(Math.round(W / 2) - 12, H - 24, Math.round(W / 2) + 12, H - 22, '#7a4a32'); P.rect(Math.round(W / 2) - 11, H - 21, Math.round(W / 2) - 10, H - 4, '#6a4428'); P.rect(Math.round(W / 2) + 10, H - 21, Math.round(W / 2) + 11, H - 4, '#6a4428');
    P.door(W / 2, H - 4, 10, 15, '#5a3a22');
    P.sign(Math.round(W / 2) - 5, eave + 3, 11, 5, '#f2e2b0'); P.rect(Math.round(W / 2) - 3, eave + 5, Math.round(W / 2) + 3, eave + 5, '#7a4a32'); },
  smith(P){ const { W, H } = P, eave = Math.round(H * .34), st = '#7a7470';
    P.chimney(W - 18, 0, 9, 24, '#5a504a');
    P.wall(4, eave, W - 5, H - 4, st, 'stone'); P.base(3, W - 4, H - 1, 3, '#5a5450');
    P.roof(1, W - 2, 8, eave - 1, '#4a4448', { top:.3 });
    // 敞開的爐口
    const fx = 8, fy = eave + 10; P.rect(fx - 1, fy - 1, fx + 18, H - 5, '#3a3430'); P.rect(fx, fy, fx + 17, H - 5, '#1e1a1a');
    P.rect(fx + 3, H - 12, fx + 14, H - 6, '#c0563f'); P.rect(fx + 5, H - 11, fx + 12, H - 7, '#ffb347'); P.rect(fx + 7, H - 10, fx + 10, H - 8, '#fff0a0');
    // 鐵砧
    const ax = W - 24; P.rect(ax, H - 13, ax + 12, H - 11, '#5a5a66'); P.rect(ax + 3, H - 10, ax + 9, H - 8, '#4a4a56'); P.rect(ax + 1, H - 7, ax + 11, H - 5, '#4a4a56'); P.set(ax + 1, H - 13, '#9aa0b0');
    P.win(W - 22, eave + 7, 7, 6, '#3a3430');
    P.sign(Math.round(W / 2) - 3, eave + 3, 11, 7, '#c89a5a'); P.rect(Math.round(W / 2) - 1, eave + 5, Math.round(W / 2) + 5, eave + 6, '#5a5a66'); P.rect(Math.round(W / 2) + 1, eave + 7, Math.round(W / 2) + 2, eave + 8, '#6a4428'); },
  arena(P){ const { W, H } = P, cx = W / 2, st = '#b8a67e', stD = '#8a7a5a';
    P.ell(cx, 16, W / 2 - 2, 11, stD); P.ell(cx, 16, W / 2 - 6, 8, '#e0c890');   // 上面看得到沙地
    for (let k = 0; k < 6; k++) P.set(cx - 10 + k * 4, 14 + (k % 2), '#c8b078');
    P.rect(2, 16, W - 3, H - 4, st); P.ell(cx, H - 10, W / 2 - 2, 8, st);
    for (let y = 22; y < H - 4; y += 5) P.rect(2, y, W - 3, y, stD);
    [8, Math.round(cx) - 4, W - 16].forEach((x, i) => { P.rect(x, 26, x + 7, 36, '#3a2a1e'); P.ell(x + 3.5, 26, 3.5, 3, '#3a2a1e'); });   // 拱門
    P.rect(Math.round(cx) - 5, H - 18, Math.round(cx) + 5, H - 4, '#3a2a1e'); P.ell(cx, H - 18, 5, 4, '#3a2a1e');
    P.flag(4, 10, 8, '#c0303a'); P.flag(W - 8, 10, 8, '#3f6ea0', 1); P.flag(Math.round(cx), 4, 6, '#f2c14e'); },
  tavern(P){ const { W, H } = P, eave = Math.round(H * .3);
    P.wall(3, eave, W - 4, H - 4, '#5a86b8', 'wood'); P.base(2, W - 3, H - 1, 3);
    P.rect(3, Math.round(H * .6), W - 4, Math.round(H * .6) + 1, '#3a5a80');
    P.roof(0, W - 1, 4, eave - 1, '#3a4a6a', { top:.2 });
    P.win(7, eave + 6, 7, 8, '#2f4f78'); P.win(W - 15, eave + 6, 7, 8, '#2f4f78');
    P.door(W / 2 + 4, H - 4, 10, 15, '#6a4428');
    // 啤酒杯招牌（從牆上伸出來）
    P.rect(1, Math.round(H * .62), 9, Math.round(H * .62), '#5a4a3a'); P.sign(1, Math.round(H * .62) + 2, 10, 10, '#f2e2b0');
    P.rect(3, Math.round(H * .62) + 4, 7, Math.round(H * .62) + 10, '#f2c14e'); P.rect(3, Math.round(H * .62) + 4, 7, Math.round(H * .62) + 5, '#ffffff'); P.rect(8, Math.round(H * .62) + 6, 8, Math.round(H * .62) + 8, '#f2c14e');
    P.rect(3, H - 12, 10, H - 4, '#8a5a3a'); P.rect(3, H - 9, 10, H - 9, '#5a3a22'); P.rect(3, H - 6, 10, H - 6, '#5a3a22'); },   // 木桶
  stage(P){ const { W, H } = P, top = Math.round(H * .48);
    // 紅色布幕＋彩旗
    P.rect(4, 6, W - 5, top, '#a83040'); for (let x = 6; x < W - 5; x += 5) P.rect(x, 8, x, top, '#8a2434');
    P.rect(2, 4, W - 3, 7, '#f2c14e'); P.rect(2, 4, 3, top, '#6a4428'); P.rect(W - 4, 4, W - 3, top, '#6a4428');
    for (let x = 5, k = 0; x < W - 5; x += 6, k++) P.poly([[x, 8], [x + 5, 8], [x + 2.5, 12]], ['#ff7b7b', '#59a8ff', '#6fcf97', '#f2c14e'][k % 4]);
    // 木頭舞台
    P.rect(0, top + 1, W - 1, top + 3, '#d8a46a'); P.wall(1, top + 4, W - 2, H - 3, '#a8784a', 'wood'); P.steps(Math.round(W / 2) - 6, Math.round(W / 2) + 6, H - 1, 2, '#c8935a');
    P.rect(4, top - 6, 5, top, '#3a3a40'); P.ell(4.5, top - 7, 2, 1.5, '#5a5a66'); },   // 麥克風架
  inn(P){ const { W, H } = P, eave = Math.round(H * .3);
    P.chimney(5, 2, 5, 12, '#9a6a54');
    P.wall(3, eave, W - 4, H - 4, '#f0dcc0', 'plaster'); P.base(2, W - 3, H - 1, 3);
    P.rect(3, Math.round(H * .6), W - 4, Math.round(H * .6) + 1, '#8a4a32');
    P.roof(0, W - 1, 4, eave - 1, '#c0563f', { top:.2 });
    P.win(7, eave + 6, 7, 8, '#8a4a32', { flowers:'#ff7b7b' }); P.win(W - 15, eave + 6, 7, 8, '#8a4a32', { flowers:'#ff7b7b' });
    P.door(W / 2, H - 4, 10, 15, '#7a4a28');
    const sx = Math.round(W / 2) - 7; P.sign(sx, Math.round(H * .6) + 3, 15, 8, '#f2e2b0');   // 床的招牌
    P.rect(sx + 3, Math.round(H * .6) + 6, sx + 11, Math.round(H * .6) + 7, '#59a8ff'); P.rect(sx + 3, Math.round(H * .6) + 5, sx + 5, Math.round(H * .6) + 5, '#ffffff'); P.set(sx + 2, Math.round(H * .6) + 8, '#6a4428'); P.set(sx + 12, Math.round(H * .6) + 8, '#6a4428');
    P.ell(5, Math.round(H * .6) + 6, 1.6, 2, '#ffb347'); P.ell(W - 6, Math.round(H * .6) + 6, 1.6, 2, '#ffb347'); },   // 燈籠
  clinic(P){ const { W, H } = P, eave = Math.round(H * .32);
    P.wall(3, eave, W - 4, H - 4, '#f4f0e6', 'plaster'); P.base(2, W - 3, H - 1, 3);
    P.roof(0, W - 1, 6, eave - 1, '#5a9a5a', { top:.2 });
    const cx = Math.round(W / 2); P.rect(cx - 6, eave + 3, cx + 6, eave + 13, '#ffffff'); P.rect(cx - 1, eave + 5, cx + 1, eave + 11, '#4aa04a'); P.rect(cx - 4, eave + 7, cx + 4, eave + 9, '#4aa04a');   // 綠十字
    P.win(6, H - 22, 8, 8, '#4a7a4a'); [[7, '#ff7b7b'], [10, '#59a8ff'], [13, '#6fcf97']].forEach(([x, c]) => { P.rect(x, H - 17, x + 1, H - 15, c); P.set(x, H - 18, '#ffffff'); });   // 窗台上的藥瓶
    P.door(W - 11, H - 4, 9, 14, '#4a7a4a'); },
  house(P, o){ const { W, H } = P, eave = Math.round(H * .4), shop = o && o.shop;
    if (!shop) P.chimney(W - 13, 2, 5, 10, '#9a6a54');
    P.wall(4, eave, W - 5, H - 4, shop ? '#c8906a' : '#b88a62', 'wood'); P.base(3, W - 4, H - 1, 3);
    P.roof(1, W - 2, 4, eave - 1, shop ? '#a8604a' : '#7a5040', { top:.22 });
    P.win(8, eave + 6, 7, 7, '#6a4428', { flowers:shop ? null : '#ff9ad0' });
    P.door(W - 15, H - 4, 8, 13, '#6a4428');
    if (shop) { const c = shop; for (let x = 3; x < W - 3; x++) P.rect(x, eave + 1, x, eave + 4, Math.floor((x - 3) / 4) % 2 ? '#ffffff' : c);   // 條紋遮雨棚
      for (let x = 3; x < W - 3; x += 4) P.set(x + 2, eave + 5, c);
      P.rect(6, H - 12, 18, H - 9, '#8a5a3a'); [[7, '#ff7b7b'], [10, '#f2c14e'], [13, '#6fcf97'], [16, '#ffb347']].forEach(([x, c2]) => P.rect(x, H - 14, x + 1, H - 13, c2)); } },   // 攤子上的貨
  // 你的事務所：外觀跟著階段變氣派；惡名高時變成地下風格
  office(P, o){ const { W, H } = P, st = o.stage || 0, dark = o.dark, eave = Math.round(H * .36);
    const roofC = dark ? '#4a3a5a' : st >= 2 ? '#d8a02e' : '#c99a2e', wallC = dark ? '#6a6070' : st >= 3 ? '#f4ead2' : '#e8d2a0', trim = dark ? '#3a2a3a' : st >= 2 ? '#a83040' : '#7a4a28';
    if (st >= 3) { P.wall(Math.round(W / 2) - 8, 6, Math.round(W / 2) + 8, eave, wallC, dark ? 'stone' : 'plaster'); P.roof(Math.round(W / 2) - 10, Math.round(W / 2) + 10, 0, 7, roofC, { top:0, tiles:false }); P.win(Math.round(W / 2) - 2, 11, 4, 6, trim); }
    P.wall(4, eave, W - 5, H - 4, wallC, dark ? 'stone' : st >= 3 ? 'stone' : 'plaster'); P.base(3, W - 4, H - 1, 4, dark ? '#4a4450' : '#8f8a7e');
    P.roof(1, W - 2, st >= 3 ? 9 : 5, eave - 1, roofC, { top:.32 });
    if (st >= 2) P.rect(1, eave, W - 2, eave + 1, trim);
    // 大招牌：星星
    const sx = Math.round(W / 2) - 13; P.sign(sx, eave + 4, 27, 11, dark ? '#2a2030' : '#fff6d0'); P.rect(sx, eave + 4, sx + 26, eave + 4, trim);
    const sc = dark ? '#c04a6a' : '#e0a020', cy = eave + 9, cx = Math.round(W / 2);
    P.poly([[cx, cy - 4], [cx + 1.2, cy - 1], [cx + 4.5, cy - 1], [cx + 1.8, cy + 1], [cx + 3, cy + 4.5], [cx, cy + 2.4], [cx - 3, cy + 4.5], [cx - 1.8, cy + 1], [cx - 4.5, cy - 1], [cx - 1.2, cy - 1]], sc);
    P.win(8, eave + 8, 8, 9, trim); P.win(W - 17, eave + 8, 8, 9, trim);
    P.win(8, Math.round(H * .7), 8, 9, trim, { flowers:dark ? null : '#ff7b7b' }); P.win(W - 17, Math.round(H * .7), 8, 9, trim, { flowers:dark ? null : '#ff7b7b' });
    P.door(W / 2, H - 5, 14, 19, dark ? '#2a2030' : '#7a4a28', { arch:true });
    // 每升一個階段多一面旗
    const fc = dark ? '#5a1a2a' : '#a83040';
    for (let i = 0; i < st; i++) { const x = i % 2 ? W - 22 - (i >> 1) * 5 : 20 + (i >> 1) * 5; P.rect(x, eave + 20, x + 3, eave + 30, fc); P.set(x + 1, eave + 31, fc); P.set(x + 2, eave + 31, fc); P.set(x + 1, eave + 23, '#f2c14e'); P.set(x + 2, eave + 23, '#f2c14e'); }
    if (st >= 4 && !dark) P.flag(Math.round(W / 2), 2, 0, '#f2c14e');
    if (dark) { P.set(10, eave + 3, '#2a2030'); P.set(W - 12, eave + 6, '#2a2030'); P.line(W - 10, H - 20, W - 7, H - 14, '#4a4450'); } },
  // ---- 周邊與遠方地圖的小東西 ----
  cottage(P, o){ const { W, H } = P, eave = Math.round(H * .42);
    P.wall(3, eave, W - 4, H - 2, o.wall || '#b88a62', 'wood'); P.roof(1, W - 2, 2, eave - 1, o.roof || '#c0563f', { top:.2 });
    P.win(5, eave + 3, 4, 4, '#6a4428', { sill:false }); P.door(W - 8, H - 2, 5, 8, '#6a4428'); },
  tree(P){ const { W, H } = P, cx = W / 2;
    P.rect(cx - 2, H - 9, cx + 1, H - 1, '#6a4428'); P.set(cx - 3, H - 1, '#6a4428'); P.set(cx + 2, H - 1, '#6a4428');
    P.ell(cx, H * .42, W / 2 - 1, H * .36, '#2f6a2c'); P.ell(cx - 3, H * .5, W / 2 - 5, H * .26, '#2a5e27'); P.ell(cx - 2, H * .32, W / 2 - 6, H * .2, '#3f8a3a');
    P.set(cx - 5, H * .26, '#6fbf5a'); P.set(cx - 4, H * .26, '#6fbf5a'); P.set(cx - 5, H * .26 + 1, '#6fbf5a'); P.set(cx + 4, H * .5, '#1f4a1d'); P.set(cx + 5, H * .5, '#1f4a1d'); },
  rock(P){ const { W, H } = P; P.ell(W / 2, H / 2 + 1, W / 2 - 1, H / 2 - 1, '#8a7c64'); P.ell(W / 2 - 2, H / 2 - 1, W / 2 - 5, H / 2 - 3, '#a8987a'); P.set(4, 3, '#cfc0a0'); P.set(5, 3, '#cfc0a0'); P.line(W / 2 + 2, H / 2, W / 2 + 4, H - 3, '#6d6250'); },
  castle(P){ const { W, H } = P, st = '#d9d4c4', stD = '#b0a890', cx = Math.round(W / 2);
    P.wall(6, 30, W - 7, H - 2, stD, 'stone');   // 外牆
    for (let x = 6; x < W - 6; x += 6) P.rect(x, 27, x + 3, 30, stD);
    P.wall(cx - 22, 14, cx + 22, H - 10, st, 'stone');   // 主堡
    for (let x = cx - 22; x < cx + 22; x += 6) P.rect(x, 11, x + 3, 14, st);
    [[2, 18, 16], [W - 18, 18, 16], [cx - 8, 0, 16]].forEach(([x, y, w]) => { P.wall(x, y + 9, x + w - 1, H - 2 - (x === cx - 8 ? 20 : 0), st, 'stone'); P.roof(x - 1, x + w, y, y + 8, '#5a7aa8', { top:0, tiles:false }); P.win(x + w / 2 - 2, y + 14, 3, 5, '#7a7060', { sill:false }); });
    P.flag(cx, 0, 0, '#c0563f'); P.rect(cx, 0, cx, 1, '#5a4a3a');
    P.door(cx, H - 3, 14, 18, '#5a3a22', { arch:true, frame:'#7a7060' }); P.rect(cx - 6, H - 20, cx + 6, H - 19, '#3a3430');
    P.win(cx - 14, 24, 4, 6, '#7a7060', { sill:false }); P.win(cx + 11, 24, 4, 6, '#7a7060', { sill:false });
    P.rect(cx - 14, 36, cx - 11, 46, '#c0563f'); P.rect(cx + 11, 36, cx + 14, 46, '#c0563f'); P.set(cx - 13, 39, '#f2c14e'); P.set(cx + 12, 39, '#f2c14e'); },
  darkcastle(P){ const { W, H } = P, st = '#2e2238', stD = '#1e1428', cx = Math.round(W / 2);
    P.wall(6, 30, W - 7, H - 2, st, 'stone');
    [[2, 12, 14], [W - 16, 12, 14], [cx - 8, 0, 16]].forEach(([x, y, w]) => { P.wall(x, y + 10, x + w - 1, H - 2, st, 'stone'); P.poly([[x - 1, y + 10], [x + w / 2, y], [x + w, y + 10]], '#4a2a5a'); P.win(x + w / 2 - 1, y + 16, 2, 4, stD, { sill:false }); });
    for (let x = 6; x < W - 6; x += 6) P.rect(x, 27, x + 3, 30, st);
    P.rect(cx - 7, H - 20, cx + 7, H - 2, '#100a16'); P.ell(cx, H - 20, 7, 5, '#100a16');
    for (let x = cx - 6; x <= cx + 6; x += 3) P.rect(x, H - 14, x, H - 11, '#8a8090');   // 鐵閘
    P.ell(cx - 3, 22, 1.4, 1, '#ff4a6a'); P.ell(cx + 3, 22, 1.4, 1, '#ff4a6a'); },
  mine(P){ const { W, H } = P; P.ell(W / 2, H, W / 2 - 1, H - 2, '#5a4e44'); P.ell(W / 2, H, W / 2 - 5, H - 6, '#1a1612');
    P.rect(4, 4, 5, H - 1, '#7a5a3a'); P.rect(W - 6, 4, W - 5, H - 1, '#7a5a3a'); P.rect(3, 3, W - 4, 5, '#8a6a44'); P.set(W / 2, 8, '#ffb347'); P.set(W / 2, 9, '#ffd678'); },
  mountain(P){ const { W, H } = P; P.poly([[0, H - 1], [W / 2, 1], [W - 1, H - 1]], '#a8b4c0'); P.poly([[W / 2, 1], [W - 1, H - 1], [W / 2 + 4, H - 1]], '#8a96a6');
    P.poly([[W / 2 - 9, 17], [W / 2, 1], [W / 2 + 9, 17], [W / 2 + 4, 14], [W / 2, 18], [W / 2 - 4, 13]], '#ffffff'); },
};
// mode：day / night / late（深夜窗戶變暗）
const WIN_C = { day:['#8cc0e0', '#e8f6ff'], night:['#ffd678', '#fff2c0'], late:['#a8834a', '#c8a060'] };
function bldCanvas(kind, gw, gh, mode = 'day', opt){
  const key = kind + '|' + gw + 'x' + gh + '|' + mode + '|' + (opt ? JSON.stringify(opt) : ''); let cv = BLD_CACHE.get(key); if (cv) return cv;
  const P = bldPainter(gw, gh); BLD_ART[kind](P, opt || {});
  const O = bldOutline(P.G), wc = WIN_C[mode] || WIN_C.day;
  cv = document.createElement('canvas'); cv.width = gw + 2; cv.height = gh + 2; const g = cv.getContext('2d');
  O.forEach((row, y) => row.forEach((c, x) => { if (!c) return; g.fillStyle = c === 'W' ? wc[0] : c === 'Wh' ? wc[1] : c; g.fillRect(x + 1, y + 1, 1, 1); }));
  // 晚上：另外做一張「燈光層」（窗戶＋一圈淡淡的光暈），等夜色蓋上去之後再補畫，窗戶才亮得起來
  if (mode !== 'day') { const L = document.createElement('canvas'); L.width = cv.width; L.height = cv.height; const lg = L.getContext('2d'), isW = (x, y) => O[y] && (O[y][x] === 'W' || O[y][x] === 'Wh'); let any = 0;
    lg.fillStyle = mode === 'late' ? 'rgba(255,190,100,.12)' : 'rgba(255,200,110,.22)';
    O.forEach((row, y) => row.forEach((c, x) => { if (!isW(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2], [1, 1], [-1, 1], [1, -1], [-1, -1]].some(([a, b]) => isW(x + a, y + b))) lg.fillRect(x + 1, y + 1, 1, 1); }));
    O.forEach((row, y) => row.forEach((c, x) => { if (isW(x, y)) { any = 1; lg.fillStyle = c === 'Wh' ? wc[1] : wc[0]; lg.fillRect(x + 1, y + 1, 1, 1); } }));
    if (any) cv.lit = L; }
  BLD_CACHE.set(key, cv); return cv;
}
// v17.32：斜角建築圖（ART.bld）。'W'／'Wh' 是窗戶，依白天／晚上／深夜上色；晚上另外做燈光層
const ISO_CACHE = new Map();
function isoCanvas(name, mode){ const key = name + '|' + mode; let cv = ISO_CACHE.get(key); if (cv) return cv;
  const B = ART.bld[name], wc = WIN_C[mode] || WIN_C.day, isW = (x, y) => x >= 0 && y >= 0 && x < B.w && y < B.h && (B.px[y * B.w + x] === ART.bch[0] || B.px[y * B.w + x] === ART.bch[1]);
  cv = document.createElement('canvas'); cv.width = B.w; cv.height = B.h; const g = cv.getContext('2d');
  for (let i = 0; i < B.px.length; i++) { const ch = B.px[i]; if (ch === ' ') continue; const c = ART.bpal[ART.bch.indexOf(ch)]; g.fillStyle = c === 'W' ? wc[0] : c === 'Wh' ? wc[1] : c; g.fillRect(i % B.w, Math.floor(i / B.w), 1, 1); }
  if (mode !== 'day') { const L = document.createElement('canvas'); L.width = B.w; L.height = B.h; const lg = L.getContext('2d'); let any = 0;
    lg.fillStyle = mode === 'late' ? 'rgba(255,190,100,.12)' : 'rgba(255,200,110,.22)';
    for (let y = 0; y < B.h; y++) for (let x = 0; x < B.w; x++) if (!isW(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2], [1, 1], [-1, 1], [1, -1], [-1, -1]].some(([a, b]) => isW(x + a, y + b))) lg.fillRect(x, y, 1, 1);
    for (let y = 0; y < B.h; y++) for (let x = 0; x < B.w; x++) if (isW(x, y)) { any = 1; lg.fillStyle = B.px[y * B.w + x] === ART.bch[1] ? wc[1] : wc[0]; lg.fillRect(x, y, 1, 1); }
    if (any) cv.lit = L; }
  ISO_CACHE.set(key, cv); return cv; }
// 地基角（ax, ay）放在世界座標 (wx, wy)；和人物一樣 1 格＝1 世界單位、螢幕上整數倍放大
function drawIso(c, name, wx, wy, mode){ const B = ART.bld[name], cv = isoCanvas(name, mode), t = c.getTransform(), p = Math.max(1, Math.round(t.a));
  const sx = Math.round(t.a * wx + t.e) - B.ax * p, sy = Math.round(t.d * wy + t.f) - B.ay * p;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false; c.drawImage(cv, sx, sy, B.w * p, B.h * p); c.restore();
  if (cv.lit) BLD_LIT.push([cv.lit, sx, sy, B.w * p, B.h * p]); }
// 門前的石板小路：從門口往右下（斜角的正前方，建築正面朝右）延伸到人行道，寬度和門一樣
// 門口沿牆的方向是 (+1, -½)，往前的方向是 (+1, +½)；len＝門口到人行道的高度差
const PATH_CACHE = new Map();
function pathCanvas(w, len){ const key = w + '|' + len; let cv = PATH_CACHE.get(key); if (cv) return cv;
  const x0 = -Math.ceil(w / 2) - 1, x1 = Math.ceil(w / 2) + len * 2 + 2, y0 = -Math.ceil(w / 4) - 1;
  cv = document.createElement('canvas'); cv.width = x1 - x0; cv.height = len - y0 + 1; cv.ox = -x0; cv.oy = -y0; const g = cv.getContext('2d');
  for (let y = y0; y <= len; y++) for (let x = x0; x < x1; x++) { const t = (x + 2 * y) / 2, u = (x - 2 * y) / 2;
    if (u < -w / 2 || u >= w / 2 || t < 0) continue;
    g.fillStyle = u < -w / 2 + 1 || u >= w / 2 - 1 ? '#a8987a' : (Math.floor(t / 3) % 2 ? '#d4c6a6' : '#c8b898'); g.fillRect(x - x0, y - y0, 1, 1); }
  PATH_CACHE.set(key, cv); return cv; }
function isoPath(x, y, len, w){ const cv = pathCanvas(Math.max(3, w || 5), Math.round(len)), t = ctx.getTransform(), p = Math.max(1, Math.round(t.a));
  const sx = Math.round(t.a * x + t.e) - cv.ox * p, sy = Math.round(t.d * y + t.f) - cv.oy * p;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(cv, sx, sy, cv.width * p, cv.height * p); ctx.restore(); }
// 把造型畫進世界座標的矩形 [x, y, w, h]：底邊置中對齊，像素對齊（和人物同一個放大倍數）
function drawBld(c, kind, x, y, w, h, mode, opt){
  // 建築要照地圖上的實際大小（不像人物取整數倍），否則相鄰的房子會疊在一起；邊緣對齊到螢幕像素
  const gw = bg(w), gh = bg(h), cv = bldCanvas(kind, gw, gh, mode, opt), t = c.getTransform(), q = t.a * w / gw;
  const L = Math.round(t.a * x + t.e), R = Math.round(t.a * (x + w) + t.e), B = Math.round(t.d * (y + h) + t.f), T = Math.round(B - (gh + 2) * q * t.d / t.a), px = Math.max(1, Math.round(q));
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false;
  c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(L + 2 * px, B - px, R - L - px, 3 * px);   // 影子
  c.drawImage(cv, L - Math.round(q), T + Math.round(q), R - L + 2 * Math.round(q), B - T); c.restore();
  if (cv.lit) BLD_LIT.push([cv.lit, L - Math.round(q), T + Math.round(q), R - L + 2 * Math.round(q), B - T]);
}
// 地面：預先畫好的整張村子／周邊地面（小雜點、石板路），每張圖只畫一次
const GROUND_CACHE = {};
function groundCanvas(key, paint){ if (GROUND_CACHE[key]) return GROUND_CACHE[key]; const cv = document.createElement('canvas'); cv.width = 360; cv.height = 270; const g = cv.getContext('2d'); paint(g); GROUND_CACHE[key] = cv; return cv; }
function speckle(g, x0, y0, w, h, cols, n, seed = 1, sz = 1){ let s = seed * 9301 + 49297; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280; for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; g.fillRect(Math.floor(x0 + r() * w), Math.floor(y0 + r() * h), sz, sz); } }
function vilGround(){ return groundCanvas('vil', g => {
  g.fillStyle = '#6f9a48'; g.fillRect(0, 0, 360, 270);
  speckle(g, 0, 0, 360, 270, ['#7eab52', '#5f8a3e', '#86b65a'], 900, 3);
  for (let i = 0; i < 60; i++) { const x = (i * 97) % 356, y = (i * 61) % 266; if (y > 110 && y < 186) continue; g.fillStyle = '#4f7a34'; g.fillRect(x, y + 1, 1, 2); g.fillRect(x + 2, y, 1, 3); g.fillRect(x + 4, y + 1, 1, 2); }   // 草叢
  [[30, 108, '#ff9ad0'], [150, 104, '#f2c14e'], [214, 106, '#ffffff'], [70, 190, '#ff7b7b'], [172, 252, '#f2c14e'], [340, 108, '#ff9ad0']].forEach(([x, y, c]) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); g.fillRect(x + 3, y + 2, 1, 1); g.fillRect(x - 2, y + 3, 1, 1); });
  // 大路：石板
  g.fillStyle = '#b89a6e'; g.fillRect(0, 116, 360, 66); g.fillStyle = '#a3865c'; g.fillRect(0, 116, 360, 2); g.fillRect(0, 180, 360, 2);
  for (let y = 120, r = 0; y < 178; y += 6, r++) for (let x = (r % 2) * 5; x < 360; x += 10) { g.fillStyle = (x + y) % 3 ? '#c4a77a' : '#bfa274'; g.fillRect(x + 1, y + 1, 8, 4); }
  speckle(g, 0, 118, 360, 62, ['#9a7c54', '#d2b68a'], 160, 7);
  // 通往各棟建築的小徑
  [[40, 98], [115, 100], [187, 98], [260, 98], [329, 98]].forEach(([x, y]) => { g.fillStyle = '#a8875e'; g.fillRect(x - 5, y, 10, 116 - y); g.fillStyle = '#b89a6e'; g.fillRect(x - 4, y, 8, 116 - y); });
}); }
function outGround(){ return groundCanvas('out', g => {
  g.fillStyle = '#4a7a3f'; g.fillRect(0, 0, 360, 270); speckle(g, 0, 0, 360, 212, ['#558a48', '#3f6c35', '#5e9450'], 700, 5);
}); }
// ---- v17.5 街道用的造型 ----
Object.assign(BLD_ART, {
  gate(P){ const { W, H } = P, wd = '#8a5a3a', wdD = '#6a4428';
    P.rect(4, 6, 8, H - 1, wd); P.rect(W - 9, 6, W - 5, H - 1, wd); P.rect(7, 6, 8, H - 1, wdD); P.rect(W - 6, 6, W - 5, H - 1, wdD);   // 柱子
    P.poly([[0, 3], [W - 1, 3], [W - 4, 9], [3, 9]], '#a8704a'); P.rect(2, 3, W - 3, 4, '#c08a5a'); P.rect(6, 11, W - 7, 13, wdD);   // 橫樑
    const sx = Math.round(W / 2) - 11; P.rect(sx + 4, 14, sx + 4, 16, wdD); P.rect(sx + 18, 14, sx + 18, 16, wdD); P.sign(sx, 17, 23, 12, '#f2e2b0');   // 吊牌
    P.rect(sx + 4, 21, sx + 18, 22, '#8a5a3a'); P.rect(sx + 6, 24, sx + 16, 24, '#8a5a3a');
    P.rect(W - 13, 15, W - 11, 15, '#3a3430'); P.ell(W - 12, 19, 2, 2.6, 'W');   // 燈籠
    P.base(1, 12, H - 1, 3); P.base(W - 13, W - 2, H - 1, 3);
    P.rect(11, H - 20, 12, H - 1, wd); P.poly([[3, H - 22], [15, H - 22], [18, H - 19], [15, H - 16], [3, H - 16]], '#c89a5a'); P.rect(6, H - 20, 13, H - 19, wdD); },   // 往周邊的路標
  home(P, o){ const { W, H } = P, own = o.own, eave = Math.round(H * .42), t = own ? 1 : 0;
    const wall = own ? '#f0d4a8' : '#c8b090', roof = own ? '#c0563f' : '#7a7a8a';
    P.chimney(W - 14, 3, 5, 10, '#9a6a54');
    P.wall(4, eave, W - 5, H - 4, wall, t ? 'wood' : 'plaster'); P.base(3, W - 4, H - 1, 3);
    P.roof(1, W - 2, 4, eave - 1, roof, { top:.24 });
    P.win(8, eave + 5, 8, 8, '#6a4428', { flowers:own || o.mar ? '#ff9ad0' : null });
    P.door(W - 16, H - 4, 9, 14, own ? '#a8603a' : '#6a5a4a');
    if (own) { P.rect(W - 7, H - 12, W - 6, H - 4, '#5a4a3a'); P.rect(W - 9, H - 15, W - 4, H - 12, '#3f6ea0'); }   // 自己的信箱
    if (!own) { P.rect(20, eave + 5, 26, eave + 11, '#ffffff'); P.rect(21, eave + 7, 25, eave + 7, '#a0a0a0'); P.rect(21, eave + 9, 24, eave + 9, '#a0a0a0'); }   // 門邊的租屋告示
    if (o.mar) { const hx = W - 16; P.set(hx - 1, eave + 3, '#ff7b7b'); P.set(hx + 1, eave + 3, '#ff7b7b'); P.rect(hx - 1, eave + 4, hx + 1, eave + 4, '#ff7b7b'); P.set(hx, eave + 5, '#ff7b7b'); }   // 門上的小愛心
    if (o.kid) { P.ell(10, H - 6, 2, 2, '#59a8ff'); P.set(9, H - 7, '#ffffff'); P.rect(9, eave + 6, 10, eave + 7, '#f2c14e'); P.rect(13, eave + 9, 14, eave + 10, '#6fcf97'); } },   // 小孩的球、窗上的畫
  lamp(P){ const { W, H } = P, c = Math.floor(W / 2);
    P.rect(c - 1, 8, c, H - 3, '#3a3a46'); P.rect(c - 3, H - 3, c + 2, H - 1, '#3a3a46');
    P.rect(c - 4, 2, c + 3, 3, '#3a3a46'); P.rect(c - 3, 4, c + 2, 8, 'W'); P.set(c - 3, 4, 'Wh'); P.rect(c - 2, 0, c + 1, 1, '#3a3a46'); },
  crate(P){ const { W, H } = P; P.rect(1, 2, W - 2, H - 1, '#b08050'); P.rect(1, 2, W - 2, 3, '#8a5a3a'); P.rect(1, H - 2, W - 2, H - 1, '#8a5a3a'); P.line(2, 4, W - 3, H - 3, '#8a5a3a'); },
  barrel(P){ const { W, H } = P; P.ell(W / 2 - .5, H / 2, W / 2 - 1, H / 2 - 1, '#9a6a3a'); P.rect(1, 4, W - 2, 4, '#5a4a3a'); P.rect(1, H - 5, W - 2, H - 5, '#5a4a3a'); P.set(3, 3, '#c09060'); },
  flowers(P){ const { W, H } = P; P.rect(0, H - 5, W - 1, H - 1, '#8a5a3a'); P.rect(1, H - 7, W - 2, H - 6, '#4f8a3a'); for (let x = 2; x < W - 2; x += 3) { P.set(x, H - 8 - (x % 2), ['#ff7b7b', '#f2c14e', '#ff9ad0', '#ffffff'][x % 4]); P.set(x, H - 7, '#3f7a2a'); } },
  bench(P){ const { W, H } = P; P.rect(1, H - 7, W - 2, H - 6, '#a8704a'); P.rect(1, H - 11, W - 2, H - 10, '#a8704a'); P.rect(3, H - 5, 4, H - 1, '#5a4a3a'); P.rect(W - 5, H - 5, W - 4, H - 1, '#5a4a3a'); },
});
// 遠山（兩層視差），每層預先畫成一長條
const VHILL = {};
function vilHills(k){ if (VHILL[k]) return VHILL[k]; const f = k === 'far' ? .72 : .45, Wd = Math.ceil(WW * (1 - f) + 400), c = document.createElement('canvas'); c.width = Wd; c.height = 110; const g = c.getContext('2d');
  const top = x => k === 'far' ? 52 + Math.sin(x / 47) * 12 + Math.sin(x / 19 + 1) * 6 + Math.sin(x / 7) * 1.5 : 78 + Math.sin(x / 31 + 2) * 7 + Math.sin(x / 13) * 3;
  for (let x = 0; x < Wd; x++) { const t = Math.round(top(x)); g.fillStyle = k === 'far' ? '#8ea8c8' : '#7fae68'; g.fillRect(x, t, 1, 110 - t);
    if (k === 'far' && t < 50) { g.fillStyle = '#eef4fa'; g.fillRect(x, t, 1, 50 - t); }
    if (k === 'near' && x % 9 === 0) { g.fillStyle = '#5f9450'; g.fillRect(x, t + 2, 3, 3); g.fillRect(x + 1, t, 1, 2); } }
  return VHILL[k] = c; }
// 街道地面：後面的草地、人行道、石板路、前面的草邊
let VSTREET = null;
// 斜角鋪面（村子、王都共用）：人行道小菱形磚、路緣石、車道大菱形石板、前面路緣。畫在 g 的 x0～x1，ox 是世界座標的偏移（讓花紋接得起來）
function paveIso(g, x0, x1, ox){ const hash = (a, b) => { const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5; return n - Math.floor(n); };
  const iso = (y0, y1, T, cols, line, o2) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const u = (x + ox + o2) / 2 + y, v = (x + ox + o2) / 2 - y, fu = ((u % T) + T) % T, fv = ((v % T) + T) % T;
    g.fillStyle = fu < 1 || fv < 1 ? line : cols[Math.floor(hash(Math.floor(u / T), Math.floor(v / T)) * cols.length)]; g.fillRect(x, y, 1, 1); } };
  const w = x1 - x0;
  iso(V_BASE, V_ROAD - 2, 6, ['#d8ccb0', '#d2c5a8', '#dcd2b8'], '#b8a888', 0);
  g.fillStyle = '#e6dcc4'; g.fillRect(x0, V_BASE, w, 1);   // 人行道後緣
  g.fillStyle = '#c8bca0'; g.fillRect(x0, V_ROAD - 2, w, 1); g.fillStyle = '#9a8c70'; g.fillRect(x0, V_ROAD - 1, w, 1);   // 路緣石：頂面＋側面（厚度）
  iso(V_ROAD, V_ROAD_B, 10, ['#c4a77a', '#bfa274', '#c9ad82', '#b89a6e'], '#9a7c54', 3);
  speckle(g, x0, V_ROAD, w, V_ROAD_B - V_ROAD, ['#a8895e', '#d2b68a'], w / 3, 7);
  g.fillStyle = '#d2c5a8'; g.fillRect(x0, V_ROAD_B - 1, w, 1); g.fillStyle = '#8a7a5e'; g.fillRect(x0, V_ROAD_B, w, 2); }   // 前面的路緣
function vilStreet(){ if (VSTREET) return VSTREET; const c = document.createElement('canvas'); c.width = VW; c.height = VH; const g = c.getContext('2d');
  // v17.32：斜角版。後面草地、人行道（小菱形磚）、路緣石、車道（大菱形石板）、前面路緣與草地
  g.fillStyle = '#6f9a48'; g.fillRect(0, 92, VW, 26); speckle(g, 0, 92, VW, 26, ['#7eab52', '#5f8a3e'], VW / 2, 11);
  paveIso(g, 0, VW, 0);
  g.fillStyle = '#6f9a48'; g.fillRect(0, V_ROAD_B + 2, VW, VH - V_ROAD_B - 2); speckle(g, 0, V_ROAD_B + 2, VW, VH - V_ROAD_B - 2, ['#7eab52', '#5f8a3e', '#86b65a'], VW / 3, 13);
  return VSTREET = c; }
// ================= v17.7：任務作息 =================
// 委託分成「通勤」（每天回家）和「出差」（在外紮營）；村子裡的事務所任務只在固定時段工作。
// 只改作息和畫面，不改數值；成敗在接任務時就決定好了（preRoll），最後一天收工時當場結算。
const TRIP_N = /跨國|出巡|使節|護送公主/;
const SLOT = { endorse:[9, 14], meet:[13, 17], variety:[9, 14], arena:[9, 14], trial:[8, 18], smith:[10, 15], coach:[9, 14], charity:[13, 17], banquet:[20, 24], patrol:[20, 24] };   // 事務所任務的工作時段（v17.86 開發者指定）
const MSG_TALK = ['praise', 'warn', 'cheer', 'scold', 'heart'];   // 出門在外時還能用的互動（傳訊息）
function mKind(o){
  if (!o) return null;
  if (o.ug) return 'night';   // v17.9：地下委託是夜班
  if (MSPOT[o.ag]) return 'slot';
  if (o.z == null || o.z < 0 || !ZONES[o.z]) return null;
  if (o.boss || o.boss2 || o.ag === 'border' || TRIP_N.test(o.n || '') || o.z >= 2) return 'trip';   // v17.11：王都以後（荒地起）出差
  return 'commute';
}
// 工作的時段 [開始, 結束]
function mWin(o){ const k = mKind(o); if (k === 'night') return [20, 24]; if (k === 'slot') return SLOT[o.ag] || [9, 17]; return k === 'trip' ? [7, 18] : [8, 17.5]; }
const tGoOf = o => o.tGo ?? (missionTGo(H(), o) || 1);
// 現在是哪一段：prep 準備出門／go 出發／work 工作／back 收工回村／home 晚上在村子／camp 營地／slot 時段中／free 時段外
function mPhase(h){
  const o = h.mission; if (h.act !== 'mission' || !o) return null;
  const k = mKind(o), hr = hourOf(), d = o.days || 1, first = h.actDays >= d;
  if (k === 'slot') {
    const s = SLOT[o.ag]; return !s || (hr >= s[0] - .5 && hr < s[1]) ? 'slot' : 'free';
  }
  if (k === 'night') return hr < 19.75 || hr >= 24 ? 'free' : hr < 20 ? 'nout' : 'nwork';
  if (k === 'commute') return hr < 7 ? 'prep' : hr < 8 ? 'go' : hr < 17.5 ? 'work' : hr < 18.5 ? 'back' : 'home';
  if (k === 'trip') return hr < 7 ? (first ? 'prep' : 'camp') : hr < 18 ? 'work' : 'camp';
  return null;
}
const mHome = h => ['prep', 'back', 'home', 'free'].includes(mPhase(h));   // 人在村子裡
// 進度：只在工作時段推進
function mFrac(h){
  const o = h.mission, d = Math.max(1, o.days || 1), [ws, we] = mWin(o), done = d - Math.max(1, h.actDays);
  if (o.hours) { const dl = we - ws, today = clamp(hourOf() - ws, 0, h.actDays <= 1 ? o.endH - ws : dl); return clamp((done * dl + today) / o.hours, 0, 1); }   // v17.8
  const today = mKind(o) ? clamp((hourOf() - ws) / (we - ws), 0, 1) : S.t / DAY_SEC;
  return clamp((done + today) / d, 0, 1);
}
const fmtH = x => { const m = Math.round(x * 60); return `${Math.floor(m / 60) % 24}:${String(m % 60).padStart(2, '0')}`; };
// 營地：在任務區域的角落
function campPos(z){ const [x0, y0, x1, y1] = ZONES[z].rect; return [x0 + 16 + (x1 - x0) * .08, y1 - 14]; }
function drawCamp(now, view){
  try {
    const h = H(); if (mPhase(h) !== 'camp') return; const z = h.mission.z; if (ZONES[z].map !== view) return;
    const [cx, cy] = campPos(z), hr = hourOf(), m = hr >= 18.5 || hr < 7 ? 'night' : 'day';
    drawBld(ctx, 'tent', cx - 20, cy - 20, 24, 20, m);
    drawBld(ctx, Math.floor(now / 180) % 2 ? 'fire' : 'fire2', cx + 2, cy - 9, 10, 10, 'night');   // 火焰一律用亮的顏色
  } catch (e) { if (!scnErr++) console.error(e); }
}
// 營地的晚上：勇者傳來一句話（只是聊天，不影響數值）
function campLine(h){
  const o = h.mission, cn = o && o.comp && npc(o.comp), L0 = ['今天就到這裡，生火紮營了', '野外的星星好多', '明天再拚一下', '睡袋好硬……', `${ZONES[o.z].n}的晚上好冷`];
  if (h.married) L0.push(h.child ? `${h.child.name}睡了嗎？好想回家` : '不知道家裡還好嗎……');
  if (cn) L0.push(`${cn.name}在烤肉，聞起來好香`, `跟${cn.name}聊到半夜，${cn.name}其實人很好`);
  if (o.win === 0) L0.push('……這次好像有點難', '今天被打得好慘');
  return pickS(L0);
}
// 作息造型：帳篷、營火（火焰用窗戶色，晚上會亮）
Object.assign(BLD_ART, {
  tent(P){ const { W, H } = P; P.poly([[1, H - 1], [Math.round(W / 2), 1], [W - 2, H - 1]], '#c8a060'); P.poly([[Math.round(W / 2), 1], [W - 2, H - 1], [Math.round(W / 2) + 3, H - 1]], '#a8803a');
    P.poly([[Math.round(W / 2) - 4, H - 1], [Math.round(W / 2), H - 9], [Math.round(W / 2) + 4, H - 1]], '#3a2a1e'); P.rect(Math.round(W / 2), 0, Math.round(W / 2), 1, '#5a4a3a'); },
  fire(P){ const { W, H } = P; P.rect(1, H - 3, W - 2, H - 2, '#6a4428'); P.line(1, H - 1, W - 2, H - 4, '#5a3a22'); P.poly([[2, H - 3], [W / 2, 1], [W - 3, H - 3]], 'W'); P.poly([[W / 2 - 2, H - 3], [W / 2, 4], [W / 2 + 2, H - 3]], 'Wh'); },
  fire2(P){ const { W, H } = P; P.rect(1, H - 3, W - 2, H - 2, '#6a4428'); P.line(1, H - 4, W - 2, H - 1, '#5a3a22'); P.poly([[3, H - 3], [W / 2 - 1, 2], [W - 2, H - 3]], 'W'); P.poly([[W / 2 - 2, H - 3], [W / 2 + 1, 5], [W / 2 + 2, H - 3]], 'Wh'); },
});
// ================= v17.8：任務長短依戰力比 =================
// 委託上寫的天數是「標準天數」（戰力比 1.3 時要做多久）。越強做得越快（最快 1/6），越弱做得越久（最多 1.3 倍）。
// 以工作時數計算，接任務那一刻就決定好；可能第二天中午就收工。只看得出實力的演法才縮短：
const DUR_W = { slay:1, boss:1, rescue:.5, search:.15, probe:.15, escort:0, guard:0 };
const dayLen = o => { const w = mWin(o); return w[1] - w[0]; };
function durInfo(h, o){
  const k = mKind(o); if (!k || k === 'slot' || k === 'night' || !o.D || o.ag === 'exam') return null;   // 事務所時段任務、升格考核不縮短
  const base = o.baseDays || o.days || 1, dl = dayLen(o), w = DUR_W[scnType(o)] ?? 1;
  const r = ratio(h, o.D) * compMul(o.comp), sp = clamp(r / 1.3, 1 / 1.3, 6);
  const cap = o.z <= 1 ? 3 * dl : Infinity;   // v17.88 開發者：草原、森林的任務最多 3 個月
  const hours = Math.min(cap, Math.max(2, base * dl * (w / sp + 1 - w))), extra = 0, days = Math.max(1, Math.ceil(hours / dl - 1e-6));   // v17.13：路上的時間不算進任務
  return { base, hours, days, extra, endH:mWin(o)[0] + (hours + extra - (days - 1) * dl) };
}
function mDur(h){ const o = h.mission; if (o && o.tGo == null) o.tGo = missionTGo(h, o); if (!o || o.hours != null) return; const d = durInfo(h, o); if (!d) return;
  o.baseDays = d.base; o.hours = d.hours; o.days = d.days; o.endH = d.endH; o.extra = d.extra; h.actDays = d.days; }
const mEnd = o => o.endH ?? mWin(o)[1];
const estDays = (h, it) => { const d = it.kind === 'rest' ? null : durInfo(h, it); return d ? d.days : it.days || 1; };
const durNum = (h, o) => { const d = o.hours != null ? { hours:o.hours } : durInfo(h, o); return d ? Math.round(d.hours / dayLen(o) * 10) / 10 : o.days || 1; };
function durTxt(h, it){ if (it.kind === 'rest') return '1 個月'; const d = durInfo(h, it); if (!d) return `${it.days || 1} 個月`; const x = Math.round(d.hours / dayLen(it) * 10) / 10; return Math.abs(x - d.base) < .05 ? `${d.base} 個月` : `約 ${x} 個月`; }
// 狀態列文字（任務期間不在工作時）
function mTxt(h){ const o = h.mission, ph = mPhase(h), hr = hourOf(), w = mWin(o);
  if (o.ug) return { free:hr >= 22.5 ? '在家睡覺' : '晚上 20:00 有一件不能說的工作', nout:'天黑了，悄悄出門', nwork:'（不能說的工作）' }[ph] || '';
  return { prep:'準備出門（7:00 出發）', go:`出發去「${o.n}」`, back:'收工回家中', home:hr >= 22.5 ? '在家睡覺' : '收工了，晚上在村子裡放鬆',
    camp:hr >= 22.5 || hr < 6.5 ? '在帳篷裡睡覺' : '在營地休息', free:hr >= 22.5 ? '在家睡覺' : hr < w[0] ? `${fmtH(w[0])} 要去「${o.n}」` : '今天的工作結束了' }[ph] || ''; }
// ================= v17.9：結果揭曉、武鬥大會、地下夜班、升格考核、村民請託 =================
let RES = null;   // 地圖中間的結果橫幅
// 小人（觀眾、擡擔架的村民、考官）
const PXP = {};
function pxPerson(x, y, c, k, now){ const key = c + '|' + k, p = PXP[key] || (PXP[key] = { seed:'px' + key, name:'', sex:k % 2 ? 'f' : 'm', age:[28, 40, 22, 55][k % 4], _cloth:c }); drawSprite(ctx, p, x, y, false, now + k * 300, { moving:false, left:k % 2 === 1, scale:1, noEmo:true }); }
function pxSay(x, y, t){ ctx.font = fz(8) + 'px Cubic11, sans-serif'; const w = ctx.measureText(t).width + 6; ctx.fillStyle = '#f1ece0'; ctx.fillRect(x - w / 2, y - 9, w, 10); ctx.fillStyle = '#161b27'; ctx.fillText(t, x - w / 2 + 3, y - 1); }
// 結算外面包一層：記下前後的差別做成橫幅；勇者的感想留到晚上才說；決定要不要村口迎接、擡擔架
function resolveMission(){
  const h = H(), o = h.mission || {}, g0 = S.gold, f0 = S.fame, lv0 = h.lv, live = !offline, k = mKind(o);
  if (live) SAYQ = [];
  try { resolveMission0(); } finally { const q = SAYQ; SAYQ = null; if (live && q && q.length) S.evening = { day:S.day, lines:q.slice(0, 3), at:19 }; }
  if (!live || H() !== h) return;
  const ok = o.win != null ? !!o.win : S.fame >= f0, hurt = h.bedDays > 0 || h.act === 'bed';
  RES = { t:performance.now(), ok, n:o.n || '', gold:S.gold - g0, fame:S.fame - f0, lv:h.lv > lv0, hurt };
  h.retT = S.day;
  const away = k === 'commute' || k === 'trip';
  if (ok && away) { const fan = S.npcs.find(n => n.role === 'fan' && n.alive) || S.npcs.filter(n => n.alive && !n.dark && n.aff >= 50).sort((a, b) => b.aff - a.aff)[0]; if (fan) S.welcome = { id:fan.id, day:S.day }; }
  else if (!ok && hurt && away) S.carry = { day:S.day };
}
function drawResBanner(now){
  try {
    if (!RES) return; const k = (now - RES.t) / 4200; if (k > 1) { RES = null; return; }
    const a = k < .08 ? k / .08 : k > .8 ? (1 - k) / .2 : 1, w = 236, x = 180 - w / 2, y = SH * .3;
    ctx.globalAlpha = a; ctx.fillStyle = 'rgba(16,20,30,.88)'; ctx.fillRect(x, y, w, 52); ctx.fillStyle = RES.ok ? '#f2c14e' : '#ff7b7b'; ctx.fillRect(x, y, w, 3);
    ctx.font = '15px Cubic11, sans-serif'; const t1 = RES.mini ? '今天收工' : RES.ok ? '委託完成！' : '委託失敗……'; ctx.fillText(t1, 180 - ctx.measureText(t1).width / 2, y + 21);
    ctx.font = '11px Cubic11, sans-serif'; ctx.fillStyle = '#f1ece0'; const t2 = RES.mini ? `${RES.n} · 打倒 ${RES.kills} 隻` : RES.n.length > 18 ? RES.n.slice(0, 17) + '…' : RES.n; ctx.fillText(t2, 180 - ctx.measureText(t2).width / 2, y + 35);
    const t3 = RES.mini ? `今天賺了 ${fmt(RES.earn)} 金` : RES.ok ? `事務所 ${RES.gold >= 0 ? '+' : ''}${fmt(RES.gold)} 金 · 名聲 ${RES.fame >= 0 ? '+' : ''}${RES.fame}${RES.lv ? ' · 升級了！' : ''}` : `名聲 ${RES.fame >= 0 ? '+' : ''}${RES.fame}${RES.hurt ? ' · 受傷了' : ''}`;
    ctx.fillStyle = '#a3abbd'; ctx.fillText(t3, 180 - ctx.measureText(t3).width / 2, y + 48); ctx.globalAlpha = 1;
  } catch (e) { if (!scnErr++) console.error(e); }
}
// 擡擔架：失敗受傷的那天，從村口擡到診所
const vCarry = () => !!(S.carry && S.carry.day === S.day && !S.carry.done && heroMap(H()) === 'vil');
function drawCarry(now, x, y){ ctx.fillStyle = '#8a5a3a'; ctx.fillRect(x - 16, y - 3, 32, 2); pxPerson(x - 15, y + 4, '#5a8a5a', 1, now); pxPerson(x + 15, y + 4, '#3f6ea0', 2, now); }
// 狀態列的進度
function scnCnt(){ const s = SCN; if (!s) return ''; const pct = v => Math.round(clamp(v, 0, 1) * 100) + '%';
  if (s.t === 'search' || s.t === 'probe') return `找到 ${s.found}/${s.pts.length}`;
  if (s.t === 'boss') return `${s.elite ? '精英' + ZONES[s.z].mon : '魔王'}剩 ${pct(s.bossHp)}`;
  if (s.t === 'escort') return `路程 ${pct(Math.min(s.f || 0, H().mission && H().mission.win === 0 ? .75 : 1))}`;
  return `${s.only ? MON_FULL[+s.only[1]]['acbd'.indexOf(s.only[2])] : s.trash ? '打倒' : ZONES[s.z].mon} ${s.kills}/${s.total}`; }
// ---- 武鬥大會：先把整個賽程算好，再在鬥技場一場一場演，打完才公布 ----
const TRN = ['八強', '四強', '決賽'];
function tourPlan(st){
  const h = H(), P = power(h);
  const ppl = [{ n:h.name, me:1, P }];
  [['rival', 0], ['rival2', 1]].forEach(([id, i]) => { const n = npc(id); if (n && n.alive) ppl.push({ n:n.name, ag:S.rivals[i].n, ai:i, P:P * rand(.85, 1.2) * clamp(1 + (S.rivals[i].fame - S.fame) / 2500, .85, 1.2) }); });
  const pool = [...TOUR_NAMES].sort(() => Math.random() - .5);
  while (ppl.length < 8) ppl.push({ n:pool.pop(), P:P * rand(.55, 1.15) });
  let round = ppl.sort(() => Math.random() - .5), place = 0, hurt = null; const log = [], my = [], m = [.9, 1, 1.15][st];
  for (let r = 0; r < 3; r++) { const next = [];
    for (let i = 0; i < round.length; i += 2) { const a = round[i], b = round[i + 1];
      if (a.me || b.me) { const o = a.me ? b : a, win = chance(clamp(.5 + (P * m - o.P) / (P * m + o.P) * 1.8, .05, .95));
        log.push(`${TRN[r]}：對上${o.ag ? o.ag + '的' : ''}${o.n}——${win ? '<b class="dg g">勝</b>' : '<b class="dg r">敗</b>'}`); my.push({ r, n:o.n, ag:o.ag || '', win });
        if (win) { next.push(a.me ? a : b); place = r + 1; if (!hurt && chance([0, .05, .15][st])) hurt = ['light', '比賽時挨了幾下重擊']; }
        else { next.push(o); if (chance([.2, .4, .7][st])) hurt = [chance([0, .3, .6][st]) ? 'heavy' : 'light', `在武鬥大會${TRN[r]}被${o.n}打傷`]; } }
      else next.push(chance(a.P / (a.P + b.P)) ? a : b); }
    round = next; }
  const c = round[0]; return { st, log, my, place, hurt, champ:{ n:c.n, ag:c.ag || '', ai:c.ai ?? null, me:!!c.me } };
}
function tourStart(st){ const h = H(), hr = hourOf();
  if (offline || hr >= 15 || busyAway(h) || h.act === 'mission') { runTour(st); return; }   // 來不及演就照舊直接算
  S.tourShow = { day:S.day, pl:tourPlan(st), said:0, start:Math.max(10, Math.ceil(hr + .5)) };
  if (h.act === 'hunt') goHome();
  sys(`武鬥大會 ${fmtH(S.tourShow.start)} 開打，地點在村子的鬥技場`); }
const tR = k => S.tourShow.start + k * 2.5;   // 第 k 場開始的時間，每場 2 小時
function tourRound(){ const T = S.tourShow; if (!T || T.day !== S.day) return -1; const hr = hourOf(); if (hr < T.start - .5 || hr >= T.start + 7) return -1; return clamp(Math.floor((hr - T.start) / 2.5), 0, 2); }
function tourTick(hr){ const T = S.tourShow; if (!T) return;
  if (T.day !== S.day || offline) { tourApply(T.pl); return; }
  while (T.said < T.pl.my.length && hr >= tR(T.said) + 2) { const mm = T.pl.my[T.said]; T.said++;
    if (mm.win && mm.r < 2) say(mm.ag ? pickS([`贏了${mm.n}！${mm.ag}的人臉都綠了`, `終於贏了${mm.n}一次`]) : L('tWin')); else if (!mm.win) say(L('tLose')); }
  if (hr >= T.start + 7) { tourApply(T.pl); save(); renderAll(); } }
function tourTxt(){ const T = S.tourShow, k = tourRound(), hr = hourOf(), mm = T.pl.my[k];
  if (hr < T.start) return `武鬥大會 ${fmtH(T.start)} 開打，在鬥技場準備`;
  if (!mm) return `武鬥大會${TRN[k]}（${H().name}在場邊觀戰）`;
  if (hr < tR(k) + 2) return `武鬥大會${TRN[k]}：對上${mm.ag ? mm.ag + '的' : ''}${mm.n}`;
  return `武鬥大會${TRN[k]}：${mm.win ? '贏了！' : '輸了……'}`; }
function drawTourShow(now){
  try {
    const k = tourRound(); if (k < 0) return; const T = S.tourShow, bx = VD.arena, hr = hourOf(), mm = T.pl.my[k], cols = ['#c0563f', '#3f6ea0', '#5a9a5a', '#c87aa0', '#d8a02e', '#7a6ac0'];
    arenaShow(now, 'tour');   // v17.49：彩旗、大旗、觀眾、對手（Kenney 路人）
    nameTag(ctx, '武鬥大會・' + TRN[k], bx, 52, 'hero');
    if (mm && hr >= tR(k) + 2) pxSay(V.x ?? bx, 112, mm.win ? '勝！' : '敗……');
  } catch (e) { if (!scnErr++) console.error(e); }
}
// ================= v17.49：鬥技場（任務對打、武鬥大會、特訓）：Kenney 路人小人（ART.room）＋野外那套打法 =================
// 勇者站在鬥技場門口（V.x），對手在右邊 36；觀眾：人行道一排（V_ROAD - 2）、路下方一排（V_ROAD_B + 14），輪流跳一下歡呼
const TINT = new Map();
function tintRoom(n, kind){ const key = n + '|' + kind; let cv = TINT.get(key); if (cv) return cv; const src = rideCanvas(n, 'room'); cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height;
  const g = cv.getContext('2d'); g.drawImage(src, 0, 0); const d = g.getImageData(0, 0, cv.width, cv.height), p = d.data;
  for (let i = 0; i < p.length; i += 4) { if (!p[i + 3] || (p[i] === 63 && p[i + 1] === 38 && p[i + 2] === 49)) continue;
    if (kind === 'white') p[i] = p[i + 1] = p[i + 2] = 255; else { p[i] = Math.round(p[i] * .55 + 115); p[i + 1] = Math.round(p[i + 1] * .55 + 33); p[i + 2] = Math.round(p[i + 2] * .55 + 33); } }
  g.putImageData(d, 0, 0); TINT.set(key, cv); return cv; }
// 路人小人：腳底中心在 (x, y)；flip＝面向左；hop＝往上跳幾格
function rPerson(n, x, y, flip, tint, hop){ if (!ART.room || !ART.room[n]) return; const cv = tint ? tintRoom(n, tint) : rideCanvas(n, 'room'), X = Math.round(x), Y = Math.round(y), top = Y - cv.height - (hop || 0);
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(X, Y, 5, 1.6, 0, 0, 7); ctx.fill();
  if (flip) { ctx.save(); ctx.translate(X, 0); ctx.scale(-1, 1); ctx.drawImage(cv, -Math.floor(cv.width / 2), top); ctx.restore(); } else ctx.drawImage(cv, X - Math.floor(cv.width / 2), top); }
// 現在勇者是不是在鬥技場打（走到了才算）
function arenaMode(h){ if (heroMap(h) !== 'vil' || V.inside || V.mv || V.x == null) return null;
  const k = tourRound(); if (k >= 0) { const hr = hourOf(), mm = S.tourShow.pl.my[k]; return { kind:'tour', fight:!!mm && hr >= tR(k) && hr < tR(k) + 2 }; }
  if (h.act === 'train' || lzAt(h, 'train')) return { kind:'train', fight:true };
  if (h.act === 'mission' && h.mission && ['arena', 'coach', 'smith'].includes(h.mission.ag) && mPhase(h) === 'slot') return { kind:h.mission.ag, fight:true };
  return null; }
// 一回合：對打 1.2 秒、特訓 1 秒；r＝第幾回合（單數回合對手回擊）
function arenaRound(now, kind){ const P = kind === 'train' ? 1000 : 1200, t0 = now - now % P; return { t0, p:(now - t0) / 1000, r:Math.floor(now / P) }; }
function arenaStar(x, y){ ctx.fillStyle = '#fff6a0'; ctx.fillRect(x - 3, y, 7, 1); ctx.fillRect(x, y - 3, 1, 7); }
// 被打的一方：命中閃白、往後退；回擊時往前衝
function arenaFoe(now, n, x, y, R, counter){ let tint = null, dx = 0; const p = R.p;
  if (p > .3 && p < .52) { tint = p < .42 ? 'white' : null; dx = 2; }
  if (counter && p > .65 && p < .95) dx = p < .8 ? -4 : -2;
  rPerson(n, x + dx, y, true, tint); if (p > .3 && p < .42) arenaStar(x - 7, y - 10); }
function arenaCrowd(now, cx, rows){ rows.forEach(([y, xs], r) => xs.forEach((dx, i) => { const k = Math.floor(now / 200 + i * 1.7 + r) % 6; rPerson('cw' + ((i + r * 3) % 5), cx + dx, y, dx > 0, null, k === 0 ? 2 : k === 1 ? 1 : 0); })); }
function arenaShow(now, kind){
  try { const h = H(), am = arenaMode(h), hx = V.x ?? VD.arena, cx = (am ? hx : VD.arena) + 18, y = V_WALK, B = V_ROAD - 2, F = V_ROAD_B + 14;
    if (kind === 'tour') {   // 彩旗串＋兩支大旗
      const cl = ['#e84537', '#f7c94a', '#43a0dc', '#43e1b3'];
      ctx.fillStyle = '#3f2631'; ctx.fillRect(cx - 126, 86, 252, 1);
      for (let i = 0; i < 27; i++) { const x = cx - 126 + i * 9.6, yy = 86 - Math.round(Math.sin(i / 26 * Math.PI) * 6) + (i % 2); ctx.fillStyle = '#3f2631'; ctx.beginPath(); ctx.moveTo(x - 1, yy); ctx.lineTo(x + 7, yy); ctx.lineTo(x + 3, yy + 6); ctx.fill(); ctx.fillStyle = cl[i % 4]; ctx.beginPath(); ctx.moveTo(x, yy + .5); ctx.lineTo(x + 6, yy + .5); ctx.lineTo(x + 3, yy + 4.5); ctx.fill(); }
      for (const fx of [cx - 70, cx + 70]) { ctx.fillStyle = '#3f2631'; ctx.fillRect(fx, 70, 2, 46); ctx.beginPath(); ctx.moveTo(fx + 2, 69); ctx.lineTo(fx + 17, 74); ctx.lineTo(fx + 2, 81); ctx.fill(); ctx.fillStyle = '#e84537'; ctx.beginPath(); ctx.moveTo(fx + 3, 71); ctx.lineTo(fx + 14, 74); ctx.lineTo(fx + 3, 79); ctx.fill(); }
      arenaCrowd(now, cx, [[B, [-68, -56, -44, -32, 32, 44, 56, 68]]]);
      const k = tourRound(), hr = hourOf(), fight = hr >= tR(k) && hr < tR(k) + 2, mm = S.tourShow.pl.my[k];
      if (fight && mm && am) arenaFoe(now, ['foe_viking', 'foe_knight', 'foe_archer'][k % 3], hx + 36, y, arenaRound(now, 'tour'), arenaRound(now, 'tour').r % 2);
      else if (fight && !mm) { const R = arenaRound(now, 'tour'); rPerson('foe_knight', cx - 18 + (R.p > .1 && R.p < .38 ? 3 : 0), y, false); arenaFoe(now, 'foe_archer', cx + 18, y, R, R.r % 2); }   // 別人的比賽
      arenaCrowd(now, cx, [[F, [-90, -76, -62, -48, -34, -20, 20, 34, 48, 62, 76, 90]]]); return; }
    if (!am) return;
    if (kind === 'arena') { arenaCrowd(now, cx, [[B, [-44, -32, 32, 44]]]); arenaFoe(now, 'foe_viking', hx + 36, y, arenaRound(now, 'arena'), arenaRound(now, 'arena').r % 2); arenaCrowd(now, cx, [[F, [-60, -46, -32, -18, 18, 32, 46, 60]]]); return; }
    if (kind === 'train' || kind === 'coach') { const R = arenaRound(now, 'train'), p = R.p, dx = hx + 24, tilt = p > .3 && p < .55 ? (p < .42 ? 8 : 4) : 0, cv = rideCanvas('dummy', 'room');   // 稻草人被打到會晃、掉稻草
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(dx, y + 1, 7, 2, 0, 0, 7); ctx.fill();
      ctx.save(); ctx.translate(dx, y + 1); ctx.rotate(tilt * Math.PI / 180); ctx.drawImage(cv, -Math.floor(cv.width / 2), -cv.height); ctx.restore();
      if (p > .3 && p < .45) { const k = (p - .3) / .15; ctx.fillStyle = '#eac46e'; for (let i = 0; i < 4; i++) ctx.fillRect(Math.round(dx + 2 + i * 2 + k * 4), Math.round(y - 16 - i + k * (i - 1) * 3), 1, 1); }
      if (kind === 'coach') { [44, 58, 72].forEach((dx, i) => { const x = hx + dx, sw = Math.floor(now / 500 + i) % 2;   // v17.90：新人在稻草人另一邊拿木劍跟著揮
          rPerson('cw' + (i + 1), x, y + 4, true, null, sw); pR2(x - 7, y - 13 - sw * 2, 2, 8, '#d6aa6e'); pR2(x - 7, y - 5 - sw * 2, 2, 2, '#763b36'); });
        if (Math.floor(now / 3000) % 2 === 0) emoAt('認真', hx, y - 22, now % 3000); arenaCrowd(now, cx, [[F, [-30, 40, 54]]]); return; }
      const kx = hx + 52; rPerson('coach', kx, y - 2, true);   // 教練站旁邊，偶爾說「好！」
      if (Math.floor(now / 2000) % 2 === 0) pxSay(kx, y - 24, '好！');
      arenaCrowd(now, cx, [[F, [-38, -24, 46]]]); }
  } catch (e) { if (!scnErr++) console.error(e); }
}
// v17.90：鐵匠鋪試刀：門口的稻草木樁被砍到會晃、掉稻草；老陳在旁邊看，路人圍觀
function smithShow(now){ const h = H(), am = arenaMode(h); if (!am || am.kind !== 'smith') return; const hx = V.x, y = V_WALK, R = arenaRound(now, 'smith'), p = R.p, px = hx + 22, tilt = p > .3 && p < .55 ? (p < .42 ? 8 : 4) : 0;
  ctx.save(); ctx.translate(px, y + 1); ctx.rotate(tilt * Math.PI / 180); pR2(-2, -22, 5, 22, '#3f2631'); pR2(-1, -21, 3, 21, '#8a5a3a'); pR2(-4, -19, 9, 12, '#3f2631'); pR2(-3, -18, 7, 10, '#e2c46e'); pR2(-3, -14, 7, 1, '#a07a3a'); pR2(-3, -11, 7, 1, '#a07a3a'); ctx.restore();
  if (p > .3 && p < .45) { const k = (p - .3) / .15; for (let i = 0; i < 4; i++) pR2(Math.round(px + 2 + i * 2 + k * 4), Math.round(y - 16 - i + k * (i - 1) * 3), 1, 1, '#eac46e'); }
  const sm = npc('chen'); if (sm && sm.alive) { drawSprite(ctx, sm, hx + 44, y, false, now, { moving:false, left:true, noEmo:true }); if (Math.floor(now / 2400) % 2 === 0) emoAt('開心', hx + 44, y - 22, now % 2400); }
  plazaCrowd(now, hx, [-44, -30, 64], V_ROAD_B + 12, '驚訝'); }
// ================= v17.51：廣場（代言、綜藝、見粉絲）：Kenney 路人小人＋勇者大頭貼看板 =================
// 勇者站在廣場門口前的路上（V.x、V_WALK）；觀眾在路下方一排（V_ROAD_B + 12），輪流跳一下
function plazaMode(h){ if (heroMap(h) !== 'vil' || V.inside || V.mv || V.x == null) return null;
  if (h.act === 'strike' || h.act === 'side') return h.act;   // v17.53：罷工（事務所門口）、接外快（廣場邊擺攤）
  return h.act === 'mission' && h.mission && ['endorse', 'variety', 'meet', 'charity'].includes(h.mission.ag) && mPhase(h) === 'slot' ? h.mission.ag : null; }
// 勇者的姿勢：代言每 1.2 秒換一個（右、左、比讚）；綜藝每 2 秒轉圈＋跳；見粉絲面向右，握手、遞簽名
function plazaPose(h, now){ const k = plazaMode(h); if (!k) return null;
  if (k === 'strike') return { left:false, expr:'angry', hop:Math.floor(now / 500) % 2, hand:(x, y) => { const cv = rideCanvas('placard', 'room'); ctx.drawImage(cv, x - 6, y - 38 - (now % 1000 < 500 ? 3 : 0));   // 舉抗議牌一上一下、跺腳、頭上生氣
    if (Math.floor(now / 1500) % 2 === 0) emoAt('生氣', x - 10, y - 16, now % 1500); } };
  if (k === 'side' || k === 'charity') return { left:false, hop:5, hand:(x, y) => { const cv = rideCanvas('stall', 'room'); ctx.drawImage(cv, x - Math.floor(cv.width / 2), y + 4 - cv.height); } };   // 站在攤子後面露出上半身
  if (k === 'endorse') { const pose = Math.floor(now / 1200) % 3, p = now % 1200;
    return { left:pose === 1, hop:p < 120 ? 2 : 0, hand:pose === 2 ? (x, y) => { pR2(x + 7, y - 18, 2, 5, '#f7c282'); pR2(x + 7, y - 19, 1, 1, '#3f2631'); } : null }; }
  if (k === 'variety') { const p = (now % 2000) / 1000; return { left:p < .5 && Math.floor(p / .12) % 2 === 1, hop:p >= .5 && p < .8 ? [0, 3, 5, 5, 3, 0][Math.min(5, Math.floor((p - .5) / .05))] : 0 }; }
  const p = (now % 1800) / 1800;
  return { left:false, hop:0, hand:p > .4 && p < .8 ? (x, y) => { pR2(x + 7, y - 8, 3, 2, '#f7c282'); pR2(x + 9, y - 15, 6, 6, '#3f2631'); pR2(x + 10, y - 14, 4, 4, '#ffffff'); pR2(x + 10, y - 12, 3, 1, '#3f2631'); } : null }; }
const pR2 = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
function plazaCrowd(now, cx, xs, y, emo){ xs.forEach((dx, i) => { const x = cx + dx, k = Math.floor(now / 200 + i * 1.7) % 6; rPerson('cw' + (i % 5), x, y, dx > 0, null, k === 0 ? 2 : k === 1 ? 1 : 0);
  if (emo && (Math.floor(now / 900) + i * 2) % 7 === 0) emoAt(emo, x + 2, y - 17, now % 900); }); }
function plazaShow(now, ag){
  try { const h = H(), k = plazaMode(h); if (k !== ag) return; const hx = V.x, y = V_WALK, F = V_ROAD_B + 12;
    if (ag === 'strike') { const q = (now / 3600) % 1; let px = hx - 80 + q * 160; if (Math.abs(px - hx) < 22) px = px < hx ? hx - 22 : hx + 22; rPerson('cw2', px, y + 6, px > hx); return; }   // 路人經過，繞開勇者
    if (ag === 'charity') { pR2(hx - 23, y - 46, 2, 22, '#8a5a3a'); pR2(hx + 21, y - 46, 2, 22, '#8a5a3a'); pR2(hx - 21, y - 46, 42, 11, '#3f2631'); pR2(hx - 20, y - 45, 40, 9, '#f4eee0');   // v17.90：白底紅心布條、捐款罐
      [[-2, 0], [-1, 0], [1, 0], [2, 0], [-3, 1], [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1], [3, 1], [-2, 2], [-1, 2], [0, 2], [1, 2], [2, 2], [-1, 3], [0, 3], [1, 3], [0, 4]].forEach(([a, b]) => pR2(hx + a, y - 44 + b, 1, 1, '#e84537'));
      pR2(hx + 13, y - 19, 6, 7, '#3f2631'); pR2(hx + 14, y - 18, 4, 5, '#aad2e6'); pR2(hx + 15, y - 15, 2, 2, '#f7c94a'); }
    if (ag === 'side' || ag === 'charity') { const P = 2400, n = Math.floor(now / P), p = (now % P) / P, cx = p < .35 ? hx + 66 - p / .35 * 34 : p < .7 ? hx + 32 : hx + 32 + (p - .7) / .3 * 50;   // 客人走過來買、投幣、走開
      rPerson('cw' + n % 5, cx, y + 2, p < .7);
      if (p > .4 && p < .6) { const t = (p - .4) / .2, X = Math.round(cx - 10 - t * 6), Y = Math.round(y - 20 - Math.sin(t * Math.PI) * 6); pR2(X - 1, Y - 1, 5, 5, '#3f2631'); pR2(X, Y, 3, 3, '#f7c94a'); }
      if (ag === 'charity' && p > .6 && p < .9) emoAt('戀愛', cx + 2, y - 18, (p - .6) * 3000);
      return; }
    if (ag === 'endorse') { const bx = hx + 28, cv = rideCanvas('billboard', 'room'), L = Math.round(bx - cv.width / 2), T = V_ROAD - 3 - cv.height;   // 看板在人行道，海報貼勇者當下的大頭貼
      ctx.drawImage(cv, L, T); ctx.drawImage(kenCanvas(h, 'idle', 0, 'happy'), KEN_OX, KEN_OY + 1, 16, 15, L + 11, T + 10, 16, 15);
      const cx = hx - 52; rPerson('cam_man', cx, y + 6, false);   // 攝影師：每次換姿勢閃一下
      if (now % 1200 < 150) { const fx = cx + 8, fy = y - 5; ctx.fillStyle = '#ffffff'; ctx.fillRect(fx - 1, fy - 1, 3, 3); ctx.fillRect(fx - 5, fy, 11, 1); ctx.fillRect(fx, fy - 5, 1, 11); }
      plazaCrowd(now, hx - 30, [-70, -56, -42, 52, 66, 80], F); return; }
    if (ag === 'variety') { rPerson('host', hx + 24, y, true); plazaCrowd(now, hx - 4, [-66, -52, -38, -24, 30, 44, 58, 72], F, '開心'); return; }
    // 見粉絲：右邊排隊，排第一的走上前；見完的往前（畫面下方）走開、冒愛心
    nameTag(ctx, '粉絲見面會', hx + 8, 66, 'hero');
    const P = 1800, n = Math.floor(now / P), p = (now % P) / P;
    if (p < .6) { const lx = hx + 18 + p * 4, ly = y + p * 30; rPerson('cw' + ((n + 4) % 5), lx, ly, true); ctx.globalAlpha = 1 - p / .6; emoAt('戀愛', lx + 2, ly - 17 - p * 8, 600); ctx.globalAlpha = 1; }
    for (let i = 5; i >= 0; i--) rPerson('cw' + ((n + i) % 5), hx + 18 + i * 13 + 13 * (1 - Math.min(1, p / .34)), y, true);
  } catch (e) { if (!scnErr++) console.error(e); }
}
// 村口迎接、晚上來道謝的村民
function drawVilGuests(now){
  try {
    const hr = hourOf(), h = H();
    const w = S.welcome && S.welcome.day === S.day && hr < 20 ? npc(S.welcome.id) : null;
    if (w && w.alive) { const x = VD.gate + 20; drawSprite(ctx, w, x, 146, false, now, { moving:false, left:true }); if (heroMap(h) === 'vil' && V.x != null && Math.abs(V.x - x) < 50) pxSay(x, 112, '歡迎回來！'); }
    const t = S.thank && S.thank.day === S.day && hr >= 18.5 && hr < 22 ? npc(S.thank.id) : null;
    if (t && t.alive) { const x = VD.home + 18; drawSprite(ctx, t, x, 140, false, now, { moving:false, left:true }); pxSay(x, 106, '謝謝你！'); }
    lzGuest(now); patrolDraw(now); chaseDraw(now);
  } catch (e) { if (!scnErr++) console.error(e); }
}
const guestIds = () => { const hr = hourOf(), a = EPC ? [EPC.npc] : []; if (S.welcome && S.welcome.day === S.day && hr < 20) a.push(S.welcome.id); if (S.thank && S.thank.day === S.day && hr >= 18.5 && hr < 22) a.push(S.thank.id); { const z = lzOn(H()); if (z && (z.k === 'chat' || z.k === 'date') && z.id) a.push(z.id); } { const m = H().mission; if (m && m.ag === 'smith' && H().act === 'mission' && mPhase(H()) === 'slot') a.push('chen'); } if (CH && CH.vic) a.push(CH.vic); return a; };

// 武鬥大會打完才公布（內容和原本的 runTour 後半段一樣）
function tourApply(pl){
  const h = H(), y = curY(), place = pl.place, hurt = pl.hurt, champ = pl.champ, log = pl.log; S.tour = null; S.tourShow = null;
  if (hurt) { injure(hurt[0], hurt[1]); if (hurt[0] === 'light') setAct('rest'); }
  const rk = 1 + rkx() * .3, fame = Math.round([5, 15, 35, 80][place] * rk);
  addFame(fame); yr().tour = place;
  if (place === 3) { const g = 600 + rkx() * 400; TOUR_G = g; S.gold += g; h.wallet += Math.round(g * .2); adj('mood', 30); adj('trust', 8); remember('champ'); logLife(`第 ${y} 年武鬥大會冠軍`); wishHook('hero');
    if (S.tourBet) { S.gold += S.tourBet * 4; ev('good', '賭注', `你押的 ${fmt(S.tourBet)} 金變成 ${fmt(S.tourBet * 4)} 金`); }
    ev('good', '武鬥大會', `${h.name}拿下第 ${y} 年武鬥大會冠軍！獎金 ${fmt(g)} 金，名聲 +${fame}`); if (!offline) say(L('tChamp')); }
  else { if (place === 2) { S.gold += 200 + rkx() * 120; logLife(`第 ${y} 年武鬥大會亞軍`); } adj('mood', place >= 2 ? 5 : -8);
    if (champ && champ.ai != null) S.rivals[champ.ai].fame += 60;
    ev(place >= 2 ? 'good' : 'warn', '武鬥大會', `${h.name}${['首輪就被淘汰', '止步四強', '拿下亞軍'][place]}，名聲 +${fame}。冠軍是${champ.ag ? champ.ag + '的' : ''}${champ.n}`); }
  S.tourBet = 0;
  S.tHist = S.tHist || []; S.tHist.push({ y, place, champ:(champ.ag ? champ.ag + '的' : '') + champ.n, me:place === 3, hero:h.name });
  news('good', `第 ${y} 年武鬥大會由${champ.me ? h.name : (champ.ag ? champ.ag + '的' : '') + champ.n}奪冠`);
  if (!offline) tourPop(y, log, place, champ, fame);
}

// ---- v17.11：長路的畫法 ----
// 天空、雲、兩層遠山（整條路共用，視差）
function drawSky(now){
  const hw = 180 / cam.z, L = cam.x - hw - 10, R = cam.x + hw + 10;
  ctx.fillStyle = '#a8d8f0'; ctx.fillRect(L, 0, R - L, VH); ctx.fillStyle = '#c4e4f4'; ctx.fillRect(L, 50, R - L, 50);
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  for (let i = 0; i < 26; i++) { const u = ((i * 173 + now / 900) % (WW * .3 + 260)) - 130 + cam.x * .7, y = 10 + (i * 37) % 34; if (u < L - 30 || u > R) continue; ctx.fillRect(Math.round(u), y, 22, 5); ctx.fillRect(Math.round(u) + 5, y - 3, 12, 3); }
  [[.72, 'far'], [.45, 'near']].forEach(([f, k]) => ctx.drawImage(vilHills(k), cam.x * f - 200, 0, WW * (1 - f) + 400, 110));
}
// 野外的地面：每區不同的後方地形、路面、前方草邊（預先畫成一長條）
let WGROUND = null;
const ZROAD = ['#b89a6e', '#8a7050', '#a89070', '#7a7068', '#d8c08a', '#c8d0d8', '#4a3a4a'];
function wildGround(){ if (WGROUND) return WGROUND; const W0 = Math.ceil(WW - VW), c = document.createElement('canvas'); c.width = W0; c.height = VH; const g = c.getContext('2d');
  // v17.34：野外是自然土路，寬度和村子的車道一樣（V_ROAD～V_ROAD_B）；上下緣是不規則的草邊，每區用自己的地面顏色
  const n1 = x => Math.sin(x * .31) * .9 + Math.sin(x * .113 + 1.7) * 1.1 + Math.sin(x * 1.37) * .5;
  const seg = (x0, x1, back, road, verge, k) => { const a = Math.round(x0 - VW), w = Math.round(x1 - x0) + 14;
    g.fillStyle = back; g.fillRect(a, 92, w, V_ROAD - 92 + 3); speckle(g, a, 92, w, V_ROAD - 92, [monMix(back, '#ffffff', .12), monMix(back, '#000000', .15)], w / 2, k);
    g.fillStyle = verge; g.fillRect(a, V_ROAD_B - 3, w, VH - V_ROAD_B + 3); speckle(g, a, V_ROAD_B, w, VH - V_ROAD_B, [monMix(verge, '#ffffff', .15), monMix(verge, '#000000', .15)], w / 3, k + 7);
    for (let x = a; x < a + w; x++) { const wx = x + VW, t = V_ROAD + Math.round(n1(wx) * .9), b = V_ROAD_B - 1 + Math.round(n1(wx + 57) * .9);
      g.fillStyle = road; g.fillRect(x, t, 1, b - t + 1);
      g.fillStyle = monMix(road, '#000000', .18); g.fillRect(x, b, 1, 1);   // 下緣的陰影
      g.fillStyle = monMix(road, '#ffffff', .12); g.fillRect(x, t, 1, 1); }
    speckle(g, a, V_ROAD + 2, w, V_ROAD_B - V_ROAD - 4, [monMix(road, '#000000', .14), monMix(road, '#ffffff', .14)], w / 1.5, k + 3);
    // 車轍：兩條淡淡的線
    g.fillStyle = monMix(road, '#000000', .08); for (let x = a; x < a + w; x++) if ((x * 7 + k) % 11 > 2) { g.fillRect(x, V_ROAD + 9, 1, 1); g.fillRect(x, V_ROAD_B - 9, 1, 1); } };
  seg(VW, ZONES[0].rect[0], '#6f9a48', '#b89a6e', '#6f9a48', 1);
  ZONES.forEach((Z, z) => seg(Z.rect[0], Z.rect[2], Z.c, ZROAD[z], z === 4 ? '#e0cc98' : z === 5 ? '#eef3f8' : z === 6 ? '#2e2238' : monMix(Z.c, '#000000', .1), z * 11 + 2));
  seg(CAP.x0 - CAPMIX, CAP.x1 + 14 + CAPMIX, '#8a9a6a', '#c4a77a', '#6f9a48', 99);   // v17.44：往兩邊多鋪 CAPMIX，交界淡出時露出來
  paveIso(g, Math.round(CAP.x0 - VW) - CAPMIX, Math.round(CAP.x1 - VW) + 14 + CAPMIX, CAP.x0 - VW);   // 王都：和村子一樣的菱形石板路
  return WGROUND = c; }
// v17.40：草原、森林、荒地改成正面 Kenney Q 版（ART.wild，design-wip 的 design/wild/wild.py）。每區預先拼成一條長畫布：
// 後方地面＋背景物（腳底對齊 V_BASE 附近）、土路（V_ROAD～V_ROAD_B）、路下方的草邊和小東西
// v17.44：區域交界不再一刀切：草原↔森林在交界前後各 60 混色、兩邊背景物交錯；森林／荒地靠王都那一側，地面用格子交錯慢慢讓給王都的石板路
const WSTRIP = {}, ZMIX = 60, CAPMIX = 72;
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const ZKIT = z => z === 2 ? { g:['s0', 's0', 's0', 's1'], rT:'sT', rM:'sM', rB:'sB' } : z === 1 ? { g:['fg0', 'fg0', 'fg0', 'fg1'], rT:'frT', rM:'frM', rB:'frB' } : { g:['g0', 'g0', 'g0', 'g0', 'g0', 'g1', 'g1', 'g2'], rT:'rT', rM:'rM', rB:'rB' };
// 一區的地面：[後方（V_ROAD 以上）, 路＋路下方]
function zoneGround(z, W, rnd){
  const T = n => rideCanvas(n, 'wild'), K = ZKIT(z), mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = VH; return c; };
  const back = mk(), front = mk(), gb = back.getContext('2d'), gf = front.getContext('2d');
  const row = (g, y, n) => { for (let x = 0; x < W; x += 16) g.drawImage(T(n || K.g[Math.floor(rnd() * K.g.length)]), x, y); };
  for (let y = 92; y < V_ROAD; y += 16) row(gb, y);
  row(gf, V_ROAD - 6, K.rT); row(gf, V_ROAD + 6, K.rM); row(gf, V_ROAD + 18, K.rM); row(gf, V_ROAD_B - 8, K.rB);
  for (let y = V_ROAD_B + 8; y < VH; y += 16) row(gf, y);
  return [back, front]; }
// 疊上另一區的地面，每一欄照 f(x) 的比例混色
function mixCols(dst, src, f){ const g = dst.getContext('2d'); for (let x = 0; x < dst.width; x++) { const t = f(x); if (t <= .01) continue; g.globalAlpha = Math.min(1, t); g.drawImage(src, x, 0, 1, VH, x, 0, 1, VH); } g.globalAlpha = 1; }
// 格子交錯淡出（2 像素一格的 Bayer 點陣）：keep(x) 越小，挖掉的格子越多
function ditherOut(cv, keep){ const g = cv.getContext('2d'), d = g.getImageData(0, 0, cv.width, VH), px = d.data;
  for (let x = 0; x < cv.width; x++) { const k = keep(x); if (k >= .999) continue;
    for (let y = 0; y < VH; y++) if (k * 16 <= BAYER[((y >> 1) & 3) * 4 + ((x >> 1) & 3)]) px[(y * cv.width + x) * 4 + 3] = 0; }
  g.putImageData(d, 0, 0); }
function zoneStrip(z){
  if (WSTRIP[z]) return WSTRIP[z];
  const [x0, , x1] = ZONES[z].rect, W = Math.round(x1 - x0) + 14, c = document.createElement('canvas'); c.width = W; c.height = VH; const g = c.getContext('2d');
  let sd = 1234 + z * 97; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647, pk = a => a[Math.floor(rnd() * a.length)];
  const T = n => rideCanvas(n, 'wild'), put = (n, x, b) => { const cv = T(n); g.drawImage(cv, Math.round(x), Math.round(b) - cv.height); };
  // 森林味（0＝草原、1＝森林）：草原尾端和森林開頭照它混；keep：靠王都那一側慢慢讓出來
  const B0 = z === 0 ? W - 7 : -7, fo = z === 2 ? () => 0 : x => sstep(B0 - ZMIX, B0 + ZMIX, x);
  const keep = z === 1 ? x => 1 - sstep(W - CAPMIX, W, x) : z === 2 ? x => sstep(0, CAPMIX, x) : () => 1;
  const [back, front] = zoneGround(z, W, rnd);
  if (z <= 1) { const [b2, f2] = zoneGround(1 - z, W, rnd), m = z === 0 ? fo : x => 1 - fo(x); mixCols(back, b2, m); mixCols(front, f2, m); }
  if (z >= 1) { ditherOut(back, keep); ditherOut(front, keep); }
  g.drawImage(back, 0, 0);
  const items = [];   // [名稱, x, 腳底 y]，最後照腳底排序再畫（後面的先畫）
  const FRONT0 = ['tree', 'tree', 'stree', 'bush', 'atree'], FRONT1 = ['tree', 'tree', 'stree', 'bush', 'mush', 'atree', 'log', 'stump', 'bush'];
  if (z <= 1) {
    if (z === 0) items.push(['farm', W * .12, V_BASE + 2], ['field', W * .42, V_BASE - 6], ['hay', W * .42 + 84, V_BASE - 2], ['hay', W * .42 + 96, V_BASE + 2], ['fence', W * .72, V_BASE + 8], ['fence', 2, V_BASE + 8]);
    // 森林後排兩層：越接近森林越密（草原尾端只零星幾棵）
    for (let i = 0, x = -6; x < W; x += 13, i++) { const p = Math.pow(fo(x + 20), 1.3) * keep(x); if (rnd() < p) items.push([['treeD', 'treeD', 'atreeD', 'treeD', 'streeD'][i % 5], x, 92 + (i * 5) % 7]); }
    for (let i = 0, x = 4; x < W; x += 17, i++) { const p = fo(x + 10) * keep(x); if (rnd() < p) items.push([['treeM', 'streeM', 'treeM', 'atreeM', 'treeM', 'satreeM'][i % 6], x, 104 + (i * 3) % 5]); }
    // 前排：兩邊的東西交錯
    for (let x = 4; x < W - 16; x += 16 + rnd() * 20) { const f = fo(x);
      if (z === 0 && f < .02 && (Math.abs(x - W * .12 - 24) < 34 || (x > W * .42 - 14 && x < W * .42 + 110))) continue;
      if (rnd() > keep(x)) continue;
      items.push([pk(rnd() < f ? FRONT1 : FRONT0), x, V_BASE + 1 + rnd() * (f < .5 ? 4 : 3)]); }
  } else {
    for (let x = 6; x < W - 16; x += 22 + rnd() * 30) { if (rnd() > keep(x)) continue; items.push([pk(['pillar', 'pillar2', 'cactus', 'cactus', 'rock', 'skull', 'pillar']), x, V_BASE - 8 + rnd() * 11]); }
  }
  items.sort((a, b) => a[2] - b[2]).forEach(([n, x, b]) => put(n, x, b));
  g.drawImage(front, 0, 0);
  for (let x = 10; x < W - 16; x += 40 + rnd() * 50) { if (rnd() > keep(x)) continue; const f = fo(x); put(z === 2 ? pk(['rock', 'cactus', 'skull']) : rnd() < f ? pk(['mush', 'bush', 'tree', 'sprout']) : pk(['mush', 'bush', 'sprout']), x, VH + 2 + rnd() * 4); }
  return WSTRIP[z] = c; }
// 每區的遠景
function drawZoneBack(z, x0, x1, bm){
  const w = x1 - x0, at = k => x0 + w * k;
  if (z <= 2 && ART.wild) { if (z === 2) { const gr = ctx.createLinearGradient(x0 - 14, 0, x0 + CAPMIX, 0); gr.addColorStop(0, 'rgba(240,190,120,0)'); gr.addColorStop(1, 'rgba(240,190,120,.3)'); ctx.fillStyle = gr; ctx.fillRect(x0 - 14, 0, w + 28, 92); } ctx.drawImage(zoneStrip(z), x0, 0); return; }   // v17.40
  if (z === 0) { drawBld(ctx, 'field', at(.2), 88, 44, 30, 'day'); drawBld(ctx, 'field', at(.62), 90, 40, 28, 'day'); drawBld(ctx, 'cottage', at(.42), 92, 26, 24, bm, { roof:'#c0563f' }); }
  else if (z === 1) for (let x = x0 + 4, i = 0; x < x1 - 10; x += 19, i++) drawBld(ctx, 'tree', x, 78 + (i % 3) * 6, 22, 34, 'day');
  else if (z === 2) { drawBld(ctx, 'ruins', at(.3), 88, 44, 30, 'day'); drawBld(ctx, 'rock', at(.6), 106, 16, 12, 'day'); drawBld(ctx, 'rock', at(.8), 104, 20, 14, 'day'); ctx.fillStyle = '#a08a60'; ctx.fillRect(at(.05), 70, 50, 48); ctx.fillStyle = '#8a7650'; ctx.fillRect(at(.05), 70, 50, 4); }
  else if (z === 3) { ctx.fillStyle = '#5a524a'; for (let x = x0; x < x1; x += 6) { const t = 50 + Math.round(Math.sin(x / 23) * 10 + Math.sin(x / 7) * 3); ctx.fillRect(x, t, 6, 118 - t); } [.2, .55, .85].forEach(k => drawBld(ctx, 'mine', at(k), 96, 22, 22, 'day')); }
  else if (z === 4) { ctx.fillStyle = '#3d6f9e'; ctx.fillRect(x0, 66, w, 52); ctx.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 14; i++) ctx.fillRect(x0 + ((i * 53) % w), 72 + (i * 17) % 40, 8, 2); drawBld(ctx, 'wreck', at(.6), 92, 44, 26, 'day'); }
  else if (z === 5) [.1, .35, .62, .85].forEach((k, i) => drawBld(ctx, 'mountain', at(k) - 24, 56 + (i % 2) * 8, 48, 62 - (i % 2) * 8, 'day'));
  else if (z === 6) { ctx.fillStyle = 'rgba(40,20,60,.35)'; ctx.fillRect(x0, 0, w, 118); drawBld(ctx, 'darkcastle', x1 - 96, 28, 76, 90, 'day'); }
}
function drawWild(now){
  const hw = 180 / cam.z, L = cam.x - hw - 40, R = cam.x + hw + 40; if (R < VW) return;
  const hr = hourOf(), bm = hr >= 20 || hr < 6 ? (hr >= 23 || hr < 6 ? 'late' : 'night') : 'day', h = H();
  ctx.drawImage(wildGround(), VW, 0, WW - VW, VH);
  // 王都：城堡、民房、驛站
  if (CAP.x1 > L && CAP.x0 < R) {   // v17.34：王都換成斜角圖：城堡在後、民房在左前、驛站在右前
    const put = (nm, left, back) => { const B = ART.bld[nm], wx = Math.round(left + B.ax), gy = V_BASE - 2 - (B.h - 1 - B.ay) - back; drawIso(ctx, nm, wx, gy, bm); return [left + B.w / 2, gy - B.ay]; };
    const ct = put('cap_castle', CAP.x0 + 20, 6); put('cap_house_0', CAP.x0 - 4, 0); const st = put('cap_station', CAP.x1 - 40, 0);
    nameTag(ctx, '王都', ct[0], ct[1] - 2, 'hero'); nameTag(ctx, '驛站', st[0], st[1] - 2, 'npc'); }
  ZONES.forEach((Z, z) => { const [x0, , x1] = Z.rect; if (x1 < L || x0 > R) return;
    drawZoneBack(z, x0, x1, bm);
    // 路標（還沒開放的區域：名字寫在柵欄上方，不立路標）
    const open = zoneOpen(z);
    if (open) { ctx.fillStyle = '#6a4428'; ctx.fillRect(x0 + 6, 104, 2, 16); nameTag(ctx, Z.n, x0 + 7, 102, 'npc'); }
    // 魔王在區域盡頭（任務演出中會另外畫）
    const bossScn = SCN && !SCN.off && SCN.t === 'boss' && SCN.z === z;
    if (z === 2 && !h.bossKill && !bossScn) drawMonster(ctx, 'boneking', x1 - 34, 146, 'idle', Math.floor(now / 260) % 4, false, true);
    if (z === 6 && zoneOpen(6) && !S.boss2Done && !bossScn) drawMonster(ctx, 'abyss', x1 - 44, 147, 'idle', Math.floor(now / 260) % 4, false, true);
    // v17.44：還沒開放：Kenney 木柵欄兩排擋路、紅叉木牌、盔甲守衛；柵欄後面漸層變暗
    if (!open) { const FX = x0 + 4, gr = ctx.createLinearGradient(FX - 2, 0, FX + 12, 0);
      gr.addColorStop(0, 'rgba(10,12,20,0)'); gr.addColorStop(1, 'rgba(10,12,20,.45)'); ctx.fillStyle = gr; ctx.fillRect(FX - 2, 0, 14, VH);
      ctx.fillStyle = 'rgba(10,12,20,.45)'; ctx.fillRect(FX + 12, 0, x1 + 14 - FX - 12, VH);
      if (ART.wild && ART.wild.fcol) { const sp = (n, x, b) => { const cv = rideCanvas(n, 'wild'); ctx.drawImage(cv, Math.round(x), Math.round(b) - cv.height); };
        sp('fcol', FX - 6, V_ROAD_B + 6); sp('fcol', FX + 2, V_ROAD_B + 2); sp('xsign', FX - 30, V_ROAD - 1); sp('guard', FX - 28, 146); }
      nameTag(ctx, Z.n, FX + 2, 89, 'npc'); }
  });
}
// 小地圖：整條路（村子＋野外），白框是目前看到的範圍，紅點是勇者（MINI 沿用村子模組的設定）
function drawWorldMini(now){
  try {
    const { x0, x1, y, h: mh } = MINI, k = (x1 - x0) / WW, hw = 180 / cam.z, hh = H(), hm = heroMap(hh);
    ctx.fillStyle = 'rgba(16,20,30,.6)'; ctx.fillRect(x0 - 2, y - 2, x1 - x0 + 4, mh + 4);
    ctx.fillStyle = '#4f9a8a'; ctx.fillRect(x0, y + 1, VW * k, mh - 2);
    ctx.fillStyle = '#f2c14e'; ctx.fillRect(x0 + (VD.office - 20) * k, y + 1, Math.max(1, 40 * k), mh - 2);
    ctx.fillStyle = '#9aa4b8'; ctx.fillRect(x0 + CAP.x0 * k, y + 1, (CAP.x1 - CAP.x0) * k, mh - 2);
    ZONES.forEach((Z, z) => { ctx.fillStyle = zoneOpen(z) ? Z.c : '#2a2f3c'; ctx.fillRect(x0 + Z.rect[0] * k, y + 1, Math.max(1, (Z.rect[2] - Z.rect[0]) * k), mh - 2); });
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = .7; ctx.strokeRect(x0 + (cam.x - hw) * k, y - 1, hw * 2 * k, mh + 2);
    const px = hm === 'vil' ? V.x : !heroHidden(hh) ? hh.x : null;
    if (px != null) { ctx.fillStyle = '#ff7b7b'; ctx.beginPath(); ctx.arc(x0 + px * k, y + mh / 2, 2, 0, 7); ctx.fill(); }
    // 勇者在屋裡：門口上方冒一個小泡泡（畫在夜色之後）
    if (V.inside && hm === 'vil') doorEmo(now);   // v17.56：門口上方冒 Kenney 表情泡泡
  } catch (e) { console.error(e); }
}
// 鏡頭：整條路高度剛好塞滿畫面，左右跟著勇者（或玩家滑到的地方）
function worldCam(h, hm, now){
  const z = SH / VH, panning = V.drag || (V.pan != null && now - V.panT < 3500); if (!panning) V.pan = null;
  const gone = ['dead', 'retired', 'left'].includes(h.act) || heroHidden(h);
  let x = panning ? V.pan : hm === 'vil' ? (V.x ?? VD.office) : gone ? VD.office : h.x;
  // v17.38：村子裡鏡頭先不動，勇者快走出畫面（離中心超過半個畫面的 55%）才跟過去
  if (!panning && hm === 'vil' && !gone && V.x != null) { const m = 180 / z * .55; if (V.cx == null) V.cx = x; if (x > V.cx + m) V.cx = x - m; else if (x < V.cx - m) V.cx = x + m; x = V.cx; }
  else V.cx = null;   // 滑動畫面或不在村子時，下次回來重新以勇者為中心
  return [x, VH / 2, z];
}
// 舊存檔：寶箱、精英怪、迷路旅人不在新的路上的話，重新放到該區的路上
function mtFix(mt){ const fix = o => { if (!o || !ZONES[o.z]) return; const R = ZONES[o.z].rect; if (!(o.x >= R[0] && o.x <= R[2] && o.y >= R[1] - 2 && o.y <= R[3] + 2)) { o.x = rand(R[0] + 14, R[2] - 14); o.y = rand(R[1] + 6, R[3] - 4); } };
  (mt.chests || []).forEach(fix); fix(mt.elite); fix(mt.lost); }

// ================= v17.12：交通（徒步、騎馬、驛馬車、傳送陣） =================
// 勇者照固定速度一步一步走，不再瞬移；路上的時間算進任務。交通工具由勇者依個性和錢包自己選。
const UPH = { walk:160, horse:400, coach:700 };   // 每小時走幾個世界單位（草原入口走路約 1 小時）
const MODE_N = { walk:'走路', horse:'騎馬', coach:'坐驛馬車', tele:'用傳送陣' };
const COACH_FARE = 20, TELE_FEE = 150, HORSE_PRICE = 600, HORSE_FEED = 15;
const COACH_A = () => GX, COACH_B = () => CAP.x1 - 28;   // 驛馬車：村口 ↔ 王都驛站
const teleOpen = () => stageOf() >= 3;   // 事務所到「王國」階段才有傳送陣
// 勇者自己挑交通工具
function pickMode(h, fromX, toX){
  const dist = Math.abs(toX - fromX); if (dist < 60) return 'walk';
  const far = Math.max(fromX, toX) > CAP.x1 + 20;
  if (teleOpen() && far && dist > 900 && S.gold >= TELE_FEE * 4) return 'tele';
  const thrift = h.goal === 'etf' || h.trait === 'greedy', fancy = h.goal === 'seiko', health = h.goal === 'health';
  if (h.horse && !(health && dist < 500)) return 'horse';
  const lo = Math.min(fromX, toX), hi = Math.max(fromX, toX), coachOk = lo <= COACH_A() + 4 && hi >= COACH_B() - 10 && h.wallet >= COACH_FARE;
  if (coachOk && (fancy || dist > 700 || (!thrift && dist > 450))) return 'coach';
  return 'walk';
}
// 這段路要幾小時
function legHours(h, mode, fromX, toX){
  const dist = Math.abs(toX - fromX);
  if (mode === 'tele') return .3;
  if (mode === 'coach') { const lo = Math.min(fromX, toX), hi = Math.max(fromX, toX), seg = Math.max(0, Math.min(hi, COACH_B()) - Math.max(lo, COACH_A()));
    return .25 + seg / UPH.coach + (dist - seg) / (h.horse ? UPH.horse : UPH.walk); }   // 平均等車 15 分鐘
  return dist / UPH[mode];
}
// 任務的單程時間（接任務時算好，存在任務上）
function missionTGo(h, o){ if (!o || o.z == null || o.z < 0 || !ZONES[o.z]) return 0; const R = ZONES[o.z].rect, cx = (R[0] + R[2]) / 2, m = pickMode(h, GX, cx); return legHours(h, m, GX, cx); }
// 開始一段路：選交通工具、付錢、算速度
function startLeg(h){
  const fromX = h.x, toX = h.tx, dist = Math.hypot(h.tx - h.x, h.ty - h.y), mode = pickMode(h, fromX, toX), hours = Math.max(.05, legHours(h, mode, fromX, toX));
  const leg = { tx:h.tx, fromX, toX, dist, mode, hours, spd:dist / (hours * DAY_SEC / 24), eta:hourOf() + hours, big:Math.abs(toX - fromX) > 150, enc:null, met:0 };
  if (mode === 'coach') { h.wallet -= COACH_FARE; trPay(h, COACH_FARE); }
  if (mode === 'tele') { S.gold -= TELE_FEE; finAdd('trav', -TELE_FEE); leg.tp = performance.now(); leg.tpFrom = [h.x, h.y]; h.x = h.tx - Math.sign(toX - fromX) * 12; h.y = h.ty; }
  if (leg.big && !offline && chance(.3)) leg.enc = pick(mode === 'walk' ? ['trav', 'merc', 'mon'] : ['trav', 'merc']);   // v17.45：騎馬、坐車不會被偷襲
  h.leg = leg;
}
const trPay = (h, v) => { h.trSpent = (h.trSpent || 0) + v; h.trM = (h.trM || 0) + v; };
// 每一格模擬：要走遠路就開始一段；走到了就結束；走到一半可能遇到人或怪
function legTick(h, d){
  if (offline) { h.leg = null; return; }
  if (d > 60 && (!h.leg || Math.abs(h.leg.tx - h.tx) > 30)) startLeg(h);
  const L = h.leg; if (!L) return;
  if (d <= 2) { h.leg = null; return; }
  const prog = 1 - d / Math.max(1, L.dist);
  if (L.enc && !L.met && prog > .45) { L.met = 1; L.encT = performance.now();
    if (L.enc === 'mon') { adj('sta', -3); say(pickS(['路上被怪物偷襲，打跑了', '趕路時跳出一隻怪，嚇我一跳']));   // v17.45：停下打一回合再走
      const z = ZONES.findIndex(Z => h.x >= Z.rect[0] && h.x <= Z.rect[2] + 14), dir = Math.sign(L.toX - L.fromX) || 1; L.ez = Math.max(0, z); L.ex = h.x + dir * (monHalf(zoneMon(L.ez)) + 13); L.ey = h.y; L.stop = L.encT + 1800; }
    else if (L.enc === 'merc') say(pickS(['路上遇到旅行商人，聊了一下行情', '跟路過的商人買了杯熱茶']));
    else say(pickS(['路上遇到一個迷路的旅人，幫他指了路', '跟同路的旅人聊了一段'])); }
}
// 狀態列：「走路去森林，預計 9:40 到」
function legTxt(h){ const L = h.leg; if (!L || !L.big || offline) return '';
  const toV = L.toX <= GX + 2, z = ZONES.findIndex(Z => L.toX >= Z.rect[0] - 2 && L.toX <= Z.rect[2] + 14), cap = L.toX >= CAP.x0 && L.toX <= CAP.x1;
  const dest = toV ? '村子' : cap ? '王都' : z >= 0 ? ZONES[z].n : '野外', eta = L.eta >= 30 ? '明天' : fmtH(L.eta);
  return `${MODE_N[L.mode]}${toV ? '回' : '去'}${dest}，預計 ${eta} 到`; }
// 畫交通工具：回傳 'hide' 表示勇者在車裡，不畫人；回傳數字表示勇者要往上抬幾格（騎在馬上）
function drawRide(now, h, x, y){
  const L = h.leg; if (!L || offline) return 0;
  if (L.tp && now - L.tp < 1500) { const a = 1 - (now - L.tp) / 1500; ctx.globalAlpha = a; [[x, y], L.tpFrom].forEach(([px, py]) => { ctx.strokeStyle = '#c9b6ff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(px, py + 1, 14, 4, 0, 0, 7); ctx.stroke(); ctx.fillStyle = '#f1e8ff'; for (let i = 0; i < 5; i++) ctx.fillRect(px - 10 + i * 5, py - 6 - ((now / 60 + i * 7) % 18), 1.5, 3); }); ctx.globalAlpha = 1; }
  if (L.encT && now - L.encT < 2500) { const ex = x + Math.sign(L.toX - L.fromX) * 18;
    if (L.enc === 'mon') { if (L.ex != null) { const p = (now - L.encT) / 1000, q = p - .4, left = L.ex > x, d = left ? 1 : -1; let kind = 'idle', f = Math.floor(now / 200) % 4, dx = 0, a = 1;
        if (p < .4) { a = p / .4; dx = d * Math.round((1 - p / .4) * 10); }   // 從前面跳出來
        else if (q > .3 && q < .45) { kind = 'hurt'; f = 1; dx = d * 2; } else if (q >= .45) { kind = 'down'; dx = d * 3; a = Math.max(0, 1 - (q - .45) / .65); }
        if (a > 0) { ctx.globalAlpha = a; drawMonster(ctx, zoneMon(L.ez), L.ex + dx, L.ey, kind, f, false, left, L.encSeed ??= Math.random()); ctx.globalAlpha = 1; } } }
    else { pxPerson(ex, y, L.enc === 'merc' ? '#8a5a3a' : '#59a8ff', 2, now); if (L.enc === 'merc') drawBld(ctx, 'cart', ex + 6, y - 14, 20, 15, 'day'); } }
  const left = L.toX < L.fromX;
  // v17.39：驛馬車（灰白馬走路、輪子轉）；進出驛馬車路段時勇者和馬車交叉淡入淡出
  if (L.mode === 'coach' && h.x >= COACH_A() - 2 && h.x <= COACH_B() + 2) {
    const k = clamp(Math.min(h.x - (COACH_A() - 2), COACH_B() + 2 - h.x) / 10, 0, 1);
    const a0 = ctx.globalAlpha; ctx.globalAlpha = a0 * k; drawRideSpr(ctx, 'coach_' + (Math.floor(now / 170) % 4), x, y + 1, left); ctx.globalAlpha = a0;
    if (k >= 1) return 'hide'; RIDE_HA = 1 - k; return 0; }
  // v17.39：勇者騎馬（棕馬跳躍式跑法）：先畫馬，勇者坐上去，再把馬背以下和馬頭蓋在勇者前面
  if (L.mode === 'horse' || (L.mode === 'coach' && h.horse)) { const f = Math.floor(now / 90) % 4;
    drawRideSpr(ctx, 'horse_run_' + f, x, y + 1, left, RIDE_AX); RIDE_FRONT = ['horse_runF_' + f, x, y + 1, left]; return 10 - RIDE_LIFT[f]; }
  return 0;
}
// v17.39：側面 Q 版的馬、馬車（design/rides）。x 是對齊點（騎馬＝勇者的位置，其他＝圖的中間），y 是腳底；left＝朝左（左右翻轉）
const RIDE_CACHE = new Map(), RIDE_AX = 11, RIDE_LIFT = [1, 1, 0, 1];
let RIDE_FRONT = null, RIDE_HA = 1;
function rideCanvas(name, src = 'ride'){ const ck = src + ':' + name; let cv = RIDE_CACHE.get(ck); if (cv) return cv; const R = ART[src][name];
  cv = document.createElement('canvas'); cv.width = R.w; cv.height = R.h; const g = cv.getContext('2d');
  for (let i = 0; i < R.px.length; i++) { const ch = R.px[i]; if (ch === ' ') continue; g.fillStyle = R.pal[ART.mch.indexOf(ch)]; g.fillRect(i % R.w, Math.floor(i / R.w), 1, 1); }
  RIDE_CACHE.set(ck, cv); return cv; }
function drawRideSpr(c, name, x, y, left, ax, src){ src = src || (ART.ride && ART.ride[name] ? 'ride' : 'wild'); if (!ART[src] || !ART[src][name]) return; const cv = rideCanvas(name, src), t = c.getTransform(), p = Math.max(1, Math.round(t.a)), w = cv.width * p, hh = cv.height * p;
  const a = (ax ?? cv.width / 2) * p, sx = Math.round(t.a * x + t.e), sy = Math.round(t.d * y + t.f);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false;
  if (left) { c.translate(sx, 0); c.scale(-1, 1); } c.drawImage(cv, left ? -Math.round(a) : sx - Math.round(a), sy - hh, w, hh); c.restore(); }
// 每個月：養馬的飼料費；錢夠了就自己去買匹馬（照個性）
function travelMonthly(h){
  if (!h || ['dead', 'retired', 'left'].includes(h.act)) return;
  h.trM = 0;
  if (h.horse) { if (h.wallet >= HORSE_FEED) { h.wallet -= HORSE_FEED; trPay(h, HORSE_FEED); } else { h.horse = null; ev('warn', '賣馬', `${h.name}養不起馬，只好把馬賣了`); if (!offline) say('……馬賣掉了，以後又要走路了'); } return; }
  const want = h.goal === 'etf' ? h.wallet >= 2600 : h.goal === 'health' ? h.wallet >= 1800 : h.wallet >= 900 + (h.trait === 'greedy' ? 600 : 0);
  if (want && chance(.25)) { h.wallet -= HORSE_PRICE; trPay(h, HORSE_PRICE); h.horse = { since:S.day }; ev('good', '買馬', `${h.name}用自己的錢買了一匹馬（${HORSE_PRICE} 金），以後出門快多了`); if (!offline) say(pickS(['我買馬了！以後通勤快好多', '存了好久，終於有自己的馬了'])); }
}
function trLine(){ const h = H(); if (!h || !(h.trSpent > 0)) return ''; return `<div class="k" style="font-size:12px;margin-top:6px">${h.name}自己付的交通費（車資、養馬）：這個月 ${fmt(h.trM || 0)} 金，累計 ${fmt(h.trSpent)} 金${h.horse ? ' · 有一匹馬' : ''}</div>`; }
// 造型：站牌、傳送陣（馬、驛馬車 v17.39 改用 ART.ride）
Object.assign(BLD_ART, {
  stop(P){ const { W, H } = P; P.rect(W / 2 - 1, 6, W / 2, H - 1, '#5a4a3a'); P.rect(1, 0, W - 2, 8, '#f2e2b0'); P.ell(W / 2 - .5, 4, 2.5, 2, '#3f6ea0'); },
});

// ================= v17.14：急報（整頁大事件）20 秒；v17.58：一般問題也改成限時 15 秒（拿掉「已讀不回」），時間到勇者自己決定 =================
// 一般問題只在看著主畫面時倒數（打開選單、暫停、切到別的 App 時停住）；剩多少存在 q.rem（毫秒），重開頁面接著倒數
const URGENT_MS = 15000, ASK_MS = 15000;   // v17.89 開發者：大事件也統一 15 秒
let qLast = Date.now();
function qTick(){
  const now = Date.now(), dt = Math.min(1000, now - qLast); qLast = now;
  try {
    if (!S || !S.q || offline) return;
    const q = S.q, big = BIG_Q.has(q.key), tot = big ? URGENT_MS : ASK_MS;
    if (q.rem == null) { q.rem = q.dl ? clamp(q.dl - now, 0, tot) : tot; delete q.dl; }   // 舊存檔的 dl（到期時刻）換成剩多少
    if (!document.hidden && (big || (!sheetT && !S.paused))) q.rem -= dt;
    const left = Math.max(0, Math.ceil(q.rem / 1000));
    const a = document.getElementById('evCd'); if (a) a.textContent = `${left} 秒`;
    const a2 = document.getElementById('evBar'); if (a2) a2.style.width = clamp(q.rem / tot * 100, 0, 100) + '%';
    const b = document.getElementById('qCd'); if (b) b.textContent = `${left} 秒`;
    const c = document.getElementById('qBar'); if (c) c.style.width = clamp(q.rem / tot * 100, 0, 100) + '%';
    if (q.rem <= 0) { $('evp').classList.remove('on'); answer(-1); save(); renderAll(); }
  } catch (e) { console.error(e); }
}
setInterval(qTick, 250);

// ================= v17.15：小插曲排隊、在地圖上演出 =================
let EPQ = [], EPC = null;
function epPush(e){ if (offline) return; EPQ.push({ ...e, at:performance.now() }); if (EPQ.length > 6) EPQ.shift(); }
// 事件文字裡提到村民的名字，就讓那位村民走到勇者旁邊演一段
function epFromEv(tag, text){ try { if (!S || offline || !S.npcs) return; const n = S.npcs.find(x => x.alive && !x.dark && x.name && text.includes(x.name)); if (n) epPush({ npc:n.id, tag }); } catch (e) {} }
function drawEpisode(now){
  try {
    const h = H();
    if (heroMap(h) === 'vil' && V.inside && !EPC && EPQ.length) { const e = EPQ.shift(); if (now - e.at < 60000) pipPush({ k:'ep', npc:e.npc, tag:e.tag, room:V.inside }); }   // v17.18：勇者在屋裡，改在小窗格演
    if (heroMap(h) !== 'vil' || V.inside || V.x == null) { if (EPC && now - EPC.t0 > 4200) EPC = null; return; }
    if (!EPC || now - EPC.t0 > 4200) { EPC = null; while (EPQ.length && now - EPQ[0].at > 60000) EPQ.shift(); const e = EPQ.shift(); if (e) EPC = { ...e, t0:now, x0:V.x + (Math.random() < .5 ? -70 : 70) }; }
    if (!EPC) return; const n = npc(EPC.npc); if (!n || !n.alive) { EPC = null; return; }
    const k = Math.min(1, (now - EPC.t0) / 1200), tx = V.x + (EPC.x0 < V.x ? -16 : 16), x = Math.round(EPC.x0 + (tx - EPC.x0) * k), y = Math.round(V.y);
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(x - 6, y, 12, 2);
    drawSprite(ctx, n, x, y, false, now, { moving:k < 1, left:EPC.x0 > V.x });
    nameTag(ctx, n.name.slice(0, 4), x, y - KEN_TAG, n.aff >= 50 ? 'friend' : 'npc');
    if (k >= 1 && EPC.tag) pxSay(x, y - 31, EPC.tag);
  } catch (e) { if (!scnErr++) console.error(e); }
}
// 勇者頭上的泡泡：排隊，每則至少停 3.5 秒
function bubbleTick(now){ const h = H(); if (!h) return;
  if (BUB.h !== h) { BUB.h = h; BUB.q = []; BUB.cur = null; }   // 換了一代勇者，上一代的話不要接著冒出來
  if (BUB.cur && (BUB.cur.until < now || BUB.cur.until - now > 3600)) BUB.cur = null;   // 時間到，或時間對不上（例如分頁被暫停過）就收掉
  if (!BUB.cur && BUB.q.length) BUB.cur = { t:BUB.q.shift(), until:now + 3500 }; }

// ================= v17.16：勇者真的睡著了，時間才加快（約 3 倍） =================
function isAsleep(){ try { const h = H(), hr = hourOf(); if (!h || hr < 22.5 || h.leg) return false;
  if (sleeping()) return true;
  if (h.act === 'mission') { const ph = mPhase(h); return ph === 'camp' || ph === 'home' || ph === 'prep' || (ph === 'free' && !(h.mission.ug && hr < 24)); }
  return ['bed', 'slack', 'rest', 'idle', 'home'].includes(h.act); } catch (e) { return false; } }

// ================= v17.17：村子的交通設施、左端景色 =================
Object.assign(BLD_ART, {
  stable(P){ const { W, H } = P, eave = Math.round(H * .38);
    P.wall(3, eave, W - 4, H - 3, '#a8784a', 'wood'); P.roof(1, W - 2, 4, eave - 1, '#7a4a32', { top:.3 });
    const dx = Math.round(W / 2) - 9; P.rect(dx, eave + 6, dx + 18, H - 3, '#3a2a1e'); P.rect(dx + 2, H - 9, dx + 16, H - 3, '#d8b860'); P.set(dx + 4, H - 10, '#e8cc78'); P.set(dx + 11, H - 11, '#e8cc78');   // 敞開的門、乾草
    P.line(dx, eave + 6, dx + 18, H - 3, '#6a4428'); P.line(dx + 18, eave + 6, dx, H - 3, '#6a4428');
    P.rect(5, H - 8, 11, H - 4, '#c8a060'); P.win(W - 12, eave + 5, 6, 5, '#6a4428', { sill:false }); },
  station(P){ const { W, H } = P, eave = Math.round(H * .4);
    P.wall(4, eave, W - 5, H - 3, '#e8dcc0', 'plaster'); P.roof(1, W - 2, 6, eave - 1, '#3f6ea0', { top:.25 });
    P.sign(Math.round(W / 2) - 9, eave + 3, 19, 8, '#f2e2b0'); P.rect(Math.round(W / 2) - 6, eave + 5, Math.round(W / 2) + 4, eave + 8, '#3f6ea0'); P.set(Math.round(W / 2) + 6, eave + 7, '#8a5a3a');
    P.win(7, eave + 13, 7, 7, '#2f4f78'); P.door(W - 12, H - 3, 9, 13, '#2f4f78'); P.rect(8, H - 6, 20, H - 5, '#8a5a3a'); },
  telepad(P){ const { W, H } = P, cx = W / 2 - .5;
    P.ell(cx, H - 7, W / 2 - 1, 6, '#8a8f9e'); P.ell(cx, H - 8, W / 2 - 4, 4, '#a8aebc'); P.ell(cx, H - 8, W / 2 - 8, 2, 'W');
    for (let k = 0; k < 6; k++) P.set(cx + Math.cos(k) * (W / 2 - 5), H - 8 + Math.sin(k) * 3, 'Wh');
    [3, W - 5].forEach(x => { P.rect(x, H - 24, x + 2, H - 7, '#9aa0b0'); P.set(x + 1, H - 25, 'W'); }); },
  lot(P){ const { W, H } = P; P.rect(1, H - 5, W - 2, H - 2, '#8a7a58'); for (let x = 1; x < W - 1; x += 5) P.rect(x, H - 10, x, H - 2, '#8a5a3a'); P.rect(1, H - 9, W - 2, H - 9, '#8a5a3a');
    P.rect(Math.round(W / 2) - 1, H - 22, Math.round(W / 2), H - 8, '#6a4428'); P.sign(Math.round(W / 2) - 8, H - 26, 17, 7, '#f2e2b0'); },
});
// 村子最左邊：一條往前流的河、橋、對岸長著樹的小山坡，最邊邊立一塊村界牌
function drawVilEnd(now){
  try {
    const hw = 180 / cam.z; if (cam.x - hw > 120) return;
    ctx.fillStyle = '#7fae68'; ctx.beginPath(); ctx.ellipse(18, 104, 44, 30, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#6f9a48'; ctx.fillRect(0, 92, 52, 78);
    drawBld(ctx, 'tree', 2, 70, 22, 32, 'day'); drawBld(ctx, 'tree', 20, 78, 20, 28, 'day');
    ctx.fillStyle = '#3d6f9e'; ctx.fillRect(56, 92, 34, 78); ctx.fillStyle = '#5a8cc0'; ctx.fillRect(60, 92, 26, 78);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 7; i++) { const y = 94 + ((i * 13 + now / 40) % 74); ctx.fillRect(62 + (i * 7) % 20, y, 5, 1.5); }
    ctx.fillStyle = '#8a5a3a'; ctx.fillRect(52, 124, 42, 32); ctx.fillStyle = '#a8784a'; for (let x = 53; x < 94; x += 5) ctx.fillRect(x, 125, 4, 30);   // 木橋
    ctx.fillStyle = '#6a4428'; ctx.fillRect(52, 120, 42, 2); ctx.fillRect(52, 156, 42, 2); [52, 72, 92].forEach(x => { ctx.fillRect(x, 114, 2, 8); ctx.fillRect(x, 150, 2, 8); });
    ctx.fillStyle = '#6a4428'; ctx.fillRect(30, 118, 2, 14); nameTag(ctx, '村界', 31, 116, 'npc');
  } catch (e) { if (!scnErr++) console.error(e); }
}

// ================= v17.18：事件小窗格（畫面正中央演幾秒） =================
// 勇者進屋、看不到人、或在屋裡時有村民來訪，就在畫面中央開一個小窗格演 4.5 秒，演完自動收起；點一下可提早收起。
const PIP = { q:[], ep:null, k:null, t0:0, hid:null, box:null, boxT:0 }, PIP_EP_MS = 4500;
const pipHurt = h => h.act === 'bed' || (h.bedDays || 0) > 0;
const pipTired = h => !pipHurt(h) && (h.hp < .4 || h.stress > 70);
function pipCtx(h){
  if (!h || ['dead', 'retired', 'left', 'dying'].includes(h.act)) return null;
  const hr = hourOf(), m = h.mission;
  if (h.act === 'mission' && m) {
    if (m.ag === 'spy') return { k:'spy' };
    if (m.ug && hr >= 20 && hr < 24) return { k:'ug' };
    if (m.ag === 'banquet' && hr >= 20 && hr < 24) return { k:'banquet' };   // v17.90
    if (mPhase(h) === 'camp' && isAsleep()) return { k:'camp', sig:'c' + (h.mood >= 70 ? 2 : h.mood < 35 ? 0 : 1) };
  }
  if (h.act === 'private') return { k:'private' };
  if (h.act === 'visit') return { k:'visit' };
  if (h.act === 'gone') return { k:'gone' };
  if (heroMap(h) !== 'vil' || !V.inside) return null;
  const sig = [h.house ? 1 : 0, h.married ? 1 : 0, h.child ? 1 : 0, pipHurt(h) ? 1 : pipTired(h) ? 2 : 0, h.mood >= 70 ? 2 : h.mood < 35 ? 0 : 1].join('');
  if (V.inside === 'home') return { k:isAsleep() ? 'sleep' : lzAt2(h, 'read') ? 'read' : 'home', sig };
  if (V.inside === 'clinic') return { k:m && m.ag === 'trial' ? 'trial' : 'clinic', sig };
  return { k:V.inside, sig };
}
function pipPush(c){ if (offline) return; PIP.q.push({ ...c, at:performance.now() }); if (PIP.q.length > 3) PIP.q.shift(); }
// v17.18.1：小窗格一直開著，直到勇者的這個動作結束；村民來訪的小插曲插播 4.5 秒
function pipTick(now){
  const h = H(), c = pipCtx(h), k = c ? c.k : null;
  if (k !== PIP.k) { PIP.k = k; PIP.t0 = now; PIP.hid = null; }
  if (PIP.ep && now - PIP.ep.t0 > PIP_EP_MS) PIP.ep = null;
  if (!PIP.ep) { while (PIP.q.length && now - PIP.q[0].at > 30000) PIP.q.shift(); const e = PIP.q.shift(); if (e) PIP.ep = { ...e, t0:now }; }
  if (PIP.ep) return PIP.ep;
  return c && PIP.hid !== k ? { ...c, t0:PIP.t0 } : null;
}
// 點一下：這次的動作先收起來（動作換了會再出現）
function pipHit(){ if (!PIP.shown) return false; if (PIP.ep) PIP.ep = null; else PIP.hid = PIP.k; PIP.shown = false; return true; }
// 小窗格的位置：避開左上角的勇者名牌和下方的狀態列，放在中間剩下的空間
function pipBox(now){
  if (PIP.box && now - PIP.boxT < 500) return PIP.box;
  let top = 8, bot = SH - 8;
  try { const r = cv.getBoundingClientRect(), u = 360 / r.width, cap = $('cap'), act = document.querySelector('#mapw .act');
    if (cap) { const q = cap.getBoundingClientRect(); if (q.height) top = Math.max(top, (q.bottom - r.top) * u + 6); }
    if (act) { const q = act.getBoundingClientRect(); if (q.height) bot = Math.min(bot, (q.top - r.top) * u - 6); } } catch (e) {}
  const k = Math.max(.5, Math.min(1, (bot - top) / 136, 340 / 206));
  PIP.box = { k, cy:(top + bot) / 2 }; PIP.boxT = now; return PIP.box;
}
// ---- 場景小工具（場景座標 100×54，畫的時候放大 2 倍） ----
function pR(x, y, w, hh, c){ ctx.fillStyle = c; ctx.fillRect(x, y, w, hh); }
function pWin(x, y, w, hh, now, curtain){ const hr = hourOf() % 24, night = hr >= 19 || hr < 6;
  pR(x - 1, y - 1, w + 2, hh + 2, '#3a2a1c'); pR(x, y, w, hh, night ? '#1b2340' : '#8ec6f0');
  if (night) { pR(x + w - 6, y + 2, 4, 4, '#f3e6a6'); if (Math.floor(now / 600) % 2) pR(x + 2, y + 3, 1, 1, '#fff'); } else pR(x + 3, y + 3, 5, 2, '#fff');
  pR(x + w / 2 - .5, y, 1, hh, '#3a2a1c'); if (curtain) { pR(x, y, w / 2, hh, '#8a3a4a'); pR(x + w / 2, y, w / 2, hh, '#7a3242'); } }
function pZ(x, y, now){ const t = Math.floor(now / 500) % 3; ctx.fillStyle = '#cfd8ff'; ctx.font = '6px Cubic11, sans-serif'; ctx.fillText('z', x, y - t); if (t > 0) { ctx.font = '8px Cubic11, sans-serif'; ctx.fillText('Z', x + 4, y - 4 - t); } }
function pBubble(x, y, now, kind){ const b = Math.sin(now / 300) * .8; pR(x, y + b, 12, 9, '#f1ece0'); pR(x - 2, y + 8 + b, 2, 2, '#f1ece0'); pR(x - 4, y + 10 + b, 1, 1, '#f1ece0');
  if (kind === 'heart') { ctx.fillStyle = '#e0607a'; [[3, 2, 2, 2], [7, 2, 2, 2], [2, 3, 8, 2], [3, 5, 6, 1], [4, 6, 4, 1], [5, 7, 2, 1]].forEach(([a, c, w, hh]) => ctx.fillRect(x + a, y + b + c, w, hh)); }
  else { ctx.fillStyle = '#5a6a8a'; ctx.font = '7px Cubic11, sans-serif'; ctx.fillText(kind, x + 3, y + 7 + b); } }
function pShadow(x, y){ pR(x - 6, y - 26, 12, 26, '#0c0c14'); pR(x - 4, y - 32, 8, 7, '#0c0c14'); }
// 床：租屋是破床、自己買的房子是大床；病床白色
function pBed(kind){ if (kind === 'clinic') { pR(8, 34, 48, 4, '#e8eef2'); pR(8, 38, 48, 3, '#9aa4b8'); pR(9, 41, 2, 5, '#9aa4b8'); pR(53, 41, 2, 5, '#9aa4b8'); pR(8, 28, 3, 13, '#b8c2d0'); return; }
  if (kind === 'house') { pR(4, 24, 4, 22, '#7a4a2a'); pR(4, 22, 6, 3, '#9a6a3a'); pR(8, 34, 52, 5, '#8a5a3a'); pR(8, 31, 52, 4, '#b04a5a'); pR(9, 29, 8, 3, '#f4f0e8'); pR(8, 39, 52, 2, '#6a3a22'); pR(9, 41, 2, 5, '#6a3a22'); pR(57, 41, 2, 5, '#6a3a22'); return; }
  pR(8, 35, 42, 4, '#6a4a30'); pR(8, 32, 42, 4, '#7a8a6a'); pR(30, 32, 6, 3, '#a08a5a'); pR(9, 30, 7, 3, '#d8d0c0'); pR(9, 39, 2, 7, '#5a3a22'); pR(47, 39, 2, 5, '#5a3a22'); pR(46, 44, 4, 2, '#8a7a6a'); }
// 勇者躺著（頭在左邊）：受傷纏繃帶、累壞了敷冰毛巾、心情差翻來覆去
function pLie(h, x, y, now, mood){ const toss = mood === 0 && Math.floor(now / 900) % 2;
  drawSprite(ctx, h, x, y, true, now, { moving:false, left:!!toss, expr:pipHurt(h) || pipTired(h) ? 'sick' : mood === 0 ? 'sad' : undefined });
  const hx0 = toss ? x + 5 : x - 12;
  if (pipHurt(h)) { pR(hx0, y - 18, 7, 1.5, '#fff'); pR(hx0 + 2, y - 18, 1, 1.5, '#d04a4a'); }
  else if (pipTired(h)) pR(hx0, y - 19, 7, 2, '#a8d4f0'); }
function pRoom(h, now, sig){ const own = h.house, wall = own ? '#6a5a7a' : '#5a4a3a';
  pR(0, 0, 100, 46, wall); if (own) for (let x = 3; x < 100; x += 8) pR(x, 0, 1, 46, '#76668a'); else { pR(22, 6, 1, 8, '#3a2e24'); pR(23, 13, 1, 6, '#3a2e24'); pR(80, 30, 6, 4, '#6a5a4a'); }
  pR(0, 46, 100, 8, own ? '#6a4a30' : '#4a3628'); if (own) pR(20, 47, 40, 6, '#8a4a4a');
  pWin(68, 8, 18, 13, now); }
// ---- v17.47：屋裡的新畫法（ART.room，design-wip 的 design/rooms/rooms.py）：Kenney Q 版、家具 2 像素粗線 ----
const RM = (n, x, yb) => { if (!ART.room || !ART.room[n]) return; const cv = rideCanvas(n, 'room'); ctx.drawImage(cv, Math.round(x), Math.round(yb) - cv.height); };
const rNight = () => { const hr = hourOf() % 24; return hr >= 19 || hr < 6; };
function rWin(x, y, rent){ RM((rent ? 'winR_' : 'win_') + (rNight() ? 'n' : 'd'), x, y + 18); }
// 家：背景、窗戶、家具（床上沒人）。租屋：破舊、漏水；自己的房子：石牆、大床、掛畫、地毯
function rHome(h, now){
  if (h.house) { RM('bg_house', 0, 54); rWin(74, 8); RM('pic', 34, 22); RM('bed_house', 4, 48); RM('rug', 44, 51); RM('table', 62, 48); RM('mug', 66, 38); }
  else { RM('bg_rent', 0, 54); rWin(74, 8, 1); RM('bed_rent', 6, 48); RM('stool', 50, 48); RM('lamp', 48, 41); RM('bucket', 66, 49);
    const d = Math.floor(now / 83) % 30; if (d < 24) pR(69, 2 + d, 1, 2, '#8cc8ec'); }   // 天花板漏水滴進水桶
  if (h.child) RM('crib', 80, 48); }
// 躺在床上：頭在枕頭、眼睛瞇著，被子從脖子蓋到腳（只露頭）；受傷纏繃帶、累壞了敷冰毛巾
function rLie(h, x, now, blk){ drawSprite(ctx, h, x, 37, true, now, { moving:false, noEmo:true, expr:pipHurt(h) || pipTired(h) ? 'sick' : undefined });
  if (pipHurt(h)) { pR(x - 7, 25, 2, 10, '#f4eee0'); pR(x - 7, 28, 1, 1, '#e84537'); } else if (pipTired(h)) pR(x - 7, 25, 2, 10, '#a8d4f0');
  RM(blk, x + 2, x === 18 ? 43 : 42); }
function rZ(x, y, now){ const k = Math.floor(now / 250) % 3; ctx.fillStyle = '#cfd8ff'; ctx.font = '8px Cubic11, sans-serif'; ctx.fillText('z', x, y + 8 - k); if (k) { ctx.font = '10px Cubic11, sans-serif'; ctx.fillText('Z', x + 6, y + 2 - k); } }
function rClinic(h, now){ RM('bg_clinic', 0, 54); RM('cross', 66, 22); rWin(82, 8); RM('bed_clinic', 8, 48); rLie(h, 18, now, 'blk_clinic'); RM('iv', 46, 48); RM('doctor', 62, 48); }
// ---- 各場景 ----
const PIP_DRAW = {
  sleep(h, now, c){ const mood = h.mood >= 70 ? 2 : h.mood < 35 ? 0 : 1, blk = h.house ? 'blk_house' : 'blk_rent';
    rHome(h, now); rLie(h, 17, now, blk); rZ(24, 12, now);   // v17.48：不再畫另一半（兩個人疊在一起很怪）
    if (mood === 2) pBubble(50, 4, now, 'heart'); else if (mood === 0) pBubble(50, 4, now, '…'); },
  home(h, now){ rHome(h, now); const bob = Math.floor(now / 1000) % 2;
    drawSprite(ctx, h, h.house ? 58 : 38, 47 - bob, false, now, { moving:false, expr:h.mood < 35 ? 'sad' : undefined }); },
  tavern(h, now){ RM('bg_tavern', 0, 54); rWin(80, 8); RM('barkeep', 22, 34); RM('counter', 2, 48); RM('mug', 10, 32); RM('mug', 44, 32); RM('stool', 70, 48); RM('stool', 86, 48);
    const up = Math.floor(now / 1750) % 2; drawSprite(ctx, h, 74, 43, false, now, { moving:false, expr:h.mood < 35 ? 'sad' : 'happy' }); RM('mug', 78, 34 - up * 3); RM('patron', 84, 44);
    if (up) { ctx.fillStyle = '#f3c86a'; ctx.font = '9px Cubic11, sans-serif'; ctx.fillText('♪', 62, 28); } },
  clinic(h, now){ rClinic(h, now); },
  read(h, now){ rHome(h, now); const x = h.house ? 58 : 38; drawSprite(ctx, h, x, 47, false, now, { moving:false, expr:'happy', noEmo:true });   // v17.90：在家看書（書本 8×6）
    const t = Math.floor(now / 2500) % 4 === 3; pR(x + 2, 34, 9, 7, '#3f2631'); pR(x + 3, 35, 7, 5, t ? '#f4eee0' : '#e84537'); pR(x + 4, 35, 5, 5, '#f4eee0'); pR(x + 6, 35, 1, 5, '#8b9bb4'); pR(x + 4, 37, 2, 1, '#8b9bb4'); pR(x + 7, 37, 2, 1, '#8b9bb4');
    if (hx(h, 'O') >= .6 && Math.floor(now / 4000) % 3 === 0) emoAt('想到了', x, 26, now % 4000); },
  banquet(h, now){ pR(0, 0, 100, 41, '#963c46'); for (let x = 6; x < 100; x += 12) pR(x, 0, 1, 40, '#7a2c38'); pR(0, 40, 100, 1, '#f7c94a'); pR(0, 41, 100, 13, '#7a583c'); pR(0, 47, 100, 1, '#644630');   // v17.90：王都晚宴
    [22, 62].forEach(cx => { pR(cx + 10, 0, 1, 5, '#8b9bb4'); pR(cx + 2, 5, 17, 2, '#f7c94a'); [3, 9, 15].forEach(d => { pR(cx + d, 2, 2, 3, '#f4eee0'); if ((Math.floor(now / 300) + d) % 3) pR(cx + d, 1, 1, 1, '#ffc850'); }); });
    RM('mom', 22, 40); RM('dad', 36, 40); RM('patron', 74, 40); drawSprite(ctx, h, 56, 40, false, now, { moving:false, expr:'happy', noEmo:true });
    pR(16, 37, 68, 6, '#f4eee0'); pR(16, 43, 68, 1, '#c0cbdc'); pR(19, 44, 2, 5, '#763b36'); pR(79, 44, 2, 5, '#763b36');
    [24, 42, 64, 78].forEach(x => { pR(x, 31, 1, 6, '#f4eee0'); pR(x, 30, 1, 1, (Math.floor(now / 200) + x) % 2 ? '#ffb43c' : '#ffe08a'); });
    const up = Math.floor(now / 1500) % 2; pR(61, 26 - up * 3, 3, 4, '#c83c50'); pR(61, 25 - up * 3, 3, 1, '#f4eee0'); pR(62, 30 - up * 3, 1, 2, '#f4eee0');
    if (dw(h, 'status') && Math.floor(now / 3000) % 2) emoAt('戀愛', 56, 20, now % 3000); },
  trial(h, now){ rClinic(h, now); RM('stool', 82, 48); RM('flask', 83, 38); const b = Math.floor(now / 250) % 3; pR(87 + b % 2, 22 - b, 1, 1, '#c8f0a0'); pR(86 - b % 2, 20 - b * 2, 1, 1, '#c8f0a0'); },
  // v17.55：第二批改 Kenney Q 版（design/rooms/rooms2.py）；不會動的在背景圖裡，會動的在這裡畫
  office(h, now){ RM('bg_office', 0, 54); rWin(40, 6); drawSprite(ctx, h, 38, 47, false, now, { moving:false }); if (Math.floor(now / 1000) % 2) pR(66, 30, 1, 4, '#3f2631'); },   // 櫃檯小姐在寫字
  camp(h, now){ RM('bg_camp', 0, 54); for (let i = 0; i < 14; i++) if ((Math.floor(now / 500) + i) % 5) pR((i * 37) % 100, (i * 13) % 28, 1, 1, '#ffffff');
    const f = Math.floor(now / 250) % 3; ctx.fillStyle = `rgba(240,160,60,${f % 2 ? .18 : .14})`; ctx.beginPath(); ctx.ellipse(54, 44, 20, 10, 0, 0, 7); ctx.fill(); RM('fire' + f, 52, 50);   // 營火
    drawSprite(ctx, h, 17, 48, true, now, { moving:false, noEmo:true }); RM('bedroll', 18, 53); rZ(18, 22, now); if (h.mood >= 70) pBubble(40, 6, now, 'heart'); },
  spy(h, now){ RM('bg_alley', 0, 54); const peek = Math.floor(now / 1250) % 2; RM('hood', 36, 37 - peek * 2); RM('crate', 30, 48);   // 兜帽身影從木箱後面探頭
    ctx.fillStyle = '#f3c86a'; ctx.font = '11px Cubic11, sans-serif'; ctx.fillText('?', 47, 17 + Math.floor(now / 250) % 2); },
  gone(h, now){ RM('bg_alley', 0, 54); ctx.fillStyle = '#f3c86a'; ctx.font = '11px Cubic11, sans-serif'; ctx.fillText('?', 44, 17 + Math.floor(now / 250) % 2); },
  ug(h, now){ RM('bg_ug', 0, 54); const fl = Math.floor(now / 250) % 7 === 3 ? .4 : 1; ctx.fillStyle = `rgba(240,192,96,${.22 * fl})`; ctx.beginPath(); ctx.moveTo(50, 8); ctx.lineTo(26, 46); ctx.lineTo(74, 46); ctx.fill();   // 吊燈偶爾閃
    drawSprite(ctx, h, 30, 45, false, now, { moving:false }); RM('hooded', 64, 46); RM('ctable', 36, 50); },
  private(h, now){ RM('bg_private', 0, 54); if (Math.floor(now / 1500) % 2) pR(33, 22, 5, 9, '#784050'); },   // 窗簾後面的人影晃一下
  visit(h, now){ RM('bg_visit', 0, 54); for (let i = 0; i < 3; i++) { const k = (Math.floor(now / 250) + i * 3) % 9; pR(34 + Math.floor(k / 3), 6 - k, 3, 3, '#dcdcdc'); }   // 煙囪冒煙
    drawSprite(ctx, h, 58, 45, false, now, { moving:false, expr:'happy' }); RM('dad', 66, 46); RM('mom', 82, 46); RM('picnic', 52, 53);
    const k = Math.floor(now / 250) % 2; [55, 69, 84].forEach(x => { RM('dish', x, 46); pR(x + 3, 39 - k, 1, 1, '#ffffff'); pR(x + 4, 37 - k, 1, 1, '#ffffff'); }); },
  ep(h, now, c){ const room = c.room || 'home'; (room === 'home' ? (H2 => rHome(H2, now)) : PIP_DRAW[room] ? (H2 => PIP_DRAW[room](H2, now)) : (H2 => pRoom(H2, now)))(h);
    if (room === 'home') drawSprite(ctx, h, 50, 47, false, now, { moving:false });
    const n = npc(c.npc); if (n && n.alive) { const k = Math.min(1, (now - c.t0) / 900), x = Math.round(94 - 22 * k); drawSprite(ctx, n, x, 46, false, now, { moving:k < 1, left:true }); if (k >= 1 && c.tag) { ctx.font = '6px Cubic11, sans-serif'; const w = ctx.measureText(c.tag).width + 4; pR(x - w / 2, 4, w, 8, '#f1ece0'); ctx.fillStyle = '#161b27'; ctx.fillText(c.tag, x - w / 2 + 2, 10); } } },
};
function pipCap(h, c){ const n = h.name, p = h.married && h.partner && npc(h.partner), mood = h.mood >= 70 ? 2 : h.mood < 35 ? 0 : 1;
  switch (c.k) {
    case 'sleep': return pipHurt(h) ? `${n}帶著傷睡著了` : pipTired(h) ? `${n}累壞了，額頭敷著冰毛巾` : mood === 0 ? `${n}翻來覆去睡不著` : mood === 2 ? `${n}睡得很甜，好像在做好夢` : `${n}睡得很熟`;   // v17.55：畫面不再畫另一半，說明也不提
    case 'home': return h.act === 'slack' ? `${n}在家耍廢` : `${n}在家休息`;
    case 'tavern': return mood === 0 ? `${n}一個人在酒館喝悶酒` : `${n}在酒館喝一杯`;
    case 'clinic': return `${n}躺在診所的病床上`;
    case 'read': return `${n}在家看書`;
    case 'banquet': return `${n}在王都的貴族晚宴`;
    case 'trial': return `新藥試驗中……${n}有點緊張`;
    case 'office': return `${n}在事務所`;
    case 'camp': return `${n}在野外紮營過夜`;
    case 'spy': return '臥底中，行蹤不明';
    case 'gone': return `${n}不知道去了哪裡`;
    case 'ug': return '地下夜班';
    case 'private': return '私事，不便打擾';
    case 'visit': return `${n}回老家，和家人一起吃飯`;
    case 'ep': { const v = npc(c.npc); return v ? `${v.name}來找${n}${c.tag ? '：' + c.tag : ''}` : `有人來找${n}`; }
  } return ''; }
// 畫在最上層（螢幕座標 360×SH）：地圖變暗，中間一個金框小窗格；動作沒結束就一直開著
function drawPip(now){
  try {
    PIP.shown = false; if (!S || offline) return; const c = pipTick(now); if (!c) return;
    if ($('evp') && $('evp').classList.contains('on')) return;   // 整頁大事件開著時先不畫
    const h = H(), dt = now - c.t0, a = Math.min(1, dt / 250); PIP.shown = true;
    const { k, cy } = pipBox(now), s = k * (.85 + .15 * a), W0 = 200, H0 = 130, bx = 180 - W0 / 2, by = cy - H0 / 2;
    ctx.save(); ctx.globalAlpha = a * .45; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 360, SH); ctx.globalAlpha = a;
    ctx.translate(180, cy); ctx.scale(s, s); ctx.translate(-180, -cy);
    ctx.fillStyle = '#d9b45a'; ctx.fillRect(bx - 3, by - 3, W0 + 6, H0 + 6); ctx.fillStyle = '#2b2238'; ctx.fillRect(bx, by, W0, H0);
    ctx.save(); ctx.beginPath(); ctx.rect(bx, by, W0, 108); ctx.clip(); ctx.translate(bx, by); ctx.scale(2, 2);
    try { (PIP_DRAW[c.k] || PIP_DRAW.home)(h, now, c); } catch (e) { if (!scnErr++) console.error(e); }
    ctx.restore(); ctx.globalAlpha = a;
    ctx.fillStyle = '#1a1424'; ctx.fillRect(bx, by + 108, W0, 22);
    ctx.fillStyle = '#e8dcb0'; ctx.font = '11px Cubic11, sans-serif'; const t = pipCap(h, c); ctx.fillText(t, 180 - ctx.measureText(t).width / 2, by + 123);
    if (c.k === 'ep') { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(bx, by + H0 - 2, W0 * Math.max(0, 1 - dt / PIP_EP_MS), 2); }
    ctx.restore();
  } catch (e) { if (!scnErr++) console.error(e); }
}
// ================= v17.10：委託卡演法、月曆條、平常打怪的作息與收工橫幅 =================
function typeTag(o){
  if (o.ug) return '';
  const t = MSPOT[o.ag] ? '活動' : o.ag === 'spy' ? '臥底' : o.ag === 'exam' ? '考核' : SCN_NAME[scnType(o)] || '';
  return t ? t + ' · ' : '';
}
// 排程的月曆條：參考月曆 App 的月份列＋橫跨好幾格的事件條，今天的月份用金色圓角標出來
const KC = { commute:'#4f9a6a', trip:'#c98a2e', slot:'#3f78b8', night:'#7a5aa8', rest:'#4a5568', busy:'#6a6a7a' };
const KN = { commute:'通勤', trip:'出差', slot:'時段', night:'夜班', rest:'休息' };
function calStrip(h, eta){
  try {
    const N = 12, d0 = S.day, mo0 = d0 % 12, bars = [], warn = [];
    const add = (st, len, n, k, bad) => { if (st >= N || len <= 0) return; const s0 = Math.max(0, st); bars.push({ st:s0, len:Math.min(len - (s0 - st), N - s0), n, k, bad }); };
    if (h.act === 'mission' && h.mission) add(0, Math.max(1, h.actDays), h.mission.n, mKind(h.mission) || 'trip');
    else { const b = (h.bedDays || 0) + (h.visit || 0) + (h.goneDays || 0); if (b > 0) add(0, b, ACT_TXT(h), 'busy'); }
    const tCol = 9 - mo0 + (mo0 > 9 ? 12 : 0), reg = !!(S.tour && S.tour.y === curY() && mo0 <= 9), yCol = 11 - mo0;
    let offersBefore = 0;
    S.queue.forEach((it, i) => { const st = eta[i] - d0, len = estDays(h, it), en = st + len - 1, k = it.kind === 'rest' ? 'rest' : mKind(it) || 'trip';
      const late = !!(it.until && eta[i] > it.until), tour = reg && k !== 'rest' && k !== 'slot' && st <= tCol && en >= tCol;
      if (late) warn.push(`「${it.n}」會趕不上期限（${dueTxt(it.until)}）`);
      if (tour) warn.push(`「${it.n}」會撞到武鬥大會，可能被延後`);
      if (it.kind === 'offer' && en <= yCol) offersBefore++;
      add(st, len, it.n, k, late || tour); });
    const done = yr().mis, need = quotaNeed(), cur = h.act === 'mission' && h.mission && !h.mission.ag && h.actDays - 1 <= yCol ? 1 : 0;
    if (done < need && done + offersBefore + cur < need) warn.push(`年度配額可能不夠：今年完成 ${done}/${need} 件，年底前排到的委託 ${offersBefore + cur} 件`);
    let head = '', marks = '';
    for (let c = 0; c < N; c++) { const mo = (mo0 + c) % 12, y = Math.floor((d0 + c) / 12) + 1;
      head += `<div class="cm${c === 0 ? ' now' : ''}"><i>${mo === 0 || c === 0 ? y + '年' : ''}</i><b>${mo + 1}月</b></div>`;
      const ev = []; if (c === tCol) ev.push(`<span class="ce${reg ? ' on' : ''}">武鬥</span>`); if (c === yCol) ev.push('<span class="ce">結算</span>');
      S.queue.forEach(it => { if (it.until && it.until - d0 === c) ev.push('<span class="ce r">期限</span>'); });
      marks += `<div class="cmk">${ev.join('')}</div>`; }
    const barHtml = bars.map(b => `<div class="cb${b.bad ? ' bad' : ''}" style="grid-column:${b.st + 1} / span ${Math.max(1, b.len)};background:${KC[b.k] || KC.trip}" title="${esc(b.n)}">${esc(b.n)}</div>`).join('');
    const legend = Object.keys(KN).map(k => `<span><i style="background:${KC[k]}"></i>${KN[k]}</span>`).join('');
    return `<style>.cal{margin:4px 0 10px;border:1px solid var(--line);border-radius:12px;padding:8px 6px;background:var(--panel)}.cal .g{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:2px}.cal .cm{text-align:center;font-size:11px;color:var(--muted);line-height:1.15}.cal .cm i{display:block;font-style:normal;font-size:9.5px;height:11px}.cal .cm b{font-weight:500;display:inline-block;padding:1px 3px;border-radius:8px}.cal .cm.now b{background:var(--gold);color:#161b27}.cal .cb{font-size:10.5px;color:#fff;border-radius:6px;padding:3px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:4px;min-height:20px}.cal .cb.bad{outline:2px solid #ff7b7b;outline-offset:-2px}.cal .cmk{text-align:center;min-height:14px;margin-top:3px}.cal .ce{display:inline-block;font-size:9.5px;padding:0 3px;border-radius:5px;background:rgba(255,255,255,.1);color:var(--muted)}.cal .ce.on{background:rgba(242,193,78,.25);color:var(--gold)}.cal .ce.r{background:rgba(255,123,123,.2);color:#ff9a9a}.cal .lg{display:flex;flex-wrap:wrap;gap:8px;font-size:10.5px;color:var(--muted);margin-top:6px}.cal .lg i{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:3px}.cal .wn{font-size:12px;color:#ff9a9a;margin-top:6px;line-height:1.5}</style>`
      + `<div class="cal" aria-label="接下來 12 個月的排程"><div class="g">${head}</div><div class="g">${barHtml || '<div class="k" style="grid-column:1/-1;font-size:11.5px;margin-top:4px">接下來沒有排任何事</div>'}</div><div class="g">${marks}</div><div class="lg">${legend}</div>${warn.map(w => `<div class="wn">● ${esc(w)}</div>`).join('')}</div>`;
  } catch (e) { console.error(e); return ''; }
}
// 平常打怪：記下今天一開始的打倒數，收工時做成小橫幅
function huntMark(h){ if (h.act === 'hunt' && (!S.huntDay || S.huntDay.day !== S.day)) S.huntDay = { day:S.day, k0:h.kills || 0, z:h.zone }; }
function huntBanner(h){ if (offline || !S.huntDay || S.huntDay.day !== S.day) return; const z = ZONES[S.huntDay.z];
  RES = { t:performance.now(), mini:1, ok:true, n:z ? z.n : '', kills:Math.max(0, (h.kills || 0) - S.huntDay.k0), earn:h.earnToday || 0 }; }

// ================= v17.6：任務演出 =================
// 接下委託時就先擲好成敗（preRoll，機率和原本一樣），演出照這個結果走：
// 會成功的一路打到完；會失敗的越打越吃力，最後一段倒下。
// 演出只影響畫面（勇者要走去哪、哪隻怪被打倒），不改變任何數值。
function preRoll(h){ mDur(h); const o = h.mission; if (!o || !o.D || o.win != null) return;
  const r = ratio(h, o.D) * compMul(o.comp); o.win = chance(winP(r)) ? 1 : 0; }
const winOf = (o, p) => o && o.win != null ? !!o.win : chance(p);
// 依委託名稱決定演法
function scnType(o){
  if (o.boss || o.boss2 || o.ag === 'exam') return 'boss';
  if (o.ag === 'herb' || o.ag === 'harvest') return 'search';   // v17.90
  const n = o.n || '';
  if (/護送|出巡|使節/.test(n)) return 'escort';
  if (/救出|救/.test(n) || o.rescue) return 'rescue';
  if (/調查|偵察|潛入|怪事/.test(n)) return 'probe';
  if (/採|找回|尋找|找|奪回|草藥/.test(n)) return 'search';
  if (/守衛|駐守|圍事|守/.test(n) || o.ag === 'border' || o.ag === 'ugGuard') return 'guard';
  return 'slay';
}
const SCN_NAME = { slay:'討伐', escort:'護送', rescue:'救援', probe:'調查', search:'搜尋', guard:'守衛', boss:'魔王戰' };
let SCN = null, scnErr = 0;
const hash01 = s => { let x = 7; for (const ch of String(s)) x = (x * 31 + ch.charCodeAt(0)) % 100003; return (x % 1000) / 1000; };
function scnFrac(h){ return mFrac(h); }
const scnHas = h => h.act === 'mission' && h.mission && !h.mission.ug && h.mission.z >= 0 && !MSPOT[h.mission.ag] && !heroHidden(h) && ZONES[h.mission.z];
function scnOn(h){ return scnHas(h) && (!mKind(h.mission) || mPhase(h) === 'work'); }
// v17.37：任務演出改用和野外打怪同一套：踏步揮擊→命中閃白擊退→倒下壓扁淡出；
// 怪物只站在路面上、互相間隔一格，最多 3 隻，從畫面外走進來；任務名稱有怪名就只出那種，護送、救援出該區雜魚
const MON_NAMES = [['史萊姆', '蜜蜂', '野豬', '稻草人'], ['蘑菇怪', '樹樁怪', '哥布林', '毒蜘蛛'], ['仙人掌怪', '沙蟲', '木乃伊', '禿鷹'], ['石頭精', '蝙蝠', '骷髏礦工', '石魔像'],
  ['章魚', '海星', '魚人', '螃蟹'], ['雪球怪', '冰狼', '雪怪', '冰晶'], ['小惡魔', '惡魔之眼', '黑騎士', '暗黑法師']];   // 照 a、c、b、d 的順序
function scnOnly(o){ const n = o.n || '', L = 'acbd'; let best = null;
  MON_NAMES.forEach((row, z) => row.forEach((w, i) => { if (n.includes(w) && (!best || w.length > best[0].length)) best = [w, 'z' + z + L[i]]; }));
  return best && ART.mon[best[1]] ? best[1] : null; }
const MON_FULL = [['史萊姆', '蜜蜂', '野豬', '稻草人'], ['蘑菇怪', '樹樁怪', '哥布林', '毒蜘蛛'], ['仙人掌怪', '沙蟲', '木乃伊', '禿鷹'], ['水晶石頭精', '洞窟蝙蝠', '骷髏礦工', '石魔像'],
  ['章魚寶寶', '海星', '魚人', '大螃蟹'], ['雪球怪', '冰狼', '雪怪', '冰晶元素'], ['小惡魔', '惡魔之眼', '黑騎士', '暗黑法師']];   // 狀態列顯示用的全名
const SCN_Y0 = 127, SCN_Y1 = 133;   // 怪物腳底的範圍（路面中間，和野外打怪一樣）
function scnMake(h){
  const o = h.mission, z = o.z, [x0, y0, x1, y1] = ZONES[z].rect, t = scnType(o), a = hash01(o.n), b = hash01(o.n + 'y');
  const sx = x0 + (x1 - x0) * (.3 + .4 * a), sy = SCN_Y0 + (SCN_Y1 - SCN_Y0) * b, d = Math.max(1, o.days || 1);
  const s = { key:(o.id || 0) + '|' + o.n, t, z, sx, sy, mob:o.boss ? 'boneking' : o.boss2 ? 'abyss' : zoneMon(z), mobs:[], kills:0, found:0, pts:[], R:[x0, y0, x1, y1], side:1, rt:0 };
  s.only = t === 'boss' ? null : scnOnly(o); s.trash = !s.only && (t === 'escort' || t === 'rescue');
  s.total = { slay:Math.min(14, 3 * d + 2), guard:Math.min(16, 3 * d + 3), escort:2 * d, rescue:3, probe:d, search:0, boss:1 }[t];
  if (t === 'search' || t === 'probe') { const k = t === 'search' ? 2 * d + 1 : d + 1; for (let i = 0; i < k; i++) s.pts.push([clamp(sx + Math.cos(i * 2.3 + a * 6) * (18 + i * 6), x0 + 10, x1 - 10), clamp(sy + Math.sin(i * 2.3 + a * 6) * 6, 124, 140)]); }
  if (t === 'escort') { s.p0 = [x0 + 14, sy + 6]; s.p1 = [x1 - 14, sy + 6]; }
  s.elite = s.examiner = o.ag === 'exam'; s.fav = o.favor || null; s.work = o.ag === 'herb' || o.ag === 'harvest' ? o.ag : null;
  if (o.boss || o.boss2) s.sx = x1 - 70;   // v17.11：魔王在區域盡頭
  s.prop = o.ag === 'harvest' || /田|農/.test(o.n) ? 'field' : /遺跡|調查|偵察/.test(o.n) ? 'ruins' : /沉船/.test(o.n) ? 'wreck' : /礦/.test(o.n) ? 'mine' : null;
  return s;
}
// 進度：照時間走；會失敗的最多做到七成
function scnWant(s, h, total){ const f = scnFrac(h), lose = h.mission.win === 0; return Math.floor(Math.min(f, lose ? .7 : 1) * total + (lose ? 0 : f >= .97 ? 1 : 0)); }
// 補怪：從畫面外（勇者左右約 100 格）走進來；守衛兩側輪流、護送從前面、其他多半從前面
function scnSpawn(s, h, now){ const [x0, , x1] = s.R, hx = h.x; let d;
  if (s.t === 'guard') d = s.side = -s.side;
  else if (s.t === 'escort') d = 1;
  else if (s.t === 'probe') { const p = s.pts[Math.min(s.found, s.pts.length - 1)]; d = p[0] >= hx ? 1 : -1; }
  else d = Math.random() < .65 ? 1 : -1;
  let x = hx + d * rand(92, 104); if (x > x1 - 8 || x < x0 + 8) { d = -d; x = hx + d * rand(92, 104); } x = clamp(x, x0 + 8, x1 - 8);
  const type = s.only || (s.trash ? zoneMon(s.z) + (Math.random() < .57 ? 'a' : 'c') : zoneMon(s.z));
  s.mobs.push({ x, y:rand(SCN_Y0, SCN_Y1), born:now, ph:Math.random() * 6, type, vx:0 }); }
const scnGap = s => monHalf(s.mob) + 13;   // 勇者和怪物中間留的距離（v17.34）
function scnTick(dt, now){
  try {
    const h = H(); if (!scnHas(h)) { SCN = null; return; }
    const o = h.mission, key = (o.id || 0) + '|' + o.n; if (!SCN || SCN.key !== key) SCN = scnMake(h);
    if (!scnOn(h)) { SCN.off = 1; return; } SCN.off = 0;   // v17.7：收工、紮營時演出暫停
    const s = SCN, f = scnFrac(h), lose = o.win === 0, run = !S.paused; s.f = f; s.down = lose && f > .86;
    s.mobs = s.mobs.filter(m => !m.kt || now - m.kt < (m.boss ? 2700 : 1150));   // v17.45：魔王倒得久一點
    const alive = s.mobs.filter(m => !m.kt), hx = h.x, hy = h.y, gap = scnGap(s);
    // 護送：貨車照進度往前走
    if (s.t === 'escort') s.cart = [s.p0[0] + (s.p1[0] - s.p0[0]) * Math.min(f, lose ? .75 : 1), s.p0[1]];
    // 救援：前半段打倒看守的怪，後半段帶人走回入口
    if (s.t === 'rescue') { s.phase = f < .5 ? 0 : 1; if (s.phase) { const k = Math.min(1, (f - .5) * 2), e = [s.R[0] + 12, s.sy]; s.vic = [s.sx + (e[0] - s.sx) * k - 14, s.sy]; } else s.vic = [s.sx + 30, s.sy]; }
    // 怪物：需要的時候補上，最多同時 3 隻
    const want = s.t === 'search' ? 0 : s.t === 'boss' ? 1 : scnWant(s, h, s.total), cap = s.t === 'boss' ? 1 : 3;
    if (s.t === 'boss') { if (!s.mobs.length && !s.kills) s.mobs.push({ x:s.sx + 14, y:s.sy, ph:0, boss:1, type:s.mob, vx:0 }); s.bossHp = lose ? 1 - Math.min(f, .86) * .75 : 1 - f; }
    else if (s.t !== 'search' && run && s.kills + alive.length < s.total && alive.length < cap && (s.kills < want || alive.length === 0) && !(s.t === 'rescue' && s.phase) && now - (s.spT || 0) > 700) { scnSpawn(s, h, now); s.spT = now; }
    // 站位：勇者兩側各排一列，最靠近的那隻走到勇者面前，後面的每隻再隔 24 排隊，不會疊在一起
    if (s.t !== 'boss') [-1, 1].forEach(d => { s.mobs.filter(m => !m.kt && (m.x >= hx ? 1 : -1) === d).sort((a, b) => Math.abs(a.x - hx) - Math.abs(b.x - hx)).forEach((m, k) => {
      const w = clamp(hx + d * (gap + 24 * k), s.R[0] + 8, s.R[2] - 8), dx = w - m.x, sp = (now - (m.born || 0) < 2500 ? 16 : 10) * (run ? dt : 0);
      m.vx = Math.abs(dx) > .6 ? Math.sign(dx) : 0; if (m.vx) m.x += Math.sign(dx) * Math.min(Math.abs(dx), sp); }); });
    // 鎖定最近的一隻
    const live = s.mobs.filter(m => !m.kt), tg = live.sort((a, b) => Math.abs(a.x - hx) - Math.abs(b.x - hx))[0] || null;
    s.tg = tg;
    // 每回合（約 1 秒）：勇者揮一次；進度到了這一下就打倒；越危險越常被反擊
    const reach = tg && Math.abs(Math.abs(hx - tg.x) - gap) < 6 && Math.abs(hy - (tg.y + 4)) < 6 && !(tg.born && now - tg.born < 500);
    const di = danger(ratio(h, o.D || 1) * compMul(o.comp)).i, rate = Math.min(.85, [.15, .45, .9][di] + (lose ? .4 : 0));
    if (reach && run && !s.down && now - s.rt > (s.kills < want - 1 ? 900 : 1150)) { s.rt = now;
      const kill = s.t === 'boss' ? !lose && f >= .965 : s.kills < want, hurt = !kill && Math.random() < rate;
      s.rn = (s.rn || 0) + 1;
      // v17.45：魔王每 3～4 回合蓄力一次（越危險越常）：1.3 秒蓄力 → 衝過來反擊，傷害加倍
      if (s.t === 'boss' && !kill && s.rn % [4, 3, 3][di] === 0) { s.fx = { t:now, tg, kill:0, hurt:1, charge:1, dmg:(di + 1 + (lose ? 1 : 0)) * 2 }; s.rt = now + 1300; }
      else { s.fx = { t:now, tg, kill, hurt, dmg:di + 1 + (lose ? 1 : 0) }; if (kill) { tg.kt = now; s.kills++; s.bossKt = s.t === 'boss' ? now : 0; } } }
    // 搜尋／調查：一個點一個點找
    if (s.t === 'search' || s.t === 'probe') s.found = Math.min(s.pts.length, Math.floor(Math.min(f, lose ? .7 : 1) * s.pts.length + (f >= .97 && !lose ? 1 : 0)));
  } catch (e) { if (!scnErr++) console.error(e); SCN = null; }
}
const scnFxOn = (h, now, dur = 1.2) => SCN && !SCN.off && SCN.fx && h && h.act === 'mission' && now - SCN.fx.t < (SCN.fx.charge ? 2.3 : dur) * 1000 ? SCN.fx : null;
// 任務中勇者要面向哪隻怪
function scnFoe(h, now){ const s = SCN; if (!s || s.off || !h || h.act !== 'mission') return null; const fx = scnFxOn(h, now); if (fx) return fx.tg;
  return s.tg && !s.tg.kt && Math.abs(s.tg.x - h.x) < 40 ? s.tg : null; }
// 給模擬用：勇者現在要往哪走（只影響畫面上的位置）
function scnGoal(h){
  const s = SCN; if (!s || s.off || !scnOn(h)) return null; if (s.down) return [h.x, h.y, 0];
  const tg = s.tg && !s.tg.kt && !(s.tg.born && performance.now() - s.tg.born < 400) ? s.tg : null, fx = scnFxOn(h, performance.now(), 1.1);
  if (fx && fx.kill) return [h.x, h.y, 0];   // 打倒的那隻倒下時先站著
  if (tg && Math.abs(tg.x - h.x) < 70) { const sd = h.x > tg.x ? 1 : -1; return [tg.x + sd * scnGap(s), tg.y + 4, 1]; }   // v17.34：和怪物保持距離，不重疊
  if (s.t === 'escort') return [s.cart[0] + 16, s.cart[1], 0];
  if (s.t === 'rescue') return s.phase ? [s.vic[0] - 12, s.vic[1] + 4, 0] : [s.sx, s.sy + 4, 0];
  if (s.t === 'guard') return [s.sx, s.sy + 4, 0];
  if ((s.t === 'search' || s.t === 'probe') && s.found < s.pts.length) { const p = s.pts[s.found]; return [p[0] - 6, p[1] + 2, 0]; }
  return [s.sx, s.sy + 4, 0];
}
// 在地圖上畫演出（勇者以外的部分）
function drawScene(now, view){
  try {
    const s = SCN; if (!s || s.off || ZONES[s.z].map !== view) return;
    if (s.prop && s.z <= 2 && ART.wild && (s.prop === 'field' || s.prop === 'ruins')) drawRideSpr(ctx, s.prop === 'field' ? 'field' : 'pillar', s.sx, V_ROAD - 2, false);   // v17.40：新風格
    else if (s.prop) drawBld(ctx, s.prop, s.sx - 22, V_ROAD - 31, 44, 30, 'day');   // 田、遺跡等放在路邊，不擋路
    if (s.work) { const h0 = H(); s.pts.forEach((p, i) => { const [x, y] = [Math.round(p[0]), Math.round(p[1])];   // v17.90：藥草／稻子
        if (s.work === 'herb') { if (i < s.found) return; pR2(x, y - 4, 1, 4, '#25956a'); pR2(x - 1, y - 3, 1, 1, '#43e1b3'); pR2(x + 1, y - 4, 1, 1, '#43e1b3'); pR2(x, y - 5, 1, 1, '#f078c8'); }
        else if (i < s.found) { pR2(x - 2, y - 8, 5, 8, '#3f2631'); pR2(x - 1, y - 7, 3, 6, '#e8c45a'); pR2(x - 1, y - 4, 3, 1, '#8a5a3a'); }
        else for (let k = -2; k <= 2; k++) { pR2(x + k * 2, y - 7, 1, 7, '#deb650'); pR2(x + k * 2, y - 8, 1, 1, '#fadc78'); } });
      if (!h0.leg) { const bx = Math.round(h0.x) + 8, by = Math.round(h0.y); pR2(bx - 1, by - 6, 9, 6, '#3f2631'); pR2(bx, by - 5, 7, 4, '#c8964f'); pR2(bx, by - 3, 7, 1, '#a0703a'); if (s.found) pR2(bx + 1, by - 6, 5, 1, s.work === 'herb' ? '#43b45a' : '#fadc78'); } }
    else if (s.t === 'search' || s.t === 'probe') s.pts.forEach((p, i) => { if (i < s.found) { ctx.fillStyle = 'rgba(111,207,151,.9)'; ctx.fillRect(p[0] - 1, p[1] - 3, 3, 3); return; }
      const a = .5 + .5 * Math.sin(now / 220 + i); ctx.fillStyle = s.t === 'probe' ? `rgba(159,208,255,${a})` : `rgba(255,240,170,${a})`;
      ctx.fillRect(p[0] - 1, p[1] - 5, 2, 6); ctx.fillRect(p[0] - 3, p[1] - 3, 6, 2);
      if (s.t === 'probe' && i === s.found) { ctx.font = fz(9) + 'px Cubic11, sans-serif'; ctx.fillStyle = '#9fd0ff'; ctx.fillText('?', p[0] - 2, p[1] - 9 - Math.sin(now / 300) * 1.5); } });
    if (s.t === 'escort' && s.cart && !s.fav) drawBld(ctx, 'cart', s.cart[0] - 12, s.cart[1] - 16, 24, 18, 'day');
    if (s.examiner) { pxPerson(s.sx - 34, s.sy, '#3f6ea0', 2, now); ctx.fillStyle = '#5a4a3a'; ctx.fillRect(s.sx - 29, s.sy - 16, 1, 16); ctx.fillStyle = '#f2c14e'; ctx.fillRect(s.sx - 28, s.sy - 16, 5, 3); }   // 公會考官
    if (s.fav) { const n = npc(s.fav); if (n && n.alive) { const p = s.t === 'escort' && s.cart ? [s.cart[0] - 2, s.cart[1] + 2] : [s.sx - 22, s.sy + 2]; drawSprite(ctx, n, p[0], p[1], false, now, { moving:s.t === 'escort' && !s.down, left:false }); } }   // 拜託的村民
    if (s.t === 'rescue' && s.vic) { const [x, y] = s.vic; ctx.fillStyle = '#59a8ff'; ctx.fillRect(x - 3, y - 10, 6, 7); ctx.fillStyle = '#e8b98a'; ctx.fillRect(x - 2, y - 14, 5, 4); ctx.fillStyle = '#4a2a1a'; ctx.fillRect(x - 2, y - 15, 5, 1);
      if (!s.phase && Math.floor(now / 400) % 2) { ctx.fillStyle = '#fff'; ctx.font = fz(9) + 'px sans-serif'; ctx.fillText('!', x + 4, y - 14); } }
    if (s.t === 'guard') { ctx.fillStyle = '#5a4a3a'; ctx.fillRect(s.sx + 10, s.sy - 18, 1, 18); ctx.fillStyle = '#f2c14e'; ctx.fillRect(s.sx + 11, s.sy - 18, 6, 4); }
    const h = H(), fx = scnFxOn(h, now);
    s.mobs.slice().sort((a, b) => a.y - b.y).forEach(m => { let kind = 'idle', f = Math.floor(now / (m.vx ? 150 : 240) + m.ph) % 4, dx = 0, a = 1;
      const left = m.vx && !m.kt ? m.vx < 0 : h.x < m.x, d = left ? 1 : -1;   // 走路時面向前進方向，其他時候面向勇者
      if (m.born) { a = Math.min(1, (now - m.born) / 400); if (a >= 1 && now - m.born > 2500) m.born = 0; }
      let sq = 1;
      if (m.kt && m.boss) { const p = (now - m.kt) / 1000;   // v17.45：魔王倒下：閃三下＋抖 → 慢慢跪下 → 壓扁淡出
        if (p > .3 && p < 1) { kind = Math.floor((p - .3) / .117) % 2 ? 'idle' : 'hurt'; f = 1; dx = d * 2 + (Math.floor(now / 50) % 2 ? 1 : -1); }
        else if (p >= 1 && p < 1.6) { dx = d * 2; sq = 1 - (p - 1) / .6 * .45; }
        else if (p >= 1.6) { kind = 'down'; f = 0; dx = d * 2; a = Math.max(0, 1 - (p - 1.6) / .9); } }
      else if (m.kt) { const p = (now - m.kt) / 1000;   // 被打倒：命中閃白、擊退、壓扁淡出（和野外打怪一樣）
        if (p > .3 && p < .45) { kind = 'hurt'; f = 1; dx = d * 2; } else if (p >= .45) { kind = 'down'; f = 0; dx = d * 3; a = Math.max(0, 1 - (p - .45) / .65); } }
      else if (fx && fx.tg === m && fx.charge) { const p = Math.max(0, now - fx.t) / 1000;   // v17.45：蓄力 → 反擊
        if (p < 1.3) { dx = d * Math.round(2 * Math.min(1, p * 3)); kind = Math.floor(now / 100) % 2 ? 'glow' : 'idle'; f = Math.floor(now / 125) % 2 ? 1 : 0;
          const gc = m.type === 'abyss' || s.mob === 'abyss' ? '192,48,42' : '170,80,255', r = monHalf(m.type || s.mob) + 4 + Math.sin(now / 70) * 2;
          ctx.fillStyle = `rgba(${gc},${.25 + .3 * p})`; ctx.beginPath(); ctx.ellipse(m.x + dx, m.y + 4, r, 4.5, 0, 0, 7); ctx.fill();
          ctx.fillStyle = m.type === 'abyss' || s.mob === 'abyss' ? '#ff9a8a' : '#dcaaff';
          for (let i = 0; i < 6; i++) { const ang = i * 1.05 + now / 330, rr = 20 * (1 - ((p * 3 + i / 6) % 1)); ctx.fillRect(m.x + dx + Math.cos(ang) * rr - .5, m.y - 8 + Math.sin(ang) * rr * .6 - .5, 1, 1); }
        }
        else if (p < 2.2) { dx = -d * [0, 6, 10, 10, 8, 5, 3, 1, 0][Math.min(8, Math.floor((p - 1.3) / .1))]; } }
      else if (fx && fx.tg === m) { const p = Math.max(0, now - fx.t) / 1000;
        if (p > .3 && p < .55) { kind = 'hurt'; f = p < .42 ? 1 : 0; dx = d * 2; }
        else if (fx.hurt && p > .65 && p < .9) { kind = 'attack'; f = Math.min(2, Math.floor((p - .65) / .08)); } }
      if (a <= 0) return;
      ctx.globalAlpha = a; drawMonster(ctx, m.type || s.mob, m.x + dx, m.y + 4, kind, f, !!(s.elite && m.boss), left, m.ph, sq); ctx.globalAlpha = 1; });
    if (s.t === 'boss' && s.mobs[0] && !s.mobs[0].kt) { const m = s.mobs[0], w = 28, by = m.y + 4 - monH(s.mob) - 5; ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(m.x - w / 2, by, w, 3); ctx.fillStyle = '#ff7b7b'; ctx.fillRect(m.x - w / 2, by, w * clamp(s.bossHp, 0, 1), 3);   // v17.45：血條在頭上，寬 28
      if (fx && fx.charge && fx.tg === m && now - fx.t < 1300) { ctx.font = fz(10) + 'px Cubic11, sans-serif'; ctx.fillStyle = 'rgba(16,20,30,.8)'; ctx.fillText('!', m.x - 1, by - 2); ctx.fillStyle = '#ff5a5a'; ctx.fillText('!', m.x - 2, by - 3); } }   // 蓄力時頭上的「！」
    if (s.bossKt && s.mobs[0] && s.mobs[0].kt) { const p = (now - s.bossKt) / 1000, m = s.mobs[0]; if (p > 1.6 && p < 2.7) { ctx.globalAlpha = Math.min(1, (2.7 - p) / .3); nameTag(ctx, '打倒了！', m.x, m.y - 14 - Math.min(4, (p - 1.6) * 10), 'hero'); ctx.globalAlpha = 1; } }
  } catch (e) { if (!scnErr++) console.error(e); }
}
// 勇者腳下的血條、被打中的傷害數字（進度數字在下方狀態列）
function drawScnHero(now, hx, hy){
  try {
    const s = SCN, h = H(); if (!s || s.off) return;
    const lose = h.mission.win === 0, di = danger(ratio(h, h.mission.D || 1) * compMul(h.mission.comp)).i, fx = scnFxOn(h, now);
    let hp = lose ? 1 - .9 * Math.min(s.f / .86, 1) : 1 - .35 * s.f * di / 2;
    const hT = fx && fx.charge ? 1450 : 720;
    if (fx && fx.hurt && now - fx.t < hT) hp += fx.charge ? .08 : .04;   // 血條等怪物打到才掉
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(hx - 12, hy + 4, 24, 3); ctx.fillStyle = hp > .5 ? '#6fcf97' : hp > .25 ? '#ffb347' : '#ff7b7b'; ctx.fillRect(hx - 12, hy + 4, 24 * clamp(hp, 0, 1), 3);
    if (fx && fx.hurt) { const k = (now - fx.t - hT) / 700; if (k >= 0 && k < 1) { ctx.globalAlpha = 1 - k; ctx.fillStyle = '#ff7b7b'; ctx.font = fz(fx.charge ? 12 : 9) + 'px Cubic11, sans-serif'; ctx.fillText('-' + fx.dmg, hx + 6, hy - 20 - k * 10); ctx.globalAlpha = 1; } }
  } catch (e) { if (!scnErr++) console.error(e); }
}
// 地圖下方的任務小卡（螢幕座標，畫在夜色之後）
// 村子裡的事務所任務：在街上演
function drawVilShow(now){
  try {
    const h = H(); if (h.act !== 'mission' || !h.mission || !MSPOT_B[h.mission.ag] || heroMap(h) !== 'vil' || mPhase(h) !== 'slot') return;
    const ag = h.mission.ag, bx = VD[MSPOT_B[ag]];
    const person = (x, y, c, k) => { const b = Math.round(Math.sin(now / 260 + k) * 1); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x - 3, y, 7, 1); ctx.fillStyle = c; ctx.fillRect(x - 3, y - 7 + b, 6, 7); ctx.fillStyle = ['#e8b98a', '#c8966a', '#f0c8a0'][k % 3]; ctx.fillRect(x - 2, y - 11 + b, 5, 4); ctx.fillStyle = ['#4a2a1a', '#2a2a30', '#8a5a2a', '#c8a040'][k % 4]; ctx.fillRect(x - 2, y - 12 + b, 5, 2); };
    const cols = ['#c0563f', '#3f6ea0', '#5a9a5a', '#c87aa0', '#d8a02e', '#7a6ac0'];
    if (ag === 'endorse' || ag === 'variety' || ag === 'meet') plazaShow(now, ag);   // v17.51
    if (ag === 'arena') arenaShow(now, 'arena');   // v17.49
    if (ag === 'coach') arenaShow(now, 'coach');   // v17.90
    if (ag === 'charity') plazaShow(now, 'charity');
    if (ag === 'smith') smithShow(now);
  } catch (e) { if (!scnErr++) console.error(e); }
}
// 演出用的小東西
Object.assign(BLD_ART, {
  field(P){ const { W, H } = P; for (let r = 0; r < 5; r++) { const y = 6 + r * 5; P.rect(1, y, W - 2, y + 2, '#8a6a3a'); for (let x = 3; x < W - 3; x += 4) { P.set(x, y - 1, '#6fbf5a'); P.set(x, y - 2, '#4f9a3a'); } } P.rect(0, 2, 0, H - 1, '#a8875e'); P.rect(W - 1, 2, W - 1, H - 1, '#a8875e'); for (let x = 0; x < W; x += 5) P.set(x, 2, '#a8875e'); },
  ruins(P){ const { W, H } = P; P.rect(4, 8, 10, H - 1, '#b0a890'); P.rect(4, 6, 11, 8, '#c8c0a8'); P.rect(W - 12, 16, W - 6, H - 1, '#b0a890'); P.rect(W - 13, 14, W - 5, 16, '#c8c0a8'); P.rect(16, H - 6, 30, H - 1, '#9a9280'); P.set(20, H - 7, '#9a9280'); P.rect(6, 12, 6, 16, '#8a8270'); P.set(W - 9, 20, '#8a8270'); },
  wreck(P){ const { W, H } = P; P.poly([[2, H - 12], [W - 3, H - 16], [W - 8, H - 2], [6, H - 2]], '#7a5a3a'); P.rect(6, H - 9, W - 9, H - 9, '#5a3a22'); P.rect(Math.round(W / 2), 2, Math.round(W / 2) + 1, H - 14, '#5a4a3a'); P.poly([[Math.round(W / 2) + 2, 4], [Math.round(W / 2) + 12, 10], [Math.round(W / 2) + 2, 14]], '#d8d0c0'); },
  cart(P){ const { W, H } = P; P.rect(2, 3, W - 3, H - 7, '#a8784a'); P.rect(2, 3, W - 3, 4, '#c89a5a'); P.rect(4, 0, W - 5, 2, '#e8dcc0'); P.ell(6, H - 4, 3, 3, '#5a4a3a'); P.ell(W - 7, H - 4, 3, 3, '#5a4a3a'); P.set(6, H - 4, '#c8b090'); P.set(W - 7, H - 4, '#c8b090'); },
  sign(P){ const { W, H } = P; P.rect(2, 0, W - 3, H - 6, '#f2e2b0'); P.rect(2, 0, W - 3, 1, '#c89a5a'); P.ell(W / 2 - .5, (H - 6) / 2, 3, 3, '#f2c14e'); P.set(W / 2 - 1, (H - 6) / 2 - 1, '#fff6d0'); P.rect(4, H - 6, 4, H - 1, '#6a4428'); P.rect(W - 5, H - 6, W - 5, H - 1, '#6a4428'); },
});
function drawBubble(t, x, y){
  ctx.font = '11px Cubic11, sans-serif';
  const w = ctx.measureText(t).width + 12, bx = clamp(x - w / 2, 2, 358 - w);
  ctx.fillStyle = '#f1ece0'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, y - 16, w, 18, 8) : ctx.rect(bx, y - 16, w, 18); ctx.fill();
  ctx.fillRect(clamp(x - 2, bx + 4, bx + w - 8), y + 2, 4, 3);
  ctx.fillStyle = '#161b27'; ctx.fillText(t, bx + 6, y - 3);
}
function drawFace(c, force, roomy){
  if (!c) return; const h = H(); if (!h) return;
  const e = typeof force === 'string' ? force : force === -1 ? 'nervous' : exprOf(h);
  const N = roomy ? 48 : 32, fy = roomy ? 16 : 0;   // v17.48：roomy（大事件的大頭像）：臉放左下、表情泡泡放右上，不蓋到臉
  if (c.width !== N) { c.width = N; c.height = N; }
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, N, N); g.drawImage(kenCanvas(h, 'idle', 0, e), KEN_OX, KEN_OY + 1, 16, 16, 0, fy, 32, 32);
  const nm = e !== 'normal' && EMO_OF[e]; if (nm) { const s = emoStrip(nm); if (s) { const i = s.e.n > 1 ? ART_STILL(s) : 0; g.drawImage(s.cv, i * s.e.w, 0, s.e.w, s.e.h, N - s.e.w, 0, s.e.w, s.e.h); } }
}
// 靜態代表格：非透明像素最多的那一格（動畫的第一格常是空的）
function ART_STILL(s){ if (s.still != null) return s.still; const g = s.cv.getContext('2d'); let best = 0, bn = -1; for (let i = 0; i < s.e.n; i++) { const d = g.getImageData(i * s.e.w, 0, s.e.w, s.e.h).data; let n = 0; for (let k = 0; k < d.length; k += 4) if (d[k + 3] && (d[k] < 240 || d[k + 1] < 240)) n++; if (n > bn) { bn = n; best = i; } } return s.still = best; }
function drawLying(c){ if (!c) return; const g = c.getContext('2d'); g.fillStyle = '#a9a59e'; g.fillRect(1, 3, 6, 6); g.fillStyle = '#55524c'; g.fillRect(0, 2, 3, 8); g.fillStyle = '#7e8a88'; g.fillRect(7, 3, 9, 7); g.fillStyle = '#5a5650'; g.fillRect(16, 4, 6, 2); g.fillRect(16, 7, 6, 2); g.fillStyle = '#2a2826'; g.fillRect(10, 10, 8, 1); }


// ================= v17.29：回饋特效（點點英雄式：跳字往上飄、Lv UP 橫幅、星星、光圈） =================
function fxText(t, x, y, col, size){
  ctx.font = `${size}px Cubic11, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#3b2616';
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1], [0, 2]]) ctx.fillText(t, Math.round(x) + dx, Math.round(y) + dy);
  ctx.fillStyle = col; ctx.fillText(t, Math.round(x), Math.round(y)); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}
function drawFx(now, h, hm, view){
  if (!FXQ.length) return;
  let sx = 180, sy = SH * .5;
  try { if (hm === view && h.alpha > 0 && !heroHidden(h)) { const [hx1, hy1] = view === 'vil' ? villagePos(h) : [h.x, h.y]; sx = 180 + (hx1 - cam.x) * cam.z; sy = SH / 2 + (hy1 - cam.y) * cam.z; } } catch (e) {}
  sx = clamp(sx, 50, 310); sy = clamp(sy, 70, SH - 20);
  ctx.save();
  for (let i = FXQ.length - 1; i >= 0; i--) {
    const f = FXQ[i], a = (now - f.t) / f.dur;
    if (a >= 1 || a < 0) { FXQ.splice(i, 1); continue; }
    if (f.kind === 'lv') {
      // 腳下光圈（一格一格往外擴）
      const rr = 10 + Math.floor(a * 6) * 4; ctx.globalAlpha = Math.max(0, 1 - a * 1.2); ctx.strokeStyle = '#ffe14d'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(sx, sy + 2, rr * 1.6, rr * .5, 0, 0, Math.PI * 2); ctx.stroke();
      // 星星
      ctx.globalAlpha = 1; ctx.fillStyle = '#fff6a8';
      for (let k = 0; k < 6; k++) { const ang = k * 1.05 + 0.4, d = 22 + (k % 3) * 9, on = Math.floor(now / 140 + k) % 2;
        if (!on || a > .85) continue; const x = Math.round(sx + Math.cos(ang) * d * 1.3), y = Math.round(sy - 34 + Math.sin(ang) * d * .8);
        ctx.fillRect(x - 1, y - 4, 2, 8); ctx.fillRect(x - 4, y - 1, 8, 2); }
      // 橫幅：先彈一下，最後淡掉
      const pop = a < .08 ? 1.25 : a < .14 ? .95 : 1, y = sy - 76 - Math.min(a, .2) * 30, w = 78 * pop, hh = 22 * pop;
      ctx.globalAlpha = a > .8 ? (1 - a) / .2 : 1;
      ctx.fillStyle = 'rgba(255,214,90,.35)'; ctx.fillRect(sx - w / 2 - 6, y - hh / 2 - 6, w + 12, hh + 12);
      ctx.fillStyle = '#4a2f1b'; ctx.fillRect(sx - w / 2 - 2, y - hh / 2 - 2, w + 4, hh + 4);
      ctx.fillStyle = '#e0582a'; ctx.fillRect(sx - w / 2, y - hh / 2, w, hh); ctx.fillStyle = '#ff9d2e'; ctx.fillRect(sx - w / 2, y - hh / 2, w, hh / 2);
      ctx.fillStyle = '#ffe14d'; ctx.fillRect(sx - w / 2, y - hh / 2, w, 2);
      fxText('Lv UP!', sx, y + 1, '#fff', Math.round(15 * pop));
    } else {
      const col = f.kind === 'fame' ? '#9fd0ff' : f.kind === 'bad' ? '#ff7a6a' : '#ffe14d';
      const x = sx + 18 + (f.n - 1) * 14, y = sy - 40 - f.n * 14 - Math.min(a, .6) / .6 * 22;
      ctx.globalAlpha = a > .7 ? (1 - a) / .3 : 1;
      fxText(f.text, x, y, col, 12);
    }
  }
  ctx.restore();
}
