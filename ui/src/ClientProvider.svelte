<script lang="ts">
  import { onMount, setContext } from "svelte";
  import {
    CLIENT_CONTEXT_KEY,
    APOLLO_CLIENT_CONTEXT_KEY,
    createHolochainClientState,
    createHREAClientState,
  } from "./contexts.svelte";

  interface Props {
    children?: import("svelte").Snippet;
  }

  let { children }: Props = $props();

  // Create state instances using runes
  const holochainState = createHolochainClientState();
  const hreaState = createHREAClientState();

  // Make state available to child components via context
  setContext(CLIENT_CONTEXT_KEY, holochainState);
  setContext(APOLLO_CLIENT_CONTEXT_KEY, hreaState);

  // Connect to Holochain when component mounts
  onMount(() => {
    holochainState.connect();
  });

  // Initialize hREA when Holochain client is ready
  $effect(() => {
    if (
      holochainState.client &&
      !hreaState.client &&
      !hreaState.error &&
      !hreaState.loading
    ) {
      hreaState.initialize(holochainState.client);
    }
  });
</script>

<!-- Connection Status and Content -->
{#if holochainState.loading}
  <div class="status connecting">
    <div class="spinner"></div>
    <p>Connecting to Holochain...</p>
  </div>
{:else if holochainState.error}
  <div class="status error">
    <h3>❌ Connection Failed</h3>
    <p>Unable to connect to Holochain: {holochainState.error.message}</p>
    <p class="help">
      Make sure Holochain is running and try refreshing the page.
    </p>
  </div>
{:else if holochainState.client && hreaState.error}
  <div class="status error">
    <h3>⚠️ hREA Initialization Failed</h3>
    <p>Holochain connected, but hREA setup failed: {hreaState.error}</p>
    <p class="help">Check that the hREA DNA is properly configured.</p>
  </div>
{:else if holochainState.client && hreaState.loading}
  <div class="status connecting">
    <div class="spinner"></div>
    <p>Initializing hREA...</p>
  </div>
{:else if holochainState.client && hreaState.client}
  <!-- Everything is ready - show the app -->
  {@render children?.()}
{:else}
  <div class="status connecting">
    <div class="spinner"></div>
    <p>Setting up connections...</p>
  </div>
{/if}

<style>
  .status {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    padding: 40px 20px;
    text-align: center;
  }

  .connecting {
    color: #ccc;
  }

  .error {
    color: #ff6b6b;
    background: rgba(255, 107, 107, 0.1);
    border: 1px solid rgba(255, 107, 107, 0.3);
    border-radius: 8px;
    margin: 20px;
  }

  .error h3 {
    margin: 0 0 10px 0;
    font-size: 1.2em;
  }

  .error p {
    margin: 8px 0;
    max-width: 500px;
  }

  .help {
    font-size: 0.9em;
    opacity: 0.8;
    font-style: italic;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top: 3px solid #007acc;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  p {
    margin: 0;
    font-size: 16px;
  }
</style>
