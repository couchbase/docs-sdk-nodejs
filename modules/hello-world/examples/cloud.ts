'use strict'

// tag::ts-imports[]
import {
  Bucket,
  Cluster,
  Collection,
  connect,
  GetResult,
  QueryResult,
} from 'couchbase'
// end::ts-imports[]

async function main() {
  // tag::ts-connect[]
  const clusterConnStr: string =
    'couchbases://cb.<your-endpoint>.cloud.couchbase.com'
  const username: string = 'username'
  const password: string = 'Password!123'
  const bucketName: string = 'travel-sample'

  const cluster: Cluster = await connect(clusterConnStr, {
    username: username,
    password: password,
  })

  // Sets a pre-configured profile called "wanDevelopment" to help avoid latency issues
  // when accessing Capella from a different Wide Area Network
  // or Availability Zone (e.g. your laptop).
  cluster.applyProfile("wanDevelopment")
  // end::ts-connect[]

  // tag::ts-bucket[]
  const bucket: Bucket = cluster.bucket(bucketName)
  // end::ts-bucket[]

  // tag::ts-collection[]
  const collection: Collection = bucket
    .scope('tenant_agent_00')
    .collection('users')
  // end::ts-collection[]

  // tag::ts-default-collection[]
  // Get a reference to the default collection, required only for older Couchbase server versions
  const collection_default: Collection = bucket.defaultCollection()
  // end::ts-default-collection[]

  // tag::ts-upsert-get[]
  interface User {
    type: string
    name: string
    email: string
    interests: string[]
  }

  const user: User = {
    type: 'user',
    name: 'Michael',
    email: 'michael123@test.com',
    interests: ['Swimming', 'Rowing'],
  }

  await collection.upsert('michael123', user)

  // Load the Document and print it
  // Prints Content and Metadata of the stored document
  const getResult: GetResult = await collection.get('michael123')
  console.log('Get Result:', getResult)
  // end::ts-upsert-get[]

  // tag::ts-query[]
  // Perform a N1QL Query
  const queryResult: QueryResult = await bucket
    .scope('inventory')
    .query('SELECT name FROM `airline` WHERE country=$1 LIMIT 10', {
      parameters: ['United States'],
    })
  console.log('Query Results:')
  queryResult.rows.forEach((row) => {
    console.log(row)
  })
  // end::ts-query[]
}

// tag::ts-run-main[]
// Run the main function
main()
  .catch((err) => {
    console.log('ERR:', err)
    process.exit(1)
  })
  .then(() => process.exit(0))
// end::ts-run-main[]
