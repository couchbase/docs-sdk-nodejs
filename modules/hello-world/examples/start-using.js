const couchbase = require('couchbase')

async function main() {
  // tag::connect[]
  // For a secure cluster connection, use `couchbases://<your-cluster-ip>` instead.
  const clusterConnStr = 'couchbase://localhost'
  const certificate = '/cert/path/cert.pem'
  const username = 'Administrator'
  const password = 'password'
  const bucketName = 'travel-sample'

  const cluster = await couchbase.connect(clusterConnStr, {
    username: username,
    password: password,
    // Uncomment if you require a secure cluster connection (TSL/SSL).
    // This is strongly recommended for production use.
    // security: {
    //   trustStorePath: certificate,
    // },
  })
  // end::connect[]

  const bucket = cluster.bucket(bucketName)

  // Get a reference to the default collection, required only for older Couchbase server versions
  const collection_default = bucket.defaultCollection()

  const collection = bucket.scope('tenant_agent_00').collection('users')

  // Create and store a document
  await collection.upsert('michael123', {
    type: 'user',
    name: 'Michael',
    email: 'michael123@test.com',
    interests: ['Swimming', 'Rowing'],
  })

  // Load the Document and print it
  // Prints Content and Metadata of the stored Document
  const getResult = await collection.get('michael123')
  console.log('Get Result: ', getResult)

  // Perform a SQL++ (N1QL) Query
  const queryResult = await bucket
    .scope('inventory')
    .query('SELECT name FROM `airline` WHERE country=$1 LIMIT 10', {
      parameters: ['United States'],
    })
  console.log('Query Results:')
  queryResult.rows.forEach((row) => {
    console.log(row)
  })
}

main()
  .catch((err) => {
    console.log('ERR:', err)
    process.exit(1)
  })
  .then(process.exit)
