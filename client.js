function SmartFileClient (params) {
    this.id = params.id || SmartFileBase.defaultId;
    this.config = {};
    this.configure(params);
}

SmartFile = SmartFileClient;

_.extend(SmartFileClient.prototype, SmartFileBase.prototype);

SmartFileClient.prototype.configure = function (params) {
    params = _.pick(params, "publicRootUrl");
    _.extend(this.config, params);
};

SmartFileClient.prototype.upload = function (file, options, callback) {
    if (!file) {
        throw new Error("You must pass a File object as first arg");
    }

    if (typeof options === "function") {
        callback = options;
        options = null;
    }

    var params = options || {};

    //Allow user to force upload filename
    if (!params.fileName) {
        params.fileName = file.name;
    }

    params.id = this.id;

    var fileReader = new FileReader();

    fileReader.onload = function(e) {
        Meteor.call("sm.upload", new Uint8Array(e.target.result), params, callback);
    };

    fileReader.readAsArrayBuffer(file);
};
