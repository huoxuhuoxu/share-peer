
const os = require("os");
const dgram = require("dgram");

const { end, test } = require("../lib/tools");
const { error, info } = require("../lib/outputs");

/**
 * @class Udp
 *      网络通信
 * 
 * @method
 *      listening   绑定udp的端口
 *      send        发送数据包
 * 
 * @attribute
 *      trust_list      建立了隧道的可信节点信息
 *      
 * 
 * 
 * @class App
 *      应用对象        
 *  
 * @attribute
 *      keys    密钥
 *      net     网络信息
 *      env     手动导入的环境变量
 *      argv    命令行选项、参数     
 * 
 */


class Udp {

    constructor (){
        this.trust_list = new Set();
        this.use_list = [];
    }

    listening (port, ip = "0.0.0.0"){

        const socket = dgram.createSocket("udp4");

        socket.on("error", (err) => {
            socket.close();
            end(err.stack, error);
        });
        
        socket.on("message", (msg, rinfo) => {
            for (const fn of this.use_list){
                try {
                    fn(this, msg, rinfo);
                } catch (err){
                    error(err);
                    return ;
                }
            }
        });
        
        socket.on("listening", () => {
            const address = socket.address();
            info(`服务器监听 ${address.address}:${address.port}`);
        });

        socket.bind(port, ip);

        Object.defineProperty(this, "__socket", {
            writable: true,
            configurable: false,
            enumerable: false,
            value: socket
        });
    }

    send (...argv){
        this.__socket.send(...argv);
    }

    use (fn){
        if (!test.isFunction(fn)){
            end("use 接收 function 型");
        }
        this.use_list.push(fn);
    }

}

class App extends Udp {

    constructor (pub_key){
        
        super();

        this.keys = {
            pub_key: pub_key
        };

        this.net = {
            info: this.__get_network()
        };

        this.env = this.__get_env();

        this.argv = this.__get_argv();

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

    __get_argv (){

        const argv = process.argv.slice(2);
        const tmp = {};

        while (argv.length){
            const key = argv.shift();
        
            if (!key) continue;
            
            if (key[0] === "-" && argv.length && argv[0][0] !== "-"){
                tmp[key.slice(1)] = argv.shift();
            } else {
                tmp[key.slice(1)] = true;
            }
        }

        return tmp;
    }

    __get_env (){
        
        const tmp = {
            DEBUG: false
        };

        if (process.env.DEBUG){
            tmp["DEBUG"] = true;
        }

        return tmp;
    }

}


module.exports = App;


