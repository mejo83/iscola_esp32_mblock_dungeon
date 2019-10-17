/* 
 * Copyright ViksTech di Vittorio Domenico Padiglia.
 * Se non hai pagato per l'uso o la modifica di questi sorgenti, hai il dovere di cancellarli
 * Il possesso e l'uso, o la copia, di questo codice non consentito è punibile per legge.
 */


var help = {
    init: function () {
        $('body').append('<div style="position: fixed; top:0; right:0; width: 290px; height:200px"><a href="javascript: help.startGame();" class="btn btn-info">Start Game</a><a href="javascript: help.question();" class="btn btn-info">Question</a></div>')
    },
    startGame: function () {
        game.dispatchAction({"cmd": "newGameStarted"});
    },
    question: function () {
        game.dispatchAction({"cmd": "question"});
    }
}
help.init();