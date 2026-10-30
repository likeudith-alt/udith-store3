import crypto from "node:crypto";
import { dataStore, json } from "../lib/common.mjs";

const store = () => dataStore();

const secret = () => process.env.SESSION_SECRET || "";

function tokenFor(user) {
  if (!secret()) {
    throw new Error("SESSION_SECRET is not configured.");
  }

  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      username: user.username,
      type: "player",
      exp: Date.now() + 30 * 86400e3
    })
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", secret())
    .update(payload)
    .digest("base64url");

  return payload + "." + signature;
}

function readToken(req) {
  if (!secret()) return null;

  const token = (req.headers.get("authorization") || "")
    .replace(/^Bearer\s+/i, "");

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = crypto
    .createHmac("sha256", secret())
    .update(payload)
    .digest("base64url");

  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString()
    );

    if (
      data.type !== "player" ||
      typeof data.sub !== "string" ||
      typeof data.exp !== "number" ||
      data.exp <= Date.now()
    ) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

const cleanName = (value) =>
  String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_. -]/g, "")
    .slice(0, 32);

const hashPass = (password, salt) =>
  crypto.scryptSync(String(password), salt, 64).toString("hex");

async function read(key, fallback) {
  return (
    (await store().get(key, { type: "json" }).catch(() => null)) ||
    fallback
  );
}

export default async (req) => {
  if (!secret()) {
    return json(
      { error: "Server authentication is not configured." },
      500
    );
  }

  if (req.method === "GET") {
    const auth = readToken(req);

    if (!auth) {
      return json({ error: "Please log in again." }, 401);
    }

    const users = await read("free-likes-users", []);
    const user = users.find((item) => item.id === auth.sub);

    if (!user) {
      return json(
        { error: "Account not found. Please log in again." },
        401
      );
    }

    const all = await read("free-likes-requests", []);

    return json({
      requests: all
        .filter((item) => item.userId === user.id)
        .map(({ userId, ...item }) => item)
        .sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt)
        )
    });
  }

  if (req.method !== "POST") {
    return json({ error: "POST only" }, 405);
  }

  let body;

  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid data" }, 400);
  }

  const action = String(body.action || "");

  try {
    const users = await read("free-likes-users", []);

    // Only registration and login are allowed.
    // Quick Mode has been completely removed.
    if (action === "register" || action === "login") {
      const username = cleanName(body.username);
      const password = String(body.password || "");

      if (username.length < 3) {
        return json(
          { error: "Username must be at least 3 characters." },
          400
        );
      }

      if (password.length < 10 || password.length > 128) {
        return json(
          { error: "Password must be between 10 and 128 characters." },
          400
        );
      }

      let user = users.find(
        (item) =>
          item.username.toLowerCase() === username.toLowerCase()
      );

      if (action === "register") {
        if (user) {
          return json(
            {
              error:
                "That username is already used. Log in or choose another."
            },
            409
          );
        }

        const salt = crypto.randomBytes(16).toString("hex");

        user = {
          id: crypto.randomUUID(),
          username,
          salt,
          passwordHash: hashPass(password, salt),
          createdAt: new Date().toISOString()
        };

        users.push(user);
        await store().setJSON("free-likes-users", users);
      } else {
        if (
          !user ||
          hashPass(password, user.salt) !== user.passwordHash
        ) {
          return json(
            { error: "Wrong username or password." },
            401
          );
        }
      }

      return json({
        token: tokenFor(user),
        username: user.username
      });
    }

    const auth = readToken(req);

    if (!auth) {
      return json({ error: "Please log in again." }, 401);
    }

    const user = users.find((item) => item.id === auth.sub);

    if (!user) {
      return json(
        { error: "Account not found. Please log in again." },
        401
      );
    }

    if (action === "submit") {
      const uid = String(body.gameUid || "")
        .replace(/\D/g, "")
        .slice(0, 20);

      if (uid.length < 5) {
        return json(
          {
            error:
              "Enter a valid Free Fire UID (at least 5 digits)."
          },
          400
        );
      }

      const all = await read("free-likes-requests", []);

      const recent = all.filter((item) => {
        const age = Date.now() - Date.parse(item.createdAt);

        return (
          item.userId === user.id &&
          Number.isFinite(age) &&
          age >= 0 &&
          age < 24 * 3600e3
        );
      });

      if (recent.length >= 3) {
        return json(
          { error: "You can submit up to 3 requests in 24 hours." },
          429
        );
      }

      const now = new Date().toISOString();

      const request = {
        id:
          "FL-" +
          crypto.randomBytes(4).toString("hex").toUpperCase(),
        userId: user.id,
        username: user.username,
        gameUid: uid,
        status: "Pending",
        notification: "Your Free Likes request was received.",
        createdAt: now,
        updatedAt: now
      };

      all.unshift(request);

      await store().setJSON(
        "free-likes-requests",
        all.slice(0, 5000)
      );

      return json({
        ok: true,
        request: {
          id: request.id,
          gameUid: request.gameUid,
          status: request.status,
          notification: request.notification,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt
        }
      });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error("free likes error", error);

    return json(
      {
        error:
          "Could not process the request. Please try again."
      },
      500
    );
  }
};

export const config = {
  path: "/api/free-likes"
};
