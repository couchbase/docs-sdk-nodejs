// Require Couchbase Module
var couchbase = require('couchbase');

// Setup Cluster Connection Object
const options = {username: 'Administrator', password: 'password'};
const cluster = new couchbase.Cluster("http://localhost", options);
const bucket = cluster.bucket("travel-sample");

// Make a N1QL specific Query
const query = "SELECT airportname, city, country FROM `travel-sample` WHERE type='airport' AND city='Reno' ";

// Issue Query
cluster.query(query, function (err, result) {
    if (err) throw err;

    // Print Results
    console.log("Result:", result);

    console.log('Example Successful - Exiting');
    process.exit(0);
});
