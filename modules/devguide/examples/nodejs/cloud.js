// tag::imports[]
var couchbase = require('couchbase')
// end::imports[]

async function main() {
  // tag::connect[]
  const clusterConnStr = 'couchbases://cb.<your-endpoint>.cloud.couchbase.com'
  const username = 'username'
  const password = 'Password!123'
  const bucketName = 'travel-sample'

  const cluster = await couchbase.connect(clusterConnStr, {
    username: username,
    password: password,
  })

  // Sets a pre-configured profile called "wanDevelopment" to help avoid latency issues
  // when accessing Capella from a different Wide Area Network
  // or Availability Zone (e.g. your laptop).
  cluster.applyProfile("wanDevelopment")
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

  // tag::upsert-get[]
  const user = {
    type: 'user',
    name: 'Michael',
    email: 'michael123@test.com',
    interests: ['Swimming', 'Rowing'],
  }

  // Create and store a document
  await collection.upsert('michael123', user)

  // Load the Document and print it
  // Prints Content and Metadata of the stored Document
  let getResult = await collection.get('michael123')
  console.log('Get Result: ', getResult)
  // end::upsert-get[]

  // tag::query[]
  // Perform a N1QL Query
  const queryResult = await bucket
    .scope('inventory')
    .query('SELECT name FROM `airline` WHERE country=$1 LIMIT 10', {
      parameters: ['United States'],
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
