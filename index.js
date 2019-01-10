var tus = require('tus-node-server');
var request = require('request');

var getTimestamp = function () {
	var u = new Date();

	return u.getUTCFullYear() +
		'' + ('0' + u.getUTCMonth()).slice(-2) +
		'' + ('0' + u.getUTCDate()).slice(-2) +
		'_' + ('0' + u.getUTCHours()).slice(-2) +
		'' + ('0' + u.getUTCMinutes()).slice(-2) +
		'' + ('0' + u.getUTCSeconds()).slice(-2) +
		'' + (u.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5);
}

var parseMetadataString = function (metadata_string) {
	var kv_pair_list = metadata_string.split(',');

	return kv_pair_list.reduce(function(metadata, kv_pair) {
		var [key, base64_value] = kv_pair.split(' ');

		metadata[key] = {
			encoded: base64_value,
			decoded: Buffer.from(base64_value, 'base64').toString('ascii'),
		};

		return metadata;
	}, {});
};

var sendNotification = function (fn) {
	var param = {value1: fn, Value1: fn};
	request
	.get('https://maker.ifttt.com/trigger/file_uploaded/with/key/' + process.env.IFTTT_KEY, {body: param, json: true})
	.on('response', function(response) {
		console.log(response.statusCode, response.headers['content-type'])
	})
};

var fileNameFromUrl = function (req) {
	var metadata = parseMetadataString(req.headers["upload-metadata"]);
	var filename = ((metadata || {}).filename || {}).decoded;
	var ts_filename =  getTimestamp() + '_' + filename;
	sendNotification(ts_filename);
	console.log("File uploaded:", ts_filename);
	return ts_filename;
};

var server = new tus.Server();
server.datastore = new tus.FileStore({
	path: '/files',
	namingFunction: fileNameFromUrl
});

var express = require('express');
var app = express();
var uploadApp = express();
uploadApp.all('*', server.handle.bind(server));
app.use('/uploads', uploadApp);

app.use(express.static('public'));

var host = '127.0.0.1';
var port = process.env.PORT || 1080;
app.listen(port, host);
console.log(`Server started: ${host}:${port}`);