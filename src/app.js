require("dotenv").config();
const path = require("path");
const request = require("request");
// const cookieParser = require("cookie-parser");
// const cors = require("cors");
const app = require("express")();
const generateRandomString = require("./utils/utils");
const hbs = require("hbs");

const port = process.env.PORT || 8888;
const viewPath = path.join(__dirname, "./templates/views");
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;
const stateKey = process.env.STATE_KEY;

app.set("view engine", "hbs").set("views", viewPath);
// app.use(cors()).use(cookieParser());

app.get("", (req, res) => {
  /*
  if (req.query?.code) {
    const code = req.query.code;
    console.log(Buffer.from(client_id + ":" + client_secret, "base64"));
    const authOptions = {
      url: "https://accounts.spotify.com/api/token",
      form: {
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirect_uri,
      },
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(client_id + ":" + client_secret, "utf8").toString(
            "base64"
          ),
      },
      json: true,
    };

    request.post(authOptions, (error, response, body) => {
      console.log(error);
      console.log(response);
      console.log(body);
    });
  }
  */
  res.render("index");
});

app.get("/login", (req, res) => {
  // const state = generateRandomString(16);
  // res.cookie(stateKey, state);
  const scope = "user-read-private user-read-email";
  const auth_url = "https://accounts.spotify.com/authorize?";
  const searchParams = {
    client_id: client_id,
    response_type: "code",
    redirect_uri: redirect_uri,
    show_dialog: true,
    scope: scope,
    // state: state,
  };
  const params = new URLSearchParams(searchParams);
  res.redirect(auth_url + params.toString());
});

app.get("/callback", (req, res) => {
  const code = req.query.code || null;
  // const state = req.query.state || null;
  // const storedState = req.cookies ? req.cookies[stateKey] : null;

  // if (state === null || state !== storedState) {
  if (!code) {
    const params = new URLSearchParams({ error: state_missmatch });
    res.redirect("/#" + params.toString());
  } else {
    // res.clearCookie(stateKey);
    const authOptions = {
      url: "https://accounts.spotify.com/api/token",
      form: {
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirect_uri,
      },
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(client_id + ":" + client_secret, "utf8").toString(
            "base64"
          ),
      },
      json: true,
    };

    request.post(authOptions, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const access_token = body.access_token;
        const refresh_token = body.refresh_token;

        const options = {
          url: "https://api.spotify.com/v1/me",
          headers: { Authorization: "Bearer " + access_token },
          json: true,
        };

        // use the access token to access the Spotify Web API
        request.get(options, (error, response, body) => {
          console.log(body);
        });

        // we can also pass the token to the browser to make requests from there
        const accessParams = new URLSearchParams({
          access_token: access_token,
          refresh_token: refresh_token,
        });
        res.redirect("/#" + accessParams.toString());
      } else {
        const errorParams = new URLSearchParams({
          error: "invalid_token",
        });
        res.redirect("/#" + errorParams.toString());
      }
    });
  }
});

app.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
