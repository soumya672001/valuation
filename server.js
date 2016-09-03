#!/bin/env node
//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');
var bodyParser = require("body-parser"); 

/**
 *  Define the sample application.
 */
var SampleApp = function() {

    //  Scope.
    var self = this;


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };


    /**
     *  Populate the cache.
     */
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = { 'index.html': '' };
        }

        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./index.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function(key) { return self.zcache[key]; };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
        self.routes = { };

        self.routes['/polvalue'] = function(req, res) {
            var valuemock = {
                    "policy": req.query.policy,
                    "valuation": req.query.policy / 3
                  }
                if(!req.query.policy) {
                    return res.send({"status": "error", "message": "missing policy no."});
                } else {
                	res.setHeader('Content-Type', 'application/json');
                    return res.send(valuemock);
                }
            };

            self.routes['/policyvalue'] = function(req, res) {
            	// default to a 'localhost' configuration:
            	var connection_string = '127.0.0.1:27017/valuation';
            	// if OPENSHIFT env variables are present, use the available connection info:
            	if(process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
            	  connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
            	  process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
            	  process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
            	  process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
            	  process.env.OPENSHIFT_APP_NAME;
            	}
            	var mongojs = require('mongojs');
            	var db = mongojs(connection_string, ['policy']);
            	var policies = db.collection('policy');
            	// similar syntax as the Mongo command-line interface
            	// log each of the first ten docs in the collection
            	var retJson;
           // 	db.policies.find({first_name: req.query.first_name}, {last_name: req.query.last_name}).forEach(function(err, doc) {
                if(!req.query.first_name) {
                    return res.send({"status": "error", "message": "missing name."});
                 } else {
                	 res.setHeader('Content-Type', 'application/json'); 
                 	policies.find({"first_name": req.query.first_name, "last_name": req.query.last_name}).forEach(function(err, doc) {  
                  	  if (err) throw err;
                  	  if (doc) { console.log(doc.policies);
                  		  		 console.dir(doc);
                  	             retJson = JSON.stringify(doc.policies);
                  	             console.log(retJson);
                  	           return res.send(retJson);}
                  	  else {return res.send(null);}
                  	}); 
        //        	res.setHeader('Content-Type', 'application/json');
        //            return res.send(retJson);
                }
            };

            self.routes['/authenticate'] = function(req, res) {
            	// default to a 'localhost' configuration:
            	var connection_string = '127.0.0.1:27017/valuation';
            	// if OPENSHIFT env variables are present, use the available connection info:
            	if(process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
            	  connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
            	  process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
            	  process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
            	  process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
            	  process.env.OPENSHIFT_APP_NAME;
            	}
            	var mongojs = require('mongojs');
            	var db = mongojs(connection_string, ['login']);
            	var logins = db.collection('login');
            	// similar syntax as the Mongo command-line interface
            	// log each of the first ten docs in the collection
            	var retJson;
           // 	db.policies.find({first_name: req.query.first_name}, {last_name: req.query.last_name}).forEach(function(err, doc) {
                if(!req.query.username) {
                    return res.send({"status": "error", "message": "missing username."});
                 } else {
                	 res.setHeader('Content-Type', 'application/json'); 
                 	logins.findone({"username": req.query.username, "password": req.query.password}, function(err, doc) {  
                  	  if (err) throw err;
                  	  if (doc) { console.log(doc.logins);
                  		  		 console.dir(doc);
                  	             retJson = {
                  	                    "authorization_code": 1234567890,
                  	                    "custid": doc.custid
                  	                  };
                  	             console.log(retJson);
                  	           console.log(JSON.stringify(doc.logins));
                  	           return res.send(retJson);}
                  	  else {
                  		  res.writeHead(404);
                  		  return res.send(null);}
                  	}); 
        //        	res.setHeader('Content-Type', 'application/json');
        //            return res.send(retJson);
                }
            };
       
            self.routes['/session'] = function(req, res) {
            	// default to a 'localhost' configuration:
            	var connection_string = '127.0.0.1:27017/valuation';
            	// if OPENSHIFT env variables are present, use the available connection info:
            	if(process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
            	  connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
            	  process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
            	  process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
            	  process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
            	  process.env.OPENSHIFT_APP_NAME;
            	}
            	var mongojs = require('mongojs');
            	var db = mongojs(connection_string, ['session']);
            	var sessions = db.collection('session');
            	// similar syntax as the Mongo command-line interface
            	// log each of the first ten docs in the collection
           // 	db.policies.find({first_name: req.query.first_name}, {last_name: req.query.last_name}).forEach(function(err, doc) {
                if(!req.query.psid) {
                    return res.send({"status": "error", "message": "missing psid."});
                 } else {
                	 res.setHeader('Content-Type', 'application/json'); 
                 	sessions.save({"psid": req.query.psid, "custid": req.query.custid});
                 	res.end();
        //        	res.setHeader('Content-Type', 'application/json');
        //            return res.send(retJson);
                }
            };    
        
        self.routes['/'] = function(req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('index.html') );
        };
    };


    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.createRoutes();
        self.app = express();
        self.app.use(bodyParser.json());
        self.app.use(bodyParser.urlencoded({ extended: true }));

        //  Add handlers for the app (from the routes).
        for (var r in self.routes) {
            self.app.get(r, self.routes[r]);
        }
    };


    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };

};   /*  Sample Application.  */



/**
 *  main():  Main code.
 */
var zapp = new SampleApp();
zapp.initialize();
zapp.start();

