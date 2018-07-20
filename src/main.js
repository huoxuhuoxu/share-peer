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
    outputs: { error, log },
    tools: { end, save_file },
    encryption: { rsa }
} = require("./lib");

const {
    UdpPeer,
    Router
} = require("./net");

const {
    verify: { apply_channel, verify_info },
    mws: { prohibit_to_own, cancel_verify_timeout }
} = require("./actions");


{

    const pub_key = fs.readFileSync(path.resolve(ROOT_PATH, `${KEYS_ADDRESS}/keys.pub`));
    const keys = pub_key.toString().split(os.EOL);

    const peer = new UdpPeer(INIT_PUB_ADDRESS, keys.slice(1, keys.length-2).join(os.EOL) + os.EOL);

    // console.log(peer.net.mine.networks);

    // 自检
    try {
        rsa.decrypt(rsa.encrypt("self check", peer.pub_keys));
    } catch(err){
        end([ err, "启动自检失败, 请检查公私钥文件 ..." ], error);
    }

    const router = new Router();
    router.set("verify/apply_channel", apply_channel);
    router.set("rverify/verify_info", verify_info);

    // 准备期, 无视非验证类型的数据报

    // 解除 udp head verify 超时回调
    peer.use(cancel_verify_timeout("rverify"));

    // 检查: 禁止 向自己发送数据报 
    peer.use(prohibit_to_own(PORT));

    peer.use(router.route());

    // 未定义 action
    peer.use((peer, { head }, rinfo, next) => {
        next(Error(`无法识别的动作: ${head.name}`));
    });

    // 错误捕获
    peer.use((err, peer, data, rinfo, next) => {
        error("捕获异常: %s", err.toString());
    });

    peer.listening(PORT);

    // 申请加入网络
    peer.send_apply();
 
    
    
    // 进程异常
    (() => {
        const quit_process = (signal) => {
            process.on(signal, () => {
                if (peer.trust_list.size){
                    let tmp = {};
                    for (let [ key, value ] of peer.trust_list){
                        tmp[key] = value;
                    }
                    save_file(`peers/${PORT}.json`, tmp);
                }
                log("接收到信号: ", signal);
                process.exit(0);
            });
        };
        const signals = [ "SIGINT", "SIGTERM", "SIGHUP", "SIGBREAK" ];
        signals.forEach(s => {
            quit_process(s);
        });
    })();

}




