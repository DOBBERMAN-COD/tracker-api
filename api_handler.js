const fs = require('fs');
const path = require('path');
const { ApolloServer } = require('apollo-server-express');
const GraphQLDate = require('./graphql_date');
const about = require('./about');
const issue = require('./issue');
const auth = require('./auth.js');

const resolvers = {
  Query: {
    about: about.getMessage,
    user: auth.resolveUser,
    issueList: issue.list,
    issue: issue.get,
    issueCounts: issue.counts,
  },
  Mutation: {
    setAboutMessage: about.setMessage,
    issueAdd: issue.add,
    issueUpdate: issue.update,
    issueDelete: issue.delete,
    issueRestore: issue.restore,
  },
  GraphQLDate,
};

function getContext({ req }) {
  const user = auth.getUser(req);
  return { user };
}

const server = new ApolloServer({
  typeDefs: fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf-8'),
  resolvers,
  context: getContext,
  formatError: (error) => {
    console.log(error);
    return error;
  },
  playground: true,
  introspection: true,
});

async function installHandler(app) {
  await server.start();
  const enableCors = (process.env.ENABLE_CORS || 'true') === 'true';
  console.log('CORS setting:', enableCors);
  let cors;
  if (enableCors) {
    const allowedOrigins = process.env.UI_SERVER_ORIGIN
      ? process.env.UI_SERVER_ORIGIN
      : ['http://localhost:8000', 'https://studio.apollographql.com'];
    const methods = 'POST';
    cors = {
      origin: allowedOrigins,
      methods,
      credentials: true,
    };
  } else {
    cors = false;
  }
  server.applyMiddleware({ app, path: '/graphql', cors });
}

module.exports = { installHandler };
