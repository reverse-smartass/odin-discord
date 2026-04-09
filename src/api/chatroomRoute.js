import { Router } from "express";
import prisma from "../../lib/prisma.ts";
import { body, validationResult } from "express-validator";
import passport from "passport";
const chatroomRouter = Router();


const validateChatroom = [
  body("name")
    .trim()
    .notEmpty()
    .withchatroom("Chatroom name cannot be empty")
    .isLength({ min: 3, max: 32 })
    .withchatroom("Name must be between 3 and 32 characters")
    .escape()
];

const isChatroomOwner = async (req, res, next) => {

  const chatroomId = req.params.chatroomid;

  try {
    const chatroom = await prisma.chatroom.findUnique({
      where: {
        id: chatroomId,
      },
    });

    if (!chatroom) {
      return res.status(404).json({ error: "Chatroom not found" });
    }

    if (chatroom.ownerId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You are not authorized to edit this chatroom." });
    }
    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


chatroomRouter.post("/new", passport.authenticate("jwt", { session: false }), validateChatroom,
  async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({
      errors: errors.array(),
      previousData: req.body,
    });
  }

  const {displayName, users} = req.body;
  

  try {

    const chatroom = await prisma.chatroom.create({
      data: {
        name: displayName,
        users: {
          connect: users.map((userId) => ({ id: userId })),
        },
      }
    });
    console.log("Created chatroom:", chatroom);
    res.status(201).json({
      chatroom: "chatroom created",
      user: { id: chatroom.id, title: chatroom.title, content: chatroom.content},
    });
  } catch (err) {
    return next(err);
  }
  
});

chatroomRouter.patch("/:id/edit", passport.authenticate("jwt", { session: false }), validateChatroom, isChatroomOwner, 
  async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({
      errors: errors.array(),
      previousData: req.body,
    });
  }

  const chatroomId = req.params.id;
  const {displayName, users} = req.body;
  

  try {

    const updatedchatroom = await prisma.chatroom.update({
      where: {
        id: chatroomId,
      },
      data: {
        name: displayName,
        users: {
          connect: users.map((userId) => ({ id: userId })),
        },
      }
    });
    console.log("Updated chatroom:", updatedchatroom);
    res.status(200).json({
      chatroom: "chatroom updated",
      updatedchatroom
    });
  } catch (err) {
    return next(err);
  }
  
});

chatroomRouter.delete("/:chatroomid/delete", passport.authenticate("jwt", { session: false }), isChatroomOwner, 
  async (req, res, next) => {

  const chatroomId = req.params.chatroomid;

  try {

    const deletedchatroom = await prisma.chatroom.delete({
      where: {
        id: chatroomId,
      },
    });
    console.log("Deteted chatroom:", deletedchatroom);
    res.status(200).json({
      chatroom: "chatroom deleted",
      deletedchatroom
    });
  } catch (err) {
    if (err.code === 'P2025') {
      res.status(404).json({ error: "User not found" });
    } else {
      res.status(500).json({ error: "Something went wrong" });
    }
  }
  
});

chatroomRouter.get("/", async (req, res) => {
  const result = await prisma.chatroom.findMany();
  res.json({ result });
});

chatroomRouter.get("/:chatroomid", async (req, res) => {
  const chatroomId = req.params.chatroomid;

  const result = await prisma.chatroom.findUnique({
    where: {
      id: chatroomId,
    },
  });

  res.json(result);
});

chatroomRouter.get("/:chatroomid/users", async (req, res) => {
  const chatroomId = req.params.chatroomid;

  const result = await prisma.user.findMany({
    where: {
      chatrooms: {
        some: {
          id: chatroomId,
        }
      }
    }
  });

  res.json(result);
});


export default chatroomRouter;
