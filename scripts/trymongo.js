// Making a connection to the MongoDB server
const { MongoClient } = require('mongodb');

const url = process.env.DB_URL || 'mongodb://localhost/issuetracker';

// Adding the local installation URL to try.mongo.js file
// Atlas URL - replace UUU with user, PPP with password, XXX with hostname
// const url = 'mongodb+srv://UUU:PPP@cluster0-XXX.mongodb.net/issuetracker?retryWrites=true';
// mLab URL - replace UUU with user, PPP with password, XXX with hostname
// const url = 'mongodb://UUU:PPP@XXX.mlab.com:33533/issuetracker';

function testWithCallbacks(callback) {
  console.log('\n--- testWithCallbacks ---');
  const client = new MongoClient(url, { useNewUrlParser: true });
  client.connect((connectError, mongoClient) => {
    if (connectError) {
      callback(connectError);
      return;
    }

    console.log('Connected to MongoDB URL', url);

    const db = mongoClient.db();
    const collection = db.collection('employees');

    const employee = { id: 1, name: 'A.Callback', age: 23 };
    collection.insertOne(employee, (insertError, result) => {
      if (insertError) {
        mongoClient.close();
        callback(insertError);
        return;
      }
      console.log('Result of insert:\n', result.insertedId);
      collection.find({ _id: result.insertedId }).toArray((findError, docs) => {
        if (findError) {
          mongoClient.close();
          callback(findError);
          return;
        }
        console.log('Result of find:\n', docs);
        mongoClient.close();
      });
    });
  });
}

async function testWithAsync() {
  console.log('\n--- testWithAsync ---');
  const client = new MongoClient(url, { useNewUrlParser: true });

  try {
    await client.connect();
    console.log('Connected to MongoDB URL', url);
    const db = client.db();
    const collection = db.collection('employees');

    const employee = { id: 2, name: 'B.Async', age: 25 };
    const result = await collection.insertOne(employee);
    console.log('Result of insert:\n', result.insertedId);

    const docs = await collection.find({ _id: result.insertedId }).toArray();
    console.log('Result of find:\n', docs);
  } catch (err) {
    console.log(err);
  } finally {
    client.close();
  }
}

testWithCallbacks((err) => {
  if (err) {
    console.log(err);
  }
  testWithAsync();
});
