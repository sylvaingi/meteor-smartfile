SmartFile = {}

var FormData = Npm.require('form-data');
var formDataSubmitSync = Meteor._wrapAsync(FormData.prototype.submit);

var SF_API_ENDPOINT = "app.smartfile.com";
var SF_API_PATH = "/api/2/";

SmartFile.setApiCredentials = function (key, password) {
    SmartFile.apiKey = key;
    SmartFile.apiPassword = password;
};

SmartFile.setBasePath = function (path, publicUrl) {
    SmartFile.basePath = path;
    SmartFile.basePublicUrl = publicUrl;
};

SmartFile.postDataToPath = function (fileName, path, data) {
    var form = new FormData();

    form.append('file', new Buffer(data), {
        filename: fileName
    });

    var uploadPath = SF_API_PATH + "path/data/" + SmartFile.basePath + "/" + path;

    var res = formDataSubmitSync.call(form, {
        protocol: "https:",
        host: SF_API_ENDPOINT,
        path: uploadPath,
        auth: SmartFile.apiKey + ":" + SmartFile.apiPassword
    });

    return {
        statusCode: res.statusCode,
        publicPath: SmartFile.basePublicUrl + "/" + path + "/" + fileName
    };
};

Meteor.methods({
    "sm.upload": function (fileName, path, data) {
        try {
            var result = SmartFile.postDataToPath(fileName, path, data);

            if (result.statusCode !== 200) {
                throw new Error();
            }

            console.log("Stored file in SmartFile to path: " + result.publicPath);

            return result.publicPath;
        } catch (e) {
            throw new Meteor.Error(500, "SmartFile API error, status code " + result.statusCode);
        }
    }
});