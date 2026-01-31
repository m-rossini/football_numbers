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