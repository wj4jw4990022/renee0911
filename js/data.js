// 孤勇者 · data.js：基本設定、資料表（區域、職業、個性、天賦、寶物、事務所等級、NPC）
// 這幾個檔案共用同一個全域範圍，要照 index.html 裡的順序載入
'use strict';
// ================= 基本設定 =================
const SAVE_KEY = 'guyongzhe_v1';
const DAY_SEC = 76;            // v17.16：一天是完整 24 小時（6:00 到隔天 6:00），正常速度要 76 秒；勇者睡著時約 3 倍速，所以 x1 一個月約現實 60 秒
const STEP = 1.5 * (DAY_SEC / 24) / (30 / 18);   // 戰鬥結算間隔跟著一天的長度放大，每個月打怪的次數和收穫不變（只在白天 7:00～18:30）
// v6.3：一天的時間。每個「遊戲日」代表那個月裡典型的一天，從清晨 6:00 走到半夜 24:00
const hourOf = () => 6 + ((S && S.t) || 0) / DAY_SEC * 24;   // 6～30：24 以後是隔天凌晨 0～6 點
function clockTxt(hr){
  const w = hr < 8 ? '清晨' : hr < 11 ? '上午' : hr < 13 ? '中午' : hr < 17 ? '下午' : hr < 19 ? '傍晚' : hr < 22.5 ? '晚上' : hr < 24 ? '深夜' : '凌晨';
  const H24 = Math.floor(hr) % 24, m = Math.floor((hr % 1) * 6) * 10, h12 = H24 % 12 || 12;
  return `${w} ${h12}:${String(m).padStart(2, '0')}`;
}
const MSPOT = { endorse:[250, 266], variety:[250, 266], meet:[250, 266], arena:[205, 266], trial:[338, 266], smith:[250, 266], coach:[205, 266], charity:[250, 266], banquet:[250, 266], patrol:[250, 266] };
const heroHidden = h => ['gone', 'private', 'visit'].includes(h.act) || (h.act === 'mission' && h.mission && (h.mission.ag === 'spy' || (h.mission.ug && hourOf() >= 20 && hourOf() < 24)));
const NIGHT_ACTS = ['idle', 'rest', 'home', 'strike', 'drink', 'train', 'side'];
// v6.4：特定時段才會發生的事件。每天早上排定（約四成機率），時間到了才觸發
const busyAway = h => !!h.mission || ['bed', 'gone', 'private', 'visit', 'dying'].includes(h.act);
const TEV = [
  { k:'dawnRun', at:[6.2, 6.8], cond:h => (hx(h, 'C') > .6 || dw(h, 'physical')) && h.sta > 40 && !busyAway(h),
    fire:h => { gainExp(expNeed(h.lv) * .08); adj('sta', -5); ev('good', '早起練功', `${h.name}天還沒亮就起來練功`); } },
  { k:'hangover', at:[6.3, 7.5], cond:h => h.drankYesterday && !busyAway(h),
    fire:h => { adj('sta', -15); adj('mood', -4); ev('warn', '宿醉', `${h.name}宿醉頭痛，賴床賴到快中午`); say('頭好痛……昨天到底喝了多少'); } },
  { k:'sendoff', at:[6.2, 6.9], cond:h => h.act === 'mission' && h.mission && h.actDays === h.mission.days && (h.mission.ag === 'border' || (h.mission.D && danger(ratio(h, h.mission.D)).i >= 1)),
    fire:h => { adj('mood', 6); adj('stress', -5); S.npcs.forEach(n => { if (n.alive && n.role !== 'rival') n.aff = clamp(n.aff + 1, 0, 100); }); ev('good', '送行', `天剛亮，村民們聚在村口替${h.name}送行`); } },
  { k:'lunch', at:[11.8, 12.5], cond:h => h.partner && npc(h.partner) && npc(h.partner).alive && h.act === 'hunt' && h.zone >= 0,
    fire:h => { const p = npc(h.partner); adj('mood', 5); adj('stress', -5); affAdd(p.id, 2); ev('good', '便當', `${p.name}把便當送到${ZONES[h.zone].n}給${h.name}`); } },
  { k:'storm', at:[13.5, 16], cond:h => h.act === 'hunt',
    fire:h => { adj('mood', -3); ev('warn', '雷陣雨', '午後突然下起大雷雨');
      if (h.goal === 'health' || hx(h, 'O') < .5) { goHome(); say('雨太大了，先回去'); } else { adj('sta', -8); if (chance(.15)) { h.act = 'idle'; injure('light', '在大雨中滑倒'); } else say('這點雨算什麼！'); } } },
  { k:'robbed', at:[18.6, 19.4], cond:h => h.wallet > 150 && ['hunt', 'home'].includes(h.act),
    fire:h => { if (power(h) > zD(0) * 3 && chance(.6)) { adj('mood', 6); ev('good', '擊退', `回村的路上遇到攔路搶劫，${h.name}把強盜打跑了`); }
      else { const l = Math.round(h.wallet * rand(.2, .5)); h.wallet -= l; adj('mood', -8); adj('stress', 6); ev('bad', '搶劫', `${h.name}在回村的路上被搶走 ${fmt(l)} 金`); } } },
  { k:'date', at:[18.8, 20], cond:h => h.partner && npc(h.partner) && npc(h.partner).alive && !busyAway(h),
    fire:h => { const p = npc(h.partner); affAdd(p.id, 4); adj('mood', 8); adj('stress', -8); ev('good', '約會', `${h.name}和${p.name}在河邊散步看夕陽`); } },
  { k:'tavern', at:[20, 22], cond:h => (h.act === 'drink' || hx(h, 'X') > .6 || hasP(h, 'drinker')) && !busyAway(h),
    fire:h => { h.drankTonight = 1; const al = S.npcs.filter(n => n.alive && n.role !== 'rival'); if (al.length) affAdd(pick(al).id, 6); adj('mood', 4); adj('stress', -4);
      ev('good', '酒館之夜', `${h.name}在酒館跟大家喝到很晚`); if (hx(h, 'E') > .6 && chance(.25) && !h.pendingSc) revealScandal('drunk'); } },
  { k:'insomnia', at:[23, 23.6], cond:h => h.stress > 70 && !busyAway(h),
    fire:h => { adj('sta', -10); ev('warn', '失眠', `${h.name}翻來覆去睡不著`); say(pickS(['睡不著……一閉上眼就想到那些怪物', '老闆，你睡了嗎？'])); } },
  { k:'paparazzi', at:[23, 23.8], cond:h => S.fame > 120 && (h.partner || hx(h, 'X') > .6 || (hx(h, 'X') < .35 && S.fame > 800)) && !h.pendingSc && !busyAway(h),
    fire:h => { if (chance(.4) && !S.q) revealScandal('affair'); else ev('warn', '狗仔', '有記者整晚守在旅館外面，想拍到什麼'); } },
  { k:'nightRaid', at:[23.2, 23.9], cond:h => h.lv >= 5 && !busyAway(h) && !S.q && S.day >= (S.raidCd || 0),
    fire:h => { ev('bad', '魔物闖村', '半夜，一群魔物闖進了村子'); ask('raid', pick(['半夜魔物闖進村子了！我要去幫忙守村！', '外面有好多魔物！我去幫忙！', '魔物在撞村子的柵欄……我要出去嗎？', '村子被襲擊了，我不能坐著不管！']), ['去吧，小心點', '躲起來，別逞強'], {}, 1); S.raidCd = S.day + 40; } },
];
function planTimed(){
  S.tev = null; if (offline || !chance(.4)) return;
  const h = H(), ok = TEV.filter(e => { try { return e.cond(h); } catch (err) { return false; } });
  // 白天會變的狀態（例如晚上才在酒館），也讓它有機會被排到
  ['tavern', 'insomnia', 'nightRaid', 'paparazzi'].forEach(k => { if (!ok.some(e => e.k === k) && chance(.3)) ok.push(TEV.find(e => e.k === k)); });
  if (!ok.length) return;
  const wt = e => e.k === 'dawnRun' ? .4 : e.k === 'nightRaid' ? .5 : 1;
  let r = Math.random() * ok.reduce((a2, e) => a2 + wt(e), 0), e = ok[0];
  for (const x of ok) { r -= wt(x); if (r <= 0) { e = x; break; } }
  S.tev = { k:e.k, at:rand(e.at[0], e.at[1]) };
}
const sleeping = () => hourOf() >= 22.5 && NIGHT_ACTS.includes(H().act);
const START_AGE = 18;
const OFF_MIN_PER_DAY = 4;     // 離線時：現實 4 分鐘＝ 1 天
const OFF_MAX_DAYS = 15;
const OFF_MAX_NOCLK = 3;
// v17.97：後期——裝備強化（最高級之後再鍛造 +1～+10）、勇者年紀變大戰力下降
const FORGE_MAX = 10;
const forgeCost = n => Math.round(1200 * Math.pow(1.45, n));
const FORGE_P = [.95, .9, .85, .75, .65, .55, .45, .35, .28, .2];
const ageMul = h => h && h.age > 35 ? Math.max(.6, 1 - (h.age - 35) * .02) : 1;   // v17.96：連不到伺服器時間時，離線最多補 3 個月

const rand = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rand(a, b + 1));
const recentPick = [];
const pick = a => {
  if (a.length > 1 && typeof a[0] === 'string' && a[0].length > 3) {   // 台詞：最近說過的先不說
    const f = a.filter(x => !recentPick.includes(x)), src = f.length ? f : a, v = src[Math.floor(Math.random() * src.length)];
    recentPick.push(v); if (recentPick.length > 90) recentPick.shift(); return v;
  }
  return a[Math.floor(Math.random() * a.length)];
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const chance = p => Math.random() < p;
const fmt = n => Math.round(n).toLocaleString('en-US');
const $ = id => document.getElementById(id);

// ================= 資料 =================
const zD = z => ZONES[z].D * (S && S.surge > S.day ? 1.5 : 1) * (S && S.weather === 'storm' ? 1.25 : S && S.weather === 'snow' ? 1.1 : 1);
const ZONES = [   // v17.33：mon＝各區代表怪（有菁英版的那隻強敵，和 design/monsters 的圖一致）
  { n:'草原', D:8,   exp:4,  gold:6,  mon:'野豬', rect:[150, 92, 360, 212],  c:'#5c8f47', mc:'#7bd17a', map:'out' },
  { n:'森林', D:45,  exp:14, gold:16, mon:'哥布林', rect:[0, 0, 150, 212],     c:'#2f5a2c', mc:'#9aa0ad', map:'out' },
  { n:'荒地', D:120, exp:40, gold:42, mon:'木乃伊', rect:[150, 0, 360, 92],    c:'#8a7a58', mc:'#e8e2d0', map:'out' },
  { n:'礦坑',   D:220,  exp:72,  gold:75,  mon:'骷髏礦工', rect:[0, 0, 140, 125],    c:'#5a524a', mc:'#a89a88', map:'far' },
  { n:'海岸',   D:380,  exp:125, gold:125, mon:'魚人',   rect:[0, 145, 140, 270],  c:'#c9b27a', mc:'#e0624a', map:'far' },
  { n:'雪山',   D:520,  exp:175, gold:170, mon:'雪怪',     rect:[220, 0, 360, 125],  c:'#dfe7ee', mc:'#f8fbff', map:'far' },
  { n:'魔王城', D:800,  exp:265, gold:255, mon:'黑騎士', rect:[220, 145, 360, 270], c:'#3a2a4a', mc:'#c06cff', map:'far' },
];
const ZGATE = [null, null, null,
  { t:'勇者 Lv12，或事務所升格「新銳經紀人」', ok:h => h.lv >= 12 || rankOf() >= 2 },
  { t:'勇者 Lv22，或事務所升格「地方名經紀」', ok:h => h.lv >= 22 || rankOf() >= 3 },
  { t:'打倒骸骨魔王，而且勇者 Lv30 或事務所是「王都經紀公司」', ok:h => S.bossDone && (h.lv >= 30 || rankOf() >= 6) },
  { t:'打倒骸骨魔王，而且勇者 Lv36 或事務所是「傳說經紀人」', ok:h => S.bossDone && (h.lv >= 36 || rankOf() >= 10) }];
const zoneOpen = z => !ZGATE[z] || !!(S && S.hero && ZGATE[z].ok(S.hero));
const topZ = () => { let z = 2; while (z + 1 < ZONES.length && zoneOpen(z + 1)) z++; return z; };
const BOSS2 = { n:'深淵魔王', D:1200, reward:20000 };
const BOSS = { n:'骸骨魔王', D:300, reward:5000 };
const bossOpen = h => h.lv >= 18 || bestSafeZone() >= 2;   // v17.21：勇者到 Lv18，或荒地打得安全，村長才掛出魔王懸賞
const CLS = {
  warrior:{ n:'戰士', hp:1.35, pw:0.95, A:['狂戰士','戰神'], B:['騎士','聖騎士'], col:'#ef8354' },
  archer: { n:'弓手', hp:1.0,  pw:1.05, A:['遊俠','神射手'], B:['獵人','狙擊手'], col:'#3ec1a8' },
  mage:   { n:'法師', hp:0.8,  pw:1.25, A:['大法師','賢者'], B:['冰法師','寒冰君主'], col:'#a08bff' },
  thief:  { n:'盜賊', hp:0.9,  pw:1.0,  A:['刺客','暗影刺客'], B:['毒師','瘟疫使者'], col:'#8f97b8', gold:1.3 },
};
const TRAITS = {
  brave:   { n:'勇敢', retreat:.15, stress:.8,  obey:.05,  d:'壓力大時不逃，改成硬拚' },
  careful: { n:'謹慎', retreat:.5,  stress:1.15, obey:0,   d:'很少受傷，但壓力大會躲著不出門' },
  greedy:  { n:'貪財', retreat:.3,  stress:1,   obey:0,    d:'沒錢時最容易做壞事，但最會存錢' },
  lazy:    { n:'懶散', retreat:.4,  stress:.9,  obey:-.05, d:'擺爛機率最高，但幾乎不會過勞' },
  hot:     { n:'熱血', retreat:.22, stress:1,   obey:0,    d:'心情起伏最大，大贏大輸' },
  calm:    { n:'冷靜', retreat:.35, stress:.6,  obey:-.1,  d:'壓力累積最慢，但最難被說服' },
  curious: { n:'好奇', retreat:.3,  stress:1,   obey:-.05, d:'常常自己跑去沒去過的地方' },
  loyal:   { n:'忠誠', retreat:.3,  stress:1,   obey:.15,  d:'幾乎不會解約，但會為了你捨命' },
};
const TK = Object.keys(TRAITS);
const PERKS = {
  genius: { n:'天才', d:'經驗 +30%' },
  lucky:  { n:'幸運兒', d:'好事比較常發生' },
  iron:   { n:'皮粗肉厚', d:'受到的傷害 -15%' },
  coward: { n:'怕痛', d:'比較早撤退，也比較容易逃跑' },
  lost:   { n:'路痴', d:'常常迷路' },
  social: { n:'好人緣', d:'交朋友快，瀕死時比較容易有人救' },
  drinker:{ n:'酒鬼', d:'心情差就想喝酒' },
  glass:  { n:'玻璃心', d:'挨罵或失敗時心情掉更多' },
  scar:   { n:'舊傷', d:'同一個地方再受重傷就會殘疾；5 年沒再受重傷會自己好，也可以做復健療程', bad:1 },
  lame:   { n:'跛腳', d:'戰力 -15%、走得慢；治不好，但輔具可以減輕', bad:1 },
  side:   { n:'後遺症', d:'健康回復變慢；可以做復健療程', bad:1 },
};
const START_PERKS = ['genius','lucky','iron','coward','lost','social','drinker','glass'];
const WPN = { n:['木製','鐵製','鋼製','秘銀'], mul:[1, 1.6, 2.6, 4.2], price:[0, 300, 1500, 3500] };
const ARM = { n:['布衣','皮甲','鎖子甲','板甲'], mul:[1, 1.4, 2.0, 3.0], price:[0, 250, 1200, 3000] };
const WNAME = { warrior:'劍', archer:'弓', mage:'杖', thief:'匕首' };
const MALE = ['阿哲','阿傑','大熊','阿光','鐵牛','小虎','阿翔','老王','阿星','阿龍','阿寶','阿凱','阿德','石頭','阿豪','阿峰'];
const FEMALE = ['小美','小雪','阿月','小蓮','小楓','小葵','小滿','小薇','小晴','小芸','小柔','小花'];
const POT_PRICE = 30, POT_MAX = 5;
const potP = () => Math.round(POT_PRICE * (S && S.herbDisc > S.day ? .7 : 1));   // v17.90：採集藥草之後半年打七折
// v2：寶物（只有危險的地方比較容易撿到），最多帶 3 個，死後傳一個給下一代
const TREASURES = {
  clover:  { n:'四葉幸運草',   z:0, d:'好事更常發生，瀕死時更容易有人救', luck:.15 },
  wolfking:{ n:'哥布林王的短刀', z:1, d:'戰力 +12%', pw:.12 },
  tear:    { n:'妖精之淚',     z:1, d:'壓力累積 -30%', calm:.3 },
  amulet:  { n:'古代護符',     z:2, d:'受到的傷害 -15%', guard:.15 },
  crown:   { n:'骷髏王冠碎片', z:2, d:'打怪的錢 +30%', gold:.3 },
  dragon:  { n:'骸骨龍心',     z:9, d:'戰力 +25%、HP +20%', pw:.25, hp:.2 },
  rune:    { n:'矮人符文石',   z:3, d:'戰力 +15%', pw:.15 },
  scale:   { n:'人魚的鱗片',   z:4, d:'受到的傷害 -12%、壓力累積 -20%', guard:.12, calm:.2 },
  icecore: { n:'冰龍之心',     z:5, d:'戰力 +20%、HP +15%', pw:.2, hp:.15 },
  seal:    { n:'魔王的封印',   z:6, d:'打怪的錢 +40%、戰力 +10%', gold:.4, pw:.1 },
  abyss:   { n:'深淵王冠',     z:10, d:'戰力 +30%', pw:.3 },
};
const CHARM_MAX = 3;
// v4：六種 90 後勇者原型（奇幻外皮、現代心態），決定他怎麼花錢、怎麼看待你
const GOALS = {
  seiko: { n:'精緻窮族',    d:'買不起未來，就買現在的快樂。有錢就花，討厭被抽太多' },
  etf:   { n:'等房＋ETF族', d:'先存頭期款買房、閒錢放 ETF，房子到手才談結婚' },
  slash: { n:'斜槓副業族',  d:'不喜歡被綁死，常常自己接外快' },
  cert:  { n:'證照進修族',  d:'錢都拿去進修和買裝備，待遇不對就想跳槽' },
  health:{ n:'健康優先族',  d:'身心健康才是成功，拒絕過勞和太危險的工作' },
  filial:{ n:'孝順拉扯族',  d:'賺的錢先寄三成回家，常被爸媽的意見拉著走' },
};
// v5：HEXACO 六個個性值（0–100），經紀人要相處一段時間才看得出來
const HEX = {
  H:{ n:'誠實謙遜', hi:'真誠、不貪', lo:'圓滑、貪心' }, E:{ n:'情緒性', hi:'容易焦慮、重感情', lo:'冷靜、獨立' },
  X:{ n:'外向性', hi:'活潑、愛社交', lo:'內斂、安靜' }, A:{ n:'和善性', hi:'寬容、好商量', lo:'記仇、易怒' },
  C:{ n:'盡責性', hi:'自律、勤奮', lo:'隨性、拖延' }, O:{ n:'開放性', hi:'好奇、敢冒險', lo:'保守、務實' },
};
const HEX_TXT = {
  H:{ lo:'圓滑', hi:'老實', loE:'可能對你說謊、瞞著你接私活，也比較容易被詐騙拖下水', hiE:'不太會說謊，不會私吞，但叫他去臥底會很痛苦' },
  E:{ lo:'冷靜', hi:'敏感', loE:'壓力大也撐得住，很少崩潰或逃跑', hiE:'壓力累積快、容易臨陣逃跑，被罵或出事會特別受傷' },
  X:{ lo:'內向', hi:'外向', loE:'交朋友慢，綜藝通告、見面會會讓他很痛苦', hiE:'交朋友快，喜歡上節目、見面會' },
  A:{ lo:'記仇', hi:'隨和', loE:'不喜歡被指揮，被罵會記仇，容易跟人起衝突', hiE:'比較願意照你的安排，被罵也不太記仇' },
  C:{ lo:'隨性', hi:'自律', loE:'容易拖延、擺爛，偶爾睡過頭放鴿子', hiE:'練功效率好、會存錢，很少擺爛' },
  O:{ lo:'保守', hi:'愛冒險', loE:'喜歡待在熟悉、安全的地方', hiE:'敢往危險的地方跑，收穫多，也容易出事' },
};
const DES_FX = { acceptance:'被稱讚特別開心，被罵特別受傷', curiosity:'喜歡去沒去過的地方', eating:'請他吃喝的效果特別好', family:'比較想結婚生子', honor:'想讓家人驕傲，常被爸媽的意見影響', idealism:'看到有人有難會衝出去', independence:'不喜歡被安排，常自己做決定', order:'不喜歡你一直換方針', physical:'想變強，敢往危險的地方去', power:'想打倒魔王、讓大家聽他的', romance:'容易愛上別人', saving:'很捨不得花錢', social:'想要很多朋友', status:'想出名，很在乎排名和名聲', tranquility:'怕危險，喜歡安穩的日子', vengeance:'不服輸，有仇必報' };
function hexWord(k, v){ const T0 = HEX_TXT[k]; const s = v >= 75 || v <= 25 ? '非常' : '比較'; return v >= 60 ? `${s}${T0.hi}` : v <= 40 ? `${s}${T0.lo}` : `介於${T0.lo}和${T0.hi}之間`; }
const HEX_REVEAL = { X:3, A:6, C:10, E:15, O:20, H:30 };   // 相處幾個月後看得出來
const TRAIT_HEX = { brave:{ E:-15, O:15 }, careful:{ C:15, E:10, O:-10 }, greedy:{ H:-25 }, lazy:{ C:-25 }, hot:{ E:15, A:-10, X:10 }, calm:{ E:-20, A:5 }, curious:{ O:25 }, loyal:{ H:15, A:15 } };
function rollHex(t1, t2){ const o = {}; for (const k of 'HEXACO') { let v = 50 + rand(-18, 18) + ((TRAIT_HEX[t1] || {})[k] || 0) + ((TRAIT_HEX[t2] || {})[k] || 0) * .5; o[k] = Math.round(clamp(v, 5, 95)); } return o; }
const hx = (x, k) => (((x && x.hex) || {})[k] ?? 50) / 100;
// v5：Reiss 16 種基本慾望，每位勇者最在乎前三種
const DESIRES = {
  acceptance:{ n:'接納', d:'想被認可、怕被批評' }, curiosity:{ n:'好奇', d:'想知道世界的秘密' }, eating:{ n:'飲食', d:'想吃遍美食' },
  family:{ n:'家庭', d:'想養育子女' }, honor:{ n:'榮譽', d:'想讓家人以自己為榮' }, idealism:{ n:'理想', d:'想保護弱小' },
  independence:{ n:'獨立', d:'不想聽任何人的命令' }, order:{ n:'秩序', d:'想過規律穩定的日子' }, physical:{ n:'運動', d:'想成為最強的戰士' },
  power:{ n:'權力', d:'想要影響力' }, romance:{ n:'浪漫', d:'想找到真愛' }, saving:{ n:'儲蓄', d:'想存錢、收藏' },
  social:{ n:'社交', d:'想要一群生死之交' }, status:{ n:'地位', d:'想出名、被尊敬' }, tranquility:{ n:'安寧', d:'想遠離危險、平安過日子' }, vengeance:{ n:'報復', d:'有仇必報、不服輸' },
};
const DES_REVEAL = [8, 25, 45];
const GOAL_DES = { seiko:['eating', 'romance', 'status'], etf:['saving', 'order', 'family'], slash:['independence', 'curiosity'], cert:['curiosity', 'acceptance', 'physical'], health:['tranquility', 'physical'], filial:['honor', 'family', 'independence'] };
function rollDes(goal){ const out = [], pref = GOAL_DES[goal] || []; if (pref.length && chance(.7)) out.push(pick(pref)); while (out.length < 3) { const k = pick(Object.keys(DESIRES)); if (!out.includes(k)) out.push(k); } return out; }
const dw = (h, k) => { const i = (h.des || []).indexOf(k); return i < 0 ? 0 : [1, .7, .5][i]; };
// 兩個人合不合：開放、盡責、情緒性越接近越合，對方越和善越好相處
const compat = (h, n) => (1.3 - (Math.abs(hx(h, 'O') - hx(n, 'O')) + Math.abs(hx(h, 'C') - hx(n, 'C')) + Math.abs(hx(h, 'E') - hx(n, 'E'))) / 3 * 1.4) * (.7 + .6 * hx(n, 'A'));
const KIDW = { want:'想要小孩', maybe:'看情況', no:'不想生（頂客）' };
const GOAL_BY_TRAIT = { brave:['cert', 'seiko', 'slash'], careful:['etf', 'health', 'etf'], greedy:['etf', 'slash', 'slash'], lazy:['seiko', 'health', 'seiko'],
  hot:['seiko', 'cert', 'slash'], calm:['etf', 'health', 'cert'], curious:['slash', 'seiko', 'cert'], loyal:['filial', 'filial', 'etf'] };
const pickGoal = t => chance(.75) ? pick(GOAL_BY_TRAIT[t] || ['etf']) : pick(Object.keys(GOALS));
const pickKid = () => { const x = Math.random(); return x < .35 ? 'want' : x < .75 ? 'maybe' : 'no'; };
const V3MAP = { family:'etf', dink:'seiko', strong:'cert', rich:'etf', free:'seiko', filial:'filial' };
// 嘴上說的原型：誠實度低的人，會說一個「聽起來比較體面」的
function sayGoal(goal, honest){ if (chance(honest / 100 + .15)) return goal; return pick(['health', 'etf', 'filial', 'cert'].filter(g => g !== goal)); }
const lossAverse = h => h.goal === 'etf' || h.goal === 'health' || h.trait === 'careful';
const restAfter = h => h.sta < 45 || (h.burn || 0) > 60 || h.stress > 70;   // v17.20：做完工作要不要先休息
const feelDanger = (h, D) => danger(ratio(h, D) * (h.overconf || 1) / (lossAverse(h) ? 1.25 : 1));   // 他自己覺得的危險度
const winP = r => clamp(1.1 * r - .28, .01, .97);   // v17.21：勝率照戰力比走，拿掉 20% 保底（0.3→5%、0.5→27%、0.85→66%、1.3→97%）
const RISK_MUL = [1, 1.6, 2.5];   // 安全／有風險／九死一生 的收穫倍率
// v2：經紀人的名聲與事務所
// v16：15 級、5 個階段（起步／地方／王都／王國／大陸），每階段 3 級
const RANKS = [[0, '無名小事務所'], [60, '街角經紀人'], [150, '新銳經紀人'],
  [300, '地方名經紀'], [500, '地方龍頭'], [800, '公會特約事務所'],
  [1200, '王都經紀公司'], [1800, '王都名門'], [2600, '王室御用經紀'],
  [3600, '王國首席經紀'], [5000, '傳說經紀人'], [7000, '英雄之家'],
  [10000, '大陸聯合經紀'], [14000, '萬國名門'], [20000, '不朽名門']];
const STAGES = ['起步', '地方', '王都', '王國', '大陸'];
const STAGE_DARK = ['地下小咖', '地方角頭', '王都地下勢力', '王國暗面', '地下世界之王'];   // v15 惡名高時的稱號（惡名系統做好後生效）
const stageOf = (r = rankOf()) => Math.floor(r / 3);
const rkx = () => rankOf() / 2;   // 報酬、罰款、價格的倍率用：大致對上舊版 5 級的刻度，往上延伸到 7
const rankName = (r = rankOf()) => (S && (S.infamy || 0) >= 60) ? STAGE_DARK[stageOf(r)] + (r % 3 ? '·' + (r % 3 + 1) : '') : RANKS[r][1];
// 各級解鎖（索引從 0 開始）
const UNLOCK = { contract:1, moreAg:2, artist1:3, intel:4, nominate:5, artist2:6, judge:7, royal:8, draftPass:9, artist3:10, coach:11, abroad:12, foreign:13, legend:14 };
const hasU = k => rankOf() >= UNLOCK[k];
const artistSlots = () => hasU('artist3') ? 3 : hasU('artist2') ? 2 : hasU('artist1') ? 1 : 0;
const officeMax = () => hasU('coach') ? 5 : hasU('royal') ? 4 : 3;
const OFFICE = {
  clinic:{ n:'醫務室', d:l => `重傷少躺 ${l} 個月、急救費 -${Math.min(75, l * 15)}%`, base:800 },
  gym:   { n:'訓練室', d:l => `經驗 +${l * 12}%`, base:700 },
  lounge:{ n:'休息室', d:l => `休息時多紓壓 ${l * 4}`, base:600 },
  intel: { n:'情報站', d:l => `委託多 ${l} 個${l >= 2 ? '，每 3 個月換一批' : ''}`, base:900 },
  cellar:{ n:'酒窖',   d:l => `請喝一杯效果 +${l * 40}%`, base:500 },
};
const OFFICE_MAX = 3;
// v6：事務所任務（替事務所賺名聲，勇者拿得很少）
const AGT = {
  endorse:{ n:'商會代言',          days:1, fame:12, gold:400,  z:-1, d:'拍廣告、站台。很安全，但重視獨立的人會覺得丟臉' },
  variety:{ n:'綜藝節目通告',      days:1, fame:15, gold:300,  z:-1, d:'上節目耍寶。外向的人很樂，內向的人很痛苦' },
  meet:   { n:'粉絲見面會',        days:1, fame:10, gold:250,  z:-1, d:'簽名握手一整天，內向的人會累壞' },
  arena:  { n:'鬥技場表演賽',      days:1, fame:20, gold:900,  z:-1, dk:[.75, 1.05], d:'觀眾想看流血，可能受傷' },
  trial:  { n:'煉金公會新藥試驗',  days:1, fame:15, gold:1200, z:-1, d:'報酬很好，但健康會受損，可能留下後遺症' },
  spy:    { n:'臥底對手事務所',    days:3, fame:25, gold:600,  z:-1, d:'削弱銀月經紀社。誠實的人會很痛苦，被抓到就是醜聞' },
  border: { n:'王國徵召：駐守邊境', days:4, fame:60, gold:1500, z:2, dk:[.8, 1.15], d:'名聲很大，但連續好幾天不能回家，非常累' },
  hunt:   { n:'限期討伐：荒地魔獸群', days:2, fame:45, gold:2000, z:2, dk:[1.1, 1.6], d:'很可能九死一生，但事務所會一戰成名' },
  exam:   { n:'升格考核', days:2, fame:30, gold:800, z:2, d:'公會指定的考核。通過才能升格；失敗要等半年才能再考' },
  // v17.90 新任務（開發者 11/27 選 2、3、4、6、7、8、9、10；req＝畫面上當委託顯示）
  smith:  { n:'鐵匠鋪代言試刀', days:1, fame:8,  gold:250, z:-1, d:'在鐵匠鋪門口試新刀。做完下次買裝備打八五折' },
  coach:  { n:'公會新人教練',   days:1, fame:8,  gold:300, z:-1, d:'在鬥技場教新人。勇者經驗增加，之後比較容易招到新人' },
  charity:{ n:'慈善義賣',       days:1, fame:10, gold:60,  z:-1, d:'在廣場義賣做公益。錢很少，但口碑變好、惡名淡化' },
  banquet:{ n:'王都晚宴',       days:1, fame:40, gold:400, z:-1, d:'王國貴族的晚宴，晚上 20～24 點。名聲很大，想出名的人很開心' },
  herb:   { n:'採集藥草',       days:1, fame:3,  gold:150, z:0, req:1, d:'在草原或森林採草藥，不太需要打。之後半年診所的小藥水打七折' },
  harvest:{ n:'秋收幫忙',       days:1, fame:3,  gold:120, z:0, req:1, d:'9～10 月才有。幫村子割稻，全村的人交情 +1' },
  patrol: { n:'夜間巡邏',       days:1, fame:5,  gold:200, z:-1, req:1, d:'晚上 20 點到凌晨 2 點提燈巡村子，有機會抓到小偷' },
};
const Q_MAX = 4;
function etaList(){ const h = H(); let off = 1 + (h.act === 'mission' ? Math.max(0, h.actDays) : (h.bedDays || 0) + (h.visit || 0) + (h.goneDays || 0)); return S.queue.map(it => { const st = S.day + off; off += estDays(h, it); return st; }); }
const dueTxt = u => { const n = u - S.day; return n <= 0 ? '這個月截止' : n === 1 ? '下個月截止' : `期限剩 ${n} 個月`; };
const AG_GATE = [0, 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 17, 20, 24];   // 升格需要的代表作（完成的事務所任務）數
const upkeep = () => Math.round(10 + rkx() * 18 + Object.values(S.office).reduce((a, b) => a + b, 0) * 5 + (S.artists || []).length * 25);   // v16：每位旗下藝人 +25
// v6：勇者的私人醜聞（看個性決定比較會出哪一種）
const SCANDALS = [
  { k:'affair', n:'緋聞',     w:h => (hx(h, 'X') * .5 + dw(h, 'romance')) * (h.partner ? 1.2 : .6), t:h => `${h.name}被拍到深夜和神秘人進出旅館`, fame:25 },
  { k:'drunk',  n:'酒後鬧事', w:h => hx(h, 'E') * (h.act === 'drink' ? 2 : .6) + (hasP(h, 'drinker') ? .5 : 0), t:h => `${h.name}在酒館喝醉，砸壞了桌椅`, fame:20 },
  { k:'fight',  n:'鬥毆',     w:h => (1 - hx(h, 'A')) * .9, t:h => `${h.name}在市集跟人起衝突，把對方打傷`, fame:30 },
  { k:'bribe',  n:'收賄',     w:h => (1 - hx(h, 'H')) * .9, t:h => `${h.name}被爆收了商會的錢，打表演賽故意放水`, fame:40 },
  { k:'noshow', n:'放鴿子',   w:h => (1 - hx(h, 'C')) * .7, t:h => `${h.name}沒出席答應好的商會活動`, fame:15 },
  { k:'fraud',  n:'牽扯詐騙', w:h => { const m = npc('marco'); return m && m.alive && m.aff >= 40 ? 1.2 : 0; }, t:h => `${h.name}被發現幫旅行商人馬可拉人頭`, fame:45 },
];
const officeCost = (k, l) => Math.round(OFFICE[k].base * Math.pow(3.2, l));
const NPC_POOL = [['麵包店的', '小麥', 'f', .1], ['神殿見習生', '阿安', 'm', .15], ['獵人', '阿鷹', 'm', .3], ['花店的', '小鈴', 'f', .1], ['旅館的', '阿福', 'm', .1], ['藥師', '小芷', 'f', .1],
  ['農家的', '阿牛', 'm', .2], ['裁縫店的', '小蝶', 'f', .1], ['吟遊詩人', '阿樂', 'm', .1], ['牧場的', '小羊', 'f', .15]];
// v8：村子裡有功能的人
const CAST = () => [
  { id:'guild', title:'公會櫃台', name:'小雯', sex:'f', role:'guild', age:24, pw:0 },
  { id:'priest', title:'神殿祭司', name:'艾琳修女', sex:'f', role:'priest', age:46, pw:.2 },
  { id:'mayor', title:'村長', name:'老吳', sex:'m', role:'mayor', age:63, pw:0 },
  { id:'reporter', title:'《勇者週報》記者', name:'阿哲', sex:'m', role:'reporter', age:29, pw:.05 },
  { id:'fan', title:'崇拜勇者的小孩', name:'小豆', sex:chance(.5) ? 'm' : 'f', role:'fan', age:10, pw:0 },
  { id:'merc', title:'傭兵', name:'鐵牙', sex:'m', role:'merc', age:34, pw:.4 },
  { id:'rival2', title:'銀月經紀社的勇者', name:pick(['小夜', '露娜', '希兒']), sex:'f', role:'rival2', age:21, pw:.35 },
];
const AGE0 = { tao:38, chen:55, rival:20, marco:41 }, PW0 = { tao:.1, chen:.25, rival:0, marco:0 };
const ROLE_FX = {
  tavern:'去酒館喝酒會變熟', smith:'打造、修裝備；交情好算便宜一點', villager:'可能和勇者談戀愛',
  guild:'朋友時：委託多一件、報酬 +10%', priest:'朋友時：倒下比較容易被救回、救治費 -15%，探病時傷好得快',
  mayor:'朋友時：守村比較容易成功；偶爾請事務所捐款', reporter:'交情好：醜聞傷害 -30%，偶爾寫專題；交情差：醜聞更傷',
  fan:'勇者心情低落時會來打氣；長大後可能想當勇者', merc:'付錢就能一起出任務', rival:'同期的競爭對手', rival2:'交情好可以一起出任務',
  merchant:'來路不明的商人', elder:'前代勇者：可以帶他一起出任務',
};
const mkNpc = (o, aff) => ({ ...o, aff, alive:true, hex:rollHex() });
const dateable = n => n.alive && !n.gone && !n.nodate && ['villager', 'guild', 'reporter', 'merc'].includes(n.role) && !n.mate && (n.age || 25) < 45;
const isFr = id => { const n = npc(id); return !!(n && n.alive && n.aff >= 50); };
function canComp(n){
  if (!n || !n.alive || n.gone || (n.sick || 0) > S.day || !(n.pw >= .1) || n.dark || n.role === 'rival') return false;
  if (n.role === 'merc') return true;
  if (n.role === 'fan') return (n.age || 0) >= 16 && n.aff >= 50;
  return n.aff >= (n.role === 'elder' ? 30 : 50);
}
const compCost = n => n.role === 'merc' ? Math.round((80 + H().lv * 25) * (n.aff >= 50 ? .7 : 1)) : 0;
const compMul = id => { const n = id && npc(id); return n && n.alive ? 1 + (n.pw || 0) : 1; };
const canFightComp = o => o.D && (!o.ag || ['border', 'hunt', 'exam'].includes(o.ag));
const RIVAL_AG = ['金獅事務所', '銀月經紀社'];
function makeNpcs(){
  const pool = [...NPC_POOL].sort(() => Math.random() - .5).slice(0, 3);
  const n = [{ id:'tao', title:'酒館老闆娘', name:'阿桃', sex:'f', role:'tavern' }, { id:'chen', title:'鐵匠', name:'老陳', sex:'m', role:'smith' }];
  pool.forEach((q, i) => n.push({ id:'v' + i, title:q[0], name:q[1], sex:q[2], role:'villager' }));
  n.push({ id:'rival', title:'金獅事務所的勇者', name:pick(['雷恩', '凱爾', '亞斯', '蒂娜']), sex:'m', role:'rival' });
  n.push({ id:'marco', title:'旅行商人', name:'馬可', sex:'m', role:'merchant', dark:1 });
  pool.forEach((q, i) => { n[2 + i].pw = q[3]; n[2 + i].age = ri(19, 28); });
  n.forEach(x => { if (x.age == null) x.age = AGE0[x.id]; if (x.pw == null) x.pw = PW0[x.id]; });
  n.push(...CAST());
  n.forEach(x => { x.aff = x.role === 'rival' ? 0 : x.role === 'rival2' ? 10 : ri(5, 25); x.alive = true; x.hex = rollHex(); });
  const m = n.find(x => x.id === 'marco'); m.hex.H = 5; m.hex.A = 30; m.aff = 10;
  return n;
}


// ================= v17.29：回饋特效（跳字、Lv UP），畫在地圖上，見 map.js 的 drawFx =================
const FXQ = [];
function fxPop(text, kind = 'gold'){
  if (typeof offline !== 'undefined' && offline) return;            // 背景補算的日子不演
  if (typeof pref !== 'undefined' && !pref.fx) return;              // 跟設定裡的「互動飄字」一起開關
  const now = performance.now(), live = FXQ.filter(f => f.kind !== 'lv' && now - f.t < f.dur).length;
  FXQ.push({ t:now, text, kind, dur:kind === 'lv' ? 2300 : 1500, n:live % 3 });
  if (FXQ.length > 12) FXQ.shift();
}
