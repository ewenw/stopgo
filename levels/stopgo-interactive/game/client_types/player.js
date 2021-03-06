/**
* # Player type implementation of the game stages
* Copyright(c) 2017
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

    stager.setOnInit(function() {
        // Initialize the client.
        // Setup page: header + frame.
        var header = W.generateHeader();
        var frame = W.generateFrame();
        W.setHeaderPosition('top');

        var payoffs;
        var payoffTableA, payoffTableB;
        var redRowA, redRowB;
        var blueRowA, blueRowB;
        var tableClasses;

        var payoffStopRed, payoffStopBlue;

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
        payoffs = node.game.settings.payoffs;

        redRowA = ['Red', payoffs.GO.A.LEFT.RED, payoffs.GO.A.RIGHT.RED];
        blueRowA = ['Blue', payoffs.GO.A.LEFT.BLUE, payoffs.GO.A.RIGHT.BLUE];

        payoffTableA = new W.Table();
        payoffTableA.addRow(['', 'Left', 'Right']);
        payoffTableA.addRow(redRowA);
        payoffTableA.addRow(blueRowA);

        redRowB = ['Red', payoffs.GO.B.LEFT.RED, payoffs.GO.B.RIGHT.RED];
        blueRowB = ['Blue', payoffs.GO.B.LEFT.BLUE, payoffs.GO.B.RIGHT.BLUE];
        payoffTableB = new W.Table();
        payoffTableB.addRow(['', 'Left', 'Right']);
        payoffTableB.addRow(redRowB);
        payoffTableB.addRow(blueRowB);

        payoffStopRed = payoffs.STOP.RED;
        payoffStopBlue = payoffs.STOP.BLUE;

        tableClasses = 'table table-bordered';

        this.payoffTables = {};
        this.payoffTables.A = W.addClass(payoffTableA.parse(), tableClasses);
        this.payoffTables.B = W.addClass(payoffTableB.parse(), tableClasses);
        this.payoffStopRed = payoffStopRed;
        this.payoffStopBlue = payoffStopBlue;

        node.game.playerRole = null;
        node.game.redChoice = null;
        node.game.blueChoice = null;
        node.game.worldState = null;
        node.game.totalPayment = 0;

        // Additional debug information while developing the game.
        // this.debugInfo = node.widgets.append('DebugInfo', header)
    });

    stager.extendStep('instructions-light', {
        frame: 'instructions-light.htm',
        cb: function() {
            var startsIn, s;

            // Display time left middle of page.
            s = node.game.settings;
            startsIn = W.getElementById('game-starts-in');
            startsIn.innerHTML = Math.floor(s.TIMER['instructions-light']/1000);
            node.game.visualTimer.gameTimer.addHook({
                hook: function() {
                    startsIn.innerHTML = Math.floor(this.timeLeft/1000);
                },
                ctx: node.game.visualTimer.gameTimer,
                name: 'extraTimer'
            });
        },
        exit: function() {
            if (this.visualTimer) {
                this.visualTimer.gameTimer.removeHook('extraTimer');
            }
        }
    });

    stager.extendStep('red-choice', {
        donebutton: false,
        frame: 'stopgostep.htm', // change this name
        // role: function() { return this.role; },
        // partner: function() { return this.partner; },
        init: function() {
            node.game.redChoice = null;
        },
        roles: {
            RED: {
                timeup: function() {
                    var buttonId;
                    buttonId = Math.floor(Math.random() * 2) ? 'stop':'go';
                    W.getElementById(buttonId).click();
                },
                init: function() {
                    node.game.playerRole = 'RED';
                },
                done: function() {
                    var button;

                    button = W.getElementById('stop');
                    button.disabled = true;

                    button = W.getElementById('go');
                    button.disabled = true;
                },
                cb: function() {
                    var buttonStop, buttonGo, payoffTableDiv1;
                    var startTimer;
                    var payoffTable;

                    node.on.data('TABLE', function(message) {
                        node.game.worldState = message.data;
                        payoffTable = node.game
                                      .payoffTables[node.game.worldState];

                        W.show('red');
                        W.getElementById('payoff-table')
                        .appendChild(payoffTable);
                        W.setInnerHTML('world-state', node.game.worldState);
                        W.setInnerHTML('payoff-stop', node.game.payoffStopRed +
                                       ' ' +
                                       node.game.runningTotalPayoff.currency);

                        buttonStop = W.getElementById('stop');
                        buttonStop.disabled = false;

                        buttonGo = W.getElementById('go');
                        buttonGo.disabled = false;

                        buttonStop.onclick = function() {
                            node.game.redChoice = 'STOP';
                            node.done({ redChoice: node.game.redChoice });
                        };

                        buttonGo.onclick = function() {
                            node.game.redChoice = 'GO';
                            node.done({ redChoice: node.game.redChoice });
                        };

                        // Keep this comments for the moment!

                        // ISSUE.
                        //
                        // Loading the frame for the step is async.
                        // Then the step cb (this function) is executed.
                        //
                        // The TABLE message might arrive BEFORE or AFTER
                        // the frame has finished loading.
                        //
                        // CASE A:
                        // If it arrives BEFORE, it is actually unbuffered
                        // and emitted right before emitting PLAYING.
                        //
                        // When playing is emitted VisualTimer reads the options
                        // from the step and tries to configure itself.
                        //
                        // With the version of VisualTimer in the last git pull,
                        // if there are no options, VisualTimer sets itself to 0
                        // (regardless of the state of the timer), so it was
                        // killing the timer started in the TABLE cb (here).
                        // Now this is fixed, and if a timer is running is not
                        // stopped.
                        //
                        // CASE B:
                        // If it arrives AFTER the frame is loaded,
                        // PLAYING has already been emitted. In this
                        // case the code would have worked fine. BUT the
                        // measurament of the time spent on the step is not
                        // precise. Time passed starts from PLAYING until DONE,
                        // however here PLAYING is called before the full
                        // interface is loaded (after TABLE is emitted).

                        // Alternative solution for timer issue.
                        // Instead of adding a timer property to step.

                        return;
                        // Setup the timer.

                        startTimer = function() {
                            node.game.visualTimer.init({
                                milliseconds: node.game.settings['red-choice'],
                                timeup: function() {
                                    var redChoice;

                                    redChoice = Math.floor(Math.random() * 2) ?
                                    'STOP':'GO';

                                    node.game.redChoice = redChoice;

                                    node.done({redChoice: redChoice});
                                }
                            });
                            node.game.visualTimer.start();
                        };

                        if (node.game.getStageLevel() ===
                            node.constants.stageLevels.PLAYING) {
                            startTimer();
                        }
                        else {
                            node.once('PLAYING', function() {
                                startTimer();
                            });
                        }
                    });
                }
            },
            BLUE: {
                timer: null,
                init: function() {
                    node.game.playerRole = 'BLUE';
                },
                cb: function() {
                    var span;

                    W.show('blue');
                    W.addLoadingDots(W.getElementById('awaiting-red-decision'), 5);
                    // Make the observer display visible.

                    node.on.data('RED-CHOICE', function(message) {
                        node.game.redChoice = message.data;

                        // W.show('make-blue-decision');
                        // W.hide('awaiting-red-decision');
                        node.done();
                    });
                }
            }
        }
    });

    stager.extendStep('blue-choice', {
        donebutton: false,
        role: function() { return this.role; },
        partner: function() { return this.partner; },
        init: function() {
            node.game.blueChoice = null;
        },
        roles: {
            RED: {
                timer: null,
                cb: function() {
                    W.show('awaiting-blue-decision');
                    W.addLoadingDots(W.getElementById('awaiting-blue-decision'), 5);
                    W.hide('stop-go-buttons');
                    W.hide('make-your-choice');

                    W.setInnerHTML('red-decision', '<strong>Your choice: ' +
                                   node.game.redChoice + '.</strong>');

                    node.on.data('BLUE-CHOICE', function(message) {
                        node.game.blueChoice = message.data;
                        node.done();
                    });
                }
            },
            BLUE: {
                timeup: function() {
                    var buttonId;
                    buttonId = Math.floor(Math.random() * 2) ? 'left' : 'right';
                    W.getElementById(buttonId).click();
                },
                done: function() {
                    var button;

                    button = W.getElementById('left');
                    button.disabled = true;

                    button = W.getElementById('right');
                    button.disabled = true;
                },
                cb: function() {
                    var buttonLeft, buttonRight;
                    var startTimer;

                    W.show('make-blue-decision');
                    W.hide('awaiting-red-decision');

                    W.setInnerHTML('red-choice', node.game.redChoice);
                    W.show('red-choice');

                    buttonLeft = W.getElementById('left');
                    buttonLeft.disabled = false;

                    buttonRight = W.getElementById('right');
                    buttonRight.disabled = false;

                    W.getElementById('payoff-matrix-a')
                    .appendChild(node.game.payoffTables.A);
                    W.getElementById('payoff-matrix-b')
                    .appendChild(node.game.payoffTables.B);

                    W.setInnerHTML('payoff-stop-blue', this.payoffStopBlue +
                    ' ' + node.game.runningTotalPayoff.currency);

                    buttonLeft.onclick = function() {
                        node.game.blueChoice = 'LEFT';
                        node.done({blueChoice: node.game.blueChoice});
                    };

                    buttonRight.onclick = function() {
                        node.game.blueChoice = 'RIGHT';
                        node.done({blueChoice: node.game.blueChoice});
                    };
                }
            }
        }
    });

    stager.extendStep('results', {
        frame: 'results.htm',
        cb: function() {
            var payoffs, payment;
            var choices;
            var otherPlayerRole, otherPlayerChoice;
            var playerChoice;
            var playerColorClass, otherPlayerColorClass;
            var worldState;

            node.on.data('RESULTS', function(message) {
                payoffs = message.data.payoffs;
                choices = message.data.choices;
                worldState = message.data.world;

                otherPlayerRole = node.game.playerRole === 'RED' ?
                                  'BLUE' : 'RED';

                payment = payoffs[node.game.playerRole];
                playerChoice = choices[node.game.playerRole];
                otherPlayerChoice = choices[otherPlayerRole];

                node.game.totalPayment += payment;
                node.game.runningTotalPayoff.update(payment);

                playerColorClass = node.game.playerRole.toLowerCase();
                otherPlayerColorClass = otherPlayerRole.toLowerCase();

                W.setInnerHTML('player', node.game.playerRole);
                W.setInnerHTML('player-choice', playerChoice);
                W.addClass(W.getElementById('player'), playerColorClass);

                W.setInnerHTML('other-player', otherPlayerRole);
                W.addClass(W.getElementById('other-player'),
                           otherPlayerColorClass);

                W.setInnerHTML('other-player-choice',
                               otherPlayerChoice);

                W.setInnerHTML('payoff', payment + ' ' +
                node.game.runningTotalPayoff.currency);
                W.setInnerHTML('world-state', worldState);
            });
        }
    });
    //
    // stager.extendStep('end', {
    //     donebutton: false,
    //     frame: 'end.htm',
    //     cb: function() {
    //         node.game.visualTimer.setToZero();
    //
    //         W.setInnerHTML('total', node.game.totalPayment+
    //                        ' ' + node.game.runningTotalPayoff.currency);
    //         node.game.totalPayment = 0;
    //     },
    //     done: function() {
    //         node.game.runningTotalPayoff.money = 0;
    //         node.game.runningTotalPayoff.update(0);
    //     }
    // });

    stager.extendStep('end', {
        donebutton: false,
        frame: 'end.htm',
        widget: {
            name: 'EndScreen',
            root: "body",
            options: {
                title: false,
                showEmailForm: true
            }
        }
    });

    game = setup;
    game.plot = stager.getState();
    return game;
};
