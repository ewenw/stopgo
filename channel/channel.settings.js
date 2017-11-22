/**
 * # Channel settings
 * Copyright(c) 2016 brenste <myemail>
 * MIT Licensed
 *
 * The channel is divided into two internal servers: player and admin.
 * Each of those grants different privileges upon connection.
 *
 * Player and admin server share all options specified here. If custom
 * options for each server are needed, they can be specified inside the
 * `playerServer` and `adminServer` properties.
 *
 * Each server must define an 'endpoint' to which nodeGame clients
 * can connect. The default server endpoints are:
 *
 *   - player server: name of the game,
 *   - admin server: name of the game /admin
 *
 * http://www.nodegame.org
 * ---
 */
module.exports = {

    /**
     * ## name (string) Optional
     *
     * The name of the channel
     *
     * Default: the name of the game, as found in the package.json file.
     */
    // name: 'stopgo',

    /**
     * ## alias (string|array) Optional
     *
     * Alternative name/s for the channel
     *
     * By default, if 'gameName' is the name of the channel, files will
     * be served from the address: `http://myserver/gameName/`.
     * Here you can add aliases to enable urls like: `http://myserver/alias/`.
     *
     * Important! `node.connect()` in `public/js/index.js` still needs
     * to use the real channel name, so you might need to pass it explicitly:
     * `node.connect('/gameName').
     */
    // alias: [],

    /**
     * ## playerServer (object|string) Optional
     *
     * Set of custom options applying only to player server
     *
     * If string, it will be interpreted as the name oof the server
     * endpoint for socket.io player connections.
     *
     * If object, the endpoint must be specified in the _endpoint_ property.
     *
     * Default: name-of-the-channel
     */
    // playerServer: 'stopgo',

    /**
     * ## adminServer (object|string) Optional
     *
     * Set of custom options applying only to admin server
     *
     * If string, it will be interpreted as the name oof the server
     * endpoint for socket.io admin connections.
     *
     * If object, the endpoint must be specified in the _endpoint_ property.
     *
     * Default: name-of-the-channel/admin
     */
    // adminServer: 'stopgo/admin',

    /**
     * ## getFromAdmins (boolean) Optional
     *
     * If TRUE, players can invoke GET commands on admins
     *
     * Default: FALSE
     */
    getFromAdmins: true,

    /**
     * ## accessDeniedUrl (string) Optional
     *
     * Unauthorized clients will be redirected here.
     *
     * Default: "/pages/accessdenied.htm"
     */
    // accessDeniedUrl: 'unauth.htm',

    /**
     * ## notify (object) Optional
     *
     * Configuration options controlling what events are notified to players
     *
     * Default: player actions are notified to admins only.
     */
    notify: {

        // When a player connects / disconnects.
        onConnect: false,

        // When a player changes a stage / step.
        onStageUpdate: false,

        // When the 'LOADED' stageLevel is fired (useful to sync players)
        onStageLoadedUpdate: false,

        // When any change of stageLevel happens (e.g. INIT, CALLBACK_EXECUTED)
        // Notice: generates a lot of overhead of messages.
        onStageLevelUpdate: false,

    },


    /**
     * ## noAuthCookie (boolean) Optional
     *
     * If TRUE, a cookie with client ID is set even if authorization is off
     *
     * Set this option to TRUE, if the game uses views to render pages,
     * and the context callbacks require access to treatment-specific settings.
     *
     * Forces disconnections of multiple browser tabs.
     *
     * Default: FALSE
     */
    noAuthCookie: true,

    /**
     * ## enableReconnections (boolean) Optional
     *
     * If TRUE, only one TAB per browser will be allowed
     *
     * Default: FALSE
     */
    enableReconnections: true,

    /**
     * ### sameStepReconnectionOnly (boolean) Optional
     *
     * If TRUE, only reconnections in the same game step are allowed.
     *
     * Default: FALSE
     */
    // sameStepReconnectionOnly: false,

    /**
     * ### disposeFailedReconnections (boolean) Optional
     *
     * If TRUE, failed reconnections are disposed
     *
     * If FALSE, failed reconnections are treated as a new connection.
     *
     * A reconnection can fail for the following reasones:
     *
     * - Parameter `enabledReconnections` is FALSE.
     * - Parameter `sameStepReconnectionOnly` is TRUE, and the
     *      client's stage and the logic's stage are different.
     * - The room in which the client was at the moment of
     *      disconnection cannot be located.
     * - Any other error.
     *
     * Default: FALSE
     */
    // disposeFailedReconnections: true,

    /**
     * ### cacheMaxAge (number) Optional
     *
     * The duration in ms of the browser cache for public/ resources
     *
     * Default: 0 (no cache)
     */
    // cacheMaxAge: 360000,

    /**
     * ### sioQuery (boolean) Optional
     *
     * If TRUE, clients connecting via Socket.io can set own parameters
     *
     * Available parameters:
     *
     *  - clientType: sets the client type
     *  - startingRoom: sets the room in which the client will be placed first
     *
     * It is recommended to disable sioQuery in production
     *
     * Default: TRUE
     */
    // sioQuery: FALSE,

    // If TRUE, it will be the default channel of the server.
    // All the static files will be served from '/'.
    // The route `/channelName` will be disabled, while aliases,
    // if defined, will continue to work.
    // Important! Socket.io connection must still be established
    // with the right endpoint (e.g. /channelName).
    // Important! Other games might not be reachable any more.
    // Important! Server info query will be disabled.
    // defaultChannel: false

};
