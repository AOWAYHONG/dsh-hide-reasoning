# dsh-hide-reasoning

A DeepSeek Harness client plugin that replaces every assistant **reasoning
("思考") disclosure row** in the conversation view with a **collapsible
summary card** — the reasoning itself keeps running and streaming; only the
presentation changes.

[中文说明 (Chinese README)](README.md)

## Authors

- **AOWAYHONG** — plugin design, implementation and maintenance
- **jbwu091-jdbsh** — co-author / collaborator

## What it looks like

Each reasoning row collapses to a pink pill:

```
[ Thinking ^ ]
```

Click to expand the summary card:

```
┌────────────────────────────────┐
│ ◉ DeepSeek V3   ⭐ Streaming…  │   model badge + name + token badge | status + elapsed badge
│  [18.6k]           [Thinking]  │
│ Context         18.6k tokens   │
│ Reasoning       8 stages       │   derived from the real reasoning text at runtime
│ Tools           Search · Files │
│ ────────────────────────────── │
│ (full reasoning text, live)    │
└────────────────────────────────┘
```

## Features

- **Model badges** — probes the model name from the composer's model
  selector (anchored on the effort badge that only the model selector has,
  so it never mis-matches the "Settings" menu), then renders the matching
  vendor logo: **DeepSeek** (whale) / **OpenAI** / **Claude** / **Gemini** /
  **Qwen**. Unknown models fall back to a generic reasoning glyph.
- **Honest metrics** — every figure is derived from the real reasoning text
  and DOM state; nothing is fabricated. Definitions:

  | Metric | Source | Definition |
  |---|---|---|
  | **Context** | reasoning text length | token estimate = CJK chars ×1 + other chars ÷4, rounded. |
  | **Reasoning** | text structure | "stages": explicit `Step N` / `第N步` markers when present, otherwise blank-line paragraph count, capped at 20. |
  | **Tools** | real tool calls from the conversation trail | **Primary:** reads the real tool invocation records DSH renders as `data-tool` flow items (read / search / bash / write / edit / code / web / files / subagent etc., including recursive subcalls), deduped per turn, capped at 6. **Fallback:** only when the row has no trail context (e.g. legacy sessions) it falls back to regex scanning the reasoning text, which may count prose mentions of "search"/"python" etc. |
  | **Completion** | DOM `data-state` | measured ms between `running → ok` observed by the plugin. Already-finished rows show "—" (never a fabricated 0.0s); streaming rows show "…". |

- **Live streaming** — stats and full text update during generation
  (150 ms debounce), elapsed time is recorded on completion.
- **Self-healing selectors** — the reasoning row root carries the semantic
  attribute `data-variant="think"` (build-hash independent); `install.sh`
  additionally probes the real CSS-module class into
  `__HIDE_REASONING_SELECTOR__` / `__THINKBODY_SELECTOR__`.
- **Degraded fallback** — if a row's full body cannot be mounted (e.g.
  selector drift), the native row stays visible instead of hiding the only
  copy of the reasoning.
- **Hardened** — two adversarial review rounds fixed: a click-toggle bug,
  a regex infinite-loop freeze, fabricated elapsed times, model-probe
  mis-matching, keep-branch regressions, installer path-guard
  over-blocking, WCAG AA contrast, and HMR dispose/version safety.

## Install

```bash
cd dsh-hide-reasoning
./install.sh                # macOS / DeepSeek Harness (uses ~/.dsh profile)
```

or manually:

```bash
# register the bundle in ~/.dsh/profiles/web/package.json:
#   "dependencies": { "@dsh-external/dsh-hide-reasoning": "link:/path/to/dsh-hide-reasoning" }
#   "dsh.profile.bundles": [ ..., "@dsh-external/dsh-hide-reasoning" ]
cd ~/.dsh/profiles/web && pnpm install
# restart `dsh web`, then hard-refresh (Cmd+Shift+R)
```

Uninstall: `./uninstall.sh`, or remove the dependency + bundle entry and
`pnpm install`.

## How it works

- The native `[data-variant="think"]` row stays in the DOM as the data
  source (hidden via injected CSS), so React reconciliation is never
  disturbed.
- A global MutationObserver tracks row add/remove; each row gets its own
  observer for streaming updates (debounced refresh).
- `tryOpenNative` simulates a click on the native disclosure so React
  mounts the full-text `.thinkBody`, which the observer then mirrors into
  the card. If the full body never mounts, the native row is kept visible.

## Extending

Ideas with easy entry points (see README.md for details):

- Verification status row, tool-call counts (`Python ×3`), context
  fraction (`18.6k / 128k`), tokens-per-second, copy-reasoning button,
  per-message collapsed-state memory, more vendor logos (Llama / Mistral /
  Kimi / GLM) in `MODEL_LOGOS`.

## License

MIT © 2026 AOWAYHONG
