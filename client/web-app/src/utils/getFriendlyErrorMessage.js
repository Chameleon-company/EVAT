export function getFriendlyErrorMessage(error, fallback = 'Something went wrong.') {
  const message = typeof error === 'string'
    ? error
    : error?.message ?? fallback;
  const normalisedMessage = message.toLowerCase();

  if (normalisedMessage.includes('email') && normalisedMessage.includes('does not exist')) {
    return 'Account with the given email does not exist.';
  }

  if (normalisedMessage.includes('invalid password')) {
    return 'Incorrect password.';
  }

  if (normalisedMessage.includes('@') && normalisedMessage.includes('already exist')) {
    return 'An account with that email already exists.';
  }

  return message;
}
