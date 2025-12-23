import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !REFRESH_SECRET) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be defined in .env');
}

const generateAccessToken = (sellerId) => {
  return jwt.sign({ id: sellerId, type: 'access' }, JWT_SECRET, {
    expiresIn: '90d',
    algorithm: 'HS256',
  });
};

const generateRefreshToken = (sellerId) => {
  return jwt.sign({ id: sellerId, type: 'refresh' }, REFRESH_SECRET, {
    expiresIn: '90d',
    algorithm: 'HS256',
  });
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  } catch (error) {
    return null;
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_SECRET, { algorithms: ['HS256'] });
  } catch (error) {
    return null;
  }
};

export { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken };
