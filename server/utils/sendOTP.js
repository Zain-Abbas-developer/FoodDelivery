const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = async (phone, code) => {
  try {
    // In production, use Twilio to send SMS
    // For development, we'll just log it
    if (process.env.NODE_ENV === 'production' && accountSid && authToken) {
      await client.messages.create({
        body: `Your Food Delivery App verification code is: ${code}. Valid for 10 minutes.`,
        from: phoneNumber,
        to: phone
      });
    } else {
      console.log(`OTP for ${phone}: ${code}`);
    }
    return true;
  } catch (error) {
    console.error('Error sending OTP:', error);
    return false;
  }
};

module.exports = { generateOTP, sendOTP };

