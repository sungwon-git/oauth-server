var mongoose = require("mongoose");

mongoose.set("useCreateIndex", true);

var UserSchema = new mongoose.Schema({
	email: {
		type: String,
		match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Should be a vaild email address!"],
		trim: true,
		unique: true,
	},
	password: {
		type: String,
		trim: true,
		// required:[true,'Password is required!']
		//비밀번호 조회 여부 세팅
		// select:false
	},
	username: {
		type: String,
		trim: true,
	},
	patientNumber: {
		type: String,
		trim: true,
	},
	person_id: {
		type: String,
		trim: true,
	},
	googleId: {
		type: String,
		trim: true,
	},
});

module.exports = mongoose.model("User", UserSchema);
