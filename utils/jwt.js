import jwt from "jsonwebtoken";

export const verifyJWT = (req, res, next) => {
    const token = req.header("Authorization");

    // Check if the token is present and starts with "Bearer "
    if (!token || !token.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
        // Remove "Bearer " from the token
        const jwtToken = token.slice(7);
        // Verify the JWT token
        const decoded = jwt.verify(jwtToken, process.env.JWT_ACCESS_TOKEN_SECRET);

        // Attach the decoded user to the request object
        req.user = decoded;
        // Inside verifyJWT middleware
console.log("Decoded user in middleware:", req.user);  // Ensure userId exists

        next();
    } catch (err) {
        res.status(401).json({ message: "Token is not valid" });
    }
};
