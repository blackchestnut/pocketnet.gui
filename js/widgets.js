/*! iFrame Resizer (iframeSizer.min.js ) - v4.3.1 - 2021-01-11
 *  Desc: Force cross domain iframes to size to content.
 *  Requires: iframeResizer.contentWindow.min.js to be loaded into the target frame.
 *  Copyright: (c) 2021 David J. Bradshaw - dave@bradshaw.net
 *  License: MIT
 */
var initiframeresizerInited = false
var initiframeresizer = function(){
    if(initiframeresizerInited) return
    initiframeresizerInited = true


    
    !function(l){if("undefined"!=typeof window){var e,m=0,g=!1,o=!1,x="message".length,M="[iFrameSizer]",I=M.length,k=null,r=window.requestAnimationFrame,h={max:1,scroll:1,bodyScroll:1,documentElementScroll:1},F={},i=null,p={autoResize:!0,bodyBackground:null,bodyMargin:null,bodyMarginV1:8,bodyPadding:null,checkOrigin:!0,inPageLinks:!1,enablePublicMethods:!0,heightCalculationMethod:"bodyOffset",id:"iFrameResizer",interval:32,log:!1,maxHeight:1/0,maxWidth:1/0,minHeight:0,minWidth:0,mouseEvents:!0,resizeFrom:"parent",scrolling:!1,sizeHeight:!0,sizeWidth:!1,warningTimeout:5e3,tolerance:0,widthCalculationMethod:"scroll",onClose:function(){return!0},onClosed:function(){},onInit:function(){},onMessage:function(){N("onMessage function not defined")},onMouseEnter:function(){},onMouseLeave:function(){},onResized:function(){},onScroll:function(){return!0}},z={};window.jQuery&&((e=window.jQuery).fn?e.fn.iFrameResize||(e.fn.iFrameResize=function(i){return this.filter("iframe").each(function(e,n){d(n,i)}).end()}):E("","Unable to bind to jQuery, it is not fully loaded.")),"function"==typeof define&&define.amd?define([],v):"object"==typeof module&&"object"==typeof module.exports&&(module.exports=v()),window.iFrameResize=window.iFrameResize||v()}function w(){return window.MutationObserver||window.WebKitMutationObserver||window.MozMutationObserver}function O(e,n,i){e.addEventListener(n,i,!1)}function R(e,n,i){e.removeEventListener(n,i,!1)}function a(e){return M+"["+function(e){var n="Host page: "+e;return window.top!==window.self&&(n=window.parentIFrame&&window.parentIFrame.getId?window.parentIFrame.getId()+": "+e:"Nested host page: "+e),n}(e)+"]"}function t(e){return F[e]?F[e].log:g}function T(e,n){s("log",e,n,t(e))}function E(e,n){s("info",e,n,t(e))}function N(e,n){s("warn",e,n,!0)}function s(e,n,i,t){!0===t&&"object"==typeof window.console&&console[e](a(n),i)}function n(n){function e(){i("Height"),i("Width"),L(function(){A(y),H(v),c("onResized",y)},y,"init")}function i(e){var n=Number(F[v]["max"+e]),i=Number(F[v]["min"+e]),t=e.toLowerCase(),o=Number(y[t]);T(v,"Checking "+t+" is in range "+i+"-"+n),o<i&&(o=i,T(v,"Set "+t+" to min value")),n<o&&(o=n,T(v,"Set "+t+" to max value")),y[t]=""+o}function t(e){return b.substr(b.indexOf(":")+x+e)}function a(e,n){!function(e,n,i){z[i]||(z[i]=setTimeout(function(){z[i]=null,e()},n))}(function(){B("Send Page Info","pageInfo:"+function(){var e=document.body.getBoundingClientRect(),n=y.iframe.getBoundingClientRect();return JSON.stringify({iframeHeight:n.height,iframeWidth:n.width,clientHeight:Math.max(document.documentElement.clientHeight,window.innerHeight||0),clientWidth:Math.max(document.documentElement.clientWidth,window.innerWidth||0),offsetTop:parseInt(n.top-e.top,10),offsetLeft:parseInt(n.left-e.left,10),scrollTop:window.pageYOffset,scrollLeft:window.pageXOffset,documentHeight:document.documentElement.clientHeight,documentWidth:document.documentElement.clientWidth,windowHeight:window.innerHeight,windowWidth:window.innerWidth})}(),e,n)},32,n)}function r(e){var n=e.getBoundingClientRect();return S(v),{x:Math.floor(Number(n.left)+Number(k.x)),y:Math.floor(Number(n.top)+Number(k.y))}}function o(e){var n=e?r(y.iframe):{x:0,y:0},i={x:Number(y.width)+n.x,y:Number(y.height)+n.y};T(v,"Reposition requested from iFrame (offset x:"+n.x+" y:"+n.y+")"),window.top!==window.self?window.parentIFrame?window.parentIFrame["scrollTo"+(e?"Offset":"")](i.x,i.y):N(v,"Unable to scroll to requested position, window.parentIFrame not found"):(k=i,s(),T(v,"--"))}function s(){!1!==c("onScroll",k)?H(v):j()}function d(e){var n={};if(0===Number(y.width)&&0===Number(y.height)){var i=t(9).split(":");n={x:i[1],y:i[0]}}else n={x:y.width,y:y.height};c(e,{iframe:y.iframe,screenX:Number(n.x),screenY:Number(n.y),type:y.type})}function c(e,n){return W(v,e,n)}var u,f,l,m,g,h,p,w,b=n.data,y={},v=null;"[iFrameResizerChild]Ready"===b?function(){for(var e in F)B("iFrame requested init",q(e),F[e].iframe,e)}():M===(""+b).substr(0,I)&&b.substr(I).split(":")[0]in F?(g=b.substr(I).split(":"),h=g[1]?parseInt(g[1],10):0,p=F[g[0]]&&F[g[0]].iframe,w=getComputedStyle(p),y={iframe:p,id:g[0],height:h+function(e){if("border-box"!==e.boxSizing)return 0;var n=e.paddingTop?parseInt(e.paddingTop,10):0,i=e.paddingBottom?parseInt(e.paddingBottom,10):0;return n+i}(w)+function(e){if("border-box"!==e.boxSizing)return 0;var n=e.borderTopWidth?parseInt(e.borderTopWidth,10):0,i=e.borderBottomWidth?parseInt(e.borderBottomWidth,10):0;return n+i}(w),width:g[2],type:g[3]},v=y.id,F[v]&&(F[v].loaded=!0),(m=y.type in{true:1,false:1,undefined:1})&&T(v,"Ignoring init message from meta parent page"),!m&&(l=!0,F[f=v]||(l=!1,N(y.type+" No settings for "+f+". Message was: "+b)),l)&&(T(v,"Received: "+b),u=!0,null===y.iframe&&(N(v,"IFrame ("+y.id+") not found"),u=!1),u&&function(){var e,i=n.origin,t=F[v]&&F[v].checkOrigin;if(t&&""+i!="null"&&!(t.constructor===Array?function(){var e=0,n=!1;for(T(v,"Checking connection is from allowed list of origins: "+t);e<t.length;e++)if(t[e]===i){n=!0;break}return n}():(e=F[v]&&F[v].remoteHost,T(v,"Checking connection is from: "+e),i===e)))throw new Error("Unexpected message received from: "+i+" for "+y.iframe.id+". Message was: "+n.data+". This error can be disabled by setting the checkOrigin: false option or by providing of array of trusted domains.");return!0}()&&function(){switch(F[v]&&F[v].firstRun&&F[v]&&(F[v].firstRun=!1),y.type){case"close":C(y.iframe);break;case"message":!function(e){T(v,"onMessage passed: {iframe: "+y.iframe.id+", message: "+e+"}"),c("onMessage",{iframe:y.iframe,message:JSON.parse(e)}),T(v,"--")}(t(6));break;case"mouseenter":d("onMouseEnter");break;case"mouseleave":d("onMouseLeave");break;case"autoResize":F[v].autoResize=JSON.parse(t(9));break;case"scrollTo":o(!1);break;case"scrollToOffset":o(!0);break;case"pageInfo":a(F[v]&&F[v].iframe,v),function(){function e(n,i){function t(){F[r]?a(F[r].iframe,r):o()}["scroll","resize"].forEach(function(e){T(r,n+e+" listener for sendPageInfo"),i(window,e,t)})}function o(){e("Remove ",R)}var r=v;e("Add ",O),F[r]&&(F[r].stopPageInfo=o)}();break;case"pageInfoStop":F[v]&&F[v].stopPageInfo&&(F[v].stopPageInfo(),delete F[v].stopPageInfo);break;case"inPageLink":!function(e){var n,i=e.split("#")[1]||"",t=decodeURIComponent(i),o=document.getElementById(t)||document.getElementsByName(t)[0];o?(n=r(o),T(v,"Moving to in page link (#"+i+") at x: "+n.x+" y: "+n.y),k={x:n.x,y:n.y},s(),T(v,"--")):window.top!==window.self?window.parentIFrame?window.parentIFrame.moveToAnchor(i):T(v,"In page link #"+i+" not found and window.parentIFrame not found"):T(v,"In page link #"+i+" not found")}(t(9));break;case"reset":P(y);break;case"init":e(),c("onInit",y.iframe);break;default:0===Number(y.width)&&0===Number(y.height)?N("Unsupported message received ("+y.type+"), this is likely due to the iframe containing a later version of iframe-resizer than the parent page"):e()}}())):E(v,"Ignored: "+b)}function W(e,n,i){var t=null,o=null;if(F[e]){if("function"!=typeof(t=F[e][n]))throw new TypeError(n+" on iFrame["+e+"] is not a function");o=t(i)}return o}function b(e){var n=e.id;delete F[n]}function C(e){var n=e.id;if(!1!==W(n,"onClose",n)){T(n,"Removing iFrame: "+n);try{e.parentNode&&e.parentNode.removeChild(e)}catch(e){N(e)}W(n,"onClosed",n),T(n,"--"),b(e)}else T(n,"Close iframe cancelled by onClose event")}function S(e){null===k&&T(e,"Get page position: "+(k={x:window.pageXOffset!==l?window.pageXOffset:document.documentElement.scrollLeft,y:window.pageYOffset!==l?window.pageYOffset:document.documentElement.scrollTop}).x+","+k.y)}function H(e){null!==k&&(window.scrollTo(k.x,k.y),T(e,"Set page position: "+k.x+","+k.y),j())}function j(){k=null}function P(e){T(e.id,"Size reset requested by "+("init"===e.type?"host page":"iFrame")),S(e.id),L(function(){A(e),B("reset","reset",e.iframe,e.id)},e,"reset")}function A(n){function i(e){o||"0"!==n[e]||(o=!0,T(t,"Hidden iFrame detected, creating visibility listener"),function(){function n(){Object.keys(F).forEach(function(e){!function(n){function e(e){return"0px"===(F[n]&&F[n].iframe.style[e])}F[n]&&null!==F[n].iframe.offsetParent&&(e("height")||e("width"))&&B("Visibility change","resize",F[n].iframe,n)}(e)})}function i(e){T("window","Mutation observed: "+e[0].target+" "+e[0].type),c(n,16)}var t=w();t&&function(){var e=document.querySelector("body");new t(i).observe(e,{attributes:!0,attributeOldValue:!1,characterData:!0,characterDataOldValue:!1,childList:!0,subtree:!0})}()}())}function e(e){!function(e){n.id?(n.iframe.style[e]=n[e]+"px",T(n.id,"IFrame ("+t+") "+e+" set to "+n[e]+"px")):T("undefined","messageData id not set")}(e),i(e)}var t=n.iframe.id;F[t]&&(F[t].sizeHeight&&e("height"),F[t].sizeWidth&&e("width"))}function L(e,n,i){i!==n.type&&r&&!window.jasmine?(T(n.id,"Requesting animation frame"),r(e)):e()}function B(e,n,i,t,o){var r,a=!1;t=t||i.id,F[t]&&(i&&"contentWindow"in i&&null!==i.contentWindow?(r=F[t]&&F[t].targetOrigin,T(t,"["+e+"] Sending msg to iframe["+t+"] ("+n+") targetOrigin: "+r),i.contentWindow.postMessage(M+n,r)):N(t,"["+e+"] IFrame("+t+") not found"),o&&F[t]&&F[t].warningTimeout&&(F[t].msgTimeout=setTimeout(function(){!F[t]||F[t].loaded||a||(a=!0,N(t,"IFrame has not responded within "+F[t].warningTimeout/1e3+" seconds. Check iFrameResizer.contentWindow.js has been loaded in iFrame. This message can be ignored if everything is working, or you can set the warningTimeout option to a higher value or zero to suppress this warning."))},F[t].warningTimeout)))}function q(e){return e+":"+F[e].bodyMarginV1+":"+F[e].sizeWidth+":"+F[e].log+":"+F[e].interval+":"+F[e].enablePublicMethods+":"+F[e].autoResize+":"+F[e].bodyMargin+":"+F[e].heightCalculationMethod+":"+F[e].bodyBackground+":"+F[e].bodyPadding+":"+F[e].tolerance+":"+F[e].inPageLinks+":"+F[e].resizeFrom+":"+F[e].widthCalculationMethod+":"+F[e].mouseEvents}function d(i,e){function n(e){var n=e.split("Callback");if(2===n.length){var i="on"+n[0].charAt(0).toUpperCase()+n[0].slice(1);this[i]=this[e],delete this[e],N(c,"Deprecated: '"+e+"' has been renamed '"+i+"'. The old method will be removed in the next major version.")}}var t,o,r,a,s,d,c=(""===(o=i.id)&&(i.id=(t=e&&e.id||p.id+m++,null!==document.getElementById(t)&&(t+=m++),o=t),g=(e||{}).log,T(o,"Added missing iframe ID: "+o+" ("+i.src+")")),o);function u(e){1/0!==F[c][e]&&0!==F[c][e]&&(i.style[e]=F[c][e]+"px",T(c,"Set "+e+" = "+F[c][e]+"px"))}function f(e){if(F[c]["min"+e]>F[c]["max"+e])throw new Error("Value for min"+e+" can not be greater than max"+e)}c in F&&"iFrameResizer"in i?N(c,"Ignored iFrame, already setup."):(d=(d=e)||{},F[c]={firstRun:!0,iframe:i,remoteHost:i.src&&i.src.split("/").slice(0,3).join("/")},function(e){if("object"!=typeof e)throw new TypeError("Options is not an object")}(d),Object.keys(d).forEach(n,d),function(e){for(var n in p)Object.prototype.hasOwnProperty.call(p,n)&&(F[c][n]=Object.prototype.hasOwnProperty.call(e,n)?e[n]:p[n])}(d),F[c]&&(F[c].targetOrigin=!0===F[c].checkOrigin?function(e){return""===e||null!==e.match(/^(about:blank|javascript:|file:\/\/)/)?"*":e}(F[c].remoteHost):"*"),function(){switch(T(c,"IFrame scrolling "+(F[c]&&F[c].scrolling?"enabled":"disabled")+" for "+c),i.style.overflow=!1===(F[c]&&F[c].scrolling)?"hidden":"auto",F[c]&&F[c].scrolling){case"omit":break;case!0:i.scrolling="yes";break;case!1:i.scrolling="no";break;default:i.scrolling=F[c]?F[c].scrolling:"no"}}(),f("Height"),f("Width"),u("maxHeight"),u("minHeight"),u("maxWidth"),u("minWidth"),"number"!=typeof(F[c]&&F[c].bodyMargin)&&"0"!==(F[c]&&F[c].bodyMargin)||(F[c].bodyMarginV1=F[c].bodyMargin,F[c].bodyMargin=F[c].bodyMargin+"px"),r=q(c),(s=w())&&(a=s,i.parentNode&&new a(function(e){e.forEach(function(e){Array.prototype.slice.call(e.removedNodes).forEach(function(e){e===i&&C(i)})})}).observe(i.parentNode,{childList:!0})),O(i,"load",function(){B("iFrame.onload",r,i,l,!0),function(){var e=F[c]&&F[c].firstRun,n=F[c]&&F[c].heightCalculationMethod in h;!e&&n&&P({iframe:i,height:0,width:0,type:"init"})}()}),B("init",r,i,l,!0),F[c]&&(F[c].iframe.iFrameResizer={close:C.bind(null,F[c].iframe),removeListeners:b.bind(null,F[c].iframe),resize:B.bind(null,"Window resize","resize",F[c].iframe),moveToAnchor:function(e){B("Move to anchor","moveToAnchor:"+e,F[c].iframe,c)},sendMessage:function(e){B("Send Message","message:"+(e=JSON.stringify(e)),F[c].iframe,c)}}))}function c(e,n){null===i&&(i=setTimeout(function(){i=null,e()},n))}function u(){"hidden"!==document.visibilityState&&(T("document","Trigger event: Visiblity change"),c(function(){f("Tab Visable","resize")},16))}function f(n,i){Object.keys(F).forEach(function(e){!function(e){return F[e]&&"parent"===F[e].resizeFrom&&F[e].autoResize&&!F[e].firstRun}(e)||B(n,i,F[e].iframe,e)})}function y(){O(window,"message",n),O(window,"resize",function(){!function(e){T("window","Trigger event: "+e),c(function(){f("Window "+e,"resize")},16)}("resize")}),O(document,"visibilitychange",u),O(document,"-webkit-visibilitychange",u)}function v(){function i(e,n){n&&(function(){if(!n.tagName)throw new TypeError("Object is not a valid DOM element");if("IFRAME"!==n.tagName.toUpperCase())throw new TypeError("Expected <IFRAME> tag, found <"+n.tagName+">")}(),d(n,e),t.push(n))}var t;return function(){var e,n=["moz","webkit","o","ms"];for(e=0;e<n.length&&!r;e+=1)r=window[n[e]+"RequestAnimationFrame"];r?r=r.bind(window):T("setup","RequestAnimationFrame not supported")}(),y(),function(e,n){switch(t=[],function(e){e&&e.enablePublicMethods&&N("enablePublicMethods option has been removed, public methods are now always available in the iFrame")}(e),typeof n){case"undefined":case"string":Array.prototype.forEach.call(document.querySelectorAll(n||"iframe"),i.bind(l,e));break;case"object":i(e,n);break;default:throw new TypeError("Unexpected data type ("+typeof n+")")}return t}}}();
    //# sourceMappingURL=iframeResizer.map
}


var PNWIDGETS = function(){
    var self = this

    self.renders = {
        iframe : function(seed, action, id, p){

            var domain = window.pocketnetdomain || 'pocketnet.app'
            
            return '<iframe width="100%" src="https://'+domain+'/openapi.html?action='+action+'&id='+id+'&embeddingSettigns='+p+'" id="pocketnet_iframe_'+seed+'" scrolling="no" style="border: none;" frameborder="0" marginheight="0" marginwidth="0" loading="lazy" allowfullscreen allowautoplay></iframe>'
        }
    }

    self.make = function(seed, action, id, p, fast, __el, resized, additional){

        console.log("MAKE", additional, id, action)

        if(!additional) additional = {}

        var elem = document.getElementById('pocketnet_' + seed);

        if (window.POCKETNETINSTANCE && fast){

            elem = $(__el).find('#pocketnet_' + seed)

            var app = window.POCKETNETINSTANCE

            var embeddingSettigns = {
                id : makeid()
            }
            
            try{
                embeddingSettigns = JSON.parse(hexDecode(p || "7B7D"))
            }catch(e){}

            embeddingSettigns.openapi = true

            embeddingSettigns = _.extend(embeddingSettigns, additional)

            elem.addClass('openapipnet')

            app.platform.papi[action](id, elem, null, embeddingSettigns, additional)

            if(action == 'transaction') return false

            if(app.curation()) return false

            return true
        }
        else{

            initiframeresizer()

            elem.innerHTML = self.renders.iframe(seed, action, id, p, additional)

            var domain = window.pocketnetdomain || 'pocketnet.app'

            if(typeof iFrameResize != 'undefined')
                var iframe = iFrameResize({

                    checkOrigin : ['https://'+domain],

                    onResized : function(){
                        //window.requestAnimationFrame(function(){
                            if (resized)
                                resized()

                        //s})
                    },
                    onBeforeResized : function(){
                        
                        if (resized)
                            resized(true)
                    
                        
                    }

                },'#pocketnet_iframe_' + seed)

        }

        
    }


    self.url = function(url){

        var parsed_url = new URL(url)

        var postid = parsed_url.searchParams.get('s') || parsed_url.searchParams.get('v')

        var action = parsed_url.searchParams.get('commentid') ? 'comment' 
                                                    : postid ? 'lenta' : 'channel'

        var id = action === 'channel' ? parsed_url.pathname.replace('/', '') : postid

        if(id == 'author' && action === 'channel' ) id = parsed_url.searchParams.get('address')

        var connect = parsed_url.searchParams.get('connect')
        var publicroom = parsed_url.searchParams.get('publicroom')

        var additional = {
            
            commentPs : {
                commentid : parsed_url.searchParams.get('commentid'),
                parentid : parsed_url.searchParams.get('parentid'),
            },

            node : parsed_url.searchParams.get('node') || null
        }

        if (connect) {
            action = 'connect'
            id = connect
        }

        if (publicroom) {
            action = 'publicroom'
            id = publicroom
        }

        var p = '7b22626c61636b223a66616c73652c22636f6d6d656e7473223a226e6f222c22726566223a2250503538325634375038764376586a645633696e77594e677853635a437554577371227d'

        var txid = parsed_url.searchParams.get('stx')

        if (txid) {
            ///pocketnet://i?stx=txid

            id = txid
            action = 'transaction'
        }


        return {
            action : action,
            id : id,
            p : p,
            additional
        }

    }

    self.makefromurl = function(el, url, resized, additional){

        var seed = Math.floor(Math.random() * 100000)

        var h = '<div id="pocketnet_'+seed+'">'
            h += '</div>'

        el.innerHTML = h

        var ps = self.url(url)

        ps.additional || (ps.additional = {})

        ps.additional = _.extend(ps.additional, additional || {})

        return self.make(seed, ps.action, ps.id, ps.p, true, el, resized, ps.additional)

    }

    return self
} 

window.PNWIDGETS = PNWIDGETS
