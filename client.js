SmartFile.upload = function (file, options, callback) {
    if (typeof options === "function") {
        callback = options;
        options = null;
    }

    var params = options || {};

    //Allow user to force upload filename
    if (!params.fileName) {
        params.fileName = file.name;
    }

    var fileReader = new FileReader();

    fileReader.onload = function(e) {
        Meteor.call('sm.upload', new Uint8Array(e.target.result), params, callback);
    };

    fileReader.readAsArrayBuffer(file);
};
