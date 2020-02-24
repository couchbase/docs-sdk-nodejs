// Require Couchbase Module
var couchbase = require('couchbase');

/*
 * Put Self-Signed Cluster Certificate from the cluster
 * to /tmp/couchbase-ssl-certificate.pem:
 *
 * DO NOT CURL IN CODE AS CURL MAY STILL BE WRITING FILE WHEN CONNECTION STARTS
 *
 * $ curl http://localhost:8091/pools/default/certificate > /tmp/couchbase-ssl-certificate.pem
 *
 * THIS IS WHAT I USED
 *  Note that the file name is <certpath>/<bucketname> without any extension
 *
 * $ curl http://localhost:8091/pools/default/certificate -o /tmp/junk.pem
 */

// Setup Cluster Connection Object - must include the bucket name
// incorrect bucket name here will get you BUCKET_NOT_FOUND

var connString = 'couchbases://127.0.0.1/travel-sample?certpath=/tmp';

// Setup Cluster Connection Object

const options = {username: 'Administrator', password: 'password'};
var cluster = new couchbase.Cluster(connString, options);

// Setup Bucket object to be reused within the code
// 
// specify bucket again. Actually this does appear to be used for the 
// name of the bucket. It must be the name of the pem file withing
// the certpath directory.
// Mess that up and you will get a generic SSL ERROR
// 
const bucket = cluster.bucket("junk.pem"); // specify bucket (again??) - appending to connString makes it work
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
    e.printStackTrace();
}
