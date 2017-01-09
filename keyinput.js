var KeyInput = function(config) {
	this.target = (typeof config == "array" && config.target !== undefined ? config.target : document);
	
	const MAX_POLL_ID = 1000000000;
	
	this.pollID = 0;
	this.keystatesPress = new Array(256);
	this.keystatesRelease = new Array(256);
	
	var self = this;
	
	// public methods
	this.isKeyDown = function(key) {
		return this.keystatesPress[key] >= (this.pollID - 1);
	};
	this.isKeyUp = function(key) {
		return this.keystatesRelease[key] >= (this.pollID - 1);
	};
	this.poll = function() {
		// increment poll id
		this.pollID++;
		
		// manually reset array when poll id overflows
		if(this.pollID >= MAX_POLL_ID) {
			this.pollID = 0;
			for(var i = 0; i < this.keystatesPress.length; i++) {
				this.keystatesPress[i] -= MAX_POLL_ID;
			}
			for(var i = 0; i < this.keystatesRelease.length; i++) {
				this.keystatesRelease[i] -= MAX_POLL_ID;
			}
		}
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
		self.keystatesPress[key] = self.pollID;
	}, true);
	
	// on keyup
	this.target.addEventListener('keyup', function(e) {		
		var key = e.keyCode;
		
		e.preventDefault();
		
		// set
		self.keystatesRelease[key] = self.pollID;
	}, true);
	
	// on blur
	window.onblur = function(e) {
		//if(self.releaseKeysOnBlur) {
		self.pollID++;
		//}
	};
	
	// try request focus
	if(this.target.focus) {
		this.target.focus();
	}
	
	// constants
};