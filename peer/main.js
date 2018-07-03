/**
 * @description
 *  UDP 
 * 
 */

const dgram = require("dgram");
const fs = require("fs");
const path = require("path");
const os = require("os");

const { PORT, ADDRESS } = require("../config");
const { error, info } = require("../lib/outputs");
const { end } = require("../lib/tools");
const { rsa } = require("../lib/encryption");

const server = dgram.createSocket("udp4");
let app;

class App {

    constructor (pub_keys){

        this.pub_keys = pub_keys;
        this.net_info = this.__get_network();  

    }

    __get_network (){

        const networks = os.networkInterfaces();
        const arr = [], net_name = /(en|eth)/;
        let b_pub;

        for (let [ key, network ] of Object.entries(networks)){
            if (net_name.test(key)){
                const address = network[1] ? network[1]["address"] : network[0]["address"];
                arr.push(network);
                let [ a, b ,c ] = address.split(".");
                a = +a, b = +b, c = +c;
                if ( 
                    ( a === 10 ) ||
                    ( a === 172 && b <= 31 && b>= 16 ) ||
                    ( a === 192 && b === 168 && c >=0 && c <= 255 ) 
                ){
                    continue;
                }
                
                b_pub = true;
            }
        }

        return {
            is_pub: !!b_pub,
            networks: arr
        };
    }

}


{

    const pub_keys = fs.readFileSync(path.resolve(__dirname, "../", `${ADDRESS}/keys.pub`));
    app = new App(pub_keys.toString().split("\n").slice(1, 5).join("\n") + "\n");

    try {
        rsa.decrypt(rsa.encrypt("self check", app.pub_keys));
    } catch(err){
        end([ err, "启动自检失败, 请检查公私钥文件 ..." ], error);
    }

    console.log(app, app.net_info.networks);
    
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


