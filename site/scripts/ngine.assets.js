// Ngine assets and asset loading
// Mikey Micheletti
// Version 0.1
// relies on ngine.js, jquery.js, underscore.js
// Builds on work by Pascal Rettig and Tom O'Connor, thank you!

'use strict';

var Ngine = Ngine || { };

// Assets stored by this Ngine
Ngine.assets = { };

// Preload queue of assets to be loaded on demand
Ngine.preloadQueue = [ ];

// Asset types supported by the Ngine
Ngine.assetTypes = {
  // Image Assets
  png: 'Image', jpg: 'Image', gif: 'Image', jpeg: 'Image',
  // Audio Assets
  ogg: 'Audio', wav: 'Audio', m4a: 'Audio', mp3: 'Audio',
  // Other Assets
  json: 'Other'
};

// Audio mime types supported by the Ngine, with keys to asset types
Ngine.audioMimeTypes = { mp3: 'audio/mpeg',
  ogg: 'audio/ogg; codecs="vorbis"',
  m4a: 'audio/m4a',
  wav: 'audio/wav'
};

// Returns the Ngine asset type of the supplied asset file
// based on the asset's file extension.
Ngine.assetType = function(asset) {
  var fileExt = _(asset.split(".")).last().toLowerCase();
  return Ngine.assetTypes[fileExt] || 'Other';
};

// Removes the extension from the supplied filename and returns it
Ngine.removeFileExtension = function(filename) {
  return filename.replace(/\.(\w{3,4})$/,"");
};

// Loads an image file as an asset and associates it with the supplied key via the
// onLoadCallback function when successful. If the image asset loading fails for some
// reason the onErrorCallback function will be called.
Ngine.prototype.loadAssetImage = function(key, src, onLoadCallback, onErrorCallback) {
  if (this.options.debug) {
    console.log('  loadImageAsset key:' + key + ', src: ' + src);
  }
  var img = new Image();
  $(img).on('load', function() { onLoadCallback(key, img); });
  $(img).on('error', onErrorCallback);
  img.src = this.options.imagePath + src;
};

// Loads an audio asset and returns an Audio element when successful.
// This function also associates the created audio element with the supplied key via the
// onLoadCallback function. If the browser is unable to play sounds or some other problem
// occurs then onErrorCallback is called. Note that the audio asset referenced by 'key' may
// be null in some cases.
Ngine.prototype.loadAssetAudio = function(key, src, onLoadCallback, onErrorCallback){
  var snd,
      basename,
      extension;

  if (this.options.debug) {
    console.log('  loadAudioAsset key:' + key + ', src: ' + src);
  }

  // if no audio support, associate null with the supplied key and return
  if (!document.createElement('audio').play || !this.options.sound) {
    onLoadCallback(key, null);
    return;
  }

  // Audio is supported, so prepare to load the audio asset
  snd = new Audio();
  basename = Ngine.removeFileExtension(src);

  // look for a supported audio type
  extension = _(this.options.audioSupported)
    .detect(function(extension) {
      return snd.canPlayType(Ngine.audioMimeTypes[extension] ? extension : null);
    });

  // if the extension is not supported, associate null with the supplied key and return
  if (!extension) {
    onLoadCallback(key, null);
    return;
  }

  // if the sound is off or there are other problems, call the error callback
  $(snd).on('error', onErrorCallback);

  // if the sound is loadable, call the success callback and setup the audio asset
  $(snd).on('canplaythrough', function() {
    onLoadCallback(key, snd);
  });
  snd.src = this.options.audioPath + baseName + '.' + extension;
  snd.load();
  return snd;
};

// Loads a non-audio, non-image asset using jQuery's get call, storing the data retrieved.
Ngine.prototype.loadAssetOther = function(key, src, onLoadCallback, onErrorCallback) {
  if (this.options.debug) {
    console.log('  loadOtherAsset key:' + key + ', src: ' + src);
  }
  $.get(this.options.dataPath + src, function(data) {
    onLoadCallback(key, data);
  }).fail(onErrorCallback);
};

// Gets an Ngine asset by name.
Ngine.prototype.getAsset = function(name) {
  if (this.assets === undefined && Ngine.options.debug) {
    console.error('Error looking for asset by name: ' + name);
    return;
  }
  return this.assets[name];
};

// Load a list of assets from the supplied assetList, which can be a string or array of
// asset filenames to load. The onFinishedCallback will be called once all assets have loaded.
// To mark progress or errors, add Ngine.options.onProgressCallback and Ngine.options.onErrorCallback.
Ngine.prototype.load = function(assetList, onFinishedCallback, options) {
  var that = this, // this Ngine
      options = that.options || { },  // Ngine options
      progressCallback = options.progressCallback, // called when an asset is loaded, optional
      errors = false, // set to true if an error loading an asset occurs
      errorCallback, // called when an asset load fails, optional, defined below
      assetObject, // local object containing assets to load in a predictable format
      totalAssetCount, // count of all assets to load
      remainingAssetCount, // count of all assets left to load
      assetLoadedCallback; // called when an asset is loaded

  // If we have an error loading an asset, report appropriately
  // Use an onErrorCallback written into Ngine.options if one exists
  errorCallback = function(itemName) {
    errors = true;
    (options.onErrorCallback || function(itemName) {
      if (that.options.debug) {
        console.error('Error loading asset: ' + itemName);
      }
    })(itemName);
  };

  // Place the supplied assetList argument into a local object.
  // If an array was supplied, it will be converted to a hash with lookups by filename.
  // if a string was supplied, it will be turned into an object. Otherwise, use as-is.
  assetObject = { };
  if (_.isArray(assetList)) {
    _.each(assetList, function(itemName) {
      if (_.isObject(itemName)) {
        _.extend(assetObject, itemName);
      } else {
        assetObject[itemName] = itemName;
      }
    });
  } else if (_.isString(assetList)) {
    assetObject[assetList] = assetList;
  } else {
    assetObject = assetList;
  }

  // Initialize our running tally...
  totalAssetCount = remainingAssetCount = _(assetObject).keys().length;

  // Called whenever an asset is successfully loaded.
  // Interior function, within a closure.
  assetLoadedCallback = function(key, obj) {
    if (errors) { return; }

    // add the object to the Ngine's assets and decrement our remaining assets count
    Ngine.assets[key] = obj;
    remainingAssetCount -= 1;

    if (that.options.debug) {
      console.log('  ' + key + ' was loaded successfully');
    }

    // if keeping track of progress, update now
    if (progressCallback) {
      progressCallback(totalAssetCount - remainingAssetCount, totalAssetCount);
    }

    // when through loading assets, call our finished callback if we have one
    if (remainingAssetCount === 0 && onFinishedCallback) {
      onFinishedCallback.apply(that);
    }
  };

  // Load each asset now
  _.each(assetObject, function(itemName, key) {
    var assetType = Ngine.assetType(itemName);

    // If we've already loaded the asset, just call the callback, otherwise load the
    // asset using the Ngine's loader function appropriate for the asset's type.
    if (Ngine.assets[key]) {
      assetLoadedCallback(key, that.assets[key]);
    } else {
      that['loadAsset' + assetType](key, itemName, assetLoadedCallback, function() {
        errorCallback(itemName);
      });
    }
  });
};

// Adds assets we wish to load to the Ngine's preload queue.
Ngine.prototype.preload = function(assetList) {
  Ngine.preloadQueue = Ngine.preloadQueue.concat(assetList);
}