const messages = {
  en: {
    balanceNotification: (customerName, amount) =>
      `Hi ${customerName}, you have an outstanding balance of ₹${amount} in your account. Please settle the payment at your earliest convenience.`,
    lowBalanceWarning: (customerName, amount) =>
      `Dear ${customerName}, your account balance is ₹${amount}. Please pay soon.`,
  },
  hi: {
    balanceNotification: (customerName, amount) =>
      `नमस्ते ${customerName}, आपके खाते में ₹${amount} की बकाया राशि है। कृपया जल्द से जल्द भुगतान करें।`,
    lowBalanceWarning: (customerName, amount) =>
      `प्रिय ${customerName}, आपके खाते में ₹${amount} की राशि है। कृपया जल्द भुगतान करें।`,
  },
};

export const getSMSMessage = (language, type, ...args) => {
  const lang = language === 'hi' ? 'hi' : 'en';
  const messageFunc = messages[lang][type];
  return messageFunc ? messageFunc(...args) : '';
};
