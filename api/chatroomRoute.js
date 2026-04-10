// ============================================================
// chatroomRoute.js — updated: GET / now includes users so the
// sidebar can filter rooms the current user belongs to
// ============================================================

import { Router } from "express";
import prisma from "../lib/prisma.ts";
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
    const chatroom = await prisma.chatroom.findUnique({ where: { id: chatroomId } });
    if (!chatroom) return res.status(404).json({ error: "Chatroom not found" });
    if (chatroom.ownerId !== req.user.id)
      return res.status(403).json({ error: "You are not authorized to edit this chatroom." });
    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ── POST /new ─────────────────────────────────────────────────
chatroomRouter.post(
  "/new",
  passport.authenticate("jwt", { session: false }),
  validateChatroom,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.json({ errors: errors.array(), previousData: req.body });

    const { displayName, users } = req.body;
    try {
      const chatroom = await prisma.chatroom.create({
        data: {
          name: displayName,
          users: { connect: users.map((id) => ({ id })) },
          ownerId: req.user.id,
        },
        include: {
          users: { select: { id: true, displayName: true, identifier: true } },
        },
      });
      res.status(201).json({ message: "chatroom created", chatroom: { id: chatroom.id, name: chatroom.name } });
    } catch (err) { return next(err); }
  },
);

// ── PATCH /:chatroomid/edit ───────────────────────────────────
chatroomRouter.patch(
  "/:chatroomid/edit",
  passport.authenticate("jwt", { session: false }),
  validateChatroom,
  isChatroomOwner,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.json({ errors: errors.array(), previousData: req.body });

    const { displayName, users } = req.body;
    try {
      const updatedchatroom = await prisma.chatroom.update({
        where: { id: req.params.chatroomid },
        data: {
          name: displayName,
          users: { set: users.map((id) => ({ id })) },
        },
        include: { users: { select: { id: true, displayName: true, identifier: true } } },
      });
      res.status(200).json({ chatroom: "chatroom updated", updatedchatroom });
    } catch (err) { return next(err); }
  },
);

// ── PATCH /:chatroomid/adduser/:userid ────────────────────────
chatroomRouter.patch(
  "/:chatroomid/adduser/:userid",
  passport.authenticate("jwt", { session: false }),
  isChatroomOwner,
  async (req, res, next) => {
    const { chatroomid, userid } = req.params;
    try {
      const newUser = await prisma.user.findUnique({ where: { id: userid } });
      if (!newUser) return res.status(404).json({ error: "User not found" });

      const updatedchatroom = await prisma.chatroom.update({
        where: { id: chatroomid },
        data: { users: { connect: { id: userid } } },
        include: { users: { select: { id: true, displayName: true, identifier: true } } },
      });
      res.status(200).json({ message: "chatroom updated", updatedchatroom });
    } catch (err) { return next(err); }
  },
);

// ── PATCH /:chatroomid/removeuser/:userid ─────────────────────
chatroomRouter.patch(
  "/:chatroomid/removeuser/:userid",
  passport.authenticate("jwt", { session: false }),
  isChatroomOwner,
  async (req, res, next) => {
    const { chatroomid, userid } = req.params;
    try {
      const updatedchatroom = await prisma.chatroom.update({
        where: { id: chatroomid },
        data: { users: { disconnect: { id: userid } } },
        include: { users: { select: { id: true, displayName: true, identifier: true } } },
      });
      res.status(200).json({ message: "chatroom updated", updatedchatroom });
    } catch (err) { return next(err); }
  },
);

// ── DELETE /:chatroomid/delete ────────────────────────────────
chatroomRouter.delete(
  "/:chatroomid/delete",
  passport.authenticate("jwt", { session: false }),
  isChatroomOwner,
  async (req, res, next) => {
    try {
      const deletedchatroom = await prisma.chatroom.delete({ where: { id: req.params.chatroomid } });
      res.status(200).json({ chatroom: "chatroom deleted", deletedchatroom });
    } catch (err) {
      if (err.code === "P2025") return res.status(404).json({ error: "Chatroom not found" });
      return next(err);
    }
  },
);

// ── GET / — include users so client can filter membership ─────
chatroomRouter.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const result = await prisma.chatroom.findMany({
      include: {
        users: { select: { id: true, displayName: true, identifier: true } },
      },
    });
    res.json({ result });
  },
);

// ── GET /:chatroomid ──────────────────────────────────────────
chatroomRouter.get(
  "/:chatroomid",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const result = await prisma.chatroom.findUnique({
      where: { id: req.params.chatroomid },
      include: {
        users: { select: { id: true, displayName: true, identifier: true } },
      },
    });
    res.json(result);
  },
);

// ── GET /:chatroomid/users ────────────────────────────────────
chatroomRouter.get(
  "/:chatroomid/users",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const result = await prisma.user.findMany({
      where: { chatrooms: { some: { id: req.params.chatroomid } } },
    });
    res.json(result);
  },
);

export default chatroomRouter;
