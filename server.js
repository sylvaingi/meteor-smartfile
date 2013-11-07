var Future = Npm.require('fibers/future');
var FormData = Npm.require('form-data');

var SF_API_ENDPOINT = "app.smartfile.com";
var SF_API_PATH = "/api/2";
var SF_API_URL = "https://" + SF_API_ENDPOINT + SF_API_PATH;

var instancesById = {};

function SmartFileServer (params) {
    this.id = params.id || SmartFileBase.defaultId;

    this.config = {};
    this.config.basePath = "";
    
    this.configure(params);

    instancesById[this.id] = this;
}

SmartFile = SmartFileServer;

_.extend(SmartFileServer.prototype, SmartFileBase.prototype);

SmartFileServer.prototype.configure = function (params) {
    params = _.pick(params, "key", "password", "basePath", "publicRootUrl");
    _.extend(this.config, params);
};

SmartFileServer.prototype._getApiAuthString = function () {
    var key = this.config.key;
    var password = this.config.password;

    if (!_.isString(key) || !_.isString(password) ||
            key.length === 0 || password.length === 0) {
        throw new Error("SmartFile key/password is invalid");
    }
    
    return key + ":" + password;
};

// FS methods
SmartFileServer.prototype.resolve = function (path) {
    return this.config.basePath + "/" + path;
}

SmartFileServer.prototype.mkdir = function (path) {
    var url = SF_API_URL + "/path/oper/mkdir/";

    try {
        var result = HTTP.post(url, {
            auth: this._getApiAuthString(),
            data: {path: this.resolve(path)}
        });
        return result.data;
    } catch (e){
        throw makeSFError(e);
    }
};

SmartFileServer.prototype.ls = function (path) {
    var url = SF_API_URL + "/path/info/" + this.resolve(path) + "?children=true";
    try {
        var result = HTTP.get(url, {
            auth: this._getApiAuthString()
        });
        return result.data;
    } catch (e){
        throw makeSFError(e);
    }
};

SmartFileServer.prototype.rm = function (paths) {
    var that = this;

    if (!Array.isArray(paths)) {
        paths = [paths];
    }

    var content = paths.map(function(path){
        return "path=" + encodeString(that.resolve(path));
    }).join("&");
    content = encodeContent(content);

    var url = SF_API_URL + "/path/oper/remove/";
    
    try {
        var result = HTTP.post(url, {
            auth: this._getApiAuthString(),
            content: content,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });
        return result.data;
    } catch (e){
        throw makeSFError(e);
    }
};

SmartFileServer.prototype.save = function (data, options) {
    var path = options.path || "";
    var fileName = options.fileName || "upload-" + Date.now();

    var form = new FormData();
    form.append("file", data, {
        filename: fileName
    });

    var uploadPath = SF_API_PATH + "/path/data/" + this.resolve(path);

    var f1 = new Future();
    form.submit({
        protocol: "https:",
        host: SF_API_ENDPOINT,
        path: uploadPath,
        auth: this._getApiAuthString()
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

// Default callbacks
SmartFileServer.prototype.onIncomingFile = SmartFileServer.prototype.save;

SmartFileServer.prototype.allow = function () { return true; };

SmartFileServer.prototype.onUpload = function () { };
SmartFileServer.prototype.onUploadFail = function () { };


Meteor.methods({
    "sm.upload": function (data, options) {
        var sfInstance = instancesById[options.id];
        if (!sfInstance) {
            throw new Meteor.Error(400, "Unknown SmartFile instance id");
        }

        var allowed = sfInstance.allow.call(this, options);
        if (!allowed) {
            throw new Meteor.Error(403, "Upload not allowed");
        }

        try {
            var result = sfInstance.onIncomingFile(new Buffer(data), options);
            sfInstance.onUpload.call(this, result, options);

            //Return relative path to the client for potential resolvePublic() call
            return encodeString(options.path) + "/" + encodeString(options.fileName);
        } catch (e) {
            //Handle only SF related errors
            if (e.statusCode) {
                sfInstance.onUploadFail.call(this, e, options);
                throw new Meteor.Error(500, e.message);
            }
            else {
                throw e;
            }
        }
    }
});


function makeSFError (e) {
    var response = e.response;
    if (!response) {
        return e;
    }

    var error = new Error("SmartFile API returned status code " + response.statusCode);
    error.statusCode = response.statusCode;

    var detail = typeof response.data === "object" ? response.data.detail : null;
    error.detail = detail;
    return error;
}

// extracted from HTTP package
function encodeContent(params) {
    return params.replace(/%20/g, '+');
}

function encodeString (str) {
    return encodeURIComponent(str).replace(/[!'()]/g, escape).replace(/\*/g, "%2A");
}

