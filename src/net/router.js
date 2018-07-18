/**
 * @description
 *      路由处理
 * 
 */

const { 
    outputs: { warn } 
} = require("../lib");

const data_normalization = (udp_data) => {
    const data = JSON.parse(udp_data.toString());
    return data;
};

class Router {

    constructor (){

        this.actions = new Map();

    }

    set (s_action_name, fn_action_handle){
        this.actions.set(s_action_name, {
            cb: fn_action_handle
        });
    }

    route (){
        return this.__start.bind(this);
    }

    __start (app, udp_data, rinfo){
        const data = data_normalization(udp_data);
        const action = this.actions.get(data.name);
        if (action)
            action.cb(app, data, rinfo);
        else
            warn("无法识别的动作: ", data.name);
    }

} 


module.exports = Router;
