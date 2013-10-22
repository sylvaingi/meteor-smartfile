SmartFile = {};

SmartFile.setBasePath = function (path, publicUrl) {
    SmartFile.basePath = path;
    SmartFile.basePublicUrl = publicUrl;
};


SmartFile.resolvePublic = function (path) {
    return SmartFile.basePublicUrl + "/" + path;
};