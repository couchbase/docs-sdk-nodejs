const { trace, metrics } = require('@opentelemetry/api')
const {
  defaultResource,
  resourceFromAttributes,
} = require('@opentelemetry/resources')
const { ATTR_SERVICE_NAME } = require('@opentelemetry/semantic-conventions')
const {
  AlwaysOnSampler,
  NodeTracerProvider,
  ParentBasedSampler,
  BatchSpanProcessor,
} = require('@opentelemetry/sdk-trace-node')
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc')
const { connect, getOTelTracer } = require('couchbase')

// Configuration
const SERVICE_NAME = 'couchbase-otel-tracing-example'
const TRACING_ENDPOINT = 'http://localhost:4317'
const CONNECTION_STRING = 'couchbase://localhost'
const BUCKET_NAME = 'default'
const USERNAME = 'Administrator'
const PASSWORD = 'password'

function setupOtelTracing() {
  const customResource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: SERVICE_NAME,
  })
  const resource = defaultResource().merge(customResource)

  const traceExporter = new OTLPTraceExporter({
    url: TRACING_ENDPOINT,
  })

  // Batching is highly recommended for production over the SimpleSpanProcessor
  const processor = new BatchSpanProcessor(traceExporter)

  const sampler = new ParentBasedSampler({
    root: new AlwaysOnSampler(), // Sample all root spans
  })

  const provider = new NodeTracerProvider({
    resource: resource,
    sampler: sampler,
    spanProcessors: [processor],
  })

  provider.register()

  return provider
}

function printBanner() {
  console.log('\n' + '='.repeat(80))
  console.log('OpenTelemetry OTLP Tracing Export Example (Jaeger)')
  console.log('='.repeat(80) + '\n')
}

async function performOperations(collection, cluster) {
  console.log('\n' + '-'.repeat(80))
  console.log('Performing Operations (Generating Traces)')
  console.log('-'.repeat(80) + '\n')

  const docs = {
    'tracing:1': { name: 'Alice', age: 30, type: 'user', user_role: 'admin' },
    'tracing:2': { name: 'Bob', age: 25, type: 'user', user_role: 'developer' },
    'tracing:3': {
      name: 'Charlie',
      age: 35,
      type: 'user',
      user_role: 'manager',
    },
    'tracing:4': {
      name: 'Diana',
      age: 28,
      type: 'user',
      user_role: 'designer',
    },
    'tracing:5': { name: 'Eve', age: 32, type: 'user', user_role: 'analyst' },
  }

  const docKeys = Object.keys(docs)

  console.log('1. Upserting documents...')
  for (const key of docKeys) {
    await collection.upsert(key, docs[key])
    console.log(`   ✓ Upserted '${key}'`)
  }

  console.log('\n2. Retrieving documents...')
  for (let roundNum = 1; roundNum <= 3; roundNum++) {
    console.log(`   Round ${roundNum}:`)
    for (const key of docKeys) {
      await collection.get(key)
    }
    console.log(`     ✓ Retrieved all ${docKeys.length} documents`)
  }

  console.log('\n3. Replacing documents...')
  for (const key of docKeys.slice(0, 3)) {
    // Just first 3
    const getResult = await collection.get(key)
    const doc = getResult.content
    doc.updated = true
    await collection.replace(key, doc, { cas: getResult.cas })
    console.log(`   ✓ Replaced '${key}'`)
  }

  console.log('\n4. Touching documents (updating expiry)...')
  for (const key of docKeys.slice(3)) {
    // Last 2
    await collection.touch(key, 3600) // Expiry in seconds
    console.log(`   ✓ Touched '${key}'`)
  }

  console.log('\n5. Executing N1QL query...')
  const query = `SELECT name, user_role FROM \`${BUCKET_NAME}\` WHERE type = 'user' LIMIT 3`
  try {
    const result = await cluster.query(query)
    console.log(`   ✓ Query returned ${result.rows.length} rows`)
    for (const row of result.rows) {
      console.log(`      - ${row.name}: ${row.user_role}`)
    }
  } catch (e) {
    console.log(`   ⚠ Query failed: ${e.message}`)
  }

  console.log('\n6. Cleaning up...')
  for (const key of docKeys) {
    try {
      await collection.remove(key)
      console.log(`   ✓ Removed '${key}'`)
    } catch (e) {
      // Ignore not found errors during cleanup
    }
  }

  console.log('\n' + '-'.repeat(80))
  console.log('All operations completed!')
  console.log('-'.repeat(80))
}

async function main() {
  printBanner()
  let tracerProvider

  try {
    console.log('Setting up OpenTelemetry Tracing...')
    // tag::tracing-otel-jaeger[]
    // create service resource
    const customResource = resourceFromAttributes({
      [ATTR_SERVICE_NAME]: SERVICE_NAME,
    })
    const resource = defaultResource().merge(customResource)

    // setup an exporter
    // This exporter exports traces on the OTLP protocol over GRPC to localhost:4317.
    const traceExporter = new OTLPTraceExporter({
      url: TRACING_ENDPOINT,
    })

    // Setup a BatchSpanProcessor
    const processor = new BatchSpanProcessor(traceExporter)

    const sampler = new ParentBasedSampler({
      root: new AlwaysOnSampler(), // Sample all traces for demo purposes
    })

    // Create and register the NodeTracerProvider
    const provider = new NodeTracerProvider({
      resource: resource,
      sampler: sampler,
      spanProcessors: [processor],
    })

    // Set the global tracer provider
    provider.register()

    // Wrap the OTel tracer with the Couchbase SDK wrapper
    const couchbaseTracer = getOTelTracer(tracerProvider)

    const cluster = await connect(CONNECTION_STRING, {
      username: USERNAME,
      password: PASSWORD,
      tracer: couchbaseTracer, // Inject the tracer
    })
    // end::tracing-otel-jaeger[]

    const bucket = cluster.bucket(BUCKET_NAME)
    const collection = bucket.defaultCollection()
    console.log('✓ Connected to Couchbase\n')

    await performOperations(collection, cluster)

    console.log('\nClosing cluster connection...')
    await cluster.close()
  } catch (e) {
    console.error(`\nERROR:`, e)
  } finally {
    // CRITICAL: Forces all pending spans in the BatchSpanProcessor
    // to be exported over gRPC before Node exits!
    if (tracerProvider) {
      await tracerProvider.shutdown()
      console.log('✓ OpenTelemetry tracer shut down and spans flushed.')

      console.log('\n' + '='.repeat(80))
      console.log('SUCCESS! Traces Exported')
      console.log('='.repeat(80))
      console.log('\n🔎 VIEW TRACES IN JAEGER:')
      console.log('  • Jaeger UI: http://localhost:16686')
      console.log(`  • Select Service: '${SERVICE_NAME}'`)
      console.log("  • Click 'Find Traces'")
      console.log('='.repeat(80) + '\n')
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
