const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Generate access token
const generateAccessToken = (userId, role) => {
  return generateToken({
    userId,
    role,
    type: 'access'
  });
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return generateToken({
    userId,
    type: 'refresh'
  });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Extract token from request headers
const extractTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

// Create token response object
const createTokenResponse = (user) => {
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);
  
  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    user: user.getPublicProfile()
  };
};

module.exports = {
  generateToken,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  extractTokenFromHeader,
  createTokenResponse
};