# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-service LMS backend (Radikari) using Bun + TypeScript + Hono + Prisma + PostgreSQL. Supports REST API, RabbitMQ consumers, and cron jobs from a single codebase via `--service` CLI flag.

## Development Commands

```bash
bun run dev              # Start REST server with hot-reload
bun start                # Start production REST server
bun run build            # TypeScript type check (tsc --noEmit)
bun run test             # Run all Jest tests
bun run test:watch       # Watch mode
bun run test:coverage     # With coverage report
bun run migrate:dev      # Run Prisma migrations (dev)
bun run migrate:deploy    # Deploy migrations
bun run seed             # Run database seeders
bun run codegen:crud     # Generate CRUD (controller + service + routes)
bun run codegen:validation # Generate Zod validation schemas
bun run codegen:entity   # Generate entity DTOs
bun run format           # Format with Biome
```

**Running specific services** (via `--service` flag):
```bash
bun run dev -- --service=rest      # REST API (default)
bun start -- --service=consumer    # RabbitMQ consumer
bun start -- --service=cron        # Cron scheduler
```

## Architecture

### Multi-Service Entry Point

`src/index.ts` routes to one of three service types based on `--service` argument. Each service type has its own app init (`src/app/`) and server config (`src/server/`).

### Layered Request Flow

```
Request → Middleware → Route → Controller → Service → Repository → Prisma
                           ↓
                    Validation (Zod middleware)
```

### Module Aliases

| Alias | Resolves To |
|-------|-------------|
| `$controllers` | `src/controllers` |
| `$services` | `src/services` |
| `$repositories` | `src/repositories` |
| `$validations` | `src/validations` |
| `$routes` | `src/routes` |
| `$middlewares` | `src/middlewares` |
| `$entities` | `src/entities` |
| `$pkg` | `src/pkg` |
| `$utils` | `src/utils` |

Configured in both `tsconfig.json` and `jest.config.js` (for tests).

### Package Structure (`src/pkg/`)

Third-party integrations follow the pattern:
```
$pkg/<name>/index.ts     # Singleton instance
$pkg/<name>/interfaces.ts # Type definitions
$pkg/<name>/utils.ts     # Helper functions
```

Key packages: Prisma, RabbitMQ (`pubsub`), Redis (`cache`), Winston (`logger`), Google OAuth (`oauth`), Qdrant vector DB (`qdrant`), graceful shutdown (`graceful`).

## Key Patterns

### Service Response Format

All services return `ServiceResponse<T>` from `src/entities/Service.ts`:
```typescript
{ status: boolean, data?: T, err?: { message: string, code: number } }
```

### Response Helpers (`src/utils/response.utils.ts`)

Controllers use helpers like `response_success`, `response_created`, `response_bad_request`, etc. that wrap the `ServiceResponse` into proper HTTP responses.

### Validation

Zod schemas live in `src/validations/` and are used as Hono middleware. Example:
```typescript
// Schema
export const createUserSchema = z.object({ email: z.string().email(), ... })

// Middleware
export async function validateUserSchema(c: Context, next: Next) {
  const result = createUserSchema.safeParse(await c.req.json())
  if (!result.success) return response_bad_request(c, ...)
  await next()
}

// Usage in route
router.post("/", validateUserSchema, UserController.create)
```

**Do not put validation inside controllers** — it will cause errors.

### Authentication Middleware (`src/middlewares/authMiddleware.ts`)

Key middlewares: `checkJwt`, `checkRole(roles[])`, `checkRoleInTenant`, `checkAccessTenantRole(feature, action)` for ACL-based access.

### Multi-Tenancy

Tenants are isolated via `Tenant` + `TenantUser` + `TenantRole` + `AccessControlList` tables. Routes typically include `/:tenantId` prefix. ACL uses feature-action pairs.

## Test Pattern

Tests live in `tests/` and mock at the repository layer:
```typescript
jest.mock("$repositories/UserRepository", () => ({
  getByEmail: mockGetByEmail,
  ...
}))
```

Module aliases in `jest.config.js` map to `<rootDir>/src/` so test imports work the same as source imports.

## Code Generation

Use `bun run codegen:crud` to scaffold a full CRUD feature:
1. Add model to `prisma/schema.prisma`
2. Run `bun prisma migrate dev --name <name>`
3. Create entity in `src/entities/`
4. Run codegen, answer prompts for entity name and schema name

## Database

- ORM: Prisma 6.x with PostgreSQL
- ID generation: Custom ULID extension on Prisma client
- Singleton pattern: `src/pkg/prisma/index.ts` exports a single `prisma` instance

## Environment Variables

Key vars: `PORT`, `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_AUTH_*`, `AMQP_CONN_URL`, `REDIS_HOST`, `QDRANT_URL`, `ENABLE_ELK_LOG`, `ELASTIC_HOST`, `ENVIRONMENT`, `SERVICE_NAME`, `SERVICE_VERSION`.
