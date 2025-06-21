<script lang="ts">
  import { onMount } from "svelte";
  import { getApolloClient } from "./contexts";
  import { gql } from "@apollo/client/core";

  let apolloClient: any;
  let testResults: string[] = $state([]);
  let isLoading = $state(false);
  let error: string | null = $state(null);

  onMount(async () => {
    try {
      apolloClient = getApolloClient();
      testResults.push("✅ Apollo client initialized successfully");
    } catch (e) {
      error = `Failed to get Apollo client: ${e}`;
      testResults.push(`❌ ${error}`);
    }
  });

  // Create a test person
  async function createTestPerson() {
    if (!apolloClient) {
      testResults.push("❌ Apollo client not available");
      return;
    }

    isLoading = true;
    testResults.push("🔧 Creating test person...");

    try {
      const personData = {
        name: `Test Person ${Date.now()}`,
        note: "Test person created via hREA GraphQL",
      };

      const createPersonMutation = gql`
        mutation CreatePerson($person: AgentCreateParams!) {
          createPerson(person: $person) {
            agent {
              id
              name
              note
            }
          }
        }
      `;

      console.log("🔧 Creating person with data:", personData);

      const personResult = await apolloClient.mutate({
        mutation: createPersonMutation,
        variables: { person: personData },
      });

      console.log("✅ createPerson result:", personResult.data);

      if (personResult.data?.createPerson?.agent) {
        testResults.push(
          `✅ Person created successfully: ${personResult.data.createPerson.agent.name} (ID: ${personResult.data.createPerson.agent.id})`
        );
      } else {
        testResults.push(
          "⚠️ Person creation completed but returned unexpected data structure"
        );
        console.log("Unexpected person result:", personResult.data);
      }
    } catch (error) {
      testResults.push(
        `❌ Person creation failed: ${(error as Error).message}`
      );
      console.error("Person creation error:", error);
    } finally {
      isLoading = false;
    }
  }

  // Create a test organization
  async function createTestOrganization() {
    if (!apolloClient) {
      testResults.push("❌ Apollo client not available");
      return;
    }

    isLoading = true;
    testResults.push("🔧 Creating test organization...");

    try {
      const orgData = {
        name: `Test Organization ${Date.now()}`,
        note: "Test organization created via hREA GraphQL",
      };

      const createOrgMutation = gql`
        mutation CreateOrganization($organization: OrganizationCreateParams!) {
          createOrganization(organization: $organization) {
            agent {
              id
              name
              note
            }
          }
        }
      `;

      console.log("🔧 Creating organization with data:", orgData);

      const orgResult = await apolloClient.mutate({
        mutation: createOrgMutation,
        variables: { organization: orgData },
      });

      console.log("✅ createOrganization result:", orgResult.data);

      if (orgResult.data?.createOrganization?.agent) {
        testResults.push(
          `✅ Organization created successfully: ${orgResult.data.createOrganization.agent.name} (ID: ${orgResult.data.createOrganization.agent.id})`
        );
      } else {
        testResults.push(
          "⚠️ Organization creation completed but returned unexpected data structure"
        );
        console.log("Unexpected org result:", orgResult.data);
      }
    } catch (error) {
      testResults.push(
        `❌ Organization creation failed: ${(error as Error).message}`
      );
      console.error("Organization creation error:", error);
    } finally {
      isLoading = false;
    }
  }

  // Test querying agents
  async function testQueryAgents() {
    if (!apolloClient) {
      testResults.push("❌ Apollo client not available");
      return;
    }

    isLoading = true;
    testResults.push("🔧 Starting agent query test...");

    try {
      // Try the standard hREA agents query with better error handling
      testResults.push("🔧 Attempting agents query...");
      const queryAgents = gql`
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
      `;

      let result;
      let querySucceeded = false;

      try {
        result = await apolloClient.query({
          query: queryAgents,
          fetchPolicy: "network-only", // Force fresh data
          errorPolicy: "all", // Return partial data even if there are errors
        });
        querySucceeded = true;

        console.log("✅ Query agents result:", result);
        console.log("🔧 Query result data:", result.data);
        testResults.push(`🔧 Query result: ${JSON.stringify(result.data)}`);
      } catch (mainQueryError) {
        testResults.push(
          `ℹ️ Standard query failed (might be empty state): ${(mainQueryError as Error).message}`
        );
        console.log(
          "Main query error (expected for empty state):",
          mainQueryError
        );
      }

      if (querySucceeded && result?.data) {
        const agents = result.data?.agents?.edges || [];
        testResults.push(`📋 Found ${agents.length} agents`);

        if (agents.length > 0) {
          testResults.push("✅ Agents found:");
          agents.forEach((edge: any, index: number) => {
            const agent = edge.node;
            testResults.push(`  ${index + 1}. ${agent.name} (${agent.id})`);
          });
        } else {
          testResults.push("ℹ️ No agents found in the system yet");
        }

        console.log("agents", agents);
      } else {
        // Fallback queries when main query fails
        testResults.push(
          "🔧 Trying alternative query patterns for empty state..."
        );

        const alternativeQueries = [
          {
            name: "Simple agents list",
            query: gql`
              query {
                agents {
                  id
                  name
                  note
                }
              }
            `,
          },
          {
            name: "Agents with pagination",
            query: gql`
              query {
                agents(first: 10) {
                  pageInfo {
                    hasNextPage
                    hasPreviousPage
                  }
                  edges {
                    node {
                      id
                      name
                    }
                  }
                }
              }
            `,
          },
        ];

        for (const altQuery of alternativeQueries) {
          try {
            const altResult = await apolloClient.query({
              query: altQuery.query,
              fetchPolicy: "network-only",
              errorPolicy: "all",
            });

            testResults.push(
              `✅ ${altQuery.name} worked: ${JSON.stringify(altResult.data)}`
            );

            // Process results if we got any
            if (altResult.data?.agents) {
              const agents = Array.isArray(altResult.data.agents)
                ? altResult.data.agents
                : altResult.data.agents.edges || [];

              if (agents.length > 0) {
                testResults.push(
                  `📋 Alternative query found ${agents.length} agents`
                );
                return; // Exit early if we found agents
              }
            }
          } catch (altError) {
            testResults.push(
              `❌ ${altQuery.name} failed: ${(altError as Error).message}`
            );
          }
        }

        testResults.push("ℹ️ No agents found with any query method");
        testResults.push(
          "💡 This is normal if no agents have been created yet"
        );
        testResults.push(
          "🎯 Try 'Create Test Person' or 'Create Test Organization' first, then query again"
        );
      }
    } catch (e) {
      const errorMessage = (e as Error).message || String(e);
      testResults.push(`❌ Query agents failed: ${errorMessage}`);
      testResults.push("ℹ️ This often happens when the database is empty");
      testResults.push("💡 Try creating an agent first, then querying");
      console.error("Query error:", e);
    } finally {
      isLoading = false;
    }
  }

  function clearResults() {
    testResults = [];
    error = null;
  }
</script>

<div class="hrea-test">
  <h2>hREA Testing Interface</h2>

  {#if error}
    <div class="error">
      <strong>Error:</strong>
      {error}
    </div>
  {/if}

  <div class="controls">
    <button onclick={createTestPerson} disabled={isLoading}>
      {isLoading ? "Creating..." : "Create Test Person"}
    </button>

    <button onclick={createTestOrganization} disabled={isLoading}>
      {isLoading ? "Creating..." : "Create Test Organization"}
    </button>

    <button onclick={testQueryAgents} disabled={isLoading}>
      {isLoading ? "Querying..." : "Query Agents"}
    </button>

    <button onclick={clearResults}>Clear Results</button>
  </div>

  <div class="results">
    <h3>Test Results:</h3>
    {#each testResults as result}
      <div class="result-line">{result}</div>
    {/each}
  </div>
</div>

<style>
  h2 {
    color: white !important;
  }

  .hrea-test {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
  }

  .error {
    background: #ffe6e6;
    border: 1px solid #ff9999;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 20px;
    color: #cc0000;
  }

  .controls {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  button {
    padding: 10px 15px;
    background: #007acc;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  button:hover:not(:disabled) {
    background: #005999;
  }

  button:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }

  .results {
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 15px;
    background: #f9f9f9;
  }

  .result-line {
    color: black;
    font-family: monospace;
    margin: 5px 0;
    padding: 2px 0;
  }

  h2 {
    color: #333;
    margin-bottom: 20px;
  }

  h3 {
    color: #555;
    margin: 0 0 10px 0;
  }
</style>
