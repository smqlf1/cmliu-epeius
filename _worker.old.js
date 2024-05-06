// src/worker.js
import { connect } from "cloudflare:sockets";
let password = 'auto';
let proxyIP = '';

let addresses = [
	//当sub为空时启用本地优选域名/优选IP，若不带端口号 TLS默认端口为443，#号后为备注别名
	'cf.090227.xyz:443#加入我的频道t.me/CMLiussss解锁更多优选节点',
	'time.is#你可以只放域名 如下',
	'www.visa.com.sg',
	'skk.moe#也可以放域名带端口 如下',
	'www.wto.org:8443',
	'www.csgo.com:2087#节点名放在井号之后即可',
	'icook.hk#若不带端口号默认端口为443',
	'104.17.152.41#IP也可以',
	'[2606:4700:e7:25:4b9:f8f8:9bfb:774a]#IPv6也OK',
];

let sub = '';// 'trojan.fxxk.dedyn.io' Trojan优选订阅生成器，可自行搭建 https://github.com/cmliu/WorkerTrojan2sub
let subconverter = 'apiurl.v1.mk';// clash订阅转换后端，目前使用肥羊的订阅转换功能。自带虚假节点信息防泄露
let subconfig = "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Mini.ini"; //订阅配置文件
let RproxyIP = 'false';

let addressesapi = [];
let addressescsv = [];
let DLS = 8;

let FileName = 'epeius';
let BotToken ='';
let ChatID =''; 
let proxyhosts = [];//本地代理域名池
let proxyhostsURL = 'https://raw.githubusercontent.com/cmliu/CFcdnVmess2sub/main/proxyhosts';//在线代理域名池URL

let sha224Password = '10f9b41e385c211fdcdd92491cf3068d036618b61602807abb06316d';
let fakeUserID = generateUUID();
let fakeHostName = generateRandomString();
const regex = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|\[.*\]):?(\d+)?#?(.*)?$/;
/*
if (!isValidSHA224(sha224Password)) {
    throw new Error('sha224Password is not valid');
}
*/
export default {
	async fetch(request, env, ctx) {
		try {
			const UA = request.headers.get('User-Agent') || 'null';
			const userAgent = UA.toLowerCase();
			proxyIP = env.PROXYIP || proxyIP;
			const proxyIPs = await ADD(proxyIP);
			proxyIP = proxyIPs[Math.floor(Math.random() * proxyIPs.length)];
			password = env.PASSWORD || password;
			//sha224Password = env.SHA224 || env.SHA224PASS || sha224Password;
			sha224Password = sha256.sha224(password);
			//console.log(sha224Password);

			const url = new URL(request.url);
			const upgradeHeader = request.headers.get("Upgrade");
			if (env.ADD) addresses = await ADD(env.ADD);
			if (env.ADDAPI) addressesapi = await ADD(env.ADDAPI);
			if (env.ADDCSV) addressescsv = await ADD(env.ADDCSV);
			DLS = env.DLS || DLS;
			BotToken = env.TGTOKEN || BotToken;
			ChatID = env.TGID || ChatID; 
			sub = env.SUB || sub;
			subconverter = env.SUBAPI || subconverter;
			subconfig = env.SUBCONFIG || subconfig;
			FileName = env.SUBNAME || FileName;
			RproxyIP = env.RPROXYIP || !proxyIP ? 'true' : 'false';

			if (!upgradeHeader || upgradeHeader !== "websocket") {
				//const url = new URL(request.url);
				switch (url.pathname) {
				case '/':
					const envKey = env.URL302 ? 'URL302' : (env.URL ? 'URL' : null);
					if (envKey) {
						const URLs = await ADD(env[envKey]);
						const URL = URLs[Math.floor(Math.random() * URLs.length)];
						return envKey === 'URL302' ? Response.redirect(URL, 302) : fetch(new Request(URL, request));
					}
					return new Response(JSON.stringify(request.cf, null, 4), { status: 200 });
				case `/${password}`:
					await sendMessage(`#获取订阅 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${UA}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
					const trojanConfig = await getTrojanConfig(password, request.headers.get('Host'), sub, UA, RproxyIP, url);
					const now = Date.now();
					//const timestamp = Math.floor(now / 1000);
					const expire = 4102329600;//2099-12-31
					const today = new Date(now);
					today.setHours(0, 0, 0, 0);
					const UD = Math.floor(((now - today.getTime())/86400000) * 24 * 1099511627776 / 2);
					if (userAgent && (userAgent.includes('mozilla') || userAgent.includes('subconverter'))){
						return new Response(`${trojanConfig}`, {
							status: 200,
							headers: {
								"Content-Type": "text/plain;charset=utf-8",
								"Profile-Update-Interval": "6",
								"Subscription-Userinfo": `upload=${UD}; download=${UD}; total=${24 * 1099511627776}; expire=${expire}`,
							}
						});
					} else {
						return new Response(`${trojanConfig}`, {
							status: 200,
							headers: {
								"Content-Disposition": `attachment; filename=${FileName}; filename*=utf-8''${FileName}`,
								"Content-Type": "text/plain;charset=utf-8",
								"Profile-Update-Interval": "6",
								"Subscription-Userinfo": `upload=${UD}; download=${UD}; total=${24 * 1099511627776}; expire=${expire}`,
							}
						});
					}
					/*
					const host = request.headers.get('Host');
					return new Response(`trojan://${encodeURIComponent(password)}@${host}:443/?type=ws&host=${host}&security=tls`, {
						status: 200,
						headers: {
							"Content-Type": "text/plain;charset=utf-8",
						}
					});
					*/
				default:
					return new Response("Incorrect password!!!", { status: 404 });
				}
			} else {
				proxyIP = url.searchParams.get('proxyip') || proxyIP;
				if (new RegExp('/proxyip=', 'i').test(url.pathname)) proxyIP = url.pathname.toLowerCase().split('/proxyip=')[1];
				else if (new RegExp('/proxyip.', 'i').test(url.pathname)) proxyIP = `proxyip.${url.pathname.toLowerCase().split("/proxyip.")[1]}`;
				else if (!proxyIP || proxyIP == '') proxyIP = 'proxyip.fxxk.dedyn.io';
				return await trojanOverWSHandler(request);
			}
		} catch (err) {
			let e = err;
			return new Response(e.toString());
		}
	}
};

async function trojanOverWSHandler(request) {
	const webSocketPair = new WebSocketPair();
	const [client, webSocket] = Object.values(webSocketPair);
	webSocket.accept();
	let address = "";
	let portWithRandomLog = "";
	const log = (info, event) => {
		console.log(`[${address}:${portWithRandomLog}] ${info}`, event || "");
	};
	const earlyDataHeader = request.headers.get("sec-websocket-protocol") || "";
	const readableWebSocketStream = makeReadableWebSocketStream(webSocket, earlyDataHeader, log);
	let remoteSocketWapper = {
		value: null
	};
	let udpStreamWrite = null;
	readableWebSocketStream.pipeTo(new WritableStream({
		async write(chunk, controller) {
			if (udpStreamWrite) {
				return udpStreamWrite(chunk);
			}
			if (remoteSocketWapper.value) {
				const writer = remoteSocketWapper.value.writable.getWriter();
				await writer.write(chunk);
				writer.releaseLock();
				return;
			}
			const {
				hasError,
				message,
				portRemote = 443,
				addressRemote = "",
				rawClientData
			} = await parseTrojanHeader(chunk);
			address = addressRemote;
			portWithRandomLog = `${portRemote}--${Math.random()} tcp`;
			if (hasError) {
				throw new Error(message);
				return;
			}
			handleTCPOutBound(remoteSocketWapper, addressRemote, portRemote, rawClientData, webSocket, log);
		},
		close() {
			log(`readableWebSocketStream is closed`);
		},
		abort(reason) {
			log(`readableWebSocketStream is aborted`, JSON.stringify(reason));
		}
	})).catch((err) => {
		log("readableWebSocketStream pipeTo error", err);
	});
	return new Response(null, {
		status: 101,
		// @ts-ignore
		webSocket: client
	});
}

async function parseTrojanHeader(buffer) {
	if (buffer.byteLength < 56) {
		return {
			hasError: true,
			message: "invalid data"
		};
	}
	let crLfIndex = 56;
	if (new Uint8Array(buffer.slice(56, 57))[0] !== 0x0d || new Uint8Array(buffer.slice(57, 58))[0] !== 0x0a) {
		return {
			hasError: true,
			message: "invalid header format (missing CR LF)"
		};
	}
	const password = new TextDecoder().decode(buffer.slice(0, crLfIndex));
	if (password !== sha224Password) {
		return {
			hasError: true,
			message: "invalid password"
		};
	}

	const socks5DataBuffer = buffer.slice(crLfIndex + 2);
	if (socks5DataBuffer.byteLength < 6) {
		return {
			hasError: true,
			message: "invalid SOCKS5 request data"
		};
	}

	const view = new DataView(socks5DataBuffer);
	const cmd = view.getUint8(0);
	if (cmd !== 1) {
		return {
			hasError: true,
			message: "unsupported command, only TCP (CONNECT) is allowed"
		};
	}

	const atype = view.getUint8(1);
	// 0x01: IPv4 address
	// 0x03: Domain name
	// 0x04: IPv6 address
	let addressLength = 0;
	let addressIndex = 2;
	let address = "";
	switch (atype) {
	case 1:
		addressLength = 4;
		address = new Uint8Array(
			socks5DataBuffer.slice(addressIndex, addressIndex + addressLength)
		).join(".");
		break;
	case 3:
		addressLength = new Uint8Array(
			socks5DataBuffer.slice(addressIndex, addressIndex + 1)
		)[0];
		addressIndex += 1;
		address = new TextDecoder().decode(
			socks5DataBuffer.slice(addressIndex, addressIndex + addressLength)
		);
		break;
	case 4:
		addressLength = 16;
		const dataView = new DataView(socks5DataBuffer.slice(addressIndex, addressIndex + addressLength));
		const ipv6 = [];
		for (let i = 0; i < 8; i++) {
			ipv6.push(dataView.getUint16(i * 2).toString(16));
		}
		address = ipv6.join(":");
		break;
	default:
		return {
			hasError: true,
			message: `invalid addressType is ${atype}`
		};
	}

	if (!address) {
		return {
			hasError: true,
			message: `address is empty, addressType is ${atype}`
		};
	}

	const portIndex = addressIndex + addressLength;
	const portBuffer = socks5DataBuffer.slice(portIndex, portIndex + 2);
	const portRemote = new DataView(portBuffer).getUint16(0);
	return {
		hasError: false,
		addressRemote: address,
		portRemote,
		rawClientData: socks5DataBuffer.slice(portIndex + 4)
	};
}

async function handleTCPOutBound(remoteSocket, addressRemote, portRemote, rawClientData, webSocket, log) {
	async function connectAndWrite(address, port) {
		const tcpSocket2 = connect({
			hostname: address,
			port
		});
		remoteSocket.value = tcpSocket2;
		log(`connected to ${address}:${port}`);
		const writer = tcpSocket2.writable.getWriter();
		await writer.write(rawClientData);
		writer.releaseLock();
		return tcpSocket2;
	}
	async function retry() {
		const tcpSocket2 = await connectAndWrite(proxyIP || addressRemote, portRemote);
		tcpSocket2.closed.catch((error) => {
			console.log("retry tcpSocket closed error", error);
		}).finally(() => {
			safeCloseWebSocket(webSocket);
		});
		remoteSocketToWS(tcpSocket2, webSocket, null, log);
	}
	const tcpSocket = await connectAndWrite(addressRemote, portRemote);
	remoteSocketToWS(tcpSocket, webSocket, retry, log);
}

function makeReadableWebSocketStream(webSocketServer, earlyDataHeader, log) {
	let readableStreamCancel = false;
	const stream = new ReadableStream({
		start(controller) {
			webSocketServer.addEventListener("message", (event) => {
				if (readableStreamCancel) {
					return;
				}
				const message = event.data;
				controller.enqueue(message);
			});
			webSocketServer.addEventListener("close", () => {
				safeCloseWebSocket(webSocketServer);
				if (readableStreamCancel) {
					return;
				}
				controller.close();
			});
			webSocketServer.addEventListener("error", (err) => {
				log("webSocketServer error");
				controller.error(err);
			});
			const { earlyData, error } = base64ToArrayBuffer(earlyDataHeader);
			if (error) {
				controller.error(error);
			} else if (earlyData) {
				controller.enqueue(earlyData);
			}
		},
		pull(controller) {},
		cancel(reason) {
			if (readableStreamCancel) {
				return;
			}
			log(`readableStream was canceled, due to ${reason}`);
			readableStreamCancel = true;
			safeCloseWebSocket(webSocketServer);
		}
	});
	return stream;
}

async function remoteSocketToWS(remoteSocket, webSocket, retry, log) {
	let hasIncomingData = false;
	await remoteSocket.readable.pipeTo(
		new WritableStream({
			start() {},
			/**
			 *
			 * @param {Uint8Array} chunk
			 * @param {*} controller
			 */
			async write(chunk, controller) {
				hasIncomingData = true;
				if (webSocket.readyState !== WS_READY_STATE_OPEN) {
					controller.error(
						"webSocket connection is not open"
					);
				}
				webSocket.send(chunk);
			},
			close() {
				log(`remoteSocket.readable is closed, hasIncomingData: ${hasIncomingData}`);
			},
			abort(reason) {
				console.error("remoteSocket.readable abort", reason);
			}
		})
	).catch((error) => {
		console.error(
			`remoteSocketToWS error:`,
			error.stack || error
		);
		safeCloseWebSocket(webSocket);
	});
	if (hasIncomingData === false && retry) {
		log(`retry`);
		retry();
	}
}
/*
function isValidSHA224(hash) {
	const sha224Regex = /^[0-9a-f]{56}$/i;
	return sha224Regex.test(hash);
}
*/
function base64ToArrayBuffer(base64Str) {
	if (!base64Str) {
		return { error: null };
	}
	try {
		base64Str = base64Str.replace(/-/g, "+").replace(/_/g, "/");
		const decode = atob(base64Str);
		const arryBuffer = Uint8Array.from(decode, (c) => c.charCodeAt(0));
		return { earlyData: arryBuffer.buffer, error: null };
	} catch (error) {
		return { error };
	}
}

let WS_READY_STATE_OPEN = 1;
let WS_READY_STATE_CLOSING = 2;

function safeCloseWebSocket(socket) {
	try {
		if (socket.readyState === WS_READY_STATE_OPEN || socket.readyState === WS_READY_STATE_CLOSING) {
			socket.close();
		}
	} catch (error) {
		console.error("safeCloseWebSocket error", error);
	}
}

/*
export {
	worker_default as
	default
};
//# sourceMappingURL=worker.js.map
*/

function revertFakeInfo(content, userID, hostName, isBase64) {
	if (isBase64) content = atob(content);//Base64解码
	content = content.replace(new RegExp(fakeUserID, 'g'), userID).replace(new RegExp(fakeHostName, 'g'), hostName);
	if (isBase64) content = btoa(content);//Base64编码

	return content;
}

function generateRandomNumber() {
	let minNum = 100000;
	let maxNum = 999999;
	return Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
}

function generateRandomString() {
	let minLength = 2;
	let maxLength = 3;
	let length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
	let characters = 'abcdefghijklmnopqrstuvwxyz';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += characters[Math.floor(Math.random() * characters.length)];
	}
	return result;
}

function generateUUID() {
	let uuid = '';
	for (let i = 0; i < 32; i++) {
		let num = Math.floor(Math.random() * 16);
		if (num < 10) {
			uuid += num;
		} else {
			uuid += String.fromCharCode(num + 55);
		}
	}
	return uuid.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5').toLowerCase();
}

async function ADD(envadd) {
	var addtext = envadd.replace(/[	|"'\r\n]+/g, ',').replace(/,+/g, ',');  // 双引号、单引号和换行符替换为逗号
	//console.log(addtext);
	if (addtext.charAt(0) == ',') addtext = addtext.slice(1);
	if (addtext.charAt(addtext.length -1) == ',') addtext = addtext.slice(0, addtext.length - 1);
	const add = addtext.split(',');
	//console.log(add);
	return add ;
}

function 配置信息(密码, 域名地址) {
	const 啥啥啥_写的这是啥啊 = 'dHJvamFu';
	const 协议类型 = atob(啥啥啥_写的这是啥啊);
	
	const 别名 = 域名地址;
	let 地址 = 域名地址;
	let 端口 = 443;
	
	const 传输层协议 = 'ws';
	const 伪装域名 = 域名地址;
	const 路径 = '/?ed=2560';
	
	let 传输层安全 = ['tls',true];

	const v2ray = `${协议类型}://${encodeURIComponent(密码)}@${地址}:${端口}?security=${传输层安全[0]}&type=${传输层协议}&host=${伪装域名}&path=${encodeURIComponent(路径)}#${encodeURIComponent(别名)}`
	const clash = `- {"name":"${别名}","type":"${协议类型}","server":"${地址}","port":${端口},"udp":false,"password":"${密码}","skip-cert-verify":true,"network":"${传输层协议}","ws-opts":{"path":"${路径}","headers":{"host":"${伪装域名}"}}}`;
	return [v2ray,clash];
}

let subParams = ['sub','base64','b64','clash','singbox','sb','surge'];
async function getTrojanConfig(password, hostName, sub, UA, RproxyIP, _url) {
	const userAgent = UA.toLowerCase();
	const Config = 配置信息(password , hostName);
	const v2ray = Config[0];
	const clash = Config[1];

	if ( userAgent.includes('mozilla') && !subParams.some(_searchParams => _url.searchParams.has(_searchParams))) {
		let surge = `Surge订阅地址:\nhttps://${hostName}/${password}?surge`;
		if (hostName.includes(".workers.dev") || hostName.includes(".pages.dev")) surge = "Surge订阅必须绑定自定义域";
		return `
################################################################
Subscribe / sub 订阅地址, 支持 Base64、clash-meta、sing-box 订阅格式, 您的订阅内容由 ${sub} 提供维护支持, 自动获取ProxyIP: ${RproxyIP}.
---------------------------------------------------------------
快速自适应订阅地址:
https://${hostName}/${password}

Base64订阅地址:
https://${hostName}/${password}?sub
https://${hostName}/${password}?b64
https://${hostName}/${password}?base64

clash订阅地址:
https://${hostName}/${password}?clash

singbox订阅地址:
https://${hostName}/${password}?sb
https://${hostName}/${password}?singbox

${surge}
---------------------------------------------------------------
################################################################
v2ray
---------------------------------------------------------------
${v2ray}
---------------------------------------------------------------
################################################################
clash-meta
---------------------------------------------------------------
${clash}
---------------------------------------------------------------
################################################################
telegram 交流群 技术大佬~在线发牌!
https://t.me/CMLiussss
---------------------------------------------------------------
github 项目地址 Star!Star!Star!!!
https://github.com/cmliu/epeius
---------------------------------------------------------------
################################################################
`;
	} else {
		if (typeof fetch != 'function') {
			return 'Error: fetch is not available in this environment.';
		}
		// 如果是使用默认域名，则改成一个workers的域名，订阅器会加上代理
		if (hostName.includes(".workers.dev") || hostName.includes(".pages.dev")){
			fakeHostName = `${fakeHostName}.${generateRandomString()}${generateRandomNumber()}.workers.dev`;
		} else {
			fakeHostName = `${fakeHostName}.${generateRandomNumber()}.xyz`
		}

		if(hostName.includes('workers.dev') || hostName.includes('pages.dev')) {
			if (proxyhostsURL && (!proxyhosts || proxyhosts.length == 0)) {
				try {
					const response = await fetch(proxyhostsURL); 
				
					if (!response.ok) {
						console.error('获取地址时出错:', response.status, response.statusText);
						return; // 如果有错误，直接返回
					}
				
					const text = await response.text();
					const lines = text.split('\n');
					// 过滤掉空行或只包含空白字符的行
					const nonEmptyLines = lines.filter(line => line.trim() !== '');
				
					proxyhosts = proxyhosts.concat(nonEmptyLines);
				} catch (error) {
					console.error('获取地址时出错:', error);
				}
			}
			// 使用Set对象去重
			proxyhosts = [...new Set(proxyhosts)];
		}

		const newAddressesapi = await getAddressesapi(addressesapi);
		const newAddressescsv = await getAddressescsv('TRUE');

		let url = `https://${sub}/sub?host=${fakeHostName}&pw=${fakeUserID}&password=${fakeUserID}&epeius=cmliu&proxyip=${RproxyIP}`;
		let isBase64 = true;

		if (!sub || sub == ""){
			const 生成本地节点 = await subAddresses(fakeHostName,fakeUserID,'subconverter',newAddressesapi,newAddressescsv);
			const 解码本地节点 = atob(生成本地节点)
			const 本地节点数组 = 解码本地节点.split('\n');
			url = 本地节点数组.join('|');
			//console.log(url);
		} 

		if (!userAgent.includes(('CF-Workers-SUB').toLowerCase())){
			if ((userAgent.includes('clash') && !userAgent.includes('nekobox')) || ( _url.searchParams.has('clash'))) {
				url = `https://${subconverter}/sub?target=clash&url=${encodeURIComponent(url)}&insert=false&config=${encodeURIComponent(subconfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
				isBase64 = false;
			} else if (userAgent.includes('sing-box') || userAgent.includes('singbox') || _url.searchParams.has('singbox') || _url.searchParams.has('sb')) {
				url = `https://${subconverter}/sub?target=singbox&url=${encodeURIComponent(url)}&insert=false&config=${encodeURIComponent(subconfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
				isBase64 = false;
			} else if (userAgent.includes('surge') || _url.searchParams.has('surge')) {
				url = `https://${subconverter}/sub?target=surge&ver=4&url=${encodeURIComponent(url)}&insert=false&config=${encodeURIComponent(subconfig)}&emoji=true&list=false&xudp=false&udp=false&tfo=false&expand=true&scv=true&fdn=false`;
				isBase64 = false;
			}
		}
		
		try {
			let content;
			if ((!sub || sub == "") && isBase64 == true) {
				content = await subAddresses(fakeHostName,fakeUserID,userAgent,newAddressesapi,newAddressescsv);
			} else {
				const response = await fetch(url ,{
					headers: {
						'User-Agent': `${UA} CF-Workers-epeius/cmliu`
					}});
				content = await response.text();
			}
			let 输出内容 = revertFakeInfo(content, password, hostName, isBase64);
			if (userAgent.includes('surge') || _url.searchParams.has('surge')) 输出内容 = surge(输出内容, hostName);
			//console.log(输出内容);
			return 输出内容;
		} catch (error) {
			console.error('Error fetching content:', error);
			return `Error fetching content: ${error.message}`;
		}
	}
}

async function sendMessage(type, ip, add_data = "") {
	if ( BotToken !== '' && ChatID !== ''){
		let msg = "";
		const response = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`);
		if (response.status == 200) {
			const ipInfo = await response.json();
			msg = `${type}\nIP: ${ip}\n国家: ${ipInfo.country}\n<tg-spoiler>城市: ${ipInfo.city}\n组织: ${ipInfo.org}\nASN: ${ipInfo.as}\n${add_data}`;
		} else {
			msg = `${type}\nIP: ${ip}\n<tg-spoiler>${add_data}`;
		}
	
		let url = "https://api.telegram.org/bot"+ BotToken +"/sendMessage?chat_id=" + ChatID + "&parse_mode=HTML&text=" + encodeURIComponent(msg);
		return fetch(url, {
			method: 'get',
			headers: {
				'Accept': 'text/html,application/xhtml+xml,application/xml;',
				'Accept-Encoding': 'gzip, deflate, br',
				'User-Agent': 'Mozilla/5.0 Chrome/90.0.4430.72'
			}
		});
	}
}

function subAddresses(host,pw,userAgent,newAddressesapi,newAddressescsv) {
	addresses = addresses.concat(newAddressesapi);
	addresses = addresses.concat(newAddressescsv);
	// 使用Set对象去重
	const uniqueAddresses = [...new Set(addresses)];
				
	const responseBody = uniqueAddresses.map(address => {
		let port = "443";
		let addressid = address;

		const match = addressid.match(regex);
		if (!match) {
			if (address.includes(':') && address.includes('#')) {
				const parts = address.split(':');
				address = parts[0];
				const subParts = parts[1].split('#');
				port = subParts[0];
				addressid = subParts[1];
			} else if (address.includes(':')) {
				const parts = address.split(':');
				address = parts[0];
				port = parts[1];
			} else if (address.includes('#')) {
				const parts = address.split('#');
				address = parts[0];
				addressid = parts[1];
			}
		
			if (addressid.includes(':')) {
				addressid = addressid.split(':')[0];
			}
		} else {
			address = match[1];
			port = match[2] || port;
			addressid = match[3] || address;
		}
		
		let 伪装域名 = host ;
		let 最终路径 = '/?ed=2560' ;
		let 节点备注 = '';
		if(proxyhosts.length > 0 && (伪装域名.includes('.workers.dev') || 伪装域名.includes('pages.dev'))) {
			最终路径 = `/${伪装域名}${最终路径}`;
			伪装域名 = proxyhosts[Math.floor(Math.random() * proxyhosts.length)];
			节点备注 = ` 已启用临时域名中转服务，请尽快绑定自定义域！`;
		}

		let 密码 = pw;
		if (!userAgent.includes('subconverter')) 密码 = encodeURIComponent(pw);

		const 啥啥啥_写的这是啥啊 = 'dHJvamFu';
		const 协议类型 = atob(啥啥啥_写的这是啥啊);
		const trojanLink = `${协议类型}://${密码}@${address}:${port}?security=tls&type=ws&host=${伪装域名}&path=${encodeURIComponent(最终路径)}#${encodeURIComponent(addressid + 节点备注)}`;

		return trojanLink;
	}).join('\n');

	const base64Response = btoa(responseBody); // 重新进行 Base64 编码

	return base64Response;
}

async function getAddressesapi(api) {
	if (!api || api.length === 0) {
		return [];
	}

	let newapi = "";

	// 创建一个AbortController对象，用于控制fetch请求的取消
	const controller = new AbortController();

	const timeout = setTimeout(() => {
		controller.abort(); // 取消所有请求
	}, 2000); // 2秒后触发

	try {
		// 使用Promise.allSettled等待所有API请求完成，无论成功或失败
		// 对api数组进行遍历，对每个API地址发起fetch请求
		const responses = await Promise.allSettled(api.map(apiUrl => fetch(apiUrl, {
			method: 'get', 
			headers: {
				'Accept': 'text/html,application/xhtml+xml,application/xml;',
				'User-Agent': 'cmliu/WorkerTrojan2sub'
			},
			signal: controller.signal // 将AbortController的信号量添加到fetch请求中，以便于需要时可以取消请求
		}).then(response => response.ok ? response.text() : Promise.reject())));

		// 遍历所有响应
		for (const response of responses) {
			// 检查响应状态是否为'fulfilled'，即请求成功完成
			if (response.status === 'fulfilled') {
				// 获取响应的内容
				const content = await response.value;
				newapi += content + '\n';
			}
		}
	} catch (error) {
		console.error(error);
	} finally {
		// 无论成功或失败，最后都清除设置的超时定时器
		clearTimeout(timeout);
	}

	const newAddressesapi = await ADD(newapi);

	// 返回处理后的结果
	return newAddressesapi;
}

async function getAddressescsv(tls) {
	if (!addressescsv || addressescsv.length === 0) {
		return [];
	}
	
	let newAddressescsv = [];
	
	for (const csvUrl of addressescsv) {
		try {
			const response = await fetch(csvUrl);
		
			if (!response.ok) {
				console.error('获取CSV地址时出错:', response.status, response.statusText);
				continue;
			}
		
			const text = await response.text();// 使用正确的字符编码解析文本内容
			let lines;
			if (text.includes('\r\n')){
				lines = text.split('\r\n');
			} else {
				lines = text.split('\n');
			}
		
			// 检查CSV头部是否包含必需字段
			const header = lines[0].split(',');
			const tlsIndex = header.indexOf('TLS');
			const speedIndex = header.length - 1; // 最后一个字段
		
			const ipAddressIndex = 0;// IP地址在 CSV 头部的位置
			const portIndex = 1;// 端口在 CSV 头部的位置
			const dataCenterIndex = tlsIndex + 1; // 数据中心是 TLS 的后一个字段
		
			if (tlsIndex === -1) {
				console.error('CSV文件缺少必需的字段');
				continue;
			}
		
			// 从第二行开始遍历CSV行
			for (let i = 1; i < lines.length; i++) {
				const columns = lines[i].split(',');
		
				// 检查TLS是否为"TRUE"且速度大于DLS
				if (columns[tlsIndex].toUpperCase() === tls && parseFloat(columns[speedIndex]) > DLS) {
					const ipAddress = columns[ipAddressIndex];
					const port = columns[portIndex];
					const dataCenter = columns[dataCenterIndex];
			
					const formattedAddress = `${ipAddress}:${port}#${dataCenter}`;
					newAddressescsv.push(formattedAddress);
				}
			}
		} catch (error) {
			console.error('获取CSV地址时出错:', error);
			continue;
		}
	}
	
	return newAddressescsv;
}

function surge(content, host) {
	const 备改内容 = `skip-cert-verify=true`;
	const 正确内容 = `skip-cert-verify=true, ws=true, ws-path=/?ed=2560, ws-headers=Host:"${host}"`;
	content = content.replace(new RegExp(备改内容, 'g'), 正确内容)

	return content;
}

/**
 * [js-sha256]{@link https://github.com/emn178/js-sha256}
 *
 * @version 0.11.0
 * @author Chen, Yi-Cyuan [emn178@gmail.com]
 * @copyright Chen, Yi-Cyuan 2014-2024
 * @license MIT
 */
/*jslint bitwise: true */
(function () {
	'use strict';
  
	var ERROR = 'input is invalid type';
	var WINDOW = typeof window === 'object';
	var root = WINDOW ? window : {};
	if (root.JS_SHA256_NO_WINDOW) {
	  WINDOW = false;
	}
	var WEB_WORKER = !WINDOW && typeof self === 'object';
	var NODE_JS = !root.JS_SHA256_NO_NODE_JS && typeof process === 'object' && process.versions && process.versions.node;
	if (NODE_JS) {
	  root = global;
	} else if (WEB_WORKER) {
	  root = self;
	}
	var COMMON_JS = !root.JS_SHA256_NO_COMMON_JS && typeof module === 'object' && module.exports;
	var AMD = typeof define === 'function' && define.amd;
	var ARRAY_BUFFER = !root.JS_SHA256_NO_ARRAY_BUFFER && typeof ArrayBuffer !== 'undefined';
	var HEX_CHARS = '0123456789abcdef'.split('');
	var EXTRA = [-2147483648, 8388608, 32768, 128];
	var SHIFT = [24, 16, 8, 0];
	var K = [
	  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
	  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
	  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
	  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
	  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
	  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
	  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
	  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
	];
	var OUTPUT_TYPES = ['hex', 'array', 'digest', 'arrayBuffer'];
  
	var blocks = [];
  
	if (root.JS_SHA256_NO_NODE_JS || !Array.isArray) {
	  Array.isArray = function (obj) {
		return Object.prototype.toString.call(obj) === '[object Array]';
	  };
	}
  
	if (ARRAY_BUFFER && (root.JS_SHA256_NO_ARRAY_BUFFER_IS_VIEW || !ArrayBuffer.isView)) {
	  ArrayBuffer.isView = function (obj) {
		return typeof obj === 'object' && obj.buffer && obj.buffer.constructor === ArrayBuffer;
	  };
	}
  
	var createOutputMethod = function (outputType, is224) {
	  return function (message) {
		return new Sha256(is224, true).update(message)[outputType]();
	  };
	};
  
	var createMethod = function (is224) {
	  var method = createOutputMethod('hex', is224);
	  if (NODE_JS) {
		method = nodeWrap(method, is224);
	  }
	  method.create = function () {
		return new Sha256(is224);
	  };
	  method.update = function (message) {
		return method.create().update(message);
	  };
	  for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
		var type = OUTPUT_TYPES[i];
		method[type] = createOutputMethod(type, is224);
	  }
	  return method;
	};
  
	var nodeWrap = function (method, is224) {
	  var crypto = require('crypto')
	  var Buffer = require('buffer').Buffer;
	  var algorithm = is224 ? 'sha224' : 'sha256';
	  var bufferFrom;
	  if (Buffer.from && !root.JS_SHA256_NO_BUFFER_FROM) {
		bufferFrom = Buffer.from;
	  } else {
		bufferFrom = function (message) {
		  return new Buffer(message);
		};
	  }
	  var nodeMethod = function (message) {
		if (typeof message === 'string') {
		  return crypto.createHash(algorithm).update(message, 'utf8').digest('hex');
		} else {
		  if (message === null || message === undefined) {
			throw new Error(ERROR);
		  } else if (message.constructor === ArrayBuffer) {
			message = new Uint8Array(message);
		  }
		}
		if (Array.isArray(message) || ArrayBuffer.isView(message) ||
		  message.constructor === Buffer) {
		  return crypto.createHash(algorithm).update(bufferFrom(message)).digest('hex');
		} else {
		  return method(message);
		}
	  };
	  return nodeMethod;
	};
  
	var createHmacOutputMethod = function (outputType, is224) {
	  return function (key, message) {
		return new HmacSha256(key, is224, true).update(message)[outputType]();
	  };
	};
  
	var createHmacMethod = function (is224) {
	  var method = createHmacOutputMethod('hex', is224);
	  method.create = function (key) {
		return new HmacSha256(key, is224);
	  };
	  method.update = function (key, message) {
		return method.create(key).update(message);
	  };
	  for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
		var type = OUTPUT_TYPES[i];
		method[type] = createHmacOutputMethod(type, is224);
	  }
	  return method;
	};
  
	function Sha256(is224, sharedMemory) {
	  if (sharedMemory) {
		blocks[0] = blocks[16] = blocks[1] = blocks[2] = blocks[3] =
		  blocks[4] = blocks[5] = blocks[6] = blocks[7] =
		  blocks[8] = blocks[9] = blocks[10] = blocks[11] =
		  blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
		this.blocks = blocks;
	  } else {
		this.blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	  }
  
	  if (is224) {
		this.h0 = 0xc1059ed8;
		this.h1 = 0x367cd507;
		this.h2 = 0x3070dd17;
		this.h3 = 0xf70e5939;
		this.h4 = 0xffc00b31;
		this.h5 = 0x68581511;
		this.h6 = 0x64f98fa7;
		this.h7 = 0xbefa4fa4;
	  } else { // 256
		this.h0 = 0x6a09e667;
		this.h1 = 0xbb67ae85;
		this.h2 = 0x3c6ef372;
		this.h3 = 0xa54ff53a;
		this.h4 = 0x510e527f;
		this.h5 = 0x9b05688c;
		this.h6 = 0x1f83d9ab;
		this.h7 = 0x5be0cd19;
	  }
  
	  this.block = this.start = this.bytes = this.hBytes = 0;
	  this.finalized = this.hashed = false;
	  this.first = true;
	  this.is224 = is224;
	}
  
	Sha256.prototype.update = function (message) {
	  if (this.finalized) {
		return;
	  }
	  var notString, type = typeof message;
	  if (type !== 'string') {
		if (type === 'object') {
		  if (message === null) {
			throw new Error(ERROR);
		  } else if (ARRAY_BUFFER && message.constructor === ArrayBuffer) {
			message = new Uint8Array(message);
		  } else if (!Array.isArray(message)) {
			if (!ARRAY_BUFFER || !ArrayBuffer.isView(message)) {
			  throw new Error(ERROR);
			}
		  }
		} else {
		  throw new Error(ERROR);
		}
		notString = true;
	  }
	  var code, index = 0, i, length = message.length, blocks = this.blocks;
	  while (index < length) {
		if (this.hashed) {
		  this.hashed = false;
		  blocks[0] = this.block;
		  this.block = blocks[16] = blocks[1] = blocks[2] = blocks[3] =
			blocks[4] = blocks[5] = blocks[6] = blocks[7] =
			blocks[8] = blocks[9] = blocks[10] = blocks[11] =
			blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
		}
  
		if (notString) {
		  for (i = this.start; index < length && i < 64; ++index) {
			blocks[i >>> 2] |= message[index] << SHIFT[i++ & 3];
		  }
		} else {
		  for (i = this.start; index < length && i < 64; ++index) {
			code = message.charCodeAt(index);
			if (code < 0x80) {
			  blocks[i >>> 2] |= code << SHIFT[i++ & 3];
			} else if (code < 0x800) {
			  blocks[i >>> 2] |= (0xc0 | (code >>> 6)) << SHIFT[i++ & 3];
			  blocks[i >>> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
			} else if (code < 0xd800 || code >= 0xe000) {
			  blocks[i >>> 2] |= (0xe0 | (code >>> 12)) << SHIFT[i++ & 3];
			  blocks[i >>> 2] |= (0x80 | ((code >>> 6) & 0x3f)) << SHIFT[i++ & 3];
			  blocks[i >>> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
			} else {
			  code = 0x10000 + (((code & 0x3ff) << 10) | (message.charCodeAt(++index) & 0x3ff));
			  blocks[i >>> 2] |= (0xf0 | (code >>> 18)) << SHIFT[i++ & 3];
			  blocks[i >>> 2] |= (0x80 | ((code >>> 12) & 0x3f)) << SHIFT[i++ & 3];
			  blocks[i >>> 2] |= (0x80 | ((code >>> 6) & 0x3f)) << SHIFT[i++ & 3];
			  blocks[i >>> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
			}
		  }
		}
  
		this.lastByteIndex = i;
		this.bytes += i - this.start;
		if (i >= 64) {
		  this.block = blocks[16];
		  this.start = i - 64;
		  this.hash();
		  this.hashed = true;
		} else {
		  this.start = i;
		}
	  }
	  if (this.bytes > 4294967295) {
		this.hBytes += this.bytes / 4294967296 << 0;
		this.bytes = this.bytes % 4294967296;
	  }
	  return this;
	};
  
	Sha256.prototype.finalize = function () {
	  if (this.finalized) {
		return;
	  }
	  this.finalized = true;
	  var blocks = this.blocks, i = this.lastByteIndex;
	  blocks[16] = this.block;
	  blocks[i >>> 2] |= EXTRA[i & 3];
	  this.block = blocks[16];
	  if (i >= 56) {
		if (!this.hashed) {
		  this.hash();
		}
		blocks[0] = this.block;
		blocks[16] = blocks[1] = blocks[2] = blocks[3] =
		  blocks[4] = blocks[5] = blocks[6] = blocks[7] =
		  blocks[8] = blocks[9] = blocks[10] = blocks[11] =
		  blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
	  }
	  blocks[14] = this.hBytes << 3 | this.bytes >>> 29;
	  blocks[15] = this.bytes << 3;
	  this.hash();
	};
  
	Sha256.prototype.hash = function () {
	  var a = this.h0, b = this.h1, c = this.h2, d = this.h3, e = this.h4, f = this.h5, g = this.h6,
		h = this.h7, blocks = this.blocks, j, s0, s1, maj, t1, t2, ch, ab, da, cd, bc;
  
	  for (j = 16; j < 64; ++j) {
		// rightrotate
		t1 = blocks[j - 15];
		s0 = ((t1 >>> 7) | (t1 << 25)) ^ ((t1 >>> 18) | (t1 << 14)) ^ (t1 >>> 3);
		t1 = blocks[j - 2];
		s1 = ((t1 >>> 17) | (t1 << 15)) ^ ((t1 >>> 19) | (t1 << 13)) ^ (t1 >>> 10);
		blocks[j] = blocks[j - 16] + s0 + blocks[j - 7] + s1 << 0;
	  }
  
	  bc = b & c;
	  for (j = 0; j < 64; j += 4) {
		if (this.first) {
		  if (this.is224) {
			ab = 300032;
			t1 = blocks[0] - 1413257819;
			h = t1 - 150054599 << 0;
			d = t1 + 24177077 << 0;
		  } else {
			ab = 704751109;
			t1 = blocks[0] - 210244248;
			h = t1 - 1521486534 << 0;
			d = t1 + 143694565 << 0;
		  }
		  this.first = false;
		} else {
		  s0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
		  s1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
		  ab = a & b;
		  maj = ab ^ (a & c) ^ bc;
		  ch = (e & f) ^ (~e & g);
		  t1 = h + s1 + ch + K[j] + blocks[j];
		  t2 = s0 + maj;
		  h = d + t1 << 0;
		  d = t1 + t2 << 0;
		}
		s0 = ((d >>> 2) | (d << 30)) ^ ((d >>> 13) | (d << 19)) ^ ((d >>> 22) | (d << 10));
		s1 = ((h >>> 6) | (h << 26)) ^ ((h >>> 11) | (h << 21)) ^ ((h >>> 25) | (h << 7));
		da = d & a;
		maj = da ^ (d & b) ^ ab;
		ch = (h & e) ^ (~h & f);
		t1 = g + s1 + ch + K[j + 1] + blocks[j + 1];
		t2 = s0 + maj;
		g = c + t1 << 0;
		c = t1 + t2 << 0;
		s0 = ((c >>> 2) | (c << 30)) ^ ((c >>> 13) | (c << 19)) ^ ((c >>> 22) | (c << 10));
		s1 = ((g >>> 6) | (g << 26)) ^ ((g >>> 11) | (g << 21)) ^ ((g >>> 25) | (g << 7));
		cd = c & d;
		maj = cd ^ (c & a) ^ da;
		ch = (g & h) ^ (~g & e);
		t1 = f + s1 + ch + K[j + 2] + blocks[j + 2];
		t2 = s0 + maj;
		f = b + t1 << 0;
		b = t1 + t2 << 0;
		s0 = ((b >>> 2) | (b << 30)) ^ ((b >>> 13) | (b << 19)) ^ ((b >>> 22) | (b << 10));
		s1 = ((f >>> 6) | (f << 26)) ^ ((f >>> 11) | (f << 21)) ^ ((f >>> 25) | (f << 7));
		bc = b & c;
		maj = bc ^ (b & d) ^ cd;
		ch = (f & g) ^ (~f & h);
		t1 = e + s1 + ch + K[j + 3] + blocks[j + 3];
		t2 = s0 + maj;
		e = a + t1 << 0;
		a = t1 + t2 << 0;
		this.chromeBugWorkAround = true;
	  }
  
	  this.h0 = this.h0 + a << 0;
	  this.h1 = this.h1 + b << 0;
	  this.h2 = this.h2 + c << 0;
	  this.h3 = this.h3 + d << 0;
	  this.h4 = this.h4 + e << 0;
	  this.h5 = this.h5 + f << 0;
	  this.h6 = this.h6 + g << 0;
	  this.h7 = this.h7 + h << 0;
	};
  
	Sha256.prototype.hex = function () {
	  this.finalize();
  
	  var h0 = this.h0, h1 = this.h1, h2 = this.h2, h3 = this.h3, h4 = this.h4, h5 = this.h5,
		h6 = this.h6, h7 = this.h7;
  
	  var hex = HEX_CHARS[(h0 >>> 28) & 0x0F] + HEX_CHARS[(h0 >>> 24) & 0x0F] +
		HEX_CHARS[(h0 >>> 20) & 0x0F] + HEX_CHARS[(h0 >>> 16) & 0x0F] +
		HEX_CHARS[(h0 >>> 12) & 0x0F] + HEX_CHARS[(h0 >>> 8) & 0x0F] +
		HEX_CHARS[(h0 >>> 4) & 0x0F] + HEX_CHARS[h0 & 0x0F] +
		HEX_CHARS[(h1 >>> 28) & 0x0F] + HEX_CHARS[(h1 >>> 24) & 0x0F] +
		HEX_CHARS[(h1 >>> 20) & 0x0F] + HEX_CHARS[(h1 >>> 16) & 0x0F] +
		HEX_CHARS[(h1 >>> 12) & 0x0F] + HEX_CHARS[(h1 >>> 8) & 0x0F] +
		HEX_CHARS[(h1 >>> 4) & 0x0F] + HEX_CHARS[h1 & 0x0F] +
		HEX_CHARS[(h2 >>> 28) & 0x0F] + HEX_CHARS[(h2 >>> 24) & 0x0F] +
		HEX_CHARS[(h2 >>> 20) & 0x0F] + HEX_CHARS[(h2 >>> 16) & 0x0F] +
		HEX_CHARS[(h2 >>> 12) & 0x0F] + HEX_CHARS[(h2 >>> 8) & 0x0F] +
		HEX_CHARS[(h2 >>> 4) & 0x0F] + HEX_CHARS[h2 & 0x0F] +
		HEX_CHARS[(h3 >>> 28) & 0x0F] + HEX_CHARS[(h3 >>> 24) & 0x0F] +
		HEX_CHARS[(h3 >>> 20) & 0x0F] + HEX_CHARS[(h3 >>> 16) & 0x0F] +
		HEX_CHARS[(h3 >>> 12) & 0x0F] + HEX_CHARS[(h3 >>> 8) & 0x0F] +
		HEX_CHARS[(h3 >>> 4) & 0x0F] + HEX_CHARS[h3 & 0x0F] +
		HEX_CHARS[(h4 >>> 28) & 0x0F] + HEX_CHARS[(h4 >>> 24) & 0x0F] +
		HEX_CHARS[(h4 >>> 20) & 0x0F] + HEX_CHARS[(h4 >>> 16) & 0x0F] +
		HEX_CHARS[(h4 >>> 12) & 0x0F] + HEX_CHARS[(h4 >>> 8) & 0x0F] +
		HEX_CHARS[(h4 >>> 4) & 0x0F] + HEX_CHARS[h4 & 0x0F] +
		HEX_CHARS[(h5 >>> 28) & 0x0F] + HEX_CHARS[(h5 >>> 24) & 0x0F] +
		HEX_CHARS[(h5 >>> 20) & 0x0F] + HEX_CHARS[(h5 >>> 16) & 0x0F] +
		HEX_CHARS[(h5 >>> 12) & 0x0F] + HEX_CHARS[(h5 >>> 8) & 0x0F] +
		HEX_CHARS[(h5 >>> 4) & 0x0F] + HEX_CHARS[h5 & 0x0F] +
		HEX_CHARS[(h6 >>> 28) & 0x0F] + HEX_CHARS[(h6 >>> 24) & 0x0F] +
		HEX_CHARS[(h6 >>> 20) & 0x0F] + HEX_CHARS[(h6 >>> 16) & 0x0F] +
		HEX_CHARS[(h6 >>> 12) & 0x0F] + HEX_CHARS[(h6 >>> 8) & 0x0F] +
		HEX_CHARS[(h6 >>> 4) & 0x0F] + HEX_CHARS[h6 & 0x0F];
	  if (!this.is224) {
		hex += HEX_CHARS[(h7 >>> 28) & 0x0F] + HEX_CHARS[(h7 >>> 24) & 0x0F] +
		  HEX_CHARS[(h7 >>> 20) & 0x0F] + HEX_CHARS[(h7 >>> 16) & 0x0F] +
		  HEX_CHARS[(h7 >>> 12) & 0x0F] + HEX_CHARS[(h7 >>> 8) & 0x0F] +
		  HEX_CHARS[(h7 >>> 4) & 0x0F] + HEX_CHARS[h7 & 0x0F];
	  }
	  return hex;
	};
  
	Sha256.prototype.toString = Sha256.prototype.hex;
  
	Sha256.prototype.digest = function () {
	  this.finalize();
  
	  var h0 = this.h0, h1 = this.h1, h2 = this.h2, h3 = this.h3, h4 = this.h4, h5 = this.h5,
		h6 = this.h6, h7 = this.h7;
  
	  var arr = [
		(h0 >>> 24) & 0xFF, (h0 >>> 16) & 0xFF, (h0 >>> 8) & 0xFF, h0 & 0xFF,
		(h1 >>> 24) & 0xFF, (h1 >>> 16) & 0xFF, (h1 >>> 8) & 0xFF, h1 & 0xFF,
		(h2 >>> 24) & 0xFF, (h2 >>> 16) & 0xFF, (h2 >>> 8) & 0xFF, h2 & 0xFF,
		(h3 >>> 24) & 0xFF, (h3 >>> 16) & 0xFF, (h3 >>> 8) & 0xFF, h3 & 0xFF,
		(h4 >>> 24) & 0xFF, (h4 >>> 16) & 0xFF, (h4 >>> 8) & 0xFF, h4 & 0xFF,
		(h5 >>> 24) & 0xFF, (h5 >>> 16) & 0xFF, (h5 >>> 8) & 0xFF, h5 & 0xFF,
		(h6 >>> 24) & 0xFF, (h6 >>> 16) & 0xFF, (h6 >>> 8) & 0xFF, h6 & 0xFF
	  ];
	  if (!this.is224) {
		arr.push((h7 >>> 24) & 0xFF, (h7 >>> 16) & 0xFF, (h7 >>> 8) & 0xFF, h7 & 0xFF);
	  }
	  return arr;
	};
  
	Sha256.prototype.array = Sha256.prototype.digest;
  
	Sha256.prototype.arrayBuffer = function () {
	  this.finalize();
  
	  var buffer = new ArrayBuffer(this.is224 ? 28 : 32);
	  var dataView = new DataView(buffer);
	  dataView.setUint32(0, this.h0);
	  dataView.setUint32(4, this.h1);
	  dataView.setUint32(8, this.h2);
	  dataView.setUint32(12, this.h3);
	  dataView.setUint32(16, this.h4);
	  dataView.setUint32(20, this.h5);
	  dataView.setUint32(24, this.h6);
	  if (!this.is224) {
		dataView.setUint32(28, this.h7);
	  }
	  return buffer;
	};
  
	function HmacSha256(key, is224, sharedMemory) {
	  var i, type = typeof key;
	  if (type === 'string') {
		var bytes = [], length = key.length, index = 0, code;
		for (i = 0; i < length; ++i) {
		  code = key.charCodeAt(i);
		  if (code < 0x80) {
			bytes[index++] = code;
		  } else if (code < 0x800) {
			bytes[index++] = (0xc0 | (code >>> 6));
			bytes[index++] = (0x80 | (code & 0x3f));
		  } else if (code < 0xd800 || code >= 0xe000) {
			bytes[index++] = (0xe0 | (code >>> 12));
			bytes[index++] = (0x80 | ((code >>> 6) & 0x3f));
			bytes[index++] = (0x80 | (code & 0x3f));
		  } else {
			code = 0x10000 + (((code & 0x3ff) << 10) | (key.charCodeAt(++i) & 0x3ff));
			bytes[index++] = (0xf0 | (code >>> 18));
			bytes[index++] = (0x80 | ((code >>> 12) & 0x3f));
			bytes[index++] = (0x80 | ((code >>> 6) & 0x3f));
			bytes[index++] = (0x80 | (code & 0x3f));
		  }
		}
		key = bytes;
	  } else {
		if (type === 'object') {
		  if (key === null) {
			throw new Error(ERROR);
		  } else if (ARRAY_BUFFER && key.constructor === ArrayBuffer) {
			key = new Uint8Array(key);
		  } else if (!Array.isArray(key)) {
			if (!ARRAY_BUFFER || !ArrayBuffer.isView(key)) {
			  throw new Error(ERROR);
			}
		  }
		} else {
		  throw new Error(ERROR);
		}
	  }
  
	  if (key.length > 64) {
		key = (new Sha256(is224, true)).update(key).array();
	  }
  
	  var oKeyPad = [], iKeyPad = [];
	  for (i = 0; i < 64; ++i) {
		var b = key[i] || 0;
		oKeyPad[i] = 0x5c ^ b;
		iKeyPad[i] = 0x36 ^ b;
	  }
  
	  Sha256.call(this, is224, sharedMemory);
  
	  this.update(iKeyPad);
	  this.oKeyPad = oKeyPad;
	  this.inner = true;
	  this.sharedMemory = sharedMemory;
	}
	HmacSha256.prototype = new Sha256();
  
	HmacSha256.prototype.finalize = function () {
	  Sha256.prototype.finalize.call(this);
	  if (this.inner) {
		this.inner = false;
		var innerHash = this.array();
		Sha256.call(this, this.is224, this.sharedMemory);
		this.update(this.oKeyPad);
		this.update(innerHash);
		Sha256.prototype.finalize.call(this);
	  }
	};
  
	var exports = createMethod();
	exports.sha256 = exports;
	exports.sha224 = createMethod(true);
	exports.sha256.hmac = createHmacMethod();
	exports.sha224.hmac = createHmacMethod(true);
  
	if (COMMON_JS) {
	  module.exports = exports;
	} else {
	  root.sha256 = exports.sha256;
	  root.sha224 = exports.sha224;
	  if (AMD) {
		define(function () {
		  return exports;
		});
	  }
	}
  })();
