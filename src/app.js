require("dotenv").config();
const path = require("path");
const axios = require("axios");
const qs = require("qs");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = require("express")();
const { generateRandomString, extractTracks } = require("./utils/utils");
const hbs = require("hbs");

const port = process.env.PORT || 8888;
const viewPath = path.join(__dirname, "./templates/views");
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;
const stateKey = process.env.STATE_KEY;

app.set("view engine", "hbs").set("views", viewPath);
app.use(cors()).use(cookieParser());

app.get("", async (req, res) => {
  if (req.query?.access_token) {
    const access_token = req.query.access_token;
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
      console.log(tracks.slice(2820));
    } catch (error) {
      console.log(error);
    }
  }
  res.render("index");
});

app.get("/login", (req, res) => {
  const state = generateRandomString(16);
  res.cookie(stateKey, state);
  const scope =
    "user-read-private user-read-email user-library-read playlist-read-private user-top-read";
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
    const params = new URLSearchParams({ error: "state_missmatch" });
    res.redirect("/?" + params.toString());
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
      const response = await axios.post(
        "https://accounts.spotify.com/api/token",
        data,
        config
      );

      const access_token = response.data.access_token;
      const refresh_token = response.data.refresh_token;

      const accessParams = new URLSearchParams({
        access_token: access_token,
        refresh_token: refresh_token,
      });

      res.redirect("/?" + accessParams.toString());
    } catch (error) {
      console.log(error);
    }
  }
});

app.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
