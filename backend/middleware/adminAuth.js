const { authenticate, adminOnly } = require('./auth');

// Combined admin authentication middleware
const adminAuth = [authenticate, adminOnly];

module.exports = adminAuth;