const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const BasicStrategy = require("passport-http").BasicStrategy;
const BearerStrategy = require("passport-http-bearer").Strategy;
const JWTStrategy = require("passport-jwt").Strategy;
const ExtractJWT = require("passport-jwt").ExtractJwt;

const bcrypt = require("bcrypt");
const moment = require("moment");
const fs = require("fs");

const User = require("../models/users");
const Client = require("../models/clients");
const Token = require("../models/tokens");

passport.serializeUser(function (user, done) {
	console.log("auth.js: serializeUser", user.username);
	done(null, user);
});

passport.deserializeUser(function (user, done) {
	console.log("auth.js: deserializeUser", user.username);
	done(null, user);
});

/***********************************************************************************
 Local Strategy
***********************************************************************************/
passport.use(
	new LocalStrategy(
		{
			usernameField: "email",
			passwordField: "password",
		},
		function (username, password, done) {
			console.log("Authorization : Local", username, password);
			User.findOne({ email: username }, function (err, user) {
				console.log(1);
				if (err) {
					return done(err);
				}
				if (!user) {
					return done(null, false);
				}
				console.log(2);
				bcrypt.compare(password, user.password, function (err, result) {
					if (err) {
						return done(err);
					}
					console.log(3);
					if (result) {
						console.log(4);
						return done(null, user);
					} else {
						return done(null, false);
					}
				});
			});
		}
	)
);

exports.localAuthenticated = passport.authenticate("local", {
	successRedirect: "/",
	failureRedirect: "/local/auth",
	// successFlash: true,
	// failureFlash: true,
});

/***********************************************************************************
 Basic Strategy
***********************************************************************************/

passport.use(
	new BasicStrategy(function (username, password, done) {
		console.log("auth.js: BasicStrategy");
		if (!username) {
			return done(null, fasle);
		}

		User.findOne({ email: username }, function (err, user) {
			if (err) {
				return done(err);
			}
			if (!user) {
				return done(null, false);
			}
			bcrypt.compare(password, user.password, function (err, result) {
				if (err) {
					return done(null, false);
				}
				if (result) {
					console.log("auth.js: BasicStrategy is successed");
					return done(null, user);
				} else {
					console.log("password error");
					return done(null, false);
				}
			});
		});
	})
);

// exports.isAuthenticated = passport.authenticate(["basic", "bearer"], { session: false });
exports.isAuthenticated = function (req, res, next) {
	console.log("auth.js: isAuthenticated");

	console.log(2, req.query);

	var client_id = "";
	var response_type = "";
	var redirect_uri = "";
	let email = "";
	let password = "";

	if (req.query) {
		client_id = req.query.client_id;
		response_type = req.query.response_type;
		redirect_uri = req.query.redirect_uri;

		if (req.query.email && req.query.password) {
			email = req.query.email;
			password = req.query.password;
		}
	}

	passport.authenticate("basic", { session: false }, function (err, user, info) {
		// console.log(err, user, info);
		if (err) {
			// console.log(1);
			return next(err);
		}

		if (!user) {
			// console.log(2);
			if (req.query.email && req.query.password) {
				return res.redirect(
					`/basic/auth?client_id=${client_id}&response_type=${response_type}&redirect_uri=${redirect_uri}&email=${email}&password=${password}`
				);
			} else {
				return res.redirect(`/basic/auth?client_id=${client_id}&response_type=${response_type}&redirect_uri=${redirect_uri}`);
			}
		}

		req.logIn(user, function (err) {
			if (err) {
				// console.log(3);
				return next(err);
			}
			// console.log(4);
			// return res.redirect("/users/" + user.username);
			return next();
		});
	})(req, res);
};

/***********************************************************************************
 Bearer Strategy
***********************************************************************************/
passport.use(
	new BearerStrategy(function (accessToken, done) {
		console.log("auth.js: BearerStrategy");
		Token.findOne({ value: accessToken }, function (err, token) {
			if (err) {
				return done(err);
			}

			if (!token) {
				return done(null, false);
			}
			// 토큰 종료일자 확인
			var expireDate = moment(token.expireDate).format("YYYY-MM-DD HH:mm:ss");
			var currentDate = moment().format("YYYY-MM-DD HH:mm:ss");

			if (expireDate > currentDate) {
				User.findOne({ _id: token.userId }, function (err, user) {
					if (err) {
						return done(err);
					}

					if (!user) {
						return done(null, false);
					}
					// console.log("User is founded");
					let response = {
						active: true,
						scope: "*",
						user_id: user.email,
						sub: user.username,
						context: "",
					};

					// return done(null, user, { scope: "*" });
					return done(null, user, response);
				});
			} else {
				return done("Invalid Token Error", false);
			}
		});
	})
);

exports.isBearerAuthenticated = passport.authenticate("bearer", { session: false });

/***********************************************************************************
 BasicStrategy & ClientPasswordStrategy
***********************************************************************************/

passport.use(
	"client-basic",
	new BasicStrategy(function (username, password, done) {
		console.log("auth.js: client-basic", username);
		Client.findOne({ clientId: username }, function (err, client) {
			if (err) {
				console.log(1, err);
				return done(err);
			}

			if (!client || client.clientSecret !== password) {
				console.log("Error - auth.js: client-basic - no client");
				return done(null, false);
			}

			console.log("auth.js: client-basic - Client is found");
			return done(null, client);
		});
	})
);

exports.isClientAuthenticated = passport.authenticate("client-basic", { session: false });

/***********************************************************************************
 JwtStrategy
***********************************************************************************/
var opts = {
	jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
	secretOrKey: fs.readFileSync("./cert.pem", "utf8"),
	// issuer: process.env.ISSUER,
	// subject: process.env.SUBJECT,
	// audience: process.env.AUDIENCE,
	// expiresIn: 60,
	// algorithm: "RS256",
};

passport.use(
	new JWTStrategy(opts, function (jwtPayload, done) {
		console.log("auth2.js: JWTStrategy", jwtPayload);
		User.findOne({ _id: jwtPayload.user_id }, function (err, user) {
			if (err) {
				console.log(1);
				return done(err);
			}

			if (!user) {
				console.log(2);
				return done(null, false);
			}
			// console.log("User is founded");
			let response = {
				scope: "Patient.read",
				user_email: user.email,
				user_name: user.username,
				context: "",
			};
			console.log(3);

			// return done(null, user, { scope: "*" });
			return done(null, user, response);
		});
	})
);

exports.isJWTAuthenticated = passport.authenticate("jwt", { session: false });
