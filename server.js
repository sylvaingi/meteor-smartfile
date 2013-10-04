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

SmartFile.allow = function(){ return true; };

SmartFile.onUpload = function(){ };
SmartFile.onUploadFail = function(){ };

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

    var returnValue = {
        statusCode: res.statusCode
    };

    if (returnValue.statusCode === 200) {
        returnValue.publicPath = SmartFile.basePublicUrl + "/" + path + "/" + fileName;
    }

    return returnValue;
};

Meteor.methods({
    "sm.upload": function (data, options) {
        var path = options.path || "";
        var fileName = options.fileName || "upload-" + Date.now();

        var allowed = SmartFile.allow.call(this, options);

        if (!allowed) {
            throw new Meteor.Error(403, "Upload not allowed");
        }

        var result = SmartFile.postDataToPath(fileName, path, data);

        if (result.statusCode !== 200) {
            SmartFile.onUploadFail.call(this, result, options);
            throw new Meteor.Error(500, "SmartFile API error, status code " + result.statusCode);
        }

        SmartFile.onUpload.call(this, result, options);

        return result.publicPath;
    }
});