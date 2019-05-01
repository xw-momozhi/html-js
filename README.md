#随便写写插

### iframe 跨域通讯 

跨域通讯  使用 window.frames[0].postMessage 发生消息 

window.addEventListener('message',function(event){}, false); 监听消息

message.js 对上面通讯方式做的封装

#### 代码演示

父页面引用 message.js 时 
packing.sendMessage 方法要修改成

sendMessage:function(name,json){//发送消息
		//向子窗口发送消息
		window.frames[0].postMessage({name:name,data:stringJson(json)}, '*');
},

```javascript
//父页面代码
function createIframe(src,load){
	var iframe=$('<iframe id="iframe" style="position: absolute;top:0;left:0;height:100%;width:100%;margin: 0; padding: 0;border: 0;" src="'+src+'"></iframe>');
	iframe.load(load)
	$("body").html(iframe);
}
window.onload=function(){
    var service={
        success:function(){
            alert("成功")
        },error:function(){
            alert("失败")
        }
    }
    //创建iframe  
	createIframe("http://192.168.80.1:9000/index.html",function(){
     //加载成功后调用
        
    //定义一个deviceready 名称 在子页面监听
    //将service对象发送到子窗口使用
		packing.sendMessage("deviceready",service)
	});
}
```

子页面引用 message.js 时 
packing.sendMessage 方法要修改成

sendMessage:function(name,json){//发送消息
	//向父窗口发送消息
	//window.parent.postMessage({name:name,data:stringJson(json)}, '*');
},

```javascript
//子页面 监听 deviceready
//packing.evenfilter 过滤事件的数据 得到的data 就是父页面传过的数据 
window.addEventListener("deviceready",packing.evenfilter(function(data){
	if(data){//将数据赋值给window
		for(var i in data){
			window[i]=data[i]
		}
		init();
	}
}),false);
function init(){
    //这样直接调用父页面的方法就行了
    service.success();
}
```


