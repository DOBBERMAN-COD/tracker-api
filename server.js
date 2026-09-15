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

const port = process.env.API_SERVER_PORT || 3000;

(async function startServer() {
  try {
    await connectToDb();
    await installHandler(app);
    app.listen(port, () => {
      console.log(`API server started on port ${port}`);
    });
  } catch (err) {
    console.log('ERROR:', err);
  }
}());
