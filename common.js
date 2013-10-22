SmartFile = {};

SmartFile.resolvePublic = function (path) {
    if (!SmartFile.publicRootUrl) {
        throw new Error("No publicRootUrl defined via configure()");
    }

    return SmartFile.publicRootUrl + "/" + path;
};