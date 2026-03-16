import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { container } from "../shared/cosmosClient.js";

async function handler(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  const name = request.params.name?.toLowerCase().trim();
  if (!name) {
    return { status: 400, jsonBody: { error: "Profile name is required" } };
  }

  try {
    const { resource } = await container.item(name, name).read();
    if (!resource) {
      return { status: 404, jsonBody: { error: "Profile not found" } };
    }
    return {
      status: 200,
      jsonBody: {
        profile: resource.profile,
        versions: resource.versions ?? [],
        updatedAt: resource.updatedAt,
      },
    };
  } catch (e: unknown) {
    const err = e as { code?: number };
    if (err.code === 404) {
      return { status: 404, jsonBody: { error: "Profile not found" } };
    }
    throw e;
  }
}

app.http("getProfile", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "profile/{name}",
  handler,
});
