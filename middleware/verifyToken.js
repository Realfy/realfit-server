import { getRefreshTokenFromCookie } from "../utils/cookies/cookieUtils.js";
import jsonwebtoken from 'jsonwebtoken';
import { JWT_REFRESH_TOKEN_SECRET, JWT_ACCESS_TOKEN_SECRET } from '../envConfig.js';

export async function verifyToken(req, res, next) {
    const { verify, sign } = jsonwebtoken;
    let token = req.headers["authorization"];
    if (!token || token.length <= 7 || !token.startsWith("Bearer")) {  // Bearer TOKEN
        return res.status(401).json({ code: -2, message: "Access denied. No token provided." });
    }
    try {
        token = token.substring('7');
        if (token.length == 0) {  // TOKEN
            return res.status(401).json({ code: -1, message: "Access denied. No token provided." });
        }
        verify(token, JWT_ACCESS_TOKEN_SECRET, async (err, payload) => {
            if (err) {
                const refresh_token = getRefreshTokenFromCookie(req);
                if (!refresh_token || refresh_token.length == 0) {
                    return res.status(401).json({ code: -2, message: "Invalid token." });
                }
                verify(refresh_token, JWT_REFRESH_TOKEN_SECRET, async (error, decoded) => {
                    if (error) {
                        return res.status(401).json({ code: -2, message: "Invalid token." });
                    }
                    const { userId, email } = decoded;
                    const new_access_token = sign({userId, email}, JWT_ACCESS_TOKEN_SECRET, {
                        expiresIn: "1h"
                    });
                    req.headers["authorization"] = "Bearer " + new_access_token;
                    res.setHeader('x-access-token', "Bearer " + new_access_token); // else send it in Http-Only cookie
                    req.payload = {userId, email};
                    next();
                });
            } else {
                const { email, userId } = payload;
                req.payload = {email, userId};
                next();
            }
        });
    } catch (error) {
        return res.status(500).json({ code: -2, message: "Invalid token." });
    }
}