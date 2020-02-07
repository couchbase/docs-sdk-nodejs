// Require Couchbase Module
var couchbase = require('couchbase');

// Setup Cluster Connection Object
const options = {username: 'Administrator', password: 'password'};
const cluster = new couchbase.Cluster("http://localhost", options);
const bucket = cluster.bucket("travel-sample");
const collection = bucket.defaultCollection();

// Setup a new key, initialize as 10 (commented out), add 2, and retreive it
var key = "nodeDevguideExampleCounter";

collection.binary().increment(key, 2, /* {initial: 10},*/ function (err, res) {
    if (err) throw err;

    console.log('Initialized Counter:', res.value);

    collection.binary().increment(key, 2, /* {initial: 10},*/ function (err, res) {
        if (err) throw err;

        console.log('Incremented Counter:', res.value);
        console.log('Example Successful - Exiting');
        process.exit(0);
    });
});
