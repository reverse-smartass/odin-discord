import { Router } from "express";
import prisma from "../../lib/prisma.ts";
import { body, validationResult } from "express-validator";
import passport from "passport";
const chatroomRouter = Router();

const validateChatroom = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Chatroom name cannot be empty")
    .isLength({ min: 3, max: 32 })
    .withMessage("Name must be between 3 and 32 characters")
    .escape(),
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

chatroomRouter.post(
  "/new",
  passport.authenticate("jwt", { session: false }),
  validateChatroom,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({
        errors: errors.array(),
        previousData: req.body,
      });
    }

    const { displayName, users } = req.body;

    try {
      const chatroom = await prisma.chatroom.create({
        data: {
          name: displayName,
          users: {
            connect: users.map((userId) => ({ id: userId })),
          },
          ownerId: req.user.id,
        },
        include: {
          users: {
            select: {
              id: true,
              displayName: true,
              identifier: true,
            },
          },
        },
      });
      console.log("Created chatroom:", chatroom);
      res.status(201).json({
        message: "chatroom created",
        chatroom: { id: chatroom.id, name: chatroom.name },
      });
    } catch (err) {
      return next(err);
    }
  },
);

chatroomRouter.patch(
  "/:chatroomid/edit",
  passport.authenticate("jwt", { session: false }),
  validateChatroom,
  isChatroomOwner,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({
        errors: errors.array(),
        previousData: req.body,
      });
    }

    const chatroomId = req.params.chatroomid;
    const { displayName, users } = req.body;

    try {
      const updatedchatroom = await prisma.chatroom.update({
        where: {
          id: chatroomId,
        },
        data: {
          name: displayName,
          users: {
            set: users.map((userId) => ({ id: userId })),
          },
        },
        include: {
          users: {
            select: {
              id: true,
              displayName: true,
              identifier: true,
            },
          },
        },
      });
      console.log("Updated chatroom:", updatedchatroom);
      res.status(200).json({
        chatroom: "chatroom updated",
        updatedchatroom,
      });
    } catch (err) {
      return next(err);
    }
  },
);

chatroomRouter.patch(
  "/:chatroomid/adduser/:userid",
  passport.authenticate("jwt", { session: false }),
  isChatroomOwner,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({
        errors: errors.array(),
        previousData: req.body,
      });
    }

    const chatroomId = req.params.chatroomid;
    const userId = req.params.userid;

    try {
      const newUser = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!newUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const updatedchatroom = await prisma.chatroom.update({
        where: {
          id: chatroomId,
        },
        data: {
          users: {
            connect: newUser ? { id: newUser.id } : undefined,
          },
        },
        include: {
          users: {
            select: {
              id: true,
              displayName: true,
              identifier: true,
            },
          },
        },
      });
      console.log("Updated chatroom:", updatedchatroom);
      res.status(200).json({
        message: "chatroom updated",
        updatedchatroom,
      });
    } catch (err) {
      return next(err);
    }
  },
);

chatroomRouter.patch(
  "/:chatroomid/removeuser/:userid",
  passport.authenticate("jwt", { session: false }),
  isChatroomOwner,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({
        errors: errors.array(),
        previousData: req.body,
      });
    }

    const chatroomId = req.params.chatroomid;
    const userId = req.params.userid;

    try {
      const currentUsers = await prisma.user.findMany({
        where: {
          chatrooms: {
            some: {
              id: chatroomId,
            },
          },
        },
      });

      const updatedUsers = currentUsers
        .filter((user) => user.id !== userId)
        .map((user) => ({ id: user.id }));

      const updatedchatroom = await prisma.chatroom.update({
        where: {
          id: chatroomId,
        },
        data: {
          users: {
            set: updatedUsers,
          },
        },
        include: {
          users: {
            select: {
              id: true,
              displayName: true,
              identifier: true,
            },
          },
        },
      });
      console.log("Updated chatroom:", updatedchatroom);
      res.status(200).json({
        message: "chatroom updated",
        updatedchatroom,
      });
    } catch (err) {
      return next(err);
    }
  },
);

chatroomRouter.delete(
  "/:chatroomid/delete",
  passport.authenticate("jwt", { session: false }),
  isChatroomOwner,
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
        deletedchatroom,
      });
    } catch (err) {
      if (err.code === "P2025") {
        res.status(404).json({ error: "User not found" });
      } else {
        res.status(500).json({ error: "Something went wrong" });
      }
    }
  },
);

chatroomRouter.get("/",  passport.authenticate("jwt", { session: false }), async (req, res) => {
  const result = await prisma.chatroom.findMany();
  res.json({ result });
});

chatroomRouter.get("/:chatroomid",  passport.authenticate("jwt", { session: false }), async (req, res) => {
  const chatroomId = req.params.chatroomid;

  const result = await prisma.chatroom.findUnique({
    where: {
      id: chatroomId,
    },
  });

  res.json(result);
});

chatroomRouter.get("/:chatroomid/users",  passport.authenticate("jwt", { session: false }), async (req, res) => {
  const chatroomId = req.params.chatroomid;

  const result = await prisma.user.findMany({
    where: {
      chatrooms: {
        some: {
          id: chatroomId,
        },
      },
    },
  });

  res.json(result);
});

export default chatroomRouter;
