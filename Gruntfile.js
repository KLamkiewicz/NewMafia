module.exports = function(grunt) {
 
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      files: ['*.js', 'public/**/*.js', 'routes/**/*.js']
    },
    less: {
        development: {
            options: {
                paths: ["public/**"],
                yuicompress: true
            },
            files: {
                "public/stylesheets/game.css": "public/stylesheets/game.less",
				"public/stylesheets/login.css": "public/stylesheets/login.less",
				"public/stylesheets/register.css": "public/stylesheets/register.less",
				"public/stylesheets/index.css": "public/stylesheets/index.less",
        "public/stylesheets/rules.css": "public/stylesheets/rules.less"
            }
        }
    },
    watch: {
        files: ["public/stylesheets/*", "*.js", "public/**/*.js", 'routes/**/*.js'],
        tasks: ["less", "jshint"]
    }
  });
  // Each plugin must be loaded following this pattern
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('all', ['jshint:files']);
  grunt.registerTask('default', ['jshint', 'watch', 'less']);
};