sap.ui.controller("wlcpfrontend.controllers.CreateLoadGame", {
	
	/**
	 * This function is called when the Create Game Button is pressed
	 * on the Create Load Game Dialog that shows when the editor is
	 * first loaded.
	 */
	createGamePressed : function() {
		sap.ui.getCore().byId("createLoadGame").close();
		sap.ui.getCore().byId("createLoadGame").destroy();
		sap.ui.xmlfragment("wlcpfrontend.fragments.GameEditor.CreateGame", sap.ui.controller("wlcpfrontend.controllers.CreateLoadGame")).open();
	},
	
	/**
	 * This function is called when the Load Game Button is pressed
	 * on the Create Load Game Dialog that shows when the editor is
	 * first loaded.
	 */
	loadGame : function() {
		
	},
	
	getMaxPlayer : function (max, teamCount) {
		  return Math.floor(max / teamCount);
		},
		
	onPlayerChange: function (oEvent) {
		
		var playerCount = GameEditor.getEditorController().newGameModel.PlayersPerTeam;
		var teamCount = GameEditor.getEditorController().newGameModel.TeamCount;
		
		var maxPlayerValue = this.getMaxPlayer(9, teamCount)
		if(playerCount > maxPlayerValue){
			GameEditor.getEditorController().newGameModel.PlayersPerTeam = playerCount - 1;
			sap.m.MessageBox.error("For " + teamCount +" Team, Player count cannot be greater than "+ maxPlayerValue + " each");
		}
			
	},
	
			
	onTeamChange: function (oEvent) {
					
		var playerCount = GameEditor.getEditorController().newGameModel.PlayersPerTeam;
		var teamCount = GameEditor.getEditorController().newGameModel.TeamCount;
			
		var maxPlayerValue = this.getMaxPlayer(9, teamCount)
		if(playerCount > maxPlayerValue){
			GameEditor.getEditorController().newGameModel.TeamCount = teamCount - 1;
			sap.m.MessageBox.error("For " + teamCount +" Team, Player count cannot be greater than "+ maxPlayerValue + " each");
		}
			
	},
	
	
	cancelCreateLoadGame : function() {
		sap.ui.getCore().byId("createLoadGame").close();
		sap.ui.getCore().byId("createLoadGame").destroy();
	},
	
	/**
	 * This is called when the create button is pressed on the Create Game
	 * Dialog. If it succeeds, createGameSuccess will be called.
	 */
	createGame : function() {
		if(!GameEditor.getEditorController().newGameModel.GameId.match(/^[a-zA-Z]+$/)) {
			sap.m.MessageBox.error("a-z upper case and lower case only game name");
			return;
		}
		ODataModel.getODataModel().create("/Games", GameEditor.getEditorController().newGameModel, {success : this.createGameSuccess, error: this.createGameError});
	},
	
	loadGame : function() {
		var gameToLoad = "";
		if(sap.ui.getCore().byId("userLoadGameComboBox").getSelectedKey() != "" && sap.ui.getCore().byId("publicLoadGameComboBox").getSelectedKey() != "") {
			sap.m.MessageBox.error("You cannot load both a personal and public game at the same time! Please select one!");
			return;
		} else if(sap.ui.getCore().byId("userLoadGameComboBox").getSelectedKey() != "") {
			gameToLoad = sap.ui.getCore().byId("userLoadGameComboBox").getSelectedKey();
		} else if(sap.ui.getCore().byId("publicLoadGameComboBox").getSelectedKey() != "") {
			gameToLoad = sap.ui.getCore().byId("publicLoadGameComboBox").getSelectedKey();
		} else {
			sap.m.MessageBox.error("Please select a game to load!");
			return;
		}
		var filters = [];
		filters.push(new sap.ui.model.Filter({path: "GameId", operator: sap.ui.model.FilterOperator.EQ, value1: gameToLoad}));
		ODataModel.getODataModel().read("/Games", {filters : filters, success : this.loadGameSuccess, error: this.loadGameError});
		this.cancelLoadGame();
	},
	
	/**
	 * Called when the user wants to cancel creating a game.
	 * They will be returned to main editor screen with all controls disabled
	 * except for the main toolbar.
	 */
	cancelCreateGame : function() {
		sap.ui.getCore().byId("createGame").close();
		sap.ui.getCore().byId("createGame").destroy();
	},
	
	cancelLoadGame : function() {
		sap.ui.getCore().byId("loadGame").close();
		sap.ui.getCore().byId("loadGame").destroy();
	},
	
	/**
	 * Called if the game has been created in the back end successfully.
	 * The game editors or game managers model will be updated accordingly.
	 * The dialog will be closed and a success message shown.
	 */
	createGameSuccess : function(oSuccess) {
		GameEditor.getEditorController().resetEditor();
		if(GameEditor.getEditor() != null) {
			GameEditor.getEditorController().gameModel.GameId = GameEditor.getEditorController().newGameModel.GameId;
			GameEditor.getEditorController().gameModel.TeamCount = GameEditor.getEditorController().newGameModel.TeamCount;
			GameEditor.getEditorController().gameModel.PlayersPerTeam = GameEditor.getEditorController().newGameModel.PlayersPerTeam;
			GameEditor.getEditorController().gameModel.Visibility = GameEditor.getEditorController().newGameModel.Visibility;
			GameEditor.getEditorController().gameModel.StateIdCount = GameEditor.getEditorController().newGameModel.StateIdCount;
			GameEditor.getEditorController().gameModel.TransitionIdCount = GameEditor.getEditorController().newGameModel.TransitionIdCount;
			GameEditor.getEditorController().gameModel.ConnectionIdCount = GameEditor.getEditorController().newGameModel.ConnectionIdCount;
			GameEditor.getEditorController().gameModel.Username = oSuccess.Username;
			GameEditor.getEditorController().newGameModel.GameId = "";
			GameEditor.getEditorController().newGameModel.TeamCount = 3;
			GameEditor.getEditorController().newGameModel.PlayersPerTeam = 3;
			GameEditor.getEditorController().newGameModel.Visibility = true;
			GameEditor.getEditorController().newGameModel.StateIdCount = 0;
			GameEditor.getEditorController().newGameModel.TransitionIdCount = 0;
			GameEditor.getEditorController().newGameModel.ConnectionIdCount = 0;
			GameEditor.getEditorController().initNewGame();
		}
		sap.ui.getCore().byId("createGame").close();
		sap.ui.getCore().byId("createGame").destroy();
		sap.m.MessageToast.show("Game Created Successfully!");
	},
	
	loadGameSuccess : function(oData) {
		GameEditor.getEditorController().resetEditor();
		GameEditor.getEditorController().gameModel.GameId = oData.results[0].GameId;
		GameEditor.getEditorController().gameModel.TeamCount = oData.results[0].TeamCount;
		GameEditor.getEditorController().gameModel.PlayersPerTeam = oData.results[0].PlayersPerTeam;
		GameEditor.getEditorController().gameModel.Visibility = oData.results[0].Visibility;
		GameEditor.getEditorController().gameModel.StateIdCount = oData.results[0].StateIdCount;
		GameEditor.getEditorController().gameModel.TransitionIdCount = oData.results[0].TransitionIdCount;
		GameEditor.getEditorController().gameModel.ConnectionIdCount = oData.results[0].ConnectionIdCount;
		GameEditor.getEditorController().gameModel.Username = oData.results[0].Username;
		GameEditor.getEditorController().load();
	},
	
	loadGameError : function() {
		sap.m.MessageBox.error("There was an error loading the game.");
	},
	
	/**
	 * If an error occurs creating the game in the back end
	 * and error message will be shown.
	 */
	createGameError : function(oError) {
		sap.m.MessageBox.error("There was an error creating the game. Make sure the name does not already exist!");
	}
});