# hREA Integration Tutorial: Svelte + Holochain

A step-by-step guide to integrating **hREA v0.3.1** into your **scaffolded** Svelte Holochain application.

> **⚠️ Version Notice**: This tutorial is specifically designed for **hREA version 0.3.1**. Different versions may require different integration steps.

## Prerequisites

This tutorial assumes you're working with a **scaffolded Holochain application** created using the official Holochain scaffolding tool. If you haven't created your Holochain app yet, follow these steps first:

### 1. Install Holochain Development Environment

Follow the official Holochain installation guide:
**[Installing Holochain Development Environment](https://developer.holochain.org/get-started/#2-installing-holochain-development-environment)**

This will install:
- Nix package manager
- Holochain development tools
- All required dependencies

### 2. Create a Scaffolded Holochain Web App

Once the development environment is installed, create a new Holochain web application:

```bash
# Navigate to your projects directory
cd ~/your-projects-directory

# Create a scaffolded Holochain web app
nix run "github:/holochain/holonix?ref=main-0.5#hc-scaffold" -- web-app
```

**During scaffolding, choose:**
- UI Framework: **Svelte**
- App name: Your preferred name (e.g., `my_hrea_app`)
- Holonix environment: **Yes (recommended)**
- Package manager: Your preference (npm, bun, pnpm, or yarn)
- Initial DNA: **Yes**
- DNA name: Your preferred name (e.g., `main`)

For detailed scaffolding instructions, see the official tutorial:
**[Forum App Tutorial - Scaffolding Steps](https://developer.holochain.org/get-started/3-forum-app-tutorial/)**

> **📝 Note on Svelte 5**: The scaffolded templates may use older Svelte patterns. This tutorial uses modern Svelte 5 runes for better performance and developer experience. See the [Svelte 5 Migration Guide](./SVELTE_5_MIGRATION.md) for details on the benefits and patterns used.

## Integration Steps

Now that you have a scaffolded Holochain app, you can integrate hREA:

### Step 1: Add hREA Configuration

Navigate to your scaffolded app directory and add the hREA role to your hApp configuration.

**Edit `workdir/happ.yaml`:**
```yaml
# ... existing content ...
roles:
  - name: your_main_dna    # Your existing DNA role
    dna:
      bundled: ../dnas/your_dna/workdir/your_dna.dna
      # ... existing content ...
  # Add hREA role
  - name: hrea
      provisioning:
        strategy: create
        deferred: false
      dna:
        bundled: ./hrea.dna
        modifiers:
          network_seed: null
          properties: null
        installed_hash: null
        clone_limit: 0
```

**Edit `workdir/web-happ.yaml`:**
```yaml
# ... existing content ...
# Add hREA role here too if needed for web deployment
```

### Step 2: Download hREA DNA

**Edit your `package.json`** to add hREA v0.3.1 DNA download:
```json
{
  "scripts": {
    "postinstall": "curl -L https://github.com/h-REA/hREA/releases/download/v0.3.1/hrea.dna -o workdir/hrea.dna"
  }
}
```

Then run:
```bash
npm install  # or your chosen package manager
```

### Step 3: Add hREA Dependencies

**Add to your UI `package.json`** (compatible with hREA v0.3.1):
```json
{
  "dependencies": {
    "@apollo/client": "^3.13.8",
    "@holochain/client": "^0.19.0",
    "@msgpack/msgpack": "^2.8.0",
    "@valueflows/vf-graphql-holochain": "^0.0.3-alpha.10",
    "graphql": "^16.8.0"
  }
}
```

**Key dependencies explained (for hREA v0.3.1):**
- `@apollo/client` - GraphQL client for React/Svelte integration
- `@holochain/client` - Official Holochain client for WebSocket connections
- `@msgpack/msgpack` - MessagePack serialization (required by Holochain client)
- `@valueflows/vf-graphql-holochain` - hREA v0.3.1 GraphQL schema and utilities (version 0.0.3-alpha.10)
- `graphql` - Core GraphQL library

Install the dependencies:
```bash
cd ui
npm install  # or your chosen package manager
```

### Step 4: Modify Integration Files

The scaffolded Holochain application already includes basic files that we need to modify for hREA integration. We'll update these files to use modern Svelte 5 runes for optimal performance and developer experience.

#### 4.1. Replace `ui/src/contexts.ts` with `ui/src/contexts.svelte.ts`

First, delete the existing `ui/src/contexts.ts` file and create `ui/src/contexts.svelte.ts` with Svelte 5 rune-based state management:

```bash
# Delete the old file
rm ui/src/contexts.ts

# Create the new file (content below)
touch ui/src/contexts.svelte.ts
```

This file manages the connection between Svelte, Holochain, and hREA using Svelte 5 runes:
**Content for `ui/src/contexts.svelte.ts`:**

```typescript
import { ApolloClient, InMemoryCache, from } from "@apollo/client/core";
import { AppWebsocket, InstalledCell, type AppInfo } from "@holochain/client";
import { HolochainLink } from "@valueflows/vf-graphql-holochain";

// Holochain client state management
export class HolochainClientState {
  client = $state<AppWebsocket | null>(null);
  loading = $state(true);
  error = $state<string | null>(null);
  appInfo = $state<AppInfo | null>(null);

  async connect() {
    try {
      this.loading = true;
      this.error = null;

      const client = await AppWebsocket.connect({
        url: new URL("ws://localhost", `${window.location.protocol}//${window.location.host}`),
        wsUrl: "ws://localhost:8888",
      });

      const appInfo = await client.appInfo();

      this.client = client;
      this.appInfo = appInfo;
      this.loading = false;
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Failed to connect to Holochain";
      this.loading = false;
    }
  }
}

// hREA client state management
export class HREAClientState {
  apolloClient = $state<ApolloClient<any> | null>(null);
  loading = $state(true);
  error = $state<string | null>(null);

  constructor(private holochainState: HolochainClientState) {
    $effect(() => {
      if (this.holochainState.client && this.holochainState.appInfo) {
        this.initializeHREA();
      }
    });
  }

  private async initializeHREA() {
    try {
      this.loading = true;
      this.error = null;

      const hreaCell = this.holochainState.appInfo!.installed_cells.find(
        (cell: InstalledCell) => cell.role_name === "hrea"
      );

      if (!hreaCell) {
        throw new Error("hREA cell not found in app");
      }

      const authToken = Buffer.from(
        `${hreaCell.cell_id[0]}:${hreaCell.cell_id[1]}`
      ).toString("base64");

      const link = new HolochainLink({
        uri: "ws://localhost:8888",
        wsClient: this.holochainState.client!,
        authToken,
      });

      this.apolloClient = new ApolloClient({
        link: from([link]),
        cache: new InMemoryCache(),
      });

      this.loading = false;
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Failed to initialize hREA";
      this.loading = false;
    }
  }
}

// Global state instances
export const holochainClientState = new HolochainClientState();
export const hreaClientState = new HREAClientState(holochainClientState);

// Helper functions for getting states
export function getHolochainClient() {
  return holochainClientState;
}

export function getHREAClient() {
  return hreaClientState;
}
```

#### 4.2. Create or Replace `ui/src/ClientProvider.svelte`

If this file doesn't exist in your scaffolded app, create it. If it exists, replace its content with the following. This component manages connection states and provides clients to child components:

```svelte
<script lang="ts">
  import { onMount } from "svelte";
  import {
    holochainClientState,
    hreaClientState,
  } from "./contexts.svelte";

  interface Props {
    children?: any;
  }

  let { children }: Props = $props();

  const holochainState = holochainClientState;
  const hreaState = hreaClientState;

  onMount(() => {
    holochainState.connect();
  });
</script>

{#if holochainState.loading}
  <div class="status connecting">
    <div class="spinner"></div>
    <span>Connecting to Holochain...</span>
  </div>
{:else if holochainState.error}
  <div class="status error">
    <strong>Holochain Connection Error:</strong>
    <p>{holochainState.error}</p>
    <button onclick={() => holochainState.connect()}>
      Retry Connection
    </button>
  </div>
{:else if hreaState.loading}
  <div class="status connecting">
    <div class="spinner"></div>
    <span>Initializing hREA...</span>
  </div>
{:else if hreaState.error}
  <div class="status error">
    <strong>hREA Initialization Error:</strong>
    <p>{hreaState.error}</p>
    <button onclick={() => holochainState.connect()}>
      Retry Connection
    </button>
  </div>
{:else if holochainState.client && hreaState.apolloClient}
  <div class="app-container">
    {@render children?.()}
  </div>
{:else}
  <div class="status error">
    <strong>Unknown State</strong>
    <p>Something went wrong during initialization.</p>
  </div>
{/if}

<style>
  .status {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    padding: 2rem;
    text-align: center;
    border-radius: 8px;
    margin: 1rem;
  }

  .connecting {
    background-color: #f0f9ff;
    border: 2px solid #0ea5e9;
    color: #0c4a6e;
  }

  .error {
    background-color: #fef2f2;
    border: 2px solid #ef4444;
    color: #991b1b;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e5e7eb;
    border-top: 3px solid #0ea5e9;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background-color: #0ea5e9;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  button:hover {
    background-color: #0284c7;
  }

  .app-container {
    min-height: 100vh;
    padding: 1rem;
  }
</style>
```

#### 4.3. Create `ui/src/HREATest.svelte`

This is a new component that demonstrates basic hREA operations. Create this file in your scaffolded app:

```svelte
<script lang="ts">
  import { getHREAClient } from "./contexts.svelte";
  import { gql } from "@apollo/client/core";

  const hreaClient = getHREAClient();
  let apolloClient = $derived(hreaClient.apolloClient);

  let results = $state<string[]>([]);
  let isWorking = $state(false);

  $effect(() => {
    if (apolloClient && results.length === 0) {
      results.push("✅ Connected to hREA successfully");
    }
  });

  async function createPerson() {
    if (!apolloClient) return;
    
    isWorking = true;
    try {
      const result = await apolloClient.mutate({
        mutation: gql`
          mutation CreatePerson($person: AgentCreateParams!) {
            createPerson(person: $person) {
              agent {
                id
                name
                note
              }
            }
          }
        `,
        variables: {
          person: {
            name: `Person ${Date.now()}`,
            note: "Created from hREA integration example"
          }
        }
      });

      const agent = result.data.createPerson.agent;
      results.push(`👤 Created Person: ${agent.name} (ID: ${agent.id})`);
    } catch (error) {
      results.push(`❌ Error creating person: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      isWorking = false;
    }
  }

  async function createOrganization() {
    if (!apolloClient) return;
    
    isWorking = true;
    try {
      const result = await apolloClient.mutate({
        mutation: gql`
          mutation CreateOrganization($organization: OrganizationCreateParams!) {
            createOrganization(organization: $organization) {
              agent {
                id
                name
                note
              }
            }
          }
        `,
        variables: {
          organization: {
            name: `Organization ${Date.now()}`,
            note: "Created from hREA integration example"
          }
        }
      });

      const agent = result.data.createOrganization.agent;
      results.push(`🏢 Created Organization: ${agent.name} (ID: ${agent.id})`);
    } catch (error) {
      results.push(`❌ Error creating organization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      isWorking = false;
    }
  }

  async function queryAgents() {
    if (!apolloClient) return;
    
    isWorking = true;
    try {
      const result = await apolloClient.query({
        query: gql`
          query GetAgents {
            agents {
              edges {
                node {
                  id
                  name
                  note
                }
              }
            }
          }
        `
      });

      const agents = result.data.agents.edges;
      results.push(`📋 Found ${agents.length} agents in the system`);
      
      agents.forEach((edge: any, index: number) => {
        const agent = edge.node;
        results.push(`  ${index + 1}. ${agent.name} (${agent.note || 'No description'})`);
      });
    } catch (error) {
      results.push(`❌ Error querying agents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      isWorking = false;
    }
  }

  async function createResourceSpec() {
    if (!apolloClient) return;
    
    isWorking = true;
    try {
      const result = await apolloClient.mutate({
        mutation: gql`
          mutation CreateResourceSpecification($resourceSpecification: ResourceSpecificationCreateParams!) {
            createResourceSpecification(resourceSpecification: $resourceSpecification) {
              resourceSpecification {
                id
                name
                note
              }
            }
          }
        `,
        variables: {
          resourceSpecification: {
            name: `Resource Spec ${Date.now()}`,
            note: "Example resource specification"
          }
        }
      });

      const spec = result.data.createResourceSpecification.resourceSpecification;
      results.push(`📦 Created Resource Specification: ${spec.name} (ID: ${spec.id})`);
    } catch (error) {
      results.push(`❌ Error creating resource spec: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      isWorking = false;
    }
  }

  function clearResults() {
    results = [];
  }
</script>

<div class="hrea-demo">
  <header>
    <h1>🌊 hREA Integration Demo</h1>
    <p>Test basic hREA operations with ValueFlows concepts</p>
  </header>

  <div class="demo-section">
    <h2>🏢 Agent Management</h2>
    <p>Create and manage economic agents (people and organizations)</p>
    
    <div class="button-group">
      <button onclick={createPerson} disabled={isWorking}>
        {isWorking ? "Working..." : "Create Person"}
      </button>
      
      <button onclick={createOrganization} disabled={isWorking}>
        {isWorking ? "Working..." : "Create Organization"}
      </button>

      <button onclick={queryAgents} disabled={isWorking}>
        {isWorking ? "Working..." : "List All Agents"}
      </button>
    </div>
  </div>

  <div class="demo-section">
    <h2>📦 Resource Management</h2>
    <p>Define types of resources for economic activities</p>
    
    <div class="button-group">
      <button onclick={createResourceSpec} disabled={isWorking}>
        {isWorking ? "Working..." : "Create Resource Specification"}
      </button>
    </div>
  </div>

  <div class="results-section">
    <div class="results-header">
      <h3>📄 Results</h3>
      <button onclick={clearResults} class="clear-button">Clear</button>
    </div>
    
    <div class="results-log">
      {#each results as result, index (index)}
        <div class="result-item">{result}</div>
      {:else}
        <div class="no-results">No operations performed yet. Try the buttons above!</div>
      {/each}
    </div>
  </div>
</div>

<style>
  .hrea-demo {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    font-family: system-ui, -apple-system, sans-serif;
  }

  header {
    text-align: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #e5e7eb;
  }

  header h1 {
    margin: 0;
    color: #1f2937;
    font-size: 2.5rem;
  }

  header p {
    margin: 0.5rem 0 0;
    color: #6b7280;
    font-size: 1.1rem;
  }

  .demo-section {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background-color: #f9fafb;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  .demo-section h2 {
    margin: 0 0 0.5rem;
    color: #374151;
    font-size: 1.5rem;
  }

  .demo-section p {
    margin: 0 0 1rem;
    color: #6b7280;
  }

  .button-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  button {
    padding: 0.75rem 1.5rem;
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  button:hover:not(:disabled) {
    background-color: #2563eb;
  }

  button:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }

  .results-section {
    margin-top: 2rem;
  }

  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .results-header h3 {
    margin: 0;
    color: #374151;
  }

  .clear-button {
    padding: 0.5rem 1rem;
    background-color: #ef4444;
    font-size: 0.875rem;
  }

  .clear-button:hover:not(:disabled) {
    background-color: #dc2626;
  }

  .results-log {
    background-color: #1f2937;
    color: #f9fafb;
    padding: 1rem;
    border-radius: 6px;
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    max-height: 400px;
    overflow-y: auto;
  }

  .result-item {
    margin-bottom: 0.5rem;
    padding: 0.25rem 0;
    border-bottom: 1px solid #374151;
  }

  .result-item:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

  .no-results {
    color: #9ca3af;
    font-style: italic;
    text-align: center;
    padding: 2rem;
  }
</style>
```

### Step 5: Update Your Main App Component

The scaffolded application already includes an `ui/src/App.svelte` file. **Replace its content** with the following to include the hREA integration:

```svelte
<script lang="ts">
  import ClientProvider from "./ClientProvider.svelte";
  import HREATest from "./HREATest.svelte";
</script>

<ClientProvider>
  <main>
    <h1>Your Holochain App with hREA</h1>
    <HREATest />
  </main>
</ClientProvider>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
```

**What this does:**
- Wraps your app with `ClientProvider` to manage Holochain and hREA connections
- Includes the `HREATest` component to demonstrate basic hREA operations
- Provides a clean UI foundation for your hREA-enabled application

## Quick Start (10 Minutes)

Now you can start your integrated application:

```bash
# From your app root directory
npm start  # or your chosen package manager
```

**What this command does:**
1. Builds the Rust zomes (WebAssembly modules)
2. Packages the Holochain DNA and hApp (including hREA)
3. Starts the Svelte development server
4. Launches Holochain with 2 agents
5. Opens Holochain Playground for debugging

**Expected output:**
```
✓ Built Rust zomes
✓ Packaged hApp with hREA integration
✓ Started Svelte dev server on http://localhost:5173
✓ Launched Holochain with 2 agents
✓ Holochain Playground available at http://localhost:8888
```

## Try the Basic Example

1. Open your browser to http://localhost:5173
2. Wait for "Connected to hREA successfully" message
3. Try the example operations:
   - Click "Create Person" to create a person agent
   - Click "Create Organization" to create an organization agent
   - Click "List All Agents" to query all agents
   - Click "Create Resource Specification" to create a resource spec

## Understanding the Integration

### Architecture Overview

```
┌─────────────────────────────────────────────────┐
│               Svelte Frontend                   │  
├─────────────────────────────────────────────────┤
│    Apollo Client + GraphQL (ValueFlows)        │  
├─────────────────────────────────────────────────┤
│           Holochain Client (WebSocket)          │  
├─────────────────────────────────────────────────┤
│        hREA DNA      │      Custom DNA         │  
│   (Economic Logic)   │  (App-specific Logic)   │  
└─────────────────────────────────────────────────┘
```

### Key Files and Their Purpose

#### 1. `ui/src/contexts.ts` - Integration Logic
This file manages the connection between Svelte, Holochain, and hREA:

```typescript
// Holochain WebSocket connection
export function createClientStore() { /* ... */ }

// hREA GraphQL client initialization  
export function initializeHREA() { /* ... */ }

// Get Apollo client for hREA operations
export function getApolloClient() { /* ... */ }
```

#### 2. `ui/src/ClientProvider.svelte` - Context Provider
Manages connection state and makes clients available to child components:

```svelte
<!-- Handles connection states -->
{#if loading}
  <div class="status connecting">Connecting...</div>
{:else if client && apolloClient}
  <!-- App content when everything is ready -->
{/if}
```

#### 3. `ui/src/HREATest.svelte` - Basic Example
Demonstrates core hREA operations:

```typescript
// Example: Create a person agent
const result = await apolloClient.mutate({
  mutation: gql`
    mutation CreatePerson($person: AgentCreateParams!) {
      createPerson(person: $person) {
        agent { id name }
      }
    }
  `,
  variables: { person: { name: "John Doe" } }
});
```

#### 4. `workdir/happ.yaml` - App Configuration
Defines the Holochain application structure:

```yaml
roles:
  - name: hc_test      # Your custom DNA
    dna:
      bundled: ../dnas/hc_test/workdir/hc_test.dna
  - name: hrea         # hREA DNA for economic logic
    dna:
      bundled: ./hrea.dna
```

## ValueFlows Concepts

### Agents
Entities that participate in economic activities:
- **Person**: Individual human agents
- **Organization**: Collective agents (companies, cooperatives, etc.)

### Resources  
Assets that can be used, consumed, or produced:
- **Resource Specification**: Definition of a type of resource
- **Resource**: Actual instances of resources

### Events
Economic activities that affect resources:
- **Transfer**: Moving resources between agents
- **Transform**: Converting resources into other resources
- **Consume**: Using up resources
- **Produce**: Creating new resources

## Common Operations

### Creating Agents

```typescript
// Create a person
const createPerson = async () => {
  const result = await apolloClient.mutate({
    mutation: gql`
      mutation CreatePerson($person: AgentCreateParams!) {
        createPerson(person: $person) {
          agent { id name note }
        }
      }
    `,
    variables: {
      person: {
        name: "Alice Smith",
        note: "Software developer"
      }
    }
  });
};

// Create an organization
const createOrganization = async () => {
  const result = await apolloClient.mutate({
    mutation: gql`
      mutation CreateOrganization($organization: OrganizationCreateParams!) {
        createOrganization(organization: $organization) {
          agent { id name note }
        }
      }
    `,
    variables: {
      organization: {
        name: "Tech Cooperative",
        note: "Worker-owned software company"
      }
    }
  });
};
```

### Querying Data

```typescript
// Get all agents
const queryAgents = async () => {
  const result = await apolloClient.query({
    query: gql`
      query GetAgents {
        agents {
          edges {
            node {
              id
              name
              note
            }
          }
        }
      }
    `
  });
  
  const agents = result.data.agents.edges;
  return agents.map(edge => edge.node);
};
```

### Creating Resources

```typescript
// Create a resource specification
const createResourceSpec = async () => {
  const result = await apolloClient.mutate({
    mutation: gql`
      mutation CreateResourceSpecification($resourceSpecification: ResourceSpecificationCreateParams!) {
        createResourceSpecification(resourceSpecification: $resourceSpecification) {
          resourceSpecification { id name note }
        }
      }
    `,
    variables: {
      resourceSpecification: {
        name: "Software License",
        note: "Digital software license"
      }
    }
  });
};
```

## Troubleshooting

### Common Issues

#### 1. "can't find crate for `core`" Error
**Problem**: WebAssembly target not installed
**Solution**: 
```bash
rustup target add wasm32-unknown-unknown
```

#### 2. "hREA DNA not found" Error
**Problem**: hREA v0.3.1 DNA not downloaded
**Solution**:
```bash
# Download hREA v0.3.1 DNA manually
curl -L https://github.com/h-REA/hREA/releases/download/v0.3.1/hrea.dna -o workdir/hrea.dna

# Or run the postinstall script
npm run postinstall
```

#### 3. Connection Timeout
**Problem**: Holochain conductor not responding
**Solution**:
```bash
# Clean and restart
hc sandbox clean
bun start
```

#### 4. Port Already in Use
**Problem**: Default ports are occupied
**Solution**:
```bash
# Use different ports
UI_PORT=3000 BOOTSTRAP_PORT=9000 bun start
```

### Debug Mode

Enable verbose logging for troubleshooting:
```bash
RUST_LOG=debug bun start
```

### Clean Reset

If you encounter persistent issues:
```bash
# Clean Holochain sandbox
hc sandbox clean

# Clean Rust build artifacts  
cargo clean

# Reinstall dependencies
rm -rf node_modules
bun install
```

## Next Steps

Once you have the basic example working:

1. **Explore the Code**: Study `ui/src/HREATest.svelte` to understand the integration patterns
2. **Add More Operations**: Implement resource creation, economic events, and processes
3. **Customize the UI**: Modify the interface for your specific use case
4. **Add Custom Logic**: Extend the custom DNA with app-specific functionality
5. **Deploy**: Package for production deployment

## Resources

- [hREA Documentation](https://github.com/h-REA/hREA) (this tutorial uses v0.3.1)
- [hREA v0.3.1 Release](https://github.com/h-REA/hREA/releases/tag/v0.3.1)
- [ValueFlows Specification](https://www.valueflo.ws/)
- [Holochain Developer Docs](https://developer.holochain.org/)
- [Svelte Documentation](https://svelte.dev/docs)
- [Apollo Client Docs](https://www.apollographql.com/docs/react/)

## Alternative Implementation: Using svelte-apollo

For a more Svelte-idiomatic approach, you could use `svelte-apollo` instead of direct Apollo Client. Here's how the code would look with hREA v0.3.1:

### Additional Dependency
```json
{
  "dependencies": {
    "svelte-apollo": "^0.5.0"
  }
}
```

> **📝 Note**: This alternative approach still uses the same `@valueflows/vf-graphql-holochain": "^0.0.3-alpha.10"` version that corresponds to hREA v0.3.1.

### Updated `contexts.svelte.ts` with svelte-apollo
```typescript
import { ApolloClient, InMemoryCache, from } from "@apollo/client/core";
import { AppWebsocket, InstalledCell, type AppInfo } from "@holochain/client";
import { HolochainLink } from "@valueflows/vf-graphql-holochain";
import { setClient } from "svelte-apollo";

// Holochain client state (same as before)
export class HolochainClientState {
  client = $state<AppWebsocket | null>(null);
  loading = $state(true);
  error = $state<string | null>(null);
  appInfo = $state<AppInfo | null>(null);

  // ... same connection logic as before ...
}

// hREA client state with svelte-apollo integration
export class HREAClientState {
  apolloClient = $state<ApolloClient<any> | null>(null);
  loading = $state(true);
  error = $state<string | null>(null);

  constructor(private holochainState: HolochainClientState) {
    $effect(() => {
      if (this.holochainState.client && this.holochainState.appInfo) {
        this.initializeHREA();
      }
    });
  }

  private async initializeHREA() {
    try {
      this.loading = true;
      this.error = null;

      const hreaCell = this.holochainState.appInfo!.installed_cells.find(
        (cell: InstalledCell) => cell.role_name === "hrea"
      );

      if (!hreaCell) {
        throw new Error("hREA cell not found in app");
      }

      const authToken = Buffer.from(
        `${hreaCell.cell_id[0]}:${hreaCell.cell_id[1]}`
      ).toString("base64");

      const link = new HolochainLink({
        uri: "ws://localhost:8888",
        wsClient: this.holochainState.client!,
        authToken,
      });

      this.apolloClient = new ApolloClient({
        link: from([link]),
        cache: new InMemoryCache(),
      });

      // Set the client globally for svelte-apollo
      setClient(this.apolloClient);

      this.loading = false;
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Failed to initialize hREA";
      this.loading = false;
    }
  }
}

// Global state instances
export const holochainClientState = new HolochainClientState();
export const hreaClientState = new HREAClientState(holochainClientState);

// Helper functions for getting states
export function getHolochainClient() {
  return holochainClientState;
}

export function getHREAClient() {
  return hreaClientState;
}
```

### Updated `HREATest.svelte` with svelte-apollo
```svelte
<script lang="ts">
  import { query, mutation } from "svelte-apollo";
  import { gql } from "@apollo/client/core";
  import { getHREAClient } from "./contexts.svelte";

  const hreaClient = getHREAClient();

  // Using svelte-apollo stores for queries
  const agentsQuery = query(gql`
    query GetAgents {
      agents {
        edges {
          node {
            id
            name
            note
          }
        }
      }
    }
  `);

  // Using svelte-apollo stores for mutations
  const createPersonMutation = mutation(gql`
    mutation CreatePerson($person: AgentCreateParams!) {
      createPerson(person: $person) {
        agent {
          id
          name
          note
        }
      }
    }
  `);

  const createOrgMutation = mutation(gql`
    mutation CreateOrganization($organization: OrganizationCreateParams!) {
      createOrganization(organization: $organization) {
        agent {
          id
          name
          note
        }
      }
    }
  `);

  // Reactive agents list from the query store
  $: agents = $agentsQuery.data?.agents?.edges?.map(edge => edge.node) || [];

  // Event handlers using the mutation stores
  async function handleCreatePerson() {
    try {
      await createPersonMutation({
        variables: {
          person: {
            name: `Person ${Date.now()}`,
            note: "Created via svelte-apollo"
          }
        }
      });
      // Refetch agents automatically handled by svelte-apollo
      agentsQuery.refetch();
    } catch (error) {
      console.error("Error creating person:", error);
    }
  }

  async function handleCreateOrganization() {
    try {
      await createOrgMutation({
        variables: {
          organization: {
            name: `Organization ${Date.now()}`,
            note: "Created via svelte-apollo"
          }
        }
      });
      agentsQuery.refetch();
    } catch (error) {
      console.error("Error creating organization:", error);
    }
  }

  function handleRefreshAgents() {
    agentsQuery.refetch();
  }
</script>

{#if hreaClient.loading}
  <div class="status connecting">
    <div class="spinner"></div>
    Connecting to hREA...
  </div>
{:else if hreaClient.error}
  <div class="status error">
    <strong>Connection Error:</strong> {hreaClient.error}
  </div>
{:else if hreaClient.apolloClient}
  <div class="status success">
    ✅ Connected to hREA successfully
  </div>

  <div class="demo-section">
    <h2>🏢 Agent Management</h2>
    <p>Create and manage economic agents (people and organizations)</p>
    
    <div class="button-group">
      <button on:click={handleCreatePerson} disabled={$createPersonMutation.loading}>
        {$createPersonMutation.loading ? "Creating..." : "Create Person"}
      </button>
      
      <button on:click={handleCreateOrganization} disabled={$createOrgMutation.loading}>
        {$createOrgMutation.loading ? "Creating..." : "Create Organization"}
      </button>

      <button on:click={handleRefreshAgents} disabled={$agentsQuery.loading}>
        {$agentsQuery.loading ? "Loading..." : "Refresh Agents"}
      </button>
    </div>

    <!-- Query loading and error states -->
    {#if $agentsQuery.loading}
      <div class="loading">Loading agents...</div>
    {:else if $agentsQuery.error}
      <div class="error">Error loading agents: {$agentsQuery.error.message}</div>
    {:else}
      <div class="agents-list">
        <h3>Current Agents ({agents.length})</h3>
        {#each agents as agent (agent.id)}
          <div class="agent-card">
            <strong>{agent.name}</strong>
            {#if agent.note}
              <p>{agent.note}</p>
            {/if}
            <small>ID: {agent.id}</small>
          </div>
        {:else}
          <p>No agents created yet. Try creating a person or organization!</p>
        {/each}
      </div>
    {/if}

    <!-- Mutation error states -->
    {#if $createPersonMutation.error}
      <div class="error">Error creating person: {$createPersonMutation.error.message}</div>
    {/if}
    
    {#if $createOrgMutation.error}
      <div class="error">Error creating organization: {$createOrgMutation.error.message}</div>
    {/if}
  </div>
{/if}

<!-- Same styles as before -->
<style>
  /* ... same styles ... */
</style>
```

### Key Benefits of svelte-apollo Approach

1. **Reactive Stores**: Queries and mutations are Svelte stores that automatically update components
2. **Built-in Loading States**: `$query.loading`, `$mutation.loading` are automatically managed
3. **Error Handling**: `$query.error`, `$mutation.error` provide reactive error states
4. **Automatic Refetching**: Less manual cache management needed
5. **Cleaner Code**: Less boilerplate, more declarative
6. **Better TypeScript**: Better type inference with Svelte stores

### Trade-offs

**Direct Apollo Client (Current)**:
- ✅ More explicit control
- ✅ Better for learning GraphQL concepts
- ✅ Smaller bundle size
- ❌ More boilerplate code
- ❌ Manual state management

**svelte-apollo**:
- ✅ More reactive and Svelte-idiomatic
- ✅ Less boilerplate
- ✅ Built-in loading/error states
- ✅ Automatic subscription management
- ❌ Additional dependency
- ❌ Less explicit control over caching

For tutorials, the direct Apollo Client approach is probably better for educational purposes, but for production apps, `svelte-apollo` would provide a better developer experience.

## Getting Help

- **Issues**: Open an issue in this repository
- **Community**: Join the [Holochain Forum](https://forum.holochain.org/)
- **hREA**: Connect with hREA developers in their [Discord Server](https://discord.gg/hREA) 