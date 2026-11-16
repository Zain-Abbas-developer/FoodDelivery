
const { parsePhoneNumberFromString } = require('libphonenumber-js');

const normalizePhoneNumber = (phone, country = 'PK') => {
  if (!phone || typeof phone !== 'string') {
    throw new Error('Phone number is required');
  }

  const parsed = parsePhoneNumberFromString(
    phone.trim(),
    country.toUpperCase()
  );

  if (!parsed || !parsed.isValid()) {
    throw new Error('Please enter a valid phone number');
  }

  return parsed.number;
};

module.exports = { normalizePhoneNumber };
