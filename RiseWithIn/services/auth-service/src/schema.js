import gql from 'graphql-tag';
export default gql`
  enum Plan { FREE PRO PREMIUM }
  type User @key(fields: "id") { id: ID!, email: String!, plan: Plan!, createdAt: String! }
  type AuthPayload { accessToken: String!, refreshToken: String!, user: User! }
  type Query { me: User }
  type Mutation {
    register(email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    refreshToken(token: String!): AuthPayload!
    logout(token: String!): Boolean!
  }
`;
