const couchbase = require('couchbase')

async function go() {
  const cluster = await couchbase.connect('couchbase://localhost', {
    username: 'Administrator',
    password: 'password',
  })

  // tag::n1ql-query[]
  // Call the query() function on the cluster object and store the result.
  const result = await cluster.query('SELECT "Hello World" as greeting')

  // Iterate over the rows to access result data and print to the terminal.
  result.rows.forEach((row) => {
    console.log(row)
  })
  // end::n1ql-query[]
}

go()
  .catch((error) => console.log('ERR:', error))
  .finally(process.exit)
