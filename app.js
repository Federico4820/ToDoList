const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const User = require("./models/user");
const PostIt = require("./models/postIt");
const fs = require("fs");
let helmet = require("helmet");
let morgan = require("morgan");

User.hasMany(PostIt, { onDelete: "CASCADE" });
PostIt.belongsTo(User);

const sequelize = require("./utils/database");

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  next();
});

app.use(express.static("public"));
app.use(helmet());
const logStream = fs.createWriteStream(path.join(__dirname, "access.log"), {
  flags: "a",
});
app.use(morgan("combined", { stream: logStream }));

require("./routes")(app);

console.log(process.env.NODE_ENV || "develop");

sequelize
  .authenticate()
  .then((rec) => {
    console.log("Connessione stabilita con successo");
    sequelize
      .sync()
      .then((user) => {
        console.log("Sync al db esequito con successo");
      })
      .catch((err) => {
        console.log("Sync al DB error:", err);
      });
  })
  .catch((err) => {
    console.log("Connessione al DB error:", err);
  });
app.listen(process.env.NODE_PORT || 8080);
