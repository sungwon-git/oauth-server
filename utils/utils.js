"use strict";

const moment = require("moment");
/**
 * Return a unique identifier with the given `len`.
 *
 * @param {Number} length
 * @return {String}
 * @api private
 */
module.exports.getUid = function (length) {
	let uid = "";
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const charsLength = chars.length;

	for (let i = 0; i < length; ++i) {
		uid += chars[getRandomInt(0, charsLength - 1)];
	}

	return uid;
};

/**
 * Return a random int, used by `utils.getUid()`.
 *
 * @param {Number} min
 * @param {Number} max
 * @return {Number}
 * @api private
 */
function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports.getCurrentDateTime = () => {
	var currentDateTime = moment().format("YYYY-MM-DD HH:mm:ss");
	return currentDateTime.toString();
};

module.exports.getExpireDateTime = () => {
	var expireDate = moment().add(1, "M").format("YYYY-MM-DD HH:mm:ss");
	// var expireDate = moment().subtract(1, "M").format("YYYY-MM-DD HH:mm:ss");
	return expireDate.toString();
};
