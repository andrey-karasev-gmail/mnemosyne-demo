import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { DEMO_RECOMMENDATIONS, optimize } from "@demo/domain";

const typeDefs = `#graphql
  type OptimizationResult {
    sku: String!
    nodes: Int!
    estimatedCpu: Int!
    estimatedMemory: Int!
    monthlyCost: Float!
    optimizedCost: Float!
    savingsPercent: Float!
  }

  input OptimizationInput {
    containers: Int!
    avgCpu: Float!
    avgMemory: Float!
    region: String!
    reserved: Boolean!
    highAvailability: Boolean!
  }

  type Recommendation {
    id: ID!
    title: String!
    monthlySavings: Float!
    impact: String!
    status: String!
  }

  type Query {
    health: String!
    recommendations: [Recommendation!]!
    optimize(input: OptimizationInput!): OptimizationResult!
  }
`;

const server = new ApolloServer({
  typeDefs,
  resolvers: {
    Query: {
      health: () => "ok",
      recommendations: () => DEMO_RECOMMENDATIONS,
      optimize: (_parent: unknown, args: { input: Parameters<typeof optimize>[0] }) => optimize(args.input),
    },
  },
});

const { url } = await startStandaloneServer(server, { listen: { port: Number(process.env.PORT ?? 4000) } });
console.log(`Mnemosyne GraphQL API ready at ${url}`);
