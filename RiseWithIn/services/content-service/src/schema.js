import gql from 'graphql-tag';

export default gql`
  enum ContentType { ARTICLE VIDEO GUIDE }
  type Content {
    id: ID!
    title: String!
    slug: String!
    summary: String!
    body: String
    type: ContentType!
    category: String!
    imageUrl: String
    durationMinutes: Int!
    premium: Boolean!
    publishedAt: String!
  }
  type ContentPage { items: [Content!]!, total: Int!, hasMore: Boolean! }
  type Query {
    contents(limit: Int = 20, offset: Int = 0, category: String, type: ContentType): ContentPage!
    content(slug: String!): Content
  }
  type Mutation { markContentViewed(id: ID!): Boolean! }
`;
