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
          security: [],
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { ok: { type: "boolean", example: true } },
                    required: ["ok"],
                  },
                },
              },
            },
          },
        },
      },
      "/api/auth/[...nextauth]": {
        get: {
          tags: ["Auth"],
          summary: "NextAuth Handler (GET)",
          security: [],
          responses: { "200": { description: "NextAuth response" } },
        },
        post: {
          tags: ["Auth"],
          summary: "NextAuth Handler (POST)",
          security: [],
          responses: { "200": { description: "NextAuth response" } },
        },
      },
      "/api/profile": {
        get: {
          tags: ["Profile"],
          summary: "Profil des eingeloggten Nutzers",
          responses: {
            "200": {
              description: "Profil",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ProfileResponse" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
        patch: {
          tags: ["Profile"],
          summary: "Profil aktualisieren",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProfileUpdateRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Aktualisiertes Profil",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ProfileResponse" } } },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/api/profile/password": {
        post: {
          tags: ["Profile"],
          summary: "Passwort ändern",
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ChangePasswordRequest" } },
            },
          },
          responses: {
            "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
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
            "200": {
              description: "Liste der Notifications",
              content: { "application/json": { schema: { $ref: "#/components/schemas/NotificationsResponse" } } },
            },
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
            "200": {
              description: "Liste der Audit-Logs",
              content: { "application/json": { schema: { $ref: "#/components/schemas/AuditLogListResponse" } } },
            },
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
            "200": {
              description: "Liste der Nutzer (id, name)",
              content: { "application/json": { schema: { $ref: "#/components/schemas/AuditUsersResponse" } } },
            },
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
            "200": { description: "Stats", content: { "application/json": { schema: { $ref: "#/components/schemas/AdminStatsResponse" } } } },
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
            "200": { description: "Settings", content: { "application/json": { schema: { $ref: "#/components/schemas/SystemSettingsResponse" } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        patch: {
          tags: ["Admin"],
          summary: "System-Einstellungen aktualisieren",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/SystemSettingsUpdateRequest" } } },
          },
          responses: {
            "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/SystemSettingsResponse" } } } },
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
            "200": { description: "User-Liste", content: { "application/json": { schema: { $ref: "#/components/schemas/UserListResponse" } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        post: {
          tags: ["Admin"],
          summary: "User erstellen",
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UserCreateRequest" } } } },
          responses: {
            "200": { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/UserResponse" } } } },
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
            "200": { description: "User", content: { "application/json": { schema: { $ref: "#/components/schemas/UserResponse" } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
        patch: {
          tags: ["Admin"],
          summary: "User aktualisieren",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UserUpdateRequest" } } } },
          responses: {
            "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/UserResponse" } } } },
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
            "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
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
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ResetPasswordRequest" } } } },
          responses: {
            "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
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
            "200": { description: "Departments", content: { "application/json": { schema: { $ref: "#/components/schemas/DepartmentListResponse" } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        post: {
          tags: ["Admin"],
          summary: "Abteilung erstellen",
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/DepartmentCreateRequest" } } } },
          responses: {
            "200": { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/DepartmentResponse" } } } },
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
            "200": { description: "Department", content: { "application/json": { schema: { $ref: "#/components/schemas/DepartmentResponse" } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
        put: {
          tags: ["Admin"],
          summary: "Abteilung aktualisieren",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/DepartmentUpdateRequest" } } } },
          responses: {
            "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/DepartmentResponse" } } } },
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
            "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
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
            "200": { description: "Holidays", content: { "application/json": { schema: { $ref: "#/components/schemas/HolidayListResponse" } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        post: {
          tags: ["Admin"],
          summary: "Feiertag erstellen",
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/HolidayCreateRequest" } } } },
          responses: {
            "200": { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/HolidayResponse" } } } },
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
            "200": { description: "Holiday", content: { "application/json": { schema: { $ref: "#/components/schemas/HolidayResponse" } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
        put: {
          tags: ["Admin"],
          summary: "Feiertag aktualisieren",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/HolidayUpdateRequest" } } } },
          responses: {
            "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/HolidayResponse" } } } },
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
            "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
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
            "200": { description: "Work models", content: { "application/json": { schema: { $ref: "#/components/schemas/WorkModelListResponse" } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        post: {
          tags: ["Admin"],
          summary: "Arbeitszeitmodell erstellen",
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/WorkModelCreateRequest" } } } },
          responses: {
            "200": { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/WorkModelResponse" } } } },
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
            "200": { description: "Work model", content: { "application/json": { schema: { $ref: "#/components/schemas/WorkModelResponse" } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
        put: {
          tags: ["Admin"],
          summary: "Arbeitszeitmodell aktualisieren",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/WorkModelUpdateRequest" } } } },
          responses: {
            "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/WorkModelResponse" } } } },
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
            "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
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
            "200": { description: "Entries", content: { "application/json": { schema: { $ref: "#/components/schemas/AdminTimeEntriesResponse" } } } },
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
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/AdminTimeEntryUpdateRequest" } } } },
          responses: {
            "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/AdminTimeEntryResponse" } } } },
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
            "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
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
            "200": { description: "Status", content: { "application/json": { schema: { $ref: "#/components/schemas/TimeStatusResponse" } } } },
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
            "200": { description: "Entries", content: { "application/json": { schema: { $ref: "#/components/schemas/TimeEntriesResponse" } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/api/time/summary": {
        get: {
          tags: ["Time"],
          summary: "Tages-/Monatsübersicht",
          responses: {
            "200": { description: "Summary", content: { "application/json": { schema: { $ref: "#/components/schemas/TimeSummaryResponse" } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/api/time/clock": {
        post: {
          tags: ["Time"],
          summary: "Stempeln (ein/aus/Pause)",
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/TimeClockRequest" } } } },
          responses: {
            "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/TimeClockResponse" } } } },
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
            "200": { description: "Corrections", content: { "application/json": { schema: { $ref: "#/components/schemas/TimeCorrectionsResponse" } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
        post: {
          tags: ["Time"],
          summary: "Zeitkorrektur beantragen",
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/TimeCorrectionCreateRequest" } } } },
          responses: {
            "200": { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/TimeCorrectionResponse" } } } },
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
            "200": { description: "Pending", content: { "application/json": { schema: { $ref: "#/components/schemas/TimeCorrectionsResponse" } } } },
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
            "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/TimeCorrectionActionResponse" } } } },
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
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RejectRequest" } } } },
          responses: {
            "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/TimeCorrectionActionResponse" } } } },
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
            "200": { description: "Requests", content: { "application/json": { schema: { $ref: "#/components/schemas/LeaveListResponse" } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
        post: {
          tags: ["Leave"],
          summary: "Urlaubsantrag erstellen",
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/LeaveCreateRequest" } } } },
          responses: {
            "200": { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/LeaveResponse" } } } },
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
            "200": { description: "Request", content: { "application/json": { schema: { $ref: "#/components/schemas/LeaveResponse" } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
        delete: {
          tags: ["Leave"],
          summary: "Urlaubsantrag stornieren",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
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
            "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/LeaveActionResponse" } } } },
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
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RejectRequest" } } } },
          responses: {
            "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/LeaveActionResponse" } } } },
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
            "200": { description: "Balance", content: { "application/json": { schema: { $ref: "#/components/schemas/LeaveBalanceResponse" } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/api/leave/pending": {
        get: {
          tags: ["Leave", "Admin"],
          summary: "Offene Anträge zur Genehmigung",
          responses: {
            "200": { description: "Pending", content: { "application/json": { schema: { $ref: "#/components/schemas/LeaveListResponse" } } } },
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
            "200": { description: "Calendar", content: { "application/json": { schema: { $ref: "#/components/schemas/LeaveCalendarResponse" } } } },
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
        SuccessResponse: {
          type: "object",
          properties: { success: { type: "boolean", example: true }, message: { type: "string", nullable: true } },
          required: ["success"],
        },
        IdName: {
          type: "object",
          properties: { id: { type: "string" }, name: { type: "string" } },
          required: ["id", "name"],
        },
        Role: { type: "string", enum: ["ADMIN", "SUPERVISOR", "USER"] },
        AuditAction: { type: "string", enum: ["CREATE", "UPDATE", "DELETE", "APPROVE", "REJECT", "CORRECT"] },
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            employeeNumber: { type: "string", nullable: true },
            role: { $ref: "#/components/schemas/Role" },
            isActive: { type: "boolean" },
            annualLeaveEntitlement: { type: "integer", nullable: true },
            carryOverDays: { type: "number", nullable: true },
            hireDate: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time", nullable: true },
            updatedAt: { type: "string", format: "date-time", nullable: true },
          },
          required: ["id", "email", "firstName", "lastName", "role", "isActive"],
        },
        UserResponse: {
          type: "object",
          properties: { success: { type: "boolean" }, user: { $ref: "#/components/schemas/User" } },
          required: ["success", "user"],
        },
        UserListResponse: {
          type: "object",
          properties: { success: { type: "boolean" }, users: { type: "array", items: { $ref: "#/components/schemas/User" } } },
          required: ["success", "users"],
        },
        UserCreateRequest: {
          type: "object",
          properties: {
            email: { type: "string" },
            password: { type: "string", minLength: 8 },
            firstName: { type: "string" },
            lastName: { type: "string" },
            employeeNumber: { type: "string" },
            role: { $ref: "#/components/schemas/Role" },
            departmentId: { type: "string" },
            supervisorId: { type: "string" },
            workTimeModelId: { type: "string" },
            annualLeaveEntitlement: { type: "integer" },
            hireDate: { type: "string", format: "date-time" },
          },
          required: ["email", "password", "firstName", "lastName", "role"],
        },
        UserUpdateRequest: {
          type: "object",
          properties: {
            email: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            employeeNumber: { type: "string", nullable: true },
            role: { $ref: "#/components/schemas/Role" },
            departmentId: { type: "string", nullable: true },
            supervisorId: { type: "string", nullable: true },
            delegateId: { type: "string", nullable: true },
            workTimeModelId: { type: "string", nullable: true },
            annualLeaveEntitlement: { type: "integer" },
            isActive: { type: "boolean" },
          },
        },
        ResetPasswordRequest: {
          type: "object",
          properties: { newPassword: { type: "string", minLength: 8 } },
          required: ["newPassword"],
        },
        Department: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: "string", nullable: true },
            color: { type: "string", nullable: true },
            headId: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time", nullable: true },
            updatedAt: { type: "string", format: "date-time", nullable: true },
          },
          required: ["id", "name"],
        },
        DepartmentResponse: {
          type: "object",
          properties: { success: { type: "boolean" }, department: { $ref: "#/components/schemas/Department" } },
          required: ["success", "department"],
        },
        DepartmentListResponse: {
          type: "object",
          properties: { success: { type: "boolean" }, departments: { type: "array", items: { $ref: "#/components/schemas/Department" } } },
          required: ["success", "departments"],
        },
        DepartmentCreateRequest: {
          type: "object",
          properties: { name: { type: "string" }, description: { type: "string" }, color: { type: "string" }, headId: { type: "string" } },
          required: ["name"],
        },
        DepartmentUpdateRequest: {
          type: "object",
          properties: { name: { type: "string" }, description: { type: "string" }, color: { type: "string" }, headId: { type: "string", nullable: true } },
        },
        Holiday: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            date: { type: "string", format: "date-time" },
            year: { type: "integer" },
            region: { type: "string" },
            isRecurring: { type: "boolean" },
            isHalfDay: { type: "boolean" },
          },
          required: ["id", "name", "date", "year", "region"],
        },
        HolidayResponse: {
          type: "object",
          properties: { success: { type: "boolean" }, holiday: { $ref: "#/components/schemas/Holiday" } },
          required: ["success", "holiday"],
        },
        HolidayListResponse: {
          type: "object",
          properties: { success: { type: "boolean" }, holidays: { type: "array", items: { $ref: "#/components/schemas/Holiday" } } },
          required: ["success", "holidays"],
        },
        HolidayCreateRequest: {
          type: "object",
          properties: {
            name: { type: "string" },
            date: { type: "string", format: "date-time" },
            region: { type: "string" },
            isRecurring: { type: "boolean" },
            isHalfDay: { type: "boolean" },
          },
          required: ["name", "date", "region"],
        },
        HolidayUpdateRequest: {
          type: "object",
          properties: {
            name: { type: "string" },
            date: { type: "string", format: "date-time" },
            region: { type: "string" },
            isRecurring: { type: "boolean" },
            isHalfDay: { type: "boolean" },
          },
        },
        WorkTimeModel: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: "string", nullable: true },
            mondayMinutes: { type: "integer" },
            tuesdayMinutes: { type: "integer" },
            wednesdayMinutes: { type: "integer" },
            thursdayMinutes: { type: "integer" },
            fridayMinutes: { type: "integer" },
            saturdayMinutes: { type: "integer" },
            sundayMinutes: { type: "integer" },
            isDefault: { type: "boolean" },
            isActive: { type: "boolean", nullable: true },
          },
          required: ["id", "name", "mondayMinutes", "tuesdayMinutes", "wednesdayMinutes", "thursdayMinutes", "fridayMinutes", "saturdayMinutes", "sundayMinutes"],
        },
        WorkModelResponse: {
          type: "object",
          properties: { success: { type: "boolean" }, workTimeModel: { $ref: "#/components/schemas/WorkTimeModel" } },
          required: ["success", "workTimeModel"],
        },
        WorkModelListResponse: {
          type: "object",
          properties: { success: { type: "boolean" }, workTimeModels: { type: "array", items: { $ref: "#/components/schemas/WorkTimeModel" } } },
          required: ["success", "workTimeModels"],
        },
        WorkModelCreateRequest: { type: "object", properties: { name: { type: "string" } }, required: ["name"] },
        WorkModelUpdateRequest: { type: "object", properties: { name: { type: "string" } } },
        AuditLog: {
          type: "object",
          properties: {
            id: { type: "string" },
            action: { $ref: "#/components/schemas/AuditAction" },
            entityType: { type: "string" },
            entityId: { type: "string" },
            description: { type: "string", nullable: true },
            user: { anyOf: [{ $ref: "#/components/schemas/IdName" }, { type: "null" }] },
            performedBy: { $ref: "#/components/schemas/IdName" },
            oldValues: { type: "object", additionalProperties: true, nullable: true },
            newValues: { type: "object", additionalProperties: true, nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
          required: ["id", "action", "entityType", "entityId", "performedBy", "createdAt"],
        },
        AuditLogListResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            logs: { type: "array", items: { $ref: "#/components/schemas/AuditLog" } },
            total: { type: "integer" },
            limit: { type: "integer" },
            offset: { type: "integer" },
          },
          required: ["success", "logs", "total", "limit", "offset"],
        },
        AuditUsersResponse: {
          type: "object",
          properties: { success: { type: "boolean" }, users: { type: "array", items: { $ref: "#/components/schemas/IdName" } } },
          required: ["success", "users"],
        },
        AdminStats: {
          type: "object",
          properties: {
            totalUsers: { type: "integer" },
            activeUsers: { type: "integer" },
            inactiveUsers: { type: "integer" },
            pendingLeaveRequests: { type: "integer" },
            todayClockIns: { type: "integer" },
          },
          required: ["totalUsers", "activeUsers", "inactiveUsers", "pendingLeaveRequests", "todayClockIns"],
        },
        AdminStatsResponse: {
          type: "object",
          properties: { success: { type: "boolean" }, stats: { $ref: "#/components/schemas/AdminStats" } },
          required: ["success", "stats"],
        },
        SystemSetting: {
          type: "object",
          properties: { id: { type: "string" }, key: { type: "string" }, value: { type: "string" }, description: { type: "string", nullable: true } },
          required: ["key", "value"],
        },
        SystemSettingsResponse: {
          type: "object",
          properties: { success: { type: "boolean" }, settings: { type: "array", items: { $ref: "#/components/schemas/SystemSetting" } } },
          required: ["success", "settings"],
        },
        SystemSettingsUpdateRequest: {
          type: "object",
          additionalProperties: { type: "string" },
          description: "Key-Value Updates für SystemSetting",
        },
        Notification: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            message: { type: "string" },
            link: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            readAt: { type: "string", format: "date-time", nullable: true },
          },
          required: ["id", "title", "message", "createdAt"],
        },
        NotificationsResponse: {
          type: "object",
          properties: { success: { type: "boolean" }, notifications: { type: "array", items: { $ref: "#/components/schemas/Notification" } } },
          required: ["success", "notifications"],
        },
        TimeEntryType: { type: "string" },
        TimeEntry: {
          type: "object",
          properties: {
            id: { type: "string" },
            type: { $ref: "#/components/schemas/TimeEntryType" },
            timestamp: { type: "string", format: "date-time" },
            note: { type: "string", nullable: true },
            isManual: { type: "boolean", nullable: true },
            createdAt: { type: "string", format: "date-time", nullable: true },
          },
          required: ["id", "type", "timestamp"],
        },
        AdminTimeEntryResponse: {
          type: "object",
          properties: { success: { type: "boolean" }, entry: { $ref: "#/components/schemas/TimeEntry" } },
          required: ["success", "entry"],
        },
        AdminTimeEntriesResponse: {
          type: "object",
          properties: { success: { type: "boolean" }, entries: { type: "array", items: { $ref: "#/components/schemas/TimeEntry" } } },
          required: ["success", "entries"],
        },
        AdminTimeEntryUpdateRequest: {
          type: "object",
          properties: {
            timestamp: { type: "string", format: "date-time" },
            type: { $ref: "#/components/schemas/TimeEntryType" },
            note: { type: "string", nullable: true },
            correctionNote: { type: "string", nullable: true },
          },
        },
        TimeStatusResponse: {
          type: "object",
          properties: { success: { type: "boolean" }, status: { type: "object", additionalProperties: true } },
          required: ["success", "status"],
        },
        TimeEntriesResponse: {
          type: "object",
          properties: { success: { type: "boolean" }, entries: { type: "array", items: { $ref: "#/components/schemas/TimeEntry" } } },
          required: ["success", "entries"],
        },
        TimeSummaryResponse: {
          type: "object",
          properties: { success: { type: "boolean" }, summaries: { type: "array", items: { type: "object", additionalProperties: true } } },
          required: ["success", "summaries"],
        },
        TimeClockRequest: { type: "object", properties: { type: { $ref: "#/components/schemas/TimeEntryType" }, note: { type: "string" } }, required: ["type"] },
        TimeClockResponse: { type: "object", properties: { success: { type: "boolean" }, entry: { $ref: "#/components/schemas/TimeEntry" } }, required: ["success"] },
        CorrectionStatus: { type: "string" },
        TimeCorrection: { type: "object", properties: { id: { type: "string" }, status: { $ref: "#/components/schemas/CorrectionStatus" } }, required: ["id", "status"] },
        TimeCorrectionsResponse: {
          type: "object",
          properties: { success: { type: "boolean" }, requests: { type: "array", items: { $ref: "#/components/schemas/TimeCorrection" } } },
          required: ["success", "requests"],
        },
        TimeCorrectionCreateRequest: { type: "object", properties: { reason: { type: "string" } }, required: ["reason"] },
        TimeCorrectionResponse: { type: "object", properties: { success: { type: "boolean" }, request: { $ref: "#/components/schemas/TimeCorrection" } }, required: ["success", "request"] },
        TimeCorrectionActionResponse: {
          type: "object",
          properties: { success: { type: "boolean" }, message: { type: "string" }, request: { $ref: "#/components/schemas/TimeCorrection" } },
          required: ["success"],
        },
        LeaveType: { type: "string" },
        LeaveStatus: { type: "string" },
        LeaveRequest: {
          type: "object",
          properties: {
            id: { type: "string" },
            type: { $ref: "#/components/schemas/LeaveType" },
            status: { $ref: "#/components/schemas/LeaveStatus" },
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
            totalDays: { type: "number" },
            reason: { type: "string", nullable: true },
          },
          required: ["id", "type", "status", "startDate", "endDate"],
        },
        LeaveResponse: { type: "object", properties: { success: { type: "boolean" }, request: { $ref: "#/components/schemas/LeaveRequest" } }, required: ["success", "request"] },
        LeaveListResponse: { type: "object", properties: { success: { type: "boolean" }, requests: { type: "array", items: { $ref: "#/components/schemas/LeaveRequest" } } }, required: ["success", "requests"] },
        LeaveCreateRequest: {
          type: "object",
          properties: {
            userId: { type: "string" },
            type: { $ref: "#/components/schemas/LeaveType" },
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
            reason: { type: "string" },
            isHalfDayStart: { type: "boolean" },
            isHalfDayEnd: { type: "boolean" },
          },
          required: ["userId", "type", "startDate", "endDate"],
        },
        LeaveBalance: { type: "object", properties: { year: { type: "integer" }, entitlement: { type: "number" }, used: { type: "number" }, remaining: { type: "number" } }, required: ["year"] },
        LeaveBalanceResponse: { type: "object", properties: { success: { type: "boolean" }, balance: { $ref: "#/components/schemas/LeaveBalance" } }, required: ["success", "balance"] },
        LeaveCalendarEntry: { type: "object", properties: { userId: { type: "string" }, userName: { type: "string" }, date: { type: "string", format: "date-time" }, type: { $ref: "#/components/schemas/LeaveType" } }, required: ["userId", "date", "type"] },
        LeaveCalendarResponse: { type: "object", properties: { success: { type: "boolean" }, entries: { type: "array", items: { $ref: "#/components/schemas/LeaveCalendarEntry" } } }, required: ["success", "entries"] },
        LeaveActionResponse: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" }, request: { $ref: "#/components/schemas/LeaveRequest" } }, required: ["success"] },
        RejectRequest: { type: "object", properties: { reason: { type: "string" } }, required: ["reason"] },
        ProfileUpdateRequest: { type: "object", additionalProperties: true },
        ProfileResponse: { type: "object", properties: { success: { type: "boolean" }, profile: { type: "object", additionalProperties: true } }, required: ["success", "profile"] },
        ChangePasswordRequest: { type: "object", properties: { currentPassword: { type: "string" }, newPassword: { type: "string", minLength: 8 } }, required: ["currentPassword", "newPassword"] },
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

