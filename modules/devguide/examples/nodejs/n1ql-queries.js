var couchbase = require('couchbase');

const cluster = new couchbase.Cluster(
  'couchbase://localhost',
  { username: 'Administrator', password: 'password' }
)
const bucket = cluster.bucket("travel-sample");
const collection = bucket.defaultCollection();

async function start() {
  console.log('start')
}

// #tag::queryplaceholders[]
const queryPlaceholders = async () => {
  const query = `
    SELECT airportname, city FROM \`travel-sample\` 
    WHERE type=$1 
      AND city=$2
  `;
  const options = { parameters: ['airport', 'San Jose'] }

  try {
    let result = await cluster.query(query, options)
    console.log("Result:", result)
    return result
  } catch (error) {
    console.error('Query failed: ', error)
  }
}
// #end::queryplaceholders[]

// #tag::querynamed[]
const queryNamed = async () => {
  const query = `
    SELECT airportname, city FROM \`travel-sample\` 
    WHERE type=$TYPE 
      AND city=$CITY;
  `
  const options = { parameters: { TYPE: 'airport', CITY: 'Reno' } }

  try {
    let result = await cluster.query(query, options)
    console.log("Result:", result)
    return result
  } catch (error) {
    console.error('Query failed: ', error)
  }
}
// #end::querynamed[]

// #tag::queryresults[]
const queryResults = async () => {
  const query = `
  SELECT airportname, city FROM \`travel-sample\` 
  WHERE type='airport' 
    AND tz LIKE '%Los_Angeles' 
    AND airportname LIKE '%Intl';
  `
  try {
    let results = await cluster.query(query);
    results.rows.forEach((row) => {
      console.log('Query row: ', row)
    })
    return results
  } catch (error) {
    console.error('Query failed: ', error)
  }
}
// #end::queryresults[]

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
  .then(queryPlaceholders)
  .then(queryNamed)
  .then(queryResults)
 //.then(queryresultson)
 //.then(querystate)
