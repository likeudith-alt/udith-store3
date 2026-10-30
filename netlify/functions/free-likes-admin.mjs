import { dataStore, json, isAdmin } from "../lib/common.mjs";

export default async (req) => {
  if (!isAdmin(req)) {
    return json({ error: "Admin login required" }, 401);
  }

  const store = dataStore();

  if (req.method === "GET") {
    try {
      const requests =
        (await store
          .get("free-likes-requests", { type: "json" })
          .catch(() => [])) || [];

      return json({ requests });
    } catch (error) {
      console.error("Could not load Free Likes requests", error);

      return json(
        { error: "Could not load requests" },
        500
      );
    }
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

  const id = String(body.id || "");
  const status = String(body.status || "");

  const allowedStatuses = [
    "Pending",
    "Processing",
    "Like Done"
  ];

  if (!id || !allowedStatuses.includes(status)) {
    return json(
      { error: "Invalid request or status" },
      400
    );
  }

  try {
    const requests =
      (await store
        .get("free-likes-requests", { type: "json" })
        .catch(() => [])) || [];

    const request = requests.find(
      (item) => item.id === id
    );

    if (!request) {
      return json(
        { error: "Request not found" },
        404
      );
    }

    request.status = status;

    if (status === "Like Done") {
      request.notification =
        "Success! Your Free Likes have been delivered. Thank you for using UDITH FF STORE!";
    } else if (status === "Processing") {
      request.notification =
        "Your Free Likes request is being processed.";
    } else {
      request.notification =
        "Your Free Likes request is waiting for processing.";
    }

    request.updatedAt = new Date().toISOString();

    await store.setJSON(
      "free-likes-requests",
      requests
    );

    return json({
      ok: true,
      request
    });
  } catch (error) {
    console.error("Free Likes admin error", error);

    return json(
      { error: "Could not update request" },
      500
    );
  }
};

export const config = {
  path: "/api/free-likes-admin"
};
