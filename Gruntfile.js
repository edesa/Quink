/*global module */
module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        clean: {
            production: ['prebuilt']
        },

        copy: {
            production: {
                files: [{
                    expand: true,
                    src: [
                        'editable.html',
                        'readonly.html',
                        'index.html',
                        'quink.html',
                        'quink/js/lib/require.js',
                        'quink/plugins/**',
                        'quink/resources/**',
                        '!quink/resources/css/**',
                        'quink/pluginadapters/**'
                    ],
                    dest: 'prebuilt'
                }]
            }
        },

        requirejs: {
            production: {
                options: {
                    baseUrl: 'quink/js',
                    mainConfigFile: 'quink/js/main.js',
                    name: 'main',
                    include: 'ext/PluginAdapterContext',
                    out: 'prebuilt/quink/js/main.js'
                }
            }
        },

        mkdir: {
            production: {
                options: {
                    create: ['prebuilt/quink/js']
                }
            }
        },

        cssmin: {
            production: {
                src: 'quink/resources/css/quink.css',
                dest: 'prebuilt/quink/resources/css/quink.css'
            }
        },

        uglify: {
            production: {
                files: {
                    'prebuilt/quink.js': ['quink.js']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-mkdir');
    grunt.loadNpmTasks('grunt-css');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', ['clean', 'copy', 'mkdir', 'requirejs', 'cssmin', 'uglify']);
};
