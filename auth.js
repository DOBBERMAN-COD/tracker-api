const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const { AuthenticationError } = require("apollo-server-express");
const cors = require("cors");

let { JWT_SECRET } = process.env;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV !== "production") {
    JWT_SECRET = "tempjwtsecretfordevonly";
    console.log("Missing env var JWT_SECRET. Using unsafe dev secret");
  } else {
    console.log("Missing env var JWT_SECRET. Authentication disabled");
  }
}

const routes = express.Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

routes.use(express.json());
const origin = process.env.UI_SERVER_ORIGIN || "http://localhost:8000";
routes.use(cors({ origin, credentials: true }));

function getUser(req) {
  const token = req.cookies.jwt;

  if (!token || !JWT_SECRET) {
    return {
      signedIn: false,
    };
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return {
      signedIn: false,
    };
  }
}

routes.post("/signin", async (req, res) => {
  if (!JWT_SECRET) {
    return res.status(500).json({
      message: "Missing JWT_SECRET. Refusing to authenticate.",
    });
  }

  const googleToken = req.body.google_token;

  if (!googleToken) {
    return res.status(400).json({
      message: "Missing Google credential.",
    });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const credentials = {
      signedIn: true,
      givenName: payload.given_name,
      name: payload.name,
      email: payload.email,
    };

    const token = jwt.sign(credentials, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("jwt", token, {
      httpOnly: true,
      domain: process.env.COOKIE_DOMAIN,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 1000,
    });

    return res.json(credentials);
  } catch (error) {
    return res.status(401).json({
      message: "Invalid Google credential.",
    });
  }
});

routes.post("/signout", (req, res) => {
  res.clearCookie("jwt", {
    domain: process.env.COOKIE_DOMAIN,
  });

  res.json({
    status: "ok",
  });
});

routes.post("/user", (req, res) => {
  res.json(getUser(req));
});

function mustBeSignedIn(resolver) {
  return (root, args, context, info) => {
    const { user } = context;

    if (!user || !user.signedIn) {
      throw new AuthenticationError("You must be signed in");
    }

    return resolver(root, args, context, info);
  };
}

function resolveUser(_, args, { user }) {
  return user;
}

module.exports = {
  routes,
  getUser,
  mustBeSignedIn,
  resolveUser,
};
