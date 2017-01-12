var KeyInput = function(initconfig) {
	initconfig = initconfig || {};
	
	// properties
	this.config = {
		target: initconfig.target || window,
		releaseOnBlur: initconfig.releaseOnBlur || true,
		requestFocus: initconfig.requestFocus || true,
	};
	this.keystatesPress = new Array(256);
	this.keystatesRelease = new Array(256);
	this.lastpoll = 0;
	this.thispoll = 0;
	
	this.currentTextHandler = {
		handler: null,
		passive: null,
		
		exists: function() {
			return this.handler != null;
		},
		isCapturing: function() {
			return this.exists() && (this.passive == true);
		},
		fireEvent: function(event) {
			this.handler(event);
		},
		fireTextEvent: function(text) {
			var te = KeyInput.TextInputEvent.newTextEvent(text);
			this.fireEvent(te);
		},
		fireCommandEvent: function(command, data) {
			var te = KeyInput.TextInputEvent.newCommandEvent(command, data);
			this.fireEvent(te);
		},
	};
	
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
	
	this.beginTextInput = function(handler, passive) {
		if(!handler) return;
		
		// send endinput command to previous handler
		if(this.currentTextHandler.handler) {
			this.currentTextHandler.fireCommandEvent(KeyInput.TextInputEvent.COMMAND_ENDINPUT);
		}
		
		// set current handler
		this.currentTextHandler.handler = handler;
		this.currentTextHandler.passive = passive || false;
		
		// release keys
		if(!this.currentTextHandler.passive) {
			var now = self.perfnow();
			for(var i = 0; i < self.keystatesRelease.length; i++) {
				// only release pressed keys
				if(self.keystatesPress[i] > self.keystatesRelease[i]) {
					self.keystatesRelease[i] = now;
				}
			}
		}
		
		// send begininput command
		this.currentTextHandler.fireCommandEvent(KeyInput.TextInputEvent.COMMAND_BEGININPUT);
	};
	this.endTextInput = function() {
		if(!this.currentTextHandler.handler) return;
		
		// send endinput event
		this.currentTextHandler.fireCommandEvent(KeyInput.TextInputEvent.COMMAND_ENDINPUT);
		
		// clear currenthandler
		this.currentTextHandler.handler = null;
	};
	this.getFocusOwner = function() {
		return (!hasFocus() ? null : (currentTextHandler.handler || window));
	};
	
	// private code
	
	/*
	// fire textinput events
	if(self.currentTextHandler.handler) {
		self.currentTextHandler.fireTextEvent(e.key);
	}
	*/
	
	// on keydown
	this.config.target.addEventListener('keydown', function(e) {
		var dokeyinput = self.currentTextHandler.handler ? self.currentTextHandler.passive : false;
		
		if(dokeyinput) {
			var key = e.keyCode;
			
			// allow f keys
			if(key < 112 || key > 123) e.preventDefault();
			
			// ignore repeat (if implemented)
			if(e.repeat == true) return;
			
			// set
			self.keystatesPress[key] = self.perfnow();
		}
	}, true);
	
	// on keyup
	this.config.target.addEventListener('keyup', function(e) {		
		var dokeyinput = self.currentTextHandler.handler ? self.currentTextHandler.passive : false;
		
		if(dokeyinput) {
			var key = e.keyCode;
			
			// allow f keys
			if(key < 112 || key > 123) e.preventDefault();
			
			// set
			self.keystatesRelease[key] = self.perfnow();
		}
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
	
	// create hidden input element
	this.hiddenInputElement = document.createElement("input");
	this.hiddenInputElement.setAttribute("type", "text");
	this.hiddenInputElement.setAttribute("id", "keyinputjs-textinput");
	this.hiddenInputElement.style.cssText = "display: none;";
	document.body.appendChild(this.hiddenInputElement);
	
	this.hiddenInputElement.value = "";
	
	// listen for text input
	this.hiddenInputElement.addEventListener('input', function(e) {
		var text = self.hiddenInputElement.value;
		self.hiddenInputElement.value = "";
		
		// fire event
		if(self.currentTextHandler.exists()) {
			self.currentTextHandler.fireTextEvent(text);
		}
	});
	
	// listen for command input
	document.addEventListener('keydown', function(e) {
		// ensure focus on hidden input element on keypress
		self.hiddenInputElement.focus();
		
		// ignore if no textinputhandler present
		if(self.currentTextHandler.exists()) {
			if(e.ctrlKey && !e.altKey) {
				var key = e.keyCode;
				
				switch(key) {
					case 13:
						self.currentTextHandler.fireCommandEvent(KeyInput.TextInputEvent.COMMAND_ACTION, 13); break;
					case 8:
						self.currentTextHandler.fireCommandEvent(KeyInput.TextInputEvent.COMMAND_ACTION, 8); break;
				}
				
				// paste if PasteEvent not supported
				if(!supportsOnPaste && key == 67) {
					self.currentTextHandler.fireCommandEvent(KeyInput.TextInputEvent.COMMAND_PASTE, null); // TODO: put paste data
				}
			}
		}
	});
	
	// handle clipboard command
	const supportsOnPaste = ("onpaste" in window);
	if(supportsOnPaste) {
		document.addEventListener("paste", function(e) {
			// fire event
			if(self.currentTextHandler.exists()) {
				self.currentTextHandler.fireCommandEvent(KeyInput.TextInputEvent.COMMAND_PASTE, null); // TODO: actually put the paste data
			}
		});
	}
};

// class TextInputEvent
KeyInput.TextInputEvent = function(type, text, command, data) {
	this.type = type;
	
	if(text) this.text = text;
	if(command) this.command = command;
	if(data) this.data = data;
};
KeyInput.prototype = {
	
};
KeyInput.TextInputEvent.newTextEvent = function(text) {
	return new KeyInput.TextInputEvent(KeyInput.TextInputEvent.TYPE_TEXT, text, null, null);
};
KeyInput.TextInputEvent.newCommandEvent = function(command, data) {
	return new KeyInput.TextInputEvent(KeyInput.TextInputEvent.TYPE_COMMAND, null, command, data || null);
};
KeyInput.TextInputEvent.prototype = {
	type: null, // type of event, either TYPE_TEXT or TYPE_COMMAND
	text: null, // input text if type==TYPE_TEXT
	command: null, // input command if type==TYPE_COMMAND
	data: null, // optional command payload data
};
KeyInput.TextInputEvent.TYPE_TEXT = 'text';
KeyInput.TextInputEvent.TYPE_COMMAND = 'command';
KeyInput.TextInputEvent.COMMAND_BEGININPUT = 'begininput';
KeyInput.TextInputEvent.COMMAND_ENDINPUT = 'endinput';
KeyInput.TextInputEvent.COMMAND_ACTION = 'action';
KeyInput.TextInputEvent.COMMAND_PASTE = 'paste';

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