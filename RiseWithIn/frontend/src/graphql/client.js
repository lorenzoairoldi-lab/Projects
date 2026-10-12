import { ApolloClient, InMemoryCache, HttpLink, from, fromPromise } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { useAuth } from '../store/auth.js';

export const graphqlUrl = import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:4000/graphql';
const http = new HttpLink({ uri: graphqlUrl });

const auth = setContext((_, { headers }) => {
  const token = useAuth.getState().accessToken;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  return { headers: { ...headers, authorization: token ? `Bearer ${token}` : '', 'x-timezone': timezone } };
});

let refreshPromise;
export const refreshSession = () => {
  if (refreshPromise) return refreshPromise;
  const refreshToken = useAuth.getState().refreshToken;
  if (!refreshToken) return Promise.reject(new Error('Sessione scaduta'));
  refreshPromise = fetch(graphqlUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      query: 'mutation RefreshSession($token:String!){refreshToken(token:$token){accessToken refreshToken user{id email plan}}}',
      variables: { token: refreshToken }
    })
  }).then(async (response) => {
    const result = await response.json();
    const session = result?.data?.refreshToken;
    if (!response.ok || !session) throw new Error('Sessione scaduta');
    useAuth.getState().setSession(session);
    return session.accessToken;
  }).finally(() => { refreshPromise = null; });
  return refreshPromise;
};

const errors = onError(({ graphQLErrors, operation, forward }) => {
  const unauthenticated = graphQLErrors?.some((error) => error.extensions?.code === 'UNAUTHENTICATED');
  if (!unauthenticated || operation.operationName === 'RefreshSession') return undefined;
  return fromPromise(refreshSession().catch(() => {
    useAuth.getState().logout();
    return null;
  })).filter(Boolean).flatMap(() => forward(operation));
});

export const revokeSession = async () => {
  const token = useAuth.getState().refreshToken;
  useAuth.getState().logout();
  await client.clearStore();
  try {
    if (token) await fetch(graphqlUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: 'mutation Logout($token:String!){logout(token:$token)}', variables: { token } })
    });
  } catch {
    // La sessione locale è già chiusa; la scadenza del token completa la revoca se il gateway è offline.
  }
};

export const client = new ApolloClient({
  link: from([errors, auth, http]),
  cache: new InMemoryCache({ typePolicies: { Query: { fields: { contents: {
    keyArgs: ['category', 'type'],
    merge(existing, incoming, { args }) {
      if (!existing || !args || args.offset === 0) return incoming;
      const items = existing.items ? existing.items.slice(0) : [];
      items.splice(args.offset, incoming.items.length, ...incoming.items);
      return { ...incoming, items };
    }
  } } } } })
});
