const couchbase = require('couchbase')

async function go() {
  const cluster = await couchbase.connect('couchbase://localhost', {
    username: 'Administrator',
    password: 'password',
  })

  // tag::n1ql-query[]
  // Call the query() function on the cluster object and store the result.
  const result = await cluster.query('SELECT "Hello World" as greeting')

  // The result object will include an array of rows found.
  // We iterate over the rows to access our result data and print it to the terminal.
  result.rows.forEach((row) => {
    console.log(row)
  })
  // end::n1ql-query[]
}

go()
  .catch((error) => console.log('ERR:', error))
  .finally(process.exit)
