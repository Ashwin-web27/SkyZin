const crypto = require('crypto');

/**
 * Generate a unique device fingerprint based on browser/device characteristics
 * @param {Object} deviceInfo - Device information from client
 * @returns {String} - Unique device fingerprint
 */
function generateDeviceFingerprint(deviceInfo) {
  // Combine various device characteristics to create a unique fingerprint
  const fingerprint = [
    deviceInfo.userAgent || '',
    deviceInfo.platform || '',
    deviceInfo.browser || '',
    deviceInfo.screenResolution || '',
    deviceInfo.timezone || '',
    deviceInfo.language || '',
    deviceInfo.colorDepth || '',
    deviceInfo.hardwareConcurrency || '',
    deviceInfo.maxTouchPoints || '',
    deviceInfo.webgl || '',
    deviceInfo.canvas || ''
  ].join('|');

  // Create a hash from the combined fingerprint
  return crypto.createHash('sha256').update(fingerprint).digest('hex');
}

/**
 * Extract device information from request headers
 * @param {Object} req - Express request object
 * @returns {Object} - Extracted device information
 */
function extractDeviceInfo(req) {
  const userAgent = req.headers['user-agent'] || '';
  
  // Parse user agent for browser and platform info
  const browserInfo = parseUserAgent(userAgent);
  
  return {
    userAgent: userAgent,
    platform: browserInfo.platform,
    browser: browserInfo.browser,
    ipAddress: getClientIP(req),
    // Additional fields will be provided by client-side fingerprinting
    screenResolution: req.body.deviceInfo?.screenResolution || '',
    timezone: req.body.deviceInfo?.timezone || '',
    language: req.body.deviceInfo?.language || '',
    colorDepth: req.body.deviceInfo?.colorDepth || '',
    hardwareConcurrency: req.body.deviceInfo?.hardwareConcurrency || '',
    maxTouchPoints: req.body.deviceInfo?.maxTouchPoints || '',
    webgl: req.body.deviceInfo?.webgl || '',
    canvas: req.body.deviceInfo?.canvas || ''
  };
}

/**
 * Simple user agent parser
 * @param {String} userAgent - User agent string
 * @returns {Object} - Parsed browser and platform information
 */
function parseUserAgent(userAgent) {
  const ua = userAgent.toLowerCase();
  
  // Detect browser
  let browser = 'unknown';
  if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'chrome';
  } else if (ua.includes('firefox')) {
    browser = 'firefox';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'safari';
  } else if (ua.includes('edg')) {
    browser = 'edge';
  } else if (ua.includes('opera')) {
    browser = 'opera';
  }
  
  // Detect platform
  let platform = 'unknown';
  if (ua.includes('windows')) {
    platform = 'windows';
  } else if (ua.includes('mac')) {
    platform = 'macos';
  } else if (ua.includes('linux')) {
    platform = 'linux';
  } else if (ua.includes('android')) {
    platform = 'android';
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    platform = 'ios';
  }
  
  return { browser, platform };
}

/**
 * Get client IP address from request
 * @param {Object} req - Express request object
 * @returns {String} - Client IP address
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for'] ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip ||
         '0.0.0.0';
}

/**
 * Validate device fingerprint matches current device
 * @param {String} storedFingerprint - Stored device fingerprint
 * @param {Object} currentDeviceInfo - Current device information
 * @returns {Boolean} - Whether fingerprints match
 */
function validateDeviceFingerprint(storedFingerprint, currentDeviceInfo) {
  const currentFingerprint = generateDeviceFingerprint(currentDeviceInfo);
  return storedFingerprint === currentFingerprint;
}

/**
 * Check if device info indicates a mobile device
 * @param {Object} deviceInfo - Device information
 * @returns {Boolean} - Whether device is mobile
 */
function isMobileDevice(deviceInfo) {
  const userAgent = (deviceInfo.userAgent || '').toLowerCase();
  const platform = (deviceInfo.platform || '').toLowerCase();
  
  return platform.includes('android') || 
         platform.includes('ios') ||
         userAgent.includes('mobile') ||
         userAgent.includes('android') ||
         userAgent.includes('iphone') ||
         userAgent.includes('ipad') ||
         userAgent.includes('ipod');
}

/**
 * Get device type string
 * @param {Object} deviceInfo - Device information
 * @returns {String} - Device type (desktop, mobile, tablet)
 */
function getDeviceType(deviceInfo) {
  const userAgent = (deviceInfo.userAgent || '').toLowerCase();
  
  if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
    return 'tablet';
  } else if (isMobileDevice(deviceInfo)) {
    return 'mobile';
  } else {
    return 'desktop';
  }
}

/**
 * Create a readable device description
 * @param {Object} deviceInfo - Device information
 * @returns {String} - Human readable device description
 */
function getDeviceDescription(deviceInfo) {
  const browser = deviceInfo.browser || 'Unknown Browser';
  const platform = deviceInfo.platform || 'Unknown Platform';
  const deviceType = getDeviceType(deviceInfo);
  
  return `${browser.charAt(0).toUpperCase() + browser.slice(1)} on ${platform.charAt(0).toUpperCase() + platform.slice(1)} (${deviceType})`;
}

module.exports = {
  generateDeviceFingerprint,
  extractDeviceInfo,
  parseUserAgent,
  getClientIP,
  validateDeviceFingerprint,
  isMobileDevice,
  getDeviceType,
  getDeviceDescription
};