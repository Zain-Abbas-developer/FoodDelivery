
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client =
  accountSid && authToken
    ? twilio(accountSid, authToken)
    : null;

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = async (phone, code) => {
  try {
    if (!client || !phoneNumber) {
      throw new Error('Twilio environment variables are missing');
    }

    const message = await client.messages.create({
      body: `Your Food Delivery App verification code is: ${code}. Valid for 10 minutes.`,
      from: phoneNumber,
      to: phone
    });

    console.log('OTP SMS sent:', {
      sid: message.sid,
      status: message.status
    });

    return true;

  } catch (error) {
    console.error('Twilio SMS Error:', {
      message: error.message,
      code: error.code,
      status: error.status
    });

    return false;
  }
};

module.exports = { generateOTP, sendOTP };
