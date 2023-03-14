// Require Couchbase Module
var couchbase = require('couchbase');

// Setup Cluster Connection Object
const options = {username: 'Administrator', password: 'password'};
const cluster = new couchbase.Cluster("http://localhost", options);
const bucket = cluster.bucket("travel-sample");
const collection = bucket.defaultCollection();
const docKey = 'airport_77';

// Setup Query

// Make a SQL++ (N1QL) specific Query to Create a Primary Index or Secondary Index
var query = "CREATE PRIMARY INDEX ON `travel-sample`";

// Issue Query to Create the Index
cluster.query(query, function (err, result) {
    if (err) throw err;

    // Print Results
    console.log("Result:", result);

    console.log('Example Successful - Exiting');
    process.exit(0);
});
