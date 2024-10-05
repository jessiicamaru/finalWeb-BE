import crypto from 'crypto';
import 'dotenv/config';

const JWTSecretKey = process.env.JWT_SECRET_KEY;
const base64url = (str) => {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
export const tokenGenerator = (payload) => {
    const header = {
        alg: 'HS256',
        typ: 'JWT',
    };
    const encodedHeader = base64url(JSON.stringify(header));
    const encodedPayload = base64url(JSON.stringify(payload));
    const tokenData = `${encodedHeader}.${encodedPayload}`;
    const hmac = crypto.createHmac('sha256', JWTSecretKey);
    const signature = hmac.update(tokenData).digest('base64url');
    return `${tokenData}.${signature}`;
};
