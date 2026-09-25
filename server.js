require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');

const { connectToDb } = require('./db');
const { installHandler } = require('./api_handler');
const auth = require('./auth.js');

const app = express();

app.use(cookieParser());
app.use('/auth', auth.routes);
app.use(express.json());

const port = process.env.PORT || 3000;

// Keep initialization in one promise so that:
// 1. MongoDB connects only once per serverless instance.
// 2. GraphQL is installed only once.
// 3. Requests wait until the application is ready.
let initializationPromise;

function initializeApp() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      await connectToDb();
      await installHandler(app);
    })();
  }

  return initializationPromise;
}

// Vercel/serverless request handler
async function handler(req, res) {
  try {
    await initializeApp();
    return app(req, res);
  } catch (err) {
    console.error('ERROR:', err);

    res.statusCode = 500;
    res.end('Internal Server Error');
  }
}

// When running locally with `npm start`, continue using Express normally.
if (require.main === module) {
  initializeApp()
    .then(() => {
      app.listen(port, () => {
        console.log(`API server started on port ${port}`);
      });
    })
    .catch((err) => {
      console.error('ERROR:', err);
      process.exit(1);
    });
}

// Export the handler for Vercel
module.exports = handler;