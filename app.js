const cluster = require("cluster"),
      os      = require("os"),
      path    = require("path"),
      fs      = require("fs");

global.env = process.env.NODE_ENV || process.argv[2] || "development";
global.options = JSON.parse(fs.readFileSync("options.json","utf8"))[env];

if(env == 'production') {
	const log = console.log;
	require("callsite");
	console.log = function() {
		var pid = process.pid;
		var caller = path.relative(__dirname,__stack[1].getFileName())+':'+__stack[1].getLineNumber();
		return log.call(this,['[',pid,caller,']'].concat([].slice.call(arguments)).join(' '));
	};
}

if(options.cluster && cluster.isMaster) os.cpus().forEach(cluster.fork);
else {
	const duvet   = require("duvet"),
	      brow    = require("browserify"),
	      liveify = require("liveify"),
	      socket  = require("socket.io"),
	      uuid    = require("uuid"),
	      http    = require("http"),
	      server  = http.createServer(duvet.route.app),
	      io      = socket.listen(server);

	duvet.template.engines.html = {
		compile: function(src) {
			return function evaluate(data) {
				return src;
			};
		}
	}

	for(var p in duvet.route) if(duvet.route.hasOwnProperty(p)) {
		global[p] = duvet.route[p];
	}

	io.sockets.on('connection', function(socket) {
		var id = uuid.v4();
		socket.on('mouse', function(pos) {
			pos.id = id;
			socket.broadcast.emit('mouse', pos);
		});
		socket.on('disconnect', function() {
			socket.broadcast.emit('disconnect', id);
		})
	});

	ANY(true,function(i){this.started = Date.now(); return i;});

	GET('/', function() { return this.render('index') });
	GET('/res/', duvet.middleware.static('res'));
	GET('/app.js', function() {
		return {
			body: brow(['./client/main.ls']).transform('liveify').bundle({
				insertGlobalVars: {
					options: function() {
						return JSON.stringify(options)
					}
				}
			}),
			headers: {'content-type':'application/javascript'}
		}
	});

	duvet.route.Router.error = duvet.magic.async(function(err) {
		return this.render("500",{title: "FISSION MAILED",splash: false,stack: err.stack});
	});

	ANY(true,function(last) { switch(parseInt(last.statusCode)) {
		case 500: return this.render("500",{title: "FISSION MAILED",splash: false,stack: last.reason});
		case 404: return this.render("404",{title: "Not found",splash: false});
		default:  return last;
	}});
	ANY(true,function(last) {
		console.log(last.statusCode,this.pathname,(Date.now()-this.started)+"ms");
		return last;
	});

	var port = process.env.PORT || options.port;
	server.listen(port, function() {console.log("listening on",port)});
}