// ============================================================
// friendRoute.js — friend request CRUD
// ============================================================

import { Router } from "express";
import prisma from "../lib/prisma.ts";
import passport from "passport";

const friendRouter = Router();

// ── Search users by identifier ────────────────────────────────
friendRouter.get(
  "/search",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);

    try {
      const users = await prisma.user.findMany({
        where: {
          identifier: { contains: q, mode: "insensitive" },
          NOT: { id: req.user.id },
        },
        select: { id: true, identifier: true, displayName: true },
        take: 20,
      });
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// ── List accepted friends ─────────────────────────────────────
friendRouter.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const requests = await prisma.friendRequest.findMany({
        where: {
          status: "ACCEPTED",
          OR: [{ senderId: req.user.id }, { receiverId: req.user.id }],
        },
        include: {
          sender: { select: { id: true, identifier: true, displayName: true } },
          receiver: { select: { id: true, identifier: true, displayName: true } },
        },
      });

      // Return the "other" user from each accepted request
      const friends = requests.map((r) =>
        r.senderId === req.user.id ? r.receiver : r.sender,
      );
      res.json(friends);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// ── List pending incoming requests ────────────────────────────
friendRouter.get(
  "/pending",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const requests = await prisma.friendRequest.findMany({
        where: { receiverId: req.user.id, status: "PENDING" },
        include: {
          sender: { select: { id: true, identifier: true, displayName: true } },
        },
      });
      res.json(requests);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// ── Send a friend request ─────────────────────────────────────
friendRouter.post(
  "/request/:userid",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const receiverId = req.params.userid;

    if (receiverId === req.user.id) {
      return res.status(400).json({ error: "Cannot friend yourself." });
    }

    try {
      // Check if a request already exists in either direction
      const existing = await prisma.friendRequest.findFirst({
        where: {
          OR: [
            { senderId: req.user.id, receiverId },
            { senderId: receiverId, receiverId: req.user.id },
          ],
        },
      });

      if (existing) {
        return res.status(409).json({ error: "Request already exists.", existing });
      }

      const request = await prisma.friendRequest.create({
        data: { senderId: req.user.id, receiverId },
      });
      res.status(201).json(request);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// ── Accept a friend request ───────────────────────────────────
friendRouter.patch(
  "/accept/:requestid",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const request = await prisma.friendRequest.findUnique({
        where: { id: req.params.requestid },
      });

      if (!request || request.receiverId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized." });
      }

      const updated = await prisma.friendRequest.update({
        where: { id: req.params.requestid },
        data: { status: "ACCEPTED" },
      });

      // Auto-create a DM chatroom between the two users
      const existing = await prisma.chatroom.findFirst({
        where: {
          isDirect: true,
          AND: [
            { users: { some: { id: request.senderId } } },
            { users: { some: { id: request.receiverId } } },
          ],
        },
      });

      if (!existing) {
        await prisma.chatroom.create({
          data: {
            isDirect: true,
            ownerId: req.user.id,
            users: {
              connect: [{ id: request.senderId }, { id: request.receiverId }],
            },
          },
        });
      }

      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// ── Reject / delete a friend request ─────────────────────────
friendRouter.patch(
  "/reject/:requestid",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const request = await prisma.friendRequest.findUnique({
        where: { id: req.params.requestid },
      });

      if (!request || request.receiverId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized." });
      }

      const updated = await prisma.friendRequest.update({
        where: { id: req.params.requestid },
        data: { status: "REJECTED" },
      });

      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

export default friendRouter;
