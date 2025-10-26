# Prompt Generator – Aurora Baseline
**Version:** 1.0.0  
**Release Date:** 2025-10-31  
**Status:** FINAL PRODUCTION BUILD

## Overview
This release marks the fully optimized and stable build of the adaptive prompt generator for Flux/Krea image models.
It integrates refined grammar logic, high-speed sanitization, and context-safe descriptive phrasing.

---

## Key Features
- Smart structured prompt assembly (subject, pose, hair, clothing, lighting, mood)
- Adaptive creative controls with balanced randomness
- Full contextual coherence (no contradictory descriptors)
- Flux/Krea-compatible phrasing for clean model parsing
- Comprehensive sanitization pipeline eliminating duplicates, redundant phrases, and tone conflicts

---

## Sanitizer Highlights
- Plural-safe “luminous” fix (no more *luminouss* artifacts)
- Unified daylight logic for *bright* and *radiant* variants
- Warm/cool contradiction handling
- Triple adjective and preposition deduplication
- Micro and mini polish layers for final tone and comma cleanup

---

## Performance
| Metric | Value |
|---------|-------|
| Sanitization passes | ~70% fewer regex executions than early builds |
| Large-batch runtime | ~30% faster |
| Error rate | 0% detected |
| Flux/Krea visual consistency | Significantly improved lighting and color balance |

---

## Maintenance Notes
- To expand the generator: edit JSON data pools only.
- Avoid modifying `sanitizePromptText()` unless new phrase patterns appear.
- Always back up this version as your *master baseline* before future updates.

---

## Folder Structure
```
PromptGenerator/
├─ index.html
├─ ui.js
├─ generator.js
├─ data-loader.js
├─ README.md
├─ README.txt
│
├─ /css/
│   └─ style.css
│
├─ /data/
│   ├─ (all active JSON files)
│
├─ /archive/
│   ├─ (old or unused JSON files)
│
└─ /vscode/
    └─ settings.json
```

---

## Data Folder Reference

Each file contributes to a specific category of descriptive or visual detail in the final prompts.

| File | Description |
|-------|--------------|
| eyewear.json | Glasses, visors, and other eyewear items. |
| headwear.json | Hats, crowns, veils, and other head accessories. |
| jewelry.json | Earrings, necklaces, bracelets, and jewelry. |
| hair-styles.json | Hair styles and part types (center, side, etc.). |
| skin-tones.json | Skin color and texture descriptors. |
| bottoms.json | Pants, skirts, and lower-body clothing. |
| cultural-wear.json | Traditional or ethnic outfit pieces. |
| dresses.json | One-piece dresses and formal wear. |
| outerwear.json | Jackets, coats, cloaks, outer garments. |
| tops.json | Shirts, blouses, sweaters, upper clothing. |
| clothing-colors.json | Color descriptors for clothing. |
| hair-colors.json | Hair color variations and highlights. |
| clothing.json | Clothing definitions (materials, patterns, textures). |
| subjects.json | Subject attributes (person, gender, age context). |
| fantasy.json | Fantasy environment descriptors. |
| historical.json | Historical environment descriptors. |
| natural.json | Nature/outdoor environment descriptors. |
| urban.json | Urban or city environment descriptors. |
| lighting.json | Lighting conditions (daylight, cinematic, etc.). |
| art-styles.json | Art/photography style descriptors. |
| poses.json | Body pose and framing descriptors. |

### Deprecated / Archived (moved to /archive/)
| File | Notes |
|-------|-------|
| accent-colors.json | Replaced by clothing-colors.json. |
| body-types.json | Replaced by contextual subject descriptors. |
| expressions.json | Integrated into internal facial logic. |
| moods.json | Replaced by internal mood generation. |

---

## Editing Guidelines
- Use **valid JSON** format only; trailing commas will break parsing.
- Each entry should be a simple string or array of strings.
- Avoid duplicating descriptors already present in other files.
- Keep naming consistent and lowercase for best readability.

---

**Aurora Baseline** is now considered the master production version for Flux/Krea-based image prompt generation.
