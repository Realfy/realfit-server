import db from "../../config/firestoreConfig.js";
import { fireStoreCollections } from '../../utils/collection/firestore.js';

export async function updateUserProfileDetails(req, res) {
    try {
        let user_id = req.payload.userId;
        if (!isNaN(user_id))
            user_id = "" + user_id;
        const { gender, age, height, goal, target_weight, current_weight, medical } = req.body;
        if (!user_id || user_id.length == 0)
            return res.status(400).json({ code: 0, message: "Please provide valid user id" });
        const userRef = db.collection(fireStoreCollections.userData.title).doc(user_id);
        const user_data = {};
        if (gender) user_data.gender = gender;
        if (age) user_data.age = age;
        if (height) user_data.height = height;
        if (goal) user_data.goal = goal;
        if (target_weight) user_data.target_weight = target_weight;
        if (current_weight) user_data.current_weight = current_weight;
        if (medical) user_data.medical = medical;
        await userRef
            .collection(fireStoreCollections.userData.subCollections.profile.title).doc(user_id + "_profile")
            .set(user_data, { merge: true });
        return res.status(200).json({code: 1, message: "User profile details saved successfully."});
    }
    catch (err) {
        console.log("Caught exception in controller.user_profile.updateUserProfileDetails() due to");
        console.log(err);
        return res.status(500).json({code: -1, message: "Failed to save user profile details."})
    }
}