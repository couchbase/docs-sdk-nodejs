"use strict";

const couchbase = require("couchbase");

async function go() {
  // tag::rbac-auth[]
  const cluster = new couchbase.Cluster("couchbase://localhost", {
    username: "Administrator",
    password: "password",
  });
  // end::rbac-auth[]

  // tag::cert-auth[]
  const cluster = new couchbase.Cluster("couchbase://localhost", {
    authenticator: new couchbase.CertificateAuthenticator(
      "/path/to/client/certificate.pem",
      "/path/to/client/key.pem"
    ),
    trustStorePath: "/path/to/ca/certificates.pem",
  });
  // end::cert-auth[]
}
go()
  .then((res) => console.log("DONE:", res))
  .catch((err) => console.error("ERR:", err));
