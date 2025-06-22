# hREA Get-Started Guide: Svelte Integration

Official reference implementation for integrating [hREA (Holochain Resource-Event-Agent)](https://github.com/h-REA/hREA) into Svelte scaffolded Holochain applications. This project serves as the foundation for hREA's official get-started documentation and establishes the integration pattern for other frameworks.

## Overview

This project demonstrates the clean, minimal approach to integrating hREA with Holochain applications. It provides a step-by-step example that will be used in the official hREA documentation and serves as the template for creating similar guides for Lit, non-scaffolded applications, and other frameworks.

### Key Features

- 📚 **Tutorial-Focused**: Clear, step-by-step integration example suitable for documentation
- 🎯 **Basic Example**: Demonstrates core hREA concepts (Agents, Resources, Events)
- 🏗️ **Clean Architecture**: Simple, educational code structure for learning
- 📊 **GraphQL Integration**: Seamless hREA access through Apollo Client and ValueFlows GraphQL schema
- 🔧 **Reference Pattern**: Establishes the template for other framework integrations
- ⚡ **Quick Setup**: Get hREA working in under 10 minutes

## Architecture

### Components Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Svelte Frontend (UI)                     │
├─────────────────────────────────────────────────────────────┤
│        Apollo Client + GraphQL (ValueFlows Schema)          │
├─────────────────────────────────────────────────────────────┤
│                 Holochain Client (WebSocket)                │
├─────────────────────────────────────────────────────────────┤
│              hREA DNA        │     Custom DNA               │
│         (Economic Logic)     │   (App-specific Logic)       │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

- **`/ui`** - Svelte frontend application
  - `src/contexts.ts` - Holochain and Apollo client management
  - `src/ClientProvider.svelte` - Context provider for client connections
  - `src/HREATest.svelte` - **Basic example component** demonstrating hREA operations
- **`/dnas/hc_test`** - Custom Holochain DNA for app-specific logic
- **`/workdir`** - Holochain application bundle configuration (includes hREA DNA)
- **`/tests`** - Integration tests for the complete application

## Prerequisites

Before getting started, ensure you have:

- **Node.js** (v16+)
- **Bun** (latest version)
- **Holochain dev tools**:
  - `hc` (Holochain CLI)
  - `hc-spin` (Holochain development server)
- **Rust** (for building DNA zomes)

### Installing Prerequisites

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Install Holochain dev tools
bash <(curl https://holochain.org/setup)

# Verify installations
hc --version
cargo --version
bun --version
```

## Quick Start (Get hREA Working in Under 10 Minutes)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd hc-test
bun install
```

The hREA DNA will be automatically downloaded during installation.

### 2. Start the Application

```bash
bun start
```

This single command will:
- Download hREA DNA (if not already present)
- Build the Holochain DNA and hApp bundle
- Start the Svelte development server
- Launch Holochain with 2 agents
- Open Holochain Playground for debugging

### 3. Try the Basic Example

- **Frontend**: http://localhost:5173 (or the port shown in terminal)
- **Holochain Playground**: http://localhost:8888

In the frontend, you'll see the basic hREA example that demonstrates:
- Creating agents (Person/Organization)
- Querying the hREA system
- Error handling and connection status

### 4. Next Steps

Once you have the basic example working, you can:
- Explore the code in `ui/src/HREATest.svelte` to understand the integration
- Add more ValueFlows operations (Resources, Events, Processes)
- Customize the UI for your specific use case

## Development Workflow

### Building Components

```bash
# Build Rust zomes
bun run build:zomes

# Build complete hApp
bun run build:happ

# Build UI only
bun run --filter ui build
```

### Running Tests

```bash
# Run integration tests
bun test
```

### Production Build

```bash
# Package for web deployment
bun run package
```

## Understanding the Integration

### Basic hREA Integration Pattern

This project demonstrates the standard pattern for integrating hREA with Holochain applications:

1. **Holochain Connection**: Standard WebSocket connection to Holochain conductor
2. **hREA Schema**: GraphQL schema generated from the hREA DNA
3. **Apollo Client**: Connects the GraphQL schema to your frontend
4. **Context Management**: Makes clients available throughout your app

### Key Code Components

```typescript
// contexts.ts - The integration setup
- createClientStore()     // Manages Holochain WebSocket connection
- initializeHREA()       // Creates Apollo Client with hREA GraphQL schema
- getApolloClient()      // Provides access to hREA operations
```

### Basic Usage Example

```svelte
<script lang="ts">
  import { getApolloClient } from "./contexts";
  import { gql } from "@apollo/client/core";

  const client = getApolloClient();

  // Example: Create a person agent
  const createPerson = async () => {
    const result = await client.mutate({
      mutation: gql`
        mutation CreatePerson($person: AgentCreateParams!) {
          createPerson(person: $person) {
            agent { id name }
          }
        }
      `,
      variables: { 
        person: { name: "John Doe", note: "Example person" }
      }
    });
  };
</script>
```

### ValueFlows Concepts Demonstrated

The basic example shows how to work with core ValueFlows entities:

- **Agents**: People, organizations, and groups that participate in economic activities
- **Resources**: Physical and digital assets that can be used, consumed, or produced
- **Events**: Economic activities like transfers, transformations, and other processes

## Configuration

### Environment Variables

```bash
# Number of Holochain agents (default: 2)
AGENTS=3

# Custom bootstrap port
BOOTSTRAP_PORT=8000

# Custom UI port
UI_PORT=5173
```

### DNA Configuration

Edit `workdir/happ.yaml` to modify:
- DNA bundle paths
- Network configuration
- Role assignments

## Troubleshooting

### Common Issues

1. **Port conflicts**: Use `get-port` to automatically find available ports
2. **hREA DNA not found**: Run `bun run download-hrea`
3. **Build failures**: Ensure Rust target is installed: `rustup target add wasm32-unknown-unknown`

### Debug Mode

```bash
# Enable verbose logging
RUST_LOG=debug bun start
```

### Clean Reset

```bash
# Clean Holochain sandbox
hc sandbox clean

# Clean build artifacts
cargo clean
```

## Framework Pattern Template

This Svelte implementation establishes the integration pattern that will be replicated for:

- **Lit Scaffolded Applications**: Similar structure using Lit components
- **Non-scaffolded Applications**: Manual integration without framework scaffolding
- **Other Frameworks**: React, Vue, Angular, and more

### Key Patterns Established

1. **Dual Client Architecture**: Holochain WebSocket + Apollo GraphQL
2. **Context/State Management**: Framework-specific state management solutions
3. **Error Handling**: Graceful degradation and user feedback
4. **Basic Example Structure**: Consistent tutorial flow across all frameworks

## Contributing to hREA Documentation

This project serves as the foundation for official hREA get-started documentation. To contribute:

1. Focus on clarity and educational value over advanced features
2. Ensure the basic example remains simple and understandable
3. Test the installation process thoroughly
4. Document any changes to the integration pattern

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Resources

- [hREA Documentation](https://github.com/h-REA/hREA)
- [ValueFlows Specification](https://www.valueflo.ws/)
- [Holochain Developer Portal](https://developer.holochain.org/)
- [Svelte Documentation](https://svelte.dev/docs)

## Support

For questions and support:
- Open an issue in this repository
- Join the [Holochain Community](https://forum.holochain.org/)
- Connect with hREA developers in their [Matrix room](https://matrix.to/#/#hREA:matrix.org)
