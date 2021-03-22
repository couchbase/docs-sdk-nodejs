var couchbase = require('couchbase');

const cluster = new couchbase.Cluster(
  'couchbase://localhost',
  { username: 'Administrator', password: 'password' }
)
const bucket = cluster.bucket("travel-sample");


async function start() {
  console.log('start')
}

// #tag::queryscope[]
const scope = bucket.scope("inventory");

async function queryScope() {
  const query = `
    SELECT airportname, city FROM airport
    WHERE city='San Jose'
  `;

  try {
    let result = await scope.query(query)
    console.log("Result:", result)
    return result
  } catch (error) {
    console.error('Query failed: ', error)
  }
}
// #end::queryscope[]

start()
  .then(queryScope)
