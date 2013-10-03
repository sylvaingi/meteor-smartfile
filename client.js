SmartFile.upload = function (file, path, callback) {
    var fileReader = new FileReader();

    fileReader.onload = function(e) {
        Meteor.call('sm.upload', file.name, path, new Uint8Array(e.target.result), callback);
    };

    fileReader.readAsArrayBuffer(file);
};