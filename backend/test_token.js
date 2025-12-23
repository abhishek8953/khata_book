import { generateAccessToken, verifyAccessToken } from './utils/tokenUtils.js';

const token = generateAccessToken('test-seller-id');
console.log('Generated Token:', token);

const decoded = verifyAccessToken(token);
console.log('Decoded:', decoded);
