function Person(name) {
	this.id = name.replace('/-\s/', '').toLowerCase();
}
Person.prototype = {
	id: '',
	name: '',
}