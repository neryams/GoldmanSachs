var peopleExpensesModule = angular.module('people-expenses',['LocalStorageModule']);

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
                		focusPrice();
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
peopleExpensesModule.filter('getById', function() {
  return function(input, id) {
    var i=0, len=input.length;
    for (; i<len; i++) {
      if (input[i].id === id) {
        return input[i];
      }
    }
    return null;
  }
});

peopleExpensesModule.controller('People', ['$scope', function($scope) {
	$scope.people = [];

	$scope.addPerson = function(person) {
		if($scope.personName || person) {
            if(person) {
                $scope.people.push({name: person.name, id: person.id});
            } else {
                var personId = $scope.personName.toLowerCase().replace(/[-\s]/g, '');
                $scope.people.push({name: $scope.personName, id: personId});
                $scope.personName = '';
                $scope.$$childHead.calculateTotals();                
            }
		}
	}
}]);

peopleExpensesModule.controller('Transaction', ['$scope', '$filter', 'localStorageService', function($scope, $filter, localStorageService) {
	$scope.buyer = null;
	$scope.consumers = [];
	$scope.transactions = [];
	$scope.totals = [];
    $scope.saveDataMissing = (!localStorageService.get('goldmanCurrent'));

	$scope.removeConsumer = function(index) {
        $scope.consumers.splice(index,1);
	}

	$scope.addReceipt = function() {
		if($scope.buyer && $scope.priceInput) {
			$scope.transactions.push({buyer: $scope.buyer, consumers: angular.extend($scope.consumers), amount: math.eval($scope.priceInput), description: $scope.descriptionInput});
			$scope.totals = calculateTotals($scope.transactions);

			$scope.priceInput = '';
			$scope.descriptionInput = '';
			$scope.consumers = [];
			focusPrice();
            saveData();
		}
	}

    $scope.removeReceipt = function(index) {
        $scope.transactions.splice(index,1);
        $scope.totals = calculateTotals($scope.transactions);
        saveData();
    }
    $scope.calculateTotals = function() {
        $scope.totals = calculateTotals($scope.transactions);
        saveData();
    }

	function calculateTotals(transactions) {
		var totalCost = 0;
		var totals = [];
        angular.forEach($scope.people, function(person) {
        	person.difference = 0;
        });

        angular.forEach(transactions, function(transaction) {
	        transaction.buyer.difference += transaction.amount;
        	if(!transaction.consumers.length) {
	        	totalCost += transaction.amount;        		
        	} else {
		        angular.forEach(transaction.consumers, function(consumer) {
		        	consumer.difference -= transaction.amount / transaction.consumers.length;
		        });        		
        	}
        });

        var perCost = totalCost / $scope.people.length,
			paying = [],
			receiving = [];

        angular.forEach($scope.people, function(person) {
        	person.difference -= perCost;
        	if(person.difference > 0)
        		receiving.push(person);
        	else
        		paying.push(person);
        });

        angular.forEach(paying, function(payer) {
        	while(payer.difference < -0.01) {
        		var receiver = receiving[0];
        		if(receiver.difference > Math.abs(payer.difference)) {
        			receiver.difference += payer.difference;
        			totals.push({to: receiver, from: payer, amount: Math.abs(payer.difference)});
        			delete payer.difference;
        		}
        		else {
        			payer.difference += receiver.difference;
        			totals.push({to: receiver, from: payer, amount: receiver.difference});
        			delete receiver.difference;
        			receiving.splice(0,1);
        		}
        	}
        });

        return totals;
	}

    function saveData() {
        var allData = {
            people: $scope.people,
            buyer: $scope.buyer,
            consumers: $scope.consumers,
            transactions: $scope.transactions
        };
        localStorageService.add('goldmanCurrent', angular.toJson(allData));
    }

    function loadData() {
        var savedData = localStorageService.get('goldmanCurrent');

        if(savedData) {
            angular.forEach(savedData.people, function(person) {
                $scope.addPerson(person);
            });
            $scope.buyer = $filter('getById')($scope.people, savedData.buyer.id);

            angular.forEach(savedData.consumers, function(consumer) {
                $scope.consumers.push($filter('getById')($scope.people, consumer.id));
            });
            angular.forEach(savedData.transactions, function(transaction) {
                var consumers = [];
                angular.forEach(transaction.consumers, function(consumer) {
                    consumers.push($filter('getById')($scope.people, consumer.id));
                });
                transaction.consumers = consumers;
                transaction.buyer = $filter('getById')($scope.people, transaction.buyer.id);
                $scope.transactions.push(transaction);
            });
            $scope.totals = calculateTotals($scope.transactions);
        }
    }

    $scope.loadLast = function() {
        loadData();
    }
}]);