// 孤勇者 · ui.js：介面：上方資訊、對話、底部選單各分頁、設定
// 這幾個檔案共用同一個全域範圍，要照 index.html 裡的順序載入
'use strict';
// ================= 介面 =================
const ACT_TXT = h => ({
  idle:'在村子裡閒晃', rest:'在家休息', home:'正在回村子的路上', bed:`臥床養傷（還要 ${h.bedDays + 1} 個月）`, slack:'整天躺著擺爛', strike:'罷工中，不肯出門',
  drink:'在酒館', mission:`出任務：${h.mission ? h.mission.n : ''}${h.mission && h.mission.comp && npc(h.mission.comp) ? '（和' + npc(h.mission.comp).name + '）' : ''}（剩 ${h.actDays} 個月）`, gone:'不知道去了哪裡', private:'失聯中', side:'在接外快（沒經過你）', visit:'回老家探望爸媽', train:'跟教練特訓', dying:'倒下了',
  hunt:h.zone >= 0 ? `在${ZONES[h.zone].n}打${ZONES[h.zone].mon}` : '打怪', dead:'已離世', retired:'已退休', left:'已離開',
}[h.act] || '');
function chipsOf(h){
  const c = [];
  if (h.burn > 70) c.push(['r', '倦怠']); else if (h.burn > 45) c.push(['o', '有點倦']);
  if (h.sta < 20) c.push(['r', '很累']); else if (h.sta < 40) c.push(['o', '有點累']); else if (h.sta > 80) c.push(['g', '精神好']);
  if (h.mood < 15) c.push(['r', '低潮']); else if (h.mood < 35) c.push(['o', '有點煩']); else if (h.mood > 75) c.push(['g', '開心']);
  if (h.stress > 85) c.push(['r', '快崩潰']); else if (h.stress > 60) c.push(['o', '緊繃']);
  if (h.trust < 15) c.push(['r', '想解約']); else if (h.trust < 35) c.push(['o', '不太信你']); else if (h.trust > 70) c.push(['g', '信任你']);
  if (h.health < 40) c.push(['r', '身體很差']); else if (h.health < 65) c.push(['o', '身體欠佳']);
  if (h.bedDays > 0) c.push(['o', '受傷']);
  h.perks.filter(p => PERKS[p].bad).forEach(p => c.push(['o', PERKS[p].n + (p === 'lame' && h.aid ? `（${['', '拐杖', '義足'][h.aid]}）` : '')]));
  if (h.wallet < 10) c.push(['o', '沒錢了']);
  if (h.jailed) c.push(['r', '服刑中']); if (h.wanted) c.push(['r', '通緝中']); if (h.record) c.push(['o', '有前科']); if (h.addict) c.push(['r', '魔藥成癮']);
  if (h.reform) c.push(['g', h.reform.st === 2 ? '改過・穩定期' : '想改過']); else if ((h.vice || 0) >= 2 && h.trust >= 40) c.push(['o', VICE_N[h.vice]]);
  c.push(['', `${TRAITS[h.trait].n}・${TRAITS[h.trait2].n}`]);
  return c;
}
function renderAlerts(){
  const h = H(), a = [];
  if (cloud.remote && (cloud.remote.at || 0) > (S.lastSave || 0) + 5 * 60000 && (cloud.remote.gen !== S.gen || cloud.remote.day !== S.day)) a.push(['r', '雲端有比較新的存檔', 'set', 'set']);
  if (S.gold < 0) a.push(['r', `金庫赤字 ${fmt(S.gold)}`, 'office', 'main']);
  const due = S.agTasks.filter(o => o.until - S.day <= 2).length + S.queue.filter(it => it.until && it.until - S.day <= 1).length;
  if (due) a.push(['r', `${due} 個任務快到期`, 'quest', 'due']);
  if (!S.queue.length && !['dead', 'retired', 'left'].includes(h.act)) a.push(['', '排程是空的', 'quest', 'queue']);
  else if (S.queue.length) a.push(['g', `排程 ${S.queue.length}/${Q_MAX}：下一個「${S.queue[0].n}」`, 'quest', 'queue']);
  if (S.day >= 11 && yr().mis < quotaNeed() && 11 - S.day % 12 + 1 <= 3) a.push(['r', `年度配額 ${yr().mis}/${quotaNeed()}，剩 ${11 - S.day % 12 + 1} 個月`, 'quest', 'queue']);
  if (S.contract && S.contract.done < S.contract.need && S.contract.until - S.day <= 3) a.push(['r', `代言合約 ${S.contract.done}/${S.contract.need}，剩 ${S.contract.until - S.day} 個月`, 'quest', 'queue']);
  if (S.agTasks.some(t => t.exam)) a.push(['', '升格考核可以接了', 'quest', 'ag']);
  if (S.mt && S.mt.caravan) a.push(['g', '商隊來了', 'caravan']);
  if (S.mt && S.mt.elite) a.push(['', `${ZONES[S.mt.elite.z].n}有精英怪`, 'map', S.mt.elite.z]);
  if (h.wish) a.push(['', `心願：${h.wish.n.replace(/^想/, '')}（剩 ${Math.max(0, h.wish.until - S.day)} 個月）`, 'hero', 'state']);
  if ($('dQuest').classList.contains('on') && S.agTasks.length) a.push(['', `新的事務所任務 ${S.agTasks.length}`, 'quest', 'ag']);
  const up = Object.keys(OFFICE).filter(k => (S.office[k] || 0) < officeMax() && S.gold >= officeCost(k, S.office[k] || 0) * 1.5);
  if (up.length) a.push(['g', `有設施可以升級`, 'office', 'fac']);
  const key = a.map(x => x[1]).join('|');
  if (key === renderAlerts.k) return; renderAlerts.k = key;
  $('alerts').innerHTML = a.map((x, i) => `<button class="al ${x[0]}" data-al="${i}">${esc(x[1])}</button>`).join('');
  const bn = $('bellN'), urg = a.some(x => x[0] === 'r'); bn.textContent = a.length; bn.className = a.length ? 'on' + (urg ? ' r' : '') : '';
  $('alerts').querySelectorAll('[data-al]').forEach(b => b.onclick = () => { const x = a[+b.dataset.al]; $('alerts').classList.remove('open'); $('bell').classList.remove('open'); if (x[2] === 'caravan') openCaravan(); else if (x[2] === 'map') { userView = ZONES[x[3]].map; viewMan = performance.now(); } else openSheet(x[2], x[3]); });
}
const FXM = { s:null, g:0, f:0, ga:0, fa:0, t:0 };   // v17.29：金庫、名聲變多時在勇者頭上跳字（攢一下再跳，避免太吵）
function fxMoney(){
  if (FXM.s !== S) { FXM.s = S; FXM.g = S.gold; FXM.f = S.fame; FXM.ga = FXM.fa = 0; return; }
  const dg = S.gold - FXM.g, df = Math.round(S.fame) - Math.round(FXM.f); FXM.g = S.gold; FXM.f = S.fame;
  if (dg > 0) FXM.ga += dg; if (df > 0) FXM.fa += df;
  const now = performance.now(); if (now - FXM.t < 1200 || (typeof HFX !== 'undefined' && HFX && HFX.kill && now - HFX.t < 480)) return; FXM.t = now;   // v17.35：打怪的錢等怪物倒下才跳
  if (FXM.ga >= 1) fxPop(`+${fmt(FXM.ga)} 金`, 'gold'); if (FXM.fa >= 1) fxPop(`+${fmt(FXM.fa)} ★`, 'fame'); FXM.ga = FXM.fa = 0;
}
function renderTop(){
  const h = H(); renderAlerts(); fxMoney();
  updBadges(h);
  $('gold').textContent = fmt(S.gold); $('fame').textContent = fmt(Math.round(S.fame));
  $('bars').innerHTML = [[h.sta, '#6fcf97'], [h.mood, '#f2c14e'], [h.stress, '#ff7b7b']].map(([v, c]) => `<i><b style="width:${clamp(v, 0, 100)}%;background:${c}"></b></i>`).join('');
  $('date').textContent = `${ym(S.day)} · ${clockTxt(hourOf())}${{ rain:' · 雨', snow:' · 雪', storm:' · 颱風' }[S.weather] || ''}`;
  const mk0 = menuMul(); $('bSpeed').textContent = !S.paused && mk0 < 1 ? (mk0 ? '慢' : '停') : 'x' + S.speed; $('bPause').textContent = S.paused ? '▶' : '⏸';
  $('hname').textContent = h.name;
  $('hsub').textContent = `${jobName(h)} Lv${h.lv} · ${Math.floor(h.age)} 歲`;
  $('act').textContent = '正在：' + (tourRound() >= 0 ? tourTxt() : vCarry() ? '受傷了，被擡回村子' : legTxt(h) ? legTxt(h) : vWalkTxt(h) ? vWalkTxt(h) : mPhase(h) && mPhase(h) !== 'work' && mPhase(h) !== 'slot' ? mTxt(h) : sleeping() ? (h.act === 'drink' ? '喝醉了，在酒館趴著睡' : '在家睡覺') : hourOf() >= 18.5 && ['idle', 'home'].includes(h.act) ? '晚上在村子裡放鬆' : hourOf() < 7 && h.act === 'hunt' ? '準備出門' : ACT_TXT(h));
  if (mPhase(h) === 'work' && SCN && !SCN.off) $('act').textContent += ' · ' + scnCnt();   // v17.9：進度數字
  { const z = h.act === 'hunt' && h.zone >= 0 ? h.zone : -1, m = h.act === 'mission' && h.mission ? h.mission : null, at = $('act').textContent; let extra = '';
    if (z >= 0) { const d = danger(ratio(h, zD(z))); extra = ` · <span class="dg ${d.k}">${d.n}</span>`; }
    else if (m && m.days > 1) { const pg = clamp(1 - (h.actDays - 1 + S.t / DAY_SEC) / m.days, 0, 1); extra = `<i class="apg"><b style="width:${Math.round(pg * 100)}%"></b></i>`; }
    else if (m && m.z >= 0 && m.D) { const d = danger(ratio(h, m.D) * compMul(m.comp)); extra = ` · <span class="dg ${d.k}">${d.n}</span>`; }
    $('act').innerHTML = esc(at) + extra; $('ztag').style.display = 'none'; }
  drawFace($('face'));
}
let feedN = 0;
const FF = [['all', '全部'], ['hero', '他說的話'], ['ev', '大事'], ['vil', '村子']];
const ffOk = m => { const f = S.feedF || 'all'; return f === 'all' || (f === 'hero' ? m.k === 'hero' || m.k === 'me' : f === 'vil' ? m.g === '村子' : m.k.startsWith('ev') && m.g !== '村子'); };
function renderFeed(){
  const f = $('feed'); const atBottom = f.scrollHeight - f.scrollTop - f.clientHeight < 40;
  $('ff').innerHTML = FF.map(([k, n]) => `<button class="${(S.feedF || 'all') === k ? 'on' : ''}" data-ff="${k}">${n}</button>`).join('');
  $('ff').querySelectorAll('[data-ff]').forEach(b => b.onclick = () => { S.feedF = b.dataset.ff; renderFeed(); f.scrollTop = f.scrollHeight; });
  const h = H(), col = CLS[h.cls].col, ini = esc(h.name.slice(0, 1)), list = S.msgs.filter(ffOk).slice(-50);
  let askI = -1; if (S.q) for (let i = list.length - 1; i >= 0; i--) if (list[i].t === S.q.text) { askI = i; break; }
  const qDup = askI >= 0 && !$('app').classList.contains('chatx');   // v17.23：下方提問框已經寫了同一句，收合時對話裡就不再重複
  f.innerHTML = list.map((m, i) => {
    if (qDup && i === askI) return '';
    if (m.k === 'hero') return `<div class="mrow"><span class="mav">${pimg(h)}</span><div class="m${i === askI ? ' ask' : ''}">${esc(m.t)}</div></div>`;
    if (m.k === 'me') return `<div class="m me">${esc(m.t)}</div>`;
    if (m.k === 'arep') { const op = arepOpen.has(m.d); return `<div class="m arep" data-arp="${m.d}" role="button" aria-expanded="${op}"><div class="ah2"><b style="font-weight:500">${esc(m.t)}</b><span>${op ? '收合' : '展開 ›'}</span></div>${op ? `<div class="ar2">${(m.L || []).map(esc).join('<br>')}</div>` : `<div style="color:#6b4e33;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc((m.L || [])[0] || '')}</div>`}</div>`; }
    if (m.k === 'sys') return `<div class="m sys">${esc(m.t)}</div>`;
    return `<div class="m ${m.k}">${m.hr != null ? `<span class="tm">${clockTxt(m.hr)}</span>` : ''}<i class="evi">${/good/.test(m.k) ? '✓' : /bad/.test(m.k) ? '✕' : '!'}</i><b>${esc(m.g)}</b>${esc(m.t)}</div>`;
  }).join('');
  f.querySelectorAll('[data-arp]').forEach(b => b.onclick = () => { const d = +b.dataset.arp, st = f.scrollTop; arepOpen.has(d) ? arepOpen.delete(d) : arepOpen.add(d); renderFeed(); f.scrollTop = st; });
  if (atBottom || S.msgs.length !== feedN) f.scrollTop = f.scrollHeight;
  feedN = S.msgs.length;
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c]);
function renderReplies(){
  const r = $('replies'), h = H();
  if (S.q) {
    const sys0 = S.q.text.startsWith('（'), left = Math.max(0, S.q.until - S.day) + 1;
    r.className = 'asking';
    r.innerHTML = `<div class="qwait"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span class="qt">${esc(sys0 ? S.q.text.replace(/^（|）$/g, '') : S.q.text)}</span>${BIG_Q.has(S.q.key) ? '<span id="qCd" style="flex:none;color:#b03a30">剩 20 秒</span>' : `<span style="flex:none">剩 ${left} 個月</span>`}</div>
      <div class="qopts ${S.q.opts.length === 3 ? 'n3' : ''}">${S.q.opts.map((o, i) => `<button class="rb q" data-a="${i}">${esc(o)}</button>`).join('')}</div><button class="qghost" data-a="-1">已讀不回（讓${pron(h)}自己決定）</button>`;
    r.querySelectorAll('[data-a]').forEach(b => b.onclick = () => answer(+b.dataset.a));
    $('feed').scrollTop = $('feed').scrollHeight;
    evPage();
  } else {
    r.className = '';   // v17.22：互動收成一顆按鈕，點了打開開羅式選單
    r.innerHTML = `<button class="ibtn" id="tOpen"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>跟${esc(h.name)}互動 <small>${TALK.length} 種</small></button>`;
    $('tOpen').onclick = openTalkMenu;
  }
}
function renderAll(){ renderTop(); renderArow(); renderReplies(); if (sheetT) renderSheet(); }
$('bell').onclick = e => { e.stopPropagation(); const on = $('alerts').classList.toggle('open'); $('bell').classList.toggle('open', on); };
$('chH').onclick = () => $('chX').onclick();
$('chX').onclick = () => { const on = $('app').classList.toggle('chatx'); $('chX').textContent = on ? '收合' : '展開 ›'; $('chT').textContent = on ? H().name : '最新動態'; if (!on) { S.feedF = 'all'; } renderFeed(); $('feed').scrollTop = $('feed').scrollHeight; };
function setNavH(){ document.documentElement.style.setProperty('--navh', $('nav').offsetHeight + 'px'); }
window.addEventListener('resize', setNavH); setTimeout(setNavH, 50);
// ================= v12：分頁的小元件 =================
function drawPortrait(c){ drawFace(c); }
function heroCard(h){
  const showG = h.revealed ? h.goal : h.said, need = expNeed(h.lv);
  return `<div class="pcard"><canvas id="pcv" width="32" height="32" aria-label="${esc(h.name)}的模樣"></canvas><div class="pinfo">
    <div class="k" style="font-size:11.5px">第 ${h.gen} 代${h.master ? ` · ${esc(h.master)}的徒弟` : ''}</div>
    <div class="nm px">${esc(h.name)}</div><div style="font-size:13px;color:#6a4fb0">${jobName(h)} · Lv${h.lv} · ${Math.floor(h.age)} 歲</div>
    <div class="tags"><span class="tag">${TRAITS[h.trait].n}</span><span class="tag">${TRAITS[h.trait2].n}</span><span class="tag g">${h.revealed ? '' : '自稱'}${GOALS[showG].n}</span></div>
    <div><div class="row k" style="font-size:11px"><span>經驗</span><span>${fmt(Math.floor(h.exp))} / ${fmt(need)}</span></div><div class="xbar"><i style="width:${clamp(h.exp / need * 100, 0, 100)}%;background:#6a4fb0"></i></div></div></div></div>
    <div class="tiles"><div class="tile"><b style="color:#2f7a3a">${Math.round(h.sta)}</b><span>體力</span></div><div class="tile"><b style="color:var(--gold)">${Math.round(h.mood)}</b><span>心情</span></div><div class="tile"><b style="color:#b03a30">${Math.round(h.stress)}</b><span>壓力</span></div><div class="tile"><b style="color:var(--blue)">${Math.round(h.trust)}</b><span>信任</span></div></div>`;
}
function gearSlots(h){
  const ic = (p, c) => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" aria-hidden="true">${p}</svg>`;
  const ch = h.charms.map(k => `<div class="slot t">${TREASURES[k].n}</div>`).join('') + Array(Math.max(0, CHARM_MAX - h.charms.length)).fill('<div class="slot e">+</div>').join('');
  const zs = ZONES.slice(0, topZ() + 1).map((Z, i) => [Z.n, danger(ratio(h, zD(i)))]).slice(-3);
  return `<div class="sec" style="margin-top:2px">裝備與寶物</div><div class="card"><div class="slots"><div class="slot w">${eqImg((EQ_WP[h.cls] || 'sword') + h.wpn, 20)}${WPN.n[h.wpn]}${WNAME[h.cls]}</div><div class="slot a">${eqImg('armor' + h.arm, 20)}${ARM.n[h.arm]}</div>${ch}</div>
    <div class="k" style="font-size:12px;margin-top:8px">寶物越危險的地方越容易撿到，身上最多帶 ${CHARM_MAX} 件</div></div>
    ${h.charms.map(k => `<div class="card"><b>${TREASURES[k].n}</b><div class="k" style="font-size:12px">${TREASURES[k].d}</div></div>`).join('')}
    <div class="card row"><span><span class="k" style="font-size:12px">戰力</span><div class="px" style="font-size:26px;color:var(--gold)">${Math.round(power(h))}</div></span><span style="font-size:12.5px;text-align:right;line-height:1.7">${zs.map(([n, d]) => `${n} <span class="dg ${d.k}">${d.n}</span>`).join('<br>')}</span></div>`;
}
function hexRadar(h, ok, km){
  const ks = Object.keys(HEX), cx = 70, cy = 62, R0 = 52, pt = (i, v) => { const a = -Math.PI / 2 + i * Math.PI * 2 / ks.length; return [cx + Math.cos(a) * R0 * v, cy + Math.sin(a) * R0 * v]; };
  const poly = v => ks.map((k, i) => pt(i, v(k)).map(n => n.toFixed(1)).join(',')).join(' ');
  const lab = ks.map((k, i) => { const [x, y] = pt(i, 1.22); return `<text x="${x.toFixed(0)}" y="${(y + 4).toFixed(0)}" text-anchor="middle" font-size="10" fill="${ok(k) ? '#c9cfdb' : '#5a6380'}">${ok(k) ? HEX_TXT[k].hi.slice(0, 2) : '？'}</text>`; }).join('');
  return `<div class="card" style="display:flex;gap:10px;align-items:center"><svg width="140" height="128" viewBox="0 0 140 128" role="img" aria-label="${esc(h.name)}的個性圖"><polygon points="${poly(() => 1)}" fill="none" stroke="#343e55"/><polygon points="${poly(() => .5)}" fill="none" stroke="#2c3550"/><polygon points="${poly(k => ok(k) ? Math.max(.08, h.hex[k] / 100) : .5)}" fill="rgba(242,193,78,.22)" stroke="#f2c14e" stroke-width="2"/>${lab}</svg>
    <div style="flex:1;font-size:12.5px;line-height:1.6"><b>相處 ${km} 個月</b><br><span class="k">越往外，代表越偏向那一邊。灰色的「？」還要再相處一陣子才看得出來。</span></div></div>`;
}
function qCard(h, o, ag){
  const Z = o.z >= 0 ? ZONES[o.z] : null, d = o.D ? danger(ratio(h, o.D)) : null, win = o.D ? Math.round(winP(ratio(h, o.D)) * 100) : null;
  return `<div class="qcard" role="button" tabindex="0" ${ag ? `data-ag="${o.id}"` : `data-o="${o.id}"`} style="${o.ug ? 'border:2px solid #9a3a3a;background:#26181c' : o.boss || o.boss2 ? 'border:2px solid #7a5ac8' : ag ? 'border-color:#6b5aa8' : ''}"><div class="qa" style="background:${o.ug ? '#3a2228' : Z ? Z.c : '#8a6a46'}"><span>${o.ug ? '地下 · ' : ''}${typeTag(o)}${Z ? Z.n : '村子'} · ${durTxt(H(), o)}</span></div>
    <div class="qb"><div class="qn px">${o.n}</div><div style="font-size:12.5px;color:#6b4e33">${o.ug ? `${fmt(o.gold)} 金 · 惡名 +${o.inf}${o.violent ? ' · 要動手' : ''}` : ag ? `名聲 +${o.fame} · ${fmt(o.gold)} 金` : `報酬 <b style="color:var(--gold)">${fmt(o.reward)}</b> 金`}</div>
    ${d ? `<div class="seg"><i class="${d.i === 0 ? 'on' : ''}" style="background:#6fcf97"></i><i class="${d.i === 1 ? 'on' : ''}" style="background:#ffb347"></i><i class="${d.i === 2 ? 'on' : ''}" style="background:#ff7b7b"></i></div><div class="dg ${d.k}" style="font-size:12.5px">${d.n} · 勝率約 ${win}%</div>` : '<div class="dg g" style="font-size:12.5px">不用打</div>'}
    ${o.until ? `<div style="font-size:12px" class="${o.until - S.day <= 1 ? 'dg r' : 'k'}">${dueTxt(o.until)}</div>` : ''}</div></div>`;
}
function shopView(h){
  const sm = npc('chen'), smOk = sm && sm.alive, nw = h.wpn + 1, na = h.arm + 1, qw = nw < 4 ? quote(WPN.price[nw], 'agent') : null, qa = na < 4 ? quote(ARM.price[na], 'agent') : null;
  const q0 = qw || qa, base = qw ? WPN.price[nw] : qa ? ARM.price[na] : 0;
  const line = !q0 ? '你家勇者的裝備已經是最好的了，我也沒什麼能教的。' : q0.p < base ? '看在交情上，算你便宜一點。' : q0.p > base ? '最近鐵很貴，別嫌我算得多。' : '一分錢一分貨，這把我很有信心。';
  let out = `<div class="shopk"><div style="width:44px;flex:none"><div style="width:30px;height:9px;background:#cfcfcf;margin:0 auto"></div><div style="width:28px;height:20px;background:#e8b98a;margin:0 auto"></div><div style="width:40px;height:30px;background:#5a5a5a;margin:0 auto"></div></div>
    <div style="flex:1"><div class="sp">「${line}」</div><div style="font-size:12px;color:#e0c89a;margin-top:6px">${smOk ? `鐵匠${sm.name}` : '鐵匠鋪'}${q0 ? ` · 今天的報價${q0.p > base ? `貴 ${Math.round((q0.p / base - 1) * 100)}%` : q0.p < base ? `便宜 ${Math.round((1 - q0.p / base) * 100)}%` : '照定價'}（${q0.why}）` : ''}</div></div></div>`;
  const ic = (p, c, z = 30) => `<svg width="${z}" height="${z}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" aria-hidden="true">${p}</svg>`;
  const COL = ['#a3abbd', '#c9cfdb', '#f2c14e', '#59a8ff'];
  const up = (kind, cur) => { const T0 = kind === 'w' ? WPN : ARM, nm = i => T0.n[i] + (kind === 'w' ? WNAME[h.cls] : ''), p = kind === 'w' ? '<path d="M4 20L18 6M14 4l6 6"/>' : '<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/>';
    const nx = cur + 1, q = nx < 4 ? (kind === 'w' ? qw : qa) : null, can = q && S.gold >= q.p;
    const eff = kind === 'w' ? (() => { if (!q) return ''; const P0 = power(h), P1 = P0 / WPN.mul[cur] * WPN.mul[nx]; const z0 = bestSafeZone(); let z1 = z0; for (let i = 0; i <= topZ(); i++) if (P1 / zD(i) >= 1.3) z1 = i; return `戰力 ${Math.round(P0)} → <b style="color:#2f7a3a">${Math.round(P1)}</b>${z1 > z0 ? ` · <span class="dg g">${ZONES[z1].n}變安全</span>` : ''}`; })()
      : (q ? `HP ${maxHp(h)} → <b style="color:#2f7a3a">${Math.round(maxHp(h) / ARM.mul[cur] * ARM.mul[nx])}</b>` : '');
    const ef = i => (kind === 'w' ? (EQ_WP[h.cls] || 'sword') : 'armor') + i;   // v17.31：像素裝備圖示
    const dots = [0, 1, 2, 3].map(i => `<span class="td ${i < cur ? 'own' : i === cur ? 'cur' : i === nx ? 'nx' : ''}${i > cur ? ' eqoff' : ''}" title="${nm(i)}">${eqImg(ef(i), 16)}</span>`).join('');
    return `<div class="upc ${can ? 'rec' : ''}"><div class="row"><span class="k" style="font-size:12px">${kind === 'w' ? '武器' : '防具'}</span><span class="tds">${dots}</span></div>
      <div class="upr"><div class="ub"><div class="ic">${eqImg(ef(cur), 32)}</div><b>${nm(cur)}</b><span class="k" style="font-size:11.5px">使用中 · ×${T0.mul[cur]}</span></div>
      ${q ? `<span class="ar">→</span><div class="ub nx"><div class="ic">${eqImg(ef(nx), 32)}</div><b>${nm(nx)}</b><span class="k" style="font-size:11.5px">×${T0.mul[nx]}</span></div>` : `<div class="ub" style="flex:2;justify-content:center"><span class="dg g" style="font-size:13px">已經是最好的了</span></div>`}</div>
      ${q ? `<div style="font-size:12.5px;margin:6px 0">${eff}</div><button class="btn" data-b="${kind}" ${can ? '' : 'disabled'}>${can ? `買${nm(nx)}　${fmt(q.p)}<span style="font-size:11px;opacity:.75;margin-left:6px">買完剩 ${fmt(S.gold - q.p)}</span>` : `${fmt(q.p)} · 還差 ${fmt(q.p - S.gold)}`}</button>` : ''}</div>`; };
  out += up('w', h.wpn) + up('a', h.arm);
  out += `<div class="card row"><span style="display:flex;gap:10px;align-items:center"><span style="width:36px;height:36px;border-radius:10px;background:#3a2030;display:flex;align-items:center;justify-content:center">${ic('<path d="M9 3h6M10 3v5l-5 9a3 3 0 003 4h8a3 3 0 003-4l-5-9V3"/>', '#ff7b7b', 18)}</span><span>小藥水<div class="k" style="font-size:12px">身上 ${h.pots} / ${POT_MAX} 瓶，血少時自動喝</div></span></span><button class="btn" data-b="p" ${S.gold < POT_PRICE || h.pots >= POT_MAX ? 'disabled' : ''}>+1　${POT_PRICE}</button></div>`;
  return out;
}
function caravanItems(h){ const c = S.mt && S.mt.caravan; if (!c) return [];
  const it = [['pots', '遠方的藥水 ×3', '身上的藥水 +3 瓶', 120], ['boost', '力量藥劑', '戰力永久 +5%', 900 + rkx() * 300]];
  if (c.t && TREASURES[c.t] && !h.charms.includes(c.t)) it.push(['charm', TREASURES[c.t].n, TREASURES[c.t].d, 2500 + rkx() * 600]);
  return it; }
function cvBuy(k, p){ const h = H(), c = S.mt && S.mt.caravan; if (!c || S.gold < p) return; if (k === 'charm' && h.charms.length >= CHARM_MAX) return;
  S.gold -= p; if (k === 'pots') h.pots += 3; if (k === 'boost') h.boost = (h.boost || 0) + .05; if (k === 'charm') { ev('good', '商隊', `你在商隊買了${TREASURES[c.t].n}給${h.name}`); h.charms.push(c.t); c.t = null; } else ev('good', '商隊', `你在商隊買了${k === 'pots' ? '藥水' : '力量藥劑'}給${h.name}`); renderAll(); }
function caravanView(h){ const c = S.mt && S.mt.caravan;
  if (!c) return `<div class="card" style="text-align:center;padding:22px 12px"><div style="font-size:15px">商隊現在不在村子</div><div class="k" style="font-size:12.5px;margin-top:6px;line-height:1.6">遠方的商隊偶爾會在草原紮營幾個月，賣藥水、力量藥劑和寶物。<br>來的時候，底部「花錢」和右上鈴鐺都會提醒你。</div><div class="k" style="font-size:12px;margin-top:8px">${h.name}身上的寶物在勇者頁的「寶物」分頁</div></div>`;
  return `<div class="card" style="background:#24301f;border-color:#3f6a3a"><div class="row"><b>遠方來的商隊</b><span class="k" style="font-size:12px">再 ${Math.max(0, c.until - S.day)} 個月就走</span></div><div class="k" style="font-size:12px;margin-top:2px">用事務所的錢買給${h.name}</div></div>
    <div class="svgrid">${caravanItems(h).map(([k, n, d, p]) => { const full = k === 'charm' && h.charms.length >= CHARM_MAX; return `<div class="svc"><b>${n}</b><div class="k" style="font-size:12px;line-height:1.45">${d}</div>${full ? `<div class="dg o" style="font-size:11.5px">${h.name}身上帶不下了</div>` : ''}<button class="btn" data-cv="${k}" data-cp="${p}" ${S.gold < p || full ? 'disabled' : ''}>${fmt(p)}</button></div>`; }).join('')}</div>`; }
// ================= v13：事務所頁的元件 =================
const FINN = { cut:['委託與打怪抽成', '#6fcf97'], ag:['事務所任務', '#59a8ff'], upkeep:['每月開銷', '#ff7b7b'], loan:['還高利貸', '#ff5a5a'], shop:['買裝備與照顧', '#ffb347'], office:['蓋設施', '#c9b6ff'], other:['其他（賽事、商隊、人情…）', '#a3abbd'], trav:['交通（傳送陣）', '#9a7ac8'] };
function finView(){
  const hs = (S.finH || []).slice(-12);
  if (hs.length < 2) return `<div class="sec">收支</div><div class="card k" style="font-size:12.5px">再過幾個月，這裡會畫出金庫的變化和錢的去向</div>`;
  const W = 300, Hh = 90, gs = hs.map(x => x.g), lo = Math.min(0, ...gs), hi = Math.max(...gs, 1), xs = i => 10 + i * (W - 20) / (hs.length - 1), ys = v => Hh - 10 - (v - lo) / (hi - lo || 1) * (Hh - 24);
  const pts = gs.map((v, i) => `${xs(i).toFixed(1)},${ys(v).toFixed(1)}`).join(' ');
  const sum = {}; hs.forEach(x => Object.keys(x.c).forEach(k => sum[k] = (sum[k] || 0) + x.c[k]));
  const ins = Object.keys(sum).filter(k => sum[k] > 0).sort((a, b) => sum[b] - sum[a]), outs = Object.keys(sum).filter(k => sum[k] < 0).sort((a, b) => sum[a] - sum[b]);
  const tin = ins.reduce((a, k) => a + sum[k], 0), tout = -outs.reduce((a, k) => a + sum[k], 0), mx = Math.max(tin, tout, 1);
  const bar = k => `<div class="fr"><span class="fl">${FINN[k] ? FINN[k][0] : k}</span><span class="fb"><i style="width:${Math.abs(sum[k]) / mx * 100}%;background:${FINN[k] ? FINN[k][1] : '#7a5a3a'}"></i></span><span class="fv ${sum[k] < 0 ? 'dg r' : 'dg g'}">${sum[k] > 0 ? '+' : ''}${fmt(Math.round(sum[k]))}</span></div>`;
  const net = tin - tout;
  return `<div class="sec">收支（最近 ${hs.length} 個月）</div><div class="card">${trLine()}
    <div class="row" style="font-size:12.5px"><span>收入 <b class="dg g">+${fmt(Math.round(tin))}</b></span><span>支出 <b class="dg r">-${fmt(Math.round(tout))}</b></span><span>淨賺 <b style="color:${net >= 0 ? '#2f7a3a' : '#b03a30'}">${net >= 0 ? '+' : ''}${fmt(Math.round(net))}</b></span></div>
    <svg width="100%" viewBox="0 0 ${W} ${Hh}" style="display:block;margin:6px 0" role="img" aria-label="最近 ${hs.length} 個月的金庫變化，從 ${fmt(gs[0])} 到 ${fmt(gs[gs.length - 1])}">${lo < 0 ? `<line x1="0" x2="${W}" y1="${ys(0)}" y2="${ys(0)}" stroke="#ff7b7b" stroke-dasharray="3 3" stroke-width="1"/>` : ''}<polyline points="${pts}" fill="none" stroke="#f2c14e" stroke-width="2.5" stroke-linejoin="round"/>${gs.map((v, i) => i === gs.length - 1 ? `<circle cx="${xs(i)}" cy="${ys(v)}" r="3.5" fill="#f2c14e"/>` : '').join('')}<text x="${W - 4}" y="12" text-anchor="end" font-size="10" fill="#a3abbd">${fmt(hi)}</text><text x="${W - 4}" y="${Hh - 2}" text-anchor="end" font-size="10" fill="#a3abbd">${fmt(lo)}</text></svg>
    ${ins.map(bar).join('')}${outs.map(bar).join('')}</div>`;
}
function repView(){
  const rp = S.rep, L = [[0, '惡名昭彰', '#ff5a5a'], [15, '血汗事務所', '#ff7b7b'], [35, '有些負評', '#ffb347'], [55, '風評還不錯', '#8fe0b0'], [75, '良心事務所', '#6fcf97']], cur = [...L].reverse().find(x => rp >= x[0]);
  const log = (S.repLog || []).slice(-6).reverse();
  return `<div class="sec">口碑（你怎麼對待勇者）</div><div class="card"><div class="row"><b style="color:${cur[2]}">${cur[1]}</b><span>${Math.round(rp)} / 100</span></div>
    <div class="repg">${L.map(([v, n, c], i) => `<i style="flex:${(L[i + 1] ? L[i + 1][0] : 100) - v};background:${c}"></i>`).join('')}<b style="left:${clamp(rp, 1, 99)}%"></b></div>
    <div class="row k" style="font-size:10.5px;margin-top:2px"><span>惡名昭彰</span><span>良心事務所</span></div>
    ${log.length ? `<div style="margin-top:8px">${log.map(x => `<div class="kv"><span>${esc(x.why)}</span><span class="${x.v > 0 ? 'dg g' : 'dg r'}" style="flex:none;margin-left:8px">${x.v > 0 ? '+' : ''}${x.v}</span></div>`).join('')}</div>` : '<div class="k" style="font-size:12px;margin-top:6px">最近沒有大事影響口碑</div>'}
    <div class="k" style="font-size:12px;margin-top:6px">口碑越低，下一代願意簽約的人越少，一開始也越不信任你。</div></div>`;
}
function rivalView(){
  const me = { n:'你的事務所', fame:S.fame, me:1 }, all = [me, ...S.rivals], mx = Math.max(...all.map(x => x.fame), 1), order = [...all].sort((a, b) => b.fame - a.fame);
  let out = `<div class="sec" style="margin-top:2px">排行榜${S.rvShield > S.day ? ' · <span class="dg g">你正盯著他們</span>' : ''}${S.priceWar > S.day ? ' · <span class="dg r">價格戰中</span>' : ''}</div><div class="card">${order.map((b, i) => `<div class="rrow"><span class="rk">${i + 1}</span><span style="flex:1;min-width:0"><span style="${b.me ? 'color:var(--gold)' : ''}">${b.n}</span><span class="fb" style="display:block;margin-top:3px"><i style="width:${b.fame / mx * 100}%;background:${b.me ? 'var(--gold)' : '#6b5aa8'}"></i></span></span><b style="margin-left:8px">${fmt(Math.round(b.fame))}</b></div>`).join('')}</div>`;
  const ACT = [['spy', '盯動向', 150, '擋下對方下一次出招', '沒有風險', '<circle cx="12" cy="12" r="3"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/>'],
               ['steal', '挖客戶', 400, '拿到一筆高報酬委託', '對方敵意 +1', '<path d="M4 12h12M12 6l6 6-6 6"/>'],
               ['leak', '爆料', 250, '六成機會讓對方名聲大跌', '失手會被說手段骯髒；敵意 +2', '<path d="M4 4h16v12H8l-4 4z"/>']];
  S.rivals.forEach((r, i) => { const hn = npc(i ? 'rival2' : 'rival'), cd = (r.cd || 0) > S.day, ho = r.hostile || 0;
    out += `<div class="vsc"><div class="vsh"><div class="vss"><span class="k" style="font-size:11px">你</span><b style="color:var(--gold)">${fmt(Math.round(S.fame))}</b></div><span class="vs px">VS</span><div class="vss" style="text-align:right"><span class="k" style="font-size:11px">${r.n}</span><b>${fmt(Math.round(r.fame))}</b></div></div>
      <div class="row" style="font-size:12px;margin:6px 0"><span>旗下勇者：${hn && hn.alive ? esc(hn.name) : '—'}</span><span>敵意 <span class="pips" style="display:inline-flex;vertical-align:middle">${[0, 1, 2, 3, 4].map(j => `<i class="${j < ho ? 'on' : ''}" style="${j < ho ? 'background:#ff7b7b' : ''}"></i>`).join('')}</span></span></div>
      ${r.last ? `<div class="k" style="font-size:12px;margin-bottom:6px">最近：${esc(r.last)}</div>` : ''}
      <div class="acts">${ACT.map(([k, n, c, ef, rk, ic]) => `<button class="actc" data-rv="${i}" data-rk="${k}" ${cd || S.gold < c ? 'disabled' : ''}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${ic}</svg><b>${n}</b><span class="ef">${ef}</span><span class="rk2">${rk}</span><span class="pr">${fmt(c)}</span></button>`).join('')}</div>
      ${cd ? `<div class="k" style="font-size:11.5px;margin-top:6px">${r.cd - S.day} 個月後才能再對${r.n}出手</div>` : ''}</div>`; });
  out += `<div class="k" style="font-size:12px;margin:2px 2px 8px">出手越多，對方越常找你麻煩。</div>`;
  return out;
}
function eventView(h){
  const mo = S.day % 12, until = m => (m - mo + 12) % 12, reg = S.tour && S.tour.y === curY();
  const ev3 = [['武鬥大會報名', 7, reg ? '<span class="dg g">已報名</span>' : h.lv < 3 ? `勇者 Lv3 才能報名` : '會問你要不要報名'], ['武鬥大會', 9, reg ? `<span class="dg g">${esc(h.name)}會出賽</span>` : '沒報名就不會出賽'], ['年度勇者大賞', 11, stageOf() >= 1 ? '五個獎項，也有「最操事務所」' : '事務所到「地方」階段才會入圍']];
  const th = (S.tHist || []).slice(-6).reverse(), ah = (S.awHist || []).slice(-6).reverse(), champs = (S.tHist || []).filter(t => t.me).length, wins = (S.awHist || []).reduce((a, t) => a + t.won, 0);
  return `<div class="sec" style="margin-top:2px">接下來</div><div class="svgrid" style="grid-template-columns:repeat(3,minmax(0,1fr))">${ev3.map(([n, m, t]) => { const u = until(m); return `<div class="svc" style="text-align:center;gap:3px"><span class="k" style="font-size:11.5px">${n}</span><b class="px" style="font-size:22px;color:${u === 0 ? 'var(--gold)' : 'var(--text)'}">${u === 0 ? '本月' : u + ' 個月'}</b><span style="font-size:11px;line-height:1.35">${t}</span></div>`; }).join('')}</div>
    <div class="tiles" style="grid-template-columns:repeat(2,minmax(0,1fr))"><div class="tile"><b style="color:var(--gold)">${champs}</b><span>武鬥大會冠軍</span></div><div class="tile"><b style="color:var(--blue)">${wins}</b><span>大賞得獎數</span></div></div>
    <div class="sec">武鬥大會紀錄</div><div class="card">${th.length ? th.map(t => `<div class="kv"><span>第 ${t.y} 年 · ${esc(t.hero)}</span><span class="${t.me ? 'dg g' : 'k'}">${['首輪淘汰', '四強', '亞軍', '冠軍'][t.place]}${t.me ? '' : '（冠軍：' + esc(t.champ) + '）'}</span></div>`).join('') : '<div class="k">還沒參加過</div>'}</div>
    <div class="sec">年度勇者大賞紀錄</div><div class="card">${ah.length ? ah.map(t => `<div class="kv"><span>第 ${t.y} 年 · ${esc(t.hero)}</span><span>${t.won} 座${t.harsh ? ' · <span class="dg r">最操事務所</span>' : ''}</span></div>`).join('') : '<div class="k">還沒頒過獎</div>'}</div>`;
}
function lifeColor(t){ return /冠軍|打倒|最佳|心願達成|傳說|守住|擊退/.test(t) ? '#f2c14e' : /重傷|倒下|跛|死|逃跑|醜聞|後遺症|分開|失戀/.test(t) ? '#ff7b7b' : /在一起|結婚|出生|求婚|戀/.test(t) ? '#e88aa8' : /找到|轉職|痊癒|朋友|買/.test(t) ? '#6fcf97' : '#59a8ff'; }
// v12.5：底部徽章與排程進度
function updBadges(h){
  const set = (t, v, c) => { const e = $('bd_' + t); if (!e) return; const on = v != null && v !== 0 && v !== ''; const key = on ? v + c : ''; if (e._k === key) return; e._k = key; e.textContent = on ? v : ''; e.className = 'bdg' + (on ? ' on' : '') + (c ? ' ' + c : ''); };
  const due = S.agTasks.filter(o => o.until - S.day <= 2).length + S.queue.filter(it => it.until && it.until - S.day <= 1).length;
  set('quest', due || ($('dQuest').classList.contains('on') ? '新' : 0), due ? '' : 'y');
  // v17.23：「買得起」要扣掉 3 個月開銷的預備金才算；第一代頭兩個月先不提醒買東西，讓新手先專心接任務
  const fresh = S.gen === 1 && S.day < 2, ok$ = p => !fresh && S.gold - p >= upkeep() * 3;
  const nw = h.wpn + 1, na = h.arm + 1, aff = (nw < 4 && ok$(quote(WPN.price[nw], 'agent').p) ? 1 : 0) + (na < 4 && ok$(quote(ARM.price[na], 'agent').p) ? 1 : 0) + (S.mt && S.mt.caravan ? 1 : 0);
  set('gear', aff, 'g');
  const up = Object.keys(OFFICE).filter(k => (S.office[k] || 0) < officeMax() && ok$(officeCost(k, S.office[k] || 0))).length + ($('dOffice').classList.contains('on') ? 1 : 0) + (S.q && /^rv/.test(S.q.key) ? 1 : 0);
  set('office', up, up && $('dOffice').classList.contains('on') ? 'y' : 'g');
  const cr = typeof cloud !== 'undefined' && cloud.remote, newer = cr && (cr.at || 0) > (S.lastSave || 0) + 5 * 60000 && (cr.gen !== S.gen || cr.day !== S.day);
  set('set', newer ? '!' : 0, '');
  const pq = S.q && ['wedding', 'visitNpc', 'favor', 'npcLoan', 'kidnap', 'love', 'propose'].includes(S.q.key) ? 1 : 0, sk = S.npcs.filter(n => n.alive && (n.sick || 0) > S.day && n.aff >= 50).length;
  set('people', pq + sk, pq ? '' : 'y');
  const ring = $('qRing'); if (ring) { const n = S.queue.length; ring.setAttribute('stroke-dashoffset', 182.2 * (1 - n / Q_MAX)); ring.parentNode.parentNode.classList.toggle('empty', !n && !['dead', 'retired', 'left'].includes(h.act)); ring.parentNode.parentNode.dataset.q = Math.min(n, Q_MAX); }   // v17.29：任務方塊下方 4 格進度
}
// 大事件：整頁劇情
const BIG_Q = new Set(['draft2', 'kidnap', 'love', 'propose', 'retire', 'scandal', 'family', 'draft', 'rvPoach', 'plague', 'crisis', 'reveal', 'raid', 'tStrat', 'aLeave', 'aPoach', 'aScandal', 'aBreak', 'aBully', 'aReport']);
// ================= v15：惡劣系統（惡名、惡行階梯、入獄、地下委託、稽查、抽身、改過）＋名聲的好處 =================
// 口碑＝雇主風評（你怎麼對待勇者）；惡名＝地下風評（事務所對外做了多少壞事），20 以下不顯示
const VICE_N = ['', '小毛病', '惡行', '犯罪', '失控'];
const CAUSE_N = { debt:'背債缺錢', family:'家裡缺錢', addict:'魔藥成癮', betray:'覺得被背叛', burn:'長期過勞', astray:'被人帶壞' };
function infamyAdd(v, why, accomp){
  S.infamy = clamp((S.infamy || 0) + v, 0, 100);
  if (S.infamy >= 20) S.infamySeen = 1;
  if (accomp) { S.accomp = S.accomp || []; S.accomp.push({ d:S.day, t:why }); if (S.accomp.length > 40) S.accomp.shift(); }
  if (v >= 5 && !offline && S.infamySeen) ev('warn', '惡名', `${why}（惡名 +${Math.round(v)}）`);
}
// 墮落的原因：玩家回頭看要找得到線索
function viceCause(h){
  if (h.addict) return 'addict';
  if ((h.ledAstray || 0) >= 2) return 'astray';
  if (h.wallet < 40 && h.goal === 'filial') return 'family';
  if (h.wallet < 40) return 'debt';
  if (h.trust < 30) return 'betray';
  if ((h.burn || 0) > 75) return 'burn';
  return null;
}
// 每月：主力的惡行階梯、改過、出獄後、事務所的地下世界
function viceTick(){
  const h = H(); if (!h || ['dead', 'retired', 'left', 'dying'].includes(h.act)) return;
  h.vice = h.vice || 0;
  S.infamy = Math.max(0, (S.infamy || 0) - .3);   // 惡名只會隨時間慢慢下降
  if (h.jailed) return;
  const cause = viceCause(h);
  // 改過的三步
  if (h.reform) reformTick(h, cause);
  else if (cause && h.vice < 4) {
    const p = .015 * (1.4 - hx(h, 'H')) * (1 + (h.stress > 70 ? .5 : 0)) * (S.underworld ? 1.4 : 1) * (h.trait === 'greedy' ? 1.3 : 1);
    if (chance(p)) viceUp(h, cause);
  }
  // 通緝中被包庇：每月可能被抓
  if (h.wanted && chance(.08)) { h.wanted = 0; jailHero(h, ri(18, 36), '公會的人還是找上門，把他帶走了'); infamyAdd(10, '包庇的通緝犯被抓到', true); }
  // 低誠實又缺錢的勇者：主動提議走門路
  if (!S.underworld && !offline && !S.q && hx(h, 'H') < .35 && h.wallet < 60 && h.trust >= 30 && chance(.04)) ask('vPropose', '老闆……我認識一些人，有門路賺快錢。要不要做？', ['好，介紹給我', '不要碰那些'], {}, 2);
  if (S.loan > 0 && S.gold < 0 && !S.underworld && !S.q && !offline && chance(.15)) ask('uwDebt', '（討債的人上門了：「還不出來？那就用你家勇者的身手來抵吧。」）', ['答應', '想辦法還錢'], {}, 2);
  // 地下世界：有把柄在別人手上之後，地下委託會一直來
  if (S.underworld) {
    const ug = S.agTasks.filter(t => t.ug);
    if (ug.length < 2 && chance(.35)) pushUg();
  }
  // 王國稽查
  if ((S.infamy || 0) >= 70 && !S.q && !offline && S.day >= (S.auditCd || 0) && chance(.05)) { S.auditCd = S.day + 24; ask('vAudit', '（王國的稽查官來到事務所，要調閱這幾年的帳本）', ['配合調查', '銷毀帳本', '讓勇者頂罪'], {}, 2); }
  // 和事務所合不合：誠實的人待在黑心事務所會痛苦；不老實的人在乾淨事務所覺得被管
  if ((S.infamy || 0) > 30) { adj('trust', -hx(h, 'H') * S.infamy / 100 * 1.5); adj('stress', hx(h, 'H') * S.infamy / 100 * 2); }
  else if ((S.infamy || 0) < 10 && hx(h, 'H') < .3) adj('mood', -.5);
  // 名聲的感受：重視地位、外向的人越紅越開心；內向、想安穩的人越紅壓力越大
  const st = stageOf();
  if (st >= 1) {
    if (dw(h, 'status') || hx(h, 'X') > .65) adj('mood', .6 * st);
    if (hx(h, 'X') < .35 || dw(h, 'tranquility')) adj('stress', .7 * st);
  }
}
function viceUp(h, cause){
  h.vice++; h.cause = cause; h.viceLog = h.viceLog || [];
  const lv = h.vice;
  if (!offline) sys(`（線索：${h.name}最近好像${{ debt:'很缺錢', family:'常常寄錢回家，自己卻吃不飽', addict:'常常往神殿後面的小巷子跑', betray:'對你很冷淡', burn:'整個人很空洞', astray:'常常跟一些奇怪的人混在一起' }[cause]}）`);
  if (lv === 1) { ev('warn', '小毛病', pick([`${h.name}放了商會的鴿子`, `${h.name}喝醉在酒館鬧事`, `${h.name}跟人吵架摔東西`])); logLife('開始出現一些小毛病'); }
  if (lv === 2) {
    const k = pick(['bully', 'steal', 'claim']);
    if (k === 'bully') { const n = pick(S.npcs.filter(x => x.alive && x.role !== 'rival')); if (n) { n.aff = Math.max(0, n.aff - 15); ev('bad', '惡行', `${h.name}欺負了${n.name}`); } }
    if (k === 'steal') { const g = Math.min(Math.max(0, S.gold), ri(80, 200) + h.lv * 10); S.gold -= g; ev('bad', '帳目短少', `事務所的帳少了 ${fmt(g)} 金，${h.name}說不知道`); h.wallet += g; }
    if (k === 'claim') { ev('bad', '惡行', `${h.name}把同伴的功勞說成自己的`); S.npcs.forEach(n => { if (n.alive && n.aff >= 40) n.aff -= 5; }); }
    logLife('做了一些見不得人的事');
  }
  if (lv === 3) {
    const k = cause === 'addict' ? 'drug' : h.partner && hx(h, 'A') < .35 ? 'dv' : pick(['fraud', 'extort', 'guard']);
    const t = { fraud:'幫人詐騙商會', extort:'勒索小商家', guard:'替地方幫派圍事', drug:'在地下賭場用魔藥', dv:'對伴侶動手' }[k];
    h.crime = k; logLife(`犯下：${t}`);
    if (k === 'drug') h.addict = 1;
    if (k === 'dv') { const pa = npc(h.partner); if (pa) pa.aff = Math.max(0, pa.aff - 40); }
    if (!offline) ask('vCrime', `（記者阿哲來找你：「你家${h.name}${t}，我手上有證據。你要怎麼處理？」）`, ['包庇，把新聞壓下來', '交給公會處理', '勸他自首'], { k }, 2);
    else { addFame(-30); }
  }
  if (lv === 4) {
    const kill = hx(h, 'A') < .4 && chance(.4);
    h.wanted = 1; h.crime = kill ? 'kill' : h.crime;
    if (kill) { S.npcs.push(mkNpc({ id:'vf' + S.day, title:'被害者家屬', name:pick(['林太太', '陳先生', '王阿嬤', '小張']), sex:chance(.5) ? 'm' : 'f', role:'victim', age:ri(25, 70), pw:0, grudge:h.name }, 0)); logLife('在衝突中失手殺了人'); }
    if (!offline) ask('vWanted', `（公會發出通緝令：${h.name}${kill ? '在衝突中失手殺了人' : '犯下重罪'}，限期交人）`, ['交人', '包庇他'], { kill }, 2);
  }
}
function jailHero(h, m, why){
  h.jailed = 1; h.record = 1; h.wanted = 0; h.goneDays = m; setAct('gone'); h.alpha = 0; h.jailIn = S.day;
  ev('bad', '入獄', `${h.name}${why ? why + '，' : ''}被判服刑 ${m} 個月`); logLife(`入獄服刑 ${m} 個月`); remember('used', { n:'入獄' });
  S.queue = []; addFame(-Math.round(20 + m));
}
function jailRelease(){
  const h = H(); h.jailed = 0; h.alpha = 1; h.x = GX; h.y = GY; h.tx = GX; setAct('rest');
  S.npcs.forEach(n => { if (n.alive && n.role !== 'victim') n.aff = Math.round(n.aff * .3); });   // 很多人已經不認他了
  h.vice = Math.max(1, h.vice - 1); h.stress = 50; adj('mood', -10);
  ev('warn', '出獄', `${h.name}服刑期滿，回到村子。很多人已經不認他了`); logLife('出獄，回到村子');
  if (!offline) say(pickS(['……我回來了。你還願意帶我嗎？', '外面的空氣，好久沒聞到了']));
}
// 改過：承認 → 切斷原因 → 穩定期，可能復發
function startReform(h){ h.reform = { st:1, since:S.day }; adj('trust', 6); ev('good', '承認', `${h.name}終於說出了真話，想重新開始`); logLife('對經紀人說出真話，想改過'); }
function causeCleared(h, c){
  return { debt:h.wallet >= 150, family:h.wallet >= 150, addict:!h.addict, betray:h.trust >= 70, burn:(h.burn || 0) < 40, astray:(h.ledAstray || 0) === 0 }[c || h.cause] ?? true;
}
function reformTick(h, cause){
  const r = h.reform;
  if (r.st === 1 && causeCleared(h)) { r.st = 2; r.since = S.day; r.need = ri(12, 24); ev('good', '改過', `${h.name}斷掉了讓${pron(h)}墮落的原因（${CAUSE_N[h.cause] || '說不清楚的理由'}），進入穩定期`); }
  if (r.st >= 1 && h.stress > 75 && h.wallet < 40 && chance(.12)) { relapse(h, '壓力太大又缺錢'); return; }
  if (r.st === 2 && S.day - r.since >= r.need) {
    h.vice = Math.max(0, h.vice - 1); h.reform = null; h.ledAstray = 0;
    addFame(10); const fan = npc('fan'); if (fan && fan.alive) fan.aff = Math.min(100, fan.aff + 15);
    ev('good', '浪子回頭', `${h.name}撐過了穩定期，真的回到正軌了`); logLife('浪子回頭'); remember('reform');
  }
}
function relapse(h, why, byYou){
  h.reform = null; h.vice = Math.min(4, (h.vice || 0) + (byYou ? 1 : 0));
  if (byYou) { adj('trust', -20); if (!offline) say('……是你把我拉回去的。'); }
  ev('bad', '復發', `${h.name}又回到老路上了（${why}）`); logLife('改過失敗，又回到老路');
}
// 地下委託
const UG = [
  { k:'ugSmuggle', n:'地下委託：走私護送', gold:1800, inf:6, d:'幫地下商會運一批不能見光的貨，被抓到就是醜聞' },
  { k:'ugDebt', n:'地下委託：替貴族討債', gold:1400, inf:5, d:'去欠債的人家裡「好好談」，誠實、和善的人會很痛苦' },
  { k:'ugFix', n:'地下委託：打假賽', gold:2200, inf:7, d:'在鬥技場故意輸，賭盤的人會付錢' },
  { k:'ugSabo', n:'地下委託：破壞對手的任務', gold:1600, inf:6, d:'讓對手事務所的委託出包，對手名聲會跌' },
  { k:'ugGuard', n:'地下委託：替幫派圍事', gold:2600, inf:9, d:'站在幫派那邊撐場面，可能要動手', violent:1, dk:[.8, 1.1], z:2 },
  { k:'ugHit', n:'地下委託：除掉某個人', gold:5000, inf:18, d:'沒有人會說出口的委託。要勇者本人同意', violent:1, dk:[1, 1.4], z:3, minInf:50 },
];
UG.forEach(u => { AGT[u.k] = { n:u.n, days:1, fame:0, gold:u.gold, z:u.z ?? -1, d:u.d }; });
function pushUg(){
  const h = H(), pool = UG.filter(u => (S.infamy || 0) >= (u.minInf || 0)), u = pick(pool); if (!u) return;
  S.agTasks.push({ id:S.day * 100 + ri(80, 99), ag:u.k, ug:1, inf:u.inf, violent:u.violent || 0, n:u.n, days:1, D:u.dk ? Math.round(power(h) * rand(u.dk[0], u.dk[1])) : 0, z:u.z ?? -1, fame:0, gold:Math.round(u.gold * (1 + rkx() * .3)), share:.2, until:S.day + ri(3, 6) });
  if (!offline) ev('warn', '地下', `有人悄悄塞了一張紙條：「${u.n.replace('地下委託：', '')}」`);
}
function resolveUg(h, o){
  const pay = () => { const his = Math.round(o.gold * o.share); S.gold += o.gold - his; finAdd('ag', o.gold - his); h.wallet += his; };
  let ok = true;
  if (o.D) { const r = ratio(h, o.D) * compMul(o.comp); ok = winOf(o, winP(r)); }
  if (o.ag === 'ugSmuggle' && chance(.15)) ok = false;
  if (ok) {
    pay(); infamyAdd(o.inf, `完成「${o.n.replace('地下委託：', '')}」`, true);
    adj('stress', hx(h, 'H') * 15 + (o.violent ? hx(h, 'A') * 15 : 0)); adj('trust', -hx(h, 'H') * 6);
    if (o.ag === 'ugSabo') { const rv = pick(S.rivals); rv.fame = Math.max(0, rv.fame - 80); }
    if (o.ag === 'ugHit') { h.vice = Math.max(h.vice || 0, 3); h.crime = 'kill'; logLife('接了一件沒有人會說出口的委託'); }
    ev('warn', '地下', `「${o.n}」辦完了，錢已經進帳`);
    if (h.reform) relapse(h, '又被派去做地下委託', true);
  } else {
    addFame(-60); infamyAdd(o.inf + 5, `「${o.n.replace('地下委託：', '')}」出包被發現`, true); adj('trust', -6);
    ev('bad', '醜聞', `「${o.n}」出包了，消息傳了出去`);
    if (o.violent && chance(.3)) injure('heavy', `「${o.n}」出事`);
  }
}
// 黑心路線的入口：被找上門
function enterUnderworld(why){ if (S.underworld) return; S.underworld = 1; S.uwSince = S.day; infamyAdd(5, why, true); pushUg(); }
function quitUnderworld(){
  if (!S.underworld || S.q) return false;
  ask('vQuit', '（你跟地下商會說想抽身。對方笑了：「要走可以，總得留下點什麼。」）', [`付 ${fmt(quitCost())} 金`, '做最後一件委託', '直接翻臉'], {}, 2); return true;
}
const quitCost = () => Math.round(3000 + (S.infamy || 0) * 60);
// 和地下世界有關的問答
Object.assign(QH, {
  uwDebt(i){ if (i === 0) { S.loan = Math.max(0, S.loan - 1500); enterUnderworld('用勇者的身手抵高利貸'); } else { adj('stress', 10); addFame(-20); ev('warn', '討債', '討債的人在村子裡大聲嚷嚷，大家都知道你欠錢了'); } },
  vPropose(i){ if (i === 0) { enterUnderworld('勇者介紹了地下的門路'); adj('trust', 4); say('交給我，你不會後悔的'); } else { adj('trust', -2); say('……好吧'); } },
  vCrime(i, d){ const h = H();
    if (i === 0 || i < 0) { infamyAdd(8, `包庇勇者${h.name}的罪行`, true); enterUnderworld('包庇勇者，被人抓住了把柄'); adj('trust', 6); return; }
    if (i === 1) { jailHero(h, ri(6, 18), '被交給公會'); adj('trust', -25); repAdd(1, '把犯錯的勇者交給公會'); return; }
    if (h.trust >= 55 || hx(h, 'H') > .5) { jailHero(h, ri(3, 8), '自首，審判前就悔改，獲得減刑'); h.reform = { st:1, since:S.day }; adj('trust', 8); }
    else { say('自首？你在開玩笑吧'); adj('trust', -8); infamyAdd(4, '勇者的罪行傳了出去', false); addFame(-40); } },
  vWanted(i, d){ const h = H();
    if (i === 0 || i < 0) { jailHero(h, d.kill ? ri(36, 60) : ri(18, 36), '你把他交了出去'); adj('trust', -30); return; }
    infamyAdd(15, `包庇通緝犯${h.name}`, true); enterUnderworld('包庇通緝犯'); adj('trust', 10); h.wanted = 1; },
  vAudit(i){ const h = H();
    if (i === 0 || i < 0) { const f = 300 + (S.accomp || []).length * 80; S.gold -= f; addFame(-50); S.infamy = Math.max(0, S.infamy - 20); repAdd(3, '配合王國稽查'); ev('warn', '稽查', `你配合調查，繳了 ${fmt(f)} 金罰款`); return; }
    if (i === 1) { if (chance(.4)) { addFame(-150); infamyAdd(15, '銷毀帳本被發現', true); ev('bad', '稽查', '銷毀帳本的事被發現了，全王國都在罵你的事務所'); } else infamyAdd(5, '銷毀帳本', true); return; }
    jailHero(h, 24, '替事務所頂罪'); adj('trust', -40); S.infamy = Math.max(0, S.infamy - 25); S.accomp = S.accomp || []; S.accomp.push({ d:S.day, t:`讓${h.name}替事務所頂罪` }); },
  vQuit(i){
    if (i === 0) { const c = quitCost(); if (S.gold < c) { sys('錢不夠，對方不收'); return; } S.gold -= c; S.underworld = 0; S.agTasks = S.agTasks.filter(t => !t.ug); ev('good', '抽身', '你付了錢，和地下商會斷了關係'); return; }
    if (i === 1) { const h = H(), u = UG.find(x => x.k === 'ugGuard'); S.agTasks.push({ id:S.day * 100 + 98, ag:u.k, ug:1, inf:u.inf, violent:1, last:1, n:'地下委託：最後一件事', days:1, D:Math.round(power(h) * 1.2), z:2, fame:0, gold:0, share:0, until:S.day + 6 }); S.quitAfter = 1; ev('warn', '抽身', '對方給了最後一件委託，做完就放你走'); return; }
    addFame(-100); infamyAdd(10, '翻臉後，地下商會把你的把柄公開了', true); S.underworld = 0; S.agTasks = S.agTasks.filter(t => !t.ug); ev('bad', '抽身', '你直接翻臉。地下商會把你的把柄公開了'); },
  vWhistle(i, d){ const h = H();
    if (i === 0) { adj('trust', 8); S.agTasks = S.agTasks.filter(t => !t.violent); ev('good', '收手', `你答應${h.name}不再碰這種事`); return; }
    addFame(-120); infamyAdd(12, `${h.name}向公會舉報了事務所`, true); S.underworld = 0; S.agTasks = S.agTasks.filter(t => !t.ug); die(`受不了事務所的黑幕，向公會舉報後離開`, 'left'); },
});
['vCrime', 'vWanted', 'vAudit', 'vQuit', 'vWhistle'].forEach(k => BIG_Q.add(k));

// 名聲的好處：更好的新人（換代、招募）
function fameRecruit(list){
  return list.map(n => {
    if (n.joined != null) return n;   // 旗下藝人不受影響
    if (S.fame >= 450) n.trust = clamp(n.trust + 10, 5, 95);
    if (S.fame >= 1200 && chance(.5)) { const good = ['genius', 'lucky', 'iron', 'social'].filter(p => PERKS[p] && !n.perks.includes(p)); if (good.length) n.perks.push(pick(good)); }
    return n;
  });
}

// ================= v16：旗下藝人、交換主力、勇者之間的關係 =================
// 主力＝S.hero（鏡頭、聊天、完整大事件）；旗下藝人＝S.artists（背景簡化模擬，但保留完整人格）
const AR = () => S.artists || (S.artists = []);
const uidOf = h => h.uid || (h.uid = 'u' + (S.uidN = (S.uidN || 0) + 1));
const arById = id => AR().find(a => a.uid === id);
const allHeroes = () => [H(), ...AR()].filter(Boolean);
const heroBy = id => allHeroes().find(x => uidOf(x) === id);
const A_POLICY = { safe:'穩定賺錢', fame:'衝名聲', rest:'休養', follow:'跟著主力' };
const A_TALK = { cheer:'cheer', meal:'meal', talk:'heart' };   // 藝人的三種互動，和主力共用冷卻（經紀人的時間有限）
const aKnown = (a, k) => (S.day - (a.joined ?? S.day)) >= HEX_REVEAL[k] * 2;   // 藝人相處少，個性看出來要兩倍時間
function aAdj(a, k, v){
  if (a === H()) return adj(k, v);
  if (k === 'stress' && v > 0) v *= T(a).stress * (.7 + .6 * hx(a, 'E'));
  if (k === 'mood' && v < 0 && hasP(a, 'glass')) v *= 1.4;
  if (k === 'trust' && v < 0 && a.trait === 'loyal') v *= .5;
  a[k] = clamp((a[k] || 0) + v, 0, 100);
}
function aExp(a, n){
  if (a === H()) return gainExp(n);
  n *= (hasP(a, 'genius') ? 1.3 : 1) * (.85 + .3 * hx(a, 'C')) * (S.coach ? 1.2 : 1) * (1 + (S.office.gym || 0) * .12);
  const m = relOf(a).find(r => r.t === 'mentor' && r.jr === uidOf(a)); if (m) n *= 1.15;   // 師徒：後輩經驗加成
  if (relOf(a).some(r => r.t === 'rival')) n *= 1.1;
  a.exp += n;
  while (a.exp >= expNeed(a.lv)) { a.exp -= expNeed(a.lv); a.lv++; if (a.lv % 5 === 0) a.log.push({ d:S.day, age:a.age, t:`升到 Lv${a.lv}` }); }
}
const aLog = (a, t) => { a.log = a.log || []; a.log.push({ d:S.day, age:a.age, t }); };
const aSafeZone = a => { let z = 0; for (let i = 0; i <= topZ(); i++) if (ratio(a, zD(i)) >= 1.3) z = i; return z; };
// 跟著主力的藝人，讓主力出任務時戰力加成（好搭檔再多一點）
function followBonus(){
  const fs = AR().filter(a => a.policy === 'follow' && !a.away && !a.bed);
  let b = 0; fs.forEach(a => { b += .08 + (relGet(uidOf(H()), uidOf(a)).t === 'partner' ? .05 : 0); });
  return 1 + Math.min(.25, b);
}

// ---------- 招募 ----------
function artistPool(force){
  if (!force && S.aPool && S.day - (S.aPoolDay || -99) < 6) return S.aPool;
  const h = H(), out = [];
  out.push({ tag:'公會介紹的新人' });
  const fan = npc('fan'); if (fan && fan.alive && fan.age >= 16 && fan.aff >= 40) out.push({ name:fan.name, sex:fan.sex, tag:`崇拜${h.name}的${fan.name}`, trust:80, fanId:fan.id });
  out.push({ tag:'從別村來的流浪者', trust:35 });
  const rv = S.rivals.find(r => (r.hostile || 0) >= 1 || r.fame > S.fame * .8); if (rv) out.push({ tag:`${rv.n}不得志的勇者`, trust:45, lv:ri(4, 10) + rankOf() });
  if ((S.infamy || 0) >= 40) out.push({ tag:chance(.5) ? '剛出獄、走投無路的人' : '有前科、聽說你不問過去', trust:40, shady:1 });
  if (h.child && h.age - (h.child.born ?? 99) >= 16) out.push({ name:h.child.name, sex:h.child.sex, tag:`${h.name}的${h.child.sex === 'm' ? '兒子' : '女兒'}`, trust:75, kid:1 });
  if (hasU('foreign')) out.push({ tag:'從遙遠國度來的勇者', trust:50, lv:ri(10, 20) });
  if (S.fame >= 800) out.push({ tag:'慕名而來的新人', trust:60 });
  const keep = S.rep < 15 ? 1 : S.rep < 30 ? 2 : out.length;
  S.aPool = fameRecruit(out.slice(0, Math.max(1, keep)).map(o => { const a = newHero({ ...o, gen:S.gen }); a.tag = o.tag; if (o.lv) { a.lv = o.lv; } if (o.shady) { a.hex.H = Math.min(a.hex.H, ri(10, 35)); a.honest = a.hex.H; a.record = 1; } if (o.fanId) a.fanId = o.fanId;
    a.age = o.kid ? 16 + rand(0, 2) : rand(18, 27); a.trust = clamp(a.trust + (S.rep - 60) / 2, 5, 95); return a; }));
  S.aPoolDay = S.day; return S.aPool;
}
function hireArtist(i){
  const p = artistPool(), a = p[i]; if (!a) return { ok:false, why:'沒有這個人' };
  if (AR().length >= artistSlots()) return { ok:false, why:`名額已滿（${artistSlots()} 位）` };
  p.splice(i, 1); uidOf(a); a.joined = S.day; a.policy = 'safe'; a.cut = 30; a.mlog = ''; a.act = 'idle'; a.log = a.log || [];
  if (a.fanId) { const f = npc(a.fanId); if (f) { f.alive = false; f.gone = 'hero'; } delete a.fanId; }
  AR().push(a); ev('good', '簽約', `${a.name}（${a.tag}）成為事務所的旗下藝人`); aLog(a, '加入事務所'); renderAll && renderAll();
  return { ok:true };
}
// 解約／轉讓給對手／退休
function releaseArtist(id, how = 'release'){
  const a = arById(id); if (!a) return;
  S.artists = AR().filter(x => x !== a);
  if (how === 'transfer') { const r = pick(S.rivals); r.fame += 20 + a.lv; S.gold += 150 + a.lv * 40; ev('', '轉讓', `${a.name}轉到${r.n}，對方付了轉讓費`); }
  else if (how === 'retire') { ev('good', '退休', `${a.name}退休了`); }
  else { if (a.trust < 40) repAdd(-3, '解約藝人說事務所壞話'); ev('', '解約', `你和${a.name}解約了`); }
  relDrop(id);
}

// ---------- 每月背景生活 ----------
function artistTick(){
  const h = H();
  // 名額變少：超過的人被迫離開
  while (AR().length > artistSlots()) { const a = AR()[AR().length - 1]; releaseArtist(a.uid, 'release'); if (!offline) ev('bad', '名額', `事務所規模縮小，${a.name}只能離開`); }
  // 階級解鎖的一次性效果
  if (hasU('abroad') && !S.rivals.some(r => r.abroad)) { S.rivals.push({ n:'東方龍門經紀', fame:Math.round(S.fame * .7), abroad:1 }); if (!offline) ev('warn', '新對手', '跨國的「東方龍門經紀」進入王國，開始搶生意'); }
  if (hasU('coach') && S.coachUntil > S.day && S.coachUntil < 1e8) S.coachUntil = 1e9;
  const lines = [];
  AR().slice().forEach(a => {
    uidOf(a); a.age = (a.age || 20) + 1 / 12;
    a.mz = -1;
    if (a.away > 0) { a.away--; a.mz = -9; a.mlog = a.jailed ? '服刑中' : '不在事務所'; if (!a.away && a.jailed) { a.jailed = 0; a.record = 1; } return; }
    if (a.bed > 0) { a.bed--; aAdj(a, 'stress', -6); a.mlog = '養傷中'; lines.push(`${a.name}：養傷中`); return; }
    // 這個月做什麼：方針＋個性
    let act = a.policy;
    if (a.task) act = 'task';
    else if (act !== 'rest' && (a.burn > 80 || a.sta < 20)) act = 'rest';
    else if (act !== 'rest' && (a.trait === 'lazy' || hx(a, 'C') < .3) && chance(.25)) act = 'slack';
    let txt = '';
    if (act === 'rest' || act === 'slack') {
      aAdj(a, 'stress', -10); a.burn = clamp((a.burn || 0) - 8, 0, 100); a.sta = 100; aAdj(a, 'mood', act === 'slack' ? 3 : 5);
      txt = act === 'slack' ? '這個月擺爛，沒接工作' : '休養了一個月';
    } else if (act === 'follow') {
      aExp(a, expNeed(a.lv) * .35); const g = Math.round(40 + a.lv * 12); a.wallet += g; aAdj(a, 'stress', 3); a.burn = clamp((a.burn || 0) + 2, 0, 100);
      relAdd(uidOf(h), uidOf(a), 2.5, 'follow'); a.mz = 'f'; txt = `跟著${h.name}出任務`;
    } else {
      const r = runArtistJob(a, act); txt = r.txt; if (r.dead) return;
    }
    // 抽成與待遇
    if (a.cut > 35) aAdj(a, 'trust', -(a.cut - 35) * .08); else if (a.cut < 20) aAdj(a, 'trust', .4);
    if (a.goal === 'seiko' && a.cut > 25) aAdj(a, 'trust', -.3);
    if (a.goal === 'etf' && a.wallet > 100) a.wallet *= 1.003;
    if (a.stress > 70) aAdj(a, 'mood', -4); if (a.mood < 30) aAdj(a, 'trust', -1);
    a.mlog = txt; lines.push(`${a.name}：${txt}`);
    if (!offline) artistBig(a);
  });
  if (!offline && lines.length) { addMsg('arep', `旗下月報（${lines.length} 位）`); S.msgs[S.msgs.length - 1].L = lines; }
  relTick();
}
// 藝人出一次工作（委託／事務所任務／指派的任務）
function runArtistJob(a, act){
  let z = aSafeZone(a), it = a.task, ag = false;
  if (act === 'fame' && !it) { const pool = S.agTasks.filter(t => !t.exam && !t.ug); if (chance(.6) && pool.length) { it = pool[ri(0, pool.length - 1)]; S.agTasks = S.agTasks.filter(t => t !== it); } else z = Math.min(topZ(), z + 1); }
  if (it && it.kind !== 'offer' && it.ag) ag = true;
  a.task = null; a.mz = ag && MSPOT[it.ag] ? -1 : (it ? it.z : z);
  const D = it ? (it.D || 0) : zD(z) * rand(.9, 1.3);
  const rt = D ? ratio(a, D) : 1.4 + hx(a, 'X') * .2;   // 非戰鬥任務：看個性適不適合
  const p = rt >= 1.3 ? .95 : rt >= .85 ? .7 : .4;
  if (offline) { /* 離線只發生平安的事 */ }
  a.burn = clamp((a.burn || 0) + (act === 'fame' ? 4 : 2) + (a.stress > 70 ? 2 : 0), 0, 100); aAdj(a, 'stress', act === 'fame' ? 6 : 3); a.sta = clamp(a.sta - 25, 0, 100);
  if (offline || chance(p)) {
    aExp(a, expNeed(a.lv) * (ag ? .3 : .5) * (rt < 1.3 ? 1.6 : 1));
    if (ag) {
      if (it.ug) infamyAdd(it.inf || 5, `${a.name}完成「${it.n.replace('地下委託：', '')}」`, true);
      const g = it.gold || 0; S.gold += g; finAdd('ag', g); a.wallet += Math.round(g * (it.share || .1)); addFame(it.fame || 0); S.agDone = (S.agDone || 0) + 1; yr().ag++;
      if (it.exam && it.exam > (S.exam || 0)) { const r0 = rankOf(); S.exam = it.exam; const r1 = rankOf(); if (r1 > r0 && !offline) ev('good', '晉升', `${a.name}通過了升格考核！你的事務所升格為「${RANKS[r1][1]}」${unlockMsg(r1)}`); }
      aAdj(a, 'mood', (it.ag === 'variety' || it.ag === 'meet') ? (hx(a, 'X') > .6 ? 6 : -6) : 2);
      return { txt:`完成「${it.n}」，事務所名聲 +${it.fame || 0}` };
    }
    const Z = ZONES[it ? it.z : z], g = it ? it.reward : Math.round(Z.gold * 12 * rand(.9, 1.4) * (1 + rkx() * .25) * (rt < 1.3 ? 1.6 : 1));
    const cut = Math.round(g * a.cut / 100); S.gold += cut; finAdd('cut', cut); a.wallet += g - cut; yr().mis++;   // 藝人完成的委託也算年度配額
    aAdj(a, 'mood', 3);
    return { txt:`完成${Z.n}的委託，賺 ${fmt(g)} 金（事務所抽 ${fmt(cut)}）` };
  }
  // 失敗
  if (it && ag) { aAdj(a, 'mood', -6); if (it.exam) S.examCd = S.day + 6; return { txt:`「${it.n}」失敗了${it.exam ? '，考核要半年後才能再考' : ''}` }; }
  if (rt < .85 && chance(.15)) { artistDie(a, `在${ZONES[z].n}的委託中倒下`); return { txt:'', dead:true }; }
  a.bed = ri(1, 3); a.hp = .6; aAdj(a, 'mood', -8); a.lastHurt = S.day;
  return { txt:`在${ZONES[it ? it.z : z].n}受傷，要休養 ${a.bed} 個月` };
}
function artistDie(a, why){
  S.artists = AR().filter(x => x !== a); aLog(a, why);
  repAdd(-8, '旗下藝人倒下'); addFame(5);
  ev('bad', '噩耗', `旗下藝人${a.name}${why}`);
  // 連帶：交情好的人心情大跌
  allHeroes().forEach(x => { const r = relGet(uidOf(x), a.uid); if (r.v >= 40) { aAdj(x, 'mood', -20); if (r.v >= 60 && x !== H()) x.wantRetire = 1; } else aAdj(x, 'mood', -5); });
  S.wall.push({ happy:0, rel:'旗下藝人', name:a.name, cls:jobName(a), age:Math.floor(a.age), lv:a.lv, end:'戰死', why, gen:a.gen || S.gen, kills:a.kills || 0 });
  relDrop(a.uid);
}
// 藝人的重大事件（整頁）：想離開、被挖角、醜聞
function artistBig(a){
  if (S.q) return;
  if ((a.trust < 20 || a.burn > 90 || a.wantRetire) && chance(.35)) { ask('aLeave', `（旗下藝人${a.name}來找你：「老闆，我想${a.wantRetire ? '退休了' : '離開事務所'}。」）`, ['好好談，給他放長假', '降低抽成到 20%', '好，讓他走'], { id:a.uid }, 2); return; }
  if (a.cut > 35 && a.trust < 50 && chance(.06)) { const r = pick(S.rivals); ask('aPoach', `（${r.n}私下接觸旗下藝人${a.name}，開出比較好的條件）`, ['降低抽成留住他', '相信他會留下', '想走就走'], { id:a.uid, r:S.rivals.indexOf(r) }, 2); return; }
  const w = (1 - hx(a, 'H')) * .5 + (1 - hx(a, 'A')) * .3 + (hasP(a, 'drinker') ? .3 : 0);
  if (chance(.012 * w)) { const t = pick([['酒後鬧事', 20], ['在市集跟人打架', 25], ['被拍到放商會鴿子', 15]]); ask('aScandal', `（旗下藝人${a.name}${t[0]}，記者阿哲已經在問了）`, ['公開道歉', '切割', '力挺'], { id:a.uid, f:t[1] }, 2); }
}

// ---------- 交換主力 ----------
const EMERGENCY = ['jail', 'wanted', 'private', 'gone'];
function swapWill(a){   // 藝人願不願意當主力（0–1）；信任 70 以上，UI 才顯示
  let w = .55 + dw(a, 'status') * .35 + (hx(a, 'X') - .5) * .5 - dw(a, 'tranquility') * .4 + (a.trust - 60) / 200;
  if (EMERGENCY.includes(H().act)) w += hx(a, 'O') > .6 ? .1 : -.1;   // 緊急接手：有人當機會，有人當爛攤子
  return clamp(w, .05, .95);
}
function canSwap(id){
  const a = arById(id), h = H(); if (!a) return { ok:false, why:'找不到這位藝人' };
  const emer = EMERGENCY.includes(h.act) || !!h.wanted || !!h.jailed;
  if (S.day - a.joined < 24) return { ok:false, why:`進事務所要滿兩年（還差 ${24 - (S.day - a.joined)} 個月）` };
  if (a.trust < 50) return { ok:false, why:'他對你的信任不到 50' };
  if (a.away || a.bed) return { ok:false, why:'他現在不在或在養傷' };
  if (['dead', 'retired', 'left', 'dying'].includes(h.act)) return { ok:false, why:'主力的人生已經結束，請從換代選人' };
  if (!emer) {
    if (S.day - (S.swapCd ?? -99) < 12) return { ok:false, why:`換角後 12 個月內不能再換（還差 ${12 - (S.day - S.swapCd)} 個月）` };
    if (h.mission || S.queue.length) return { ok:false, why:'主力還在任務中，或排程還沒清空' };
    if (S.q || a.task) return { ok:false, why:'還有沒回覆的事' };
    if (S.agTasks.some(t => t.exam && t.taken) || S.queue.some(t => t.exam) || (h.mission && h.mission.exam)) return { ok:false, why:'升格考核期間不能換人' };
  }
  return { ok:true, emer };
}
function swapMain(id){
  const c = canSwap(id); if (!c.ok) return c;
  const a = arById(id), old = H();
  if (!chance(swapWill(a))) { aAdj(a, 'trust', -2); ev('', '換角', `${a.name}婉拒了：「我現在這樣就好。」`); return { ok:false, why:'他拒絕了' }; }
  uidOf(old);
  // 舊主力的反應
  if (dw(old, 'status') || hx(old, 'X') > .65) { old.mood = clamp(old.mood - 15, 0, 100); old.trust = clamp(old.trust - 12, 0, 100); aLog(old, '被換下主力的位置'); }
  else if (dw(old, 'tranquility')) old.mood = clamp(old.mood + 5, 0, 100);
  // 粉絲反彈：舊主力越紅，名聲小跌越多
  const pop = Math.min(50, Math.round(old.lv * 1.2 + (old.bossKill ? 15 : 0)));
  addFame(-pop); const fan = npc('fan'); if (fan && fan.alive) fan.aff = Math.max(0, fan.aff - 10);
  // 交換位置
  S.artists = AR().filter(x => x !== a);
  old.joined = old.joined ?? old.born; old.policy = 'safe'; [old.cut, a.cut] = [S.cut, a.cut]; S.cut = a.cut; old.cut = old.cut ?? 30;
  old.away = EMERGENCY.includes(old.act) ? Math.max(old.privDays || 0, old.goneDays || 0, old.jailM || 0) : 0; old.act = 'idle'; old.alpha = 1; old.mission = null;
  AR().push(old);
  const born = S.day - Math.floor((S.day - a.joined) / 2);   // 當過藝人的時間算一半的相處
  a.age0 = a.age - (S.day - born) / 12; a.born = born; a.act = 'idle'; a.alpha = 1; a.x = old.x; a.y = old.y; a.tx = old.tx; a.ty = old.ty; a.talked = {}; a.mission = null; a.task = null;
  a.newMainUntil = S.day + 4; a.stress = clamp(a.stress + 15 * (.5 + hx(a, 'E')), 0, 100);
  S.hero = a; S.plan = 0; S.queue = []; S.swapCd = S.day;
  relAdd(uidOf(old), uidOf(a), relGet(uidOf(old), uidOf(a)).t === 'rival' ? -15 : -3);
  ev('warn', '換角', `${a.name}接下主力的位置，${old.name}轉為旗下藝人（粉絲反彈，名聲 -${pop}）`); logLife(`成為事務所的主力`);
  if (!offline) say(pickS(['……我會撐起來的', '換我上場了，對吧']));
  return { ok:true };
}

// ---------- 和藝人互動（和主力共用冷卻） ----------
function talkArtist(id, k, otherId){
  const a = arById(id), h = H(), key = A_TALK[k]; if (!a || !key) return { ok:false };
  if (talkLeft(h, key)) return { ok:false, why:`這個月的時間已經用掉了（還要 ${talkLeft(h, key)} 個月）` };
  if (k === 'meal' && S.gold < 30) return { ok:false, why:'錢不夠' };
  h.talked[key] = S.day;
  if (k === 'cheer') { aAdj(a, 'mood', 8); aAdj(a, 'trust', 2); }
  if (k === 'meal') { S.gold -= 30; aAdj(a, 'mood', 10); aAdj(a, 'stress', -8); aAdj(a, 'trust', 4); }
  if (k === 'talk') {
    if (otherId) {   // 調解兩個人：效果看你和兩人各自的信任
      const b = heroBy(otherId); if (b) { const g = 10 * ((a.trust + b.trust) / 200); relAdd(a.uid, otherId, g); ev('', '調解', `你找${a.name}和${b.name}好好談了一次`); }
    } else { aAdj(a, 'trust', a.trust >= 30 ? 6 : 2); if (a.trust >= 30) a.wantRetire = 0; }
  }
  return { ok:true };
}
function setPolicy(id, p){ const a = arById(id); if (a && A_POLICY[p]) a.policy = p; }
function setArtistCut(id, c){ const a = arById(id); if (!a) return; const o = a.cut; a.cut = clamp(Math.round(c), 0, 60); aAdj(a, 'trust', a.cut > o ? -(a.cut - o) * .4 : (o - a.cut) * .3); }
function assignAg(id, taskId){ const a = arById(id), i = S.agTasks.findIndex(t => t.id === taskId); if (!a || i < 0) return false; a.task = S.agTasks.splice(i, 1)[0]; return true; }

// ---------- 勇者之間的關係 ----------
const relKey = (x, y) => x < y ? x + '|' + y : y + '|' + x;
const relGet = (x, y) => (S.rel || (S.rel = {}))[relKey(x, y)] || { v:0, t:'' };
function relAdd(x, y, v, why){ if (!x || !y || x === y) return; const k = relKey(x, y), r = (S.rel || (S.rel = {}))[k] || (S.rel[k] = { v:0, t:'', f:0 }); r.v = clamp(r.v + v, -100, 100); if (why === 'follow') r.f = (r.f || 0) + 1; }
function relDrop(id){ Object.keys(S.rel || {}).forEach(k => { if (k.split('|').includes(id)) delete S.rel[k]; }); }
function relOf(h){ const id = uidOf(h); return Object.entries(S.rel || {}).filter(([k]) => k.split('|').includes(id)).map(([k, r]) => ({ ...r, other:k.split('|').find(x => x !== id) })); }
const REL_N = { mentor:'師徒', partner:'好搭檔', rival:'競爭對手', love:'戀人', clash:'不合', '':'' };
function relTick(){
  const hs = allHeroes(); if (hs.length < 2) return;
  hs.forEach(uidOf);
  let evOk = !offline && !S.q && S.day >= (S.relEvNext || 0);   // 勇者之間的事件：每 3 個月最多 1 件（重大事件除外）
  for (let i = 0; i < hs.length; i++) for (let j = i + 1; j < hs.length; j++) {
    const x = hs[i], y = hs[j], k = relKey(x.uid, y.uid), r = S.rel[k] || (S.rel[k] = { v:0, t:'', f:0 });
    // 合拍度＋搶同樣的東西
    r.v = clamp(r.v + ((compat(x, y) + compat(y, x)) / 2 - .75) * 3, -100, 100);
    if (dw(x, 'status') && dw(y, 'status')) r.v = clamp(r.v - .8, -100, 100);
    if (x !== H() && y !== H() && Math.abs((x.cut ?? 30) - (y.cut ?? 30)) >= 10) r.v = clamp(r.v - .5, -100, 100);
    const old = r.t, ageGap = Math.abs((x.age || 20) - (y.age || 20)), single = h => !h.partner && !h.loveId;
    let t = '';
    if (r.v <= -40) t = 'clash';
    else if (r.t === 'love' && r.v >= 20) t = 'love';
    else if (r.v >= 60 && single(x) && single(y) && x.age >= 20 && y.age >= 20 && (dw(x, 'romance') || dw(y, 'romance'))) t = 'love';
    else if (r.v >= 30 && ageGap >= 8) t = 'mentor';
    else if (r.v >= 50 && (r.f || 0) >= 6) t = 'partner';
    else if (dw(x, 'status') && dw(y, 'status') && Math.abs(x.lv - y.lv) <= 5) t = 'rival';
    if (t === 'mentor') r.jr = (x.age || 0) < (y.age || 0) ? x.uid : y.uid;
    r.t = t;
    // 關係變化的事件
    if (t !== old) {
      if (old === 'love' && t !== 'love') { x.loveId = y.loveId = null; if (!offline) { const lv = chance(.5) ? x : y; ask('aBreak', `（${x.name}和${y.name}分手了。在同一間事務所很尷尬，${lv.name}說想離開）`, ['好好談，留下他', '讓他走'], { id:lv.uid }, 2); } continue; }
      if (!evOk) continue;
      if (t === 'love') {
        if (S.loveBan) { x.loveId = y.uid; y.loveId = x.uid; r.secret = 1; }
        else { x.loveId = y.uid; y.loveId = x.uid; ev('good', '戀愛', `${x.name}和${y.name}在一起了`); }
      }
      if (t === 'mentor') ev('good', '師徒', `${heroBy(r.jr === x.uid ? y.uid : x.uid).name}開始帶${heroBy(r.jr).name}，像師父帶徒弟一樣`);
      if (t === 'partner') ev('good', '好搭檔', `${x.name}和${y.name}默契越來越好`);
      if (t === 'rival') ev('', '較勁', `${x.name}和${y.name}開始互相較勁`);
      if (t === 'clash') ev('warn', '不合', `${x.name}和${y.name}處不來`);
      if (t) { S.relEvNext = S.day + 3; evOk = false; }
    }
    // 持續的效果
    if (t === 'rival') { aAdj(x, 'stress', 1.5); aAdj(y, 'stress', 1.5); }
    if (t === 'love' && S.loveBan) {   // 戀愛禁令：偷偷交往被拍到，醜聞比較嚴重
      [x, y].forEach(z => { if (dw(z, 'romance')) { aAdj(z, 'mood', -3); aAdj(z, 'trust', -1); } });
      if (!offline && chance(.06)) { addFame(-35); repAdd(-3, '藝人偷偷交往被拍到'); ev('bad', '醜聞', `${x.name}和${y.name}偷偷交往被拍到，記者大寫「事務所禁止戀愛」`); r.secret = 0; }
    }
    if (t === 'clash') {   // 職場霸凌：和善度低的人欺負新人
      const [bully, vic] = hx(x, 'A') < hx(y, 'A') ? [x, y] : [y, x];
      if (hx(bully, 'A') < .35 && (vic.joined ?? vic.born) > (bully.joined ?? bully.born)) {
        aAdj(vic, 'stress', 6);
        if (evOk && !S.q && chance(.25)) { ask('aBully', `（${vic.name}被${bully.name}欺負很久了，今天終於來找你）`, [`處理，訓斥${bully.name}`, '叫他忍一下', '不管'], { b:bully.uid, v:vic.uid }, 2); S.relEvNext = S.day + 3; evOk = false; }
      }
    }
    // 舉報與帶壞（接惡劣系統）
    const [bad, good] = hx(x, 'H') < hx(y, 'H') ? [x, y] : [y, x];
    if (hx(bad, 'H') < .3 && hx(good, 'H') > .7 && r.v < 0 && !S.q && !offline && chance(.03)) { ask('aReport', `（${good.name}私下來找你：「${bad.name}一直在做見不得人的事，你要管嗎？」）`, ['壓下來', '處理'], { b:bad.uid, g:good.uid }, 2); }
    else if (hx(bad, 'H') < .35 && r.v >= 20 && chance(.04)) { good.wallet = Math.max(0, (good.wallet || 0) - ri(20, 80)); aAdj(good, 'stress', 3); good.ledAstray = (good.ledAstray || 0) + 1; if (!offline && chance(.3)) ev('warn', '帶壞', `${bad.name}帶${good.name}去了地下賭場`); }
  }
}
function setLoveBan(on){ if (!!S.loveBan === !!on) return; S.loveBan = on ? 1 : 0; if (on) { repAdd(-3, '事務所禁止戀愛'); allHeroes().forEach(z => { if (dw(z, 'romance')) { aAdj(z, 'mood', -8); aAdj(z, 'trust', -4); } }); ev('', '規定', '事務所開始禁止藝人戀愛'); } else ev('', '規定', '事務所取消戀愛禁令'); }

// ---------- 問答 ----------
Object.assign(QH, {
  aLeave(i, d){ const a = arById(d.id); if (!a) return;
    if (i === 0 && a.trust >= 25) { a.away = 2; a.burn = 30; a.wantRetire = 0; aAdj(a, 'trust', 8); ev('good', '挽留', `${a.name}放了兩個月長假後會回來`); return; }
    if (i === 1) { a.cut = 20; aAdj(a, 'trust', 10); if (a.trust >= 25 && !a.wantRetire) { ev('good', '挽留', `${a.name}決定留下來`); return; } }
    releaseArtist(a.uid, a.wantRetire ? 'retire' : 'release'); },
  aPoach(i, d){ const a = arById(d.id); if (!a) return; const r = S.rivals[d.r] || S.rivals[0];
    const stay = clamp(a.trust / 100 + .25 - (a.burn || 0) / 200 + (i === 0 ? .2 : 0) - (i === 2 ? .2 : 0), 0, 1);
    if (i === 0) a.cut = Math.min(a.cut, 20);
    if (chance(stay)) { aAdj(a, 'trust', 4); ev('good', '挖角', `${a.name}拒絕了${r.n}`); return; }
    r.fame += 30; S.artists = AR().filter(x => x !== a); relDrop(a.uid); ev('bad', '跳槽', `${a.name}被${r.n}挖走了`); },
  aScandal(i, d){ const a = arById(d.id); if (!a) return;
    if (i === 0) { addFame(-Math.round(d.f / 2)); repAdd(1, '藝人醜聞後公開道歉'); aAdj(a, 'mood', -6); }
    else if (i === 1) { addFame(-Math.round(d.f / 3)); repAdd(-8, '醜聞時切割藝人'); aAdj(a, 'trust', -30); if (chance(.4)) { releaseArtist(a.uid, 'release'); return; } }
    else { addFame(-Math.round(d.f * 1.3)); repAdd(4, '醜聞時力挺藝人'); aAdj(a, 'trust', 15); }
    allHeroes().forEach(z => { if (z !== a) aAdj(z, 'stress', 3); });   // 連帶：其他人也被追問
    aLog(a, '爆出醜聞'); },
  aBreak(i, d){ const a = heroBy(d.id); if (!a || a === H()) return; if (i === 0 && a.trust >= 40) { aAdj(a, 'mood', -5); return; } releaseArtist(a.uid, 'release'); },
  aBully(i, d){ const b = heroBy(d.b), v = heroBy(d.v); if (!b || !v) return;
    if (i === 0) { aAdj(b, 'trust', -8); aAdj(v, 'trust', 6); relAdd(d.b, d.v, 15); }
    else if (i === 1) { aAdj(v, 'trust', -6); aAdj(v, 'stress', 5); }
    else { repAdd(-4, '放任職場霸凌'); aAdj(v, 'trust', -10); if (v !== H() && chance(.4)) { releaseArtist(v.uid, 'release'); ev('bad', '離職', `${v.name}受不了，離開了事務所`); } } },
  aReport(i, d){ const b = heroBy(d.b), g = heroBy(d.g); if (!b || !g) return;
    if (i === 0) { S.infamy = clamp((S.infamy || 0) + 5, 0, 100); aAdj(g, 'trust', -12); relAdd(d.b, d.g, -10); }
    else { aAdj(b, 'trust', -10); aAdj(g, 'trust', 6); repAdd(2, '處理藝人的問題'); } },
});

const EVT = { vCrime:['罪行', '#3a1e24'], vWanted:['通緝令', '#3a1e24'], vAudit:['王國稽查', '#2e2a1e'], vQuit:['抽身', '#2a2030'], vWhistle:['吹哨', '#3a1e24'], aLeave:['旗下藝人想離開', '#16303a'], aPoach:['挖角', '#16303a'], aScandal:['醜聞', '#16303a'], aBreak:['分手', '#16303a'], aBully:['職場霸凌', '#16303a'], aReport:['舉報', '#16303a'], draft2:['王國徵召', '#2e2a1e'], kidnap:['急報', '#3a1e24'], raid:['魔物闖村', '#3a1e24'], draft:['徵召令', '#2e2a1e'], love:['心事', '#3a2440'], propose:['求婚', '#3a2440'], scandal:['醜聞', '#2a2a30'], retire:['退休', '#3a2e1e'],
  family:['家書', '#1e2a3a'], plague:['流行病', '#1e2e2a'], crisis:['周轉不靈', '#2e1e1e'], rvPoach:['挖角', '#24203a'], reveal:['真心話', '#2a2440'], tStrat:['武鬥大會', '#2e2a1e'] };
// v14.4：大事件選項的後果提示——他越信任你，說得越清楚
const HINT = {
  draft2:(d, h) => [['他要去邊境，可能受傷', '名聲大跌，他會很感激'], ['駐守 3 個月，危險度看他的實力', '名聲 -80、信任 +8，下次徵召會提早來']],
  draft:(d, h) => [['他要去邊境，可能受傷', '花錢，他會感激', '名聲大跌，他會很感激'], ['駐守 3 個月，危險度看他的實力', `事務所付 ${fmt(d.fine || 0)}、信任 +5`, '名聲 -60、口碑 +4、信任 +8']],
  kidnap:(d, h) => { const dg = d.z != null ? danger(ratio(h, zD(d.z) * 1.25)).n : '有風險'; return [['他可能受傷，也可能救不回來', '花錢，大概救得回來', '朋友可能遇害，他會失望'], [`他親自去，對他來說「${dg}」`, '七成救得回來', '六成會遇害、信任 -6']]; },
  love:(d, h) => { const n = npc(d.id), p = n ? Math.round(clamp(n.aff / 100 + .1, 0, 1) * 100) : 50; return [['成不成看對方的心意', '他會失落、有點不滿', '交給他自己'], [`對方答應的機率約 ${p}%`, '心情 -12、信任 -4（他也可能不聽）', `他會自己去告白，機率約 ${p}%`]]; },
  propose:(d, h) => [['事務所出錢，他會很感激', '他會失落', '用他自己的錢，他會覺得你不夠意思'], ['婚禮辦成、信任 +10', '心情 -10、信任 -5', `他要出 300（他現在有 ${fmt(h.wallet)}）、信任 -2`]],
  retire:(d, h) => [['他會退休，這一代結束', '他會不滿、壓力變大', '他會非常不滿'], ['結局：安穩退休', '信任 -8、壓力 +10，一年後再問你', '信任 -20、心情 -15、壓力 +20']],
  scandal:(d, h) => [['名聲少扣一些，他可能不服氣', '花錢壓新聞，之後可能又爆出來', '他會非常受傷，可能離開', '名聲扣多一點，他會很感激'], ['名聲傷害減半、口碑 +2', '名聲傷害只剩一成，三成機率之後又爆', '信任 -30、口碑 -12，四成機率他會離開', '名聲多扣三成、信任 +15、口碑 +6']],
  family:(d, h) => [['他會趕回去，大概來得及', '可能來不及見最後一面', '他會恨你'], ['回家 4 個月、信任 +8', '一半機率沒趕上：心情 -30、信任 -10', '信任 -20 以上，一半機率家人就這樣走了']],
  rvPoach:(d, h) => { const st = k => Math.round(clamp(h.trust / 100 + .25 - (h.burn || 0) / 200 + (S.cut <= 25 ? .1 : 0) - k, .08, .95) * 100); return [['他一定留下，但你少賺', '看他信不信任你', '他可能真的會走'], ['一定留下、信任 +6，抽成降到 20%', `他留下的機率約 ${st(0)}%`, `他留下的機率約 ${st(.2)}%`]]; },
  plague:(d, h) => [['他會很快好起來', '可能惡化'], ['健康 +40、信任 +6', '三成五機率惡化，嚴重時可能病逝']],
  crisis:(d, h) => [['設施會少一級', '之後每月要還錢', '事務所從頭開始'], ['賣掉等級最高的設施，拿回一半的錢', '拿到 1,500，之後每月還 60，共 2,200', '名聲、設施、代表作全部歸零']],
  reveal:(d, h) => [['他會很開心', '他會受傷', '他會很壓抑'], ['信任 +10、心情 +10', '信任 -8', '心情 -10、壓力 +8，「忠於自己」的遺憾變重']],
  raid:(d, h) => { const r = power(h) / zD(Math.min(topZ(), bestSafeZone() + 1)), p = Math.round(clamp(.35 + r * .4 + (isFr('mayor') ? .1 : 0), .2, .9) * 100); return [['可能受傷，守住了會很有名', '村子可能有人遇害'], [`守住的機率約 ${p}%，失敗會受傷`, '三成五機率有村民遇害']]; },
  tStrat:(d, h) => [['比較不容易受傷', '一般打法', '比較容易贏，也容易重傷'], ['戰力 ×0.9，輸了兩成會受傷', '戰力 ×1，輸了四成會受傷', '戰力 ×1.15，輸了七成會受傷、更容易重傷']],
};
let evShown = null;
function evPage(){
  const q = S.q; if (!q || !BIG_Q.has(q.key) || evShown === q || offline || $('end').classList.contains('on') || $('dying').classList.contains('on')) return;
  evShown = q; const sb = evSubject(q), h = sb || H(), sys0 = q.text.startsWith('（'), [tt, bg0] = EVT[q.key] || ['大事', '#22283a'], bg = sb ? '#16303a' : bg0;
  $('evp').innerHTML = `<div class="evs" style="background:${bg}">${sb ? `<div class="evav" aria-hidden="true">${pimg(sb, EV_EXPR[q.key])}</div>` : `<canvas id="evFace" width="20" height="20" aria-label="${esc(h.name)}的表情"></canvas>`}<div class="evt" style="${sb ? 'background:rgba(20,60,70,.92);border-color:#4fb3c8' : ''}">${sb ? '旗下' : '主力'} · ${esc(h.name)} · ${tt} · 剩 ${Math.max(0, q.until - S.day) + 1} 個月回答</div></div>
    <div class="evb"><div class="evbox">${sys0 ? '' : `<span class="evn px">${esc(h.name)}</span>`}<div>${esc(sys0 ? q.text.replace(/^（|）$/g, '') : q.text)}</div></div>
    ${(() => { const lv = h.trust >= 70 ? 2 : h.trust >= 40 ? 1 : 0, hs = HINT[q.key] ? HINT[q.key](q.data || {}, h) : null;
      const note = !hs ? '' : `<div class="evh">${lv === 2 ? `信任 ${Math.round(h.trust)}：${pron(h)}把話都說清楚了` : lv === 1 ? `信任 ${Math.round(h.trust)}：${pron(h)}只透露了大概` : `信任 ${Math.round(h.trust)}：${pron(h)}沒跟你說心裡話，看不出後果（信任 40 以上才會說）`}</div>`;
      return note + `<div class="evo">${q.opts.map((o, i) => `<button class="opt2" data-ea="${i}"><span>${esc(o)}</span>${hs && lv && hs[lv - 1][i] ? `<small class="${lv === 2 ? 'c' : ''}">${esc(hs[lv - 1][i].replace(/他/g, pron(h)))}</small>` : ''}</button>`).join('')}</div>`; })()}
    <div class="evh" id="evCd" style="color:#b03a30"></div><button class="evl" data-ea="-1">已讀不回（讓${pron(h)}自己決定）</button><button class="evl" id="evLater">先回到畫面，晚點再回答</button></div>`;
  $('evp').classList.add('on'); $('evp').scrollTop = 0; if ($('evFace')) drawFace($('evFace'), EV_EXPR[q.key] || exprOf(h));
  $('evp').querySelectorAll('[data-ea]').forEach(b => b.onclick = () => { $('evp').classList.remove('on'); if (S.q === q) answer(+b.dataset.ea); });
  $('evLater').onclick = () => $('evp').classList.remove('on');
}

// ---------- 底部頁籤 ----------
let sheetT = null, hexSel = null;
const SUBS = {
  hero:[['state', '狀態'], ['mind', '個性'], ['life', '生平'], ['charm', '寶物']],
  people:[['ppl', '身邊'], ['team', '事務所'], ['wall', '歷代'], ['news', '近況'], ['ledger', '人情帳']],   // v17.23：標籤縮短，手機上五個都放得下
  quest:[['queue', '排程'], ['take', '接任務']],
  gear:[['gear', '裝備'], ['care', '照顧'], ['caravan', '商隊'], ['own', '他自己買的']],
  office:[['main', '概況'], ['art', '旗下'], ['comp', '競爭'], ['fac', '設施']],
  set:[['set', '設定']],
};
const sub = {};
const SS = k => (sub[sheetT] || SUBS[sheetT][0][0]) === k;
document.querySelectorAll('nav button').forEach(b => b.onclick = () => { const t = b.dataset.t; if (sheetT === t) closeSheet(); else openSheet(t); });
$('shX').onclick = closeSheet;
$('cap').onclick = () => { if (sheetT === 'hero') closeSheet(); else openSheet('hero', 'state'); };
function openSheet(t, sb){ sheetT = t; if (t === 'quest' && ['ag', 'offer', 'due'].includes(sb)) { S.takeF = sb; sb = 'take'; } if (sb) sub[t] = sb; if (t === 'quest') $('dQuest').classList.remove('on'); if (t === 'office') $('dOffice').classList.remove('on'); document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.t === t)); renderSheet(); $('sheet').style.bottom = $('nav').offsetHeight + 'px'; $('sheet').classList.add('on'); }
let archArm = false;
function closeSheet(){ resetArm = false; archArm = false; artScroll = null; sheetT = null; $('sheet').classList.remove('on'); document.querySelectorAll('nav button').forEach(b => b.classList.remove('on')); }

// ================= v16 介面：旗下藝人、事務所內 =================
let arArm = null, artScroll = null; const arepOpen = new Set();   // 解約要按兩次
const CLS_C = { warrior:'#b5523b', archer:'#4f8a4a', mage:'#6a5ab0', thief:'#4a5a7a' };
let artExp = null, artSub = 'st';
const STAGE_C = ['#8b93a7', '#6fcf97', '#59a8ff', '#c99aff', '#f2c14e'];
function infamyView(){
  const v = Math.round(S.infamy || 0), ac = (S.accomp || []).slice().reverse();
  return `<div class="sec">惡名（地下風評：事務所對外做了多少壞事）</div><div class="card" style="border-color:#6a2a2e;background:#24181c">
    <div class="row"><b style="color:${v >= 60 ? '#ff7b7b' : v >= 30 ? '#ffb347' : '#6b4e33'};font-size:15px">${v >= 60 ? '惡名昭彰' : v >= 30 ? '小有惡名' : '有些傳聞'}</b><span>${v} / 100</span></div>
    <div class="xbar" style="margin-top:6px;background:#3a2a2e"><i style="width:${clamp(v, 2, 100)}%;background:#d0505a"></i></div>
    <div class="k" style="font-size:12px;margin-top:6px">${S.underworld ? '你和地下商會有往來，地下委託會一直送來。' : '目前和地下世界沒有往來。'}惡名會隨時間慢慢下降；60 以上，事務所的稱號會變成地下版本，70 以上可能被王國稽查。</div>
    ${ac.length ? `<details style="margin-top:6px"><summary class="k" style="font-size:12.5px;cursor:pointer">共犯紀錄（${ac.length}）</summary><div style="font-size:12.5px;margin-top:4px;line-height:1.6">${ac.map(x => `${ym(x.d)}：${esc(x.t)}`).join('<br>')}</div></details>` : ''}
    ${S.underworld ? `<button class="btn warn" data-uwq="1" style="width:100%;margin-top:8px" ${S.q ? 'disabled' : ''}>想辦法抽身</button>` : ''}</div>`;
}
function artStatus(a){
  if (a.away) return ['y', '✈', '不在'];
  if (a.bed) return ['r', '✚', '養傷'];
  if (a.wantRetire || a.trust < 25 || a.burn > 85) return ['r', '!', '有事'];
  if (a.task) return ['g', '⚑', '任務'];
  return { rest:['y', 'z', '休養'], follow:['g', '»', '同行'], fame:['g', '★', '衝名聲'], safe:['g', '⚔', '工作'] }[a.policy] || ['g', '⚔', '工作'];
}
function renderArow(){
  const el = $('arow'); if (!el || !S) return;
  el.innerHTML = AR().map(a => { const st = artStatus(a); uidOf(a);
    return `<button class="ahd" data-arow="${a.uid}" aria-label="${esc(a.name)}：${st[2]}"><span class="aav">${pimg(a)}<i class="dot ${st[0]}"></i></span><span class="tx2"><b style="font-weight:500">${esc(a.name)}</b><small><span class="sic">${st[1]}</span>${st[2]}</small></span></button>`; }).join('');
  el.querySelectorAll('[data-arow]').forEach(b => b.onclick = () => { artExp = b.dataset.arow; artSub = 'st'; openSheet('office', 'art'); });
}
function rankReq(i){
  const it = [['名聲', S.fame >= RANKS[i][0], `${fmt(S.fame)}/${fmt(RANKS[i][0])}`], ['代表作', (S.agDone || 0) >= AG_GATE[i], `${S.agDone || 0}/${AG_GATE[i]}`]];
  if (i >= 6) it.push(['魔王', !!S.bossDone, '骸骨魔王']);
  if (examLv(i)) it.push(['考核', (S.exam || 0) >= i, (S.exam || 0) >= i ? '通過' : rankOk(i) ? '可以考了' : '未考']);
  return it.map(([n, ok, d]) => `<span class="${ok ? 'ok' : ''}">${ok ? '✓' : '✗'} ${n} ${d}</span>`).join('');
}
function timeDots(){
  const h = H(); if (!h || !h.talked) return '';
  const free = TALK.filter(t => !talkLeft(h, t.k)).length;
  return `<div class="tdots" aria-label="這個月還能做 ${free} 種互動"><span>經紀人的時間</span>${TALK.map(t => `<i class="${talkLeft(h, t.k) ? '' : 'on'}" title="${t.n}"></i>`).join('')}<b>還能做 ${free}/${TALK.length} 種</b></div>`;
}
function evSubject(q){ const d = q.data || {}, id = d.id || d.v || d.g; const x = id && typeof id === 'string' ? heroBy(id) : null; return x && x !== H() ? x : null; }
function drawArtists(now, view, hm){
  const h = H(), list = AR(); if (!list.length) return;
  const [px, py] = view === 'vil' ? villagePos(h) : [h.x, h.y];
  let fk = 0, vk = 0;
  list.forEach((a, i) => {
    let x, y, lying = !!a.bed;
    if (a.mz === -9) return;
    const ahr = hourOf(), aday = ahr >= 7 && ahr < 18.5, asleep = ahr >= 22.5 || ahr < 6.5; let atk = false, mon = null;   // v17.10
    if (a.mz === 'f') { if (hm !== view || heroHidden(h)) return; fk++; x = px - 15 * fk; y = py + 2 + (fk % 2) * 3; }
    else if (a.mz === -1 || a.mz == null || a.bed || !aday) { if (view !== 'vil' || (asleep && !a.bed)) return; vk++;   // 晚上回村；深夜睡在事務所（看不到）
      if (aday || a.bed) { x = VD.office - 34 + vk * 22 + Math.sin(now / 1700 + i) * 5; y = 150; } else { x = VD.tavern - 24 + vk * 20 + Math.sin(now / 2300 + i) * 14; y = 138 + (vk % 2) * 8; } }
    else { const Z = ZONES[a.mz]; if (!Z || Z.map !== view) return; const [x0, y0, x1, y1] = Z.rect; x = x0 + (x1 - x0) * (.3 + .15 * i) + Math.sin(now / 1300 + i) * 10; y = (y0 + y1) / 2 + Math.cos(now / 1600 + i) * 8;
      const ph = (now / 5200 + i * .37) % 1; mon = { x:x + 15, k:ph > .82 ? 'down' : ph % .2 < .05 ? 'hurt' : 'idle', a:ph > .82 ? 1 - (ph - .82) / .18 : 1 }; atk = ph < .82 && Math.floor(now / 380 + i) % 3 === 0; }   // 打怪動作
    x = Math.round(x); y = Math.round(y);
    if (mon) { ctx.globalAlpha = Math.max(0, mon.a); drawMonster(ctx, zoneMon(a.mz), Math.round(mon.x), y + 4, mon.k, Math.floor(now / 200) % 2, false, true, mon.seed ??= Math.random()); ctx.globalAlpha = 1; }
    ctx.globalAlpha = .95; if (atk) drawSprite(ctx, a, x, y, lying, now, { atk:true, moving:false, left:false }); else drawHero(ctx, x, y, lying, now, a); ctx.globalAlpha = 1;
    if (cam.z > 1.4) nameTag(ctx, a.name, x, y - (lying ? 12 : KEN_TAG), 'artist');
  });
}
const mbar = (n, v, c) => `<div><span>${n}<b style="color:var(--text);font-weight:500">${Math.round(v)}</b></span><div class="xbar"><i style="width:${clamp(v, 2, 100)}%;background:${c}"></i></div></div>`;
function artistCard(a){
  const h = H(), op = artExp === a.uid, st = artStatus(a);
  let o = `<div class="card ac${op ? ' open' : ''}" id="ac_${a.uid}"><button class="arw" data-aexp="${a.uid}" aria-expanded="${op}">
      <span class="av cav">${pimg(a)}<i class="dot ${st[0]}"></i></span>
      <span style="flex:1;min-width:0"><span style="display:flex;justify-content:space-between;gap:6px"><b style="font-size:14.5px">${esc(a.name)}</b><span class="chip ${st[0] === 'g' ? 'g' : st[0] === 'y' ? 'o' : 'r'}"><span class="sic">${st[1]}</span>${st[2]}</span></span>
        <span class="k" style="font-size:12px;display:block">${jobName(a)} Lv${a.lv} · ${A_POLICY[a.policy]}</span>
        <span class="mbs"><i><b style="width:${clamp(a.mood, 2, 100)}%;background:var(--green)"></b></i><i><b style="width:${clamp(a.stress, 2, 100)}%;background:var(--red)"></b></i><i><b style="width:${clamp(a.trust, 2, 100)}%;background:var(--blue)"></b></i></span></span>
      <span class="k" style="font-size:14px;flex:none">${op ? '︿' : '﹀'}</span></button>
    <div class="ml1">${a.mlog ? esc(a.mlog) : '還沒有這個月的消息'}</div>`;
  if (!op) return o + '</div>';
  o += `<div class="subt">${[['st', '狀況'], ['plan', '安排'], ['hr', '人事']].map(([k, n]) => `<button data-asub="${k}" class="${artSub === k ? 'on' : ''}">${n}</button>`).join('')}</div>`;
  if (artSub === 'st') {
    const kk = Object.keys(HEX).filter(k => aKnown(a, k)), known = kk.filter(k => Math.abs(a.hex[k] - 50) >= 10).map(k => hexWord(k, a.hex[k]).replace(/^比較/, ''));
    const nextK = Object.keys(HEX).filter(k => !aKnown(a, k)).sort((x, y) => HEX_REVEAL[x] - HEX_REVEAL[y])[0];
    const rs = relOf(a).map(r => { const x = heroBy(r.other); return x ? `${esc(x.name)}：${r.t === 'love' && r.secret ? '偷偷交往' : REL_N[r.t] || '普通'}（${Math.round(r.v)}）` : ''; }).filter(Boolean);
    o += `<div class="mb">${mbar('心情', a.mood, 'var(--green)')}${mbar('壓力', a.stress, 'var(--red)')}${mbar('信任', a.trust, 'var(--blue)')}</div>
      <div class="lbl">基本</div><div style="font-size:12.5px">${Math.floor(a.age)} 歲 · 進事務所 ${S.day - a.joined} 個月 · ${esc(a.tag || '')}<br>${TRAITS[a.trait].n}・${TRAITS[a.trait2].n} · 自稱${GOALS[a.said].n} · 錢包 ${fmt(a.wallet || 0)} 金</div>
      <div class="lbl">個性</div><div style="font-size:12.5px">${known.length ? known.join('、') : kk.length ? '看得出來的部分都還算平均' : '還看不出他是什麼樣的人'}${nextK ? `<span class="k">（再 ${HEX_REVEAL[nextK] * 2 - (S.day - a.joined)} 個月會多看出一點）</span>` : ''}</div>
      <div class="lbl">事務所裡的關係</div><div style="font-size:12.5px">${rs.join('<br>') || '還沒有特別的交情'}</div>`;
  }
  if (artSub === 'plan') {
    const tl = k => talkLeft(h, A_TALK[k]);
    o += `<div class="lbl">方針</div><div class="segc">${Object.entries(A_POLICY).map(([k, n]) => `<button data-apol="${a.uid}:${k}" class="${a.policy === k ? 'on' : ''}">${n}</button>`).join('')}</div>
      <div class="lbl">抽成</div><div class="cutr"><button class="btn sm2" data-acut="${a.uid}:-5" ${a.cut <= 0 ? 'disabled' : ''} aria-label="降低抽成">−</button><b>${a.cut}%</b><button class="btn sm2" data-acut="${a.uid}:5" ${a.cut >= 60 ? 'disabled' : ''} aria-label="提高抽成">＋</button><span class="k" style="font-size:11.5px;flex:1">${a.cut > 35 ? '太高，他會不滿、容易被挖角' : a.cut < 20 ? '他很感激' : '還算合理'}</span></div>
      <div class="lbl">互動（和${esc(h.name)}共用時間）</div><div class="acts">${[['cheer', '打氣'], ['meal', '請吃飯 30 金'], ['talk', '談談']].map(([k, n]) => `<button class="btn" data-atalk="${a.uid}:${k}" ${tl(k) || a.away ? 'disabled' : ''}>${n}${tl(k) ? `<small>還要 ${tl(k)} 個月</small>` : ''}</button>`).join('')}</div>
      <div class="lbl">指派事務所任務</div>${S.agTasks.length && !a.task && !a.away ? `<div style="display:grid;gap:6px">${S.agTasks.map(t => `<button class="btn" style="text-align:left" data-aas="${a.uid}:${t.id}">${esc(t.n)}<small class="k" style="display:block;font-size:11px">名聲 +${t.fame}${t.D ? ` · 危險度 ${t.D}（他的戰力 ${Math.round(power(a))}）` : ''}${t.exam ? ' · 升格考核' : ''}</small></button>`).join('')}</div>` : `<div class="k" style="font-size:12.5px">${a.task ? `已指派「${esc(a.task.n)}」，下個月出發` : '現在沒有可以指派的任務'}</div>`}`;
  }
  if (artSub === 'hr') {
    const sw = canSwap(a.uid);
    o += `<div class="lbl">換成主力</div><button class="btn ${sw.ok ? 'pri' : ''}" data-aswap="${a.uid}" style="width:100%" ${sw.ok ? '' : 'disabled'}>${sw.ok ? (sw.emer ? `緊急換角：讓${esc(a.name)}接手` : `讓${esc(a.name)}成為主力`) : esc(sw.why)}</button>
      <div class="k" style="font-size:11.5px;margin-top:4px">${sw.ok ? (a.trust >= 70 ? `他願意的機率大約 ${Math.round(swapWill(a) * 100)}%。` : '他還沒跟你說過心裡話，不知道他願不願意。') : ''}條件：進事務所滿兩年、信任 50 以上、本人同意；換完 12 個月內不能再換。${esc(h.name)}會轉為旗下藝人，粉絲可能反彈。</div>
      <div class="lbl">合約</div><div class="acts">
        <button class="btn warn" data-arel="${a.uid}:release">${arArm === a.uid + 'release' ? '再按一次解約' : '解約'}</button>
        <button class="btn" data-arel="${a.uid}:transfer">${arArm === a.uid + 'transfer' ? '再按一次轉讓' : '轉讓給對手'}</button>
        <button class="btn" data-arel="${a.uid}:retire" ${a.age < 35 ? 'disabled' : ''}>${arArm === a.uid + 'retire' ? '再按一次' : '讓他退休'}${a.age < 35 ? '<small>35 歲以上</small>' : ''}</button></div>`;
  }
  return o + '</div>';
}
function artistView(){
  const n = artistSlots(), rk = rankOf(), L = AR().length;
  let o = `<div class="sec">旗下藝人 ${L} / ${n} 位 · 每位每月月費 +25 金</div><div class="slotbar">${[0, 1, 2].map(i => `<i class="${i < L ? 'on' : i >= n ? 'lk' : ''}"></i>`).join('')}</div>`;
  if (!n) return o + `<div class="card k" style="font-size:13px;line-height:1.7">升上「${RANKS[UNLOCK.artist1][1]}」才能收旗下藝人。<br>名聲 ${fmt(S.fame)} / ${fmt(RANKS[UNLOCK.artist1][0])}${rk < 3 ? '，還要通過進入地方階段的考核' : ''}。<br>名額：地方名經紀 1 位、王都經紀公司 2 位、傳說經紀人 3 位。</div>`;
  o += AR().map(artistCard).join('') || `<div class="card k" style="font-size:13px">還沒有旗下藝人。從下面挑一位簽約吧。</div>`;
  if (L < n) {
    const p = artistPool(), nx = 6 - (S.day - (S.aPoolDay || 0));
    o += `<div class="sec">想加入的人（約每半年換一批，${Math.max(1, nx)} 個月後換）${S.rep < 30 ? ' · 口碑太差，來的人變少' : ''}</div>`;
    o += p.map((c, i) => `<div class="card ac"><div class="hd"><span class="av cav">${pimg(c)}</span><div style="flex:1;min-width:0"><div class="nm">${esc(c.name)}</div><div class="sub">${esc(c.tag)}</div></div></div>
      <div style="font-size:12.5px;margin-top:8px">${CLS[c.cls].n} Lv${c.lv} · ${Math.floor(c.age)} 歲 · ${TRAITS[c.trait].n}・${TRAITS[c.trait2].n} · 自稱${GOALS[c.said].n}${c.perks.length ? ' · ' + c.perks.map(x => PERKS[x].n).join('、') : ''}</div>
      <div class="k" style="font-size:11.5px;margin-top:2px">${TRAITS[c.trait].d}</div>
      <button class="btn pri" data-ahire="${i}" style="width:100%;margin-top:8px">簽約</button></div>`).join('') || '<div class="card k" style="font-size:13px">這陣子沒有人想來。</div>';
  } else if (n < 3) o += `<div class="k" style="font-size:12px;margin:4px 2px">名額滿了。升上「${RANKS[n === 1 ? UNLOCK.artist2 : UNLOCK.artist3][1]}」可以再多一位。</div>`;
  o += `<div class="sec">事務所規定</div><div class="grp"><div class="li"><div class="tx"><b>戀愛禁令</b><small>公開的戀情變少，但偷偷交往被拍到，醜聞比較嚴重。重視戀愛的人會不開心，口碑小降</small></div><button class="tgl ${S.loveBan ? 'on' : ''}" data-lban="1" aria-label="戀愛禁令"></button></div></div>`;
  return o;
}
function teamView(){
  const hs = allHeroes(); hs.forEach(uidOf);
  if (hs.length < 2) return `<div class="card k" style="font-size:13px;line-height:1.7">事務所現在只有${esc(H().name)}一位勇者。<br>有了旗下藝人之後，這裡會顯示大家之間的關係：師徒、好搭檔、競爭對手、戀人、不合。</div>`;
  let o = `<div class="sec">勇者之間的交情</div><div class="grp">`;
  for (let i = 0; i < hs.length; i++) for (let j = i + 1; j < hs.length; j++) {
    const x = hs[i], y = hs[j], r = relGet(x.uid, y.uid), v = Math.round(r.v || 0), c = v >= 30 ? 'var(--green)' : v <= -30 ? 'var(--red)' : '#8b93a7';
    const a = x === H() ? y : x, other = a === x ? y : x;
    const tn = r.t === 'love' && r.secret ? '偷偷交往' : REL_N[r.t] || (v >= 30 ? '處得不錯' : v <= -30 ? '有點摩擦' : '普通');
    o += `<div class="pr2"><div class="nm"><b style="font-weight:500">${esc(x.name)}${x === H() ? '（主力）' : ''} ↔ ${esc(y.name)}${y === H() ? '（主力）' : ''}</b><div class="k" style="font-size:11.5px">${tn} · 交情 ${v}</div></div>
      <div class="rbx"><i style="${v >= 0 ? `left:50%;width:${v / 2}%` : `right:50%;width:${-v / 2}%`};background:${c}"></i></div>
      ${v < 0 ? `<button class="btn sm2" data-med="${a.uid}:${other.uid}" ${talkLeft(H(), 'heart') ? 'disabled' : ''}>調解</button>` : ''}</div>`;
  }
  o += `</div><div class="k" style="font-size:12px;margin:4px 2px 8px">一起出任務會拉近距離；都想當主力、待遇差太多會拉遠。調解用的是「談談」，和主力共用時間。</div>`;
  return o;
}
function renderSheet(){
  const h = H(), B = $('shB'), st = B.scrollTop;
  const title = { hero:H().name, quest:'排程與任務', gear:'花錢', life:'生平', people:'人際', office:'經紀人事務所', set:'設定' }[sheetT];
  $('shT').textContent = title;
  const subDot = { take:S.agTasks.some(o => o.until - S.day <= 2) || $('dQuest').classList.contains('on'), queue:!S.queue.length };
  const inTabs = sheetT === 'hero';
  $('shS').style.display = inTabs ? 'none' : '';
  $('shS').innerHTML = inTabs ? '' : (SUBS[sheetT] || []).length > 1 ? SUBS[sheetT].map(([k, n]) => `<button role="tab" data-s="${k}" class="${SS(k) ? 'on' : ''}">${n}${sheetT === 'quest' && subDot[k] && !SS(k) ? '<i></i>' : ''}</button>`).join('') : '';
  $('shS').querySelectorAll('[data-s]').forEach(b => b.onclick = () => { sub[sheetT] = b.dataset.s; B.scrollTop = 0; renderSheet(); });
  let html = '';
  if (sheetT === 'hero') html += heroCard(h) + `<div class="subs intabs">${SUBS.hero.map(([k, n]) => `<button role="tab" data-s="${k}" class="${SS(k) ? 'on' : ''}">${n}</button>`).join('')}</div>`;
  if (sheetT === 'hero' && SS('state')) {
    const w = h.wish, wp = !w ? 0 : w.k === 'money' ? h.wallet / w.t : (w.k === 'zone' || w.k === 'cnt') ? w.p / w.t : w.k === 'steady' ? (S.day - Math.max(w.from || 0, S.planSet || -99)) / 10 : w.p ? 1 : 0;
    html += w ? `<div class="card" style="background:#2a2418;border-color:#6a5420"><div class="row"><span style="font-size:12px;color:var(--gold)">心願</span><span class="k" style="font-size:12px">剩 ${Math.max(0, w.until - S.day)} 個月</span></div><div style="font-size:14.5px;margin-top:2px">${esc(w.n)}</div><div class="xbar" style="margin-top:6px;background:#3a3420"><i style="width:${clamp(wp * 100, 3, 100)}%;background:var(--gold)"></i></div></div>` : `<div class="card k" style="font-size:13px">目前沒有特別的心願</div>`;
    const cs = chipsOf(h);
    html += `<div class="sec">近況</div><div class="tags" style="margin-bottom:8px">${cs.map(([k, t]) => `<span class="tag ${k === 'g' ? 'g' : ''}" style="${k === 'r' ? 'border-color:var(--red);color:#b03a30' : k === '' ? 'border-color:#8a6a46;color:var(--muted)' : ''}">${t}</span>`).join('') || '<span class="k" style="font-size:12.5px">一切如常</span>'}</div>
      <details class="card" style="line-height:1.7"><summary class="k" style="font-size:12.5px;cursor:pointer">看${pron(h)}現在的樣子（完整描述）</summary><div style="margin-top:6px">${describe(h)}</div></details>`;
    const tg = saveTarget(h), known = h.revealed || h.said === h.goal;
    const showG = h.revealed ? h.goal : h.said;
    html += `<div class="sec">人生目標</div><div class="card"><div class="row"><b>${GOALS[showG].n}</b><span class="k" style="font-size:12px">${h.revealed ? '你已經看清楚了' : `${pron(h)}自己說的`}</span></div><div class="k" style="font-size:12px">${GOALS[showG].d}</div>
      ${!h.revealed && h.clues ? `<div class="dg o" style="font-size:12px;margin-top:4px">你的觀察：有 ${h.clues} 件事跟${pron(h)}說的不太一樣</div>` : ''}
      ${tg && known ? `<div class="row" style="font-size:12.5px;margin-top:6px"><span>${tg.n}</span><span>${fmt(Math.min(h.wallet, tg.t))} / ${fmt(tg.t)}</span></div><div style="height:6px;background:#c9a466;border-radius:3px;margin-top:4px;overflow:hidden"><i style="display:block;height:6px;background:var(--green);width:${Math.min(100, h.wallet / tg.t * 100)}%"></i></div>` : ''}
      ${h.goal === 'filial' && known ? `<div class="k" style="font-size:12px;margin-top:4px">已經寄回老家 ${fmt(h.sentHome || 0)} 金</div>` : ''}
      <div class="k" style="font-size:12px;margin-top:4px">對小孩的想法：${h.partner || h.married ? KIDW[h.kidWish] : '還沒聊過'}${h.house ? ' · 有自己的房子' : ''}</div>
      <div class="k" style="font-size:12px;margin-top:2px">${pron(h)}的錢包：${fmt(h.wallet)} 金</div></div>`;
  }
  if (sheetT === 'hero' && SS('charm')) html += gearSlots(h);
  if (sheetT === 'hero' && SS('mind')) {
    const km = S.day - h.born, ok = k => km >= HEX_REVEAL[k] || (k === 'H' && h.revealed);
    html += hexRadar(h, ok, km);
    { const ks = Object.keys(HEX); if (!hexSel || !ks.includes(hexSel)) hexSel = ks.find(ok) || ks[0]; const k = hexSel, T0 = HEX_TXT[k], v = h.hex[k];
      html += `<div class="card"><div class="hxbtns">${ks.map(x => `<button data-hx="${x}" class="${x === hexSel ? 'on' : ''}">${ok(x) ? HEX_TXT[x].lo + '／' + HEX_TXT[x].hi : '？'}</button>`).join('')}</div>
        <div style="margin-top:10px">${ok(k) ? `<div class="hxr" style="font-size:13px"><span class="s ${v <= 40 ? 'on' : ''}">${T0.lo}</span><span class="hb"><i style="left:${v}%"></i></span><span class="s r ${v >= 60 ? 'on' : ''}">${T0.hi}</span></div><div class="e" style="font-size:12.5px;margin-top:6px;line-height:1.6"><b style="font-weight:500">${hexWord(k, v)}</b>${v >= 60 ? '：' + T0.hiE : v <= 40 ? '：' + T0.loE : '，兩種情況都可能'}</div>` : `<div class="k" style="font-size:12.5px">再相處 ${HEX_REVEAL[k] - km} 個月才看得出來</div>`}</div></div>`; }
    const seen = Object.keys(HEX).filter(k => ok(k) && Math.abs(h.hex[k] - 50) >= 10).map(k => hexWord(k, h.hex[k]).replace(/^比較/, ''));
    const unseen = Object.keys(HEX).filter(k => !ok(k));
    html += `<div class="card sum"><b>${h.name}給人的第一印象：${TRAITS[h.trait].n}、${TRAITS[h.trait2].n}</b><br><span class="k" style="font-size:12.5px">${TRAITS[h.trait].d}；${TRAITS[h.trait2].d}。</span>
      ${seen.length ? `<br>相處下來，你發現${pron(h)}${seen.join('、')}。` : ''}${unseen.length ? `<br><span class="k" style="font-size:12.5px">還有 ${unseen.length} 項要再相處一陣子才看得出來。</span>` : ''}</div>`;
    if (false) html += `<div class="card" style="padding:2px 12px">` + Object.keys(HEX).map(k => { const T0 = HEX_TXT[k], v = h.hex[k];
      if (!ok(k)) return `<div class="hx"><div class="hxr"><span class="s">${T0.lo}</span><span class="hb"><b>？</b></span><span class="s r">${T0.hi}</span></div><div class="e k">再相處 ${HEX_REVEAL[k] - km} 個月才看得出來</div></div>`;
      return `<div class="hx"><div class="hxr"><span class="s ${v <= 40 ? 'on' : ''}">${T0.lo}</span><span class="hb"><i style="left:${v}%"></i></span><span class="s r ${v >= 60 ? 'on' : ''}">${T0.hi}</span></div><div class="e"><b style="font-weight:500">${hexWord(k, v)}</b>${v >= 60 ? '：' + T0.hiE : v <= 40 ? '：' + T0.loE : '，兩種情況都可能'}</div></div>`; }).join('') + '</div>';
    html += `<div class="sec">${pron(h)}最在乎的事（越前面越重要）</div><div class="card" style="padding:2px 12px">` + h.des.map((k, i) => km >= DES_REVEAL[i]
      ? `<div class="hx"><div class="hxr"><b>${i + 1}. ${DESIRES[k].n}</b><span class="k" style="margin-left:8px;font-size:12.5px">${DESIRES[k].d}</span></div><div class="e">會怎樣：${DES_FX[k]}</div></div>`
      : `<div class="hx"><div class="hxr"><b class="k">${i + 1}. ？</b></div><div class="e k">再相處 ${DES_REVEAL[i] - km} 個月才知道</div></div>`).join('') + '</div>';
    html += `<div class="k" style="font-size:12px;margin:2px 2px 8px">年紀越大，通常會越自律、越冷靜。</div>`;
  }
  if (sheetT === 'people' && SS('team')) html += teamView();
  if (sheetT === 'people' && SS('news')) { const nw = (S.news || []).slice().reverse();
    html += `<div class="sec" style="margin-top:2px">村子近況（最近 ${nw.length} 則）</div>` + (nw.length ? `<div class="card">${nw.map(x => `<div class="kv" style="padding:5px 0"><span style="min-width:0">${esc(x.t)}</span><span class="k" style="flex:none;margin-left:8px">${S.day - x.d <= 0 ? '這個月' : (S.day - x.d) + ' 個月前'}</span></div>`).join('')}</div>` : '<div class="card k">最近很平靜</div>'); }
  if (sheetT === 'people' && SS('ledger')) {
    const owe = S.npcs.filter(n => n.alive && n.owe), fav = S.queue.filter(it => it.favor), comps = S.npcs.filter(canComp), helped = (h.mem || []).filter(m => m.k === 'helped').slice(-5).reverse();
    const pa = h.partner && npc(h.partner), sick = S.npcs.filter(n => n.alive && (n.sick || 0) > S.day && n.aff >= 35);
    html += `<div class="sec" style="margin-top:2px">欠${h.name}錢的人</div><div class="card">${owe.length ? owe.map(n => `<div class="kv"><span>${esc(n.name)}</span><span>${fmt(n.owe.g)} 金 · <span class="${n.owe.due - S.day <= 1 ? 'dg o' : 'k'}">說好 ${Math.max(0, n.owe.due - S.day)} 個月內還</span></span></div>`).join('') : '<div class="k">沒有人欠錢</div>'}</div>`;
    html += `<div class="sec">答應要幫的忙</div><div class="card">${fav.length ? fav.map(it => `<div class="kv"><span>${esc(it.n)}</span><span class="k">${dueTxt(it.until)}</span></div>`).join('') : '<div class="k">目前沒有</div>'}</div>`;
    html += `<div class="sec">生病中的朋友</div><div class="card">${sick.length ? sick.map(n => `<div class="kv"><button class="lnk" data-npc="${n.id}">${esc(n.name)}</button><span class="dg r">還要 ${n.sick - S.day} 個月</span></div>`).join('') : '<div class="k">大家都很健康</div>'}</div>`;
    html += `<div class="sec">可以找來一起出任務的人</div><div class="card">${comps.length ? comps.map(n => `<div class="kv"><button class="lnk" data-npc="${n.id}">${esc(n.name)}</button><span><span class="dg g">戰力 +${Math.round(n.pw * 100)}%</span>${compCost(n) ? ` · 傭金 ${fmt(compCost(n))}` : ''}</span></div>`).join('') : '<div class="k">還沒有，交情到「朋友」以上才願意同行</div>'}</div>`;
    if (helped.length) html += `<div class="sec">${h.name}幫過的人</div><div class="card">${helped.map(m => `<div class="kv"><span>${esc(m.n)}</span><span class="k">${ym(m.d)}</span></div>`).join('')}</div>`;
    if (pa && pa.alive) html += `<div class="k" style="font-size:12px;margin:2px 2px 8px">${h.name}的${h.married ? '伴侶' : '戀人'}：${esc(pa.name)}</div>`;
  }
  if (sheetT === 'people' && SS('ppl')) {
    const live = S.npcs.filter(n => n.alive).sort((a, b) => (b.id === h.partner) - (a.id === h.partner) || b.aff - a.aff), gone = S.npcs.filter(n => !n.alive).slice(-8);
    { const nw = (S.news || []).slice(-2).reverse(); if (nw.length) html += `<button class="card lnkc" data-ps="news" style="width:100%;text-align:left;display:block;margin-top:2px"><span class="k" style="font-size:11.5px">村子近況 ›</span>${nw.map(x => `<div style="font-size:13px;margin-top:2px">${esc(x.t)}</div>`).join('')}</button>`; }
    html += `<div class="sec">${h.name}身邊的人（${live.length}）· 點頭像看詳細和請客</div><div class="pgrid">` + live.map(n => { const rc = n.id === h.partner ? '#e88aa8' : n.dark || n.role === 'rival' ? '#ff7b7b' : n.aff >= 50 ? '#6fcf97' : n.aff >= 25 ? '#8b93a7' : '#4a5470';
      const bg = { tavern:'#d0607a', smith:'#5a5a5a', guild:'#3f6ea0', priest:'#8a8a8a', mayor:'#7a4a2a', reporter:'#4a8a8a', fan:'#c08a30', merc:'#6a3a3a', elder:'#6a5ab0', rival:'#8a3a3a', rival2:'#5a5aa0', merchant:'#4a4a3a' }[n.role] || (n.sex === 'f' ? '#9a5a80' : '#4a7a5a');
      return `<button class="pt" data-npc="${n.id}"><span class="pa" style="background:${bg};box-shadow:0 0 0 2px ${rc}">${pimg(n, (n.sick || 0) > S.day ? 'sick' : 'normal')}${(n.sick || 0) > S.day ? '<i class="ps">病</i>' : ''}</span><b>${esc(n.name)}</b><span class="pr" style="color:${rc}">${relWord(n)}</span></button>`; }).join('') + '</div>';
    if (gone.length) html += `<div class="k" style="font-size:12px;margin:8px 2px">已經不在：${gone.map(n => `${n.name}（${relWord(n)}）`).join('、')}</div>`;
    html += `<div class="k" style="font-size:12px;margin:2px 2px 8px">交情到「朋友」以上，就能找${pron(h)}們一起出任務。請客可以拉近關係。</div>`;
  }
  if (sheetT === 'quest' && SS('queue')) {
    html += dutyCard(h);
    // 每天方針：區域卡
    const tz = topZ(), cards = [['休息', null, '#3a4a5a', -1], ...ZONES.slice(0, tz + 1).map((Z, i) => [Z.n, danger(ratio(h, zD(i))), Z.c, i])];
    html += `<div class="sec" style="margin-top:2px">沒排程時，每天去哪（${pron(h)}不一定會照做）</div><div class="hscroll zrow">` + cards.map(([n, d, c, z], i) =>
      `<button class="zc ${S.plan === i ? 'on' : ''}" data-p="${i}"><span class="zb" style="background:${c}"></span><b>${n}</b><span class="dg ${d ? d.k : 'g'}">${d ? d.n : '回復體力'}</span>${d && d.i ? `<span class="k" style="font-size:11px">收穫 ×${RISK_MUL[d.i]}</span>` : ''}</button>`).join('')
      + (tz + 1 < ZONES.length ? `<div class="zc lock"><span class="zb" style="background:${ZONES[tz + 1].c}"></span><b>${ZONES[tz + 1].n}</b><span class="k" style="font-size:11px;line-height:1.35">未開放：${ZGATE[tz + 1].t}</span></div>` : '') + '</div>';
    // 排程時間軸
    const eta = etaList(), busyD = h.act === 'mission' ? Math.max(0, h.actDays) : (h.bedDays || 0) + (h.visit || 0) + (h.goneDays || 0);
    html += `<div class="sec">排程（${S.queue.length}/${Q_MAX}）· ${pron(h)}閒下來就照順序做，可能跟你談條件</div>${calStrip(h, eta)}<div class="qline">`;
    if (busyD > 0) html += `<div class="qi now"><span class="qd" style="background:var(--gold)"></span><div class="qw">現在 ～ 第 ${busyD} 個月</div><div class="qt2">${esc(ACT_TXT(h))}</div></div>`;
    S.queue.forEach((it, i) => { const d = it.kind === 'rest' ? null : danger(ratio(h, it.D) * compMul(it.comp)), st = eta[i] - S.day, en = st + estDays(h, it) - 1, late = it.until && eta[i] > it.until;
      html += `<div class="qi ${late ? 'late' : ''}"><span class="qd" style="background:${it.kind === 'rest' ? '#59a8ff' : d ? ['#6fcf97', '#ffb347', '#ff7b7b'][d.i] : '#6fcf97'}"></span>
        <div class="qw">第 ${st}${en > st ? `～${en}` : ''} 個月${late ? ' · <b class="dg r">會趕不上期限</b>' : it.until ? ` · <span class="${it.until - S.day <= 1 ? 'dg r' : ''}">${dueTxt(it.until)}</span>` : ''}</div>
        <div class="row" style="align-items:flex-start"><div style="min-width:0"><div class="qt2">${esc(it.n)}</div><div class="k" style="font-size:12px">${it.kind === 'rest' ? '休息一個月' : `${it.kind === 'ag' ? '事務所任務' : '委託'} · ${durTxt(h, it)}`}${d ? ` · <span class="dg ${d.k}">${d.n}</span>` : ''}${it.comp && npc(it.comp) ? ` · 和${npc(it.comp).name}同行` : ''}${it.favor ? ' · 人情' : ''}${it.agreed ? ' · 已談妥' : ''}${it.by === 'hero' ? ' · <span class="dg g">' + pron(h) + '自己排的</span>' : ''}</div></div>
        <span style="display:flex;gap:4px;flex:none">${i ? `<button class="btn sm2" data-q="up" data-i="${i}" aria-label="往前移">↑</button>` : ''}<button class="btn sm2" data-q="del" data-i="${i}" aria-label="移除">✕</button></span></div></div>`; });
    for (let i = S.queue.length; i < Q_MAX; i++) html += `<div class="qi empty"><span class="qd"></span><div class="row"><button class="qadd" data-go="take">＋ 接任務</button>${i === S.queue.length ? `<button class="qadd" data-rest="1">＋ 排一個月休息</button>` : ''}</div></div>`;
    html += '</div>';
    if (!S.queue.length) html += `<div class="k" style="font-size:12px;margin:-4px 2px 8px">排程是空的，${pron(h)}會照上面的方針自己安排每天</div>`;
    // 自主權（收起來）
    const pol = S.autonomy || 'ask', PN = { mine:'由我安排', ask:'可以，先問我', free:'完全放手' };
    html += `<details class="card"><summary style="font-size:13px;cursor:pointer;display:flex;justify-content:space-between"><span>${pron(h)}可以自己接任務嗎？</span><b style="color:var(--gold);font-weight:500">${PN[pol]} ›</b></summary>
      <div class="grid3" style="margin-top:10px">` + Object.keys(PN).map(k => `<button class="plan ${pol === k ? 'on' : ''}" data-auto="${k}" style="min-height:44px;text-align:center"><b style="font-size:13px">${PN[k]}</b></button>`).join('') + `</div><div class="k" style="font-size:12px;margin-top:6px">放手越多，${pron(h)}越覺得在過自己的人生，但也可能挑你不想要的任務。累了${pron(h)}也會自己排休。</div></details>`;
  }
  if (sheetT === 'quest' && SS('take')) {
    const F = S.takeF || 'all', all = [...S.agTasks.map(o => [o, true]), ...S.offers.map(o => [o, false])];
    const cnt = { all:all.length, offer:S.offers.length, ag:S.agTasks.length, due:all.filter(([o]) => o.until && o.until - S.day <= 2).length };
    html += `<div class="ff2">${[['all', '全部'], ['offer', '委託'], ['ag', '事務所'], ['due', '快到期']].map(([k, n]) => `<button class="${F === k ? 'on' : ''}" data-tf="${k}">${n} ${cnt[k]}</button>`).join('')}</div>`;
    const list = all.filter(([o, ag]) => F === 'all' || (F === 'ag' ? ag : F === 'offer' ? !ag : o.until && o.until - S.day <= 2)).sort((x, y) => (x[0].until || 1e9) - (y[0].until || 1e9));
    html += list.length ? `<div class="qgrid">${list.map(([o, ag]) => qCard(h, o, ag)).join('')}</div>` : '<div class="card k">這一類目前沒有任務</div>';
    html += `<div class="k" style="font-size:12px;margin:8px 2px">委託每 ${(S.office.intel || 0) >= 2 ? 3 : 5} 個月換一批，${pron(h)}照你的抽成分錢；事務所任務每 6 個月一批，替事務所賺名聲和代表作，${pron(h)}只拿一成。點卡片安排出發成員。</div>`;
  }
  if (false) {
    html += `<div class="sec">事務所任務（替事務所賺名聲和代表作，${pron(h)}只拿一成）</div>`;
    if (!S.agTasks.length) html += '<div class="card k">目前沒有事務所任務，每 6 天會有新的</div>';
    if (S.agTasks.length) html += `<div class="hscroll">${S.agTasks.map(o => qCard(h, o, true)).join('')}</div>`;
  }
  if (false) {
    html += `<div class="sec">一般委託（每 5 天換一批，${pron(h)}照你的抽成分錢）</div>`;
    if (!S.offers.length) html += '<div class="card k">目前沒有委託</div>';
    if (S.offers.length) html += `<div class="hscroll">${S.offers.map(o => qCard(h, o, false)).join('')}</div><div class="k" style="font-size:12px">左右滑動看更多，點卡片安排出發成員</div>`;
  }
  if (sheetT === 'gear') {
    { const up = upkeep() + (S.loan ? Math.min(60, S.loan) : 0), mo = up > 0 ? Math.floor(Math.max(0, S.gold) / up) : 99;
      html += `<div class="gbar"><span>金庫 <b style="color:var(--gold)">${fmt(S.gold)}</b></span><span>每月開銷 <b style="color:#b03a30">-${fmt(up)}</b></span><span class="${mo < 6 ? 'dg r' : 'k'}">不賺錢還撐 ${mo >= 99 ? '很久' : mo + ' 個月'}</span></div>`; }
    if (SS('gear')) html += shopView(h);
    if (SS('own')) { const bs = (h.buys || []).slice(-20).reverse();
      html += `<div class="k" style="font-size:12px;margin:4px 0 8px">${pron(h)}會用自己的錢買裝備、藥水、看病、進修，買多少看${pron(h)}的人生目標（${GOALS[h.goal].n}）。${pron(h)}的錢包：${fmt(h.wallet)} 金</div>`;
      html += bs.length ? `<div class="card">${bs.map(b => `<div class="kv"><span>${esc(b.t)}</span><span class="k" style="flex:none;margin-left:8px">${ym(b.d)}</span></div>`).join('')}</div>` : '<div class="card k">還沒有自己買過東西</div>'; }
    if (SS('caravan')) html += caravanView(h);
    if (SS('care')) {
      const docC = 80 + h.lv * 20, coachC = 150 + h.lv * 40, sv = (p, c) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" aria-hidden="true">${p}</svg>`;
      const cards = [];
      const card = (ic, col, t, eff, code, price, why) => cards.push(`<div class="svc"><div class="si" style="background:${col}22">${sv(ic, col)}</div><b>${t}</b><div class="k" style="font-size:12px;line-height:1.45">${eff}</div>${why ? `<div class="dg o" style="font-size:11.5px">${why}</div>` : ''}<button class="btn" data-b="${code}" ${why || S.gold < price ? 'disabled' : ''}>${fmt(price)}${!why && S.gold >= price ? `<span class="k" style="font-size:11px;margin-left:4px">剩 ${fmt(S.gold - price)}</span>` : ''}</button></div>`);
      card('<path d="M12 21s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.5-7 10-7 10z"/>', '#ff7b7b', '看醫生', `健康大幅回復，傷勢少躺一個月（目前健康 ${Math.round(h.health)}）`, 'd', docC, h.health > 95 && !h.bedDays ? '現在很健康，不用看' : '');
      card('<path d="M6 4v16M18 4v16M3 8h3M18 8h3M3 16h3M18 16h3M6 12h12"/>', '#59a8ff', '請教練特訓 2 個月', '經驗大增，但很累', 'c', coachC, !['idle', 'rest', 'home'].includes(h.act) ? `${pron(h)}現在走不開` : '');
      if (hasP(h, 'scar') || hasP(h, 'side')) { const rc = 1500 + h.lv * 80, ok = (S.office.clinic || 0) >= 3, what = hasP(h, 'scar') ? '舊傷' : '後遺症';
        card('<path d="M4 12h16M12 4v16"/>', '#6fcf97', `復健療程`, `治好${what}，要在醫務室躺 3 個月${hasP(h, 'scar') && !hasP(h, 'lame') ? `（不治的話，再 ${Math.max(0, 60 - (S.day - (h.lastHeavy ?? h.born)))} 個月沒受重傷也會好）` : ''}`, 'rehab', rc, !ok ? '醫務室升到 Lv3 才能做' : busyAway(h) ? `${pron(h)}現在不在` : ''); }
      if (hasP(h, 'lame')) { const aid = h.aid || 0;
        if (aid < 2) card('<path d="M8 3v18M8 12h8l2 9"/>', '#ffb347', ['拐杖', '魔導義足'][aid], `跛腳治不好，但能減輕：戰力 ${['-15% → -10%', '-10% → -5%'][aid]}，走路也比較快`, 'aid', [300, 2000][aid], '');
        else cards.push(`<div class="svc"><b>魔導義足</b><div class="k" style="font-size:12px">已經裝上，跛腳只剩戰力 -5%</div></div>`); }
      if (h.addict) card('<path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/>', '#c99aff', '送神殿戒癮', `艾琳修女會陪${pron(h)}戒掉魔藥，要休養 2 個月`, 'rehab', 600, '');
      card('<circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10h4a1.5 1.5 0 010 3h-3a1.5 1.5 0 000 3h4"/>', '#f2c14e', `給${pron(h)}零用錢`, `${pron(h)}的錢包：${fmt(h.wallet)} 金（${h.wallet < 20 ? '快空了' : h.wallet < 150 ? '還夠用' : '很充裕'}）`, 'm', 100, '');
      html += `<div class="sec">花錢照顧${pron(h)}</div><div class="svgrid">${cards.join('')}</div>`;
    }
  }
  const lifeIs = k => sheetT === 'hero' && SS('life') && (S.lifeT || 'log') === k;
  if (sheetT === 'hero' && SS('life')) html += `<div class="ff2">${[['log', '年表'], ['mem', '回憶'], ['regret', '遺憾']].map(([k, n]) => `<button class="${(S.lifeT || 'log') === k ? 'on' : ''}" data-lt="${k}">${n}</button>`).join('')}</div>`;
  if (lifeIs('log')) {
    const rg = regrets(h), hp = happyOf(rg), worst = rg.filter(r => r.lv).sort((a, b) => b.lv - a.lv)[0], wn = (h.mem || []).filter(m => m.k === 'wishOk').length;
    html += `<div class="card" style="margin-top:4px"><div class="row k" style="font-size:12px"><span>18 歲</span><span>現在 ${Math.floor(h.age)} 歲</span><span>50 歲</span></div><div class="lifebar"><i style="width:${clamp((h.age - 18) / 32 * 100, 2, 100)}%"></i></div>
      <div class="tags" style="margin-top:4px"><span class="tag g">幸福感 ${hp}</span>${worst ? `<span class="tag" style="border-color:var(--red);color:#b03a30">遺憾：${worst.n.replace(/^沒有/, '沒').slice(0, 10)}</span>` : ''}<span class="tag b">心願達成 ${wn} 次</span></div></div>`;
    html += `<div class="sec">${h.name}的人生</div>`;
    const LF = [['all', '全部', null], ['glory', '榮耀', '#f2c14e'], ['hurt', '受傷', '#ff7b7b'], ['love', '感情', '#e88aa8'], ['gain', '收穫', '#6fcf97']], lf = S.lifeF || 'all', lc = (LF.find(x => x[0] === lf) || [])[2];
    html += `<div class="ff2">${LF.map(([k, n, c]) => `<button class="${lf === k ? 'on' : ''}" data-lf="${k}">${c ? `<i style="display:inline-block;width:8px;height:8px;border-radius:4px;background:${c};margin-right:5px"></i>` : ''}${n}</button>`).join('')}</div>`;
    const logs = [...h.log].reverse().filter(e => !lc || lifeColor(e.t) === lc);
    html += logs.length ? `<div class="tline">${logs.map(e => `<div class="te"><span class="dot2" style="background:${lifeColor(e.t)}"></span><div class="ag">${Math.floor(e.age)} 歲</div><div class="tx">${esc(e.t)}</div></div>`).join('')}</div>` : `<div class="k">${lc ? '這一類還沒有發生過' : '還沒有發生值得記下的事'}</div>`;
  }
  if (lifeIs('mem')) {
    const GOOD = ['saved', 'gift', 'wishOk', 'familyOk', 'backed'], BAD = ['forced', 'used', 'wishFail', 'familyNo', 'familyLate', 'betrayed'];
    const ms = [...(h.mem || [])].reverse().map(m => [m, memText(m)]).filter(x => x[1]);
    const grp = (keys, t, c, empty) => { const xs = ms.filter(([m]) => keys ? keys.includes(m.k) : !GOOD.includes(m.k) && !BAD.includes(m.k));
      return `<div class="sec" style="color:${c}">${t}（${xs.length}）</div>` + (xs.length ? xs.map(([m, t2]) => `<div class="memc" style="border-left-color:${c}"><div class="k" style="font-size:11.5px">${ym(m.d)}</div><div>「${esc(t2)}」</div></div>`).join('') : `<div class="k" style="font-size:12.5px;margin-bottom:8px">${empty}</div>`); };
    const g = ms.filter(([m]) => GOOD.includes(m.k)).length, bd = ms.filter(([m]) => BAD.includes(m.k)).length;
    html += `<div class="card" style="margin-top:4px;font-size:13px;line-height:1.6">${h.name}記得的事會影響${pron(h)}怎麼看你。感激 <b style="color:#2f7a3a">${g}</b> 件、心結 <b style="color:#b03a30">${bd}</b> 件。${bd > g ? `<br><span class="dg o">${pron(h)}對你有點心結，信任比較難建立。</span>` : g > bd ? `<br><span class="dg g">${pron(h)}記得你對${pron(h)}的好。</span>` : ''}</div>`;
    html += grp(GOOD, '感激你的事', '#6fcf97', '還沒有') + grp(BAD, '心裡的結', '#ff7b7b', '還沒有，很好') + grp(null, '人生的記憶', '#59a8ff', '還沒有特別的回憶');
  }
  if (lifeIs('regret')) {
    const rg = regrets(h), hp = happyOf(rg), TIP = ['讓' + pron(h) + '多自己做決定：放寬「自己接任務」、少硬排' + pron(h) + '不想做的事', '多排休息，別讓' + pron(h) + '連續工作太久', '多回應' + pron(h) + '說的話，少「已讀不回」，偶爾關心一下', '讓' + pron(h) + '交朋友：請客、帶朋友一起出任務', '照顧' + pron(h) + '的心情：心願、稱讚、請喝一杯'];
    html += `<div class="card" style="margin-top:4px;text-align:center"><div class="k" style="font-size:12px">如果${pron(h)}的人生現在結束，幸福感會是</div><div class="px" style="font-size:40px;color:${hp >= 80 ? '#2f7a3a' : hp >= 60 ? '#a8681a' : '#b03a30'}">${hp}</div><div class="k" style="font-size:12px">每個遺憾扣 10～20 分，結局時會寫進勇者牆</div></div>`;
    html += rg.map((r, i) => { const c = ['#6fcf97', '#ffb347', '#ff7b7b'][r.lv];
      return `<div class="rgc"><div class="row"><b style="font-size:14px">${r.n}</b><span style="font-size:12px;color:${c}">${['沒有遺憾', '有點遺憾', '很遺憾'][r.lv]}</span></div><div class="pips" style="margin:6px 0"><i class="on" style="background:${c}"></i><i class="${r.lv >= 1 ? 'on' : ''}" style="${r.lv >= 1 ? 'background:' + c : ''}"></i><i class="${r.lv >= 2 ? 'on' : ''}" style="${r.lv >= 2 ? 'background:' + c : ''}"></i></div><div class="k" style="font-size:12.5px">${r.why}</div>${r.lv ? `<div style="font-size:12.5px;margin-top:4px;color:#6b4e33">怎麼改善：${TIP[i]}</div>` : ''}</div>`; }).join('');
  }
  if (sheetT === 'people' && SS('wall')) {
    html += `<div class="sec">歷代勇者</div>`;
    if (!S.wall.length) html += '<div class="k">還沒有前人。你現在帶的是第一代。</div>';
    else html += `<div class="wline">` + [...S.wall].map((w, i) => { const ec = /戰死|離世/.test(w.end) ? '#ff7b7b' : /離開/.test(w.end) ? '#ffb347' : /傳奇/.test(w.end) ? '#c9b6ff' : '#6fcf97';
      return `${i ? `<div class="wrel">${esc(w.rel || '公會介紹的新人')}</div>` : ''}<div class="wc"><span class="wa">${esc(w.name.slice(0, 1))}</span><div style="flex:1;min-width:0"><div class="row"><b class="px" style="font-weight:400;font-size:16px">${esc(w.name)}</b><span class="tag" style="border-color:${ec};color:${ec}">${esc(w.end)}</span></div>
        <div class="k" style="font-size:12px">第 ${w.gen} 代 · ${esc(w.cls)} · Lv${w.lv} · ${w.age} 歲</div>${w.happy != null ? `<div class="row" style="font-size:12px;margin-top:4px"><span>幸福感</span><span>${w.happy}</span></div><div class="xbar"><i style="width:${w.happy}%;background:${w.happy >= 80 ? '#6fcf97' : w.happy >= 60 ? '#ffb347' : '#ff7b7b'}"></i></div>` : ''}
        <div style="font-size:12.5px;margin-top:4px;color:#6b4e33">${esc(w.why)}</div></div></div>`; }).join('') + `<div class="wrel">${esc(h.rel || '')}</div><div class="wc now"><span class="wa" style="background:var(--gold);color:#12161f">${esc(h.name.slice(0, 1))}</span><div><b class="px" style="font-weight:400;font-size:16px">${esc(h.name)}</b><div class="k" style="font-size:12px">第 ${h.gen} 代 · 現在 · Lv${h.lv} · ${Math.floor(h.age)} 歲</div></div></div></div>`;
  }
  if (sheetT === 'office') {
    const rk = rankOf(), nx = RANKS[rk + 1];
    if (SS('main')) {
    html += `<div class="rankc"><div class="rb3"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#12161f" stroke-width="2" aria-hidden="true"><path d="M3 21V9l9-6 9 6v12"/><path d="M9 21v-6h6v6"/></svg></div><div style="flex:1;min-width:0">
      <div style="font-size:12px;color:#e0c89a">等級 ${rk + 1} / ${RANKS.length}<span class="stg">${STAGES[stageOf(rk)]}階段</span></div><div class="px" style="font-size:21px">${rankName(rk)}</div>
      <div class="lad" aria-label="15 級階梯">${RANKS.map((_, i) => `<i class="${i <= rk ? 'on' : ''}${i === rk ? ' cur' : ''}${i && i % 3 === 0 ? ' gap' : ''}" style="--c:${STAGE_C[stageOf(i)]}" title="${RANKS[i][1]}"></i>`).join('')}</div>
      ${nx ? `<div style="font-size:12px;color:#6b4e33;margin-top:6px">升格「${nx[1]}」還需要：</div><div class="rq">${rankReq(rk + 1)}</div><div style="font-size:12px;color:#2f7a3a;margin-top:5px">下一級：${(UNLOCK_TXT[rk + 1] || '委託報酬變高').replace(/^[，。]/, '')}</div>` : '<div style="font-size:12px;color:#6b4e33;margin-top:6px">已經是最高等級</div>'}</div></div>`;
    html += `<div class="tiles"><div class="tile"><b style="color:var(--gold);font-size:16px">${fmt(S.gold)}</b><span>金庫</span></div><div class="tile"><b style="color:var(--blue);font-size:16px">${fmt(Math.round(S.fame))}</b><span>名聲</span></div><div class="tile"><b style="color:${S.rep >= 60 ? '#2f7a3a' : S.rep >= 35 ? '#a8681a' : '#b03a30'};font-size:16px">${Math.round(S.rep)}</b><span>口碑</span></div><div class="tile"><b style="color:#b03a30;font-size:16px">-${fmt(upkeep() + (S.loan ? Math.min(60, S.loan) : 0))}</b><span>每月開銷</span></div></div>`;
    html += `<div class="k" style="font-size:12px;margin:-2px 2px 4px">名聲來自事務所任務、委託、魔王、寶物、心願和守村；醜聞會扣。每升一級，報酬約 +12%。年度配額每個階段多 1 件，旗下藝人完成的委託也算。</div>`;
    if (S.infamySeen) html += infamyView();
    html += finView();
    html += repView();
    html += `<div class="sec">抽成比例：<b style="color:var(--gold)">${S.cut}%</b></div><div class="card"><input type="range" min="10" max="50" step="5" value="${S.cut}" id="cutR" aria-label="抽成比例"><div style="font-size:12.5px;margin-top:4px">${h.name}覺得：「${S.cut <= 15 ? '老闆你是佛心來的吧' : S.cut <= 25 ? '很公道' : S.cut <= 35 ? '還算合理' : S.cut <= 40 ? '有點多……' : '這根本是剝削'}」</div><div class="k" style="font-size:12px;margin-top:2px">抽越多你賺越多，但${pron(h)}會不滿，信任低時可能罷工或接私活</div></div>`;
    }
    if (SS('art')) html += artistView();
    if (SS('comp')) html += rivalView() + eventView(h);
    if (SS('fac')) {
    html += `<div class="sec">事務所設施（金庫 ${fmt(S.gold)}）</div><div class="fgrid">`;
    Object.keys(OFFICE).forEach(k => { const l = S.office[k] || 0, O = OFFICE[k], c = officeCost(k, l);
      html += `<div class="fac"><div class="row"><b style="font-size:14px">${O.n}</b><span class="pips">${[0, 1, 2, 3, 4].map(i => `<i class="${i < l ? 'on' : i >= officeMax() ? 'lk' : ''}"></i>`).join('')}</span></div><div class="k" style="font-size:12px">${l ? O.d(l) : '還沒蓋'}</div>${l < officeMax() ? `<div style="font-size:11.5px;color:#2f7a3a">下一級：${O.d(l + 1)}</div><button class="btn" data-up="${k}" ${S.gold < c ? 'disabled' : ''}>${l ? '升級' : '蓋'} ${fmt(c)}</button>` : `<button class="btn" disabled>${l >= 5 ? '已滿級' : officeMax() < 4 ? '升上「王室御用經紀」才能再升' : '升上「英雄之家」才能再升'}</button>`}</div>`; });
    html += '</div>';
    }
  }
  if (sheetT === 'set') {
    const cr = cloud.remote, newer = cr && (cr.at || 0) > (S.lastSave || 0) + 5 * 60000 && (cr.gen !== S.gen || cr.day !== S.day);
    const cst = newer ? ['new', '雲端有較新進度'] : cloud.state === 'ok' ? ['ok', cloud.at ? '雲端已同步 ' + new Date(cloud.at).toLocaleTimeString('zh-TW', { hour:'2-digit', minute:'2-digit' }) : '雲端已連上'] : cloud.state === 'connecting' ? ['wait', '雲端連線中'] : ['', '只存在這台裝置'];
    const alive = !['dead', 'retired', 'left'].includes(h.act);
    html += `<div class="stHead"><div class="av">🛡️</div><div style="min-width:0;flex:1"><div class="nm">第 ${S.gen} 代 · ${esc(h.name)}</div><div class="k">${rankName()} · ${ym(S.day)}${alive ? '' : ' · 這一代已結束'}</div><span class="stCloud ${cst[0]}"><i></i>${cst[1]}</span></div></div>`;
    html += `<div class="sec">遊戲</div><div class="grp">
      <div class="li"><div class="tx"><b>時間速度</b><small>x1：約現實 60 秒＝1 個月（睡覺時加快）</small></div><div class="segc">${[1, 3, 10].map(v => `<button data-spd="${v}" class="${S.speed === v ? 'on' : ''}">x${v}</button>`).join('')}</div></div>
      <div class="li"><div class="tx"><b>看選單時</b><small>打開下方選單時，時間${['照常走', '放慢成 1/4', '先停住'][pref.sl ?? 1]}</small></div><div class="segc">${[[0, '照常'], [1, '放慢'], [2, '暫停']].map(([v, n]) => `<button data-sl="${v}" class="${(pref.sl ?? 1) === v ? 'on' : ''}">${n}</button>`).join('')}</div></div>
      <div class="li"><div class="tx"><b>暫停</b><small>暫停時${pron(h)}不會過日子</small></div><button class="tgl ${S.paused ? 'on' : ''}" data-pz="1" aria-label="暫停"></button></div>
      <div class="li"><div class="tx"><b>離線時</b><small>每 4 分鐘＝1 個月，最多 15 個月。只發生平安或好的事，不扣配額、不會負債</small></div></div></div>`;
    html += `<div class="sec">顯示</div><div class="grp">
      <div class="li"><div class="tx"><b>文字大小</b><small>影響選單和對話</small></div><div class="segc">${[[0, '標準'], [1, '大']].map(([v, n]) => `<button data-fz="${v}" class="${pref.fz === v ? 'on' : ''}">${n}</button>`).join('')}</div></div>
      <div class="li"><div class="tx"><b>互動飄字</b><small>說話後在地圖上顯示數值和表情</small></div><button class="tgl ${pref.fx ? 'on' : ''}" data-fx="1" aria-label="互動飄字"></button></div></div>`;
    html += `<div class="sec">存檔</div><div class="grp">
      <div class="li col"><div class="row"><div class="tx"><b>雲端存檔</b><small>${cloud.state === 'ok' || cloud.state === 'connecting' ? '存在你的帳號底下，換裝置也找得回來。約每 45 秒、離開畫面時自動存' : '這個畫面不能用雲端存檔（可能沒登入，或在不支援的地方開啟）'}</small></div>${cloud.state === 'ok' ? '<button class="btn sm2" id="bSaveNow">立即存</button>' : ''}</div>
        ${newer ? `<div class="dg r" style="font-size:12.5px;margin-top:8px">雲端有比較新的進度：第 ${cr.gen} 代「${esc(cr.name || '')}」，${ym(cr.day || 0)}</div><button class="btn pri" id="bCloud" style="width:100%;margin-top:6px">載入雲端存檔（會覆蓋這台裝置的進度）</button>` : ''}</div>
      ${(() => { let a = null; try { a = JSON.parse(localStorage.getItem(ARCH_KEY) || 'null'); } catch (e) {} return a && a.js ? `<div class="li col"><div class="tx"><b>清除前的進度</b><small>改版清除舊紀錄時先收起來的：第 ${a.gen || 1} 代「${esc(a.name)}」，${ym(a.day || 0)}。找回會取代現在這一局（現在這一局會先放進備份）</small></div><button class="btn${archArm ? ' warn' : ''}" id="bArch" style="width:100%;margin-top:8px">${archArm ? '再按一次確定找回' : '找回清除前的進度'}</button></div>` : ''; })()}
      <div class="li col"><div class="tx"><b>存檔搬家</b><small id="saveMsg">匯出會得到一串文字，到別的裝置按「匯入」貼上即可</small></div>
        <div class="grid2" style="margin-top:8px"><button class="btn" id="bExp">匯出</button><button class="btn" id="bImpShow">匯入</button></div>
        <textarea id="saveTxt" rows="4" style="width:100%;margin-top:8px;background:#f3e0b2;color:var(--text);border:1px solid #c9a466;border-radius:10px;padding:8px;font-size:12px;display:none" aria-label="存檔文字"></textarea>
        <div class="grid2" id="saveBtns" style="margin-top:6px;display:none"><button class="btn" id="bCopy">複製</button><button class="btn pri" id="bImp">確定匯入</button></div></div></div>`;
    { const inApp = window.matchMedia && (matchMedia('(display-mode: standalone)').matches || navigator.standalone);   // v17.28：從主畫面打開
      html += `<div class="sec">App</div><div class="grp">
      <div class="li"><div class="tx"><b>${inApp ? '正在用 App 模式玩' : '加到主畫面'}</b><small>${inApp ? '有網路時每次打開都會拿最新版；沒網路也能打開上次的版本' : 'iPhone：Safari 下方「分享」→「加入主畫面」。Android：Chrome 右上「⋮」→「加到主畫面」或「安裝應用程式」'}</small></div></div>
      <div class="li"><div class="tx"><b>重新載入最新版</b><small>改完遊戲推上去後，按這裡立刻換新版（會先存檔）</small></div><button class="btn sm2" id="bReload">重新載入</button></div></div>`; }
    html += `<div class="sec">說明</div><div class="grp">
      <div class="li col"><details><summary class="row" style="cursor:pointer"><b style="font-size:14px;font-weight:500">怎麼玩</b><span class="go">›</span></summary><div class="k" style="font-size:12.5px;line-height:1.7;margin-top:6px">你是勇者的經紀人，不能直接操控${pron(h)}。設定方針、接委託、花錢、說話來影響${pron(h)}。${pron(h)}會累、會煩、會受傷、會逃跑，也可能死掉。死亡或退休後，選下一代繼續。</div></details></div>
      <div class="li col"><details><summary class="row" style="cursor:pointer"><b style="font-size:14px;font-weight:500">信任與提示</b><span class="go">›</span></summary><div class="k" style="font-size:12.5px;line-height:1.7;margin-top:6px">${pron(h)}越信任你，大事件的後果提示就說得越清楚：信任 40 以上看得到大方向，70 以上看得到實際機率。聊心事要信任 30 以上才有用。</div></details></div></div>`;
    html += `<div class="sec" style="color:#b03a30">危險區域</div><div class="grp"><div class="li col"><div class="tx"><b>重新開始</b><small>刪除所有紀錄，從第 1 代重新開始。雲端存檔也會被新進度蓋掉</small></div><button class="btn warn" id="bReset" style="width:100%;margin-top:8px">${resetArm ? '再按一次：全部刪除重來' : '重新開始'}</button>${resetArm ? '<button class="btn" id="bResetNo" style="width:100%;margin-top:6px">算了</button>' : ''}</div></div>`;
    html += `<div class="stFoot">孤勇者 v17.39 · 只有你一個人在測試</div>`;
  }
  B.innerHTML = html; B.scrollTop = st;
  B.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { if (+b.dataset.p !== S.plan) { if (dw(h, 'order') && S.day - (S.planSet || -99) < 3) adj('mood', -3); S.planSet = S.day; } S.plan = +b.dataset.p; addMsg('me', S.plan ? `之後主要去${ZONES[S.plan - 1].n}吧` : '這陣子好好休息'); renderAll(); });
  B.querySelectorAll('[data-lt]').forEach(b => b.onclick = () => { S.lifeT = b.dataset.lt; renderSheet(); });
  B.querySelectorAll('[data-ps]').forEach(b => b.onclick = () => { sub.people = b.dataset.ps; B.scrollTop = 0; renderSheet(); });
  B.querySelectorAll('[data-lf]').forEach(b => b.onclick = () => { S.lifeF = b.dataset.lf; renderSheet(); });
  B.querySelectorAll('[data-cv]').forEach(b => b.onclick = () => cvBuy(b.dataset.cv, +b.dataset.cp));
  B.querySelectorAll('[data-tf]').forEach(b => b.onclick = () => { S.takeF = b.dataset.tf; renderSheet(); });
  B.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { sub.quest = b.dataset.go; B.scrollTop = 0; renderSheet(); });
  B.querySelectorAll('[data-o]').forEach(b => b.onclick = () => { const o = S.offers.find(x => x.id === +b.dataset.o); if (o) openMission(o); });
  B.querySelectorAll('[data-ag]').forEach(b => b.onclick = () => { const o = S.agTasks.find(x => x.id === +b.dataset.ag); if (o) openMission(o); });
  B.querySelectorAll('.qcard[role=button]').forEach(c => c.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.click(); } });
  B.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { const i = +b.dataset.i;
    if (b.dataset.q === 'del') { const it = S.queue.splice(i, 1)[0]; if (it && it.by === 'hero') { adj('trust', -3 - dw(h, 'independence') * 3); adj('mood', -3); say(pickS(['……那是我自己排的耶', '好吧，你說了算'])); } if (it && it.kind === 'ag' && S.day < it.until) S.agTasks.push(it); else if (it && it.kind === 'offer') S.offers.push(it); }
    else if (i > 0) { const t = S.queue[i]; S.queue[i] = S.queue[i - 1]; S.queue[i - 1] = t; }
    queueComment(); renderAll(); });
  B.querySelectorAll('[data-rv]').forEach(b => b.onclick = () => rvCounter(+b.dataset.rv, b.dataset.rk));
  B.querySelectorAll('[data-treat]').forEach(b => b.onclick = () => { const n = npc(b.dataset.treat); if (!n || S.gold < 30) return; S.gold -= 30; n.treat = S.day; affAdd(n.id, 4); toast(`${H().name}和${n.name}吃了頓飯`); renderAll(); });
  B.querySelectorAll('[data-auto]').forEach(b => b.onclick = () => { const k = b.dataset.auto, old = S.autonomy || 'ask'; if (k === old) return; S.autonomy = k;
    if (k === 'free') { adj('mood', 3 + dw(h, 'independence') * 5); adj('trust', 2); addMsg('me', '之後你想接什麼就自己接吧'); say(dw(h, 'independence') ? '真的嗎？太好了！' : '好，我會挑適合自己的'); }
    else if (k === 'mine') { if (dw(h, 'independence')) { adj('mood', -6); adj('trust', -3); } addMsg('me', '之後的工作都由我來排'); say(dw(h, 'independence') ? '……又要什麼都聽你的' : '好，聽你安排'); }
    else { addMsg('me', '想接什麼可以，但先問過我'); say('嗯，我會先問你'); }
    renderAll(); });
  B.querySelectorAll('[data-rest]').forEach(b => b.onclick = () => { if (S.queue.length >= Q_MAX) return; S.queue.push({ id:Date.now(), kind:'rest', n:'休息', days:1 }); queueComment(); renderAll(); });
  B.querySelectorAll('.intabs [data-s]').forEach(b => b.onclick = () => { sub[sheetT] = b.dataset.s; renderSheet(); const t = B.querySelector('.intabs'); if (t && B.scrollTop > t.offsetTop) B.scrollTop = t.offsetTop; });
  B.querySelectorAll('[data-npc]').forEach(b => b.onclick = () => openNpcPop(b.dataset.npc));
  B.querySelectorAll('[data-hx]').forEach(b => b.onclick = () => { hexSel = b.dataset.hx; renderSheet(); });
  B.querySelectorAll('[data-b]').forEach(b => b.onclick = () => buy(b.dataset.b));
  const pc = $('pcv'); if (pc) drawPortrait(pc);
  B.querySelectorAll('[data-up]').forEach(b => b.onclick = () => { const k = b.dataset.up, l = S.office[k] || 0, c = officeCost(k, l); if (S.gold < c || l >= officeMax()) return; S.gold -= c; finAdd('office', -c); S.office[k] = l + 1; toast(`${OFFICE[k].n}升到 Lv${l + 1}`); renderAll(); });
  const cr = $('cutR'); if (cr) cr.oninput = () => { const old = S.cut; S.cut = +cr.value; if (S.cut > old) adj('trust', -(S.cut - old) * .4); else adj('trust', (old - S.cut) * .3); renderTop(); cr.parentElement.previousElementSibling.innerHTML = `抽成比例：<b style="color:var(--gold)">${S.cut}%</b>`; };
  if ($('bCloud')) $('bCloud').onclick = () => cloudRestore(cloud.remote.js);
  if ($('bArch')) $('bArch').onclick = () => { if (!archArm) { archArm = true; renderSheet(); return; } archRestore(); };
  const ta = $('saveTxt');
  if ($('bExp')) $('bExp').onclick = () => { save(); ta.style.display = ''; $('saveBtns').style.display = ''; $('bImp').style.display = 'none'; $('bCopy').style.display = '';
    try { ta.value = btoa(unescape(encodeURIComponent(JSON.stringify(S)))); $('saveMsg').textContent = '這串文字就是你的存檔，按「複製」或自己全選複製'; } catch (e) { $('saveMsg').textContent = '匯出失敗'; } ta.select(); };
  if ($('bImpShow')) $('bImpShow').onclick = () => { ta.style.display = ''; ta.value = ''; $('saveBtns').style.display = ''; $('bCopy').style.display = 'none'; $('bImp').style.display = ''; $('saveMsg').textContent = '把存檔文字貼進上面，再按「確定匯入」。目前的進度會被覆蓋'; ta.focus(); };
  if ($('bCopy')) $('bCopy').onclick = () => { ta.select(); try { navigator.clipboard.writeText(ta.value).then(() => toast('已複製'), () => toast('請手動全選複製')); } catch (e) { toast('請手動全選複製'); } };
  if ($('bImp')) $('bImp').onclick = () => { const raw = ta.value.trim(); if (!raw) return;
    try { let o; try { o = JSON.parse(decodeURIComponent(escape(atob(raw)))); } catch (e) { o = JSON.parse(raw); }
      if (!o || !o.hero || !(o.v === 1 || o.v === 2)) throw new Error('bad');
      noSave = true; localStorage.setItem(SAVE_KEY, JSON.stringify(migrate(o))); toast('匯入成功，重新載入中'); setTimeout(() => location.reload(), 600);
    } catch (e) { $('saveMsg').textContent = '這串文字不是有效的存檔，請確認有完整複製'; } };
  B.querySelectorAll('[data-spd]').forEach(b => b.onclick = () => { S.speed = +b.dataset.spd; renderTop(); renderSheet(); });
  B.querySelectorAll('[data-pz]').forEach(b => b.onclick = () => { S.paused = !S.paused; renderTop(); renderSheet(); });
  B.querySelectorAll('[data-fz]').forEach(b => b.onclick = () => { prefSet('fz', +b.dataset.fz); renderSheet(); });
  B.querySelectorAll('[data-sl]').forEach(b => b.onclick = () => { prefSet('sl', +b.dataset.sl); renderSheet(); renderTop(); });
  B.querySelectorAll('[data-fx]').forEach(b => b.onclick = () => { prefSet('fx', pref.fx ? 0 : 1); renderSheet(); });
  if ($('bReload')) $('bReload').onclick = async () => { save(); try { const r = navigator.serviceWorker && await navigator.serviceWorker.getRegistration(); if (r) await r.update(); } catch (e) {} location.reload(); };
  if ($('bSaveNow')) $('bSaveNow').onclick = () => { save(); cloudSave(JSON.stringify(S), true); toast('存好了'); };
  if ($('bResetNo')) $('bResetNo').onclick = () => { resetArm = false; renderSheet(); };
  B.querySelectorAll('[data-uwq]').forEach(b => b.onclick = () => { if (!quitUnderworld()) toast('現在不行，先回覆其他事'); renderAll(); });
  B.querySelectorAll('[data-aexp]').forEach(b => b.onclick = () => { artExp = artExp === b.dataset.aexp ? null : b.dataset.aexp; artSub = 'st'; renderSheet(); });
  B.querySelectorAll('[data-asub]').forEach(b => b.onclick = () => { artSub = b.dataset.asub; renderSheet(); });
  if (sheetT === 'office' && SS('art') && artExp && artScroll !== artExp) { artScroll = artExp; const el = $('ac_' + artExp); if (el) B.scrollTop = el.offsetTop - 8; }
  B.querySelectorAll('[data-apol]').forEach(b => b.onclick = () => { const [id, p] = b.dataset.apol.split(':'); setPolicy(id, p); renderSheet(); });
  B.querySelectorAll('[data-acut]').forEach(b => b.onclick = () => { const [id, d] = b.dataset.acut.split(':'), a = arById(id); if (a) setArtistCut(id, a.cut + +d); renderSheet(); });
  B.querySelectorAll('[data-atalk]').forEach(b => b.onclick = () => { const [id, k] = b.dataset.atalk.split(':'), r = talkArtist(id, k); toast(r.ok ? ({ cheer:'你替他打氣', meal:'你請他吃了一頓', talk:'你們好好談了一次' }[k]) : (r.why || '現在不行')); renderAll(); });
  B.querySelectorAll('[data-aas]').forEach(b => b.onclick = () => { const [id, t] = b.dataset.aas.split(':'); if (assignAg(id, +t)) toast('已指派，下個月出發'); renderAll(); });
  B.querySelectorAll('[data-aswap]').forEach(b => b.onclick = () => { const r = swapMain(b.dataset.aswap); if (!r.ok) toast(r.why || '換不成'); renderAll(); });
  B.querySelectorAll('[data-arel]').forEach(b => b.onclick = () => { const [id, how] = b.dataset.arel.split(':'); if (arArm !== id + how) { arArm = id + how; renderSheet(); return; } arArm = null; releaseArtist(id, how); renderAll(); });
  B.querySelectorAll('[data-ahire]').forEach(b => b.onclick = () => { const r = hireArtist(+b.dataset.ahire); if (!r.ok) toast(r.why); renderAll(); });
  B.querySelectorAll('[data-lban]').forEach(b => b.onclick = () => { setLoveBan(!S.loveBan); renderAll(); });
  B.querySelectorAll('[data-med]').forEach(b => b.onclick = () => { const [a, o] = b.dataset.med.split(':'), r = talkArtist(a, 'talk', o); if (!r.ok) toast(r.why || '現在不行'); renderAll(); });
  const rb = $('bReset'); if (rb) rb.onclick = () => { if (!resetArm) { resetArm = true; renderSheet(); return; } noSave = true; try { localStorage.removeItem(SAVE_KEY); localStorage.setItem('guyongzhe_reset', '1'); } catch (e) {} location.reload(); };
}
let resetArm = false;
// v14.5：顯示偏好（存在這台裝置，跟遊戲進度分開，重新開始不會清掉）
const PREF_KEY = 'guyongzhe_pref';
const pref = (() => { try { return Object.assign({ fz:0, fx:1, sl:1 }, JSON.parse(localStorage.getItem(PREF_KEY) || '{}')); } catch (e) { return { fz:0, fx:1, sl:1 }; } })();
const MENU_MUL = [1, .25, 0];   // v17.23：看選單時 照常／放慢／暫停
const menuMul = () => sheetT ? MENU_MUL[pref.sl ?? 1] : 1;
function prefSet(k, v){ pref[k] = v; try { localStorage.setItem(PREF_KEY, JSON.stringify(pref)); } catch (e) {} applyPref(); }
function applyPref(){ $('app').classList.toggle('fz1', pref.fz === 1); }
applyPref();
function describe(h){
  const a = [];
  a.push(h.sta < 25 ? '累得眼睛都快睜不開' : h.sta < 50 ? '有點疲倦' : '精神還不錯');
  a.push(h.mood < 25 ? '心情跌到谷底' : h.mood < 45 ? '悶悶不樂' : h.mood > 75 ? '心情很好' : '心情普通');
  a.push(h.stress > 80 ? '壓力大到快爆炸' : h.stress > 55 ? '壓力不小' : '還算放鬆');
  a.push(h.trust < 25 ? `不太相信你說的話` : h.trust > 70 ? '很信任你' : '對你還算信任');
  if (h.health < 60) a.push('身體狀況不太好');
  const ps = h.perks.map(p => `「${PERKS[p].n}」${PERKS[p].d}`).join('；');
  return `${h.name}${a.join('，')}。<br><span class="k" style="font-size:12px">個性：${TRAITS[h.trait].n}——${TRAITS[h.trait].d}；${TRAITS[h.trait2].n}——${TRAITS[h.trait2].d}${ps ? '<br>特質：' + ps : ''}</span>`;
}
function buy(k){ const g0 = S.gold; buy0(k); finAdd('shop', S.gold - g0); }
function buy0(k){
  const h = H();
  if (k === 'rehab') { if (!h.addict || S.gold < 600) return; S.gold -= 600; h.addict = 0; h.bedDays = (h.bedDays || 0) + 2; affAdd('priest', 5); adj('trust', 6); ev('good', '戒癮', `${h.name}住進神殿，由艾琳修女陪著戒魔藥`); logLife('在神殿戒掉魔藥'); return; }
  if (k === 'w') { if (h.wpn >= 3) return; const p = quote(WPN.price[h.wpn + 1], 'agent').p; if (S.gold < p) return; S.gold -= p; h.wpn++; adj('trust', 6); adj('mood', 10); say(`${WPN.n[h.wpn]}${WNAME[h.cls]}！謝謝老闆！`); logLife(`經紀人送了${WPN.n[h.wpn]}${WNAME[h.cls]}`); remember('gift'); affAdd('chen', 6); }
  if (k === 'a') { if (h.arm >= 3) return; const p = quote(ARM.price[h.arm + 1], 'agent').p; if (S.gold < p) return; S.gold -= p; h.arm++; affAdd('chen', 4); adj('trust', 4); say(`穿上${ARM.n[h.arm]}，安心多了`); }
  if (k === 'p') { if (S.gold < POT_PRICE || h.pots >= POT_MAX) return; S.gold -= POT_PRICE; h.pots++; }
  if (k === 'd') { const c = 80 + h.lv * 20; if (S.gold < c) return; S.gold -= c; h.health = clamp(h.health + 35, 0, 100); if (h.bedDays > 0) h.bedDays--; adj('trust', 3); sys('你帶' + pron(h) + '去看了醫生'); }
  if (k === 'c') { const c = 150 + h.lv * 40; if (S.gold < c) return; S.gold -= c; h.trainDays = 2; setAct('train'); h.tx = 250; h.ty = 255; say(h.trait === 'lazy' ? '咦……特訓？非去不可嗎' : '特訓！來吧！'); }
  if (k === 'rehab') { const c = 1500 + h.lv * 80; if (S.gold < c || (S.office.clinic || 0) < 3) return; const what = hasP(h, 'scar') ? 'scar' : 'side'; if (!hasP(h, what)) return;
    S.gold -= c; h.perks = h.perks.filter(x => x !== what); h.bedDays = Math.max(h.bedDays, 3); setAct('bed'); adj('trust', 6); adj('mood', 8);
    ev('good', '復健', `${h.name}做完復健療程，${what === 'scar' ? '舊傷' : '後遺症'}治好了`); logLife(`做了復健療程，治好${what === 'scar' ? '舊傷' : '後遺症'}`); say('謝謝老闆……我還以為這輩子都好不了了'); }
  if (k === 'aid') { const aid = h.aid || 0, c = [300, 2000][aid]; if (aid >= 2 || S.gold < c) return; S.gold -= c; h.aid = aid + 1; adj('trust', 5); adj('mood', 6);
    ev('good', '輔具', `你幫${h.name}買了${['', '拐杖', '魔導義足'][h.aid]}`); say(h.aid === 1 ? '有了拐杖，走路輕鬆多了' : '這個義足好厲害，幾乎跟以前一樣了'); }
  if (k === 'm') { if (S.gold < 100) return; S.gold -= 100; h.wallet += 100; adj('trust', 4); adj('mood', 5); say('欸？給我的？謝啦！'); }
  renderAll();
}

// ---------- 上方按鈕 ----------
$('bPause').onclick = () => { S.paused = !S.paused; renderTop(); };

$('bSpeed').onclick = () => { S.speed = S.speed === 1 ? 3 : S.speed === 3 ? 10 : 1; renderTop(); };
let toastT = null;
function toast(t){ const el = $('toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 1600); }

