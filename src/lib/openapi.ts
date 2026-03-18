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
    security: [{ sessionCookie: [] }],
    tags: [
      { name: "Health" },
      { name: "Admin" },
      { name: "Audit" },
      { name: "Time" },
      { name: "Leave" },
      { name: "Profile" },
      { name: "Auth" },
      { name: "Notifications" },
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
      "/api/auth/[...nextauth]": {
        get: {
          tags: ["Auth"],
          summary: "NextAuth Handler (GET)",
          responses: { "200": { description: "NextAuth response" } },
        },
        post: {
          tags: ["Auth"],
          summary: "NextAuth Handler (POST)",
          responses: { "200": { description: "NextAuth response" } },
        },
      },
      "/api/profile": {
        get: {
          tags: ["Profile"],
          summary: "Profil des eingeloggten Nutzers",
          responses: {
            "200": { description: "Profil" },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
        patch: {
          tags: ["Profile"],
          summary: "Profil aktualisieren",
          responses: {
            "200": { description: "Aktualisiertes Profil" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/api/profile/password": {
        post: {
          tags: ["Profile"],
          summary: "Passwort ändern",
          responses: {
            "200": { description: "OK" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/api/notifications": {
        get: {
          tags: ["Notifications"],
          summary: "Benachrichtigungen des Nutzers",
          responses: {
            "200": { description: "Liste der Notifications" },
            "401": { $ref: "#/components/responses/Unauthorized" },
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
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/admin/audit/users": {
        get: {
          tags: ["Audit", "Admin"],
          summary: "User-Liste für Audit-Filter",
          responses: {
            "200": { description: "Liste der Nutzer (id, name)" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/admin/stats": {
        get: {
          tags: ["Admin"],
          summary: "Admin Dashboard Stats",
          responses: {
            "200": { description: "Stats" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/admin/settings": {
        get: {
          tags: ["Admin"],
          summary: "System-Einstellungen lesen",
          responses: {
            "200": { description: "Settings" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        patch: {
          tags: ["Admin"],
          summary: "System-Einstellungen aktualisieren",
          responses: {
            "200": { description: "OK" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/admin/reports/monthly-timesheet": {
        get: {
          tags: ["Admin"],
          summary: "Monatsbericht/Timesheet exportieren",
          parameters: [
            { name: "year", in: "query", required: true, schema: { type: "integer", minimum: 2000 } },
            { name: "month", in: "query", required: true, schema: { type: "integer", minimum: 1, maximum: 12 } },
            { name: "userId", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Export" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/admin/users": {
        get: {
          tags: ["Admin"],
          summary: "User auflisten",
          parameters: [
            { name: "includeInactive", in: "query", schema: { type: "boolean", default: false } },
            { name: "departmentId", in: "query", schema: { type: "string" } },
            { name: "role", in: "query", schema: { type: "string" } },
            { name: "search", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "User-Liste" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        post: {
          tags: ["Admin"],
          summary: "User erstellen",
          responses: {
            "200": { description: "Created" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/admin/users/{id}": {
        get: {
          tags: ["Admin"],
          summary: "User holen",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "User" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
        patch: {
          tags: ["Admin"],
          summary: "User aktualisieren",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "OK" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
        delete: {
          tags: ["Admin"],
          summary: "User deaktivieren",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "OK" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/admin/users/{id}/password": {
        post: {
          tags: ["Admin"],
          summary: "Passwort zurücksetzen",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "OK" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/admin/departments": {
        get: {
          tags: ["Admin"],
          summary: "Abteilungen auflisten",
          responses: {
            "200": { description: "Departments" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        post: {
          tags: ["Admin"],
          summary: "Abteilung erstellen",
          responses: {
            "200": { description: "Created" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/admin/departments/{id}": {
        get: {
          tags: ["Admin"],
          summary: "Abteilung holen",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Department" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
        put: {
          tags: ["Admin"],
          summary: "Abteilung aktualisieren",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "OK" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        delete: {
          tags: ["Admin"],
          summary: "Abteilung löschen",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "OK" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/admin/holidays": {
        get: {
          tags: ["Admin"],
          summary: "Feiertage auflisten",
          responses: {
            "200": { description: "Holidays" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        post: {
          tags: ["Admin"],
          summary: "Feiertag erstellen",
          responses: {
            "200": { description: "Created" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/admin/holidays/{id}": {
        get: {
          tags: ["Admin"],
          summary: "Feiertag holen",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Holiday" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
        put: {
          tags: ["Admin"],
          summary: "Feiertag aktualisieren",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "OK" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        delete: {
          tags: ["Admin"],
          summary: "Feiertag löschen",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "OK" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/admin/work-models": {
        get: {
          tags: ["Admin"],
          summary: "Arbeitszeitmodelle auflisten",
          responses: {
            "200": { description: "Work models" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        post: {
          tags: ["Admin"],
          summary: "Arbeitszeitmodell erstellen",
          responses: {
            "200": { description: "Created" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/admin/work-models/{id}": {
        get: {
          tags: ["Admin"],
          summary: "Arbeitszeitmodell holen",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Work model" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
        put: {
          tags: ["Admin"],
          summary: "Arbeitszeitmodell aktualisieren",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "OK" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        delete: {
          tags: ["Admin"],
          summary: "Arbeitszeitmodell löschen",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "OK" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/admin/time-entries": {
        get: {
          tags: ["Admin", "Time"],
          summary: "Zeiteinträge administrativ auflisten",
          responses: {
            "200": { description: "Entries" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/admin/time-entries/{id}": {
        put: {
          tags: ["Admin", "Time"],
          summary: "Zeiteintrag korrigieren (Admin/Supervisor)",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "OK" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
        delete: {
          tags: ["Admin", "Time"],
          summary: "Zeiteintrag löschen (Admin)",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "OK" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/api/time/status": {
        get: {
          tags: ["Time"],
          summary: "Aktueller Status",
          responses: {
            "200": { description: "Status" },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/api/time/entries": {
        get: {
          tags: ["Time"],
          summary: "Zeiteinträge des Nutzers",
          parameters: [
            { name: "startDate", in: "query", schema: { type: "string", format: "date-time" } },
            { name: "endDate", in: "query", schema: { type: "string", format: "date-time" } },
          ],
          responses: {
            "200": { description: "Entries" },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/api/time/summary": {
        get: {
          tags: ["Time"],
          summary: "Tages-/Monatsübersicht",
          responses: {
            "200": { description: "Summary" },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/api/time/clock": {
        post: {
          tags: ["Time"],
          summary: "Stempeln (ein/aus/Pause)",
          responses: {
            "200": { description: "OK" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/api/time/corrections": {
        get: {
          tags: ["Time"],
          summary: "Zeitkorrekturen des Nutzers",
          responses: {
            "200": { description: "Corrections" },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
        post: {
          tags: ["Time"],
          summary: "Zeitkorrektur beantragen",
          responses: {
            "200": { description: "Created" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/api/time/corrections/pending": {
        get: {
          tags: ["Time", "Admin"],
          summary: "Ausstehende Zeitkorrekturen (Supervisor/Admin)",
          responses: {
            "200": { description: "Pending" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/time/corrections/{id}/approve": {
        post: {
          tags: ["Time", "Admin"],
          summary: "Zeitkorrektur genehmigen",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "OK" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/time/corrections/{id}/reject": {
        post: {
          tags: ["Time", "Admin"],
          summary: "Zeitkorrektur ablehnen",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "OK" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/leave": {
        get: {
          tags: ["Leave"],
          summary: "Eigene Urlaubsanträge",
          responses: {
            "200": { description: "Requests" },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
        post: {
          tags: ["Leave"],
          summary: "Urlaubsantrag erstellen",
          responses: {
            "200": { description: "Created" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/api/leave/{id}": {
        get: {
          tags: ["Leave"],
          summary: "Urlaubsantrag holen",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Request" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
        delete: {
          tags: ["Leave"],
          summary: "Urlaubsantrag stornieren",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "OK" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/api/leave/{id}/approve": {
        post: {
          tags: ["Leave", "Admin"],
          summary: "Urlaubsantrag genehmigen",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "OK" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/leave/{id}/reject": {
        post: {
          tags: ["Leave", "Admin"],
          summary: "Urlaubsantrag ablehnen",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "OK" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/leave/balance": {
        get: {
          tags: ["Leave"],
          summary: "Urlaubskonto",
          responses: {
            "200": { description: "Balance" },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/api/leave/pending": {
        get: {
          tags: ["Leave", "Admin"],
          summary: "Offene Anträge zur Genehmigung",
          responses: {
            "200": { description: "Pending" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/leave/calendar": {
        get: {
          tags: ["Leave"],
          summary: "Team-Kalender",
          parameters: [
            { name: "startDate", in: "query", schema: { type: "string", format: "date-time" } },
            { name: "endDate", in: "query", schema: { type: "string", format: "date-time" } },
          ],
          responses: {
            "200": { description: "Calendar" },
            "401": { $ref: "#/components/responses/Unauthorized" },
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
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            details: { type: "array", items: {} },
          },
          required: ["error"],
        },
      },
      responses: {
        Unauthorized: {
          description: "Nicht authentifiziert",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        Forbidden: {
          description: "Keine Berechtigung",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        NotFound: {
          description: "Nicht gefunden",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        BadRequest: {
          description: "Ungültige Anfrage",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
  };
}

