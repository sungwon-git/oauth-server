const oauth2orize = require("oauth2orize");

const login = require("connect-ensure-login");
// Load required packages
const User = require("../models/users");
const Client = require("../models/clients");
const Code = require("../models/codes");
const Token = require("../models/tokens");

const util = require("../utils/utils");
const jwtToken = require("../utils/jwt");

// Create OAuth2 server
const server = oauth2orize.createServer();

// Register serialization function
server.serializeClient(function (client, done) {
	console.log("oauth2.js: serializeClient");
	return done(null, client);
});

// Register deserialization function
server.deserializeClient(function (client, done) {
	console.log("oauth2.js: deserializeClient");
	return done(null, client);
});

// Register authorization code grant type
server.grant(
	oauth2orize.grant.code(function (client, redirectUri, user, ares, done) {
		console.log("oauth2.js: server.grant");
		// console.log("oauth2orize.grant", client);
		// console.log("oauth2orize.grant", req.oauth2);
		// console.log('controllers/oauth2.js/grant', client._id, user, redirectUri);
		var code = new Code({
			value: util.getUid(16),
			clientId: client._id,
			redirectUri: redirectUri,
			userId: user._id,
		});

		code.save(function (err) {
			if (err) {
				console.log("oauth2.js: server.grant - code save error : ", error.message);
				return done(err);
			}
			console.log("oauth2.js: server.grant - grant code is saved");

			// redirectUri로 code.value 값 붙여 redirect
			// ex) http://localhost:3002/encounter?code=Xaljdjfievjiej

			done(null, code.value);
		});
	})
);

server.exchange(
	oauth2orize.exchange.code(function (client, code, redirectUri, done) {
		console.log("oauth2.js: server.exchange.code");

		Code.findOne({ value: code }, function (err, authCode) {
			if (err) {
				// console.log(1);
				return done(err);
			}
			if (authCode === undefined) {
				// console.log(2);
				return done(null, false);
			}
			// console.log("authCode : ", authCode);
			// console.log(client._id.toString(), authCode.clientId);
			if (client._id.toString() !== authCode.clientId) {
				// console.log(3);
				return done(null, false);
			}

			// console.log(redirectUri, authCode.redirectUri);
			if (redirectUri !== authCode.redirectUri) {
				// console.log(4);
				return done(null, false);
			}

			authCode.remove(function (err) {
				if (err) {
					// console.log(5);
					return done(err);
				}
				// console.log("code is removed");
				User.findOne({ _id: authCode.userId }, function (err, user) {
					if (err) {
						console.log("oauth2.js: server.exchange.code - User findOne error", err.message);
						return done(err);
					}

					Client.findOne({ _id: authCode.clientId }, function (err, client) {
						if (err) {
							console.log("oauth2.js: server.exchange.code - Client findOne error", err.message);
							return done(err);
						}

						var token = new Token({
							// value: util.getUid(256),
							value: jwtToken.getToken(user._id),
							clientId: authCode.clientId,
							userId: authCode.userId,
							username: user.username,
							person_id: user.person_id,
							email: user.email,
							clientName: client.clientName,
							patientNumber: user.patientNumber,
							organizationID: "4578",
						});

						console.log("token is : ", token);

						token.save(function (err) {
							if (err) {
								console.log("oauth2.js: server.exchange.code - token save error : ", err.message);
								return done(err);
							}

							console.log("oauth2.js: server.exchange.code - token is saved");

							done(null, token);
						});
					});
				});
			});
		});
	})
);

// Exchange user id and password for access tokens. The callback accepts the
// `client`, which is exchanging the user's name and password from the
// authorization request for verification. If these values are validated, the
// application issues an access token on behalf of the user who authorized the code.

server.exchange(
	oauth2orize.exchange.password(function (client, username, password, scope, done) {
		console.log("oauth2.js: server.exchange.password");
		// Validate the client
		db.clients.findByClientId(client.clientId, function (error, localClient) {
			if (error) return done(error);
			if (!localClient) return done(null, false);
			if (localClient.clientSecret !== client.clientSecret) return done(null, false);
			// Validate the user
			db.users.findByUsername(username, function (error, user) {
				if (error) return done(error);
				if (!user) return done(null, false);
				if (password !== user.password) return done(null, false);
				// Everything validated, return the token
				const token = utils.getUid(256);
				db.accessTokens.save(token, user.id, client.clientId, function (error) {
					if (error) return done(error);
					// Call `done(err, accessToken, [refreshToken], [params])`, see oauth2orize.exchange.code
					console.log("oauth2.js: sever.exchange.password - accessTokens is saved");
					return done(null, token);
				});
			});
		});
	})
);

// Exchange the client id and password/secret for an access token. The callback accepts the
// `client`, which is exchanging the client's id and password/secret from the
// authorization request for verification. If these values are validated, the
// application issues an access token on behalf of the client who authorized the code.

server.exchange(
	oauth2orize.exchange.clientCredentials(function (client, scope, done) {
		console.log("server.exchange");
		// Validate the client
		db.clients.findByClientId(client.clientId, function (error, localClient) {
			if (error) {
				return done(error);
			}
			if (!localClient) {
				return done(null, false);
			}
			if (localClient.clientSecret !== client.clientSecret) {
				return done(null, false);
			}

			// Everything validated, return the token
			const token = utils.getUid(256);
			// Pass in a null for user id since there is no user with this grant type
			db.accessTokens.save(token, null, client.clientId, function (error) {
				if (error) {
					return done(error);
				}
				// Call `done(err, accessToken, [refreshToken], [params])`, see oauth2orize.exchange.code
				console.log("oauth2.js - sever.exchange.clientCredentials - accessTokens is saved");
				return done(null, token);
			});
		});
	})
);

exports.authorization = [
	login.ensureLoggedIn("/basic/auth"),
	server.authorization(function (clientId, redirectUri, done) {
		console.log("oauth2.js: basicAuthorization");
		Client.findOne({ clientId: clientId }, function (err, client) {
			if (err) {
				console.log("oauth2.js: basicAuthorization - Client is not found");
				return done(err);
			}

			console.log("oauth2.js: basicAuthorization - client is found");
			return done(null, client, redirectUri);
		});
	}),
	function (req, res) {
		console.log("oauth2.js: open confirm page");
		res.render("confirm", {
			username: req.oauth2.user.username,
			clientName: req.oauth2.client.clientName,
			transaction_id: req.oauth2.transactionID,
			// url: "/oauth2/authorize?client_id=5ed5b124827b597eabb76f4c&response_type=code&redirect_uri=http://localhost:3000/oauth2",
		});
	},
];

// User decision endpoint
exports.decision = [login.ensureLoggedIn("/basic/auth"), server.decision()];

// Application client token exchange endpoint
exports.token = [server.token(), server.errorHandler()];
