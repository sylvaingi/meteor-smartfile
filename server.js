var Future = Npm.require('fibers/future');
var FormData = Npm.require('form-data');

var SF_API_ENDPOINT = "app.smartfile.com";
var SF_API_PATH = "/api/2";
var SF_API_URL = "https://" + SF_API_ENDPOINT + SF_API_PATH;

var apiAuthString;
var basePath;

SmartFile.configure = function (params) {
    if (params.key && params.password) {
        apiAuthString = params.key + ":" + params.password;
    }

    basePath = params.basePath || basePath || "";
    SmartFile.publicRootUrl = params.publicRootUrl || SmartFile.publicRootUrl;
};

Meteor.startup(function () {
    if (!apiAuthString) {
        console.log("Warning, SmartFile package is not configured");
    }
});

SmartFile.allow = function () { return true; };

SmartFile.onUpload = function () { };
SmartFile.onUploadFail = function () { };

SmartFile.mkdir = function (path) {
    try {
        var url = SF_API_URL + "/path/oper/mkdir/";

        var result = HTTP.post(url, {
            auth: apiAuthString,
            data: {path: resolvePath(path)}
        });

        return result.data;
    } catch (e){
        throw makeSFError(e.response);
    }
};

SmartFile.ls = function (path) {
    try {
        var url = SF_API_URL + "/path/info/" + resolvePath(path) + "?children=true";

        var result = HTTP.get(url, {
            auth: apiAuthString
        });

        return result.data;
    } catch (e){
        throw makeSFError(e.response);
    }
};

SmartFile.rm = function (paths) {
    try {
        if (!Array.isArray(paths)) {
            paths = [paths];
        }

        var content = paths.map(function(path){
            return "path=" + encodeString(resolvePath(path));
        }).join("&");
        content = encodeContent(content);

        var url = SF_API_URL + "/path/oper/remove/";

        var result = HTTP.post(url, {
            auth: apiAuthString,
            content: content,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        return result.data;
    } catch (e){
        throw makeSFError(e.response);
    }
};

SmartFile.save = function (data, options) {
    var path = options.path || "";
    var fileName = options.fileName || "upload-" + Date.now();

    var form = new FormData();
    form.append("file", data, {
        filename: fileName
    });

    var uploadPath = SF_API_PATH + "/path/data/" + resolvePath(path);

    var f1 = new Future();
    form.submit({
        protocol: "https:",
        host: SF_API_ENDPOINT,
        path: uploadPath,
        auth: apiAuthString
    }, f1.resolver());
    f1.wait();

    var res = f1.get();

    var f2 = new Future();
    res.on("data", function(data) {
        f2.return(JSON.parse(data));
    });
    f2.wait();

    var resBody = f2.get();

    if (res.statusCode !== 200) {
        throw makeSFError({statusCode: res.statusCode, data: resBody});
    }

    return resBody;
};

SmartFile.onIncomingFile = function (data, options) {
    return SmartFile.save(data, options);
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

            //Return relative path to the client for potential resolvePublic() call
            return options.path + "/" + options.fileName;
        } catch (e) {
            //Handle only SF related errors
            if (e.statusCode) {
                SmartFile.onUploadFail.call(this, e, options);
                throw new Meteor.Error(500, e.message);
            }
            else {
                throw e;
            }
        }
    }
});

function makeSFError (response) {
    var error = new Error("SmartFile API returned status code " + response.statusCode);
    error.statusCode = response.statusCode;

    var detail = typeof response.data === "object" ? response.data.detail : null;
    error.detail = detail;
    return error;
}

function resolvePath (path) {
    return basePath + "/" + path;
}

// extracted from HTTP package
function encodeContent(params) {
    return params.replace(/%20/g, '+');
}

function encodeString (str) {
  return encodeURIComponent(str).replace(/[!'()]/g, escape).replace(/\*/g, "%2A");
}
