# Luffy AI Studio Free Mode

A mobile-only Android video maker that works without a paid AI API.

## Version 2.0
- Select multiple photos from your phone
- Add slow pan/zoom animation
- Add one caption per scene
- Add optional background music
- Export locally on the device
- 9:16, 16:9 and 1:1 formats
- Medium / High export sizes
- No Vercel
- No fal.ai
- No credits
- No API key

## Important
This is not generative text-to-video AI. It assembles and animates your own images locally on Android so there is no per-video fee.

## Build APK
Open GitHub **Actions → Build Android APK**. The workflow runs automatically after pushes to main. When it succeeds, download the **Luffy-AI-Studio-APK** artifact and install the APK.

## Device support
Local export uses Android WebView video-recording capabilities. Most recent Android phones should support WebM export. If a specific device does not, the export flow may need a native encoder in a later build.
