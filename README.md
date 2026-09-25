# Luffy AI Studio

Personal Android AI video creation app.

## Version 1
- Text → Video
- Image → Video
- Local prompt enhancer
- 9:16, 16:9 and 1:1 formats
- 5s / 10s controls
- 720p / 1080p controls
- Local generation history
- Secure backend pattern: the AI API key is never stored inside the APK
- GitHub Actions APK build

## Architecture
Android app → secure HTTPS backend → fal.ai → Pika 2.2

## Build the APK
1. Open the repository **Actions** tab.
2. Open **Build Android APK**.
3. Run the workflow if a run is not already in progress.
4. When it succeeds, open the run and download the **Luffy-AI-Studio-APK** artifact.
5. Extract the ZIP and install **app-debug.apk**.

## Connect AI generation
The `backend` folder is ready for a Vercel deployment.

1. Create a fal.ai API key.
2. Deploy the `backend` folder to Vercel.
3. Add `FAL_KEY` as a Vercel environment variable.
4. Copy the deployed HTTPS URL.
5. In Luffy AI Studio open **Settings → Backend URL** and save that URL.

Never paste the fal.ai API key into the Android app or commit it to GitHub.

## Current AI routes
- Text-to-video: `fal-ai/pika/v2.2/text-to-video`
- Image-to-video: `fal-ai/pika/v2.2/image-to-video`

## Planned next features
- Saved characters
- Character consistency
- Script → scenes
- AI voices
- Background music
- Automatic subtitles
- Multi-scene timeline
- Final video stitching/export
