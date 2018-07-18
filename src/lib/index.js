
const tools = require("./tools");

if (tools.exists_keys()){
    
    module.exports = {
        outputs:    require("./outputs"),
        encryption: require("./encryption"),
        tools
    };

} else {

    module.exports = {
        outputs:    require("./outputs"),
        tools
    };

}

