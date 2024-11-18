import crypto from 'crypto';
import 'dotenv/config';

export const checkCookie = (cookie) => {
    let jwtKey = process.env.JWT_SECRET_KEY;
    if (!cookie) {
        return 0;
    }

    const [encodedHeader, encodedPayload, tokenSignature] = cookie.split('.');

    const tokenData = `${encodedHeader}.${encodedPayload}`;
    const hmac = crypto.createHmac('sha256', jwtKey);
    const signature = hmac.update(tokenData).digest('base64url');

    console.log({
        tokenSignature,
        signature,
        status: tokenSignature !== signature,
    });

    if (tokenSignature === signature) {
        return 1;
    } else {
        return 0;
    }
};
