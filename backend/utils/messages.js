const messages = {
	en: {
		balanceNotification: (customerName, sellerName, amount) =>
			`Hi ${customerName}, this is ${sellerName}. You have an outstanding balance of ₹${amount}. Please settle the payment at your earliest convenience.`,
		lowBalanceWarning: (customerName, sellerName, amount) =>
			`Seller Name <${sellerName}> Dear ${customerName}, your account balance is ₹${amount}. Please pay soon.`,
	},
	hi: {
		balanceNotification: (customerName, sellerName, amount) =>
  `नमस्ते ${customerName}, मैं ${sellerName} बोल रहा हूँ। आपके खाते में ₹${amount} की बकाया राशि है। कृपया जल्द भुगतान करें।`,
		lowBalanceWarning: (customerName, sellerName, amount) =>
			`विक्रेता नाम <${sellerName}> नमस्ते प्रिय ${customerName}, आपके खाते में ₹${amount} की राशि है। कृपया जल्द भुगतान करें।`,
	},
};

export const getSMSMessage = (language, type, ...args) => {
	const lang = language === "hi" ? "hi" : "en";
	const messageFunc = messages[lang][type];
	return messageFunc ? messageFunc(...args) : "";
};
