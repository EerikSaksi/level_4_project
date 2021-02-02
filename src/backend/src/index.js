const express = require('express');
const {postgraphile, makePluginHook} = require('postgraphile');
const MyPlugins = require('./postgraphile_plugins')
const PostGraphileConnectionFilterPlugin = require('postgraphile-plugin-connection-filter');
const run_all_sql_scripts = require('./sql_scripts/call_sql_scripts')
const { default: PgPubsub } = require("@graphile/pg-pubsub"); 
require('dotenv').config();
const pluginHook = makePluginHook([PgPubsub]);
const postgraphileOptions = {
  pluginHook,
  subscriptions: true,
  simpleSubscriptions: true,
  watchPg: true,
  dynamicJson: true,
  setofFunctionsContainNulls: false,
  ignoreRBAC: false,
  ignoreIndexes: false,
  appendPlugins: [require("@graphile-contrib/pg-simplify-inflector"), MyPlugins, PostGraphileConnectionFilterPlugin],
  exportGqlSchemaPath: "schema.graphql",
  handleErrors: (error) => console.log(error),
  graphiql: true,
  enhanceGraphiql: true,
  enableQueryBatching: true,
  legacyRelations: "omit",
  disableDefaultMutations: false,
  pgSettings: async () => {
   return {
      'user.googleID': 'private_team_creator'
    };
  },
  ownerConnectionString: "postgres://eerik:Postgrizzly@localhost:5432/rpgym"
}
const app = express();
(async () => {
  await run_all_sql_scripts()
  app.use(postgraphile("postgres://query_sender:restrictedPermissions@localhost:5432/rpgym", postgraphileOptions))
})();
app.listen(process.env.PORT || 4000);
