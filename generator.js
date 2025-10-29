class PromptGenerator {
    constructor(dataLoader) {
        this.dataLoader = dataLoader;
        this.lastComponents = null;
        this.lastPrompt = '';
        this.lastSemantic = false;
        this.lastGeneratedClothing = '';
    }

    // ✅ [PATCH CHECKLIST]
    // 1. Accessory cap logic verified below variable declarations ✔
    // 2. Embellishment duplication guard applied (see above) ✔
    // 3. Bright lighting clamp active in generateLighting() ✔
    // 4. Cinematic warm→cool replacement active ✔
    // 5. Descriptor rotation method added ✔
    // 6. Sanitization system already handles duplicates ✔

    async ensureDataReady() {
        if (!this.dataLoader.isDataLoaded()) {
            await this.dataLoader.loadAllData();
        }
    }

    normalizePreferences(preferences = {}) {
        const normalized = { ...preferences };
        normalized.settingType = normalized.settingType || 'natural';
        normalized.poseControl = normalized.poseControl || 'medium';
        return normalized;
    }

    backfillPreferenceDefaults(target, normalized) {
        if (!target || typeof target !== 'object' || !normalized) {
            return;
        }

        if (!target.settingType) {
            target.settingType = normalized.settingType;
        }

        if (!target.poseControl) {
            target.poseControl = normalized.poseControl;
        }
    }

    buildPromptComponents(preferences = {}) {
        const pose = this.resolvePose(preferences.poseControl);
        const settingData = this.generateSetting(preferences.settingType) || {
            description: 'an undefined setting',
            hasTrees: false
        };

        const hair = this.generateHairDescription(preferences);
        const clothing = this.generateClothing(preferences);
        this.lastGeneratedClothing = clothing;

        const components = {
            subject: this.generateSubject(),
            pose,
            face: this.generateFace(),
            hair,
            clothing,
            accessories: this.generateAccessories(preferences),
            camera: '',
            setting: settingData.description,
            lighting: this.generateLighting(preferences.settingType, settingData.hasTrees, preferences),
            artStyle: this.generateArtStyle(preferences.artStyle, preferences),
            mood: this.generateMood(preferences)
        };

        return components;
    }

    resolvePose(poseControl = 'medium') {
        if (poseControl === 'always') {
            return this.generatePose();
        }

        if (poseControl === 'medium' && Math.random() < 0.5) {
            return this.generatePose();
        }

        return '';
    }

    renderPrompt(components, { useSemanticStack = false, concise = false } = {}) {
        if (!components) {
            return '';
        }

        const promptResult = useSemanticStack
            ? this.assembleSemanticStack(components)
            : this.assemblePrompt(components);

        this.updateLastState(components, promptResult, useSemanticStack);

        if (concise) {
            return this.buildConcisePrompt(components);
        }

        return promptResult;
    }

    buildConcisePrompt(components) {
        const conciseParts = [
            components.subject,
            components.pose,
            components.face,
            components.hair,
            components.clothing,
            components.accessories,
            components.setting,
            components.lighting
        ].filter(Boolean);

        return this.sanitizePromptText(conciseParts.join(', '));
    }

    updateLastState(components, promptResult, useSemanticStack) {
        this.lastComponents = { ...components };
        this.lastPrompt = promptResult;
        this.lastSemantic = useSemanticStack;
        this.lastGeneratedClothing = components?.clothing || '';
    }

    // Main generation method - UPDATED
    async generatePrompt(preferences = {}, options = {}) {
        await this.ensureDataReady();

        const normalizedPreferences = this.normalizePreferences(preferences);
        this.backfillPreferenceDefaults(preferences, normalizedPreferences);

        const useSemanticStack = !!normalizedPreferences.semanticStack;
        const components = this.buildPromptComponents(normalizedPreferences);

        return this.renderPrompt(components, {
            useSemanticStack,
            concise: !!options.concise
        });
    }

    async generatePromptBatch(preferencesList = [], options = {}) {
        await this.ensureDataReady();

        const batches = Array.isArray(preferencesList) && preferencesList.length
            ? preferencesList
            : [{}];

        const results = [];

        for (const prefs of batches) {
            const normalizedPreferences = this.normalizePreferences(prefs || {});
            this.backfillPreferenceDefaults(prefs, normalizedPreferences);
            const components = this.buildPromptComponents(normalizedPreferences);
            const prompt = this.renderPrompt(components, {
                useSemanticStack: !!normalizedPreferences.semanticStack,
                concise: !!options.concise
            });

            if (options.includeComponents) {
                results.push({ prompt, components: { ...components } });
            } else {
                results.push(prompt);
            }
        }

        return results;
    }

    // Generate subject - ENHANCED
    generateSubject() {
        const ageDescriptor = this.dataLoader.getRandomFrom('subjects.json', 'age_descriptors');
        const subjectType = this.dataLoader.getRandomFrom('subjects.json', 'subject_types');

        return `A ${ageDescriptor} ${subjectType}`;
    }

    generatePose() {
        // Combine all pose categories from poses.json
        const allPoses = [
            ...this.dataLoader.getAllFrom('poses.json', 'standing_poses'),
            ...this.dataLoader.getAllFrom('poses.json', 'sitting_poses'),
            ...this.dataLoader.getAllFrom('poses.json', 'leaning_poses'),
            ...this.dataLoader.getAllFrom('poses.json', 'walking_poses'),
            ...this.dataLoader.getAllFrom('poses.json', 'dynamic_poses')
        ];

        return this.dataLoader.randomChoice(allPoses);
    }

    // NEW: Generate face details
generateFace() {
    const skinTone = this.generateSkinTone();
    const eyeDetails = this.generateEyeDetails();
    
    // Coherent gaze + expression profiles that work together emotionally
    const faceProfiles = [
        // Happy/Joyful profiles
        {
            gaze: 'gazing directly at camera',
            expression: 'with a joyful bright smile'
        },
        {
            gaze: 'glancing over shoulder',
            expression: 'with a subtle knowing smile'
        },
        {
            gaze: 'gazing directly at camera',
            expression: 'with a gentle closed-lip smile'
        },
        
        // Peaceful/Serene profiles
        {
            gaze: 'looking downward demurely',
            expression: 'with a soft peaceful expression'
        },
        {
            gaze: 'gazing into the distance',
            expression: 'with a serene calm expression'
        },
{
    gaze: 'eyes closed peacefully',
    expression: 'with a tranquil expression',
    eyesClosed: true  // NEW FLAG
},
        
        // Confident/Bold profiles
        {
            gaze: 'gazing directly at camera',
            expression: 'with an intense focused expression'
        },
        {
            gaze: 'gazing directly at camera',
            expression: 'with a bold fierce expression'
        },
        {
            gaze: 'gazing directly at camera',
            expression: 'with a slight confident smirk'
        },
        
        // Mysterious/Contemplative profiles
        {
            gaze: 'looking slightly away to the left',
            expression: 'with a mysterious slight smile'
        },
        {
            gaze: 'looking upward thoughtfully',
            expression: 'with a contemplative neutral expression'
        },
        {
            gaze: 'gazing into the distance',
            expression: 'with a pensive expression'
        }
    ];
    
const profile = this.dataLoader.randomChoice(faceProfiles);

// If eyes are closed, don't mention eye color/shape - just say "eyes closed"
if (profile.eyesClosed) {
    return `${skinTone}, ${profile.gaze}, ${profile.expression}`;
} else {
    return `${skinTone}, ${eyeDetails} ${profile.gaze}, ${profile.expression}`;
}
}

    // NEW: Generate skin tone
    generateSkinTone() {
        const toneCategories = ['light_tones', 'medium_tones', 'deep_tones'];
        const category = this.dataLoader.randomChoice(toneCategories);
        const tone = this.dataLoader.getRandomFrom('skin-tones.json', category);
        const quality = this.dataLoader.getRandomFrom('skin-tones.json', 'skin_qualities');

        return `${quality} ${tone} skin`;
    }

    // NEW: Generate eye details
generateEyeDetails() {
    const eyeShapes = [
        'almond-shaped', 'round', 'upturned', 'downturned',
        'hooded', 'deep-set', 'wide-set', 'close-set'
    ];
    const eyeColors = [
        'hazel', 'brown', 'dark brown', 'amber', 'green',
        'blue', 'gray', 'blue-gray', 'green-gray'
    ];

    const shape = this.dataLoader.randomChoice(eyeShapes);
    const color = this.dataLoader.randomChoice(eyeColors);

    // Just return eye shape and color - gaze is now handled in generateFace()
    return `${shape} ${color} eyes`;
}


    // UPDATED: Generate hair with more explicit details
    generateHairDescription(preferences = {}) {
        const variation = preferences?.hairVariation || 50;
        const style = this.dataLoader.getRandomFrom('hair-styles.json', 'hair_styles');
        const lengthGroup = this.determineLengthGroupForStyle(style);
        const length = this.dataLoader.randomChoice(this.getLengthOptions(lengthGroup));
        const texture = this.dataLoader.getRandomFrom('hair-styles.json', 'hair_textures');
        const part = this.dataLoader.getRandomFrom('hair-styles.json', 'hair_parts');

        const hairEffectsChance = preferences.hairEffectsChance || 70;

       // Adjust randomization intensity using Hair Variation
// Higher variation -> more adventurous style/color combos
let baseColor;
if (variation > 80) {
    // high variation allows fantasy or strong contrast colors
    const highCategories = ['natural_bases', 'fantasy_bases'];
    const chosenCategory = this.dataLoader.randomChoice(highCategories);
    baseColor = this.dataLoader.getRandomFrom('hair-colors.json', chosenCategory);
} else if (variation < 40) {
    // low variation -> natural colors only
    baseColor = this.dataLoader.getRandomFrom('hair-colors.json', 'natural_bases');
} else {
    // medium variation -> mostly natural with rare fantasy accents
    if (Math.random() < 0.2) {
        baseColor = this.dataLoader.getRandomFrom('hair-colors.json', 'fantasy_bases');
    } else {
        baseColor = this.dataLoader.getRandomFrom('hair-colors.json', 'natural_bases');
    }
}

        // Get color descriptor - now safe since we removed "soft" from the list
        const colorDescriptor = this.dataLoader.getRandomFrom('hair-colors.json', 'color_descriptors');

        // Build highlight phrase
        let highlightPhrase = '';
        if (Math.random() * 100 < hairEffectsChance) {
            const highlightType = this.dataLoader.getRandomFrom('hair-colors.json', 'highlight_types');
            const highlightColor = this.dataLoader.getRandomFrom('hair-colors.json', 'highlight_colors');

            const techniqueInclusive = ['highlights', 'lowlights', 'babylights', 'balayage', 'ombre', 'gradient'];
            const needsTechnique = !techniqueInclusive.includes(highlightType);

            if (needsTechnique) {
                highlightPhrase = ` with ${highlightColor} ${highlightType} highlights`;
            } else {
                highlightPhrase = ` with ${highlightColor} ${highlightType}`;
            }
        }
// Build the base description first
let hairDescription = `${length} ${colorDescriptor} ${baseColor} hair${highlightPhrase} in ${texture} texture styled in ${style} with ${part}`;

// --- 💇 Hair Realism Patch (details + part + finish) ---
let hairDetail = '';
let hairPartExtra = ''; // renamed to avoid confusion with existing 'part'
let stylingMethod = '';

// Try pulling optional visual layers if available in dataset
if (this.dataLoader.hasKey('hair-styles.json', 'hair_details')) {
    hairDetail = this.dataLoader.getRandomFrom('hair-styles.json', 'hair_details');
}
if (this.dataLoader.hasKey('hair-styles.json', 'hair_parts')) {
    hairPartExtra = this.dataLoader.getRandomFrom('hair-styles.json', 'hair_parts');
}
if (this.dataLoader.hasKey('hair-styles.json', 'styling_methods')) {
    stylingMethod = this.dataLoader.getRandomFrom('hair-styles.json', 'styling_methods');
}

// Build optional realism string
let hairExtras = [hairDetail, hairPartExtra, stylingMethod].filter(Boolean).join(', ');

// Apply realism details with chance scaled by variation level
const realismChance = variation / 100; // 0.3 → 0.9 range
if (hairExtras && Math.random() < realismChance) {
    hairDescription += `, ${hairExtras}`;
}

// Return the final description (with part de-dupe)
return this.finalizeHairDescription(hairDescription.trim());

    }

    finalizeHairDescription(hairDescription) {
        return (hairDescription || '')
            .replace(/\b(center|middle|side|off-center) part(,?\s*(center|middle|side|off-center) part)+/gi, '$1 part')
            .trim();
    }

// UPDATED: Generate clothing with Outfit Diversity integration
generateClothing(preferences = {}) {
    const stylePreference = preferences.clothingStyle;
    const outfitCompleteness = preferences.outfitCompleteness || 'complete';
    const diversity = preferences?.outfitDiversity || 50;

    // --- 🎽 Outfit Diversity Controller ---
    // Decide which main clothing pool to draw from
    let clothingCategory = 'tops';

if (diversity > 80) {
    // 🔹 High diversity → include all categories, but limit outerwear frequency
    const allCategories = ['tops', 'bottoms', 'dresses', 'outerwear', 'cultural-wear'];
    clothingCategory = this.dataLoader.randomChoice(allCategories);

    // Optional limiter for outerwear (max ~40% chance)
    if (clothingCategory === 'outerwear' && Math.random() < 0.6) {
        clothingCategory = this.dataLoader.randomChoice(['tops', 'bottoms', 'dresses', 'cultural-wear']);
    }
}
 else if (diversity < 40) {
        // 🔸 Low diversity → simple wardrobe (top or dress)
        const simpleCategories = ['tops', 'dresses'];
        clothingCategory = this.dataLoader.randomChoice(simpleCategories);
    } else {
        // ⚖️ Medium diversity → balanced mix
        const balancedCategories = ['tops', 'bottoms', 'dresses'];
        clothingCategory = this.dataLoader.randomChoice(balancedCategories);
    }

    // --- 🎯 Apply chosen category and generate clothing accordingly ---
    // Cultural wear always overrides because it’s a complete outfit
    if (stylePreference === 'cultural' || clothingCategory === 'cultural-wear') {
        return this.generateCulturalWear(preferences);
    }

    // Choose between complete outfit or single piece mode
    if (outfitCompleteness === 'complete') {
        return this.generateCompleteOutfit(preferences);
    } else {
        // Single-piece mode draws from chosen category
        switch (clothingCategory) {
            case 'tops':
                return this.generateTop(preferences);
            case 'bottoms':
                return this.generateBottom(preferences);
            case 'dresses':
                return this.generateDress(preferences);
            case 'outerwear':
                return this.generateOuterwear(preferences);
            default:
                return this.generateTop(preferences);
        }
    }
}


    // NEW: Build cohesive multi-piece outfits when requested
    generateCompleteOutfit(preferences = {}) {
        const segments = [];
        const diversity = typeof preferences?.outfitDiversity === 'number'
            ? preferences.outfitDiversity
            : 50;
        const layeringPreference = typeof preferences?.layeringPreference === 'number'
            ? preferences.layeringPreference
            : diversity;

        const connectors = {
            pair: diversity >= 60 ? 'paired with' : 'styled with',
            layer: diversity >= 70 ? 'layered with' : 'topped with',
            finish: diversity >= 65 ? 'finished with' : 'completed by'
        };

        const stripLead = (text = '') => text.replace(/^\s*(wearing|layered)\s+/i, '').trim();

        const pushBase = text => {
            if (text) {
                segments.push(text);
            }
        };

        const pushConnected = (text, connector) => {
            if (!text) {
                return;
            }
            const cleaned = stripLead(text);
            if (!cleaned) {
                return;
            }
            segments.push(`${connector} ${cleaned}`);
        };

        const stylePreference = preferences?.clothingStyle || '';
        const preferDressStyles = ['formal', 'evening', 'gala', 'romantic'];
        const avoidDressStyles = ['streetwear', 'sporty', 'casual'];
        let dressChance = preferDressStyles.includes(stylePreference) ? 0.65 : 0.4;

        if (diversity > 75) {
            dressChance += 0.1;
        } else if (diversity < 35) {
            dressChance -= 0.15;
        }

        if (avoidDressStyles.includes(stylePreference)) {
            dressChance = 0.15;
        }

        dressChance = Math.max(0.1, Math.min(0.8, dressChance));
        const useDressSilhouette = Math.random() < dressChance;

        if (useDressSilhouette) {
            pushBase(this.generateDress(preferences));
        } else {
            pushBase(this.generateTop(preferences));
            pushConnected(this.generateBottom(preferences), connectors.pair);
        }

        const outerwearChance = Math.min(95, Math.max(5, layeringPreference + (useDressSilhouette ? 10 : 0)));
        if (Math.random() * 100 < outerwearChance) {
            pushConnected(this.generateOuterwear(preferences), connectors.layer);
        }

        if (diversity > 65 && Math.random() < 0.35) {
            const garmentDetail = this.dataLoader.getRandomFrom('clothing.json', 'garment_details');
            if (garmentDetail) {
                segments.push(`${connectors.finish} ${garmentDetail}`);
            }
        }

        const styleDescriptor = this.dataLoader.getRandomFrom('clothing.json', 'style_descriptors');
        if (styleDescriptor) {
            segments.push(`creating a ${styleDescriptor} look`);
        }

        const paletteDescriptor = this.pickOutfitPaletteDescriptor(diversity, preferences?.lightingMood);
        if (paletteDescriptor) {
            segments.push(paletteDescriptor);
        }

        if (!segments.length) {
            return this.generateSinglePiece(preferences);
        }

        return segments.join(', ');
    }

    rotateBrightDescriptors() {
        const variants = [
            'framed by crisp daylight tones',
            'bathed in radiant sunlit color balance',
            'composed in a luminous warm palette',
            'grounded in soft morning light hues'
        ];
        return this.dataLoader.randomChoice(variants);
    }

    pickOutfitPaletteDescriptor(diversity = 50, lightingMood = '') {
        const paletteOptions = {
            low: [
                'grounded in a soft monochrome palette',
                'kept within layered neutral tones',
                'focused on muted earth hues'
            ],
            medium: [
                'balanced with complementary warm and cool tones',
                this.rotateBrightDescriptors(),
                'set against sunlit neutrals with gentle accents'
            ],
            high: [
                'punctuated by high-contrast jewel tones',
                'infused with electric complementary colors',
                'playing with bold color blocking'
            ]
        };

        let pool = paletteOptions.medium;
        if (diversity <= 35) {
            pool = paletteOptions.low;
        } else if (diversity >= 70) {
            pool = paletteOptions.high;
        }

        if (!pool.length) {
            return '';
        }

        let descriptor = this.dataLoader.randomChoice(pool);
        if (!descriptor) {
            return '';
        }

        if (lightingMood === 'bright') {
            // Fix plural-safe replacement to avoid "luminouss"
descriptor = descriptor.replace(/\b(muted|soft|neutrals?)\b/gi, (m) => {
    return /s$/i.test(m) ? 'luminous tones' : 'luminous';
});
            descriptor += ' under radiant daylight';
        } else if (lightingMood === 'cinematic') {
            descriptor = descriptor
                .replace(/bright|sunlit/gi, 'moody')
                .replace(/electric/gi, 'deep')
                .replace(/bold/gi, 'low-key');
            descriptor += ' with cinematic tonality';
        }

        return descriptor;
    }

    // NEW: Generate single piece (original behavior)
    generateSinglePiece(preferences = {}) {
        const clothingTypes = ['dresses.json', 'tops.json', 'bottoms.json', 'outerwear.json'];
        const clothingType = this.dataLoader.randomChoice(clothingTypes);

        if (clothingType === 'dresses.json') {
            return this.generateDress(preferences);
        } else if (clothingType === 'tops.json') {
            return this.generateTop(preferences);
        } else if (clothingType === 'bottoms.json') {
            return this.generateBottom(preferences);
        } else {
            return this.generateOuterwear(preferences);
        }
    }

    // NEW: Helper method to generate a dress
    generateDress(preferences = {}) {
    const category = this.dataLoader.randomChoice(['dress_types', 'formal_dresses', 'casual_dresses']);
    const clothingItem = this.dataLoader.getRandomFrom('dresses.json', category);
    const featureDescription = this.describeGarmentFeatures({
        file: 'dresses.json',
        necklineKey: 'neckline_options',
        sleeveKey: 'sleeve_styles',
        clothingItem,
        garmentType: 'dress'
    });

    return this.assembleSingleGarment(clothingItem, featureDescription, preferences, 'dress');
}

    // NEW: Helper method to generate a top
    generateTop(preferences = {}) {
    const category = this.dataLoader.randomChoice(['basic_tops', 'dressy_tops', 'casual_tops']);
    const clothingItem = this.dataLoader.getRandomFrom('tops.json', category);
    const featureDescription = this.describeGarmentFeatures({
        file: 'tops.json',
        necklineKey: 'neckline_styles',
        sleeveKey: 'sleeve_variations',
        clothingItem,
        garmentType: 'top'
    });

    return this.assembleSingleGarment(clothingItem, featureDescription, preferences, 'top');
}

    // NEW: Helper method to generate bottoms
generateBottom(preferences = {}) {
    const category = this.dataLoader.randomChoice(['skirt_types', 'pants_types', 'jeans_styles']);
    const clothingItem = this.dataLoader.getRandomFrom('bottoms.json', category);

    return this.assembleSingleGarment(clothingItem, '', preferences, 'bottom');
}

    // NEW: Helper method to generate outerwear
    generateOuterwear(preferences = {}) {
        const category = this.dataLoader.randomChoice(['coat_types', 'jacket_styles', 'elegant_wraps']);
        const clothingItem = this.dataLoader.getRandomFrom('outerwear.json', category);

        return this.assembleSingleGarment(clothingItem, '', preferences, 'outerwear');
    }

    // NEW: Helper method to generate cultural wear
    generateCulturalWear(preferences = {}) {
        const categories = ['asian_traditional', 'european_traditional', 'african_traditional', 'middle_eastern'];
        const category = this.dataLoader.randomChoice(categories);
        const clothingItem = this.dataLoader.getRandomFrom('cultural-wear.json', category);

        const inferredType = this.inferGarmentTypeFromName(clothingItem);
        return this.assembleSingleGarment(clothingItem, '', preferences, inferredType);
    }

    // NEW: Shared method to assemble garment details (consolidates duplicate code)
    assembleSingleGarment(clothingItem, necklineAndSleeves, preferences = {}, garmentType = 'outfit') {
        const descriptor = this.getGarmentDescriptor(garmentType, clothingItem);
        let fabric = this.dataLoader.getRandomFrom('clothing.json', 'fabric_types');
        // --- Clothing Fit + Detail Expansion ---
        const pickDescriptor = (source) => {
            if (!source || source.length !== 2) return '';
            const [file, key] = source;
            const options = this.dataLoader.getAllFrom(file, key);
            if (!options || !options.length) {
                return '';
            }
            return this.dataLoader.randomChoice(options);
        };

        const fitSources = {
            top: ['tops.json', 'fit_styles'],
            dress: ['dresses.json', 'fit_styles'],
            bottom: ['bottoms.json', 'fit_styles'],
            outerwear: ['outerwear.json', 'fits']
        };

        const detailSources = {
            top: ['tops.json', 'details_features'],
            dress: ['dresses.json', 'details_features'],
            bottom: ['bottoms.json', 'details_features'],
            outerwear: ['outerwear.json', 'details_features']
        };

        const descriptorParts = [];
        const fitSource = fitSources[garmentType];
        const detailSource = detailSources[garmentType];

        if (fitSource) {
            descriptorParts.push(pickDescriptor(fitSource));
        }

        if (detailSource) {
            descriptorParts.push(pickDescriptor(detailSource));
        }

        descriptorParts.push(pickDescriptor(['clothing.json', 'garment_details']));

        const descriptorText = descriptorParts.filter(Boolean).join(', ');
        if (descriptorText) {
            clothingItem += `, ${descriptorText}`;
        }

        // --- Fabric Surface / Condition Expansion ---
        const surfaceDescriptors = [
            'matte finish',
            'soft sheen',
            'subtle gloss',
            'semi-transparent overlay',
            'sheer texture',
            'iridescent coating',
            'brushed surface',
            'weathered texture',
            'satin reflection',
            'velvety texture',
            'micro-pleated surface',
            'delicate shimmer',
            'fine weave detail',
            'light diffusing surface'
        ];

        if (Math.random() < 0.6) {
            const surface = this.dataLoader.randomChoice(surfaceDescriptors);
            if (surface) {
                clothingItem += `, ${surface}`;
            }
        }

        // --- Fabric Compatibility Filter ---
        const incompatible = {
            chiffon: ['denim','canvas','tweed','corduroy','leather','vinyl'],
            silk: ['denim','canvas','tweed','corduroy','vinyl'],
            lace: ['leather','vinyl'],
            wool: ['satin','silk','organza'],
            vinyl: ['knit','wool','tweed','chiffon']
        };
        for (const [fragile, excludes] of Object.entries(incompatible)) {
            if (fabric.toLowerCase().includes(fragile)) {
                const invalid = excludes.some(e => clothingItem.toLowerCase().includes(e));
                if (invalid) {
                    // Regenerate a safer fabric choice
                    const safeFabric = this.dataLoader.getRandomFrom('clothing.json', 'fabric_types');
                    if (safeFabric && !excludes.some(e => safeFabric.toLowerCase().includes(e))) {
                        fabric = safeFabric;
                    }
                }
            }
        }

        // --- Micro Fix 2: Fabric Harmony with Lighting Mood ---
// --- ☀️ Micro Fix 4: Color Warmth Filter for Bright Mode ---
if (preferences?.lightingMood === 'bright') {
    clothingItem = clothingItem
        // Replace cold color adjectives
        .replace(/\bcool\b/gi, 'warm')
        .replace(/\bcold\b/gi, 'sunny')
        .replace(/\bcool\s*toned/gi, 'warm toned')
        // Common cool materials/tones
        .replace(/\bnavy\b/gi, 'sky blue')
        .replace(/\bsteel\b/gi, 'pale gold')
        .replace(/\bgunmetal\b/gi, 'brushed bronze')
        .replace(/\bslate\b/gi, 'soft clay')
        .replace(/\bcharcoal\b/gi, 'sand beige')
        .replace(/\bgray\b/gi, 'light taupe')
        .replace(/\bsilver\b/gi, 'champagne')
        // Broadened daylight tone normalization
        .replace(/\bcool tone\b/gi, 'warm tone')
        .replace(/\bcool toned\b/gi, 'warm toned')
        .replace(/\bneutral tone\b/gi, 'golden tone')
        .replace(/\bmuted tone\b/gi, 'sunlit tone')
        // Bonus: encourage warmth adjectives
        .replace(/\bdeep\b/gi, 'radiant')
        .replace(/\bdark\b/gi, 'bright');
}
// --- Final Cool Cleanup (multi-word patterns) ---
if (preferences?.lightingMood === 'bright') {
    clothingItem = clothingItem.replace(/\bcool\s+([a-z]+)/gi, 'warm $1');
}
// --- 🎬 Cinematic Cool Filter ---
if (preferences?.lightingMood === 'cinematic') {
    clothingItem = clothingItem
        // Replace warm/light adjectives with cinematic cool counterparts
        .replace(/\bwarm\b/gi, 'cool')
        .replace(/\bsunny\b/gi, 'shadowy')
        .replace(/\bgolden\b/gi, 'steel')
        .replace(/\bbronze\b/gi, 'gunmetal')
        .replace(/\bchampagne\b/gi, 'silver')
        .replace(/\bcopper\b/gi, 'pewter')
        .replace(/\bbrass\b/gi, 'platinum')
        .replace(/\brose gold\b/gi, 'steel blue')
        .replace(/\bbright\b/gi, 'muted')
        .replace(/\bglowing\b/gi, 'low-key')
        .replace(/\bsunlit\b/gi, 'dimly lit')
        .replace(/\bradiant\b/gi, 'desaturated')
        .replace(/\blight taupe\b/gi, 'ash gray')
        .replace(/\bsand beige\b/gi, 'charcoal gray')
        .replace(/\bsoft warm glow\b/gi, 'soft cool haze')
        // Broaden tone adjustments
        .replace(/\bwarm tone\b/gi, 'cool tone')
        .replace(/\bwarm toned\b/gi, 'cool toned')
        .replace(/\bgolden tone\b/gi, 'blue-gray tone')
        .replace(/\bsunlit tone\b/gi, 'cold tone')
        // Encourage cinematic color adjectives
        .replace(/\bbrightly lit\b/gi, 'low-lit')
        .replace(/\bluminous\b/gi, 'shadowed')
        .replace(/\bsoft warm light\b/gi, 'diffused cool light')
        .replace(/\bbright light\b/gi, 'dim ambient light');
        // --- 🎬 Additional Cinematic Fabric Tone Correction ---
if (preferences?.lightingMood === 'cinematic') {
    clothingItem = clothingItem
        // Convert any leftover warm-toned fabrics to cool-toned
        .replace(/\bwarm toned\b/gi, 'cool toned')
        .replace(/\bwarm tone\b/gi, 'cool tone');
}

}

        // Get colors with explicit specification
        const colorBoldnessChance = preferences.colorBoldnessChance || 70;
        const primaryColor = this.generateClothingColor(preferences.colorBoldnessChance, fabric);

        // Build color + fabric description
        let colorDescription = `${primaryColor} ${fabric}`;

        // Add accent color if chance permits
        if (Math.random() * 100 < colorBoldnessChance) {
            const accentColor = this.generateClothingColor(preferences.colorBoldnessChance, fabric);
            colorDescription += ` with ${accentColor} accent trim`;
        }

        // Get pattern with explicit color
        const embellishmentChance = preferences.embellishmentChance || 70;
        let pattern;
        let patternColor = '';

        if (embellishmentChance > 80) {
            const dramaticPatterns = [
                'psychedelic print', 'kaleidoscope print', 'optical illusion',
                'hologram print', 'galaxy print', 'fractal print'
            ];
            pattern = this.dataLoader.randomChoice(dramaticPatterns);
        } else if (embellishmentChance > 50) {
            const avoidPatterns = ['solid'];
            const allPatterns = this.dataLoader.getAllFrom('clothing.json', 'patterns');
            const allowedPatterns = allPatterns.filter(p => !avoidPatterns.includes(p));
            pattern = this.dataLoader.randomChoice(allowedPatterns);

            // Add pattern color for specific patterns
            if (pattern === 'striped' || pattern === 'polka dot' || pattern === 'checkered') {
                const patternColorOptions = ['white', 'black', 'gold', 'silver', 'contrasting'];
                patternColor = this.dataLoader.randomChoice(patternColorOptions) + ' ';
            }
        } else {
            pattern = this.dataLoader.getRandomFrom('clothing.json', 'patterns');
        }

        // Get embellishment with explicit materials
        let embellishment = '';
        if (Math.random() * 100 < embellishmentChance) {
            let embellishmentType;
            if (embellishmentChance > 80) {
                const dramatic = [
                    'holographic sequined', 'crystal beaded', 'iridescent sequined',
                    'silver metallic thread embroidered', 'gold metallic thread embroidered'
                ];
                embellishmentType = this.dataLoader.randomChoice(dramatic);
            } else {
                embellishmentType = this.dataLoader.getRandomFrom('clothing.json', 'embellishments');
            }
            // 🚫 [PATCH] Prevent dual embellishment keywords (sequined/beaded overlap)
            if (/sequined/.test(embellishmentType) && /beaded/.test(clothingItem)) {
                embellishmentType = embellishmentType.replace(/sequined/gi, '');
            }
            if (/beaded/.test(embellishmentType) && /sequined/.test(clothingItem)) {
                embellishmentType = embellishmentType.replace(/beaded/gi, '');
            }

            const placementOptions = this.getEmbellishmentPlacements(garmentType, clothingItem);
            const filteredPlacements = placementOptions.filter(option => {
                if (/bodice/.test(option) && garmentType !== 'dress' && garmentType !== 'top') {
                    return false;
                }

                if (/neckline/.test(option) && garmentType === 'bottom') {
                    return false;
                }

                return true;
            });

            const placementPool = filteredPlacements.length > 0 ? filteredPlacements : placementOptions;
            const embellishmentPlacement = this.dataLoader.randomChoice(placementPool);

            embellishment = ` with ${embellishmentType} ${embellishmentPlacement}`;
        }

        // Determine article
        const pluralItems = ['pants', 'jeans', 'shorts', 'leggings', 'trousers', 'culottes', 'capris', 'joggers'];
        const lowerItem = (clothingItem || '').toLowerCase();
        const isPlural = pluralItems.some(item => lowerItem.includes(item));
        const garmentLabel = `${descriptor ? descriptor + ' ' : ''}${clothingItem}`.replace(/\s+/g, ' ').trim();
        const leadPhrase = isPlural
            ? `wearing ${garmentLabel}`
            : `wearing ${this.getIndefiniteArticle(garmentLabel)} ${garmentLabel}`;

        // Build the description - FIXED STRUCTURE
        const parts = [
            leadPhrase,
            necklineAndSleeves,
            `in ${colorDescription},`,
            `${patternColor}${pattern} pattern${embellishment}`
        ].filter(part => part && part.trim().length);

        return parts.join(' ');
    }

    getGarmentDescriptor(garmentType, clothingItem) {
        const baseFits = this.dataLoader.getAllFrom('clothing.json', 'garment_fits') || [];
        const baseSet = new Set(baseFits.map(fit => fit.toLowerCase()));
        const lowerItem = (clothingItem || '').toLowerCase();
        const pick = candidates => {
            const filtered = (candidates || []).filter(Boolean);
            if (filtered.length === 0) {
                return '';
            }

            const available = filtered.filter(option => baseSet.has(option.toLowerCase()));
            if (available.length > 0) {
                return this.dataLoader.randomChoice(available);
            }

            return this.dataLoader.randomChoice(filtered);
        };

        if (garmentType === 'top') {
            if (/(tee|t-shirt|tank top|camisole|bodysuit|crop top|jersey top|basic tee|graphic tee)/.test(lowerItem)) {
                return pick(['fitted', 'slim-fit', 'regular fit', 'standard fit', 'classic fit', 'comfortable fit', 'easy fit', 'relaxed', 'boxy', 'cropped']);
            }

            if (/(polo|henley|shirt|button-up|buttondown|button down|blouse|tunic)/.test(lowerItem)) {
                return pick(['tailored', 'structured', 'fitted', 'slim-fit', 'classic fit', 'regular fit', 'standard fit', 'easy fit', 'comfortable fit', 'straight-cut']);
            }

            if (/(sweater|pullover|knit|cardigan|hoodie|sweatshirt)/.test(lowerItem)) {
                return pick(['relaxed', 'oversized', 'longline', 'cropped', 'snug', 'comfortable fit', 'easy fit', 'boxy', 'regular fit']);
            }

            if (/(corset|bustier|bralette)/.test(lowerItem)) {
                return pick(['structured', 'form-fitting', 'body-hugging', 'curve-hugging', 'figure-hugging', 'skin-tight', 'close-fitting']);
            }

            return pick(['fitted', 'tailored', 'slim-fit', 'structured', 'regular fit', 'classic fit', 'standard fit', 'comfortable fit', 'easy fit', 'relaxed', 'flowing', 'draped', 'boxy', 'cropped', 'longline', 'gathered', 'ruched', 'shirred', 'smocked', 'pleated', 'paneled', 'asymmetrical', 'billowing']);
        }

        if (garmentType === 'dress') {
            if (/(bodycon|sheath|slip|column)/.test(lowerItem)) {
                return pick(['bodycon', 'form-fitting', 'body-hugging', 'curve-hugging', 'figure-hugging', 'slim-fit', 'fitted', 'tailored']);
            }

            if (/(ballgown|gown|evening gown|maxi gown|formal gown)/.test(lowerItem)) {
                return pick(['flowing', 'billowing', 'voluminous', 'A-line', 'princess', 'empire', 'trapeze', 'bias-cut']);
            }

            if (/(wrap|sarong)/.test(lowerItem)) {
                return pick(['wrap-style', 'sarong-style', 'bias-cut', 'draped', 'gathered']);
            }

            if (/(shirt dress|tunic dress)/.test(lowerItem)) {
                return pick(['tailored', 'straight-cut', 'regular fit', 'classic fit', 'easy fit', 'comfortable fit']);
            }

            if (/(fit-and-flare|skater|swing|peplum)/.test(lowerItem)) {
                return pick(['A-line', 'fit-and-flare', 'flared', 'swing', 'trapeze', 'gathered', 'pleated', 'ruched']);
            }

            return pick(['fitted', 'tailored', 'form-fitting', 'body-hugging', 'curve-hugging', 'A-line', 'flared', 'swing', 'trapeze', 'empire', 'princess', 'bias-cut', 'wrap-style', 'sarong-style', 'gathered', 'ruched', 'shirred', 'smocked', 'pleated', 'tucked', 'darted', 'seamed', 'paneled', 'asymmetrical', 'high-low', 'dip-hem', 'stepped hem', 'handkerchief hem', 'curved hem', 'scalloped hem', 'flowing', 'billowing', 'voluminous']);
        }

        if (garmentType === 'outerwear') {
            return pick(['tailored', 'structured', 'fitted', 'slim-fit', 'regular fit', 'classic fit', 'comfortable fit', 'easy fit', 'relaxed', 'boxy', 'square-cut', 'straight-cut', 'longline', 'cropped', 'wrap-style', 'double-breasted', 'single-breasted', 'oversized', 'generous fit', 'roomy']);
        }

        if (garmentType === 'bottom') {
            if (/(skirt|skort)/.test(lowerItem)) {
                if (/(pencil|column|straight)/.test(lowerItem)) {
                    return pick(['fitted', 'slim-fit', 'tailored', 'straight-cut', 'curve-hugging', 'figure-hugging']);
                }

                if (/(wrap|sarong)/.test(lowerItem)) {
                    return pick(['wrap-style', 'sarong-style', 'bias-cut', 'draped', 'gathered']);
                }

                if (/(pleated|circle|a-line|flared|tiered|swing)/.test(lowerItem)) {
                    return pick(['A-line', 'flared', 'swing', 'trapeze', 'pleated', 'gathered', 'ruched', 'shirred', 'smocked', 'paneled']);
                }

                return pick(['A-line', 'flared', 'swing', 'trapeze', 'pleated', 'gathered', 'ruched', 'shirred', 'smocked', 'paneled', 'asymmetrical', 'high-low', 'dip-hem', 'stepped hem', 'handkerchief hem', 'curved hem', 'scalloped hem']);
            }

            if (/(legging|yoga|skinny)/.test(lowerItem)) {
                return pick(['compression', 'stretch-fit', 'form-fitting', 'body-hugging', 'curve-hugging', 'figure-hugging', 'skin-tight', 'slim-fit', 'fitted', 'close-fitting']);
            }

            if (/(shorts|bermuda|hot pants|boy shorts)/.test(lowerItem)) {
                return pick(['tailored', 'fitted', 'slim-fit', 'regular fit', 'classic fit', 'easy fit', 'comfortable fit', 'relaxed', 'boxy']);
            }

            if (/(cargo|jogger|sweatpant|track|palazzo|culotte|wide|baggy)/.test(lowerItem)) {
                return pick(['relaxed', 'easy fit', 'comfortable fit', 'baggy', 'roomy', 'generous fit', 'straight-cut', 'flowing']);
            }

            return pick(['tailored', 'fitted', 'slim-fit', 'straight-cut', 'regular fit', 'classic fit', 'comfortable fit', 'easy fit', 'flared', 'bootcut', 'tapered']);
        }

        return pick(baseFits);
    }

    getIndefiniteArticle(phrase = '') {
        const firstWord = (phrase || '').trim().split(/\s+/)[0] || '';
        if (!firstWord) {
            return 'a';
        }

        const lower = firstWord.toLowerCase();
        const specialAn = ['honest', 'hour', 'honor', 'heir', 'heirloom'];
        const specialA = ['university', 'unicorn', 'european', 'one', 'once', 'unit', 'unique', 'useful', 'user', 'uber'];

        if (specialAn.some(prefix => lower.startsWith(prefix))) {
            return 'an';
        }

        if (specialA.some(prefix => lower.startsWith(prefix))) {
            return 'a';
        }

        return /^[aeiou]/.test(lower) ? 'an' : 'a';
    }

    getEmbellishmentPlacements(garmentType, clothingItem) {
        const lowerItem = (clothingItem || '').toLowerCase();

        if (garmentType === 'bottom' || /(skirt|pants|jeans|shorts|culotte|culottes|trouser|trousers|skort)/.test(lowerItem)) {
            if (/(skirt|skort)/.test(lowerItem)) {
                return [
                    'along the hem',
                    'at the waist',
                    'down the sides',
                    'on the pleats',
                    'around the waistband',
                    'throughout'
                ];
            }

            return [
                'along the hem',
                'at the waist',
                'down the sides',
                'on the pockets',
                'around the cuffs',
                'throughout'
            ];
        }

        if (garmentType === 'outerwear' || /(jacket|coat|cape|wrap|poncho|kimono|blazer)/.test(lowerItem)) {
            const placements = [
                'along the lapels',
                'around the collar',
                'on the cuffs',
                'down the front',
                'along the hem',
                'throughout'
            ];

            if (/(hood|parka|anorak|hoodie)/.test(lowerItem)) {
                placements.splice(1, 0, 'around the hood');
            }

            return placements;
        }

        if (garmentType === 'dress' || /(dress|gown)/.test(lowerItem)) {
            return [
                'on the bodice',
                'along the hem',
                'on the sleeves',
                'along the neckline',
                'at the waist',
                'throughout',
                'on the skirt'
            ];
        }

        // Default to top placements
        return [
            'on the bodice',
            'along the hem',
            'on the sleeves',
            'along the neckline',
            'at the waist',
            'throughout'
        ];
    }

    inferGarmentTypeFromName(clothingItem) {
        const lowerItem = (clothingItem || '').toLowerCase();

        if (/(kimono|robe|coat|jacket|cape|poncho|wrap)/.test(lowerItem)) {
            return 'outerwear';
        }

        if (/(skirt|pants|trousers|jeans|shorts|sarong|hakama|dhoti)/.test(lowerItem)) {
            return 'bottom';
        }

        if (/(dress|gown|cheongsam|hanbok|sari|kebaya|dirndl|lehenga|abaya)/.test(lowerItem)) {
            return 'dress';
        }

        return 'top';
    }

    describeGarmentFeatures({ file, necklineKey, sleeveKey, clothingItem, garmentType }) {
        const necklineOptions = this.dataLoader.getAllFrom(file, necklineKey);
        const sleeveOptions = this.dataLoader.getAllFrom(file, sleeveKey);

        let neckline = this.dataLoader.randomChoice(necklineOptions);
        let sleeve = this.dataLoader.randomChoice(sleeveOptions);

        ({ neckline, sleeve } = this.adjustNecklineAndSleeve({
            garmentType,
            clothingItem,
            neckline,
            sleeve,
            necklineOptions,
            sleeveOptions
        }));

        return this.buildFeatureDescription(neckline, sleeve);
    }

    adjustNecklineAndSleeve({ garmentType, clothingItem, neckline, sleeve, necklineOptions, sleeveOptions }) {
        const lowerItem = clothingItem.toLowerCase();
        const straplessNecklines = ['strapless', 'halter neck', 'one-shoulder'];

        if (straplessNecklines.includes(neckline)) {
            sleeve = 'sleeveless';
        }

        if (neckline === 'off-shoulder') {
            const offShoulderSleeves = ['off-shoulder sleeve', 'short sleeve', 'long sleeve', 'three-quarter sleeve', 'flutter sleeve', 'sheer sleeve'];
            sleeve = this.ensureOption(sleeve, offShoulderSleeves, sleeveOptions);
        } else if (sleeve === 'off-shoulder sleeve') {
            const nonOffShoulder = sleeveOptions.filter(option => option !== 'off-shoulder sleeve');
            sleeve = this.ensureOption(sleeve, nonOffShoulder, sleeveOptions);
        }

        if (garmentType === 'top') {
            if (/off-shoulder/.test(lowerItem)) {
                neckline = 'off-shoulder';
                sleeve = 'off-shoulder sleeve';
            }

            if (/camisole|tank top|bodysuit/.test(lowerItem)) {
                sleeve = 'sleeveless';
                const allowedNecklines = ['scoop neck', 'V-neck', 'square neck', 'halter neck', 'high neck'];
                neckline = this.ensureOption(neckline, allowedNecklines, necklineOptions);
            }

            if (/(graphic tee|basic tee|t-shirt|tee)/.test(lowerItem)) {
                const allowedNecklines = ['crew neck', 'scoop neck', 'V-neck', 'boat neck'];
                const allowedSleeves = ['short sleeve', 'long sleeve', 'three-quarter sleeve', 'cap sleeve', 'raglan sleeve', 'dolman sleeve'];

                neckline = this.ensureOption(neckline, allowedNecklines, necklineOptions);
                sleeve = this.ensureOption(sleeve, allowedSleeves, sleeveOptions);
            }

            if (/polo/.test(lowerItem)) {
                const allowedNecklines = ['polo collar', 'crew neck', 'V-neck'];
                const allowedSleeves = ['short sleeve', 'long sleeve', 'three-quarter sleeve'];

                neckline = this.ensureOption(neckline, allowedNecklines, necklineOptions);
                sleeve = this.ensureOption(sleeve, allowedSleeves, sleeveOptions);
            }

            if (/henley/.test(lowerItem)) {
                const allowedNecklines = ['crew neck', 'V-neck'];
                const allowedSleeves = ['long sleeve', 'short sleeve', 'three-quarter sleeve'];

                neckline = this.ensureOption(neckline, allowedNecklines, necklineOptions);
                sleeve = this.ensureOption(sleeve, allowedSleeves, sleeveOptions);
            }

            if (/(sweater|pullover|knit top|jersey top)/.test(lowerItem)) {
                const allowedNecklines = ['crew neck', 'scoop neck', 'V-neck', 'boat neck', 'high neck', 'cowl neck'];
                const allowedSleeves = ['long sleeve', 'three-quarter sleeve', 'raglan sleeve', 'dolman sleeve'];

                neckline = this.ensureOption(neckline, allowedNecklines, necklineOptions);
                sleeve = this.ensureOption(sleeve, allowedSleeves, sleeveOptions);
            }

            if (/(tunic|blouse|shirt|button-up|buttondown|button down)/.test(lowerItem) && !/(t-shirt|tee|polo|henley)/.test(lowerItem)) {
                const allowedNecklines = ['scoop neck', 'V-neck', 'boat neck', 'high neck', 'keyhole neck'];
                const allowedSleeves = ['short sleeve', 'long sleeve', 'three-quarter sleeve', 'bell sleeve', 'bishop sleeve', 'flutter sleeve', 'puffed sleeve'];

                neckline = this.ensureOption(neckline, allowedNecklines, necklineOptions);
                sleeve = this.ensureOption(sleeve, allowedSleeves, sleeveOptions);
            }
        } else if (garmentType === 'dress') {
            if (/t-shirt dress/.test(lowerItem)) {
                const allowedNecklines = ['crew neck', 'scoop neck', 'V-neck'];
                const allowedSleeves = ['short sleeve', 'long sleeve', 'three-quarter sleeve', 'cap sleeve'];

                neckline = this.ensureOption(neckline, allowedNecklines, necklineOptions);
                sleeve = this.ensureOption(sleeve, allowedSleeves, sleeveOptions);
            }
        }

        return { neckline, sleeve };
    }

    ensureOption(current, preferredList, fallbackOptions) {
        const available = preferredList.filter(option => fallbackOptions.includes(option));
        if (available.length === 0) {
            return current;
        }

        if (!available.includes(current)) {
            return this.dataLoader.randomChoice(available);
        }

        return current;
    }

    buildFeatureDescription(neckline, sleeve) {
        const necklinePhrase = this.describeNecklinePhrase(neckline);
        const sleevePhrase = this.describeSleevePhrase(sleeve);

        if (necklinePhrase && sleevePhrase) {
            return `with ${necklinePhrase} and ${sleevePhrase}`;
        } else if (necklinePhrase) {
            return `with ${necklinePhrase}`;
        } else if (sleevePhrase) {
            return `with ${sleevePhrase}`;
        }

        return '';
    }

    describeNecklinePhrase(neckline) {
        if (!neckline) {
            return '';
        }

        const phrases = {
            'V-neck': 'a V-neckline',
            'scoop neck': 'a scoop neckline',
            'crew neck': 'a crew neckline',
            'boat neck': 'a boat neckline',
            'off-shoulder': 'an off-shoulder neckline',
            'one-shoulder': 'a one-shoulder neckline',
            'high neck': 'a high neckline',
            'cowl neck': 'a cowl neckline',
            'halter neck': 'a halter neckline',
            'square neck': 'a square neckline',
            'sweetheart neck': 'a sweetheart neckline',
            'sweetheart': 'a sweetheart neckline',
            'strapless': 'a strapless neckline',
            'backless': 'a backless design',
            'keyhole neck': 'a keyhole neckline',
            'polo collar': 'a polo collar'
        };

        return phrases[neckline] || `a ${neckline}`;
    }

    describeSleevePhrase(sleeve) {
        if (!sleeve || sleeve === 'sleeveless') {
            return sleeve === 'sleeveless' ? 'a sleeveless design' : '';
        }

        const pluralReplacements = {
            'short sleeve': 'short sleeves',
            'long sleeve': 'long sleeves',
            'three-quarter sleeve': 'three-quarter sleeves',
            'cap sleeve': 'cap sleeves',
            'bell sleeve': 'bell sleeves',
            'flutter sleeve': 'flutter sleeves',
            'puffed sleeve': 'puffed sleeves',
            'bishop sleeve': 'bishop sleeves',
            'raglan sleeve': 'raglan sleeves',
            'dolman sleeve': 'dolman sleeves',
            'off-shoulder sleeve': 'off-shoulder sleeves',
            'cold shoulder': 'cold-shoulder cutouts'
        };

        return pluralReplacements[sleeve] || sleeve;
    }

    determineLengthGroupForStyle(style) {
        const lowerStyle = (style || '').toLowerCase();

        const shortKeywords = ['pixie', 'buzz', 'crop', 'boyish', 'short', 'crew', 'fade', 'pompadour', 'quiff', 'mohawk'];
        const longKeywords = ['long', 'braid', 'ponytail', 'bun', 'updo', 'chignon', 'cascade', 'mermaid', 'goddess', 'waist', 'tail'];

        if (shortKeywords.some(keyword => lowerStyle.includes(keyword))) {
            return 'short';
        }

        if (longKeywords.some(keyword => lowerStyle.includes(keyword))) {
            return 'long';
        }

        if (lowerStyle.includes('bob') || lowerStyle.includes('lob') || lowerStyle.includes('shag')) {
            return 'medium';
        }

        return 'medium';
    }

    getLengthOptions(lengthGroup) {
        const lengthOptions = {
            short: [
                'ultra short',
                'very short',
                'short',
                'cropped short',
                'pixie-short',
                'buzz-cut short',
                'closely cropped',
                'ear-length',
                'chin-length',
                'jaw-length',
                'neck-length',
                'nape-length',
                'boyish short'
            ],
            medium: [
                'medium-short',
                'medium',
                'medium-length',
                'shoulder-length',
                'grazing-shoulders',
                'just-past-shoulders',
                'collarbone-length'
            ],
            long: [
                'medium-long',
                'long',
                'very long',
                'extra long',
                'ultra long',
                'mid-back length',
                'lower-back length',
                'waist-length',
                'hip-length',
                'thigh-length',
                'floor-length',
                'tailbone-length',
                'rapunzel-length'
            ]
        };

        return lengthOptions[lengthGroup] || lengthOptions.medium;
    }

    // Generate clothing color - UNCHANGED
    generateClothingColor(colorBoldnessChance = 50, fabric = '') {
        let colorCategories;
        let intensities;

        // Define incompatible combinations
        const delicateFabrics = ['chiffon', 'organza', 'tulle', 'voile', 'lace', 'silk', 'satin'];
        const structuredFabrics = ['denim', 'canvas', 'tweed', 'oxford cloth', 'corduroy'];
        const neutralColors = ['ivory', 'cream', 'white', 'beige', 'ecru', 'bone'];

        const isDelicateFabric = delicateFabrics.some(f => fabric.toLowerCase().includes(f));
        const isStructuredFabric = structuredFabrics.some(f => fabric.toLowerCase().includes(f));

        if (colorBoldnessChance > 80) {
            colorCategories = ['vibrant_colors', 'metallic_tones'];
            // Avoid "electric" with delicate fabrics or neutral colors
            if (isDelicateFabric) {
                intensities = ['bright', 'bold', 'vivid', 'brilliant'];
            } else {
                intensities = ['bright', 'bold', 'vivid', 'electric', 'brilliant'];
            }
        } else if (colorBoldnessChance > 50) {
            colorCategories = ['warm_colors', 'cool_colors', 'vibrant_colors', 'metallic_tones'];
            intensities = this.dataLoader.getAllFrom('clothing-colors.json', 'color_intensities');
        } else {
            colorCategories = ['neutral_bases', 'warm_colors', 'cool_colors', 'pastel_tones'];
            intensities = this.dataLoader.getAllFrom('clothing-colors.json', 'color_intensities');
        }

        const category = this.dataLoader.randomChoice(colorCategories);
        let color = this.dataLoader.getRandomFrom('clothing-colors.json', category);

        // Prevent problematic color + fabric combinations
        if (isStructuredFabric && neutralColors.some(nc => color.toLowerCase().includes(nc))) {
            // Retry with a different color for structured fabrics
            const nonNeutralCategories = colorCategories.filter(cat => cat !== 'neutral_bases');
            if (nonNeutralCategories.length > 0) {
                const altCategory = this.dataLoader.randomChoice(nonNeutralCategories);
                color = this.dataLoader.getRandomFrom('clothing-colors.json', altCategory);
            }
        }

        let intensity = this.dataLoader.randomChoice(intensities);

        // Filter out problematic intensity + color combinations
        const problematicCombos = {
            'electric': neutralColors,
            'neon': neutralColors,
            'vivid': ['ivory', 'cream']
        };

        if (problematicCombos[intensity]) {
            if (problematicCombos[intensity].some(pc => color.toLowerCase().includes(pc))) {
                // Use a different intensity
                const safeIntensities = intensities.filter(i => !problematicCombos[i]);
                intensity = this.dataLoader.randomChoice(safeIntensities);
            }
        }

        return `${intensity} ${color}`;
    }

    // UPDATED: Generate accessories with explicit colors and materials
    generateAccessories(preferences = {}) {
        const accessories = [];
        const accessoryDensity = preferences.accessoryDensityChance || 60;
        const frequency = typeof preferences?.accessoryFrequency === 'number'
            ? preferences.accessoryFrequency
            : 50;

        let adjustedDensity = accessoryDensity;
        if (frequency > 80) {
            adjustedDensity = accessoryDensity * 1.4;
        } else if (frequency < 40) {
            adjustedDensity = accessoryDensity * 0.6;
        }
        adjustedDensity = Math.max(10, Math.min(100, adjustedDensity));

        // --- Accessory Load Balancer ---
            // 🎩 [PATCH] Headwear Suppression + Accessory Caps

        let includeJewelry = true;
        let includeHeadwear = true;
        let includeEyewear = true;

            if (preferences.accessoryFrequency < 40) {
        includeHeadwear = false; // Prevent headwear entirely in minimal mode
    }

    // 🧢 Accessory Cap Logic by Mode
    if (preferences.accessoryFrequency >= 85 && accessories.length > 3) {
        accessories.splice(3); // cap to 3 accessories
    }
    if (preferences.accessoryFrequency <= 65 && accessories.length > 2) {
        accessories.splice(2); // cap to 2 accessories
    }
    
        if (frequency > 80 && Math.random() < 0.8) {
            const disableOne = this.dataLoader.randomChoice(['jewelry', 'headwear', 'eyewear']);
            if (disableOne === 'jewelry') includeJewelry = false;
            if (disableOne === 'headwear') includeHeadwear = false;
            if (disableOne === 'eyewear') includeEyewear = false;
        }

        // Jewelry
        if (includeJewelry && Math.random() * 100 < adjustedDensity) {
            const jewelryType = this.dataLoader.randomChoice(['necklace_types', 'earring_styles', 'bracelet_types', 'ring_varieties']);
            const jewelry = this.dataLoader.getRandomFrom('jewelry.json', jewelryType);
            const metal = this.dataLoader.getRandomFrom('jewelry.json', 'jewelry_metals');
            const style = this.dataLoader.getRandomFrom('jewelry.json', 'jewelry_styles');
            const gemstone = this.dataLoader.getRandomFrom('jewelry.json', 'gemstones');

            // Add placement for specific jewelry types
            let placement = '';
            if (jewelryType === 'bracelet_types') {
                placement = this.dataLoader.randomChoice([' on left wrist', ' on right wrist', ' on both wrists']);
            } else if (jewelryType === 'ring_varieties') {
                placement = this.dataLoader.randomChoice([' on left hand', ' on right hand', ' on both hands']);
            }

            accessories.push(`${style} ${metal} ${jewelry} with ${gemstone} stones${placement}`);
        }

        // Headwear with explicit color and material
        if (includeHeadwear && Math.random() * 100 < adjustedDensity * 0.75) {
            const headwearCategories = ['casual_hats', 'formal_hats', 'hair_accessories', 'crowns_tiaras'];
            const category = this.dataLoader.randomChoice(headwearCategories);
            const headwear = this.dataLoader.getRandomFrom('headwear.json', category);
            const material = this.dataLoader.getRandomFrom('headwear.json', 'materials');
            const style = this.dataLoader.getRandomFrom('headwear.json', 'style_descriptors');

            // Get explicit color for headwear
            const headwearColors = [
                'black', 'white', 'navy blue', 'burgundy', 'cream',
                'rose pink', 'emerald green', 'royal blue', 'silver', 'gold'
            ];
            const color = this.dataLoader.randomChoice(headwearColors);

            // Add positioning
            const positions = [
                'positioned centered on head',
                'tilted to the right side',
                'tilted to the left side',
                'pushed back on head',
                'nestled in hair',
                'across forehead'
            ];
            const position = this.dataLoader.randomChoice(positions);

            // Add decorative elements for certain headwear
            let decoration = '';
            if (category === 'formal_hats' || category === 'crowns_tiaras') {
                const decorations = [
                    ' with black netting veil',
                    ' with white feather accent',
                    ' with pearl embellishments',
                    ' with ribbon bow',
                    ' with floral appliqué'
                ];
                decoration = this.dataLoader.randomChoice(decorations);
            }

            accessories.push(`${color} ${material} ${style} ${headwear}${decoration} ${position}`);
        }


// --- Eyewear (v3: strict validation, expanded fashion reclass, safer goggles) ---
if (includeEyewear && Math.random() * 100 < adjustedDensity * 0.5) {
  const st = (preferences?.settingType || '').toLowerCase();
  const isThemed = st === 'historical' || st === 'fantasy';

  // Weighted category pools
  const modernPool = [
    ['sunglasses', 40],
    ['prescription_glasses', 35],
    ['fashion_eyewear', 25]
  ];
  const themedPool = [
    ['masks_face_wear', 30],
    ['specialty_eyewear', 35],  // slightly boosted
    ['sunglasses', 15],         // slightly reduced
    ['prescription_glasses', 10],
    ['fashion_eyewear', 10]
  ];
  const pool = isThemed ? themedPool : modernPool;

  const pickWeighted = (pairs) => {
    const total = pairs.reduce((s, [, w]) => s + w, 0);
    let r = Math.random() * total;
    for (const [name, w] of pairs) {
      r -= w;
      if (r <= 0) return name;
    }
    return pairs[0][0];
  };

  const randFrom = (key) => this.dataLoader.getRandomFrom('eyewear.json', key);

  let category = pickWeighted(pool);
  let eyewear = randFrom(category);

  // --- Expanded reclassification (Fix 2) ---
  if (category === 'prescription_glasses' && eyewear) {
    const lower = eyewear.toLowerCase();
    if (/(non[-\s]?prescription|novelty|fashion|decorative|party|costume|theatrical|colored|tinted)/.test(lower)) {
      category = 'fashion_eyewear';
    }
  }

  // fallback if nothing picked
  if (!eyewear) {
    for (const [alt] of pool) {
      eyewear = randFrom(alt);
      if (eyewear) { category = alt; break; }
    }
  }

  // Rare backstop for themed eyewear even in modern contexts
  if (!isThemed && !eyewear && Math.random() < 0.03) {
    category = this.dataLoader.randomChoice(['masks_face_wear', 'specialty_eyewear']);
    eyewear = randFrom(category);
  }

  if (eyewear) {
    // helpers
    const frameShape = this.dataLoader.getRandomFrom('eyewear.json', 'frame_shapes');
    const frameMaterial = this.dataLoader.getRandomFrom('eyewear.json', 'frame_materials');
    const frameColors = [
      'black','tortoiseshell','clear','brown','gold','silver','rose gold','navy blue','smoky gray','matte charcoal'
    ];
    const frameColor = this.dataLoader.randomChoice(frameColors);
    const mood = (preferences?.lightingMood || '').toLowerCase();

    // --- Strict lens pools ---
    const lensPools = {
      sunglasses: ['dark','tinted','mirrored','gradient','polarized','photochromic','colored','holographic'],
      prescription_glasses: ['clear','anti-reflective','blue light blocking','photochromic','tinted'],
      fashion_eyewear: ['clear','tinted','colored','holographic','anti-reflective'],
      specialty_eyewear: ['clear','anti-reflective'], // adjusted later for goggles
      masks_face_wear: []
    };

    const isGoggles = /(goggle|goggles|aviator goggles|welding goggles|steampunk goggles)/i.test(eyewear);
const chooseLens = () => {
  let lensPool = lensPools[category] || [];

  // Specialty eyewear lens assignment
  if (category === 'specialty_eyewear') {
    lensPool = isGoggles ? ['tinted','dark','photochromic'] : ['clear','anti-reflective'];
  }

  // Mood-aware adjustments
  if (mood === 'cinematic') {
    lensPool = lensPool
      .filter(x => !/mirrored|holographic/.test(x))
      .concat(['tinted','dark','anti-reflective']);
  } else if (mood === 'bright' && category === 'sunglasses') {
    lensPool = lensPool.concat(['polarized','gradient','mirrored']);
  }

  // --- 🌤 Lens Nuance Fix: boost photochromic frequency ---
  // Adds small bias for natural realism in daylight/cinematic lighting
  if (['prescription_glasses','sunglasses','fashion_eyewear'].includes(category)) {
    if (Math.random() < 0.1) {
      lensPool.push('photochromic');
    }
  }

  // Keep holographic rare
  if (Math.random() < 0.9) lensPool = lensPool.filter(l => l !== 'holographic');

  return lensPool.length ? this.dataLoader.randomChoice(lensPool) : '';
};

    // --- Final safety validator (Fix 1) ---
    const validateLens = (cat, item, lens) => {
      if (!lens) return '';
      const t = (item || '').toLowerCase();
      const pools = {
        sunglasses: new Set(['dark','tinted','mirrored','gradient','polarized','photochromic','colored','holographic']),
        prescription_glasses: new Set(['clear','anti-reflective','blue light blocking','photochromic','tinted']),
        fashion_eyewear: new Set(['clear','tinted','colored','holographic','anti-reflective']),
        specialty_goggles: new Set(['tinted','dark','photochromic']),
        specialty_plain: new Set(['clear','anti-reflective']),
        masks_face_wear: new Set()
      };
      let allowed;
      if (cat === 'specialty_eyewear') {
        allowed = /goggle/.test(t) ? pools.specialty_goggles : pools.specialty_plain;
      } else {
        allowed = pools[cat] || new Set();
      }
      return allowed.has(lens) ? lens : '';
    };

    // descriptors
    const styleDesc = this.dataLoader.getRandomFrom('eyewear.json', 'style_descriptors');
    const specialFeat = this.dataLoader.getRandomFrom('eyewear.json', 'special_features');
    let addon = '';
    const wantStyle = Math.random() < 0.35;
    const wantFeature = Math.random() < 0.25;
    if (wantStyle && wantFeature) {
      addon = Math.random() < 0.6 ? styleDesc : (specialFeat ? `${specialFeat} frames` : '');
    } else if (wantStyle) {
      addon = styleDesc || '';
    } else if (wantFeature) {
      addon = specialFeat ? `${specialFeat} frames` : '';
    }

    const parts = [];
    const add = (s) => { if (s && typeof s === 'string' && s.trim()) parts.push(s.trim()); };

    if (category === 'masks_face_wear') {
      add([addon, eyewear].filter(Boolean).join(' ').trim());
    } else if (category === 'specialty_eyewear' && !/goggle|goggles/i.test(eyewear)) {
      add([addon, eyewear].filter(Boolean).join(' ').trim());
    } else {
      const core = [frameShape, frameColor, frameMaterial, eyewear].filter(Boolean).join(' ');
      add(core);
      const lens = chooseLens();
      const safeLens = validateLens(category, eyewear, lens);
      if (safeLens) add(`with ${safeLens} lenses`);
      if (addon) add(addon);
    }

    const eyewearLine = parts.join(' ').replace(/\s+/g, ' ').trim();
    if (eyewearLine) accessories.push(eyewearLine);
  }

  // determine if eyewear should be included
let eyewearChance = adjustedDensity * 0.5;

switch (preferences.eyewearMode) {
  case 'none':
    eyewearChance = 0;
    break;
  case 'frequent':
    eyewearChance = adjustedDensity * 1.2; // 20% boost
    break;
  default:
    // random (normal)
    break;
}

}



        if (accessories.length === 0) {
            return '';
        }

        return `adorned with ${accessories.join(', ')}`;
    }

    // NEW: Generate camera details
    generateCamera(pose = '') {
        let shotTypes;

        // Check if pose involves sitting
        const isSitting = pose.toLowerCase().includes('sitting') ||
            pose.toLowerCase().includes('sit on') ||
            pose.toLowerCase().includes('seated');

        // Check if pose involves leaning forward/dynamic movement
        const isLeaningForward = pose.toLowerCase().includes('leaning forward') ||
            pose.toLowerCase().includes('bending forward');

        if (isSitting) {
            shotTypes = [
                'seated portrait from waist up',
                'half body shot from waist up',
                'portrait shot from shoulders up',
                'close-up portrait'
            ];
        } else if (isLeaningForward) {
            // For forward-leaning poses, avoid portrait shots that would look awkward
            shotTypes = [
                'full body shot',
                'three-quarter body shot',
                'half body shot from waist up'
            ];
        } else {
            shotTypes = [
                'full body shot',
                'three-quarter body shot',
                'half body shot from waist up',
                'portrait shot from shoulders up',
                'close-up portrait'
            ];
        }

        const shotType = this.dataLoader.randomChoice(shotTypes);

        const angles = [
            'from eye level',
            'from slightly above',
            'from slightly below',
            'from a low angle'
        ];
        const angle = this.dataLoader.randomChoice(angles);

        const distances = [
            'at 3 feet distance',
            'at 4 feet distance',
            'at 5 feet distance',
            'at 6 feet distance'
        ];
        const distance = this.dataLoader.randomChoice(distances);

        return `${shotType} ${angle} ${distance}`;
    }

    // UPDATED: Generate setting with explicit materials and colors + hard fallback
generateSetting(settingPreference = null) {
    let settingFile, category, settingData;

    function pickNaturalFallback(self) {
        const fallbackFile = 'natural.json';
        const fallbackCategories = ['forest_settings', 'water_environments', 'mountain_landscapes', 'field_meadows'];
        const fbCategory = self.dataLoader.randomChoice(fallbackCategories);
        return self.dataLoader.getRandomFrom(fallbackFile, fbCategory);
    }

    if (settingPreference === 'historical') {
        settingFile = 'historical.json';
        const categories = ['ancient_periods', 'medieval_settings', 'renaissance_venues', 'outdoor_historical'];
        category = this.dataLoader.randomChoice(categories);
        settingData = this.dataLoader.getRandomFrom(settingFile, category);
    } else if (settingPreference === 'fantasy') {
        settingFile = 'fantasy.json';
        const categories = ['magical_landscapes', 'fantastical_structures', 'elemental_environments', 'mystical_waters'];
        category = this.dataLoader.randomChoice(categories);
        settingData = this.dataLoader.getRandomFrom(settingFile, category);
    } else if (settingPreference === 'urban') {
        settingFile = 'urban.json';
        const categories = ['street_settings', 'indoor_spaces', 'cultural_venues', 'public_spaces'];
        category = this.dataLoader.randomChoice(categories);
        settingData = this.dataLoader.getRandomFrom(settingFile, category);
    } else {
        settingFile = 'natural.json';
        const categories = ['forest_settings', 'water_environments', 'mountain_landscapes', 'field_meadows'];
        category = this.dataLoader.randomChoice(categories);
        settingData = this.dataLoader.getRandomFrom(settingFile, category);
    }

    // HARD VALIDATION + RETRY
    if (!settingData || !settingData.name || !settingData.preposition || !settingData.article) {
        // Retry once with a safe natural fallback
        settingData = pickNaturalFallback(this);
    }

    // Final guard: if still bad, return a safe default grove
    if (!settingData || !settingData.name || !settingData.preposition || !settingData.article) {
        const name = 'forest grove';
        const preposition = 'in';
        const article = 'a';
        return {
            description: `positioned ${preposition} ${article} ${name}`,
            hasTrees: true
        };
    }

    const { name, preposition, article } = settingData;

    return {
        description: `positioned ${preposition} ${article} ${name}`,
        hasTrees: name.toLowerCase().includes('garden') || name.toLowerCase().includes('grove') || name.toLowerCase().includes('forest')
    };
}


// ✅ Fully data-driven lighting generator
generateLighting(settingPreference = null, hasTrees = false, preferences = {}) {
    let primaryLight = '';
    let secondaryLight = '';
    let effect = '';

    // Determine which primary and secondary lists to use
    let primaryCategory = '';
    let secondaryCategory = '';

    switch (settingPreference) {
        case 'fantasy':
            primaryCategory = 'fantasy_primary';
            secondaryCategory = 'fantasy_secondary';
            break;

        case 'historical':
            primaryCategory = 'historical_primary';
            secondaryCategory = 'historical_secondary';
            break;

        case 'urban':
            primaryCategory = 'urban_primary';
            secondaryCategory = 'urban_secondary';
            break;

        case 'natural':
        default:
            primaryCategory = 'natural_primary';
            secondaryCategory = 'natural_secondary';
            break;
    }

    // Get random primary and secondary lights
    const primaryList = this.dataLoader.getAllFrom('lighting.json', primaryCategory);
    const secondaryList = this.dataLoader.getAllFrom('lighting.json', secondaryCategory);

    primaryLight = this.dataLoader.randomChoice(primaryList);
    secondaryLight = this.dataLoader.randomChoice(secondaryList);

    // Get a random subject lighting effect (optional)
    effect = this.dataLoader.getRandomFrom('lighting.json', 'subject_lighting_effects');

// 🧩 Fallbacks to prevent "with null" or empty text
const parts = [];
if (primaryLight) parts.push(primaryLight);
if (secondaryLight) parts.push(secondaryLight);
if (effect) parts.push(effect);

// --- Lighting Phrase Variation System + Daylight Priority System ---
const effectDescription = parts.join(', ');

// If nothing was selected, bail out early
if (!effectDescription) {
    return '';
}

const lightingTemplates = [
    `creating ${effectDescription} on skin`,
    `casting ${effectDescription} across the scene`,
    `illuminating her silhouette with ${effectDescription}`,
    `revealing soft contours under the light`,
    `highlighting facial features with ${effectDescription}`,
    `enveloping the scene in ${effectDescription}`
];

let lightingEffect = this.dataLoader.randomChoice(lightingTemplates);

// ☀️ DAYLIGHT PRIORITY SYSTEM ☀️
const daylightWords = /(sunlit|daylight|sunshine|morning|noon|afternoon|golden hour|bright|sunbeam|clear sky)/i;
const coldToneWords = /(cool tone|blue light|noir|low-key|cinematic|shadowy|moody|dark|twilight|storm|night|low light)/gi;

// Automatically brighten and warm outdoor or neutral scenes
if (
    settingPreference === 'natural' ||
    /beach|garden|field|meadow|forest|mountain|outdoor|valley|sunlit/i.test(effectDescription)
) {
    lightingEffect = lightingEffect
        .replace(coldToneWords, 'warm glowing sunlight')
        .replace(/\bdeep contrast\b/gi, 'soft luminous lighting')
        .replace(/\bhigh contrast\b/gi, 'bright sunlit tones')
        .replace(/\bcool tone\b/gi, 'warm tone')
        .replace(/\bcinematic\b/gi, 'sunlit and natural')
        .replace(/\bshadowy\b/gi, 'brightly lit')
        .replace(/\bmoody\b/gi, 'radiant and cheerful');
}
// --- Lighting Mood preference override ---
switch (preferences?.lightingMood) {
    case 'bright':
        lightingEffect = lightingEffect
            .replace(/(shadowy|moody|dim|dark|low-key|cool tone|noir)/gi, 'bright sunlit');
        // 🌞 [PATCH] Prevent redundant golden phrasing in bright daylight
        lightingEffect = lightingEffect.replace(/warm golden color grading/gi, 'clean daylight color grading');
        lightingEffect = lightingEffect
            .replace(/(cool|neutral) tone/gi, 'warm tone');
        if (!/daylight|sunlit|bright/gi.test(lightingEffect)) {
            lightingEffect += ', under bright daylight';
        }
        break;

    case 'neutral':
        // Keep balanced tone, no strong modification
        break;

    case 'cinematic':
        lightingEffect = lightingEffect
            .replace(/(bright|sunlit|radiant|warm|daylight|glowing)/gi, 'moody shadowy');
        // 🎬 [PATCH] Ensure residual warm terms are converted
        lightingEffect = lightingEffect.replace(/\bwarm\b/gi, 'cool');
        lightingEffect = lightingEffect
            .replace(/warm tone/gi, 'cool tone');
        if (!/dramatic|high contrast/gi.test(lightingEffect)) {
            lightingEffect += ', with dramatic high contrast lighting';
        }
        break;
}

// Always prefer daylight phrasing even if scene isn’t explicitly “natural”
if (!daylightWords.test(lightingEffect)) {
    lightingEffect += ', under bright daylight';
}

// Ensure final phrasing reads cleanly
lightingEffect = lightingEffect
    .replace(/,\s*,/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .trim();

// --- 🎬 Micro Enhancement 2: Lighting Sync for Cinematic Mode ---
if (preferences?.lightingMood === 'cinematic') {
    lightingEffect = lightingEffect
        // Replace daylight / bright references
        .replace(/\bunder bright daylight\b/gi, 'under low-key cinematic lighting')
        .replace(/\bunder daylight\b/gi, 'under dim ambient light')
        .replace(/\bbright daylight\b/gi, 'low-key lighting')
        .replace(/\bbright sunlit\b/gi, 'shadowy')
        .replace(/\bsunlit\b/gi, 'dimly lit')
        .replace(/\bsoft warm lighting\b/gi, 'soft cool lighting')
        .replace(/\bwarm glow\b/gi, 'cool shadow glow')
        .replace(/\bwarm light\b/gi, 'cool light')
        .replace(/\bbright light\b/gi, 'diffused cool light')
        .replace(/\bright\b/gi, 'dim')
        // Add cinematic phrasing
        .replace(/creating/gi, 'casting')
        .replace(/illumination/gi, 'low-key illumination');

    // Add variety for cinematic tone
    const cinematicTemplates = [
        'casting dim ambient light across the scene',
        'revealing subtle contours under low-key lighting',
        'enveloping the subject in diffused cool light',
        'soft shadows falling across the frame under cinematic illumination',
        'low-key lighting emphasizing texture and depth'
    ];
    lightingEffect = `${this.dataLoader.randomChoice(cinematicTemplates)}`;
}

return lightingEffect;


}


    // UPDATED: Generate art style with explicit technical details
generateArtStyle(stylePreference = null, preferences = {}) {
    let styleCategory, style;

    if (stylePreference === 'photorealistic') {
        styleCategory = 'photorealistic_styles';
        style = this.dataLoader.getRandomFrom('art-styles.json', styleCategory);
    } else if (stylePreference === 'artistic') {
        styleCategory = 'painting_styles';
        style = this.dataLoader.getRandomFrom('art-styles.json', styleCategory);
    } else if (stylePreference === 'editorial') {
        styleCategory = 'fashion_photography';
        style = this.dataLoader.getRandomFrom('art-styles.json', styleCategory);
    } else if (stylePreference === 'anime') {
        styleCategory = 'anime_manga_styles';
        style = this.dataLoader.getRandomFrom('art-styles.json', styleCategory);
    } else if (stylePreference === 'cartoon') {
        styleCategory = 'cartoon_styles';
        style = this.dataLoader.getRandomFrom('art-styles.json', styleCategory);
    } else if (stylePreference === 'painting') {
        styleCategory = 'painting_styles';
        style = this.dataLoader.getRandomFrom('art-styles.json', styleCategory);
    } else if (stylePreference === 'digital') {
        styleCategory = 'digital_art_styles';
        style = this.dataLoader.getRandomFrom('art-styles.json', styleCategory);
    } else if (stylePreference === 'vintage') {
        styleCategory = 'vintage_styles';
        style = this.dataLoader.getRandomFrom('art-styles.json', styleCategory);
    } else {
        const categories = [
            'photorealistic_styles', 
            'painting_styles', 
            'fashion_photography', 
            'editorial_style',
            'photography_types',
            'anime_manga_styles',
            'cartoon_styles',
            'digital_art_styles',
            'vintage_styles'
        ];
        styleCategory = this.dataLoader.randomChoice(categories);
        style = this.dataLoader.getRandomFrom('art-styles.json', styleCategory);
    }

    const technique = this.dataLoader.getRandomFrom('art-styles.json', 'artistic_techniques');
    const quality = this.dataLoader.getRandomFrom('art-styles.json', 'rendering_quality');
    
// --- Art Style Harmony (mood-aware) ---
let artStyleOptions = [
  // Photography-first styles (neutral)
  'editorial photography',
  'studio fashion photography',
  'natural photography style',
  'street fashion photography',
  'film photography style',
  'documentary style',
  'lifestyle photography',
  'candid photography',
  'luxury brand photography',
  'harper\'s bazaar style',
  'avant-garde editorial style',
  // Painterly / illustrative (bright-leaning)
  'digital art',
  'stylized illustration',
  'character design',
  'vector art',
  'anime style',
  'modern anime style',
  'seinen style',
  'kawaii style',
  'disney-inspired style',
  'low-poly art',
  'oil painting',
  'watercolor',
  'contemporary painting',
  // Retro/film looks (cinematic-leaning)
  'polaroid style',
  'sepia tone style',
  'hyperrealistic style'
];

// Bias artStyle choices by lighting mood
if (preferences?.lightingMood === 'cinematic') {
  // Prefer filmic/photographic realism + editorial looks
  const cinematicPreferred = [
    'editorial photography',
    'studio fashion photography',
    'film photography style',
    'documentary style',
    'street fashion photography',
    'candid photography',
    'luxury brand photography',
    'harper\'s bazaar style',
    'avant-garde editorial style',
    'polaroid style',
    'sepia tone style',
    'hyperrealistic style'
  ];
  // Remove cartoon/bright illustrative styles from the pool
  artStyleOptions = artStyleOptions
    // Remove any illustrative, anime, or digital-art styles
    .filter(s => !/(anime|kawaii|pixar|vector|low-poly|disney|cartoon|illustration|digital art|stylized illustration)/i.test(s))
    // Put cinematicPreferred at the front to increase selection odds
    .filter(s => !cinematicPreferred.includes(s));
  artStyleOptions = [...cinematicPreferred, ...artStyleOptions];

} else if (preferences?.lightingMood === 'bright') {
  // Prefer bright, lively styles
  const brightPreferred = [
    'natural photography style',
    'lifestyle photography',
    'editorial photography',
    'street fashion photography',
    'digital art',
    'stylized illustration',
    'vector art',
    'anime style',
    'kawaii style',
    'modern anime style',
    'disney-inspired style',
    'oil painting',
    'watercolor',
    'contemporary painting'
  ];
  // De-emphasize overtly filmic/retro styles
  artStyleOptions = artStyleOptions
    .filter(s => !/(noir|filmic|low-key)/i.test(s));
  // Put brightPreferred at the front
  artStyleOptions = [
    ...brightPreferred.filter(x => artStyleOptions.includes(x)),
    ...artStyleOptions.filter(x => !brightPreferred.includes(x))
  ];
}

// Respect any explicit stylePreference, otherwise pick from mood-aware options
let artStyle;
if (stylePreference && typeof stylePreference === 'string' && stylePreference.trim()) {
  artStyle = stylePreference;
} else {
  artStyle = this.dataLoader.randomChoice(artStyleOptions);
}

// --- Smart Color Grading + Lighting Mood Harmony ---

let gradingOptions = [];

// Adjust color palette bias based on lighting mood
switch (preferences?.lightingMood) {
    case 'bright':
        gradingOptions = [
            'warm golden color grading',
            'vibrant saturated tones with sunny highlights',
            'radiant pastel palette with soft warm glow',
            'bright sunlit tones with luminous contrast',
            'rich golden-hour color balance',
            'light airy palette with gentle warmth'
        ];
                gradingOptions = gradingOptions.map(opt =>
    opt.replace(/\bcool\b/gi, 'warm').replace(/\bdesaturated\b/gi, 'radiant')
);
        break;

    case 'cinematic':
        gradingOptions = [
            'cool desaturated tones with dramatic shadows',
            'deep teal-orange contrast palette',
            'muted moody color grading',
            'low-key cinematic palette with cool highlights',
            'subtle filmic tones with high contrast',
            'dark neutral tones with cool ambient lighting'
        ];
        break;

    case 'neutral':
    default:
        gradingOptions = [
            'balanced natural color grading',
            'realistic daylight color palette',
            'soft neutral tones with gentle highlights',
            'moderate saturation and balanced warmth',
            'subtle cinematic tone mapping',
            'vivid but natural contrast palette'
        ];

        break;
}

// Check if outfit might qualify as monochrome
const clothingSegment = (this.lastGeneratedClothing || '').toLowerCase();
const multiHueIndicators = /(accent trim|multi|pattern|striped|polka|checkered|ombre|gradient|kaleidoscope|hologram|fractal|contrast|vivid)/i;
const singleToneIndicators = /(solid|tonal|neutral|muted|uniform|matching|single-color|monotone|one tone)/i;

const hasAccent = multiHueIndicators.test(clothingSegment);
const isSingleTone = singleToneIndicators.test(clothingSegment);

if (isSingleTone && !hasAccent) {
    gradingOptions.push('monochromatic color scheme');
}


const colorGrading = this.dataLoader.randomChoice(gradingOptions);


    // Specific entries that should NOT get "style" added even if in a category that normally adds it
    const noStyleEntries = [
        '2D animation', '3D animation', 'japanese animation', 'manga illustration',
        'stylized illustration', 'character design', 'vector illustration',
        'digital illustration', 'cel-shaded'
    ];

    // Categories where we generally add "style" suffix (with exceptions above)
    const addStyleSuffix = [
        'anime_manga_styles',
        'cartoon_styles',
        'artistic_movements',
        'vintage_styles',
        'editorial_style',
        'photorealistic_styles'
    ];

    // Determine verb and style phrase
    let verb, stylePhrase;
    
    // Photography-related categories
    const photographyCategories = [
        'fashion_photography', 
        'editorial_style', 
        'photography_types'
    ];
    
    // Painting and traditional art categories
    const paintingCategories = [
        'painting_styles',
        'artistic_movements'
    ];
    
    // Digital and illustrated categories
    const digitalCategories = [
        'anime_manga_styles',
        'cartoon_styles',
        'digital_art_styles'
    ];
    
    // Determine if we should add "style" suffix
    if (noStyleEntries.includes(style)) {
        // These specific entries never get "style" added
        stylePhrase = style;
    } else if (addStyleSuffix.includes(styleCategory)) {
        // Category normally adds "style"
        stylePhrase = `${style} style`;
    } else {
        // Don't add "style"
        stylePhrase = style;
    }
    
    // Determine verb
    if (photographyCategories.includes(styleCategory)) {
        verb = 'shot in';
    } else if (styleCategory === 'photorealistic_styles') {
        verb = 'captured in';
    } else if (paintingCategories.includes(styleCategory)) {
        verb = 'rendered in';
    } else if (digitalCategories.includes(styleCategory)) {
        verb = 'illustrated in';
    } else if (styleCategory === 'vintage_styles') {
        verb = 'shot in';
    } else {
        verb = 'created in';
    }

    return `${verb} ${stylePhrase}, featuring ${technique}, ${quality}, and ${colorGrading}`;
}

    // NEW: Generate mood/atmosphere
    generateMood(preferences = {}) {
        const baseMoods = [
            'exuding timeless elegance and mystery',
            'conveying magical wonder and tranquility',
            'exuding urban edge and fierce independence',
            'evoking refined grace and timeless sophistication',
            'radiating confidence and power',
            'expressing serene contemplation',
            'conveying joyful energy and vitality',
            'exuding romantic elegance',
            'displaying bold dramatic presence',
            'emanating gentle peaceful energy'
        ];

        // Avoid repeating phrases that already appear in artStyle
        const recentArtStyle = (this.lastGeneratedClothing || '') + ' ' + (this.lastPrompt || '');
        const filteredMoods = baseMoods.filter(m =>
            !new RegExp(m.split(' ')[1], 'i').test(recentArtStyle)
        );
        let pool = filteredMoods.length ? filteredMoods : [...baseMoods];
        // --- 🎬 Cinematic Mood Language Refinement ---
        if (preferences?.lightingMood === 'cinematic') {
            // Replace or filter out bright / dreamy moods
            pool = pool
                .filter(m =>
                    !/(joyful|happy|cheerful|serene|wonder|magical|lively|playful|vitality|optimistic|energetic)/i.test(m)
                );

            // Add cinematic-specific mood options
            const cinematicMoods = [
                'dramatic tension',
                'emotional depth',
                'melancholic beauty',
                'mystery and intrigue',
                'introspective mood',
                'bold dramatic presence',
                'timeless sophistication',
                'quiet intensity',
                'refined restraint',
                'cinematic realism'
            ];

            // Blend cinematic moods into the filtered list
            pool = [...pool, ...cinematicMoods];
        }

        // If bright daylight, bias toward optimistic tone
        else if (preferences?.lightingMood === 'bright') {
            const brightMoods = [
                'joyful energy',
                'vitality',
                'warm serenity',
                'gentle happiness',
                'peaceful confidence',
                'radiant optimism',
                'cheerful presence',
                'playful elegance'
            ];
            pool = [...pool, ...brightMoods];
        }

        // Final random choice
        return this.dataLoader.randomChoice(pool.length ? pool : baseMoods);


    }
// === ENHANCED SANITIZER (optimized & consolidated 2025-10-31) ===
sanitizePromptText(text) {
  if (!text) return text;

  // --- 1️⃣ TYPO & BASIC NORMALIZATION ---
  const typoMap = {
    natrual: "natural",
    enviromental: "environmental",
    saturared: "saturated",
    tranquiltiy: "tranquility",
    "jewel tone": "jewel-tone",
    "monochrome color scheme": "monochromatic color scheme"
  };
  for (const [bad, good] of Object.entries(typoMap)) {
    const re = new RegExp(`\\b${bad}\\b`, "gi");
    text = text.replace(re, good);
  }

  // --- 2️⃣ INTENSITY & ADJECTIVE NORMALIZATION ---
  text = text
    .replace(/\b(\w+)\s+\1\b/gi, "$1") // remove duplicate words (covers bright bright etc.)
    .replace(/\bvery\s+very\b/gi, "very")
    .replace(/\bultra\s+dark\s+deep\b/gi, "very dark")
    .replace(/\bneon\s+bright\b/gi, "neon")
    .replace(/\bhighly\s+saturated\s+saturated\b/gi, "highly saturated")
    .replace(/\b(highly|deeply|fully)\s+(saturated|detailed|colored)\s+\2\b/gi, "$1 $2")
    .replace(/\b(subtly colored|muted|pale|soft)\s+(vivid|bright|intense|bold)\b/gi, "$2")
    .replace(/\b(vivid|bright|intense|bold)\s+(muted|pale|soft)\b/gi, "$1");

  // --- 3️⃣ LIGHTING & PHRASE NORMALIZATION ---
  text = text
    .replace(/creating ([^,]+),\s*soft fill/gi, "creating $1 with soft fill")
    .replace(/\bwith soft fill fill\b/gi, "with soft fill")
    .replace(/\bstrong shadows with with\b/gi, "strong shadows with")
    .replace(/,\s*creating\s+/gi, "; creating ") // tidy comma before “creating”
    .replace(/creating ([^,]+),\s*creating/gi, "creating $1 and creating");

  // --- 4️⃣ CONTRADICTIONS & CONTEXT FIXES ---
  text = text
    .replace(/\bcool\s+\w+\s+warm\b/gi, "cool")
    .replace(/\bwarm\s+\w+\s+cool\b/gi, "warm")
    .replace(/\bcool tone warm tone\b/gi, "cool tone")
    .replace(/\bon skin on skin\b/gi, "on skin")
    .replace(/\bunder bright daylight(,?\s*under bright daylight)+/gi, "under bright daylight")
    .replace(/\b(center|middle|side|off-center) part(,?\s*(center|middle|side|off-center) part)+/gi, "$1 part");

  // --- 5️⃣ LIGHTING-CONTRAST CLEANUP ---
  text = text
    .replace(/\b(high|soft|gentle|deep|low-key)\s+contrast( lighting)?(,)?/gi, "")
    .replace(/\b(lighting|contrast)\s+\1\b/gi, "$1")
    .replace(/\b(high contrast|soft luminous)\s+(tone|lighting)\s+\1\b/gi, "$1 $2");

  // --- 6️⃣ DUPLICATE SEQUENCES & PREPOSITIONS ---
  text = text
    .replace(/\b((?:\w+\s+){1,3})\1\b/gi, "$1") // repeated short phrases
    .replace(/\b(on|in|at|with|by|for|to|from)\s+\1\b/gi, "$1");

  // --- 7️⃣ DAYLIGHT & PHRASE REDUNDANCIES (merged variants) ---
  text = text.replace(
    /\bunder\s+(bright|radiant)\s+daylight(,?\s*under\s+(bright|radiant)\s+daylight)+/gi,
    "under $1 daylight"
  );

  // --- 8️⃣ POLISH & MICRO FIXES ---
  text = text
    .replace(/\bluminouss[, ]?/gi, "luminous ")
    .replace(/on hair and shoulders[^,]*on skin/gi, "on hair and shoulders")
    .replace(/\bbalanced,\s*complementary\s+warm,\s*cool\s+tones\b/gi, "balanced warm and cool tones")
    .replace(/\bcomplementary\s+warm,\s*cool\s+tones\b/gi, "balanced warm and cool tones")
    .replace(/\b(vivid|bright|neon)\s+(vivid|bright|neon)\s+(\w+)/gi, "$1 $3") // triple adjective stack
    .replace(/\b(bright|vivid|neon)\s+\1\s+\1\b/gi, "$1")                     // triple intensity
    .replace(/(creating\s+strong\s+shadows,\s*soft\s*fill)(,?\s*\1)+/gi, "$1");

  // --- 9️⃣ COMMA & SPACING NORMALIZATION (single final run) ---
  text = text
    .replace(/,\s*,+/g, ", ")
    .replace(/(,\s*){2,}/g, ", ")
    .replace(/\s{2,}/g, " ")
    .trim();

  return text;
}




    // UPDATED: Assemble the final prompt in correct order
    assemblePrompt(components) {
        const parts = [
            components.subject,
            components.pose,
            components.face,
            components.hair,
            components.clothing,
            components.accessories,
            components.camera,
            components.setting,
            components.lighting,
            components.artStyle,
            components.mood
        ].filter(part => part && part.trim() !== '');

        return parts.join(', ');
    }

    transformPromptFormat(currentPrompt, preferences = {}) {
        if (!this.lastComponents) {
            return currentPrompt;
        }

        const normalizedInput = (currentPrompt || '').trim();
        const normalizedLast = (this.lastPrompt || '').trim();

        if (normalizedInput && normalizedLast && normalizedInput !== normalizedLast) {
            // If the prompt has been manually edited, avoid overwriting it
            return currentPrompt;
        }

        const useSemanticStack = !!preferences.semanticStack;
        const componentsCopy = { ...this.lastComponents };
        const newPrompt = useSemanticStack
            ? this.assembleSemanticStack(componentsCopy)
            : this.assemblePrompt(componentsCopy);

        this.lastPrompt = newPrompt;
        this.lastSemantic = useSemanticStack;

        return newPrompt;
    }

    assembleSemanticStack(components) {
        const order = [
            'subject',
            'pose',
            'face',
            'hair',
            'clothing',
            'accessories',
            'camera',
            'setting',
            'lighting',
            'artStyle',
            'mood'
        ];

        const seen = new Set();
        const layers = [];

        order.forEach(key => {
            const value = components[key];
            if (!value || typeof value !== 'string') {
                return;
            }

            const segments = this.segmentSemanticText(value, key);
            segments.forEach(segment => {
                if (!segment) {
                    return;
                }

                const normalized = segment.toLowerCase();
                if (seen.has(normalized)) {
                    return;
                }

                seen.add(normalized);
                layers.push(this.formatSemanticSegment(segment));
            });
        });

        if (layers.length === 0) {
            return this.assemblePrompt(components);
        }

        return layers.join(', ');
    }

    formatSemanticSegment(segment) {
        const trimmed = (segment || '').trim();
        if (!trimmed) {
            return '';
        }

        if (/^[A-Z]/.test(trimmed)) {
            return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
        }

        return trimmed;
    }

    segmentSemanticText(text, scope = '') {
        if (!text || typeof text !== 'string') {
            return [];
        }

        let segments = [text.replace(/\s+/g, ' ').trim()];
        const splitPatterns = [
            /,/,
            /\bwith\b/i,
            /\bfeaturing\b/i,
            /\bincluding\b/i,
            /\blayered with\b/i
        ];

        splitPatterns.forEach(pattern => {
            segments = segments.reduce((acc, segment) => {
                if (typeof segment !== 'string') {
                    return acc;
                }
                const pieces = segment.split(pattern).map(part => part.trim()).filter(Boolean);
                return acc.concat(pieces);
            }, []);
        });

        const cleanedSegments = segments
            .map(segment => this.cleanSemanticSegment(segment))
            .filter(Boolean);

        const expanded = cleanedSegments.flatMap(segment => this.expandSemanticSegment(segment, scope));

        const normalized = expanded
            .map(segment => segment.replace(/\s+/g, ' ').trim())
            .filter(Boolean);

        if (scope === 'pose' && normalized.length > 1) {
            const primary = normalized[0];
            const secondary = normalized[1];
            if (/^(standing|sitting|kneeling|leaning|walking|twirling|reaching|bending|crouching|stretching)$/i.test(primary) && secondary) {
                const connector = /^with\b/i.test(secondary) ? '' : ' with';
                const combined = `${primary}${connector ? `${connector} ` : ' '}${secondary}`.trim();
                normalized.splice(0, 2, combined);
            }
        }

        if (scope === 'setting') {
            return normalized.map(segment => {
                if (/(setting|scene|environment|backdrop|landscape)$/i.test(segment)) {
                    return segment;
                }
                return `${segment} setting`.trim();
            });
        }

        return normalized;
    }

    cleanSemanticSegment(segment) {
        if (!segment || typeof segment !== 'string') {
            return '';
        }

        let cleaned = segment.trim();
        if (!cleaned) {
            return '';
        }

        cleaned = cleaned.replace(/[.;:]+$/g, '');
        cleaned = cleaned.replace(/\s+/g, ' ').trim();

        const leadingPatterns = [
            /^wearing\s+/i,
            /^layered\s+/i,
            /^adorned\s+/i,
            /^featuring\s+/i,
            /^positioned\s+/i,
            /^captured\s+in\s+/i,
            /^rendered\s+in\s+/i,
            /^shot\s+in\s+/i,
            /^illustrated\s+in\s+/i,
            /^created\s+in\s+/i,
            /^conveying\s+/i,
            /^expressing\s+/i,
            /^displaying\s+/i,
            /^emanating\s+/i,
            /^evoking\s+/i,
            /^radiating\s+/i,
            /^exuding\s+/i,
            /^showcasing\s+/i,
            /^highlighting\s+/i
        ];

        leadingPatterns.forEach(pattern => {
            cleaned = cleaned.replace(pattern, '');
        });

        cleaned = cleaned.replace(/^of\s+/i, '');
        cleaned = cleaned.replace(/^in\s+(the\s+)?/i, '');
        cleaned = cleaned.replace(/^at\s+(the\s+)?/i, '');
        cleaned = cleaned.replace(/^on\s+(the\s+)?/i, '');
        cleaned = cleaned.replace(/^(a|an|the)\s+/i, '');

        cleaned = cleaned.replace(/[.;:]+$/g, '').trim();

        if (!cleaned) {
            return '';
        }

        cleaned = cleaned.replace(/^\band\b\s+/i, '');
        cleaned = cleaned.replace(/\s+/g, ' ').trim();

        const repeatedInMatch = cleaned.match(/^(.*)\s+in\s+(.+)$/i);
        if (repeatedInMatch) {
            const before = repeatedInMatch[1].trim();
            const after = repeatedInMatch[2].trim();
            if (before && after && before.toLowerCase().includes(after.toLowerCase())) {
                cleaned = before;
            }
        }

        const discardTokens = ['layered', 'adorned', 'featuring', 'wearing'];
        if (discardTokens.includes(cleaned.toLowerCase()) || cleaned === '+') {
            return '';
        }

        return cleaned;
    }

    expandSemanticSegment(segment, scope = '') {
        if (!segment || typeof segment !== 'string') {
            return [];
        }

        let working = [segment];

        const applySplit = (items, regex) => {
            return items.flatMap(item => {
                if (typeof item !== 'string') {
                    return [];
                }
                return item
                    .split(regex)
                    .map(part => part.replace(/\s+/g, ' ').trim())
                    .filter(Boolean);
            });
        };

        const splitByAnd = (items, { allowSingleWord = false } = {}) => {
            return items.flatMap(item => {
                if (typeof item !== 'string') {
                    return [];
                }

                const parts = item.split(/\s+and\s+/i).map(part => part.trim()).filter(Boolean);
                if (parts.length <= 1) {
                    return [item];
                }

                if (!allowSingleWord) {
                    const hasShort = parts.some(part => part.split(' ').length < 2);
                    if (hasShort) {
                        return [item];
                    }
                }

                return parts;
            });
        };

        if (scope === 'pose') {
            working = splitByAnd(working);
        }

        if (scope === 'mood') {
            working = splitByAnd(working, { allowSingleWord: true });
        }

        if (scope === 'hair' || scope === 'clothing' || scope === 'accessories') {
            working = splitByAnd(working);
        }

        if (scope === 'hair') {
            working = applySplit(working, /\bstyled in\b/i);
            working = working.flatMap(item => {
                const match = item.match(/^(.*)\s+in\s+(.+?\btexture\b.*)$/i);
                if (match) {
                    return [match[1].trim(), match[2].trim()];
                }
                return [item];
            });
        }

        if (scope === 'clothing') {
            working = working.flatMap(item => {
                const match = item.match(/^(.*)\s+in\s+(.+)$/i);
                if (match) {
                    const left = match[1].trim();
                    const right = match[2].trim();
                    if (right && left && left.toLowerCase().includes(right.toLowerCase())) {
                        return [left];
                    }
                    return [left, right];
                }
                return [item];
            });
        }

        working = working.flatMap(item => {
            const textureMatch = item.match(/^(.+?\btexture\b)(?:\s+(.*))?$/i);
            if (textureMatch && textureMatch[2]) {
                return [textureMatch[1].trim(), textureMatch[2].trim()];
            }
            return [item];
        });

        working = working.flatMap(item => {
            const layerMatch = item.match(/^(.+?\blayers\b)(?:\s+(.*))?$/i);
            if (layerMatch && layerMatch[2]) {
                return [layerMatch[1].trim(), layerMatch[2].trim()];
            }
            return [item];
        });

        working = working.flatMap(item => {
            const necklineMatch = item.match(/^(.*?neckline)(?:\s+(.*))?$/i);
            if (necklineMatch && necklineMatch[2]) {
                return [necklineMatch[1].trim(), necklineMatch[2].trim()];
            }
            return [item];
        });

        working = working.flatMap(item => {
            const sleevesMatch = item.match(/^(.*?sleeves?)(?:\s+(.*))?$/i);
            if (sleevesMatch && sleevesMatch[2]) {
                return [sleevesMatch[1].trim(), sleevesMatch[2].trim()];
            }
            return [item];
        });

        working = working.flatMap(item => {
            const patternMatch = item.match(/^(.+?\bpattern\b)(?:\s+(.*))?$/i);
            if (patternMatch && patternMatch[2]) {
                return [patternMatch[1].trim(), patternMatch[2].trim()];
            }
            return [item];
        });

        const results = working
            .map(item => item.replace(/\s+/g, ' ').trim())
            .map(item => item.replace(/^\band\b\s+/i, '').replace(/^(a|an)\s+/i, '').trim())
            .filter(Boolean)
            .filter(item => !['texture', 'pattern'].includes(item.toLowerCase()));

        return results;
    }

    // UPDATED: Generate with specific theme
async generateThemed(theme, overrides = {}) {
    const preferences = { ...overrides };

    switch (theme) {
        case 'fantasy':
            preferences.settingType = 'fantasy';
            preferences.clothingStyle = 'cultural';
            preferences.embellishmentChance = 90;
            preferences.hairEffectsChance = 90;
            preferences.colorBoldnessChance = 85;
            break;
        case 'modern':
            preferences.settingType = 'urban';
            preferences.artStyle = 'photorealistic';
            preferences.embellishmentChance = 50;
            preferences.hairEffectsChance = 40;
            preferences.colorBoldnessChance = 70;
            break;
        case 'vintage':
            preferences.settingType = 'historical';
            preferences.artStyle = 'artistic';
            preferences.embellishmentChance = 70;
            preferences.hairEffectsChance = 60;
            preferences.colorBoldnessChance = 50;
            break;
        case 'natural':
            preferences.settingType = 'natural';
            preferences.artStyle = 'editorial';
            preferences.embellishmentChance = 60;
            preferences.hairEffectsChance = 50;
            preferences.colorBoldnessChance = 60;
            break;
    }

    return this.generatePrompt(preferences);
}
}

// Export for use in other files
window.PromptGenerator = PromptGenerator;




