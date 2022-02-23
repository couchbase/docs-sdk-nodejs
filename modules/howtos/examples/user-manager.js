"use strict";

const couchbase = require("couchbase");

async function go() {
    const clusterAdm = await couchbase.connect("couchbase://localhost", {
        username: "Administrator",
        password: "password",
    })
    const bucketName = "travel-sample"
    const bucketAdm = clusterAdm.bucket(bucketName)
    
    await example1(clusterAdm, "username", "password", bucketName)
    await example2(clusterAdm)
    await example3("username", "password", bucketName)
    await example4(clusterAdm, "username")
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

    // Give some time (2 seconds) for user to be created as example code
    // might run too quickly.
    await new Promise((resolve) => setTimeout(resolve, 2000))
}

async function example2(clusterAdm) {
    // List current users.
    console.log("Listing current users.");
    // tag::usermanagement_2[]
    const listOfUsers = await clusterAdm.users().getAllUsers();

    for (const currentUser of listOfUsers) {
        console.log(`User's display name is: ${ currentUser.displayName }`);
        const currentRoles = currentUser.effectiveRoles;
        for (const role of currentRoles) {
            console.log(`   User has the role: ${ role.name }, applicable to bucket ${ role.bucket }`);
        }
    }
    // end::usermanagement_2[]
}

async function example3(testUsername, testPassword, bucketName) {
    // Access the cluster that is running on the local host, specifying
    // the username and password already assigned by the administrator

    // tag::usermanagement_3[]
    const userCluster = await couchbase.connect(
        "couchbase://localhost", {
        username: testUsername,
        password: testPassword,
    })
    const bucket = userCluster.bucket(bucketName)
    const scope = bucket.scope("inventory")
    const collection = scope.collection("airline")

    await collection.upsert(
        "airline_11", {
            callsign: "MILE-AIR",
            iata: "Q5",
            icao: "MLA",
            id: 11,
            name: "40-Mile Air",
            type: "airline"
        }
    )
    userCluster.close()
    // end::usermanagement_3[]
}

async function example4(clusterAdm, testUsername) {
    // tag::usermanagement_4[]
    await clusterAdm.users().dropUser(testUsername);
    // end::usermanagement_4[]
}

go()
    .then((res) => console.log("DONE:", res))
    .catch((err) => {
        console.log("ERR:", err)
        process.exit(1)
    })
    .then(process.exit)
