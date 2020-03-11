var couchbase = require('couchbase'); 

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// Setup Cluster Connection Object
const options = {username: 'Administrator', password: 'password' };
const cluster = new couchbase.Cluster("couchbase://127.0.0.1?console_log_level=5", options);
const bbucket = cluster.bucket(""); // need to have opened a bucket to create a bucket

var bucket;
var collection;

  var bucketSettings = {
    name: 'hello',
    authType: 'sasl',
    bucketType: 'couchbase',
    ramQuotaMB: 100,
    replicaNumber: 0,
    saslPassword: null,
    flushEnabled: 0
  };

function start(){
  console.log("start");
 return new Promise( (resolve, reject) => { resolve(); });
}

async function dropBucket(){
  var bucketOpts = { timeout : 10000 };
  var bucketManager = cluster.buckets();
  try {
    console.log("dropping bucket...");
    await bucketManager.dropBucket(bucketSettings.name, bucketOpts, function(err,res) {
    if(err && ! err.toString().includes('bucket not found'))
      console.log('Drop of "+bucketSettingsname+" bucket failed: "'+ err.toString() + '"');
    if(res)console.log('Drop of "+bucketSettingsname+" bucket succeeded: ', res);
  }).catch((e)=>{ console.log("dropBucket caught: "+e)});
  } catch (e) { 
    console.log("dropBucket exception: "+e);
  }
}

async function createBucket(){
  var bucketOpts = { timeout : 10000 };
  var bucketManager = cluster.buckets();
  try {
    console.log("creating bucket...");
    await bucketManager.createBucket(bucketSettings, bucketOpts, function(err,res) {
    if(err && ! err.toString().includes('bucket exists'))
      console.log('Creation of "+bucketSettings.name+" bucket failed: "'+ err.toString() + '"');
    if(res)console.log('Creation of "+bucketSettings.name+" bucket succeeded: ', res);
  }).catch((e)=>{ console.log("createBucket caught: "+e)});
  } catch (e) { 
    console.log("createBucket exception: "+e);
  }
  bucket = cluster.bucket(bucketSettings.name);
  collection = bucket.defaultCollection();
}

async function myfunc(){
          var res;
	  var waitTime=2000;
          console.log("waiting "+waitTime+" ms before starting");
          await sleep(waitTime);
          console.log("starting");
          const testKeyGat = '1234';

          // Insert a test document
          await collection.insert(
            testKeyGat, { foo: 14 }, { timeout:10000, expiry: 2000  }, 
              (err, res)=> { 
                if(res)console.log("insert: "+res);
                if(err)console.log("err: "+err);
                if(err) throw err;
              }
          ).catch((e)=>{ console.log("CAUGHT: " +e)});
          console.log("INSERTED");

          // Ensure the key is there
          await collection.get(testKeyGat, { withExpiry : true },
              (err, res)=> { 
                if(res){console.log('get 1: ');console.log(res);};
                if(err)console.log(err);
                if(err) throw err;
              }
          );

          await collection.exists(testKeyGat,  { withExpiry : true },
              (err, res)=> { 
                if(res){console.log('exists 1: ');console.log(res);};
                if(err)console.log(err);
                if(err) throw err;
              }
          );


          // Touch the document
          res = await collection.getAndTouch(testKeyGat, 4,
              (err, res)=> { 
                if(res){console.log('get 2: ');console.log(res);};
                if(err)console.log(err);
                if(err) throw err;
              }
          );

          assert.isObject(res);
          assert.isNotEmpty(res.cas);
          assert.deepStrictEqual(res.value, { foo: 14 });

          await sleep(3000); // Wait for the first expiry

          // Ensure the key is still there
          await collection.get( testKeyGat, { withExpiry : true },
              (err, res)=> { 
                if(res){console.log('get 3: ');console.log(res);};
                if(err)console.log(err);
                if(err) throw err;
              }
          );

          await sleep(2000); // Wait for it to expire

          // Ensure the key is gone
            await collection.get(testKeyGat  ,
              (err, res)=> { 
                if(err)console.log("ERR 'document not found' expected =========> "+err);
                if(res)console.log("RES =========> "+res);
                if(res) throw new Error("should have failed with 'document not found'");;
              } 
            ).catch((e)=>{ if (!e.toString().includes('document not found')) throw e; } ) ;
 }

function toString(obj){
    var str="";
    for (const ky in obj) {
      const val = obj[ky];
      if( val instanceof Object)
        val = toString(val);
      str=str+ky+" : "+val;
    }   
    return "{"+str+"}";
}

class assert {
    static isObject(obj){
	if(! obj instanceof Object)
		throw Error("not an object");
    }
    static isNotEmpty(obj){
	if(!obj)
		throw Error("is Empty");
    }
    static deepStrictEqual(obj, goldObj){
	if(toString(obj) != toString(goldObj))
		throw Error(""+toString(obj)+" is Not Equal"+toString(goldObj));
    }

}

start()
  .then(dropBucket)
  .then(createBucket)
  .then(myfunc)
  .then(() => { console.log("closing..."); cluster.close();});

