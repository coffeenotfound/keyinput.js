var KeyInput = function(config) {
	this.target = (typeof config == "array" && config.target !== undefined ? config.target : document);
	
	this.keystatesPress = new Array(256);
	this.keystatesRelease = new Array(256);
	
	this.lastpoll = 0;
	this.thispoll = 0;
	
	// prime arrays
	var now = performance.now();
	for(var i = 0; i < this.keystatesPress.length; i++) {
		this.keystatesPress[i] = now;
		this.keystatesRelease[i] = now;
	}
	
	var self = this;
	
	// public methods
	this.isKeyDown = function(key, duration) {
		var duration = duration || 0;
		
		return this.keystatesPress[key] > this.keystatesRelease[key] + duration;
	};
	this.isKeyUp = function(key, duration) {
		return !this.isKeyDown(key, duration); // ensure it always returns the opposite of isKeyDown
	};
	this.poll = function() {
		// set new poll timestamp
		this.lastpoll = this.thispoll;
		this.thispoll = performance.now();
	};
	this.hasFocus = function() {
		return document.hasFocus();
	};
	
	// private code
	
	// on keydown
	this.target.addEventListener('keydown', function(e) {
		var key = e.keyCode;
		
		// allow f keys
		if(key < 112 || key > 123) e.preventDefault();
		
		// ignore repeat (if implemented)
		if(e.repeat == true) return;
		
		// set
		self.keystatesPress[key] = performance.now();
	}, true);
	
	// on keyup
	this.target.addEventListener('keyup', function(e) {		
		var key = e.keyCode;
		
		// allow f keys
		if(key < 112 || key > 123) e.preventDefault();
		
		// set
		self.keystatesRelease[key] = performance.now();
	}, true);
	
	// on focus lose
	window.onblur = function(e) {
		// release all keys
		var now = performance.now();
		for(var i = 0; i < self.keystatesRelease.length; i++) {
			self.keystatesPress[i] = now;
		}
	};
	
	// try request focus
	if(this.target.focus) {
		this.target.focus();
	}
	
	// constants
};