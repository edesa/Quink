
    // Wrong - but allows dynamic loading to work (the plugins) for now otherwise plugins
    // that call require won't load.
    // This breaks loading of design time snippets in ded.
    // window.require = require;
    return require('main');
}));
