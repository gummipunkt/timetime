import type { OpenAPIObject } from "openapi3-ts/oas30";

export function buildOpenApiSpec(baseUrl?: string): OpenAPIObject {
  const servers = baseUrl ? [{ url: baseUrl }] : [{ url: "https://{host}", variables: { host: { default: "localhost:3012" } } }];

  return {
    openapi: "3.0.3",
    info: {
      title: "TimeTime API",
      version: "1.0.0",
      description: "OpenAPI Spezifikation für die TimeTime API.",
    },
    servers,
    tags: [
      { name: "Health" },
      { name: "Admin" },
      { name: "Audit" },
      { name: "Time" },
      { name: "Leave" },
      { name: "Profile" },
      { name: "Auth" },
    ],
    paths: {
      "/api/health": {
        get: {
          tags: ["Health"],
          summary: "Healthcheck",
          responses: {
            "200": {
              description: "OK",
            },
          },
        },
      },
      "/api/admin/audit": {
        get: {
          tags: ["Audit", "Admin"],
          summary: "Audit-Logs auflisten",
          parameters: [
            { name: "limit", in: "query", schema: { type: "integer", default: 50, minimum: 1, maximum: 200 } },
            { name: "offset", in: "query", schema: { type: "integer", default: 0, minimum: 0 } },
            { name: "entityType", in: "query", schema: { type: "string" } },
            { name: "action", in: "query", schema: { type: "string" } },
            { name: "userId", in: "query", schema: { type: "string" }, description: "Betroffener Nutzer" },
            { name: "performedById", in: "query", schema: { type: "string" }, description: "Ausführender Nutzer" },
          ],
          responses: {
            "200": { description: "Liste der Audit-Logs" },
            "403": { description: "Keine Berechtigung" },
          },
        },
      },
      "/api/admin/audit/users": {
        get: {
          tags: ["Audit", "Admin"],
          summary: "User-Liste für Audit-Filter",
          responses: {
            "200": { description: "Liste der Nutzer (id, name)" },
            "403": { description: "Keine Berechtigung" },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        sessionCookie: {
          type: "apiKey",
          in: "cookie",
          name: "next-auth.session-token",
          description: "NextAuth Session Cookie (Name kann je nach Deployment abweichen).",
        },
      },
    },
  };
}

