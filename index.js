const express = require('express');
const nslookup = require('nslookup');
const { readFile } = require('fs').promises;
const https = require('https');

const sslPrivateKeyEnv = 'SSL_PRIVATE_KEY';
const sslCertificate = 'SSL_CERTIFICATE';

const app = express();

app.get('/ips/:domain', async (req, res) => {
  Promise.all(['1.1.1.1', '8.8.8.8'].map(server =>
    getIps(req.params.domain, server, 'a')
  ))
    .then(all => all.reduce((a, b) => a.concat(b), []))
    .then(addrs => res.status(200).send(Array.from(new Set(addrs)).join("\n")))
    .catch(err => res.status(400).send(err));
});

async function getIps(domain, server, type) {
  return new Promise((resolve, reject) => {
    nslookup(domain)
      .server(server)
      .type(type)
      .end((err, addrs) => {
        if (null != err) {
          reject(err);
        } else {
          resolve(addrs);
        }
      })
  })
}


async function main() {
  const isSsl = [sslPrivateKeyEnv, sslCertificate].every(k => k in process.env);
  const PORT = process.env.NODE_DOCKER_PORT || isSsl ? 443 : 80;
  let appWrapper = app;
  if (isSsl) {
    appWrapper = https.createServer({
      key: await readFile(process.env[sslPrivateKeyEnv]),
      cert: await readFile(process.env[sslCertificate]),
    }, app)
  }
  appWrapper.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
  });
}

main()
  .catch(console.error);