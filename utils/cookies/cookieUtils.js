export function getRefreshTokenFromCookie(req) {
    const refreshToken = req.cookies['refresh'];
    if (!refreshToken)
        return null;
    return refreshToken;
}