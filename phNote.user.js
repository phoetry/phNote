// ==UserScript==
// @name ~
// @include http*
// ==/UserScript==
!function(sto){"use strict";
null==sto||(
	window.phNote=function(){
		// 配置选项
		var pref={
			width:200,							// 宽度固定值
			height:160,							// 高度最小值
			saveOnDrag:true,					// 拖拽后是否自动保存(仅自动保存位置与内容)
			headBG:"#bcd9f8",					// 头部背景色
			mainBG:"#cdeaf8",					// 主体背景色
			dateParse:"yyyy/MM/dd",				// 日期格式, yyyy:年, MM:月, dd:日
			setKeyboard:"shift+D"
			/***若要禁用快捷键, 请设为空字符""或数字0
			*   用加号组合快捷键, 支持Ctrl|Alt|Shift三个组合键, 不分大小写
			*   若你所设置的按键无效, 可尝试将最后一位换成按键的keyCode(数字)
			*   在浏览器地址栏输入"javascript:void(phNote.askKey());"
			*   不含引号并回车, 然后按下你所需的键, 即可弹出对应的keyCode
			*   例:'ctrl+alt+J','alt+ctrl+74','ctrl+shift+alt+192'...
			***/
		},
		// 下面别动
		items=storage('phnote'),path=location.pathname,
		body=document.body,root=document.documentElement;
		return{
			init:function(){
				try{
					items=JSON.parse(items);
				}catch(e){log(items);
					storage('phnote',null);
				}
				isObj(items)?
				Object.keys(items).forEach(function(t,z){
					(z=items[t])&&
					z.path===path&&
					phNote.addNote(t,z);
				}):items={};
				pref.setKeyboard&&this.setKey();
			},
			addNote:function(idx,note){
				note=note||{};
				this.setCss();
				var z,box=cEle('div')('className','phnote_container')(),
				head=box.appendChild(cEle('div')
					('className','phnote_head')
					('innerHTML','<a class=phnote_save title=保存>s</a><a class=phnote_close title=删除>x</a>'+(note.modi?this.setDate(note.modi):'未保存'))()
				),
				content=box.appendChild(cEle('div')
					('contentEditable',true)
					('innerHTML',note.content||'')
					('className','phnote_content')()
				),
				save=function(e){
					var now=new Date,modi='click'!==e.type&&note.modi;
					modi||(head.lastChild.nodeValue=phNote.setDate(now));
					items[idx=idx||'p'+now]=note={
						path:path,modi:modi||now,
						content:content.innerHTML,
						css:box.style.cssText
					};
					storage('phnote',JSON.stringify(items));
				};
				box.style.cssText=note.css||'left:'+(z=this.setPos()).x+'px;top:'+z.y+'px';
				this.setDrag(body.appendChild(box),head,save);
				bind('click',save,$('.phnote_save',head));
				bind('click',function(){
					confirm('你想要永久删除这条便笺吗？')&&(
						delete items[idx],
						body.removeChild(box),
						storage('phnote',isEmptyObj(items)||JSON.stringify(items))
					)
				},$('.phnote_close',head));
				return content;
			},
			askKey:function(){
				bind('keydown',function(e){
					alert(String.fromCharCode(e.keyCode)+' : '+e.keyCode)
				})
			},
			setKey:function(){
				var r=/^(?:alt|ctrl|meta|shift)$/i,
				keys=pref.setKeyboard.split('+').map(function(t){
					return+(t=t.trim())||(
						t.length<3?t.toUpperCase().charCodeAt(0):
						r.test(t)?t.toLowerCase()+'Key':0
					)
				}).filter(function(t){return t});
				bind('keyup',function(e){
					keys.every(function(t){
						return e[t]||t==e.keyCode
					})&&(
						e.preventDefault(),
						phNote.addNote().focus()
					)
				});
			},
			setPos:function(){
				return{
					x:((window.innerWidth||root.clientWidth)-pref.width)/2+root.scrollLeft,
					y:((window.innerHeight||root.clientHeight)-pref.height)/2+root.scrollTop
				};
			},
			setDate:function(z){
				z=new Date(z);
				return pref.dateParse
					.replace('yyyy',z.getFullYear())
					.replace('MM',z.getMonth()+1)
					.replace('dd',z.getDate());
			},
			setArea:function(box){
				return[
					Math.max(root.clientWidth,root.scrollWidth,root.offsetWidth,body.scrollWidth,body.offsetWidth)-box.offsetWidth,
					Math.max(root.clientHeight,root.scrollHeight,root.offsetHeight,body.scrollHeight,body.offsetHeight)-box.offsetHeight
				];
			},
			setDrag:function(box,head,save){
				var x,y,area,offset,draggable=!1,
				mov={
					up:function(e){
						draggable&&pref.saveOnDrag&&save(e);
						draggable=false;
					},
					down:function(e){
						if(head===e.target){
							area=phNote.setArea(box);
							draggable=true;
							offset={
								x:e.pageX-box.offsetLeft,
								y:e.pageY-box.offsetTop
							};
						}
					},
					move:function(e){
						if(draggable){
							box.style.cssText='left:'+((x=e.pageX-offset.x)>area[0]?area[0]:x<0?0:x)+'px;top:'+((y=e.pageY-offset.y)>area[1]?area[1]:y<0?0:y)+'px';
							getSelection().removeAllRanges();
						}
					}
				};
				['up','down','move'].forEach(function(t){
					bind('mouse'+t,mov[t])
				});
				['click','dblclick','keydown'].forEach(function(t){
					bind(t,function(e){e.stopPropagation()},box)
				});
			},
			setCss:function(){
				$('#phnote_style')||
				$('head').appendChild(cEle('style')('id','phnote_style')('textContent',
					'.phnote_container{\
						z-index:99;\
						position:absolute;\
						width:'+pref.width+'px;\
						background:'+pref.mainBG+';\
						box-shadow:0 0 9px rgba(0,0,0,.9);\
						font:13px/1.5 "微软雅黑",arial,serif\
					}\
					.phnote_head{\
						color:#555;\
						height:20px;\
						cursor:move;\
						overflow:hidden;\
						text-align:center;\
						background:'+pref.headBG+';\
						font:12px/20px tahoma\
					}\
					.phnote_head a{\
						color:#555;\
						padding:0 5px;\
						cursor:pointer;\
						line-height:1.5;\
						position:absolute;\
						-webkit-transition:1s;\
						-moz-transition:1s;\
						-o-transition:1s;\
						transition:1s;\
						text-decoration:none!important\
					}\
					.phnote_save{\
						left:5px\
					}\
					.phnote_close{\
						right:5px\
					}\
					.phnote_head:hover .phnote_save{\
						color:#0a0\
					}\
					.phnote_head:hover .phnote_close{\
						color:#a00\
					}\
					.phnote_content{\
						word-wrap:break-word;\
						min-height:'+(pref.height-30)+'px;\
						padding:5px 9px;\
						outline:0 none;\
						color:#333\
					}\
					.phnote_content p{\
						margin:0;\
						padding:0\
					}'
				)());
			}
		};
		function bind(a,b,c){
			(c||document).addEventListener(a,b,false);
		}
		function storage(key,val){
			return null!=key&&(
				val===''+val||val===+val?
				sto.setItem(key,val):
				sto[val===void 0?'getItem':'removeItem'](key)
			);
		}
		function cEle(e){
			e=document.createElement(e);
			return function c(a,b){
				return null==a?e:(e[a]=b,c);
			};
		}
		function $(z,con){
			return(con||document).querySelector(z);
		}
		function isObj(z){
			return{}.toString.call(z)==='[object Object]'&&'isPrototypeOf'in z;
		}
		function isEmptyObj(z,t){
			for(t in z)
			return false;
			return isObj(z);
		}
		function log(z){
			console.log({}.toString.call(z)+' | '+z);
		}
	}()
).init();
}(window.localStorage);