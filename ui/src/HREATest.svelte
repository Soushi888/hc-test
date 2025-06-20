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

  // Test basic hREA schema availability
  async function testSchema() {
    if (!apolloClient) {
      testResults.push("❌ Apollo client not available");
      return;
    }

    console.log("🚀 Starting testSchema");
    console.log("🔧 Apollo client:", apolloClient);
    console.log("🔧 Apollo client link:", apolloClient.link);
    console.log(
      "🔧 Apollo client link constructor:",
      apolloClient.link?.constructor?.name
    );

    isLoading = true;
    try {
      // Test detailed introspection query
      console.log("🔧 About to execute introspection query...");
      const introspectionQuery = gql`
        query {
          __schema {
            types {
              name
              kind
            }
            mutationType {
              fields {
                name
                args {
                  name
                  type {
                    name
                    kind
                  }
                }
              }
            }
            queryType {
              fields {
                name
                type {
                  name
                }
              }
            }
          }
        }
      `;

      console.log("🔧 Executing introspection query with Apollo client...");
      const result = await apolloClient.query({ query: introspectionQuery });
      console.log("✅ Introspection query result:", result);

      const types = result.data.__schema.types.map((t: any) => t.name);
      console.log("🔧 All available types:", types);

      // Check for hREA specific types
      const hreaTypes = types.filter((type: string) =>
        [
          "Agent",
          "Person",
          "Organization",
          "Resource",
          "EconomicEvent",
          "EconomicResource",
          "Process",
        ].includes(type)
      );

      if (hreaTypes.length > 0) {
        testResults.push(`✅ hREA types found: ${hreaTypes.join(", ")}`);
      } else {
        testResults.push("❌ No hREA types found in schema");
      }

      // Show available mutations
      const mutations = result.data.__schema.mutationType?.fields || [];
      console.log(
        "🔧 All mutations:",
        mutations.map((m: any) => m.name)
      );

      const agentMutations = mutations.filter(
        (m: any) =>
          m.name.toLowerCase().includes("agent") ||
          m.name.toLowerCase().includes("person") ||
          m.name.toLowerCase().includes("organization")
      );

      if (agentMutations.length > 0) {
        testResults.push(
          `🔧 Agent-related mutations: ${agentMutations.map((m: any) => m.name).join(", ")}`
        );

        // Show details of ALL agent mutations
        agentMutations.forEach((mutation: any) => {
          console.log(`🔧 Mutation ${mutation.name} details:`, mutation);
          const argsDetail = mutation.args
            .map((a: any) => {
              const typeName =
                a.type.name ||
                (a.type.ofType && a.type.ofType.name) ||
                a.type.kind;
              return `${a.name}: ${typeName}`;
            })
            .join(", ");
          testResults.push(`📝 ${mutation.name} args: ${argsDetail}`);
        });
      } else {
        testResults.push("❌ No agent-related mutations found");
        testResults.push(
          `🔧 All available mutations: ${mutations.map((m: any) => m.name).join(", ")}`
        );
      }

      // Show available queries
      const queries = result.data.__schema.queryType?.fields || [];
      const agentQueries = queries.filter(
        (q: any) =>
          q.name.toLowerCase().includes("agent") ||
          q.name.toLowerCase().includes("person") ||
          q.name.toLowerCase().includes("organization")
      );

      if (agentQueries.length > 0) {
        testResults.push(
          `🔍 Agent-related queries: ${agentQueries.map((q: any) => q.name).join(", ")}`
        );
      }

      testResults.push(
        `📊 Total types: ${types.length}, mutations: ${mutations.length}, queries: ${queries.length}`
      );
    } catch (e) {
      testResults.push(`❌ Schema test failed: ${e}`);
    } finally {
      isLoading = false;
    }
  }

  // Test creating an Agent
  async function testCreateAgent() {
    if (!apolloClient) {
      testResults.push("❌ Apollo client not available");
      return;
    }

    console.log("🚀 Starting testCreateAgent");
    isLoading = true;
    testResults.push("🔧 Starting agent creation test...");

    let orgSuccess = false;
    let personSuccess = false;

    try {
      // Test createOrganization
      testResults.push("🔧 Testing createOrganization...");
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

      const orgVariables = {
        organization: {
          name: `Test Org ${Date.now()}`,
          note: "Test organization created via hREA GraphQL",
        },
      };

      try {
        const orgResult = await apolloClient.mutate({
          mutation: createOrgMutation,
          variables: orgVariables,
        });

        console.log("✅ createOrganization result:", orgResult.data);

        if (orgResult.data?.createOrganization?.agent) {
          orgSuccess = true;
          testResults.push(
            `✅ Organization created successfully: ${orgResult.data.createOrganization.agent.name} (ID: ${orgResult.data.createOrganization.agent.id})`
          );
        } else {
          testResults.push(
            "⚠️ createOrganization completed but returned unexpected data structure"
          );
          console.log("Unexpected org result:", orgResult.data);
        }
      } catch (orgError) {
        testResults.push(
          `❌ createOrganization failed: ${(orgError as Error).message}`
        );
        console.error("createOrganization error:", orgError);
      }

      // Test createPerson
      testResults.push("🔧 Testing createPerson...");

      // First get the schema structure
      const schemaQuery = gql`
        query GetPersonCreateParams {
          __type(name: "PersonCreateParams") {
            name
            inputFields {
              name
              type {
                name
                kind
                ofType {
                  name
                  kind
                }
              }
            }
          }
        }
      `;

      try {
        const schemaResult = await apolloClient.query({ query: schemaQuery });
        const personParams = schemaResult.data?.__type;

        if (personParams) {
          // Build person object based on available fields
          const personData: any = {
            name: `Test Person ${Date.now()}`,
          };

          // Add optional fields
          personParams.inputFields.forEach((field: any) => {
            if (field.name === "note") {
              personData.note = "Test person created via hREA GraphQL";
            }
          });

          const createPersonMutation = gql`
            mutation CreatePerson($person: PersonCreateParams!) {
              createPerson(person: $person) {
                agent {
                  id
                  name
                  note
                }
              }
            }
          `;

          const personVariables = { person: personData };

          try {
            const personResult = await apolloClient.mutate({
              mutation: createPersonMutation,
              variables: personVariables,
            });

            console.log("✅ createPerson result:", personResult.data);

            if (personResult.data?.createPerson?.agent) {
              personSuccess = true;
              testResults.push(
                `✅ Person created successfully: ${personResult.data.createPerson.agent.name} (ID: ${personResult.data.createPerson.agent.id})`
              );
            } else {
              testResults.push(
                "⚠️ createPerson completed but returned unexpected data structure"
              );
              console.log("Unexpected person result:", personResult.data);
            }
          } catch (personError) {
            testResults.push(
              `❌ createPerson failed: ${(personError as Error).message}`
            );
            console.error("createPerson error:", personError);
          }
        } else {
          testResults.push(
            "⚠️ PersonCreateParams not found in schema - skipping person creation"
          );
        }
      } catch (schemaError) {
        testResults.push(
          `⚠️ Could not get PersonCreateParams schema: ${(schemaError as Error).message}`
        );
        console.log("Schema query error:", schemaError);
      }

      // Summary
      testResults.push("\n📋 Agent Creation Test Summary:");
      testResults.push(
        `   Organizations: ${orgSuccess ? "✅ Working" : "❌ Failed"}`
      );
      testResults.push(
        `   Persons: ${personSuccess ? "✅ Working" : "❌ Failed"}`
      );

      if (orgSuccess || personSuccess) {
        testResults.push(
          "🎉 Agent creation is working! Check console for detailed results."
        );
      } else {
        testResults.push("⚠️ No agent types could be created successfully.");
      }
    } catch (e) {
      const errorMessage = (e as Error).message || String(e);
      testResults.push(
        `❌ Agent creation test encountered an error: ${errorMessage}`
      );
      console.error("Agent creation test error:", e);
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
        testResults.push("🎯 Try 'Create Test Agent' first, then query again");
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

  // Test detailed schema introspection for mutations
  async function testMutationSchema() {
    if (!apolloClient) {
      testResults.push("❌ Apollo client not available");
      return;
    }

    isLoading = true;
    testResults.push("🔧 Starting detailed mutation schema test...");

    try {
      const detailedIntrospectionQuery = gql`
        query DetailedIntrospection {
          __schema {
            mutationType {
              fields {
                name
                description
                args {
                  name
                  description
                  type {
                    name
                    kind
                    ofType {
                      name
                      kind
                      inputFields {
                        name
                        type {
                          name
                          kind
                        }
                      }
                    }
                  }
                }
                type {
                  name
                  kind
                  fields {
                    name
                    type {
                      name
                      kind
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const result = await apolloClient.query({
        query: detailedIntrospectionQuery,
      });
      console.log("✅ Detailed introspection result:", result);

      const mutations = result.data.__schema.mutationType?.fields || [];
      testResults.push(`📋 Found ${mutations.length} total mutations`);

      // Focus on agent-related mutations
      const agentMutations = mutations.filter(
        (m: any) =>
          m.name.toLowerCase().includes("agent") ||
          m.name.toLowerCase().includes("person") ||
          m.name.toLowerCase().includes("organization")
      );

      testResults.push(
        `👥 Found ${agentMutations.length} agent-related mutations:`
      );

      agentMutations.forEach((mutation: any) => {
        testResults.push(`\n📝 ${mutation.name}:`);
        if (mutation.description) {
          testResults.push(`   Description: ${mutation.description}`);
        }

        testResults.push(`   Arguments:`);
        mutation.args.forEach((arg: any) => {
          const typeName =
            arg.type.name ||
            (arg.type.ofType && arg.type.ofType.name) ||
            arg.type.kind;
          testResults.push(`     - ${arg.name}: ${typeName}`);

          // Show input field details for complex types
          if (arg.type.ofType && arg.type.ofType.inputFields) {
            testResults.push(`       Input fields:`);
            arg.type.ofType.inputFields.forEach((field: any) => {
              const fieldTypeName = field.type.name || field.type.kind;
              testResults.push(`         * ${field.name}: ${fieldTypeName}`);
            });
          }
        });

        testResults.push(
          `   Returns: ${mutation.type.name || mutation.type.kind}`
        );
        if (mutation.type.fields) {
          testResults.push(`   Return fields:`);
          mutation.type.fields.forEach((field: any) => {
            const fieldTypeName = field.type.name || field.type.kind;
            testResults.push(`     - ${field.name}: ${fieldTypeName}`);
          });
        }
      });

      // If no agent mutations found, show all mutations
      if (agentMutations.length === 0) {
        testResults.push("\n📝 All available mutations:");
        mutations.forEach((mutation: any) => {
          testResults.push(`   - ${mutation.name}`);
        });
      }
    } catch (e) {
      const errorMessage = (e as Error).message || String(e);
      testResults.push(
        `❌ Detailed schema introspection failed: ${errorMessage}`
      );
      console.error("Schema introspection error:", e);
    } finally {
      isLoading = false;
    }
  }

  // Test current agent and basic connectivity
  async function testCurrentAgent() {
    if (!apolloClient) {
      testResults.push("❌ Apollo client not available");
      return;
    }

    isLoading = true;
    testResults.push("🔧 Testing current agent and connectivity...");

    try {
      // Try to get current agent info
      testResults.push("🔧 Attempting to get current agent info...");
      const currentAgentQuery = gql`
        query GetCurrentAgent {
          myAgent {
            id
            name
            note
          }
        }
      `;

      try {
        const result = await apolloClient.query({
          query: currentAgentQuery,
          fetchPolicy: "network-only",
        });

        console.log("✅ Current agent result:", result);
        testResults.push(
          `🔧 Current agent result: ${JSON.stringify(result.data)}`
        );

        if (result.data?.myAgent) {
          testResults.push(
            `✅ Current agent found: ${result.data.myAgent.name || "Unnamed"} (${result.data.myAgent.id})`
          );
        } else {
          testResults.push(
            "ℹ️ No current agent found - might need registration"
          );
        }
      } catch (agentError) {
        testResults.push(
          `ℹ️ Current agent query failed: ${(agentError as Error).message}`
        );
        console.error("Current agent error:", agentError);
      }

      // Try alternative current agent queries
      testResults.push("🔧 Trying alternative agent queries...");

      const alternativeQueries = [
        gql`
          query {
            me {
              id
              name
            }
          }
        `,
        gql`
          query {
            viewer {
              id
              name
            }
          }
        `,
        gql`
          query {
            currentAgent {
              id
              name
            }
          }
        `,
      ];

      for (let i = 0; i < alternativeQueries.length; i++) {
        try {
          const altResult = await apolloClient.query({
            query: alternativeQueries[i],
            fetchPolicy: "network-only",
          });
          testResults.push(
            `✅ Alternative query ${i + 1} worked: ${JSON.stringify(altResult.data)}`
          );
        } catch (altError) {
          testResults.push(
            `❌ Alternative query ${i + 1} failed: ${(altError as Error).message}`
          );
        }
      }

      // Test basic schema connectivity by trying to get __typename
      testResults.push("🔧 Testing basic GraphQL connectivity...");
      const basicQuery = gql`
        query {
          __typename
        }
      `;

      const basicResult = await apolloClient.query({
        query: basicQuery,
        fetchPolicy: "network-only",
      });

      testResults.push(
        `✅ Basic connectivity works: ${JSON.stringify(basicResult.data)}`
      );
    } catch (e) {
      const errorMessage = (e as Error).message || String(e);
      testResults.push(`❌ Current agent test failed: ${errorMessage}`);
      console.error("Current agent test error:", e);
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
    <button onclick={testSchema} disabled={isLoading}>
      {isLoading ? "Testing..." : "Test Schema"}
    </button>

    <button onclick={testCreateAgent} disabled={isLoading}>
      {isLoading ? "Creating..." : "Create Test Agent"}
    </button>

    <button onclick={testQueryAgents} disabled={isLoading}>
      {isLoading ? "Querying..." : "Query Agents"}
    </button>

    <button onclick={testMutationSchema} disabled={isLoading}>
      {isLoading ? "Testing..." : "Test Mutation Schema"}
    </button>

    <button onclick={testCurrentAgent} disabled={isLoading}>
      {isLoading ? "Testing..." : "Test Current Agent"}
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
