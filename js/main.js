// 孤勇者 · main.js：存檔、主迴圈、開始遊戲（要最後載入）
// 這幾個檔案共用同一個全域範圍，要照 index.html 裡的順序載入
'use strict';
// ================= 存檔 =================
function fixHero(h){
  if (!h.hex) h.hex = rollHex(h.trait, h.trait2); if (!h.des) h.des = rollDes(h.goal);
  h.mem = h.mem || []; h.charms = h.charms || [];
  if (!h.kidWish) h.kidWish = h.goal === 'family' ? 'want' : h.goal === 'dink' ? 'no' : pickKid();
  if (!GOALS[h.goal]) h.goal = V3MAP[h.goal] || pickGoal(h.trait);
  if (!h.said || !GOALS[h.said]) h.said = h.goal;
  if (h.honest == null) h.honest = 60; if (h.overconf == null) h.overconf = 1.05;
  h.sentHome = h.sentHome || 0; h.burn = h.burn || 0; h.stab = h.stab || 0; h.clues = h.clues || 0;
  h.zonesSeen = h.zonesSeen || []; while (h.zonesSeen.length < 7) h.zonesSeen.push(0);
  h.st = Object.assign({ self:0, forced:0, work:0, days:0, moodSum:0, heard:0, ignored:0, cared:0 }, h.st || {});
}
function migrate(o){
  if (o.hero) { delete o.hero.bubble; delete o.hero.bq; }   // v17.27：舊存檔裡卡住的泡泡清掉
  { const fix = x => { if (!x) return; if (x.cls === 'monk') x.cls = 'warrior'; if (x.cls === 'priest') x.cls = 'mage'; };   // v17：拿掉武僧、牧師
    fix(o.hero); (o.artists || []).forEach(fix); (o.cands || []).forEach(fix); (o.aPool || []).forEach(fix); }
  o.v = 2; o.fame = o.fame || 0; if (o.rep == null) o.rep = 60; o.agDone = o.agDone || 0; o.queue = o.queue || []; o.agTasks = o.agTasks || []; if (o.agDay == null) o.agDay = -99; o.loan = o.loan || 0; o.debtDays = 0; o.office = Object.assign({ clinic:0, gym:0, lounge:0, intel:0, cellar:0 }, o.office || {});
  o.rivals = o.rivals || RIVAL_AG.map(n => ({ n, fame:0 })); if (!o.npcs) o.npcs = makeNpcs();
  o.npcs.forEach(x => { if (!x.hex) x.hex = rollHex(); });
  o.npcs.forEach(x => { if (x.age == null) x.age = AGE0[x.id] ?? (x.role === 'villager' ? ri(19, 28) : 30); if (x.pw == null) x.pw = PW0[x.id] ?? ((NPC_POOL.find(p => p[1] === x.name) || [])[3] || .1); });
  CAST().forEach(c => { if (!o.npcs.find(x => x.id === c.id)) o.npcs.push(mkNpc(c, c.id === 'rival2' ? 10 : ri(5, 20))); });
  o.news = o.news || [];
  if (o.exam == null) o.exam = 0;
  if (!o.artists) o.artists = []; if (!o.rel) o.rel = {}; if (o.swapCd == null) o.swapCd = -99;
  if (!o.npcs.find(x => x.id === 'marco')) o.npcs.push({ id:'marco', title:'旅行商人', name:'馬可', sex:'m', role:'merchant', dark:1, aff:10, alive:true, age:41, pw:0, hex:{ H:5, E:50, X:80, A:30, C:50, O:60 } });
  const h = o.hero; h.mem = h.mem || []; h.charms = h.charms || []; if (h.socialCd == null) h.socialCd = 3; h.boost = h.boost || 0; fixHero(h);
  (o.cands || []).forEach(fixHero);
  return o;
}
let noSave = false;
// v7.2：三層保護——瀏覽器存檔、瀏覽器內的備份、你帳號底下的雲端存檔
const BK_KEY = 'guyongzhe_backup';
function save(){
  if (noSave) return; S.lastSave = Date.now();
  const js = JSON.stringify(S);
  try { localStorage.setItem(SAVE_KEY, js); } catch (e) {}
  try { const bk = JSON.parse(localStorage.getItem(BK_KEY) || 'null'); if (!bk || S.day - (bk.day || 0) >= 12 || bk.gen !== S.gen) localStorage.setItem(BK_KEY, JSON.stringify({ day:S.day, gen:S.gen, at:Date.now(), js })); } catch (e) {}
  cloudSave(js);
}
function parseSave(js){ try { const o = JSON.parse(js); if (o && (o.v === 1 || o.v === 2) && o.hero) return migrate(o); } catch (e) {} return null; }
function load(){
  let raw = null; try { raw = localStorage.getItem(SAVE_KEY); } catch (e) {}
  const o = raw && parseSave(raw); if (o) return o;
  if (raw) { try { localStorage.setItem('guyongzhe_broken_' + Date.now(), raw); } catch (e) {} }   // 讀不了的存檔先留一份，不直接蓋掉
  try { const bk = JSON.parse(localStorage.getItem(BK_KEY) || 'null'); const b = bk && parseSave(bk.js); if (b) { setTimeout(() => toast('主存檔讀不到，已從備份還原'), 800); return b; } } catch (e) {}
  return null;
}
document.addEventListener('visibilitychange', () => { if (document.hidden) { save(); cloudSave(JSON.stringify(S), true); }
  else if (S && !S.paused && !$('end').classList.contains('on') && !$('dying').classList.contains('on') && !$('mission').classList.contains('on')) { catchUp(); renderFeed(); renderAll(); } });
// 雲端存檔：存在你帳號底下（data/users/你的 id/save），只有你自己讀得到
const cloud = { ref:null, state:'connecting', at:0, busy:false, pending:null, lastJs:'', remote:null, timer:null };
function cloudSave(js, now){
  if (!cloud.ref || noSave) return;
  cloud.pending = js;
  if (cloud.busy) return;
  const wait = now ? 0 : Math.max(0, 45000 - (Date.now() - cloud.at));
  clearTimeout(cloud.timer);
  cloud.timer = setTimeout(async () => {
    const body = cloud.pending; cloud.pending = null;
    if (!body || body === cloud.lastJs || !cloud.ref) return;
    cloud.busy = true;
    try { await cloud.ref.set({ js:body, at:Date.now(), day:S.day, gen:S.gen, name:H().name }); cloud.lastJs = body; cloud.at = Date.now(); cloud.state = 'ok'; }
    catch (e) { cloud.state = e && (e.code === 'quota_exceeded' || e.code === 'invalid_argument' || e.code === 'revoked') ? 'off' : cloud.state; }
    cloud.busy = false;
    if (cloud.pending) cloudSave(cloud.pending);
    if (sheetT === 'set') renderSheet();
  }, wait);
}
function cloudRestore(js){ const o = parseSave(js); if (!o) { toast('雲端存檔讀不到'); return; } noSave = true; try { localStorage.setItem(SAVE_KEY, JSON.stringify(o)); } catch (e) {} toast('已載入雲端存檔'); setTimeout(() => location.reload(), 600); }
async function cloudInit(){
  try {
    if (!window.claude || !window.claude.use) { cloud.state = 'off'; return; }
    const db = await window.claude.use('db'), user = await window.claude.use('user');
    if (!db || !user) { cloud.state = 'off'; return; }
    const id = await user.id(); if (!id) { cloud.state = 'off'; return; }
    cloud.ref = db.doc('data/users/' + id + '/save');
    const snap = await cloud.ref.get();
    const r = snap.exists ? snap.data() : null;
    cloud.state = 'ok';
    if (r && r.js && (r.at || 0) < WIPE_AT) {   // v17.24：清除日以前的雲端存檔才算舊紀錄，先收進「清除前的進度」再蓋
      archSet(r.js, 'cloud'); try { await db.doc('data/users/' + id + '/save_arch').set({ ...r, archivedAt:Date.now(), wipe:WIPE_ID }); } catch (e) {}
      cloud.remote = null; if (wipeNow) toast('舊紀錄已清除，重新開始（設定 › 存檔可以找回）'); }
    else if (r && r.js) {
      cloud.remote = r; cloud.at = r.at || 0;
      const fresh = S.day <= 2 && S.gen === 1 && !S.wall.length;   // 這台裝置是全新開局
      let wasReset = false; try { wasReset = localStorage.getItem('guyongzhe_reset') === '1'; localStorage.removeItem('guyongzhe_reset'); } catch (e) {}   // v14.5：剛按過重新開始，就不要把雲端舊進度載回來
      if (fresh && !wasReset && (r.day > S.day || r.gen > 1)) { cloudRestore(r.js); return; }
      if ((r.at || 0) > (S.lastSave || 0) + 5 * 60000 && (r.gen !== S.gen || r.day !== S.day)) { renderAlerts.k = null; renderAlerts(); }
    }
    cloudSave(JSON.stringify(S), true);
  } catch (e) { cloud.state = 'off'; }
  if (sheetT === 'set') renderSheet();
}

// ================= 迴圈 =================
let offline = false, stepAcc = 0, last = performance.now();
function simulate(dt){
  const h = H();
  if (S.paused || ['dead', 'retired', 'left', 'dying'].includes(h.act)) return;
  S.t += dt; stepAcc += dt;
  // 移動
  if (!offline) {
    const hm = heroMap(h);
    if (hm !== h.lastMap) h.lastMap = hm;   // v17.11：同一條路，不再瞬移
    const sp = (h.act === 'hunt' || h.act === 'home' || h.act === 'mission' ? 34 : 18) * (hasP(h, 'lame') ? [.7, .85, .95][h.aid || 0] : 1) * (dt);
    const dx = h.tx - h.x, dy = h.ty - h.y, d = Math.hypot(dx, dy);
    if (sleeping()) { h.tx = GX; h.ty = GY; }
    else if (h.act === 'hunt' && hourOf() < 7) { h.x = GX; h.y = GY; }
    legTick(h, d);   // v17.12：遠路照交通工具的速度走
    if (V.exiting && performance.now() < V.exiting) { /* 畫面上還在村子裡走向村口，先不出發 */ }
    else if (d > 1) { const L = h.leg, s2 = L ? Math.max(sp, L.spd * dt) : sp; h.x += dx / d * Math.min(d, s2); h.y += dy / d * Math.min(d, s2); }
    else if ((h.act === 'idle' || h.act === 'rest' || h.act === 'train') && !sleeping()) { if (Math.random() < dt * .4) { h.tx = clamp(h.x + rand(-30, 30), GX - 300, GX); h.ty = GY; } }
    if (h.act === 'hunt' && h.target) { const sd = h.x > h.target.x ? 1 : -1; h.tx = h.target.x + sd * (monHalf(zoneMon(h.target.z)) + 13); h.ty = h.target.y + 4; }   // v17.34：站在怪物靠勇者的那一側，中間留一點空，不重疊（不會穿過怪物）
    if (h.act === 'mission' && h.mission && !heroHidden(h)) {
      const m = h.mission, sp0 = MSPOT[m.ag], ph = mPhase(h);
      if (['prep', 'back', 'home', 'free', 'nout'].includes(ph)) { h.tx = GX; h.ty = GY; }   // v17.7：在村子／收工回村
      else if (ph === 'go' && m.z >= 0 && ZONES[m.z]) { const R = ZONES[m.z].rect; h.tx = (R[0] + R[2]) / 2; h.ty = (R[1] + R[3]) / 2; }   // 往任務地點走
      else if (ph === 'camp') { const c = campPos(m.z); h.tx = c[0] + 9; h.ty = c[1] + 1; }
      else if (sp0) { if (Math.hypot(h.tx - sp0[0], h.ty - sp0[1]) > 14 || Math.random() < dt * .3) { h.tx = sp0[0] + rand(-8, 8); h.ty = sp0[1] + rand(-2, 2); } }
      else if (m.z >= 0) { const g = scnGoal(h);   // v17.6：照任務演出走位、出手
        if (g) { h.tx = g[0]; h.ty = g[1]; if (g[2] && Math.random() < dt * 2.2) h.flash = .6; }
        else { const RZ = ZONES[m.z].rect; if (Math.hypot(h.tx - h.x, h.ty - h.y) < 3 && Math.random() < dt * .6) { h.tx = rand(RZ[0] + 20, RZ[2] - 20); h.ty = rand(RZ[1] + 20, RZ[3] - 20); } if (Math.random() < dt * .8) h.flash = .6; } }
    }
    if (heroHidden(h)) h.alpha = Math.max(0, h.alpha - dt);
    else if (h.alpha < 1) h.alpha = Math.min(1, h.alpha + dt);
    if (h.flash > 0) h.flash = Math.max(0, h.flash - dt);
    mons.forEach(m => { if (Math.random() < dt * .3) { const R = ZONES[m.z].rect; m.x = clamp(m.x + rand(-6, 6), R[0] + 10, R[2] - 10); m.y = clamp(m.y + rand(-6, 6), R[1] + 10, R[3] - 10); } });
  } else { h.x = h.tx; h.y = h.ty; }
  const hr = hourOf();
  if (!offline && h.act === 'mission' && h.mission && h.actDays <= 1 && mKind(h.mission) && hr >= mEnd(h.mission)) { resolveMission(); if (H() === h && h.act === 'idle' && h.bedDays <= 0 && S.queue.length && hr < 20) runQueue(); save(); renderAll(); if (['dead', 'retired', 'left', 'dying'].includes(H().act)) return; }   // v17.7；v17.20：提早做完又不累，當天接著出發做下一件
  if (S.tourShow) tourTick(hr);
  if (S.evening) { if (S.evening.day !== S.day || offline) S.evening = null; else if (hr >= S.evening.at && S.evening.lines.length) { say(S.evening.lines.shift()); S.evening.at = hr + .4; } }
  if (!offline && mPhase(h) === 'camp' && hr >= 19.5 && hr < 21 && h.campMsg !== S.day) { h.campMsg = S.day; if (chance(.6)) say(campLine(h)); }
  if (S.tev && hr >= S.tev.at) { const e = TEV.find(x => x.k === S.tev.k); S.tev = null; if (e && !offline && e.cond(h)) { try { e.fire(h); } catch (err) { console.error(err); } renderAll(); } }
  huntMark(h);
  if (h.act === 'hunt' && hr >= 17.5) { huntBanner(h); goHome(); if (!offline && chance(.25)) say(pickS(['收工！', '今天到這裡，回去吃飯'])); }   // v17.10：照通勤作息，17:30 收工
  while (stepAcc >= STEP) { stepAcc -= STEP; if (hr >= 7 && hr < 18.5) step(); if (H().act === 'dying' || S.paused) return; }
  if (S.t >= DAY_SEC) {
    S.t = 0; dayEnd();
    if (['dead', 'retired', 'left', 'dying'].includes(H().act)) return;
    S.day++; dayStart(); planTimed(); if (!offline) { save(); renderAll(); }
  }
}
function frame(now){
  const dt = Math.min(.1, (now - last) / 1000); last = now;
  const busy = $('mission').classList.contains('on') || $('end').classList.contains('on') || $('dying').classList.contains('on') || $('evp').classList.contains('on');
  const mk = menuMul();   // v17.23：看選單時時間放慢（或暫停），不會一抬頭就錯過事
  if (!busy && mk > 0) { const n = (mk < 1 ? 1 : S.speed) * (isAsleep() ? 3 : 1); for (let i = 0; i < n; i++) simulate(dt * mk); }   // v17.16：睡著時約 3 倍速
  drawMap(now);
  if (Math.floor(now / 500) !== Math.floor((now - dt * 1000) / 500)) renderTop();
  requestAnimationFrame(frame);
}
function catchUp(){
  const mins = (Date.now() - (S.lastSave || Date.now())) / 60000;
  const days = Math.min(OFF_MAX_DAYS, Math.floor(mins / OFF_MIN_PER_DAY));
  const h = H(); if (days < 1 || ['dead', 'retired', 'left', 'dying'].includes(h.act)) return;
  const g0 = S.gold, lv0 = h.lv, n0 = S.msgs.length, snap = snapOf(); offline = true;
  const wasPaused = S.paused; S.paused = false;
  for (let d = 0; d < days; d++) { for (let t = 0; t < DAY_SEC; t += 1) { simulate(1); if (['dead', 'retired', 'left', 'dying'].includes(H().act)) break; } }
  offline = false; S.paused = wasPaused;
  const evs = S.msgs.length - n0;
  sys(`你離線的 ${days} 個月裡（${evs} 件事）`);
  ev('good', '日記', `「老闆，你不在的時候我${h.lv > lv0 ? `升到了 Lv${h.lv}，` : ''}幫你賺了 ${fmt(S.gold - g0)} 金。${h.mood < 40 ? '最近有點悶。' : '一切都好！'}」`);
  try { showSummary(snap); } catch (e) { console.error(e); }
}

// ================= 開始 =================
// 一次性清除：照小方的要求，把舊紀錄全部清掉（每台裝置第一次打開這版時執行一次）
// v17.24（B4）清除前先把進度收進「清除前的進度」（設定 › 存檔可以找回），顯示偏好不清；
//   只算 WIPE_AT 以前的存檔：全新裝置、或清除之後才存的雲端進度都不會被當成舊紀錄丟掉。
//   ⚠ 要再清一次：WIPE_ID 和 WIPE_AT 一起改，WIPE_AT 設成「這個時間以前的存檔才清」。
const WIPE_ID = 'w20261123', WIPE_AT = Date.parse('2026-11-23T00:00:00+08:00');
const ARCH_KEY = 'guyongzhe_arch';
let wipeNow = false;
const archSet = (js, from) => { try { const o = parseSave(js); if (!o) return; const a = JSON.parse(localStorage.getItem(ARCH_KEY) || 'null');
  if (a && a.id === WIPE_ID && (a.lastSave || 0) >= (o.lastSave || 0)) return;   // 已經收過比較新的就不蓋
  localStorage.setItem(ARCH_KEY, JSON.stringify({ id:WIPE_ID, at:Date.now(), from, lastSave:o.lastSave || 0, gen:o.gen, day:o.day, name:(o.hero && o.hero.name) || '', js })); } catch (e) {} };
function wipeOnce(){
  try { if (localStorage.getItem('guyongzhe_wipe') === WIPE_ID) return;
    let old = localStorage.getItem(SAVE_KEY); if (!parseSave(old || '')) { try { old = (JSON.parse(localStorage.getItem(BK_KEY) || 'null') || {}).js || null; } catch (e) { old = null; } }
    const o = old && parseSave(old);
    if (o && (o.lastSave || 0) < WIPE_AT) { archSet(old, 'local');
      Object.keys(localStorage).filter(k => k.startsWith('guyongzhe_') && ![ARCH_KEY, PREF_KEY].includes(k)).forEach(k => localStorage.removeItem(k));
      wipeNow = true; }
    localStorage.setItem('guyongzhe_wipe', WIPE_ID); } catch (e) {}
}
function archRestore(){ let a = null; try { a = JSON.parse(localStorage.getItem(ARCH_KEY) || 'null'); } catch (e) {} if (!a || !parseSave(a.js)) { toast('找不到清除前的進度'); return; }
  try { localStorage.setItem(BK_KEY, JSON.stringify({ day:S.day, gen:S.gen, at:Date.now(), js:JSON.stringify(S) })); } catch (e) {}   // 現在這一局先放進備份
  noSave = true; try { localStorage.setItem(SAVE_KEY, JSON.stringify(parseSave(a.js))); localStorage.setItem('guyongzhe_reset', '1'); } catch (e) {}
  toast('已找回清除前的進度'); setTimeout(() => location.reload(), 600); }
function boot(){
  wipeOnce();
  const s = load();
  initMons();
  if (s) { S = s; S.paused = false; if (H().act === 'dying') { H().act = 'idle'; injure('heavy', H().dyingWhy || '倒下'); } catchUp(); }
  else {
    newGame(); S.hero = newHero(); refreshOffers(); refreshAg();
    const h = H();
    sys('第 1 代');
    sys(`你成為了新人勇者「${h.name}」的經紀人`);
    say(`你好！我是${h.name}，${CLS[h.cls].n}。聽說你會幫我安排一切？請多指教！`);
    ask('hello', '我們先從草原開始，可以嗎？', ['當然，慢慢來', '嗯', '別廢話，賺錢要緊'], {}, 2);
    S.plan = 1;
  }
  const h = H(); if (['dead', 'retired', 'left'].includes(h.act)) { openEnd(); }
  renderFeed(); renderAll();
  requestAnimationFrame(t => { last = t; requestAnimationFrame(frame); });
}
// v17.21：雙點擊、雙指都不縮放畫面
document.addEventListener('dblclick', e => e.preventDefault(), { passive:false });
['gesturestart', 'gesturechange'].forEach(k => document.addEventListener(k, e => e.preventDefault(), { passive:false }));
boot();
cloudInit();
