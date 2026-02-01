git fetch
---
agent: agent
---
# Specs

## Requiremetents
1. Now that data is loaded into the staging tables, we can refactor and better it.
1. All functions that load into the dataabse receive the same parameters and return the same
1. We should instead have just one function and pass the context to each call, where the context is:
  1. The staging table to be loaded
  1. The SQL Statements, the cusotm messages, etc...
1. I think the call sites can be the same, the existing functions could be a wrapper for the new one

## Contraints
1. Each step of the plan must finish with a commmit
1. At the end update README.md

## Success Criteria and Verifications
1. No new tests are written and existing ones pass

## Implementation Plan

### Phase 1: Create LoaderContext Interface
**Step 1.1** - Define `LoaderContext` interface in [src/database/types.ts](src/database/types.ts)
- Include: table name, CSV file path, SQL INSERT statement, required fields, optional fields, error messages, field converters/transformers
- Include: metadata like fileName (for error messages) and description

**Step 1.2** - Commit: "feat: Add LoaderContext interface for unified data loading"

### Phase 2: Implement Unified Loader Function
**Step 2.1** - Create `loadDataIntoStaging()` function in [src/database/database.ts](src/database/database.ts)
- Accept `db: FootballDatabase` and `context: LoaderContext` parameters
- Parse CSV, apply field converters, validate required fields, execute inserts, return count
- Replicate existing error handling with line numbers and context

**Step 2.2** - Commit: "feat: Implement unified loadDataIntoStaging() function"

### Phase 3: Refactor Existing Loaders to Wrappers
**Step 3.1** - Convert `loadResults()`, `loadGoalscorers()`, `loadShootouts()`, `loadFormerNames()` to wrapper functions
- Each builds its context object and calls `loadDataIntoStaging()`
- Maintain existing signatures for backward compatibility

**Step 3.2** - Commit: "refactor: Convert loaders to wrappers around unified function"

### Phase 4: Testing & Verification
**Step 4.1** - Run existing test suite: `npm test` (or Makefile target)
- Verify all tests in [tests/database.test.ts](tests/database.test.ts) and [tests/data-mapping.test.ts](tests/data-mapping.test.ts) pass

**Step 4.2** - Commit: "test: Verify refactoring passes existing test suite"

### Phase 5: Documentation
**Step 5.1** - Update [README.md](README.md) to document:
- New `LoaderContext` pattern
- How to add new loaders using the unified function
- Benefits of the refactored approach (single responsibility, easier maintenance)

**Step 5.2** - Commit: "docs: Update README with LoaderContext pattern documentation"

---

**Verify Success Criteria:**
- ✅ No new tests written
- ✅ All existing tests pass
- ✅ Each phase ends with a commit
- ✅ README.md updated
