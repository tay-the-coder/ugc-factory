# UGC Factory

AI-powered UGC ad creation system for e-commerce. Generates hyper-realistic video ads that look like real iPhone UGC.

## Quick Start

```bash
cd /root/clawd/tools/ugc-factory
npm run dev
# Open http://localhost:3001
```

## Features

**8-Step Workflow:**
1. **Product** - Upload product image, define target audience
2. **Character** - Generate UGC creator image (anti-AI-gloss prompting)
3. **Script** - Write/generate script, auto-split into 5-8s segments
4. **A-Roll** - Generate talking head videos (Veo 3.1)
5. **B-Roll** - Create supporting scene images (Gemini)
6. **Animation** - Animate B-roll images (Kling)
7. **Voice** - Generate voiceovers (ElevenLabs)
8. **Export** - AI assembly guide for CapCut

## Anti-AI-Gloss Tech

The prompt engine includes built-in realism modifiers:
- iPhone camera quality simulation
- Natural skin texture with visible pores
- Flyaway hairs, slight asymmetry
- Lived-in environments
- Mixed natural lighting

## Quality Control

Images go through automatic QC:
- Claude Opus analyzes each generation
- Detects AI artifacts, plastic skin, distorted hands
- Auto-corrects prompts and regenerates (max 2 retries)
- Threshold: 80/100 score to pass

## API Keys Required

All keys go in `.env`:
```
GOOGLE_AI_API_KEY=      # Gemini / Veo 3.1
ANTHROPIC_API_KEY=      # Claude for QC
KLING_ACCESS_KEY=       # Kling video
KLING_SECRET_KEY=       # Kling video
ELEVENLABS_API_KEY=     # TTS
```

## Tech Stack

- Next.js 15 + React 19
- Tailwind CSS (white minimal theme)
- Direct API integrations (no wrappers)

## Model Hierarchy

- **Claude Opus 4.5** - All thinking, prompt generation, QC decisions
- **Claude Sonnet 4.5** - Cheaper retry corrections
- **Gemini (Nano Banana Pro)** - Image generation
- **Veo 3.1** - A-roll video generation
- **Kling 2.5** - B-roll animation (image-to-video)
- **ElevenLabs** - Voice generation

## Notes

- Kling animations take 2-5 minutes (async polling built in)
- B-roll images are generated with product + character reference for consistency
- Voiceovers can be generated for all segments at once
- Export step gives detailed CapCut assembly instructions

---

Built for @taysthetic by Zero
