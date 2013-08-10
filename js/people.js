var peopleExpensesModule = angular.module('people-expenses',[]);

peopleExpensesModule.directive('draggable', function() {
	return {
		// A = attribute, E = Element, C = Class and M = HTML Comment
		restrict:'A',
		link: function(scope, element, attrs) {
			element.draggable({
				revert: 'invalid',
				helper: "clone"
			});
		}
	};
});
peopleExpensesModule.directive('droppable', function() {
	return {
		// A = attribute, E = Element, C = Class and M = HTML Comment
		restrict:'A',
		link: function(scope, element, attrs) {
			var options = {
				hoverClass: "drop-hover",
                drop: function(event,ui) {
                	var drag = angular.element(ui.draggable),
                		drop = angular.element(this),
                		model_drag = ui.draggable.attr('ng-model'),
                		model_drop = $(this).attr('ng-model');

                	if(angular.isArray(drag.scope()[model_drag]))
                		model_drag = drag.scope()[model_drag][drag.scope().$index];
                	else
                		model_drag = drag.scope()[model_drag];

                	// Prevent duplicate entries
                	var invalid = false;
                	if(drop.data('limit_drop') > 1 || angular.isArray(drop.scope()[model_drop])) {
                		angular.forEach(drop.scope()[model_drop], function(eachEntry) {
                			if(eachEntry === model_drag) {
                				invalid = true;
                				return false;                				
                			}
                		});
                		if(!invalid)
                			drop.scope()[model_drop].push(model_drag);              		
                	}
                	else
                		drop.scope()[model_drop] = model_drag;

                	if(!invalid) {
	                	drop.scope().$apply();
	                	return true;
                	}
                }
            }
            var attrs = scope.$eval(attrs.droppable);
            if(attrs.accept)
            	options.accept = attrs.accept;
            if(attrs.limit)
            	element.data('limit_drop',attrs.limit);

			element.droppable(options);
		}
	};
});

peopleExpensesModule.controller('People', ['$scope', function($scope) {
	$scope.people = [];

	$scope.addPerson = function() {
		var personId = $scope.personName.toLowerCase().replace(/[-\s]/g, '');
		$scope.people.push({name: $scope.personName, id: personId});
		$scope.personName = '';
	}
}]);

peopleExpensesModule.controller('Calculator', ['$scope', function($scope) {
	$scope.owee;
	$scope.owers = [];
	$scope.payments = [];

	$scope.addReceipt = function() {

	}
}]);