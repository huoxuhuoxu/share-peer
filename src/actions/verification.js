/**
 * @description
 *  认证
 * 
 * @method
 *      apply_channel   申请建立通道      
 *      verify_info     核对发送源是否真实有效
 *  
 */

const {
    outputs: { log, warn },
    encryption: { rsa }
} = require("../lib");
 
exports.apply_channel = (peer, { ct, pub_key, is_pub }, { address, port }) => {
    const resul = rsa.publicDecrypt(ct, pub_key);
    const origin = `${address}:${port}`;

    if (Date.now() - resul < 10000){
        peer.trust_peers = {
            pub_key,
            address,
            port,
            is_pub
        };

        peer.verify_info(ct, address, port);
        return log(`验证通过: ${origin}`);
    }

    warn(`无效通信, 来源: ${origin}`);
};

exports.verify_info = (peer, { origin_ct, ct, pub_key, is_pub }, { address, port }) => {
    const resul = rsa.publicDecrypt(origin_ct);
    const origin = `${address}:${port}`;

    if (Date.now() - resul < 10000){
        rsa.publicDecrypt(ct, pub_key);

        peer.trust_peers = {
            pub_key,
            address,
            port,
            is_pub
        };

        return log(`核对通过: ${origin}`);
    }

    warn(`无效通信, 来源: ${origin}`);
};




