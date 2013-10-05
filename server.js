var FormData = Npm.require('form-data');
var formDataSubmitSync = Meteor._wrapAsync(FormData.prototype.submit);

var SF_API_ENDPOINT = "app.smartfile.com";
var SF_API_PATH = "/api/2/";

function makeSFError (statusCode) {
    var error = new Error("SmartFile API returned status code " + statusCode);
    error.statusCode = statusCode;
    return error;
}

SmartFile.setApiCredentials = function (key, password) {
    SmartFile.apiKey = key;
    SmartFile.apiPassword = password;

    SmartFile.apiAuthString = key + ":" + password;
};

SmartFile.allow = function(){ return true; };

SmartFile.onUpload = function(){ };
SmartFile.onUploadFail = function(){ };

SmartFile.mkdir = function (path) {
    try {
        var url = "https://" + SF_API_ENDPOINT + SF_API_PATH + "/path/oper/mkdir/";

        HTTP.post(url, {
            auth: SmartFile.apiAuthString,
            data: {path: SmartFile.basePath + "/" + path}
        });
    } catch (e){
        throw makeSFError(e.response.statusCode);
    }
};

SmartFile.upload = function (data, options) {
    var path = options.path || "";
    var fileName = options.fileName || "upload-" + Date.now();

    var form = new FormData();
    form.append("file", data, {
        filename: fileName
    });

    var uploadPath = SF_API_PATH + "path/data/" + SmartFile.basePath + "/" + path;

    var res = formDataSubmitSync.call(form, {
        protocol: "https:",
        host: SF_API_ENDPOINT,
        path: uploadPath,
        auth: SmartFile.apiAuthString
    });

    if (res.statusCode !== 200) {
        throw makeSFError(res.statusCode);
    }

    var returnValue = {};
    returnValue.statusCode = res.statusCode;
    returnValue.path = path + "/" + fileName;
    returnValue.publicPath = SmartFile.basePublicUrl + "/" + returnValue.path;

    return returnValue;
};

SmartFile.onIncomingFile = function (data, options) {
    return SmartFile.upload(data, options);
};

Meteor.methods({
    "sm.upload": function (data, options) {
        var allowed = SmartFile.allow.call(this, options);

        if (!allowed) {
            throw new Meteor.Error(403, "Upload not allowed");
        }

        try {
            var result = SmartFile.onIncomingFile(new Buffer(data), options);
            SmartFile.onUpload.call(this, result, options);
            return result;
        } catch (e){
            SmartFile.onUploadFail.call(this, result, options);
            throw new Meteor.Error(500, e.message);
        }
    }
});