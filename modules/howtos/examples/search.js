// Requires an index called `index-hotel-description` to be created
// See modules/test/scripts/init-couchbase/init-buckets.sh(line 57)

'use strict'

const couchbase = require('couchbase')

async function go() {
  const cluster = await couchbase.connect('couchbase://localhost', {
    username: 'Administrator',
    password: 'password',
  })

  const bucket = cluster.bucket('travel-sample')
  const scope = bucket.scope('inventory')
  const collection = scope.collection('hotel')

  // tag::search-query-match[]
  async function ftsMatchWord(term) {
    return await cluster.searchQuery(
      'index-hotel-description',
      couchbase.SearchQuery.match(term),
      { limit: 5 }
    )
  }

  var result = await ftsMatchWord('five-star')
  console.log('RESULT:', result)
  // end::search-query-match[]
  console.log('[search-query-match] result count:', result.rows.length)

  // tag::search-query-matchPhrase[]
  async function ftsMatchPhrase(phrase) {
    return await cluster.searchQuery(
      'index-hotel-description',
      couchbase.SearchQuery.matchPhrase(phrase),
      { limit: 10 }
    )
  }

  result = await ftsMatchPhrase('10-minute walk from the')
  console.log('RESULT:', result)
  // end::search-query-matchPhrase[]
  console.log('[search-query-matchPhrase] result count:', result.rows.length)

  try {
    // tag::search-query-dateRange[]
    async function ftsHotelByDateRange(startDate, endDate) {
      const upsertResult = await collection.upsert('hotel_fts_123', {
        name: 'HotelFTS',
        updated: new Date('2010-11-10 18:33:50 +0300'),
        description: 'a fancy hotel',
        type: 'hotel',
      })

      // tag::mutation-state[]
      const mutationState = new couchbase.MutationState(upsertResult.token)
      // end::mutation-state[]
      return await cluster.searchQuery(
        'index-hotel-description',
        couchbase.SearchQuery.dateRange().start(startDate).end(endDate),
        {
          limit: 5,
          // tag::consistent-with[]
          consistentWith: mutationState,
          // end::consistent-with[]
        }
      )
    }

    result = await ftsHotelByDateRange('2010-11-10', '2010-11-20')
    console.log('RESULT:', result)
    // end::search-query-dateRange[]
    console.log('[search-query-dateRange] result count:', result.rows.length)
  } catch (e) {
    if (e instanceof couchbase.ParsingFailureError) {
      // https://issues.couchbase.com/browse/JSCBC-942 has been raised
      // so we are ignoring the error for now.
      // TODO: Remove try/catch once resolved.
      console.log(e)
    } else {
      throw e
    }
  }

  try {
    // tag::ryow-query[]
    result = await cluster.searchQuery(
      'index-hotel-description',
      couchbase.SearchQuery.match('swanky'),
      { consistency: couchbase.SearchScanConsistency.NotBounded }
    )
    // end::ryow-query[]
  } catch (e) {
    // https://issues.couchbase.com/browse/JSCBC-942 has been raised
    // so we are ignoring the error for now.
    // TODO: Remove try/catch once resolved.
    console.log(e)
  }

  let result
  // this should come from an external source, such as an embeddings API
  const queryVector = []
  const anotherQueryVector = []

  // tag::vector-search-single[]
  let request = couchbase.SearchRequest.create(
    couchbase.VectorSearch.fromVectorQuery(
      couchbase.VectorQuery.create('vector_field', queryVector)
    )
  )
  result = await scope.search('vector-index', request)
  // end::vector-search-single[]

  // tag::vector-search-multi[]
  request = couchbase.SearchRequest.create(
    couchbase.VectorSearch([
      couchbase.VectorQuery.create('vector_field', queryVector)
        .numCandidates(2)
        .boost(0.3),
      couchbase.VectorQuery.create('vector_field', anotherQueryVector)
        .numCandidates(5)
        .boost(0.7),
    ])
  )
  result = await scope.search('vector-index', request)
  // end::vector-search-multi[]

  // tag::vector-search-combo[]
  request = couchbase.SearchRequest.create(
    couchbase.SearchQuery.matchAll()
  ).withVectorSearch(
    couchbase.VectorSearch.fromVectorQuery(
      couchbase.VectorQuery.create('vector_field', queryVector)
    )
  )
  result = await scope.search('vector-and-fts-index', request)
  // end::vector-search-combo[]

  // tag::search-query-search[]
  request = couchbase.SearchRequest.create(couchbase.SearchQuery.matchAll())
  result = await scope.search('index-hotel-description', request)
  // end::search-query-search[]
}

go()
  .then((res) => console.log('DONE:', res))
  .then(process.exit)
