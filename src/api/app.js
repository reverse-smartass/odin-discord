import express from "express";
import jwt from "jsonwebtoken";
import prisma from "../../lib/prisma.ts";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import signupRouter from "./signupRoute.js";
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import messageRouter from "./messagesRoute.js";


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/sign-up", signupRouter);
app.use("/message", messageRouter);

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { email: username },
      });

      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return done(null, false, { message: "Incorrect password" });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }),
);

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || "a safe secret",
};

passport.use(
  new JwtStrategy(options, async (jwt_payload, done) => {
    console.log("JWT Payload received:", jwt_payload);
    try {
      // The 'jwt_payload' contains whatever you put in jwt.sign()
      const user = await prisma.user.findUnique({ where: { id: jwt_payload.id } });
      
      if (user) return done(null, user);
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  })
);

app.use(passport.initialize());

app.get("/users", async (req, res) => {
  const result = await prisma.user.findMany();
  res.json({ result });
});

app.get("/users/:userid", async (req, res) => {
  const userId = req.params.userid;

  const result = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  res.json(result);
});

app.get("/users/:userid/comments", async (req, res) => {
  const userId = req.params.userid;

  const result = await prisma.comment.findMany({
    where: {
      id: userId,
    },
  });

  res.json(result);
});

app.post("/login", (req, res, next) => {
  passport.authenticate(
    "local",
    {
      session: false,
    },
    (err, user, info) => {
      if (err) return next(err);

      if (!user) {
        return res
          .status(401)
          .json({ message: info ? info.message : "Login failed" });
      }

      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || "secretkey",
        { expiresIn: "1d" },
      );

      return res.status(200).json({
        message: "Logged in successfully",
        user: { id: user.id, email: user.email, identifier: user.identifier }, // Send non-sensitive info
        token,
      });
    },
  )(req, res, next);
});

export function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];

  if (typeof bearerHeader !== undefined) {
    const header = bearerHeader.split(" ");

    const token = header[1];

    res.token = token;

    jwt.verify(token, "secretkey", async (err, authData) => {
      if (err) return res.status(403);

      const user = await prisma.user.findUnique({
        where: { id: authData.user },
      });
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(403);
  }
}

app.listen(5000, (error) => {
  if (error) {
    throw error;
  }
  console.log("app listening on port 5000!");
});
