import { Router } from "express";
import prisma from "../../lib/prisma.ts";
import { body, validationResult } from "express-validator";
import passport from "passport";
const messageRouter = Router();

const isFromUser = async (req, res, next) => {

  const messageId = req.params.messageid;

  try {
    const message = await prisma.message.findUnique({
      where: {
        id: messageId,
      },
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.senderId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You are not authorized to edit this message." });
    }
    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const validatemessage = [
  body("text_content")
    .trim()
    .notEmpty()
    .withMessage("Message content is required")
    .escape()
];

messageRouter.post("/new", passport.authenticate("jwt", { session: false }), validatemessage, 
  async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({
      errors: errors.array(),
      previousData: req.body,
    });
  }

  const {text_content, senderId, chatroomId} = req.body;
  

  try {

    const message = await prisma.message.create({
      data: {
        content: text_content,
        senderId: senderId,
        chatroomId: chatroomId
      }
    });
    console.log("Created message:", message);
    res.status(201).json({
      message: "message created",
      msg: { id: message.id, title: message.title, content: message.content},
    });
  } catch (err) {
    return next(err);
  }
  
});

messageRouter.patch("/:messageid/editmessage", passport.authenticate("jwt", { session: false }), validatemessage, isFromUser, 
  async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({
      errors: errors.array(),
      previousData: req.body,
    });
  }

  const messageId = req.params.messageid;
 const {text_content, senderId, chatroomId} = req.body;
  

  try {

    const updatedmessage = await prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        content: text_content,
        senderId: senderId,
        chatroomId: chatroomId
      }
    });
    console.log("Updated message:", updatedmessage);
    res.status(200).json({
      message: "message updated",
      updatedmessage
    });
  } catch (err) {
    return next(err);
  }
  
});

messageRouter.delete("/:messageid/delete", passport.authenticate("jwt", { session: false }), isFromUser,
  async (req, res, next) => {

  const messageId = req.params.messageid;

  try {

    const deletedmessage = await prisma.message.delete({
      where: {
        id: messageId,
      },
    });
    console.log("Deteted message:", deletedmessage);
    res.status(200).json({
      message: "message deleted",
      deletedmessage
    });
  } catch (err) {
    if (err.code === 'P2025') {
      res.status(404).json({ error: "User not found" });
    } else {
      res.status(500).json({ error: "Something went wrong" });
    }
  }
  
});

messageRouter.get("/all", async (req, res) => {
  const result = await prisma.message.findMany();
  res.json({ result });
});

messageRouter.get("/:messageid", async (req, res) => {
  const messageId = req.params.messageid;

  const result = await prisma.message.findUnique({
    where: {
      id: messageId,
    },
  });

  res.json(result);
});

messageRouter.get("/fromuser/:userid", async (req, res) => {
  const userId = req.params.userid;

  const result = await prisma.message.findMany({
    where: {
      senderId: userId,
    },
  });

  res.json(result);
});


messageRouter.get("/inchatroom/:chatroomid", async (req, res) => {
  const chatroomId = req.params.chatroomid;

  const result = await prisma.message.findMany({
    where: {
      chatroomId: chatroomId,
    },
  });

  res.json(result);
});

export default messageRouter;
