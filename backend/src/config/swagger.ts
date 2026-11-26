export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Digital Asset Management (DAM) API",
    version: "1.0.0",
    description:
      "REST API for uploading, processing, searching, previewing, and managing image and video assets.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development server",
    },
  ],
  tags: [
    { name: "Health", description: "Service health checks" },
    {
      name: "Auth",
      description: "Session authentication via HttpOnly cookies",
    },
    {
      name: "Assets",
      description: "Asset upload, listing, metadata, preview, and download",
    },
    {
      name: "Worker",
      description: "Internal background worker lease and status callbacks",
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "accessToken",
      },
      workerToken: {
        type: "apiKey",
        in: "header",
        name: "x-worker-token",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          email: {
            type: "string",
            format: "email",
            example: "admin@example.com",
          },
          role: { type: "string", enum: ["admin", "user"], example: "admin" },
        },
      },
      Asset: {
        type: "object",
        properties: {
          id: { type: "integer", example: 42 },
          original_filename: { type: "string", example: "product-launch.mp4" },
          stored_filename: { type: "string", example: "1730000000-uuid.mp4" },
          mime_type: { type: "string", example: "video/mp4" },
          file_size: { type: "integer", example: 15482910 },
          uploaded_by: { type: "integer", nullable: true, example: 1 },
          status: {
            type: "string",
            enum: ["UPLOADED", "PROCESSING", "READY", "FAILED"],
            example: "READY",
          },
          metadata: {
            type: "object",
            additionalProperties: true,
            example: {
              title: "Product Launch Promo",
              description: "Hero video for Q4 campaign",
              category: "Marketing",
              tags: ["launch", "promo"],
            },
          },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Authentication required" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Check database and Redis connectivity",
        responses: {
          200: { description: "Service is healthy" },
          503: { description: "One or more dependencies are unavailable" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Authenticate user and set HttpOnly JWT cookie",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", format: "password" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    user: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          401: { description: "Invalid email or password" },
          429: { description: "Too many login attempts" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Clear session cookie",
        responses: {
          200: { description: "Logout successful" },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Retrieve current authenticated user",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Current user session",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          401: { description: "Authentication required" },
        },
      },
    },
    "/api/assets": {
      get: {
        tags: ["Assets"],
        summary:
          "List paginated assets with optional search and media type filter",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 8 },
          },
          { name: "search", in: "query", schema: { type: "string" } },
          {
            name: "filter",
            in: "query",
            schema: {
              type: "string",
              enum: ["all", "image", "video"],
              default: "all",
            },
          },
        ],
        responses: {
          200: {
            description: "Paginated asset list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    assets: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Asset" },
                    },
                    total: { type: "integer" },
                    page: { type: "integer" },
                    limit: { type: "integer" },
                    totalPages: { type: "integer" },
                  },
                },
              },
            },
          },
          401: { description: "Authentication required" },
        },
      },
    },
    "/api/assets/stats": {
      get: {
        tags: ["Assets"],
        summary: "Get dashboard asset statistics",
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: "Dashboard asset counts and storage metrics" },
          401: { description: "Authentication required" },
        },
      },
    },
    "/api/assets/upload": {
      post: {
        tags: ["Assets"],
        summary: "Upload up to 10 image or video files",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["files"],
                properties: {
                  files: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                  },
                  metadata: {
                    type: "string",
                    description: "JSON-serialized metadata object",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Assets uploaded and queued for background processing",
          },
          400: { description: "Validation or file signature error" },
          401: { description: "Authentication required" },
        },
      },
    },
    "/api/assets/{id}/preview": {
      get: {
        tags: ["Assets"],
        summary: "Stream cacheable asset thumbnail or image preview",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: { description: "Binary image preview stream" },
          304: { description: "Not Modified (ETag matched)" },
          404: { description: "Asset not found or unauthorized" },
        },
      },
    },
    "/api/assets/{id}/download": {
      get: {
        tags: ["Assets"],
        summary: "Download original asset file",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: { description: "Original file attachment stream" },
          404: { description: "Asset not found or unauthorized" },
        },
      },
    },
    "/api/assets/{id}/metadata": {
      patch: {
        tags: ["Assets"],
        summary: "Update asset metadata",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" },
                  tags: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Metadata updated" },
          404: { description: "Asset not found or unauthorized" },
        },
      },
    },
    "/api/assets/{id}": {
      delete: {
        tags: ["Assets"],
        summary: "Delete an asset from object storage and database",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: { description: "Asset deleted" },
          404: { description: "Asset not found or unauthorized" },
        },
      },
    },
  },
};