var myFirebaseRef = new Firebase("https://urcouresniper.firebaseio.com/");
var states = ['00000'];
var names  = [];
var titles  = [];
var firstRun = true;

(function () {
  'use strict';
  angular
      .module('URCS', ['ngMaterial', 'ngMessages', 'firebase'])
      .controller('DemoCtrl', DemoCtrl);
  function DemoCtrl ($timeout, $q, $scope) {
    var self = this;
      
    
    $scope.email = "";
    $scope.crn = "";
    $scope.isNumber = false;
    $scope.submitForm = function(){
        self.searchText = self.selectedItem.value;
        $scope.isNumber = !isNaN(self.searchText);
        if($scope.isNumber && self.searchText.length == 5){
            /*Submit to firebase*/
            myFirebaseRef.child("tracked").child(self.searchText).child('users').push($scope.email);
                    console.log($scope.email + " " + self.searchText);
            $scope.email = ""; self.searchText = "";
            $scope.searchForm.$setUntouched();
            $scope.searchForm.$setPristine();
        }else{
        }
    }
    
    $scope.selectItem = function(item){
        console.log(item);
        $scope.crn = item;
    }
    
    // list of `state` value/display objects
    self.states        = loadAll();
    self.selectedItem  = null;
    self.searchText    = null;
    self.querySearch   = querySearch;
    // ******************************
    // Internal methods
    // ******************************
    /**
     * Search for states... use $timeout to simulate
     * remote dataservice call.
     */
    function updateSelected(){
        console.log('hey');
        $scope.searchForm.$setUntouched();
        $scope.searchForm.$setPristine();
    }  
    
    function querySearch (query) {
        if(firstRun){
            updateAC();
            firstRun = false;
        }
        $scope.isNumber = !isNaN(query);
      self.states = loadAll();
      var results = query ? self.states.filter( createFilterFor(query) ) : self.states;
      var deferred = $q.defer();
      $timeout(function () { deferred.resolve( results ); }, Math.random() * 100, false);
      return deferred.promise;
    }
    /**
     * Build `states` list of key/value pairs
     */
    function loadAll() {
      var allStates = ['10000', '10001', '10002', '10004', '10005'];
        allStates = states;
        return allStates.map( function (state) {
            return {
                value: state.toLowerCase(),
                display: state,
                name: names[states.indexOf(state) - 1],
                title: titles[states.indexOf(state) - 1],
                combined: state.toLowerCase() + names[states.indexOf(state) - 1]
            };
        });
    };
    function updateAC(){
        updateSelected();
         myFirebaseRef.child('classes').once('value', function(snap){
            snap.forEach(function(child){
                    states.push(child.key()); 
                    names.push(child.val()['name']);
                    titles.push(child.val()['title']);
            });
            
        });
        
    }
    /**
     * Create filter function for a query string
     */
    function createFilterFor(query) {
      var lowercaseQuery = angular.lowercase(query);
      return function filterFn(state) {
        return (state.combined.indexOf(query) >= 0);
      };
    }
  }
})();