/**
 * @description
 *  peer - router
 * 
 */


const fs = require("fs");
const path = require("path");
const os = require("os");

const { 
    PORT, 
    KEYS_ADDRESS, 
    INIT_PUB_ADDRESS,
    ROOT_PATH
} = require("../config");

const {
    outputs: { error },
    tools: { end },
    encryption: { rsa }
} = require("./lib");

const {
    UdpPeer,
    Router
} = require("./net");

const {
    verify: { apply_channel, verify_info }
} = require("./actions");

{

    const pub_key = fs.readFileSync(path.resolve(ROOT_PATH, `${KEYS_ADDRESS}/keys.pub`));
    const keys = pub_key.toString().split(os.EOL);

    const peer = new UdpPeer(INIT_PUB_ADDRESS, keys.slice(1, keys.length-2).join(os.EOL) + os.EOL);

    console.log(peer.net.mine.networks);

    // 自检
    try {
        rsa.decrypt(rsa.encrypt("self check", peer.pub_keys));
    } catch(err){
        end([ err, "启动自检失败, 请检查公私钥文件 ..." ], error);
    }

    const router = new Router();
    
    router.set("verify/apply_channel", apply_channel);
    router.set("verify/verify_info", verify_info);


    // 检查: 禁止 向自己发送数据报 
    peer.use((peer, { is_pub }, { address, port }, next) => {
        const b = is_pub ? 
            (address === peer.net.mine.networks[0]["address"] && +port === PORT) : 
            (address === "127.0.0.1" && +port === PORT) ;

        console.log(address, port);

        if (b) next(Error("You can't send data to yourself"));
        else next();
    });

    peer.use(router.route());
    peer.listening(PORT);

    // 错误捕获
    peer.use((err, peer, data, rinfo, next) => {
        error("捕获异常: %s", err.toString());
    });

    // 申请加入网络
    peer.send_apply();
    
}




