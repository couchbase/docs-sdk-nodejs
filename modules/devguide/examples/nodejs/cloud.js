var couchbase = require('couchbase')

const clusterConnStr =
  'couchbases://cb.abcdefab-cdef-abcd-efab-cdefabcdef.dp.cloud.couchbase.com'
const cloudRootCertificate = '/etc/x509-cert/SSLCA/clientdir/trust.pem'
const username = 'user'
const password = 'password'
const bucketName = 'couchbasecloudbucket'

async function go() {
  const cluster = await couchbase.connect(clusterConnStr, {
    username: username,
    password: password,
    trustStorePath: cloudRootCertificate,
  })

  const bucket = cluster.bucket(bucketName)
  const collection = bucket.defaultCollection()

  // Create a N1QL Primary Index (but ignore if it exists)
  await cluster
    .queryIndexes()
    .createPrimaryIndex(bucketName, { ignoreExists: true })

  // Create and store a document
  await collection.upsert('user:king_arthur', {
    name: 'Arthur',
    email: 'kingarthur@couchbase.com',
    interests: ['Holy Grail', 'African Swallows'],
  })

  // Load the Document and print it
  // Prints Content and Metadata of the stored Document
  let getResult = await collection.get('user:king_arthur')
  console.log('got: ', getResult)

  // Perform a N1QL Query
  let queryResult = await cluster.query(
    'SELECT name FROM ' + bucketName + ' WHERE $1 in interests LIMIT 1',
    { parameters: ['African Swallows'] }
  )
  queryResult.rows.forEach((row) => {
    console.log('query row: ', row)
  })
}
go()
