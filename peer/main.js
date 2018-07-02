/**
 * @description
 *  UDP 
 * 
 */

const dgram = require("dgram");
const server = dgram.createSocket("udp4");

const { PORT } = require("../config");
const { error, info } = require("../lib/outputs");
const { end } = require("../lib/tools");

server.on("error", (err) => {
    server.close();
    end(err.stack, error);
});

server.on("message", (msg, rinfo) => {
    console.log(msg, rinfo);
});

server.on("listening", () => {
    const address = server.address();
    info(`服务器监听 ${address.address}:${address.port}`);
});


// 之后改集群 ...
server.bind(PORT);

