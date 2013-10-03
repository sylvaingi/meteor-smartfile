var FormData = Npm.require('form-data');

var SF_API_ENDPOINT = "app.smartfile.com";

SmartFile.setApiCredentials = function (key, password) {
    SmartFile.apiKey = key;
    SmartFile.apiPassword = password;
};

SmartFile.setBasePath = function (path) {
    SmartFile.basePath = path;
};

SmartFile.postDataToPath = function (fileName, path, data) {
    var form = new FormData();

    form.append('file', data, {
        filename: fileName
    });

    form.submit({
        protocol: "https:",
        host: SF_API_ENDPOINT,
        path: "/api/2/path/data/" + SmartFile.basePath + path,
        auth: SmartFile.apiKey + ":" + SmartFile.apiPassword
    }, function(err, res) {
        console.log(res.statusCode);
    });
};

Meteor.methods({
    "sm.upload": function (fileName, path, data) {
        SmartFile.postDataToPath(fileName, path, data);
    }
});