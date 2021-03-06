sap.ui.controller("wlcpfrontend.controllers.VirtualDevice", {
	
	socket : null,
	username : "",
	modelJSON : {
			games : [],
			teams : [],
			teamPlayers : []
	},
	model : new sap.ui.model.json.JSONModel(this.modelJSON),
	gameInstanceId : 0,
	team : 0,
	player : 0,
	debugMode : false,
	debugGameInstanceId : null,
	restartDebug : null,
	recievedDisplayText : false,
	recievedDisplayPhoto : false,
	
	socket : null,
	stompClient : null,
	
	redButtonPressed : function() {
		this.resetStateDisplayTypes();
		this.stompClient.send("/app/gameInstance/" + this.gameInstanceId + "/singleButtonPress/" + this.username + "/" + this.team + "/" + this.player, {}, "{\"buttonPress\" : 1}");
	},

	greenButtonPressed : function() {
		this.resetStateDisplayTypes();
		this.stompClient.send("/app/gameInstance/" + this.gameInstanceId + "/singleButtonPress/" + this.username + "/" + this.team + "/" + this.player, {}, "{\"buttonPress\" : 2}");
	},

	blueButtonPressed : function() {
		this.resetStateDisplayTypes();
		this.stompClient.send("/app/gameInstance/" + this.gameInstanceId + "/singleButtonPress/" + this.username + "/" + this.team + "/" + this.player, {}, "{\"buttonPress\" : 3}");
	},

	blackButtonPressed : function() {
		this.resetStateDisplayTypes();
		this.stompClient.send("/app/gameInstance/" + this.gameInstanceId + "/singleButtonPress/" + this.username + "/" + this.team + "/" + this.player, {}, "{\"buttonPress\" : 4}");
	},
	
	submitButtonPressSequence : function() {
		var sequences = $("#virtualDevice--colorListSortable-listUl").sortable("toArray", {attribute : "class"});
		var sequence = "";
		for(var i = 0; i < sequences.length; i++) {
			if(sequences[i].includes("Red")) {
				sequence = sequence.concat("1");
			} else if(sequences[i].includes("Green")) {
				sequence = sequence.concat("2");
			} else if(sequences[i].includes("Blue")) {
				sequence = sequence.concat("3");
			} else if(sequences[i].includes("Black")) {
				sequence = sequence.concat("4");
			}
		}
		this.resetStateDisplayTypes();
		this.stompClient.send("/app/gameInstance/" + this.gameInstanceId + "/sequenceButtonPress/" + this.username + "/" + this.team + "/" + this.player, {}, JSON.stringify({sequenceButtonPress : sequence}));
		var children = $("#virtualDevice--colorListSortable-listUl").children();
		for(var i = 0; i < children.length; i++) {
			children[i].remove();
		}
	},

	clearButtonPressSequence : function() {
		var children = $("#virtualDevice--colorListSortable-listUl").children();
		for(var i = 0; i < children.length; i++) {
			children[i].remove();
		}
	},
	
	onAfterRenderingSequence : function() {
		$("#virtualDevice--colorListRed").draggable({revert: false, helper: "clone", connectToSortable : "#virtualDevice--colorListSortable-listUl"});
		$("#virtualDevice--colorListGreen").draggable({revert: false, helper: "clone", connectToSortable : "#virtualDevice--colorListSortable-listUl"});
		$("#virtualDevice--colorListBlue").draggable({revert: false, helper: "clone", connectToSortable : "#virtualDevice--colorListSortable-listUl"});
		$("#virtualDevice--colorListBlack").draggable({revert: false, helper: "clone", connectToSortable : "#virtualDevice--colorListSortable-listUl"});
		$("#virtualDevice--colorListSortable-listUl").sortable();
	},
	
	submitKeyboardInput : function() {
		var keyboardInput = sap.ui.getCore().byId("virtualDevice--keyboardInputField").getValue();
		this.resetStateDisplayTypes();
		this.stompClient.send("/app/gameInstance/" + this.gameInstanceId + "/keyboardInput/" + this.username + "/" + this.team + "/" + this.player, {}, JSON.stringify({keyboardInput : keyboardInput}));
		sap.ui.getCore().byId("virtualDevice--keyboardInputField").setValue("");
	},
	
	setupSocketConnection : function(team, player) {
		    this.socket = new SockJS("http://" + ServerConfig.getServerAddress() + "/wlcpGameServer/0");
		    this.stompClient = Stomp.over(this.socket);
		    var that = this;
		    this.stompClient.connect({}, function (frame) {
		    	that.connectToGameInstance(that.gameInstanceId, team, player);
		    });
	},
	
	connectToGameInstance(gameInstanceId, team, player) {
		var that = this;
	    this.connectionResultSubscription = this.stompClient.subscribe("/subscription/connectionResult/" + gameInstanceId + "/" + this.username + "/" + team + "/" + player, function(response) {
	    	var jsonResponse = JSON.parse(response.body);
	    	if(jsonResponse.code == "FAIL") { 
				var navContainer = sap.ui.getCore().byId("virtualDevice--virtualDeviceNavContainer");
				navContainer.to(sap.ui.getCore().byId("virtualDevice--selectGameInstance"));
				sap.m.MessageBox.error("That team and player are taken! Someone else may have taken it before you.");
				return;
	    	}
	    	that.team = jsonResponse.team;
	    	that.player = jsonResponse.player;
	    	that.connectionResultSubscription.unsubscribe();
			var navContainer = sap.ui.getCore().byId("virtualDevice--virtualDeviceNavContainer");
			navContainer.to(sap.ui.getCore().byId("virtualDevice--virtualDevicePage"));	
	    });
    	this.subscribeToChannels(gameInstanceId, team, player);
	    this.stompClient.send("/app/gameInstance/" + gameInstanceId + "/connectToGameInstance/" + this.username + "/" + team + "/" + player, {}, "{}");
	},
	
	subscribeToChannels : function(gameInstanceId, team, player) {
		var that = this;
		this.stompClient.subscribe("/subscription/gameInstance/" + gameInstanceId + "/displayText/" + this.username + "/" + team + "/" + player, function(response) {
			var parsedJson = JSON.parse(response.body);
			that.recievedDisplayText = true
			//photo already initialized
			if(that.recievedDisplayText && that.recievedDisplayPhoto){
				var displayTextBox = sap.ui.getCore().byId("virtualDevice--displayTextLabel");
				displayTextBox.setText(parsedJson.displayText); //this becomes id of displayTextPhoto Label
			}
			else {
				var displayTextBox = sap.ui.getCore().byId("virtualDevice--displayTextArea");
				displayTextBox.setValue(parsedJson.displayText); //this becomes id in displayText TextArea
				that.switchToStateType("DisplayText");
			}
			//that.switchToStateType("DisplayPhoto");
			//displayTextBox.setValue(parsedJson.displayText);
		});
		this.stompClient.subscribe("/subscription/gameInstance/" + gameInstanceId + "/displayPhoto/" + this.username + "/" + team + "/" + player, function(response) {
			var parsedJson = JSON.parse(response.body);
			console.log(parsedJson);
			that.recievedDisplayPhotoText = true;
			//load text if exists
			if(that.recievedDisplayText) {
				var displayTextLabel = sap.ui.getCore().byId("virtualDevice--displayTextLabel");
				displayTextLabel.setText(sap.ui.getCore().byId("virtualDevice--displayTextArea").getValue());
			}
			
			var displayPhoto = sap.ui.getCore().byId("virtualDevice--displayPhotoImage");
			//load image
			var img = new Image();
			img.addEventListener("load", $.proxy(function() {
				displayPhoto.setHeight(img.naturalHeight * (parsedJson.scale/100) + "px");
				displayPhoto.setWidth(img.naturalWidth * (parsedJson.scale/100) + "px");
				displayPhoto.setSrc(parsedJson.url);
			}, this));
			img.src = parsedJson.url;
			that.switchToStateType("DisplayTextPhoto");
		});
		this.stompClient.subscribe("/subscription/gameInstance/" + gameInstanceId + "/singleButtonPressRequest/" + this.username + "/" + team + "/" + player, function(response) {
			that.switchToTransitionType("SingleButtonPress");
		});
		this.stompClient.subscribe("/subscription/gameInstance/" + gameInstanceId + "/sequenceButtonPressRequest/" + this.username + "/" + team + "/" + player, function(response) {
			that.switchToTransitionType("SequenceButtonPress");
		});
		this.stompClient.subscribe("/subscription/gameInstance/" + gameInstanceId + "/keyboardInputRequest/" + this.username + "/" + team + "/" + player, function(response) {
			that.switchToTransitionType("KeyboardInput");
		});
	},
	
	disconnectPressed : function() {
		var that = this;
	    this.disconnectResultSubscription = this.stompClient.subscribe("/subscription/disconnectionResult/" + this.gameInstanceId + "/" + this.username + "/" + this.team + "/" + this.player, function(response) {
	    	that.disconnectResultSubscription.unsubscribe();
	    	that.stompClient.disconnect();
	    	that.socket.close();
	    	that.onClose();
	    });
		this.stompClient.send("/app/gameInstance/" + this.gameInstanceId + "/disconnectFromGameInstance/" + this.username + "/" + this.team + "/" + this.player, {}, "{}");
	},
	
	onClose : function() {
		if(!this.debugMode) {
			sap.m.MessageBox.error("The connection was closed! This may have happened if you disconnected, locked your device or the screen turned off. The page will now refresh. Please re-login to continue where you left off in the game.", { onClose : function() {
				location.reload();
			}});
		} else {
			window.close();
		}
	},
	
	switchToStateType : function(type) {
		var navContainer = sap.ui.getCore().byId("virtualDevice--outputContainer");
		switch(type) {
		case "DisplayText":
			navContainer.to(sap.ui.getCore().byId("virtualDevice--displayTextPage"));
			break;
		case "DisplayTextPhoto":
			navContainer.to(sap.ui.getCore().byId("virtualDevice--displayTextPhotoPage"));
			break;
		}
	},
	
	switchToTransitionType : function(type) {
		var navContainer = sap.ui.getCore().byId("virtualDevice--inputContainer");
		switch(type) {
		case "SingleButtonPress":
			navContainer.afterNavigate = null;
			navContainer.to(sap.ui.getCore().byId("virtualDevice--singleButtonPress"));
			break;
		case "SequenceButtonPress":
			var page = sap.ui.getCore().byId("virtualDevice--sequenceButtonPress");
			page.onAfterRendering = $.proxy(this.onAfterRenderingSequence, this);
			navContainer.to(sap.ui.getCore().byId("virtualDevice--sequenceButtonPress"));
			break;
		case "KeyboardInput":
			navContainer.to(sap.ui.getCore().byId("virtualDevice--keyboardInput"));
			break;
		}
	},
	
	joinGameInstance : function() {
		var gameInstanceId = sap.ui.getCore().byId("virtualDevice--gamePinInput").getValue();
		if(gameInstanceId != "") {
			this.gameInstanceId = parseInt(gameInstanceId);
			$.ajax({url : "http://" + ServerConfig.getServerAddress() + "/controllers/playersAvaliable/" + this.gameInstanceId + "/" + this.username, dataType: "json", data : {}, success : $.proxy(this.handleGameTeamsAndPlayers, this), error : $.proxy(this.gameInstanceIdError, this)});
		} else {
			sap.m.MessageBox.error("Game PIN Field Cannot Be Empty!");
		}
		sap.ui.getCore().byId("virtualDevice--gamePinInput").setValue("");
	},
	
	joinDebugGameInstance : function() {
		this.gameInstanceId = this.debugGameInstanceId;
		$.ajax({url : "http://" + ServerConfig.getServerAddress() + "/controllers/playersAvaliable/" + this.gameInstanceId + "/" + this.username, dataType: "json", data : {}, success : $.proxy(this.handleGameTeamsAndPlayers, this), error : $.proxy(this.gameInstanceIdError, this)});
	},
	
	gameInstanceIdError : function() {
		sap.m.MessageBox.error("Game PIN Does not Exist!");
	},
	
	handleGameTeamsAndPlayers : function(response) {
		this.modelJSON.teamPlayers = [];
		this.model.setData(this.modelJSON);
		var navContainer = sap.ui.getCore().byId("virtualDevice--virtualDeviceNavContainer");
		navContainer.to(sap.ui.getCore().byId("virtualDevice--selectTeamPlayer"));
		for(var i = 0; i < response.length; i++) {
			this.modelJSON.teamPlayers.push({team : response[i].team + 1, player : response[i].player + 1});
		}
		this.model.setData(this.modelJSON);
	},
	
	onTeamPlayerSelected : function(oEvent) {
		var selectedTeamPlayer = this.model.getProperty(oEvent.getSource().getParent().getItems()[1].getSelectedItem().getBindingContext().getPath());
		this.setupSocketConnection(selectedTeamPlayer.team - 1, selectedTeamPlayer.player - 1);
	},
	
	initVirtualDevice : function(debugGameInstanceId, username) {
		if(!this.debugMode) {
			this.username = sap.ui.getCore().getModel("user").oData.username;
			sap.ui.getCore().setModel(this.model);
		} else {
			this.username = username;
			this.debugGameInstanceId = debugGameInstanceId;
			sap.ui.getCore().setModel(this.model);
		}
	},
	
	resetStateDisplayTypes : function() {
		this.recievedDisplayText = false;
		this.recievedDisplayPhoto = false;
		
	},

/**
 * Called when a controller is instantiated and its View controls (if available)
 * are already created. Can be used to modify the View before it is displayed,
 * to bind event handlers and do other one-time initialization.
 * 
 * @memberOf wlcpfrontend.views.VirtualDevice
 */
	onInit: function() {
		
		window.onbeforeunload = function() {
			return "Are you sure you want to leave this page? You will lose all unsaved data!";
		};
		
		this.getView().addEventDelegate({
			  onAfterRendering: function(){
				  if(!this.debugMode) {
						var navContainer = sap.ui.getCore().byId("virtualDevice--virtualDeviceNavContainer");
						navContainer.to(sap.ui.getCore().byId("virtualDevice--selectGameInstance"));
				  } else {
					    this.joinDebugGameInstance();
				  }
			  }
		}, this);
	},

/**
 * Similar to onAfterRendering, but this hook is invoked before the controller's
 * View is re-rendered (NOT before the first rendering! onInit() is used for
 * that one!).
 * 
 * @memberOf wlcpfrontend.views.VirtualDevice
 */
// onBeforeRendering: function() {
//
// },

/**
 * Called when the View has been rendered (so its HTML is part of the document).
 * Post-rendering manipulations of the HTML could be done here. This hook is the
 * same one that SAPUI5 controls get after being rendered.
 * 
 * @memberOf wlcpfrontend.views.VirtualDevice
 */
// onAfterRendering: function() {
//
// },

/**
 * Called when the Controller is destroyed. Use this one to free resources and
 * finalize activities.
 * 
 * @memberOf wlcpfrontend.views.VirtualDevice
 */
// onExit: function() {
//
// }

});