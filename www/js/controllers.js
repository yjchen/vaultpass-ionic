var initial_data = [
  {
   domain: 'Google',
   password_choice: 'password_choice_30'
  },
  {
   domain: 'Facebook',
   password_choice: 'password_choice_16'
  }
];

var database_name = 'vaultpass-ionic-database-1';

angular.module('vaultpass.controllers', ['lawnchair_factory'])

.controller('AppCtrl', function($scope, $window, LawnchairFactory, $ionicPopup) {
  lawnchair = LawnchairFactory(database_name, {isArray: true, entryKey: 'domain'});

  if (lawnchair.all().length == 0) {
    lawnchair.save(initial_data);
  }

  function loadFromDatabase() {
    $scope.items = angular.copy(lawnchair.all());
  }

  function saveToDatabase() {
    new_collection = angular.copy($scope.items);
    _.chain(new_collection).map(function(k) {
      delete k["$$hashKey"]
      return k;
    }).value();
    lawnchair.save(new_collection, null, true);
    // Reload again ?
  }

  loadFromDatabase();

  $scope.selectDomain = function(data) {
    $scope.$broadcast('vaultDomainSelected', data);
  };

  $scope.deleteDomain = function(item) {
    var confirmPopup = $ionicPopup.confirm({
       title: 'Delete Domain: '+item.domain,
       template: 'Are you sure you want to delete domain '+item.domain+' ?'
    });
    confirmPopup.then(function(res) {
      if(res) {
        index = _.indexOf($scope.items, item);
        $scope.items.splice(index, 1);
        saveToDatabase();
      } else {
      }
    });
  };

  $scope.$on('vaultDomainAdded', function(event, data) {
    $scope.items.push(data);
    saveToDatabase();
    if ($window.plugins && $window.plugins.toast) {
      $window.plugins.toast.showShortCenter('Domain '+data.domain+' added!', 
        function(a){console.log('toast success: ' + a)}, 
        function(b){console.log('toast error: ' + b)}
      )
    }
  });

  $scope.reorderItems = function(item, fromIndex, toIndex) {
    //Move the item in the array
    $scope.items.splice(fromIndex, 1);
    $scope.items.splice(toIndex, 0, item);
    saveToDatabase();
  };
})

.controller('MainCtrl', function($scope, $window) {
  $scope.vault = {
    domain: "",
    key: "",
    passwordChoice: 'password_choice_16'
  };

  $scope.updateHash = function(v) {
    var settings = $window[$scope.vault.passwordChoice];
    settings['phrase'] = v.key;
    $scope.vault.hash = new Vault(settings).generate(v.domain);
  };
  $scope.copyHash = function() {
    if ($window.plugins && $window.plugins.clipboard) {
      $window.plugins.clipboard.copy($scope.vault.hash);
    }
    if ($window.plugins && $window.plugins.toast) {
      $window.plugins.toast.showShortCenter('Hash is copied!', 
        function(a){console.log('toast success: ' + a)}, 
        function(b){console.log('toast error: ' + b)}
      )
    } 
    // Stop the ion-refresher from spinning
    $scope.$broadcast('scroll.refreshComplete');
  };
  $scope.addDomain = function(v) {
    // Do not save hash
    new_v = {domain: v.domain, password_choice: v.passwordChoice};
    // Warn if domain already exists ?
    $scope.$emit('vaultDomainAdded', new_v);
  };
  $scope.$on('vaultDomainSelected', function(event, data) {
    $scope.vault.domain = data.domain;
    $scope.vault.passwordChoice = data.password_choice;
    $scope.updateHash($scope.vault);
  });
})
