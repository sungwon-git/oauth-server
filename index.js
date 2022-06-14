/***********************************************************************************
 express (https) 서버 설정
***********************************************************************************/
const express = require("express");

/* https 설정 부분 */
const https = require("https");
/* https 설정 부분 */

const env = require("dotenv");
env.config();

/* https 설정 부분 */
const fs = require("fs");
const key = fs.readFileSync("./key.pem");
const cert = fs.readFileSync("./cert.pem");
/* https 설정 부분 */

const app = express();
const port = process.env.PORT || 8000;

/* https 설정 부분 */
const httpsServer = https.createServer({ key: key, cert: cert }, app);
/* https 설정 부분 */

/***********************************************************************************
 cors 설정
***********************************************************************************/
const cors = require("cors");
app.use(
	cors({
		origin: ["http://localhost:3000", "http://localhost:8000", "http://skku-milab.ddns.net:3300", "https://ngs-qr.herokuapp.com"],
		credentials: true,
	})
);
// app.use(cors());

/***********************************************************************************
 bodyParser 설정
***********************************************************************************/
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

/***********************************************************************************
 mongodb 설정
***********************************************************************************/
var mongoose = require("mongoose");

mongoose.Promise = global.Promise;
// mongoose.connect(process.env.MONGODB_URL_ATLAS, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect(process.env.MONGODB_URL_LOCAL, { useNewUrlParser: true, useUnifiedTopology: true });

var db = mongoose.connection;
db.once("open", function () {
	console.log("mongodb : oauth2_server database is connected");
});
db.once("error", function () {
	console.log("mongodb error ");
});

/***********************************************************************************
 view engine 설정
***********************************************************************************/
app.set("views", "./views");
app.set("view engine", "ejs");

app.use("/", express.static(__dirname + "/node_modules"));

/***********************************************************************************
 session 설정
***********************************************************************************/
var session = require("express-session");
//session store로 mongodb 사용 선언
var mongoStore = require("connect-mongo")(session);

//session 메시지 처리
// var flash = require("connect-flash");
// app.use(flash());

app.use(
	session({
		// secure: true,
		//secret 은 변수처리해서 관리할것
		secret: "secret",
		//세션이 필요하기 전까지는 세션을 구동시키지 않는다는 뜻
		saveUninitialized: true,
		//기본값은 false session data가 바뀌지 않으면 저장소를 저장하지 않는다는 뜻
		resave: true,
		cookie: { maxAge: 500000 }, //500,000ms = 5분
		// store: new mongoStore({
		// 	host: "cluster0.gslxt.mongodb.net",
		// 	db: "oauth2_server",
		// 	url: "mongodb+srv://swjung:tjddnjs77!@cluster0.gslxt.mongodb.net/oauth2_server",
		// }),

		/* https 설정 부분 */
		store: new mongoStore({
			host: "localhost",
			port: "27017",
			db: "oauth2_server",
			url: "mongodb://swjung:tjddnjs77!@localhost:27017/oauth2_server",
		}),
		/* https 설정 부분 */
	})
);

/***********************************************************************************
 passport 설정
***********************************************************************************/
// passport 사용 선언 : passport 는 인증 절차를 로직을 편하게 작업할 수 있게 도와주는 Node.js 미들웨어이다
let passport = require("passport");

// passport 초기화 : passport 초기화 시 user정보가 req.user로 들어감
app.use(passport.initialize());
app.use(passport.session());

/***********************************************************************************
 controller 설정
***********************************************************************************/
const userController = require("./controllers/user");
const clientController = require("./controllers/client");
const authController = require("./controllers/auth");
const oauth2Controller = require("./controllers/oauth2");

/***********************************************************************************
 root
***********************************************************************************/
app.get("/", (req, res) => {
	res.render("index");
});

/***********************************************************************************
 회원가입
***********************************************************************************/
app.get("/signup", userController.signupUI);
app.post("/signup", userController.signup);

/***********************************************************************************
 로그인 - 로그아웃 - Local Strategy
***********************************************************************************/
app.get("/signin", userController.localAuthUI);
app.post("/signin", userController.localAuth);
app.get("/logout", userController.logout);

/***********************************************************************************
 클라이언트 등록
***********************************************************************************/
app.get("/client/register", clientController.registeClientUI);
app.post("/client/register", clientController.registeClient);

/***********************************************************************************
 클라이언트 확인
***********************************************************************************/
app.get("/clients", clientController.clients);

/***********************************************************************************
 로그인 - 로그아웃 - Basic Strategy
***********************************************************************************/
// 로그인 화면 - basic
app.get("/basic/auth", userController.basicAuthUI);
// 로그인  - basic : redirect = GET:/
app.post("/basic/auth", userController.basicAuth);
// 로그아웃 - basic
app.get("/basic/logout", function (req, res) {
	res.redirect("/");
});

/***********************************************************************************
 토큰 발급
***********************************************************************************/
app.get("/oauth2/authorize", authController.isAuthenticated, oauth2Controller.authorization);
app.post("/oauth2/authorize", oauth2Controller.decision);
app.post("/oauth2/token", authController.isClientAuthenticated, oauth2Controller.token);

app.get("/auth", authController.isJWTAuthenticated, (req, res) => {
	res.status(200).send(req.authInfo);
});

app.get("/token", authController.isBearerAuthenticated, (req, res) => {
	res.status(200).send(req.authInfo);
});

app.get("/his-fhir-server", authController.isBearerAuthenticated, (req, res) => {
	res.status(200).send(req.authInfo);
	// return req;
});

app.get("/fhir-server", authController.isJWTAuthenticated, (req, res) => {
	res.status(200).send(req.authInfo);
	// return req;
});

/***********************************************************************************
 Server Start
***********************************************************************************/
/* https 설정 부분 */
httpsServer.listen(port, () => {
	console.log(`https server is running on ${port}`);
});
/* https 설정 부분 */

// app.listen(port, () => {
// 	console.log(`oauth2 server is running on ${port}`);
// });
