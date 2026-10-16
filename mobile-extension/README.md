# Focus Feed Mobile: automatic trainer for Android

Does the training for you. Tap **Start** (or let it run by itself once a day) and it:

1. Opens one background tab at a time. Phones can't handle 20 at once.
2. **YouTube:** searches your persona's topics, opens the top 2 videos from each search, plays them muted for about 35 seconds and likes them.
3. **Reddit, Instagram, X, Wikipedia:** visits the page and scrolls through it like a person reading.
4. Closes each tab when it's done and moves to the next. One run is about 33 tabs and takes about 10 minutes.

It only touches tabs it opened itself. Your normal browsing is left alone.

## Works on

- **Android + Firefox.** This is the main target.
- **Not iPhone.** iOS doesn't let browsers run extensions like this, except Safari extensions shipped inside an App Store app.

## Install on Android (Firefox)

Regular Firefox only installs *signed* extensions. Signing is free and takes about 5 minutes:

1. On a computer, make a free account at https://addons.mozilla.org, then go to **Developer Hub → Submit a New Add-on → "On your own"** (unlisted).
2. Upload `focus-feed-mobile.zip`. Mozilla signs it automatically and gives you back an `.xpi` file.
3. Put the `.xpi` on your phone (email it to yourself, Google Drive, etc.).
4. In Firefox on Android: **Settings → About Firefox**, tap the Firefox logo 5 times to unlock the debug menu.
5. Back in **Settings**, tap **Install extension from file** and pick the `.xpi`.

Shortcut if you don't want to sign it: install **Firefox Nightly**. The same "Install extension from file" option there also accepts the unsigned zip once you set `xpinstall.signatures.required` to `false` in `about:config`.

## Make it count

- **Sign into YouTube, Reddit, Instagram and X inside Firefox once.** The signals go to whatever accounts are signed in there, then show up in the apps too, because recommendations live on your account, not your device.
- Leave **"Run by itself every day"** on for the first week. It runs at most once a day, whenever Firefox is open.
- Turn on **"Show training tabs"** if likes or watch time aren't registering. Some phones pause videos playing in background tabs.

## Files

- `manifest.json`: works on Firefox (background scripts) and Chromium browsers (service worker).
- `background.js`: the queue. State is saved to storage so it picks up again if Android kills it, and a 90-second watchdog skips stuck tabs.
- `trainer.js`: does the work on each page (find videos, watch, like, scroll).
- `personas.js`: the topics for each persona.
- `popup.html` / `popup.js`: the control screen.
