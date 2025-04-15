const debug = require("debug")("signalk:signalk-engine-state");

/*

Signal K server plugin to set engine state.

Features :
- Modifiy the path "propulsion/main/state"

TODO:
- Apply the modification on an external event (e.g. physical switch change state)

*/

module.exports = function(app) {
    const plugin = {};

    plugin.id = 'sk-engine-state';
    plugin.name = 'Engine state';
    plugin.description = 'Sets engine state on a switch status';
    plugin.schema = {
	type: "object",
	title: "Sailboat engine status",
	description: "Sets engine state",
	properties: {
	    engine_state: {
		type: 'string',
		title: 'Engine state',
		default: 'started',
		enum: ['started', 'stopped'],
	    }
	}
    }

    const setStatus = app.setPluginStatus || app.setProviderStatus;
    const engineStatePath='propulsion.main.state';

    plugin.start = function (options) {

	function setState(state) {
	    app.handleMessage(plugin.id, {
		context: `vessels.${app.selfId}`,
		updates: [
		    {
			source: {
			    label: plugin.id,
			    talker: 'PG'
			},
			timestamp: (new Date().toISOString()),
			values: [
			    {
				path: engineStatePath,
				value: state
			    },
			],
		    },
		],
	    });
	}

	setState(options.engine_state);
	app.debug(`engine state change : ${options.engine_state}`);
    };

    plugin.stop = () => {
    };

    return plugin;
};
