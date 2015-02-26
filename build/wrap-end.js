
    // Wrong - but allows dynamic loading to work (the plugins) for now otherwise plugins
    // that call require won't load.
    window.require = require;
    return require('main');
}));
