"use client";

import { useMemo } from "react";

export default function ApiDocsPage() {
  const specUrl = useMemo(() => "/api/openapi", []);
  const html = useMemo(
    () => `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; }
      .topbar { display: none; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: ${JSON.stringify(specUrl)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        persistAuthorization: true
      });
    </script>
  </body>
</html>`,
    [specUrl]
  );

  return (
    <iframe
      title="API Docs"
      srcDoc={html}
      style={{ width: "100%", height: "calc(100vh - 1px)", border: 0 }}
    />
  );
}

