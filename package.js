Package.describe({
  summary: 'SmartFile.com for Meteor'
});

Package.on_use(api => {
  api.use([
    'meteor',
    'livedata',
    'http',
    'underscore'
  ], ['client', 'server']);

  Npm.depends({'form-data': '0.1.2'});

  api.add_files('common.js', ['server', 'client']);
  api.add_files('client.js', 'client');
  api.add_files('server.js', 'server');

  api.export('SmartFile', ['client', 'server']);
});
