// Require Couchbase Module
var couchbase = require('couchbase');

// Setup Cluster Connection Object
var cluster = new couchbase.Cluster('couchbase://127.0.0.1');

// Authenticate with the cluster
cluster.authenticate('Administrator', 'password');

// Setup Bucket object to be reused within the code
var bucket = cluster.openBucket('travel-sample');

console.log('Example Successful - Exiting');
process.exit(0);
