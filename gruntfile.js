var chalk = require("chalk");

/* -------------------------------------------------------------------- */
/*

    morphthis - APK Resigner
    Copyright: Adrian David Smith 2016

*/
/* -------------------------------------------------------------------- */

module.exports = function(grunt){

  /* -------------------------------------------------------------------- */
  /*

      Config Init

  */
  /* -------------------------------------------------------------------- */
  grunt.initConfig({

    // read config files
    pkg: grunt.file.readJSON("package.json"),
    secret: grunt.file.readJSON("secret.json"),

    // rename files 
    rename: {
        apk: {
            src: "<%= secret.apk_path %>",
            dest: "apk/build/apk_zipped.zip"
        },
        meta_removed: {
            src: "apk/build/meta_removed.zip",
            dest: "apk/build/app-unsigned.apk"
        },
    },

    // execute shell commands
    exec: {
        apk_origunal_info: "keytool -list -printcert -jarfile <%= secret.apk_path %>",
        keystore_info: "keytool -list -keystore <%= secret.keystore_path %> -storepass <%= secret.keystore_password %> -alias <%= secret.alias_name %>",
        apk_new_signed_info: "keytool -list -printcert -jarfile apk/build/app-unsigned.apk",
        zip_align: "<%= secret.zip_align_path %> -v 4 apk/build/app-unsigned.apk apk/build/app-signed.apk",
        apk_sign: "jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -storepass <%= secret.keystore_password %> -keystore <%= secret.keystore_path %> apk/build/app-unsigned.apk <%= secret.alias_name %>",
        npm_update: "npm update"
    },

    // copy files
    copy: {
        apk: {
            files: [
              {expand: true, src: ["<%= secret.apk_path %>"], dest: "apk/backup", filter: "isFile"},
            ],
        },
    },

    // unzip files
    unzip: {
        "apk/build/apk_unzipped": "apk/build/apk_zipped.zip"
    },

    // delete files and folders
    clean: {
        meta_inf: ["apk/build/apk_unzipped/META-INF"],
        apk_unzipped_folder: ["apk/build/apk_unzipped/"],
        apk_zipped_file: ["apk/build/apk_zipped.zip"],
        apk_folder: ["apk/"],
        
    },

    // compress or zip files
    compress: {
        meta_removed: {
            options: {
                archive: "apk/build/meta_removed.zip",
                mode: "zip"
            },
            files: [
                {expand: true, cwd: "apk/build/apk_unzipped", src: "**" }
            ]
        }
    },

    // interactive prompt
    prompt: {
        target: {
            options: {
                questions: [
                  {
                      config: "open_prompt.config",
                      type: "list",
                      message: "Select Task To Run",
                      default: "Sign APK",
                      choices: ["Sign APK","Clean Build", "Update Packages", "Configuration", "APK Info", "Keystore Info"]
                  }
                ]
            }
        },
    },
    
    open: {
        apk:{
            path: "./apk/build/"
        },
        config:{
            path: "secret.json"
        }
    }

  });

  /* -------------------------------------------------------------------- */
  /*

      Tasks

  */
  /* -------------------------------------------------------------------- */
  grunt.registerTask("default", function(){

      grunt.task.run("ascii");
      grunt.task.run("prompt");
      grunt.task.run("post_prompt");

  });
  
  // wrapper for running task from the selected prompt
  grunt.registerTask("post_prompt", function(){

      var choice = grunt.config("open_prompt.config");

      if (choice === "Sign APK"){

          // Clean The Build
          grunt.task.run("clean:apk_folder");
          grunt.task.run("sign");

      }

      if (choice === "Clean Build"){

          grunt.task.run("clean:apk_folder");
          grunt.task.run("default");

      }

      if (choice === "Update Packages"){

          grunt.task.run("exec:npm_update");
          grunt.task.run("default");

      }
      
      if (choice === "APK Info"){

          grunt.task.run("apk_info");
          grunt.task.run("default");
      }
      
      if (choice === "Keystore Info"){

          grunt.task.run("keystore_info");
          grunt.task.run("default");

      }

      if (choice === "Configuration"){

          grunt.task.run("open_configuration");

      }

  });

  // core for signing the apk
  grunt.registerTask("sign", function(){

      // load the task timer
      require("time-grunt")(grunt);

      // PROCESS:
      // copy the APK
      // rename the file extention from APK to ZIP
      // extract the contents
      // delete the META-INF folder
      // zip or compress the contents
      // rename from ZIP to APK
      // use the keytool to sign the APK
      // zip align the newly signed APK

      grunt.task.run("apk_info");
      grunt.task.run("keystore_info");
      grunt.task.run("apk_copy");
      grunt.task.run("apk_rename_to_zip");
      grunt.task.run("apk_unzip");
      grunt.task.run("apk_delete_meta");
      grunt.task.run("apk_compress");
      grunt.task.run("apk_compress_rename");
      grunt.task.run("apk_sign");
      grunt.task.run("apk_signed_info");
      grunt.task.run("apk_zip_align");
      grunt.task.run("clean_build_contents");
      grunt.task.run("show_done");
      grunt.task.run("display_image");

  });

  // task for displaying the name of the system
  grunt.registerTask("ascii", function(){

      var message = "\n███╗   ███╗ ██████╗ ██████╗ ██████╗ ██╗  ██╗████████╗██╗  ██╗██╗███████╗\n";
      message += "████╗ ████║██╔═══██╗██╔══██╗██╔══██╗██║  ██║╚══██╔══╝██║  ██║██║██╔════╝\n";
      message += "██╔████╔██║██║   ██║██████╔╝██████╔╝███████║   ██║   ███████║██║███████╗\n";
      message += "██║╚██╔╝██║██║   ██║██╔══██╗██╔═══╝ ██╔══██║   ██║   ██╔══██║██║╚════██║\n";
      message += "██║ ╚═╝ ██║╚██████╔╝██║  ██║██║     ██║  ██║   ██║   ██║  ██║██║███████║\n";
      message += "╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚══════╝\n";
      message += "                                                              - SierraII\n";
      
      var show = chalk.green.bold(message);

      grunt.log.writeln(show);

  });



  // display the currently selected Keystore information
  grunt.registerTask("keystore_info", function(){

      var message = chalk.yellow.bold.underline("Displaying Current Keystore Information.");
      grunt.log.writeln(message);

      grunt.task.run("exec:keystore_info");
    
  });

  // clean the whole build directory
  grunt.registerTask("clean_build_contents", function(){

      var message = chalk.yellow.bold.underline("Cleaning Build Contents.");
      grunt.log.writeln(message);

      grunt.task.run("clean:apk_unzipped_folder");
      grunt.task.run("clean:apk_zipped_file");

  });

  // display a message indicating the process if finished
  grunt.registerTask("show_done", function(){

      grunt.log.writeln("");

      var message = chalk.green.bold("Done!");
      var path = chalk.green.bold("Your Newly Signed APK Can Be Found In apk/build/apk-signed.apk");

      grunt.log.ok(message);
      grunt.log.ok(path);

  });

  // display an image to the user
  grunt.registerTask("display_image", function(){

      var done = this.async();
      var pictureTube = require("picture-tube");
      var tube = pictureTube();
      var fs = require("fs");

      tube.pipe(process.stdout);
      fs.createReadStream("config/logo.png").pipe(tube);
      
      done(grunt.task.run("post_process"));

  });

  // all tasks after that needs to happen after the dispay_image task goes within this wrapper
  grunt.registerTask("post_process", function(){

      grunt.task.run("open_location");

  });

  // open the location of the APK
  grunt.registerTask("open_location", function(){

      var message = chalk.yellow.bold.underline("Opening Build Folder.");
      grunt.log.writeln(message);

      grunt.task.run("open:apk");

  });

  // open the location of the config
  grunt.registerTask("open_configuration", function(){

      var message = chalk.yellow.bold.underline("Opening Secret Configuration.");
      grunt.log.writeln(message);

      grunt.task.run("open:config");

  });

  grunt.loadTasks("modules");

  /* -------------------------------------------------------------------- */
  /*

      NPM Load Tasks

  */
  /* -------------------------------------------------------------------- */
  grunt.loadNpmTasks("grunt-rename");
  grunt.loadNpmTasks("grunt-exec");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-zip");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-compress");
  grunt.loadNpmTasks("grunt-prompt");
  grunt.loadNpmTasks("grunt-open");

};