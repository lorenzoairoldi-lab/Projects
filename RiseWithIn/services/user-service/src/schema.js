import gql from 'graphql-tag';
export default gql`
  type User @key(fields: "id") { id: ID!, profile: Profile }
  type Profile { userId: ID!, displayName: String!, bio: String, timezone: String!, locale: String!, avatarUrl: String, onboardingComplete: Boolean!, createdAt: String!, updatedAt: String! }
  input ProfileInput { displayName: String, bio: String, timezone: String, locale: String, avatarUrl: String, onboardingComplete: Boolean }
  type Query { profile: Profile }
  type Mutation { updateProfile(input: ProfileInput!): Profile! }
`;
