angular.module('lawnchair_factory', [])

.factory("LawnchairFactory", function($window, $log, $parse) {
  return function(name, config) {
    var collection = {};
    var array = [];
    var isArray = config && config.isArray;
    var idGetter = $parse((config && config.entryKey) ? config.entryKey : "id");
    var transformSave = (config && config.transformSave) ? config.transformSave : angular.identity;
    var transformLoad = (config && config.transformLoad) ? config.transformLoad : angular.identity;

    function getEntryId(entry){
      try {
          return idGetter(entry);
      } catch(e) {
          return null;
      }
    }

    function lawnchairBucket(callback) { return new Lawnchair({name:name}, callback); }

    function saveEntry(data,key) {
      key = key.toString();
      if(angular.isObject(data) && data !== collection[key]){
        collection[key] = collection[key] || {};
        angular.extend(collection[key], data);
      } else {
        collection[key] = data;
      }
      var update = {key:key, value:transformSave(collection[key])};

      try {
        lawnchairBucket(function() { this.save(update); });
      } catch(e) {
        if (e.name === "QUOTA_EXCEEDED_ERR" || e.name === "NS_ERROR_DOM_QUOTA_REACHED") {
          $window.localStorage.clear();
        }
        $log.info("LocalStorage Exception ==> " + e.message);
      }
    }

    function updateArray(data){
      array.length = 0;
      _.each(data,  function(o) { array.push(o); });
      return array;
    }

    function updateCache(obj,key) {
      if(obj && angular.isObject(obj) && collection[key] && collection[key] !== obj){
        angular.extend(collection[key], obj);
      } else {
        collection[key] = obj;
      }
    }

    function updateCacheFromStorage(cache, storage) {
      if(storage){
        if(angular.isObject(storage.value) && angular.isObject(cache)) {
          angular.extend(cache, transformLoad(storage.value));
        } else {
          cache = transformLoad(storage.value);
        }
        updateCache(cache, storage.key);
      }
      return cache;
    }

    function allAsCollection(callback){
      lawnchairBucket(function() {
        this.all(function(result) {
          angular.forEach(result, function(o) { updateCache(o.value, o.key); });
          if(callback){
            callback(collection);
          }
        });
      });
      return collection;
    }

    function allAsArray(callback){
      return updateArray(allAsCollection(function(data){
        updateArray(data);
        if(callback){
          callback(array);
        }
      }));
    }

    function removeEntry(key) {
      delete collection[key];
      lawnchairBucket(function() { this.remove(key); });
    }

    function getDefault(key) {
      if(collection[key]) {
        return collection[key];
      } else {
        var  d = {};
        idGetter.assign(d,key);
        return d;
      }
    }

    var lawnchair = {
      collection: collection,
      save: function(data, key, clear) {
        if(!data){
          data = collection; // if nothing is set save the current cache
          key = null;
        }

        if (angular.isArray(data)) {
          angular.forEach(data, function(e, index) { saveEntry(e, getEntryId(e) || index); }); // Save a Array
        } else if(key || (data && getEntryId(data))) {
          saveEntry(data, key || getEntryId(data)); // save one entry
        } else {
          angular.forEach(data, saveEntry); // save a collection
        }

        if(clear) {
            var newIds = angular.isArray(data) ? _.chain(data).map(getEntryId).map(String).value() : _.keys(data);
            _.chain(collection).keys().difference(newIds).each(removeEntry);
            // remove entries wihtout ids
          _.chain(collection).filter(function(entry){ return !getEntryId(entry); }).keys().each(removeEntry);
        }

        if(isArray){
          updateArray(collection);
        }
      },
      batch: function(keys, target, callback) {
        var cache = _.chain(keys).map(function(k){ return getDefault(k);}).value();
        if(target && angular.isArray(target)){
          target.length = 0;
          _.each(cache,  function(o) { target.push(o); });
        } else {
          target = cache;
        }

        lawnchairBucket(function() {
          this.get(keys, function(result) {
            if(result){
              for(var i = result.length - 1; i >= 0; i--){
                target[i] = updateCacheFromStorage(target[i], result[i]);
              }
            }
            if(callback){
              callback(target);
            }
          });
        });
        return target;
      },
      get: function(key, callback) {
        var value = getDefault(key);
        lawnchairBucket(function() {
          this.get(key, function(result) {
            if(result){
              value = updateCacheFromStorage(value, result);
            }
            if(callback){
              callback(value);
            }
          });
        });
        return value;
      },
      all: isArray ? allAsArray : allAsCollection,
      remove: removeEntry,
      nuke: function() {
        lawnchairBucket(function() { this.nuke(); });
      },
      destroy: function() {
        for (var key in collection){
          delete collection[key];
        }
        lawnchairBucket(function() { this.nuke(); });
      }
    };
    return lawnchair;
  };
});
