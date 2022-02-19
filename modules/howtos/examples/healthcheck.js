'use strict'

const couchbase = require('couchbase')

async function go() {
  const cluster = await couchbase.connect('couchbase://localhost', {
    username: 'Administrator',
    password: 'password',
  })

  console.log('Example: ping-basic[]')
  // tag::ping-basic[]
  var pingResult = await cluster.ping()

  Object.entries(pingResult.services).forEach((service) => {
    const serviceName = service[0]
    const pingReports = service[1]

    pingReports.forEach((report) => {
      console.log(`${serviceName}: ${report.remote} took ${report.latency_us}`)
    })
  })
  // end::ping-basic[]

  console.log('\nExample: ping-json[]')
  // tag::ping-json[]
  pingResult = await cluster.ping()
  console.log(JSON.stringify(pingResult, null, 2))
  // end::ping-json[]

  // Doesn't seem to work, it still shows all service types, regardless
  // of the option passed in.
  // console.log('Example: ping-options[]')
  // tag::ping-options[]
  // pingResult = await cluster.ping({
  //   serviceTypes: couchbase.ServiceType.Query,
  // })
  // console.log(JSON.stringify(pingResult, null, 2))
  // end::ping-options[]

  console.log('\nExample: diagnostics-basic[]')
  // tag::diagnostics-basic[]
  var diagnosticsResult = await cluster.diagnostics()

  Object.entries(diagnosticsResult.services).forEach((service) => {
    const serviceName = service[0]
    const diagnosticsReports = service[1]

    diagnosticsReports.forEach((report) => {
      console.log(
        `${serviceName}: ${report.remote} last activity ${report.last_activity}`
      )
    })
  })
  // end::diagnostics-basic[]
}

go().then(process.exit)
