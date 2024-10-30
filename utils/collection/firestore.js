export const fireStoreCollections = {
    userData: {
        title: 'user_data', // A part of sub-collections there will be one filed i.e., `email`
        fields: {
            email: "User email",
            coins: {
                available: "Coins available",
            }
        },
        subCollections: {
            profile: {
                title: 'profile',
            },
            coinsHistory: {
                title: 'coinsHistory',
                fields: {
                    date: "Date of purchase",
                    for: "", // Either diet(in), workout(in), chatbot(in), purchase(in), coupon(in)
                    relatedId: "", // If for diet or workout plan template id, chatbot (thread ID)
                    charge: 0, // Positive for IN and -ve for OUT
                    description: ''
                }
            },
            preferences: { // Here in both the sub-collections there will be only one doc with ID as `data` which contain its respective user preferences
                diet: { title: 'diet' },
                exercise: { title: 'exercise' },
            },
            diet: {
                everyDayPlan: { title: 'daily_plan' }, // This collection stores every day diet plan of user.
                dietTemplate: { title: 'template' } // This collection stores the base template of diet plan that can be suggested by an AI or by an expert.
            }
        }
    },
    coupons: {
        title: 'coupon',
        fields: {
            id: 'Coupon code (KEY)',
            createdBy: 'ID of the user who generated',
            createdAt: 'time stamp of created',
            expireAt: 'time stamp of expiration',
            coins: '',
            type: '', // Either referral, general (admin created code)
            limit: "", // Number of users can redeem it
            description: '',
        },
        subCollections: {
            redeemedBy: {
                title: 'redeemed_by',
                fields: {
                    id: "PK",
                    userId: "Redeemed user's id",
                    date: "Date of redeemed"
                }
            }
        }
    }
}