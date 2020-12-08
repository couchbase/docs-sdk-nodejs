"use strict";

const couchbase = require("couchbase");

async function go() {
  // tag::rbac-auth[]
  const cluster = new couchbase.Cluster("couchbase://localhost", {
    username: "Administrator",
    password: "password",
  });
  // end::rbac-auth[]

  // tag::many-hosts[]
  const cluster = new couchbase.Cluster(
    "couchbase://10.0.0.1,10.0.0.2,10.0.0.3"
  );
  // end::many-hosts[]

  // tag::alt-addresses[]
  const cluster = await couchbase.connect(
    "couchbase://localhost:1234?network=external"
  );
  // end::alt-addresses[]

  // tag::tls-cacert[]
  const cluster = await couchbase.connect("couchbases://localhost", {
    trustStorePath: "/path/to/ca/certificates.pem",
    username: "Administrator",
    password: "password",
  });
  // end::tls-cacert[]

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
