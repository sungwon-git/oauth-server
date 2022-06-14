var Client = require("../models/clients");
var util = require("../utils/utils");

module.exports.registeClientUI = function (req, res) {
	if (req.user) {
		let email = req.user.email;
		res.render("clientRegister", { email: email });
	} else {
		res.redirect("/signin");
	}
};

module.exports.registeClient = function (req, res) {
	// console.log(req.user);
	var clientData = {
		clientName: req.body.clientName,
		clientId: util.getUid(16),
		clientSecret: util.getUid(64),
		redirectUri: req.body.redirectUri,
		userId: req.user._id,
		patientNumber: req.user.patientNumber,
	};

	var newClient = new Client(clientData);

	newClient.save(function (err, client) {
		if (err) {
			req.flash("error", "Something is wrong");
			res.redirect("/register");
		}
		// console.log(client);

		res.redirect("/");
	});
};

module.exports.clients = function (req, res) {
	if (req.user) {
		let username = req.user.username;
		console.log(username);

		Client.find({ userId: req.user._id }, function (err, clients) {
			if (err) {
				req.flash("error", "There is an error : " + err);
				res.status(409).send("fail");
			}

			if (clients) {
				console.log(clients);
				res.render("clients", { username: username, clients: clients });
			} else {
				res.redirect("/");
			}
		});
	} else {
		res.redirect("/signin");
	}
};
