const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

exports.registerUser = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: "errore input",
      error: errors.array(),
    });
  }

  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const profileImage = req.file
    ? req.file.path.replace(/\\/g, "/").replace(/^public\//, "")
    : null;

  bcrypt.hash(password, 12).then((hashedPassword) => {
    User.create({
      name: name,
      email: email,
      password: hashedPassword,
      profileImage: profileImage,
    })
      .then((user) => {
        res.status(201).json({
          message: "Success Operation",
          user: user,
        });
      })
      .catch((err) => {
        return res.status(500).json({
          message: err,
        });
      });
  });
};

exports.loginUser = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: "errore input",
      error: errors.array(),
    });
  }

  const email = req.body.email;
  const password = req.body.password;
  let loginUser;

  User.findOne({ where: { email: email } })
    .then((user) => {
      if (!user) {
        res.status(401).json({
          message: "Errore di credenziali",
        });
        return Promise.reject("Stop execution");
      }

      loginUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        res.status(401).json({
          message: "Errore di credenziali",
        });
        return Promise.reject("Stop execution");
      }

      const token = jwt.sign(
        { id: loginUser.id, email: loginUser.email, name: loginUser.name },
        "awNduRn1DrayvXb7uG37kdWEYfbsgrt3",
        {
          expiresIn: "3h",
        }
      );

      res.status(201).json({
        messages: "Success Operation, sei loggato",
        id: loginUser.id,
        token: token,
      });
    })
    .catch((err) => {
      if (err !== "Stop execution") {
        res.status(422).json({ message: err });
      }
    });
};

exports.loginMe = (req, res, next) => {
  req.user.password = "*************";
  res.status(200).json({
    user: req.user,
  });
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "La password è obbligatoria" });
    }

    const user = req.user;

    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Password errata, impossibile eliminare l'account" });
    }

    if (user.profileImage) {
      const oldImagePath = path.join(
        __dirname,
        "..",
        "public",
        user.profileImage
      );
      fs.unlink(oldImagePath, (err) => {
        if (err)
          console.warn(
            "Impossibile eliminare l'immagine precedente:",
            err.message
          );
      });
    }

    await user.destroy();

    return res.status(200).json({
      message: "Account eliminato con successo",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Errore durante l'eliminazione dell'utente",
    });
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err)
            console.warn(
              "Errore nell'eliminare l'immagine non valida:",
              err.message
            );
        });
      }
      return res
        .status(422)
        .json({ message: "Errore nei dati inviati", errors: errors.array() });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    const { name, email, password, newPassword } = req.body;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err)
            console.warn(
              "Errore nell'eliminare l'immagine per password errata:",
              err.message
            );
        });
      }
      return res.status(401).json({ message: "Password non corretta" });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (newPassword && newPassword.trim() !== "") {
      const hashedPw = await bcrypt.hash(newPassword, 12);
      user.password = hashedPw;
    }

    if (req.file) {
      if (user.profileImage) {
        const oldImagePath = path.join(
          __dirname,
          "..",
          "public",
          user.profileImage
        );
        fs.unlink(oldImagePath, (err) => {
          if (err)
            console.warn(
              "Impossibile eliminare l'immagine precedente:",
              err.message
            );
        });
      }
      user.profileImage = req.file
        ? req.file.path.replace(/\\/g, "/").replace(/^public\//, "")
        : null;
    }

    await user.save();

    res.status(200).json({
      message: "Profilo aggiornato con successo",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.profileImage,
      },
    });
  } catch (err) {
    console.error("Errore in updateUser:", err);
    res.status(500).json({ message: "Errore interno del server" });
  }
};
