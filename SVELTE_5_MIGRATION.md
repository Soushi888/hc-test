# Svelte 5 Rune Migration Guide

This document explains how the hREA integration codebase was updated to use Svelte 5 runes for modern, reactive state management.

## Overview

The codebase has been fully migrated from traditional Svelte stores to Svelte 5 runes, providing:
- **Better performance** with more granular reactivity
- **Simpler syntax** with no subscription management needed
- **Enhanced TypeScript support** with better type inference
- **Modern patterns** following Svelte 5 best practices

## Key Changes

### 1. Context Management (`ui/src/contexts.ts`)

**Before (Stores):**
```typescript
// Using writable stores
const store = writable<ClientStore>({
  client: undefined,
  error: undefined,
  loading: false,
});

export function createClientStore() {
  return {
    subscribe: store.subscribe,
    connect: async () => {
      store.update(s => ({ ...s, loading: true }));
      // ...
    }
  };
}
```

**After (Runes):**
```typescript
// Using rune-based classes
export class HolochainClientState {
  client = $state<AppClient | undefined>(undefined);
  error = $state<HolochainError | undefined>(undefined);
  loading = $state(false);

  async connect() {
    this.loading = true;
    this.error = undefined;
    // ...
  }
}
```

### 2. Component State (`ui/src/ClientProvider.svelte`)

**Before (Store subscriptions):**
```svelte
<script>
  const clientStore = createClientStore();
  const apolloClientStore = createApolloClientStore();
  
  let { client, error, loading } = $derived($clientStore);
  let { client: apolloClient } = $derived($apolloClientStore);
</script>
```

**After (Direct state access):**
```svelte
<script>
  const holochainState = createHolochainClientState();
  const hreaState = createHREAClientState();
  
  // Direct property access - no subscriptions needed
  {#if holochainState.loading}
    <div>Connecting...</div>
  {:else if holochainState.client && hreaState.client}
    <!-- App content -->
  {/if}
</script>
```

### 3. Reactive Effects (`ui/src/HREATest.svelte`)

**Before (onMount + manual state):**
```svelte
<script>
  let apolloClient: any;
  
  onMount(async () => {
    try {
      apolloClient = getApolloClient();
    } catch (e) {
      // handle error
    }
  });
</script>
```

**After (Reactive with $effect):**
```svelte
<script>
  const hreaState = getHREAClient();
  let apolloClient = $derived(hreaState.client);
  
  $effect(() => {
    if (apolloClient && results.length === 0) {
      results.push("✅ Connected to hREA successfully");
    }
  });
</script>
```

## Benefits of the Migration

### 1. **Simplified State Management**
- No more subscription management
- Direct property access instead of store derivation
- Automatic cleanup of reactive effects

### 2. **Better Performance**
- Fine-grained reactivity updates only what changed
- No unnecessary re-renders from store subscriptions
- Optimized by Svelte's compiler

### 3. **Enhanced Developer Experience**
- Better TypeScript inference
- Clearer data flow
- Reduced boilerplate code

### 4. **Modern Patterns**
- Follows Svelte 5 best practices
- Future-proof architecture
- Easier to understand for new developers

## Usage Patterns

### Creating Reactive State
```typescript
// Define reactive state with $state()
export class MyState {
  data = $state<any[]>([]);
  loading = $state(false);
  error = $state<string | undefined>(undefined);
}
```

### Derived Values
```typescript
// Computed values with $derived()
let isReady = $derived(client && !loading && !error);
let itemCount = $derived(items.length);
```

### Side Effects
```typescript
// React to state changes with $effect()
$effect(() => {
  if (client && !initialized) {
    initialize();
  }
});
```

### Context Usage
```typescript
// Create and provide state
const state = createMyState();
setContext(MY_KEY, state);

// Consume state in child components
const state = getContext<MyState>(MY_KEY);
```

## Migration Checklist

When migrating other components to Svelte 5 runes:

- [ ] Replace `writable()` stores with `$state()` classes
- [ ] Replace `$:` reactive statements with `$derived()`
- [ ] Replace `afterUpdate()` and manual effects with `$effect()`
- [ ] Update context providers to pass state instances directly
- [ ] Remove subscription management in components
- [ ] Update TypeScript types for better inference

## Integration with hREA

The rune-based architecture provides clean separation between:

1. **Holochain Connection** (`HolochainClientState`)
   - WebSocket connection management
   - Error handling and retry logic
   - Connection state tracking

2. **hREA Integration** (`HREAClientState`)
   - GraphQL schema generation
   - Apollo Client configuration
   - hREA-specific error handling

3. **UI Components**
   - Direct state access via context
   - Reactive updates without subscriptions
   - Clean component lifecycle management

This architecture makes the integration more maintainable and easier to understand for developers learning both Holochain and hREA.

## Performance Considerations

Svelte 5 runes provide several performance benefits:

- **Granular Updates**: Only components using changed state re-render
- **Compile-time Optimizations**: Svelte compiler optimizes rune usage
- **Memory Efficiency**: No subscription objects to manage
- **Reduced Bundle Size**: Less runtime code needed for reactivity

## Future-Proofing

This migration ensures the codebase:
- Follows current Svelte best practices
- Is compatible with future Svelte versions
- Provides a good foundation for scaling the application
- Maintains excellent TypeScript support throughout 