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
// ==/UserScript==

(() => {
	try {
		class Collection {
			constructor(array = []) {
				this.__array = array;
			}

			fromID(id) {
				return this.__array.filter(thing => thing.id === id);
			}

			get(id) {
				return this.fromID(id)[0];
			}

			has(id) {
				return this.fromID(id).length > 0;
			}

			forEach(callback) {
				this.__array.forEach(callback);
			}
		}

		const canvas = document.getElementById("gameCanvas");
		const ctx = canvas.getContext("2d");

		const players = {};
		let currentID = null;

		let ws;

		function randInt(min, max) {
			const mini = Math.ceil(min);
			return Math.floor(Math.random() * (Math.floor(max) - mini + 1)) + mini;
		}
		function randItem(array) {
			return array[randInt(0, array.length - 1)];
		}

		const modules = new Collection([{
			id: "core",
			name: "Core",
			description: "Welcome to the Moomoo Enhancement Suite made by Nebula Developers! All changes you make here will only apply after a refresh.",
			required: true,
			init: () => {
				const example = $($("#linksContainer2").children()[0]);

				const mesLink = example.clone();
				mesLink.text(`MES v${GM_info.script.version}`);
				mesLink.attr("href", "https://github.com/Nebula-Developers/Moomoo-Enhancement-Suite");

				example.after(" | ", mesLink);
			}
		}, {
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
				function drawTracers() {
					Object.values(players).forEach(player => {
						if (currentID === null || players[currentID] === undefined || players[currentID].longID === undefined) return;

						ctx.strokeStyle = color;
						ctx.lineWidth = 3;

						const player2 = players[currentID];

						ctx.beginPath();
						ctx.moveTo(player2.x, player2.y);
						ctx.lineTo(player.x, player.y);
						ctx.stroke();
					});

					window.requestAnimationFrame(drawTracers);
				}
				drawTracers();
			},
		}, {
			id: "auto_chat",
			name: "Automatic Chat",
			description: "Automatically chats certain messages.",
			settings: [{
				id: "messages",
				name: "Message List",
				hover: "You can insert multiple messages with a comma; if you want to say both '1' and '2', put '1,2'.",
				default: "Hello!,Git gud!",
				type: "text",
			}, {
				id: "randomize_messages",
				name: "Randomize Messages",
				default: true,
				type: "checkbox",
			}],
			init: () => {
				let index = 0;
				const messages = config.auto_chat.messages.split(",");

				setInterval(() => {
					if (ws) {
						const toSend = config.auto_chat.randomize_messages ? randItem(messages) : messages[index]; 

						ws.emit("ch", [
							toSend,
						]);

						index += 1;
						if (index >= messages.length) {
							index = 0;
						}
					}
				}, 3000);
			}
		}, {
			id: "smart_hat",
			name: "Smart Hats",
			description: "This module allows you to equip certain hats at certain times to get the most out of those actions.",
		}, {
			id: "heal",
			name: "Autoheal",
			description: "With this module, you can automatically heal when you get damaged.",
		}, {
			id: "object_map",
			name: "Object Mapper",
			description: "Maps the position of objects to your minimap.",
		}, {
			id: "projectile_blocker",
			name: "Arrow Blocking",
			description: "When you have a shield, this module will prevent arrows from hitting you by equipping it and blocking the arrow.",
		}, {
			id: "coordinates",
			name: "Coordinates",
			description: "Shows your coordinates.",
		}, {
			id: "minimap_biomes",
			name: "Biomes on Minimap",
			description: "Shows the different biomes on the minimap by coloring each region.",
			init: () => {
				$("#mapDisplay").css("background", "url('https://wormax.org/chrome3kafa/moomooio-background.png')");
			},
			deinit: () => {
				$("#mapDisplay").css("background", "rgba(0, 0, 0, 0.25)");
			},
		}, {
			id: "custom_text",
			name: "Custom Text",
			description: "This module lets you change the text of many things.",
			settings: [{
				id: "death",
				name: "Death",
				default: "YOU DIED",
				type: "text",
			}, {
				id: "title",
				name: "Title",
				default: "Moo Moo",
				type: "text",
			}],
			init: () => {
				$("#diedText").text(config.custom_text.death);
				document.title = config.custom_text.title;
			},
		}, {
			id: "ping_display",
			name: "Show Ping",
			description: "Adds the ping counter in-game.",
			init: () => {
				const pingDisplay = $("#pingDisplay");
				pingDisplay.css("top", "3px");
				pingDisplay.css("display", "block");

				$("body").append(pingDisplay);
			}
		}]);

		const config = JSON.parse(localStorage.getItem("mes_config")) || {};
		function setConfig(moduleID, key, value) {
			if (!config[moduleID]) {
				config[moduleID] = {};
			}

			if (!(key === undefined || value === undefined)) {
				config[moduleID][key] = value;
			}

			return localStorage.setItem("mes_config", JSON.stringify(config));
		}
		modules.forEach(module => {
			setConfig(module.id);
		});

		WebSocket = class extends WebSocket {
			constructor(...arg) {
				super(...arg);
				ws = this;

				this.addEventListener("message", event => {
					const data = msgpack.decode(event.data);
					
					switch (data[0]) {
						case "1":
							currentID = data[1][0];
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
							for (let i = 0, len = data[1][0].length / 13; i < len; i++) {
								if (!players[data[1][0][0 + i * 13]]) {
									players[data[1][0][0 + i * 13]] = {
										x: data[1][0][1 + i * 13],
										y: data[1][0][2 + i * 13],
										angle: data[1][0][3 + i * 13],
										lastUpdated: Date.now(),
									};
								} else {
									const p = players[data[1][0][0 + i * 13]];
									p.x = data[1][0][1 + i * 13];
									p.y = data[1][0][2 + i * 13],
									p.angle = data[1][0][3 + i * 13],
									p.lastUpdated = Date.now();
								}
							}
							break;
						case "4":
							for (const k in players) {
								if (players[k].longID == data[1][0]) delete players[k];
							}
					}
				});

				this._send = this.send;
				this.send = function () {
					this._send.apply(this, arguments);
				};
				this.emit = function () {
					const input = msgpack.encode(arguments);
					this.send(input);
				}
			}
		};

		let menuOpen = false;

		const gameUI = $("#gameUI");

		const menuButton = $("#allianceButton").clone(false);
		menuButton.children()[0].innerText = "touch_app";
		menuButton.css("right", "450px");
		menuButton.attr("title", `Moomoo Enhancement Script v${GM_info.script.version}`);

		menuButton.on("click", toggleMenu);

		gameUI.append(menuButton);

		const menuWrapper = $("<div/>");

		menuWrapper.css("display", "none");
		menuWrapper.css("width", "100%");
		menuWrapper.css("position", "absolute");
		menuWrapper.css("top", "50%");
		menuWrapper.css("transform", "translateY(-50%)");
		menuWrapper.css("text-align", "center");
		menuWrapper.css("pointer-events", "initial");

		const hackMenu = $("<div/>");
		hackMenu.attr("id", "hackMenu");

		const settingsBox = $("<div/>");
		settingsBox.attr("id", "settingsBox");

		const categoryChoose = $("<select/>");
		categoryChoose.css("width", "30%");
		categoryChoose.append("<option disabled>Choose Category</option>");

		// Add all modules to the module options select...
		modules.forEach(module => {
			const moduleOpt = $("<option/>");

			moduleOpt.attr("value", module.id);
			moduleOpt.text(module.name)

			categoryChoose.append(moduleOpt);
		});

		function makeInput(setting, configVal) {
			const input = $(`<input/>`);

			input.attr("type", setting.type);
			input.attr("name", setting.id);

			input.css("margin", "5px");
			input.css("max-width", "25px");

			const label = $(`<label class="settingRadio" />`);

			label.text(setting.name);
			input.attr("title", setting.hover);

			switch (setting.type) {
				case "text":
					input.css("width", "170px");
					input.css("max-width", "170px");

					input.attr("placeholder", `Default: ${setting.default}`);
					input.val(configVal);

					label.text(setting.name + ":");

					break;
				case "checkbox":
					input.prop("checked", configVal);
					break;
				default:
					input.val(configVal);
			}

			if (setting.type === "text") {
				label.append(input);
			} else {
				label.prepend(input);
			}

			return label;
		}

		categoryChoose.on("change", event => {
			const newmod = modules.get(event.target.value);
			settingsBox.empty();

			const desc = $("<p/>");
			desc.text(newmod.description || `You can change settings for the ${newmod.name} module here.`);
			settingsBox.append(desc);

			if (!newmod.required) {
				const enabledToggle = makeInput({
					type: "checkbox",
					id: "enabled",
					name: "Enable Module",
					hover: "Toggles all functionality in this module.",
				}, config[newmod.id].enabled);
				settingsBox.append(enabledToggle);
			}

			// Append module-provided settings.
			if (newmod.settings) {
				newmod.settings.forEach(setting => {
					settingsBox.append("<br/>");
					settingsBox.append(makeInput(setting, config[newmod.id][setting.id]));
				});
			}
		});

		settingsBox.on("change", event => {
			const target = $(event.target);

			switch (target.attr("type")) {
				case "checkbox":
					return setConfig(categoryChoose.val(), target.attr("name"), target.prop("checked"));
				default:
					return setConfig(categoryChoose.val(), target.attr("name"), target.val());
			}
		});

		categoryChoose.val("core").change();
		
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

		modules.forEach(module => {
			if (config[module.id].enabled || module.required) {
				if (module.init) {
					module.init();
				} else {
					console.warn(`Module ${module.id} has no initialization.`);
				}
			}
		});
	} catch (e) {
		console.warn(e)
	}
})();