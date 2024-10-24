export function validateDietPlanItem(plan) {
    const allowedMealTypes = ['breakfast', 'lunch', 'snacks', 'dinner', 'pre-workout', 'post-workout'];

    for (let i = 0; i < plan.length; i++) {
        const item = plan[i];

        // Check if the object has all required fields
        if (!item.id || !item.title || item.quantity_taken === undefined || item.calories === undefined || !item.meal_type) {
            return {
                code: 0,
                message: `Missing fields in diet plan at index ${i}`
            };
        }

        // Validate types of the fields
        if (typeof item.id !== 'string' ||
            typeof item.title !== 'string' ||
            typeof item.quantity_taken !== 'number' ||
            typeof item.calories !== 'number' ||
            typeof item.meal_type !== 'string') {
            return {
                code: 0,
                message: `Invalid data type in diet plan at index ${i}`
            };
        }

        item.quantity_taken = item.quantity_taken + " grams"
        item.calories = item.calories + " Kcal"

        // Validate meal_type
        if (!allowedMealTypes.includes(item.meal_type)) {
            return {
                code: 0,
                message: `Invalid meal type at index ${i}, must be one of ${allowedMealTypes.join(', ')}`
            };
        }
    }
    return { code: 1, message: 'All the diet items are validated.' }
}


// TODO: If need provide enum type for cuisine to maintain consistency.
export function validateDietPreferencesObject(preferences) {
    const DIETARY_TYPE = ['vegan', 'vegetarian', 'paleo', 'keto', 'no preference'];
    let { dietaryType, allergies, cuisine } = preferences;

    if (typeof dietaryType === 'string')
        dietaryType = dietaryType.toLowerCase();
    if (dietaryType && !DIETARY_TYPE.includes(dietaryType)) {
        return { code: 0, message: 'Invalid dietary type. Must be one of: ' + DIETARY_TYPE.join(', ') };
    }
    // Validate allergies (should be an array of strings)
    if (allergies && (!Array.isArray(allergies) || !allergies.every(item => typeof item === 'string'))) {
        return { code: 0, message: 'Allergies must be an array of strings' };
    }
    // Validate cuisine that user prefer (should be an array of strings)
    if (cuisine && (!Array.isArray(cuisine) || !cuisine.every(item => typeof item === 'string'))) {
        return { code: 0, message: 'Cuisine must be an array of strings' };
    }
    return { code: 1, message: 'Preferences are validated successfully.' }
}