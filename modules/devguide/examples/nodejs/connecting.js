// Require Couchbase Module
var couchbase = require('couchbase');

// Setup Cluster Connection Object
var connString = 'couchbase://localhost';
const options = {username: 'Administrator', password: 'password'};
var cluster = new couchbase.Cluster(connString, options);

// Setup Bucket object to be reused within the code
var bucket = cluster.bucket('travel-sample');
const collection = bucket.defaultCollection();
const docKey = 'airport_1254';

var result;
try {
    result = collection.get(docKey, {timeout: 1000},
        (err, res) => {
            if (res) console.log(JSON.stringify(res));
            if (err) console.log(err);
            process.exit(0);
        })
        .catch((e) => {
            console.log(e)
        });
} catch (e) {
    console.trace();
}

