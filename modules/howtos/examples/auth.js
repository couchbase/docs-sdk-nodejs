// Example requires:
//  - /etc/hosts (or C:\Windows\System32\Drivers\etc\hosts on Windows)
//     with `127.0.0.1 node2.example.com`
'use strict'

const couchbase = require('couchbase')

async function go() {
  // tag::rbac-auth[]
  var cluster = await couchbase.connect('couchbase://localhost', {
    username: 'Administrator',
    password: 'password',
  })
  // end::rbac-auth[]

  // tag::many-hosts[]
  cluster = await couchbase.connect(
    'couchbase://node1.example.com,node2.example.com',
    {
      username: 'Administrator',
      password: 'password',
    }
  )
  // end::many-hosts[]

  try {
    // tag::alt-addresses[]
    cluster = await couchbase.connect(
      'couchbase://localhost:1234?network=external',
      {
        username: 'Administrator',
        password: 'password',
      }
    )
    // end::alt-addresses[]
  } catch (e) {
    console.log('[alt-addresses] requires an alternate address\n')
  }

  try {
    // tag::tls-cacert[]
    cluster = await couchbase.connect('couchbases://localhost', {
      trustStorePath: '/path/to/ca/certificates.pem',
      username: 'Administrator',
      password: 'password',
    })
    // end::tls-cacert[]
  } catch (e) {
    console.log('[tls-cacert] requires a valid certificate\n')
  }

  try {
    // tag::cert-auth[]
    cluster = await couchbase.connect('couchbase://localhost', {
      authenticator: new couchbase.CertificateAuthenticator(
        '/path/to/client/certificate.pem',
        '/path/to/client/key.pem'
      ),
      security: {
        trustStorePath: '/path/to/ca/certificates.pem',
      }
    })
    // end::cert-auth[]
  } catch (e) {
    console.log('[cert-auth] requires a valid certificate\n')
  }
}
go()
  .then((res) => console.log('DONE:', res))
  .then(process.exit)
