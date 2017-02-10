/**
 * # Player type implementation of the game stages
 * Copyright(c) 2016 brenste <myemail>
 * MIT Licensed
 *
 * Each client type must extend / implement the stages defined in `game.stages`.
 * Upon connection each client is assigned a client type and it is automatically
 * setup with it.
 *
 * http://www.nodegame.org
 * ---
 */

'use strict';

var ngc = require('nodegame-client');
var stepRules = ngc.stepRules;
var constants = ngc.constants;
var publishLevels = constants.publishLevels;

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var game;

    stager.setDefaultStepRule(stepRules.SOLO);

    stager.setOnInit(function() {
        // Initialize the client.
        // Setup page: header + frame.
        var header = W.generateHeader();
        var frame = W.generateFrame();
        W.setHeaderPosition('top');

        var payoffTableA, payoffTableB;

        // Add widgets.
        this.visualRound = node.widgets.append('VisualRound', header);
        this.visualTimer = node.widgets.append('VisualTimer', header);
        this.runningTotalPayoff = node.widgets.append('MoneyTalks', header,
                                                      {currency: 'USD'});
        this.doneButton = node.widgets.append('DoneButton', header,
                                              {text: 'Done'});

        // node.player.stage.round

        // Add payoff tables
        node.game.totalPayoff = 0;
        var payoffs = node.game.settings.payoffs;

        payoffTableA = new W.Table();
        payoffTableA.addRow(['', 'Left', 'Right']);
        payoffTableA.addRow(['Red', payoffs.GO.A.LEFT.RED, payoffs.GO.A.RIGHT.RED]);
        payoffTableA.addRow(['Blue', payoffs.GO.A.LEFT.BLUE, payoffs.GO.A.RIGHT.BLUE]);

        payoffTableB = new W.Table();
        payoffTableB.addRow(['', 'Left', 'Right']);
        payoffTableB.addRow(['Red', payoffs.GO.B.LEFT.RED, payoffs.GO.B.RIGHT.RED]);
        payoffTableB.addRow(['Blue', payoffs.GO.B.LEFT.BLUE, payoffs.GO.B.RIGHT.BLUE]);

        var payoffStopRed = payoffs.STOP.RED;
        var payoffStopBlue = payoffs.STOP.BLUE;

        node.game.payoffTables = {};
        node.game.payoffTables.A = W.addClass(payoffTableA.parse(), 'table table-bordered');
        node.game.payoffTables.B = W.addClass(payoffTableB.parse(), 'table table-bordered');
        node.game.payoffStopRed = payoffStopRed;
        node.game.payoffStopBlue = payoffStopBlue;

        // Additional debug information while developing the game.
        // this.debugInfo = node.widgets.append('DebugInfo', header)

        node.game.tourRole = '';
        node.game.tourPay = 0;
        node.game.tourWorldState = '';

        node.game.infoText = 'This is only a tour of the game, not the actual game.';

        node.game.selectTourRole = function(role) {
            node.game.tourRole = role;
            // node.game.setRole(role, true);
            node.game.plot.setStepProperty(node.game.getNextStep(),
                                           'role', role);
            node.done({tourRole: role});
        };

        node.game.clickDone = function() {
            node.done({world: node.game.tourWorldState});
        };

        node.game.node.game.clickWrong = function() {
            alert('Please follow the instructions! Choose the specified selection.');
        };
    });

    stager.extendStep('choose-tour', { // why extend step not stage?
        donebutton: false,
        frame: 'choose-tour.htm',
        cb: function() {
            var redSelectButton;
            var blueSelectButton;

            redSelectButton = W.getElementById('tour-red-selection');
            blueSelectButton = W.getElementById('tour-blue-selection');

            redSelectButton.onclick = function() {
                node.game.selectTourRole('RED');
            };
            blueSelectButton.onclick = function() {
                node.game.selectTourRole('BLUE');
            };
        }
    });

    stager.extendStep('red-choice-tour', {
        frame: 'stopgostep.htm',
        init: function() {
            // save this value
            this.tourWorldState = Math.floor(Math.random() * 2) ? 'A' : 'B';
        },
        roles: {
            RED: {
                donebutton: false,
                done: function() {
                    W.show('waiting_for_blue');
                },
                cb: function() {
                    var roundNumber;
                    var tourChoices;
                    var correctButton, wrongButton;

                    roundNumber = node.game.getRound() - 1;
                    tourChoices = node.game.settings.tour[roundNumber];

                    W.setInnerHTML('info', node.game.infoText);
                    W.setInnerHTML('tour-instructions', 'Please choose <strong>' + tourChoices.RED + '</strong> below. In a normal game you could choose whatever you like.');
                    W.show('info');
                    W.show('tour-instructions');

                    W.show('red');
                    W.getElementById('payoff-table').appendChild(node.game.payoffTables[node.game.tourWorldState]);
                    W.setInnerHTML('state_of_world', node.game.tourWorldState);
                    W.setInnerHTML('payoff-stop', node.game.payoffStopRed + ' ' + node.game.runningTotalPayoff.currency);

                    if (tourChoices.RED === 'STOP') {
                        correctButton = W.getElementById('stop');
                        wrongButton = W.getElementById('go');
                    }
                    else {
                        correctButton = W.getElementById('go');
                        wrongButton = W.getElementById('stop');
                    }
                    correctButton.onclick = function() {
                        // Disable buttons.
                        correctButton.disabled = true;
                        wrongButton.disabled = true;

                        node.game.clickDone();
                        W.setInnerHTML('red-decision',
                                       'Your choice: ' + tourChoices.RED);
                    };
                    wrongButton.onclick = node.game.clickWrong;

                    correctButton.disabled = false;
                    wrongButton.disabled = false;
                }
            },
            BLUE: {
                cb: function() {
                    W.setInnerHTML('info', node.game.infoText);
                    W.setInnerHTML('tour-instructions', 'Click <strong>"Done"</strong> to recieve Blue\'s choice and the results. In a normal game, you would wait for the other player to make a selection (the "Done" button will be disabled).');

                    W.show('info');
                    W.show('tour-instructions');

                    W.show('blue');
                }
            }
        }
    });

    stager.extendStep('blue-choice-tour', {
        role: true,
        roles: {
            BLUE: {
                donebutton: false,
                cb: function() {
                    var roundNumber;
                    var tourChoices;

                    roundNumber = node.game.getRound() - 1;
                    tourChoices = node.game.settings.tour[roundNumber];

                    W.setInnerHTML('info', node.game.infoText);
                    W.setInnerHTML('tour-instructions', 'Please choose  <strong>' + tourChoices.BLUE + '</strong> below. In a normal game you could choose whatever you like.');
                    W.show('make-blue-decision');
                    W.hide('awaiting-red-decision');

                    W.setInnerHTML('red-choice', tourChoices.RED);

                    if (tourChoices.BLUE === 'LEFT') {
                        W.getElementById('left').onclick = node.game.clickDone;
                        W.getElementById('right').onclick = node.game.clickWrong;
                    }
                    else if (tourChoices.BLUE === 'RIGHT') {
                        W.getElementById('right').onclick = node.game.clickDone;
                        W.getElementById('left').onclick = node.game.clickWrong;
                    }

                    W.getElementById('payoff-matrix-a').appendChild(node.game.payoffTables.A);
                    W.getElementById('payoff-matrix-b').appendChild(node.game.payoffTables.B);

                    W.setInnerHTML('payoff-stop-blue', node.game.payoffStopBlue + ' ' + node.game.runningTotalPayoff.currency);
                }
            },
            RED: {
                cb: function() {
                    W.setInnerHTML('tour-instructions', 'Click  <strong>"Done"</strong> to recieve Blue\'s choice and the results. In a normal game, you would wait for the other player to make a selection (the "Done" button will be disabled).');
                }
            }
        }
    });

    stager.extendStep('results-tour', {
        frame: 'results.htm',
        cb: function() {
            var roundNumber;
            var tourChoices;
            var payoffs;
            var otherPlayerRole;
            var pay;

            roundNumber = node.game.getRound() - 1;
            tourChoices = node.game.settings.tour[roundNumber];
            payoffs = node.game.settings.payoffs;
            otherPlayerRole = node.game.tourRole === 'RED' ? 'BLUE' : 'RED';

            W.setInnerHTML('info', node.game.infoText);
            W.show('info');

            if (tourChoices.RED === 'GO') {
                console.log(payoffs);
                pay = payoffs.GO[node.game.tourWorldState][tourChoices.BLUE][node.game.tourRole];
            }
            else {
                pay = payoffs.STOP[node.game.tourRole];
            }

            console.log(pay, node.game);
            node.game.tourPay += pay;
            node.game.runningTotalPayoff.update(pay);

            W.setInnerHTML('player', node.game.tourRole);
            W.setInnerHTML('player-choice', tourChoices[node.game.tourRole].toUpperCase());
            W.addClass(W.getElementById('player'), node.game.tourRole === 'RED' ? 'red' : 'blue'); // just lowercase somehow later
            W.setInnerHTML('other-player', otherPlayerRole);
            W.addClass(W.getElementById('other-player'), node.game.tourRole === 'RED' ? 'blue' : 'red'); // just lowercase somehow later
            W.setInnerHTML('other-player-choice', tourChoices[otherPlayerRole]);
            W.setInnerHTML('payoff', pay + ' ' + node.game.runningTotalPayoff.currency);
            W.setInnerHTML('world-state', node.game.tourWorldState);

            // Sets the role again.
            node.game.plot.updateProperty(node.game.getNextStep(),
                                          'role', node.game.tourRole);
        }
    });

    stager.extendStep('tour-end', {
        frame: 'end.htm',
        done: function() {
            node.game.runningTotalPayoff.money = 0;
            node.game.runningTotalPayoff.update(0);

            node.say('tour-over');
        },
        cb: function() {
            W.setInnerHTML('info', node.game.infoText);
            W.show('info');
            W.setInnerHTML('total', node.game.tourPay + ' ' + node.game.runningTotalPayoff.currency);
        }
    });

    stager.extendStep('instructions', {
        frame: 'instructions.htm',
        cb: function() {
            W.setInnerHTML('payoff-stop', node.game.payoffStopRed + ' ' + node.game.runningTotalPayoff.currency);
            W.getElementById('payoff-matrix-a').appendChild(node.game.payoffTables.A);
            W.getElementById('payoff-matrix-b').appendChild(node.game.payoffTables.B);
        }
    });

    game = setup;
    game.plot = stager.getState();
    return game;
};
