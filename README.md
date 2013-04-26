# WE 框架

WE 框架依赖 requirejs 以及 jQuery。

文档地址：[We Framework Doc](http://webenergy.github.com/ "We Framework Doc")

## 目录结构

```
.
├── css
│   ├── compressed
│   │   ├── we-1.0.0.css
│   │   └── we-1.0.0.min.css
│   ├── src
│   │   ├── business
│   │   ├── common
│   │   ├── component
│   │   └── page
│   └── tools
│       └── compress.php
├── js
│   ├── src
│   │   ├── business
│   │   ├── component
│   │   ├── core
│   │   ├── interface
│   │   └── config.js
│   ├── release
│   │   ├── loader.js
│   │   ├── loader.min.js
│   │   └── main-debug.js
│   ├── plugin
│   ├── lib
│   ├── test
│   └── tools
│       ├── refresh.php
│       └── compress.php
└── img
```
## 不同环境下的文件引用

由于是基于 Loader 来加载页面文件。我们对于开发环境，线上环境做了一些区分。会加载不同的文件。


## 日常构建与送测

### 日常构建

对于新加入的js文件，尤其是 interface 文件夹中的文件，我们可能需要进行一下目录重新构建。
直接执行 `tools/refresh.php` 即可。在 <http://dev.we.sdoprofile.com/common/js/test/> 页面的底部，
有一个 Link: Build JS，执行这个也可以。

至于css文件的压缩。也可以执行上面页面中的 Link: Build CSS，或者执行脚本 `css/tools/compress.php`.

### 送测

打包脚本是集成在送测脚本内的。这里大致阐述一下打包脚本的逻辑。

release分支有一个 `src/main.tpl` 的模板文件，用以生成 `release/main.js`，该文件在 dev分支并不存在，请勿手动修改。
还有一个 `src/version.json` 文件，用以保存当前的文件版本号。
打包脚本会根据不同的模块的svn更新状态，去进行选择性打包。
压缩完成后，将当前的版本号写入 `version.json`，并且替换 `main.js`, `main.tpl` 文件。
打包脚本位于 `tools/compress.php`，如果需要手动打包，请执行：

```sh
php tools/compress.php release
```

## 流程组件

### 每个步骤的组件

一般来说，如果有全新的步骤，我们则需要开发一个全新的 widget，通常会放在 `business` 目录。一些值得参考的简单的组件有：
`business/ekey_info.js`, `business/input_account.js`。
请注意，除了基本的使用规范，最需要注意的是，所有的组件需要仔细的实现一个 `process`的几个函数，下面是一个示例：

```javascript
define(["some/dependancies"], function() {
	/**
	 * 示例组件
	 * @lends  $we.widget.example
	 */
	$we.widget.reg("example", {
		/**
		 * @constructs
		 */
		init: function(el, params) {
			this.el = el;
			this.params = params || {};
		},
		/**
		 * interfaces
		 * @memberOf $we.widget.example#
		 */
		interfaces: {
			render: function() {
				// 渲染流程步骤的具体页面
			},
			sendData: function() {
				// 发送请求，与后端交互
			}
		},
		/**
		 * process
		 * @memberOf $we.widget.example#
		 */
		process: {
			// 流程开始
			start: function() {
				this.render();
			},
			// 流程结束
			end: function() {
				$(this.el).empty();
			},
			// 当下一步按钮被点击时，该方法会被调用
			checkSucc: function() {
				this.sendData();
			}
		}
	});

	// 返回一个支持 AMD 的对象
	return $we.widget.amd("example");
});
```

### 流程配置 / interface

当所有步骤完成后，就需要完成一个流程的配置，该配置文件需要放在 `interface` 目录中。
具体写法可以参考 `interface` 目录中的文件，这里提供一个示例：

```javascript
define(
	"example",
	[
		"some/dependancies"
	], 
	function() {
		
		$we.process.config.example = {
			processes: [{
				name: "安全验证",
				widget: "safety_verification",
				beforeAction: function() {
					
				}
			}, {
				widget: "bind_mobile",
				params: {
					tips: '哈哈'
				}
			}, {
				name: "成功",
				widget: "process.end",
				params: {
					title: "成功！",
					content: function() {
						return '成功';
					}
				},
				beforeAction: function() {
					this.notify("renderBottom", '底部');
					return true;
				}
			}],
			config: {
				flow: "exmaple",
				title: "示例流程"
			},
			data: ["some", "key", "keyword"],
			init: function(conf) {
				// 做一些初始化的工作， conf就是 $we.process.config.example
			}
		};
		
		return $we.process.use;
	}
);
```

每个流程实际上是实现一个 `$we.process.config` 的配置。
`processes` 声明每个具体的步骤，支持参数：

	name: '步骤名称', // 如果没有名称，那么该步骤相当于是上一个有名称的步骤的子流程
	widget: 'bind_mobile', // 该步骤所依赖的组件
	params: { tips: 'haha' }, // 调用该步骤时的参数
	beforeAction: function() {}, // 该步骤被调用前会执行该函数，函数返回 true则该步骤继续，否则该步骤被跳过
	afterAction: function() {} // 该步骤完成之后会被执行，一般不需要用到这个函数，也未经测试。。。

`config` 则是这个流程的一些通用设置，包括：

	title: "测试啦只是", // 业务流title
	prev: "回去哦", // 上一步按钮的文案
	next: "往下走", // 下一步按钮的文案
	end: "搞定", // 结束按钮的文案
	independent: false, // 这是否是一个独立的流程（不需要显示进度条，并且会将属性设置为独立）
	width: 600, // 宽度
	class_notice_content: "we_pop_content_box" // 容器的class name

`data` 是这个流程所依赖的所有数据，如果这些数据不全，该流程无法开始。
一般来说，初始化之前，流程组件会自动向后端索取这几个数据。

`init` 则是在获取到所有的 `data` 之后，流程真正开始之前的一个中间函数。
允许在获取数据之后，再对流程的具体配置进行修改。


## F.A.Q.

### beforeAction 里面的 this 是什么？

beforeAction 里面的 this 就是当前步骤的组件本身，注意，该组件本身的 notify 对象是流程组件。
所以我们是允许在 beforeAction 里面做类似于这样的操作：

```javascript
this.params.tips = '嘿嘿';
this.notify("renderBottom", '<strong>温馨提示：</strong>请注意您的财产安全！');
```



