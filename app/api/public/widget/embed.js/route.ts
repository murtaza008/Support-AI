export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  const js = buildEmbedScript(origin);
  return new Response(js, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function buildEmbedScript(origin: string) {
  return `(function(){
  var API_BASE = ${JSON.stringify(origin)} + "/api/public/widget/";
  var current = document.currentScript;
  var assistantId = current && current.getAttribute("data-assistant");
  var brand = (current && current.getAttribute("data-color")) || "#FF5A36";
  var title = (current && current.getAttribute("data-title")) || "Chat with us";
  if (!assistantId) { console.error("[SupportAI] missing data-assistant"); return; }
  var API = API_BASE + assistantId + "/chat";

  var visitorKey = "supportai_visitor_" + assistantId;
  var visitorId = localStorage.getItem(visitorKey);
  if (!visitorId) { visitorId = crypto.randomUUID(); localStorage.setItem(visitorKey, visitorId); }
  var convKey = "supportai_conv_" + assistantId;
  var conversationId = sessionStorage.getItem(convKey);
  var messages = [];

  var css = \`
    .sai-root{position:fixed;bottom:20px;right:20px;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Inter,sans-serif;}
    .sai-btn{width:56px;height:56px;border-radius:50%;background:\${brand};color:#fff;border:0;box-shadow:0 10px 25px -8px rgba(0,0,0,.35);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .18s ease;}
    .sai-btn:hover{transform:translateY(-2px);}
    .sai-panel{position:absolute;bottom:70px;right:0;width:360px;max-width:calc(100vw - 32px);height:520px;max-height:calc(100vh - 120px);background:#fff;border-radius:14px;box-shadow:0 30px 60px -20px rgba(0,0,0,.35);display:flex;flex-direction:column;overflow:hidden;transform-origin:bottom right;animation:sai-in .22s cubic-bezier(.16,1,.3,1);}
    @keyframes sai-in{from{opacity:0;transform:translateY(8px) scale(.98);}to{opacity:1;transform:none;}}
    .sai-head{padding:14px 16px;background:\${brand};color:#fff;font-weight:600;display:flex;justify-content:space-between;align-items:center;}
    .sai-x{background:transparent;border:0;color:#fff;cursor:pointer;font-size:20px;line-height:1;}
    .sai-log{flex:1;overflow-y:auto;padding:14px;background:#FAFAF7;display:flex;flex-direction:column;gap:10px;}
    .sai-msg{max-width:82%;padding:9px 12px;border-radius:14px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word;}
    .sai-u{align-self:flex-end;background:#13151A;color:#fff;border-bottom-right-radius:4px;}
    .sai-a{align-self:flex-start;background:#fff;color:#13151A;border:1px solid #EAEAE2;border-bottom-left-radius:4px;}
    .sai-empty{margin:auto;text-align:center;color:#7B7B72;font-size:13px;}
    .sai-form{display:flex;gap:8px;padding:10px;border-top:1px solid #EAEAE2;background:#fff;}
    .sai-in{flex:1;padding:10px 12px;border:1px solid #EAEAE2;border-radius:8px;font-size:14px;outline:none;}
    .sai-in:focus{border-color:\${brand};}
    .sai-send{background:\${brand};color:#fff;border:0;border-radius:8px;padding:0 14px;cursor:pointer;font-weight:600;}
    .sai-send:disabled{opacity:.55;cursor:not-allowed;}
    .sai-typing{display:inline-flex;gap:4px;align-items:center;padding:9px 12px;}
    .sai-typing span{width:6px;height:6px;background:\${brand};border-radius:50%;animation:sai-b 1s infinite;}
    .sai-typing span:nth-child(2){animation-delay:.15s;} .sai-typing span:nth-child(3){animation-delay:.3s;}
    @keyframes sai-b{0%,80%,100%{transform:scale(.6);opacity:.5;}40%{transform:scale(1);opacity:1;}}
  \`;
  var style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);

  var root = document.createElement("div"); root.className = "sai-root";
  root.innerHTML = '<button class="sai-btn" aria-label="Open chat"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>';
  document.body.appendChild(root);
  var open = false, panel = null;

  root.querySelector(".sai-btn").addEventListener("click", function(){ open ? close() : openPanel(); });

  function openPanel(){
    open = true;
    panel = document.createElement("div"); panel.className = "sai-panel";
    panel.innerHTML =
      '<div class="sai-head"><span>' + escapeHtml(title) + '</span><button class="sai-x" aria-label="Close">×</button></div>' +
      '<div class="sai-log" id="sai-log"></div>' +
      '<form class="sai-form"><input class="sai-in" placeholder="Type a message…" autocomplete="off"/><button class="sai-send" type="submit">Send</button></form>';
    root.appendChild(panel);
    panel.querySelector(".sai-x").addEventListener("click", close);
    panel.querySelector(".sai-form").addEventListener("submit", onSubmit);
    render();
    setTimeout(function(){ var inp = panel.querySelector(".sai-in"); if (inp) inp.focus(); }, 60);
  }
  function close(){ open = false; if (panel) panel.remove(); panel = null; }

  function render(){
    if (!panel) return;
    var log = panel.querySelector("#sai-log"); log.innerHTML = "";
    if (messages.length === 0) {
      var e = document.createElement("div"); e.className = "sai-empty";
      e.textContent = "Hi! Ask me anything.";
      log.appendChild(e); return;
    }
    messages.forEach(function(m){
      var d = document.createElement("div");
      d.className = "sai-msg " + (m.role === "user" ? "sai-u" : "sai-a");
      d.textContent = m.text;
      log.appendChild(d);
    });
    if (typing) {
      var t = document.createElement("div"); t.className = "sai-msg sai-a sai-typing";
      t.innerHTML = "<span></span><span></span><span></span>";
      log.appendChild(t);
    }
    log.scrollTop = log.scrollHeight;
  }

  var typing = false;
  function onSubmit(e){
    e.preventDefault();
    var inp = panel.querySelector(".sai-in");
    var text = (inp.value || "").trim(); if (!text || typing) return;
    inp.value = "";
    messages.push({ role: "user", text: text });
    typing = true; render();
    sendToApi(text).catch(function(err){
      typing = false;
      messages.push({ role: "assistant", text: (err && err.userMessage) || "Sorry, something went wrong." });
      render();
      console.error(err);
    });
  }

  async function sendToApi(text){
    var payload = {
      visitorId: visitorId,
      conversationId: conversationId,
      messages: messages.map(function(m, i){
        return { id: "m-" + i, role: m.role, parts: [{ type: "text", text: m.text }] };
      }),
    };
    var res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.status === 429) {
      var limited = new Error("HTTP 429"); limited.userMessage = await res.text(); throw limited;
    }
    if (!res.ok || !res.body) throw new Error("HTTP " + res.status);
    var newConv = res.headers.get("X-Conversation-Id");
    if (newConv) { conversationId = newConv; sessionStorage.setItem(convKey, newConv); }

    // Keep the typing dots until the first words arrive; free-tier models can take a while.
    var idx = -1;

    var reader = res.body.getReader();
    var decoder = new TextDecoder();
    var buf = "";
    while (true) {
      var chunk = await reader.read(); if (chunk.done) break;
      buf += decoder.decode(chunk.value, { stream: true });
      var lines = buf.split("\\n");
      buf = lines.pop() || "";
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line.startsWith("data:")) continue;
        var body = line.slice(5).trim();
        if (!body || body === "[DONE]") continue;
        var evt = null;
        try { evt = JSON.parse(body); } catch(_) { continue; }
        if (evt && evt.type === "error") throw new Error(evt.errorText || "stream error");
        if (evt && evt.type === "text-delta" && typeof evt.delta === "string" && evt.delta) {
          if (idx < 0) { typing = false; messages.push({ role: "assistant", text: "" }); idx = messages.length - 1; }
          messages[idx].text += evt.delta;
          render();
        }
      }
    }
    if (idx < 0) throw new Error("empty response");
  }

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, function(c){ return { "&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;","'":"&#39;" }[c]; }); }
})();`;
}
