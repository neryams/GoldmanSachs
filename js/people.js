function People($scope) {
	$scope.people = [];

	$scope.addPerson = function() {
		var personId = $scope.personName.toLowerCase().replace(/[-\s]/g, '');
		$scope.people.push({name: $scope.personName, id: personId});
	}
}