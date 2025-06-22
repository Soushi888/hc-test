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
    "@valueflows/vf-graphql-holochain": "^0.0.3-alpha.9",
    "graphql": "^16.8.0"
  }
}
```

**Key dependencies explained (for hREA v0.3.1):**
- `@apollo/client` - GraphQL client for React/Svelte integration
- `@holochain/client` - Official Holochain client for WebSocket connections
- `@msgpack/msgpack` - MessagePack serialization (required by Holochain client)
- `@valueflows/vf-graphql-holochain` - hREA-specific GraphQL schema and utilities
- `graphql` - Core GraphQL library

Install the dependencies:
```bash
cd ui
npm install  # or your chosen package manager
```

### Step 4: Create Integration Files

Copy the integration files from this repository to your scaffolded app:

1. **`ui/src/contexts.svelte.ts`** - State management with Svelte 5 runes
2. **`ui/src/ClientProvider.svelte`** - Connection provider component  
3. **`ui/src/HREATest.svelte`** - Basic example component

### Step 5: Update Your Main App Component

**Edit `ui/src/App.svelte`** to include the hREA integration:

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
```

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
- **hREA**: Connect with hREA developers in their [Matrix room](https://matrix.to/#/#hREA:matrix.org) 