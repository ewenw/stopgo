/**
 * # Bot type implementation of the game stages
 * Copyright(c) 2017 Stefano Balietti <ste@nodegame.org>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */

"use strict";

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var channel = gameRoom.channel;
    var logic = gameRoom.node;

    var game;
    game = {};
    game.nodename = 'bot';

    stager.setDefaultCallback(function() {
        var that;
        that = this;
        console.log('Stage: ' , that.getCurrentGameStage());
        that.node.timer.randomDone();
    });

    stager.extendStep('red-choice-tutorial', {
        roles: {
            RED: {
                cb: function() {
                    var that;
                    var randomDoneValue;
                    var chanceOfStop;
                    var isDynamic;

                    that = this;

                    isDynamic = (that.settings.botType === 'dynamic');

                    if (isDynamic && channel.numStopGoDecisions >= 1) {
                        chanceOfStop = channel.numChooseStop /
                                       channel.numStopGoDecisions;
                    }
                    else {
                        chanceOfStop = that.settings.chanceOfStop;
                    }

                    randomDoneValue = (getRandom(0, 1) <= chanceOfStop) ?
                        'STOP' : 'GO';

                    console.log('RED ROLE BOT:', that.node.player.id,
                                ', partner: ', that.partner);
                    console.log(randomDoneValue);

                    that.node.done(randomDoneValue);
                }
            },
            BLUE: {
                cb: function() {
                    var that;
                    that = this;

                    console.log('BLUE ROLE BOT:', that.node.player.id,
                                ', partner: ', that.partner);

                    that.node.once.data('RED-CHOICE', function() {
                        that.node.done();
                    });
                }
            }
        }
    });

    stager.extendStep('blue-choice-tutorial', {
        role: function() { return this.role; },
        partner: function() { return this.partner; },
        roles: {
            RED: {
                cb: function() {
                    var that;
                    that = this;

                    that.node.once.data('BLUE-CHOICE', function() {
                        that.node.done();
                    });
                }
            },
            BLUE: {
                cb: function() {
                    var that;
                    var randomDoneValue;
                    var chanceOfRight;
                    var isDynamic;

                    that = this;
                    isDynamic = (that.settings.botType === 'dynamic');

                    if (isDynamic && channel.numRightLeftDecisions >= 1) {
                        chanceOfRight = channel.numChooseRight /
                                        channel.numRightLeftDecisions;
                    }
                    else {
                        chanceOfRight = that.settings.chanceOfRight;
                    }

                    randomDoneValue = (getRandom(0, 1) <= chanceOfRight)  ?
                                      'RIGHT' : 'LEFT';

                    that.node.done(randomDoneValue);
                }
            }
        }
    });
    
    stager.extendStep('tutorial-end', {
        cb: function() {
            var that;

            that = this;
            that.node.done('tutorial-over');
            console.log('tutorial end');
        }
    });

    stager.extendStep('results-tutorial', {
        cb: function() {
            var that;

            that = this;
            that.node.done('tutorial-over');
            console.log('tutorial over');
        }
    });

    function getRandom(min, max) {
        return Math.random() * (max - min) + min;
    }

    game.plot = stager.getState();

    return game;
};
