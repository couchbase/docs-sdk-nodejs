"use strict";

const couchbase = require("couchbase");

async function go() {
    const clusterAdm = new couchbase.Cluster("couchbase://localhost", {
        username: "Administrator",
        password: "password",
    })
    const bucketName = "travel-sample"
    const bucketAdm = clusterAdm.bucket();
    
    await example1(clusterAdm, "username", "password", bucketName)
}

async function example1(clusterAdm, testUsername, testPassword, bucketName) {
    // tag::usermanagement_1[]
    const userMgr = clusterAdm.users();
    
    await userMgr.upsertUser({
        username: testUsername,
        password: testPassword,
        displayName: "Constance Lambert",
        roles: [
            // Roles required for the reading of data from the bucket
            { name: "data_reader", bucket: "*" },
            { name: "query_select", bucket: "*" },
            
            // Roles required for the writing of data into the bucket. 
            { name: "data_writer", bucket: bucketName },
            { name: "query_insert", bucket: bucketName },
            { name: "query_delete", bucket: bucketName },
            
            // Role required for the creation of indexes on the bucket.
            { name: "query_manage_index", bucket: bucketName }
        ]
    })
    // end::usermanagement_1[]
}

go()
    .then((res) => console.log("DONE:", res))
    .catch((err) => console.error("ERR:", err))
    .then(process.exit)
