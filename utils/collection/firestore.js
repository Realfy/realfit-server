export const fireStoreCollections = {
    userData: {
        title: 'user_data', // A part of sub-collections there will be one filed i.e., `email`
        subCollections: {
            profile: {
                title: 'profile',
            },
            preferences: { // Here in both the sub-collections there will be only one doc with ID as `data` which contain its respective user preferences
                diet: { title: 'diet' },
                exercise: { title: 'exercise' },
            },
            diet: {
                everyDayPlan: { title: 'daily_plan' }, // This collection stores every day diet plan of user.
                dietTemplate: {title: 'template'} // This collection stores the base template of diet plan that can be suggested by an AI or by an expert.
            }
        }
    }
}