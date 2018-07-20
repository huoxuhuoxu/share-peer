
const os = require("os");
const dgram = require("dgram");

const {
    tools: { end, test, loaded_file },
    outputs: { error, info, log },
    encryption: { rsa },
    Subscribe
} = require("../lib");


/**
 * @class Udp
 *      网络通信
 * 
 *  @method
 *      listening   绑定udp的端口
 *      send        发送数据包
 *      use         定义中间件
 * 
 *  @attribute
 *      trust_list      建立了隧道的可信节点信息
 *      trust_min       理论上最小需要保持的连接数
 *      trust_wait      等待确认节点是否可信任
 *      use_list        存储中间件
 *      ready           处理加入网络状态, 未完成
 *      __send_fail     udp head verify 失败的处理
 *      
 * 
 * 
 * @class UdpPeer
 *  应用对象        
 *  
 *  @attribute
 *      keys    密钥
 *      net     网络信息
 *      env     手动导入的环境变量
 *      argv    命令行选项、参数     
 * 
 *  @method
 *      
 *      send_auth       申请加入网络
 *      get_peers       获取其他存在于网络中的节点信息
 * 
 * 
 * 
 * @global
 * 
 *  @function
 *      __get_network           获取本地网卡信息
 *      __get_argv              获取命令行选项/参数
 *      __get_env               获取环境变量
 *      __generate_udp_head     生成udp消息头部
 *      __data_normalization    将接收到的udp消息数据部分统一解码
 *      __init_peers_info       读取本地存储其他节点信息
 *      __is_ready              转换准备节点, 启动 blockchain
 *
 *       
 *  @attribute
 *      privater                私有属性集合
 * 
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
    let res_action;
    switch (com_action){
        case "verify/apply_channel": res_action = "rverify/verify_info";
        break;
    }
    return [
        res_action,
        {
            version: "1.0.0",
            type,
            action
        }
    ];
};

const __data_normalization = (udp_data) => {
    const data = JSON.parse(udp_data.toString());
    return data;
};

const __init_peers_info = (self, port) => {
    const peers_info = loaded_file(`peers/${port}.json`);
    if (peers_info){
        let tmp = new Set();
        for (let [, v] of Object.entries(peers_info)){
            v.is_pub && tmp.add(`${v.address}:${v.port}`);
        }
        tmp.size && (self.trust_wait = tmp);
    }
};

const __is_ready = (self) => {
    if (!self.verifySub.size && self.trust_list.size < self.trust_min)
        return self.get_peers();

    // 开始启动 blockchain
    self.ready = true;
    // ...
};

class Udp {

    constructor (){
        this.trust_list = new Map();
        this.trust_min = 5;

        this.trust_wait = new Set();

        this.use_list = [];
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
        const [ res_acrion, head ] = __generate_udp_head(action);
        const data = {
            head,
            body: Object.assign({}, body, {
                pub_key: this.keys.pub_key,
                is_pub: this.net.mine.is_pub
            })
        };

        const message = Buffer.from(JSON.stringify(data));
        this.__socket.send(message, port, address, (err) => {
            const s = `${address}:${port}`;
            if (err) throw err;
            // 所有的反馈行为不做响应超时处理
            if (res_acrion){

                let event_name = `${s}-${res_acrion}`;

                let timer = setTimeout(() => {
                    this.verifySub.dispatch(event_name);
                    __is_ready(this);
                }, 5000);
                
                this.verifySub.add(event_name, () => {
                    this.trust_wait.delete(s);
                    clearTimeout(timer);
                    timer = null;
                });
            }
            
            log("发送成功", address, port, action);
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

    run (point_address = this.net.init_address){
        if (!this.argv.c){
            this.trust_wait.add(point_address);
            for (let s of this.trust_wait){
                this.send_apply(s);
            }       
        }
    }

    // 申请建立隧道
    send_apply (s){
        // 追加判断 ... 是否已经存在于信任列表中 ....
        let [ address, port ] = s.split(":");
        this.send({
            ct: rsa.privateEncrypt(Date.now().toString())
        }, "verify/apply_channel", port, address);
    }

    // 响应 - verify/apply_channel, 核对信息
    verify_info (origin_ct, address, port){
        this.send({
            ct: rsa.privateEncrypt(Date.now().toString()),
            origin_ct
        }, "rverify/verify_info", port, address);
    }   

    // 获取其他 peers 信息
    get_peers (){
        console.log("需要, 获取其他peer信息");
        // ...... 优先返回 公网节点 / 心跳时间最近的节点 ... ...
    }

}


module.exports = UdpPeer;

