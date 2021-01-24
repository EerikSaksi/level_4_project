import registerRootComponent from 'expo/build/launch/registerRootComponent';
import React from 'react';
import {setContext} from '@apollo/client/link/context';
import {getCurrentUser} from 'expo-google-sign-in'
import {ApolloProvider, ApolloClient, ApolloClientOptions, createHttpLink} from '@apollo/client'
import Authenticator from '../authenticator';
import { split } from '@apollo/client';
import {getMainDefinition} from '@apollo/client/utilities';
import { WebSocketLink } from '@apollo/client/link/ws';
import {cache} from './cache';

const wsLink = new WebSocketLink({
  uri: `ws://stat-buff.herokuapp.com/graphql`,
  options: {
    reconnect: true,
  },
});

const httpLink = createHttpLink({
  uri: "https://stat-buff.herokuapp.com/graphql",
});

const authLink = setContext(async (_, {headers}) => {
  var user = getCurrentUser()
  if (!user || !user.auth?.idToken){
    return {headers}
  }
  return {
    headers: {
      ...headers,
      authorization: `Bearer ${user!.auth.idToken}` 
    }
  }
})

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === "OperationDefinition" && definition.operation === "subscription";
  },
  wsLink,
  authLink.concat(httpLink)
);

const options: ApolloClientOptions<unknown> = {
  link: splitLink,
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-and-network",
    },
    query: {
      fetchPolicy: "cache-first",
    },
  },
};
const client = new ApolloClient(options);
const index: React.FC = () => (
  <ApolloProvider client={client}>
    <Authenticator />
  </ApolloProvider>
);
registerRootComponent(index);
