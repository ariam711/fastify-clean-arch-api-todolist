# Architecture Decision Record (ADR)

This document captures the key architectural decisions made for the TODO List API project.

---

## ADR-001: Native MongoDB Driver vs Mongoose ODM

**Status:** Accepted

**Context:**  
We need to choose between using the native MongoDB driver or an ODM like Mongoose for database operations.

**Decision:**  
Use the **native MongoDB driver** (`mongodb` package).

**Rationale:**
- **Clean Architecture alignment**: No framework coupling in domain layer; entities remain pure TypeScript classes
- **Performance**: No abstraction overhead; direct control over queries
- **Explicit control**: Full visibility into database operations
- **Type safety**: Better TypeScript integration with explicit document interfaces

**Consequences:**
- Manual mapping between entities and documents (implemented via mapper classes)
- Manual schema validation (handled at domain layer)
- No automatic change tracking

---

## ADR-002: Label Scoping - Per-Project vs Global

**Status:** Accepted

**Context:**  
Labels can be global (shared across all projects) or scoped per project.

**Decision:**  
Labels are **scoped per project**.

**Rationale:**
- **Organization**: Each project can have its own set of labels without namespace collisions
- **Flexibility**: Projects can have different labeling schemes (e.g., "urgent" might mean different things in different contexts)
- **Data isolation**: Deleting a project cleanly removes its labels
- **Simplicity**: No need for complex sharing/inheritance logic

**Consequences:**
- Labels must be created per project
- Same label name can exist in multiple projects
- Unique constraint: `(name, projectId)`

---

## ADR-003: Cursor-Based vs Offset Pagination

**Status:** Accepted

**Context:**  
We need to choose a pagination strategy for list endpoints.

**Decision:**  
- **Tasks**: Cursor-based pagination
- **Projects/Labels**: Offset-based pagination

**Rationale:**

**Cursor-based for Tasks:**
- Tasks are the primary work items with potentially large datasets
- Consistent ordering even when data changes (no skipped/duplicated items)
- Better performance for deep pagination
- Natural fit with createdAt-based ordering

**Offset-based for Projects/Labels:**
- Smaller datasets (users typically have few projects/labels)
- Simpler implementation and client usage
- Supports "jump to page N" patterns if needed
- Lower complexity overhead justified by smaller scale

**Consequences:**
- Different pagination response shapes for different resources
- Cursor is base64-encoded `{id, createdAt}` for Tasks

---

## ADR-004: Dependency Injection with Awilix

**Status:** Accepted

**Context:**  
Need a dependency injection mechanism for Clean Architecture's dependency inversion.

**Decision:**  
Use **Awilix** for dependency injection.

**Rationale:**
- **Lightweight**: Minimal overhead compared to full IoC containers
- **TypeScript-friendly**: Good type inference with explicit registration
- **Flexible**: Supports classic and proxy injection modes
- **Scoped containers**: Per-request scoping when needed
- **No decorators**: Works with plain classes (no metadata extensions)

**Consequences:**
- Manual registration required for all dependencies
- Container attached to Fastify instance via decoration

---

## ADR-005: Testing Strategy with Testcontainers

**Status:** Accepted

**Context:**  
Integration tests need a MongoDB instance.

**Decision:**  
Use **Testcontainers** for integration tests.

**Rationale:**
- **Real MongoDB**: Tests against actual MongoDB behavior, not mocks
- **Isolated**: Each test run gets a fresh container
- **CI-friendly**: Works in GitHub Actions and other CI environments
- **Production-like**: Same MongoDB version as production

**Trade-offs:**
- Requires Docker to be running
- Slower than in-memory mocks (~3-5s container startup)
- More resource-intensive

**Alternatives considered:**
- mongodb-memory-server: Less realistic, some behavioral differences
- Shared test database: Risk of test pollution

---

## ADR-006: Task Status Transitions

**Status:** Accepted

**Context:**  
Tasks have statuses and we need to enforce valid state transitions.

**Decision:**  
Implement a **state machine** for task status transitions.

**Valid Transitions:**
```
todo → in_progress, cancelled
in_progress → todo, done, cancelled
done → in_progress
cancelled → todo
```

**Rationale:**
- **Domain invariant**: Prevents invalid states (e.g., skipping from todo to done)
- **Audit-friendly**: Clear transition rules
- **Business logic encapsulation**: Rules live in the Task entity

**Consequences:**
- Cannot directly mark a todo task as done
- Explicit "reopen" action needed for completed tasks

---

## ADR-007: Error Handling Strategy

**Status:** Accepted

**Context:**  
Need consistent error handling across the application with proper HTTP status code mapping.

**Decision:**  
Implement **typed domain errors** with centralized HTTP mapping.

**Error Types:**

| Domain Error               | HTTP Status |
|:---------------------------|:-----------:|
| ValidationError            |     400     |
| DomainError (generic)      |     400     |
| NotFoundError              |     404     |
| ConflictError              |     409     |
| BusinessRuleViolationError |     422     |
| Unknown                    |     500     |

**Rationale:**
- **Type safety**: Errors carry structured information
- **Separation of concerns**: Domain doesn't know about HTTP
- **Consistent responses**: Single error handler produces uniform response shapes
- **Debugging**: Errors include codes, messages, and optional field/detail information

---

## ADR-008: OpenAPI Documentation

**Status:** Accepted

**Context:**  
API needs documentation for consumers.

**Decision:**  
Use **@fastify/swagger** with **TypeBox** schemas.

**Rationale:**
- **Single source of truth**: Schemas used for validation AND documentation
- **Auto-generated**: No manual OpenAPI file maintenance
- **Interactive**: Swagger UI at `/docs` for exploration
- **Type safety**: TypeBox provides TypeScript types from schemas

**Consequences:**
- Route handlers must include schema definitions
- Slightly more verbose route registration
