// Requires an index called `index-hotel-description` to be created
// See modules/test/scripts/init-couchbase/init-buckets.sh(line 57)

'use strict'

const couchbase = require('couchbase')

async function go() {
  const cluster = await couchbase.connect('couchbase://localhost', {
    username: 'Administrator',
    password: 'password',
  })

  // tag::search-query-conjuncts[]
  async function ftsConjunction() {
    return await cluster.searchQuery(
      'index-hotel-description',
      couchbase.SearchQuery.conjuncts(
        couchbase.SearchQuery.match('five-star'),
        couchbase.SearchQuery.matchPhrase('luxury hotel')
      )
    )
  }

  var result = await ftsConjunction()
  console.log('RESULT:', result)
  // end::search-query-conjuncts[]
  console.log('[search-query-conjuncts] result count:', result.rows.length)

  // tag::search-query-disjuncts[]
  async function ftsDisjunction() {
    return await cluster.searchQuery(
      'index-hotel-description',
      couchbase.SearchQuery.disjuncts(
        couchbase.SearchQuery.match('Louvre'),
        couchbase.SearchQuery.match('Eiffel')
      ),
      {
        facets: {
          Descriptions: new couchbase.TermSearchFacet('description', 5),
        },
        limit: 12,
      }
    )
  }

  result = await ftsDisjunction()
  console.log('RESULT:', result)
  // end::search-query-disjuncts[]
  console.log('[search-query-disjuncts] result count:', result.rows.length)

  // tag::handle-hits[]
  result.rows.forEach((hit, index) => {
    const docId = hit.id
    const score = hit.score
    const resultNum = index + 1
    console.log(`Result #${resultNum} ID: ${docId} Score: ${score}`)
  })
  // end::handle-hits[]

  // tag::handle-facets[]
  var facets = result.meta.facets
  console.log('Descriptions facet:', facets.Descriptions)
  // end::handle-facets[]
}

go()
  .then((res) => console.log('DONE:', res))
  .then(process.exit)
