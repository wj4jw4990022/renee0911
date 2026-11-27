// 孤勇者 · sim.js：狀態、每天的流程、戰鬥、傷病、事件、人際、委託、結局與下一代
// 這幾個檔案共用同一個全域範圍，要照 index.html 裡的順序載入
'use strict';
// ================= 狀態 =================
let S = null;
const H = () => S.hero;

function newHero(o = {}){
  const sex = o.sex || (chance(.5) ? 'm' : 'f');
  const cls = o.cls || pick(Object.keys(CLS));
  const t1 = o.trait || pick(TK); let t2 = o.trait2 || pick(TK); while (t2 === t1) t2 = pick(TK);
  const perks = o.perks || (chance(.6) ? [pick(START_PERKS)] : []);
  const hh = {
    name: o.name || pick(sex === 'm' ? MALE : FEMALE), sex, cls, trait:t1, trait2:t2, perks,
    lv:1, exp:0, job:0, branch:null, born:S ? S.day : 0, age:START_AGE,
    hp:1, sta:80, mood:65, stress:15, trust:o.trust || 55, health:100, wallet:30,
    wpn:o.wpn || 0, arm:0, pots:2, act:'idle', actDays:0, zone:-1, mission:null,
    bedDays:0, goneDays:0, strikeDays:0, slackDays:0, restStreak:0, friends:0, kills:0, bossKill:0,
    goal:o.goal || pickGoal(t1), sentHome:0, readyKid:0, kidWish:o.kidWish || pickKid(), house:0,
    honest:clamp(ri(20, 95) + (t1 === 'greedy' ? -20 : t1 === 'loyal' ? 15 : 0), 5, 100), clues:0, revealed:false,
    overconf:+(1 + rand(0, .15) + (t1 === 'brave' || t1 === 'hot' ? .15 : 0) - (t1 === 'careful' ? .1 : 0)).toFixed(2),
    burn:0, workStreak:0, stab:0, visit:0, st:{ self:0, forced:0, work:0, days:0, moodSum:0, heard:0, ignored:0, cared:0 },
    mem:[], charms:o.charms || [], partner:null, married:0, child:null, together:0, socialCd:4, boost:0,
    zonesSeen:[0,0,0,0,0,0,0], wish:null, nextWish:6, humanCd:3, carefulNext:0, scolded:0, talked:{}, lastHurt:-99,
    x:GX, y:GY, tx:GX, ty:GY, target:null, flash:0, bubble:null, alpha:1, log:[], gen:o.gen || 1, master:o.master || null,
  };
  hh.hex = rollHex(t1, t2); hh.honest = hh.hex.H; hh.des = rollDes(hh.goal);
  if (!o.kidWish && dw(hh, 'family') && chance(.7)) hh.kidWish = 'want';
  hh.said = sayGoal(hh.goal, hh.honest);
  return hh;
}
function newGame(keepMeta){
  const meta = keepMeta || { gold:500, wall:[], gen:1 };
  S = { v:2, artists:[], rel:{}, swapCd:-99, exam:0, rep:60, agDone:0, queue:[], agTasks:[], agDay:-99, loan:0, debtDays:0, fame:0, office:{ clinic:0, gym:0, lounge:0, intel:0, cellar:0 }, rivals:RIVAL_AG.map(n => ({ n, fame:0 })), npcs:makeNpcs(), gold:meta.gold, day:0, t:0, speed:1, paused:false, cut:30, plan:0, msgs:[], q:null, qq:[], offers:[], offerDay:-99,
        wall:meta.wall, gen:meta.gen, hero:null, lastSave:Date.now(), unread:0 };
  return S;
}

// ================= 衍生數值 =================
const T = h => TRAITS[h.trait];
const hasP = (h, k) => h.perks.includes(k);
const jobMul = h => [1, 1.35, 1.8][h.job] || 1;
function power(h){
  let p = (8 + h.lv * 3.2) * WPN.mul[h.wpn] * CLS[h.cls].pw * jobMul(h);
  if (hasP(h, 'lame')) p *= [.85, .9, .95][h.aid || 0];
  p *= 1 + ch(h, 'pw') + (h.boost || 0);
  if (h.sta < 20) p *= .7; else if (h.sta < 40) p *= .88;
  if (h.health < 50) p *= .85;
  if (S && h === S.hero && S.artists && S.artists.length) p *= followBonus();
  return p;
}
const maxHp = h => Math.round((60 + h.lv * 12) * ARM.mul[h.arm] * CLS[h.cls].hp * (hasP(h, 'iron') ? 1.1 : 1) * (1 + ch(h, 'hp')));
const ch = (h, k) => (h.charms || []).reduce((a, c) => a + ((TREASURES[c] || {})[k] || 0), 0);
const npc = id => S.npcs.find(x => x.id === id);
const friendsN = () => S.npcs.filter(x => x.alive && x.role !== 'rival' && x.aff >= 50).length;
const rankOk = i => S.fame >= RANKS[i][0] && (S.agDone || 0) >= AG_GATE[i] && (i < 6 || S.bossDone);
const examLv = i => i >= 3 && i % 3 === 0;   // 這一級要考核
const examNeed = i => i < 3 ? 0 : i - i % 3;   // 這一級所在階段的考核等級
const rankOf = () => { let r = 0; for (let i = 1; i < RANKS.length; i++) { if (rankOk(i) && (S.exam || 0) >= examNeed(i)) r = i; else break; } return r; };   // 王都經紀公司以上：旗下勇者要打倒過魔王
const UNLOCK_TXT = { 1:'，可以簽公會合約了', 2:'，事務所任務的種類變多了', 3:'，可以收第一位旗下藝人了', 4:'，情報網看得到對手的動向了', 5:'，公會開始送來指名委託',
  6:'，旗下藝人名額變成 2 位', 7:'，拿到年度大賞的評審席（可以提名旗下新人角逐「年度新人獎」）', 8:'，設施可以升到 Lv4，也會接到王室委託', 9:'，每年可以拒絕一次王國徵召不扣名聲', 10:'，旗下藝人名額變成 3 位',
  11:'，退休勇者可以留下來當教練，設施可以升到 Lv5', 12:'，開始接到跨國委託，也出現新的對手', 13:'，外國勇者也會來投靠', 14:'。這是一個經紀人能走到的最高處' };
const unlockMsg = r => UNLOCK_TXT[r] || '，委託報酬變高了';
function addFame(v){ const r0 = rankOf(); S.fame = Math.max(0, S.fame + v); const r1 = rankOf(); if (r1 > r0) { ev('good', '晉升', `你的事務所升格為「${RANKS[r1][1]}」${unlockMsg(r1)}`); if (r1 >= UNLOCK.legend) S.legend = 1; $('dOffice').classList.add('on'); } }
function affAdd(id, v){ const n = npc(id); if (!n || !n.alive) return; const b = n.aff; if (n.role === 'victim' && v > 0) return;
  if (v > 0 && n.role !== 'rival') v *= (.7 + .6 * hx(H(), 'X')) * compat(H(), n);   // 外向的人交朋友快，合得來的人好得快
  n.aff = clamp(n.aff + v, 0, H().record && v > 0 ? Math.max(b, 60) : 100);
  if (b < 50 && n.aff >= 50 && n.role !== 'rival') wishHook('friend');
  if (b < 50 && n.aff >= 50 && n.role !== 'rival' && n.id !== H().partner) { ev('good', '朋友', `${H().name}和${n.title}${n.name}成了好朋友`); logLife(`和${n.name}成為好朋友`); } }
function remember(k, o = {}){ const h = H(); h.mem.push({ k, d:S.day, ...o }); if (h.mem.length > 30) h.mem.shift(); }
const ratio = (h, D) => power(h) / D;
function danger(r){ return r >= 1.3 ? { k:'g', n:'安全', i:0 } : r >= .85 ? { k:'o', n:'有風險', i:1 } : { k:'r', n:'九死一生', i:2 }; }
const expNeed = lv => Math.round(15 * Math.pow(lv, 1.7));
const jobName = h => h.job ? CLS[h.cls][h.branch][h.job - 1] : CLS[h.cls].n;
const ym = d => `${Math.floor(d / 12) + 1} 年 ${d % 12 + 1} 月`;
const pron = h => h.sex === 'm' ? '他' : '她';

// ================= 訊息 =================
function addMsg(kind, text, tag){
  if (tag) { S.stat = S.stat || {}; S.stat[tag] = (S.stat[tag] || 0) + 1; if (/^自己|^自費/.test(tag) && S.hero) { const hb = S.hero.buys = S.hero.buys || []; hb.push({ d:S.day, t:text }); if (hb.length > 30) hb.shift(); } }
  S.msgs.push({ k:kind, t:text, g:tag || '', d:S.day, hr:Math.round(hourOf() * 6) / 6 });
  if (S.msgs.length > 80) S.msgs.splice(0, S.msgs.length - 80);
  if (!offline) renderFeed(true);
}
let SAYQ = null;   // v17.9：結算時先收起來，晚上才說
const say = text => { if (SAYQ) { SAYQ.push(text); return; } if (S) { S.recentL = S.recentL || []; S.recentL.push(text); if (S.recentL.length > 90) S.recentL.shift(); } addMsg('hero', text); bubble(text.length > 12 ? text.slice(0, 11) + '…' : text); };
const sys = text => addMsg('sys', text);
const ev = (kind, tag, text) => { addMsg('ev ' + kind, text, tag); epFromEv(tag, text); };
function logLife(text){ H().log.push({ d:S.day, age:H().age, t:text }); }
// v17.27：泡泡不放進存檔。舊版把「顯示到什麼時候」存進存檔，那個時間是用這次開頁面後的計時，重新打開頁面計時歸零，舊的那句就會一直卡在頭上
const BUB = { q:[], cur:null, h:null };
function bubble(t){ if (typeof offline !== 'undefined' && offline) return; const h = H(); if (BUB.h !== h) { BUB.h = h; BUB.q = []; BUB.cur = null; } BUB.q.push(t); if (BUB.q.length > 6) BUB.q.shift(); }   // v17.15：排隊顯示

// 問答：一次只有一題，其它排隊；過期不回也算一種回答（傳 -1）
function ask(key, text, opts, data, days = 2){
  const q = { key, text, opts, data:data || {}, until:S.day + days };
  if (S.q) { S.qq.push(q); return; }
  S.q = q; (text.startsWith('（') ? sys : say)(text); renderReplies();
}
function answer(i){
  const q = S.q; if (!q) return;
  S.q = null;
  const st = H().st; if (st) { if (i >= 0) st.heard++; else st.ignored++; }
  if (i >= 0) addMsg('me', q.opts[i]);
  else sys(`（來不及回，${H().name}自己決定了）`);
  try { (QH[q.key] || (() => {}))(i, q.data); } catch (e) { console.error(e); }
  if (!S.q && S.qq.length) { const n = S.qq.shift(); n.until = S.day + 2; S.q = n; (n.text.startsWith('（') ? sys : say)(n.text); }
  renderReplies(); renderAll();
}

// ================= 數值變化 =================
function adj(k, v){
  const h = H();
  if (k === 'stress' && v > 0) v *= T(h).stress * (1 - ch(h, 'calm')) * (1 - (h.stab || 0)) * (.7 + .6 * hx(h, 'E'));
  if (k === 'mood' && v < 0 && hasP(h, 'glass')) v *= 1.4;
  if (k === 'mood' && h.trait === 'hot') v *= 1.4;
  if (k === 'trust' && v < 0 && h.trait === 'loyal') v *= .5;
  h[k] = clamp(h[k] + v, 0, 100);
}
function gainExp(n){
  const h = H(); n *= (hasP(h, 'genius') ? 1.3 : 1) * (.85 + .3 * hx(h, 'C')); if (S.coach) n *= 1.2; n *= 1 + (S.office.gym || 0) * .12;
  h.exp += n; const lv0 = h.lv;
  while (h.exp >= expNeed(h.lv)) {
    h.exp -= expNeed(h.lv); h.lv++; h.hp = 1;
    adj('mood', 6);
    wishHook('lvup');
    if (h.lv % 5 === 0) { logLife(`升到 Lv${h.lv}`); addFame(5); }
    if (h.lv === 15 || h.lv === 30) askJob();
  }
  if (h.lv > lv0) fxPop('Lv UP!', 'lv');   // v17.29
}
function finAdd(k, v){ if (!S || !v) return; S.finM = S.finM || {}; S.finM[k] = (S.finM[k] || 0) + v; }
function finClose(){
  const m = S.finM || {}, g0 = S.finG0 ?? S.gold, tracked = Object.values(m).reduce((a, b) => a + b, 0), other = Math.round(S.gold - g0 - tracked);
  if (other) m.other = (m.other || 0) + other;
  S.finH = S.finH || []; S.finH.push({ d:S.day, g:Math.round(S.gold), c:m }); if (S.finH.length > 24) S.finH.shift();
  S.finM = {}; S.finG0 = S.gold;
}
function repAdd(v, why, quiet){
  S.rep = clamp(S.rep + v, 0, 100); if (!v) return;
  if (quiet) { S.repAcc = S.repAcc || {}; S.repAcc[why] = (S.repAcc[why] || 0) + v; return; }
  S.repLog = S.repLog || []; S.repLog.push({ d:S.day, v:Math.round(v * 10) / 10, why }); if (S.repLog.length > 20) S.repLog.shift();
}
function repFlush(){ const a = S.repAcc || {}; Object.keys(a).forEach(k => { if (Math.abs(a[k]) >= 1) { S.repLog = S.repLog || []; S.repLog.push({ d:S.day, v:Math.round(a[k] * 10) / 10, why:k + '（這一年）' }); if (S.repLog.length > 20) S.repLog.shift(); } }); S.repAcc = {}; }
function earn(g, src){
  const h = H(); g *= (CLS[h.cls].gold || 1) * (1 + ch(h, 'gold'));
  const mine = Math.round(g * S.cut / 100), his = Math.round(g) - mine;
  S.gold += mine; finAdd('cut', mine); h.wallet += his; h.earnToday = (h.earnToday || 0) + g;
  return mine;
}

// ================= 每天開始：勇者決定今天做什麼 =================
function dayStart(){
  const h = H();
  h.target = null; h.flash = 0; travelMonthly(h);   // v17.12
  if (h.act === 'dead' || h.act === 'retired' || h.act === 'left') return;
  if (h.act === 'mission') { if (--h.actDays > 0) { setAct('mission'); return; } resolveMission(); if (h.act !== 'idle' || H() !== h) return; }   // v17.20：做完不累的話，這個月接著做別的
  if (h.goneDays > 0) { if (--h.goneDays <= 0) (h.jailed ? jailRelease() : goneReturn()); else setAct('gone'); return; }
  if (h.bedDays > 0) { h.bedDays--; setAct('bed'); return; }
  if (h.privDays > 0) { if (--h.privDays <= 0) privReturn(); else setAct('private'); return; }
  if (h.visit > 0) { if (--h.visit <= 0) visitReturn(); else setAct('visit'); return; }
  if (h.strikeDays > 0) { h.strikeDays--; setAct('strike'); return; }
  if (h.slackDays > 0) { h.slackDays--; setAct('slack'); return; }
  if (h.trainDays > 0) { h.trainDays--; setAct('train'); return; }
  if (!offline && humanEvent()) return;
  if (!offline && S.queue.length && runQueue()) return;
  // 斜槓：自己接外快
  if (h.goal === 'slash' && h.sta > 40 && chance(.15)) { setAct('side'); clue('又自己跑去接外快'); if (!offline && chance(.5)) say(pickS(['今天有個外快，我先去一下', '朋友介紹的案子，很快就回來'])); h.st.self++; return; }
  // 健康優先：累了就休息，誰說都沒用
  if (h.goal === 'health' && h.sta < 50) { setAct('rest'); clue('又說身體要緊，推掉了工作'); if (!offline && S.plan > 0 && chance(.4)) say('今天狀況不好，我要休息。身體壞了賺再多也沒用'); h.st.self++; return; }

  // 照經紀人的方針，或自己決定
  if (S.plan > topZ() + 1) S.plan = topZ() + 1;
  const plan = S.plan;   // 0 休息、1 草原、2 森林、3 荒地……
  let obey = .55 + h.trust * .004 - h.stress * .002 + T(h).obey + (h.scolded > 0 ? .12 : 0) + (hx(h, 'A') - .5) * .3 - dw(h, 'independence') * .15;
  if (plan >= 1) { const d = danger(ratio(h, zD(plan - 1))); if (d.i === 2) obey -= h.trait === 'brave' ? 0 : .25; if (d.i === 1 && h.trait === 'careful') obey -= .15; }
  if (plan === 0 && h.trait === 'lazy') obey = 1;
  if (plan === 0 && h.sta > 85 && (h.trait === 'hot' || h.trait === 'brave')) obey -= .2;
  h.scolded = Math.max(0, h.scolded - 1);
  const scare = plan >= 1 && h.mem.some(m => (m.k === 'nearDeath' || m.k === 'forced') && m.z === plan - 1 && S.day - m.d < 60);
  if (scare) obey -= .22;
  let choice = plan, own = false;
  obey -= (h.burn || 0) / 250;
  const pref = ownChoice();
  if (!chance(clamp(obey, .1, .97))) { choice = pref; own = choice !== plan; }
  if (choice === plan && plan !== pref) h.st.forced++; else h.st.self++;
  if (offline) { // 離線：只做安全的事
    if (choice >= 1 && danger(ratio(h, zD(choice - 1))).i > 0) choice = bestSafeZone() + 1;
    if (h.sta < 30) choice = 0;
  }
  h.ownToday = own; h.obeyed = !own && choice >= 1;
  if (own) wishHook('self');
  if (!own && plan !== pref && dw(h, 'independence')) adj('mood', -3);
  if (S.weather === 'storm' && choice >= 1 && !offline && h.trait !== 'brave' && chance(.7)) { choice = 0; say(pickS(['颱風天還要出門？我不要', '外面風好大，今天在家待著', '這種天氣出去會被吹走啦'])); }
  if (choice === 0) setAct('rest'); else startHunt(choice - 1);
  if (own && scare && !offline && choice < plan) { say(`${ZONES[plan - 1].n}……上次差點回不來，我不想去`); return; }
  if (own && !offline) {
    if (choice === 0) say(pickS(['今天好累，我想休息一下', '今天讓我放空一天好不好', '我今天不想出門…']));
    else if (plan === 0) say(pickS([`躺不住了，我去${ZONES[choice - 1].n}晃晃！`, `休息？才不要，我去${ZONES[choice - 1].n}賺錢`]));
    else if (choice - 1 > plan - 1) say(pickS([`${ZONES[plan - 1].n}太無聊了，我去${ZONES[choice - 1].n}看看`, `我想挑戰${ZONES[choice - 1].n}！`]));
    else say(pickS([`${ZONES[plan - 1].n}有點可怕…我今天先去${ZONES[choice - 1].n}`, `今天去${ZONES[choice - 1].n}就好，別逼我`]));
  }
}
function bestSafeZone(){ const h = H(); let z = 0; for (let i = 0; i <= topZ(); i++) if (ratio(h, zD(i)) >= 1.3) z = i; return z; }
function ownChoice(){
  const h = H();
  if (h.sta < 35 || h.health < 40) return 0;
  if (h.goal === 'health' && h.sta < 55) return 0;
  if (h.trait === 'lazy' && chance(.4)) return 0;
  let z = 0;
  const need = (lossAverse(h) ? 1.35 : 1.1) + dw(h, 'tranquility') * .2;   // 損失規避的人要更有把握
  for (let i = 0; i <= topZ(); i++) { const r = ratio(h, zD(i)) * (h.overconf || 1); if (r >= need) z = i; }   // 過度自信：高估自己
  if (z < topZ() && chance(hx(h, 'O') * .6 + dw(h, 'curiosity') * .15 + dw(h, 'physical') * .1 - .1)) z++;   // 開放性高的人敢去更遠的地方
  if (h.trait === 'careful' && z > 0 && ratio(h, zD(z)) < 1.5) z--;
  return z + 1;
}
function setAct(a){ const h = H(); h.act = a; if (a !== 'hunt') h.zone = -1; if (a === 'rest') h.restStreak++; else if (a !== 'bed') h.restStreak = 0; }
function startHunt(z){
  const h = H(); h.act = 'hunt'; h.zone = z; h.restStreak = 0; h.hp = Math.max(h.hp, .6); h.zonesSeen[z] = 1;
  h.tx = rand(ZONES[z].rect[0] + 20, ZONES[z].rect[2] - 20); h.ty = rand(ZONES[z].rect[1] + 20, ZONES[z].rect[3] - 20);
  h.huntGain = 0; h.huntKills = 0;
}

// ================= 戰鬥（每 2 遊戲秒） =================
// v17.35：HFX 記下這一回合的結果給畫面演（打倒了沒、勇者有沒有被打到），只影響畫面
let HFX = null;
function step(){
  const h = H();
  if (h.act !== 'hunt') return;
  if (typeof ELX !== 'undefined' && ELX) return;   // v17.45：正在和精英怪對戰（演出中），先不打別的
  if (h.target && h.target.elite) { h.target = null; h.fighting = false; }   // 讀檔時留下的精英怪目標
  if (Math.hypot(h.tx - h.x, h.ty - h.y) > 8 && !h.fighting) return;   // 還在路上
  const Z = ZONES[h.zone], r = ratio(h, Z.D);
  if (!h.target) { h.target = mons.filter(m => m.z === h.zone && !(m.born && performance.now() - m.born < 1500)).sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y))[0] || null; if (h.target) { h.tx = h.target.x; h.ty = h.target.y; } h.fighting = true; return; }
  h.flash = 1;
  const fx = { t:performance.now(), tg:h.target, kill:0, hurt:0, hp0:h.hp }; if (!offline) HFX = fx;
  // 打
  if (chance(clamp(.3 + .4 * r - (h.burn || 0) / 400, .1, .95))) {
    h.kills++; h.huntKills++;
    const rm = RISK_MUL[danger(r).i];
    const g = Z.gold * rand(.7, 1.3) * rm, e = Z.exp * (r > 2 ? .5 : 1) * rm;
    if (chance([.001, .008, .025][danger(r).i])) findTreasure(h.zone);
    earn(g); gainExp(e);
    if (h.target) { fx.kill = 1; fx.ghost = { x:h.target.x, y:h.target.y, z:h.target.z, ph:h.target.ph }; respawn(h.target, !offline); h.target = null; }   // 畫面上原地倒下，過一下才在別處冒出來
    if (h.wish && h.wish.k === 'zone' && h.zone === h.wish.z) h.wish.p++;
    if (huntThings(h)) return;
  }
  // 被打
  if (chance(clamp(.65 - r * .2, .15, .8))) {
    let dmg = .05 * rand(.5, 1.6) / Math.pow(Math.max(r, .25), 1.2);
    if (hasP(h, 'iron')) dmg *= .85;
    dmg *= 1 - ch(h, 'guard');
    if (h.carefulNext) dmg *= .8;
    if (CLS[h.cls].heal) dmg *= .85;
    h.hp -= dmg; fx.hurt = 1;
    if (h.hp < .35 && h.pots > 0) { h.pots--; h.hp = Math.min(1, h.hp + .4); }
    // 意外：被重擊
    if (dmg > .12 && chance(.25)) { injure(dmg > .2 ? 'heavy' : 'light', `在${Z.n}被${Z.mon}重擊`); if (H().act !== 'hunt') return; }
  }
  if (h.hp <= 0) { h.hp = 0; nearDeath(`在${Z.n}被${Z.mon}圍攻`, h.zone); return; }
  // 路上的意外
  if (!offline && chance(.002 + Math.max(0, 1.25 - r) * .018)) { injure(r < .9 && chance(.35) ? 'heavy' : 'light', pick([`在${Z.n}踩空扭到腳`, `在${Z.n}被${Z.mon}偷襲`, `在${Z.n}的亂石堆摔了一跤`])); return; }
  // 撤退或逃跑
  const retreat = T(h).retreat + (hasP(h, 'coward') ? .15 : 0) + (h.carefulNext ? .1 : 0);
  if (h.hp < retreat) {
    if ((h.stress > 70 || hasP(h, 'coward') || hx(h, 'E') > .72) && r < 1 && chance(.35 + hx(h, 'E') * .3) && !offline) {
      ev('warn', '臨陣逃跑', `${h.name}在${Z.n}嚇到丟下戰利品跑回村子`);
      adj('mood', -8); adj('stress', 6); logLife(`在${Z.n}臨陣逃跑`);
      say(pickS(['對不起…我真的打不下去了', '那些怪太可怕了，我不要再去了']));
    } else if (!offline && chance(.3)) say(pickS(['血不多了，先撤！', '今天到此為止，回去了']));
    goHome(); return;
  }
}
function findTreasure(z){
  const h = H(); const k = Object.keys(TREASURES).find(k => TREASURES[k].z === z && !h.charms.includes(k) && (z < 3 || true));
  if (!k) return;
  const T0 = TREASURES[k];
  if (h.wish && h.wish.k === 'treasure' && h.wish.t === k) h.wish.p = 1;
  if (h.charms.length >= CHARM_MAX) { const g = 600 * (z + 1); S.gold += g; ev('good', '寶物', `${h.name}找到「${T0.n}」，但身上帶不下了，賣了 ${fmt(g)} 金給你`); return; }
  h.charms.push(k); addFame(5); remember('treasure', { n:T0.n });
  ev('good', '寶物', `${h.name}在${ZONES[z] ? ZONES[z].n : '魔王的巢穴'}找到「${T0.n}」（${T0.d}）`); logLife(`找到寶物「${T0.n}」`);
  if (!offline) say(pickS([`老闆你看！${T0.n}！`, `我撿到${T0.n}了！冒險果然值得`]));
}
function goHome(){ const h = H(); h.act = 'home'; h.zone = -1; h.target = null; h.fighting = false; h.tx = GX; h.ty = GY; }

// ================= 傷病 =================
function injure(kind, why){
  const h = H(); const z0 = h.zone; h.dyingAg = 0;
  if (offline && kind !== 'light') kind = 'light';
  h.lastHurt = S.day; adj('mood', kind === 'light' ? -6 : -15); adj('stress', kind === 'light' ? 4 : 12);
  if (S.plan > 0 && !h.ownToday) adj('trust', kind === 'light' ? -1 : -5);
  if (kind === 'light') {
    h.health = clamp(h.health - 5, 0, 100); h.bedDays = Math.max(h.bedDays, 1);
    ev('warn', '意外', `${why}，受了輕傷，要休息 1 個月`);
    if (!offline) say(L('hurtLight'));
  } else {
    h.lastHeavy = S.day; yr().hurt++;
    h.health = clamp(h.health - 20, 0, 100); h.bedDays = Math.max(h.bedDays, Math.max(1, ri(3, 5) - (S.office.clinic || 0)));
    if (h.obeyed && z0 >= 0) remember('forced', { z:z0 });
    if (hasP(h, 'scar') && !hasP(h, 'lame')) {
      h.perks.push('lame');
      ev('bad', '殘疾', `${why}，舊傷再次重創，${h.name}的腳從此跛了（戰力 -15%，可以靠輔具減輕）`);
      logLife(`${why}，舊傷復發，從此跛腳`); adj('mood', -20); adj('stress', 15);
      say('醫生說我的腳…以後都好不了了');
    } else {
      if (!hasP(h, 'scar')) h.perks.push('scar');
      h.visitDue = S.day + 1;
      ev('bad', '重傷', `${why}，重傷臥床 ${h.bedDays} 個月`);
      logLife(`${why}，重傷臥床`);
      say(L('hurtHeavy'));
    }
  }
  setAct('bed'); h.zone = -1; h.target = null; h.fighting = false; h.tx = GX; h.ty = GY; h.x = GX; h.y = GY; h.hp = Math.max(h.hp, .2);
}

// ================= 瀕死 / 死亡 =================
let dyingTimer = null, dyingLeft = 0;
function nearDeath(why, z){
  const h = H(); if (z != null && z >= 0) remember('nearDeath', { z });
  if (offline) { injure('light', why); return; }
  if (chance(.35 + friendsN() * .05 + (hasP(h, 'social') ? .15 : 0) + ch(h, 'luck') + (isFr('priest') ? .1 : 0))) {
    ev('warn', '被救回', `${h.name}${why}倒下，被路過的冒險者拖回村子`);
    injure('heavy', why); return;
  }
  h.dyingWhy = why; h.dyingZ = z; h.act = 'dying'; S.paused = true; dyingLeft = 15;
  logLife(`${why}，倒下了`);
  openDying();
}
function openDying(){   // v17.80 新版（design-wip design/ui/草圖_瀕死.png）：倒下的地方（調暗＋紅色暗角）、躺著的 Q 版勇者、紙卡標題；心跳＋倒數；金框選項
  const h = H(), cost = healCost(), canPay = S.gold >= cost, fN = friendsN();
  const line = h.trust > 60 ? '老闆……對不起，我好像回不去了' : h.trust > 30 ? '……好冷……這就是結局了嗎' : '……早知道……就不聽你的了';
  $('dying').innerHTML = `
    <div class="dsc"><canvas id="dcv" width="120" height="102"></canvas><div class="dvig"></div>
      <div class="pb dttl"><b>${esc(h.name)}倒下了</b><span>${esc(h.dyingWhy || '')}</span></div></div>
    <div class="dbd">
      <div class="dbeat"><svg viewBox="0 0 260 44" preserveAspectRatio="none" aria-hidden="true"><path d="M0 24 H100 l8 -5 l8 5 h14 l10 -20 l11 38 l11 -26 l8 8 H260" fill="none" stroke="#e84537" stroke-width="3" stroke-linejoin="round"/></svg><span class="num"${TIPA('時間', '還能撐多久', '時間到了還沒決定，就來不及了')}>${IC('時間', 2)}<b class="cr beat" id="dLeft">0:15</b></span></div>
      <div class="pb ns dsay"><span class="dnm">${esc(h.name)}</span><div>${esc(line)}</div></div>
      <button class="pb au dopt" id="dO1" ${canPay ? '' : 'disabled'}>${IC('生病', 3, !canPay)}<span class="dtx"><b>請神官緊急救治</b><small>${canPay ? '一定活下來，但會重傷臥床' : '錢不夠'}</small></span><span class="pb ns dpr">${IC('金幣', 2, !canPay)}<b>${fmt(cost)}</b></span></button>
      <button class="pb au dopt" id="dO2">${IC('說話', 3)}<span class="dtx"><b>大喊求救</b><small>看運氣：朋友越多，越可能有人來</small></span><span class="num"${TIPA('人際', '朋友', `交情到「朋友」以上的人有 ${fN} 個`)}>${IC('人際', 2)}<b>×${fN}</b></span></button>
      <button class="dopt dlast" id="dO3">${IC('空心', 2)}<b>陪${pron(h)}走完最後一段</b></button>
    </div>`;
  $('dying').classList.add('on');
  dyingScene($('dcv'), h);
  $('dO1').onclick = () => dyingChoose(1); $('dO2').onclick = () => dyingChoose(2); $('dO3').onclick = () => dyingChoose(3);
  clearInterval(dyingTimer);
  dyingTimer = setInterval(() => { dyingLeft--; const el = $('dLeft'); if (el) el.textContent = `0:${String(Math.max(0, dyingLeft)).padStart(2, '0')}`; if (dyingLeft <= 0) dyingChoose(0); }, 1000);
}
// 倒下的地方：野外前三區用那一區的背景（調暗），其他地方用暗色地面；勇者躺在路上、閉著眼
function dyingScene(c, h){ if (!c) return; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#22262a'; g.fillRect(0, 0, 120, 102);
  const z = h.dyingZ != null && h.dyingZ >= 0 ? h.dyingZ : (h.zone ?? -1), Y0 = 68;   // 只取野外畫面下半（樹＋路），勇者才夠大
  try { if (z >= 0 && z <= 2) { const st = zoneStrip(z); g.drawImage(st, Math.max(0, Math.round(st.width / 2 - 60)), Y0, 120, 102, 0, 0, 120, 102); } else { g.fillStyle = '#3a3530'; g.fillRect(0, 124 - Y0, 120, 102); } } catch (e) {}
  g.fillStyle = 'rgba(16,12,18,.6)'; g.fillRect(0, 0, 120, 102);
  try { drawSprite(g, h, 60, 142 - Y0, true, 0, { moving:false, noEmo:true, expr:'sick' }); } catch (e) {} }
const healCost = () => Math.round((200 + H().lv * 120) * (1 - (S.office.clinic || 0) * .2) * (isFr('priest') ? .85 : 1));
function dyingChoose(k){
  clearInterval(dyingTimer); $('dying').classList.remove('on');
  const h = H(); S.paused = false;
  if (k === 1) { S.gold -= healCost(); adj('trust', 15); logLife('經紀人花大錢請神官救回一命'); remember('saved'); h.act = 'idle'; injure('heavy', h.dyingWhy); say('……你把我救回來了？謝謝你，老闆'); }
  else if (k === 2 && chance(.3 + friendsN() * .08 + (hasP(h, 'social') ? .15 : 0) + ch(h, 'luck'))) { logLife('被路過的冒險者救回一命'); h.act = 'idle'; injure('heavy', h.dyingWhy); ev('good', '奇蹟', '一隊路過的冒險者聽到呼救，把' + h.name + '救了回來'); }
  else { const p = h.partner && npc(h.partner); die(k === 3 ? `${h.dyingWhy}，在經紀人的陪伴下離世` : `${h.dyingWhy}，沒有等到救援`, 'dead'); }
  renderAll();
}
function die(why, kind){
  const h = H(); h.act = kind; h.endWhy = why; logLife(why);
  if (kind === 'dead') { const hit = h.dyingAg ? 30 : 8; repAdd(-hit, '勇者倒下'); if (h.dyingAg) ev('bad', '輿論', `大家都說是你的事務所把${h.name}逼上死路（口碑 -${hit}）`); }
  if (kind === 'left' && (h.burn > 60 || h.trust < 25)) { repAdd(-12, '勇者離開後到處說壞話'); ev('bad', '輿論', `${h.name}離開後，到處說事務所的壞話（口碑 -12）`); }
  S.paused = true; save(); openEnd();
}

// ================= 人性事件（每天早上檢查） =================
function humanEvent(){
  const h = H();
  if (--h.humanCd > 0) return false;
  const go = () => { h.humanCd = ri(3, 6); return true; };
  // 被壓榨到逃走
  if (h.burn > 85 && h.trust < 45 && S.queue.filter(it => it.kind !== 'rest').length >= 2 && chance(.3)) {
    h.goneDays = ri(2, 5); setAct('gone'); h.alpha = 0; repAdd(-6, '勇者受不了而出走');
    ev('bad', '出走', `${h.name}看著排得滿滿的工作表，半夜逃走了`); say('我不是你的賺錢機器。'); logLife('受不了被壓榨，逃離了村子');
    ask('gone', '（要怎麼辦？）', ['寫信給' + pron(h), '花 300 金派人去找', '放手，讓' + pron(h) + '靜一靜'], {}, h.goneDays);
    return go();
  }
  // 不告而別
  if (h.stress > 88 && h.trust < 35 && !(h.trait === 'loyal' && chance(.8)) && chance(.5)) {
    h.goneDays = ri(2, 5); setAct('gone'); h.alpha = 0;
    ev('bad', '不告而別', `${h.name}半夜收拾行李離開了村子，只留下一張紙條`);
    say('老闆，我需要一個人想想。不要找我。');
    logLife('不告而別，離開了村子');
    ask('gone', '（要怎麼辦？）', ['寫信給' + pron(h) + '', '花 300 金派人去找', '放手，讓' + pron(h) + '靜一靜'], {}, h.goneDays);
    return go();
  }
  // 罷工 / 談判抽成
  // 證照進修族：被挖角
  if (h.goal === 'cert' && S.cut >= 30 && h.trust < 55 && chance(.3)) {
    setAct('strike'); ev('warn', '挖角', `銀月經紀社來找${h.name}談條件`);
    ask('hop', '銀月經紀社來挖角，說只抽兩成，還幫我出進修費。你能比照嗎？', ['好，降到 20%', '給你 500 金進修費', '不行'], {});
    return go();
  }
  if ((h.trust < 40 && S.cut >= 30 || h.goal === 'seiko' && S.cut >= 25 && h.trust < 55) && chance(.35)) {
    setAct('strike');
    ev('warn', '罷工', `${h.name}今天不出門，說要跟你談抽成`);
    const want = Math.max(10, S.cut - 10);
    ask('cut', `老闆，你抽 ${S.cut}% 太多了。降到 ${want}%，不然我不幹了。`, [`好，降到 ${want}%`, `各退一步，${S.cut - 5}%`, '不行，照合約來'], { want });
    return go();
  }
  // 擺爛
  if ((h.mood < 25 || h.burn > 80) && chance(clamp((h.trait === 'lazy' ? .7 : .4) + (.5 - hx(h, 'C')) * .4, .1, .9))) {
    h.slackDays = ri(1, 3); setAct('slack');
    ev('warn', '擺爛', `${h.name}心情很差，接下來 ${h.slackDays + 1} 個月打算整天躺著`);
    say(pickS(['……不想動。什麼都不想做。', '反正打了也沒用，躺著就好']));
    logLife('陷入低潮，擺爛了好幾天');
    return go();
  }
  // 喝酒賭博
  if (h.mood < 40 && h.wallet > 60 && chance(hasP(h, 'drinker') || h.trait === 'greedy' ? .5 : .25)) {
    const lose = Math.round(h.wallet * rand(.5, 1)); h.wallet -= lose;
    const gamble = h.trait === 'greedy' || chance(.4);
    setAct('drink'); adj('stress', -15); adj('mood', gamble ? -5 : 5);
    ev('warn', gamble ? '賭博' : '喝悶酒', `${h.name}跑去${gamble ? '賭場' : '酒館'}，花掉了 ${fmt(lose)} 金`);
    say(gamble ? '本來想翻本的……全輸光了' : '再一杯……再一杯就好');
    if (h.wallet < 10 && gamble) { h.debt = ri(100, 300); ask('debt', `老闆……我欠了賭場 ${h.debt} 金，他們說不還就要我好看`, [`我幫你還（${h.debt} 金）`, '自己闖的禍自己扛', '從下次的報酬裡扣'], {}); }
    return go();
  }
  // 接私活
  if ((h.trait === 'greedy' || hx(h, 'H') < .35) && h.wallet < 40 && h.trust < 55 && chance(.25 + (1 - hx(h, 'H')) * .25)) {
    h.privDays = 2; setAct('private'); h.alpha = 0;
    ev('warn', '失聯', `${h.name}一早就不見人影，村人說${pron(h)}好像自己接了一個委託`);
    logLife('瞞著經紀人接了私活');
    return go();
  }
  // 過勞
  if (h.sta < 15 && (h.trait === 'brave' || h.trait === 'hot') && chance(.4)) {
    ev('bad', '過勞', `${h.name}硬撐著出門，結果在路邊暈倒`);
    h.health = clamp(h.health - 15, 0, 100); h.bedDays = 2; setAct('bed'); logLife('過勞暈倒');
    say('我只是……有點頭暈……');
    return go();
  }
  // 壓力大時躲在家
  if (h.stress > 75 && h.trait === 'careful' && chance(.5)) {
    setAct('rest'); say('外面好危險……我今天不想出去'); return go();
  }
  return false;
}
function goneReturn(){
  const h = H(); const p = clamp(.45 + h.trust / 200 + (h.letter ? .2 : 0) + (h.search ? .25 : 0), 0, .95);
  h.letter = 0; h.search = 0;
  if (chance(p)) {
    h.alpha = 1; h.x = GX; h.y = GY; h.tx = GX; h.stress = 40; adj('mood', 10); setAct('rest');
    ev('good', '回來了', `${h.name}背著行李回到村子`); say('我回來了。……謝謝你沒有放棄我。'); logLife('離開幾天後回到村子');
  } else die(`離開村子後再也沒有回來`, 'left');
}
function privReturn(){
  const h = H(); h.alpha = 1; h.x = GX; h.y = GY; h.tx = GX; h.ty = GY;
  const r = power(h) / (zD(Math.min(topZ(), bestSafeZone() + 1)) * 1.1);
  if (chance(clamp(.3 + r * .4, .2, .85))) {
    const g = ri(150, 400) * (1 + H().lv / 10); h.wallet += Math.round(g);
    ev('warn', '私活', `${h.name}回來了，口袋多了 ${fmt(g)} 金，一毛都沒分給你`); adj('mood', 10); setAct('rest');
    ask('priv', '……幹嘛這樣看我，我自己賺的錢不行嗎', ['算了，平安就好', '下次先跟我說', '這違反合約，罰你一半'], { g });
  } else { setAct('idle'); injure(chance(.5) ? 'heavy' : 'light', '接私活時出了差錯'); }
}

// ================= v2：人際與兩難 =================
function relWord(n){
  const h = H();
  if (n.gone === 'moved') return '搬走了';
  if (n.gone === 'hero') return '成了你旗下的勇者';
  if (n.gone === 'retired') return '退休了';
  if (!n.alive) return '已故';
  if (n.dark) return n.aff >= 50 ? '很談得來（？）' : '來路不明';
  if (n.role === 'rival') return '對手';
  if (n.id === h.partner) return h.married ? '伴侶' : '戀人';
  return n.aff >= 80 ? '摯友' : n.aff >= 50 ? '朋友' : n.aff >= 25 ? '認識' : '點頭之交';
}
// 勇者聽不聽你的：回傳 true 表示照你的建議
const heeds = () => { const h = H(); return chance(clamp(.55 + h.trust * .004 + T(h).obey, .15, .97)); };
function socialTick(){
  const h = H(); if (h.socialCd > 0) { h.socialCd--; return; }
  if (!['idle', 'rest', 'home', 'hunt', 'drink'].includes(h.act) || h.bedDays > 0) return;
  const alive = S.npcs.filter(n => n.alive && n.role !== 'rival');
  const opts = [];
  if (alive.some(n => n.aff >= 40) && h.lv >= 4) opts.push('kidnap');
  opts.push('purse', 'shady');
  if (h.lv >= 5 && npc('rival')) opts.push('duel');
  const lover = !h.partner && h.age >= 20 && alive.find(n => dateable(n) && n.aff >= (dw(h, 'romance') ? 50 : 60));
  if (lover) opts.push('love', 'love', 'love');
  const pa = h.partner && npc(h.partner);
  if (pa && pa.alive && !h.married && pa.aff >= 85 && S.day - h.together > 10) opts.push('propose', 'propose');
  if (pa && pa.alive && h.married && h.kidWish === 'no' && !h.child && S.day - h.married > 15) opts.push('kid');
  if (h.goal === 'filial') opts.push('parents', 'parents'); else if (h.age < 30) opts.push('parents');
  if (!h.partner && h.age >= 22 && (dw(h, 'romance') || dw(h, 'family') || h.kidWish === 'want' || h.age >= 27)) opts.push('meetcute', 'meetcute');
  if (!chance(.25)) return;
  h.socialCd = ri(4, 8);
  const k = pick(opts);
  if (k === 'kidnap') {
    const n = pick(alive.filter(n => n.aff >= 40)), z = Math.min(topZ(), bestSafeZone() + 1), cost = 300 + h.lv * 60;
    ev('bad', '急報', `${n.title}${n.name}在${ZONES[z].n}被${ZONES[z].mon}抓走了`);
    ask('kidnap', `老闆！${n.name}被抓走了！我要去救${n.sex === 'f' ? '她' : '他'}！`, ['去救！', `花 ${fmt(cost)} 金請傭兵`, '太危險了，別去'], { id:n.id, z, cost }, 1);
  }
  if (k === 'purse') { const g = ri(80, 200); ask('purse', `我在路上撿到一個錢包，裡面有 ${g} 金……`, ['拿去還人家', '你自己留著吧', '分我一半'], { g }); }
  if (k === 'shady') ask('shady', pickS(['市集有人在賣「勇者神藥」，說喝了會變強，一瓶 200 金。要買嗎？', '有個戴斗篷的人說他有「一喝就升級」的藥水，200 金……要試試嗎？', '酒館裡有人在兜售「龍血精華」，200 金一瓶，好多人在搶。要買嗎？']), ['買給你試試（200）', '不要亂喝來路不明的東西'], {});
  if (k === 'duel') { const rv = npc('rival'); ask('duel', `${rv.title}${rv.name}向我下戰帖，說要在廣場決鬥！`, ['接受，讓他見識一下', '別理他'], {}); }
  if (k === 'raid') { ev('bad', '魔物闖村', '一群魔物趁夜闖進村子'); ask('raid', '魔物闖進村子了！我要去幫忙守村！', ['去吧，小心點', '躲起來，別逞強'], {}, 1); }
  if (k === 'love') ask('love', `老闆……我好像喜歡上${lover.title}${lover.name}了。你覺得我該告白嗎？`, ['去吧！', '專心當勇者', '你自己決定'], { id:lover.id });
  if (k === 'parents') {
    if (!h.partner && h.age >= 24 && chance(.5)) ask('parents', '爸媽又在催婚了，說隔壁的誰誰誰都生第二胎了……', ['你的人生你決定', '那就認真找找看吧', '別理他們'], { t:'marry' });
    else ask('parents', '爸媽打電話來，叫我別當勇者了，回老家考公職……', ['做你自己想做的事', '聽爸媽的，回去看看', '你自己決定'], { t:'job' });
  }
  if (k === 'meetcute') { const v = S.npcs.filter(n => dateable(n) && n.id !== h.partner).sort((a, b) => compat(h, b) - compat(h, a))[0];
    if (v) { v.aff = clamp(v.aff + 20, 0, 100); ev('good', '邂逅', `${h.name}在祭典上和${v.title}${v.name}聊到很晚`); say(pickS([`${v.name}……好像跟我很合得來`, `今天的祭典，我一直跟${v.name}在一起`])); } }
  if (k === 'kid') ask('kid', `${pa.name}說想要小孩……可是我還想過兩個人的生活`, ['支持你的決定', '有孩子也很好啊', '你們兩個好好談'], { id:pa.id });
  if (k === 'propose') ask('propose', `我想跟${pa.name}求婚。可以借我錢買戒指嗎？（500 金）`, ['當然！（500）', '現在還太早', '用你自己的錢'], { id:pa.id });
}
function rescued(n, self){
  if (!n) return; const h = H();
  n.aff = clamp(n.aff + 30, 0, 100); adj('mood', 15); remember('rescued', { n:n.name }); if (self) wishHook('hero');
  ev('good', '平安歸來', `${n.title}${n.name}被${self ? h.name : '傭兵'}救了回來`); logLife(`${self ? '親手救回' : '花錢請人救回'}${n.name}`);
  if (!self) addFame(3);
  if (!offline) say(self ? `${n.name}沒事了！還好我有去` : `${n.name}平安回來了……謝謝你`);
}
function npcDies(n, why){
  if (!n || !n.alive) return; const h = H();
  n.alive = false; n.diedAt = S.day; const close = n.aff / 100 + (n.id === h.partner ? .8 : 0);
  ev('bad', '噩耗', `${n.title}${n.name}${why}`); logLife(`${n.name}${why}`); remember('npcDied', { n:n.name });
  adj('mood', -10 - 25 * close); adj('stress', 8 + 20 * close);
  if (dw(h, 'vengeance') && !h.wish && h.zone >= 0 || dw(h, 'vengeance') && /遇害|救/.test(why)) { const z = Math.min(topZ(), bestSafeZone() + 1); h.wish = { k:'zone', z, t:20, p:0, n:`想替${n.name}報仇`, until:S.day + 24 }; }
  if (n.id === h.partner) { h.partner = null; if (!offline) say(`${n.name}……不要丟下我……`); }
  else if (!offline) say(close > .5 ? `${n.name}……為什麼是${n.sex === 'f' ? '她' : '他'}……` : '……');
}

const QH = {
  contract(i, d){ const h = H();
    if (i !== 0) { if (hx(h, 'X') < .4 || dw(h, 'independence')) say('還好沒簽……我真的不想一直上台'); return; }
    S.gold += d.pay; finAdd('other', 0); S.contract = { who:d.who, need:d.need, done:0, pen:d.pay * 2, until:S.day + 12 }; ev('good', '簽約', `和${d.who}簽下一年代言合約，先拿到 ${fmt(d.pay)} 金`);
    if (hx(h, 'X') < .4 || dw(h, 'independence')) { adj('mood', -8); adj('trust', -3); say(pickS(['又要上台……老闆你真的很會接', '我可以不要上鏡頭嗎……'])); } else say(pickS(['代言？聽起來很好玩！', '我會上鏡頭的！'])); },
  draft2(i){ const h = H();
    if (i === 1 && hasU('draftPass') && S.draftPassY !== Math.floor(S.day / 12)) { S.draftPassY = Math.floor(S.day / 12); adj('trust', 8); S.draftNext = S.day + ri(36, 48); ev('good', '首席特權', '以王國首席經紀的身分婉拒了徵召，王國沒有追究'); say('……謝謝你保護我'); return; }
    if (i === 1) { addFame(-80); repAdd(3, '抗命拒絕王國徵召'); adj('trust', 8); S.draftNext = S.day + ri(18, 24); ev('bad', '抗命', '你的事務所拒絕了王國的定期徵召，王國記下了這筆帳（名聲 -80，下次徵召會更快來）'); say('……謝謝你保護我'); return; }
    S.queue.unshift({ id:Date.now(), kind:'ag', ag:'border', n:'王國定期徵召：駐守邊境', days:3, D:Math.round(power(h) * rand(.85, 1.2)), z:2, fame:30, gold:0, share:0, until:S.day + 3, agreed:1 });
    S.qKey = S.queue.map(x => x.id).join(','); say(pickS(['……知道了，我會活著回來', '國家的命令，沒辦法']));
    if (dw(h, 'independence')) adj('mood', -8); },
  tReg(i, d){ const h = H();
    if (i === 0 || i === 1) { const c = d.fee + (i === 1 ? d.bet : 0); if (S.gold < c) { sys('金庫不夠'); return; }
      if (tHates(h) && !heeds()) { say(pickS(['我真的不想去……就當我任性一次', '報名費我還你，我不要上台'])); adj('trust', -2); return; }
      S.gold -= c; S.tourBet = i === 1 ? d.bet : 0; S.tour = { y:curY() }; adj('mood', tWants(h) ? 8 : tHates(h) ? -6 : 2); say(tWants(h) ? pickS(['好耶！我會拿冠軍回來', '我要開始特訓了！']) : pickS(['好吧，我盡量', '……既然報了就好好打'])); return; }
    if (tWants(h)) { if (i < 0 && S.autonomy === 'free' && h.wallet >= d.fee) { h.wallet -= d.fee; S.tour = { y:curY() }; S.tourBet = 0; say('你沒回，我就自己報名了！'); return; } adj('mood', -8); say(L('tSad')); } },
  tStrat(i){ const h = H(); let st = i < 0 ? (h.trait === 'brave' || dw(h, 'status') ? 2 : h.trait === 'careful' ? 0 : 1) : i;
    if (i === 2 && (h.trait === 'careful' || dw(h, 'tranquility')) && !heeds()) { st = 1; say('不惜代價……我做不到，我會全力打，但不拚命'); }
    if (i === 0 && (h.trait === 'brave' || h.trait === 'hot') && !heeds()) { st = 2; say('穩穩打？那多無聊！'); }
    if (S.tour) tourStart(st); },
  rvSteal(i, d){ const r = S.rivals[d.i];
    if (i === 0 && S.gold >= d.c) { S.gold -= d.c; r.hostile = (r.hostile || 0) + 1; ev('good', '搶單', '你加碼留住了客戶'); return; }
    S.offers = S.offers.filter(o => o.id !== d.id); r.fame += 10; ev('warn', '搶單', `委託被${r.n}搶走了`); renderAll(); },
  rvPoach(i, d){ const h = H(), r = S.rivals[d.i];
    if (i === 0) { S.cut = Math.min(S.cut, 20); adj('trust', 6); say(pickS(['……好，我留下來', '你願意讓步，我就留下'])); return; }
    const stay = chance(clamp(h.trust / 100 + .25 - (h.burn || 0) / 200 + (S.cut <= 25 ? .1 : 0) + (dw(h, 'status') || hx(h, 'X') > .65 ? Math.min(.15, stageOf() * .04) : 0) - (i === 2 || i < 0 ? .2 : 0), .08, .95));
    if (stay) { adj('trust', i === 1 ? 6 : -5); say(i === 1 ? pickS(['我才不會走呢', '……你都這麼說了，我留下']) : pickS(['你都不留我的嗎……算了，我還是留下', '……我留下，但我很難過'])); return; }
    r.fame += 40; ev('bad', '跳槽', `${h.name}被${r.n}挖走了`); die(`被${r.n}挖角，跳槽了`, 'left'); },
  rvSmear(i, d){ const r = S.rivals[d.i]; r.hostile = (r.hostile || 0) + 1;
    if (i === 0 && S.gold >= 300) { S.gold -= 300; addFame(-Math.round(d.hit * .3)); ev('warn', '抹黑', '你發了聲明澄清，風波很快平息'); return; }
    if (i === 1) { if (chance(.5)) { r.fame = Math.max(0, r.fame - 50); S.gold += 200; ev('good', '官司', `你告贏了${r.n}，他們賠了 200 金`); } else { addFame(-Math.round(d.hit * 1.3)); S.gold -= 300; ev('bad', '官司', `誹謗官司輸了，還賠了 300 金`); } return; }
    addFame(-d.hit); repAdd(-2, '被對手抹黑'); ev('bad', '抹黑', `不實傳言越傳越廣，名聲 -${d.hit}`); },
  favor(i, d){ const h = H(), n = npc(d.id); if (!n || !n.alive) return;
    let yes = i === 0 || (i === 2 || i < 0) && chance(.35 + hx(h, 'A') * .4 + dw(h, 'idealism') * .3 + (n.aff >= 50 ? .2 : 0));
    if (i === 1 && (hx(h, 'A') > .7 || dw(h, 'idealism')) && !heeds()) { yes = true; say(`${n.name}都開口了，我不能不幫`); }
    if (!yes) { affAdd(n.id, -6); if (i !== 1) say('……這次就先不幫了'); ev('warn', '婉拒', `${h.name}沒有答應${n.name}的請託`); return; }
    if (S.queue.length >= Q_MAX) { sys('排程滿了，只好跟對方說之後再說'); affAdd(n.id, -2); return; }
    S.queue.push({ id:Date.now(), kind:'offer', n:`幫${n.name}${d.w}`, z:d.z, D:Math.round(zD(d.z) * rand(.8, 1.05)), days:1, reward:0, favor:n.id, until:S.day + 6, agreed:1 }); S.qKey = S.queue.map(x => x.id).join(',');
    say(i === 0 ? L('favorYes') : `我答應${n.name}了`); },
  npcLoan(i, d){ const h = H(), n = npc(d.id); if (!n || !n.alive) return;
    let yes = i === 0 ? true : i === 1 ? (hx(h, 'A') > .75 && !heeds()) : chance(.3 + hx(h, 'A') * .4 + (n.aff >= 60 ? .2 : 0) - dw(h, 'saving') * .4);
    if (i === 1 && yes) say(`可是${n.name}真的很需要……我還是借了`);
    if (!yes || h.wallet < d.g) { affAdd(n.id, -3); if (i !== 1) say('……我還是沒借'); return; }
    h.wallet -= d.g; n.owe = { g:d.g, due:S.day + ri(6, 15) }; affAdd(n.id, 8); if (i !== 1) say(i === 0 ? `${n.name}說一定會還` : `我借了，希望${thp(n)}會還`); },
  donate(i, d){ const n = npc(d.id); let g = i === 0 ? d.g : i === 1 ? Math.round(d.g / 2) : 0;
    if (g && S.gold < g) { sys('金庫不夠'); g = 0; }
    if (!g) { if (n) affAdd(n.id, -5); repAdd(-1, '拒絕村長的捐款請求'); return; }
    S.gold -= g; addFame(i === 0 ? 15 : 6); repAdd((i === 0 ? 4 : 2), '捐款給村子'); if (n) affAdd(n.id, i === 0 ? 15 : 7); ev('good', '捐款', `事務所捐了 ${fmt(g)} 金給村子，村民都看在眼裡`); },
  wedding(i, d){ const h = H(), a = npc(d.a), b = npc(d.b); if (!a || !b) return;
    if (i === 0 && S.gold >= 300) { S.gold -= 300; [a, b].forEach(x => affAdd(x.id, 10)); addFame(3); adj('mood', 8); say('喜酒好好吃！大家都說事務所很大方'); }
    else if (i === 0 || i === 1) { S.gold -= 100; [a, b].forEach(x => affAdd(x.id, 5)); adj('mood', 6); say(pickS(['婚禮好感人……', '被拉去跳舞了，好丟臉']));
      if (!h.partner && (dw(h, 'romance') || dw(h, 'family'))) adj('mood', -3); }
    else [a, b].forEach(x => affAdd(x.id, -4)); },
  visitNpc(i, d){ const h = H(), n = npc(d.id); if (!n || !n.alive) return;
    if (i === 0 && S.gold >= 50) { S.gold -= 50; affAdd(n.id, 8); adj('mood', 3); ev('good', '探病', `${h.name}帶水果去看${n.name}`); }
    else if (i === 1 && S.gold >= 200) { S.gold -= 200; affAdd(n.id, 10); n.sick = Math.min(n.sick || S.day + 1, S.day + 1); n.cured = 1; ev('good', '探病', `${n.name}接受治療，很快就會好`); }
    else if (i === 2 || i < 0) { if (hx(h, 'A') > .6 && !heeds()) { affAdd(n.id, 6); say('……我還是偷偷去看了一下'); } else affAdd(n.id, -3); }
    else sys('錢不夠'); },
  draft(i, d){ const h = H();
    if (i === 1 && S.gold >= d.fine) { S.gold -= d.fine; adj('trust', 5); say('謝謝老闆……我欠你一次'); return; }
    if (i === 2 && hasU('draftPass') && S.draftPassY !== Math.floor(S.day / 12)) { S.draftPassY = Math.floor(S.day / 12); adj('trust', 8); ev('good', '首席特權', '以王國首席經紀的身分婉拒了徵召，王國沒有追究'); say('……謝謝你保護我'); return; }
    if (i === 2) { addFame(-60); repAdd(4, '拒絕徵召，保護勇者'); adj('trust', 8); ev('bad', '抗命', '你的事務所拒絕王國徵召，王國對你們很不滿（名聲 -60）'); say('……謝謝你保護我'); return; }
    if (i === 1) sys('罰金不夠，只能讓他去了');
    S.queue.unshift({ id:Date.now(), kind:'ag', ag:'border', n:'王國徵召：駐守邊境', days:3, D:Math.round(power(h) * rand(.85, 1.2)), z:2, fame:30, gold:0, share:0, until:S.day + 3, agreed:1 });
    S.qKey = S.queue.map(x => x.id).join(','); say(pickS(['……知道了，我會活著回來', '國家的命令，沒辦法']));
    if (dw(h, 'independence')) adj('mood', -8); },
  plague(i, d){ const h = H();
    if (i === 0 && S.gold >= d.cost) { S.gold -= d.cost; h.health = clamp(h.health + 40, 0, 100); h.bedDays = 0; adj('trust', 6); say('喝了藥，好多了。謝謝老闆'); return; }
    if (chance(.35)) { h.health = clamp(h.health - 20, 0, 100); h.bedDays = Math.max(h.bedDays, 3); ev('bad', '病情惡化', `${h.name}的病情惡化了`); say('好難受……'); if (h.health <= 0) die('在流行病中病逝', 'dead'); } },
  lawsuit(i, d){
    if (i === 0) { S.gold -= d.c; ev('warn', '和解', `你賠了 ${fmt(d.c)} 金和解`); return; }
    if (chance(.5)) { addFame(20); ev('good', '勝訴', '官司打贏了，反而讓事務所名聲更響亮'); }
    else { S.gold -= d.c * 2; addFame(-30); ev('bad', '敗訴', `官司打輸了，賠了 ${fmt(d.c * 2)} 金，還丟了面子`); } },
  family(i){ const h = H();
    if (i === 0 || i < 0) { h.visit = 4; setAct('visit'); h.alpha = 0; adj('trust', 8); remember('familyOk'); sys(`${h.name}連夜趕回老家`); if (chance(.3)) { ev('bad', '告別', `${h.name}的家人還是走了，但${pron(h)}趕上了最後一面`); adj('mood', -15); logLife('家人過世，趕上了最後一面'); } return; }
    if (i === 1) { if (chance(.5)) { ev('bad', '遺憾', `${h.name}的家人在${pron(h)}趕回去之前就走了`); adj('mood', -30); adj('trust', -10); h.st.forced += 10; remember('familyLate'); logLife('沒能見到家人最後一面'); say('……我沒趕上。如果那天我直接回去就好了'); } else { h.visit = 3; ev('warn', '家書', `${h.name}做完工作後回老家探望`); } return; }
    adj('trust', -20); adj('mood', -20); h.st.forced += 15; remember('familyNo');
    if (chance(.5)) { ev('bad', '遺憾', `${h.name}的家人過世了，${pron(h)}沒能回去`); logLife('家人過世時，被經紀人留下來工作'); say('……我永遠不會原諒你'); adj('trust', -15); } else say('……知道了'); },
  selfTask(i, d){ const h = H(), it = S.queue.find(x => x.id === d.id); if (!it) return;
    if (i !== 1) { it.agreed = 1; h.st.self += 2; if (i >= 0) adj('trust', i === 2 ? 3 : 2); if (i >= 0) say(i === 2 ? L('trusted') : L('thanks')); return; }
    const insist = !heeds() || (dw(h, 'independence') > .6 && chance(.5));
    if (insist) { it.agreed = 1; h.st.self += 3; adj('trust', -6); say('對不起，這次我想自己決定'); return; }
    S.queue = S.queue.filter(x => x !== it); if (it.kind === 'ag' && S.day < it.until) S.agTasks.push(it); else if (it.kind === 'offer') S.offers.push(it);
    h.st.forced += 2; adj('mood', -5 - (S.autonomy === 'mine' ? 3 : 0)); if (dw(h, 'independence')) adj('trust', -4); say('……好吧'); },
  nego(i){ const h = H(), it = S.queue[0]; if (!it || it.kind === 'rest') return;
    if (i === 0) { if (it.kind === 'ag') it.share = Math.max(it.share || .1, .3); else S.cut = Math.max(10, S.cut - 5); it.agreed = 1; adj('trust', 3); say(pickS(['好，那就這樣', '成交！', '這還差不多', '好吧，看在錢的份上', '你都這樣說了，我就去吧', '三成？好，我認真做', '有誠意，我收下了', '早說嘛', '好啦好啦，我去'])); }
    else if (i === 1) { it.agreed = 1; S.queue.splice(1, 0, ...[1, 2, 3].map(j => ({ id:Date.now() + j, kind:'rest', n:'休息', days:1 }))); adj('trust', 4); repAdd(1, '談判時答應讓勇者休假'); S.qKey = S.queue.map(x => x.id).join(','); say('說好了喔，做完要放假'); }
    else if (i === 2) { adj('trust', -10); adj('stress', 8); h.st.forced += 3;
      if (h.trust < 25 || chance(h.burn > 80 ? .3 : .05)) { S.queue.shift(); if (it.kind === 'ag') S.agTasks.push(it); say('那我不做了。你自己去');
        if (h.burn > 80 && h.trust < 35) { h.goneDays = ri(2, 5); setAct('gone'); h.alpha = 0; repAdd(-6, '勇者受不了而出走'); ev('bad', '出走', `${h.name}受不了被一直壓榨，離開了村子`); } }
      else { it.agreed = 1; remember('used', { n:it.n }); say(pickS(['……知道了', '你眼裡只有事務所吧'])); } }
    else adj('mood', -3); },
  scandal(i, d){ const h = H(), att = d.att || 'sorry';   // v17.77：他的態度（慚愧／喊冤／不在乎）影響後果；被誣陷的話之後會真相大白
    if (i === 0) { addFame(Math.round(d.hit * .5)); repAdd(2, '醜聞後讓勇者公開道歉');
      if (att === 'sorry') { adj('mood', -6); adj('trust', 3); say('……是我不對，我去道歉'); }
      else if (att === 'unfair') { adj('mood', -15); adj('trust', -10); say(d.fake ? '我明明沒做……你寧願相信報紙？' : '我又沒錯，為什麼要我低頭……'); }
      else { adj('mood', -5); adj('trust', -2); say('好啦好啦，道歉就道歉'); } }
    else if (i === 1) { if (S.gold >= d.cost) { S.gold -= d.cost; addFame(Math.round(d.hit * .9)); adj('trust', 4); if (!d.fake && chance(.3)) h.pendingSc = { k:d.k, d:S.day + ri(8, 20), leak:1 }; say(att === 'unfair' ? '……壓下來也好，反正他們亂寫' : '謝謝老闆幫我擋下來'); } else { sys('錢不夠，壓不下來'); addFame(-Math.round(d.hit * .2)); } }
    else if (i === 2) { addFame(Math.round(d.hit * .8)); adj('trust', att === 'unfair' ? -40 : -30); adj('mood', -20); repAdd(-12, '醜聞時公開切割勇者'); remember('betrayed'); logLife('被經紀人公開切割'); say(att === 'unfair' ? '……連你都不信我' : '……原來對你來說，我只是商品');
      if (chance(att === 'unfair' ? .5 : .4)) die('醜聞後被事務所公開切割，傷心地離開', 'left'); }
    else if (i === 3) { addFame(-Math.round(d.hit * .3)); adj('trust', att === 'unfair' ? 20 : att === 'shrug' ? 8 : 15); adj('mood', att === 'unfair' ? 15 : 10); repAdd(6, '醜聞時力挺勇者'); remember('backed'); logLife('醜聞時經紀人力挺到底'); say(att === 'shrug' ? '我就說沒事吧！不過……謝啦' : L('backed')); }
    else { addFame(-Math.round(d.hit * .2)); adj('trust', -3); }
    if (d.fake && h.act !== 'left') h.scTruth = { d:S.day + ri(3, 6), hit:d.hit, i, ag:pick(RIVAL_AG) };
    if (!d.fake && att === 'unfair' && i === 3 && chance(.3)) h.scLie = { d:S.day + ri(3, 8), hit:d.hit, k:d.k }; },   // v17.78：真的有做卻喊冤，你又力挺 → 三成機率之後證據曝光
  crisis(i, d){ const h = H();
    if (i < 0 && !d.warned) { ask('crisis', '（最後通知：銀行說再不處理，就要拍賣事務所的設備。你再不決定，會自動幫你借高利貸。）', ['賣掉一項設施', '借高利貸 1,500 金', '接受銀月經紀社的收購', '接受地下商會的幫忙'], { warned:1 }, 3); return; }
    if (i < 0) i = 1;
    if (i === 3) { S.gold += 2000; enterUnderworld('財務危機時接受了地下商會的幫忙'); ev('warn', '地下', '地下商會給了你 2,000 金，不收利息，只說「之後要幫點小忙」'); return; }
    if (i === 0) { const ks = Object.keys(S.office).filter(k => S.office[k] > 0).sort((a, b) => S.office[b] - S.office[a]);
      if (ks.length) { const k = ks[0]; S.office[k]--; const g = Math.round(officeCost(k, S.office[k]) * .5); S.gold += g; ev('warn', '變賣', `你賣掉了${OFFICE[k].n}的設備，拿回 ${fmt(g)} 金`); } else i = 1; }
    if (i === 1) { S.gold += 1500; S.loan = (S.loan || 0) + 2200; ev('warn', '借貸', '你借了高利貸 1,500 金，之後每天要還 60 金，共 2,200 金'); }
    if (i === 2) { ev('bad', '收購', '你的事務所被銀月經紀社收購了。招牌拆下，一切從頭開始'); S.rivals[1].fame += S.fame * .5; S.fame = 0; S.agDone = 0; Object.keys(S.office).forEach(k => { S.office[k] = 0; }); S.gold = 800; S.loan = 0; S.rep = 50; S.cut = 35; S.queue = []; adj('trust', -15); logLife('經紀人的事務所被收購'); say('……被收購了？那我以後怎麼辦'); } },
  hop(i){ const h = H();
    if (i === 0) { S.cut = 20; adj('trust', 10); say('好，那我留下來'); }
    else if (i === 1 && S.gold >= 500) { S.gold -= 500; adj('trust', 8); gainExp(expNeed(h.lv) * .3); say('謝謝老闆，我會好好進修'); }
    else if (chance(.45)) { S.rivals[1].fame += 50; die('被銀月經紀社挖角，跳槽了', 'left'); }
    else { adj('trust', -10); say('……好吧，我再想想'); } },
  parents(i, d){ const h = H(); let c = i;
    if (c === 2 || c < 0) c = h.goal === 'filial' ? (chance(.6) ? 1 : 0) : (chance(.7) ? 0 : 1);
    if (d.t === 'job') {
      if (c === 0) { h.st.self += 10; adj('trust', 6); adj('mood', -4); if (h.goal === 'filial') adj('stress', 6); say(L('stayHero')); }
      else { h.st.forced += 10; h.parentsYield = (h.parentsYield || 0) + 1; h.visit = 3; setAct('visit'); h.alpha = 0; sys(`${h.name}回老家了`); }
    } else {
      if (c === 0 || c === 2) { h.st.self += 5; adj('stress', -5); say('對嘛，結婚又不是比賽'); }
      else { h.st.forced += 5; const al = S.npcs.filter(n => n.alive && n.role === 'villager'); if (al.length) affAdd(pick(al).id, 15); adj('stress', 4); say('……好啦，我會多出去走走'); }
    } },
  reveal(i){ const h = H();
    if (i === 0) { adj('trust', 10); adj('mood', 10); h.supported = 1; h.st.self += 15; say('謝謝你……終於可以不用裝了'); }
    else if (i === 1) { adj('trust', -8); say('……對不起'); }
    else if (i === 2) { h.st.forced += 20; adj('mood', -10); adj('stress', 8); say('……好，我盡量'); } },
  kid(i, d){ const h = H(), n = npc(d.id); if (!n) return;
    if (i === 0 || i < 0) { adj('trust', i === 0 ? 4 : 0); affAdd(n.id, -10); say(i === 0 ? '謝謝你懂我' : '……'); if (n.aff < 40 && chance(.3)) { ev('bad', '分開', `${h.name}和${n.name}因為想法不同分開了`); logLife(`和${n.name}分開`); h.partner = null; h.married = 0; adj('mood', -25); } }
    else if (i === 1) { if (heeds()) { h.kidWish = 'want'; adj('mood', 5); say('……好吧，也許是時候了'); logLife('決定要孩子'); } else { adj('trust', -6); say('這是我的人生，讓我自己決定'); } }
    else { if (chance(.5)) { h.kidWish = 'want'; ev('good', '共識', `${h.name}和${n.name}談了一整晚，決定要孩子`); } else { ev('warn', '共識', `${h.name}和${n.name}決定維持兩個人的生活`); affAdd(n.id, -3); } } },
  kidnap(i, d){ const h = H(), n = npc(d.id); if (!n || !n.alive) return;
    let c = i < 0 ? -1 : heeds() ? i : -1;
    if (c === -1) c = (h.trait === 'careful' && h.stress > 50 || dw(h, 'tranquility') && !dw(h, 'idealism')) ? 2 : 0;   // 自己的意思：通常會去救
    if (i >= 0 && c !== i) say(c === 0 ? `不行，我不能丟下${n.name}！` : '……對不起，我真的不敢去');
    if (c === 1 && S.gold < d.cost) { sys('錢不夠請傭兵'); c = h.trait === 'careful' ? 2 : 0; }
    if (c === 0) { h.act = 'mission'; h.mission = { n:'救出' + n.name, z:d.z, D:Math.round(zD(d.z) * 1.25), days:1, reward:0, rescue:n.id }; h.actDays = 1; preRoll(h); h.zone = -1; h.target = null;
      h.tx = ZONES[d.z].rect[0] + 10; h.ty = ZONES[d.z].rect[1] + 10; sys(`${h.name}衝去${ZONES[d.z].n}救${n.name}了`); adj('stress', 10); }
    else if (c === 1) { S.gold -= d.cost; if (chance(.7)) rescued(n, false); else npcDies(n, '沒能被傭兵救回來'); }
    else { if (chance(.6)) npcDies(n, `在${ZONES[d.z].n}遇害`); else { ev('warn', '脫困', `${n.name}自己逃了回來，但不太想理${h.name}`); n.aff = clamp(n.aff - 25, 0, 100); } adj('trust', -6); } },
  purse(i, d){ const h = H(); let c = i < 0 ? (h.trait === 'greedy' ? 1 : 0) : i;
    if (i === 0 && h.trait === 'greedy' && !heeds()) { c = 1; say('……還？我才不要'); }
    if (c === 0) { adj('mood', 6); addFame(3); const al = S.npcs.filter(n => n.alive && n.role !== 'rival'); if (al.length) affAdd(pick(al).id, 6); ev('good', '拾金不昧', `${h.name}把錢包還給了失主`); }
    else if (c === 1) { h.wallet += d.g; if (chance(.3)) { adj('mood', -8); addFame(-5); ev('warn', '被發現', `失主找上門，村裡開始傳${h.name}私吞錢包`); } }
    else { h.wallet += Math.round(d.g / 2); S.gold += Math.round(d.g / 2); adj('trust', -3); say('……老闆你也太會算了吧'); } },
  shady(i){ const h = H();
    if (i === 0 && S.gold >= 200) { S.gold -= 200; drinkPotion(); }
    else if ((h.trait === 'curious' || h.trait === 'hot') && h.wallet >= 200 && chance(.5)) { h.wallet -= 200; say('……我還是偷偷買了一瓶'); drinkPotion(); }
    else say(L('noBuy')); },
  duel(i){ const h = H(), rv = npc('rival'); let go = i === 0;
    if (!go && (dw(h, 'vengeance') || hx(h, 'A') < .3) && !heeds()) { go = true; say('這口氣我嚥不下去！'); }
    if (!go && (h.trait === 'brave' || h.trait === 'hot') && !heeds()) { go = true; say('被嗆成這樣我忍不下去！'); }
    if (!go) { adj('stress', 8); if (h.trait === 'brave' || h.trait === 'hot') adj('mood', -8); ev('warn', '嘲笑', `${rv.name}到處說${h.name}是膽小鬼`); return; }
    if (power(h) * rand(.7, 1.3) > power(h) * rand(.75, 1.25)) { addFame(10); adj('mood', 15); remember('duelWin', { n:rv.name }); wishHook('duelWin'); ev('good', '決鬥', `${h.name}在廣場上擊敗了${rv.name}`); logLife(`在決鬥中擊敗對手${rv.name}`); say('看到沒！'); }
    else { adj('mood', -15); adj('stress', 10); remember('duelLose', { n:rv.name }); ev('warn', '決鬥', `${h.name}輸給了${rv.name}`); logLife(`決鬥輸給${rv.name}`); h.act = 'idle'; injure('light', '決鬥時被打傷'); } },
  raid(i){ const h = H(); let go = i === 0;
    if (!go && dw(h, 'idealism') && !heeds()) { go = true; say('我不能看著大家被欺負！'); }
    if (!go && (h.trait === 'loyal' || h.trait === 'brave') && !heeds()) { go = true; say('村子是我的家，我不能躲！'); }
    if (go) { const r = power(h) / zD(Math.min(topZ(), bestSafeZone() + 1));
      if (chance(clamp(.35 + r * .4 + (isFr('mayor') ? .1 : 0), .2, .9))) { addFame(15); adj('mood', 12); remember('raid'); wishHook('hero'); if (dw(h, 'idealism')) adj('mood', 10); S.npcs.forEach(n => { if (n.role !== 'rival') affAdd(n.id, 8); }); ev('good', '守住了', `${h.name}帶頭擊退了魔物，村民們都來道謝`); logLife('擊退闖進村子的魔物'); }
      else { h.act = 'idle'; injure(chance(.5) ? 'heavy' : 'light', '守村時被魔物打傷'); } }
    else { const al = S.npcs.filter(n => n.alive && n.role !== 'rival');
      if (al.length && chance(.35)) npcDies(pick(al), '在魔物闖村時遇害'); else ev('warn', '損失', '村子被魔物破壞了不少地方');
      if (h.trait === 'loyal') adj('trust', -10); adj('stress', 8); } },
  love(i, d){ const h = H(), n = npc(d.id); if (!n || !n.alive) return;
    if (n.mate) { const m = npc(n.mate); adj('mood', -10); say(`……原來${n.name}已經在跟${m ? m.name : '別人'}交往了`); return; }
    if (i === 1 && heeds()) { adj('mood', -12); adj('trust', -4); affAdd(n.id, -10); say('……知道了'); return; }
    if (i === 1) say('對不起，這件事我想自己決定');
    if (chance(n.aff / 100 + .1)) { h.partner = n.id; h.together = S.day; wishHook('partner'); adj('mood', 25); adj('stress', -10); remember('love', { n:n.name }); ev('good', '戀愛', `${h.name}和${n.title}${n.name}在一起了`); logLife(`和${n.name}在一起`); say('成功了！！' + n.name + '答應了！'); }
    else { adj('mood', -20); affAdd(n.id, -15); ev('warn', '失戀', `${n.name}拒絕了${h.name}的告白`); say('……被拒絕了。今晚讓我一個人靜一靜'); } },
  propose(i, d){ const h = H(), n = npc(d.id); if (!n || !n.alive) return;
    const wed = () => wedding(n);
    if (i === 0 && S.gold >= 500) { S.gold -= 500; adj('trust', 10); wed(); say('老闆，謝謝你，婚禮你一定要坐主桌'); }
    else if (i === 2 && h.wallet >= 300) { h.wallet -= 300; wed(); adj('trust', -2); }
    else { adj('mood', -10); adj('trust', -5); h.together = S.day; say(i === 2 ? '我的錢不夠啦……那再等等吧' : '……好吧，再等等'); } },

  cut(i, d){ const h = H();
    if (i === 0) { S.cut = d.want; adj('trust', 15); adj('mood', 8); say('謝啦老闆，明天我就出門！'); }
    else if (i === 1) { if (chance(.55)) { S.cut -= 5; adj('trust', 5); say('……好吧，成交'); } else { adj('trust', -8); h.strikeDays = 1; say('那我再休一個月，你自己想清楚'); } }
    else { adj('trust', -15); adj('stress', 10); h.strikeDays = ri(1, 2); say(pickS(['好，那我就不出門', '合約、合約，你眼裡只有錢']));
           if (h.trust < 15 && chance(.4)) { ev('bad', '解約', `${h.name}把合約撕了`); die('和經紀人鬧翻，撕毀合約離開', 'left'); } } },
  gone(i){ const h = H(); if (i === 0) { h.letter = 1; adj('trust', 8); sys('你寫了一封長長的信'); } else if (i === 1) { if (S.gold >= 300) { S.gold -= 300; h.search = 1; sys('你派人四處打聽'); } else sys('錢不夠，派不了人'); } },
  debt(i){ const h = H(); if (i === 0) { if (S.gold >= h.debt) { S.gold -= h.debt; adj('trust', 12); say('……我不會再賭了，真的'); } else { sys('你的錢也不夠'); adj('stress', 15); } }
    else if (i === 1 || i < 0) { adj('stress', 20); adj('mood', -10); adj('trust', -6); if (chance(.4)) { injure('light', '被賭場的人教訓'); } }
    else { S.gold -= h.debt; h.payback = h.debt; adj('trust', 3); say('好……我會努力賺回來'); } h.debt = 0; },
  priv(i, d){ if (i === 0) adj('trust', 6); else if (i === 1) adj('trust', 1); else { const f = Math.round(d.g / 2); H().wallet -= f; S.gold += f; adj('trust', -12); adj('mood', -10); say('……知道了'); } },
  job(i){ const h = H(); const br = i === 1 ? 'B' : i === 0 ? 'A' : (h.trait === 'careful' || h.trait === 'calm' ? 'B' : 'A');
    if (!h.branch) h.branch = br; h.job++; adj('mood', 20); if (i <= 1 && i >= 0) adj('trust', 4);
    ev('good', '轉職', `${h.name}成為「${jobName(h)}」`); logLife(`轉職成為${jobName(h)}`); say('從今天開始，我是' + jobName(h) + '了！'); },
  retire(i){ const h = H();
    if (i === 0) { say('謝謝你，老闆。這些年……真的很開心。'); die(`在 ${Math.floor(h.age)} 歲那年安穩退休，留在村裡當教練`, 'retired'); }
    else if (i === 1) { adj('trust', -8); adj('stress', 10); h.retireAsk = S.day + 12; say(L('retireDeny')); }
    else { adj('trust', -20); adj('stress', 20); adj('mood', -15); h.retireAsk = S.day + 8; say('你根本不在乎我的身體'); } },
  wishFail(){},
  hello(i){ if (i === 0) { adj('trust', 5); adj('mood', 5); } else if (i === 2) adj('trust', -5); },
};
function drinkPotion(){
  const h = H(), x = Math.random();
  if (x < .45) { h.boost = (h.boost || 0) + .06; ev('good', '神藥', `${h.name}喝下神藥，感覺力量湧了上來（戰力 +6%）`); }
  else if (x < .8) { ev('warn', '神藥', '只是加了糖的水，什麼也沒發生'); }
  else { h.health = clamp(h.health - 20, 0, 100); h.bedDays = Math.max(h.bedDays, 2); setAct('bed'); ev('bad', '神藥', `${h.name}喝完上吐下瀉，躺了兩天`); }
}
function visitReturn(){
  const h = H(); h.alpha = 1; h.x = GX; h.y = GY; h.tx = GX; h.ty = GY;
  if (h.goal === 'filial' && h.trust < 50 && (h.parentsYield || 0) >= 2 && chance(.35)) { die('聽從爸媽的期望，回老家考公職，不再當勇者', 'left'); return; }
  setAct('rest'); sys(`${h.name}從老家回來了`); say(pickS(['回來了。爸媽還是老樣子', '在家被唸了三天……還是這裡自在']));
}
// 口是心非：他說的原型和行為對不上時，你會慢慢發現
function clue(action){
  const h = H(); if (h.revealed || h.said === h.goal || offline || !chance(.5)) return;
  h.clues = (h.clues || 0) + 1;
  if (h.clues <= 3) ev('warn', '觀察', `${h.name}說自己是「${GOALS[h.said].n}」，卻${action}`);
  if (h.clues >= 4 && !S.q) {
    h.revealed = true; remember('reveal');
    ev('warn', '真心話', `${h.name}其實是「${GOALS[h.goal].n}」`); logLife(`坦白自己其實是${GOALS[h.goal].n}`);
    ask('reveal', `……被你發現了。我其實是「${GOALS[h.goal].n}」，之前怕你看不起我才那樣說`, ['做真正的自己就好', '所以之前都是騙我的？', '以後照你說的那樣做'], {}, 3);
  }
}
// 社會比較：同期勇者的近況會影響他
function compareRival(){
  const h = H(), rv = npc('rival');
  const news = [[`升上了 Lv${h.lv + ri(2, 6)}`, 'lv'], ['在王都買了房子', 'house'], ['結婚了', 'marry'], ['被王國授勳', 'fame']];
  if (!h.bossKill) news.push([`打倒了${BOSS.n}`, 'boss']);
  const [t, k] = pick(news);
  ev('warn', '同期', `聽說${rv.name}${t}`);
  const envy = dw(h, 'status') > .6 || dw(h, 'vengeance') && k === 'boss' || h.mood < 50 || (k === 'house' && h.goal === 'etf') || (k === 'marry' && h.goal === 'filial') || h.goal === 'seiko';
  if (envy) { adj('mood', -8); adj('stress', 8); say(pickS([`為什麼${rv.name}什麼都比我順……`, '大家都過得比我好', `${rv.name}都${t.replace(/^在王都/, '')}了，我呢`])); }
  else { h.scolded = 2; adj('mood', 2); say(L('rivalPush', { n:rv.name }));  }
}
function askJob(){ const h = H(); const c = CLS[h.cls];
  if (h.job === 0) ask('job', `我到 Lv15 了，可以去神殿轉職！你覺得我該走哪條路？`, [`${c.A[0]}（攻擊）`, `${c.B[0]}（穩健）`, '你自己決定'], {}, 3);
  else ask('job', `Lv30 了！神殿說我可以再轉職成「${c[h.branch][1]}」`, ['去吧！', '好，你決定就好'], {}, 3);
}

// ================= 委託 =================
function refreshOffers(){
  const h = H(); S.offers = []; S.offerDay = S.day;
  const zs = [bestSafeZone(), Math.min(topZ(), bestSafeZone() + 1), Math.min(topZ(), bestSafeZone() + ri(0, 2))];
  const NAMES = [['清掉田邊的史萊姆','護送商人過草原','幫農夫找走失的牛'], ['掃蕩森林的哥布林','採集森林深處的草藥','救出迷路的小孩'], ['清除荒地的木乃伊','調查荒地遺跡','奪回被搶的貨物'],
    ['清理礦坑裡的骷髏礦工','救出受困的礦工','護送礦石車'], ['驅逐海岸的大螃蟹','找回沉船的貨物','護送漁村的祭典'], ['討伐雪山的雪怪','護送翻山的商隊','尋找冰原上的遇難者'], ['潛入魔王城偵察','擊退魔王城的黑騎士','奪回被搶走的聖物']];
  for (let j = 0; j < (S.office.intel || 0); j++) zs.push(Math.min(topZ(), bestSafeZone() + ri(0, 2)));
  if (isFr('guild')) zs.push(Math.min(topZ(), bestSafeZone() + ri(0, 1)));
  const rk = (1 + rkx() * .25) * (isFr('guild') ? 1.1 : 1) * (S.priceWar > S.day ? .8 : 1);
  zs.forEach((z, i) => { const Z = ZONES[z], k = rand(.9, 1.5) + Math.min(i, 2) * .25;
    S.offers.push({ id:S.day * 10 + i, z, n:pick(NAMES[z]), D:Math.round(Z.D * k), days:ri(2, 4), reward:Math.round(Z.gold * 12 * k * ri(2, 4) / 2 * rk) }); });
  if (!h.bossKill && bossOpen(h)) S.offers.push({ id:S.day * 10 + 9, z:2, n:'討伐' + BOSS.n, D:BOSS.D, days:2, reward:BOSS.reward, boss:true });
  if (zoneOpen(6) && !S.boss2Done) S.offers.push({ id:S.day * 10 + 8, z:6, n:'討伐' + BOSS2.n, D:BOSS2.D, days:3, reward:BOSS2.reward, boss2:true });
  // v16：公會指名（約每半年一件，對手搶不走）、王室委託、跨國委託
  if (hasU('nominate') && S.day >= (S.nomNext || 0)) { const z = Math.min(topZ(), bestSafeZone() + 1), Z = ZONES[z]; S.offers.push({ id:S.day * 10 + 6, z, n:'公會指名：' + pick(NAMES[z]), D:Math.round(Z.D * 1.1), days:3, reward:Math.round(Z.gold * 12 * 1.5 * 1.5 * rk), nom:1 }); S.nomNext = S.day + ri(5, 7); }
  if (hasU('royal') && chance(.4)) { const z = topZ(), Z = ZONES[z]; S.offers.push({ id:S.day * 10 + 5, z, n:'王室委託：' + pick(['護送公主出巡', '守衛王室寶庫', '調查宮廷怪事']), D:Math.round(Z.D * 1.15), days:3, reward:Math.round(Z.gold * 12 * 2 * rk), nom:1 }); }
  if (hasU('abroad') && chance(.4)) { const z = topZ(), Z = ZONES[z]; S.offers.push({ id:S.day * 10 + 4, z, n:'跨國委託：' + pick(['護送使節團', '討伐邊境的魔獸群', '鄰國的王家委託']), D:Math.round(Z.D * 1.25), days:4, reward:Math.round(Z.gold * 12 * 2.4 * rk) }); }
  $('dQuest').classList.add('on');
}
let mHold = 0, mTimer = null, mOffer = null, mComp = null;
function openMission(o, keep){
  const h = H(); if (!keep || !mOffer || mOffer.id !== o.id) mComp = null; mOffer = o;
  const showComp = canFightComp(o), cm = showComp ? compMul(mComp) : 1, De = o.D / cm;
  const r = ratio(h, De), d = danger(r), fd = feelDanger(h, De), win = o.D ? Math.round(winP(r) * 100) : 100;
  const etaEnd = (() => { const e = etaList(); return e.length ? e[e.length - 1] + (S.queue[S.queue.length - 1].days || 1) : S.day + 1 + (h.act === 'mission' ? h.actDays : 0); })();
  const cn = mComp && npc(mComp);
  const fear = cn && d.i >= 1 ? pickS([`有${cn.name}在，我比較放心。`, `${cn.name}也一起去的話，應該沒問題`]) : fd.i === 2 ? (h.trait === 'brave' ? '九死一生？聽起來很刺激！' : h.trust > 60 ? '這趟……老實說我有點怕。但你說去，我就去。' : '你是想害死我嗎？') : fd.i === 1 ? pick(['有點難，但應該還行', '我會小心的']) : pick(['小事一樁！', '輕鬆啦']);
  const Z = o.z >= 0 ? ZONES[o.z] : null, st = [h.sta < 25 ? ['r', '很累'] : h.sta < 50 ? ['o', '有點累'] : ['g', '精神好'], h.bedDays > 0 ? ['r', '養傷中'] : hasP(h, 'lame') ? ['o', '跛腳'] : hasP(h, 'scar') ? ['o', '有舊傷'] : null, [h.pots ? '' : 'o', `藥水 ×${h.pots}`], fd.i !== d.i ? ['o', fd.i < d.i ? '他太有自信了' : '他太擔心了'] : null].filter(Boolean);
  const comps = showComp ? S.npcs.filter(canComp) : [];
  // v17.75 出發卡新版（design-wip design/ui/草圖_出發卡.png）：木條標題＋任務卡（同任務頁）＋出發的人＋狀況圖示＋他說的話＋金色「排進排程」
  const ST_IC = { '很累':'體力', '有點累':'體力', '精神好':'體力', '養傷中':'生病', '跛腳':'生病', '有舊傷':'生病' };
  const stIc = t => ST_IC[t] || (t.startsWith('藥水') ? '照顧' : '驚嘆'), stTx = t => t.startsWith('藥水') ? t.replace('藥水 ', '') : t;
  const left = o.until ? o.until - S.day : null, dur = durTxt(h, o).replace(/ ?個月/, ' 月');
  const pct = o.ag ? Math.round((o.share || .1) * 100) : S.cut;
  const who = (n, cls) => `<span class="mfc${cls ? ' ' + cls : ''}">${pimg(n)}</span>`;
  $('mBox').innerHTML = `
    <div class="mh">${IC('任務', 2)}<b>出發前</b><span class="rsp"></span><button class="pb mx" id="mNo" aria-label="關閉">✕</button></div>
    <div class="mbd">
    <div class="pb qc2 mcard${o.ag ? ' ag' : ''}${o.boss || o.boss2 ? ' boss' : ''}">
      <div class="qch"><span${TIPA(o.ag ? '事務所' : '任務', o.ag ? '事務所任務' : o.boss || o.boss2 ? '村長的懸賞' : '冒險者公會的委託', o.ag ? AGT[o.ag].d : typeTag(o) + (Z ? Z.n : '村子'))}>${IC(o.ag ? '事務所' : '任務', 2)}</span><b>${Z ? Z.n : '村子'}</b><span class="mgap"></span>${IC('時間', 2)}<b>${dur}</b><span class="rsp"></span>${left != null ? `<span class="${left <= 1 ? 'mdue r' : 'mdue'}">${IC('時間', 2)}<b>剩 ${Math.max(0, left)} 月</b></span>` : ''}</div>
      <div class="qcb">
        <div class="qcn f22">${esc(o.n)}</div>
        <div class="qcr">${o.ag ? `<span class="num"${TIPA('名聲')}>${IC('名聲', 2)}<b>+${o.fame}</b></span>` : ''}<span class="num"${TIPA('金幣', '報酬', o.ag ? '事務所拿到的錢' : '委託的報酬')}>${IC('金幣', 2)}<b>${fmt(o.ag ? o.gold : o.reward)}</b></span><span class="num s mu"${TIPA('事務所', o.ag ? pron(h) + '拿多少' : '你抽成', o.ag ? `${pron(h)}只拿 ${pct}%，其他歸事務所` : `你從報酬裡抽 ${pct}%`)}>${IC('事務所', 1)}<b>${pct}%</b></span></div>
        <div class="qcr mdg">${o.D ? `<span${TIPA('危險', d.n, '照他現在的戰力' + (cn ? `，加上${cn.name}` : ''))}>${d.i === 0 ? `<b class="cg f16">安全</b>` : Array.from({ length:d.i + 1 }, () => IC('危險', 2)).join('')}</span><span class="rsp"></span><b class="mwin ${d.i === 0 ? 'cg' : d.i === 1 ? 'co' : 'cr'}">勝率 ${win}%</b>` : `${IC('心情', 2)}<b class="cg f16">不用打</b>`}</div>
      </div>
    </div>
    ${o.until && etaEnd > o.until ? `<div class="mlate cr f14">${IC('時間', 2)}<b>大約 ${etaEnd - S.day} 個月後才輪到，會趕不上期限</b></div>` : ''}
    <div class="msec f14 mu">出發</div>
    <div class="mparty">
      <div class="pb mslot me">${who(h)}<div><b class="f22">${esc(h.name)}</b><span class="num"${TIPA('戰力')}>${IC('戰力', 2)}<b>${Math.round(power(h))}</b></span></div></div>
      ${!showComp ? `<div class="mslot e f16 mu">一個人去</div>`
        : cn ? `<div class="pb mslot g">${who(cn)}<div><b class="f22">${esc(cn.name)}</b><span class="num s cg"${TIPA('戰力', '同伴', '同伴越強勝率越高，但同伴也可能受傷')}>${IC('戰力', 2)}<b>+${Math.round(cn.pw * 100)}%</b></span>${compCost(cn) ? `<span class="num s"${TIPA('金幣', '傭金', '出發時付給' + cn.name)}>${IC('金幣', 2)}<b>${fmt(compCost(cn))}</b></span>` : ''}</div><button class="pb ns mrm" data-cmp="" aria-label="拿掉同伴">${IC('刪除', 2)}</button></div>`
        : `<div class="mslot e"${TIPA('一起出任務', '同伴', '同伴越強勝率越高，但同伴也可能受傷')}>${IC('加號', 3)}<span class="f16 mu">選同伴</span></div>`}
    </div>
    ${showComp ? (comps.length ? `<div class="mpicks">${comps.map(n => `<button class="pb mpick${mComp === n.id ? ' g' : ''}" data-cmp="${mComp === n.id ? '' : n.id}">${who(n, 's')}<span><b class="f16">${esc(n.name)}</b><b class="f16 cg">+${Math.round(n.pw * 100)}%</b>${compCost(n) ? `<span class="num s">${IC('金幣', 1)}<b class="f14">${fmt(compCost(n))}</b></span>` : ''}</span></button>`).join('')}</div>`
      : `<div class="f14 mu">交情到「朋友」以上的人，才願意陪著出任務</div>`) : ''}
    <div class="mst">${st.map(([c, t]) => `<span class="pb ns mchip"${TIPA(stIc(t), stTx(t), '他現在的狀況')}>${IC(stIc(t), 2)}<b class="${c === 'r' ? 'cr' : c === 'o' ? 'co' : c === 'g' ? 'cg' : ''}">${esc(stTx(t))}</b></span>`).join('')}</div>
    <div class="msay">${who(h, 's')}<div class="pb ns mbub f16">${esc(fear)}</div></div>
    <button class="pb au mgo" id="mGo" ${S.queue.length >= Q_MAX ? 'disabled' : ''}>${IC('排程', 2)}<b>${S.queue.length >= Q_MAX ? '排程滿了' : '排進排程'}</b></button>
    </div>`;
  $('mission').classList.add('on'); S.paused = true;
  $('mNo').onclick = closeMission; $('mGo').onclick = () => enqueue(o);
  $('mBox').querySelectorAll('[data-cmp]').forEach(b => b.onclick = () => { mComp = b.dataset.cmp || null; openMission(o, true); });
  $('mission').onclick = e => { if (e.target.id === 'mission') closeMission(); };
}
function enqueue(o){
  closeMission();
  if (S.queue.length >= Q_MAX) { toast('排程滿了'); return; }
  S.queue.push({ ...o, kind:o.ag ? 'ag' : 'offer', share:o.share || .1, comp:canFightComp(o) ? mComp : null });
  if (o.ag) S.agTasks = S.agTasks.filter(x => x.id !== o.id); else S.offers = S.offers.filter(x => x.id !== o.id);
  queueComment(); renderAll();
}
function queueComment(){
  const h = H(); let run = 0, maxRun = 0;
  S.queue.forEach(it => { if (it.kind === 'rest') run = 0; else { run += it.days; maxRun = Math.max(maxRun, run); } });
  const key = S.queue.map(it => it.id).join(','); if (key === S.qKey) return; S.qKey = key;
  if (maxRun >= 6) { say(pickS([`連排 ${maxRun} 個月的工作？你是要累死我嗎`, '老闆，排程表上完全沒有休假……'])); adj('trust', -2); }
  else if (S.queue.some(it => it.ag === 'spy') && hx(h, 'H') > .6) say('臥底？……這種事我真的不想做');
  else if (S.queue.some(it => it.ag === 'trial')) say(pickS(['試藥……真的安全嗎', '拿我的身體去試藥喔？']));
  else if (S.queue.some(it => it.kind === 'rest') && maxRun >= 2) { if (chance(.5)) say('謝謝你幫我排休'); adj('trust', 1); }
}
function refreshAg(){
  const h = H(), rk = rkx(); S.agDay = S.day; S.agTasks = S.agTasks.filter(it => S.day <= it.until);
  const pool = ['endorse', 'variety', 'meet', 'arena', 'trial']; if (rk >= 1) pool.push('spy', 'border'); if (rk >= 2) pool.push('hunt', 'border');
  const n = 3 + ((S.office.intel || 0) >= 1 ? 1 : 0), m = 1 + rk * .3, P = power(h);
  for (let i = 0; i < n && S.agTasks.length < 6; i++) { const k = pick(pool), A = AGT[k];
    S.agTasks.push({ id:S.day * 100 + i + 50, ag:k, n:A.n, days:A.days, D:A.dk ? Math.round(P * rand(A.dk[0], A.dk[1])) : 0, z:A.z, fame:Math.round(A.fame * .6 * m), gold:Math.round(A.gold * .6 * m * (1 + h.lv / 20)), share:.1, until:S.day + ri(6, 12) }); }
  $('dQuest').classList.add('on');
}
// 他對排程第一項的反應：照做、談判、拒絕、睡過頭
function reactTo(it){
  const h = H();
  if (h.sta < 25 || h.bedDays > 0) return 'nego';
  const fd = it.D ? feelDanger(h, it.D / compMul(it.comp)) : { i:0 };
  let no = 0;
  if (fd.i === 2) no += h.trait === 'brave' ? .2 : .6;   // v17.21：更怕死
  if (h.goal === 'health' && (fd.i >= 1 || it.ag === 'trial' || it.ag === 'border')) no += .5;
  if (dw(h, 'tranquility') && fd.i >= 1) no += .25;
  if (it.ag === 'spy') no += hx(h, 'H') * .5;
  if (it.ug) { no += hx(h, 'H') * .6 - (h.wallet < 60 ? .2 : 0);
    if (it.violent && (hx(h, 'H') > .6 || hx(h, 'A') > .65)) { if (hx(h, 'H') > .7 && !S.q && !offline) ask('vWhistle', '老闆，這種事我不會做。你再叫我碰，我就去公會把一切說出來。', ['好，我們收手', '你敢就試試看'], {}, 2); return 'refuse'; } }
  if (it.ag === 'endorse') no += dw(h, 'independence') * .3;
  if (it.ag === 'meet' || it.ag === 'variety') no += (1 - hx(h, 'X')) * .3 + dw(h, 'independence') * .2;
  if (it.ag === 'trial') no += .2 + hx(h, 'E') * .2;
  no -= (h.trust - 50) / 150 + (hx(h, 'A') - .5) * .3;
  if (chance(clamp(no, 0, .9))) return h.trust < 40 || hx(h, 'A') < .35 ? 'refuse' : 'nego';
  if ((h.workStreak >= 5 || h.burn > 60) && chance(.5)) return 'nego';
  if (hx(h, 'C') < .3 && chance(.15)) return 'skip';
  return 'go';
}
function prepComp(h, it){
  if (!canFightComp(it)) return it;
  let n = it.comp && npc(it.comp);
  if (n && !canComp(n)) { sys(`${n.name}沒辦法同行，${h.name}只好一個人去`); n = null; }
  if (!n && !it.comp && feelDanger(h, it.D).i >= 1 && chance(.2 + hx(h, 'X') * .3 + dw(h, 'social') * .3)) {   // 他自己找朋友一起去
    const f = S.npcs.filter(x => canComp(x) && x.role !== 'merc').sort((a, b) => b.aff - a.aff)[0];
    if (f) { n = f; if (!offline) say(pickS([`我找了${f.name}一起去，比較安心`, `${f.name}說要陪我去！`])); }
  }
  if (n && n.role === 'merc') { const c = compCost(n); if (S.gold < c) { sys(`金庫不夠付${n.name}的傭金，${h.name}一個人出發`); n = null; } else { S.gold -= c; affAdd(n.id, 3); } }
  if (n && n.role !== 'merc' && danger(ratio(h, it.D)).i === 2 && n.aff < 70 && chance(.5)) { ev('warn', '婉拒', `${n.name}說這趟太危險，沒辦法陪${h.name}去`); n = null; }
  return { ...it, comp:n ? n.id : null };
}
// 同伴的下場
function compAfter(o, ok, di){
  const h = H(), n = o.comp && npc(o.comp); if (!n || !n.alive) return;
  if (ok) {
    affAdd(n.id, 5 + di * 3); remember('fought', { n:n.name });
    if (n.role === 'reporter') addFame(5 + di * 5);
    if (di >= 1 && chance(.1 * di)) { n.sick = S.day + ri(2, 4); news('warn', `${n.name}在「${o.n}」受了點傷，要休養幾天`, true); }
    else if (chance(.5)) ev('good', '並肩作戰', `${h.name}和${n.name}一起完成了「${o.n}」`);
    return;
  }
  const dieP = [.03, .1, .22][di] * (n.role === 'elder' ? 1.5 : 1);
  if (!offline && chance(dieP)) {
    npcDies(n, `在「${o.n}」中為了掩護${h.name}而喪命`); adj('stress', 12); remember('compDied', { n:n.name }); logLife(`${n.name}為了掩護自己而死`);
    if (n.role === 'merc') repAdd(-3, '雇來的傭兵死在任務裡');
    return;
  }
  if (chance(.6)) { n.sick = S.day + ri(3, 6); if (n.role !== 'merc') affAdd(n.id, -3); ev('warn', '同伴受傷', `${n.name}在「${o.n}」受了重傷`); }
}
function startTask(it){
  const h = H(), z = it.z >= 0 ? it.z : -1;
  it = prepComp(h, it);
  h.act = 'mission'; h.mission = { ...it }; h.actDays = it.days; preRoll(h); h.zone = -1; h.target = null; h.fighting = false;
  if (z >= 0) { h.tx = ZONES[z].rect[0] + 10; h.ty = ZONES[z].rect[1] + 10; } else { h.tx = GX; h.ty = GY; }
  sys(`${h.name}${it.comp && npc(it.comp) ? '和' + npc(it.comp).name : ''}出發去「${it.n}」了（約 ${durNum(h, h.mission)} 個月）`);
  const d = it.D ? danger(ratio(h, it.D) * compMul(it.comp)) : { i:0 };
  if (d.i === 2) adj('stress', 15); else if (d.i === 1) adj('stress', 6);
  if (it.ag === 'spy') adj('stress', hx(h, 'H') * 20);
  if (it.kind === 'ag') h.st.forced += it.days; else h.st.self += it.days;
}
function runQueue(){
  const h = H();
  while (S.queue.length) {
    const it = S.queue[0];
    if (it.kind === 'rest') { S.queue.shift(); setAct('rest'); h.st.self++; if (chance(.3)) say(L('restDay')); return true; }
    if (it.until && S.day > it.until) return false;
    if (it.by === 'hero' && !it.agreed && S.q && S.q.key === 'selfTask' && S.q.data.id === it.id) return false;   // 還在等你回覆
    const r = it.agreed ? 'go' : reactTo(it);
    if (r === 'go' && S.tour && S.tour.y === curY() && S.day % 12 <= 9 && it.days > 9 - S.day % 12) { setAct('rest'); if (!offline && chance(.5)) say(pickS(['武鬥大會快到了，我先不出遠門', '大會前我想留在村裡調整狀態'])); return true; }
    if (r === 'go') { S.queue.shift(); startTask(it); return true; }
    if (r === 'skip') { setAct('rest'); ev('warn', '放鴿子', `${h.name}睡過頭，沒去「${it.n}」`); return true; }
    if (r === 'nego') {
      setAct('rest');
      ask('nego', `「${it.n}」……${h.sta < 25 || h.bedDays > 0 ? pickS(['我現在真的沒力氣', '我站著都快睡著了', '身體還沒恢復']) : h.workStreak >= 5 || h.burn > 60 ? pickS(['我已經連續做很久了', '我好幾天沒休息了', '再這樣下去我會爆掉']) : pickS(['這個我不太想做', '這個我有點抗拒', '說真的，我不喜歡這種工作', '我可以不要嗎'])}，${pickS(['能不能談一下？', '有沒有商量的餘地？', '條件能不能好一點？'])}`, ['多分你一點（三成）', '做完放你三個月假', '照排，沒得商量'], {}, 2);
      return true;
    }
    // 拒絕
    S.queue.shift(); if (it.kind === 'ag' && S.day <= it.until) S.agTasks.push(it); else if (it.kind === 'offer') S.offers.push(it);
    const fd = it.D ? feelDanger(h, it.D) : { i:0 };
    say(it.ag === 'spy' ? '臥底？這種事我做不出來' : it.ag === 'trial' ? '拿我的身體去試藥？不要' : fd.i === 2 ? '這根本是去送死，我不去' : it.ag ? pick(['這種工作我不幹', '這個我真的不想接', '換別人去吧', '饒了我吧，這個不行']) : pick(['這個我不想做', '這個委託我沒興趣', '跳過這個吧']));
  }
  return false;
}
function resolveAg(){
  const h = H(), o = h.mission; h.mission = null; h.alpha = 1;
  h.x = o.z >= 0 ? ZONES[o.z].rect[0] + 10 : GX; h.y = o.z >= 0 ? ZONES[o.z].rect[1] + 10 : GY; h.tx = GX; h.ty = GY;
  if (o.ug) { adj('sta', -15 * o.days); resolveUg(h, o); if (o.last) { S.underworld = 0; S.quitAfter = 0; S.agTasks = S.agTasks.filter(t => !t.ug); ev('good', '抽身', '最後一件事辦完了，地下商會放你走了'); } if (h.act !== 'dying' && h.bedDays <= 0) setAct('rest'); return; }
  const pay = () => { const his = Math.round(o.gold * o.share); S.gold += o.gold - his; finAdd('ag', o.gold - his); h.wallet += his; addFame(o.fame); S.agDone = (S.agDone || 0) + 1; yr().ag++; };
  adj('sta', -15 * o.days);
  if (o.ag === 'endorse' || o.ag === 'variety' || o.ag === 'meet') {
    pay(); yr().show++; if (S.contract) S.contract.done++; const like = o.ag === 'endorse' ? .6 - dw(h, 'independence') * .5 + dw(h, 'status') * .3 : hx(h, 'X') - .3 + dw(h, 'status') * .3 + dw(h, 'acceptance') * .2;
    adj('mood', like > .3 ? 8 : -10); adj('stress', like > .3 ? -2 : 8);
    ev('good', '事務所任務', `「${o.n}」完成，事務所名聲 +${o.fame}`); say(like > .3 ? L('showLike') : L('showHate'));
  } else if (o.ag === 'trial') {
    pay(); h.health = clamp(h.health - rand(10, 30), 0, 100); adj('mood', -6);
    if (chance(.3)) { if (!hasP(h, 'side')) h.perks.push('side'); ev('bad', '後遺症', `${h.name}試完藥後，身體留下後遺症（健康回復變慢）`); logLife('新藥試驗留下後遺症'); remember('used', { n:o.n }); say('……老闆，我的手一直在抖'); repAdd(-6, '試藥讓勇者留下後遺症'); }
    else { ev('warn', '事務所任務', `「${o.n}」結束，${h.name}虛弱了好幾天`); say(L('trialYuck')); }
  } else if (o.ag === 'spy') {
    if (chance(.25 + hx(h, 'H') * .2)) { ev('bad', '醜聞', `${h.name}臥底被抓包，報紙大篇幅報導你的事務所搞小動作`); addFame(-40); infamyAdd(8, '臥底被抓包', true); adj('trust', -10); adj('mood', -15); logLife('臥底對手事務所被抓包'); remember('used', { n:o.n }); h.act = 'idle'; injure('light', '臥底被抓時挨了一頓打'); return; }
    pay(); S.rivals[1].fame = Math.max(0, S.rivals[1].fame - 60); adj('stress', hx(h, 'H') * 25); ev('good', '事務所任務', '臥底成功，銀月經紀社的名聲大跌'); say(hx(h, 'H') > .6 ? '我完成了……可是我晚上睡不著' : '輕鬆搞定');
  } else {   // 表演賽、駐守邊境、限期討伐：要打
    const r = ratio(h, o.D) * compMul(o.comp), d = danger(r), p = winP(r);
    if (o.ag === 'border') { h.burn = clamp((h.burn || 0) + 25, 0, 100); adj('stress', 15); }
    if (o.ag === 'exam' && winOf(o, p)) { compAfter(o, true, d.i); pay(); { const r0 = rankOf(); S.exam = o.exam; const r1 = rankOf(); if (r1 > r0) { ev('good', '晉升', `通過考核！你的事務所升格為「${RANKS[r1][1]}」${unlockMsg(r1)}`); $('dOffice').classList.add('on'); } else ev('good', '考核通過', `通過升格考核，名聲和代表作夠了就會升格`); } gainExp(ZONES[o.z].exp * 6); adj('mood', 15); logLife(`通過升格考核「${o.n.replace('升格考核：', '')}」`); say(pickS(['考核過了！事務所要升格了！', '通過了……手還在抖'])); setAct('rest'); return; }
    if (o.ag === 'exam') { S.examCd = S.day + 6; ev('bad', '考核失敗', `「${o.n}」沒有通過，半年後才能再考`); }
    if (o.ag !== 'exam' && winOf(o, p)) { compAfter(o, true, d.i); pay(); gainExp(ZONES[2].exp * 4 * (o.baseDays || o.days)); adj('mood', 10 + dw(h, 'status') * 10); ev('good', '事務所任務', `「${o.n}」完成！事務所名聲 +${o.fame}`); if (d.i === 2) logLife(`完成九死一生的事務所任務「${o.n}」`); say(d.i === 2 ? L('agWinHard') : L('agWin')); }
    else { remember('used', { n:o.n }); compAfter(o, false, d.i);
      if (chance((o.ag === 'arena' ? [0, .05, .25] : [.04, .15, .38])[d.i] * (o.comp ? .6 : 1))) { h.dyingAg = 1; nearDeath(`執行事務所任務「${o.n}」時倒下`, 2); return; }
      h.act = 'idle'; injure(chance(.4 + d.i * .2) ? 'heavy' : 'light', `「${o.n}」失敗`); adj('trust', -6); addFame(-Math.round(o.fame * .3)); return; }
  }
  setAct(restAfter(h) ? 'rest' : 'idle');   // v17.20：不累就不用休一整個月
}
// v6.5：勇者自己安排——挑想接的任務、累了自己排休
function scoreTask(h, o, ag){
  const fd = o.D ? feelDanger(h, o.D) : { i:0 }, money = ag ? o.gold * (o.share || .1) : o.reward * (1 - S.cut / 100);
  let sc = Math.min(1, money / (60 + h.lv * 30)) * (['seiko', 'etf', 'slash', 'filial'].includes(h.goal) ? .6 : .4);
  sc += [.2, 0, -.35][fd.i];
  if (fd.i >= 1) sc += (hx(h, 'O') - .5) * .6 + dw(h, 'physical') * .25 + dw(h, 'status') * .15 + (h.trait === 'brave' ? .25 : 0) - dw(h, 'tranquility') * .4 - (lossAverse(h) ? .25 : 0) - (h.goal === 'health' ? .4 : 0);
  if (o.boss) sc += dw(h, 'power') * .5 + dw(h, 'status') * .3;
  if (ag) {
    sc += -.25 + dw(h, 'status') * .3 + dw(h, 'acceptance') * .2 + (h.trust - 60) / 200 + (h.trait === 'loyal' ? .15 : 0);
    if (o.ag === 'spy') sc -= hx(h, 'H') * .6; if (o.ag === 'trial') sc -= .3;
    if (o.ug) sc -= hx(h, 'H') * .8 - (h.wallet < 60 ? .3 : 0) + (o.violent ? .4 : 0);
    if (o.ag === 'meet' || o.ag === 'variety') sc += (hx(h, 'X') - .5) * .6; if (o.ag === 'endorse') sc -= dw(h, 'independence') * .3;
  }
  if (h.wish && h.wish.k === 'zone' && o.z === h.wish.z) sc += .3;
  if (h.goal === 'cert') sc += fd.i * .1;
  if (h.sta < 50) sc -= .2;
  return sc + rand(-.1, .1);
}
function taskWhy(h, it){
  const fd = it.D ? feelDanger(h, it.D) : { i:0 };
  if (it.kind === 'ag') return dw(h, 'status') ? pickS(['想讓更多人認識我', '這是出名的好機會', '想讓王都的人也聽過我的名字']) : pickS(['事務所也需要代表作吧', '我也想幫事務所做點事', '做完這個，事務所會更好接案吧']);
  if (it.boss) return pickS(['我想證明自己', '我準備好了', '總有一天要面對的']);
  if (h.wish && h.wish.k === 'zone' && it.z === h.wish.z) return '剛好跟我的心願有關';
  if (fd.i >= 1 && (hx(h, 'O') > .6 || h.trait === 'brave')) return pickS(['聽起來很刺激', '平淡的委託我膩了', '越難越有意思']);
  if (['seiko', 'etf', 'slash'].includes(h.goal)) return pickS(['報酬不錯，我需要錢', '這筆錢剛好可以補我的缺口', '價錢很漂亮']);
  return pickS(['感覺我做得來', '這個我有把握', '剛好順路']);
}
function heroPlan(){
  const h = H(), pol = S.autonomy || 'ask';
  if (busyAway(h) || S.q || ['dead', 'retired', 'left'].includes(h.act)) return;
  // 累了：自己排休
  if (h.sta < 35 && pol !== 'mine' && !S.queue.some(it => it.kind === 'rest') && S.queue.length < Q_MAX) {
    S.queue.unshift({ id:Date.now(), kind:'rest', n:'休息', days:1, by:'hero' }); S.qKey = S.queue.map(x => x.id).join(',');
    say('我下個月幫自己排了休假'); h.st.self++; return;
  }
  if (S.queue.filter(it => it.kind !== 'rest').length >= 2 || S.queue.length >= Q_MAX) return;
  const p = .2 + dw(h, 'independence') * .3 + (hx(h, 'C') - .5) * .2 + (pol === 'free' ? .2 : pol === 'mine' ? -.15 : 0);
  if (!chance(clamp(p, .03, .8))) return;
  let best = null, bs = .35;
  [...S.offers.map(o => [o, false]), ...S.agTasks.map(o => [o, true])].forEach(([o, ag]) => { if (o.D && ratio(h, o.D) * (h.overconf || 1) < .6) return;   // 明顯打不贏的不會挑
    const v = scoreTask(h, o, ag); if (v > bs) { bs = v; best = [o, ag]; } });
  if (!best) return;
  const [o, ag] = best, it = { ...o, kind:ag ? 'ag' : 'offer', share:o.share || .1, by:'hero' };
  if (ag) S.agTasks = S.agTasks.filter(x => x.id !== o.id); else S.offers = S.offers.filter(x => x.id !== o.id);
  S.queue.push(it); S.qKey = S.queue.map(x => x.id).join(',');
  const why = taskWhy(h, it);
  if (pol === 'free') { it.agreed = 1; h.st.self += 2; ev('good', '自己安排', `${h.name}自己接了「${it.n}」`); say(`我接了「${it.n}」，${why}`); }
  else ask('selfTask', pol === 'mine' ? `我知道你喜歡自己安排……但我真的很想接「${it.n}」，${why}` : `老闆，我想接「${it.n}」，${why}。可以嗎？`, [pol === 'mine' ? '好吧，去吧' : '好，去吧', '不行', '你決定就好'], { id:it.id }, 1);
}
// v7：突發危機——照顧得再好也可能遇到，逼你做取捨
const CRISES = [
  { k:'draft', cond:h => h.lv >= 6 && !busyAway(h),
    fire:h => { const fine = 800 + rkx() * 500; ev('bad', '徵召令', `王國發來徵召令：${h.name}必須立刻去邊境駐守三個月`); ask('draft', '老闆……王國的徵召令，指名要我去邊境。', ['讓他去吧', `付罰金 ${fmt(fine)} 免役`, '抗命，不去'], { fine }, 1); } },
  { k:'plague', cond:h => !h.mission,
    fire:h => { const cost = 400 + h.lv * 40; ev('bad', '流行病', '村子爆發流行病，很多人病倒了'); h.health = clamp(h.health - 25, 0, 100); h.bedDays = Math.max(h.bedDays, 2); setAct('bed');
      const al = S.npcs.filter(n => n.alive && n.role !== 'rival'); if (al.length && chance(.35)) npcDies(pick(al), '死於流行病');
      ask('plague', '咳咳……我也染上了。藥師說有特效藥，但很貴', [`買特效藥（${fmt(cost)}）`, '先躺著熬過去'], { cost }, 2); } },
  { k:'lawsuit', cond:() => S.fame > 100,
    fire:() => { const c = Math.round(300 + S.fame * .4); ev('bad', '官司', '金獅事務所控告你的事務所搶走他們的委託'); ask('lawsuit', `（金獅事務所提告，要求賠償 ${fmt(c)} 金。怎麼辦？）`, [`和解，賠 ${fmt(c)} 金`, '打官司（可能贏，也可能賠更多）'], { c }, 3); } },
  { k:'relapse', cond:h => hasP(h, 'scar') && !busyAway(h), fire:h => { h.act = 'idle'; injure('heavy', '舊傷突然復發'); } },
  { k:'family', cond:h => !busyAway(h) && (h.goal !== 'seiko' || chance(.3)),
    fire:h => { ev('bad', '家書', `${h.name}收到家書：家人病危`); ask('family', '老闆，我媽病得很重……我想回家幾天。可是排程上還有工作', ['馬上回去，工作我來處理', '做完手上的工作再回去', '現在不行'], {}, 1); } },
  { k:'surge', cond:() => !(S.surge > S.day), fire:h => { S.surge = S.day + 20; ev('bad', '魔物大潮', '各地的魔物突然變得狂暴，接下來 20 個月到處都更危險'); say('外面的怪變得好兇……'); } },
  { k:'tax', cond:() => S.gold > 1500, fire:() => { const t = Math.round(S.gold * .15); S.gold -= t; ev('bad', '加稅', `王國臨時加稅，事務所被收走 ${fmt(t)} 金`); } },
];
function crisisTick(){
  if (offline || S.q || S.day < (S.nextCrisis ?? 30)) return;
  const h = H(); if (['dead', 'retired', 'left', 'dying'].includes(h.act)) return;
  const ok = CRISES.filter(c => { try { return c.cond(h); } catch (e) { return false; } });
  if (!ok.length) return;
  S.nextCrisis = S.day + ri(35, 60);
  pick(ok).fire(h);
}
// 醜聞
function scandalTick(){
  const h = H(); if (offline || ['dead', 'retired', 'left', 'dying'].includes(h.act)) return;
  if (h.scLie && S.day >= h.scLie.d) { const t = h.scLie; h.scLie = null; const loss = Math.round(t.hit * .6); addFame(-loss); repAdd(-5, '力挺的勇者被拆穿說謊');
    ev('bad', '證據曝光', `${h.name}當初喊冤的那件事，被人拿出了證據，事務所名聲 -${loss}`); logLife('喊冤被拆穿'); adj('mood', -8); say(pickS(['……對不起，我那時候不敢承認', '老闆……你還願意相信我嗎', '我以為不會被發現的……'])); return; }
  if (h.scTruth && S.day >= h.scTruth.d) { const t = h.scTruth; h.scTruth = null; const back = Math.round(t.hit * (t.i === 3 ? 1.2 : t.i === 1 ? .3 : .6)); addFame(back);
    ev('good', '真相大白', `原來${h.name}的醜聞是${t.ag}放的假消息，事務所名聲 +${back}`); logLife('醜聞真相大白：是被誣陷的');
    if (t.i === 3) { adj('trust', 5); repAdd(4, '力挺被誣陷的勇者'); say('看吧！我就說不是我！老闆，謝謝你當時相信我'); }
    else if (t.i === 0) { adj('trust', -5); say('……我早就說了不是我'); }
    else if (t.i === 2) { repAdd(-6, '公開切割了被誣陷的勇者'); }
    return; }
  if (h.pendingSc) { if (S.day >= h.pendingSc.d && !S.q) { const q = h.pendingSc; h.pendingSc = null; revealScandal(q.k, q.leak, q.fake); } return; }
  if (!chance(.012 + h.stress / 4000 + (h.burn || 0) / 4000 + (S.fame > 200 ? .006 : 0))) return;
  const pool = SCANDALS.map(x => [x, Math.max(0, x.w(h))]).filter(x => x[1] > 0); if (!pool.length) return;
  let r = Math.random() * pool.reduce((a, x) => a + x[1], 0), sc = pool[0][0];
  for (const [x, w] of pool) { r -= w; if (r <= 0) { sc = x; break; } }
  const fake = chance(.2);   // v17.77：兩成是對手事務所放的假消息
  if (chance(.5) || S.q) h.pendingSc = { k:sc.k, d:S.day + ri(3, 10), fake }; else revealScandal(sc.k, 0, fake);
}
// v17.77 醜聞時他的態度：慚愧（sorry）／喊冤（unfair）／不在乎（shrug）。看醜聞種類和個性；被誣陷一定喊冤
const SC_LEAN = { affair:[.8, 1.2, 1], drunk:[.8, 1.3, .9], fight:[.6, 1.6, .5], bribe:[1.3, .5, .6], noshow:[.9, .6, 1.4], fraud:[1.2, .8, .5] };
function scAtt(h, k, fake){ if (fake) return 'unfair';
  const l = SC_LEAN[k] || [1, 1, 1], tn = toneOf(h), w = [l[0] * (.4 + hx(h, 'H')) * (tn === 'warm' ? 1.4 : 1), l[1] * (1.4 - hx(h, 'A')) * (tn === 'blunt' ? 1.6 : 1), l[2] * (.4 + hx(h, 'X')) * (tn === 'cheer' ? 1.5 : 1) * .7];
  let r = Math.random() * (w[0] + w[1] + w[2]); for (let i = 0; i < 3; i++) { r -= w[i]; if (r <= 0) return ['sorry', 'unfair', 'shrug'][i]; } return 'sorry'; }
const SC_UNFAIR = { fight:['是對方先動手的！我只是還手', '他先砸我的攤子，報紙怎麼不寫？'], drunk:['我只是喝了兩杯，他們寫得像我拆了酒館', '桌子本來就快壞了好嗎'], affair:['就吃個飯而已，哪來的旅館？', '跟朋友見個面也要上報紙？'],
  noshow:['那天我明明跟他們說過要改期', '是他們自己沒把時間講清楚'], bribe:['我沒收！那是商會硬塞的謝禮', '放水？那場我是真的打不贏'], fraud:['我只是幫馬可介紹朋友，我哪知道他在騙人', '我也是被騙的那個啊'] };
function scLine(h, k, att, fake){
  if (att === 'sorry') return L('scandalAsk');
  if (att === 'shrug') return pickS(['上新聞而已，過幾天大家就忘了', '反正有人罵就有人愛', '老闆，你看起來比我還緊張', '欸，我上報紙了耶'].concat(k === 'noshow' ? ['那個活動本來就很無聊嘛'] : []));
  return pickS(['又不是我的錯！', '報紙只寫了一半……', '那些記者根本沒問過我'].concat(SC_UNFAIR[k] || [], fake ? ['我根本沒做這種事！', '這是誰編的？那天我人根本不在那裡'] : [])); }
function revealScandal(k, leak, fake){
  const h = H(), sc = SCANDALS.find(x => x.k === k); if (!sc) return;
  const rp = npc('reporter'), rpm = rp && rp.alive ? (rp.aff >= 50 ? .7 : rp.aff < 15 ? 1.25 : 1) : 1;
  const hit = Math.round(sc.fame * (1 + rkx() * .3) * (leak ? 1.8 : 1) * rpm);
  addFame(-hit); h.scandals = (h.scandals || 0) + 1; yr().sc++;
  if (k === 'affair' && h.partner) affAdd(h.partner, -25);
  ev('bad', leak ? '醜聞（壓不住了）' : '醜聞', `${sc.t(h)}${leak ? '。而且有人爆料你花錢壓新聞' : ''}，事務所名聲 -${hit}`);
  logLife(`爆出醜聞：${sc.n}`);
  const cost = 300 + rkx() * 300;
  const att = leak ? 'sorry' : scAtt(h, k, fake);
  ask('scandal', leak ? '……老闆，對不起，又上新聞了' : scLine(h, k, att, fake), ['讓他公開道歉', `花 ${fmt(cost)} 金壓新聞`, '公開和他切割', '力挺到底'], { hit, cost, k, head:sc.t(h), leak:leak ? 1 : 0, att, fake:fake ? 1 : 0 }, 2);
}
function closeMission(){ clearInterval(mTimer); $('mission').classList.remove('on'); S.paused = false; mHold = 0; }
function startMission(o){
  const h = H(); const d = danger(ratio(h, o.D));
  closeMission();
  const fd = feelDanger(h, o.D);
  if (h.goal === 'health' && (fd.i === 2 && h.trust < 85 || fd.i === 1 && h.sta < 50)) { say('這種工作太傷身了，我不接'); clue('以健康為由拒絕了委託'); renderAll(); return; }
  if (fd.i === 2 && (h.trust < 30 || (h.trait === 'careful' && h.stress > 50)) && h.trait !== 'brave') {
    say('不要。我還不想死。'); adj('trust', -3); renderAll(); return;
  }
  h.act = 'mission'; h.mission = { ...o }; h.actDays = o.days; preRoll(h); h.zone = -1; h.target = null; h.fighting = false;
  h.tx = ZONES[o.z].rect[0] + 10; h.ty = ZONES[o.z].rect[1] + 10;
  S.offers = S.offers.filter(x => x.id !== o.id);
  sys(`${h.name}出發去「${o.n}」了（約 ${durNum(h, h.mission)} 個月）`);
  if (d.i === 2) adj('stress', 15); else if (d.i === 1) adj('stress', 6);
  renderAll();
}
function resolveMission0(){
  if (H().mission && H().mission.ag) { resolveAg(); return; }
  const h = H(), o = h.mission; h.mission = null; h.alpha = 1; h.x = ZONES[o.z].rect[0] + 10; h.y = ZONES[o.z].rect[1] + 10; h.tx = GX; h.ty = GY;
  const r = ratio(h, o.D) * compMul(o.comp), d = danger(r);
  const p = winP(r);
  adj('sta', -40);
  if (winOf(o, p)) { compAfter(o, true, d.i); yr().mis++; if (!o.ag && !o.favor) affAdd('guild', 1);
    const mine = o.reward ? earn(o.reward) : 0; gainExp(ZONES[o.z].exp * 8 * (o.D / zD(o.z)));
    addFame(o.boss ? 80 : o.rescue ? 15 : [3, 8, 20][d.i]);
    adj('mood', 15 + dw(h, 'status') * 10); adj('trust', d.i === 2 ? 10 : 4); adj('stress', d.i === 2 ? 8 : 0); wishHook('mission');
    if (o.boss2) { S.boss2Done = 1; addFame(300); findTreasure(10); remember('boss2'); ev('good', '傳說', `${h.name}打倒了${BOSS2.n}！全國都在傳頌${pron(h)}的名字`); logLife(`打倒${BOSS2.n}，成為傳說`); say('……結束了。老闆，我們做到了'); }
    else if (o.rescue) { rescued(npc(o.rescue), true); }
    else if (o.favor) { favorDone(o, true); S.thank = { id:o.favor, day:S.day }; }
    else if (o.boss) { h.bossKill++; if (!S.bossDone) { S.bossDone = 1; ev('good', '里程碑', '你的事務所培養出了屠王勇者！可以挑戰「王都經紀公司」了'); } remember('boss'); findTreasure(9); ev('good', '傳說', `${h.name}打倒了${BOSS.n}！整個村子都在歡呼`); logLife(`打倒${BOSS.n}`); say('老闆！！我做到了！！'); if (h.wish && h.wish.k === 'boss') h.wish.p = 1; }
    else { ev('good', '委託完成', `「${o.n}」完成，報酬 ${fmt(o.reward)} 金，你分到 ${fmt(mine)} 金`); say(d.i === 2 ? L('agWinHard') : L('missionWin')); }
    if (d.i === 2 && !o.boss) logLife(`完成九死一生的委託「${o.n}」`);
    setAct(restAfter(h) ? 'rest' : 'idle');   // v17.20
  } else {
    const pr = o.comp && npc(o.comp) && npc(o.comp).role === 'priest';
    compAfter(o, false, d.i);
    const nd = [.03, .12, .35][d.i] * (o.comp ? .6 : 1);
    if (o.rescue) npcDies(npc(o.rescue), `沒能被救出來`);
    if (o.favor) favorDone(o, false);
    if (chance(nd)) nearDeath(`執行「${o.n}」時失手`, o.z);
    else { injure(!pr && chance(.4 + d.i * .2) ? 'heavy' : 'light', `「${o.n}」失敗`); adj('trust', -4); }
  }
}

// ================= 每天結束 =================
function dayEnd(){
  const h = H();
  if (h.act === 'dying') return;
  const was = h.act;
  // 體力、壓力、心情
  if (was === 'hunt' || was === 'home') { adj('sta', h.trait === 'lazy' ? -26 : -32); const r = h.zone >= 0 ? ratio(h, zD(h.zone)) : 1.2; adj('stress', 3 + Math.max(0, 1 - r) * 25); adj('mood', h.huntKills > 6 ? 4 : h.huntKills < 2 ? -6 : 0); }
  if (was === 'rest' || was === 'bed' || was === 'slack' || was === 'strike') { adj('sta', 40); adj('stress', -12); }
  if (was === 'drink') { adj('sta', 10); }
  if (was === 'train') { adj('sta', -20); gainExp(expNeed(h.lv) * .45); adj('stress', 4); }
  if (was === 'mission') { adj('sta', -10); }
  if (was === 'side') { const g = Math.round(ri(40, 120) * (1 + h.lv / 8)); h.wallet += g; adj('sta', -15); adj('mood', 3); if (chance(.3)) ev('warn', '外快', `${h.name}自己接案賺了 ${g} 金，沒有經過你`); }
  // 倦怠：連續工作越久越累，休息才會降
  const working = ['hunt', 'home', 'mission', 'train', 'side'].includes(was);
  h.workStreak = working ? (h.workStreak || 0) + 1 : 0;
  const b0 = h.burn || 0;
  h.burn = clamp(b0 + (working ? (h.workStreak > 5 ? 4 : 1) + (h.stress > 70 ? 3 : 0) : -(was === 'rest' ? 9 : 5)), 0, 100);
  if (b0 < 70 && h.burn >= 70) { ev('warn', '倦怠', `${h.name}開始對工作感到麻木`); if (!offline) say(pickS(['打怪、領錢、睡覺……這樣到底有什麼意義', '我好像什麼都提不起勁了'])); }
  // 一生的統計（結局的遺憾檢定用）
  h.st.days++; if (working) h.st.work++; h.st.moodSum += h.mood;
  { const y = yr(); y.mood += h.mood; y.burn += h.burn || 0; y.n++; }
  // 等房＋ETF：閒錢放 ETF；精緻窮：被抽太多會不爽
  if (h.goal === 'etf' && h.wallet > 100) h.wallet *= 1.003;
  if (h.goal === 'seiko' && S.cut > 25) adj('trust', -.3);
  adj('sta', 18);   // 晚上睡覺
  h.hp = h.bedDays > 0 ? .6 : 1;
  if (was === 'rest' && h.restStreak >= 3) adj('mood', 4);
  if (h.sta < 20) adj('mood', -4);
  if (h.stress > 70) adj('mood', -4);
  // 生活費
  if (!['mission', 'gone', 'private', 'visit'].includes(was)) { const c = Math.max(3, 6 + Math.floor(h.lv / 5) * 2 + (h.child ? 5 : 0) - (h.house ? 3 : 0)); if (h.wallet >= c) h.wallet -= c; else { h.wallet = 0; adj('sta', -10); adj('mood', -6); if (!offline && chance(.3)) say('沒錢住旅館……今晚只好睡馬廄'); } }
  if (h.payback && h.wallet > 30) { const p = Math.min(h.payback, Math.round(h.wallet * .5)); h.wallet -= p; S.gold += p; h.payback -= p; }
  // 健康
  { const hr = hasP(h, 'side') ? .5 : 1; if (h.bedDays > 0 || was === 'rest') h.health = clamp(h.health + 4 * hr, 0, 100); else h.health = clamp(h.health + hr, 0, 100); }
  if (h.age > 38) h.health = clamp(h.health - .3, 0, 100);
  if (h.health <= 0 && !offline) { die('積勞成疾，病倒後再也沒有起來', 'dead'); return; }
  // 回村
  if (was === 'hunt' || was === 'home') { goHome(); h.x = GX; h.y = GY; h.act = 'idle'; }
  // 勇者自己花錢
  heroShop();
  // 年紀
  h.age = (h.age0 ?? START_AGE) + (S.day + 1 - h.born) / 12;
  if ((S.day + 1 - h.born) % 12 === 0) { sys(`${h.name} ${Math.floor(h.age)} 歲了`); adj('mood', 5); h.stab = Math.min(.3, (h.stab || 0) + .015); if (h.age < 41 && h.hex) { h.hex.C = Math.min(95, h.hex.C + 1); h.hex.E = Math.max(5, h.hex.E - 1); } }
  if (h.age >= 33 && !offline && S.day >= (h.retireAsk || 0) && chance(h.stress > 50 || h.health < 60 || hasP(h, 'lame') ? .12 : .04) && !S.q) {
    h.retireAsk = S.day + 12;
    ask('retire', `老闆……我 ${Math.floor(h.age)} 歲了，身體大不如前。我想退休了，可以嗎？`, ['好，你辛苦了', '再拚一年就好', '不行，你還能打'], {}, 3);
  }
  if (h.age >= 50) { die(`五十歲那年，終於放下武器退休`, 'retired'); return; }
  // 心願
  wishTick();
  // 休息室、伴侶、酒館
  if ((was === 'rest' || was === 'bed') && S.office.lounge) adj('stress', -4 * S.office.lounge);
  if (h.partner) { adj('stress', -2); affAdd(h.partner, .5); }
  if (was === 'drink') { affAdd('tao', 3); const tao = npc('tao'); if (tao && tao.alive && tao.grumpy && !offline && chance(.5)) { adj('mood', -3 - hx(h, 'E') * 4); ev('warn', '臭臉', `阿桃今天心情很差，${h.name}被唸了幾句`); } }
  // 村民每天的心情：情緒性高的人比較常擺臭臉
  S.npcs.forEach(n => { n.grumpy = n.alive && chance(.06 + hx(n, 'E') * .12); });
  // 喜事：孩子出生
  if (h.married && !h.child && h.kidWish !== 'no' && S.day - h.married > 10 && chance(h.readyKid ? .2 : h.kidWish === 'want' ? 0 : h.wallet > 500 ? .04 : .02)) {
    const sex = chance(.5) ? 'm' : 'f', p = npc(h.partner);
    h.child = { name:pick((sex === 'm' ? MALE : FEMALE).filter(x => x !== h.name)), sex };
    ev('good', '喜事', `${h.name}和${p ? p.name : '伴侶'}的${sex === 'm' ? '兒子' : '女兒'}「${h.child.name}」出生了`); logLife(`${sex === 'm' ? '兒子' : '女兒'}${h.child.name}出生`);
    adj('mood', 25); adj('stress', -10); if (!offline) say('老闆！我當爸媽了！我以後……是不是該小心一點');
  }
  // 事務所開銷與周轉
  { const u = offline ? Math.min(upkeep(), Math.max(0, S.gold)) : upkeep(); S.gold -= u; finAdd('upkeep', -u); }
  if (S.loan > 0 && (!offline || S.gold >= 60)) { const pb = Math.min(S.loan, 60); S.gold -= pb; S.loan -= pb; finAdd('loan', -pb); }
  S.debtDays = S.gold < 0 ? (S.debtDays || 0) + 1 : 0;
  if (S.debtDays >= 8 && !S.q && !offline) { S.debtDays = 0; ask('crisis', '（事務所周轉不靈，已經赤字好一陣子了。有個商會的人說可以幫忙，只要之後幫他們一點小忙。怎麼辦？）', ['賣掉一項設施', '借高利貸 1,500 金', '接受銀月經紀社的收購', '接受地下商會的幫忙'], {}, 3); }
  // 口碑：勇者累不累，大家都看在眼裡
  repAdd(h.burn > 70 ? -.25 : h.burn < 35 ? .08 : 0, h.burn > 70 ? '勇者長期過勞' : '勇者被照顧得很好', true);
  // 事務所任務：逾期與刷新
  const exp = S.queue.filter(it => it.until && S.day >= it.until);
  if (exp.length) { exp.forEach(it => addFame(-Math.round((it.fame || 0) * .3))); if (!offline) ev('warn', '逾期', `${exp.map(it => `「${it.n}」`).join('、')}過了期限沒做，委託方很不滿`); S.queue = S.queue.filter(it => !exp.includes(it)); }
  S.agTasks = S.agTasks.filter(it => S.day < it.until);
  if (S.day - (S.agDay ?? -99) >= 6) refreshAg();
  scandalTick();
  crisisTick();
  // 社會比較：同期勇者的近況
  if (!offline && S.day >= (h.cmpDay || 20) && npc('rival')) { h.cmpDay = S.day + ri(20, 35); compareRival(); }
  // 對手事務所
  S.rivals.forEach((r, i) => { r.fame += rand(.5, 1.3) * (i ? 1.15 : 1) * (3.5 + Math.min(curY(), 12) * .55) * (1 + (S.gen - 1) * .1); });   // v17.20：對手和認真玩的主角差不多快（第 1 年約 45／年，第 10 年約 100／年）
  // 日常相處：沒有伴侶時，和最合得來的人慢慢變熟
  if (!h.partner && !busyAway(h)) { const v = S.npcs.filter(n => dateable(n)).sort((a, b) => compat(h, b) - compat(h, a))[0]; if (v) affAdd(v.id, .5); }
  if (h.visitDue && S.day >= h.visitDue) { h.visitDue = 0; if (!offline && h.bedDays > 0) friendVisit(); }
  // 舊傷：5 年（60 個月）沒再受重傷就會好
  if (hasP(h, 'scar') && !hasP(h, 'lame') && S.day - (h.lastHeavy ?? h.born) >= 60) {
    h.perks = h.perks.filter(x => x !== 'scar'); adj('mood', 10);
    ev('good', '痊癒', `${h.name}的舊傷終於完全好了`); logLife('舊傷痊癒'); if (!offline) say('老闆，我的舊傷好像完全好了！');
  }
  // v8：村民也在過自己的日子
  npcLifeTick();
  // v16：旗下藝人與勇者之間的關係
  artistTick();
  viceTick();
  if (h.newMainUntil > S.day) adj('stress', 3);
  // 人際與兩難
  if (!offline && !S.q) socialTick();
  // 偶發好壞事
  if (chance(.22)) randomEvent();
  // 委託
  if (S.day - S.offerDay >= ((S.office.intel || 0) >= 2 ? 3 : 5)) refreshOffers();
  // 太安逸也會出事：一直很舒服，會開始無聊、想冒險
  if (h.mood > 85 && h.stress < 12) h.comfort = (h.comfort || 0) + 1; else h.comfort = Math.max(0, (h.comfort || 0) - 2);
  if (h.comfort >= 25 && !offline) { h.comfort = 0; adj('mood', -12);
    ev('warn', '太安逸', `${h.name}覺得每天都一樣，開始坐立不安`); say(pickS(['每天都一樣……好無聊', '我是不是該去更危險的地方試試', '當勇者不就是要冒險嗎']));
    if (!h.wish) { const z = Math.min(topZ(), bestSafeZone() + 1); h.wish = { k:'zone', z, t:10, p:0, n:`想去${ZONES[z].n}冒險`, until:S.day + 18 }; } }
  // v9：武鬥大會、年度大賞、對手事務所
  dutyTick(); seasonTick(); rivalTick(); mapTick();
  finClose(); if (S.day % 12 === 11) repFlush();
  // 勇者替自己安排明天
  if (!offline) heroPlan();
  // 隨機閒聊
  if (!offline && chance(.25) && !S.q) chatter();
  h.drankYesterday = was === 'drink' || !!h.drankTonight; h.drankTonight = 0;
  h.carefulNext = 0; h.ownToday = 0; h.earnToday = 0;
  S.coach = S.coachUntil > S.day + 1;
  // 問題過期
  if (S.q && S.day + 1 > S.q.until && offline) answer(-1);   // v17.58：開著遊戲時改成限時 15 秒（map.js qTick），只有離線補跑時才照天數過期
}
// ================= v8：配角的人生 =================
// 有職位的人過世或退休後，會有人接手（同一個 id，功能不中斷）
const SUCC = {
  tao:{ t:'酒館老闆', n:[['阿德', 'm'], ['小梅', 'f'], ['阿珠', 'f'], ['胖叔', 'm'], ['阿蘭', 'f']], ret:99, age:[30, 42], pw:.1 },
  chen:{ t:'鐵匠', n:[['阿力', 'm'], ['大熊', 'm'], ['小鐵', 'f'], ['阿鋼', 'm'], ['火花', 'f']], ret:99, age:[26, 36], pw:.25 },
  guild:{ t:'公會櫃台', n:[['小琪', 'f'], ['阿凱', 'm'], ['小真', 'f'], ['小婷', 'f'], ['阿文', 'm']], ret:55, age:[21, 27], pw:0 },
  priest:{ t:'神殿祭司', n:[['約翰神父', 'm'], ['莉亞修女', 'f'], ['安德烈神父', 'm'], ['瑪莎修女', 'f'], ['保羅神父', 'm']], ret:75, age:[35, 48], pw:.2 },
  mayor:{ t:'村長', n:[['老林', 'm'], ['阿珍村長', 'f'], ['王村長', 'm'], ['陳伯', 'm'], ['李嬸', 'f']], ret:76, age:[48, 60], pw:0 },
  reporter:{ t:'《勇者週報》記者', n:[['小葉', 'f'], ['阿光', 'm'], ['美美', 'f'], ['阿明', 'm'], ['小晴', 'f']], ret:60, age:[23, 30], pw:.05 },
  merc:{ t:'傭兵', n:[['黑狼', 'm'], ['紅刃', 'f'], ['老疤', 'm'], ['獨眼', 'm'], ['銀狐', 'f']], ret:55, age:[26, 34], pw:.4 },
  rival:{ t:'金獅事務所的勇者', n:[['雷恩', 'm'], ['凱爾', 'm'], ['亞斯', 'm'], ['蒂娜', 'f']], ret:42, age:[18, 21], pw:0 },
  rival2:{ t:'銀月經紀社的勇者', n:[['小夜', 'f'], ['露娜', 'f'], ['希兒', 'f'], ['阿翔', 'm']], ret:42, age:[18, 21], pw:.35 },
};
function succeed(n, why){
  const c = SUCC[n.id], used = S.npcs.map(x => x.name);
  S.npcs.push({ ...n, id:n.id + '_' + S.day, mate:null, gone:n.alive ? 'retired' : n.gone, alive:false });   // 原本的人留在名單上
  S.npcs.forEach(x => { if (x.mate === n.id) x.mate = null; });
  const q = c.n.filter(x => !used.includes(x[0])), [nm, sx] = q.length ? pick(q) : pick(c.n);
  Object.keys(n).forEach(k => { if (k !== 'id') delete n[k]; });
  Object.assign(n, mkNpc({ title:c.t, name:nm, sex:sx, role:n.id === 'tao' ? 'tavern' : n.id === 'chen' ? 'smith' : n.id, age:ri(c.age[0], c.age[1]), pw:c.pw }, n.id === 'rival' ? 0 : ri(5, 15)));
  news('', `${why}，現在由${nm}接手`, true);
}
const SHOPS = ['甜點店', '雜貨鋪', '藥草茶館', '麵攤', '二手武器行', '小旅社'];
function news(kind, t, loud){ S.news = S.news || []; S.news.push({ d:S.day, t }); if (S.news.length > 30) S.news.shift(); if (loud && !offline) ev(kind, '村子', t); }
const thp = n => n.sex === 'f' ? '她' : '他';
const yr = () => S.yr || (S.yr = { f0:S.fame, r0:S.rivals.map(r => r.fame), mis:0, ag:0, show:0, hurt:0, mood:0, burn:0, n:0, sc:0, tour:-1 });
function npcLifeTick(){
  const h = H(), al = S.npcs.filter(n => n.alive);
  al.forEach(n => { n.age = (n.age || 30) + 1 / 12; });
  // 人生里程碑
  al.forEach(n => {
    if (n.id === 'fan' && n.age >= 16 && !n.grown) { n.grown = 1; n.title = '見習冒險者'; n.pw = .15; news('good', `${n.name}滿 16 歲了，說要跟${h.name}一樣當冒險者`, true); }
    if (n.id === 'fan' && n.age >= 20 && n.pw < .3) n.pw = .3;
    if (n.id === 'chen' && n.age >= 65 && !n.retd) { n.retd = 1; n.title = '退休的老鐵匠'; news('', `${n.name}說手會抖了，鋪子交給徒弟顧，自己每天還是來店裡碎念`, true); }
    if (n.role === 'elder') n.pw = clamp(.5 - (n.age - 40) * .012, .12, .5);
  });
  // 世代交替
  Object.keys(SUCC).forEach(id => { const n = npc(id); if (!n) return;
    if (!n.alive && !n.gone && S.day - (n.diedAt ?? S.day) >= 6) succeed(n, `${SUCC[id].t}的位子空了好一陣子`);
    else if (n.alive && n.age >= SUCC[id].ret && n.id !== h.partner) succeed(n, `${n.title}${n.name}${['rival', 'rival2'].includes(id) ? '引退了' : '退休了'}`); });
  { const f = npc('fan'); if (f && f.alive && f.age >= 24) { f.id = 'fan_' + S.day; f.role = 'villager'; f.title = '冒險者'; f.pw = .3;
      S.npcs.push(mkNpc({ id:'fan', title:'崇拜勇者的小孩', name:pick(['小米', '阿弟', '小花', '豆豆']), sex:chance(.5) ? 'm' : 'f', role:'fan', age:ri(8, 11), pw:0 }, ri(10, 25)));
      news('good', `${f.name}長大自立了；村裡又出現一個天天跟在勇者後面的小孩`, true); } }
  al.forEach(a => { if (a.kids && a.kidsAt != null && !a.kidGrown && S.day - a.kidsAt >= 200 && a.id < (a.mate || 'zz')) { a.kidGrown = 1; const sx = chance(.5) ? 'm' : 'f';
    S.npcs.push(mkNpc({ id:'k' + S.day, title:`${a.name}家的孩子`, name:pick(sx === 'm' ? MALE : FEMALE), sex:sx, role:'villager', age:18, pw:.1 }, ri(10, 25))); news('good', `${a.name}家的孩子長大了`, true); } });
  // 借錢的人來還錢（或不還）
  al.forEach(n => { if (!n.owe || S.day < n.owe.due) return;
    if (chance(.45 + hx(n, 'H') * .5)) { h.wallet += Math.round(n.owe.g * 1.1); affAdd(n.id, 6); news('good', `${n.name}把借的 ${n.owe.g} 金還給${h.name}，還多包了一點`, true); }
    else { n.aff = clamp(n.aff - 12, 0, 100); adj('mood', -6); news('warn', `${n.name}一直沒還錢，見到${h.name}就躲`, true); if (!offline) say(pickS([`${n.name}的錢……大概要不回來了`, '算了，就當作送他吧'])); }
    n.owe = null; });
  // 生病
  al.forEach(n => {
    if (!n.alive) return;
    if (n.sick && S.day >= n.sick) { n.sick = 0;
      if (n.age >= 60 && !n.cured && chance(.12) && !offline) npcDies(n, '病逝了'); else if (n.aff >= 35) news('good', `${n.name}的病好了`);
      n.cured = 0; }
    else if (!n.sick && chance(.0025 + Math.max(0, n.age - 50) * .0005)) {
      const pr = npc('priest'), prOk = pr && pr.alive && n.id !== 'priest';
      n.sick = S.day + ri(3, 8) - (prOk ? 1 : 0);
      if (n.aff >= 25) news('warn', `${n.title}${n.name}生病了`, n.aff >= 35);
      if (n.aff >= 50 && !offline && !S.q && !busyAway(h) && n.id !== h.partner) ask('visitNpc', `${n.name}生病了……我想去看看${thp(n)}`, ['去吧，帶點水果（50）', prOk ? '請艾琳修女去看看（200）' : '請醫生去看看（200）', '現在沒空'], { id:n.id }, 2);
    }
  });
  // 壽命
  if (!offline) al.forEach(n => { if (n.alive && n.age >= 68 && chance(.0025 * (n.age - 66))) npcDies(n, '壽終正寢'); });
  // 戀愛與婚姻
  const free = al.filter(n => n.alive && dateable(n) && n.id !== h.partner && !(n.aff >= 45 && !h.partner && h.age < 40));
  if (free.length >= 2 && chance(.01)) { let best = null, bv = .95;
    for (let i = 0; i < free.length; i++) for (let j = i + 1; j < free.length; j++) { const a = free[i], b = free[j]; if (a.sex === b.sex) continue; const v = compat(a, b) + rand(-.15, .15); if (v > bv) { bv = v; best = [a, b]; } }
    if (best) { const [a, b] = best; a.mate = b.id; b.mate = a.id; a.dating = b.dating = S.day; news('good', `${a.title}${a.name}和${b.title}${b.name}在交往了`, true);
      const crush = [a, b].find(x => x.aff >= 55); if (crush && !h.partner && !offline && (dw(h, 'romance') || chance(.4))) { adj('mood', -6); say(`原來${crush.name}喜歡的是${(crush === a ? b : a).name}啊……`); } } }
  al.forEach(a => { const b = a.mate && npc(a.mate); if (!b || a.id > b.id || !a.alive) return;
    if (!b.alive) { a.mate = null; a.wed = 0; return; }
    if (!a.wed && S.day - (a.dating || 0) > 8 && chance(.035)) { a.wed = b.wed = S.day + 1;
      news('good', `${a.name}和${b.name}結婚了`, true);
      if (Math.max(a.aff, b.aff) >= 40 && !offline && !S.q) ask('wedding', `${a.name}和${b.name}要結婚了，邀我去喝喜酒！要包紅包嗎？`, ['包大包的（事務所出 300）', '包一般的（100）', '不去了'], { a:a.id, b:b.id }, 2);
      else if (!offline && !busyAway(h)) say(pickS([`${a.name}和${b.name}結婚了耶`, `聽說${a.name}要結婚了，真好`])); }
    else if (!a.wed && chance(.006)) { a.mate = b.mate = null; news('warn', `${a.name}和${b.name}分手了`, a.aff >= 50 || b.aff >= 50); }
    else if (a.wed && !a.kids && S.day - a.wed > 10 && chance(.01)) { a.kids = b.kids = 1; a.kidsAt = b.kidsAt = S.day; news('good', `${a.name}和${b.name}的孩子出生了`, a.aff >= 40 || b.aff >= 40); }
  });
  // 開店
  al.forEach(n => { if (n.alive && n.role === 'villager' && !n.shop && n.age >= 22 && n.age < 50 && chance(.003)) { n.shop = pick(SHOPS); n.title = `開${n.shop}的`; news('good', `${n.name}開了一間${n.shop}`, n.aff >= 30);
    if (n.aff >= 50 && !offline && !busyAway(h)) { say(`${n.name}的${n.shop}開幕了，我去捧場！`); adj('mood', 4); } } });
  // 搬走
  al.forEach(n => { if (n.role !== 'villager' || n.id === h.partner || !n.alive || n.age >= 45) return;
    if (!chance(n.aff < 20 ? .003 : n.aff < 50 ? .0012 : .0005)) return;
    const b = n.mate && npc(n.mate);
    n.alive = false; n.gone = 'moved'; news(n.aff >= 50 ? 'warn' : '', `${n.name}${b && b.wed && b.alive ? '和' + b.name + '一起' : ''}搬去王都了`, n.aff >= 30);
    if (b && b.wed && b.alive && b.id !== h.partner) { b.alive = false; b.gone = 'moved'; } else if (b) b.mate = null;
    if (n.aff >= 50 && !offline) { adj('mood', -8); say(pickS([`${n.name}要搬走了……以後很難見面了`, `送${n.name}上馬車的時候，我差點哭出來`])); } });
  // 新村民
  if (S.npcs.filter(n => n.alive && n.role === 'villager' && n.age < 45).length < 3 && chance(.06)) {
    const used = S.npcs.map(n => n.name), q = NPC_POOL.filter(x => !used.includes(x[1]));
    const x = q.length ? pick(q) : [pick(['新搬來的', '外地來的']), pick([...MALE, ...FEMALE].filter(m => !used.includes(m))), null, .1]; if (!x[2]) x[2] = MALE.includes(x[1]) ? 'm' : 'f';
    if (x[1]) { S.npcs.push(mkNpc({ id:'v' + S.day, title:x[0], name:x[1], sex:x[2], role:'villager', pw:x[3] || .1, age:ri(19, 30) }, ri(5, 15))); news('good', `${x[0]}${x[1]}搬到村子裡了`, true); }
  }
  // 平常的往來
  if (!busyAway(h)) { const pool = S.npcs.filter(n => n.alive && !n.dark && n.role !== 'rival' && n.id !== h.partner); if (pool.length) affAdd(pool.sort((a, b) => compat(h, b) - compat(h, a) + rand(-.5, .5))[0].id, .4); }
  const fan = npc('fan'); if (fan && fan.alive && S.fame > 40) fan.aff = clamp(fan.aff + .15, 0, 100);
  if (h.bedDays > 0) affAdd('priest', .4);
  if (!offline && fan && fan.alive && fan.aff >= 40 && h.mood < 40 && !busyAway(h) && chance(.15)) { adj('mood', 6); ev('good', '打氣', `${fan.name}跑來說：「${h.name}是我的偶像！」`); say('……被小孩子這樣說，好像不能再頹廢了'); }
  const rp = npc('reporter'); if (!offline && rp && rp.alive && rp.aff >= 50 && chance(.012)) { addFame(8); ev('good', '專訪', `${rp.name}在《勇者週報》寫了一篇${h.name}的專題`); }
  // 有人來拜託
  if (!offline && !S.q && !busyAway(h) && chance(.05)) npcFavor();
}
// ================= v9：武鬥大會 =================
const TOUR_NAMES = ['北境的狂戰士', '流浪劍客', '王都騎士見習生', '沙漠來的拳師', '神殿的武僧', '蒙面的怪人', '獵龍人', '前任冠軍'];
const curY = () => Math.floor(S.day / 12) + 1;
// v17.50：武鬥大會改成四年一次（第 4、8、12…… 年的 7 月報名、9 月比賽）
const TOUR_EVERY = 4, tourYear = y => y % TOUR_EVERY === 0;
// 離下一屆的某個月份（7＝報名、9＝比賽）還有幾個月
function monthsToTour(m){ const y = curY(), mo = S.day % 12; for (let k = 0; k <= TOUR_EVERY; k++) { const yy = y + k; if (tourYear(yy) && (k > 0 || mo <= m)) return k * 12 + m - mo; } return 0; }
const tWants = h => dw(h, 'status') || dw(h, 'physical') || dw(h, 'vengeance') || h.trait === 'brave' || h.trait === 'hot';
const tHates = h => (dw(h, 'tranquility') || h.goal === 'health') && !tWants(h);
function seasonTick(){
  const h = H(), mo = S.day % 12; if (['dead', 'retired', 'left', 'dying'].includes(h.act)) return;
  if (mo === 7 && tourYear(curY()) && h.lv >= 3 && !offline) {
    const fee = 100 + rkx() * 100, bet = Math.max(100, Math.min(1000, Math.round(S.gold * .2 / 100) * 100));
    if (tWants(h)) say(L('tWant')); else if (tHates(h)) say(L('tNo'));
    ask('tReg', `（四年一度的武鬥大會開放報名了。報名費 ${fmt(fee)}，冠軍有 ${fmt(600 + rkx() * 400)} 金獎金和大量名聲）`, [`幫${pron(h)}報名（${fmt(fee)}）`, `報名，再押 ${fmt(bet)} 金賭${pron(h)}奪冠（4 倍）`, '今年不參加'], { fee, bet }, 3);
  }
  if (mo === 8 && S.tour && S.tour.y === curY() && !offline) ev('warn', '武鬥大會', `下個月就是武鬥大會，${h.name}會留在村裡準備，排程上的長任務會延後`);
  if (mo === 9 && S.tour && S.tour.y === curY()) {
    if (busyAway(h) || h.bedDays > 0) { ev('warn', '武鬥大會', `${h.name}${h.bedDays > 0 ? '還在養傷' : '人不在村裡'}，只好棄權`); S.tour = null; if (!offline) say(L('tSad')); }
    else if (offline) runTour(1);
    else { S.tour.wait = 1; ask('tStrat', '武鬥大會就要開始了……你覺得我該怎麼打？', ['穩穩打，別受傷', '全力以赴', '不惜代價，拿下冠軍'], {}, 1); }
  }
  if (mo === 11) yearAwards();
}
// v17.84 武鬥大會結果（新版小框）；map.js 的 tourApply 也用
let TOUR_G = 0;
function tourPop(y, log, place, champ, fame){
  const h = H(), cn = (champ.ag ? champ.ag + '的' : '') + champ.n;
  const rows = log.map(l => { const w = /勝<\/b>/.test(l); return `<div class="prw">${IC(w ? '打勾' : '打叉', 2)}<div>${l.replace(/——.*$/, '')}</div><b class="${w ? 'cg' : 'cr'}">${w ? '勝' : '敗'}</b></div>`; });
  openPop(`<div class="pb pres">${IC(['打叉', '銅牌', '銀牌', '金牌'][place], 3)}<b class="f22">${esc(h.name)}${['首輪淘汰', '止步四強', '拿下亞軍', '奪冠了！'][place]}</b></div>
    ${pList(rows)}
    <div class="ptls">${pTile(IC('名聲', 2), `<b class="cg">+${fame}</b>`, TIPA('名聲'))}${place === 3 ? pTile(IC('金幣', 2), `<b class="cg">+${fmt(TOUR_G)}</b>`, TIPA('金幣', '獎金', '冠軍獎金進了金庫')) : pTile(IC('歷代', 2), `<b class="f16">${esc(cn)}</b>`, TIPA('歷代', '冠軍', cn), ' w2')}</div>`,
    `第 ${y} 年武鬥大會`, '戰力');
}
function runTour(st){
  const h = H(), P = power(h), y = curY(); S.tour = null;
  const ppl = [{ n:h.name, me:1, P }];
  [['rival', 0], ['rival2', 1]].forEach(([id, i]) => { const n = npc(id); if (n && n.alive) ppl.push({ n:n.name, ag:S.rivals[i].n, ai:i, P:P * rand(.85, 1.2) * clamp(1 + (S.rivals[i].fame - S.fame) / 2500, .85, 1.2) }); });
  const pool = [...TOUR_NAMES].sort(() => Math.random() - .5);
  while (ppl.length < 8) ppl.push({ n:pool.pop(), P:P * rand(.55, 1.15) });
  let round = ppl.sort(() => Math.random() - .5), place = 0, out = false, hurt = null; const log = [];
  const RN = ['八強', '四強', '決賽'], m = [.9, 1, 1.15][st];
  for (let r = 0; r < 3; r++) {
    const next = [];
    for (let i = 0; i < round.length; i += 2) {
      const a = round[i], b = round[i + 1];
      if (a.me || b.me) {
        const o = a.me ? b : a, win = chance(clamp(.5 + (P * m - o.P) / (P * m + o.P) * 1.8, .05, .95));
        log.push(`${RN[r]}：對上${o.ag ? o.ag + '的' : ''}${o.n}——${win ? '<b class="dg g">勝</b>' : '<b class="dg r">敗</b>'}`);
        if (win) { next.push(a.me ? a : b); place = r + 1; if (!offline && r < 2) say(o.ag ? pickS([`贏了${o.n}！${o.ag}的人臉都綠了`, `終於贏了${o.n}一次`]) : L('tWin')); if (!hurt && chance([0, .05, .15][st])) hurt = ['light', '比賽時挨了幾下重擊']; }
        else { next.push(o); out = true; if (!offline) say(L('tLose')); if (chance([.2, .4, .7][st])) hurt = [chance([0, .3, .6][st]) ? 'heavy' : 'light', `在武鬥大會${RN[r]}被${o.n}打傷`]; }
      } else next.push(chance(a.P / (a.P + b.P)) ? a : b);
    }
    round = next;
  }
  const champ = round[0];
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
// ================= v9：年度勇者大賞 =================
function yearAwards(){
  const h = H(), y = yr(), Y = curY(), n = Math.max(1, y.n), am = y.mood / n, ab = y.burn / n;
  const gain = [S.fame - y.f0, ...S.rivals.map((r, i) => r.fame - (y.r0[i] || 0))];
  const agN = i => i === 0 ? '你的事務所' : S.rivals[i - 1].n, rvHero = i => { const x = npc(i ? 'rival2' : 'rival'); return x && x.alive ? x.name : '對手的勇者'; };
  const nom = stageOf() >= 1, NO = '（未入圍）', aw = [];   // v17.20：事務所到「地方」階段才會入圍
  const rvTop = Math.max(0, ...gain.slice(1)), rvBest = gain.slice(1).indexOf(rvTop) + 1;
  // 最佳事務所：比今年名聲漲幅
  const bi = gain.indexOf(Math.max(...gain)), agWin = nom && bi === 0;
  aw.push(['年度最佳事務所', agWin, agWin ? agN(0) : agN(bi === 0 ? rvBest : bi) + (nom ? '' : NO)]);
  if (agWin) { addFame(30); S.gold += 300; }
  // 最佳勇者：對手勇者的分數照對手事務所今年的實力算，不再跟著你浮動
  const hs = h.lv * 2 + y.mis * 3 + y.ag * 2 + (y.tour === 3 ? 25 : y.tour === 2 ? 10 : 0);
  const rs = S.rivals.map((r, i) => (14 + Math.min(Y, 15) * 2.5 + Math.max(0, gain[i + 1]) * .15) * rand(.85, 1.15)), rsMax = Math.max(...rs), rsI = rs.indexOf(rsMax);
  const heroWin = nom && hs > rsMax; aw.push(['年度最佳勇者', heroWin, heroWin ? h.name : rvHero(rsI) + (nom ? '' : NO)]);
  if (heroWin) { addFame(20); adj('mood', 15); logLife(`獲選第 ${Y} 年「年度最佳勇者」`); remember('award'); }
  // 人氣王：通告 4 次以上、零醜聞，而且人氣要贏過對手
  const pScore = y.show * 8 + Math.max(0, gain[0]) * .1, rPop = (30 + rvTop * .1) * rand(.8, 1.2);
  const pop = nom && y.show >= 4 && y.sc === 0 && pScore > rPop; aw.push(['年度人氣王', pop, pop ? h.name : rvHero(chance(.5) ? 1 : 0) + (nom ? '' : NO)]);
  if (pop) { addFame(15); if (dw(h, 'status') || hx(h, 'X') > .6) adj('mood', 10); }
  // 最幸福勇者
  const happy = nom && ab < 30 && y.hurt === 0 && am > rand(78, 100);   // v17.20：全國只選一位，要比別家的勇者更幸福
  aw.push(['年度最幸福勇者', happy, happy ? h.name : nom ? '從缺' : '從缺' + NO]);
  if (happy) { repAdd(5, '獲選「年度最幸福勇者」'); adj('trust', 5); adj('mood', 8); }
  // 年度新人獎：有評審席才能提名旗下新進藝人（簽約兩年內）
  let rookie = null;
  if (hasU('judge')) { const c = AR().filter(a => !['dead', 'retired', 'left'].includes(a.act) && S.day - (a.joined ?? -99) <= 24).sort((a, b) => b.lv - a.lv)[0];
    if (c) { const win = chance(clamp(.35 + (c.lv - 10) * .03, .2, .75)); rookie = c; aw.push(['年度新人獎（評審席提名）', win, win ? c.name : '別家的新人']);
      if (win) { addFame(12); aAdj(c, 'mood', 12); aAdj(c, 'trust', 5); aLog(c, `獲得第 ${Y} 年「年度新人獎」`); } } }
  // 最操事務所（不名譽）：沒入圍也會被點名
  const harsh = ab >= 55 || y.hurt >= 4; aw.push(['年度最操事務所', harsh, harsh ? '你的事務所' : agN(1 + (chance(.5) ? 1 : 0)), 1]);
  if (harsh) { repAdd(-6, '被選為「年度最操事務所」'); adj('trust', -5); adj('mood', -5); }
  const won = aw.filter(a => a[1] && !a[3]).length;
  S.awHist = S.awHist || []; S.awHist.push({ y:Y, won, harsh, hero:h.name, nom });
  ev(won ? 'good' : harsh ? 'bad' : 'warn', '年度大賞', nom ? `第 ${Y} 年勇者大賞：你的事務所拿下 ${won} 座${harsh ? '，還被選為「年度最操事務所」' : ''}` : `第 ${Y} 年勇者大賞：事務所還沒打進地方圈，沒有入圍${harsh ? '，卻被選為「年度最操事務所」' : ''}`);
  news('', `第 ${Y} 年勇者大賞揭曉`);
  if (!offline && (nom || harsh)) { say(harsh ? pickS(['「最操事務所」……老闆，大家都知道了喔', '被頒這種獎，我出門都不好意思']) : won >= 2 ? pickS(['今年真的是我們的一年！', '拿了好多獎，好不真實']) : won ? '有拿到獎，真好' : pickS(['今年什麼都沒拿到……', '明年再來吧']));
    openPop(`${nom ? '' : '<div class="f14 mu">事務所升到「地方」階段才會入圍</div>'}
      ${pList(aw.map(a => `<div class="prw">${a[1] && a[3] ? IC('驚嘆', 2) : IC('代表作', 2, !a[1])}<div>${esc(a[0])}</div><b class="${a[1] ? (a[3] ? 'cr' : 'cg') : 'mu'}">${esc(a[2])}</b></div>`))}
      ${pSec('排程', '這一年')}<div class="ptls">${[['任務', y.mis, '委託'], ['事務所', y.ag, '事務所任務'], ['跟拍', y.show, '通告'], ['生病', y.hurt, '重傷'], ['心情', Math.round(am), '平均心情'], ['壓力', Math.round(ab), '平均倦怠']].map(([ic, v, n]) => pTile(IC(ic, 2), `<b>${v}</b>`, TIPA(ic, n, `這一年${n}：${v}`))).join('')}</div>`,
      `第 ${Y} 年勇者大賞`, '代表作'); }
  S.yr = null;
}
// ================= v9：對手事務所 =================
function rivalTick(){
  const h = H(); if (offline || S.q || ['dead', 'retired', 'left', 'dying'].includes(h.act) || S.day < 18) return;
  if (S.rvNext == null) S.rvNext = S.day + ri(8, 14);
  if (S.day < S.rvNext) return;
  const i = chance(.5 + ((S.rivals[0].hostile || 0) - (S.rivals[1].hostile || 0)) * .08) ? 0 : 1, r = S.rivals[i];
  S.rvNext = S.day + Math.max(6, ri(12, 20) - (r.hostile || 0) * 2);
  if (S.rvShield > S.day) { S.rvShield = 0; ev('good', '情報', `你事先掌握了${r.n}的動作，對方撲了個空`); r.last = '被你識破'; return; }
  const acts = i === 0 ? ['steal', 'steal', 'poach', 'smear', 'price'] : ['smear', 'smear', 'poach', 'steal', 'price'];
  const k = pick(acts.filter(a => a !== 'steal' || S.offers.some(o => !o.boss && !o.nom)));
  if (k === 'steal') { const o = S.offers.filter(o => !o.boss && !o.nom).sort((a, b) => b.reward - a.reward)[0], c = Math.round(o.reward * (isFr('guild') ? .15 : .3));
    r.last = `想搶「${o.n}」`;
    ask('rvSteal', `（${r.n}開更低的價，想搶走「${o.n}」這筆委託${isFr('guild') ? '。小雯偷偷先通知了你' : ''}）`, [`加碼 ${fmt(c)} 金留住客戶`, '讓給他們'], { i, id:o.id, c }, 1); }
  if (k === 'poach') { r.last = `私下挖角${h.name}`;
    const tempt = h.trust < 70 || h.burn > 50 || S.cut > 35;
    if (!tempt) { adj('trust', 2); ev('good', '挖角', `${r.n}私下找${h.name}跳槽，被${pron(h)}一口回絕`); say(pickS([`${r.n}找我跳槽，我說不要`, '有人想挖我，我才不走呢', `${r.n}開的條件不錯……但我還是想跟你`])); return; }
    ask('rvPoach', `${r.n}私下找我，說抽成只收 15%，還${pick(['保證每個月休四天', '答應不排危險任務', '說要幫我出寫真集'])}……`, ['留下來，抽成降到 20%', '我相信你會留下', '想走就走吧'], { i }, 2); }
  if (k === 'smear') { r.last = '在報上抹黑你';
    if (isFr('reporter')) { ev('good', '抹黑', `${r.n}想在報紙上抹黑你，被記者${npc('reporter').name}擋了下來`); r.hostile = (r.hostile || 0) + 1; return; }
    const hit = 20 + rkx() * 12;
    ask('rvSmear', `（${r.n}在報紙上說你的事務所${pick(['苛扣勇者的薪水', '跟魔物勾結', '做假帳', '逼勇者帶傷上工'])}。怎麼回應？）`, ['發聲明澄清（300）', '告他們誹謗（有輸有贏）', '不理它'], { i, hit }, 2); }
  if (k === 'price') { r.last = '削價搶單'; S.priceWar = S.day + 6; ev('warn', '價格戰', `${r.n}削價搶單，接下來半年委託報酬 -20%`); }
}
function rvCounter(i, k){
  const r = S.rivals[i], h = H(), cost = { spy:150, steal:400, leak:250 }[k];
  if (S.gold < cost || (r.cd || 0) > S.day) return;
  S.gold -= cost; r.cd = S.day + (k === 'leak' ? 18 : 12);
  if (k === 'spy') { S.rvShield = S.day + 24; ev('good', '情報', `你派人盯著${r.n}，他們下一步動作會被你識破`); }
  if (k === 'steal') { const z = Math.min(topZ(), bestSafeZone() + 1), Z = ZONES[z];
    S.offers.push({ id:S.day * 10 + 7, z, n:`${r.n}的老客戶：${pick(['商隊長期護衛', '貴族的私人委託', '領主的討伐令'])}`, D:Math.round(Z.D * rand(1, 1.3)), days:ri(2, 3), reward:Math.round(Z.gold * 30 * (1 + rkx() * .25)) });
    r.fame = Math.max(0, r.fame - 15); r.hostile = (r.hostile || 0) + 1; ev('good', '搶客戶', `你挖到${r.n}的大客戶，委託已經放進清單`); }
  if (k === 'leak') { r.hostile = (r.hostile || 0) + 2;
    if (chance(.6)) { r.fame = Math.max(0, r.fame - 60); addFame(5); ev('good', '爆料', `你放出${r.n}的黑料，他們名聲大跌`); }
    else { addFame(-30); repAdd(-3, '爆料對手被抓包'); ev('bad', '爆料', `你爆料${r.n}被抓包，反而被說手段骯髒`); } }
  renderAll();
}
// ================= v9：回來時的摘要 =================
// v17.84 新版（design-wip design/ui/草圖_離線摘要.png）：標題列（圖示＋標題＋叉叉）＋內容＋「知道了」；plain＝知道了不是金色（框裡另有要按的）
function openPop(html, t = '', ic = '時間', plain){
  $('mBox').innerHTML = `<div class="mh">${ic.startsWith('<') ? ic : IC(ic, 2)}<b>${t}</b><span class="rsp"></span><button class="pb mx" id="popX" aria-label="關閉">✕</button></div>
    <div class="mbd ppop">${html}<button class="pb ${plain ? 'pl ' : 'au '}mgo" id="popOk">${IC('打勾', 2)}<b>知道了</b></button></div>`;
  $('mission').classList.add('on'); S.paused = true;
  $('popOk').onclick = $('popX').onclick = closeMission; $('mission').onclick = e => { if (e.target.id === 'mission') closeMission(); };
}
const pDl = (v, u = '') => { v = Math.round(v); return `<b class="${v > 0 ? 'cg' : v < 0 ? 'cr' : 'mu'}">${v > 0 ? '+' : ''}${fmt(v)}${u}</b>`; };
const pTile = (ich, val, tip = '', cls = '') => `<span class="pb ptl${cls}"${tip}>${ich}${val}</span>`;
const pSec = (ic, t) => `<div class="psec f16 mu">${IC(ic, 2)}<b>${t}</b></div>`;
const pList = rows => `<div class="pb plst">${rows.join('')}</div>`;
const pSay = (n, t) => `<div class="msay">${n ? `<span class="mfc s">${pimg(n)}</span>` : ''}<div class="pb ns mbub f16">${esc(t)}</div></div>`;
function snapOf(){ const h = H(); return { day:S.day, gold:S.gold, fame:S.fame, lv:h.lv, wallet:h.wallet, mood:h.mood, trust:h.trust, health:h.health, n:S.msgs.length, nw:(S.news || []).length, name:h.name, gen:S.gen }; }
function showSummary(a){
  const h = H(), b = snapOf(); if (b.gen !== a.gen || ['dead', 'retired', 'left'].includes(h.act)) return;
  const months = b.day - a.day; if (months < 1) return;
  const evs = S.msgs.filter(m => m.d >= a.day && m.k.startsWith('ev') && m.g !== '村子' && m.g !== '日記').slice(-7);
  const nws = (S.news || []).slice(a.nw).slice(-3);
  const greet = h.trust > 70 ? (h.mood > 60 ? `老闆你回來啦！${pickS(['我有乖乖工作喔', '有好多事想跟你說', '等你好久了'])}` : '你回來了……最近有點累') : h.trust < 35 ? pickS(['喔，你還記得我啊', '……回來了喔']) : h.mood > 60 ? pickS(['回來啦，一切都好', '你不在的時候也還行啦']) : '你回來了。最近不太順';
  const gd = m => /good/.test(m.k), tiles = [
    pTile(IC('金幣', 2), pDl(b.gold - a.gold), TIPA('金幣', '金庫', '事務所的錢')), pTile(IC('名聲', 2), pDl(b.fame - a.fame), TIPA('名聲')),
    pTile(`<span class="pwl">${pimg(h)}${IC('金幣', 1)}</span>`, pDl(b.wallet - a.wallet), TIPA('金幣', `${h.name}的錢包`, `${h.name}自己的錢`)),
    pTile(IC('心情', 2), pDl(b.mood - a.mood), TIPA('心情')), pTile(IC('信任', 2), pDl(b.trust - a.trust), TIPA('信任'))];
  if (b.lv > a.lv) tiles.push(pTile(IC('經驗', 2), `<b class="cg f16">Lv${a.lv}→Lv${b.lv}</b>`, TIPA('經驗', '升級', `從 Lv${a.lv} 升到 Lv${b.lv}`)));
  openPop(`${pSay(h, greet)}<div class="ptls">${tiles.join('')}</div>
    ${evs.length ? pSec('驚嘆', '發生的事') + pList(evs.map(m => `<div class="prw tp">${IC(gd(m) ? '打勾' : '驚嘆', 2)}<div><b class="${gd(m) ? 'cg' : 'co'}">${esc(m.g)}</b><div>${esc(m.t)}</div></div></div>`)) : ''}
    ${nws.length ? pSec('近況', '村子裡') + pList(nws.map(x => `<div class="prw">${esc(x.t)}</div>`)) : ''}`,
    `過了 ${months} 個月`, `<span${TIPA('時間', '你不在的這段時間', `過了 ${months} 個月`)}>${IC('時間', 2)}</span>`);
}
// ================= v14：必做的事（年度配額、代言合約、升格考核、王國徵召） =================
const quotaNeed = () => 3 + stageOf();   // v16：2＋階段（階段從 1 算起）
function dutyTick(){
  const h = H(); if (['dead', 'retired', 'left', 'dying'].includes(h.act)) return;
  const mo = S.day % 12;
  if (offline) {   // 你不在的時候，期限都會等你
    if (S.contract) S.contract.until++;
    S.agTasks.forEach(t => { if (t.until) t.until++; }); S.queue.forEach(t => { if (t.until) t.until++; }); S.offers.forEach(t => { if (t.until) t.until++; });
    if (S.examCd > S.day) S.examCd++;
    if (S.draftNext != null) S.draftNext++;
    if (mo === 11 && S.day >= 23) { S.quotaSkip = (S.quotaSkip || 0) + 1; ev('', '公會', '你不在的這段時間剛好碰上年底，公會今年不結算配額'); }
    return;
  }
  // 升格考核
  const nx = rankOf() + 1;
  if (nx < RANKS.length && examLv(nx) && rankOk(nx) && (S.exam || 0) < nx && S.day >= (S.examCd || 0) && !S.agTasks.some(t => t.exam) && !S.queue.some(t => t.exam) && !(h.mission && h.mission.exam)) {
    const z = Math.min(topZ(), bestSafeZone() + 1), Z = ZONES[z];
    S.agTasks.push({ id:S.day * 100 + 77, ag:'exam', exam:nx, n:`升格考核：討伐${Z.n}的精英${Z.mon}`, days:2, D:Math.round(Math.max(zD(z) * .9, power(h) * rand(.95, 1.15))), z, fame:30 + nx * 15, gold:600 + nx * 300, share:.2, until:S.day + 12 });
    if (!offline) { ev('warn', '升格考核', `公會通知：要升格「${RANKS[nx][1]}」，必須先通過考核任務（12 個月內）`); $('dQuest').classList.add('on'); }
  }
  // 年度配額：第 2 年起，年底結算
  if (mo === 11 && S.day >= 23) {
    const done = yr().mis, need = quotaNeed();
    if (done < need) { const f = 20 + rkx() * 15, g = 200 + rkx() * 150; addFame(-f); S.gold -= g; finAdd('other', 0); S.quotaFail = (S.quotaFail || 0) + 1;
      ev('bad', '配額不足', `今年只完成 ${done}/${need} 件委託，公會扣了事務所名聲 ${f}、罰款 ${fmt(g)} 金${S.quotaFail >= 2 ? '。連續沒達標，公會說再這樣就不再介紹委託' : ''}`);
      if (S.quotaFail >= 3) { S.offers = S.offers.slice(0, 1); ev('bad', '公會冷凍', '公會暫停介紹委託給你的事務所，這一批只剩一件'); }
    } else { S.quotaFail = 0; if (!offline) ev('good', '配額達標', `今年完成 ${done}/${need} 件委託，公會很滿意`); }
  }
  // 代言合約：結算與邀約
  const c = S.contract;
  if (c && S.day >= c.until) {
    if (c.done >= c.need) { addFame(10); ev('good', '合約完成', `和${c.who}的代言合約圓滿結束（${c.done}/${c.need} 次）`); }
    else { S.gold -= c.pen; addFame(-20); repAdd(-2, '代言合約違約'); ev('bad', '違約', `代言合約只完成 ${c.done}/${c.need} 次，賠了 ${fmt(c.pen)} 金違約金`); }
    S.contract = null;
  } else if (!c && !offline && !S.q && rankOf() >= 1 && S.day >= (S.contractNext ?? 30) && chance(.08)) {
    S.contractNext = S.day + ri(24, 40);
    const who = pick(['金幣商會', '王都服飾行', '龍鱗藥水', '勇者牌鎧甲']), pay = 600 + rkx() * 400, need = 3 + Math.floor(rkx());
    ask('contract', `（${who}想簽一年的代言合約：先付 ${fmt(pay)} 金，12 個月內要完成 ${need} 次代言、綜藝或見面會；做不到要賠 ${fmt(pay * 2)} 金）`, ['簽約', '不簽'], { who, pay, need }, 3);
  }
  // 王國定期徵召：沒有罰金可以免
  if (S.draftNext == null) S.draftNext = S.day + ri(30, 42);
  if (!offline && !S.q && h.lv >= 6 && S.day >= S.draftNext) {
    if (busyAway(h)) { S.draftNext = S.day + 2; return; }
    S.draftNext = S.day + ri(36, 48);
    ev('bad', '王國徵召', `王國的定期徵召令到了：${h.name}必須去邊境駐守`);
    ask('draft2', '老闆……這次是王國的定期徵召，不能花錢免役。', ['讓他去', '抗命，不去'], {}, 2);
  }
}
function dutyCard(h){
  const out = [], mo = S.day % 12, left = 11 - mo + 1;
  if (S.day >= 11) { const done = yr().mis, need = quotaNeed(), ok = done >= need, risk = !ok && left <= 3;
    out.push(`<div class="duty ${ok ? 'ok' : risk ? 'risk' : ''}"><div class="row"><b>公會年度配額</b><span class="${ok ? 'dg g' : risk ? 'dg r' : 'k'}" style="font-size:12px">${ok ? '已達標' : `年底結算 · 剩 ${left} 個月`}</span></div><div class="row" style="font-size:12.5px;margin-top:4px"><span>完成委託 ${done} / ${need}</span><span class="k" style="font-size:11.5px">沒達標：扣名聲、罰款</span></div><div class="xbar" style="margin-top:4px"><i style="width:${clamp(done / need * 100, 3, 100)}%;background:${ok ? 'var(--green)' : risk ? 'var(--red)' : 'var(--gold)'}"></i></div></div>`); }
  const c = S.contract;
  if (c) { const l2 = c.until - S.day, ok = c.done >= c.need, risk = !ok && l2 <= 3;
    out.push(`<div class="duty ${ok ? 'ok' : risk ? 'risk' : ''}"><div class="row"><b>${esc(c.who)}代言合約</b><span class="${ok ? 'dg g' : risk ? 'dg r' : 'k'}" style="font-size:12px">${ok ? '已完成' : `剩 ${l2} 個月`}</span></div><div class="row" style="font-size:12.5px;margin-top:4px"><span>代言／綜藝／見面會 ${c.done} / ${c.need}</span><span class="k" style="font-size:11.5px">違約賠 ${fmt(c.pen)}</span></div><div class="xbar" style="margin-top:4px"><i style="width:${clamp(c.done / c.need * 100, 3, 100)}%;background:${ok ? 'var(--green)' : risk ? 'var(--red)' : 'var(--gold)'}"></i></div></div>`); }
  const ex = S.agTasks.find(t => t.exam) || S.queue.find(t => t.exam);
  if (ex) out.push(`<div class="duty"><div class="row"><b>升格考核</b><span class="k" style="font-size:12px">${dueTxt(ex.until)}</span></div><div style="font-size:12.5px;margin-top:4px">${esc(ex.n.replace('升格考核：', ''))}${S.queue.includes(ex) ? ' · <span class="dg g">已排進排程</span>' : ' · <button class="lnk" data-go="take">去接任務 ›</button>'}</div></div>`);
  else if (S.examCd > S.day) out.push(`<div class="duty"><div class="row"><b>升格考核</b><span class="k" style="font-size:12px">${S.examCd - S.day} 個月後可以再考</span></div></div>`);
  return out.length ? `<div class="sec" style="margin-top:2px">必做的事</div>${out.join('')}` : '';
}
function npcFavor(){
  const h = H(), c = S.npcs.filter(n => n.alive && !n.dark && !['rival', 'merc', 'fan'].includes(n.role) && n.aff >= 25 && !((n.sick || 0) > S.day) && !n.owe);
  if (!c.length) return;
  const n = pick(c), z = Math.max(0, Math.min(topZ(), bestSafeZone()));
  const k = pick(n.role === 'mayor' ? ['donate', 'donate', 'escort'] : h.wallet >= 150 ? ['escort', 'herb', 'loan'] : ['escort', 'herb']);
  if (k === 'donate') { const g = 300 + rkx() * 200; ask('donate', `（村長老吳來事務所，說村裡的${pick(['橋', '水車', '學堂屋頂'])}壞了，希望事務所捐 ${fmt(g)} 金）`, [`捐 ${fmt(g)} 金`, '捐一半', '婉拒'], { id:n.id, g }, 2); return; }
  if (k === 'loan') { const g = Math.min(ri(100, 300), Math.round(h.wallet * .6)); ask('npcLoan', `${n.name}跟我借 ${g} 金，說${pick(['店裡周轉不過來', '家裡有人生病', '想進一批貨'])}……要借嗎？`, ['借吧，朋友有難', '別借，錢會要不回來', '你自己決定'], { id:n.id, g }, 2); return; }
  const w = k === 'escort' ? [`護送${thp(n)}去鄰村`, '護送'] : [`去${ZONES[z].n}採一種藥草`, '採藥草'];
  ask('favor', `${n.title}${n.name}拜託我${w[0]}，沒有報酬，但${thp(n)}會很感激。可以排進去嗎？`, ['排進去吧', '婉拒', '你自己決定'], { id:n.id, z, w:w[1] }, 2);
}
function favorDone(o, ok){
  const h = H(), n = npc(o.favor); if (!n || !n.alive) return;
  if (ok) { affAdd(n.id, 15); adj('mood', 6);
    const g = n.role === 'priest' ? '一瓶祝福過的藥水' : n.shop ? `${n.shop}的招待券` : n.role === 'smith' ? '一塊好磨刀石' : '親手做的便當';
    if (n.role === 'priest' || chance(.4)) h.pots++;
    ev('good', '人情', `${h.name}幫了${n.name}的忙，${thp(n)}送了${g}當謝禮`); remember('helped', { n:n.name });
    if (!offline) say(pickS([`${n.name}一直跟我道謝，有點不好意思`, `幫${n.name}一個忙，心情真好`])); }
  else { affAdd(n.id, -4); if (/護送/.test(o.n) && chance(.3)) n.sick = S.day + ri(2, 5); ev('warn', '人情', `${h.name}沒能幫上${n.name}的忙`); }
}
function friendVisit(){
  const h = H(), pa = h.partner && npc(h.partner);
  const fr = S.npcs.filter(n => n.alive && !n.dark && n.role !== 'rival' && n.id !== h.partner && n.aff >= 45 && !((n.sick || 0) > S.day)).sort((a, b) => b.aff - a.aff).slice(0, 4).filter(() => chance(.65)).slice(0, 3);
  if (pa && pa.alive) { adj('mood', 6); adj('stress', -4); }
  if (!fr.length) { if (!pa || !pa.alive) { adj('mood', -4); say(pickS(['躺了好幾天……都沒有人來看我', '原來我在這個村子裡，沒什麼朋友啊'])); } else say(`${pa.name}一直守在床邊……`); return; }
  adj('mood', 4 * fr.length); adj('stress', -3 * fr.length); fr.forEach(n => { n.aff = clamp(n.aff + 2, 0, 100); });
  const pr = fr.find(n => n.role === 'priest'); if (pr) h.bedDays = Math.max(1, h.bedDays - 1);
  const gift = n => ({ tavern:'一鍋燉肉', smith:'修好的護具', priest:'祝福', guild:'公會的慰問金', mayor:'村裡的慰問品', reporter:'一疊報紙', fan:'自己畫的畫', merc:'一瓶烈酒', elder:'當年的故事', rival2:'一籃水果' })[n.role] || pick(['自己做的點心', '一束花', '一籃水果']);
  ev('good', '探病', fr.map(n => `${n.name}帶了${gift(n)}`).join('、') + `來看${h.name}${pr ? '（修女的祝福讓傷好得快一點）' : ''}`);
  say(fr.length >= 3 ? '大家都來了……原來我不是一個人' : `${fr[0].name}來看我了，好開心`);
}
function memLine(){
  const h = H(); const old = h.mem.filter(m => S.day - m.d >= 3); if (!old.length) return null;
  return memText(pick(old));
}
function memText(m){
  const h = H(), Zn = m.z != null && ZONES[m.z] ? ZONES[m.z].n : '';
  return ({
    nearDeath:pick([`還記得在${Zn}倒下那次嗎……我到現在還會夢到`, `經過${Zn}的時候，腳還是會發軟`, '差點死掉之後，我吃飯都比較認真了']), saved:pick(['那次你花大錢把我救回來，我一直記得', '我這條命，有一半是你的', '那筆救命錢，我總有一天會還你']),
    gift:`這把${WPN.n[h.wpn]}${WNAME[h.cls]}是你送的，我每天都有擦`, npcDied:`${m.n}如果還在就好了……`,
    wishOk:`上次你幫我實現「${m.n}」，真的很開心`, wishFail:`你還記得我說過「${m.n}」嗎……算了`,
    rescued:`${m.n}到現在還一直跟我道謝`, duelWin:`${m.n}最近都不敢正眼看我，哈哈`, duelLose:`總有一天我要贏回來，${m.n}你等著`,
    forced:`上次你叫我去${Zn}，害我受了重傷……這次讓我自己決定好嗎`, treasure:`我一直帶著${m.n}，感覺它會保佑我`,
    used:pick([`那次「${m.n}」……我知道你是為了事務所`, `「${m.n}」那次，我真的很難過`, `我不怪你排了「${m.n}」，只是有點累`]), familyOk:'那次你讓我馬上回家，我一直很感激', familyLate:'那天如果我直接回去就好了……', familyNo:'那天你不讓我回家……我到現在都記得', betrayed:pick(['那次醜聞，你公開跟我切割……我到現在都記得', '被你切割的那天，我才知道自己只是商品']), backed:pick(['那次醜聞你站在我這邊，我一輩子記得', '醜聞那時候，只有你沒丟下我', '我常常想，要是那時你沒力挺我，我現在會在哪']),
    champ:'拿下武鬥大會冠軍那天，我到現在還記得歡呼聲', award:'被選為年度最佳勇者那次，我偷偷哭了',
    helped:`上次幫${m.n}的忙，${m.n}到現在還會送東西來`, fought:`跟${m.n}一起出任務的那次，真的很痛快`, compDied:`${m.n}是為了救我才……我永遠不會忘記`,
    raid:'那天守住村子之後，大家看我的眼神都不一樣了', boss:'打倒骸骨魔王那天，是我人生最棒的一天', boss2:'打倒深淵魔王之後，我常常在想，接下來要做什麼', elite:`那隻精英${m.n}王，現在想起來還會冒冷汗`, love:`認識${m.n}是我最幸運的事`,
  })[m.k] || null;
}
// ================= v8.1：對白庫（依個性換語氣，最近講過的話會避開） =================
// 語氣：開朗(cheer)、溫和(warm)、內向(shy)、嗆(blunt)
const toneOf = h => hx(h, 'X') > .62 ? 'cheer' : (hx(h, 'A') < .38 || h.trait === 'hot') ? 'blunt' : hx(h, 'X') < .38 ? 'shy' : 'warm';
const LINES = {
  thanks:{ all:['謝啦！', '好，那我去囉', '收到！', 'OK，交給我', '謝謝老闆～', '那我就照我的意思做了'],
    cheer:['讚啦！就知道你最好', '耶！那我出發了', '老闆萬歲！'], warm:['謝謝你願意讓我試試', '嗯，我會做好的'], shy:['……謝謝', '嗯……那我去了'], blunt:['早該這樣了', '行，那我自己來'] },
  trusted:{ all:['謝謝你相信我！', '你願意讓我決定，我很開心', '好，我不會讓你失望', '被信任的感覺真好'],
    cheer:['哇，老闆你人太好了吧！'], warm:['我會對自己的選擇負責'], shy:['……我、我會努力的'], blunt:['算你有眼光'] },
  backed:{ all:['……謝謝你相信我', '全世界都在罵我，只有你站在我這邊', '這份情，我記住了', '我以為你會丟下我……', '謝謝你沒有放棄我', '以後我會更小心，不會再讓你難做'],
    cheer:['老闆……我差點哭出來'], warm:['我欠你一次，真的'], shy:['……（低著頭，很久沒說話）'], blunt:['……哼，算你夠義氣'] },
  provoked:{ all:['可惡……我一定要證明給他看', '說我只會打史萊姆？走著瞧', '這口氣我先記下來', '被看不起了……', '下次見面，我會讓他閉嘴', '我不想輸給那種人'],
    cheer:['哈，等我變強嚇死他'], warm:['……算了，用成績說話吧'], shy:['……他說的好像也沒錯'], blunt:['有種當面再說一次！'] },
  rivalPush:{ all:['{n}可以，我也可以！', '我也不能輸', '好，那我也要加油了', '{n}做得到的，我一定也做得到', '被同期刺激到了', '我會追上去的'],
    cheer:['燃起來了！'], warm:['替{n}高興，也提醒我自己要加油'], shy:['……我會慢慢追上的'], blunt:['等著，{n}'] },
  scandalAsk:{ all:['……老闆，我上新聞了', '那個……報紙上寫的，有一部分是真的', '老闆，你看到今天的報紙了嗎……', '我闖禍了，對不起', '外面的人都在講我……', '我不知道事情會鬧這麼大'],
    cheer:['老闆……這次我笑不出來了'], warm:['是我的錯，我不會推給別人'], shy:['……我不敢出門了'], blunt:['那些記者根本亂寫……好啦，一半是真的'] },
  wishOk:{ all:['太好了！謝謝你老闆！', '這是我這陣子最開心的一天', '「{w}」……真的實現了耶', '我會記得今天的', '原來願望成真是這種感覺', '謝謝你把我的話放在心上'],
    cheer:['我要大叫三聲！', '今晚我請客！'], warm:['你有聽進去，我真的很感動'], shy:['……（偷偷擦了一下眼睛）'], blunt:['……算你有心'] },
  wishFail:{ all:['算了，反正你也不在乎', '……沒關係，我習慣了', '本來就不該期待的', '我說過的話，你大概早就忘了', '……沒事，下次吧', '是我想太多了'],
    cheer:['……哈哈，沒差啦'], warm:['我知道你很忙'], shy:['……'], blunt:['我就知道'] },
  retireDeny:{ all:['……好吧，再拚一年', '一年，說好的喔', '我的膝蓋說它不同意，但好吧', '……再一年就好', '你最好記得你說過的話'],
    cheer:['好啦好啦，最後衝刺！'], warm:['我懂，事務所需要我'], shy:['……嗯'], blunt:['一年後你再不放人，我自己走'] },
  selfStudy:{ all:['我報名了進修班，接下來兩個月不用排我', '我自費去上課，這兩個月先別找我', '公會開了新課程，我去充電兩個月', '技多不壓身，我去進修一下'] },
  stayHero:{ all:['嗯……我想再當幾年勇者', '我還不想放棄', '回老家考公職？再說吧', '爸媽那邊，我會自己去說', '現在回去，我會後悔一輩子'],
    cheer:['我要當最紅的勇者再回去！'], warm:['謝謝你支持我的選擇'], shy:['……我會打電話跟他們好好講'], blunt:['我的人生我自己決定'] },
  noBuy:{ all:['好吧，不買', '嗯，聽起來確實很可疑', '……可是包裝很漂亮耶', '好啦，我不亂喝東西', '你說得對，那攤看起來就怪怪的'] },
  showLike:{ all:['還蠻好玩的！', '原來被大家注意是這種感覺', '有小朋友找我簽名耶', '下次還想再來', '大家都好熱情', '我好像有點喜歡站在台上', '主持人說我很有梗'],
    cheer:['我是不是天生明星？', '台下尖叫聲好大！'], warm:['能讓大家開心，我也很開心'], shy:['……緊張死了，但好像還不錯'], blunt:['哼，也沒那麼難嘛'] },
  showHate:{ all:['……笑到臉都僵了', '這種工作我真的不行', '我寧願去打史萊姆', '好想回家', '拜託下次別排這個', '我感覺自己像隻猴子', '主持人一直叫我耍帥……'],
    cheer:['連我都笑不出來了……'], warm:['我盡力了，但真的不擅長'], shy:['台下好多人……我腦袋一片空白'], blunt:['這種工作根本是在浪費我的時間'] },
  trialYuck:{ all:['那個藥好噁心……', '我的舌頭到現在還是麻的', '他們說副作用「很輕微」，騙人', '我再也不要當白老鼠了', '喝完一直打嗝，好丟臉'] },
  agWin:{ all:['事務所的名聲，我幫你打響了', '輕鬆完成！', '回來了，比想像中順利', '這種程度，交給我就對了', '任務完成，報告老闆', '搞定，下一個', '今天狀態不錯', '委託方還說下次指名我'],
    cheer:['完美！給我掌聲！'], warm:['大家都平安，最重要'], shy:['……順利完成了'], blunt:['太簡單了，給我難一點的'] },
  agWinHard:{ all:['完成了……這次真的差點回不來', '活著回來了，今晚要喝一杯', '我還以為這次完蛋了', '手到現在還在抖', '……我需要睡三天', '我們辦到了，但我不想再來一次'] },
  missionWin:{ all:['任務完成！今晚要吃好一點', '搞定～比想像中簡單', '報酬入袋！', '回來了，委託人很滿意', '今天也是平安的一天', '這筆錢存起來', '委託人請我吃了一頓，超飽'],
    cheer:['輕輕鬆鬆！'], warm:['能幫上忙真好'], shy:['……完成了，有點累'], blunt:['這種委託也敢叫委託'] },
  hurtLight:{ all:['嘶…好痛，沒事，小傷', '受傷了啦…明天讓我休息', '擦破皮而已，別擔心', '被咬了一口，還好沒事', '小傷小傷，敷個藥就好'],
    cheer:['哈哈，勇者的勳章啦'], warm:['我太大意了，下次會注意'], shy:['……好痛'], blunt:['可惡，那隻怪給我記住'] },
  hurtHeavy:{ all:['老闆…我可能要躺好幾天了', '好痛…我是不是不適合當勇者', '醫生說要靜養……', '我連翻身都會痛', '……對不起，我搞砸了', '這次傷得很重'],
    cheer:['……這次真的笑不出來'], warm:['讓你擔心了，對不起'], shy:['……我好怕'], blunt:['……下次我會贏回來'] },
  restDay:{ all:['今天休假！', '終於可以睡到自然醒', '今天什麼都不做', '放假就是要賴床', '去河邊釣魚好了', '休假日最棒了', '今天要去市集晃晃', '把衣服洗一洗好了', '想去山坡上看雲', '今天要好好吃一頓'],
    cheer:['放假要去哪玩好呢！'], warm:['趁放假寫封信回家'], shy:['今天要窩在房間看書'], blunt:['今天誰都別找我'] },
  praised:{ all:['嘿嘿，被誇了', '真的嗎？我會繼續加油！', '被你這樣說，有點不好意思', '今天果然沒白拚', '再多誇兩句我也不介意喔', '好，明天也要表現給你看'],
    cheer:['我就知道我很厲害！'], warm:['謝謝你注意到'], shy:['……（耳朵紅了）'], blunt:['哼，本來就是'] },
  praisedOdd:{ all:['……你今天是不是哪裡怪怪的', '我今天什麼都沒做耶', '你是不是有事要拜託我？', '突然誇我，好可疑'] },
  cheered:{ all:['謝謝你……我好多了', '有你在真好', '嗯，我再撐一下', '聽你這樣說，心情輕鬆一點了', '原來有人在看著我啊'],
    cheer:['好！我又活過來了！'], warm:['謝謝你一直陪著我'], shy:['……嗯，謝謝'], blunt:['……我又沒怎樣'] },
  scoldSorry:{ all:['……對不起，我會改', '是我不好', '我知道了……', '下次不會了'] },
  scoldAngry:{ all:['你憑什麼罵我！', '……我已經很努力了', '你根本不知道外面有多危險', '每次都只會罵我', '那你自己去打啊'] },
  drinkCheers:{ all:['乾杯！老闆最好了', '其實……我一直很想跟你說聲謝謝', '這杯敬還活著的我們', '阿桃的酒今天特別順', '再一杯！最後一杯！', '喝了酒，好像什麼煩惱都忘了'],
    cheer:['今天不醉不歸！'], warm:['能跟你這樣聊天，真好'], shy:['……其實我酒量很差'], blunt:['你請客喔，我不客氣了'] },
  favorYes:{ all:['好！我會幫到底', '交給我吧', '朋友有難，當然要幫', '小事一樁'] },
  tWant:{ all:['武鬥大會要報名了！我想參加', '今年的武鬥大會，我想試試看', '老闆，大會那個……可以報名嗎？', '我想站上那個擂台'],
    cheer:['冠軍獎盃一定很閃！'], warm:['想知道自己現在到哪個程度'], shy:['……其實我有點想去'], blunt:['我要讓全場知道誰最強'] },
  tNo:{ all:['武鬥大會？上台被打給大家看，我才不要', '我對那種表演沒興趣', '受傷了誰負責？我不想去'] },
  tSad:{ all:['……我本來很想參加的', '今年又只能在台下看了', '好吧，明年再說'] },
  tWin:{ all:['贏了！下一場！', '對手很強，但我更強', '手感來了！', '再兩場……不，再一場', '觀眾的聲音好大！'],
    cheer:['看到沒看到沒！'], warm:['對手也打得很好'], shy:['……贏、贏了？'], blunt:['太弱了'] },
  tLose:{ all:['……輸了', '差一點點', '對手真的很強', '明年我一定會回來', '……讓你失望了'],
    cheer:['哈……輸得好難看'], warm:['我盡力了，學到很多'], shy:['……（一直盯著地上）'], blunt:['裁判有問題！……算了，是我太弱'] },
  tChamp:{ all:['老闆！！我是冠軍！！', '冠軍……是我？', '這座獎盃，是我們兩個的', '我要把獎盃放在床頭'],
    cheer:['今晚全酒館我請！'], warm:['謝謝你一路陪我'], shy:['……我、我可以哭一下嗎'], blunt:['早就說了，我最強'] },
  goneBack:{ all:['我回來了……讓你擔心了', '……我只是需要一個人靜一靜'] },
};
function pickS(arr){
  const rec = (S && S.recentL) || [], fresh = arr.filter(t => !rec.includes(t));
  return pick(fresh.length ? fresh : arr);
}
function L(key, v){
  const e = LINES[key]; if (!e) return '';
  const tn = toneOf(H()), pool = [...e.all, ...(e[tn] || []), ...(e[tn] || [])];
  let t = pickS(pool);
  if (v) Object.keys(v).forEach(k => { t = t.split('{' + k + '}').join(v[k]); });
  return t;
}
// 閒聊素材
const SEASON = [
  ['新年快到了，要不要包紅包給我？開玩笑的', '過年想回家吃團圓飯', '鞭炮聲好吵，史萊姆都嚇跑了'],
  ['天氣好冷，被窩好難離開', '下了好大的雪，草原都白了', '冬天的燉肉特別好吃'],
  ['春天了，河邊的花開了', '祭典快到了，村子好熱鬧', '春雨下個不停，鞋子都濕了'],
  ['最近好多人在種田', '櫻花……不對，是桃花，開得好漂亮', '春天的風好舒服，想睡午覺'],
  ['梅雨季，衣服都晾不乾', '最近一直下雨，森林好滑', '雨天的酒館人特別多'],
  ['天氣開始變熱了', '晚上的螢火蟲好多', '好想吃冰'],
  ['熱死了，盔甲裡面都在蒸', '今天在河裡泡了好久', '夏天的魔物也很沒精神的樣子'],
  ['颱風要來了，大家在綁屋頂', '好熱……想去王都吹冷風魔法', '西瓜好甜'],
  ['秋天了，晚上開始有點涼', '麥子收成了，麵包店的麵包特別香', '中秋快到了，想吃月餅'],
  ['楓葉紅了，森林好漂亮', '秋天的天空好高', '最近胃口好好'],
  ['風好大，帽子差點被吹走', '天黑得好早', '收成祭結束了，有點寂寞'],
  ['年底了，大家都在結帳', '今年就要結束了，好快', '想想今年做了什麼……'],
];
const ROLE_TALK = {
  tavern:['{n}的燉肉又漲價了', '{n}偷偷多給我一塊肉', '{n}說我喝酒的樣子很像她弟弟', '{n}今天心情好像不錯'],
  smith:['{n}說我的武器保養得太差', '{n}又在念現在的年輕人', '{n}的打鐵聲，聽了很安心'],
  villager:['跟{n}聊了很久', '{n}說我最近氣色{c}', '{n}約我下次一起去祭典', '{n}送了我一點吃的', '在路上遇到{n}，聊了一下近況'],
  guild:['{n}偷偷告訴我，最近有好委託', '{n}櫃台前排了好長的隊', '{n}說公會的咖啡難喝到想辭職'],
  priest:['{n}說要我多愛惜自己', '去神殿的時候，{n}幫我祈福了', '{n}說每個勇者她都記得名字'],
  mayor:['{n}又在廣場演講了，好長', '{n}說村子能平安都要謝謝勇者', '{n}在煩惱水車的事'],
  reporter:['{n}一直想採訪我', '{n}問我理想型是什麼，我才不說', '{n}說下期週報要做勇者特輯'],
  fan:['{n}今天又跟在我後面', '{n}拿木劍說要跟我比劃', '{n}問我怎樣才能變強'],
  merc:['{n}說他以前在北方打過龍，八成是吹牛', '{n}教了我一招保命的技巧', '{n}說錢比命重要，我不太同意'],
  rival2:['在公會遇到{n}，聊了一下彼此的經紀人', '{n}說她的經紀人很嚴格', '{n}約我哪天一起出任務'],
  elder:['{n}又在講當年打魔物的故事', '{n}說我出劍的角度不對', '{n}說，勇者最重要的是活著回來', '{n}的膝蓋好像越來越不好了'],
  merchant:['馬可又在推銷奇怪的東西', '馬可說有一筆穩賺不賠的生意，聽起來好可疑'],
};
const GOSSIP = ['欸你知道嗎？{t}', '村子裡都在說：{t}', '聽說{t}……', '{t}，大家都在聊這件事'];
const MORE_TALK = {
  high:['今天天氣真好！', '老闆，我覺得我越來越強了', '鎮上的麵包店出新口味了', '今天的風好舒服', '我今天一口氣打了好多隻！', '最近覺得當勇者真不錯', '今天走路都想哼歌', '早餐的蛋是雙黃的，好兆頭', '我覺得今天做什麼都會成功', '有個小孩說我很帥，哈哈', '好想把今天的心情存起來'],
  low:['……', '當勇者到底是為了什麼', '好累喔', '我好像什麼都做不好', '今天不想說話', '如果當初沒當勇者就好了', '最近看什麼都灰灰的', '吃飯也覺得沒味道', '我是不是讓大家失望了', '別問我，我也不知道怎麼了'],
  mid:['今天也平安回來了', '晚餐吃什麼好呢', '欸，你覺得我該換把武器嗎', '酒館的燉肉漲價了', '最近村子好熱鬧', '昨天夢到自己變成史萊姆', '靴子破了一個洞', '老闆，你小時候想當什麼？', '我最近在練左手拿劍', '王都的人都在穿什麼啊', '鄰居家的狗一直跟著我', '我在想要不要養隻貓', '聽說王都開了一間很貴的餐廳'],
  morning:['早安，老闆', '今天也要努力了', '昨晚睡得不太好……'],
  night:['今天辛苦了', '晚上的村子好安靜', '星星好多'],
  old:['最近爬個坡就會喘', '腰好痠……年紀到了嗎', '看到新來的冒險者，覺得自己老了', '年輕時候的傷，下雨天會痛'],
  rich:['口袋有錢，心裡踏實', '我在考慮要不要買間小房子'],
  broke:['我口袋快空了……', '這個月要吃土了', '月底了，只能吃麵包配水'],
  trustHi:['老闆，跟你一起工作我很放心', '其實我很慶幸簽的是你', '有什麼事，我第一個想到的就是跟你說'],
  trustLo:['你是不是只把我當賺錢工具？', '……你有在聽我說話嗎', '我有時候不知道你在想什麼'],
  tired:['最近晚上都睡不好', '我常常夢到被怪物追', '肩膀好僵', '再這樣下去我會撐不住'],
};
function chatterV8(){
  const h = H(), r = Math.random();
  // 村子的消息
  const nw = (S.news || []).filter(x => S.day - x.d <= 3);
  if (nw.length && r < .25) { const x = pick(nw); say(pickS(GOSSIP).replace('{t}', x.t)); return true; }
  // 身邊的人
  const ppl = S.npcs.filter(n => n.alive && n.aff >= 25 && n.id !== h.partner && ROLE_TALK[n.role]);
  if (ppl.length && r < .5) { const n = pick(ppl); say(pickS(ROLE_TALK[n.role]).replace('{n}', n.name).replace('{c}', h.sta < 40 ? '很差' : '不錯')); return true; }
  // 季節
  if (r < .62) { say(pickS(SEASON[S.day % 12])); return true; }
  return false;
}
function moodLine(h){
  const hr = hourOf(); const pools = [h.mood > 70 ? MORE_TALK.high : h.mood < 30 ? MORE_TALK.low : MORE_TALK.mid];
  if (hr < 9) pools.push(MORE_TALK.morning); else if (hr > 19) pools.push(MORE_TALK.night);
  if (h.age >= 32) pools.push(MORE_TALK.old);
  if (h.wallet > 1500) pools.push(MORE_TALK.rich); else if (h.wallet < 15) pools.push(MORE_TALK.broke);
  if (h.trust > 80) pools.push(MORE_TALK.trustHi); else if (h.trust < 35) pools.push(MORE_TALK.trustLo);
  if (h.stress > 70 || h.burn > 60) pools.push(MORE_TALK.tired, MORE_TALK.tired);
  return pickS(pick(pools));
}

const VOICE = {
  seiko:['今天的晚霞好適合拍照', '好想買那件新披風喔……', '人生就是要對自己好一點', '下次放假想去溫泉', '這家甜點店我一定要再來', '賺錢就是要花在讓自己開心的地方', '王都新開的餐廳，聽說要排三個月', '我買了一個很可愛的錢包，裡面沒錢', '存錢？那是什麼，能吃嗎', '今天犒賞自己一下好了'],
  etf:['這個月又存了一點，離頭期款更近了', '最近看了一間房子，好貴……', '能省則省', '我把錢都放進 ETF 了', '外食好貴，我自己帶便當', '王都的房價又漲了，我是不是永遠買不起', '每個月固定扣款，雷打不動', '記帳記了三年，沒有一天斷過', '別人在吃大餐，我在算複利', '等我退休，就要去海邊住'],
  slash:['朋友又介紹了一個案子給我', '我在想要不要多學一門手藝', '被綁在一個地方好悶', '斜槓才是王道', '下週有個外快，可以排開嗎', '我最近在幫吟遊詩人寫歌詞', '雞蛋不要放在同一個籃子裡', '當勇者只是我的其中一個身分', '我在想要不要開個小攤子賣護身符', '自由比穩定重要'],
  cert:['我在讀新的戰鬥教本', '考到證照的話，身價會不一樣吧', '最近練的招式終於成功了', '公會有新的進修班，好想去', '技多不壓身', '我在整理戰鬥筆記，已經第三本了', '下次轉職考試我一定要過', '老師說我的理論很好，實戰還差一點', '想去王都的騎士學院旁聽', '多一張證照，多一條路'],
  health:['今天有好好睡滿八小時', '我開始每天喝藥草茶', '身體是一切的本錢', '別排太晚的工作喔', '最近在學冥想', '今天早起跑了一圈', '賺再多錢，躺在床上也花不到', '我戒酒第三十天了', '藥師說我的脈象很穩', '工作做不完，明天再說'],
  filial:['媽打電話問我有沒有吃飽', '寄回家的錢，爸說拿去修屋頂了', '過年一定要回家', '我爸以前也是勇者喔', '好想吃媽煮的菜', '弟弟考上學院了，學費我來出', '阿嬤說她每天都在拜拜保佑我', '爸的腰又痛了，想寄藥回去', '家裡的田今年收成不好', '我是長子，總要扛起來'],
};
function chatter(){
  const h = H();
  if (VOICE[h.goal] && chance(.22)) { say(pickS(VOICE[h.goal])); return; }
  if (h.mem.length && chance(.3)) { for (let k = 0; k < 4; k++) { const l = memLine(); if (l && !(S.recentL || []).includes(l)) { say(l); return; } } }
  const pa = h.partner && npc(h.partner);
  if (pa && chance(.3)) { say(pickS([`${pa.name}今天做了便當給我`, `${pa.name}叫我別太拚`, `等存夠錢，想帶${pa.name}去王都玩`, `${pa.name}說我打呼很大聲`, `昨天跟${pa.name}吵架了，為了誰洗碗`, `${pa.name}幫我把披風補好了`, `出門前${pa.name}一直叮嚀我要小心`, `${pa.name}說想養一隻狗`,
    ...(h.child ? [`${h.child.name}今天會叫我了！`, `${h.child.name}說長大要當勇者，我不太想`, `${h.child.name}發燒了，昨晚都沒睡`, `${h.child.name}畫了一張我打怪的圖`] : [])])); return; }
  if (chance(.55) && chatterV8()) return;
  say(moodLine(h)); return;
  const lines = h.mood > 70 ? ['今天天氣真好！', '老闆，我覺得我越來越強了', '鎮上的麵包店出新口味了', '今天的風好舒服', '河邊的花開了', '我今天一口氣打了好多隻！', '最近覺得當勇者真不錯'] : h.mood < 30 ? ['……', '當勇者到底是為了什麼', '好累喔', '我好像什麼都做不好', '今天不想說話', '如果當初沒當勇者就好了'] : ['今天也平安回來了', '晚餐吃什麼好呢', '欸，你覺得我該換把武器嗎', '酒館的燉肉漲價了', '最近村子好熱鬧', '老陳說他想收徒弟', '昨天夢到自己變成史萊姆'];
  if (h.stress > 70) lines.push('最近晚上都睡不好', '我常常夢到被怪物追');
  if (h.trust < 35) lines.push('你是不是只把我當賺錢工具？');
  if (h.wallet < 15) lines.push('我口袋快空了……');
  say(pickS(lines));
}

// ================= v4：勇者自己的錢 =================
function saveTarget(h){
  if (h.goal === 'etf' && !h.house) return { k:'house', n:'房子頭期款', t:2500 + h.lv * 60 };
  if (h.partner && !h.married && h.goal !== 'seiko') return { k:'wedding', n:'婚禮基金', t:600 + h.lv * 20 };
  if (h.married && !h.child && !h.readyKid && h.kidWish === 'want') return { k:'child', n:'育兒基金', t:1000 + h.lv * 30 };
  if (h.goal === 'etf') return { k:'retire', n:'退休金', t:Math.round((3000 + h.lv * 150) * (h.richMul || 1)) };
  return null;
}
const WHY = h => ({ seiko:'人生苦短，對自己好一點', etf:'雖然很心痛', slash:'接案也需要好裝備', cert:'這樣就能接更危險、更賺的委託', health:'安全第一', filial:'寄完家裡的錢，這是剩下的' })[h.goal] || '';
// 鐵匠報價：老陳越貪心、你們看起來越好坑、他今天心情越差，價錢越高；交情好會打折
function quote(base, who){
  const n = npc('chen'), h = H();
  if (!n || !n.alive) return { p:Math.round(base * 1.15), why:'老陳不在了，只能跟外地商人買，貴 15%' };
  const greed = 1 - hx(n, 'H');
  const naive = who === 'hero' ? clamp((h.lv < 6 ? .6 : .2) + (S.day - h.born < 12 ? .2 : 0) + (h.wallet > base * 3 ? .3 : 0), 0, 1) : .25;
  const disc = n.aff >= 50 ? (n.aff - 50) / 250 : 0;
  const m = (1 + greed * naive * .6) * (1 - disc) * (n.grumpy ? 1.1 : 1);
  const why = [n.grumpy ? '老陳今天心情很差' : '', greed * naive > .25 ? `看${who === 'hero' ? H().name : '你'}好坑，抬了價` : '', disc > .03 ? '交情好打了折' : ''].filter(Boolean).join('、');
  return { p:Math.round(base * m), why:why || (m > 1.01 ? '老陳習慣多算一點' : '照定價'), m };
}
function heroShop(){
  const h = H(); if (!GOALS[h.goal]) h.goal = V3MAP[h.goal] || pickGoal(h.trait);
  const tgt = saveTarget(h);
  if (tgt && h.wallet >= tgt.t) { reachTarget(tgt); return; }
  if (tgt && tgt.k === 'house' && h.wallet > tgt.t * .5) clue('什麼都捨不得買，偷偷把錢存起來');
  // 跛腳：自己買輔具
  if (hasP(h, 'lame') && (h.aid || 0) < 2) { const c = [300, 2000][h.aid || 0];
    if (h.wallet >= c * ((h.aid || 0) ? (h.goal === 'cert' || h.goal === 'health' ? 1.2 : 2) : 1.3)) { h.wallet -= c; h.aid = (h.aid || 0) + 1; ev('good', '輔具', `${h.name}用自己的錢買了${['', '拐杖', '魔導義足'][h.aid]}`); if (!offline) say(h.aid === 1 ? '有了拐杖，走路輕鬆多了' : '這個義足好厲害，幾乎跟以前一樣了'); return; } }
  // 孝順拉扯：今天賺的錢先寄三成回家
  if (h.goal === 'filial' && (h.earnToday || 0) > 0) { const g = Math.round(h.earnToday * (1 - S.cut / 100) * .3); if (g > 0 && h.wallet >= g) { h.wallet -= g; h.sentHome = (h.sentHome || 0) + g; adj('mood', 1); if (chance(.1)) clue('每次都偷偷把錢寄回老家'); } }
  const reserve = tgt ? Math.min(h.wallet, tgt.t) : 0;
  const spare = () => h.wallet - reserve;
  const fac = ({ seiko:1.6, etf:3, slash:1.4, cert:1.05, health:1.4, filial:1.4 }[h.goal] || 1.4) * (1 + dw(h, 'saving') * .5) * (1.2 - hx(h, 'C') * .4);
  const talk = t => { if (!offline) say(t); };
  // 必需品（可以動用存款）：藥水、看醫生
  const potWant = h.goal === 'cert' ? 4 : h.goal === 'health' ? 3 : h.goal === 'seiko' ? 1 : 2;
  while (h.pots < potWant && h.wallet >= POT_PRICE * (h.goal === 'etf' ? 3 : 1.5)) { h.wallet -= POT_PRICE; h.pots++; }
  const docC = 80 + h.lv * 20;
  if (h.health < (h.goal === 'health' ? 75 : 45) && h.wallet >= docC * (h.goal === 'etf' ? 2 : 1)) { h.wallet -= docC; h.health = clamp(h.health + 35, 0, 100); if (h.bedDays > 0) h.bedDays--; ev('warn', '自己看病', `${h.name}自己掏錢去看了醫生`); if (h.goal === 'health') clue('身體一點小狀況就去看醫生'); }
  // 裝備：先補比較落後的那一件
  const nw = h.wpn < 3 ? quote(WPN.price[h.wpn + 1], 'hero').p : Infinity, na = h.arm < 3 ? quote(ARM.price[h.arm + 1], 'hero').p : Infinity;
  const wantP = h.goal === 'cert' ? .6 : h.goal === 'etf' ? .1 : .3;
  if (Math.min(nw, na) < Infinity && chance(wantP)) {
    if (na <= nw && spare() >= na * fac) { h.wallet -= na; h.arm++; ev('good', '自己買裝備', `${h.name}用自己的錢買了${ARM.n[h.arm]}`); talk(`我自己買了${ARM.n[h.arm]}！${WHY(h)}`); return; }
    if (spare() >= nw * fac) { h.wallet -= nw; h.wpn++; ev('good', '自己買裝備', `${h.name}用自己的錢買了${WPN.n[h.wpn]}${WNAME[h.cls]}`); talk(`看！我自己買的${WPN.n[h.wpn]}${WNAME[h.cls]}，${WHY(h)}`); return; }
  }
  // 證照進修：自費進修
  const coachC = 150 + h.lv * 40;
  if (h.goal === 'cert' && spare() >= coachC * 1.3 && h.sta > 60 && ['idle', 'rest', 'home'].includes(h.act) && !h.trainDays && chance(.12)) {
    h.wallet -= coachC; h.trainDays = 2; ev('good', '自費進修', `${h.name}自己花錢報名了進修班`); clue('自己花錢去考證照'); talk(L('selfStudy')); return;
  }
  // 送禮
  if (chance(h.goal === 'seiko' ? .15 : .06)) {
    const to = (h.partner && npc(h.partner)) || S.npcs.filter(n => n.alive && n.role !== 'rival' && n.aff >= 30).sort((a, b) => b.aff - a.aff)[0];
    const c = 40 + h.lv * 3;
    if (to && to.alive && spare() >= c * 1.5) { h.wallet -= c; affAdd(to.id, 8); adj('mood', 3); ev('good', '送禮', `${h.name}買了禮物送給${to.name}`); return; }
  }
  // 享受
  if (h.goal === 'seiko' && spare() >= 120 && chance(.15)) {
    const c = ri(60, 150), what = pick(['吃了一頓大餐', '去溫泉小旅行', '買了新衣服', '請朋友喝酒', '訂了一間景觀房']);
    h.wallet -= c; adj('mood', 10); adj('stress', -12); ev('good', '享受', `${h.name}${what}，花了 ${c} 金`); clue(`又${what}`);
    if (h.partner && npc(h.partner)) affAdd(h.partner, 4);
    return;
  }
  if (h.goal === 'health' && spare() >= 100 && chance(.1)) {
    const c = ri(50, 100); h.wallet -= c; h.health = clamp(h.health + 6, 0, 100); adj('stress', -10); adj('mood', 5);
    ev('good', '保養', `${h.name}${pick(['去按摩', '買了健康餐', '去泡藥浴'])}，花了 ${c} 金`); return;
  }
}
function reachTarget(t){
  const h = H();
  if (t.k === 'house') {
    h.wallet -= t.t; h.house = 1; adj('mood', 20); adj('stress', -15); addFame(3);
    ev('good', '買房', `${h.name}終於買下了自己的房子`); logLife('買下自己的房子'); clue('一口氣付了房子頭期款');
    if (!offline) say('老闆！我有自己的房子了！接下來……可以考慮結婚了');
  } else if (t.k === 'wedding') {
    const n = npc(h.partner); if (!n || !n.alive) return;
    h.wallet -= Math.round(t.t * .8);
    if (n.aff >= 75 || chance(.6)) { if (!offline) say(`婚禮基金存好了！我要跟${n.name}求婚！`); wedding(n); }
    else { adj('mood', -20); affAdd(n.id, -10); ev('warn', '求婚', `${n.name}說還沒準備好，拒絕了${h.name}的求婚`); if (!offline) say('……戒指先收著吧'); }
  } else if (t.k === 'child') {
    h.wallet -= Math.round(t.t * .6); h.readyKid = 1;
    ev('good', '準備', `${h.name}存好了育兒基金`); if (!offline) say('育兒基金存好了，我們準備好迎接小寶寶了');
  } else if (t.k === 'retire') {
    if (h.age >= 28 && !offline && !S.q) { h.retireAsk = S.day + 12; ask('retire', `老闆，我的退休金存夠了。我想趁身體還好的時候退休，可以嗎？`, ['好，你辛苦了', '再拚一年就好', '不行，你還能打'], {}, 3); }
    h.richMul = (h.richMul || 1) * 1.5;
  }
}
function wedding(n){
  const h = H(); h.married = S.day + 1; adj('mood', 30); addFame(5); wishHook('married');
  ev('good', '婚禮', `${h.name}和${n.name}結婚了，全村都來喝喜酒`); logLife(`和${n.name}結婚`);
  if (h.kidWish === 'maybe' && chance(.4)) { h.kidWish = 'want'; ev('good', '改變', `結婚後，${h.name}開始想要一個孩子`); logLife('婚後想要孩子'); }
}

// ================= 心願 =================
function wishHook(k, n = 1){ const w = H().wish; if (w && w.k === 'cnt' && w.hook === k) w.p += n; }
function wishTick(){
  const h = H();
  if (!h.wish) { if (--h.nextWish <= 0) newWish(); return; }
  const w = h.wish;
  let done = false;
  if (w.k === 'gear') done = h.wpn >= w.t;
  else if (w.k === 'rest') done = h.restStreak >= 3;
  else if (w.k === 'money') done = h.wallet >= w.t;
  else if (w.k === 'zone') done = w.p >= w.t;
  else if (w.k === 'boss' || w.k === 'drink' || w.k === 'treasure') done = w.p >= 1;
  else if (w.k === 'cnt') done = w.p >= w.t;
  else if (w.k === 'steady') done = S.day - Math.max(w.from, S.planSet || -99) >= 10;
  else if (w.k === 'friends') done = friendsN() >= w.t;
  if (done) {
    adj('mood', 25); adj('trust', 12); adj('stress', -15);
    ev('good', '心願達成', `${h.name}的心願「${w.n}」實現了`); logLife(`心願達成：${w.n}`); remember('wishOk', { n:w.n }); addFame(5);
    if (!offline) say(L('wishOk', { w:w.n }));
    h.wish = null; h.nextWish = ri(6, 12);
  } else if (S.day >= w.until) {
    adj('mood', -12); adj('trust', -6);
    ev('warn', '心願落空', `${h.name}一直想「${w.n}」，最後還是沒能實現`); remember('wishFail', { n:w.n });
    if (w.k === 'boss' && (h.trait === 'brave' || h.trait === 'hot') && !h.bossKill && bossOpen(h) && !offline && chance(.5)) {
      say('你不讓我去，我就自己去！'); logLife(`瞞著經紀人獨自挑戰${BOSS.n}`);
      h.act = 'mission'; h.mission = { n:'獨自挑戰' + BOSS.n, z:2, D:BOSS.D, days:1, reward:BOSS.reward, boss:true }; h.actDays = 1; preRoll(h);
    } else if (!offline) say(L('wishFail'));
    h.wish = null; h.nextWish = ri(8, 14);
  }
}
function newWish(){
  const h = H(); const pool = [];
  if (h.wpn < 3) pool.push({ k:'gear', t:h.wpn + 1, n:`想要一把${WPN.n[h.wpn + 1]}${WNAME[h.cls]}` });
  pool.push({ k:'rest', n:'想連放三個月假' });
  pool.push({ k:'drink', p:0, n:'想跟老闆喝一杯' });
  pool.push({ k:'money', t:Math.round((50 + h.lv * 25) / 10) * 10, n:`想存到 ${Math.round((50 + h.lv * 25) / 10) * 10} 金` });
  const nz = h.zonesSeen.findIndex((v, i) => !v && i <= topZ()); if (nz >= 0) pool.push({ k:'zone', z:nz, t:5, p:0, n:`想去${ZONES[nz].n}打 5 隻怪` });
  else pool.push({ k:'zone', z:2, t:30, p:0, n:'想在荒地打 30 隻怪' });
  if (h.lv >= 12 && !h.bossKill) pool.push({ k:'boss', p:0, n:`想打倒${BOSS.n}` });
  const tk = Object.keys(TREASURES).filter(k => TREASURES[k].z <= topZ() && TREASURES[k].z <= bestSafeZone() + 1 && !h.charms.includes(k));
  if (h.lv >= 4 && tk.length) { const k = pick(tk); pool.push({ k:'treasure', t:k, p:0, n:`想找到${ZONES[TREASURES[k].z].n}的${TREASURES[k].n}` }, { k:'treasure', t:k, p:0, n:`想找到${ZONES[TREASURES[k].z].n}的${TREASURES[k].n}` }); }
  const nz2 = bestSafeZone() + 1; if (nz2 <= topZ()) pool.push({ k:'zone', z:nz2, t:15, p:0, n:`想在${ZONES[nz2].n}打 15 隻怪` });
  pool.forEach(w => { w.wt = 1; });
  const rv = npc('rival'), add = (des, w) => { const x = dw(h, des); if (x) { w.wt = 3 * x; pool.push(w); } };
  add('status', { k:'cnt', hook:'mission', t:3, n:'想讓全村都聽過我的名字' });
  add('eating', { k:'cnt', hook:'drink', t:2, n:'想吃遍酒館的招牌菜' });
  if (h.partner && !h.married) add('family', { k:'cnt', hook:'married', t:1, n:'想要有自己的家庭' });
  if (!h.partner) add('romance', { k:'cnt', hook:'partner', t:1, n:'想談一場戀愛' });
  add('social', { k:'friends', t:Math.min(4, friendsN() + 2), n:'想多交幾個朋友' });
  if (rv) add('vengeance', { k:'cnt', hook:'duelWin', t:1, n:`想打敗${rv.name}` });
  add('physical', { k:'cnt', hook:'lvup', t:4, n:'想再變強一點' });
  add('idealism', { k:'cnt', hook:'hero', t:1, n:'想保護村子裡的人' });
  add('honor', { k:'cnt', hook:'lvup', t:5, n:'想讓爸媽以我為榮' });
  add('independence', { k:'cnt', hook:'self', t:6, n:'想自己作主幾天' });
  add('order', { k:'steady', from:S.day, n:'想過一陣子規律的生活（方針別一直換）' });
  add('acceptance', { k:'cnt', hook:'praise', t:2, n:'想聽你說一句做得好' });
  if (h.lv >= 10 && !h.bossKill) add('power', { k:'boss', p:0, n:`想打倒${BOSS.n}，讓大家聽我的` });
  add('saving', { k:'money', t:Math.round((100 + h.lv * 40) / 10) * 10, n:`想存到 ${Math.round((100 + h.lv * 40) / 10) * 10} 金` });
  add('tranquility', { k:'rest', n:'想安安靜靜休息三個月' });
  if (nz >= 0) add('curiosity', { k:'zone', z:nz, t:5, p:0, n:`想去${ZONES[nz].n}看看` });
  const tot = pool.reduce((a, w) => a + w.wt, 0); let r = Math.random() * tot, w = pool[0];
  for (const x of pool) { r -= x.wt; if (r <= 0) { w = x; break; } }
  delete w.wt; w.p = w.p || 0; w.until = S.day + 18; h.wish = w;
  if (!offline) { say(`老闆，我有個心願……${w.n.replace('想', '我想')}`); }
}

// ================= 偶發事件 =================
function randomEvent(){
  const h = H(); const lucky = (hasP(h, 'lucky') ? .15 : 0) + ch(h, 'luck');
  if (chance(.55 + lucky)) {
    const e = pick(['coin', 'friend', 'master', 'merchant', 'fame']);
    if (e === 'coin') { const g = ri(20, 60) * (1 + h.lv / 8); h.wallet += Math.round(g); ev('good', '好運', `${h.name}在路邊撿到 ${fmt(g)} 金`); adj('mood', 5); }
    if (e === 'friend') { const al = S.npcs.filter(n => n.alive && n.role !== 'rival'); if (al.length) { const n = pick(al); affAdd(n.id, ri(10, 20)); adj('mood', 6); ev('good', '相處', `${h.name}和${n.title}${n.name}聊得很開心`); } }
    if (e === 'master') { gainExp(expNeed(h.lv) * .3); ev('good', '指點', `一位退休的老勇者指點了${h.name}幾招`); }
    if (e === 'merchant') { const g = ri(60, 150); h.wallet += g; adj('mood', 8); ev('good', '善行', `${h.name}救了被史萊姆圍住的商人，拿到 ${g} 金謝禮`); }
    if (e === 'fame' && h.lv >= 10) { adj('mood', 12); ev('good', '名聲', `村裡的小孩說長大要像${h.name}一樣`); }
  } else {
    const e = pick(['scam', 'sick', 'stolen', 'lost', 'rival']);
    if (e === 'scam' && h.wallet > 30) { const mk = npc('marco'), l = Math.round(h.wallet * (.3 + (1 - hx(h, 'H')) * .1 + (mk && mk.aff >= 40 ? .3 : 0))); h.wallet -= l; adj('mood', -10); ev('bad', '被騙', `${h.name}被旅行商人馬可說服，買了假的「勇者祕藥」，被騙走 ${fmt(l)} 金`); if (mk) mk.aff = clamp(mk.aff + 8, 0, 100); }
    if (e === 'sick') { h.health = clamp(h.health - 12, 0, 100); h.bedDays = Math.max(h.bedDays, offline ? 1 : 2); adj('mood', -6); ev('warn', '生病', `${h.name}淋了雨著涼，要躺幾天`); }
    if (e === 'stolen' && h.pots > 0) { h.pots = 0; ev('warn', '被偷', `家裡遭小偷，${h.name}的藥水全被偷了`); }
    if (e === 'lost' && (hasP(h, 'lost') || h.trait === 'curious')) { adj('sta', -20); ev('warn', '迷路', `${h.name}在森林迷路了大半天才走出來`); }
    if (e === 'rival' && !offline) { adj('stress', 10); adj('mood', -5); ev('warn', '挑釁', `隔壁村的勇者嘲笑${h.name}「只會打史萊姆」`); say(L('provoked')); }
  }
}

// ================= 經紀人的行動 =================
const TALK = [
  { k:'praise', n:'稱讚', f(){ const h = H(); const did = h.lastGood >= S.day - 1 || (h.earnToday || 0) > 0; adj('mood', 8 * (1 + dw(h, 'acceptance')) * (S.day - (h.lastPraise ?? -99) < 3 ? .4 : 1)); h.lastPraise = S.day; adj('trust', did ? 3 : -1); wishHook('praise'); say(did ? L('praised') : L('praisedOdd')); } },
  { k:'warn', n:'提醒小心', f(){ const h = H(); h.carefulNext = 1; adj('trust', S.day - h.lastHurt < 5 ? 3 : 0); say(h.trait === 'brave' ? '知道啦知道啦，囉嗦' : '嗯，我會小心'); } },
  { k:'cheer', n:'鼓勵', f(){ adj('stress', -8); adj('mood', 4); say(L('cheered')); } },
  { k:'scold', n:'責備', f(){ const h = H(); h.scolded = 2; adj('mood', -12); adj('stress', 8);
      if (dw(h, 'acceptance')) adj('mood', -8);
      if (h.trait === 'hot' || h.trait === 'brave' || hasP(h, 'glass') || hx(h, 'A') < .4) { adj('trust', -8); say(L('scoldAngry')); } else { adj('trust', -2); say(L('scoldSorry')); } } },
  { k:'drink', n:'請喝一杯', cost:80, f(){ const h = H(), m = (1 + (S.office.cellar || 0) * .4) * (S.day - (h.lastDrink ?? -99) < 6 ? .4 : 1); h.lastDrink = S.day; S.gold -= 80; adj('mood', 15 * m * (1 + dw(h, 'eating') * .5)); adj('stress', -15 * m); adj('trust', 6 * m); affAdd('tao', 5); wishHook('drink');
      const tao = npc('tao'); if (tao && tao.alive && tao.grumpy) { adj('mood', -4); ev('warn', '臭臉', '阿桃今天擺臭臉，好像剛被前一桌客人罵過'); } if (h.wish && h.wish.k === 'drink') h.wish.p = 1; say(L('drinkCheers')); } },
  { k:'meal', n:'一起吃飯', cost:50, more:1, f(){ const h = H(); S.gold -= 50; adj('mood', 6 + dw(h, 'social') * 3 + dw(h, 'eating') * 3); adj('stress', -6); adj('trust', 2);
      say(pickS(['這家的滷肉飯好好吃', '跟老闆一起吃飯，好像家人一樣', '你請客喔？那我要加點', '吃飽了，心情也好了'])); } },
  { k:'heart', n:'聊心事', more:1, f(){ const h = H();
      if (h.trust < 30) { adj('trust', 1); say(pickS(['……沒什麼好說的', '我們沒那麼熟吧', '……改天吧'])); return; }
      if ((h.vice || 0) >= 2 && h.trust >= 70 && !h.reform && !h.jailed) { startReform(h); say(pickS([`老闆……其實我最近一直在做不好的事。${{ debt:'我真的很缺錢', family:'家裡一直要錢', addict:'我戒不掉那個藥', betray:'我以為你不在乎我', burn:'我已經什麼都感覺不到了', astray:'我跟錯人了' }[h.cause] || ''}`, '我想重新開始，你會幫我嗎？'])); return; }
      adj('trust', 4); adj('mood', 3); h.st.heard = (h.st.heard || 0) + 1;
      if (!h.revealed && h.said !== h.goal && chance(.5)) { h.clues = (h.clues || 0) + 1; say(pickS(VOICE[h.goal] || ['其實……我也不知道自己想要什麼'])); ev('warn', '觀察', `聊著聊著，${h.name}說的話跟${pron(h)}平常說的不太一樣`); return; }
      if (h.stress > 60) { say(pickS(['其實我最近壓力很大……謝謝你願意聽', '有時候半夜會突然醒來，想到任務就睡不著', '說出來好像輕鬆一點了'])); adj('stress', -8); return; }
      const ml = memLine(); say(ml || pickS(['你為什麼會想當經紀人啊？', '小時候我以為勇者都很帥，現在才知道很累', '能遇到你，算是我運氣好吧'])); } },
  { k:'train', n:'陪他練功', more:1, f(){ const h = H();
      if (!['idle', 'rest', 'home', 'train'].includes(h.act) || h.bedDays > 0) { say('我現在走不開……下次吧'); return; }
      gainExp(Math.round(expNeed(h.lv) * .06)); adj('sta', -12);
      const like = hx(h, 'C') > .6 || h.goal === 'cert' || h.trait === 'brave', hate = hx(h, 'C') < .35 || h.trait === 'lazy';
      adj('mood', like ? 6 : hate ? -5 : 1); adj('trust', like ? 3 : 1);
      say(like ? pickS(['再來一次！', '你的指點很有用', '流汗的感覺真好']) : hate ? pickS(['練完腰好痠……', '一定要現在練嗎', '……好累']) : pickS(['有進步嗎？', '好，今天就到這裡'])); } },
  { k:'gift', n:'送禮物', cost:150, more:1, f(){ const h = H(); S.gold -= 150;
      if (h.goal === 'etf' || dw(h, 'saving')) { h.wallet += 150; adj('mood', 6); adj('trust', 2); say(pickS(['禮物？……不如直接給錢，我存起來', '謝謝！這個我可以拿去換錢嗎？'])); return; }
      adj('mood', 10 + (h.goal === 'seiko' ? 5 : 0)); adj('trust', 3); say(pickS(['哇！你怎麼知道我想要這個', '謝謝老闆！我會好好珍惜', '……突然送禮物，有點不好意思'])); } },
];
const TALK_CD = { praise:1, cheer:1, warn:2, scold:2, drink:3, meal:2, heart:4, train:3, gift:6 };
const talkLeft = (h, k) => { const l = h.talked[k]; return l == null ? 0 : Math.max(0, TALK_CD[k] - (S.day - l)); };
const talkMul = (h, k) => 1 / (1 + ((h.talkLog || {})[k] || []).filter(d => S.day - d < 12).length * .35);
// v17.22：開羅式互動選單（3×3 方格，寫清楚花費、冷卻、效果減弱）
const TALK_PIX = { praise:'口碑', warn:'驚嘆', cheer:'心情', scold:'打叉', drink:'酒窖', meal:'幫忙', heart:'說話', train:'訓練室', gift:'寶物' };   // v17.67：互動選單的像素圖示
const TALK_IC = {
  praise:'<path d="M7 11v9H4v-9z"/><path d="M7 11l4-7c1.5 0 2.5 1 2 3l-1 3h6c1 0 2 1 1.7 2.2l-1.6 6.3c-.3 1-1 1.5-2 1.5H7"/>',
  warn:'<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17v.5"/>',
  cheer:'<path d="M12 21s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.5-7 10-7 10z"/>',
  scold:'<path d="M5 12h14"/><circle cx="12" cy="12" r="9"/>',
  drink:'<path d="M6 4h10v12a3 3 0 01-3 3H9a3 3 0 01-3-3z"/><path d="M16 8h2a2 2 0 010 4h-2"/>',
  meal:'<path d="M4 12h16a8 8 0 01-16 0z"/><path d="M9 4v4M12 3v5M15 4v4"/>',
  heart:'<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8"/>',
  train:'<path d="M4 20L20 4M14 4h6v6"/><path d="M4 14l6 6"/>',
  gift:'<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M12 9v11M4 13h16"/><path d="M12 9c-2-4-6-4-6-1s6 1 6 1c2-4 6-4 6-1s-6 1-6 1"/>' };
function talkState(h, t){
  if (['gone', 'private', 'dying', 'visit'].includes(h.act) || (h.act === 'mission' && (heroHidden(h) || !mKind(h.mission)))) return { off:1, t:pron(h) + '不在' };
  if (h.act === 'mission' && !mHome(h) && !MSG_TALK.includes(t.k)) return { off:1, t:'出門在外' };
  const l = talkLeft(h, t.k); if (l) return { off:1, t:`再 ${l} 個月`, cd:1 };
  if (t.cost && S.gold < t.cost) return { off:1, t:'錢不夠', red:1 };
  return { t:t.cost ? `${t.cost} 金` : '免費', weak:talkMul(h, t.k) < .75 };
}
function openTalkMenu(){
  const h = H(); closeTalkMenu();
  const away = h.act === 'mission' && !mHome(h);
  const cells = TALK.map((t, i) => { const st = talkState(h, t);
    return `<button class="pb tc2${st.off ? ' gy' : ''}${st.red || st.cd ? ' red' : ''}" data-ti="${i}" ${st.off ? 'aria-disabled="true"' : ''}>${st.weak ? '<span class="tg">減弱</span>' : ''}${IC(TALK_PIX[t.k], 2, st.off)}<b>${t.n}</b><i>${st.cd ? IC('時間', 1) : t.cost && !st.off ? IC('金幣', 1) : ''}${st.t.replace(' 金', '')}</i></button>`; }).join('');   // v17.67：像素圖示
  const d = document.createElement('div'); d.id = 'tmenu'; d.innerHTML = `<div class="tdim"></div><div class="tbox pb" role="dialog" aria-label="跟${esc(h.name)}互動"><div class="th">${IC('互動', 2)}<b>跟${esc(h.name)}互動</b><span class="rsp"></span><span class="num s">${IC('信任', 1)}<b>${Math.round(h.trust)}</b></span><span class="num s">${IC('心情', 1)}<b>${Math.round(h.mood)}</b></span></div>${away ? `<div class="tn">${pron(h)}出門在外，只能傳訊息</div>` : ''}<div class="tg3">${cells}</div></div>`;
  document.body.appendChild(d);
  d.querySelector('.tdim').onclick = closeTalkMenu;
  d.querySelectorAll('[data-ti]').forEach(b => b.onclick = () => { const i = +b.dataset.ti, st = talkState(H(), TALK[i]); if (st.off) { toast(st.cd ? `${TALK[i].n}還要等 ${talkLeft(H(), TALK[i].k)} 個月` : st.t); return; } closeTalkMenu(); talk(i); });
}
function closeTalkMenu(){ const m = $('tmenu'); if (m) m.remove(); }
let talkFx = null, talkMore = false;
function talk(i){
  const h = H(), T0 = TALK[i];
  if (talkLeft(h, T0.k) > 0) { toast(`${T0.n}還要等 ${talkLeft(h, T0.k)} 個月`); return; }
  if (T0.cost && S.gold < T0.cost) { toast('錢不夠'); return; }
  if (['gone', 'private', 'dying', 'visit'].includes(h.act) || (h.act === 'mission' && (heroHidden(h) || !mKind(h.mission)))) { toast(`${pron(h)}現在不在`); return; }
  if (h.act === 'mission' && !mHome(h) && !MSG_TALK.includes(T0.k)) { toast(`${pron(h)}出門在外，只能傳訊息`); return; }   // v17.7
  h.talked[T0.k] = S.day; if (h.st && ['praise', 'cheer', 'drink'].includes(T0.k)) h.st.cared++;
  addMsg('me', { praise:'做得很好！', warn:'出門小心點，別逞強', cheer:'別擔心，你可以的', scold:'你最近太散漫了！', drink:'走，今晚我請你喝一杯', meal:'一起去吃頓飯吧', heart:'最近還好嗎？想聊聊嗎？', train:'走，我陪你練一下', gift:'這個送你' }[T0.k]);
  const mul = talkMul(h, T0.k), b = { mood:h.mood, trust:h.trust, stress:h.stress, lv:h.lv, exp:h.exp };
  T0.f();
  // 同一種互動用太多次，效果會變差（只打折好處）
  [['mood', 1], ['trust', 1], ['stress', -1]].forEach(([k, good]) => { const d = h[k] - b[k]; if (d * good > 0 && mul < 1) h[k] = clamp(b[k] + d * mul, 0, 100); });
  h.talkLog = h.talkLog || {}; (h.talkLog[T0.k] = (h.talkLog[T0.k] || []).filter(d => S.day - d < 12)).push(S.day);
  const it = [], dm = Math.round(h.mood - b.mood), dt = Math.round(h.trust - b.trust), ds = Math.round(h.stress - b.stress);
  if (dm) it.push({ t:`心情 ${dm > 0 ? '+' : ''}${dm}`, c:dm > 0 ? '#8fe0b0' : '#ff9a9a' });
  if (dt) it.push({ t:`信任 ${dt > 0 ? '+' : ''}${dt}`, c:dt > 0 ? '#8fd0ff' : '#ff9a9a' });
  if (ds) it.push({ t:`壓力 ${ds > 0 ? '+' : ''}${ds}`, c:ds < 0 ? '#8fe0b0' : '#ff9a9a' });
  if (h.lv > b.lv || h.exp > b.exp + 1) it.push({ t:h.lv > b.lv ? '升級！' : '經驗 +', c:'#c9b6ff' });
  const pos = dm + dt - ds > 0;
  talkFx = { t:performance.now(), items:it, em:pos ? { t:'♥', c:'#ff8ab4' } : it.length ? { t:'!', c:'#ff7b7b' } : { t:'…', c:'#c9cfdb' } };
  toast(it.length ? it.map(x => x.t).join('　') + (mul < .75 ? '（最近太常用，效果變差）' : '') : `${h.name}沒什麼反應`);
  renderAll();
}

// ================= 臨終五大遺憾 =================
function regrets(h){
  const s = h.st || {}, d = Math.max(1, s.days || 1);
  const own = (s.self || 0) / Math.max(1, (s.self || 0) + (s.forced || 0));
  const work = (s.work || 0) / d;
  const heard = (s.heard || 0) / Math.max(1, (s.heard || 0) + (s.ignored || 0));
  const cared = (s.cared || 0) / Math.max(1, d / 12);
  const fr = friendsN() + (h.partner ? 1 : 0);
  const mood = (s.moodSum || 0) / d;
  const g = (v, a, b) => v >= a ? 0 : v >= b ? 1 : 2;
  const ownS = own + (h.supported ? .1 : 0) - (h.parentsYield || 0) * .05;
  return [
    { n:'沒有勇氣過忠於自己的人生', lv:g(ownS, .7, .5), why:`照自己的意思過的日子，大約占 ${Math.round(own * 100)}%${h.parentsYield ? `；${h.parentsYield} 次順從了爸媽` : ''}` },
    { n:'工作太拼命', lv:work > .8 ? 2 : work > .65 ? 1 : 0, why:`一生中有 ${Math.round(work * 100)}% 的日子在工作` },
    { n:'沒有勇氣表達自己的感受', lv:g(heard * .7 + Math.min(1, cared / 6) * .3, .7, .45), why:`${pron(h)}說出口的話，你回應了 ${Math.round(heard * 100)}%` },
    { n:'沒有和朋友保持聯絡', lv:fr >= 3 ? 0 : fr >= 1 ? 1 : 2, why:fr ? `走到最後，身邊還有 ${fr} 個重要的人` : '走到最後，身邊沒有知心的人' },
    { n:'沒有讓自己更快樂', lv:g(mood, 62, 45), why:mood >= 62 ? '大部分的日子都過得開心' : mood >= 45 ? '開心和難過的日子差不多' : '大部分的日子都悶悶不樂' },
  ];
}
const happyOf = rg => 100 - rg.reduce((a, r) => a + r.lv, 0) * 10;

// ================= 結局與下一代 =================
function openEnd(){
  const h = H();
  const title = { dead:'戰死', retired:'安穩退休', left:'離開' }[h.act] || '結束';
  const tag = h.bossKill ? '傳奇勇者' : title;
  const rg = regrets(h), happy = happyOf(rg);
  if (!h.walled) { addFame(h.lv * 2 + (h.act === 'retired' ? 30 : 0)); h.walled = 1; S.wall.push({ happy, rel:h.rel || '', name:h.name, cls:jobName(h), age:Math.floor(h.age), lv:h.lv, end:tag, why:h.endWhy, gen:h.gen, kills:h.kills }); }
  const cands = S.cands || makeCands();
  S.cands = cands;
  endStep = 0; endView(h, tag, rg, happy, cands); $('end').classList.add('on'); $('end').scrollTop = 0;
}
// v17.81 結局新版（design-wip design/ui/草圖_結局.png）：①他的一生 ②選下一位勇者
let endStep = 0;
function endView(h, tag, rg, happy, cands){
  const col = h.act === 'dead' ? 'r' : h.act === 'retired' ? 'g' : 'o', hc = happy >= 70 ? 'cg' : happy >= 40 ? 'co' : 'cr';
  const hexW = Object.keys(HEX).map(k => hexWord(k, h.hex[k])).filter(w => !w.startsWith('介於')).map(w => w.replace(/^比較/, '')).join('・') || '很平均';
  const goal = (GOALS[h.goal] ? GOALS[h.goal].n : '') + (h.said !== h.goal && GOALS[h.said] ? `（對你說的是${GOALS[h.said].n}）` : '') + (h.sentHome ? `，寄了 ${fmt(h.sentHome)} 金回老家` : '');
  if (endStep === 0) {
    $('end').innerHTML = `<div class="eh">${IC('歷代', 2)}<b>第 ${h.gen} 代・生平</b></div>
      <canvas id="endSc" class="esc" width="96" height="48"></canvas>
      <div class="ebd">
        <div class="pb eme">${pimg(h)}<div><div class="enm"><b class="f22">${esc(h.name)}</b><span class="pb ns etag ${col}">${tag}</span></div><span class="num s mu">${IC('戰力', 2)}<b>${jobName(h)}・Lv${h.lv}・${Math.floor(h.age)} 歲</b></span></div></div>
        <div class="pb ns ewhy f16">${esc(h.endWhy || '')}</div>
        <div class="e3">${[['危險', fmt(h.kills), '打倒的魔物'], ['人際', friendsN(), '交到的朋友'], ['心情', happy, '幸福分數']].map(([ic, v, n], i) => `<span class="pb num"${TIPA(ic, n, '')}>${IC(ic, 2)}<b class="${i === 2 ? hc : ''}">${v}</b></span>`).join('')}</div>
        <div class="pb erows">${[['個性', hexW], ['心願', '最在乎：' + h.des.map(k => DESIRES[k].n).join('・')], ['生平', '人生目標：' + goal]].map(([ic, t]) => `<div>${IC(ic, 2)}<span class="f14">${esc(t)}</span></div>`).join('')}</div>
        <div class="esec"><span>臨終的遺憾</span><span class="num s"${TIPA('心情', '幸福分數', '看他臨終時有幾個遺憾')}>${IC('心情', 2)}<b class="${hc}">幸福 ${happy}</b></span></div>
        <div class="pb erg">${rg.map(r => `<div><span class="erk">${r.lv === 0 ? IC('打勾', 2) : r.lv === 2 ? IC('打叉', 2) : '<b class="co">△</b>'}</span><span><b class="f16">${esc(r.n)}</b><small class="mu">${esc(r.why)}</small></span></div>`).join('')}</div>
        <div class="f14 mu">你從${pron(h)}身上賺到的錢，和${pron(h)}過得幸不幸福，是兩回事。</div>
        <div class="esec"><span>人生年表</span></div>
        <div class="pb etl">${h.log.slice(-14).map(e => `<div><span class="mu">${Math.floor(e.age)} 歲</span><span>${esc(e.t)}</span></div>`).join('') || '<div class="mu">（沒有特別的事）</div>'}</div>
        <button class="pb au ego" id="endNext">${IC('歷代', 2)}<b>選下一位勇者</b></button>
      </div>`;
    endScene($('endSc'), h);
    $('endNext').onclick = () => { endStep = 1; endView(h, tag, rg, happy, cands); $('end').scrollTop = 0; };
  } else {
    $('end').innerHTML = `<div class="eh">${IC('歷代', 2)}<b>第 ${h.gen + 1} 代</b></div>
      <div class="ebd">
        ${S.rep < 30 ? `<div class="f14 cr">口碑太差，只有 ${S.rep < 15 ? 1 : 2} 個人願意來</div>` : ''}
        ${cands.map((c, i) => { const t0 = (c.tag || '').replace(/（.*）/g, ''), sub = ((c.tag || '').match(/（(.*?)）/g) || []).map(x => x.slice(1, -1)).join('・');
          return `<div class="pb ecand"><span class="eav">${pimg(c)}</span><div class="ecm">
            <div class="enm"><b class="f22">${esc(c.name)}</b><span class="pb ns etag p">${esc(t0)}</span></div>
            ${sub ? `<div class="f14 cr">${esc(sub)}</div>` : ''}
            <div class="etr"><span class="num s">${IC('戰力', 2)}<b>${CLS[c.cls].n}</b></span>${[c.trait, c.trait2].filter(Boolean).map(t => `<span class="num s"${TIPA('個性', TRAITS[t].n, TRAITS[t].d)}>${IC('個性', 2)}<b>${TRAITS[t].n}</b></span>`).join('')}</div>
            ${c.heir ? `<div class="etr"><span class="f14 mu">繼承</span>${c.wpn ? `<span class="pb ns num s"${TIPA('戰力', '遺物', '上一代留下來的武器')}>${IC('戰力', 2)}<b class="f14">${WPN.n[c.wpn] + (WNAME[c.cls] || '武器')}</b></span>` : ''}${c.charms && c.charms.length ? `<span class="pb ns num s"${TIPA('寶物', TREASURES[c.charms[0]].n, '上一代留下來的傳家寶')}>${IC('寶物', 2)}<b class="f14">${TREASURES[c.charms[0]].n}</b></span>` : ''}</div>` : ''}
            <div class="etr"><span class="num s mu">${IC('心願', 2)}<b class="f14">自稱${GOALS[c.said].n}</b></span>${c.perks.map(p => `<span class="pb ns etag ${PERKS[p].bad ? 'r' : 'y'}"${TIPA('經驗', PERKS[p].n, PERKS[p].d || '')}>${PERKS[p].n}</span>`).join('')}</div>
          </div><button class="pb au epick" data-c="${i}">就是他</button></div>`; }).join('')}
      </div>`;
    $('end').querySelectorAll('[data-c]').forEach(b => b.onclick = () => nextGen(+b.dataset.c));
  }
}
// 結局場景：草原背景＋戰死＝墓碑和花／退休＝開心地站著／離開＝一個人站在路邊
function endScene(c, h){ if (!c) return; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#96bed7'; g.fillRect(0, 0, 96, 48);
  try { const st = zoneStrip(0); g.drawImage(st, Math.min(st.width - 96, 150), 78, 96, 48, 0, 0, 96, 48); } catch (e) { g.fillStyle = '#62a05c'; g.fillRect(0, 30, 96, 18); }
  if (h.act === 'dead') { const G = ['..KKKKK..', '.KKKKKKK.', 'KKKKOKKKk', 'KKOOOOOKk', 'KKKKOKKKk', 'KKKKOKKKk', 'KKKKKKKKk', 'KKKKKKKKk', 'kkkkkkkkk'], C = { K:'#c0cbdc', k:'#8b9bb4', O:'#3f2631' }, x0 = 39, y0 = 20, P = (x, y, w, hh, cl) => { g.fillStyle = cl; g.fillRect(x0 + x * 2, y0 + y * 2, w * 2, hh * 2); };
    P(-1, 1, 11, 9, '#3f2631'); P(1, -1, 7, 2, '#3f2631'); P(0, 0, 9, 1, '#3f2631');
    G.forEach((r, y) => [...r].forEach((ch, x) => { if (C[ch]) P(x, y, 1, 1, C[ch]); }));
    [[30, 36], [60, 36]].forEach(([x, y]) => { g.fillStyle = '#43c878'; g.fillRect(x + 1, y + 2, 1, 4); g.fillStyle = '#e84537'; g.fillRect(x, y, 3, 3); g.fillStyle = '#f7c94a'; g.fillRect(x + 1, y + 1, 1, 1); }); }
  else { try { drawSprite(g, h, h.act === 'left' ? 72 : 48, 40, false, 0, { moving:false, expr:h.act === 'retired' ? 'happy' : 'sad' }); } catch (e) {} } }
function makeCands(){
  const h = H(), out = [];
  const pupil = { trait:pick([h.trait, h.trait2]), cls:h.cls, perks:h.perks.filter(p => !PERKS[p].bad).slice(0, 1), tag:`${h.name}的徒弟`, master:h.name };
  if (h.act === 'dead' && chance(.5)) { pupil.perks = [...pupil.perks]; pupil.shadow = 1; pupil.tag += '（親眼看著師父倒下）'; }
  out.push(pupil);
  out.push({ tag:'公會介紹的新人' });
  const fan = npc('fan'), fanOk = fan && fan.alive && fan.age >= 16 && fan.aff >= 40;
  if (fanOk) out.push({ name:fan.name, sex:fan.sex, tag:`從小崇拜${h.name}的${fan.name}`, trust:80, fanId:fan.id });
  if (h.child) out.push({ name:h.child.name, sex:h.child.sex, trait:pick([h.trait, h.trait2]), perks:h.perks.filter(p => !PERKS[p].bad).slice(0, 1), tag:`${h.name}的${h.child.sex === 'm' ? '兒子' : '女兒'}`, trust:75, kid:1 });
  else out.push({ tag:'從別村來的流浪者', trust:35 });
  if (S.fame >= 800) out.push({ tag:'慕名而來的新人', trust:60 });
  const keep = (S.rep < 15 ? 1 : S.rep < 30 ? 2 : 3) + (fanOk ? 1 : 0) + (S.fame >= 800 ? 1 : 0);
  const arC = AR().filter(a => !a.away && !a.bed).map(a => { const m = relGet(uidOf(h), uidOf(a)); a.tag = '旗下藝人' + (m.t === 'mentor' && m.jr === a.uid ? `（${h.name}的徒弟）` : ''); a.gen = h.gen + 1; return a; });
  return [...arC, ...fameRecruit(out.slice(0, keep).map(o => { const heir = !!(o.master || o.kid), n = newHero({ ...o, wpn:heir ? h.wpn : 0, gen:h.gen + 1, charms:heir && h.charms.length ? [h.charms[0]] : [] });   /* v17.83：只有徒弟和孩子繼承遺物 */ if (heir && (h.wpn || h.charms.length)) n.heir = 1; if (o.fanId) n.fanId = o.fanId; n.tag = o.tag + (S.rep < 35 ? '（聽過你的傳聞）' : ''); if (o.shadow) { n.stress = 35; n.trust = 70; } n.trust = clamp(n.trust + (S.rep - 60) / 2, 5, 95); return n; }))];
}
function nextGen(i){
  const n = S.cands[i], old = H(); n.rel = (n.tag || '').replace(/（.*）/g, ''); delete n.tag;
  S.hero = n; S.gen = n.gen; S.cands = null; S.q = null; S.qq = []; S.queue = [];   /* v17.82：換新勇者時，排程上的任務全部取消 */ S.plan = 0; S.cut = 30; S.paused = false;
  if (n.joined != null) {   // v16：從旗下藝人接班，保留年紀；當藝人的時間算一半的相處
    S.artists = AR().filter(x => x !== n); const born = S.day - Math.floor((S.day - n.joined) / 2); n.age0 = n.age - (S.day - born) / 12; n.born = born; n.act = 'idle'; n.alpha = 1; n.talked = {}; n.mission = null; n.task = null;
  } else { n.born = S.day; n.age = START_AGE; }
  S.npcs.forEach(x => { if (x.role === 'rival' || x.role === 'elder') return; x.aff = x.id === old.partner && n.kid ? 70 : ['guild', 'mayor', 'reporter', 'priest', 'merc'].includes(x.role) ? Math.round(x.aff * .5 + ri(0, 10)) : x.role === 'fan' ? Math.round(x.aff * .6) : ri(5, 25); });
  if (n.fanId) { const f = npc(n.fanId); if (f) { f.alive = false; f.gone = 'hero'; } delete n.fanId; }
  const opa = old.partner && npc(old.partner); if (opa && opa.alive) opa.nodate = 1;
  if (old.act === 'retired') { S.coachUntil = hasU('coach') ? 1e9 : S.day + 60;
    const e = mkNpc({ id:'elder' + old.gen, title:'退休的前代勇者', name:old.name, sex:old.sex, role:'elder', age:old.age, pw:clamp(.5 - (old.age - 40) * .012, .12, .5) }, n.kid ? 85 : n.master ? 70 : 45);
    if (old.hex) e.hex = { ...old.hex };
    if (opa && opa.alive) { e.mate = opa.id; opa.mate = e.id; e.wed = opa.wed = old.married || 1; e.dating = opa.dating = S.day; if (old.child) e.kids = opa.kids = 1; }
    S.npcs.push(e); news('good', `${old.name}退休了，留在村子裡生活`); }
  $('end').classList.remove('on');
  sys(`── 第 ${n.gen} 代 ──`);
  sys(`你和${n.name}簽下了經紀約`);
  if (S.rep < 35) say(pickS(['聽說你很會壓榨人……希望只是謠言', '我先說好，我不接送死的工作']));
  if (n.master) say(`師父常常提起你。從今天起，請多指教。`); else say(pickS(['你就是我的經紀人？請多指教！', '聽說你很會帶人，別讓我失望喔']));
  if (old.act === 'retired') ev('good', '教練', `${old.name}留在村裡當教練，前 5 年經驗 +20%，也可以找${pron(old)}一起出任務`);
  refreshOffers(); save(); renderAll();
}

