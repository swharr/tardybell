import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { container } from "../shared/cosmosClient.js";

async function handler(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  const name = request.params.name?.toLowerCase().trim();
  if (!name) {
    return { status: 400, jsonBody: { error: "Profile name is required" } };
  }

  try {
    await container.item(name, name).delete();
  } catch (e: unknown) {
    const err = e as { code?: number };
    if (err.code !== 404) throw e;
    // Already deleted or never existed — that's fine
  }

  return { status: 200, jsonBody: { ok: true } };
}

app.http("deleteProfile", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "profile/{name}",
  handler,
});
