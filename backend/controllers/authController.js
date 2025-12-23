import Seller from "../models/Seller.js";
import {
	generateAccessToken,
	generateRefreshToken,
	verifyRefreshToken,
} from "../utils/tokenUtils.js";
import bcryptjs from "bcryptjs";

import LicenseKey from "../models/LicenceKey.js";
import { hashKey } from "../utils/generateLicenceKey.js";

const PASSWORD_MIN_LENGTH = 8;
const validatePasswordStrength = (password) => {
	const hasUpperCase = /[A-Z]/.test(password);
	const hasLowerCase = /[a-z]/.test(password);
	const hasNumbers = /\d/.test(password);
	const hasSpecialChar = /[!@#$%^&*]/.test(password);

	if (password.length < PASSWORD_MIN_LENGTH) {
		return {
			valid: false,
			message: "Password must be at least 8 characters",
		};
	}
	if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
		return {
			valid: false,
			message: "Password must contain uppercase, lowercase, and numbers",
		};
	}
	return { valid: true };
};

export const register = async (req, res) => {
	try {
		const {
			name,
			email,
			password,
			phone,
			businessName,
			address,
			city,
			state,
			pincode,
			licenseKey,
		} = req.body;

		const keyHash = hashKey(licenseKey);
		// Validate password strength
		console.log("data", req.body);

		const license = await LicenseKey.findOne({ keyHash, isUsed: false });
		if (!license)
			return res
				.status(400)
				.json({ message: "Invalid or used license key" });

		const passwordValidation = validatePasswordStrength(password);
		if (!passwordValidation.valid) {
			return res
				.status(400)
				.json({ success: false, message: passwordValidation.message });
		}

		// Check if seller already exists
		const existingSeller = await Seller.findOne({
			$or: [{ email }, { phone }],
		});
		if (existingSeller) {
			return res.status(400).json({
				success: false,
				message: "Email or phone already registered",
			});
		}

		// Hash password with 12 rounds (more secure than 10)
		const hashedPassword = await bcryptjs.hash(password, 12);

		const newSeller = new Seller({
			name,
			email,
			password: hashedPassword,
			phone,
			businessName,
			address,
			city,
			state,
			pincode,
			licenseKey: license._id,
		});

		const seller = await newSeller.save();

		license.isUsed = true;
		license.assignedToSeller = seller._id;
		await license.save();

		const accessToken = generateAccessToken(newSeller._id);
		const refreshToken = generateRefreshToken(newSeller._id);

		res.status(201).json({
			success: true,
			message: "Registration successful",
			accessToken,
			refreshToken,
			seller: {
				id: newSeller._id,
				name: newSeller.name,
				email: newSeller.email,
				businessName: newSeller.businessName,
			},
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Registration failed",
			error: error.message,
		});
	}
};

export const login = async (req, res) => {
	try {
		const { email, password } = req.body;

		const seller = await Seller.findOne({ email }).populate("licenseKey");
		if (!seller) {
			return res
				.status(401)
				.json({ success: false, message: "Invalid email or password" });
		}

		const isPasswordValid = await bcryptjs.compare(
			password,
			seller.password
		);
		if (!isPasswordValid) {
			return res
				.status(401)
				.json({ success: false, message: "Invalid email or password" });
		}

		const license = seller.licenseKey;
        
		

		if (!license || !license.isUsed)
			return res.status(403).json({ message: "License not valid" });

		const accessToken = generateAccessToken(seller._id);
		const refreshToken = generateRefreshToken(seller._id);

		res.json({
			success: true,
			message: "Login successful",
			accessToken,
			refreshToken,
			seller: {
				id: seller._id,
				name: seller.name,
				email: seller.email,
				businessName: seller.businessName,
				language: seller.language,
			},
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Login failed",
			error: error.message,
		});
	}
};

export const refreshAccessToken = async (req, res) => {
	try {
		const { refreshToken } = req.body;

		if (!refreshToken) {
			return res
				.status(401)
				.json({ success: false, message: "Refresh token required" });
		}

		const decoded = verifyRefreshToken(refreshToken);
		if (!decoded || decoded.type !== "refresh") {
			return res
				.status(401)
				.json({ success: false, message: "Invalid refresh token" });
		}

		const newAccessToken = generateAccessToken(decoded.id);

		res.json({
			success: true,
			accessToken: newAccessToken,
		});
	} catch (error) {
		res.status(401).json({
			success: false,
			message: "Token refresh failed",
			error: error.message,
		});
	}
};

export const getSeller = async (req, res) => {
	try {
		const seller = await Seller.findById(req.userId).select("-password");
		if (!seller) {
			return res
				.status(404)
				.json({ success: false, message: "Seller not found" });
		}

		res.json({ success: true, seller });
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Failed to fetch seller",
			error: error.message,
		});
	}
};

export const updateSeller = async (req, res) => {
	try {
		const {
			name,
			phone,
			businessName,
			address,
			city,
			state,
			pincode,
			language,
			smsNotificationEnabled,
		} = req.body;

		const seller = await Seller.findByIdAndUpdate(
			req.userId,
			{
				name,
				phone,
				businessName,
				address,
				city,
				state,
				pincode,
				language,
				smsNotificationEnabled,
			},
			{ new: true }
		).select("-password");

		res.json({
			success: true,
			message: "Seller updated successfully",
			seller,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Failed to update seller",
			error: error.message,
		});
	}
};
