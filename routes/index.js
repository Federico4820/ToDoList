const feedRoutes = require("./feed");
const authRoutes = require("./auth");

module.exports = function (app) {
  app.use("/feed", feedRoutes);
  app.use("/auth", authRoutes);
};
