import { Router } from "express";
import prisma from "../lib/prisma.ts";
import { body, validationResult } from "express-validator";
import passport from "passport";
import bcrypt from "bcryptjs";
const userRouter = Router();

const validateuser = [
  body("identifier")
    .trim()
    .notEmpty()
    .withMessage("Identifier is required")
    .escape(),
  body("displayName")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .escape(),
  body("email")
    .trim()
    .isEmail()
    .withMessage("email must be a valid email")
    .normalizeEmail(),
];

const isOwner = async (req, res, next) => {
  if (req.user.id !== req.params.userid) {
    return res
      .status(403)
      .json({ error: "You are not authorized to edit this user." });
  }
  next();
};

userRouter.patch(
  "/:userid/edituser",
  passport.authenticate("jwt", { session: false }),
  isOwner,
  validateuser,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({
        errors: errors.array(),
        previousData: req.body,
      });
    }

    const userId = req.params.userid;
    const { displayName, identifier, email } = req.body;

    try {
      const updateduser = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          displayName,
          identifier,
          email,
        },
      });
      console.log("Updated user:", updateduser);
      res.status(200).json({
        user: "user updated",
        updateduser,
      });
    } catch (err) {
      return next(err);
    }
  },
);

const validateNewPassword = [
  // Custom validator to check if passwords match
  body("old_password").custom(async (value, { req, res }) => {
    if (req.user.id !== req.params.userid) {
      return res
        .status(403)
        .json({ error: "You are not authorized to edit this user." });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.params.userid },
    });
    const compare = await bcrypt.compare(value, user.password);

    if (!compare) {
      throw new Error("Old password is incorrect");
    }
    return true;
  }),
  body("new_password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

userRouter.patch(
  "/:userid/editpassword",
  passport.authenticate("jwt", { session: false }),
  isOwner,
  validateNewPassword,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({
        errors: errors.array(),
        previousData: req.body,
      });
    }

    const userId = req.params.userid;
    const { new_password } = req.body;

    try {
      const updateduser = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          password: await bcrypt.hash(new_password, 10),
        },
      });
      console.log("Updated user:", updateduser);
      res.status(200).json({
        user: "user updated",
        updateduser,
      });
    } catch (err) {
      return next(err);
    }
  },
);

userRouter.delete(
  "/:userid/delete",
  passport.authenticate("jwt", { session: false }),
  isOwner,
  async (req, res, next) => {
    const userId = req.params.userid;

    try {
      const deleteduser = await prisma.user.delete({
        where: {
          id: userId,
        },
      });
      console.log("Deteted user:", deleteduser);
      res.status(200).json({
        user: "user deleted",
        deleteduser,
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

userRouter.get("/",  passport.authenticate("jwt", { session: false }), async (req, res) => {
  const result = await prisma.user.findMany();
  res.json({ result });
});

userRouter.get("/:userid",  passport.authenticate("jwt", { session: false }), async (req, res) => {
  const userId = req.params.userid;

  const result = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  res.json(result);
});

export default userRouter;
