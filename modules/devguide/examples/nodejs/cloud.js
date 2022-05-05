// tag::imports[]
var couchbase = require('couchbase')
// end::imports[]

async function main() {
  // tag::connect[]
  const clusterConnStr = 'couchbases://cb.<your-endpoint>.cloud.couchbase.com'
  const username = 'Administrator'
  const password = 'Password123!'
  const bucketName = 'travel-sample'

  const cluster = await couchbase.connect(clusterConnStr, {
    username: username,
    password: password,
    timeouts: {
      kvTimeout: 10000, // milliseconds
    },
  })
  // end::connect[]

  // tag::bucket[]
  const bucket = cluster.bucket(bucketName)
  // end::bucket[]

  // tag::default-collection[]
  // Get a reference to the default collection, required only for older Couchbase server versions
  const defaultCollection = bucket.defaultCollection()
  // end::default-collection[]

  // tag::collection[]
  const collection = bucket.scope('tenant_agent_00').collection('users')
  // end::collection[]

  // tag::test-doc[]
  const user = {
    type: 'user',
    name: 'Michael',
    email: 'michael123@test.com',
    interests: ['Swimming', 'Rowing'],
  }
  // end::test-doc[]

  // tag::upsert[]
  // Create and store a document
  await collection.upsert('michael123', user)
  // end::upsert[]

  // tag::get[]
  // Load the Document and print it
  // Prints Content and Metadata of the stored Document
  let getResult = await collection.get('michael123')
  console.log('Get Result: ', getResult)
  // end::get[]

  // tag::query[]
  // Perform a N1QL Query
  const queryResult = await bucket
    .scope('tenant_agent_00')
    .query('SELECT name FROM `users` WHERE $1 in interests', {
      parameters: ['Swimming'],
    })
  console.log('Query Results:')
  queryResult.rows.forEach((row) => {
    console.log(row)
  })
  // end::query[]
}

// tag::run-main[]
// Run the main function
main()
  .catch((err) => {
    console.log('ERR:', err)
    process.exit(1)
  })
  .then(process.exit)
// end::run-main[]
