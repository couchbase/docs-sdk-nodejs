// Require Couchbase Module
var couchbase = require('couchbase');
var http = require('http');
const here = process.cwd();
const truststorepath = here + "/" + '../etc/x509-cert/SSLCA/clientdir/trust.pem';
const certpath = here + "/" + '../etc/x509-cert/SSLCA/clientdir/client.pem';
const keypath = here + "/" + '../etc/x509-cert/SSLCA/clientdir'; // gets /client.key from cluster.bucket()

// Setup Cluster Connection Object
const options = {username: 'testuser', password: 'password'};
var cluster = new couchbase.Cluster(
    'couchbases://127.0.0.1/travel-sample' +
    '?truststorepath=' + truststorepath +
    '&certpath=' + certpath +
    '&keypath=' + keypath, options);

// Setup Bucket object to be reused within the code
var bucket = cluster.bucket('client.key');
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
