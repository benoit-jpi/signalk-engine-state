const debug = require("debug")("signalk:signalk-perf-to-api");

/*

Signal K server plugin to set engine state.

Features :
- Modifiy the path "propulsion/main/state"

TODO:
- Apply the modification on an external event (e.g. physical switch change state)

*/


module.exports = function(app) => {
    const plugin = {};
    let unsubscribes = [];

    plugin.id = 'signalk-engine-state';
    plugin.name = 'Engine state';
    plugin.description = 'Sets engine state on a switch status';
    plugin.schema = {
	type: "object",
	title: "Sailboat engine status",
	description: "Sets engine state",
	properties: {
	    engine_path: {
		type: 'string',
		default: 'propulsion.main.state',
		title: 'Path used for checking engine state',
	    },
	    engine_state: {
		type: 'string',
		title: 'Engine state',
		default: 'started',
		enum: ['started', 'stopped'],
	    }
	}
    }

    const setStatus = app.setPluginStatus || app.setProviderStatus;

    plugin.start = function (options) => {
	const enginePath = options.engine_path || 'propulsion.main.state';
	const subscription = {
	    context: 'vessels.self',
	    subscribe: [
		{
		    path: enginePath,
		    period: 1000,
		}
	    ],
	};

	function setState(state) {
	    app.handleMessage(plugin.id, {
		context: `vessels.${app.selfId}`,
		updates: [
		    {
			source: {
			    label: plugin.id,
			},
			timestamp: (new Date().toISOString()),
			values: [
			    {
				path: options.engine_path || 'propulsion.main.state',
				value: state,
			    },
			],
		    },
		],
	    });
	    setStatus(`Detected engine state: ${state}`);
	}

	app.subscriptionmanager.subscribe(
	    subscription,
	    unsubscribes,
	    (subscriptionError) => {
		app.error(`Error:${subscriptionError}`);
	    },
	    (delta) => {
		if (!delta.updates) {
		    return;
		}
		delta.updates.forEach((u) => {
		    if (!u.values) {
			return;
		    }
		    u.values.forEach((v) => {
			if (v.path === powerPath && !options.use_chargingmode) {
			    if (v.value > 0) {
				setState('started');
				return;
			    }
			    setState('stopped');
			} else if (v.path === modePath && options.use_chargingmode) {
			    if (v.value == null) {
				return;
			    }
			    if (v.value === 'off' || v.value === 'OFF') {
				setState('stopped');
				return;
			    }
			    setState('started');
			}
		    });
		});
	    },
	);
	
	setStatus('Waiting for updates');
    };

    plugin.stop = () => {
	unsubscribes.forEach((f) => f());
	unsubscribes = [];
    };

    return plugin;
};
