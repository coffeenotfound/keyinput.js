var KeyInput = function(initconfig) {
	initconfig = initconfig || {};
	
	this.config = {
		target: initconfig.target || window,
		releaseOnBlur: initconfig.releaseOnBlur || true,
		requestFocus: initconfig.requestFocus || true,
	};
	
	this.keystatesPress = new Array(256);
	this.keystatesRelease = new Array(256);
	
	this.lastpoll = 0;
	this.thispoll = 0;
	
	// prime arrays
	var now = this.perfnow();
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
		this.thispoll = this.perfnow();
	};
	this.hasFocus = function() {
		return document.hasFocus();
	};
	
	// private code
	
	// on keydown
	this.config.target.addEventListener('keydown', function(e) {
		var key = e.keyCode;
		
		// allow f keys
		if(key < 112 || key > 123) e.preventDefault();
		
		// ignore repeat (if implemented)
		if(e.repeat == true) return;
		
		// set
		self.keystatesPress[key] = self.perfnow();
	}, true);
	
	// on keyup
	this.config.target.addEventListener('keyup', function(e) {		
		var key = e.keyCode;
		
		// allow f keys
		if(key < 112 || key > 123) e.preventDefault();
		
		// set
		self.keystatesRelease[key] = self.perfnow();
	}, true);
	
	// on focus lose
	//var targetdoc = this.config.target.ownerDocument || this.config.target;
	//var targetwindow = targetdoc.defaultView || targetdoc.parentWindow;
	
	window.onblur = function(e) {
		// release all keys
		if(self.config.releaseOnBlur) {
			var now = self.perfnow();
			for(var i = 0; i < self.keystatesRelease.length; i++) {
				// only release pressed keys
				if(self.keystatesPress[i] > self.keystatesRelease[i]) {
					self.keystatesRelease[i] = now;
				}
			}
		}
	};
	
	// try request focus
	if(this.config.requestFocus && this.config.target.focus) {
		this.config.target.focus();
	}
	
	// constants
};

// performance.now fallbacks
KeyInput.prototype.perfnow = (function() {
	if(performance) {
		if(performance.now) return function() { return performance.now(); };
		else if(performance.mozNow) return function() { return performance.mozNow(); };
		else if(performance.msNow) return function() { return performance.msNow(); };
		else if(performance.oNow) return function() { return performance.oNow(); };
		else if(performance.webkitNow) return function() { return performance.webkitNow(); };
	}
	// worst case fallback
	return function() { return new Date().getTime(); };
})();