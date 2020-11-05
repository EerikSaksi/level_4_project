import registerRootComponent from 'expo/build/launch/registerRootComponent';
import App from './App';

import {ApolloProvider, ApolloClient, ApolloClientOptions, InMemoryCache} from '@apollo/client'

const options: ApolloClientOptions<unknown> = {uri: 'localhost:4000/graphql', cache: new InMemoryCache()}
const client = new ApolloClient(options);
const index: React.FC  = () => <ApolloProvider client = {client}><App/></ApolloProvider>
registerRootComponent(index);