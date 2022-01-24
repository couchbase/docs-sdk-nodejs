const couchbase = require('couchbase')

async function go() {
  const cluster = await couchbase.connect('couchbase://localhost', {
    username: 'Administrator',
    password: 'password',
  })
  const bucket = cluster.bucket('travel-sample')
  const usersCollection = bucket.scope('tenant_agent_00').collection('users')

  // tag::kv-users[]
  const users = [
    { id: 'user_111', email: 'tom_the_cat@gmail.com' },
    { id: 'user_222', email: 'jerry_mouse@gmail.com' },
    { id: 'user_333', email: 'mickey_mouse@gmail.com' },
  ]
  // end::kv-users[]

  console.log('[kv-bulk-insert]')
  // tag::kv-bulk-insert[]
  // Wait for all the insert operations to complete and store the results.
  const insertResults = await Promise.all(
    users.map((user) => {
      console.log(`Inserting document: ${user.id}`)
      return usersCollection.insert(user.id, user)
    })
  )

  // Iterate the results and print the CAS metadata.
  insertResults.forEach((result) => console.log('CAS:', result.cas))
  // end::kv-bulk-insert[]

  console.log('\n[kv-bulk-upsert]')
  // tag::kv-bulk-upsert[]
  const newUsers = [
    { id: 'user_111', email: 'tom@gmail.com' },
    { id: 'user_222', email: 'jerry@gmail.com' },
    { id: 'user_333', email: 'mickey@gmail.com' },
  ]

  // Wait for all the upsert operations to complete and store the results.
  const upsertResults = await Promise.all(
    newUsers.map((newUser) => {
      console.log(`Upserting document: ${newUser.id}`)
      return usersCollection.upsert(newUser.id, newUser)
    })
  )

  // Iterate the results and print the CAS metadata.
  upsertResults.forEach((result) => console.log('CAS:', result.cas))
  // end::kv-bulk-upsert[]

  console.log('\n[kv-bulk-get]')
  // tag::kv-bulk-get[]
  // Wait for all the get operations to complete and store the results.
  const getResults = await Promise.all(
    users.map((user) => {
      console.log(`Getting document: ${user.id}`)
      return usersCollection.get(user.id, user)
    })
  )

  // Iterate the results and print the CAS metadata.
  getResults.forEach((result) => console.log('Document:', result.content))
  // end::kv-bulk-get[]

  console.log('\n[kv-bulk-remove]')
  // tag::kv-bulk-remove[]
  // Wait for all the remove operations to complete and store the results.
  const removeResults = await Promise.all(
    users.map((user) => {
      console.log(`Removing document: ${user.id}`)
      return usersCollection.remove(user.id, user)
    })
  )

  // Iterate the results and print the CAS metadata.
  removeResults.forEach((result) => console.log('CAS:', result.cas))
  // end::kv-bulk-remove[]
}

go().then(process.exit)
