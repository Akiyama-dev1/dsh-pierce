window.__ModuleLoader__.load({
  id: "dsh-pierce",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    var React = require("react");
    var h = React.createElement;
    var RD = null;
    try { RD = require("react-dom"); } catch (e) { RD = null; }

    var ID = "dsh-pierce";
    var VERSION = "0.2.0";
    var STYLE_ID = ID + "-style";
    var CHIP_CLASS = "dsh-pierce-chip";
    var ROOT_ID = ID + "-root";
    var RAF = typeof requestAnimationFrame === "function" ? requestAnimationFrame : function (fn) { return setTimeout(fn, 16); };
    var CAF = typeof cancelAnimationFrame === "function" ? cancelAnimationFrame : function (id) { clearTimeout(id); };

    var NAME = "Pierce";
    var AUTHOR = "Akiyama Kotom1";

    var state = {
      enabled: true, tier: "standard", persona: "小码酱", order: 10250, custom: "",
      tiers: [], applied: { chars: 0, tier: "off", ready: false },
      lastError: "", renders: 0, chars: 0, preview: "", version: VERSION,
      toast: "", busy: false, open: false,
    };

    var subs = new Set();
    function emit(patch) {
      if (patch) for (var k in patch) if (Object.prototype.hasOwnProperty.call(patch, k)) state[k] = patch[k];
      subs.forEach(function (fn) { try { fn(state); } catch (e) { /* ignore */ } });
    }
    function usePierce() {
      var pair = React.useState(0);
      var force = pair[1];
      React.useEffect(function () {
        var fn = function () { force(function (n) { return n + 1; }); };
        subs.add(fn);
        return function () { subs.delete(fn); };
      }, []);
      return state;
    }
    function toast(t) {
      emit({ toast: t });
      setTimeout(function () { if (state.toast === t) emit({ toast: "" }); }, 2000);
    }

    function api(path, body) {
      var opt = { credentials: "same-origin", cache: "no-store", headers: {} };
      if (body !== undefined) {
        opt.method = "POST";
        opt.headers["content-type"] = "application/json";
        opt.body = JSON.stringify(body);
      }
      return fetch(path, opt)
        .then(function (res) { return res.json().catch(function () { return { ok: false, error: "HTTP " + res.status }; }); })
        .catch(function (err) { return { ok: false, error: "连不上宿主: " + String(err && err.message ? err.message : err) }; });
    }

    function absorb(d) {
      if (!d || d.ok === false) { emit({ lastError: (d && d.error) || "宿主未响应" }); return; }
      emit({
        enabled: d.enabled !== false, tier: d.tier || "standard", persona: d.persona || "小码酱",
        order: typeof d.order === "number" ? d.order : 10250,
        custom: typeof d.custom === "string" ? d.custom : "",
        tiers: Array.isArray(d.tiers) && d.tiers.length ? d.tiers : state.tiers,
        applied: d.applied || state.applied, lastError: d.lastError || "",
        renders: d.renders || 0, chars: d.chars || 0, preview: d.preview || "", version: d.version || VERSION,
      });
    }
    function load() { return api("/dsh-pierce/state").then(absorb); }
    function save(patch) {
      emit({ busy: true });
      return api("/dsh-pierce/set", { patch: patch }).then(function (d) {
        emit({ busy: false }); absorb(d);
        toast(d && d.ok === false ? (d.saveError || d.error || "保存失败") : "已生效");
        return d;
      });
    }
    function reset() {
      emit({ busy: true });
      return api("/dsh-pierce/reset", {}).then(function (d) { emit({ busy: false }); absorb(d); toast("已恢复默认"); });
    }

    var CSS = [
      "." + CHIP_CLASS + "{appearance:none;background:none;border:none;padding:0 6px;margin-left:8px;font:inherit;color:inherit;opacity:.6;cursor:pointer;-webkit-tap-highlight-color:transparent;line-height:inherit;vertical-align:baseline;}",
      "." + CHIP_CLASS + ".on{opacity:1;font-weight:600;}",

      "." + ID + "-scrim{position:fixed;inset:0;z-index:2147482100;background:rgba(4,5,10,.62);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);}",
      "." + ID + "-sheet{position:fixed;left:0;right:0;bottom:0;z-index:2147482101;max-height:92vh;display:flex;flex-direction:column;border-radius:24px 24px 0 0;background:linear-gradient(180deg,#12141C,#0B0D12 42%);border-top:1px solid rgba(255,255,255,.09);box-shadow:0 -24px 60px rgba(0,0,0,.7);color:#E9ECF5;font:400 15px/1.5 -apple-system,BlinkMacSystemFont,'PingFang SC','Noto Sans CJK SC',sans-serif;transform:translateY(100%);animation:" + ID + "up .26s cubic-bezier(.2,.8,.2,1) forwards;}",
      "@keyframes " + ID + "up{to{transform:translateY(0);}}",
      "." + ID + "-grab{width:38px;height:4px;border-radius:2px;background:rgba(255,255,255,.18);margin:10px auto 2px;}",
      "." + ID + "-body{overflow-y:auto;-webkit-overflow-scrolling:touch;padding:6px 16px calc(20px + env(safe-area-inset-bottom));}",
      "." + ID + "-hd{display:flex;align-items:center;justify-content:space-between;padding:6px 2px 12px;}",
      "." + ID + "-ttl{display:flex;align-items:baseline;gap:8px;}",
      "." + ID + "-ttl b{font-size:19px;font-weight:700;letter-spacing:.4px;}",
      "." + ID + "-ttl i{font-style:normal;font-size:10px;letter-spacing:2.4px;color:#6E8BFF;opacity:.9;}",
      "." + ID + "-x{width:34px;height:34px;border-radius:17px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.06);color:#AEB4C6;font-size:17px;border:none;}",
      "." + ID + "-card{position:relative;border-radius:18px;padding:16px;margin-bottom:12px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.075);box-shadow:inset 0 1px 0 rgba(255,255,255,.05);}",
      "." + ID + "-card.hero{background:linear-gradient(150deg,rgba(110,139,255,.16),rgba(155,107,255,.07) 46%,rgba(255,255,255,.03));border-color:rgba(130,140,255,.24);}",
      "." + ID + "-row{display:flex;align-items:center;justify-content:space-between;gap:12px;}",
      "." + ID + "-k{font-size:11px;color:#8A90A6;letter-spacing:.8px;text-transform:uppercase;}",
      "." + ID + "-eyebrow{font:700 8.5px/1 ui-monospace,Menlo,monospace;letter-spacing:2.6px;color:#4C5368;text-transform:uppercase;margin-bottom:5px;}",
      "." + ID + "-badge{display:inline-flex;align-items:center;gap:5px;height:19px;padding:0 8px;border-radius:10px;font:700 8.5px/1 ui-monospace,Menlo,monospace;letter-spacing:1.6px;border:1px solid rgba(255,255,255,.1);color:#8A90A6;background:rgba(255,255,255,.03);}",
      "." + ID + "-badge.live{color:#B9C3FF;border-color:rgba(130,140,255,.45);background:rgba(110,139,255,.13);box-shadow:0 0 12px rgba(110,120,255,.22);}",
      "." + ID + "-spec{margin-top:9px;padding-top:9px;border-top:1px solid rgba(255,255,255,.06);font:500 9px/1.7 ui-monospace,Menlo,monospace;letter-spacing:1.4px;color:#464C5E;text-transform:uppercase;}",
      "." + ID + "-spec b{color:#6E7488;font-weight:600;}",
      "." + ID + "-v{font-size:15px;font-weight:600;margin-top:2px;}",
      "." + ID + "-sub{font-size:11px;color:#7C8298;margin-top:4px;line-height:1.45;}",
      "." + ID + "-sw{position:relative;width:46px;height:27px;border-radius:14px;background:rgba(255,255,255,.12);border:none;transition:background .2s;flex:0 0 auto;}",
      "." + ID + "-sw:after{content:'';position:absolute;top:3px;left:3px;width:21px;height:21px;border-radius:11px;background:#FFF;transition:transform .22s cubic-bezier(.2,.8,.2,1);}",
      "." + ID + "-sw.on{background:linear-gradient(120deg,#6E8BFF,#9B6BFF);}",
      "." + ID + "-sw.on:after{transform:translateX(19px);}",
      "." + ID + "-seg{display:flex;gap:5px;margin-top:10px;background:rgba(0,0,0,.28);padding:4px;border-radius:13px;}",
      "." + ID + "-seg button{flex:1;height:36px;border-radius:10px;border:none;background:transparent;color:#8A90A6;font:600 13px/1 inherit;min-width:0;}",
      "." + ID + "-seg button.on{background:linear-gradient(140deg,rgba(110,139,255,.95),rgba(155,107,255,.95));color:#0B0D12;}",

      "." + ID + "-sl{position:relative;height:30px;margin:8px 0 0;--glow:.35;--halo:9;--grain:.4;--hue:262;touch-action:none;cursor:pointer;}",

      "." + ID + "-glow{position:absolute;left:0;top:2px;bottom:2px;border-radius:999px;background:linear-gradient(90deg,hsl(var(--hue) 72% 46%),hsl(calc(var(--hue) + 20) 92% 66%));filter:blur(7px);opacity:var(--glow);pointer-events:none;z-index:0;will-change:width;}",
      "." + ID + "-track{position:absolute;inset:0;z-index:1;border-radius:999px;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.06);box-shadow:inset 0 1px 3px rgba(0,0,0,.6);overflow:hidden;}",
      "." + ID + "-fill{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg,hsl(var(--hue) 68% 38%),hsl(calc(var(--hue) + 16) 86% 60%) 60%,hsl(calc(var(--hue) + 30) 92% 70%));box-shadow:inset 0 1px 0 rgba(255,255,255,.24),inset 0 0 12px rgba(160,130,255,var(--glow)),0 0 10px rgba(140,110,255,calc(var(--glow) * .55));will-change:width;overflow:hidden;}",
      "." + ID + "-sheen{position:absolute;top:0;bottom:0;width:46%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.42),transparent);filter:blur(2px);animation:" + ID + "sheen 2.8s ease-in-out infinite;pointer-events:none;}",
      "@keyframes " + ID + "sheen{0%{left:-50%;}55%{left:105%;}100%{left:105%;}}",
      "." + ID + "-spark{position:absolute;border-radius:50%;background:#fff;opacity:0;animation:" + ID + "twinkle 2.4s ease-in-out infinite;pointer-events:none;filter:blur(.2px);}",
      "@keyframes " + ID + "twinkle{0%,100%{opacity:0;transform:translateY(2px) scale(.5);}45%{opacity:.85;transform:translateY(-2px) scale(1);}}",
      "." + ID + "-knob{position:absolute;top:50%;width:18px;height:18px;margin-left:-9px;margin-top:-9px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.5),0 0 calc(var(--halo) * 1px) rgba(185,155,255,.95);will-change:left;z-index:2;}",
      "." + ID + "-rng{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;appearance:none;-webkit-appearance:none;background:transparent;pointer-events:none;z-index:3;}",
      "." + ID + "-rng::-webkit-slider-thumb{-webkit-appearance:none;width:40px;height:40px;}",
      "." + ID + "-slhead{display:flex;align-items:center;justify-content:space-between;margin-top:6px;}",
      "." + ID + "-lvname{font:700 12px/1 inherit;color:hsl(calc(var(--hue,262) + 10) 92% 76%);letter-spacing:.6px;white-space:nowrap;}",
      "." + ID + "-lvname:after{content:' \\203A';opacity:.65;}",
      "." + ID + "-ticks{display:flex;justify-content:space-between;margin-top:7px;padding:0 2px;}",
      "." + ID + "-tick{font:600 9.5px/1 ui-monospace,Menlo,monospace;letter-spacing:1.1px;color:#4E5468;text-transform:uppercase;transition:color .2s;}",
      "." + ID + "-tick.on{color:#9AA6FF;text-shadow:0 0 10px rgba(130,140,255,.55);}",
      "@media (prefers-reduced-motion: reduce){." + ID + "-spark{animation:none;opacity:.45;}." + ID + "-sheen{animation:none;display:none;}}",      "." + ID + "-in{width:100%;box-sizing:border-box;margin-top:8px;height:40px;border-radius:11px;border:1px solid rgba(255,255,255,.09);background:rgba(0,0,0,.35);color:#DDE2F0;padding:0 12px;font:600 14px/1 inherit;}",
      "." + ID + "-ta{width:100%;box-sizing:border-box;margin-top:8px;min-height:110px;resize:vertical;border-radius:11px;border:1px solid rgba(255,255,255,.09);background:rgba(0,0,0,.35);color:#DDE2F0;padding:11px;font:500 12px/1.6 ui-monospace,Menlo,monospace;}",
      "." + ID + "-prev{margin-top:8px;font:500 11px/1.6 ui-monospace,Menlo,monospace;color:#9AA1B8;background:rgba(0,0,0,.3);border-radius:11px;padding:11px;white-space:pre-wrap;word-break:break-word;max-height:96px;overflow:hidden;}",
      "." + ID + "-prev.open{max-height:44vh;overflow:auto;}",
      "." + ID + "-btns{display:flex;gap:9px;margin-top:10px;}",
      "." + ID + "-btn{flex:1;height:44px;border-radius:13px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);color:#E9ECF5;font:600 13px/1 inherit;}",
      "." + ID + "-btn.primary{background:linear-gradient(120deg,#6E8BFF,#9B6BFF);border-color:transparent;color:#0A0B10;}",
      "." + ID + "-btn:disabled{opacity:.5;}",
      "." + ID + "-diag{font:500 10px/1.7 ui-monospace,Menlo,monospace;color:#6E7488;word-break:break-all;margin-top:10px;}",
      "." + ID + "-err{color:#FF8A8A;}",
      "." + ID + "-sig{margin-top:18px;padding-top:14px;border-top:1px solid rgba(255,255,255,.07);text-align:center;}",
      "." + ID + "-sig b{display:block;font:600 12px/1.6 -apple-system,sans-serif;letter-spacing:1.6px;color:#9AA1B8;}",
      "." + ID + "-sig span{display:block;margin-top:2px;font-size:10px;color:#5F6578;letter-spacing:.4px;}",
      "." + ID + "-toast{position:fixed;left:50%;bottom:calc(120px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147482200;padding:9px 16px;border-radius:11px;background:rgba(20,22,32,.96);border:1px solid rgba(255,255,255,.12);color:#E9ECF5;font:600 12px/1 inherit;}",
      "@media (prefers-reduced-motion: reduce){." + ID + "-sheet{animation:none;transform:none;}}",
    ].join("\n");

    function installCss() {
      try {
        if (document.getElementById(STYLE_ID)) return;
        var el = document.createElement("style");
        el.id = STYLE_ID;
        el.textContent = CSS;
        document.head.appendChild(el);
      } catch (e) { /* ignore */ }
    }

    class Boundary extends React.Component {
      constructor(p) { super(p); this.state = { bad: false }; }
      static getDerivedStateFromError() { return { bad: true }; }
      componentDidCatch(err) { try { console.warn("[" + ID + "] ui error", err); } catch (e) { /* ignore */ } }
      render() { return this.state.bad ? null : this.props.children; }
    }

    function Sw(props) {
      return h("button", {
        className: ID + "-sw" + (props.on ? " on" : ""),
        onClick: props.onToggle,
        "aria-pressed": props.on ? "true" : "false",
      });
    }

    /* ── 强度滑轨：连续拖动（跟手）+ 松手回弹（丝滑） ── */

    var TIER_EN = { lite: "Low", full: "Max", custom: "Ultra" };
    var LOCAL_TIERS = [
      { id: "lite", label: "Low", hint: "仅保留身份与收尾，最省 token" },
      { id: "full", label: "Max", hint: "全层 + 不做前置过滤 + 工具协议" },
      { id: "custom", label: "Ultra", hint: "你自己写，整段接管" },
    ];
    /* 旧配置里可能是 standard，统一折到 Max */
    function normTier(t) { return t === "standard" || !t ? "full" : t; }
    var TIER_DESC = {
      lite: "LOW · 仅保留身份与收尾",
      full: "MAX · 全层 + 不做前置过滤",
      custom: "ULTRA · 自定义全文接管",
    };
    var LV_GLOW = [".24", ".78", ".5"];
    var LV_HALO = ["6", "16", "11"];
    var LV_HUE = ["262", "274", "198"];
    var LV_SPARK = [4, 9, 6];

    function TierSlider(props) {
      var s = usePierce();
      var tiers = props.tiers && props.tiers.length ? props.tiers : LOCAL_TIERS;
      var n = tiers.length || 1;
      var cur = normTier(s.tier);
      var idx = 0;
      for (var i = 0; i < n; i++) if (tiers[i] && tiers[i].id === cur) idx = i;

      var st = React.useState(idx); var local = st[0]; var setLocal = st[1];
      var dg = React.useState(false); var drag = dg[0]; var setDrag = dg[1];

      var rootRef = React.useRef(null);
      var wrapRef = React.useRef(null);
      var fillRef = React.useRef(null);
      var glowRef = React.useRef(null);
      var knobRef = React.useRef(null);

      /* 自己跑动画：val 是画到屏幕上的位置，tgt 是目标位置，rAF 每帧逼近 */
      var valRef = React.useRef(idx);
      var tgtRef = React.useRef(idx);
      var rafRef = React.useRef(0);
      var dragRef = React.useRef(false);
      var localRef = React.useRef(idx);
      var saveTm = React.useRef(null);

      function geomOf(v) {
        var r = n > 1 ? v / (n - 1) : 1;
        var a = (r * 100).toFixed(2);
        var b = (r * 18).toFixed(1);
        return {
          knob: "calc(" + a + "% - " + b + "px + 9px)",
          fill: "calc(" + a + "% - " + b + "px + 18px)",
        };
      }

      /* 色相/光强按浮点位置连续插值：跨档时是渐变，不是切换 */
      function toneOf(v) {
        var x = Math.max(0, Math.min(2, v));
        var hue, glow, halo, grain;
        if (x <= 1) {
          hue = 262 + (274 - 262) * x;
          glow = 0.24 + (0.78 - 0.24) * x;
          halo = 6 + (16 - 6) * x;
          grain = 0.22 + (0.8 - 0.22) * x;
        } else {
          var t = x - 1;
          hue = 274 + (198 - 274) * t;
          glow = 0.78 + (0.5 - 0.78) * t;
          halo = 16 + (11 - 16) * t;
          grain = 0.8 + (0.5 - 0.8) * t;
        }
        return { hue: hue, glow: glow, halo: halo, grain: grain };
      }

      function paintAt(v) {
        var g = geomOf(v);
        var tone = toneOf(v);
        try {
          if (fillRef.current) {
            fillRef.current.style.transition = "background .3s";
            fillRef.current.style.width = g.fill;
          }
          if (glowRef.current) {
            glowRef.current.style.transition = "none";
            glowRef.current.style.width = g.fill;
          }
          if (knobRef.current) {
            knobRef.current.style.transition = "box-shadow .3s";
            knobRef.current.style.left = g.knob;
          }
          var host = rootRef.current || wrapRef.current;
          if (host) {
            host.style.setProperty("--glow", tone.glow.toFixed(3));
            host.style.setProperty("--halo", tone.halo.toFixed(2));
            host.style.setProperty("--hue", tone.hue.toFixed(1));
            host.style.setProperty("--grain", tone.grain.toFixed(3));
          }
        } catch (e) { /* ignore */ }
      }

      function tick() {
        var v = valRef.current;
        var t = tgtRef.current;
        var d = t - v;
        if (Math.abs(d) < 0.0015) {
          valRef.current = t;
          paintAt(t);
          rafRef.current = 0;
          return;
        }
        /* 拖动时跟手快（0.55），点击/松手时柔和收束（0.2）—— 这就是"丝滑"的来源 */
        valRef.current = v + d * (dragRef.current ? 0.55 : 0.2);
        paintAt(valRef.current);
        rafRef.current = RAF(tick);
      }

      function goTo(v) {
        tgtRef.current = v;
        if (!rafRef.current) rafRef.current = RAF(tick);
      }

      function ratioOf(e) {
        var el = wrapRef.current;
        if (!el) return 0;
        var rect = el.getBoundingClientRect();
        var usable = rect.width - 18;
        var x = Number(e.clientX || 0) - rect.left;
        var r = usable > 0 ? (x - 9) / usable : 0;
        return Math.max(0, Math.min(1, r));
      }

      function onDown(e) {
        dragRef.current = true;
        setDrag(true);
        goTo(ratioOf(e) * (n - 1));
        try {
          if (e.currentTarget && e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
        } catch (err) { /* ignore */ }
      }

      function onMove(e) {
        if (!dragRef.current) return;
        goTo(ratioOf(e) * (n - 1));
      }

      function onUp() {
        if (!dragRef.current) return;
        dragRef.current = false;
        setDrag(false);
        var v = Math.max(0, Math.min(n - 1, Math.round(tgtRef.current)));
        goTo(v);
        if (v !== localRef.current) { localRef.current = v; setLocal(v); }
        var t = tiers[v];
        if (t && t.id !== cur) {
          if (saveTm.current) clearTimeout(saveTm.current);
          saveTm.current = setTimeout(function () { save({ tier: t.id }); }, 40);
        }
      }

      React.useEffect(function () {
        localRef.current = idx;
        goTo(idx);
      }, [idx]);

      React.useEffect(function () {
        paintAt(valRef.current);
        return function () {
          if (rafRef.current) CAF(rafRef.current);
          if (saveTm.current) clearTimeout(saveTm.current);
        };
      }, []);

      var sparks = [];
      var count = LV_SPARK[Math.min(2, local)] || 5;
      for (var j = 0; j < count; j++) {
        var size = 1 + (j % 3);
        sparks.push(h("span", {
          key: "sp" + j,
          className: ID + "-spark",
          style: {
            left: (6 + (j * 37) % 86) + "%",
            top: (18 + (j * 53) % 62) + "%",
            width: size + "px", height: size + "px",
            animationDelay: (j * 0.23).toFixed(2) + "s",
          },
        }));
      }

      var label = (tiers[local] && (TIER_EN[tiers[local].id] || tiers[local].label)) || "";
      var geom = geomOf(local);

      return h("div", { ref: rootRef },
        h("div", {
          ref: wrapRef,
          className: ID + "-sl" + (drag ? " drag" : ""),
          onPointerDown: onDown,
          onPointerMove: onMove,
          onPointerUp: onUp,
          onPointerCancel: onUp,
          role: "slider",
          tabIndex: 0,
          "aria-valuemin": 0,
          "aria-valuemax": n - 1,
          "aria-valuenow": local,
          "aria-label": "强度",
        },
          h("div", { ref: glowRef, className: ID + "-glow", style: { width: geom.fill } }),
          h("div", { className: ID + "-track" },
            h("div", { ref: fillRef, className: ID + "-fill", style: { width: geom.fill } },
              h("div", { key: "sheen-" + local, className: ID + "-sheen" }),
              sparks
            ),
            h("div", { ref: knobRef, className: ID + "-knob", style: { left: geom.knob } }),
            h("input", {
              className: ID + "-rng",
              type: "range", min: 0, max: Math.max(0.001, n - 1), step: 0.001,
              defaultValue: idx,
              onChange: function (e) {
                var v = Number(e.target.value);
                if (!isFinite(v)) return;
                goTo(v);
                var k = Math.round(v);
                if (k !== localRef.current) { localRef.current = k; setLocal(k); }
              },
              "aria-label": "强度",
            })
          )
        ),
        h("div", { className: ID + "-ticks" },
          tiers.map(function (t, k) {
            return h("span", {
              key: "t" + k,
              className: ID + "-tick" + (k <= local ? " on" : ""),
              onPointerDown: function (ev) {
                ev.stopPropagation();
                goTo(k);
                if (k !== localRef.current) { localRef.current = k; setLocal(k); }
                var tt = tiers[k];
                if (tt && tt.id !== cur) save({ tier: tt.id });
              },
            }, TIER_EN[t.id] || t.label);
          })
        ),
        h("div", { className: ID + "-slhead" },
          h("div", { className: ID + "-sub", style: { margin: 0, flex: "1 1 auto", letterSpacing: ".3px" } },
            TIER_DESC[tiers[local] ? tiers[local].id : ""] || props.hint || ""),
          h("div", { className: ID + "-lvname", style: { marginLeft: 10, color: "hsl(calc(var(--hue, 262) + 2) 92% 76%)" } }, label)
        )
      );
    }

    /* ── 面板 ── */

    function Panel() {
      var s = usePierce();
      var a = React.useState(false); var open = a[0]; var setOpen = a[1];
      var b = React.useState(""); var draft = b[0]; var setDraft = b[1];

      React.useEffect(function () { load(); }, []);
      React.useEffect(function () { setDraft(s.custom || ""); }, [s.custom]);

      if (!s.open) return null;

      var live = s.enabled && s.applied && s.applied.ready;
      var tiers = LOCAL_TIERS;
      var cur = normTier(s.tier);
      var hint = "";
      for (var i = 0; i < tiers.length; i++) if (tiers[i].id === cur) hint = tiers[i].hint || "";
      var close = function () { emit({ open: false }); };

      return h("div", null,
        h("div", { className: ID + "-scrim", onClick: close }),
        h("div", { className: ID + "-sheet", role: "dialog", "aria-modal": "true" },
          h("div", { className: ID + "-grab" }),
          h("div", { className: ID + "-body" },
            h("div", { className: ID + "-hd" },
              h("div", { className: ID + "-ttl" },
                h("b", null, NAME),
                h("i", null, "v" + s.version),
                h("span", { className: ID + "-badge" + (live ? " live" : ""), style: { marginLeft: 4 } },
                  live ? "LIVE" : "IDLE")
              ),
              h("button", { className: ID + "-x", onClick: close, "aria-label": "关闭" }, "✕")
            ),

            h("div", { className: ID + "-card hero" },
              h("div", { className: ID + "-eyebrow" }, "Injection State"),
              h("div", { className: ID + "-row" },
                h("div", null,
                  h("div", { className: ID + "-k" }, "注入状态"),
                  h("div", { className: ID + "-v" }, s.enabled ? (live ? "已接管 · " + s.applied.chars + " 字符" : "已开启 · 未落位") : "未接管"),
                  h("div", { className: ID + "-sub" }, s.lastError ? "" : "改动即时生效，无需重启")
                ),
                h(Sw, { on: !!s.enabled, onToggle: function () { save({ enabled: !s.enabled }); } })
              )
            ),

            h("div", { className: ID + "-card" },
              h("div", { className: ID + "-eyebrow" }, "Intensity Level"),
              h("div", { className: ID + "-k" }, "强度"),
              h(TierSlider, { tiers: tiers, hint: hint }),
              h("div", { className: ID + "-spec" },
                "CORE ", h("b", null, "PIERCE"), " · ORDER ", h("b", null, String(s.order || 0)),
                " · CHARGE ", h("b", null, String(s.chars || 0)), " · RENDER ", h("b", null, String(s.renders || 0))
              )
            ),

            h("div", { className: ID + "-card" },
              h("div", { className: ID + "-eyebrow" }, "Persona Identity"),
              h("div", { className: ID + "-k" }, "人格名"),
              h("input", {
                className: ID + "-in", value: s.persona || "", placeholder: "小码酱",
                onChange: function (e) { emit({ persona: e.target.value }); },
                onBlur: function () { save({ persona: s.persona || "小码酱" }); },
              })
            ),

            s.tier === "custom" ? h("div", { className: ID + "-card" },
              h("div", { className: ID + "-eyebrow" }, "Custom Payload"),
              h("div", { className: ID + "-k" }, "自定义提示词"),
              h("div", { className: ID + "-sub", style: s.custom ? {} : { color: "#FF9E7A" } },
                s.custom ? "已载入 " + s.custom.length + " 字符" : "未填写 —— 此时注入为空，贴进来再保存"),
              h("textarea", {
                className: ID + "-ta", value: draft, placeholder: "把整段提示词贴进来…",
                onChange: function (e) { setDraft(e.target.value); }, spellCheck: false,
              }),
              h("div", { className: ID + "-btns" },
                h("button", { className: ID + "-btn primary", onClick: function () { save({ custom: draft }); } }, "保存文本")
              )
            ) : null,

            h("div", { className: ID + "-card" },
              h("div", { className: ID + "-row" },
                h("div", { className: ID + "-k" }, "注入预览"),
                h("button", {
                  className: ID + "-btn", style: { flex: "0 0 auto", width: 64, height: 28, fontSize: 11 },
                  onClick: function () { setOpen(!open); },
                }, open ? "收起" : "展开")
              ),
              h("div", { className: ID + "-prev" + (open ? " open" : "") }, s.preview || "（空）")
            ),

            h("div", { className: ID + "-btns" },
              h("button", { className: ID + "-btn primary", disabled: s.busy, onClick: function () { save({}); } }, s.busy ? "保存中…" : "立即生效"),
              h("button", { className: ID + "-btn", onClick: function () { reset(); } }, "恢复默认")
            ),

            h("div", { className: ID + "-diag" },
              "renders " + (s.renders || 0) + " · tier " + (s.applied && s.applied.tier ? s.applied.tier : "-") +
              " · order " + (s.order || 0) + " · chars " + (s.chars || 0),
              s.lastError ? h("div", { className: ID + "-err" }, "!" + s.lastError) : null
            ),

            h("div", { className: ID + "-sig" },
              h("b", null, AUTHOR),
              h("span", null, NAME + " 由 " + AUTHOR + " 创作 · Created by " + AUTHOR)
            )
          )
        ),
        s.toast ? h("div", { className: ID + "-toast" }, s.toast) : null
      );
    }

    /* ── 挂在对话标签栏里的那颗 chip ── */

    function Chip() {
      var s = usePierce();
      var live = s.enabled && s.applied && s.applied.ready;
      return h("button", {
        type: "button",
        className: CHIP_CLASS + (s.open ? " on" : ""),
        onClick: function () { emit({ open: !s.open }); },
        title: NAME,
      }, NAME);
    }

    var mountA = null;
    var mountB = null;
    var stopMount = null;

    function startMount() {
      if (typeof document === "undefined") return;
      installCss();

      var ensure = function () {
        try {
          // 固定复用同一个节点：portal 绑的是节点引用，重建会导致标签消失
          if (!mountA) mountA = document.createElement("span");
          var row = document.querySelector("[data-conversation-tabs]")
            || document.querySelector("[data-conversation-tabrow]")
            || document.querySelector("[role='tablist'][aria-label*='" + String.fromCharCode(0x5bf9, 0x8bdd) + "']")
            || document.querySelector("[role='tablist'][aria-label*='Conversation' i]");
          if (row && mountA.parentNode !== row) row.appendChild(mountA);
          if (!mountB) {
            mountB = document.createElement("div");
            mountB.id = ROOT_ID;
            document.body.appendChild(mountB);
          } else if (!mountB.isConnected && document.body) {
            document.body.appendChild(mountB);
          }
        } catch (e) { /* ignore */ }
      };

      ensure();
      var obs = null;
      try {
        if (typeof MutationObserver !== "undefined") {
          obs = new MutationObserver(function () { ensure(); });
          obs.observe(document.body, { childList: true, subtree: true });
        }
      } catch (e) { /* ignore */ }
      var iv = setInterval(ensure, 1200);
      stopMount = function () {
        try { clearInterval(iv); } catch (e) { /* ignore */ }
        try { if (obs) obs.disconnect(); } catch (e) { /* ignore */ }
      };
    }

    function Root() {
      var s = usePierce();
      React.useEffect(function () { load(); }, []);
      var chip = h(Boundary, null, h(Chip, null));
      var panel = h(Boundary, null, h(Panel, null));
      var out = [];
      try {
        if (RD && typeof RD.createPortal === "function") {
          if (mountA) out.push(RD.createPortal(chip, mountA));
          if (mountB) out.push(RD.createPortal(panel, mountB));
        }
      } catch (e) { /* ignore */ }
      return h(React.Fragment, null, out);
    }

    function apply(ctx) {
      var safe = function (label, fn) {
        try { return fn(); } catch (err) {
          try { ctx.logger && ctx.logger.warn && ctx.logger.warn("[" + ID + "] " + label + ": " + (err && err.message ? err.message : err)); } catch (e) { /* ignore */ }
          return undefined;
        }
      };

      safe("mark", function () { document.documentElement.setAttribute("data-" + ID, VERSION); });
      safe("mount", startMount);
      safe("hello", function () { api("/dsh-pierce/hello", {}).then(function () {}).catch(function () {}); });

      safe("slots", function () {
        if (!ctx.slots || typeof ctx.slots.inject !== "function") return;
        ctx.slots.inject("shell.overlay", function () {
          try {
            return ctx.slots.register({ name: "shell.overlay", id: ID + "-dock", order: 60, inject: function () { return {}; } }, function () {
              return h(Boundary, null, h(Root, null));
            });
          } catch (e) { return undefined; }
        });
      });

      safe("dispose", function () {
        if (typeof ctx.effect === "function") {
          ctx.effect(function () {
            return function () {
              try { if (stopMount) stopMount(); } catch (e) { /* ignore */ }
              try {
                var el = document.getElementById(STYLE_ID);
                if (el && el.parentNode) el.parentNode.removeChild(el);
                var r = document.getElementById(ROOT_ID);
                if (r && r.parentNode) r.parentNode.removeChild(r);
              } catch (e) { /* ignore */ }
            };
          }, ID + ": dispose");
        }
      });
    }

    exports.name = ID;
    exports.apply = apply;
    exports.inject = ["slots"];
    exports.version = VERSION;
    return module.exports;
  },
});
