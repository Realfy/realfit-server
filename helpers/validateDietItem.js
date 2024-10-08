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