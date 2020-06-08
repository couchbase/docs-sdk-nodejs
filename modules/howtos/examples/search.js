"use strict"

const couchbase = require("couchbase")

async function go() {
  const cluster = new couchbase.Cluster("couchbase://localhost", {
    username: "Administrator",
    password: "password",
  })

  // Open a bucket to allow cluster-level querying
  var bucket = cluster.bucket("travel-sample")

  // tag::search-query-match[]
  async function ftsMatchWord(term) {
    try {
      return await cluster.searchQuery(
        "index-hotel-description", 
        couchbase.SearchQuery.match(term),
        { limit: 5 }
      )
    } catch (error) {
      console.error(error)
    }
  }
  
  ftsMatchWord("five-star")
    .then((result) => console.log(result))
  // end::search-query-match[]

  // tag::search-query-matchPhrase[]
  async function ftsMatchPhrase(phrase) {
    try {
      return await cluster.searchQuery(
        "index-hotel-description", 
        couchbase.SearchQuery.matchPhrase(phrase),
        { limit: 10 }
      )
    } catch (error) {
      console.error(error)
    }
  }
  
  ftsMatchPhrase("10-minute walk from the")
    .then((result) => console.log(result))
  // end::search-query-matchPhrase[]

  // tag::search-query-dateRange[]
  async function ftsBreweryUpdatedByDateRange(startDate, endDate) {
    try {
      return await cluster.searchQuery(
        "index-brewery-by-daterange", 
        couchbase.SearchQuery.dateRange()
          .start(startDate)
          .end(endDate),
        { limit: 5 }
      )
    } catch (error) {
      console.error(error)
    }
  }
  
  ftsBreweryUpdatedByDateRange("2010-11-10", "2010-11-20")
    .then((result) => console.log(result))
  // end::search-query-dateRange[]

  // tag::search-query-conjuncts[]
  async function ftsConjunction() {
    try {
      return await cluster.searchQuery(
        "index-hotel-description",
        couchbase.SearchQuery.conjuncts(
          couchbase.SearchQuery.match("five-star"),
          couchbase.SearchQuery.matchPhrase("luxury hotel")
        )
      )
    } catch (error) {
      console.error(error)
    }
  }
  
  ftsConjunction()
    .then((result) => console.log(result))
  // end::search-query-conjuncts[]

  // tag::search-query-disjuncts[]
  async function ftsDisjunction() {
    try {
      return await cluster.searchQuery(
        "index-hotel-description",
        couchbase.SearchQuery.disjuncts(
          couchbase.SearchQuery.match("Moat"),
          couchbase.SearchQuery.match("Eiffel")
        )
      )
    } catch (error) {
      console.error(error)
    }
  }
  
  ftsDisjunction()
    .then((result) => console.log(result))
  // end::search-query-disjuncts[]

  // tag::handle-hits[]
  ftsDisjunction()
    .then(
      (result) => {
        result.rows.forEach((hit, index) => {
          const docId = hit.id
          const score = hit.score
          const result = index+1
          console.log(`Result #${result} ID: ${docId} Score: ${score}`)
        })
      }
    )
  // end::handle-hits[]

  // tag::handle-facets[]
  result.meta.facets.forEach((facet) => {
    var name = facet.name
    var total = facet.total
    // ...
  })
  // end::handle-facets[]

  // tag::ryow-query[]
  var result = cluster.searchQuery(
    "index-hotel-description",
    couchbase.SearchQuery.match("swanky"),
    { consistency: couchbase.Consistency.RequestPlus }
  )
  // end::ryow-query[]
}
go()
  .then((res) => console.log("DONE:", res))
  .catch((err) => console.error("ERR:", err))
