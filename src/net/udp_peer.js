
const os = require("os");
const dgram = require("dgram");

const {
    tools: { end, test, loaded_file },
    outputs: { error, info, log, warn },
    encryption: { rsa }
} = require("../lib");


/**
 * @class Udp
 *      网络通信
 * 
 * @method
 *      listening   绑定udp的端口
 *      send        发送数据包
 *      use         定义中间件
 * 
 * @attribute
 *      trust_list      建立了隧道的可信节点信息
 *      use_list        存储中间件
 *      fail_list       失败 / 无响应的节点
 *      ready           处理加入网络状态, 未完成
 *      
 * 
 * 
 * @class UdpPeer
 *      应用对象        
 *  
 * @attribute
 *      keys    密钥
 *      net     网络信息
 *      env     手动导入的环境变量
 *      argv    命令行选项、参数     
 * 
 * @method
 *      send_auth       申请加入网络
 * 
 */

const __get_network = () => {
    const networks = os.networkInterfaces();
    const arr = [], net_name = /(en|eth)/;
    let b_pub;

    for (let [ key, network ] of Object.entries(networks)){
        if (net_name.test(key)){
            // const address = network[1] ? network[1]["address"] : network[0]["address"];
            let local_network;
            for (let item of network){
                if (item.family === "IPv4"){
                    local_network = item;
                }
            }
            arr.push(local_network);
            let [ a, b ,c ] = local_network["address"].split(".");
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
};

const __get_argv = () => {
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
};

const __get_env = () => {
    const tmp = {
        DEBUG: false
    };

    if (process.env.DEBUG){
        tmp["DEBUG"] = true;
    }
    
    return tmp;
};

const __generate_udp_head = (com_action) => {
    const [ type, action ] = com_action.split("/");
    return {
        version: "1.0.0",
        type,
        action
    };
};

const __data_normalization = (udp_data) => {
    const data = JSON.parse(udp_data.toString());
    return data;
};

const __init_peers_info = (self, port) => {
    const peers_info = loaded_file(`peers/${port}.json`);
    if (peers_info){
        let tmp = [];
        for (let [k, v] of Object.entries(peers_info)){
            tmp.push([k, v]);
        }
        self.trust_list = new Map(tmp);
    }
};


class Subscribe {

    constructor (){
        
        Object.defineProperty(this, "__subscribe", {
            writable: false,
            configurable: false,
            enumerable: false,
            value: new Map()
        });

    }

    add (event_name, event_fn, b_once = true){
        
        let tmp;
        if (this.__subscribe.has(event_name)){
            tmp = this.__subscribe.get(event_name);
            tmp.push(event_fn);
        } else {
            tmp = [ event_fn ];
            tmp.once = b_once;
            this.__subscribe.set(event_name, tmp);
        }
        
        return () => {
            this.__subscribe.set(event_name, tmp.filter(v => v !== event_fn ));
        };
    }

    dispatch (event_name){
        if (this.__subscribe.has(event_name)){
            let tmp = this.__subscribe.get(event_name);
            tmp.forEach(fn => fn());
            tmp.once && this.__subscribe.delete(event_name);
        } else {
            warn("no subscription", event_name);
        }
    }

    size (){
        return this.__subscribe.size;
    }

}

class Udp {

    constructor (){
        this.trust_list = new Map();
        this.use_list = [];
        this.fail_list = [];
        this.ready = false;

        this.verifySub = new Subscribe();
    }

    listening (port, ip = "0.0.0.0"){

        const socket = dgram.createSocket("udp4");

        socket.on("error", (err) => {
            socket.close();
            end(err.stack, error);
        });
        
        socket.on("message", (msg, rinfo) => {
            let i = 0;
            msg = __data_normalization(msg);

            // 之后可以改 generator 形式的洋葱模型
            const next = (err) => {
                try {
                    let fn = this.use_list[i];
                    if (fn){
                        i++;
                        if (err && fn.length === 5){
                            return fn(err, this, msg, rinfo, next);
                        }
                        if (err){
                            return next(err);
                        }
                        if (fn.length !== 5){
                            return fn(this, msg, rinfo, next);
                        }
                    }
                } catch (err){
                    next(err);
                }
                if (err) throw err;
            };
            next();            
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

        __init_peers_info(this, port);

    }

    send (body, action, port, address){
        const data = {
            head: __generate_udp_head(action),
            body: Object.assign({}, body, {
                pub_key: this.keys.pub_key,
                is_pub: this.net.mine.is_pub
            })
        };
        const message = Buffer.from(JSON.stringify(data));
        this.__socket.send(message, port, address, (err) => {
            const s = `${address}:${port}`;
            if (err) {
                this.fail_list.push(s);
                throw err;
            }
            let timer = setTimeout(() => {
                this.verifySub.dispatch(s);
            }, 5000);
            this.verifySub.add(s, () => {
                clearTimeout(timer);
                timer = null;
            });
            log("发送成功", action);
        });
    }

    broadcast (){}

    use (fn){
        if (!test.isFunction(fn)){
            end("the parameter type is not a function");
        }
        this.use_list.push(fn);
    }

    set trust_peers ({ pub_key, address, port, is_pub, origin = null }){
        this.trust_list.set(pub_key, {
            address,
            port,
            is_pub,
            origin
        });
    }

}


class UdpPeer extends Udp {

    constructor (init_address, pub_key){
        
        super();

        this.keys = {
            pub_key: pub_key
        };

        this.net = {
            mine: __get_network(),
            init_address
        };
        this.env = __get_env();
        this.argv = __get_argv();

    }

    send_apply (point_address = this.net.init_address){
        if (!this.argv.c){

            // 这里做判断, 如果列表中存在可信任的公网节点, 直接找公网节点 ...
            // ...
            // 还需要 消息反馈超时 ....

            const [ ip, port ] = point_address.split(":");
            this.send({
                ct: rsa.privateEncrypt(Date.now().toString())
            }, "verify/apply_channel", port, ip);
        }
    }

    verify_info (origin_ct, address, port){
        this.send({
            ct: rsa.privateEncrypt(Date.now().toString()),
            origin_ct
        }, "verify/verify_info", port, address);
    }

}


module.exports = UdpPeer;

