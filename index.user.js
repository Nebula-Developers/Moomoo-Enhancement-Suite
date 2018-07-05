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
// @run-at       document-start
// ==/UserScript==

(() => {
	try {
		WebSocket = class extends WebSocket {
			constructor(...arg) {
				super(...arg);

				this._send = this.send;
				this.send = function () {
					this._send.apply(this, arguments);
				};
			}
		};

		const modules = [{
			id: "tracers",
			name: "Tracers",
		}];

		const amazing = document.createElement("script");
		amazing.src = "https://code.jquery.com/jquery-3.3.1.slim.min.js";
		amazing.addEventListener("load", () => {
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

			hackMenu.css("background-color", "rgba(0, 0, 0, 0.25)");
			hackMenu.css("width", "400px");
			hackMenu.css("height", "400px");
			hackMenu.css("color", "white");
			hackMenu.css("max-height", "calc(100vh - 400px)");
			hackMenu.css("overflow-y", "hidden");
			hackMenu.css("display", "inline-block");
			hackMenu.css("border-radius", "4px");

			const header = $("<h1/>");
			header.text("OPTIONS");
			header.css("font-size", "26px");

			const categoryChoose = $("<select/>");
			categoryChoose.css("width", "30%");
			categoryChoose.append("<option hidden default>Category</option>");

			const settingsBox = $("<div/>");
			settingsBox.css("height", "300px");
			settingsBox.css("overflow-y", "scroll");
			settingsBox.css("padding", "25px");
			settingsBox.css("text-align", "left");
			settingsBox.css("font-size", "18px");

			settingsBox.text(`Welcome to the Moomoo Enhancement Suite made by Nebula Developers!`);
			
			hackMenu.append(header);
			hackMenu.append(categoryChoose);
			hackMenu.append(settingsBox);

			menuWrapper.append(hackMenu);
			gameUI.append(menuWrapper);
			
			function toggleMenu() {
				menuOpen = !menuOpen;
				menuWrapper.css("display", menuOpen ? "block" : "none");
			}
		});
		document.head.appendChild(amazing);

	} catch (e) {
		console.warn(e)
	}
})();