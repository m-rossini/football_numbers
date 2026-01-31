# Development Container Setup

This project uses a containerized development environment for TypeScript/Express development.

## Requirements Met

✅ **Base Image**: Fedora (minimal, SELinux-compatible, latest stable)  
✅ **Global Tools**: TypeScript, ESLint, Nodemon, ts-node  
✅ **Development Tools**: Git, curl, wget, vim, bash, npm, network tools  
✅ **Runtime**: Latest Node.js  
✅ **Multi-stage Build**: Optimized for layer reuse and smaller intermediate stages  
✅ **VSCode Integration**: Ready for remote container development  
✅ **SELinux Support**: Volume mapped with `:z` flag for proper context  
✅ **RW Access**: Full read-write access to project files  

## Usage

### Option 1: VSCode Remote Containers (Recommended)

1. Install the [Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension
2. Open the project in VSCode
3. Click the green remote indicator (bottom-left)
4. Select "Reopen in Container"
5. VSCode will build and attach automatically

### Option 2: Podman Compose

```bash
# Build the container
podman-compose -f dev-compose.yml build

# Start and attach to container
podman-compose -f dev-compose.yml run --rm dev

# Or run a specific command
podman-compose -f dev-compose.yml run --rm dev npm install
podman-compose -f dev-compose.yml run --rm dev npm test
podman-compose -f dev-compose.yml run --rm dev npm run dev
```

### Option 3: Direct Podman

```bash
podman build -t football-numbers-dev .
podman run -it --rm -v .:/workspace:z football-numbers-dev
```

## Features

- **Nodemon**: Auto-restart on file changes (`nodemon src/index.ts`)
- **TypeScript**: Full TypeScript support with global ts-node
- **ESLint**: Code quality checking
- **SELinux Ready**: Proper volume context labels for Fedora
- **Network Access**: All standard network tools available

## Development Workflow

Inside the container:

```bash
# Install dependencies
npm install

# Start development server with hot reload
nodemon src/index.ts

# Build TypeScript
tsc

# Run linter
eslint src/

# Run tests
npm test
```

## Notes

- The container maps your project directory to `/workspace`
- All file changes in the editor are reflected immediately in the container
- SELinux labels (`:z` flag) ensure proper file access on Fedora
