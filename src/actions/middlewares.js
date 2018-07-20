/**
 * @description
 *  中间件
 * 
 * @method
 *  prohibit_to_own         禁止向本地发送数据报
 *  cancel_verify_timeout   取消 udp head verify 超时
 *   
 * 
 */

module.exports.prohibit_to_own = ( PORT ) => {
    return (peer, { body: { is_pub } }, { address, port }, next) => {

        let b = false;
        port = +port;
    
        if (is_pub){
            for (let network of peer.net.mine.networks){
                if (address === network["address"] && port === PORT){
                    b = true;
                    break;
                }
            }
        } else {
            if ((address === "127.0.0.1" && port === PORT)) b = true;
        }
    
        if (b) next(Error("You can't send data to yourself"));
        else next();
    };
}; 


module.exports.cancel_verify_timeout = (udp_head_type) => {
    return (peer, { head: { type, action } }, { address, port }, next) => {

        if (type === udp_head_type){
            peer.verifySub.dispatch(`${address}:${port}-${type}/${action}`);
        }
        next();
    
    };
}; 

