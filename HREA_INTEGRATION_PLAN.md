# hREA Integration Implementation Plan

Creating a clean, official installation process and basic example for hREA (Holochain Resource-Event-Agent) integration with Svelte scaffolded Holochain applications. This will serve as the foundation for the official hREA get-started documentation, establishing the pattern for other frameworks and non-scaffolded applications.

## Completed Tasks

- [x] Project scaffolding with Holochain Svelte template
- [x] Basic Holochain client setup with WebSocket connection
- [x] hREA DNA download automation in package.json
- [x] hApp bundle configuration with hREA DNA role
- [x] Apollo Client integration with hREA GraphQL schema
- [x] Context providers for client state management
- [x] Basic error handling and loading states
- [x] HREATest component with example operations
- [x] Working agent creation (Person/Organization) functionality
- [x] Query operations for retrieving agents

## In Progress Tasks

- [ ] Refactor codebase for official get-started documentation
- [ ] Create clean, minimal basic example for tutorial use
- [ ] Simplify installation process and remove unnecessary complexity
- [ ] Document step-by-step tutorial format

## Future Tasks (Official Documentation Expansion)

- [ ] Create pattern template for Lit scaffolded applications
- [ ] Create pattern template for non-scaffolded Holochain applications
- [ ] Develop comprehensive tutorial series for hREA integration
- [ ] Create framework-agnostic integration guide
- [ ] Build example gallery with different use cases

## Deferred Tasks (Post-Documentation)

- [ ] Enhanced UI components for common hREA operations
- [ ] TypeScript type definitions for hREA operations
- [ ] Comprehensive test suite covering all hREA operations
- [ ] Performance optimization and caching strategies
- [ ] Production deployment configuration
- [ ] Developer tools and debugging utilities
- [ ] Integration with external systems (APIs, databases)
- [ ] Multi-language support for ValueFlows ontology
- [ ] Advanced authentication and authorization patterns
- [ ] Real-time updates and subscription handling

## Implementation Plan

### Primary Goal: Official Get-Started Documentation

This project serves as the **reference implementation** for the official hREA get-started guide. The focus is on:

1. **Simplicity**: Minimal steps to get hREA working
2. **Clarity**: Each step should be obvious and well-documented
3. **Reproducibility**: Anyone should be able to follow the guide successfully
4. **Basic Example**: Demonstrate core hREA concepts (Agents, Resources, Events)
5. **Template Pattern**: Establish the integration pattern for other frameworks

### Architecture Overview (Tutorial-Focused)

Clean, minimal architecture suitable for learning:

1. **Holochain Layer**: Native WebSocket connection to Holochain conductor
2. **hREA Integration Layer**: GraphQL schema and Apollo Client configuration
3. **Context Management**: Simple Svelte stores for state management
4. **Basic Example**: Single component demonstrating key hREA operations
5. **Documentation**: Step-by-step tutorial format

### Key Integration Points

#### 1. Client Connection Architecture

```typescript
// Dual-client approach:
AppWebsocket (Holochain) → createHolochainSchema → ApolloClient (GraphQL)
```

#### 2. Context Provider Pattern

```svelte
ClientProvider → {HolochainClient, ApolloClient} → Child Components
```

#### 3. Error Handling Strategy

- Connection state management
- Graceful fallbacks for network issues
- User-friendly error messages
- Debugging information in development

### Core Features Implemented

#### Agent Management
- ✅ Person creation with validation
- ✅ Organization creation with validation  
- ✅ Agent querying and listing
- ✅ Error handling for empty states

#### GraphQL Integration
- ✅ Schema generation from hREA DNA
- ✅ Mutation handling (create operations)
- ✅ Query handling (read operations)
- ✅ Apollo Client configuration with caching

#### Development Experience
- ✅ Hot reloading with Vite
- ✅ TypeScript support throughout
- ✅ Comprehensive logging for debugging
- ✅ Automated hREA DNA downloading

### Technical Implementation Details

#### hREA Schema Integration

The project uses `@valueflows/vf-graphql-holochain` to generate a GraphQL schema from the hREA DNA, providing type-safe access to ValueFlows operations.

#### Connection Flow

1. **Holochain Connection**: `AppWebsocket.connect()` establishes WebSocket connection
2. **Schema Generation**: `createHolochainSchema()` creates GraphQL schema from hREA DNA
3. **Apollo Setup**: SchemaLink connects Apollo Client to the generated schema
4. **Context Provision**: Contexts make clients available throughout component tree

#### State Management

Uses Svelte stores with reactive patterns:
- `clientStore`: Manages Holochain connection state
- `apolloClientStore`: Manages hREA GraphQL client state
- Reactive updates trigger UI changes automatically

### Development Environment

#### Required Tools
- Bun for package management and task running
- Holochain CLI tools (hc, hc-spin)
- Rust toolchain for DNA compilation
- Node.js 16+ for runtime compatibility

#### Scripts and Automation
- `bun start`: Complete development environment setup
- `bun run build:happ`: DNA and hApp compilation
- `bun run download-hrea`: Automated hREA DNA retrieval
- `bun test`: Integration testing suite

### Relevant Files

- `package.json` - Project configuration and hREA DNA download automation ✅
- `workdir/happ.yaml` - Holochain application bundle with hREA DNA role ✅
- `ui/src/contexts.ts` - Client management and hREA integration logic ✅
- `ui/src/ClientProvider.svelte` - Context provider for client state ✅
- `ui/src/HREATest.svelte` - Example component demonstrating hREA operations ✅
- `ui/src/App.svelte` - Main application component with hREA integration ✅
- `ui/package.json` - Frontend dependencies including hREA GraphQL packages ✅
- `dnas/hc_test/workdir/dna.yaml` - Custom DNA configuration ✅
- `dnas/hc_test/zomes/coordinator/hc_test/src/lib.rs` - Coordinator zome implementation ✅
- `dnas/hc_test/zomes/integrity/hc_test/src/lib.rs` - Integrity zome implementation ✅

### Current Focus: Get-Started Documentation

#### Immediate Priorities

1. **Code Refactoring**: Simplify existing implementation for tutorial clarity
   - Remove unnecessary complexity from context management
   - Streamline error handling to essential cases only
   - Clean up HREATest component to focus on basic operations

2. **Basic Example Enhancement**: Create clear, educational examples
   - Person creation with proper validation
   - Resource creation and management
   - Simple economic event (transfer/transform)
   - Query operations for each entity type

3. **Installation Process**: Make it foolproof
   - Single command setup where possible
   - Clear prerequisite checking
   - Automatic environment validation
   - Helpful error messages with solutions

4. **Tutorial Documentation**: Step-by-step guide format
   - Prerequisites and setup
   - Code walkthrough with explanations
   - Common issues and troubleshooting
   - Next steps for building real applications

#### Success Criteria

- [ ] A new developer can follow the guide and have hREA working in under 10 minutes
- [ ] The basic example demonstrates all core ValueFlows concepts
- [ ] Code is clean, commented, and educational
- [ ] Documentation is suitable for official hREA get-started page

### Design Decisions

#### Why Apollo Client + GraphQL?
- **Type Safety**: Generated types from GraphQL schema
- **Caching**: Intelligent query result caching
- **Developer Experience**: Excellent tooling and debugging
- **Ecosystem**: Rich ecosystem of tools and extensions

#### Why Dual Client Architecture?
- **Separation of Concerns**: Native Holochain operations vs. hREA operations
- **Flexibility**: Can extend with custom DNA operations alongside hREA
- **Error Isolation**: Connection issues don't affect entire application
- **Performance**: Optimized for each use case

### Framework Pattern Template

This Svelte implementation establishes the pattern that will be replicated for:

- **Lit Scaffolded Applications**: Similar structure using Lit components
- **Non-scaffolded Applications**: Manual integration without frameworks
- **Other Frameworks**: React, Vue, Angular, etc.

The key patterns being established:
1. **Dual Client Architecture**: Holochain WebSocket + Apollo GraphQL
2. **Context/State Management**: Framework-specific state solutions
3. **Error Handling**: Graceful degradation and user feedback
4. **Basic Example Structure**: Consistent tutorial flow across frameworks

This implementation serves as the **reference standard** for hREA integration tutorials, ensuring consistency across all official documentation. 