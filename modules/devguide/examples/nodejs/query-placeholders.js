var couchbase = require('couchbase');

// Setup Cluster Connection Object
const options = {username: 'Administrator', password: 'password'};
const cluster = new couchbase.Cluster("http://localhost", options);
const bucket = cluster.bucket("travel-sample");

// Make a SQL++ (N1QL) specific Query
// #tag::select[]
var query = "SELECT airportname, city, country FROM `travel-sample` " +
    "WHERE type=$1 AND city=$2";

// Issue Query with parameters passed in array

cluster.query(query, {parameters: ["airport", "Reno"]}, function (err, result) {
    console.log(err);
    if (err) throw err;
    console.log("Result:", result);
    console.log('Example Successful - Exiting');
    process.exit(0);
});
// #end::select[]
