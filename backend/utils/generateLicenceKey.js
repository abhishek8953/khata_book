import crypto from "crypto";
import LicenseKey from "../models/LicenceKey.js";

// Generate random license key string
export function generateLicenseKey() {
	// Format: LIC-XXXX-XXXX-XXXX
	const rawKey = crypto.randomBytes(8).toString("hex").toUpperCase();
	return `LIC-${rawKey.slice(0, 4)}-${rawKey.slice(4, 8)}-${rawKey.slice(
		8,
		12
	)}`;
}

// Hash key for storage
export function hashKey(key) {
	return crypto.createHash("sha256").update(key).digest("hex");
}

// Create and save a license key in DB
export async function createLicenseKey(expireDays) {
	const key = generateLicenseKey();
	const keyHash = hashKey(key);
	let license = null;
	if (expireDays) {
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + expireDays);
		license = new LicenseKey({ keyHash, expiresAt });
	}

	license = new LicenseKey({ keyHash });
	await license.save();

	return key; // Give this key to seller
}
