# meteor-smartfile

Dead simple file uploads for Meteor backed by SmartFile file hosting platform (https://www.smartfile.com/developers/)

## Installation

meteor-smartfile can be installed with [Meteorite](https://github.com/oortcloud/meteorite/).
From inside a Meteorite-managed app:

```sh
$ mrt add smartfile
```

## API

### Configuration

Prior to using this package, you must be have a free SmartFile Developers account (signup [here](https://app.smartfile.com/dev/signup/)).

#### Server configuration

Configuration is achieved through the configure method:

```js
SmartFile.configure({
    key: "SmartFile API key",
    password: "SmartFile API password",
    basePath: "uploads",
    publicRootUrl: "https://file.ac/XXXXXXX/"
});
```
**basePath** is optional and defines the root directory on SmartFile the package will use for read and write operations. If undefined, the root directory on SmartFile will be used.

**publicRootUrl** is optional, if defined it must correspond to a `https://file.ac/XXXXXXX/` URL of a SmartFile link pointing to your *basePath*. Links are useful for public access (i.e. the browser fetching uploaded files on SmartFile), they can be created through the [UI](https://app.smartfile.com) or via the REST API.


#### Client configuration

Client side configuration is identical to the server, but only the **publicRootUrl** field is processed.


### Client API

```js
SmartFile.upload(file, {
    fileName: "myupload.jpg", //optional, overrides file.name
    path: "uploads" //optional, path of storage of the upload relative to basePath
}, function (err, res){
    if (err) {
        console.log("upload failed", err);
        return;
    }

    // Log the public URL of the upload
    console.log("Upload public URL:" + SmartFile.resolvePublic(res.path));
});
```

### Server API

#### Callbacks

```js
// Used to validate upload, options is the 2nd argument of the SmartFile.upload client call
// If it returns false, the upload will be halted and a Meteor.Error with status 403 will be thrown
SmartFile.allow = function (options) {
    return options.path === "uploads";
};

// Callbacks for upload success or failure, result contains statusCode returned by SmartFile API and path corresponding to the upload
SmartFile.onUpload = function (result, options) {
    console.log("File uploaded to " + result.path);
};

SmartFile.onUploadFail = function (result, options) {
    console.log("SmartFile returned error code " + result.statusCode);
};
```

#### Utilities

```js
// Creates the uploads/images directory if it does not exist, throws an error otherwise
SmartFile.mkdir("uploads/images");

// Lists the files within the uploads directory
SmartFile.ls("uploads");
```

#### Advanced

Internally, meteor-smartfile defines a Meteor method calling `SmartFile.onIncomingFile(data, options)` after the SmartFile.allow() callback validates the upload.

The default implementation is:
```js
SmartFile.onIncomingFile = function (data, options) {
    // upload the Buffer data to SmartFile
    SmartFile.save(data, options);
}
```

It can be overriden in order to tweak the upload contents, as the data parameter is a Node.js Buffer instance. A real-world usage would be resizing an image in 3 sizes and upload them to SmartFile via 3 calls to `SmartFile.save()`.

## License

MIT