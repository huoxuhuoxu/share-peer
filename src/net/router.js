/**
 * @description
 *      路由处理
 * 
 */



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

    __start (peer, udp_data, rinfo, next){
        const { head, body } = udp_data;
        const action = this.actions.get(head.action);
        if (action){
            action.cb(peer, body, rinfo, next);
        } else {
            next();
        }
    }

} 


module.exports = Router;
