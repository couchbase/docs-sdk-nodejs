
var couchbase = require('couchbase');

// Setup Cluster Connection Object
const options = {username: 'Administrator', password: 'password'};
const cluster = new couchbase.Cluster("http://localhost", options);
const bucket = cluster.bucket("travel-sample");
const collection = bucket.defaultCollection();


function start(){
  console.log("start");
 return new Promise( (resolve, reject) => { resolve(); });

}

async function queryplaceholders(){
  // Make a N1QL specific Query
  // #tag::queryplaceholders[]
  var query = "SELECT airportname, city, country FROM `travel-sample` " +
      "WHERE type=$1 AND city=$2";
  
  // Issue Query with parameters passed in array
  
  var result=await cluster.query(query, {parameters: ["airport", "Reno"]}, function (err, res) {
      console.log(err);
      if (err) throw err;
      console.log("Result:", res);
  });
  // #end::queryplaceholders[]
}

async function querynamed(){

  // Make a N1QL specific Query
  // #tag::querynamed[]
  var query = "SELECT airportname, city, country FROM `travel-sample` WHERE type=$TYPE and city=$CITY";
  
  // Issue Query with parameters passed in objects
  
  const opts = { parameters : {  TYPE:"airport", CITY:"Reno"} };
  var result=await cluster.query(query, opts, function(err,res){
          console.log(err);
          if (err) throw err;
          console.log("Result:",res);
  });
  // #end::querynamed[]
}
async function queryresults(){

  // Make a N1QL specific Query
  var query = "SELECT airportname, city, country FROM `travel-sample` WHERE type=$TYPE and city=$CITY";
  
  // Issue Query with parameters passed in objects
  
  // #tag::queryresults[]
  const opts = { parameters : {  TYPE:"airport", CITY:"Reno"} };
  var result=cluster.query(query, opts, function(err,res){
          console.log(err);
          if (err) throw err;
          res.rows.forEach((row)=>{
             console.log("row :");
             console.log(row);
          });
  });
  // #end::queryresults[]
} 

/*** Not implemented
async function queryresultson(){

  // Make a N1QL specific Query
  var query = "SELECT airportname, city, country FROM `travel-sample` WHERE type=$TYPE and city=$CITY";
  
  // Issue Query with parameters passed in objects
  
  // #tag::queryresultson[]
  const opts = { parameters : {  TYPE:"airport", CITY:"Reno"} };
  //var result= cluster.query(query, opts);
  var result= await cluster.query(query, opts,()=>{console.log("done->callback")}, (r)=>{console.log(r);});
  //result.on('row', (r)=>{ console.log("row:"); console.log(r);})
  // #end::queryresultson[]
}
***/

/*** Not implemented
async function querystate(){
// create / update document (mutation)
var upsertResult = await collection.upsert('id', {name: 'Mike', type: 'User'});
// create mutation state from mutation results
console.log(upsertResult);
//var state = couchbase.MutationState.from(upsertResult);
var state = upsertResult.cas;
// use mutation state with query option
var result = await cluster.query(
    'SELECT x.* FROM `default` WHERE x.Type=$1',
       { parameters : ['User'],
        consistentWith: state,
    }, (err,res)=>console.log(res));     
}
***/


start()
 .then(queryplaceholders)
 .then(querynamed)
 .then(queryresults)
 //.then(queryresultson)
 //.then(querystate)
