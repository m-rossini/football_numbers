# Football Numbers Web Application

Express.js TypeScript application with health and info endpoints.

## Quick Start

### Development Environment (Port 3000)
```bash
# From project root
make dev-run          # Start development container
make dev-status       # Check container status
make dev-clean        # Stop development container
make dev-clean-all    # Remove all dev resources
```

Development container includes:
- All dependencies (dev + prod)
- Hot reload with nodemon (optional)
- Full development tools
- Interactive bash shell

### Production Environment (Port 3030)
```bash
# From project root
make prod-run         # Start production container
make prod-status      # Check container status
make prod-clean       # Stop production container
make prod-clean-all   # Remove all prod resources
```

Production uses multi-stage build:
- Minimal runtime image
- Only production dependencies
- Non-root user
- Server auto-starts on container launch

### Test Endpoints

**Development (Port 3000):**
```bash
curl http://localhost:3000/health
curl http://localhost:3000/info
```

**Production (Port 3030):**
```bash
curl http://localhost:3030/health
curl http://localhost:3030/info
```

### Response Examples

**Health endpoint:**
```json
{"status":"ok","uptime":17}
```

**Info endpoint:**
```json
{"user":"app","hostname":"d0a6bdb964a2"}
```

## Project Structure

```
.
├── Makefile              # Root delegator for all make commands
├── Makefile.dev          # Legacy dev makefile reference
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript configuration (strict mode)
├── jest.config.js        # Jest testing configuration
├── src/                  # Production source code
│   └── index.ts         # Express server
├── tests/               # Test files
│   └── index.test.ts    # Endpoint tests
├── dist/                # Compiled JavaScript (build output)
├── dev-env/             # Development container setup
│   ├── Containerfile
│   ├── Makefile
│   └── dev-compose.yml
└── prod-env/            # Production container setup
    ├── Containerfile    # Multi-stage build
    ├── Makefile
    └── prod-compose.yml
```

## Development

For detailed development information, see [Development Guide](dev-env/DEVELOPMENT.md)

### NPM Scripts
- `npm run dev` - Run dev server with ts-node
- `npm run build` - Compile TypeScript to JavaScript
- `npm run test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm start` - Run production server

## Data Loading Architecture

### LoaderContext Pattern

The application uses a unified data loading pattern through the `LoaderContext` interface. All CSV loaders (results, goalscorers, shootouts, formerNames) share a common interface for loading data into staging tables.

#### Key Components

**LoaderContext Interface** (`src/database/types.ts`):
- `fileName` - CSV filename for error messages
- `filePath` - Path to the CSV file
- `sqlStatement` - SQL INSERT statement with placeholders
- `requiredFields` - Fields that must be present in every record
- `optionalFields` - Fields that can be undefined/null/empty
- `recordTransformer` - Function to transform CSV record to database values, or null to skip
- `errorMessages` - Custom error formatters for missing fields, transformation errors, and insert errors

**Unified Loader Function** (`src/database/csv-loader.ts`):
- `loadDataIntoStaging(db, context)` - Core function that handles:
  - CSV parsing and line-by-line processing
  - Field validation against requiredFields
  - Record transformation via context's recordTransformer function
  - Database insertion with error handling
  - Detailed logging with line numbers and context

#### Existing Loaders

Each loader wraps the unified function with its specific context:
- `loadResults()` - Validates scores, converts boolean fields (neutral)
- `loadGoalscorers()` - Handles optional minute field, enforces FK constraints
- `loadShootouts()` - Validates match references
- `loadFormerNames()` - Manages historical team name mappings

#### Adding a New Loader

To add a new CSV loader, define a `LoaderContext` object and call `loadDataIntoStaging()`:

```typescript
export async function loadNewTable(db: FootballDatabase, filePath: string): Promise<number> {
  const context: LoaderContext = {
    fileName: 'new_table.csv',
    filePath,
    sqlStatement: 'INSERT INTO newTable (field1, field2) VALUES (?, ?)',
    requiredFields: ['column1', 'column2'],
    recordTransformer: (record, lineNumber) => {
      // Transform CSV fields to database values
      // Return null to skip this record (error already logged)
      return [record.column1, parseInt(record.column2, 10)];
    },
    errorMessages: {
      missingFields: (lineNumber, fields, record) => 
        `❌ MISSING in new_table.csv line ${lineNumber}: ${fields.join(', ')}`,
      transformError: (lineNumber, error, record) => 
        `❌ TRANSFORM ERROR in new_table.csv line ${lineNumber}`,
      insertError: (lineNumber, error, record) => 
        `❌ DATABASE ERROR in new_table.csv line ${lineNumber}`,
    },
  };
  
  return loadDataIntoStaging(db, context);
}
```

#### Benefits

- **Single Responsibility** - Core loading logic centralized in one place
- **DRY** - No code duplication across loaders
- **Consistent Error Handling** - All loaders provide line numbers and detailed context
- **Easy to Extend** - Add new loaders by defining context objects
- **Testable** - Transform functions can be unit tested independently
