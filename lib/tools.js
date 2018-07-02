
const { info } = require("./outputs");

exports.end = (a_msg, fn_output = info, b_exit = true) => {
    if (Object.prototype.toString.call(a_msg) !== "[object Array]"){
        a_msg = [ a_msg ];
    }
    a_msg.unshift("");
    a_msg.forEach( s => fn_output(s) );
    b_exit && process.exit(0);
};

