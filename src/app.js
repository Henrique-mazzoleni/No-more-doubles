require("dotenv").config();
const path = require("path");
const axios = require("axios");
const qs = require("qs");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const {
  generateRandomString,
  extractTracks,
  extractDoubles,
} = require("./utils/utils");
const hbs = require("hbs");

const port = process.env.PORT || 8888;
const viewPath = path.join(__dirname, "../templates/views");
const partialsPath = path.join(__dirname, "../templates/partials");
const publicDirectoryPath = path.join(__dirname, "../public");

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;
const stateKey = process.env.STATE_KEY;

const tokenURL = "https://accounts.spotify.com/api/token";

const app = express();
app.set("view engine", "hbs").set("views", viewPath);
hbs.registerPartials(partialsPath);
app.use(express.static(publicDirectoryPath));
app.use(cors()).use(cookieParser());

app.get("", (req, res) => {
  if (req.cookies?.access_token) return res.redirect("home");
  res.render("index", {
    title: "No More Duplicates!",
  });
});

app.get("/login", (req, res) => {
  res.clearCookie("access_token");
  const state = generateRandomString(16);
  res.cookie(stateKey, state);
  const scope = "user-library-read";
  const auth_url = "https://accounts.spotify.com/authorize?";
  const searchParams = {
    client_id: client_id,
    response_type: "code",
    redirect_uri: redirect_uri,
    show_dialog: true,
    scope: scope,
    state: state,
  };
  const params = new URLSearchParams(searchParams);
  res.redirect(auth_url + params.toString());
});

app.get("/callback", async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.cookie("error", "state missmatch");
    res.redirect("index");
  } else {
    res.clearCookie(stateKey);
    const data = qs.stringify({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirect_uri,
    });
    const config = {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(client_id + ":" + client_secret, "utf8").toString(
            "base64"
          ),
        "Content-Type": "application/x-www-form-urlencoded",
      },
    };
    try {
      const response = await axios.post(tokenURL, data, config);

      res.cookie("access_token", response.data.access_token);
      res.cookie("refresh_token", response.data.refresh_token);

      res.redirect("home");
    } catch (error) {
      console.log(error);
      res.clearCookie(access_token);
      res.clearCookie(refresh_token);
      res.redirect("index");
    }
  }
});

app.get("/refresh", async (req, res) => {
  const data = qs.stringify({
    grant_type: "refresh_token",
    refresh_token: req.cookies.refresh_token,
  });
  const config = {
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(client_id + ":" + client_secret, "utf-8").toString(
          "base64"
        ),
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };

  try {
    const response = await axios.post(tokenURL, data, config);
    res.cookie("access_token", response.data.access_token);
  } catch (error) {
    console.log(error);
  }
  res.redirect("home");
});

app.get("/home", async (req, res) => {
  if (!req.cookies?.access_token) return res.redirect("/login");

  const access_token = req.cookies.access_token;
  const options = {
    headers: { Authorization: "Bearer " + access_token },
  };

  const tracks = [];
  let offsetLimit = 1;
  let offset = 0;
  try {
    while (offset < offsetLimit) {
      const response = await axios.get(
        `https://api.spotify.com/v1/me/tracks?offset=${offset}&limit=50`,
        options
      );
      if (offsetLimit === 1) offsetLimit = response.data.total;
      tracks.push(...extractTracks(response.data.items));
      offset += 50;
      console.log(tracks.length);
    }
    const doubleTracks = extractDoubles(tracks);
    console.log(doubleTracks);
    console.log(doubleTracks.length);
  } catch (error) {
    if (error.response.status === 401) return res.redirect("/refresh");
    console.log(error.response);
  }

  res.render("home", {
    title: "No More Duplicates - Home",
  });
});

app.listen(port, (error) => {
  if (error) console.log(error);
  console.log(`Server is up on port ${port}`);
});
