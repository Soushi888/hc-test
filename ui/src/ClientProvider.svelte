<script lang="ts">
  import { onMount, setContext } from "svelte";
  import {
    CLIENT_CONTEXT_KEY,
    createClientStore,
    initializeHREA,
    APOLLO_CLIENT_CONTEXT_KEY,
    createApolloClientStore,
  } from "./contexts";

  interface Props {
    children?: import("svelte").Snippet;
  }

  let { children }: Props = $props();

  const clientStore = createClientStore();
  const apolloClientStore = createApolloClientStore();

  setContext(CLIENT_CONTEXT_KEY, clientStore);
  setContext(APOLLO_CLIENT_CONTEXT_KEY, apolloClientStore);

  onMount(() => {
    clientStore.connect();
  });

  let { client, error, loading } = $derived($clientStore);
  let {
    client: apolloClient,
    error: apolloError,
    loading: apolloLoading,
  } = $derived($apolloClientStore);

  // Initialize hREA when client is available
  $effect(() => {
    if (client && !apolloClient && !apolloError && !apolloLoading) {
      try {
        initializeHREA();
        console.log("hREA initialized successfully");
      } catch (err) {
        console.error("Failed to initialize hREA:", err);
      }
    }
  });
</script>

{#if loading}
  <progress></progress>
  <p>Connecting to Holochain...</p>
{:else if error}
  <div class="alert">
    Error connecting to Holochain: {error.message}
  </div>
{:else if client && apolloError}
  <div class="alert">
    Holochain connected, but hREA initialization failed: {apolloError}
  </div>
{:else if client && apolloClient}
  {@render children?.()}
{:else if client && apolloLoading}
  <div>
    <progress></progress>
    <p>Initializing hREA...</p>
  </div>
{:else if client}
  <div>
    <progress></progress>
    <p>Setting up hREA...</p>
  </div>
{/if}
