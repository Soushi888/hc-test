<script lang="ts">
  import { getHREAClient } from "./contexts.svelte";
  import { gql } from "@apollo/client/core";

  let results: string[] = $state([]);
  let isLoading = $state(false);

  // Get hREA client state to check connection status
  const hreaState = getHREAClient();

  // Reactive derived value for Apollo client
  let apolloClient = $derived(hreaState.client);

  // Add connection status to results when client becomes available
  $effect(() => {
    if (apolloClient && results.length === 0) {
      results.push("✅ Connected to hREA successfully");
    }
  });

  // Example 1: Create a Person Agent
  async function createPerson() {
    if (!apolloClient) {
      results.push("❌ hREA not connected");
      return;
    }

    isLoading = true;
    results.push("🔧 Creating a person agent...");

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
            note: "Created via hREA basic example",
          },
        },
      });

      const agent = result.data.createPerson.agent;
      results.push(`✅ Person created: ${agent.name} (ID: ${agent.id})`);
    } catch (error) {
      results.push(`❌ Failed to create person: ${(error as Error).message}`);
    } finally {
      isLoading = false;
    }
  }

  // Example 2: Create an Organization Agent
  async function createOrganization() {
    if (!apolloClient) {
      results.push("❌ hREA not connected");
      return;
    }

    isLoading = true;
    results.push("🔧 Creating an organization agent...");

    try {
      const result = await apolloClient.mutate({
        mutation: gql`
          mutation CreateOrganization(
            $organization: OrganizationCreateParams!
          ) {
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
            note: "Created via hREA basic example",
          },
        },
      });

      const agent = result.data.createOrganization.agent;
      results.push(`✅ Organization created: ${agent.name} (ID: ${agent.id})`);
    } catch (error) {
      results.push(
        `❌ Failed to create organization: ${(error as Error).message}`
      );
    } finally {
      isLoading = false;
    }
  }

  // Example 3: Create a Resource Specification
  async function createResourceSpec() {
    if (!apolloClient) {
      results.push("❌ hREA not connected");
      return;
    }

    isLoading = true;
    results.push("🔧 Creating a resource specification...");

    try {
      const result = await apolloClient.mutate({
        mutation: gql`
          mutation CreateResourceSpecification(
            $resourceSpecification: ResourceSpecificationCreateParams!
          ) {
            createResourceSpecification(
              resourceSpecification: $resourceSpecification
            ) {
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
            note: "A basic resource specification example",
          },
        },
      });

      const spec =
        result.data.createResourceSpecification.resourceSpecification;
      results.push(
        `✅ Resource specification created: ${spec.name} (ID: ${spec.id})`
      );
    } catch (error) {
      results.push(
        `❌ Failed to create resource specification: ${(error as Error).message}`
      );
    } finally {
      isLoading = false;
    }
  }

  // Example 4: Query All Agents
  async function queryAgents() {
    if (!apolloClient) {
      results.push("❌ hREA not connected");
      return;
    }

    isLoading = true;
    results.push("🔧 Querying all agents...");

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
        `,
        fetchPolicy: "network-only",
      });

      const agents = result.data?.agents?.edges || [];
      if (agents.length === 0) {
        results.push("ℹ️ No agents found. Create some agents first!");
      } else {
        results.push(`📋 Found ${agents.length} agents:`);
        agents.forEach((edge: any, index: number) => {
          const agent = edge.node;
          results.push(`  ${index + 1}. ${agent.name} (${agent.id})`);
        });
      }
    } catch (error) {
      results.push(`❌ Failed to query agents: ${(error as Error).message}`);
    } finally {
      isLoading = false;
    }
  }

  function clearResults() {
    results = [];
  }
</script>

<div class="hrea-example">
  <h2>hREA Basic Example</h2>
  <p>This demonstrates core hREA operations using the ValueFlows ontology:</p>

  <div class="examples">
    <div class="example-section">
      <h3>👤 Agents</h3>
      <p>
        Agents are people, organizations, or groups that participate in economic
        activities.
      </p>
      <div class="buttons">
        <button onclick={createPerson} disabled={isLoading}>
          Create Person
        </button>
        <button onclick={createOrganization} disabled={isLoading}>
          Create Organization
        </button>
        <button onclick={queryAgents} disabled={isLoading}>
          List All Agents
        </button>
      </div>
    </div>

    <div class="example-section">
      <h3>📦 Resources</h3>
      <p>
        Resources are physical or digital assets that can be used, consumed, or
        produced.
      </p>
      <div class="buttons">
        <button onclick={createResourceSpec} disabled={isLoading}>
          Create Resource Specification
        </button>
      </div>
    </div>

    <div class="actions">
      <button onclick={clearResults} class="clear-button">
        Clear Results
      </button>
    </div>
  </div>

  <div class="results">
    <h3>Results:</h3>
    <div class="results-container">
      {#each results as result}
        <div class="result-line">{result}</div>
      {/each}
      {#if results.length === 0}
        <p class="no-results">
          Click the buttons above to try hREA operations!
        </p>
      {/if}
    </div>
  </div>
</div>

<style>
  .hrea-example {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
  }

  h2 {
    color: #fff;
    margin-bottom: 10px;
  }

  h3 {
    color: #fff;
    font-size: 1.2em;
    margin-bottom: 8px;
  }

  p {
    color: #ccc;
    margin-bottom: 15px;
    line-height: 1.4;
  }

  .examples {
    margin-bottom: 30px;
  }

  .example-section {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .buttons {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  button {
    padding: 10px 16px;
    background: #007acc;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
  }

  button:hover:not(:disabled) {
    background: #005999;
  }

  button:disabled {
    background: #666;
    cursor: not-allowed;
  }

  .clear-button {
    background: #666;
  }

  .clear-button:hover:not(:disabled) {
    background: #888;
  }

  .actions {
    text-align: center;
    margin-bottom: 20px;
  }

  .results {
    border: 1px solid #444;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.3);
  }

  .results h3 {
    margin: 0;
    padding: 15px 20px 10px;
    border-bottom: 1px solid #444;
  }

  .results-container {
    padding: 15px 20px 20px;
    max-height: 400px;
    overflow-y: auto;
  }

  .result-line {
    color: #fff;
    font-family: "Courier New", monospace;
    font-size: 13px;
    margin: 4px 0;
    padding: 2px 0;
    line-height: 1.3;
  }

  .no-results {
    color: #888;
    font-style: italic;
    text-align: center;
    margin: 20px 0;
  }
</style>
