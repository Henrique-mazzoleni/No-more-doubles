const express = require("express");
const router = express.Router();

const axios = require("axios").default;
const qs = require("qs");
const {
  generateRandomString,
  extractTracks,
  extractDoubles,
} = require("../utils/utils");

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;
const stateKey = process.env.STATE_KEY;
const base_url = process.env.BASE_URL;

const externalAPI = axios.create();
const internalAPI = axios.create();
internalAPI.defaults.baseURL = base_url;

const tokenURL = "https://accounts.spotify.com/api/token";

router.get("/login", (req, res) => {
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

router.get("/callback", async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.cookie("error", "state missmatch");
    return res.redirect("index");
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
      const response = await externalAPI.post(tokenURL, data, config);

      res.cookie("access_token", response.data.access_token);
      res.cookie("refresh_token", response.data.refresh_token);

      res.redirect("home");
    } catch (error) {
      console.log(error);
      res.clearCookie(access_token);
      res.clearCookie(refresh_token);
      res.redirect("/login");
    }
  }
});

router.get("/refresh", async (req, res) => {
  if (!req.cookies?.refresh_token) return res.redirect("/login");

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
    const response = await externalAPI.post(tokenURL, data, config);
    res.cookie("access_token", response.data.access_token);
  } catch (error) {
    console.log(error);
    res.clearCookie(refresh_token);
    return res.redirect("/login");
  }
  res.redirect("home");
});

router.get("/home", async (req, res) => {
  if (!req.cookies?.access_token) return res.redirect("/login");

  try {
    const response = await internalAPI.get("/tracks", {
      headers: { Authorization: "Bearer " + req.cookies.access_token },
    });
    console.log(response.data);
    return res.render("home", {
      title: "No More Duplicates - Home",
    });
  } catch (error) {
    console.log(error);
    if (error.response.status === 401) return res.redirect("/refresh");
  }

  res.render("home", {
    title: "No More Duplicates - Home",
  });
});

router.get("/tracks", async (req, res) => {
  const options = {
    headers: { Authorization: req.headers.authorization },
  };

  const tracks = [];
  let offsetLimit = 1;
  let offset = 0;
  try {
    while (offset < offsetLimit) {
      const response = await externalAPI.get(
        `https://api.spotify.com/v1/me/tracks?offset=${offset}&limit=50`,
        options
      );
      if (offsetLimit === 1) offsetLimit = response.data.total;
      tracks.push(...extractTracks(response.data.items));
      offset += 50;
    }
    const doubleTracks = extractDoubles(tracks);
    res.status(200).send(doubleTracks);
  } catch (error) {
    console.log(error.response);
    if (error.response?.status === 401)
      return res.status(401).send({ error: "Unauthorized" });
  }
});

module.exports = router;
