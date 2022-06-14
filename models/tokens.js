var mongoose = require("mongoose");

var TokenSchema = new mongoose.Schema({
	value: {
		type: String,
		required: true,
	},
	userId: {
		type: String,
		required: true,
	},
	username: {
		type: String,
		required: true,
	},
	patientNumber: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true,
	},
	// person_id: {
	// 	type: String,
	// 	required: true,
	// },
	clientId: {
		type: String,
		required: true,
	},
	clientName: {
		type: String,
		required: true,
	},
	organizationID: {
		type: String,
		required: true,
	},
});

module.exports = mongoose.model("Token", TokenSchema);
