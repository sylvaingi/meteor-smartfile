Package.describe({
  summary: 'SmartFile.com for Meteor'
});

Package.on_use(function (api) {
  api.use([
    'meteor',
    'livedata'
  ], ['client', 'server']);

  Npm.depends({'form-data': '0.1.2'});

  api.add_files('client.js', 'client');
  api.add_files('server.js', 'server');

  api.export('SmartFile', ['client', 'server']);
});
