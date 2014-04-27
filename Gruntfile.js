module.exports = function(grunt) {
 
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      files: ['JS/**/*.js']
    },
    less: {
        development: {
            options: {
                paths: ["Assets/LESS"],
                yuicompress: true
            },
            files: {
                "Assets/CSS/style.css": "Assets/LESS/style.less"
            }
        }
    },
    watch: {
        files: ["Assets/LESS/*", "JS/**/*.js"],
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