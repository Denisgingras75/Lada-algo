# 🧪 TEST INSTRUCTIONS - Algorithm VPN

## What This Does:
- **Changes what YouTube thinks you like** by auto-liking educational videos
- **Hides junk content** by clicking "Not interested"
- **Personas** = Different "disguises" (Scholar, Engineer, Stoic, etc.)
- **Slider** = Control how aggressive the training is (0-100%)

---

## 🎯 QUICK TEST (5 minutes):

### Step 1: Load Extension
1. Open Chrome
2. Go to `chrome://extensions/`
3. Turn ON "Developer mode" (top-right toggle)
4. Click "Load unpacked"
5. Select your `Lada-algo` folder
6. ✅ Extension should appear as "Focus Feed - Algorithm Trainer v5.3.0"

### Step 2: Check Popup (Personas + Slider)
1. Click the extension icon in your toolbar
2. **You should see:**
   - Toggle switch (ON/OFF)
   - **10 Personas:** Polymath, Engineer, Strategist, Stoic, Scientist, Artist, Warrior, Healer, Explorer, Sage
   - **Intensity Slider:** 0% to 100%
   - Stats counters (Liked, Hidden, Session)

**✅ If you see personas + slider → Popup works!**

### Step 3: Test on YouTube
1. Go to `youtube.com` (homepage)
2. **LOOK FOR:**
   - **Purple panel** in bottom-right corner saying "🎯 Focus Feed Active"
   - Should show your selected persona
   - Should show intensity percentage

**✅ If you see purple panel → Extension is running!**

### Step 4: Watch It Work
1. Scroll through your YouTube feed **slowly**
2. Watch the purple panel counters:
   - **✅ Educational:** Should increase when it finds MIT/Stanford/TED videos
   - **❌ Junk:** Should increase when it finds clickbait
   - **○ Neutral:** Everything else

3. **Visual indicators:**
   - Educational videos get **green borders**
   - Junk videos **fade to gray**

4. **Tabs opening:**
   - You might see tabs **briefly flash open/closed** in background
   - These are liking educational videos for you

---

## 🐛 TROUBLESHOOTING:

### "No purple panel appears"
- Check console: `Ctrl+Shift+J` (Windows) or `Cmd+Option+J` (Mac)
- Look for `[Focus Feed]` messages
- If you see errors, send screenshot

### "Purple panel shows but counters stay at 0"
- Your feed might not have educational content right now
- Try searching "MIT OpenCourseWare" → Refresh homepage
- Scroll slowly (observer needs 1 second to detect)

### "Personas don't show in popup"
- Extension might not be loaded
- Try: Remove extension → Reload folder → Re-enable

### "Tabs aren't opening"
- Check: `chrome://extensions/` → Make sure "tabs" permission is granted
- If it says "Needs permissions" → Click "Grant"

---

## 🎚️ HOW TO USE THE SLIDER:

- **0-30%:** Passive mode (just marks videos, doesn't act)
- **30-70%:** Balanced (likes educational, but doesn't hide junk)
- **70-100%:** Aggressive (likes educational AND hides junk)

**Start at 80% for best results.**

---

## 📊 WHAT SUCCESS LOOKS LIKE:

After 10 seconds of scrolling YouTube homepage:
```
🎯 Focus Feed Active
Persona: polymath
Intensity: 80%
────────────
✅ Educational: 3-5
❌ Junk: 1-2
○ Neutral: 10-15
────────────
Checked: How to learn quantum physics...
```

If you see numbers increasing → **IT'S WORKING!**

---

## 🚀 NEXT STEPS (If it works):

1. **Pick your persona** (changes what gets liked)
2. **Adjust slider** to your preference
3. **Let it run for 1-2 days** (30 min/day of browsing)
4. **Check your mobile YouTube app** → Feed should improve
5. **Go to YouTube → Library → Liked videos** → See what it liked

---

## ❓ Questions to Answer:

1. **Does purple panel appear?** (Yes/No)
2. **Do personas show in popup?** (Yes/No - send screenshot)
3. **Are counters increasing?** (Yes/No - what numbers?)
4. **Do you see tabs opening?** (Yes/No)

Send me answers and I'll debug!
