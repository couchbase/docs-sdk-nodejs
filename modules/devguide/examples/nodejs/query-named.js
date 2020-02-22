var couchbase = require('couchbase');

// Setup Cluster Connection Object
const options = {username: 'Administrator', password: 'password'};
const cluster = new couchbase.Cluster("http://localhost", options);
const bucket = cluster.bucket("travel-sample");

// Make a N1QL specific Query
var query = "SELECT airportname, city, country FROM `travel-sample` WHERE type=$TYPE and city=$CITY";

// Issue Query with parameters passed in array

const opts = { parameters : {  TYPE:"airport", CITY:"Reno"} };
cluster.query(query, opts, function(err,result){
        console.log(err);
        if (err) throw err;
        console.log("Result:",result);
  console.log('Example Successful - Exiting');
  process.exit(0);
});
