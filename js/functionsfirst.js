deep = function(obj, key){

    var tkey = ''
    var _key = []

    if (key[0] == "'"){
        key = key.substr(1)
        _key = key.split("'")
        tkey = _key[0]
        if(_key[1]) _key[1] =  _key[1].substr(1)

    }
    else{	
        _key = key.split(".");
        tkey = _key[0];
    }

    

    if(typeof obj == 'undefined' || !obj) return undefined;

    if(typeof obj[tkey] != 'undefined')
    {
        _key.splice(0, 1);

        if(_key.length == 0)
        {
            return obj[tkey];
        }
        else
        {
            return deep(obj[tkey], _key.join("."))
        }
    }
    else
    {
        return undefined;
    }
}

superXSS = function (str, p) {

    if(!str) return ''

	var l = str.length;

	var nstr = filterXSS(str, p)

	if (!nstr.length || l == nstr.length) {
		return nstr
	}
	else {
		return superXSS(nstr, p)
	}

}

clearStringXss = function (nm) {

	return superXSS(nm, {
		whiteList: [],
		stripIgnoreTag: true,
	})
}

function iOS() {
    return [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
    ].includes(navigator.platform)
    // iPad on iOS 13 detection
    || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  }

isios = function () {
    return (window.cordova && window.device && deep(window, 'device.platform') == 'iOS') || iOS()
}


getbaseorientation = function(){
	
	var angle90 = {
		portrait : 'landscape',
		landscape : 'portrait'
	}

	var orientation = _.clone(deep(window, 'screen.orientation') || {
		angle: 0,
		type: "portrait-primary"
	})

	orientation.type = orientation.type.split('-')[0]

    var type = orientation.type

	if( ((orientation.angle / 90).toFixed(0)) % 2 ){
		type = angle90[type]
	}

	if(!angle90[type]) type = 'portrait' 

	return type
}

var addzeros = function(v){
    v = v.toString()

    var zs = 5 - v.length

    for(var i = 0; i < zs; i++){
        v = '0' + v
    }

    return v
}

numfromreleasestring = function(v){

    var vss = v.split('.')

    vss[2] = addzeros(vss[2])

    v = vss.join('.').replace(/[^0-9]/g, '')

    var vs = Number(v.substr(0, 1) + '.' + v.substr(1))

    return vs
}

topPreloader2 = function(percent, text){
    if(!window.jQuery) return

    if(_Node) return

    var el = $('#_topPreloader');

    var div = el.find('div');
    var span = el.find('span');

    if (div.length == 0) {
        div = $("<div>");
        el.append(div);
    }

    if (text){
        if(span.length == 0){
            el.append("<span>"+text+"</span>")
        }
        else{
            span.html(text)
        }
        
    }

    window.requestAnimationFrame(() => {
        el.removeClass('complete');
        el.attr('percent', percent); 
        div.width((percent) + "%")
    })
    

    if(percent <= 0 || percent >= 100){
        window.requestAnimationFrame(() => {

            el.addClass('complete');
            el.attr('percent', 0);  

        })

        setTimeout(function(){

            el.fadeOut(300);

            setTimeout(function(){

                el.html('');

            },300)

        },500)
        
    }
    else{
        el.fadeIn(1);
    }
}

topPreloader = function(percent){

    return

    
}

makeid = function(valid){

    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
    }

    if(!valid)
    {
        return  s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
    }

    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    for( var i = 0; i < 32; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

makesystemid = function(valid){
    var id = makeid(valid);

    id = ('afafafaf' + id.substr(8)).replace(/-/g,'');

    return id;

}

MD5 = function(d){result = M(V(Y(X(d),8*d.length)));return result.toLowerCase()};function M(d){for(var _,m="0123456789ABCDEF",f="",r=0;r<d.length;r++)_=d.charCodeAt(r),f+=m.charAt(_>>>4&15)+m.charAt(15&_);return f}function X(d){for(var _=Array(d.length>>2),m=0;m<_.length;m++)_[m]=0;for(m=0;m<8*d.length;m+=8)_[m>>5]|=(255&d.charCodeAt(m/8))<<m%32;return _}function V(d){for(var _="",m=0;m<32*d.length;m+=8)_+=String.fromCharCode(d[m>>5]>>>m%32&255);return _}function Y(d,_){d[_>>5]|=128<<_%32,d[14+(_+64>>>9<<4)]=_;for(var m=1732584193,f=-271733879,r=-1732584194,i=271733878,n=0;n<d.length;n+=16){var h=m,t=f,g=r,e=i;f=md5_ii(f=md5_ii(f=md5_ii(f=md5_ii(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_ff(f=md5_ff(f=md5_ff(f=md5_ff(f,r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+0],7,-680876936),f,r,d[n+1],12,-389564586),m,f,d[n+2],17,606105819),i,m,d[n+3],22,-1044525330),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+4],7,-176418897),f,r,d[n+5],12,1200080426),m,f,d[n+6],17,-1473231341),i,m,d[n+7],22,-45705983),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+8],7,1770035416),f,r,d[n+9],12,-1958414417),m,f,d[n+10],17,-42063),i,m,d[n+11],22,-1990404162),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+12],7,1804603682),f,r,d[n+13],12,-40341101),m,f,d[n+14],17,-1502002290),i,m,d[n+15],22,1236535329),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+1],5,-165796510),f,r,d[n+6],9,-1069501632),m,f,d[n+11],14,643717713),i,m,d[n+0],20,-373897302),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+5],5,-701558691),f,r,d[n+10],9,38016083),m,f,d[n+15],14,-660478335),i,m,d[n+4],20,-405537848),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+9],5,568446438),f,r,d[n+14],9,-1019803690),m,f,d[n+3],14,-187363961),i,m,d[n+8],20,1163531501),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+13],5,-1444681467),f,r,d[n+2],9,-51403784),m,f,d[n+7],14,1735328473),i,m,d[n+12],20,-1926607734),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+5],4,-378558),f,r,d[n+8],11,-2022574463),m,f,d[n+11],16,1839030562),i,m,d[n+14],23,-35309556),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+1],4,-1530992060),f,r,d[n+4],11,1272893353),m,f,d[n+7],16,-155497632),i,m,d[n+10],23,-1094730640),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+13],4,681279174),f,r,d[n+0],11,-358537222),m,f,d[n+3],16,-722521979),i,m,d[n+6],23,76029189),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+9],4,-640364487),f,r,d[n+12],11,-421815835),m,f,d[n+15],16,530742520),i,m,d[n+2],23,-995338651),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+0],6,-198630844),f,r,d[n+7],10,1126891415),m,f,d[n+14],15,-1416354905),i,m,d[n+5],21,-57434055),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+12],6,1700485571),f,r,d[n+3],10,-1894986606),m,f,d[n+10],15,-1051523),i,m,d[n+1],21,-2054922799),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+8],6,1873313359),f,r,d[n+15],10,-30611744),m,f,d[n+6],15,-1560198380),i,m,d[n+13],21,1309151649),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+4],6,-145523070),f,r,d[n+11],10,-1120210379),m,f,d[n+2],15,718787259),i,m,d[n+9],21,-343485551),m=safe_add(m,h),f=safe_add(f,t),r=safe_add(r,g),i=safe_add(i,e)}return Array(m,f,r,i)}function md5_cmn(d,_,m,f,r,i){return safe_add(bit_rol(safe_add(safe_add(_,d),safe_add(f,i)),r),m)}function md5_ff(d,_,m,f,r,i,n){return md5_cmn(_&m|~_&f,d,_,r,i,n)}function md5_gg(d,_,m,f,r,i,n){return md5_cmn(_&f|m&~f,d,_,r,i,n)}function md5_hh(d,_,m,f,r,i,n){return md5_cmn(_^m^f,d,_,r,i,n)}function md5_ii(d,_,m,f,r,i,n){return md5_cmn(m^(_|~f),d,_,r,i,n)}function safe_add(d,_){var m=(65535&d)+(65535&_);return(d>>16)+(_>>16)+(m>>16)<<16|65535&m}function bit_rol(d,_){return d<<_|d>>>32-_}


/* TIMEOUT, INTERVALS */

retry = function(_function, clbk, time, totaltime){

    if (_function()){

        if (clbk) clbk();

        return
    }

    if(!time) time = 20;

    var totalTimeCounter = 0 
    var rif = null

    var interval = setInterval(function(){

        if (rif){
            cancelAnimationFrame(rif)
        }

        rif = window.requestAnimationFrame(() => {
            rif = null

            if(_function() || (totaltime && totaltime <= totalTimeCounter)){

                clearInterval(interval);

                if(clbk) clbk();

            }

        })

        totalTimeCounter += time

    }, time);
}

pretry = function(_function, time, totaltime){
    return new Promise((resolve, reject) => {

        retry(_function, resolve, time, totaltime)

    })
}


retryLazy = function(_function, clbk, time){
    if(!time) time = 200;

    var f = function(){
        _function(function(result){

            if(result){

                if(clbk) clbk();

            }

            else

            {
                setTimeout(f, time)
            }

        })
    }

    f();
}

processArray = function(array, fn) {
	var results = [];
	return array.reduce(function(p, item) {
		return p.then(function() {
			return fn(item).then(function(data) {
				results.push(data);
				return results;
			});
		});
	}, Promise.resolve());
}

slowMade = function(_function, timer, time){

    if (!time) time = 20

    if (timer) 
        clearTimeout(timer);

        timer = setTimeout(_function, time);

    return timer;
}
/* ______________________________ */

isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

parameters = function(uri, split){

    if(!uri && typeof window != 'undefined') {

        if(_SEO)
        {
            uri = _SEOuri.split('?')[1];
        }

        else
        {
            uri = window.location.search.substr(1);
        }

        
    }
    else{
        if(split){

            var up = uri.split('?');

            if (up[1]){
                uri = up[1];
            }
            else{
                uri = ''
            }

            
        }
    }

    if(/^([A-Za-z0-9]*)$/.test(uri)) return uri || {};

    var r = {};
    uParts = uri.split('&');
    for (p in uParts)
    {	
        uParts[p] = uParts[p].split('=');

        var p2 = _.clone(uParts[p]);

        p2.splice(0, 1);

        var p3 = p2.join("=").replace(/!!/g, "&");

        try{

            r[uParts[p][0]] = decodeURI(p3);

        } catch(e){

            r[uParts[p][0]] = p3;

        }

    }

    return r;
}

checkIfAllowedImage = function(src){

	if(!src) return false

	if(src && src.indexOf && src.indexOf('data:') == 0) return true

	try{

		const url = new URL(src);
		const ptRegex = /images\/[a-f0-9]{32}\/[a-f0-9]{32}-original\.jpg/;

        

		const isImgur = url.hostname.includes('imgur.com');
		const isBastyon = url.hostname.includes('bastyon.com');
		const isPocketnet = url.hostname.includes('pocketnet.app');
		const isPeertube = ptRegex.test(url.pathname);

		return isImgur || isBastyon || isPocketnet || isPeertube;

	}

	catch(e){
		return true
	}
}

checkIfAllowedImageApply = function(src){

    if(checkIfAllowedImage(src)) return src

    return ''
}

rand = function (min, max) {
	min = parseInt(min);
	max = parseInt(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

trim = function (s) {
	return rtrim(ltrim(s));
}

ltrim = function (s) {
	return (s || "").replace(/^\s+/, '');
}

rtrim = function (s) {
	return (s || "").replace(/\s+$/, '');
}

ltrimrn = function (s) {
	return (s || "").replace(/^[\r\n\t ]+/, '');
}

rtrimrn = function (s) {
	return (s || "").replace(/[\r\n\t ]+$/, '');
}

trimrn = function (s) {
	return rtrimrn(ltrimrn(s));
}

clearScripts = function (text) {
	return text.replace(/<script[^>]*?>[^<]*<\/script[^>]*?>/igm, "");
}

clearTagString = function (t) {

	return trim(t.substr(0, 25).toLowerCase().replace(/[\-=!"#%&'*{},.\/:;?\(\)\[\]@\\$\^*+<>~`\u00a1\u00a7\u00b6\u00b7\u00bf\u037e\u0387\u055a-\u055f\u0589\u05c0\u05c3\u05c6\u05f3\u05f4\u0609\u060a\u060c\u060d\u061b\u061e\u061f\u066a-\u066d\u06d4\u0700-\u070d\u07f7-\u07f9\u0830-\u083e\u085e\u0964\u0965\u0970\u0af0\u0df4\u0e4f\u0e5a\u0e5b\u0f04-\u0f12\u0f14\u0f85\u0fd0-\u0fd4\u0fd9\u0fda\u104a-\u104f\u10fb\u1360-\u1368\u166d\u166e\u16eb-\u16ed\u1735\u1736\u17d4-\u17d6\u17d8-\u17da\u1800-\u1805\u1807-\u180a\u1944\u1945\u1a1e\u1a1f\u1aa0-\u1aa6\u1aa8-\u1aad\u1b5a-\u1b60\u1bfc-\u1bff\u1c3b-\u1c3f\u1c7e\u1c7f\u1cc0-\u1cc7\u1cd3\u2016\u2017\u2020-\u2027\u2030-\u2038\u203b-\u203e\u2041-\u2043\u2047-\u2051\u2053\u2055-\u205e\u2cf9-\u2cfc\u2cfe\u2cff\u2d70\u2e00\u2e01\u2e06-\u2e08\u2e0b\u2e0e-\u2e16\u2e18\u2e19\u2e1b\u2e1e\u2e1f\u2e2a-\u2e2e\u2e30-\u2e39\u3001-\u3003\u303d\u30fb\ua4fe\ua4ff\ua60d-\ua60f\ua673\ua67e\ua6f2-\ua6f7\ua874-\ua877\ua8ce\ua8cf\ua8f8-\ua8fa\ua92e\ua92f\ua95f\ua9c1-\ua9cd\ua9de\ua9df\uaa5c-\uaa5f\uaade\uaadf\uaaf0\uaaf1\uabeb\ufe10-\ufe16\ufe19\ufe30\ufe45\ufe46\ufe49-\ufe4c\ufe50-\ufe52\ufe54-\ufe57\ufe5f-\ufe61\ufe68\ufe6a\ufe6b\uff01-\uff03\uff05-\uff07\uff0a\uff0c\uff0e\uff0f\uff1a\uff1b\uff1f\uff20\uff3c\uff61\uff64\uff65]+/g, "")).replace(/[ ]+/g, ' ').replace(/ /g, '_')
}

group = function (array, _function) {
	var group = {};

	_.each(array, function (el, i) {

		var index = _function(el, i);

		if (!index) return;

		if (!group[index])
			group[index] = [];

		group[index].push(el);

	})

	return group;
}

nl2br = function (str) {
	return str.replace(/\n/g, '<br/>');
}

nl2space = function (str) {
	return str.replace(/\n/g, ' ');
}

lazyEach = function(p){

    var progressMap = {
        "after" : ["success", "fail", "after"]
    }

    var failbool = false;

    var progressIncrease = function(name){

        if(name == "fail") failbool = true;

        var newName;

        _.find(progressMap, function(item, _name){
            if(_.indexOf(item, name) > -1){
                newName = _name;
                return true;
            } 
        })

        if(newName){
            if(!i[newName]) i[newName] = 0;

            i[newName]++;
        }
    }

    var calcProgress = function(i){
        return _.reduce(i, function(sum, value){
            return sum + value;
        }, 0)
    }

    var go = function(index){
        var each = extendFunctions(p.array[index], p.each, index);

        each.item = p.array[index];

        p.action(each, index);
    }

    var extendFunctions = function(item, each, index){
        var newEach = {};


        _.each(each, function(_each, name){

            if(typeof _each === 'function' && (name == "success" || name == "fail" || name == "after" ))
            {
                newEach[name] = function(){

                    var _arguments = arguments;				

                    var callback = function(){

                        var proggressend = function(){

                            if(p.all.success &&    !failbool) 	p.all.success(p);
                            if(p.all.fail &&  		failbool) 	p.all.fail(p);

                            //else
                            if(p.all.after) p.all.after(p);
                        }

                        progressIncrease(name);
                        progress = calcProgress(i);

                        _each(item, progress, l, _arguments, index);

                        if(p.sync) 
                        {
                            
                            if(p.array[index + 1])
                            {
                                go(index + 1);
                            }
                            else
                            {
                                proggressend();
                            }
                        }
                        else
                            if(progress == l) proggressend();
                    }

                    if(!p.syncCallbacks || progress >= index || p.sync)
                    {

                        callback();
                    }
                    else
                    {
                        var interval = setInterval(function(){

                            if(progress >= index)
                            {
                                callback();
                                clearInterval(interval);
                            }

                        },10)
                    }
                }
            }
            else
            {
                newEach[name] = _each;
            }
        })

        return newEach;
    }

    if(!p) p = {};

    p.array || (p.array = []);
    p.each || (p.each = {});
    p.all || (p.all = {});

    p.each.success || (p.each.success = function(){});
    p.each.fail || (p.each.fail = function(){});	

    if (!p.array || p.array.length == 0)
    {
        if (p.all.success)
        {
            p.all.success();
        }

        return;
    }

    var l = p.array.length,
        i = {};

    var progress = 0;

    if (p.all.before) 
        p.all.before(p);

    if(!p.sync)
    {
        _.each(p.array, function(item, index){					
            go(index)
        })
    }
    else
    {
        go(0);		
    }
}

lazyActions = function(farray, clbk){

    lazyEach({
        array : farray,
        action : function(p){

            p.item(function(){


                p.success()

            })
        },

        all : {
            success : clbk
        }
    })

}


importScripts = function(src, storage, callback, appendTo, i, app){
    if(typeof i == 'undefined' || i == null) 
        i = 0;
    else
        i++;

    if(i == src.length) callback();
    else{

        if(!storage[src[i].src])
        {	

            importScript(src[i].src, function(){
                storage[src[i].src] = true;

                importScripts(src, storage, callback, appendTo, i, app);

            }, appendTo, app, src[i].module, src[i].require);
        }
        else
        {
            importScripts(src, storage, callback, appendTo, i, app);
        }
        
    }
}

hexEncode= function(text)
{
    var ch = 0;
    var result = "";
    for (var i = 0; i < text.length; i++)
    {
        ch = text.charCodeAt(i);
        if (ch > 0xFF) ch -= 0x350;
        ch = ch.toString(16);
        while (ch.length < 2) ch = "0" + ch;
        result += ch;
    }
    return result;
}
hexDecode= function(hex)
{
    var ch = 0;
    var result = "";
    hex = trim(hex);
    for (var i = 2; i <= hex.length; i += 2)
    {
        ch = parseInt(hex.substring(i - 2, i), 16);
        if (ch >= 128) ch += 0x350;
        ch = String.fromCharCode("0x" + ch.toString(16));
        result += ch;
    }
    return result;
}

importScript = function(src, callback, appendTo, app, module, _require) {
    if(_Node || (typeof _Electron != 'undefined' && _Electron == true)) {
        src = src.split("?")[0];

        var pref = '../';

        if(typeof _Electron != 'undefined' && _Electron == true) pref = './'

        if (module) {
            delete require.cache[require.resolve(pref + src)]
            
            var script = require(pref + src);

            app.modules[module] = {
                module : script
            }

            app.modules[module].module.app = app;
        }
        else
        {

            if (_require){
                if(typeof _require == 'function'){
                    _require()
                }
                else{
                    window[_require] = require(pref + src)
                }
                
            }
            else
            {
                require(pref + src);
            }

            
        }

        callback();
        return;
    }


    var script = document.createElement('script');

    if (!appendTo) {
        appendTo = document.getElementsByTagName('head')[0];
    }

    if (script.readyState && !script.onload) {
        // IE, Opera
        script.onreadystatechange = function() {
            if (script.readyState == "loaded" || script.readyState == "complete") {
                script.onreadystatechange = null;
                callback();
            }
        }
    }
    else {
        // Rest
        script.onload = callback;
    }

    if (src.indexOf('v=') == -1)
        src += "?v=120"

    script.src = src;
    
    appendTo.appendChild(script);
}

importCss = function(src, _document) { 

    if(!_document) _document = document

    var link = _document.createElement('link');
    link.rel = 'stylesheet';


    src += "?v=118"

    link.setAttribute('href', src);
    
    var appendTo = _document.getElementsByTagName('body')[0];

    appendTo.appendChild(link);
}




var dateFormat = function () {
    var e = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g, t = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g, n = /[^-+\dA-Z]/g, r = function (e, t) {
        e = String(e);
        t = t || 2;
        while (e.length < t)
            e = "0" + e;
        return e
    };
    return function (i, s, o) {
        var u = dateFormat;
        if (arguments.length == 1 && Object.prototype.toString.call(i) == "[object String]" && !/\d/.test(i)) {
            s = i;
            i = undefined
        }
        i = i ? new Date(i) : new Date;
        if (isNaN(i))
            throw SyntaxError("invalid date");
        s = String(u.masks[s] || s || u.masks["default"]);
        if (s.slice(0, 4) == "UTC:") {
            s = s.slice(4);
            o = true
        }
        var a = o ? "getUTC" : "get", f = i[a + "Date"](), l = i[a + "Day"](), c = i[a + "Month"](), h = i[a + "FullYear"](), p = i[a + "Hours"](), d = i[a + "Minutes"](), v = i[a + "Seconds"](), m = i[a + "Milliseconds"](), g = o ? 0 : i.getTimezoneOffset(), y = {d: f, dd: r(f), ddd: u.i18n.dayNames[l], dddd: u.i18n.dayNames[l + 7], m: c + 1, mm: r(c + 1), mmm: u.i18n.monthNames[c], mmmm: u.i18n.monthNames[c + 12], yy: String(h).slice(2), yyyy: h, h: p % 12 || 12, hh: r(p % 12 || 12), H: p, HH: r(p), M: d, MM: r(d), s: v, ss: r(v), l: r(m, 3), L: r(m > 99 ? Math.round(m / 10) : m), t: p < 12 ? "a" : "p", tt: p < 12 ? "am" : "pm", T: p < 12 ? "A" : "P", TT: p < 12 ? "AM" : "PM", Z: o ? "UTC" : (String(i).match(t) || [""]).pop().replace(n, ""), o: (g > 0 ? "-" : "+") + r(Math.floor(Math.abs(g) / 60) * 100 + Math.abs(g) % 60, 4), S: ["th", "st", "nd", "rd"][f % 10 > 3 ? 0 : (f % 100 - f % 10 != 10) * f % 10]};
        return s.replace(e, function (e) {
            return e in y ? y[e] : e.slice(1, e.length - 1)
        })
    }
}();
dateFormat.masks = {"default": "ddd mmm dd yyyy HH:MM:ss", shortDate: "m/d/yy", mediumDate: "mmm d, yyyy", longDate: "mmmm d, yyyy", fullDate: "dddd, mmmm d, yyyy", shortTime: "h:MM TT", mediumTime: "h:MM:ss TT", longTime: "h:MM:ss TT Z", isoDate: "yyyy-mm-dd", isoTime: "HH:MM:ss", isoDateTime: "yyyy-mm-dd'T'HH:MM:ss", isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"};
dateFormat.i18n = {dayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], monthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]}

Date.prototype.addDays = function( d ) {
   this.setDate( this.getDate() + d ) ;
   return this;
};
Date.prototype.format=function(e,t){return dateFormat(this,e,t)}
Date.prototype.addMonths=function(b){a=new Date(this.valueOf());a.setMonth(a.getMonth()+b);return a};
Date.prototype.addDays=function(b){a=new Date(this.valueOf());a.setDate(a.getDate()+b);return a};
Date.prototype.addHours=function(b){a=new Date(this.valueOf());a.setHours(this.getHours()+b);return a};
Date.prototype.addMinutes=function(b){a=new Date(this.valueOf());a.setMinutes(this.getMinutes()+b);return a};
Date.prototype.addSeconds=function(b){a=new Date(this.valueOf());a.setSeconds(this.getSeconds()+b);return a};
Date.prototype.lastDayOfMonth=function(){return new Date(this.getFullYear(),this.getMonth()+1,0).getDate()};

Date.prototype.yyyymmdd = function(d) {
    var mm = this.getMonth() + 1; // getMonth() is zero-based
    var dd = this.getDate();

    return [this.getFullYear(),
          (mm > 9 ? '' : '0') + mm,
          (dd > 9 ? '' : '0') + dd
    ].join(d || '');
};


trydecode = function(s = ''){
    var r = s
    try{
        r = decodeURIComponent(s)
    }catch(e){

    }

    return r
}