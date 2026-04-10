// ============================================================
// app.js — main server entry point
// ============================================================

import express from "express";
import jwt from "jsonwebtoken";
import cors from "cors";
import prisma from "../lib/prisma.ts";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";

import messageRouter from "./messagesRoute.js";
import userRouter from "./userRoute.js";
import chatroomRouter from "./chatroomRoute.js";
import signupRouter from "./signupRoute.js";
import friendRouter from "./friendRoute.js";

const app = express();


const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', process.env.CLIENT_ORIGIN];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true // Crucial if you are using Cookies/Sessions
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Passport strategies ───────────────────────────────────────

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { email: username } });
      if (!user) return done(null, false, { message: "Incorrect username" });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return done(null, false, { message: "Incorrect password" });

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }),
);

const JWT_SECRET = process.env.JWT_SECRET || "a safe secret";

passport.use(
  new JwtStrategy(
    { jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), secretOrKey: JWT_SECRET },
    async (jwt_payload, done) => {
      try {
        const user = await prisma.user.findUnique({ where: { id: jwt_payload.id } });
        if (user) return done(null, user);
        return done(null, false);
      } catch (error) {
        return done(error, false);
      }
    },
  ),
);

app.use(passport.initialize());

// ── Routes ────────────────────────────────────────────────────

app.use("/sign-up", signupRouter);
app.use("/message", messageRouter);
app.use("/user", userRouter);
app.use("/chatroom", chatroomRouter);
app.use("/friend", friendRouter);

app.post("/login", (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ message: info ? info.message : "Login failed" });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1d" });

    return res.status(200).json({
      message: "Logged in successfully",
      user: {
        id: user.id,
        email: user.email,
        identifier: user.identifier,
        displayName: user.displayName,
      },
      token,
    });
  })(req, res, next);
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(5000, () => console.log("Server listening on port 5000"));
