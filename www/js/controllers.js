angular.module('vaultpass.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {
  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      $scope.closeLogin();
    }, 1000);
  };
})

.controller('MainCtrl', function($scope, $ionicPlatform, $window) {
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
})
