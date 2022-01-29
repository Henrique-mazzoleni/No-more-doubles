require("dotenv").config();
const path = require("path");
const app = require("express")();
const hbs = require("hbs");

const port = process.env.PORT || 3000;

const viewPath = path.join(__dirname, "./templates/views");

app.set("view engine", "hbs");
app.set("views", viewPath);

app.get("", (req, res) => {
  res.render("index");
});

app.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
