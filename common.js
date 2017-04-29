SmartFileBase = () => {
}

SmartFileBase.defaultId = "__default";

SmartFileBase.prototype.resolvePublic = function (path) {
    if (!this.config.publicRootUrl) {
        throw new Error("No publicRootUrl configured");
    }

    return this.config.publicRootUrl + "/" + path;
};