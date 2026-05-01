// Color Theory Dataset for Outfit Matching
// This dataset helps match clothing items based on color harmony principles

export const COLOR_HARMONY_RULES = {
    // Complementary colors (opposite on color wheel) - creates high contrast, vibrant looks
    complementary: {
        red: ['green', 'teal', 'mint'],
        blue: ['orange', 'coral', 'peach'],
        yellow: ['purple', 'violet', 'lavender'],
        green: ['red', 'pink', 'magenta'],
        orange: ['blue', 'navy', 'cobalt'],
        purple: ['yellow', 'gold', 'mustard'],
    },

    // Analogous colors (adjacent on color wheel) - creates harmonious, cohesive looks
    analogous: {
        red: ['orange', 'pink', 'burgundy'],
        blue: ['teal', 'purple', 'navy'],
        yellow: ['orange', 'lime', 'gold'],
        green: ['teal', 'lime', 'olive'],
        orange: ['red', 'yellow', 'coral'],
        purple: ['blue', 'pink', 'magenta'],
    },

    // Triadic colors (evenly spaced on color wheel) - creates balanced, vibrant looks
    triadic: {
        red: ['blue', 'yellow'],
        blue: ['red', 'yellow'],
        yellow: ['red', 'blue'],
        green: ['orange', 'purple'],
        orange: ['green', 'purple'],
        purple: ['green', 'orange'],
    },
};

// Neutral colors that work with everything
export const NEUTRALS = {
    colors: ['black', 'white', 'gray', 'beige', 'cream', 'tan', 'brown', 'navy'],
    description: 'Universal colors that pair well with any other color',
};

// Seasonal color palettes
export const SEASONAL_PALETTES = {
    spring: {
        colors: ['coral', 'peach', 'mint', 'lavender', 'sky blue', 'butter yellow', 'soft pink'],
        characteristics: 'Light, warm, and fresh colors',
    },
    summer: {
        colors: ['navy', 'white', 'bright yellow', 'turquoise', 'hot pink', 'lime green', 'orange'],
        characteristics: 'Bright, vibrant, and energetic colors',
    },
    fall: {
        colors: ['burgundy', 'mustard', 'olive', 'rust', 'brown', 'burnt orange', 'deep purple'],
        characteristics: 'Warm, rich, and earthy colors',
    },
    winter: {
        colors: ['black', 'charcoal', 'burgundy', 'forest green', 'navy', 'deep purple', 'silver'],
        characteristics: 'Deep, cool, and sophisticated colors',
    },
};

// Occasion-based color recommendations
export const OCCASION_COLORS = {
    casual: {
        recommended: ['denim blue', 'white', 'gray', 'olive', 'tan', 'navy'],
        avoid: ['neon colors', 'metallic'],
    },
    work: {
        recommended: ['navy', 'black', 'gray', 'white', 'burgundy', 'forest green'],
        avoid: ['bright pink', 'neon', 'overly bright colors'],
    },
    date: {
        recommended: ['burgundy', 'deep blue', 'black', 'emerald', 'blush pink', 'wine'],
        avoid: ['brown', 'mustard'],
    },
    formal: {
        recommended: ['black', 'navy', 'charcoal', 'burgundy', 'emerald', 'sapphire'],
        avoid: ['bright colors', 'pastels'],
    },
    party: {
        recommended: ['metallics', 'jewel tones', 'black', 'red', 'gold', 'silver'],
        avoid: ['beige', 'tan', 'muted colors'],
    },
    gym: {
        recommended: ['black', 'gray', 'navy', 'bright accent colors'],
        avoid: ['white (shows sweat)', 'light pastels'],
    },
    beach: {
        recommended: ['white', 'turquoise', 'coral', 'navy', 'bright colors'],
        avoid: ['dark heavy colors', 'black'],
    },
    outdoor: {
        recommended: ['olive', 'tan', 'brown', 'forest green', 'khaki'],
        avoid: ['white (gets dirty)', 'bright neon'],
    },
};

// Skin tone color matching
export const SKIN_TONE_COLORS = {
    fair: {
        best: ['navy', 'burgundy', 'emerald', 'royal blue', 'soft pink', 'lavender'],
        avoid: ['pale yellow', 'beige', 'washed out pastels'],
    },
    light: {
        best: ['coral', 'teal', 'purple', 'forest green', 'warm reds'],
        avoid: ['very dark colors that create harsh contrast'],
    },
    medium: {
        best: ['most colors work well', 'jewel tones', 'earth tones', 'bright colors'],
        avoid: ['colors too close to skin tone'],
    },
    olive: {
        best: ['warm colors', 'orange', 'red', 'gold', 'olive green', 'brown'],
        avoid: ['cool pastels', 'icy colors'],
    },
    tan: {
        best: ['white', 'coral', 'turquoise', 'yellow', 'bright colors'],
        avoid: ['muddy browns', 'dull colors'],
    },
    deep: {
        best: ['bright colors', 'jewel tones', 'white', 'metallics', 'pastels'],
        avoid: ['very dark colors that blend with skin'],
    },
};

// Color combination patterns for complete outfits
export const OUTFIT_PATTERNS = {
    monochromatic: {
        description: 'Different shades of the same color',
        example: 'Light blue shirt + Navy pants + Dark blue shoes',
        style: 'Sophisticated, elongating',
    },
    neutral: {
        description: 'All neutral colors',
        example: 'White shirt + Beige pants + Brown shoes',
        style: 'Classic, timeless',
    },
    accent: {
        description: 'Neutral base with one pop of color',
        example: 'Black outfit + Red accessories',
        style: 'Bold, modern',
    },
    complementary: {
        description: 'Opposite colors on color wheel',
        example: 'Blue shirt + Orange accessories',
        style: 'Vibrant, eye-catching',
    },
    analogous: {
        description: 'Adjacent colors on color wheel',
        example: 'Blue shirt + Purple pants + Teal accessories',
        style: 'Harmonious, cohesive',
    },
};

// Color psychology for different moods
export const COLOR_PSYCHOLOGY = {
    confident: ['red', 'black', 'navy', 'burgundy'],
    approachable: ['blue', 'green', 'soft pink', 'lavender'],
    creative: ['purple', 'orange', 'teal', 'yellow'],
    professional: ['navy', 'gray', 'black', 'white'],
    energetic: ['bright red', 'orange', 'yellow', 'hot pink'],
    calm: ['blue', 'green', 'lavender', 'soft gray'],
    romantic: ['pink', 'burgundy', 'deep purple', 'wine'],
    powerful: ['black', 'red', 'navy', 'charcoal'],
};

// Weather-based color recommendations
export const WEATHER_COLORS = {
    sunny: {
        recommended: ['light colors', 'white', 'pastels', 'bright colors'],
        reason: 'Reflects heat, stays cool',
    },
    cloudy: {
        recommended: ['any colors work', 'bright colors add energy'],
        reason: 'No heat concerns',
    },
    rainy: {
        recommended: ['dark colors', 'navy', 'black', 'forest green'],
        reason: 'Hides water spots and mud',
    },
    snowy: {
        recommended: ['dark colors', 'jewel tones', 'bright colors'],
        reason: 'Stands out against white background',
    },
    hot: {
        recommended: ['white', 'light colors', 'pastels'],
        reason: 'Reflects sunlight, keeps cool',
    },
    cold: {
        recommended: ['dark colors', 'rich tones', 'layering colors'],
        reason: 'Absorbs heat, looks cozy',
    },
};

// Helper function to get color recommendations
export const getColorRecommendations = (params) => {
    const {
        occasion = 'casual',
        weather = null,
        mood = null,
        season = null,
        baseColor = null,
    } = params;

    const recommendations = {
        primary: [],
        accent: [],
        avoid: [],
        pattern: null,
    };

    // Get occasion-based colors
    if (OCCASION_COLORS[occasion]) {
        recommendations.primary.push(...OCCASION_COLORS[occasion].recommended);
        recommendations.avoid.push(...OCCASION_COLORS[occasion].avoid);
    }

    // Add weather considerations
    if (weather && WEATHER_COLORS[weather]) {
        recommendations.primary.push(...WEATHER_COLORS[weather].recommended);
    }

    // Add mood colors
    if (mood && COLOR_PSYCHOLOGY[mood]) {
        recommendations.accent.push(...COLOR_PSYCHOLOGY[mood]);
    }

    // Add seasonal colors
    if (season && SEASONAL_PALETTES[season]) {
        recommendations.accent.push(...SEASONAL_PALETTES[season].colors);
    }

    // If base color is provided, suggest harmonious colors
    if (baseColor && COLOR_HARMONY_RULES.analogous[baseColor]) {
        recommendations.accent.push(...COLOR_HARMONY_RULES.analogous[baseColor]);
    }

    // Remove duplicates
    recommendations.primary = [...new Set(recommendations.primary)];
    recommendations.accent = [...new Set(recommendations.accent)];
    recommendations.avoid = [...new Set(recommendations.avoid)];

    return recommendations;
};

// Export all datasets
export default {
    COLOR_HARMONY_RULES,
    NEUTRALS,
    SEASONAL_PALETTES,
    OCCASION_COLORS,
    SKIN_TONE_COLORS,
    OUTFIT_PATTERNS,
    COLOR_PSYCHOLOGY,
    WEATHER_COLORS,
    getColorRecommendations,
};
