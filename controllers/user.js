var User = require("../models/users");
var bcrypt = require("bcrypt");
var auth = require("./auth");

/***********************************************************************************
 회원가입
***********************************************************************************/
module.exports.signupUI = function (req, res) {
	res.render("signup");
};

module.exports.signup = function (req, res) {
	User.findOne({ email: req.body.email }, function (err, user) {
		if (err) {
			// req.flash("error", "There is an error : " + err);
			// res.redirect("/signup/fail");
			res.status(409).send("Error: User findOne");
		}
		if (user) {
			// req.flash("error", "There is an email : " + user.email);
			// res.redirect("/signup/fail");
			res.status(409).send("Error: There is a user");
		} else {
			bcrypt.hash(req.body.password, (saltRounds = 10), function (err, hash) {
				if (err) {
					// req.flash("error", "bcrypt hash error " + err);
					res.status(409).send("Error: bcrypt error");
				}

				var userData = {
					email: req.body.email,
					password: hash,
					username: req.body.username,
					patientNumber: "113610",
				};

				var newUser = new User(userData);
				newUser.save(function (err, user) {
					if (err) {
						// req.flash("error", "new user save error : " + err);
						// res.redirect("/signup/fail");
						res.status(409).send("New User Save error");
					}

					// req.flash("success", "Welcome");
					res.status(200).redirect("/");
				});
			});
		}
	});
};

/***********************************************************************************
 login -local
***********************************************************************************/
// local login ui
module.exports.localAuthUI = function (req, res) {
	if (req.user) {
		res.redirect("/");
	} else {
		res.render("signin-local");
	}
};

// local login process
module.exports.localAuth = auth.localAuthenticated;

// local logout
module.exports.logout = function (req, res) {
	console.log("logout");
	req.logout();
	req.session.destroy(function (err) {
		if (err) {
			console.log("logout error is : ", err);
		}
		req.session;
		res.redirect("/");
	});
};

/***********************************************************************************
 login - basic
***********************************************************************************/
// basic login ui
module.exports.basicAuthUI = function (req, res) {
	let client_id = "";
	let response_type = "";
	let redirect_uri = "";
	let email = "";
	let password = "";
	console.log(1, req.query);
	if (req.query) {
		client_id = req.query.client_id;
		response_type = req.query.response_type;
		redirect_uri = req.query.redirect_uri;
		if (req.query.email && req.query.password) {
			email = req.query.email;
			password = req.query.password;
		}
	}

	console.log(email, password);

	res.render("signin", {
		client_id: client_id,
		response_type: response_type,
		redirect_uri: redirect_uri,
		email: email,
		password: password,
	});
};

// basic login process
module.exports.basicAuth = [auth.isAuthenticated];

// basic logout
module.exports.basicLogout = function (req, res) {
	console.log("/basic/logout");

	res.set("WWW-Authenticate", "Basic realm=Authorization Required");
	return res.sendStatus(401);
};
