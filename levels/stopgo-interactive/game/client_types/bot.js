/**
 * # Bot type implementation of the game stages
 * Copyright(c) 2017 Stefano Balietti <ste@nodegame.org>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */

"use strict";

var ngc = require('nodegame-client');

module.exports = function(treatmentName, settings, stager,
                          setup, gameRoom, node) {

    var channel = gameRoom.channel;
    var logic = gameRoom.node;
    var node;

    var game;
    game = {};
    game.nodename = 'bot';

    // var stager = ngc.getStager();

    stager.setDefaultCallback(function() {
        console.log('Stage: ' , this.getCurrentGameStage());
        node.timer.randomDone();
    });
    
    stager.setOnInit(function() {
        var payoffs;
        var payoffTableA, payoffTableB;
        var redRowA, redRowB;
        var blueRowA, blueRowB;
        var tableClasses;

        var payoffStopRed, payoffStopBlue;

        // Add payoff tables
        node.game.totalPayoff = 0;
        payoffs = node.game.settings.payoffs;

        payoffStopRed = payoffs.STOP.RED;
        payoffStopBlue = payoffs.STOP.BLUE;

        tableClasses = 'table table-bordered';

        this.payoffTables = {};

        node.game.playerRole = null;
        node.game.redChoice = null;
        node.game.blueChoice = null;
        node.game.worldState = null;
        node.game.totalPayment = 0;
    });

    stager.extendStep('red-choice', {
        roles: {
            RED: {
                cb: function() {
                    var decision;
                    var chanceOfStop;
                    var isDynamic;
                    var minDecisions;

                    minDecisions = this.settings.botChance.minDecisions;
                    isDynamic = (this.settings.botType === 'dynamic');

                    if (isDynamic && channel.numStopGoDecisions >= minDecisions) {
                        chanceOfStop = channel.numChooseStop
                                       / channel.numStopGoDecisions;
                    }
                    else {
                        chanceOfStop = this.settings.botChance.stop;
                    }

                    decision = (Math.random() <= chanceOfStop) ? 'STOP' : 'GO';

                    console.log('RED BOT:', node.player.id, ', partner: ',
                                this.partner, ', decision: ', decision);
                    node.done({ redChoice: decision });
                }
            },
            BLUE: {
                cb: function() {
                    var decision;
                    node.once.data('RED-CHOICE', function(msg) {
                        node.game.redChoice = msg.data;
                        node.done();
                    });
                }
            }
        }
    });

    stager.extendStep('blue-choice', {
        role: function() { return this.role; },
        partner: function() { return this.partner; },
        roles: {
            RED: {
                cb: function() {
                    node.once.data('BLUE-CHOICE', function(msg) {
                        node.game.blueChoice = msg.data;
                        node.done();
                    });
                },
                // Blues times up first, and will send data.
                timeup: null
            },
            BLUE: {
                cb: function() {
                    var decision;
                    var isDynamic;
                    var chanceOfRight;
                    var minDecisions;

                    isDynamic = (this.settings.botType === 'dynamic');
                    minDecisions = this.settings.botChance.minDecisions;

                    if (isDynamic && channel.numRightLeftDecisions >= minDecisions) {
                        chanceOfRight = channel.numChooseRight
                                       / channel.numRightLeftDecisions;
                    }
                    else {
                        chanceOfRight = this.settings.botChance.right;
                    }

                    decision = Math.random() > chanceOfRight ? 'LEFT' : 'RIGHT';
                    console.log('BLUE BOT:', node.player.id, ', partner: ',
                                this.partner, ', decision: ', decision);
                    node.done({ blueChoice: decision });
                }
            }
        }
    });

    game.plot = stager.getState();

    return game;
};
