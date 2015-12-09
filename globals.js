var url = "www.softcloud.com.sa";
var port = 8443;

module.exports = {
	linkWithPort : function(){ return port === 443 ? url : url + ':' + port; }(), 
        link:url,
	port:port
};
