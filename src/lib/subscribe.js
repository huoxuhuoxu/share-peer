/**
 * @description
 *  订阅分发器
 * 
 * 
 * @class Subscribe
 * 
 *  @method
 *      add             订阅某事件
 *      dispatch        分发某事件
 *      delete          删除某事件
 *      size            现存事件个数
 * 
 */


const { warn } = require("./outputs");

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

    delete (event_name){
        if (this.__subscribe.has(event_name)){
            this.__subscribe.delete(event_name);
        } else {
            warn("no subscription", event_name);
        }
    }

    get size (){
        return this.__subscribe.size;
    }

}

module.exports = Subscribe;
