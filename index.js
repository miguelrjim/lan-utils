const express = require('express');
const nslookup = require('nslookup');

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

const PORT = process.env.NODE_DOCKER_PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});