import { ApolloClient, InMemoryCache } from "@apollo/client/core";
import { SchemaLink } from "@apollo/client/link/schema";
import type { AppClient, HolochainError } from "@holochain/client";
import { AppWebsocket } from "@holochain/client";
import { createHolochainSchema } from "@valueflows/vf-graphql-holochain";
import { getContext, setContext } from "svelte";
import { get, writable } from "svelte/store";

export const CLIENT_CONTEXT_KEY = Symbol("holochain-client");
export const APOLLO_CLIENT_CONTEXT_KEY = Symbol("apollo-client");

interface ClientStore {
  client: AppClient | undefined;
  error: HolochainError | undefined;
  loading: boolean;
}

export function createClientStore() {
  const store = writable<ClientStore>({
    client: undefined,
    error: undefined,
    loading: false,
  });

  const { subscribe, set, update } = store;

  return {
    subscribe,
    connect: async () => {
      update((s) => ({ ...s, loading: true }));
      try {
        const client = await AppWebsocket.connect();
        update((s) => ({ ...s, client }));
      } catch (e) {
        console.error(e);
        update((s) => ({ ...s, error: e as HolochainError }));
      } finally {
        update((s) => ({ ...s, loading: false }));
      }
    },
    getClient: () => {
      const { client } = get(store);
      if (!client) throw new Error("Client not initialized");
      return client;
    },
  };
}

export function getClient() {
  return getContext<ReturnType<typeof createClientStore>>(CLIENT_CONTEXT_KEY);
}

/// hREA connection

// Apollo client store
interface ApolloClientStore {
  client: ApolloClient<any> | undefined;
  error: string | undefined;
  loading: boolean;
}

export function createApolloClientStore() {
  const store = writable<ApolloClientStore>({
    client: undefined,
    error: undefined,
    loading: false,
  });

  return {
    subscribe: store.subscribe,
    set: store.set,
    update: store.update,
  };
}

// Function to initialize hREA connection - must be called from within a component context
export function initializeHREA() {
  const apolloStore = getContext<ReturnType<typeof createApolloClientStore>>(
    APOLLO_CLIENT_CONTEXT_KEY
  );

  if (!apolloStore) {
    throw new Error("Apollo client store not found in context");
  }

  apolloStore.update((s) => ({ ...s, loading: true }));

  try {
    const clientStore = getClient();
    const holochainClient = clientStore.getClient();

    console.log("🔧 Holochain client:", holochainClient);
    console.log("🔧 Holochain client type:", typeof holochainClient);
    console.log(
      "🔧 Holochain client constructor:",
      holochainClient.constructor.name
    );

    // Configure hREA schema
    console.log("🔧 Creating hREA schema with role 'hrea'...");
    console.log("🔧 createHolochainSchema function:", createHolochainSchema);

    let schema;
    try {
      schema = createHolochainSchema({
        appWebSocket: holochainClient,
        roleName: "hrea",
      });
      console.log("✅ hREA schema created successfully:", schema);
    } catch (schemaError) {
      console.error("❌ Error creating hREA schema:", schemaError);
      throw schemaError;
    }

    console.log("🔧 Schema type:", typeof schema);
    console.log("🔧 Schema constructor:", schema?.constructor?.name);
    console.log("🔧 Schema has getType method:", typeof schema?.getType);

    // Create SchemaLink
    console.log("🔧 Creating SchemaLink...");
    const schemaLink = new SchemaLink({ schema });
    console.log("✅ SchemaLink created:", schemaLink);
    console.log("🔧 SchemaLink type:", typeof schemaLink);

    // Create Apollo Client with hREA schema and link
    const cache = new InMemoryCache();
    console.log("🔧 Creating Apollo Client with SchemaLink...");
    const apolloClient = new ApolloClient({
      cache,
      link: schemaLink,
      defaultOptions: {
        query: {
          fetchPolicy: "cache-first",
        },
        mutate: {
          fetchPolicy: "no-cache",
        },
      },
    });

    console.log("✅ Apollo Client created:", apolloClient);
    console.log("🔧 Apollo Client link:", apolloClient.link);

    apolloStore.update((s) => ({ ...s, client: apolloClient, loading: false }));

    return apolloClient;
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown hREA initialization error";
    console.error("Failed to initialize hREA:", error);
    apolloStore.update((s) => ({ ...s, error: errorMessage, loading: false }));
    throw error;
  }
}

// Function to get the Apollo client from context
export function getApolloClient() {
  const apolloStore = getContext<ReturnType<typeof createApolloClientStore>>(
    APOLLO_CLIENT_CONTEXT_KEY
  );
  if (!apolloStore) {
    throw new Error("Apollo client store not found in context");
  }

  const { client } = get(apolloStore);
  if (!client) {
    throw new Error("Apollo client not initialized");
  }

  return client;
}
