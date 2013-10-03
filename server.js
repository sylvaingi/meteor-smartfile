SmartFile = {}

var FormData = Npm.require('form-data');
var formDataSubmitSync = Meteor._wrapAsync(FormData.prototype.submit);

var SF_API_ENDPOINT = "app.smartfile.com";
var SF_API_PATH = "/api/2/";

SmartFile.setApiCredentials = function (key, password) {
    SmartFile.apiKey = key;
    SmartFile.apiPassword = password;
};

SmartFile.setBasePath = function (path) {
    SmartFile.basePath = path;
};

SmartFile.postDataToPath = function (fileName, path, data) {
    var form = new FormData();

    form.append('file', new Buffer(data), {
        filename: fileName
    });

    var res = formDataSubmitSync.call(form, {
        protocol: "https:",
        host: SF_API_ENDPOINT,
        path: SF_API_PATH + "path/data/" + SmartFile.basePath + path,
        auth: SmartFile.apiKey + ":" + SmartFile.apiPassword
    });

    return res.statusCode == 200;
};

Meteor.methods({
    "sm.upload": function (fileName, path, data) {
        try {
            var success = SmartFile.postDataToPath(fileName, path, data);

            if (!success) {
                throw new Error();
            }

            var sfPath = SF_API_ENDPOINT + SF_API_PATH + "path/data/" + SmartFile.basePath + "/" + fileName;
            console.log("Stored file in SmartFile to path: " + sfPath);

            return sfPath;
        } catch (e) {
            console.log(e);
            throw new Meteor.Error(500, "SmartFile API error");
        }
    }
});