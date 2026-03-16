import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { container } from "../shared/cosmosClient.js";

const MAX_PAYLOAD_BYTES = 102400; // 100KB

async function handler(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  const name = request.params.name?.toLowerCase().trim();
  if (!name) {
    return { status: 400, jsonBody: { error: "Profile name is required" } };
  }

  const bodyText = await request.text();
  if (bodyText.length > MAX_PAYLOAD_BYTES) {
    return { status: 413, jsonBody: { error: "Payload too large (max 100KB)" } };
  }

  let body: { profile?: Record<string, unknown>; versions?: unknown[] };
  try {
    body = JSON.parse(bodyText);
  } catch {
    return { status: 400, jsonBody: { error: "Invalid JSON" } };
  }

  if (!body.profile || typeof body.profile !== "object") {
    return { status: 400, jsonBody: { error: "Missing or invalid profile data" } };
  }

  const updatedAt = new Date().toISOString();
  await container.items.upsert({
    id: name,
    name,
    profile: body.profile,
    versions: body.versions ?? [],
    updatedAt,
  });

  return { status: 200, jsonBody: { ok: true, updatedAt } };
}

app.http("putProfile", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "profile/{name}",
  handler,
});
