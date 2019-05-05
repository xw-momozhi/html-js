var packing=(function(){
	var m_document_addEventListener = document.addEventListener;
	var m_document_removeEventListener = document.removeEventListener;
	var m_window_addEventListener = window.addEventListener;
	var m_window_removeEventListener = window.removeEventListener;
	var documentEventHandlers = {},//事件订阅
    windowEventHandlers = {};//事件订阅
	document.addEventListener=function(evt, handler, capture){
		var e = evt.toLowerCase();
		if (typeof documentEventHandlers[e] != 'undefined') {
			documentEventHandlers[e].subscribe(handler);
		} else {
			m_document_addEventListener.call(document, evt, handler, capture);
		}
	}
	window.addEventListener=function(evt, handler, capture){
		var e = evt.toLowerCase();
		if (typeof windowEventHandlers[e] != 'undefined') {
			windowEventHandlers[e].subscribe(handler);
		} else {
			m_document_addEventListener.call(window, evt, handler, capture);
		}
	}
	document.removeEventListener = function(evt, handler, capture) {
		var e = evt.toLowerCase();
		if (typeof documentEventHandlers[e] != "undefined") {
			documentEventHandlers[e].unsubscribe(handler);
		} else {
			m_document_removeEventListener.call(document, evt, handler, capture);
		}
	};

	window.removeEventListener = function(evt, handler, capture) {
		var e = evt.toLowerCase();
		if (typeof windowEventHandlers[e] != "undefined") {
			windowEventHandlers[e].unsubscribe(handler);
		} else {
			m_window_removeEventListener.call(window, evt, handler, capture);
		}
	};
	
	//触发事件
	function evenTrigger(evt,data){
		var evenName = evt.toLowerCase();
		if (typeof windowEventHandlers[evenName] != 'undefined') {
			windowEventHandlers[evenName].trigger(data);
		}else if (typeof documentEventHandlers[evenName] != 'undefined') {
			documentEventHandlers[evenName].trigger(data);
		}else {
			var myEvent = new CustomEvent(evenName,{detail:data});
			// 随后在对应的元素上触发该事件
			if(window.dispatchEvent) {  
				document.dispatchEvent(myEvent);
			} else {
				document.dispatchEvent(myEvent);
			}
		}
	}
	//添加自定义事件
	function addEvent(evenName,handler){
		if (typeof documentEventHandlers[evenName] != "undefined") {
			documentEventHandlers[evenName]=new PubSub()
		}
		window.addEventListener(evenName, handler,false);
		pushEven[evenName]=handler;
	}
	//移除自定义事件
	function removeEvent(evenName,handler){
		window.removeEventListener(evenName,handler,false);
	    delete pushEven[evenName];
	}
	function PubSub() {
	  this.handlers = [];
	}
	PubSub.prototype = {
		// 订阅事件
		subscribe: function(handler){
			this.handlers.push(handler);
			return this;
		},
		 // 触发事件(发布事件)
		trigger: function(data){
		   var self = this;
		   for(var i = 0; i < self.handlers.length; i++) {
			 self.handlers[i].apply(self,[data]);
		   }
		   return self;
		},
		// 删除订阅事件
		unsubscribe: function(eventType, handler){
			var currentEvent = this.handlers;
			var len = 0;
			if (currentEvent) {
				len = currentEvent.length;
				for (var i = len - 1; i >= 0; i--){
					if (currentEvent[i] === handler){
						currentEvent.splice(i, 1);
					}
				}
			}
			return this;
		}
	};
	documentEventHandlers["deviceready"]=new PubSub();
	/**以上是对事件的处理**/
	
	var evenID=0;
	var delEven={};
	var pushEven={};
	function addEventCllback(ev,cllback){
		var cllbackID="cllbackID"+evenID++;
		if(ev && ev._funname){
			delEven[ev._funname]=delEven[ev._funname]||[];//记录调用方法时传入的回调方法
			delEven[ev._funname].push(cllbackID);
		}
		addEvent(cllbackID,function(e){
			 removeEven();
			 if(ev){
				  cllback.apply(ev,e.detail);
			 }else{
				  cllback.apply(window,e.detail);
			 }
		})
		function removeEven(){
			if(ev && ev._funname && delEven[ev._funname]){
				for(var i=0;i<delEven[ev._funname].length;i++){
					var id=delEven[ev._funname][i];
					removeEvent(id,pushEven[id])
				}
				delete delEven[ev._funname];
			}
		}
		return cllbackID;
	}
	//回调方法转换成回调方法字符串
	function getFunctionString(ev,cllback){
		var str="function:";
		var data={
			callbackId:addEventCllback(ev,cllback),
			parames:[]
		};
		return str+JSON.stringify(data);
	}
	//将穿过来的方法字符串 转换成方法对象
	function getFunction(str){
		var data=JSON.parse(str.replace(/^function:/,""));
		return function(){
			var parames;
			if(arguments.length>0){
				parames=[];
				for(var i=0;i<arguments.length;i++){
					parames.push(arguments[i])
				}
			}
			parames._funname=data.callbackId;
			//这里的参数回调是一次性的
			packing.sendMessage(data.callbackId,parames,true)
		}
	}
	//发送数据过滤
	function stringJson(json){
		var _cordova={}
		if(json instanceof Array){
			_cordova=[];
		}
		each(json,_cordova)
		function each(data,_data){
			for(var i in data){
				if(typeof(data[i])=="function"){
					_data[i]=getFunctionString(data,data[i]);
				}else if(data[i] instanceof Object){
					_data[i]={}
					each(data[i],_data[i]);
				}else if(data[i] instanceof Array){
					_data[i]=[]
					each(data[i],_data[i]);
				}else{
					_data[i]=data[i]
				}
			}
		}
		return _cordova;
	}
	//接收数据过滤
	function acceptJson(json){
		each(json)
		function each(data){
			for(var i in data){
				if(typeof(data[i])=="string" && data[i].search(/^function/)>=0){
					data[i]=getFunction(data[i]);
				}else if(data[i] instanceof Object){
					each(data[i]);
				}else if(data[i] instanceof Array){
					each(data[i]);
				}
			}
		}
		return json;
	}
	//监听消息
	window.addEventListener('message',function(event){
		if(event && event.data){
			var data=event.data;
			acceptJson(data.data);
			evenTrigger(data.name,data.data);
		}
	}, false);
	
	return {
		setStringJson:stringJson,
		sendMessage:function(name,json){//发送消息
			//向子窗口发送消息
			//window.frames[0].postMessage({name:name,data:stringJson(json)}, '*');
			//向父窗口发送消息
			window.parent.postMessage({name:name,data:stringJson(json)}, '*');
		},
		evenfilter:function(callback){//过滤注册事件参数
			return function(e){
				if(e && e.detail){
					var detail=e.detail;
					if(callback){
						callback(detail);
					}
				}else{
					if(callback){
						callback(detail);
					}
				}
			}
		}
	}
})();
