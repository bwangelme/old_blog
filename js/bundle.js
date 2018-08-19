/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _styles_main_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./styles/main.css */ \"./src/styles/main.css\");\n/* harmony import */ var _styles_main_css__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_styles_main_css__WEBPACK_IMPORTED_MODULE_0__);\n // Selected DOM elements\n\nvar html = document.querySelector('html');\nvar body = document.querySelector('body');\nvar menuToggle = document.querySelector('.menu-toggle');\nvar menuIcon = document.querySelector('.icon-menu');\nvar siteMenu = document.querySelector('.site-menu');\nvar socialMenu = document.querySelector('.social-menu');\nvar toTopBtn = document.querySelector('.to-top'); // Site and social menu toggle\n\nif (menuToggle) {\n  menuToggle.addEventListener('click', function () {\n    siteMenu.classList.toggle('collapsed');\n    socialMenu.classList.toggle('collapsed');\n    menuIcon.classList.toggle('icon-menu');\n    menuIcon.classList.toggle('icon-close');\n  });\n} // Random emoji for 404 error message.\n\n\nvar randomErrorEmoji = function randomErrorEmoji() {\n  var error = document.getElementsByClassName('error-emoji')[0];\n  var emojiArray = ['\\\\(o_o)/', '(o^^)o', '(˚Δ˚)b', '(^-^*)', '(≥o≤)', '(^_^)b', '(·_·)', '(=\\'X\\'=)', '(>_<)', '(;-;)', '\\\\(^Д^)/'];\n\n  if (error) {\n    var errorEmoji = emojiArray[Math.floor(Math.random() * emojiArray.length)];\n    error.appendChild(document.createTextNode(errorEmoji));\n  }\n};\n\nrandomErrorEmoji(); // Object-fit polyfill for post cover\n\n/* eslint-disable no-undef */\n\nobjectFitImages('img.post-cover'); // Show toTopBtn when scroll to 600px\n\n/* eslint-disable no-undef */\n\nvar lastPosition = 0;\nvar ticking = false;\nwindow.addEventListener('scroll', function () {\n  lastPosition = body.scrollTop === 0 ? html.scrollTop : body.scrollTop;\n\n  if (!ticking) {\n    window.requestAnimationFrame(function () {\n      if (lastPosition >= 600) {\n        toTopBtn.classList.remove('is-hide');\n      } else {\n        toTopBtn.classList.add('is-hide');\n      }\n\n      ticking = false;\n    });\n  }\n\n  ticking = true;\n}); // Smooth Scroll to top when click toTopBtn\n\nvar scroll = new SmoothScroll('a[href*=\"#\"]');\ntoTopBtn.addEventListener('click', function () {\n  scroll.animateScroll(0);\n}); // HMR interface\n\nif (false) {}//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvaW5kZXguanMuanMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vc3JjL2luZGV4LmpzPzEyZDUiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICcuL3N0eWxlcy9tYWluLmNzcyc7XG5cbi8vIFNlbGVjdGVkIERPTSBlbGVtZW50c1xuY29uc3QgaHRtbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2h0bWwnKTtcbmNvbnN0IGJvZHkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5Jyk7XG5jb25zdCBtZW51VG9nZ2xlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLm1lbnUtdG9nZ2xlJyk7XG5jb25zdCBtZW51SWNvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5pY29uLW1lbnUnKTtcbmNvbnN0IHNpdGVNZW51ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnNpdGUtbWVudScpO1xuY29uc3Qgc29jaWFsTWVudSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zb2NpYWwtbWVudScpO1xuY29uc3QgdG9Ub3BCdG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcudG8tdG9wJyk7XG5cbi8vIFNpdGUgYW5kIHNvY2lhbCBtZW51IHRvZ2dsZVxuaWYgKG1lbnVUb2dnbGUpIHtcbiAgbWVudVRvZ2dsZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICBzaXRlTWVudS5jbGFzc0xpc3QudG9nZ2xlKCdjb2xsYXBzZWQnKTtcbiAgICBzb2NpYWxNZW51LmNsYXNzTGlzdC50b2dnbGUoJ2NvbGxhcHNlZCcpO1xuICAgIG1lbnVJY29uLmNsYXNzTGlzdC50b2dnbGUoJ2ljb24tbWVudScpO1xuICAgIG1lbnVJY29uLmNsYXNzTGlzdC50b2dnbGUoJ2ljb24tY2xvc2UnKTtcbiAgfSk7XG59XG5cbi8vIFJhbmRvbSBlbW9qaSBmb3IgNDA0IGVycm9yIG1lc3NhZ2UuXG5jb25zdCByYW5kb21FcnJvckVtb2ppID0gKCkgPT4ge1xuICBjb25zdCBlcnJvciA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2Vycm9yLWVtb2ppJylbMF07XG4gIGNvbnN0IGVtb2ppQXJyYXkgPSBbXG4gICAgJ1xcXFwob19vKS8nLCAnKG9eXilvJywgJyjLms6Uy5opYicsICcoXi1eKiknLCAnKOKJpW/iiaQpJywgJyheX14pYicsICcozodfzocpJyxcbiAgICAnKD1cXCdYXFwnPSknLCAnKD5fPCknLCAnKDstOyknLCAnXFxcXChe0JReKS8nLFxuICBdO1xuICBpZiAoZXJyb3IpIHtcbiAgICBjb25zdCBlcnJvckVtb2ppID0gZW1vamlBcnJheVtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBlbW9qaUFycmF5Lmxlbmd0aCldO1xuICAgIGVycm9yLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGVycm9yRW1vamkpKTtcbiAgfVxufTtcbnJhbmRvbUVycm9yRW1vamkoKTtcblxuLy8gT2JqZWN0LWZpdCBwb2x5ZmlsbCBmb3IgcG9zdCBjb3ZlclxuLyogZXNsaW50LWRpc2FibGUgbm8tdW5kZWYgKi9cbm9iamVjdEZpdEltYWdlcygnaW1nLnBvc3QtY292ZXInKTtcblxuLy8gU2hvdyB0b1RvcEJ0biB3aGVuIHNjcm9sbCB0byA2MDBweFxuLyogZXNsaW50LWRpc2FibGUgbm8tdW5kZWYgKi9cbmxldCBsYXN0UG9zaXRpb24gPSAwO1xubGV0IHRpY2tpbmcgPSBmYWxzZTtcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCAoKSA9PiB7XG4gIGxhc3RQb3NpdGlvbiA9IGJvZHkuc2Nyb2xsVG9wID09PSAwID8gaHRtbC5zY3JvbGxUb3AgOiBib2R5LnNjcm9sbFRvcDtcbiAgaWYgKCF0aWNraW5nKSB7XG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICBpZiAobGFzdFBvc2l0aW9uID49IDYwMCkge1xuICAgICAgICB0b1RvcEJ0bi5jbGFzc0xpc3QucmVtb3ZlKCdpcy1oaWRlJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0b1RvcEJ0bi5jbGFzc0xpc3QuYWRkKCdpcy1oaWRlJyk7XG4gICAgICB9XG4gICAgICB0aWNraW5nID0gZmFsc2U7XG4gICAgfSk7XG4gIH1cbiAgdGlja2luZyA9IHRydWU7XG59KTtcblxuLy8gU21vb3RoIFNjcm9sbCB0byB0b3Agd2hlbiBjbGljayB0b1RvcEJ0blxuY29uc3Qgc2Nyb2xsID0gbmV3IFNtb290aFNjcm9sbCgnYVtocmVmKj1cIiNcIl0nKTtcbnRvVG9wQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICBzY3JvbGwuYW5pbWF0ZVNjcm9sbCgwKTtcbn0pO1xuXG4vLyBITVIgaW50ZXJmYWNlXG5pZiAobW9kdWxlLmhvdCkgbW9kdWxlLmhvdC5hY2NlcHQoKTtcbiJdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQTtBQUFBO0FBQUE7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUE7QUFDQTtBQUVBO0FBQ0E7QUFBQTtBQUNBO0FBRUE7QUFDQTtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUEiLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./src/index.js\n");

/***/ }),

/***/ "./src/styles/main.css":
/*!*****************************!*\
  !*** ./src/styles/main.css ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("// extracted by mini-css-extract-plugin//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvc3R5bGVzL21haW4uY3NzLmpzIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vLy4vc3JjL3N0eWxlcy9tYWluLmNzcz83NzM4Il0sInNvdXJjZXNDb250ZW50IjpbIi8vIGV4dHJhY3RlZCBieSBtaW5pLWNzcy1leHRyYWN0LXBsdWdpbiJdLCJtYXBwaW5ncyI6IkFBQUEiLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./src/styles/main.css\n");

/***/ })

/******/ });