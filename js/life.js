// ================= v17.102：參與感＋新玩法（claude/勇者經紀人_參與感與互動決議.md、claude/勇者經紀人_新玩法提案.md） =================
// 載入順序：data → sim → art → map → ui → life → main。這裡只放新系統，舊檔案只加掛勾（typeof 檢查）。
// 數字都是先抓的，開發者玩過再調。

const lifeOk = h => h && !['dead', 'retired', 'left', 'dying'].includes(h.act);
const moNow = () => S.day % 12;   // 0＝1 月

// ---------- 個人名聲（每個勇者各自累積） ----------
let PF_WHO = null;   // 藝人完成事務所任務時，名聲記在他身上
function pfAdd(who, v){ if (!who || !v) return; who.pf = Math.max(0, Math.round(((who.pf || 0) + v) * 10) / 10); }

// ---------- 看出個性（陪他、聊心事、回老家） ----------
function revealOne(h, why){
  const km = S.day - h.born, early = h.hexEarly || (h.hexEarly = []);
  const k = Object.keys(HEX).filter(x => km < HEX_REVEAL[x] && !early.includes(x) && !(x === 'H' && h.revealed)).sort((a, b) => HEX_REVEAL[a] - HEX_REVEAL[b])[0];
  if (k) { early.push(k); ev('good', '心裡話', `${why}，你發現${h.name}其實是個「${hexWord(k, h.hex[k]).replace(/^比較/, '')}」的人`); return true; }
  const d = h.desEarly || 0; if (d < 3 && km < DES_REVEAL[d]) { h.desEarly = d + 1; ev('good', '心裡話', `${why}，你知道了${h.name}最在乎的事：「${DESIRES[h.des[d]].n}」`); return true; }
  return false;
}
function revealGoal(h, why){
  if (h.revealed) return revealOne(h, why);
  h.revealed = true; remember('reveal'); ev('good', '真心話', `${why}，${h.name}說出了真正的人生目標：「${GOALS[h.goal].n}」`); logLife(`跟你說了真正想過的人生：${GOALS[h.goal].n}`); return true;
}

// =====================================================================
// 3-1 每天一件小事（約 6 成的日子問一次：早上 7 點或收工回村）
// =====================================================================
const DQ = [
  // ---- 早上 ----
  { id:'zone', am:1, c:h => h.act === 'hunt' && h.zone >= 0 && h.zone + 1 <= topZ() && zoneOpen(h.zone + 1) && ratio(h, zD(h.zone + 1)) >= .85 && (hx(h, 'O') > .5 || h.trait === 'brave' || dw(h, 'curiosity')),
    t:h => `今天想去${ZONES[h.zone + 1].n}試試，可以嗎？`, o:['去吧', '照原本的', '你自己決定'], def:2,
    r:[h => { startHunt(h.zone + 1); adj('trust', 1); adj('mood', 3); }, h => { adj('mood', dw(h, 'independence') ? -4 : -1); if (dw(h, 'independence')) adj('trust', -1); }, h => { if (chance(.5)) startHunt(h.zone + 1); adj('trust', 1); }] },
  { id:'tired', am:1, c:h => h.act === 'hunt' && h.sta < 45, t:() => '今天好累……可以休息一天嗎？', o:['休息吧', '撐一下', '只打半天'], def:h => h.trait === 'lazy' ? 0 : 2,
    r:[h => { goHome(); setAct('rest'); adj('trust', 2); adj('mood', 3); }, h => { adj('stress', 4); adj('trust', -2); if (h.trait === 'lazy') adj('mood', -4); }, h => { h.halfDay = S.day; adj('trust', 1); }] },
  { id:'sharpen', am:1, c:h => h.wpn >= 1 && (h.sharp || 0) <= S.day && chance(.5), t:() => '劍有點鈍了，可以拿去磨嗎？（80 金）', o:['去磨吧', '再撐一下'], def:1,
    r:[h => { if (S.gold < 80) { say('……事務所好像沒錢了'); return; } S.gold -= 80; finAdd('shop', -80); h.sharp = S.day + 3; adj('trust', 1); say('磨好了，砍起來順多了'); }, h => { adj('trust', -1); }] },
  { id:'meal', am:1, c:() => true, t:() => '今天早餐想吃好一點，可以嗎？（20 金）', o:['吃吧，我請', '你自己付', '吃簡單點'], def:1,
    r:[h => { if (S.gold >= 20) { S.gold -= 20; adj('mood', 5); adj('trust', 1); } }, h => { const c = Math.min(h.wallet || 0, 20); h.wallet -= c; adj('mood', 3); }, h => { adj('mood', dw(h, 'eating') ? -4 : -1); }] },
  { id:'trick', am:1, c:h => h.act === 'hunt' && h.lv >= 5, t:() => '我想試一招新的打法，可是怕會受傷……', o:['試試看', '小心為上', '你很強，放手打'], def:0,
    r:[h => { gainExp(expNeed(h.lv) * .05); if (chance(.2)) injure('light', '試新招式時扭到'); }, h => { h.carefulNext = 1; adj('mood', -1); }, h => { adj('mood', 3); adj('stress', -2); if (chance(.1)) injure('light', '打得太猛受了傷'); }] },
  { id:'help', am:1, c:h => !!dqFriend(h) && ['hunt', 'rest', 'idle'].includes(h.act), t:h => `${dqFriend(h).name}說家裡缺人手，我可以去幫忙一個早上嗎？`, o:['去吧', '工作要緊'], def:h => hx(h, 'A') > .55 ? 0 : 1,
    r:[h => { const n = dqFriend(h); if (n) affAdd(n.id, 4); adj('mood', 3); h.halfDay = S.day; h.lateStart = S.day; }, h => { if (hx(h, 'A') > .6) { adj('mood', -3); adj('trust', -1); } }] },
  { id:'home', am:1, c:h => h.age < 26 && chance(.4), t:() => '昨晚夢到老家了……', o:['寫封信回去吧（10 金）', '多賺點錢寄回去', '振作點'], def:1,
    r:[h => { if (S.gold >= 10) S.gold -= 10; adj('mood', 6); adj('stress', -4); }, h => { adj('mood', 1); adj('stress', 2); }, h => { adj('mood', hx(h, 'A') > .6 ? -4 : -2); }] },
  { id:'early', am:1, c:h => hx(h, 'C') > .55 && h.act === 'hunt', t:() => '我想先早起練一下功再出門，可以嗎？', o:['好', '準時出門'], def:0,
    r:[h => { gainExp(expNeed(h.lv) * .05); adj('sta', -6); adj('mood', 2); }, h => { adj('mood', -2); }] },
  { id:'rival', am:1, c:h => h.lv >= 8 && S.rivals && S.rivals.length, t:() => `聽說${S.rivals[0].n}的勇者最近很紅……我是不是輸給他了？`, o:['你比他強', '別管別人', '那就更努力'], def:1,
    r:[h => { adj('mood', 4); adj('stress', -2); }, h => { adj('stress', -3); }, h => { adj('stress', 3); gainExp(expNeed(h.lv) * .03); adj('mood', hx(h, 'C') > .55 ? 2 : -3); }] },
  // ---- 收工後 ----
  { id:'date', pm:1, c:h => { const n = h.partner && npc(h.partner); return n && n.alive; }, t:h => `晚上可以約${npc(h.partner).name}嗎？`, o:['去吧', '今天早點睡', '我陪你們去吃飯'], def:0,
    r:[h => { const n = npc(h.partner); h.lzWant = { day:S.day, k:'date', id:n.id, nm:n.name }; adj('trust', 1); }, h => { h.lzWant = { day:S.day, k:'sleep' }; adj('mood', dw(h, 'romance') ? -6 : -2); }, h => { const n = npc(h.partner); h.lzWant = { day:S.day, k:'date', id:n.id, nm:n.name, with:1 }; }] },
  { id:'pub', pm:1, c:h => friendsN() >= 1 && (h.wallet || 0) >= 15, t:() => '朋友約我去酒館，可以晚點回家嗎？', o:['去吧', '別喝太多', '早點休息'], def:0,
    r:[h => { const n = dqFriend(h); h.lzWant = { day:S.day, k:'tchat', id:n ? n.id : null, nm:n ? n.name : '' }; adj('mood', 2); }, h => { const n = dqFriend(h); h.lzWant = { day:S.day, k:'tchat', id:n ? n.id : null, nm:n ? n.name : '' }; h.carefulNext = 1; }, h => { h.lzWant = { day:S.day, k:'sleep' }; adj('mood', hx(h, 'X') > .6 ? -4 : -1); }] },
  { id:'alone', pm:1, c:h => h.stress > 55, t:() => '今天好累，想一個人靜一靜', o:['好好休息', '去散散步吧', '陪你聊聊'], def:0,
    r:[h => { h.lzWant = { day:S.day, k:'read' }; adj('trust', 1); }, h => { h.lzWant = { day:S.day, k:'walk' }; }, h => { adj('stress', -8); adj('trust', 2); adj('mood', hx(h, 'X') < .4 ? -1 : 2); }] },
  { id:'shop', pm:1, c:h => (h.wallet || 0) >= 80, t:() => '我想去逛街買點東西，可以嗎？', o:['買吧', '存起來比較好', '我送你一樣（50 金）'], def:0,
    r:[h => { h.lzWant = { day:S.day, k:'shop' }; adj('mood', 2); }, h => { adj('mood', h.goal === 'etf' ? 1 : -2); }, h => { if (S.gold >= 50) { S.gold -= 50; adj('mood', 6); adj('trust', 2); } }] },
  { id:'fish', pm:1, c:h => hx(h, 'X') < .55, t:() => '今天想去釣魚放鬆一下', o:['去吧', '練一下劍比較好'], def:0,
    r:[h => { h.lzWant = { day:S.day, k:'fish' }; adj('mood', 2); }, h => { h.lzWant = { day:S.day, k:'train' }; adj('mood', -2); }] },
  { id:'lonely', pm:1, c:h => !h.partner && h.age >= 22 && chance(.4), t:() => '大家好像都有對象了……我是不是很差勁？', o:['你很好，只是緣分還沒到', '多出去認識人吧', '工作比較重要'], def:1,
    r:[h => { adj('mood', 4); adj('trust', 2); }, h => { const n = dqFriend(h); h.lzWant = n ? { day:S.day, k:'chat', id:n.id, nm:n.name } : { day:S.day, k:'walk' }; }, h => { adj('mood', dw(h, 'family') || dw(h, 'romance') ? -6 : -3); }] },
  { id:'proud', pm:1, c:h => S.day - (h.goodDay ?? -99) <= 0, t:() => '今天我表現得不錯吧？', o:['很棒！', '還可以更好', '嗯'], def:2,
    r:[h => { adj('mood', 6 * (1 + dw(h, 'acceptance'))); adj('trust', 2); }, h => { adj('stress', 3); gainExp(expNeed(h.lv) * .02); adj('mood', hx(h, 'C') > .6 ? 1 : -3); }, h => { adj('mood', -3); }] },
  { id:'broke', pm:1, c:h => (h.wallet || 0) < 20, t:() => '這個月錢有點不夠用……', o:['給你 50 金', '省一點吧', '你自己想辦法'], def:1,
    r:[h => { if (S.gold >= 50) { S.gold -= 50; h.wallet += 50; adj('trust', 3); adj('mood', 3); } }, h => { adj('mood', -2); }, h => { adj('trust', -3); adj('mood', -4); }] },
  { id:'ache', pm:1, c:h => S.day - (h.lastHurt ?? -99) <= 1, t:() => '今天被打到的地方還在痛……', o:['去看醫生（80 金）', '睡一覺就好', '下次小心點'], def:1,
    r:[h => { if (S.gold >= 80) { S.gold -= 80; h.health = clamp(h.health + 10, 0, 100); adj('trust', 2); } }, h => { h.lzWant = { day:S.day, k:'sleep' }; }, h => { adj('mood', -2); h.carefulNext = 1; }] },
  { id:'book', pm:1, c:h => hx(h, 'O') > .55, t:() => '聽說書店來了新書，晚上想去看', o:['去吧', '早點睡'], def:0,
    r:[h => { h.lzWant = { day:S.day, k:'read' }; gainExp(expNeed(h.lv) * .02); }, h => { h.lzWant = { day:S.day, k:'sleep' }; }] },
  { id:'doubt', pm:1, heart:1, c:h => (h.burn || 0) > 60 || h.stress > 70, t:() => '有時候會想，我是不是不適合當勇者……', o:['你做得很好', '下個月休息吧', '那就別做了啊'], def:1,
    r:[h => { adj('mood', 4); adj('trust', 3); adj('stress', -5); }, h => { h.restAsk = S.day + 1; adj('stress', -3); adj('trust', 2); }, h => { adj('trust', -6); adj('mood', -8); if (chance(.15)) h.wantRetire = 1; }] },
  { id:'thanks', pm:1, c:h => h.trust >= 75 && chance(.4), t:() => '謝謝你一直照顧我', o:['應該的', '你也辛苦了', '那就多賺點錢吧'], def:0,
    r:[h => { adj('trust', 1); }, h => { adj('mood', 3); adj('trust', 2); }, h => { adj('mood', -3); adj('trust', -1); }] },
];
function dqFriend(h){ const fs = S.npcs.filter(n => n.alive && !n.dark && !['rival', 'rival2'].includes(n.role) && n.aff >= 50 && n.id !== h.partner && !((n.sick || 0) > S.day)); return fs.length ? fs[S.day % fs.length] : null; }
function dqAsk(h, slot){
  if (S.q || offline) return false;
  const pool = DQ.filter(q => q[slot] && (() => { try { return q.c(h); } catch (e) { return false; } })());
  if (!pool.length) return false;
  const q = pool[Math.floor(Math.random() * pool.length)];
  ask('daily', q.t(h), q.o, { id:q.id }, 1); return true;
}
QH.daily = function(i, d){
  const h = H(), q = DQ.find(x => x.id === d.id); if (!q) return;
  const yes = i >= 0, def = typeof q.def === 'function' ? q.def(h) : q.def, k = yes ? i : def;
  if (yes) { if (k === def) adj('trust', 1); else h.dqNo = (h.dqNo || 0) + 1; }   // 答應他想要的（他自己會選的那個）信任 +1；常拒絕他就比較少開口
  try { q.r[k] && q.r[k](h); } catch (e) { console.error(e); }
};
// 一天決定一次：問不問、早上還是收工後
function dqPlan(h){
  const p = .6 * (1 - Math.min(.5, (h.dqNo || 0) * .04));
  S.dq = { day:S.day, when:chance(p) ? (chance(.5) ? 'am' : 'pm') : null, done:0 };
}

// =====================================================================
// 3-2 點勇者給指示（次數看個性，太囉嗦他會不爽）
// =====================================================================
function cmdTol(h){ if (dw(h, 'independence') || hx(h, 'A') < .35 || ['hot', 'proud'].includes(h.trait)) return 1; if (hx(h, 'A') > .65) return 5; return 3; }
function cmdOptions(h){
  if (h.act === 'mission') return [['cheer', '加油', '心情']];
  if (h.act === 'hunt') return [['retreat', '撤退回村', '村子'], ['zone', '換一區', '往上'], ['breath', '休息一下', '休息'], ['cheer', '加油', '心情']];
  if (lzFree(h)) return [['l:tavern', '去酒館', '酒窖'], ['l:friend', '去找朋友', '人際'], ['l:sleep', '回家睡', '休息'], ['l:train', '去練劍', '訓練室']];
  if (['idle', 'rest', 'home', 'train'].includes(h.act)) return [['d:rest', '回家休息', '休息'], ['d:train', '去練劍', '訓練室'], ['cheer', '加油', '心情']];
  return [];
}
function openCmd(){
  const h = H(), ops = cmdOptions(h); if (!ops.length) { toast(`${h.name}現在沒辦法`); return; }
  const body = `${pSay(h, pickS(['嗯？什麼事？', '要我做什麼嗎？', '怎麼了？']))}<div class="cmdg">${ops.map(([k, n, ic]) => `<button class="pb ns cmdb" data-cmd="${k}">${IC(ic, 2)}<b class="f16">${n}</b></button>`).join('')}</div>`;
  openPop(body, `叫${h.name}…`, '互動', 1);
  $('mBox').querySelectorAll('[data-cmd]').forEach(b => b.onclick = () => { closeMission(); doCmd(b.dataset.cmd); });
}
function doCmd(k){
  const h = H(); if (h.cmdDay !== S.day) { h.cmdDay = S.day; h.cmdN = 0; }
  h.cmdN++; const over = h.cmdN - cmdTol(h);
  if (over > 0) { adj('mood', -3 * over); adj('trust', -2 * over); say(pickS(['你很囉嗦耶……', '讓我自己決定好嗎', '又來了？我知道啦', '……不要一直叫我'])); renderAll(); return; }
  if (k === 'cheer') { if (h.cheerDay === S.day) { say('知道啦，我會加油的'); return; } h.cheerDay = S.day; adj('mood', 2); say(pickS(['好！', '交給我吧', '嘿嘿，有你在真好'])); renderAll(); return; }
  const p = h.trust >= 70 ? 1 : h.trust >= 40 ? .7 : .35, pp = p - (dw(h, 'independence') ? .15 : 0);
  if (!chance(pp)) { adj('mood', -1); say(pickS(['我想自己決定', '……不要', '現在這樣比較好', '你不用管我啦'])); renderAll(); return; }
  const lw = (kk, x = {}) => { h.lzWant = { day:S.day, k:kk, ...x }; if (S.lz && S.lz.day === S.day && !S.lz.done) { Object.assign(S.lz, { k:kk, id:x.id || null, nm:x.nm || '' }); if (kk === 'sleep') S.lz.done = 1; } };
  switch (k) {
    case 'retreat': goHome(); setAct('rest'); say('好，我先回去'); break;
    case 'zone': { const z = bestSafeZone(), nz = z !== h.zone ? z : Math.max(0, h.zone - 1); startHunt(nz); say(`那我去${ZONES[nz].n}`); break; }
    case 'breath': adj('sta', 8); h.target = null; say('呼……喘口氣'); break;
    case 'l:tavern': lw('drink'); say('好，去喝一杯'); break;
    case 'l:friend': { const n = dqFriend(h); if (!n) { say('……我好像沒有可以找的朋友'); break; } lw('chat', { id:n.id, nm:n.name }); say(`那我去找${n.name}`); break; }
    case 'l:sleep': lw('sleep'); say('嗯，早點睡'); break;
    case 'l:train': lw('train'); say('去鬥技場練一下'); break;
    case 'd:rest': setAct('rest'); say('好，回家休息'); break;
    case 'd:train': if (h.sta < 30) { say('我現在練不動……'); break; } setAct('train'); say('去練劍！'); break;
  }
  renderAll();
}
function heroTapHit(x, y){
  const h = H(); if (!h || heroHidden(h)) return false;
  let p = null;
  if (heroMap(h) === 'vil') { if (V.x == null || V.inside) return false; p = [V.x, V_WALK - 9]; }
  else p = [h.x, h.y - 8];
  return Math.hypot(x - p[0], y - p[1]) < 14;
}

// =====================================================================
// 3-3 陪他（收工後他要去休閒時問你）
// =====================================================================
function lzJoinAsk(h){
  const z = S.lz; if (!z || offline || S.q || z.k === 'boss' || z.k === 'sleep' || z.with || z.asked) return;
  z.asked = 1; if (S.dq && S.dq.day === S.day && S.dq.done) { if (!chance(.35)) return; } else if (!chance(.7)) return;
  const t = LZ[z.k] ? LZ[z.k].txt(z) : '出去走走';
  ask('lzJoin', `（${h.name}要去${t.replace(/^在/, '')}）`, ['陪他去', '讓他自己去'], {}, 1);
}
QH.lzJoin = function(i){
  const h = H(), z = S.lz; if (!z || z.day !== S.day || i !== 0) return;
  z.with = 1; V.pan = null; h.withN = (h.withN || 0) + 1;
  say(pickS(['你也要來？好啊！', '嘿嘿，有你陪真好', '那走吧']));
};
function lzWithEnd(h, z, b0){
  // 效果比他自己去多 50%、信任 +2；陪第 5、10 次說心裡話
  [['mood', 1], ['stress', -1]].forEach(([k, g]) => { const d = h[k] - b0[k]; if (d * g > 0) h[k] = clamp(h[k] + d * .5, 0, 100); });
  adj('trust', 2); if (h.st) h.st.cared = (h.st.cared || 0) + 1;
  const line = { chat:'聊得好開心', date:'……謝謝你陪我們', drink:'今天喝得很開心', tchat:'好久沒這麼熱鬧了', walk:'晚上的風好舒服', fish:'釣魚果然要兩個人', shop:'買到好東西了！', train:'有你看著，練得特別認真', read:'這本書真好看' }[z.k];
  if (line) say(line);
  if (h.withN === 5 || h.withN === 10) revealOne(h, '陪他陪久了，他跟你說了心裡話');
}

// =====================================================================
// D 聊心事改成 2～3 回合的對話
// =====================================================================
const HEART_T = {
  stress:{ c:h => h.stress > 55, a:'最近壓力好大，晚上都睡不好……', o:['我聽你說', '那就休息幾天', '大家都很累啊'], ok:h => hx(h, 'X') >= .45 ? 0 : 1,
    b:'其實……我很怕哪天在外面回不來', o2:['我不會讓你去送死', '怕就對了，才會小心', '別想太多'], ok2:h => hx(h, 'A') > .5 ? 0 : 1 },
  low:{ c:h => h.mood < 40, a:'最近什麼都提不起勁……', o:['發生什麼事了？', '出去走走吧', '振作一點'], ok:h => hx(h, 'X') >= .5 ? 1 : 0,
    b:'我好像……一直在做別人要我做的事', o2:['你想做什麼，我們一起想', '工作就是這樣', '那你自己決定吧'], ok2:() => 0 },
  goal:{ c:h => !h.revealed, a:'你有沒有想過……我以後會變成什麼樣的人？', o:['你想變成什麼樣？', '變成最強的勇者', '先顧好現在吧'], ok:() => 0,
    b:'我其實……一直沒跟你說實話', o2:['沒關係，說吧', '我早就知道了', '那你騙了我什麼？'], ok2:h => hx(h, 'H') > .5 ? 0 : 1 },
  day:{ c:() => true, a:'今天在路上看到一隻好大的狗，嚇死我了', o:['哈哈，然後呢？', '你是勇者耶', '嗯'], ok:h => hx(h, 'X') > .35 ? 0 : 0,
    b:'……跟你講這些，好像很無聊吧', o2:['不會，我喜歡聽', '有點', '那就講工作的事'], ok2:() => 0 },
};
function heartStart(){
  const h = H(), k = ['stress', 'low', 'goal', 'day'].find(x => HEART_T[x].c(h)), T = HEART_T[k];
  ask('heart', T.a, T.o, { k, r:1 }, 1);
}
QH.heart = function(i, d){
  const h = H(), T = HEART_T[d.k]; if (!T) return;
  const okI = d.r === 1 ? T.ok(h) : T.ok2(h);
  if (i < 0) { say('……算了，沒事'); return; }
  if (i !== okI) { adj('mood', -2); say(pickS(['……算了，沒事', '嗯，你說得對', '……我先去忙了'])); if (d.r === 2) adj('trust', 1); return; }
  adj('trust', 2); adj('mood', 2); adj('stress', -4);
  if (d.r === 1) { ask('heart', T.b, T.o2, { k:d.k, r:2 }, 1); return; }
  adj('trust', 3); adj('stress', -6); say(pickS(['謝謝你聽我說', '說出來輕鬆多了', '……有你真好']));
  if (d.k === 'goal') revealGoal(h, '聊了很久之後'); else if (chance(.6)) revealOne(h, '聊著聊著');
};
function heartHook(){   // 換掉九格裡「聊心事」的一般情況（特殊情況：信任太低、要坦白壞事，照舊）
  const t = TALK.find(x => x.k === 'heart'); if (!t || t.f0) return;
  t.f0 = t.f;
  t.f = function(){ const h = H();
    if (h.trust < 30 || ((h.vice || 0) >= 2 && h.trust >= 70 && !h.reform && !h.jailed) || offline) return t.f0();
    adj('trust', 2); h.st.heard = (h.st.heard || 0) + 1; heartStart(); };
}

// =====================================================================
// 5 爭主角
// =====================================================================
function leadTick(a, h){
  if (offline || S.q || !lifeOk(h) || S.day < (a.leadCd || 0)) return;
  if (!(a.lv > h.lv + 5 || (a.pf || 0) > (h.pf || 0) + 5) || !chance(.15)) return;
  a.leadCd = S.day + 6;
  if (hx(a, 'X') > .6 || dw(a, 'status')) { ask('lead', `（${a.name}來找你：「我現在比${h.name}強了吧？讓我當主力！」）`, ['讓他當主力', '安撫他（300 金）', '拒絕'], { id:a.uid }, 2); return; }
  if (hx(a, 'A') < .35) { aAdj(a, 'stress', 3); adj('mood', -5); ev('warn', '搶任務', `${a.name}開始搶${h.name}的工作，兩個人處得很僵`); relAdd(uidOf(h), a.uid, -6); return; }
  a.sulk = S.day + 6; ev('warn', '悶悶不樂', `${a.name}最近悶悶不樂，好像覺得自己被埋沒了`);
}
QH.lead = function(i, d){
  const a = arById(d.id), h = H(); if (!a) return;
  if (i === 0) { const r = swapMain(a.uid); if (r && r.ok === false) { sys(`（現在還不能換：${r.why}）`); aAdj(a, 'trust', -4); } return; }
  if (i === 1 && S.gold >= 300) { S.gold -= 300; finAdd('other', -300); aAdj(a, 'trust', 5); aAdj(a, 'mood', 6); a.leadCd = S.day + 9; ev('', '安撫', `你好好安撫了${a.name}，送了一份大禮`); if (chance(.2)) { adj('trust', -5); ev('warn', '走漏', `${h.name}知道你差點把${pron(h)}換掉了`); } return; }
  aAdj(a, 'trust', -12); aAdj(a, 'mood', -8); ev('warn', '拒絕', `你拒絕了${a.name}當主力的要求`);
  if (a.trust < 30 && chance(.5)) { const r = pick(S.rivals); r.fame += 30; S.artists = AR().filter(x => x !== a); relDrop(a.uid); ev('bad', '跳槽', `${a.name}一氣之下跳槽到${r.n}`); }
};

// =====================================================================
// 6 組隊任務
// =====================================================================
let mTeam = [];
const teamOk = a => a && !a.away && !a.bed && !a.task && !((a.onTeam || -1) >= S.day);
function teamMul(o){
  const t = o && o.team; if (!t || !t.length) return 1; const h = H(), hp = Math.max(1, power(h));
  return 1 + t.map(arById).filter(Boolean).reduce((s, a) => s + power(a) * .6, 0) / hp;
}
function teamPicker(o){   // 只看主力自己（不算隊友）的危險度：2 顆骷髏以上才能組隊
  const as = AR().filter(teamOk); if (!as.length || !o.D || danger(ratio(H(), o.D)).i < 1) return '';
  mTeam = mTeam.filter(id => as.some(a => a.uid === id));
  return `<div class="msec f14 mu">帶旗下藝人一起去（最多 2 位，每人分走${pron(H())}那份的 20%）</div><div class="mpicks">${as.map(a => { const on = mTeam.includes(a.uid);
    return `<button class="pb mpick${on ? ' g' : ''}" data-tm="${a.uid}"><span class="mfc s">${pimg(a)}</span><span><b class="f16">${esc(a.name)}</b><b class="f16 cg">+${Math.round(power(a) * .6 / Math.max(1, power(H())) * 100)}%</b></span></button>`; }).join('')}</div>`;
}
function teamBind(o){ $('mBox').querySelectorAll('[data-tm]').forEach(b => b.onclick = () => { const id = b.dataset.tm; mTeam = mTeam.includes(id) ? mTeam.filter(x => x !== id) : mTeam.concat(id).slice(-2); openMission(o, true); }); }
function teamStart(it){ (it.team || []).forEach(id => { const a = arById(id); if (a) { a.onTeam = S.day + Math.max(1, it.days || 1) - 1; a.mlog = `跟${H().name}一起出任務「${it.n}」`; } }); }
function teamAfter(o, h, gotWallet, ok){
  const ts = (o.team || []).map(arById).filter(Boolean); if (!ts.length) return;
  ts.forEach(a => { const g = Math.min(Math.max(0, h.wallet || 0), Math.round(Math.max(0, gotWallet) * .2)); if (g) { a.wallet = (a.wallet || 0) + g; h.wallet -= g; }
    if (ok) { aExp(a, aMonExp(o.z >= 0 ? o.z : 0, ratio(a, o.D || 1)) * 1.5); aAdj(a, 'mood', 6); pfAdd(a, 5); } else aAdj(a, 'mood', -6);
    a.onTeam = -1; });
  for (let i = 0; i < ts.length; i++) { relAdd(uidOf(h), ts[i].uid, 4); for (let j = i + 1; j < ts.length; j++) relAdd(ts[i].uid, ts[j].uid, 4); }
  if (!ok && chance(.6)) { const a = pick(ts); a.bed = ri(1, 2); a.lastHurt = S.day; ev('warn', '隊友受傷', `${a.name}在「${o.n}」受了傷，要休養 ${a.bed} 個月`); }
  if (ok) ev('good', '組隊', `${ts.map(a => a.name).join('、')}和${h.name}一起完成了「${o.n}」`);
}

// =====================================================================
// 4 選秀大會（每年 3 月）
// =====================================================================
function draftOpen(){
  const h = H(); if (offline || !artistSlots() || S.draftY === curY()) return; S.draftY = curY();
  const pool = Array.from({ length:6 }, () => { const a = newHero({ gen:S.gen, tag:'選秀新人' }); a.tag = '選秀新人'; a.lv = clamp(ri(1, 8) + Math.floor(rankOf() / 2), 1, 30); a.age = rand(17, 22); a.trust = clamp(50 + (S.rep - 60) / 2, 10, 90); a.fee = 300 + a.lv * 80; return a; });
  const order = [{ me:1, f:S.fame }, ...S.rivals.slice(0, 2).map(r => ({ r, f:r.fame }))].sort((a, b) => a.f - b.f);
  S.draft = { pool, order, turn:0, picks:{}, log:[] };
  draftStep();
}
function draftStep(){
  const D = S.draft; if (!D) return;
  for (let guard = 0; guard < 12 && D.turn < D.order.length * 2 && D.pool.length; guard++) {
    const who = D.order[D.turn % D.order.length];
    if (who.me) { if (AR().length >= artistSlots() || (D.picks.me || 0) >= 2) { D.turn++; continue; } return draftShow(); }
    const c = D.pool.slice().sort((a, b) => b.lv - a.lv)[0]; D.pool = D.pool.filter(x => x !== c); D.log.push(`${who.r.n}挑走了${c.name}（${CLS[c.cls].n} Lv${c.lv}）`);
    S.rvRookies = (S.rvRookies || []).concat(c.name).slice(-8); who.r.fame += 5; D.turn++;
  }
  draftShow(true);
}
function draftShow(end){
  const D = S.draft; if (!D) return;
  const lv = (S.office.intel || 0), shown = c => { const t = [TRAITS[c.trait].n]; if (lv >= 1) t.push(c.perks.length ? c.perks.map(x => PERKS[x].n).join('、') : '沒有天賦'); if (lv >= 3) t.push(TRAITS[c.trait2].n, '自稱' + GOALS[c.said].n); return t.join('・'); };
  const rows = D.pool.map((c, i) => `<div class="pb care"><span class="mfc">${pimg(c)}</span><div class="cbm"><b class="f16">${esc(c.name)}</b><div class="f14 mu">${CLS[c.cls].n} Lv${c.lv}・${Math.floor(c.age)} 歲</div><div class="f14">${esc(shown(c))}</div></div>${end ? '' : priceBtn(`data-dp="${i}"`, c.fee, S.gold < c.fee, '')}</div>`).join('');
  const head = end ? '選秀結束了' : `輪到你挑（已經挑 ${D.picks.me || 0} / 2）`;
  openPop(`${pSec('人際', head)}${D.log.length ? pList(D.log.map(t => `<div class="prw"><span class="f14">${esc(t)}</span></div>`)) : ''}${rows}${end ? '' : `<button class="pb ns mgo pl" id="dSkip"><b>這輪不挑</b></button>`}`, '選秀大會', '人際', 1);
  if (end) { $('popOk').onclick = $('popX').onclick = () => { S.draft = null; closeMission(); }; return; }
  const next = () => { D.turn++; closeMission(); setTimeout(draftStep, 50); };
  $('mBox').querySelectorAll('[data-dp]').forEach(b => b.onclick = () => { const c = D.pool[+b.dataset.dp]; if (!c || S.gold < c.fee) return;
    S.gold -= c.fee; finAdd('other', -c.fee); D.pool = D.pool.filter(x => x !== c); D.picks.me = (D.picks.me || 0) + 1;
    uidOf(c); c.joined = S.day; c.policy = 'safe'; c.cut = 30; c.mlog = ''; c.act = 'idle'; c.log = c.log || []; delete c.fee; AR().push(c); aLog(c, '在選秀大會被選中，加入事務所'); ev('good', '選秀', `你在選秀大會簽下了${c.name}`); D.log.push(`你簽下了${c.name}`); next(); });
  $('dSkip').onclick = () => { D.log.push('你這輪沒有挑'); next(); };
  $('popOk').onclick = $('popX').onclick = () => { D.log.push('你離開了選秀會場'); D.picks.me = 2; next(); };
}

// =====================================================================
// 2 記者採訪
// =====================================================================
function interviewTick(h){
  if (offline || S.q || !lifeOk(h) || h.act === 'mission') return;
  const rp = npc('reporter'); if (!rp || !rp.alive) return;
  const big = S.ivBig != null && S.day - S.ivBig <= 1;
  if (!big && S.day < (S.ivNext ?? 6)) return;
  S.ivNext = S.day + ri(4, 6); S.ivBig = null;
  const sc = S.day - (h.misDay ?? -99) <= 3, o = ['謙虛', '霸氣', '爆料對手'].concat(sc ? ['哭著道歉'] : []);
  ask('interview', `（《勇者週報》的${rp.name}來採訪：「${h.name}，${sc ? '關於最近的新聞，你有什麼話想說？' : '大家都很好奇你的近況，說兩句吧！'}」你替${pron(h)}回答——）`, o, { sc }, 1);
}
QH.interview = function(i, d){
  const h = H(), rp = npc('reporter'), fr = rp && rp.aff >= 50 ? 2 : 1;
  if (i < 0) i = h.trait === 'hot' || dw(h, 'status') ? 1 : 0;
  if (i === 0) { repAdd(3 * fr, '受訪很謙虛'); addFame(5 * fr); adj('mood', dw(h, 'status') || hx(h, 'X') > .7 ? -4 : 2); say('我只是運氣好，大家都很照顧我'); }
  if (i === 1) { addFame(15 * fr); repAdd(-2, '受訪太囂張'); adj('stress', 5); if (chance(.3)) { const r = pick(S.rivals); r.hostile = (r.hostile || 0) + 1; ev('warn', '記仇', `${r.n}看了報導很不爽`); } say('這一帶沒有人打得贏我'); }
  if (i === 2) { const r = pick(S.rivals); r.fame = Math.max(0, r.fame - 20); addFame(8 * fr); infamyAdd(5, '在週報上爆料對手'); say(`聽說${r.n}的勇者……算了，你們自己去查吧`);
    if (chance(.2)) { addFame(-15); repAdd(-3, '被對手反咬'); ev('bad', '反咬', `${r.n}也在報上爆了你們的料`); } }
  if (i === 3) { adj('trust', -5); addFame(10); ev('good', '道歉', `${h.name}在週報上哭著道歉，大家的氣消了一半`); }
  if (rp) affAdd(rp.id, 2);
};

// =====================================================================
// 1 代言喊價（名聲 100 以上）
// =====================================================================
function endorseAsk(h, it){
  if (offline || it.ag !== 'endorse' || S.fame < 100 || it.nego) return;
  it.nego = 1; if (h.mission) h.mission.nego = 1;
  ask('endorse', `（商會來談代言的價錢，行情是 ${fmt(it.gold)} 金。你要怎麼開價？）`, [`照行情（${fmt(it.gold)}）`, `開高一點（${fmt(Math.round(it.gold * 1.5))}）`, `獅子大開口（${fmt(Math.round(it.gold * 2.5))}）`], {}, 1);
}
QH.endorse = function(i){
  const h = H(), o = h.mission; if (!o || o.ag !== 'endorse') return;
  if (i <= 0) return;
  if (i === 1) { if (chance(Math.min(.9, .5 + S.fame / 2000))) { o.gold = Math.round(o.gold * 1.5); sys('（商會答應了）'); if (h.trait === 'greedy') adj('mood', 5); } else { o.gold = Math.round(o.gold * 1.2); sys('（商會殺價，最後談成 1.2 倍）'); } }
  if (i === 2) { if (chance(Math.min(.6, .15 + S.fame / 4000))) { o.gold = Math.round(o.gold * 2.5); sys('（商會咬牙答應了！）'); if (h.trait === 'greedy') adj('mood', 5); if (dw(h, 'independence')) adj('mood', -8); }
    else { affAdd('guild', -3); h.mission = null; setAct('rest'); ev('bad', '談判破裂', '商會覺得你開價太離譜，代言取消了'); } }
};

// =====================================================================
// 9 送他一匹馬＋馬的成長；10 賽馬大會（每年 5 月）
// =====================================================================
const HORSE_NAMES = ['栗子', '旋風', '阿黃', '小黑', '雪球', '閃電', '麻糬', '豆花', '疾風', '黑糖'];
const HORSE_COLS = ['棕', '黑', '白', '花'];
function newHorse(by, bond = 0){ return { since:S.day, name:pick(HORSE_NAMES), col:pick(HORSE_COLS), bond, by, born:S.day }; }
function horseSpd(h){ const b = h && h.horse ? h.horse.bond || 0 : 0; return b >= 100 ? 1.3 : b >= 50 ? 1.15 : 1; }
const horseOk = h => h && h.horse && !((h.horse.hurt || 0) > S.day);
function buyHorse(){
  const h = H(); if (h.horse) return toast('已經有馬了'); if (S.gold < HORSE_PRICE) return toast('錢不夠');
  S.gold -= HORSE_PRICE; finAdd('shop', -HORSE_PRICE); h.horse = newHorse('you');
  adj('trust', 8 + (dw(h, 'independence') || dw(h, 'curiosity') ? 5 : 0)); adj('mood', 10);
  ev('good', '送馬', `你送了${h.name}一匹${h.horse.col}色的馬，${pron(h)}幫牠取名叫「${h.horse.name}」`); logLife(`收到經紀人送的馬「${h.horse.name}」`);
  say(pickS(['真的嗎！？謝謝老闆！', `「${h.horse.name}」，以後請多指教！`])); renderAll();
}
function horseMonthly(h){
  const hs = h.horse; if (!hs) return;
  if (['hunt', 'mission'].includes(h.act) || h.leg) hs.bond = Math.min(100, (hs.bond || 0) + 3);
  if (hs.by === 'you') { S.gold -= HORSE_FEED; finAdd('other', -HORSE_FEED); }
  if (S.day - (hs.born ?? hs.since) >= 180) { ev('', '馬退休', `「${hs.name}」老了，回馬廄養老`); logLife(`陪了自己很多年的馬「${hs.name}」退休了`); S.oldHorses = (S.oldHorses || 0) + 1; h.horse = null; }
}
function raceTick(h){
  if (offline || moNow() !== 4 || S.raceY === curY() || !lifeOk(h)) return;
  const ents = [h, ...AR()].filter(x => horseOk(x) && !(x === h && h.act === 'mission') && !x.away && !x.bed);
  if (!ents.length) return; S.raceY = curY();
  if (!horseOk(h)) return raceRun(null);
  ask('race', `（今年的賽馬大會開始報名了。${h.name}和「${h.horse.name}」要參加嗎？）`, ['報名，全力衝', '報名，穩穩跑', '不報名'], {}, 1);
}
QH.race = function(i){ const h = H(); if (i === 2) return raceRun(null); const mode = i === 0 ? 'full' : 'safe';
  ask('raceBet', `（要下注嗎？）`, ['押自己的馬 300', '押冷門 300', '不下注'], { mode }, 1); };
QH.raceBet = function(i, d){ raceRun(d.mode, i); };
function raceRun(mode, bet = 2){
  const h = H(), sp = x => 40 + (x.horse.bond || 0) * .45 + (x.sta || 60) * .15;
  const ents = [];
  if (mode) ents.push({ me:1, n:`${h.name}和「${h.horse.name}」`, ex:sp(h) * (mode === 'full' ? 1.1 : 1), who:h });
  AR().filter(a => horseOk(a) && !a.away && !a.bed).forEach(a => ents.push({ n:`${a.name}和「${a.horse.name}」`, ex:sp(a), who:a }));
  const nms = HORSE_NAMES.filter(x => !ents.some(e => e.n.includes(x))).sort(() => Math.random() - .5);
  while (ents.length < 6) ents.push({ n:`路人的「${nms.pop() || '無名馬'}」`, ex:rand(50, 85) });
  const exRank = ents.slice().sort((a, b) => b.ex - a.ex);
  ents.forEach(e => { e.v = e.ex + rand(0, 28); e.odds = clamp(1.5 + exRank.indexOf(e) * 1.3, 1.5, 8); });
  const res = ents.slice().sort((a, b) => b.v - a.v), win = res[0];
  let gold = 0, lines = [];
  if (bet === 0 && mode) { const me = ents.find(e => e.me); gold = win === me ? Math.round(300 * me.odds) - 300 : -300; }
  if (bet === 1) { const cold = exRank[exRank.length - 1]; gold = win === cold ? Math.round(300 * cold.odds) - 300 : -300; }
  if (bet < 2) { S.gold += gold; finAdd('other', gold); lines.push(`下注${gold >= 0 ? '贏了 ' + fmt(gold) : '輸了 ' + fmt(-gold)} 金`); }
  if (win.who) { const w = win.who; w.horse.bond = Math.min(100, w.horse.bond + 10); pfAdd(w, 20);
    if (w === h) { addFame(20); S.gold += 500; finAdd('other', 500); adj('mood', 15); logLife(`和「${h.horse.name}」拿下賽馬大會冠軍`); } else { aAdj(w, 'mood', 10); }
    ents.filter(e => e.who && e.who !== w).forEach(e => { if (e.who === h) adj('mood', w !== h && AR().includes(w) ? -8 : -3); else aAdj(e.who, 'mood', -6); }); }
  if (mode === 'full' && chance(.1)) { h.horse.hurt = S.day + 1; lines.push(`「${h.horse.name}」跑太猛受了傷，一個月不能騎`); }
  ev(win.me ? 'good' : '', '賽馬大會', `冠軍是${win.n}`);
  openPop(`${pSec('代表作', '名次')}${pList(res.map((e, k) => `<div class="prw">${k < 3 ? IC(['金牌', '銀牌', '銅牌'][k], 2) : `<b class="f16 mu">${k + 1}</b>`}<span class="f16${e.me ? ' cg' : ''}">${esc(e.n)}</span><span class="rsp"></span><small class="mu">${e.odds.toFixed(1)} 倍</small></div>`))}${lines.length ? pList(lines.map(t => `<div class="prw"><span class="f14">${esc(t)}</span></div>`)) : ''}`, '賽馬大會', '商隊', 1);
}

// =====================================================================
// 7 怪物圖鑑＋成就＋稱號
// =====================================================================
function dexAdd(z, m){
  if (z == null || z < 0) return; const key = m === 'e' ? z + '_e' : m === 'b' ? 'b' + z : z + '_' + (((m && m.s) || 0) % 4);
  const d = S.dex || (S.dex = {}); d[key] = (d[key] || 0) + 1;
}
const dexMastery = z => [0, 1, 2, 3].filter(i => ((S.dex || {})[z + '_' + i] || 0) >= 100).length;
const ACH = [
  { k:'elite', n:'第一次打倒精英怪', t:'精英獵人', c:() => Object.keys(S.dex || {}).some(k => k.endsWith('_e')), g:300 },
  { k:'champ', n:'武鬥大會冠軍', t:'武鬥王', c:() => (S.tHist || []).some(t => t.me), f:30 },
  { k:'safe', n:'一年沒有受傷', t:'不倒翁', c:h => S.day - (h.lastHurt ?? h.born) >= 12 && S.day - h.born >= 12, g:200 },
  { k:'art3', n:'簽滿 3 位旗下藝人', t:'大經紀人', c:() => AR().length >= 3, f:20 },
  { k:'forge', n:'鍛造到 +10', t:'神兵持有者', c:h => (h.wf || 0) >= 10, f:40 },
  { k:'rich', n:'事務所存款 10 萬', t:'大富翁', c:() => S.gold >= 100000, f:20 },
  { k:'gen3', n:'傳承到第三代', t:'傳承者', c:() => S.gen >= 3, g:1000 },
  { k:'sc3', n:'被爆料三次還活著', t:'打不死的蟑螂', c:() => (S.scN || 0) >= 3, g:100 },
  { k:'boss', n:'打倒骸骨魔王', t:'屠魔勇者', c:() => !!S.bossDone, f:50 },
  { k:'lv30', n:'升到 Lv30', t:'老練的勇者', c:h => h.lv >= 30, g:500 },
  { k:'fame1k', n:'事務所名聲 1,000', t:'名人', c:() => S.fame >= 1000, g:500 },
  { k:'rank', n:'事務所升到最高級', t:'傳說的經紀', c:() => rankOf() >= RANKS.length - 1, f:50 },
  { k:'wed', n:'結婚', t:'有家室的人', c:h => !!h.married, g:200 },
  { k:'kid', n:'有了孩子', t:'爸媽', c:h => !!h.child, g:200 },
  { k:'fr5', n:'交到 5 個朋友', t:'萬人迷', c:() => friendsN() >= 5, f:10 },
  { k:'dex0', n:'草原的怪各打 100 隻', t:'草原通', c:() => dexMastery(0) >= 4, g:200 },
  { k:'k1000', n:'打倒 1,000 隻魔物', t:'千人斬', c:h => (h.kills || 0) >= 1000, f:20 },
  { k:'house', n:'買了自己的房子', t:'有房一族', c:h => !!h.house, g:200 },
  { k:'trust', n:'信任到 100', t:'最好的搭檔', c:h => h.trust >= 99.5, f:10 },
  { k:'horse', n:'和馬的感情到 100', t:'人馬一體', c:h => !!(h.horse && h.horse.bond >= 100), f:15 },
];
function achTick(h){
  const got = S.ach || (S.ach = {});
  ACH.forEach(a => { if (got[a.k]) return; let ok = false; try { ok = a.c(h); } catch (e) {} if (!ok) return;
    got[a.k] = { d:S.day, who:h.name }; if (a.g) { S.gold += a.g; finAdd('other', a.g); } if (a.f) addFame(a.f);
    if (!offline) ev('good', '成就', `達成「${a.n}」，得到稱號「${a.t}」${a.g ? `、獎金 ${fmt(a.g)} 金` : ''}${a.f ? `、名聲 +${a.f}` : ''}`); });
}
function achView(h){
  const got = S.ach || {}, n = Object.keys(got).length;
  let o = `<div class="pb ofc"><div class="ofr">${IC('代表作', 2)}<b class="f16">成就</b><span class="rsp"></span><b class="f16">${n} / ${ACH.length}</b></div>
    <div class="f14 mu">稱號：${h.title ? `<b>「${esc(h.title)}」</b>` : '還沒戴'}（點達成的成就就能戴上）</div></div>`;
  o += pList(ACH.map(a => { const g = got[a.k]; return `<button class="prw achr${g ? '' : ' lk'}"${g ? ` data-ttl="${a.t}"` : ''}>${g ? IC('打勾', 2) : IC('鎖', 2)}<span><b class="f16">${esc(a.n)}</b><small class="mu">${g ? `稱號「${a.t}」・${ym(g.d)}` : '還沒達成'}</small></span></button>`; }));
  o += `<div class="pb ofc"><div class="ofr">${IC('危險', 2)}<b class="f16">怪物圖鑑</b></div>${ZONES.slice(0, topZ() + 1).map((Z, z) => `<div class="ofr zr"><b class="f16">${Z.n}</b><span class="dexr">${MON_NAMES[z].map((m, i) => { const c = (S.dex || {})[z + '_' + i] || 0; return `<span class="pb ns dexc${c ? '' : ' lk'}${c >= 100 ? ' g' : ''}"${TIPA('危險', c ? m : '？？？', c ? `打倒 ${fmt(c)} 隻${c >= 100 ? '・熟練：這區經驗、金幣 +10%' : `（100 隻熟練）`}` : '還沒打倒過')}><b class="f14">${c ? m : '？'}</b></span>`; }).join('')}${(S.dex || {})[z + '_e'] ? `<span class="pb ns dexc g"><b class="f14">精英</b></span>` : ''}</span></div>`).join('')}</div>`;
  return o;
}

// =====================================================================
// 3 拍賣會（王都，每年 11 月，王國級以上）
// =====================================================================
function auctionTick(h){
  if (offline || moNow() !== 10 || S.aucY === curY() || stageOf() < 3 || !lifeOk(h)) return; S.aucY = curY();
  const lots = [], own = new Set(h.charms || []);
  const tk = Object.keys(TREASURES).filter(k => !own.has(k)); if (tk.length && (h.charms || []).length < CHARM_MAX) { const k = pick(tk); lots.push({ k:'tr', v:k, n:TREASURES[k].n, d:TREASURES[k].d, base:ri(30, 80) * 100 }); }
  if (h.wpn >= 3 && (h.wf || 0) < FORGE_MAX) lots.push({ k:'forge', n:'鍛造石', d:'武器直接 +1，不會失敗', base:4000 });
  if (!h.horse) lots.push({ k:'horse', n:'名馬', d:'起始感情 30 的好馬', base:2500 });
  if (h.wpn < 3) lots.push({ k:'relic', n:'前代勇者的遺物', d:'武器升一級', base:5000 });
  while (lots.length < 3) lots.push({ k:'gold', n:'古金幣袋', d:'轉賣大約值 1.3 倍', base:ri(10, 30) * 100 });
  const bidders = S.rivals.slice(0, 2).map(r => ({ n:r.n, r, mul:rand(1.05, 1.5) + r.fame / Math.max(200, S.fame + r.fame) * .6 })).concat({ n:'神秘買家', mul:rand(1.1, 2) });
  S.auc = { lots:lots.slice(0, 3), i:0, cur:0, by:null, bidders, log:[] }; S.auc.cur = S.auc.lots[0].base;
  aucShow();
}
function aucShow(){
  const A = S.auc, L = A && A.lots[A.i]; if (!L) { if (A) aucEnd(); return; }
  const me = A.by === 'me', p10 = Math.round(A.cur * 1.1), p30 = Math.round(A.cur * 1.3);
  openPop(`${pSec('寶物', `第 ${A.i + 1} / ${A.lots.length} 件：${L.n}`)}<div class="f14 mu">${esc(L.d)}</div>
    <div class="ofr"><span class="num">${IC('金幣', 2)}<b class="f22">${fmt(A.cur)}</b></span><span class="rsp"></span><b class="f16 ${me ? 'cg' : 'mu'}">${A.by ? (me ? '你出價最高' : A.by + '出價最高') : '起標價'}</b></div>
    ${A.log.length ? pList(A.log.slice(-4).map(t => `<div class="prw"><span class="f14">${esc(t)}</span></div>`)) : ''}
    <div class="cmdg">${priceBtn('data-ab="1.1"', p10, me || S.gold < p10, me ? '你最高' : '')}${priceBtn('data-ab="1.3"', p30, me || S.gold < p30, '')}<button class="pb ns cmdb" data-ab="0"><b class="f16">${me ? '等對方出價' : '放棄'}</b></button></div>`, '王都拍賣會', '寶物', 1);
  $('mBox').querySelectorAll('[data-ab]').forEach(b => b.onclick = () => { const m = +b.dataset.ab; closeMission(); setTimeout(() => aucBid(m), 30); });
  $('popOk').onclick = $('popX').onclick = () => { closeMission(); setTimeout(() => aucBid(0), 30); };
}
function aucBid(m){
  const A = S.auc, L = A.lots[A.i];
  if (m > 0) { A.cur = Math.round(A.cur * m); A.by = 'me'; A.log.push(`你出 ${fmt(A.cur)}`); }
  const want = A.bidders.filter(b => b.n !== A.by && L.base * b.mul > A.cur * 1.08);
  if (want.length && (m > 0 || A.by !== 'me')) { const b = pick(want); A.cur = Math.round(Math.min(L.base * b.mul, A.cur * rand(1.08, 1.25))); A.by = b.n; A.log.push(`${b.n}出 ${fmt(A.cur)}`); if (m > 0) return aucShow(); }
  if (A.by === 'me' && (m === 0 || !want.length)) aucWin(L, A.cur); else if (A.by && A.by !== 'me') { A.log.push(`${A.by}以 ${fmt(A.cur)} 拿走了${L.n}`); const r = A.bidders.find(b => b.n === A.by); if (r && r.r) r.r.fame += 5; }
  else A.log.push(`${L.n}流標了`);
  A.i++; A.by = null; if (A.lots[A.i]) A.cur = A.lots[A.i].base; aucShow();
}
function aucWin(L, p){
  const h = H(), A = S.auc; if (S.gold < p) { A.log.push('錢不夠，得標無效'); return; }
  S.gold -= p; finAdd('shop', -p); A.log.push(`你以 ${fmt(p)} 標下了${L.n}`);
  if (L.k === 'tr') { h.charms.push(L.v); logLife(`在拍賣會標到${L.n}`); }
  if (L.k === 'forge') h.wf = Math.min(FORGE_MAX, (h.wf || 0) + 1);
  if (L.k === 'horse') { h.horse = newHorse('you', 30); logLife(`在拍賣會得到名馬「${h.horse.name}」`); }
  if (L.k === 'relic') h.wpn = Math.min(3, h.wpn + 1);
  if (L.k === 'gold') { const g = Math.round(p * rand(1.1, 1.5)); S.gold += g; finAdd('other', g); A.log.push(`轉賣拿回 ${fmt(g)}`); }
  adj('mood', 6);
}
function aucEnd(){ const A = S.auc; S.auc = null; openPop(pList(A.log.map(t => `<div class="prw"><span class="f14">${esc(t)}</span></div>`)), '拍賣會結束', '寶物', 1); renderAll(); }

// =====================================================================
// 8 村子防衛戰（先做文字版）
// =====================================================================
function defenseTick(h){
  if (!lifeOk(h)) return;
  if (S.defNext == null) S.defNext = Math.max(S.day + ri(24, 36), 30);
  if (S.day === S.defNext - 1 && !S.defPrep) { S.defPrep = { m:0 }; ev('warn', '預兆', '村民說森林裡的魔物越來越多，下個月可能會有怪物潮'); if (!offline) ask('defPrep', '（怪物潮下個月就要來了，要怎麼準備？）', ['全力準備（柵欄＋2 個傭兵，1,400 金）', '只蓋柵欄（800 金）', '叫旗下藝人回來守', '不準備'], {}, 1); }
  if (S.day >= S.defNext) defenseRun(h);
}
QH.defPrep = function(i){ const P = S.defPrep || (S.defPrep = {});
  if (i === 0 && S.gold >= 1400) { S.gold -= 1400; finAdd('other', -1400); P.fence = 1; P.merc = 2; P.art = 1; }
  else if (i === 1 && S.gold >= 800) { S.gold -= 800; finAdd('other', -800); P.fence = 1; }
  else if (i === 2) P.art = 1; };
function defenseRun(h){
  const P = S.defPrep || {}; S.defPrep = null; S.defNext = S.day + ri(24, 36);
  const str = zD(topZ()) * rand(.8, 1.2) * (1 + curY() * .02);
  const arts = P.art || offline ? AR().filter(a => !a.away && !a.bed) : [];
  arts.forEach(a => { a.onTeam = S.day; a.mlog = '回村子守城'; });
  let def = (h.act === 'mission' && !mHome(h) ? 0 : power(h)) + arts.reduce((s, a) => s + power(a) * .8, 0) + (P.merc || 0) * str * .12;
  if (P.fence) def *= 1.2;
  const r = def / Math.max(1, str);
  if (r >= 1.3) { S.npcs.forEach(n => { if (n.alive && !['rival', 'rival2'].includes(n.role)) n.aff = clamp(n.aff + 3, 0, 100); }); addFame(40); repAdd(5, '守住了村子'); pfAdd(h, 15); ev('good', '防衛戰', `怪物潮來了！${h.name}${arts.length ? '和旗下藝人' : ''}大勝，全村都在歡呼`); logLife('帶頭擊退了怪物潮'); }
  else if (r >= .85) { addFame(15); pfAdd(h, 5); ev('good', '防衛戰', `勉強守住了村子，${pick(['酒館', '雜貨店', '鐵匠鋪'])}被打壞，這個月不開`); }
  else { const loss = Math.max(1500, Math.round(Math.max(0, S.gold) * .12)); S.gold -= loss; finAdd('other', -loss); repAdd(-6, '沒守住村子'); addFame(-40);
    const vs = S.npcs.filter(x => x.alive && !x.dark && !['rival', 'rival2'].includes(x.role)), v = vs.length ? pick(vs) : null; if (v) { v.sick = S.day + ri(2, 4); news('warn', `${v.name}在怪物潮中受了傷`, true); }
    if (h.act !== 'mission' && chance(.4)) injure('light', '守村子時受傷');
    ev('bad', '防衛戰', `沒擋住怪物潮，村子被破壞，重建花了 ${fmt(loss)} 金`); }
}

// =====================================================================
// 3-4 每月一張照片（相簿）
// =====================================================================
const ALB_KEY = 'gy_album';
let ALB = null;
function albLoad(){ if (ALB) return ALB; try { ALB = JSON.parse(localStorage.getItem(ALB_KEY) || '[]'); } catch (e) { ALB = []; } return ALB; }
function albSave(){ try { localStorage.setItem(ALB_KEY, JSON.stringify(ALB)); } catch (e) { if (ALB.length > 60) { ALB.splice(0, Math.floor(ALB.length / 4)); try { localStorage.setItem(ALB_KEY, JSON.stringify(ALB)); } catch (e2) {} } } }
function snapNow(){
  try { const c = document.createElement('canvas'); c.width = 120; c.height = 68; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    const sh = cv.width * 68 / 120, sy = Math.max(0, (cv.height - sh) / 2); x.drawImage(cv, 0, sy, cv.width, sh, 0, 0, 120, 68); return c.toDataURL('image/jpeg', .62); } catch (e) { return null; }
}
function shotTry(txt, score){
  if (offline || !S || !H()) return; const m = S.mShot;
  if (m && m.day === S.day && m.score >= score) return;
  const img = snapNow(); if (!img) return; S.mShot = { day:S.day, score, txt:String(txt).slice(0, 40), img };
}
function albMonth(h){   // 月初：把上個月的照片收進相簿
  const m = S.mShot; S.mShot = null; if (!m || !m.img || m.day !== S.day - 1) return;
  albLoad().push({ g:h.gen || S.gen, d:m.day, age:Math.floor(h.age), t:m.txt, img:m.img, nm:h.name }); albSave();
}
function albumView(h){
  const xs = albLoad().filter(p => p.g === (h.gen || S.gen)).slice().reverse();
  if (!xs.length) return '<div class="pb ofc f14 mu">還沒有照片。每個月會留下一張最有代表性的畫面（離線的月份沒有）。</div>';
  return `<div class="albg">${xs.map(p => `<div class="pb ns albc"><img src="${p.img}" alt=""><b class="f14">${Math.floor(p.age)} 歲・${ym(p.d)}</b><small class="f14">${esc(p.t)}</small></div>`).join('')}</div>`;
}
function albumStrip(h){
  const xs = albLoad().filter(p => p.g === (h.gen || S.gen)); if (!xs.length) return '';
  const n = Math.min(8, xs.length), pk = Array.from({ length:n }, (_, i) => xs[Math.floor(i * (xs.length - 1) / Math.max(1, n - 1))]);
  return `<div class="esec"><span>一生的相簿</span></div><div class="albs">${pk.map(p => `<img src="${p.img}" alt="${esc(p.t)}" title="${esc(p.t)}">`).join('')}</div>`;
}
const DAILY_SHOT = ['平凡的一天', '今天也努力工作了', '天氣真好', '回家的路上', '又是一個月'];

// =====================================================================
// 每個月、每一刻的掛勾
// =====================================================================
function lifeTick(h){   // sim.js dayStart（月初）呼叫
  if (!lifeOk(h)) return;
  heartHook();
  albMonth(h); dqPlan(h);
  if (h.restAsk === S.day) { h.restAsk = null; if (!['mission', 'bed'].includes(h.act)) { setAct('rest'); sys(`（照你說的，${h.name}這個月休息）`); } }
  horseMonthly(h);
  AR().forEach(a => { if (a.sulk && a.sulk > S.day) { aAdj(a, 'mood', -3); aAdj(a, 'stress', 3); } });
  try { achTick(h); } catch (e) { console.error(e); }
  try { defenseTick(h); } catch (e) { console.error(e); }
  if (offline) return;
  try { if (moNow() === 2) draftOpen(); } catch (e) { console.error(e); }
  try { raceTick(h); } catch (e) { console.error(e); }
  try { auctionTick(h); } catch (e) { console.error(e); }
  try { interviewTick(h); } catch (e) { console.error(e); }
}
function lifeHour(h, hr){   // main.js simulate 每一刻呼叫（只在線上）
  if (!lifeOk(h)) return;
  const D = S.dq;
  if (D && D.day === S.day && !D.done && D.when === 'am' && hr >= 7 && hr < 9 && !S.q) { D.done = 1; dqAsk(h, 'am'); }
  if (h.halfDay === S.day && h.act === 'hunt' && hr >= 12.5) { h.halfDay = null; goHome(); say(pickS(['半天到了，回去囉', '今天就到這裡'])); }
  if (h.lateStart === S.day && h.act === 'hunt' && hr < 12 && heroMap(h) !== 'vil') { h.lateStart = null; h.tx = GX; h.ty = GY; }
  if (hr >= 18 && hr < 18.2 && (!S.mShot || S.mShot.day !== S.day)) shotTry(pick(DAILY_SHOT), 0);
}
function lifeLzHook(h){   // map.js lzTick：要開始休閒前。回 true＝先問一個問題
  const D = S.dq;
  if (D && D.day === S.day && !D.done && D.when === 'pm' && !S.q) { D.done = 1; if (dqAsk(h, 'pm')) return true; }
  return false;
}
function lzForce(h){ const w = h.lzWant; if (!w || w.day !== S.day) return null; h.lzWant = null; const o = { k:w.k, id:w.id || null, nm:w.nm || '' }; if (w.with) o.with = 1; return o; }
function lifeEv(kind, tag, text){   // sim.js ev 呼叫：相簿、記者
  if (!S || !H()) return;
  if (['晉升', '魔王', '武鬥大會', '精英怪', '新秀挑戰', '防衛戰', '賽馬大會'].includes(tag) || /冠軍|打倒/.test(text)) S.ivBig = S.day;
  if (kind === 'good' || kind === 'bad') shotTry(text.replace(/[「」]/g, ''), ['晉升', '魔王', '精英怪', '武鬥大會', '結婚', '求婚', '噩耗', '重傷', '防衛戰', '賽馬大會', '成就'].includes(tag) ? 3 : 1);
}
function lifeBind(B){   // ui.js renderSheet 結尾：相簿、成就的按鈕
  B.querySelectorAll('[data-ttl]').forEach(b => b.onclick = () => { const h = H(); h.title = h.title === b.dataset.ttl ? null : b.dataset.ttl; toast(h.title ? `戴上稱號「${h.title}」` : '拿下稱號'); renderSheet(); });
}
function horseLine(h){
  const hs = h.horse; if (!hs) return '';
  return `<div class="pb ofc"><div class="ofr"${TIPA('商隊', '馬', '感情 50 以上跑比較快，100 最快；每個月騎就會增加')}>${IC('商隊', 2)}<b class="f16">「${esc(hs.name)}」</b><span class="f14 mu">${hs.col}色${hs.by === 'you' ? '・你送的' : ''}</span><span class="rsp"></span>${IC('心情', 1)}<b class="f16">${Math.round(hs.bond || 0)}</b></div></div>`;
}
