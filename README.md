# hREA Get-Started Guide: Svelte Integration

Official reference implementation for integrating [hREA (Holochain Resource-Event-Agent) v0.3.1](https://github.com/h-REA/hREA) into **scaffolded** Svelte Holochain applications. This project serves as the foundation for hREA's official get-started documentation and establishes the integration pattern for other frameworks.

> **📌 Version**: This guide is specifically designed for **hREA v0.3.1**

## Overview

This project demonstrates the clean, minimal approach to integrating hREA with **scaffolded Holochain applications** created using the [official Holochain scaffolding tool](https://developer.holochain.org/get-started/3-forum-app-tutorial/). It provides a step-by-step example that will be used in the official hREA documentation and serves as the template for creating similar guides for Lit, non-scaffolded applications, and other frameworks.

**📋 Prerequisites**: This guide assumes you have already created a Holochain application using the official scaffolding tool with Svelte as the UI framework. If you haven't done this yet, follow the [Holochain Development Environment setup](https://developer.holochain.org/get-started/#2-installing-holochain-development-environment) and create a scaffolded app first.

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

This guide assumes you already have a **scaffolded Holochain application**. If not, you need to:

### 1. Install Holochain Development Environment
Follow the official guide: [Installing Holochain Development Environment](https://developer.holochain.org/get-started/#2-installing-holochain-development-environment)

### 2. Create a Scaffolded Holochain App
Create a new scaffolded web app:
```bash
nix run "github:/holochain/holonix?ref=main-0.5#hc-scaffold" -- web-app
```
Choose **Svelte** as your UI framework during scaffolding.

### 3. Additional Requirements
For hREA integration, ensure you also have:

```bash
# Add WebAssembly target for Rust
rustup target add wasm32-unknown-unknown

# Install Bun (if you chose it as package manager)
curl -fsSL https://bun.sh/install | bash
```

## Quick Start (Add hREA to Your Scaffolded App in Under 10 Minutes)

**Note**: These steps assume you already have a scaffolded Holochain app. If not, see the Prerequisites section above.

### 1. Add hREA to Your Existing Scaffolded App

Navigate to your scaffolded app directory and follow the integration steps in the [detailed tutorial](./TUTORIAL.md):

1. Add hREA role to your `workdir/happ.yaml`
2. Add hREA dependencies to your UI
3. Copy the integration files from this repository
4. Update your main App component

### 2. Start Your Integrated Application

```bash
npm start  # or your chosen package manager
```

This command will:
- Build your custom Rust zomes plus hREA integration
- Package your hApp bundle with hREA DNA included
- Start the Svelte development server
- Launch Holochain with your agents
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
