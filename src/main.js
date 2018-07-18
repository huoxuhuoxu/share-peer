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


{

    const pub_key = fs.readFileSync(path.resolve(ROOT_PATH, `${KEYS_ADDRESS}/keys.pub`));
    const keys = pub_key.toString().split(os.EOL);

    const peer = new UdpPeer(INIT_PUB_ADDRESS, keys.slice(1, keys.length-2).join(os.EOL) + os.EOL);

    // 自检
    try {
        rsa.decrypt(rsa.encrypt("self check", peer.pub_keys));
    } catch(err){
        end([ err, "启动自检失败, 请检查公私钥文件 ..." ], error);
    }

    const router = new Router();
    
    router.set("connection/auth", (peer, data) => {
        console.log(peer);
        console.log(data);
    });

    // console.log(peer, peer.net.info.networks);

    peer.use(router.route());
    peer.listening(PORT);
    peer.run();

}




