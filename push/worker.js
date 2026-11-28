// 勇者經紀人 推播伺服器（Cloudflare Worker，v17.98）
// - 遊戲關掉（切到背景）時把「訂閱」和「離線補算什麼時候滿」送過來：POST /sub
// - 每 5 分鐘檢查一次：離線補算滿了、每天提醒的時間到了 → 推一則空的推播；手機上的 service worker 收到後來 GET /msg 拿文字
// - VAPID 金鑰第一次用到時自己產生，存在 KV（不用另外設密鑰）
const CORS = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET,POST,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type' };
const J = (o, s = 200) => new Response(JSON.stringify(o), { status:s, headers:{ 'Content-Type':'application/json; charset=utf-8', ...CORS } });
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const enc = s => new TextEncoder().encode(s);
async function sha(s){ return b64u(await crypto.subtle.digest('SHA-256', enc(s))).slice(0, 22); }

async function vapid(env){
  let v = await env.KV.get('vapid', 'json');
  if (!v) {
    const kp = await crypto.subtle.generateKey({ name:'ECDSA', namedCurve:'P-256' }, true, ['sign', 'verify']);
    v = { pub:b64u(await crypto.subtle.exportKey('raw', kp.publicKey)), jwk:await crypto.subtle.exportKey('jwk', kp.privateKey) };
    await env.KV.put('vapid', JSON.stringify(v));
  }
  return v;
}
async function jwt(env, endpoint){
  const v = await vapid(env), key = await crypto.subtle.importKey('jwk', v.jwk, { name:'ECDSA', namedCurve:'P-256' }, false, ['sign']);
  const head = b64u(enc(JSON.stringify({ typ:'JWT', alg:'ES256' })));
  const body = b64u(enc(JSON.stringify({ aud:new URL(endpoint).origin, exp:Math.floor(Date.now() / 1000) + 12 * 3600, sub:'mailto:push@yongzhe.game' })));
  const sig = await crypto.subtle.sign({ name:'ECDSA', hash:'SHA-256' }, key, enc(head + '.' + body));
  return { t:`${head}.${body}.${b64u(sig)}`, k:v.pub };
}
async function push(env, sub){
  const { t, k } = await jwt(env, sub.endpoint);
  const r = await fetch(sub.endpoint, { method:'POST', headers:{ TTL:'86400', Urgency:'normal', Authorization:`vapid t=${t}, k=${k}`, 'Content-Length':'0' } });
  return r.status;
}
const subs = async env => (await env.KV.get('subs', 'json')) || {};
const DAILY = n => [`${n}今天也在努力，回來看看${n}吧`, `${n}在村子裡等你的指示`, `老闆，${n}有事想跟你說`, `今天要幫${n}安排什麼工作？`];

export default {
  async fetch(req, env){
    const u = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers:CORS });
    if (u.pathname === '/vapid') return J({ key:(await vapid(env)).pub });
    if (u.pathname === '/sub' && req.method === 'POST') {
      let d; try { d = JSON.parse(await req.text()); } catch (e) { return J({ ok:false }, 400); }
      if (!d.sub || !d.sub.endpoint) return J({ ok:false }, 400);
      const all = await subs(env), id = await sha(d.sub.endpoint), old = all[id] || {};
      if (d.off) { delete all[id]; await env.KV.put('subs', JSON.stringify(all)); return J({ ok:true }); }
      all[id] = { sub:d.sub, name:String(d.name || '勇者').slice(0, 12), tz:+d.tz || 480, daily:d.daily || null,
        capAt:+d.capAt || null, capSent:old.capAt === +d.capAt ? !!old.capSent : false, seen:Date.now(), lastDaily:old.lastDaily || '', msg:old.msg || null };
      await env.KV.put('subs', JSON.stringify(all)); return J({ ok:true });
    }
    if (u.pathname === '/msg') {
      const all = await subs(env), id = await sha(u.searchParams.get('ep') || ''), s = all[id];
      const m = s && s.msg; if (s && m) { s.msg = null; await env.KV.put('subs', JSON.stringify(all)); }
      return J(m || { title:'勇者經紀人', body:'回來看看勇者吧' });
    }
    return J({ ok:true, name:'yongzhe-push' });
  },
  async scheduled(ev, env){
    const all = await subs(env), now = Date.now(); let dirty = false;
    for (const [id, s] of Object.entries(all)) {
      const loc = new Date(now + s.tz * 60000), day = loc.toISOString().slice(0, 10), hm = loc.toISOString().slice(11, 16);
      const seenDay = new Date(s.seen + s.tz * 60000).toISOString().slice(0, 10);
      let m = null;
      if (s.capAt && !s.capSent && now >= s.capAt) { s.capSent = true; m = { title:'勇者經紀人', body:`${s.name}已經自己過了 15 個月，再不回來就不會往下算了` }; }
      else if (s.daily && hm >= s.daily && s.lastDaily !== day && seenDay !== day) { s.lastDaily = day; const L = DAILY(s.name); m = { title:'勇者經紀人', body:L[Math.floor(Math.random() * L.length)] }; }
      else if (s.daily && s.lastDaily !== day && seenDay === day && hm >= s.daily) { s.lastDaily = day; dirty = true; }   // 今天已經玩過就不提醒
      if (!m) continue;
      s.msg = m; dirty = true;
      try { const st = await push(env, s.sub); if (st === 404 || st === 410) delete all[id]; } catch (e) {}
    }
    if (dirty) await env.KV.put('subs', JSON.stringify(all));
  },
};
