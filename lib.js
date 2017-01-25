'use strict';

class Node {
	constructor() {
		this.items = {};
		this.getTotal = function() {
			var total = 0;
			for(var i in this.items)
				total += this.items[i];
			return total;
		}
		this.getTotalUnique = function() {
			var total = 0;
			for(var i in this.items)
				total++;
			return total;
		}
	}
}

class AfterNode extends Node {
	constructor(count) {
		super();
		this.count = count;
		this.type = "After";
		this.addItem = function(/*item*/ item_a, /*item*/ item_b, /*int*/ num, /*int*/ count = 1) {
			this.items[item_a] = this.items[item_a] || {};
			var i = this.items[item_a];
			i[item_b] = i[item_b] || Array(this.count).fill(0);
			i[item_b][num] += count;
		}
	}
}

class RelatedNode extends Node {
	constructor() {
		super();
		this.type = "Related";
		this.addItem = function(item_in, item_out, count = 1) {
			this.items[item_in] = this.items[item_in] || {};
			var i = this.items[item_in];
			i[item_out] = i[item_out] ? i[item_out] + count : count;
		}
	}
}

class FirstNode extends Node {
	constructor() {
		super();
		this.type = "First";
		this.addItem = function(item_in, item_out, count = 1) {
			this.items[item_in] = this.items[item_in] || {};
			var i = this.items[item_in];
			i[item_out] = i[item_out] ? i[item_out] + count : count;
		}
	}
}

const default_params = {
	after_nodes: 3,
	related_nodes: 2,
	first_nodes: 2,
	max_output_items: 50,
	empty_token: "<null>",
	importantItems(/*array*/ _items, /*int*/ count) {
		var items = [..._items];
		var result = [];
		for(var i = 0; i < count; i++) {
			var index = Math.floor(Math.random()*items.length);
			result.push(items[index]);
			items.slice(index, 1);
		}
		return result;
	},
};

module.exports = class {
	constructor(options = {}) {
		this.options = Object.assign(default_params, options);

		this.importantItems = this.options.importantItems;

		// Create nodes
		this.nodes = {
			after: new AfterNode(this.options.after_nodes),
			related: Array(this.options.related_nodes).fill(),
			first: new FirstNode(),
		};
		for(var i in this.nodes.related)
			this.nodes.related[i] = new RelatedNode();

		this.learn = function(/*array*/ input, /*array*/ output) {
			if(output.length < 1) return 0;
	
			this.learnAfter(output);
			if(input) {
				this.learnRelated(input, output);
				this.learnFirst(input, output);
			}
		}

		this.learnAfter = function(/*array*/ output) {
			for(var i = 0; i < output.length; i++) {
				for(var j = 0; j < this.options.after_nodes; j++) {
					var b_index = parseInt(i) + parseInt(j) + 1;
					this.nodes.after.addItem(
						output[i],
						output.length > b_index ? output[b_index] : this.options.empty_token,
						j
					);
				}
			}
		}

		this.learnRelated = function(/*array*/ input, /*array*/ output) {
			var related = this.nodes.related;
			var important_input = this.importantItems(input, this.options.related_nodes);
			var important_output = this.importantItems(output, this.options.related_nodes);
			for(var i in related) {
				related[i].addItem(important_input[i], important_output[i]);
			}
		}

		this.learnFirst = function(/*array*/ input, /*array*/ output) {
			var first = this.nodes.first;
			for(var i = 0; i < input.length; i++) {
				first.addItem(input[i], output[0]);
			}
		}

		this.generate = function(/*array*/ input) {
			var result = [this.firstItem(input)];
			for(var i = 0; i < this.options.max_output_items; i++) {
				var prev = [...result].reverse().slice(0, this.options.after_nodes);
				var next = this.nextItem(prev);
				if(next === this.options.empty_token || !next) {
					break;
				}
				result.push(next);

			}
			return result;
		}

		this.nextItem = function(/*array*/ prev) {
			var possible = [];
			var items = this.nodes.after.items;
			for(var i = 0; i < prev.length; i++) {
				if(this.nodes.after.items[prev[i]]) {
					possible.push(
						{ object: {}, weight: this.options.after_nodes - i }
					);
					for(var j in items[prev[i]]) {
						possible[i].object[j] = parseInt(items[prev[i]][j][i]);
					}
				}
			}
			return weightedRandom(addWeightedObjects(possible));
		}

		this.firstItem = function(/*array*/ input) {
			if(input) {
				var important_input = this.importantItems(input, this.options.first_nodes);
				var o = {};
				for(var i = 0; i < important_input.length; i++) {
					o = Object.assign(
						o,
						this.nodes.first.items[important_input[i]])
				}
				var possible = [{
					object: o,
					weight: 1
				}];
				var result = weightedRandom(addWeightedObjects(possible));
				if(result) return result;
			}
			var	possible = this.nodes.first.items[randomProperty(this.nodes.first.items)];
			return weightedRandom(possible);

		}

		this.learnFromArray = function(/*array*/ arr, /*string*/ split) {
			for(var i = 1; i < arr.length; i++) {
				this.learn(
					arr[i - 1].split(split),
					arr[i].split(split)
				);
			}
		}
	} 
}

/*
Example input:
[
{ object: { a:2, b: 5 }, weight: 1 },
{ object: { a:1, r:12 }, weight: 2 },
]
Returns:
{ a:4, b:5, r:24 }
*/
function addWeightedObjects(/*array of objects*/ objects) {
	var result = {};
	for(var i in objects) {
		var o = objects[i];
		for(var p in o.object)
			result[p] = result[p] ? result[p] + o.object[p] * o.weight : o.object[p] * o.weight;  
	}
	return result;
}

function weightedRandom(/*object*/ object) {
	var total = 0;
	for(var i in object)
		total += object[i];

	var sum = 0;
	var r = Math.random() * total;
	for (var i in object) {
		sum += object[i];
		if (r <= sum) return i;
	}
}

function randomProperty(obj) {
	var result;
	var count = 0;
	for (var i in obj)
		if (Math.random() < 1/++count)
			result = i;
	return result;
}