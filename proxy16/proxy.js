
var _ = require('lodash')
var fs = require('fs');
const fsPromises = require('fs/promises');
var path = require('path');

const { performance } = require('perf_hooks');
////////////
var f = require('./functions');
var svgCaptcha = require('svg-captcha');

/*
var WSS = require('./wss.js');
const Firebase = require('../proxy/firebase');
*/
var os = require('os');
var Server = require('./server/https.js');
var WSS = require('./server/wss.js');
var Firebase = require('./server/firebase.js');
var TranslateApi = require('./server/translateapi.js');
var NodeControl = require('./node/control.js');
var NodeManager = require('./node/manager.js');
var TorControl = require('./node/torcontrol.js');
var Pocketnet = require('./pocketnet.js');
var Wallet = require('./wallet/wallet.js');
var Remote = require('./remotelight.js');
var Proxies = require('./proxies.js');
var Exchanges = require('./exchanges.js');
var Peertube = require('./peertube/index.js');
var Bots = require('./bots.js');
var SystemNotify = require('./systemnotify.js');
var Notifications = require('./node/notifications')
var Transports = require("./transports")
var Applications = require('./node/applications');
var bitcoin = require('./lib/btc16.js');
var Slidemodule = require("./slidemodule")
const Path = require("path");
const child_process = require("child_process");
const {unlink} = require("nedb/browser-version/browser-specific/lib/storage");

process.setMaxListeners(0);
require('events').EventEmitter.defaultMaxListeners = 0
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var Proxy = function (settings, manage, test, logger, reverseproxy) {
	var self = this;

		self.test = test
		self.reverseproxy = reverseproxy

	var server = new Server(settings.server, settings.admins, manage);
	var wss = new WSS(settings.admins, manage);
	var pocketnet = new Pocketnet();
	var nodeControl = new NodeControl(settings.node, self);
	var translateapi = new TranslateApi(settings.translateapi, self)
	var nodeManager = new NodeManager(settings.nodes);
	var firebase = new Firebase(settings.firebase);
	var wallet = new Wallet(settings.wallet);
	var remote = new Remote();
	var proxies = new Proxies(settings.proxies)
	var exchanges = new Exchanges()
	var peertube = new Peertube(self)
	var bots = new Bots(settings.bots)
	var systemnotify = new SystemNotify(settings.systemnotify)
	var slidemodule = new Slidemodule(settings.slide)
	slidemodule.init()
	var notifications = new Notifications()

	var torapplications = new TorControl(settings.tor, self)

	var transports = new Transports();

	var dump = {}

	self.userDataPath = null
	self.session = 'pocketnetproxy' //f.makeid()

	logger.setapp(self)

	f.mix({
		transports, torapplications,
		wss, server, pocketnet, nodeControl,
		remote, firebase, nodeManager, wallet,
		proxies, exchanges, peertube, bots,
		systemnotify, notifications,
		logger,
		translateapi,
		proxy: self
	})

	var stats = [];
	var statcount = 100;
	var statInterval = null;

	var captchas = {};
	var captchaip = {};

	var addStats = function () {

		var data = {
			time: f.now(),
			info: self.kit.info(true)
		}

		stats.push(data)

		var d = stats.length - statcount

		if (statcount / d > 10) {
			stats = stats.slice(d)
		}
	}

	var getStats = function (n) {

		if (n) {
			return f.lastelements(stats, 500)
		}

		return stats
	}

	var ini = {
		ssl: function (def) {
			var s = settings.server.ssl || {}
			var sslsettings = {}

			sslsettings.key = s.keypath || s.key
			sslsettings.cert = s.certpath || s.cert
			sslsettings.passphrase = s.passphrase


			////default
			if (def){
				sslsettings.key = s.key
				sslsettings.cert = s.cert
				sslsettings.passphrase = 'password'
			}

			var options = {};

			if (!sslsettings.key || !sslsettings.cert || typeof sslsettings.passphrase == 'undefined') return {

			}

			try {
				options = {
					key: fs.readFileSync(f.path(sslsettings.key)),
					cert: fs.readFileSync(f.path(sslsettings.cert)),
					passphrase: sslsettings.passphrase || ''
				}
			}
			catch (e) {
				options = {}
			}

			return options;

		}
	}

	self.authorization = {

		dummy: function () {
			return true
		},

		parsesignature : function(nonce){
			var ch = nonce.split(',')
			var obj = {}

			_.each(ch, function(p){
				var ch2 = p.split('=')

				if(!ch2[1] || !ch2[0]) return

				obj[ch2[0]] = ch2[1]
			})

			return obj
		},

		signatureid : function(signature){
			if (signature.v){
				var sn = this.parsesignature(signature.nonce)

				if(!sn.date || !sn.exp || !sn.s) return false

				if(f.now().getTime() > f.date.addseconds(new Date(Number(sn.date)), sn.exp).getTime()){
					return false
				}

				var s = f.hexDecode(sn.s)

				if (s != self.session) return false
			}

			return true
		},

		signature: function (data) {

			delete data.A
			delete data.U

			if (data.signature) {

				if(!self.authorization.signatureid(data.signature)) return false

				var authorized = self.pocketnet.kit.authorization.signature(data.signature)

				if (authorized) {

					data.U = data.signature.address

					if (_.indexOf(settings.admins, data.U) > -1 && data.signature.v) data.A = true

					return true
				}
			}

			return false


		},

		signaturelight: function (data) {

			delete data.A
			delete data.U

			if (data.signature) {

				if(!self.authorization.signatureid(data.signature)) return false

				var authorized = self.pocketnet.kit.authorization.signature(data.signature)

				if (authorized) {

					data.U = data.signature.address

					if (_.indexOf(settings.admins, data.U) > -1) data.A = true

					return true
				}
			}

			return true


		}
	}


	self.users = function () {

		var i = {
			wss: self.wss.info(true)
		}

		var count = Math.max(f.deep(i, 'wss.users') || 1)

		if (count < 1) count = 1

		return count

	}

	self.server = {

		init: function () {

			if (settings.server.enabled) {

				return server.init({

					ssl: ini.ssl(),
					port: f.deep(settings, 'server.ports.https')

				}).catch(e => {

					logger.w('system', 'warn', 'SSL Settings Error', e)


					return server.init({
						ssl: ini.ssl('default'),
						port: f.deep(settings, 'server.ports.https')
					})

				})

			}

			return Promise.resolve()

		},

		destroy: function () {
			return server.destroy()
		},

		re: function () {
			return this.destroy().then(r => {
				this.init()
			})
		},

		rews: function () {
			return self.server.re().then(r => {
				return self.wss.re()
			}).then(r => {

				return self.firebase.re()

			}).catch(e => {

				return Promise.reject(e)
			})
		},

		info: function (compact) {
			return server.info(compact)
		},

		get export() {
			return server.export()
		},

	}

	self.bots = {
		add: function (address) {
			return bots.add(address)
		},
		remove: function (address) {
			return bots.remove(address)
		},
		get: function () {
			return bots.get()
		},
		init: function () {
			return bots.init()
		}
	}

	self.notifications = {
		init: function () {
			return notifications.init(self, firebase, nodeManager);
		},

		info: function () {
			return notifications.info()
		},

		destroy: function () {
		}
	}

	self.wallet = {

		testkey: function (i) {
			return manage.get.testkey(i)
		},

		events: function () {
			wallet.clbks.error.queue.main = function (e, p) {
			}

			wallet.clbks.error.ini.main = function (e, p) {
			}
		},

		init: function () {
			return wallet.init()
		},

		inited: function () {
			return wallet.init()
		},

		addqueue: function (key, address, ip) {
			return wallet.kit.addqueue(key, address, ip)
		},


		destroy: function () {
			return wallet.destroy()
		},
		removeKey: function (key) {
			return wallet.kit.removeKey(key)
		},
		setPrivateKey: function (key, private) {
			return wallet.kit.setPrivateKey(key, private)
		},

		clearexecuting: function () {
			return wallet.kit.clearexecuting()
		},

		apply: function (key) {
			return wallet.kit.apply(key)
		},

		re: function () {
			return this.destroy().then(r => {
				this.init()
			})
		},

		info: function () {
			return wallet.info()
		},


		sendwithprivatekey: function ({ address, amount, key }) {
			return wallet.kit.sendwithprivatekey(address, amount, key)
		}
	}

	self.systemnotify = {

		init: function () {

			if (!settings.systemnotify) return Promise.reject('settings.systemnotify')

			return systemnotify.init(settings.systemnotify.bot).then(r => {
				return systemnotify.setparameters(settings.systemnotify.parameters)
			})

		},

		destroy: function () {
			return systemnotify.destroy()
		},

		re: function () {
			return this.destroy().then(r => {
				this.init()
			})
		},

		info: function (compact) {
			return systemnotify.info(compact)
		}
	}

	self.wss = {

		init: function () {

			if (settings.server.enabled) {

				return wss.init({
					ssl: ini.ssl(),
					port: f.deep(settings, 'server.ports.wss')
				})

			}

			return Promise.resolve()
		},

		sendtoall: function (message) {
			return wss.sendtoall(message)
		},

		destroy: function () {
			return wss.destroy()
		},

		re: function () {
			return this.destroy().then(r => {
				this.init()
			})
		},

		info: function (compact) {
			return wss.info(compact)
		},

		wssdummy: function (wssdummy) {
			wss.wssdummy(wssdummy)
		},

		sendlogs: function(d){
			wss.sendlogs(d)
		},

		closeall : function(){
			var e = wss.closeall()

			if (e){
				return Promise.reject(e)
			}

			return Promise.resolve('success')
		}
	}

	self.nodeControl = {

		enable: function (v) {
			return nodeControl.kit.enable(v)
		},

		init: function () {
			return nodeControl.init()
		},

		destroy: function () {
			return nodeControl.destroy()
		},

		start: function () {
			return nodeControl.kit.start()
		},

		stop: function () {
			return nodeControl.kit.stop()
		},

		check: function () {
			return nodeControl.kit.check()
		},

		canstop: function () {
			return nodeControl.kit.canstop()
		},

		detach: function () {
			return nodeControl.kit.detach()
		},

		re: function () {
			return this.destroy().then(r => {
				return this.init()
			})
		},

		get request() {
			return nodeControl.request
		},

		get kit() {
			return nodeControl.kit
		},

		info: function () {
			return nodeControl.info()
		},


	}

	self.torapplications = {
		init: function () {
			return torapplications.init()
		},

		settingChanged: function(settings){
			return torapplications.settingChanged(settings)
		},

		info: (compact) => {
			return torapplications.info(compact);
		},

		destroy: () => {
			return torapplications.destroy();
		},

		remove: () => {
			return torapplications.remove();
		},

		install: () => {
			return torapplications.installManual();
		},

		reinstall: () => {
			return torapplications.reinstall();
		}
	}

	const axiosTransport = (...args) => transports.axios(...args);
	axiosTransport.get = (...args) => transports.axios.get(...args);
	axiosTransport.post = (...args) => transports.axios.post(...args);
	axiosTransport.put = (...args) => transports.axios.put(...args);
	axiosTransport.delete = (...args) => transports.axios.delete(...args);
	axiosTransport.patch = (...args) => transports.axios.patch(...args);

	self.transports = {
		fetch: async (url, opts)=>{
			return transports.fetch(url, opts)
		},

		axios: axiosTransport,

		request: (option, callback)=>{
			return transports.request(option, callback)
		},

		isAltTransportSet: (url) => {
			return transports.isTorNeeded(url);
		},
	}

	///
	self.nodeManager = {
		init: function () {
			return nodeManager.init()
		},

		inited: function () {
			return nodeManager.info().inited
		},

		destroy: function () {
			return nodeManager.destroy()
		},

		reservice: function () {
			return nodeManager.reservice()
		},

		re: function () {
			return this.destroy().then(r => {
				this.init()
			})
		},
		info: function (compact) {
			return nodeManager.info(compact)
		},

		chain : function(){
			return nodeManager.currentChainCommon2()
		}
	}

	self.firebase = {
		init: function () {

			return firebase.init(settings.firebase)
		},

		destroy: function () {
			return firebase.destroy()
		},

		re: function () {
			return this.destroy().then(r => {
				this.init()
			})
		},

		info: function (compact) {
			return firebase.info(compact)
		},

		get kit() {
			return firebase.kit
		},
	}

	self.exchanges = {
		init: function () {
			return exchanges.init()
		},

		destroy: function () {
			return exchanges.destroy()
		},

		re: function () {
			return this.destroy().then(r => {
				this.init()
			})
		},

		get kit() {
			return exchanges.kit
		},
	}

	self.translateapi = {
		settingChanged : function(settings){
			translateapi.settingChanged(settings)
		}
	}

	var trustpeertube = []

	self.peertube = {
		init: function () {

			trustpeertube = []

			var ins = {
				1: [
				  	{ host: 'pocketnetpeertube1.nohost.me', cantuploading: true, ip: '109.226.245.120', offline: true },
					{ host: 'pocketnetpeertube2.nohost.me', cantuploading: true, ip: '94.73.223.24', offline: true },
					{ host: 'peertube.archive.pocketnet.app', cantuploading: true, ip: '178.217.159.221'},
				],
				5: [
				  {
					host: 'pocketnetpeertube5.nohost.me',
					cantuploading: true,
					ip: '95.217.209.217',
					offline: true,
				  },
				  {
					host: 'pocketnetpeertube7.nohost.me',
					cantuploading: true,
					ip: '188.187.45.218',
					offline: true,
				  },
				  { 
					host: 'peertube.archive.pocketnet.app',
					cantuploading: true,
					ip: '178.217.159.221'
				  },

				],
				6: [
				  {
					host: 'pocketnetpeertube4.nohost.me',
					cantuploading: true,
					ip: '135.181.108.193',
					offline: true,
				  },
				  {
					host: 'pocketnetpeertube6.nohost.me',
					cantuploading: true,
					ip: '159.69.127.9',
					offline: true,
				  },
				  { 
					host: 'peertube.archive.pocketnet.app',
					cantuploading: true,
					ip: '178.217.159.221'
				  },
				],
				8: [
				  {
					host: 'pocketnetpeertube8.nohost.me',
				    offline: true,
					cantuploading: true,
					old : true,

					ip: '192.236.161.131',
				  },
				  {
					host: 'pocketnetpeertube9.nohost.me',
					cantuploading: true,
					ip: '178.154.200.50',
					offline: true,					
				  },
				  { 
					host: 'peertube.archive.pocketnet.app',
					cantuploading: true,
					ip: '178.217.159.221'
				  },
				],

				10: [
				  {
					host: 'pocketnetpeertube10.nohost.me',
					cantuploading: true,
					offline: true,					
					ip: '23.254.226.253',
				  },
				  {
					host: 'pocketnetpeertube11.nohost.me',
					cantuploading: true,
					ip: '84.252.138.108',
					offline: true,					
				  },
				  { host: 'peertube.archive.pocketnet.app', cantuploading: true, ip: '178.217.159.221'},
				],

				12: [
				  {
					host: 'bastyonmma.pocketnet.app',
					cantuploading: true,
					ip: '88.99.34.74',
					offline: true,					
				  },
				  {
					host: 'bastyonmma.nohost.me',
					cantuploading: true,
					ip: '49.12.231.72',
					offline: true,
				  },
				  { host: 'peertube.archive.pocketnet.app', cantuploading: true, ip: '178.217.159.221'},
				],

				13: [
				  { 
					host: '01rus.nohost.me',
					ip: '178.217.159.227',
					offline: true,
				  },
				  { 
					host: '02rus.pocketnet.app',
					ip: '31.184.215.67',
					offline: true,
				  },
				  { host: 'peertube.archive.pocketnet.app', cantuploading: true, ip: '178.217.159.221'},
				],

				14: [
				  { host: 'pocketnetpeertube12.nohost.me', ip: '104.168.248.113', offline: true, },
				  { host: 'pocketnetpeertube13.nohost.me', ip: '62.84.115.93', offline: true, },
				  { host: 'peertube.archive.pocketnet.app', cantuploading: true, ip: '178.217.159.221'},
				],

				15: [
					{
						host: 'peertube14.pocketnet.app',
						ip: '178.154.251.235',
						offline: true,
					},
					{
						host: 'peertube15.pocketnet.app',
						ip: '192.236.199.174',
						offline: true,
					},
					{ host: 'peertube.archive.pocketnet.app', cantuploading: true, ip: '178.217.159.221'},
				],

				16: [
					{
						host : 'poketnetpeertube.space',
						cantuploading: true,

						old : true,
						ip: '178.217.155.168',
						offline: true,
					},
					{
						host : 'poketnetpeertube.ru',
						cantuploading: true,

						old : true,
						ip: '178.217.159.224',
						offline: true,
					}
				],


				17: [
					{
						host : 'bastynode.ru',
						cantuploading: true,

						old : true,
						ip: '81.23.152.91',
						offline: true,
					},
					{
						host : 'storemi.ru',
						cantuploading: true,

						old : true,
						ip: '93.100.117.108',
						offline: true,
					},
				],

				18: [
					{
						host : 'bastynode1.ru',
						cantuploading: true,

						old : true,
						ip: '81.23.151.94',
						offline: true,
					},
					{
						host : 'gf110.ru',
						cantuploading: true,

						old : true,
						ip: '46.175.123.16',
						offline: true,
					},
				],

				19: [
					{
						host : 'bastyonpeertube.ru',
						cantuploading: true,
						ip: '178.217.155.169',
						offline: true,
					},
					{
						host : 'bastyonpeertube.site',
						cantuploading: true,
						ip: '178.217.155.170',
						offline: true,
					},

				],

				20: [
					{
						host : 'peertube17.pocketnet.app',
						ip: '51.250.104.218',
					}
				],

				21: [
					{
						host : 'peertube18.pocketnet.app',
						ip: '51.250.41.252',
						offline: true,
					},
					{ host: 'peertube.archive.pocketnet.app', cantuploading: true, ip: '178.217.159.221'},
				],

				22: [
					{
						host : 'peertube19.pocketnet.app',
						ip: '51.250.73.97',
					}
				],

				23: [
					{
						host : 'peertube17mirror.pocketnet.app',
						ip: '64.235.40.47',
						cantuploading: true,
						offline: true,
					},
					{ host: 'peertube.archive.pocketnet.app', cantuploading: true, ip: '178.217.159.221'},
				],

				24: [
					{
						host : 'peertube18mirror.pocketnet.app',
						ip: '64.235.42.75 ',
						cantuploading: true,
						offline: true,
					},
					{ host: 'peertube.archive.pocketnet.app', cantuploading: true, ip: '178.217.159.221'},
				],

				25: [
					{
						host : 'peertube19mirror.pocketnet.app',
						ip: '64.235.50.17',
						cantuploading: true,
						offline: true,
					},
					{ host: 'peertube.archive.pocketnet.app', cantuploading: true, ip: '178.217.159.221'},
				],

				26: [
					{
						host : 'peertube20.pocketnet.app',
						ip: '157.90.240.231',
						offline: true,
					},
					{ host: 'peertube.archive.pocketnet.app', cantuploading: true, ip: '178.217.159.221'},
				],

				27: [
					{
						host : 'peertube21.pocketnet.app',
						ip: '116.203.16.185',
						offline: true,
					},
					{ host: 'peertube.archive.pocketnet.app', cantuploading: true, ip: '178.217.159.221'},
				],

				28: [
					{
						host : 'peertube22.pocketnet.app',
						ip: '104.168.136.179',
						cantuploading: true,
						offline: true,
					},
					{ host: 'peertube.archive.pocketnet.app', cantuploading: true, ip: '178.217.159.221'},
				],

				29: [
					{
						host : 'peertube23.pocketnet.app',
						ip: '23.254.201.237',
						cantuploading: true,
						offline: true,
					},
					{ host: 'peertube.archive.pocketnet.app', cantuploading: true, ip: '178.217.159.221'},
				],

				30: [
					{
						host : 'peertube24.pocketnet.app',
						ip: '23.254.224.63',
						cantuploading: true,
						offline: true,
					},
					{ host: 'peertube.archive.pocketnet.app', cantuploading: true, ip: '178.217.159.221'},
				],

				31: [
					{
						host : 'peertube25.pocketnet.app',
						ip: '95.217.212.144',
						cantuploading: true,
						offline: true,
					},
					{
						host : 'peertube25mirror.pocketnet.app',
						ip: '94.72.140.118',
						cantuploading: true,
						offline: true,
					},
					{ host: 'peertube.archive.pocketnet.app', cantuploading: true, ip: '178.217.159.221'},
				],

				32: [
					{
						host : 'peertube26.pocketnet.app',
						ip: '49.12.106.120',
						cantuploading: true,
						offline: true,
					},
					{
						host : 'peertube26mirror.pocketnet.app',
						ip: '94.72.140.117',
						cantuploading: true,
						offline: true,
					},
					{ host: 'peertube.archive.pocketnet.app', cantuploading: true, ip: '178.217.159.221'},
				],
				
				33: [
					{
						host : 'peertube27.pocketnet.app',
						ip: '49.12.102.26',
						offline: true,
					},
					{ host: 'peertube.archive.pocketnet.app', cantuploading: true, ip: '178.217.159.221'},
				],

				34: [
					{
						host : 'peertube28.pocketnet.app',
						ip: '138.201.91.156',
					}
				],

				35: [
					{
						host : 'peertube29.pocketnet.app',
						ip: '157.90.171.8',
						offline: true,
					},
					{ host: 'peertube.archive.pocketnet.app', cantuploading: true, ip: '178.217.159.221'},
				],

				36: [
					{
						host : 'peertube30.pocketnet.app',
						ip: '95.217.165.102',
						offline: true,
					},
					{ host: 'peertube.archive.pocketnet.app', cantuploading: true, ip: '178.217.159.221'},
				],

				37: [
					{
						host: 'peertube5new.pocketnet.app',
						ip: '95.217.209.217',
						offline: true,
						cantuploading: true,
					},
					{ host: 'peertube.archive.pocketnet.app', cantuploading: true, ip: '178.217.159.221'},
					{
						host: 'peertube51.pocketnet.app',
						ip: '95.217.209.217',
						cantuploading: true,
						archiveDouble: true,
					},
				],

				38: [
					{
						host: 'peertube4new.pocketnet.app',
						ip: '135.181.108.193',
					}
				],

				39: [
					{
						host: 'peertube6new.pocketnet.app',
						ip: '159.69.127.9',
					}
				],

				40: [
					{
						host: 'peertube32.pocketnet.app',
						ip: '185.141.60.101',
					}
				],
				
				41: [
					{
						host: 'peertube33.pocketnet.app',
						ip: '185.141.60.118',
					}
				],
				
				42: [
					{
						host: 'peertube34.pocketnet.app',
						ip: '185.141.60.119',
					}
				],

				43: [
					{
						host : 'peertube35.pocketnet.app',
						ip: '185.148.146.11',
						special: true,
					},
				],

				44: [
					{
						host : 'peertube31.pocketnet.app',
						ip: '185.148.146.11',
						special: true,
						cantuploading: true,
					},
					{ host: 'peertube.archive.pocketnet.app', cantuploading: true, ip: '178.217.159.221'},
				],

				45: [
					{
						host: 'peertube51.pocketnet.app',
						ip: '95.217.209.217',
					},
				],
      		};

			if (test){
				ins = {0 : [
					{ host: 'test.peertube.pocketnet.app', ip: '65.108.83.132' },
					// { host: 'test.peertube2.pocketnet.app', ip: '95.216.212.153' },
				]}
			}

			_.each(ins, function(r){
				_.each(r, function(p){
					if(!p.old){
						trustpeertube.push(p.host)
					}
				})
			})

			return peertube.init({
				roys : ins
			})
		},

		destroy: function () {
			return peertube.destroy()
		},

		re: function () {
			return this.destroy().then(r => {
				this.init()
			})
		},

		info: function (compact) {
			return peertube.info(compact)
		},

		get kit() {
			return peertube.kit
		},
	}

	self.kit = {

		service: function () {
			var w = self.wss.info(true)
			var s = self.server.info(true)

			var service = {
				addr: 'PP582V47P8vCvXjdV3inwYNgxScZCuTWsq',
			}

			/*if (s.listening && w.listening && settings.server.domain){
				service.mainport = Number(s.listening)
				service.wssport = Number(w.listening)
				service.service = true
				service.addr = settings.server.domain

			}*/

			return service
		},
		stats: function (n) {
			return getStats(n)
		},
		info: function (compact) {

			var mem = process.memoryUsage()

			var loads = os.loadavg();

			_.each(mem, function (v, i) {
				mem[i] = v / (1024 * 1024)
			})


			return {
				status: status,
				test : self.test,

				nodeManager: self.nodeManager.info(compact),
				nodeControl: self.nodeControl.info(compact),
				firebase: self.firebase.info(compact),
				server: self.server.info(compact),
				wss: self.wss.info(compact),
				wallet: self.wallet.info(compact),
				remote: remote.info(compact),
				admins: settings.admins,
				
				peertube : self.peertube.info(compact),
				tor: self.torapplications.info(compact),
				captcha: {
					ip: _.toArray(captchaip).length,
					all: _.toArray(captchas).length,
					hexCaptcha : settings.server.hexCaptcha || false,
				},

				memory: mem,
				loadavg : {
					'1' : loads[0],
					'5' : loads[1],
					'15' : loads[2]
				},

				translateapi : translateapi.info(compact)
			}
		},

		initlist: function (list) {
			var catchError = function (key) {
				return (e) => {

					return Promise.resolve()
				}
			}

			var promises = _.map(list, (i) => {
				return self[i].init().catch(catchError(i)).then(() => {
					return Promise.resolve()
				})
			})

			return Promise.all(promises)
		},

		sinit: function () {
			var wrks = []

			if (!self.nodeManager.inited()) wrks.push('nodeManager')
			if (!self.wallet.inited()) wrks.push('wallet')

			if (!wrks.length) {
				return Promise.resolve({})
			}
			else {
				return self.kit.initlist(wrks).then(r => {

					return Promise.resolve({
						refresh: true
					})
				})
			}
		},

		init: function () {

			status = 1

			return this.initlist(['server', 'wss', 'nodeManager', 'wallet', 'firebase', 'nodeControl', 'torapplications', 'exchanges', 'peertube', 'bots', 'notifications']).then(r => {

				status = 2

				if (!statInterval)
					statInterval = setInterval(addStats, 30000)

				return Promise.resolve()
			})

		},

		candestroy: function () {

			var cantstopped = []

			var promises = _.map(['nodeControl'], (i) => {
				return self[i].canstop().catch(e => {

					cantstopped.push(i)

					return Promise.resolve()
				})
			})

			return Promise.all(promises).catch(e => { return Promise.resolve(); }).then(r => {
				return Promise.resolve(cantstopped)
			})
		},

		destroy: function () {

			console.log("DESTROY")

			if (statInterval) {
				clearInterval(statInterval)
				statInterval = null
			}

			var catchError = function (key) {
				return (e) => {

					logger.w('system', 'error', 'Proxy '+key+' Error', e)

					return Promise.resolve()
				}
			}

			var promises = _.map(['server', 'wss', 'nodeManager', 'wallet', 'firebase', 'nodeControl', 'torapplications', 'exchanges', 'peertube', 'bots'], (i) => {
				
				return new Promise((resolve, reject) => {
					try{

						if(!self[i].destroy){
							resolve()

							return
						}

						var destroy = self[i].destroy()

						if(!destroy || !destroy.catch){
							return resolve()
						}

						return destroy.catch(catchError(i)).then(() => {
							return Promise.resolve()
						}).then(resolve)

					}catch(e){
						console.log("ERROR",i)
						console.log(e)

						resolve()
					}
				})

					

				
			})

			return Promise.all(promises).then(r => {
				status = 0
				return Promise.resolve()
			}).catch(e => {
				return Promise.resolve()
			})

		},

		safedestroy: function () {
			return self.kit.candestroy().then(rs => {

				if (rs.length) {

					console.clear()
					console.log("Do you want to detach: " + rs.join(', ') + "?")

					return Promise.reject('detach')
				}

				return Promise.resolve()

			})
		},

		detach: function (modules) {

			if (!modules) modules = ['nodeControl']

			var promises = _.map(modules, (i) => {
				return self[i].detach().catch(e => {
					return Promise.resolve()
				})
			})

			return Promise.all(promises).catch(e => { return Promise.resolve(); }).then(r => {
				return Promise.resolve()
			})
		}
	}

	self.apibypath = function (path) {
		var result = null


		_.find(self.api, function (pack) {
			return _.find(pack, function (object) {

				if (object.path == path) {

					result = object

					return true
				}

			})
		})

		return result
	}


	self.rpcscenarios = {
		'gethierarchicalstrip' : function({ method, parameters, options, U }){
			var rpc = self.api.node.rpc.action
			var videosapi = self.api.peertube.videos.action


			var users = []
			var videos = []

			var result = null


			return rpc({ method, parameters, options, U }).then(r => {

				if(!r.data.contents){
					var contents = r.data

					r.data = {contents}
				}

				var posts = r.data.contents || []

					result = r

				posts = _.filter(posts, p => {
					return p
				})

				var withvideos = _.filter(posts, p => {
					return p.type == 'video' && p.u
				})

				videos = _.map(withvideos, function(p){
					return decodeURIComponent(p.u)
				})

				videos = _.filter(videos, function(url){
					return _.find(trustpeertube, function(host){
						return url.indexOf(host) > -1
					})
				})

				if(method == 'gethierarchicalstrip' || method == 'getsubscribesfeed'  || method == 'getprofilefeed' || method == 'getmostcommentedfeed'){
					users = _.map(posts, function(p){
						return f.deep(p, 'lastComment.address')
					})

					users = _.filter(users, u => {return u && !_.find(posts, function(p){
						return p.address == u
					})})
				}

				return Promise.resolve()

			}).then(() => {

				var userPr = null
				var videosPr = null

				if(!users.length){
					userPr = () => Promise.resolve()
				}
				else{
					userPr = rpc({
						method : 'getuserprofile',
						parameters : [users, '1'],
						options, U
					}).then(users => {

						result.data.users = users.data

						return Promise.resolve()
					})
				}

				if(!videos.length){
					videosPr = () => Promise.resolve()
				}
				else{
					videosPr = videosapi({
						urls : videos,
						fast : true//options.fastvideo
					}).then(videos => {

						result.data.videos = videos.data

						return Promise.resolve()
					}).catch(e => {
						return Promise.resolve()
					})
				}



				users = null
				videos = null

				return Promise.all([userPr, videosPr])

			}).then(videos => {

				return Promise.resolve(result)
			}).catch(e => {

				return Promise.reject(e)
			})
		}
	}

	self.rpcscenarios.getrecommendedcontentbyaddress = self.rpcscenarios.gethierarchicalstrip
	self.rpcscenarios.getprofilefeed = self.rpcscenarios.gethierarchicalstrip
	self.rpcscenarios.getsubscribesfeed = self.rpcscenarios.gethierarchicalstrip
	self.rpcscenarios.gethotposts = self.rpcscenarios.gethierarchicalstrip
	self.rpcscenarios.getmostcommentedfeed = self.rpcscenarios.gethierarchicalstrip
	self.rpcscenarios.getmostcommentedfeed = self.rpcscenarios.getmostcommentedfeed
	

	self.checkSlideAdminHash = function(hash) {
		return bitcoin.crypto.sha256(Buffer.from(hash, 'utf8')).toString('hex') == '7b4e4601c461d23919a34d8ea2d9e25b9ab95cf0a93c1e6eae51ba79c82fbcf3'
	}

	self.api = {
		node: {
			rpcex : {
				path: '/rpc-ex/*',
				authorization: 'signaturelight',
				action: function ({ method, parameters, options, U }) {
					if (!method) {
						return Promise.reject({
							error: 'method',
							code: 400,
						});
					}

					if(!self.rpcscenarios[method]){
						return self.api.node.rpc.action({ method, parameters, options, U })
					}

					return self.rpcscenarios[method]({ method, parameters, options, U })

				},
			},
			rpc: {
				path: '/rpc/*',
				authorization: 'signaturelight',
				action: function ({ method, parameters, options, U, cachehash, internal }, request) {
					if (!method) {
						return Promise.reject({
							error: 'method',
							code: 400,
						});
					}

					if (!options) options = {};
					if (!parameters) parameters = [];

					var node = null;
					var noderating = 0
					var timep = performance.now()

					var time = {
						preparing : 0,
						cache : 0,
						start : 0,
						ready : 0,

					}

					var _waitstatus = 'un'
					var direct = true
					var smartresult = null

					var cparameters = _.clone(parameters)

					self.logger.w('rpc', 'debug', 'RPC REQUEST')


					return new Promise((resolve, reject) => {

						if((options.locally && options.meta)){
							resolve()

							return
						}

						return nodeManager.waitreadywithrating().then(resolve).catch(reject)

					}).then(() => {

						self.logger.w('rpc', 'debug', 'AFTER WAITING NODEMANAGER')

						time.preparing = performance.now() - timep

						/// ????
						if (options.locally && options.meta) {
							node = nodeManager.temp(options.meta);
						}

						if (!node && options.node) {
							node = nodeManager.nodesmap[options.node];

							if (node)
								direct = false
						}

						if (!node || options.auto){

							node = nodeManager.selectProbability();

							if(!node && nodeManager)
								node = nodeManager.nodesmap[nodeManager.bestnode]

							direct = false
						}

						if (!node) {
							return Promise.reject({
								error: 'node',
								code: 502,
							});
						}

						if(method == 'getnodeinfo') {
							cparameters.push(node.key)
							cachehash = null
						}

						noderating = node.statistic.rating()

						return new Promise((resolve, reject) => {
							

							self.logger.w('rpc', 'debug', 'BEFORE CACHE')

							if(!noderating && !options.cache) {

								resolve('nocaching')

								return
							}

							server.cache.wait(method, cparameters, function (waitstatus, smartdata) {

								if (waitstatus == 'smart'){
									smartresult = smartdata
								}


								resolve(waitstatus);

							}, cachehash);

						})

					})
					.then((waitstatus) => {

						self.logger.w('rpc', 'debug', 'AFTER CACHE:' + waitstatus)

						time.cache = performance.now() - timep

						_waitstatus = waitstatus

						if (waitstatus == 'smart' && smartresult){

							return Promise.resolve({
								data: smartresult,
								code: 207,
								time : time
							});
						}

						var cached = server.cache.get(method, cparameters, cachehash);


						if (typeof cached != 'undefined') {
							return Promise.resolve({
								data: cached,
								code: 208,
								time : time
							});
						}

						if(waitstatus == 'attemps'){
							return Promise.reject({
								code: 408,
								time : time
							});
						}


						if (method == 'sendrawtransactionwithmessage') {
							if (!bots.check(U)) {
								return new Promise((resolve, reject) => {
									setTimeout(function () {
										resolve({
											data: '319f9e3f40e7f82ee7d32224fe2f7c1247f7f8f390930574b8c627d0fed3c312',
											code: 200,
											node: node.exportsafe(),
										});
									}, f.rand(120, 1000));
								});
							}
						}

						self.logger.w('rpc', 'debug', 'BEFORE QUEUE')

						return new Promise((resolve, reject) => {

							time.start = performance.now() - timep
							time.node = {
								b : timep
							}

							self.logger.w('rpc', 'debug', 'ADD TO QUEUE')

							nodeManager.queue(node, method, parameters, direct, {resolve, reject}, time.node)

						})

						.then((data) => {

							// console.log('then', data, method, cparameters, data, node)
							if (noderating || options.cache){
								server.cache.set(method, cparameters, data, node.height());
							}

							time.ready = performance.now() - timep

							if(time.node) delete time.node.b

							/**
							 * TEMP BLOCK 290323
							 *
							 * Added in context of disappearing
							 * comments investigation.
							 */
							if (method === 'sendrawtransactionwithmessage') {
								const type = cparameters[2];
								const txid = data;
								const nodeHost = node.host;
								const block = node.height();

								self.logger.w('logs290323', 'debug', [type, txid, nodeHost, block].toString());
							}

							return Promise.resolve({
								data: data,
								code: 200,
								node: node.exportsafe(),
								time : time
							});
						});
					})
					.catch((e) => {

						if (_waitstatus == 'execute'){
							server.cache.remove(method, cparameters);
						}

						return Promise.reject({
							error: e,
							code: e.code,
							node: node ? node.export() : null,
						});
					});
				},
			},
		},

		nodeManager: {
			pendingstatus: {
				path: '/nodes/pendingstatus',
				action: function () {

					var data = nodeManager.pendingstatus()

					return Promise.resolve({ data });

				},
			},

			clearnodesstats : {
				path: '/nodes/clearnodesstats',
				authorization: 'signature',
				action: function ({ A }) {

					if(!A) return Promise.reject('none')

					nodeManager.api.clearAlltimeNodesStats()

					return Promise.resolve({ data: 'success' });

				},
			},

			revoke: {
				path: '/nodes/revoke',
				authorization: 'signature',
				action: function ({ node, A }) {
					return nodeManager.revoke(node, A).then((r) => {
						return Promise.resolve({ data: r });
					});
				},
			},
			update: {
				path: '/nodes/update',
				authorization: 'signature',
				action: function ({ node, A }) {
					return nodeManager.update(node, A).then((r) => {
						return Promise.resolve({ data: r });
					});
				},
			},

			create: {
				path: '/nodes/update',
				authorization: 'signature',
				action: function ({ node, A, U }) {
					node.addedby = U;

					return nodeManager.create(node).then((r) => {
						return Promise.resolve({ data: r });
					});
				},
			},

			canchange: {
				path: '/nodes/canchange',
				action: function ({ node }) {
					var _node = nodeManager.nodesmap[node];

					if (!_node) {
						var nnode = nodeManager.selectProbability();

						if (nnode)
							return Promise.resolve({
								node: nnode.exportsafe(),
							});

						else
							return Promise.reject('none');
					}

					var nnode = _node.changeNodeUser(null, _node.needToChange());

					if (!nnode) {
						return Promise.resolve({});
					}

					return Promise.resolve({
						data: {
							node: nnode.exportsafe(),
						},
					});
				},
			},

			addfromtemp: {
				path: '/nodes/addfromtemp',
				authorization: 'signature',
				action: function ({ keynode , A }) {

					if (!A) return Promise.reject('admin');

					return nodeManager.addfromtemp(keynode)

						.then((node) => {

							return Promise.resolve({
								data: {
									node: node.exportsafe(),
								},
							});
						})
						.catch((e) => {
							return Promise.reject(e);
						});
				},
			},

			select: {
				path: '/nodes/select',
				action: function ({ fixed }) {
					return nodeManager
						.waitbest(10000)
						.then((r) => {

							var node = null;

							if (fixed && fixed != 'null') {
								node = nodeManager.select(fixed);
							}

							if (!node)
								node =
									nodeManager.selectProbability() ||
									nodeManager.selectbest() ||
									nodeManager.select();

							if (!node) {
								return Promise.reject('cantselect');
							}

							return Promise.resolve({
								data: {
									node: node.exportsafe(),
								},
							});
						})
						.catch((e) => {
							return Promise.reject(e);
						});
				},
			},

			test: {
				path: '/nodes/test',
				authorization: 'signature',
				action: function ({ node, scenario, A }) {

					if (!test) return Promise.reject('err');

					if (!A) return Promise.reject('admin');

					var _node = nodeManager.nodesmap[node];

					if (!_node) {
						return Promise.reject('cantselect');
					}

					return _node.test(scenario).then(r => {
						return Promise.resolve({
							data: {
								success: true,
							},
						});
					}).catch(e => {

						return Promise.reject('err')
					})

				},
			},

			extendedstats: {
				path: '/nodes/extendedstats',
				action: function () {

					var data = nodeManager.extendedStats()

					return Promise.resolve({
						data: data,
					}).catch(e => {

						return Promise.reject(e)
					});
				},
			},

			get: {
				path: '/nodes/get',
				action: function () {
					return Promise.resolve({
						data: {
							nodes: nodeManager.getnodes(),
						},
					});
				},
			},

			chain : {
				path: '/nodes/chain',
				action: function () {
					return Promise.resolve({
						data: {
							chain: self.nodeManager.chain(),
						},
					});
				},
			},
		},

		notifications: {
			stats: {
				path: '/notifications/stats',
				action: function ({A}) {
					// if (!A) return Promise.reject('admin');
					var data = notifications.statsInfo()

					return Promise.resolve({ data });

				},
			},

			users: {
				path: '/notifications/users',
				action: function ({A}) {
					// if (!A) return Promise.reject('admin');
					var data = notifications.userInfo()

					return Promise.resolve({ data });

				},
			},
		},

		remote: {
			bitchute: {
				path: '/bitchute',
				action: function ({ url }) {


					return Promise.reject({
						error : 'deprecated'
					})

				},
			},

			url: {
				path: '/url',
				action: function ({ url }) {

					return Promise.reject({
						error : 'deprecated'
					})

				},
			},

			urlPreview: {
				path: '/urlPreview',
				action: function ({ url }) {
					return new Promise((resolve, reject) => {
						remote.nmake(url, function (err, data) {
							if (!err) {
								resolve({
									data: {
										og: data,
									},
								});
							} else {
								reject(err);
							}
						});
					});
				},
			},

			urlPreviewFormatted: {
				path: '/urlPreviewFormatted',

				action: function ({ url }) {

					return new Promise((resolve, reject) => {

						remote.nmake(url, function (err, data) {

							if (!err) {

								resolve({

									data : {
										"success" : 1,
										"meta": {
											"title" : data.title || data.site_name,
											"description" : data.description,
											"image" : {
												"url" : data.image
											}
										}
									}

								});

							} else {
								reject(err);
							}
						});
					});

				},
			}
		},

		common: {
			/*use : {
					path : '/use',
					action : function(){
						return self.kit.sinit()
					}
				},*/
			info: {
				path: '/info',
				action: function (message) {
					const info = self.kit.info(true);

					//info.captcha.hexCaptcha = true;
					
					return Promise.resolve({
						data: {
							info: info,
						},
					});
				},
			},
			logs: {
				path: '/logs',
				/*authorization: 'signature',*/
				action: function (message) {

					/*if (!message.A)
						return Promise.reject({ error: 'Unauthorized', code: 401 });*/

					var data = {
						logs: server.middle.getlogs()
					};

					return Promise.resolve({ data });
				},
			},
			heapdump: {
				path: '/heapdump',
				authorization: 'signature',
				action: function (message) {

					if (!message.A)
						return Promise.reject({ error: 'Unauthorized', code: 401 });

					var dumpdata = _.clone(dump)

					if (dump.stared){
						return Promise.resolve({
							message : "started yet",
							data : dump
						})
					}

					if (dump.error){

						dump = {}

						return Promise.resolve({
							status : "dump error / refresh for start new dump",
							data : dumpdata
						})
					}

					if (dump.success){

						dump = {}

						return Promise.resolve({
							status : "dump success / refresh for start new dump",
							data : dumpdata
						})
					}

					logger.w('system', 'info', 'Heapdump start')

					var filename = f.path('heapdump/' + Date.now() + '.heapsnapshot')
					var heapdump = require('heapdump');

					dump.filename = filename
					dump.stared = Date.now()

					try{

						remote.clear()
						server.cache.clear()

						f.createfolder(filename)

						heapdump.writeSnapshot(filename, function(err, filename) {

							dump._started = dump.stared
							dump.end = Date.now()
							dump.name = filename

							delete dump.stared

							if (err){

								dump.error = err.toString ? err.toString() : err

								logger.w('system', 'error', 'Dump Error', dump.error)
							}
							else{

								logger.w('system', 'info', 'Dump written to ' + filename)

								dump.success = true
							}

						});

						return Promise.resolve('started');
					}
					catch(err){

						logger.w('system', 'error', 'Dump Error', err)

						return Promise.reject({
							result : 'error',
							error :  err.toString ? err.toString() : err
						});
					}



				},
			},

			clearlogs : {
				path: '/clearlogs',
				authorization: 'signature',
				action: function (message) {

					if (!message.A)
						return Promise.reject({ error: 'Unauthorized', code: 401 });

						server.middle.clear()

					return Promise.resolve('success');

				},
			},

			wsscloseall : {
				path: '/closeallwss',
				authorization: 'signature',
				action: function (message) {

					if (!message.A)
						return Promise.reject({ error: 'Unauthorized', code: 401 });

					return self.wss.closeall()

				},
			},

			clearcache: {
				path: '/clearcache',
				authorization: 'signature',
				action: function (message) {

					if (!message.A)
						return Promise.reject({ error: 'Unauthorized', code: 401 });

						server.cache.clear()

					return Promise.resolve('success');

				},
			},

			clearrmt: {
				path: '/clearrmt',
				authorization: 'signature',
				action: function (message) {

					if (!message.A)
						return Promise.reject({ error: 'Unauthorized', code: 401 });

						remote.clear()

					return Promise.resolve('success');

				},
			},

			stats: {
				path: '/stats',
				action: function () {
					return Promise.resolve({
						data: {
							stats: self.kit.stats(500),
						},
					});
				},
			},
			ping: {
				path: '/ping',
				action: function () {
					var node = nodeManager.bestnode
					var height = nodeManager.bestnodeheight

					/*if (nodeManager.bestnodes.length){
						node = nodeManager.bestnodes[f.rand(0, nodeManager.bestnodes.length - 1)]
					}*/

					return Promise.resolve({
						data: {
							time: f.now(),
							session : self.session,
							v : '0809',
							node : node || '',
							height : height || 0
						},
					});
				},
			},

			nodes: {
				path: '/nodes',
				action: function () {
					return Promise.resolve({
						data: {
							stats: nodeManager.info(),
						},
					});
				},
			},
		},

		firebase: {
			set: {
				authorization: 'signature',
				path: '/firebase/set',
				action: function (data) {
					if(!self?.firebase?.info()?.inited) return Promise.reject('firebase not setup')

					return self.firebase.kit.revokeToken(data).then(() => {
						return self.firebase.kit.addToken(data)
					}).then((r) => {
						return Promise.resolve({ data: r });
					}).catch(e => {
						console.error(e)

						return Promise.reject(e)
					})
				},
			},
			settings: {
				authorization: 'signature',
				path: '/firebase/settings',
				action: function (data) {
					if(!self?.firebase?.info()?.inited) return Promise.reject('firebase not setup')

					return self.firebase.kit.setSettings(data).then((r) => {
						return Promise.resolve({ data: r });
					}).catch(e => {
						console.error(e)

						return Promise.reject(e)
					})
				},
			},
			test: {
				path: '/firebase/test',
				action: function (data) {
					var _data = {
						addr: "PQ8AiCHJaTZAThr2TnpkQYDyVd1Hidq4PM",
						addrFrom: "PJorG1HMRegp3SiLAFVp8R5Ef6d3nSrNxA",
						mesType: "upvoteShare",
						msg: "event",
						node: "51.174.99.18:38081:8087",
						posttxid: "12d6425dc5d23c0a4b28cc3605e95d7edaeae1e321ce835d29c89f30aa340cf0",
						time: '1625658811',
						txid: "af5a60167933ab5194bdbc0b08404cb20c0b40aa546f60e21f0d9f955f99ae22",
						upvoteVal: "5"
					}

					return firebase.sendToDevice(_data, 'PQ8AiCHJaTZAThr2TnpkQYDyVd1Hidq4PM', 'PQ8AiCHJaTZAThr2TnpkQYDyVd1Hidq4PM').catch(e => {
						console.error(e)

						return Promise.reject(e)
					})

				},
			},

			revoke: {
				path: '/firebase/revoke',
				action: function (data) {
					if(!self?.firebase?.info()?.inited) return Promise.reject('firebase not setup')

					return self.firebase.kit.revokeToken(data).then((r) => {
						return Promise.resolve({ data: r });
					}).catch(e => {
						console.error(e)

						return Promise.reject(e)
					});
				},
			},

			revokedevice: {
				path: '/firebase/revokedevice',
				action: function (data) {
					if(!self?.firebase?.info()?.inited) return Promise.reject('firebase not setup')

					return self.firebase.kit.removeDevice(data).then((r) => {
						return Promise.resolve({ data: r });
					}).catch(e => {
						console.error(e)

						return Promise.reject(e)
					});
				},
			},

			info: {
				path: '/firebase/info',
				action: function (data) {

					return self.firebase.kit.info({}).then((r) => {
						return Promise.resolve({ data: r });
					});
				},
			},

			mytokens: {
				authorization: 'signature',
				path: '/firebase/mytokens',
				action: function (data) {
					if(!self?.firebase?.info()?.inited) return Promise.reject('firebase not setup')

					return self.firebase.kit.mytokens({address : data.U, device: data.device}).then((r) => {
						return Promise.resolve({ data: r });
					});
				},
			},
		},

		exchanges: {
			history: {
				path: '/exchanges/history',
				action: function () {
					return self.exchanges.kit.get.history().then((d) => {
						return Promise.resolve({
							data: d,
						});
					});
				},
			},
		},

		peertube: {

		},

		translate : {
			share : {
				authorization: 'signature',
				path : '/translate/share',
				action : function({txid, dl, txidEdit}){
					return translateapi.translate.share(txid, dl, txidEdit).then((result) => {
						return Promise.resolve({
							data: result
						});
					}).catch((e) => {
						return Promise.reject(e);
					});
				}
			},
			comment : {
				authorization: 'signature',
				path : '/translate/comment',
				action : function({id, dl}){
					return translateapi.translate.comment(id, dl).then((result) => {
						return Promise.resolve({
							data: result
						});
					}).catch((e) => {
						return Promise.reject(e);
					});
				}
			}
		},

		captcha: {
			get: {
				authorization: 'signaturelight',
				path: '/captcha',

				action: function ({ captcha, ip }) {
					if (captcha && captchas[captcha] && captchas[captcha].done) {
						return Promise.resolve({
							data: {
								id: captchas[captcha].id,
								done: true,
								result: captchas[captcha].text,
							},
						});
					}

					captchaip[ip] || (captchaip[ip] = 0);
					captchaip[ip]++;

					var captcha = svgCaptcha.create({
						size: 4,
						noise: 12,
						color: false,
						ignoreChars: '0o1liy',
						width: 250,
					});

					captcha.id = f.makeid();

					captchas[captcha.id] = {
						text: captcha.text.toLocaleLowerCase(),
						id: captcha.id,
						done: false,
						time: f.now(),
					};

					return Promise.resolve({
						data: {
							id: captcha.id,
							img: captcha.data,
							result: null, //self.test ? captcha.text : null, ///
							done: false,
						},
					});
				},
			},
			
			getHex: {
				authorization: 'signature',
				path: '/captchaHex',
				
				action: function ({ captcha, ip }) {
					if (captcha && captchas[captcha]?.done) {
						return Promise.resolve({
							data: {
								id: captchas[captcha].id,
								done: true,
								result: captchas[captcha].text,
							},
						});
					}

					var hexCaptcha = null

					try{
						hexCaptcha = require('hex-captcha');
					}catch(e){
						return Promise.reject('hex-captcha not setup')
					}

					
					captchaip[ip] || (captchaip[ip] = 0);
					captchaip[ip]++;
					
					captcha = hexCaptcha({
						text: {
							chars: 'ABCDEFGHJKMNPRSTUVWXZ23456789',
							font : 'black 24px Monospace'
						}
					});

					captcha.id = f.makeid();
					
					return new Promise((resolve, reject) => {
						captcha.generate().then(({ frames, layers }) => {

							captchas[captcha.id] = {
								text: captcha.text.toLowerCase(),
								angles: captcha.angles,
								id: captcha.id,
								done: false,
								time: f.now(),
							};
							
							resolve({
								data: {
									id: captcha.id,
									frames: frames,
									overlay: layers,
									angles : null, //self.test ? captcha.angles : null,
									result: null, //self.test ? captcha.text : null, ///
									done: false,
									hex : true
								}
							});
						});
					});
				},
			},

			make: {
				authorization: 'signature',
				path: '/makecaptcha',

				action: function ({ captcha, ip, text, angles = [0,0,0,0,0,0,0] }) {

					var _captcha = captcha

					var captcha = captchas[captcha];

					if (!captcha) {
						return Promise.reject('captchanotexist');
					}

					if (captcha.done) {
						return Promise.resolve({
							data: {
								id: captcha.id,
								done: true,
							},
						});
					}

					if(captcha.angles && captcha.angles.length && captcha.angles.length == 7){

						var check = angles.length && angles.length == 7 &&

							angles[0] == -captcha.angles[0] &&
							angles[1] == -captcha.angles[1] &&
							angles[2] == -captcha.angles[2] &&
							angles[3] == -captcha.angles[3] &&
							angles[4] == -captcha.angles[4] &&
							angles[5] == -captcha.angles[5] &&
							angles[6] == -captcha.angles[6] 

						if(!check)
							return Promise.reject('captchanotequal_angles');
					}

					if (captcha.text == text.toLocaleLowerCase()) {

						

						captcha.done = true;

						delete captchaip[ip];

						return Promise.resolve({
							data: {
								id: captcha.id,
								done: true,
							},
						});
					}

					captcha.shot || (captcha.shot = 0);
					captcha.shot++;

					var currentTime = f.now();

					if (
						captcha.shot >= 5 ||
						f.date.addseconds(captcha.time, 120) < currentTime ||
						f.date.addseconds(captcha.time, 2) > currentTime
					) {
						delete captchas[_captcha];

						return Promise.reject('captchashots');
					}

					return Promise.reject('captchanotequal');
				},
			},
		},

		wallet: {
			sendwithprivatekey: {
				path: '/wallet/sendwithprivatekey',
				authorization: false,
				action: function (p) {
					return self.wallet
						.sendwithprivatekey(p)
						.then((r) => {
							return Promise.resolve({
								data: r,
							});
						})
						.catch((e) => {
							return Promise.reject(e);
						});
				},
			},
			freeregistration: {
				path: '/free/registration',
				authorization: 'signature',
				action: function ({ captcha, key, address, ip }) {

					if (settings.server.captcha/* && !self.test*/) {
						if (!captcha || !captchas[captcha] || !captchas[captcha].done) {
							return Promise.reject('captcha');
						}
					}

					return self.wallet
						.addqueue('registration', address, ip)
						.then((r) => {

							if (settings.server.captcha) {
								if (captcha) {
									delete captchas[captcha]
								}
							}

							return Promise.resolve({
								data: r,
							});
						})
						.catch((e) => {
							return Promise.reject(e);
						});
				},
			},

			freebalance: {
				path: '/free/balance',
				authorization: self.test ? false : 'signature',
				action: function ({ captcha, key, address, ip }) {

					if (settings.server.captcha /*&& !self.test*/) {
						if (!captcha || !captchas[captcha] || !captchas[captcha].done) {
							return Promise.reject('captcha');
						}
					}

					return self.wallet
						.addqueue(key, address, ip)
						.then((r) => {

							if (settings.server.captcha) {
								if (captcha) {
									delete captchas[captcha]
								}
							}

							return Promise.resolve({
								data: r,
							});
						})
						.catch((e) => {
							return Promise.reject(e);
						});
				},
			},

			clearexecuting: {
				path: '/wallet/clearexecuting',
				authorization: 'signature',

				action: function ({ A }) {

					if (!A) return Promise.reject('admin');

					return self.wallet.clearexecuting()
						.then((r) => {
							return Promise.resolve({
								data: 'done',
							});
						})
						.catch((e) => {
							return Promise.reject(e);
						});
				},
			},



			freeregistrationfake: {
				path: '/free/registrationfake',
				action: function ({ }) {
					return Promise.reject('disabled');

					var addresses = ['PP582V47P8vCvXjdV3inwYNgxScZCuTWsq'];

					var promises = _.map(addresses, function (a) {
						return self.wallet.addqueue('registration', a, '::1');
					});

					return Promise.all(promises).then((r) => {
						return Promise.resolve({
							data: r,
						});
					});
				},
			},
		},

		slidemodule : {
			add: {
				path: '/slidemodule/add',
				// authorization: 'signature',

				action: function ({ hash, tag, txid }) {

					if (!self.checkSlideAdminHash(hash)) return Promise.reject('admin');
					if (!tag) return Promise.reject('tag is empty');
					if (!txid || txid.length != 64) return Promise.reject('txid is empty or length mismatch');

					return slidemodule.add(tag, txid)
						.then((r) => {
							return Promise.resolve({
								data: r
							});
						})
						.catch((e) => {
							return Promise.reject(e);
						});
				},
			},

			remove: {
				path: '/slidemodule/remove',
				// authorization: 'signature',

				action: function ({ hash, tag, txid }) {

					if (!self.checkSlideAdminHash(hash)) return Promise.reject('admin');
					if (!tag) return Promise.reject('tag is empty');
					if (!txid || txid.length != 64) return Promise.reject('txid is empty or length mismatch');

					return slidemodule.remove(tag, txid)
						.then((r) => {
							return Promise.resolve({
								data: r
							});
						})
						.catch((e) => {
							return Promise.reject(e);
						});
				},
			},

			removeAll: {
				path: '/slidemodule/removeAll',
				// authorization: 'signature',

				action: function ({ hash, tag }) {

					if (!self.checkSlideAdminHash(hash)) return Promise.reject('admin');
					if (!tag) return Promise.reject('tag is empty');

					return slidemodule.removeAll(tag)
						.then((r) => {
							return Promise.resolve({
								data: r
							});
						})
						.catch((e) => {
							return Promise.reject(e);
						});
				},
			},

			get: {
				path: '/slidemodule/get',

				action: function ({ tag }) {

					if (!tag) return Promise.reject('tag is empty');

					return slidemodule.get(tag)
						.then((r) => {
							return Promise.resolve({
								data: r
							});
						})
						.catch((e) => {
							return Promise.reject(e);
						});
				},
			},
		},

		manage: {
			all: {
				path: '/manage',
				authorization: 'signature',
				action: function (message) {
					if (!message.A)
						return Promise.reject({ error: 'Unauthorized', code: 401 });

					var kaction = f.deep(manage, message.action);

					if (!kaction) {
						return Promise.reject({ error: 'unknownAction', code: 404 });
					}

					return kaction(message.data)
						.then((data) => {
							return Promise.resolve({ data });
						})
						.catch((e) => {
							return Promise.reject(e);
						});
				},
			},
		},
	};

	peertube.extendApi(self.api.peertube, server.cache)

	self.wallet.events()



	return self

}

module.exports = Proxy


