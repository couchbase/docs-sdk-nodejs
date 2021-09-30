var couchbase = require('couchbase');

const cluster = new couchbase.Cluster(
  'couchbase://localhost',
  { username: 'Administrator', password: 'password' }
)
const bucket = cluster.bucket("travel-sample");


async function start() {
  console.log('start')
}

// tag::queryscope[]
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
// end::queryscope[]

// tag::queryplaceholders[]
async function queryPlaceholders() {
  const query = `
  SELECT airportname, city FROM \`travel-sample\`.inventory.airport
  WHERE city=$1
  `;
  const options = { parameters: ['San Jose'] }

  try {
    let result = await cluster.query(query, options)
    console.log("Result:", result)
    return result
  } catch (error) {
    console.error('Query failed: ', error)
  }
}
// end::queryplaceholders[]

// tag::queryresults[]
async function queryResults() {
  const query = `
  SELECT airportname, city FROM \`travel-sample\`.inventory.airport
  WHERE tz LIKE '%Los_Angeles'
    AND airportname LIKE '%Intl';
  `
  try {
    let results = await cluster.query(query);
    results.rows.forEach((row) => {
      console.log('Query row: ', row)
    })
    return results
  } catch (error) {
    console.error('Query failed: ', error)
  }
}
// end::queryresults[]

// tag::querynamed[]
async function queryNamed() {
  const query = `
    SELECT airportname, city FROM \`travel-sample\`.inventory.airport
    WHERE city=$CITY;
  `
  const options = { parameters: { CITY: 'Reno' } }

  try {
    let result = await cluster.query(query, options)
    console.log("Result:", result)
    return result
  } catch (error) {
    console.error('Query failed: ', error)
  }
}
// end::querynamed[]

start()
  .then(queryScope)
  .then(queryPlaceholders)
  .then(queryNamed)
  .then(queryResults)
  .then(process.exit);
