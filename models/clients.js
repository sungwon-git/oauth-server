var mongoose = require("mongoose");

mongoose.set("useCreateIndex", true);

var ClientSchema = new mongoose.Schema({
	clientName: {
		type: String,
		trim: true,
	},
	clientId: {
		type: String,
		trim: true,
	},
	clientSecret: {
		type: String,
		trim: true,
	},
	redirectUri: {
		type: String,
		trim: true,
	},
	userId: {
		type: String,
		trim: true,
	},
	patientNumber: {
		type: String,
		trim: true,
	},
});

module.exports = mongoose.model("Client", ClientSchema);
