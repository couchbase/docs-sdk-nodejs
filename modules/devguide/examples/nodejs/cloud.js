var couchbase = require('couchbase');

// Update this to your cluster

const endpoint = 'cb.f334ae21-0eb9-4ebb-83b7-9a6f005745ed.dp.cloud.couchbase.com'
const username = 'user'
const password = 'password'
const bucketName = 'couchbasecloudbucket'

// User Input ends here.

// Initialize the Connection
var cluster = new couchbase.Cluster('couchbases://' +endpoint+'?ssl=no_verify&console_log_level=5', {username: username, password: password});
var bucket = cluster.bucket(bucketName);
var collection = bucket.defaultCollection();

function start(){
  console.log('start');
  return new Promise( (resolve, reject) => { resolve(); });
}

async function run(){
    // Create a N1QL Primary Index (but ignore if it exists)
  try {
    await cluster.queryIndexes().createPrimaryIndex(bucketName, {ignoreExists: true});
  } catch (e) {
  }

  // Create and store a document
  try {
    await collection.upsert('user:king_arthur', {
        'name': 'Arthur', 'email': 'kingarthur@couchbase.com', 'interests': ['Holy Grail', 'African Swallows']
    });
  } catch (e) {
    throw(e);
  }

    // Load the Document and print it
    // Prints Content and Metadata of the stored Document
  try {
    let getResult = await collection .get('user:king_arthur');
    console.log('Got: ');
    console.log(getResult);
  } catch (e) {
    console.log(e);
    throw(e);
  }

  // Perform a N1QL Query
  const options = { parameters: ['African Swallows'] };
  try {
    let queryResult = await cluster.query('SELECT name FROM '+bucketName +' WHERE $1 in interests LIMIT 1', options);
    queryResult.rows.forEach((row) => {
      console.log('Query row: ', row)
    });
  } catch (e) {
    console.log(e);
    throw(e);
  }
}
start().then(run).then(() => { console.log("closing..."); cluster.close();});
