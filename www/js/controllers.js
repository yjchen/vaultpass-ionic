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

angular.module('vaultpass.controllers', ['lawnchair_factory'])

.controller('AppCtrl', function($scope, $state, LawnchairFactory) {
  lawnchair = LawnchairFactory('test1', {isArray: true});
  if (lawnchair.all().length == 0) {
    lawnchair.save(initial_data);
  }
  $scope.items = lawnchair.all();

  $scope.selectDomain = function(data) {
    $scope.$broadcast('vaultDomainSelected', data);
  }
})

.controller('MainCtrl', function($scope, $window, $stateParams, LawnchairFactory) {
  lawnchair = LawnchairFactory('test1');

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
      $window.plugins.toast.showShortCenter('Hash is copied!', 
        function(a){console.log('toast success: ' + a)}, 
        function(b){console.log('toast error: ' + b)}
      )
    } 
    // Stop the ion-refresher from spinning
    $scope.$broadcast('scroll.refreshComplete');
  };
  $scope.$on('vaultDomainSelected', function(event, data) {
    $scope.vault.domain = data.domain;
    $scope.vault.passwordChoice = data.password_choice;
    $scope.updateHash($scope.vault);
  });
})
