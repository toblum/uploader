const tus = require('tus-node-server');

const getTimestamp = () => {
	var u = new Date();

	return u.getUTCFullYear() +
		'' + ('0' + u.getUTCMonth()).slice(-2) +
		'' + ('0' + u.getUTCDate()).slice(-2) +
		'_' + ('0' + u.getUTCHours()).slice(-2) +
		'' + ('0' + u.getUTCMinutes()).slice(-2) +
		'' + ('0' + u.getUTCSeconds()).slice(-2) +
		'' + (u.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5);
}

const parseMetadataString = (metadata_string) => {
	const kv_pair_list = metadata_string.split(',');

	return kv_pair_list.reduce((metadata, kv_pair) => {
		const [key, base64_value] = kv_pair.split(' ');

		metadata[key] = {
			encoded: base64_value,
			decoded: Buffer.from(base64_value, 'base64').toString('ascii'),
		};

		return metadata;
	}, {});
};

const fileNameFromUrl = (req) => {
	const metadata = parseMetadataString(req.headers["upload-metadata"]);
	const filename = ((metadata || {}).filename || {}).decoded;
	console.log("File uploaded:", filename);
	return getTimestamp() + '_' + filename;
};

const server = new tus.Server();
server.datastore = new tus.FileStore({
	path: '/files',
	namingFunction: fileNameFromUrl
});

const express = require('express');
const app = express();
const uploadApp = express();
uploadApp.all('*', server.handle.bind(server));
app.use('/uploads', uploadApp);

app.use(express.static('public'));

const host = '127.0.0.1';
const port = process.env.PORT || 1080;
app.listen(port, host);
console.log(`Server started: ${host}:${port}`);