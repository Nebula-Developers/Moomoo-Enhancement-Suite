// ==UserScript==
// @name         Moomoo Enhancement Suite
// @version      1.0.0
// @description  Shows your internal ID and position.
// @author       haykam821 | Nebula Developers
// @match        *://moomoo.io/*
// @match        *://45.77.0.81/*
// @match        *://dev.moomoo.io/*
// @match        *://sandbox.moomoo.io/*
// @grant        none
// @require      https://cdn.rawgit.com/creationix/msgpack-js-browser/9117d0f8/msgpack.js
// @require      https://code.jquery.com/jquery-3.3.1.slim.min.js
// @run-at       document-start
// ==/UserScript==

(() => {
	try {
		const ctx = document.getElementById("gameCanvas").getContext("2d");
		const players = {};

		const modules = [{
			id: "tracers",
			name: "Tracers",
			settings: [{
				id: "line_color",
				type: "color",
				name: "Line Color",
				description: "The color of the tracers.",
				default: "#000000"
			}],
			init: () => {
				function addTracers() {
					return;
				}

				window.requestAnimationFrame(addTracers)
			}
		}];
		modules.forEach(module => module.init());

		window.config = new Proxy(JSON.parse(localStorage.getItem("mes_config")) || {}, {
			get: (obj, prop) => {
				if (obj[prop]) {
					return obj[prop];
				} else {
					const prop2 = prop.split(".");
					return modules.filter(item => {
						return item.id === prop2[0];
					})[0].settings.filter(item => {
						return item.id === prop2[1];
					})[0].default;
				}
			},
			set: (obj, prop, val) => {
				obj[prop] = val;
				return localStorage.setItem("mes_config", JSON.stringify(obj));
			}
		});

		WebSocket = class extends WebSocket {
			constructor(...arg) {
				super(...arg);

				this.addEventListener("message", event => {
					const data = msgpack.decode(event.data);
					
					switch (data[0]) {
						case "2":
							players[data[1][0][1]] = {
								longID: data[1][0][0],
								name: data[1][0][2],
								x: data[1][0][3],
								y: data[1][0][4],
								angle: data[1][0][5],
								lastUpdated: Date.now(),
							};
							break;
						case "3":
							for (let i = 0, len = data[1].length / 13; i < len; i++) {
								if (!players[data[1][0 + i * 13]]) {
									players[data[1][0 + i * 13]] = {
										x: data[1][1 + i * 13],
										y: data[1][2 + i * 13],
										angle: data[1][3 + i * 13],
										lastUpdated: Date.now(),
									};
								} else {
									const p = players[data[1][0 + i * 13]];
									p.x = data[1][1 + i * 13];
									p.y = data[1][2 + i * 13],
									p.angle = data[1][3 + i * 13],
									p.lastUpdated = Date.now();
								}
							}
							break;
						case "4":
							for (const k in players) {
								if (players[k].longID == data[0][0]) delete players[k];
							}
					}
				});

				this._send = this.send;
				this.send = function () {
					this._send.apply(this, arguments);
				};
			}
		};

		let menuOpen = false;

		const gameUI = $("#gameUI");

		const menuButton = $("#allianceButton").clone(false);
		menuButton.children()[0].innerText = "touch_app";
		menuButton.css("right", "450px");

		menuButton.on("click", toggleMenu);

		gameUI.append(menuButton);

		const menuWrapper = $("<div/>");

		menuWrapper.css("display", "none");
		menuWrapper.css("width", "100%");
		menuWrapper.css("position", "absolute");
		menuWrapper.css("top", "50%");
		menuWrapper.css("transform", "translateY(-50%)");
		menuWrapper.css("text-align", "center");

		const hackMenu = $("<div/>");
		hackMenu.attr("id", "hackMenu");

		const categoryChoose = $("<select/>");
		categoryChoose.css("width", "30%");
		categoryChoose.append("<option hidden default>Category</option>");

		const settingsBox = $("<div/>");
		settingsBox.attr("id", "settingsBox");
		settingsBox.text(`Welcome to the Moomoo Enhancement Suite made by Nebula Developers!`);
		
		hackMenu.append("<h1>Options</h2>");
		hackMenu.append(categoryChoose);
		hackMenu.append(settingsBox);

		menuWrapper.append(hackMenu);
		gameUI.append(menuWrapper);

		$("head").append(`
			<style>
				#hackMenu {
					background-color: rgba(70, 40, 90, 0.75);
					width: 400px;
					height: 400px;
					color: white;
					max-height: calc(100vh - 400px);
					overflow-y: hidden;
					display: inline-block;
					border-radius: 4px;
				}

				#settingsBox {
					height: 300px;
					overflow-y: scroll;
					padding: 25px;
					text-align: left;
					font-size: 18px;
				}

				h1 {
					font-size: 26px;
					text-transform: uppercase;
				}
			</style>
		`);
		
		function toggleMenu() {
			menuOpen = !menuOpen;
			menuWrapper.css("display", menuOpen ? "block" : "none");
		}

	} catch (e) {
		console.warn(e)
	}
})();