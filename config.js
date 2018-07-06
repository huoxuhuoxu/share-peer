
const config = {
    KEYS_ADDRESS: ".keys",
    PORT: 34001,
    INIT_PUB_ADDRESS: "120.26.94.5:34001"
};


const debug = Object.create(null);
debug["1"] = Object.assign({}, config, {
    PORT: 40001,
    INIT_PUB_ADDRESS: "127.0.0.1:40002"
});
debug["2"] =  Object.assign({}, config, {
    PORT: 40002,
    INIT_PUB_ADDRESS: "127.0.0.1:40001"
});



module.exports = (() => {
    if (process.env.DEBUG){
        const DEBUG = process.env.DEBUG;
        if (DEBUG in debug) return debug[DEBUG];
    }   
    return config;
})();

