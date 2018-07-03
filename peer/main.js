/**
 * @description
 *  UDP 
 * 
 */

const dgram = require("dgram");
const fs = require("fs");
const path = require("path");

const { PORT, ADDRESS } = require("../config");
const { error, info } = require("../lib/outputs");
const { end } = require("../lib/tools");
const { rsa } = require("../lib/encryption");

const server = dgram.createSocket("udp4");
let app;

class App {

    constructor (pub_keys){
        this.pub_keys = pub_keys;
    }

}


{

    const pub_keys = fs.readFileSync(path.resolve(__dirname, "../", `${ADDRESS}/keys.pub`));

    app = new App(pub_keys);
    app.pub_keys = pub_keys.toString().split("\n").slice(1, 5).join("\n") + "\n";

    try {
        rsa.decrypt(rsa.encrypt("self check", app.pub_keys));
    } catch(err){
        end([ err, "启动自检失败, 请检查公私钥文件 ..." ], error);
    }
    
}


{

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

}


