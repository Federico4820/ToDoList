const { validationResult } = require("express-validator");
const PostIt = require("../models/postIt");

// POST
exports.createPostIt = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        message: "Errore di validazione",
        errors: errors.array(),
      });
    }

    const { content, color } = req.body;

    const postIt = await req.user.createPostIt({
      content,
      color,
    });

    res.status(201).json(postIt);
  } catch (error) {
    console.error("Errore durante la creazione del post-it:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
};

// PUT
exports.editPostIt = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        message: "Errore di validazione",
        errors: errors.array(),
      });
    }

    const postItId = req.params.id;
    const UserId = req.user.id;
    const { content } = req.body;

    const postIt = await PostIt.findOne({
      where: { id: postItId, UserId: UserId },
    });

    if (!postIt) {
      return res.status(404).json({
        message: "Post-it non trovato o non appartiene a questo utente",
      });
    }

    postIt.content = content;
    await postIt.save();

    res.status(200).json({
      message: "Post-it aggiornato con successo",
      postIt,
    });
  } catch (err) {
    console.error("Errore in editPostIt:", err);
    res.status(500).json({ message: "Errore interno del server" });
  }
};

// DEL
exports.deletePostIt = async (req, res, next) => {
  try {
    const postItId = req.params.id;

    const postIt = await PostIt.findOne({
      where: { id: postItId, UserId: req.user.id },
    });

    if (!postIt) {
      return res.status(404).json({
        message: "Post-it non trovato o non appartiene a questo utente",
      });
    }

    await postIt.destroy();

    res.status(200).json({ message: "Post-it eliminato correttamente" });
  } catch (err) {
    console.error("Errore in deletePostIt:", err);
    res.status(500).json({ message: "Errore interno del server" });
  }
};

// GET
exports.getPostsIt = async (req, res, next) => {
  try {
    const postIts = await PostIt.findAll({
      where: { UserId: req.user.id },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      message: "Post-it recuperati con successo",
      count: postIts.length,
      postIts,
    });
  } catch (err) {
    console.error("Errore in getPostsItByMe:", err);
    res.status(500).json({ message: "Errore interno del server" });
  }
};
