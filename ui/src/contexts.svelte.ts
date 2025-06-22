// hREA Integration Context - Svelte 5 Runes
// This file manages the connection between Svelte, Holochain, and hREA using modern runes

import { ApolloClient, InMemoryCache } from "@apollo/client/core";
import { SchemaLink } from "@apollo/client/link/schema";
import type { AppClient, HolochainError } from "@holochain/client";
import { AppWebsocket } from "@holochain/client";
import { createHolochainSchema } from "@valueflows/vf-graphql-holochain";
import { getContext, setContext } from "svelte";

// Context keys for Svelte contexts
export const CLIENT_CONTEXT_KEY = Symbol("holochain-client");
export const APOLLO_CLIENT_CONTEXT_KEY = Symbol("apollo-client");

// Holochain client state class using runes
export class HolochainClientState {
  client = $state<AppClient | undefined>(undefined);
  error = $state<HolochainError | undefined>(undefined);
  loading = $state(false);

  async connect() {
    this.loading = true;
    this.error = undefined;

    try {
      this.client = await AppWebsocket.connect();
      console.log("✅ Connected to Holochain");
    } catch (e) {
      console.error("❌ Failed to connect to Holochain:", e);
      this.error = e as HolochainError;
    } finally {
      this.loading = false;
    }
  }

  getClient() {
    if (!this.client) {
      throw new Error("Holochain client not initialized");
    }
    return this.client;
  }
}

// hREA GraphQL client state class using runes
export class HREAClientState {
  client = $state<ApolloClient<any> | undefined>(undefined);
  error = $state<string | undefined>(undefined);
  loading = $state(false);

  async initialize(holochainClient: AppClient) {
    this.loading = true;
    this.error = undefined;

    try {
      console.log("🔧 Initializing hREA with GraphQL schema...");

      // Create GraphQL schema from hREA DNA
      const schema = createHolochainSchema({
        appWebSocket: holochainClient,
        roleName: "hrea", // This matches the role name in happ.yaml
      });

      // Create Apollo Client with hREA schema
      this.client = new ApolloClient({
        cache: new InMemoryCache(),
        link: new SchemaLink({ schema }),
        defaultOptions: {
          query: {
            fetchPolicy: "cache-first",
          },
          mutate: {
            fetchPolicy: "no-cache",
          },
        },
      });

      console.log("✅ hREA initialized successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to initialize hREA";
      console.error("❌ hREA initialization failed:", error);
      this.error = errorMessage;
      throw error;
    } finally {
      this.loading = false;
    }
  }

  getClient() {
    if (!this.client) {
      throw new Error("hREA client not initialized");
    }
    return this.client;
  }
}

// Factory functions for creating state instances
export function createHolochainClientState() {
  return new HolochainClientState();
}

export function createHREAClientState() {
  return new HREAClientState();
}

// Context getters
export function getHolochainClient(): HolochainClientState {
  const clientState = getContext<HolochainClientState>(CLIENT_CONTEXT_KEY);
  if (!clientState) {
    throw new Error("Holochain client state not found in context");
  }
  return clientState;
}

export function getHREAClient(): HREAClientState {
  const hreaState = getContext<HREAClientState>(APOLLO_CLIENT_CONTEXT_KEY);
  if (!hreaState) {
    throw new Error("hREA client state not found in context");
  }
  return hreaState;
}

// Convenience function to get the Apollo client directly
export function getApolloClient(): ApolloClient<any> {
  const hreaState = getHREAClient();
  return hreaState.getClient();
}
