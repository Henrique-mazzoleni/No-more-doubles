const express = require("express");
const loginRouter = require("./routers/login");

const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const hbs = require("hbs");

const viewPath = path.join(__dirname, "../templates/views");
const partialsPath = path.join(__dirname, "../templates/partials");
const publicDirectoryPath = path.join(__dirname, "../public");

const app = express();

app.set("view engine", "hbs").set("views", viewPath);
hbs.registerPartials(partialsPath);
app.use(express.static(publicDirectoryPath));
app.use(express.json());
app.use(cors()).use(cookieParser());
app.use(loginRouter);

module.exports = app;
