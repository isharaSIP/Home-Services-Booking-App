/**
 * OTP Service for FixMate
 * Generates 6-digit OTPs, calculates expiry times, and handles dev logging.
 */

const generateOTP = () => {
  // Generate a random 6-digit number string
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getOtpExpiry = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

const logOTP = (identifier, otp, purpose = "Verification") => {
  console.log("==========================================");
  console.log(`🔑 [FIXMATE OTP SERVICE] ${purpose}`);
  console.log(`📱 User Identifier: ${identifier}`);
  console.log(`⚡ OTP Code: ${otp}`);
  console.log(`⏰ Expiration: 10 minutes`);
  console.log("==========================================");
};

module.exports = {
  generateOTP,
  getOtpExpiry,
  logOTP,
};
