"use strict";

const jwt = require("jsonwebtoken");
const fs = require("fs");

module.exports.getToken = (user_id) => {
	const data = {
		user_id: user_id,
	};
	const privateKey = fs.readFileSync("./key.pem", "utf8");
	const signOption = {
		issuer: process.env.ISSUER,
		subject: process.env.SUBJECT,
		audience: process.env.AUDIENCE,
		expiresIn: 60 * 60 * 24 * 30 * 12, //1년
		algorithm: "RS256",
	};

	const token = jwt.sign(data, privateKey, signOption);

	return token;
};

module.exports.getTest = () => {
	return "Test";
};
