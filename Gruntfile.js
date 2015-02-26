/*global module */
module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        banner: '/**\n' +
            ' * <%= pkg.name %>\n' +
            ' *\n' +
            ' * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.\n' +
            ' * <%= pkg.licenses[0].url %>\n' +
            ' */\n',

        /**
         * The text plugin has to be in place for the require.js optimiser to work but isn't needed
         * at runtime because the resources it handles are inlined by the optimiser.
         */
        clean: {
            all: ['prebuilt'],
            text: ['prebuilt/quink/js/lib/text.js']
        },

        copy: {
            all: {
                files: [{
                    expand: true,
                    src: [
                        'editable.html',
                        'readonly.html',
                        'index.html',
                        'quink.html',
                        'quink/plugins/**',
                        'quink/resources/**',
                        '!quink/resources/css/**',
                        'quink/pluginadapters/**',
                        'examples/html/**'
                    ],
                    dest: 'prebuilt'
                }]
            },
            /**
             * The expanded version of the libs are used in dev. For a build the minified versions are copied
             * across and renamed to match the dev versions so that the require.js paths work.
             * Minified libs must have names that follow a <foo>[.-]min.js pattern.
             */
            libs: {
                files: [{
                    expand: true,
                    cwd: 'quink/js/lib',
                    src: [
                        '*[\\.-]min.js'
                    ],
                    dest: 'prebuilt/quink/js/lib/',
                    rename: function (dest, src) {
                        return dest + src.replace(/[\.\-]min/, '');
                    }
                }]
            }
        },

        /**
         * Run the requirejs optimiser creating a build that includes all the libraries plus the source
         * within the one file. This saves ded and other quink users from having to manually include the
         * quink dependencies.
         */
        requirejs: {
            all: {
                options: {
                    baseUrl: 'quink/js',
                    mainConfigFile: 'quink/js/main.js',
                    name: 'main',
                    include: ['lib/almond', 'ext/PluginAdapterContext'],
                    stubModules: ['text'],
                    preserveLicenseComments: false,
                    out: 'prebuilt/quink/js/main.js',
                    wrap: {
                        'startFile': 'build/wrap-start.js',
                        'endFile': 'build/wrap-end.js'
                    }
                    // optimize: 'none'
                }
            }
        },

        /**
         * Don't include the libs in the built app. Libs are handled separately. The text plugin has to be
         * present for the build to work which is why it's handled differently.
         * In order to make the quink.js bootstrap file have exactly the same banner as the built app don't
         * use the src banners. The banner will be appended in a separate step after the app is built.
         */
        // requirejs: {
        //     all: {
        //         options: {
        //             baseUrl: 'quink/js',
        //             name: 'main',
        //             include: ['ext/PluginAdapterContext', 'lib/almond'],
        //             out: 'prebuilt/quink/js/main.js',
        //             paths: {
        //                 jquery: 'empty:',
        //                 rangy: 'empty:',
        //                 textrange: 'empty:',
        //                 cssapplier: 'empty:',
        //                 Underscore: 'empty:',
        //                 text: 'lib/text',
        //                 resources: '../resources'
        //             },
        //             stubModules: ['text'],
        //             preserveLicenseComments: false,
        //             wrap: {
        //                 'startFile': 'build/wrapstart.frag',
        //                 'endFile': 'build/wrapend.frag'
        //             },
        //             optimize: 'none'
        //         }
        //     }
        // },

        cssmin: {
            all: {
                src: 'quink/resources/css/quink.css',
                dest: 'prebuilt/quink/resources/css/quink.css'
            }
        },

        uglify: {
            all: {
                options: {
                    banner: '<%= banner %>'
                },
                files: {
                    'prebuilt/quink.js': ['quink.js']
                }
            }
        },

        /**
         * Ensures that the built app has the same banner as the bootstrap.
         */
        concat: {
            options: {
                banner: '<%= banner %>'
            },
            all: {
                src: ['prebuilt/quink/js/main.js'],
                dest: 'prebuilt/quink/js/main.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-css');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask('default', ['clean:all', 'copy:all', 'requirejs', 'concat', 'cssmin', 'uglify', 'clean:text']);

    // grunt.registerTask('default', ['clean:all', 'copy:all', 'copy:libs', 'requirejs', 'concat', 'cssmin', 'uglify', 'clean:text']);
};
