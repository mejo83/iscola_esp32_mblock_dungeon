// Create a client instance
var cid = new Date();
cid = cid.getMilliseconds();
var clientBroker = {
    client: null,
    config: {
        clientHost: 'broker.vikstech.com',
        clientPath: '',
        clientPort: 9001,
        clientUser: '',
        clientPassword: '',
        clientTopic: '',
        clientId: "user_" + cid
    },
    actions: {
        onConnectionLost: function (responseObject) {
            if (responseObject.errorCode !== 0) {
                console.log("Connessione con il Broker MQTT persa: :" + responseObject.errorMessage);
            }
        },
        onMessageArrived: function (message) {
            try {
                let data = JSON.parse(message.payloadString);
                game.dispatchAction(data);
            } catch (e) {
                console.log('Errore pacchetto ricevuto', e);
            }
        },
        onConnect: function () {
            console.log("Connected to MQTT Broker");
        },
        onFail: function (e) {
            console.log("Errore di connessione al Broker MQTT", e);
            alert('Errore di connessione al Broker MQTT');
        },
        sendMsg: function (msg) {
            if (!clientBroker.config.clientTopic)
                return alert('Non sei collegato a nessuna partita');
            message = new Paho.MQTT.Message(msg);
            message.destinationName = clientBroker.config.clientTopic;
            clientBroker.client.send(message);
        },
        setTopic: function (topic) {
            clientBroker.config.clientTopic = topic;
            clientBroker.client.subscribe(clientBroker.config.clientTopic);
        }
    },
    init: function () {
        clientBroker.client = new Paho.MQTT.Client(clientBroker.config.clientHost, clientBroker.config.clientPort, clientBroker.config.clientPath, clientBroker.config.clientId);
        // clientBroker.client = new Paho.Client(clientBroker.config.clientHost, clientBroker.config.clientPort, clientBroker.config.clientPath, clientBroker.config.clientId);
        clientBroker.client.onConnectionLost = clientBroker.actions.onConnectionLost;
        clientBroker.client.onMessageArrived = clientBroker.actions.onMessageArrived;
        clientBroker.client.connect({
            invocationContext: {host: clientBroker.config.clientHost, port: clientBroker.config.clientPort, path: clientBroker.client.path, clientId: clientBroker.config.clientId},
            timeout: 3,
            keepAliveInterval: 60,
            cleanSession: true,
            useSSL: true,
            reconnect: true,
            //  mqttVersion: 3,
            userName: clientBroker.config.clientUser,
            password: clientBroker.config.clientPassword,
            onSuccess: clientBroker.actions.onConnect,
            onFailure: clientBroker.actions.onFail
        });
    }
}

var game = {
    tpls: {
        show: function (a) {
            $('#stage').html(a);
        },
        init: function () {
            let tpls = ['startGameButton', 'initNewGame', 'gameStarted', 'initNewGame2Step', 'question', 'goodStillAlive', 'badStillAlive', 'gameOver', 'victory'];
            for (let i in tpls) {
                game.tpls[tpls[i]] = $('#' + tpls[i]).clone();
                $('#' + tpls[i]).remove();
            }
        }
    },
    init: function () {
        game.tpls.init();
        $.getJSON('questions.json', function (resp) {
            game.config.questions = game.volatileData.questionsRemain = resp;
            game.tpls.show(game.tpls.startGameButton);
        })
    },
    status: {
        addStatus: function (status) {
            game.status.history.push(status);
            game.status.actual = status;
        },
        history: [],
        actual: null
    },
    volatileData: {
        livesLost: 0,
        goodAnswer: [],
        badAnswer: [],
        questionsRemain: [],
        answers: 0
    },
    config: {
        maxLives: 10,
        answersForWin: 2,
        questions: []
    },
    dispatchAction: function (data) {
        if (!data.hasOwnProperty('cmd'))
            return;
        if (!data.hasOwnProperty('robotId'))
            data.robotId = 'asda';
        switch (data.cmd) {
            case "newGameWaitToStart":
                game.status.addStatus('waitRobotToStart');
                console.log('Dispositivo ' + data.robotId + ' in attesa della pressione sul pulsante.');
                break;
            case "newGameStarted":
                if (game.status.actual === 'waitRobotToStart') {
                    console.log('Premuto tasto di start sul dispositivo ' + data.robotId + ' avvio il gioco');
                    game.status.addStatus('gameStarted');
                    clientBroker.actions.sendMsg(JSON.stringify({"cmd": "gameStartedAck", "robotId": data.robotId}));
                    game.status.addStatus('gameStarted');
                } else {
                    console.log('Premuto tasto di start sul dispositivo ' + data.robotId + ' con gioco gia avviato.. lascio perdere');
                }
                break;
            case "gameStartedAck":
                game.status.addStatus('gameStartedAck');
                console.log('Ho inviato il messaggio al dispositivo ' + data.robotId + ' adesso dovrebbe iniziare a camminare')
                game.tpls.show(game.tpls.gameStarted);
                break;
            case "question":
                console.log('Richiesta domanda per ambito ' + data.ambit + ' dal dispositivo ' + data.robotId);
                if (!game.actions.checkIfIsAlive()) {
                    // vite finite
                    console.log('vite finite')
                    return;
                }

                if (game.status.actual === 'gameStarted' || game.status.actual === 'gameStartedAck' || game.status.actual === 'question') { // unici stati accettati per porre una domanda
                    let question = game.actions.getQuestion();
                    if (question == null) {
                        console.log('Richiesta domanda ma domande terminate.. gameover');
                        return game.actions.gameOver('Non ci sono altre domande!');
                    }
                    game.status.addStatus('question');
                    game.actions.showQuestion(question);

                } else {
                    console.log('Stato errato', game.status.actual);

                }
                break;
        }
        console.log(data);
    },
    actions: {
        checkIfWin: function () {
            if (game.volatileData.answers == game.config.answersForWin) {
                game.actions.victory();
                return true;
            }
            return false;
        },
        checkIfIsAlive: function () {
            if (game.volatileData.livesLost == game.config.maxLives)
            {
                console.log('Ha finito le vite.. non posso continuare');
                game.actions.gameOver('Vite Terminate!');
                return false;
            }
            return true;
        },
        getQuestionById: function (id) {
            for (let i in game.config.questions) {
                if (parseInt(game.config.questions[i].id) == parseInt(id)) {
                    return i;
                }
            }
            return null;
        },
        setAsCorrectAnswer: function (idQuestion) {
            game.volatileData.answers++;
            game.volatileData.goodAnswer.push(idQuestion);
            if (!game.actions.checkIfWin()) {
                game.actions.showGoodAnswer();
            }
        },
        setAsBadAnswer: function (idQuestion) {
            game.volatileData.answers--;
            game.volatileData.badAnswer.push(idQuestion);
            game.volatileData.livesLost++;

            if (!game.actions.checkIfIsAlive()) {
                // vite finite             
            } else {
                game.actions.showBadAnswer();
            }
        },
        answerToQuestion: function (idAnswer, idQuestion) {
            let questionId = game.actions.getQuestionById(idQuestion);
            console.log(questionId, idAnswer, idQuestion);
            if (game.config.questions[questionId]['type'] === 'free') {
                let answer = $('#questionAnswer').val();
                if (answer.trim().toLowerCase() == game.config.questions[questionId].right.trim().toLowerCase())
                {
                    game.actions.setAsCorrectAnswer(idQuestion);
                } else {
                    game.actions.setAsBadAnswer(idQuestion);
                }
            } else {
                if (parseInt(idAnswer) == parseInt(game.config.questions[questionId].right))
                {
                    game.actions.setAsCorrectAnswer(idQuestion);
                } else {
                    game.actions.setAsBadAnswer(idQuestion);
                }
            }
        },
        getQuestion: function () {
            if (!game.config.questions.length || !game.volatileData.questionsRemain.length) {
                return null;
            }
            let i = Math.round(Math.random() * game.volatileData.questionsRemain.length)
            if (!game.volatileData.questionsRemain.hasOwnProperty(i))
                return game.actions.getQuestion();

            let q = game.volatileData.questionsRemain[i];

            let updateQuestion = [];
            for (let o in game.volatileData.questionsRemain) {
                if (o != i)
                    updateQuestion.push(game.volatileData.questionsRemain[o]);
            }
            game.volatileData.questionsRemain = updateQuestion;
            return q;
        },
        victory: function () {
            game.status.addStatus('victory');
            clientBroker.actions.sendMsg(JSON.stringify({"cmd": "victory"}));
            let tpl = $(game.tpls.victory)[0].outerHTML;
            tpl = tpl.replace('{goodAnswer}', game.volatileData.goodAnswer.length);
            tpl = tpl.replace('{badAnswer}', game.volatileData.badAnswer.length);
            tpl = tpl.replace('{totAnswer}', game.volatileData.badAnswer.length + game.volatileData.goodAnswer.length);
            game.tpls.show(tpl);
        },
        gameOver: function (motive) {
            motive = motive || '';
            game.status.addStatus('gameOver');
            clientBroker.actions.sendMsg(JSON.stringify({"cmd": "gameOver"}));
            let tpl = $(game.tpls.gameOver)[0].outerHTML;
            tpl = tpl.replace('{goodAnswer}', game.volatileData.goodAnswer.length);
            tpl = tpl.replace('{badAnswer}', game.volatileData.badAnswer.length);
            tpl = tpl.replace('{totAnswer}', game.volatileData.badAnswer.length + game.volatileData.goodAnswer.length);
            game.tpls.show(tpl);
        },
        showNewGame: function () {
            game.tpls.show(game.tpls.initNewGame);
        },
        startNewGame: function () {
            let robotID = $('#robotID').val();
            if (!robotID)
                return alert('Devi necessariamente inserire il codice del tuo Robot per iniziare a giocare!');
            clientBroker.actions.setTopic('iscola/dungeon/' + robotID);
            clientBroker.actions.sendMsg(JSON.stringify({"cmd": "newGameWaitToStart", "robotId": robotID}));
            game.tpls.show(game.tpls.initNewGame2Step);


        },
        showGoodAnswer: function () {
            game.tpls.show(game.tpls.goodStillAlive);


            console.log('Risposta valida, invio messaggio al robot');
            clientBroker.actions.sendMsg(JSON.stringify({"cmd": "goodResponse"}));
        },
        showBadAnswer: function () {
            game.tpls.show(game.tpls.badStillAlive);

            console.log('Risposta sbagliata, invio messaggio al robot');
            clientBroker.actions.sendMsg(JSON.stringify({"cmd": "badResponse"}));
        },
        showQuestion: function (question) {
            let tpl = $(game.tpls.question)[0].outerHTML;
            tpl = tpl.replace('{title}', question.text);

            let description = '';
            if (question.type == 'free') {
                description = '<p class="row text-center" ><input type="text" id="questionAnswer" style="width:94%; color:black;"/></p><br/><a  class="button-game" style="width: 100%;" href="javascript:game.actions.answerToQuestion(null,' + question.id + ')"><span class="button-game-bg-left"></span><span class="button-game-bg-mid"><span>Invia</span></span><span class="button-game-bg-right"></span></a>';
                /* $('#btn-text').html('Invia');
                 $('#btn-text').attr('href', "javascript:game.actions.answerToQuestion(0," + question.id + ")");*/
            } else {
                let buttons = ['<ul class="unstyled">'];
                for (let i in question.answers) {
                    if (question.answers[i].text) {
                        buttons.push('<li><a  class="button-game" style="width: 100%;" href="javascript:game.actions.answerToQuestion(' + question.answers[i].id + ',' + question.id + ')"><span class="button-game-bg-left"></span><span class="button-game-bg-mid"><span>' + question.answers[i].text + '</span></span><span class="button-game-bg-right"></span></a></li>');
                    }
                }
                buttons.push('</ul>');
                description = buttons.join(' ');
            }

            tpl = tpl.replace('{description}', description);
            game.tpls.show(tpl);

        }
    }
}

clientBroker.init();
game.init();






