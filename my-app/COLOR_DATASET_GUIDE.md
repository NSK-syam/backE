# Color Grading Dataset Documentation

This dataset provides comprehensive color theory rules and recommendations for outfit matching.

## 📚 What's Included

### 1. **Color Harmony Rules**
Based on color wheel theory:
- **Complementary**: Opposite colors (high contrast) - e.g., Blue + Orange
- **Analogous**: Adjacent colors (harmonious) - e.g., Blue + Purple + Teal
- **Triadic**: Evenly spaced colors (balanced) - e.g., Red + Blue + Yellow

### 2. **Seasonal Palettes**
- **Spring**: Coral, peach, mint, lavender (light & fresh)
- **Summer**: Navy, bright yellow, turquoise (vibrant)
- **Fall**: Burgundy, mustard, olive (warm & earthy)
- **Winter**: Black, charcoal, burgundy (deep & sophisticated)

### 3. **Occasion-Based Colors**
Recommendations for:
- Casual, Work, Date Night, Formal, Party, Gym, Beach, Outdoor

### 4. **Skin Tone Matching**
Best colors for: Fair, Light, Medium, Olive, Tan, Deep skin tones

### 5. **Weather-Based Colors**
Recommendations based on: Sunny, Cloudy, Rainy, Snowy, Hot, Cold

### 6. **Color Psychology**
Colors for moods: Confident, Approachable, Creative, Professional, Energetic, Calm, Romantic, Powerful

### 7. **Outfit Patterns**
- Monochromatic (same color, different shades)
- Neutral (all neutrals)
- Accent (neutral + pop of color)
- Complementary (opposite colors)
- Analogous (adjacent colors)

## 🎯 How to Use in Your App

### Basic Usage

\`\`\`javascript
import colorDataset, { getColorRecommendations } from './colorDataset';

// Get recommendations based on occasion and weather
const recommendations = getColorRecommendations({
  occasion: 'work',
  weather: 'rainy',
  mood: 'confident',
  season: 'fall',
  baseColor: 'blue'
});

console.log(recommendations);
// {
//   primary: ['navy', 'black', 'gray', 'white', 'burgundy', ...],
//   accent: ['red', 'burgundy', 'mustard', 'purple', ...],
//   avoid: ['bright pink', 'neon', ...],
//   pattern: null
// }
\`\`\`

### Integration with AI Outfit Generator

You can enhance your AI prompts with this data:

\`\`\`javascript
const generateOutfitWithColorTheory = async () => {
  const colorRecs = getColorRecommendations({
    occasion: selectedOccasion,
    weather: weather?.condition.toLowerCase(),
    season: getCurrentSeason(),
  });

  const prompt = \`You are a professional fashion stylist AI.
  
WEATHER: \${weather?.condition}, \${weather?.temp}°F
OCCASION: \${selectedOccasion}
LOCATION: \${location}

COLOR RECOMMENDATIONS:
- Recommended colors: \${colorRecs.primary.join(', ')}
- Accent colors: \${colorRecs.accent.join(', ')}
- Colors to avoid: \${colorRecs.avoid.join(', ')}

USER'S CLOSET ITEMS:
\${closetSummary}

Please suggest a complete outfit that follows color theory principles...\`;
};
\`\`\`

### Check Color Harmony

\`\`\`javascript
import { COLOR_HARMONY_RULES } from './colorDataset';

// Check if two colors are complementary
const areComplementary = (color1, color2) => {
  return COLOR_HARMONY_RULES.complementary[color1]?.includes(color2);
};

// Example
areComplementary('blue', 'orange'); // true
\`\`\`

### Get Seasonal Colors

\`\`\`javascript
import { SEASONAL_PALETTES } from './colorDataset';

const getCurrentSeason = () => {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
};

const seasonalColors = SEASONAL_PALETTES[getCurrentSeason()].colors;
\`\`\`

## 💡 Example Use Cases

### 1. Smart Color Filtering
Filter closet items by colors that work well together:

\`\`\`javascript
const getMatchingItems = (baseItem) => {
  const baseColor = baseItem.color;
  const harmonious = COLOR_HARMONY_RULES.analogous[baseColor] || [];
  
  return closet.filter(item => 
    harmonious.includes(item.color) || 
    NEUTRALS.colors.includes(item.color)
  );
};
\`\`\`

### 2. Occasion-Based Suggestions
\`\`\`javascript
const suggestColorsForOccasion = (occasion) => {
  return OCCASION_COLORS[occasion]?.recommended || [];
};
\`\`\`

### 3. Weather-Appropriate Colors
\`\`\`javascript
const getWeatherColors = (weatherCondition) => {
  if (weatherCondition.includes('rain')) return WEATHER_COLORS.rainy.recommended;
  if (weatherCondition.includes('sun')) return WEATHER_COLORS.sunny.recommended;
  // ... etc
};
\`\`\`

## 🎨 Color Theory Quick Reference

### The 60-30-10 Rule
- **60%**: Dominant color (usually neutral)
- **30%**: Secondary color
- **10%**: Accent color (pop of color)

### Safe Combinations
- **Any color + Neutral** = Always works
- **Analogous colors** = Harmonious
- **Complementary colors** = Bold & vibrant
- **Monochromatic** = Sophisticated

### Colors to Avoid Together
- Red + Pink (unless intentional)
- Brown + Black (dated look)
- Navy + Black (hard to distinguish)
- Too many bright colors at once

## 📊 Data Structure

All datasets are exported as JavaScript objects that you can import and use directly in your React components.

See \`colorDataset.js\` for the complete implementation.
