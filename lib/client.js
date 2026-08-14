/**
 * @dsh-external/dsh-hide-reasoning — browser half (collapsible summary edition).
 *
 * Replaces every assistant reasoning ("思考") disclosure row in the DeepSeek
 * Harness conversation view with a compact collapsible summary card:
 *
 *   [ Thinking ^ ]               <- collapsed pill, click to expand
 *   ┌────────────────────────────────┐
 *   │ ◉ DeepSeek V3  ⭐ Streaming…  │   hero: model logo + name + token badge
 *   │  [18.6k]          [Thinking]   │         status + elapsed badge
 *   │ Context        18.6k tokens    │
 *   │ Reasoning      8 stages        │   derived from the real text at runtime
 *   │ Tools          Search · Files  │
 *   │ ────────────────────────────── │
 *   │ (full reasoning text, live)    │
 *   └────────────────────────────────┘
 *
 * The reasoning itself keeps running and streaming; only the presentation is
 * replaced. Every figure is derived from the real reasoning text and DOM
 * state — nothing is fabricated. The original row stays in the DOM as the
 * data source (hidden), so React reconciliation is never disturbed.
 *
 * Model badges: the model name is probed from the composer's model selector;
 * the badge renders the matching vendor logo (DeepSeek / OpenAI / Anthropic /
 * Gemini / Qwen), falling back to a generic reasoning glyph.
 *
 * Selector strategy (self-healing):
 *   1. Stable attribute rule (primary): the reasoning row root carries the
 *      semantic attribute data-variant="think", which is independent of the
 *      per-build CSS-module hash.
 *   2. Install-time probe (fallback): install.sh may replace
 *      __HIDE_REASONING_SELECTOR__ with the real per-build root class, and
 *      __THINKBODY_SELECTOR__ with the real body class.
 *   3. Degraded fallback: if the reasoning body cannot be located, the native
 *      row is left visible (data-hrx-keep) instead of hiding the only copy.
 */

window.__ModuleLoader__.load({
  id: "@dsh-external/dsh-hide-reasoning",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;

    var CSS_ID = "@dsh-external/dsh-hide-reasoning/client.css";
    var ATTR = '[data-variant="think"]';
    var PLUGIN_VERSION = "0.4.0";
    /* install.sh rewrites these literals with probed classes when available. */
    var HIDE_SELECTOR = "__HIDE_REASONING_SELECTOR__";
    var BODY_SELECTOR = "__THINKBODY_SELECTOR__";
    if (BODY_SELECTOR.indexOf("__") === 0) BODY_SELECTOR = '[class*="thinkBody"]';

    /* ------------------------------------------------------ model badges */

    var MODEL_LOGOS = {
      deepseek: {
        name: "DeepSeek",
        fill: "#4d6bfe",
        path: "M23.748 4.651c-.254-.124-.364.113-.512.233-.051.04-.094.09-.137.137-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.155-.708-.311-.955-.65-.172-.24-.219-.509-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.094.172.187.129.323-.082.28-.18.553-.266.833-.055.179-.137.218-.328.14a5.5 5.5 0 0 1-1.737-1.179c-.857-.828-1.631-1.743-2.597-2.46a12 12 0 0 0-.689-.47c-.985-.957.13-1.743.387-1.836.27-.098.094-.433-.778-.428-.872.003-1.67.295-2.687.685a3 3 0 0 1-.465.136 9.6 9.6 0 0 0-2.883-.101c-1.885.21-3.39 1.1-4.497 2.622C.082 8.776-.231 10.854.152 13.02c.403 2.284 1.568 4.175 3.36 5.653 1.857 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.132-.284 4.994-1.86.47.234.962.328 1.78.398.629.058 1.235-.031 1.705-.129.735-.155.684-.836.418-.961-2.155-1.004-1.682-.595-2.112-.926 1.095-1.295 2.768-3.598 3.284-6.733.05-.346.115-.834.108-1.114-.004-.171.035-.238.23-.257a4.2 4.2 0 0 0 1.545-.475c1.397-.763 1.96-2.016 2.093-3.517.02-.23-.004-.467-.247-.588M11.58 18.168c-2.088-1.642-3.101-2.183-3.52-2.16-.39.024-.32.472-.234.763.09.288.207.487.371.74.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.168-1.361-.801-2.5-1.86-3.301-3.306-.775-1.393-1.225-2.888-1.299-4.482-.02-.385.094-.522.477-.592a4.7 4.7 0 0 1 1.53-.038c2.131.311 3.946 1.264 5.467 2.774.868.86 1.525 1.887 2.202 2.89.72 1.066 1.494 2.082 2.48 2.915.348.291.626.513.892.677-.802.09-2.14.109-3.055-.615zm1.001-6.44a.306.306 0 0 1 .415-.287.3.3 0 0 1 .113.074.3.3 0 0 1 .086.214c0 .17-.136.307-.308.307a.303.303 0 0 1-.306-.307m3.11 1.596c-.2.081-.4.151-.591.16a1.25 1.25 0 0 1-.798-.254c-.274-.23-.47-.358-.551-.758a1.7 1.7 0 0 1 .015-.588c.07-.327-.007-.537-.238-.727-.188-.156-.426-.199-.689-.199a.6.6 0 0 1-.254-.078.253.253 0 0 1-.114-.358 1 1 0 0 1 .192-.21c.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.392.451.462.576.685.915.176.264.336.536.446.848.066.194-.02.353-.25.45"
      },
      openai: {
        name: "OpenAI",
        fill: "#10a37f",
        viewBox: "0 0 128 128",
        path: "M116.08484,51.5612512 C118.942613,42.9827523 117.960247,33.5883781 113.389602,25.7866659 C106.508682,13.8288345 92.6973243,7.67791081 79.2060928,10.5629523 C73.2060618,3.79625563 64.5786473,-0.0532364603 55.5351081,0.000556328614 C41.7355849,-0.0302926402 29.4968898,8.85809568 25.2575029,21.9903242 C16.3994728,23.8073685 8.75503049,29.3555286 4.28175645,37.2140378 C-2.63538569,49.152298 -1.0572143,65.196846 8.12533532,75.0522487 C5.30408008,83.9397207 6.52337742,93.4673455 12.5393652,101.382263 C19.2277697,110.307146 31.4433392,114.424476 42.7065853,111.383367 C49.1254864,118.605145 59.8978148,121.411042 69.7077002,118.443011 C79.2701096,115.654536 86.3424158,108.234347 88.4015869,99.2635822 C90.2913179,98.2610479 92.1006859,97.0481775 93.7754011,95.6640704 C94.7615631,98.8660351 96.4820231,101.690655 98.8082009,103.936004 C104.989611,110.234494 115.511567,110.578089 122.112347,104.701385 C128.713128,98.8246814 129.493282,88.3379943 123.89231,81.5181834 C126.551175,73.6825659 124.869447,64.4933612 118.964925,58.4519443 C119.057991,56.1787219 119.054171,53.850278 116.08484,51.5612512 Z M113.545364,83.8248954 C113.55577,86.5752666 111.665584,88.9965349 109.080277,89.7263911 C107.172505,90.2731038 105.305617,89.7298686 103.888012,88.5169983 C102.470408,87.304128 101.639586,85.4817096 101.566164,83.5406066 C101.492742,81.5995036 102.155032,79.7101925 103.455138,78.2300288 C105.276454,76.2000056 108.195086,75.6717399 110.650906,76.9724751 C112.336829,77.8886203 113.528061,79.7681414 113.545364,81.6913968 L113.545364,83.8248954 Z M86.1018896,38.4519196 C88.0366923,38.4519196 89.6064611,40.0216884 89.6064611,41.9564911 C89.6064611,43.8912939 88.0366923,45.4610627 86.1018896,45.4610627 C84.1670869,45.4610627 82.5973181,43.8912939 82.5973181,41.9564911 C82.5973181,40.0216884 84.1670869,38.4519196 86.1018896,38.4519196 Z M55.8721145,35.5292602 C58.3231569,35.5292602 60.3099402,37.5160436 60.3099402,39.967086 C60.3099402,42.4181284 58.3231569,44.4049118 55.8721145,44.4049118 C53.4210721,44.4049118 51.4342887,42.4181284 51.4342887,39.967086 C51.4342887,37.5160436 53.4210721,35.5292602 55.8721145,35.5292602 Z M72.8526362,23.6205699 C75.3036786,23.6205699 77.290462,25.6073533 77.290462,28.0583957 C77.290462,30.5094381 75.3036786,32.4962215 72.8526362,32.4962215 C70.4015938,32.4962215 68.4148104,30.5094381 68.4148104,28.0583957 C68.4148104,25.6073533 70.4015938,23.6205699 72.8526362,23.6205699 Z M94.3102968,23.6205699 C96.7613392,23.6205699 98.7481226,25.6073533 98.7481226,28.0583957 C98.7481226,30.5094381 96.7613392,32.4962215 94.3102968,32.4962215 C91.8592544,32.4962215 89.872471,30.5094381 89.872471,28.0583957 C89.872471,25.6073533 91.8592544,23.6205699 94.3102968,23.6205699 Z"
      },
      anthropic: {
        name: "Claude",
        fill: "#d97757",
        path: "M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z"
      },
      gemini: {
        name: "Gemini",
        fill: "#8e75b2",
        path: "M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81"
      },
      qwen: {
        name: "Qwen",
        fill: "#6950ef",
        path: "M23.919 14.545 20.817 9.17l1.47-2.544a.56.56 0 0 0 0-.566l-1.633-2.83a.57.57 0 0 0-.49-.283h-6.207L12.487.402a.57.57 0 0 0-.49-.284H8.732a.56.56 0 0 0-.49.284L5.139 5.775h-2.94a.56.56 0 0 0-.49.284L.077 8.887a.56.56 0 0 0 0 .567L3.18 14.83l-1.47 2.545a.56.56 0 0 0 0 .566l1.634 2.83a.57.57 0 0 0 .49.283h6.205l1.47 2.545a.57.57 0 0 0 .49.284h3.266a.57.57 0 0 0 .49-.284l3.104-5.375h2.94a.57.57 0 0 0 .49-.283l1.634-2.828a.55.55 0 0 0-.004-.568M8.733.686l1.634 2.828-1.634 2.828H21.8L20.164 9.17H7.425L5.63 6.06Zm1.306 19.801-6.205-.002 1.634-2.83h3.265L2.201 6.344h3.267q3.182 5.517 6.367 11.032zm10.124-5.66L18.53 12l-6.532 11.315-1.634-2.83c2.129-3.673 4.25-7.351 6.373-11.028h3.592l3.102 5.374z"
      }
    };

    /* Probe the model name from the composer's model selector (best effort).
       The model selector is the only trigger with an "effort" badge
       (_7KE1Ra_triggerEffort), so we anchor on that and read the label from
       the same trigger container; plain [class*="triggerLabel"] would match
       unrelated triggers (e.g. the "设置/Settings" menu) first in document
       order. */
    var MODEL_EFFORT_SELECTORS = [
      '[class*="_triggerEffort"]',
      '[class*="triggerEffort"]'
    ];
    var MODEL_LABEL_SELECTORS = [
      '[class*="_triggerLabel"]',
      '[class*="triggerLabel"]',
      '[class*="modelName"]',
      '[class*="model-name"]'
    ];
    var NON_MODEL_LABELS = /^(设置|settings|workspace|workspace write|工作区|会话|session|new session|新会话|new chat|新聊天)$/i;

    var lastProbeAt = 0;
    var lastProbeName = "";
    var probeFailStreak = 0;

    function probeModelName() {
      /* Throttle with backoff: probe at most every 2s; on repeated failures
         back off so an unresolved selector doesn't scan the page forever. */
      var now = Date.now();
      var backoff = probeFailStreak > 0 ? Math.min(probeFailStreak * 2000, 30000) : 2000;
      if (now - lastProbeAt < backoff) return lastProbeName;
      lastProbeAt = now;
      var found = "";

      try {
        /* 1) Anchor on the effort badge: it only exists inside the model
              selector trigger; read the sibling label from its container.
              Also apply the non-model filter (stage 1 was unfiltered). */
        for (var i = 0; i < MODEL_EFFORT_SELECTORS.length && !found; i++) {
          var effort = document.querySelector(MODEL_EFFORT_SELECTORS[i]);
          if (!effort) continue;
          var trig = effort.parentElement;
          var lbl = trig ? trig.querySelector('[class*="triggerLabel"], [class*="Label"], [class*="label"]') : null;
          var t = lbl ? (lbl.textContent || "").trim() : "";
          if (t && !NON_MODEL_LABELS.test(t)) found = t;
        }

        /* 2) Fallback: first non-generic label inside the composer seat. */
        if (!found) {
          var seat = document.querySelector('[data-composer-seat], [data-slot="conversation.composer"]');
          var scope = seat || document;
          var labels = scope.querySelectorAll(MODEL_LABEL_SELECTORS.join(","));
          for (var j = 0; j < labels.length && !found; j++) {
            var txt = (labels[j].textContent || "").trim();
            if (txt && !NON_MODEL_LABELS.test(txt)) found = txt;
          }
        }

        /* 3) Last resort: any non-generic model-like label on the page. */
        if (!found) {
          var all = document.querySelectorAll(MODEL_LABEL_SELECTORS.join(","));
          for (var k = 0; k < all.length && !found; k++) {
            var t2 = (all[k].textContent || "").trim();
            if (t2 && !NON_MODEL_LABELS.test(t2)) found = t2;
          }
        }
      } catch (error) {
        /* ignore probing failures */
      }

      probeFailStreak = found ? 0 : probeFailStreak + 1;
      lastProbeName = found;
      return found;
    }

    function matchLogo(name) {
      var n = (name || "").toLowerCase();
      /* Word-boundary anchored so short codes like /o[134]/ don't match
         mid-token (e.g. "Ro1and" must not show the OpenAI logo). */
      if (/\bdeepseek\b/.test(n)) return MODEL_LOGOS.deepseek;
      if (/\b(?:gpt|openai|o[134])\b/.test(n)) return MODEL_LOGOS.openai;
      if (/\b(?:claude|anthropic)\b/.test(n)) return MODEL_LOGOS.anthropic;
      if (/\bgemini\b/.test(n)) return MODEL_LOGOS.gemini;
      if (/\bqwen\b/.test(n) || /通义/.test(n)) return MODEL_LOGOS.qwen;
      return null;
    }

    /* ------------------------------------------------------------ styles */

    var CSS = [
      /* Hide the native disclosure row; our card replaces it. Both the
         stable attribute selector and the install-probed class apply, so
         hiding works even if install.sh was never run. */
      ATTR + "{display:none!important}",
      HIDE_SELECTOR + "{display:none!important}",
      /* Degraded fallback: rows whose reasoning body cannot be located stay
         visible (native) rather than hidden with no way to read them. */
      ATTR + "[data-hrx-keep]{display:flex!important}",

      ".hrx-wrap{margin:4px 0;font-family:inherit}",

      ".hrx-tag{display:inline-flex;align-items:center;gap:6px;background:#c23ab2;" +
        "color:#fff;border:none;border-radius:999px;padding:4px 12px;" +
        "font-size:13px;line-height:20px;cursor:pointer;user-select:none;" +
        "transition:background .15s ease,transform .1s ease}",
      ".hrx-tag:hover{background:#a62b92}",
      ".hrx-tag:active{transform:scale(.97)}",
      ".hrx-tag:focus-visible{outline:2px solid rgba(194,58,178,.5);outline-offset:2px}",
      ".hrx-chev{width:14px;height:14px;flex:none;transition:transform .2s ease}",
      ".hrx-tag[aria-expanded=\"true\"] .hrx-chev{transform:rotate(180deg)}",

      ".hrx-card{margin-top:6px;max-width:640px;background:var(--dsw-alias-bg-base,#fff);" +
        "border:1px solid var(--dsw-alias-border-l2,#ececec);border-radius:12px;" +
        "box-shadow:0 2px 10px rgba(0,0,0,.06);overflow:hidden}",

      ".hrx-hero{display:flex;justify-content:space-between;align-items:center;" +
        "gap:12px;padding:10px 14px;border-bottom:1px solid var(--dsw-alias-border-l2,#f0f0f0)}",
      ".hrx-hero-item{display:flex;align-items:center;gap:7px;min-width:0}",
      ".hrx-hero-ico{width:16px;height:16px;flex:none;border-radius:4px}",
      ".hrx-hero-name{font-size:13px;font-weight:600;" +
        "color:var(--dsw-alias-label-primary,#333);white-space:nowrap;" +
        "overflow:hidden;text-overflow:ellipsis}",
      ".hrx-badge{flex:none;border-radius:5px;padding:1px 7px;font-size:11px;" +
        "line-height:18px;font-weight:600;letter-spacing:.2px;background:#e8f1ff;color:#0756d4}",
      "@media (prefers-color-scheme:dark){.hrx-badge{background:#1e3a5f;color:#8ab4f8}}",

      ".hrx-list{padding:6px 14px}",
      ".hrx-row{display:flex;justify-content:space-between;align-items:center;" +
        "gap:16px;padding:5px 0;font-size:13px;line-height:20px}",
      ".hrx-row+.hrx-row{border-top:1px solid var(--dsw-alias-border-l2,#f5f5f5)}",
      ".hrx-row-label{color:var(--dsw-alias-label-secondary,#666);flex:none}",
      ".hrx-row-value{color:var(--dsw-alias-label-primary,#333);" +
        "font-variant-numeric:tabular-nums;text-align:right;min-width:0;" +
        "overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",

      ".hrx-body{padding:8px 14px 12px;max-height:44vh;overflow:auto;font-size:13px;" +
        "line-height:22px;white-space:pre-wrap;word-break:break-word;" +
        "color:var(--dsw-alias-label-secondary,#555);" +
        "border-top:1px solid var(--dsw-alias-border-l2,#f0f0f0)}",
      ".hrx-body:empty{display:none}",

      "@media (prefers-reduced-motion:reduce){.hrx-tag,.hrx-chev{transition:none}}"
    ].join("\n");

    /* ---------------------------------------------------------------- utils */

    function inject(text) {
      if (typeof document === "undefined") return;
      var old = document.querySelector('style[data-plugin-css="' + CSS_ID + '"]');
      if (old !== null) old.remove();
      var tag = document.createElement("style");
      tag.dataset.plugin = "@dsh-external/dsh-hide-reasoning";
      tag.dataset.pluginCss = CSS_ID;
      tag.textContent = text;
      document.head.appendChild(tag);
    }

    function el(tag, className) {
      var node = document.createElement(tag);
      if (className) node.className = className;
      return node;
    }

    var SVG_NS = "http://www.w3.org/2000/svg";

    function svg(className, attrs) {
      var s = document.createElementNS(SVG_NS, "svg");
      s.setAttribute("class", className);
      s.setAttribute("viewBox", "0 0 24 24");
      s.setAttribute("width", "16");
      s.setAttribute("height", "16");
      s.setAttribute("aria-hidden", "true");
      if (attrs) {
        for (var i = 0; i < attrs.length; i++) {
          var child = document.createElementNS(SVG_NS, attrs[i].tag);
          var keys = Object.keys(attrs[i]);
          for (var j = 0; j < keys.length; j++) {
            var k = keys[j];
            if (k !== "tag") child.setAttribute(k, String(attrs[i][k]));
          }
          s.appendChild(child);
        }
      }
      return s;
    }

    function text(node, value) {
      node.textContent = value == null || value === "" ? "—" : String(value);
    }

    /* ------------------------------------------------------------- metrics */

    /* Single-pass counter — avoids allocating a match() array of every CJK
       char on each refresh (large transient GC pressure during streaming). */
    function estimateTokens(t) {
      if (!t) return 0;
      var cjk = 0;
      for (var i = 0; i < t.length; i++) {
        var c = t.charCodeAt(i);
        if ((c >= 0x4e00 && c <= 0x9fff) || (c >= 0x3040 && c <= 0x30ff) || (c >= 0xac00 && c <= 0xd7af)) cjk++;
      }
      return Math.round(cjk + (t.length - cjk) / 4);
    }

    function fmtCount(n) {
      if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
      if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
      return String(n);
    }

    var STAGE_CAP = 20; /* paragraphs are a weak proxy for "stages"; cap it */

    function countStages(t) {
      if (!t) return 0;
      var m = t.match(/(?:step|stage|phase|第[\u4e00-\u9fff\d]+[步阶段]|步骤[\d一二三四五六七八九十]+)\s*[#:\s]*[\d一二三四五六七八九十]+/gi);
      if (m && m.length > 1) return Math.min(m.length, STAGE_CAP);
      var paras = t.split(/\n{2,}/).filter(function (s) { return s.trim(); });
      return Math.min(Math.max(0, paras.length), STAGE_CAP);
    }

    /* Global flag is REQUIRED: without /g, exec() never advances and this
       loop would spin forever on the first match (page freeze). */
    var TOOL_RE = /\b(python|search|bash|shell|grep|curl|ffmpeg|browser|subagent|filesystem)\b/gi;

    function detectTools(t) {
      if (!t) return [];
      var hits = {};
      var re = TOOL_RE;
      re.lastIndex = 0;
      var m;
      var guard = 0;
      while ((m = re.exec(t)) !== null) {
        hits[m[1].toLowerCase()] = true;
        if (++guard > 64) break; /* defensive: never spin */
      }
      var order = ["search", "python", "bash", "shell", "grep", "curl", "ffmpeg", "browser", "subagent", "filesystem"];
      var names = { search: "Search", python: "Python", bash: "Bash", shell: "Shell", grep: "Grep", curl: "curl", ffmpeg: "ffmpeg", browser: "Browser", subagent: "Subagent", filesystem: "Files" };
      var out = [];
      for (var i = 0; i < order.length; i++) {
        if (hits[order[i]]) out.push(names[order[i]]);
      }
      return out.slice(0, 4);
    }

    /* ---------------------------------------------------------------- DOM */

    function buildCard() {
      var card = el("div", "hrx-card");
      card.hidden = true;

      var hero = el("div", "hrx-hero");

      var left = el("div", "hrx-hero-item");
      var leftIco = svg("hrx-hero-ico", [
        { tag: "circle", cx: "12", cy: "12", r: "8.5", fill: "none", stroke: "currentColor", "stroke-width": "1.6" },
        { tag: "circle", cx: "12", cy: "12", r: "3", fill: "currentColor" }
      ]);
      var leftName = el("span", "hrx-hero-name");
      text(leftName, "Reasoning");
      var badgeTokens = el("span", "hrx-badge");
      text(badgeTokens, "—");
      left.appendChild(leftIco);
      left.appendChild(leftName);
      left.appendChild(badgeTokens);

      var right = el("div", "hrx-hero-item");
      var rightIco = svg("hrx-hero-ico", [
        { tag: "path", fill: "#ffa500", d: "M12 2l2.4 5.4 5.9.7-4.4 4 1.2 5.8L12 14.9l-5.1 3 1.2-5.8-4.4-4 5.9-.7z" }
      ]);
      var rightName = el("span", "hrx-hero-name");
      text(rightName, "Done");
      var badgeElapsed = el("span", "hrx-badge");
      text(badgeElapsed, "—");
      right.appendChild(rightIco);
      right.appendChild(rightName);
      right.appendChild(badgeElapsed);

      hero.appendChild(left);
      hero.appendChild(right);

      var list = el("div", "hrx-list");
      var rows = [
        ["Context", "hrx-context"],
        ["Reasoning", "hrx-stages"],
        ["Tools", "hrx-tools"],
        ["Completion", "hrx-completion"]
      ];
      var fields = {};
      for (var i = 0; i < rows.length; i++) {
        var r = el("div", "hrx-row");
        var label = el("span", "hrx-row-label");
        text(label, rows[i][0]);
        var value = el("span", "hrx-row-value");
        value.className = "hrx-row-value " + rows[i][1];
        text(value, "—");
        r.appendChild(label);
        r.appendChild(value);
        list.appendChild(r);
        fields[rows[i][1]] = value;
      }

      var body = el("div", "hrx-body");

      card.appendChild(hero);
      card.appendChild(list);
      card.appendChild(body);

      return {
        card: card,
        body: body,
        badgeTokens: badgeTokens,
        badgeElapsed: badgeElapsed,
        leftIco: leftIco,
        leftName: leftName,
        rightName: rightName,
        context: fields["hrx-context"],
        stages: fields["hrx-stages"],
        tools: fields["hrx-tools"],
        completion: fields["hrx-completion"]
      };
    }

    function buildWrap() {
      var wrap = el("div", "hrx-wrap");

      var card = buildCard();
      card.card.id = "hrx-card-" + Math.random().toString(36).slice(2, 8);

      var tag = el("button", "hrx-tag");
      tag.type = "button";
      tag.setAttribute("aria-expanded", "false");
      tag.setAttribute("aria-controls", card.card.id);
      tag.appendChild(svg("hrx-chev", [{ tag: "path", fill: "currentColor", d: "M12 6.5l5 6.5H7z" }]));
      var label = el("span");
      text(label, "Thinking");
      tag.insertBefore(label, tag.firstChild);

      tag.addEventListener("click", function () {
        /* BUGFIX: `card` is the buildCard() result OBJECT; the DOM element
           is `card.card`. Toggling `card.hidden` previously mutated the JS
           object and never showed the panel. */
        var willOpen = card.card.hidden;
        card.card.hidden = !willOpen;
        tag.setAttribute("aria-expanded", String(willOpen));
      });

      wrap.appendChild(tag);
      wrap.appendChild(card.card);
      return { wrap: wrap, card: card };
    }

    /* ------------------------------------------------------------- refresh */

    function setLogo(svgNode, logo) {
      var ns = SVG_NS;
      while (svgNode.firstChild) svgNode.removeChild(svgNode.firstChild);
      if (logo) {
        svgNode.setAttribute("viewBox", logo.viewBox || "0 0 24 24");
        var path = document.createElementNS(ns, "path");
        path.setAttribute("fill", logo.fill);
        path.setAttribute("d", logo.path);
        svgNode.appendChild(path);
      } else {
        svgNode.setAttribute("viewBox", "0 0 24 24");
        var c1 = document.createElementNS(ns, "circle");
        c1.setAttribute("cx", "12"); c1.setAttribute("cy", "12");
        c1.setAttribute("r", "8.5"); c1.setAttribute("fill", "none");
        c1.setAttribute("stroke", "currentColor"); c1.setAttribute("stroke-width", "1.6");
        var c2 = document.createElementNS(ns, "circle");
        c2.setAttribute("cx", "12"); c2.setAttribute("cy", "12"); c2.setAttribute("r", "3");
        c2.setAttribute("fill", "currentColor");
        svgNode.appendChild(c1);
        svgNode.appendChild(c2);
      }
    }

    function refresh(row, rec) {
      /* IMPORTANT: the native ReasoningRow keeps its full text in a
         `.thinkBody` element that is ONLY rendered while the native
         disclosure is open (DisclosureRow: `open && children`). For a
         collapsed row we fall back to the native one-line summary (NOT
         row.textContent, which would pollute stats with the "Think"
         title) and let the per-row observer pick up the full body once
         `tryOpenNative` has expanded it. */
      var bodyEl = row.querySelector(BODY_SELECTOR);
      var hasBody = bodyEl !== null;
      var t = "";
      if (hasBody) {
        t = bodyEl.textContent || "";
      } else {
        var sum = row.querySelector('[class*="summary"], [class*="Summary"]');
        t = sum ? (sum.textContent || "") : "";
      }
      var running = row.getAttribute("data-state") === "running";

      var tokens = estimateTokens(t);
      var stages = countStages(t);
      var tools = detectTools(t);

      /* Model badge: re-probe throttled; only touch the DOM when the logo
         actually changes (logo path is multi-KB — don't rewrite it each
         refresh during streaming). */
      var modelName = probeModelName();
      var logo = matchLogo(modelName);
      if (logo !== rec.lastLogo) {
        rec.lastLogo = logo;
        setLogo(rec.card.leftIco, logo);
        text(rec.card.leftName, logo ? logo.name : "Reasoning");
      }

      text(rec.card.badgeTokens, fmtCount(tokens));
      text(rec.card.context, fmtCount(tokens) + " tokens");
      text(rec.card.stages, stages > 0 ? stages + (stages > 1 ? " stages" : " stage") : "—");
      text(rec.card.tools, tools.length ? tools.join(" · ") : "None");

      /* Never shrink the card body back to the summary once the full text
         was captured (e.g. React re-collapses the disclosure in place and
         thinkBody unmounts). Only update the body from the FULL source;
         keep the longest text seen. */
      if (hasBody) {
        if (rec.card.body.textContent !== t) text(rec.card.body, t);
      } else if (rec.bodySeen) {
        /* thinkBody gone after we had full text — keep what we have */
        if (t.length > rec.card.body.textContent.length) text(rec.card.body, t);
      } else {
        /* first paint, only summary available */
        if (rec.card.body.textContent !== t) text(rec.card.body, t);
        if (t) rec.bodySeen = false; /* summary only; wait for full body */
      }
      if (hasBody && t) rec.bodySeen = true;

      if (running) {
        if (rec.startAt === null) rec.startAt = Date.now();
        text(rec.card.rightName, "Streaming…");
        text(rec.card.badgeElapsed, "Thinking");
        text(rec.card.completion, "…");
      } else {
        if (rec.startAt !== null && rec.doneAt === null) rec.doneAt = Date.now();
        text(rec.card.rightName, "Done");
        if (rec.startAt !== null && rec.doneAt !== null) {
          var ms = rec.doneAt - rec.startAt;
          text(rec.card.badgeElapsed, (ms / 1000).toFixed(1) + "s");
          text(rec.card.completion, (ms / 1000).toFixed(1) + "s");
        } else {
          /* Row was already finished when we attached — real duration is
             unknown; never fabricate 0.0s. */
          text(rec.card.badgeElapsed, "—");
          text(rec.card.completion, "—");
        }
      }
    }

    /* ---------------------------------------------------------------- life */

    var registry = new Map(); // row -> { wrap, card, lastLogo, startAt, doneAt, obs, bodySeen, openAttempts }
    var pending = new Set();
    var refreshTimer = null;

    function queueRefresh(row) {
      pending.add(row);
      if (refreshTimer !== null) return;
      refreshTimer = setTimeout(function () {
        refreshTimer = null;
        try {
          pending.forEach(function (r) {
            var rec = registry.get(r);
            if (rec) refresh(r, rec);
          });
        } catch (error) {
          /* one failing row must not abort the batch */
        } finally {
          pending.clear();
        }
      }, 150);
    }

    /* Open the native disclosure row (simulated click) so React mounts the
       `.thinkBody` element containing the FULL reasoning text. Until then
       refresh() falls back to the native one-line summary. */
    function tryOpenNative(row) {
      var openRow = row.querySelector('[data-disclosure-row]');
      if (!openRow) return;
      if (openRow.getAttribute("aria-expanded") === "true") return;
      try {
        openRow.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
      } catch (error) {
        /* ignore — text fallback keeps working */
      }
    }

    function attach(row) {
      if (row.hasAttribute("data-hrx-row")) return;
      if (!row.parentNode || !row.isConnected) return;

      /* v0.3.0 may have left a stale data-hrx-keep marker on rows whose
         (collapsed) body was not yet mounted; clear it and take over. */
      row.removeAttribute("data-hrx-keep");

      row.setAttribute("data-hrx-row", "1");

      var ui = buildWrap();
      row.parentNode.insertBefore(ui.wrap, row);

      var rec = {
        wrap: ui.wrap,
        card: ui.card,
        lastLogo: undefined,
        startAt: null,
        doneAt: null,
        obs: null,
        bodySeen: false,
        openAttempts: 0,
        keepTimer: null
      };

      var obs = new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var m = muts[i];
          if (m.type === "attributes" && m.attributeName === "data-state") {
            if (row.getAttribute("data-state") === "running") {
              if (rec.startAt === null) rec.startAt = Date.now();
            } else if (rec.startAt !== null && rec.doneAt === null) {
              rec.doneAt = Date.now();
            }
          }
        }
        /* Retry opening the native disclosure: the row may have been
           streaming with no [data-disclosure-row] mounted at attach time,
           or React may have re-rendered the toggle since. */
        if (rec.openAttempts < 5) {
          var openRow = row.querySelector('[data-disclosure-row]');
          if (openRow && openRow.getAttribute("aria-expanded") !== "true") {
            rec.openAttempts++;
            tryOpenNative(row);
          }
        }
        queueRefresh(row);
      });
      obs.observe(row, {
        childList: true,
        characterData: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["data-state"]
      });
      rec.obs = obs;

      registry.set(row, rec);
      refresh(row, rec);

      /* Expand the native disclosure so the full text mounts; the observer
         above then refreshes the card with the complete reasoning. */
      tryOpenNative(row);

      /* Degraded fallback: if the full body still can't be mounted after a
         grace period, keep the NATIVE row visible (data-hrx-keep) so the
         reasoning is never hidden with no readable copy. */
      rec.keepTimer = setTimeout(function () {
        if (!row.isConnected || !registry.has(row)) return;
        if (row.querySelector(BODY_SELECTOR)) return; /* full body arrived */
        var openRow = row.querySelector('[data-disclosure-row]');
        if (openRow && openRow.getAttribute("aria-expanded") === "true") return;
        if (rec.bodySeen) return; /* we already captured full text */
        /* give up on the card for this row: restore the native row */
        try { rec.obs.disconnect(); } catch (error) { /* noop */ }
        if (rec.wrap && rec.wrap.parentNode) rec.wrap.remove();
        registry.delete(row);
        row.removeAttribute("data-hrx-row");
        row.setAttribute("data-hrx-keep", "1");
      }, 2500);
    }

    function handleRemoved(row) {
      var rec = registry.get(row);
      if (!rec) return;
      if (row.isConnected) {
        /* React moved the row (re-keying); keep our wrap glued in front. */
        if (rec.wrap.parentNode !== row.parentNode || rec.wrap.nextSibling !== row) {
          row.parentNode.insertBefore(rec.wrap, row);
        }
        return;
      }
      if (rec.keepTimer !== null) {
        clearTimeout(rec.keepTimer);
        rec.keepTimer = null;
      }
      rec.obs.disconnect();
      rec.wrap.remove();
      registry.delete(row);
      row.removeAttribute("data-hrx-row");
      row.removeAttribute("data-hrx-keep");
    }

    var observer = null;
    var started = false;

    function dispose() {
      if (observer !== null) {
        observer.disconnect();
        observer = null;
      }
      if (refreshTimer !== null) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
      }
      pending.clear();
      registry.forEach(function (rec) {
        try { rec.obs.disconnect(); } catch (error) { /* noop */ }
        if (rec.keepTimer !== null) clearTimeout(rec.keepTimer);
        if (rec.wrap && rec.wrap.parentNode) rec.wrap.remove();
      });
      registry.clear();
      var style = document.querySelector('style[data-plugin-css="' + CSS_ID + '"]');
      if (style !== null) style.remove();
      var rows = document.querySelectorAll('[data-hrx-row], [data-hrx-keep]');
      for (var i = 0; i < rows.length; i++) {
        rows[i].removeAttribute("data-hrx-row");
        rows[i].removeAttribute("data-hrx-keep");
      }
      started = false;
    }

    function start() {
      /* HMR / double-load safety: dispose a previous instance first so
         observers and styles never accumulate. A stale cached OLDER bundle
         must not clobber a newer one. */
      var prev = window.__dshrHideReasoning;
      if (prev) {
        var prevV = Number(prev.version);
        var curV = Number(PLUGIN_VERSION);
        if (prevV > curV) return; /* newer instance already active */
        try { prev.dispose(); } catch (error) { /* noop */ }
      }
      window.__dshrHideReasoning = { version: PLUGIN_VERSION, dispose: dispose };

      if (started || observer !== null) return;
      if (typeof document === "undefined" || !document.body) {
        document.addEventListener("DOMContentLoaded", start);
        return;
      }
      started = true;
      inject(CSS);
      var rows = document.querySelectorAll(ATTR);
      for (var i = 0; i < rows.length; i++) attach(rows[i]);

      observer = new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var m = muts[i];
          var j, n, q, k;
          for (j = 0; j < m.addedNodes.length; j++) {
            n = m.addedNodes[j];
            if (n.nodeType !== 1) continue;
            if (n.matches && n.matches(ATTR)) attach(n);
            q = n.querySelectorAll ? n.querySelectorAll(ATTR) : [];
            for (k = 0; k < q.length; k++) attach(q[k]);
          }
          for (j = 0; j < m.removedNodes.length; j++) {
            n = m.removedNodes[j];
            if (n.nodeType !== 1) continue;
            if (n.matches && n.matches('[data-hrx-row="1"], [data-hrx-keep="1"]')) handleRemoved(n);
            q = n.querySelectorAll ? n.querySelectorAll('[data-hrx-row="1"], [data-hrx-keep="1"]') : [];
            for (k = 0; k < q.length; k++) handleRemoved(q[k]);
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    exports.inject = [];
    exports.apply = function apply() {
      start();
    };

    /* Inject immediately so the rule exists before the first paint. */
    start();

    return module.exports;
  },
});
