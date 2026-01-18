{
  "manifest_version": 3,
  "name": "Focus Feed - Algorithm Trainer",
  "version": "6.0.0",
  "description": "The Semantic Vacuum. Replaces junk with wisdom and aggressively retrains algorithms.",
  "permissions": [
    "activeTab",
    "scripting",
    "storage",
    "tabs"
  ],
  "host_permissions": [
    "*://*.youtube.com/*",
    "*://*.facebook.com/*",
    "*://*.instagram.com/*",
    "*://*.twitter.com/*",
    "*://*.x.com/*",
    "*://*.tiktok.com/*"
  ],
  "action": {
    "default_popup": "popup.html"
  },
  "content_scripts": [
    {
      "matches": [
        "*://*.youtube.com/*",
        "*://*.facebook.com/*",
        "*://*.instagram.com/*",
        "*://*.twitter.com/*",
        "*://*.x.com/*",
        "*://*.tiktok.com/*"
      ],
      "js": ["presets.js", "classifier.js", "content.js"],
      "run_at": "document_end",
      "all_frames": false
    }
  ]
}
