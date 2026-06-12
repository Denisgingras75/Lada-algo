# drift — a steering layer for your feed

Point your recommendation feed in a direction *you* choose instead of the one
the platform optimizes for. drift is the "VPN for your algorithm" idea built
honestly: it doesn't pretend to reach inside YouTube's servers, and it doesn't
flood anything.

## What it actually does

Two real mechanisms, nothing more:

1. **Reshapes what's on screen now.** Every tile in your feed is scored and then
   boosted, kept, dimmed, or hidden according to the direction you picked. This
   is instant and entirely client-side — it changes what *you* see.
2. **Sends the platform's own feedback — only if you turn it on.** When "send
   real signals" is enabled, drift clicks YouTube's native *Not interested /
   Don't recommend channel* on hidden items: the same action you'd take by hand,
   automated and rate-limited to look human. Off by default.

What it does **not** do: it does not call platform APIs, it does not rewrite
your server-side recommendations directly, and it does not open background tabs
to "train" anything. Those either don't work (loading a search page sends almost
no signal) or get your account flagged. The earlier version of this project did
the tab-flood thing; it was deleted on purpose.

## Directions, not categories

The key idea: a preset is a *heading*, not a *moral grade*. drift learns a local
model of your usual feed, then steers relative to it.

| Direction     | What it does                                                        |
|---------------|---------------------------------------------------------------------|
| **Novelty**   | Ranks the feed by how *unlike* your usual it is; pulls outliers toward you, pushes the familiar away. |
| **Rabbit hole** | Amplifies whatever you last engaged with; dims everything off-thread. |
| **Detox**     | Topic-blind. Strips manufactured-arousal (clickbait, outrage, SHOUTING). Never boosts — only removes. |
| **Steer**     | You type the heading: more of these terms, less of those.           |
| **Touch grass** | Thins the feed to a handful of the calmest items. The anti-algorithm. |

The single value judgment baked in is in Detox/`lexicons.js`: it scores
manufactured *form* (urgency, outrage framing, withheld payoffs, all-caps), not
*subject*. A calm makeup video and a calm physics lecture both score ~0. Your
taste lives in **Steer**, where you own both lists.

## Intensity

One slider, 10–100. Higher intensity compresses the decision thresholds toward
zero, so drift acts on weaker signals — more aggressive steering, more tiles
moved.

## Inspect a headline

The popup has a live inspector: paste any title and see the exact arousal score,
familiarity, and the action the current direction would take. No black box — the
same engine that runs on the page runs in the inspector.

## Install (unpacked)

1. `chrome://extensions` → enable **Developer mode**.
2. **Load unpacked** → select this folder.
3. Open YouTube. The drift console appears bottom-right; full controls live in
   the toolbar popup.

## Architecture

```
src/lexicons.js    tokenizer + manufactured-arousal scorer (topic-agnostic)
src/profile.js     local self-model: "usual" (slow) + "focus" (fast) + similarity
src/directions.js  THE HEART — directions as steering policies (absolute/relative/cap)
src/adapters.js    per-platform DOM behind one interface (YouTube full, X best-effort)
content.js         orchestrator: scan → evaluate → apply, learning loop, console
popup.*            controls + live inspector
test/engine.test.js  node tests for the pure engine (run: `node test/engine.test.js`)
```

The engine (lexicons/profile/directions) is pure and unit-tested with no DOM, so
the steering logic is verifiable on its own. Adding a platform = implementing one
`SiteAdapter` (getItems / apply / clear / sendNegativeSignal / itemFromEvent /
watchContext) and adding its host to the manifest.

## Honest limitations

- **Familiarity is keyword/frequency cosine, not embeddings.** Coarse but instant
  and offline. Good enough to separate "your usual" from "outlier"; it won't catch
  deep semantic similarity between differently-worded items.
- **Twitter/X is experimental.** Its DOM is obfuscated and shifts; reshaping works
  best-effort and native negative-signal is disabled rather than faked.
- **"Boost" is visual emphasis, not reordering.** Reliably reordering YouTube's
  virtualized feed breaks it, so boosted items are outlined and tagged, not moved.
- **Sending real signals carries platform risk.** It's automating clicks on the
  platform's UI. That's why it's off by default, throttled, and budget-capped.

## Privacy

Your feed-model lives in `chrome.storage.local` and never leaves the browser.
No servers, no analytics, no network calls.
