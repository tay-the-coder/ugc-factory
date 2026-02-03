# AI Video Generation Prompting Research

## Veo 3.1 Best Practices (Google Cloud)

### 5-Part Prompt Formula
```
[Cinematography] + [Subject] + [Action] + [Context] + [Style & Ambiance]
```

**Cinematography:**
- Camera movement: dolly shot, tracking shot, crane shot, aerial view, slow pan, POV shot
- Composition: wide shot, close-up, extreme close-up, low angle, two-shot
- Lens & focus: shallow depth of field, wide-angle lens, soft focus, macro lens

**Audio Controls:**
- Dialogue: Use quotation marks → `A woman says, "We have to leave now."`
- Sound effects: `SFX: thunder cracks in the distance`
- Ambient noise: `Ambient noise: the quiet hum of a starship bridge`

**Reference Images:**
- Can use 1-3 reference images OR first/last frame (not both)
- Helps maintain consistent aesthetic across multiple shots

**Negative Prompts:**
- Describe what to exclude clearly
- Example: "a desolate landscape with no buildings or roads"

---

## Kling AI Best Practices (VEED.io)

### 4-Part Prompt Formula
```
Subject + Action + Context + Style
```

### Key Rules:

**Subject:**
- Specific details (age, hair, clothing with colors)
- ❌ Avoid generic: "a person", "a dog"

**Action:**
- Include movement speed: "slowly", "briskly", "energetically"
- Include manner: "purposefully", "gracefully", "cautiously"
- ❌ Avoid vague: "moving around"

**Context:**
- Limit to 3-5 environmental elements
- Include time of day and atmospheric conditions
- ❌ Avoid catalogs of 10+ elements

**Style:**
- Always specify camera movement explicitly
- Include camera position and distance
- Add lighting direction and mood

### Critical for Image-to-Video:
- **ONLY describe motion** - never redescribe what's in the image
- Add motion endpoints: "then settles back into place"
- Specify camera movement: "tracking shot following from side"

### Common Failures to Avoid:
1. Too many elements → overload
2. Missing camera → static shots
3. Innocent words → filter triggers
4. Open-ended motion → 99% hangs
5. Vague spatial language → distortions

---

## Applied to UGC Factory

### Character Image Prompts (Gemini)
Use 5-part formula with anti-AI-gloss modifiers:
- Camera: iPhone 15 Pro selfie/third-person
- Subject: specific demographics matching target audience
- Action: natural pose with product
- Context: lived-in home setting (3-4 elements)
- Style: natural window light, unedited look

### A-Roll Video Prompts (Veo 3.1)
- Start with cinematography (selfie jitter or stable third-person)
- Include dialogue in quotes with accent
- Describe natural gestures that match speech
- End with: "Clean dialogue only. No background music."

### B-Roll Animation Prompts (Kling)
- Subject: brief identification only ("the woman", "her hands")
- Action: specific motion with speed and direction
- Camera: movement type, position, distance
- NO scene redescription - just motion instruction
- Add motion endpoint to prevent hangs
