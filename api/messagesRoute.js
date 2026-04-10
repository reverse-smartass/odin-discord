// ============================================================
// messagesRoute.js — updated: include sender in GET responses
// so the chat room can display names without extra fetches
// ============================================================

import { Router } from "express";
import prisma from "../lib/prisma.ts";
import { body, validationResult } from "express-validator";
import passport from "passport";

const messageRouter = Router();

// ── Middleware: sender must be in the chatroom ─────────────────
const userInChatroom = async (req, res, next) => {
  const chatroomId = req.body.chatroomId || req.params.chatroomid;
  if (!chatroomId) return res.status(400).json({ error: "chatroomId required" });
  try {
    const count = await prisma.chatroom.count({
      where: { id: chatroomId, users: { some: { id: req.user.id } } },
    });
    if (count === 0)
      return res.status(403).json({ error: "You are not a member of this chatroom." });
    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ── Middleware: message must belong to requesting user ─────────
const isFromUser = async (req, res, next) => {
  try {
    const message = await prisma.message.findUnique({ where: { id: req.params.messageid } });
    if (!message) return res.status(404).json({ error: "Message not found" });
    if (message.senderId !== req.user.id)
      return res.status(403).json({ error: "You are not authorized to edit this message." });
    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const validatemessage = [
  body("text_content").trim().notEmpty().withMessage("Message content is required").escape(),
];

const senderSelect = {
  select: { id: true, displayName: true, identifier: true },
};

// ── POST /new ─────────────────────────────────────────────────
messageRouter.post(
  "/new",
  passport.authenticate("jwt", { session: false }),
  userInChatroom,
  validatemessage,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.json({ errors: errors.array(), previousData: req.body });

    const { text_content, chatroomId } = req.body;
    try {
      const message = await prisma.message.create({
        data: { content: text_content, senderId: req.user.id, chatroomId },
        include: { sender: senderSelect },
      });
      res.status(201).json({ message: "message created", msg: message });
    } catch (err) { return next(err); }
  },
);

// ── PATCH /:messageid/editmessage ─────────────────────────────
messageRouter.patch(
  "/:messageid/editmessage",
  passport.authenticate("jwt", { session: false }),
  validatemessage,
  isFromUser,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.json({ errors: errors.array(), previousData: req.body });

    try {
      const updatedmessage = await prisma.message.update({
        where: { id: req.params.messageid },
        data: { content: req.body.text_content, edited: true },
        include: { sender: senderSelect },
      });
      res.status(200).json({ message: "message updated", updatedmessage });
    } catch (err) { return next(err); }
  },
);

// ── DELETE /:messageid/delete ─────────────────────────────────
messageRouter.delete(
  "/:messageid/delete",
  passport.authenticate("jwt", { session: false }),
  isFromUser,
  async (req, res, next) => {
    try {
      const deletedmessage = await prisma.message.delete({ where: { id: req.params.messageid } });
      res.status(200).json({ message: "message deleted", deletedmessage });
    } catch (err) {
      if (err.code === "P2025") return res.status(404).json({ error: "Message not found" });
      return next(err);
    }
  },
);

// ── GET /inchatroom/:chatroomid ───────────────────────────────
messageRouter.get(
  "/inchatroom/:chatroomid",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const result = await prisma.message.findMany({
      where: { chatroomId: req.params.chatroomid },
      include: { sender: senderSelect },
      orderBy: { createdAt: "asc" },
    });
    res.json(result);
  },
);

// ── GET /all ──────────────────────────────────────────────────
messageRouter.get(
  "/all",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const result = await prisma.message.findMany({
      include: { sender: senderSelect },
      orderBy: { createdAt: "asc" },
    });
    res.json({ result });
  },
);

// ── GET /:messageid ───────────────────────────────────────────
messageRouter.get(
  "/:messageid",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const result = await prisma.message.findUnique({
      where: { id: req.params.messageid },
      include: { sender: senderSelect },
    });
    res.json(result);
  },
);

// ── GET /fromuser/:userid ─────────────────────────────────────
messageRouter.get(
  "/fromuser/:userid",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const result = await prisma.message.findMany({
      where: { senderId: req.params.userid },
      include: { sender: senderSelect },
      orderBy: { createdAt: "asc" },
    });
    res.json(result);
  },
);

export default messageRouter;
