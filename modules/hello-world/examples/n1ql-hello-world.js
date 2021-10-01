const couchbase = require('couchbase')

async function go() {
  const cluster = await couchbase.connect('couchbase://localhost', {
    username: 'Administrator',
    password: 'password',
  })

  // tag::n1ql-query[]
  const result = await cluster.query('SELECT "Hello World" as greeting')
  result.rows.forEach((row) => {
    console.log(row)
  })
  // tag::n1ql-query[]
}

go()
  .catch((error) => console.log('ERR:', error))
  .finally(process.exit)
