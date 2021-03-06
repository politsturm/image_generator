var globalSvgText;

async function ajax(uri) {
	return new Promise((resolve, reject) => {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', uri);
		xhr.onload = function() {
			if (xhr.status === 200) {
				resolve(xhr.responseText);
			} else {
				reject(xhr.status);
			}
		}
		xhr.send();
	});
}

async function getImageFromServer(url) {
	return new Promise(async (resolve, reject) => {
		// Already server request
		if (url.startsWith('cgi-bin')) {
			reject();
			return;
		}

		var image = await ajaxImage('cgi-bin/download?url=' + url);
		resolve(image);
	});
}

async function ajaxImage(url) {
	return new Promise(async (resolve, reject) => {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url);
		xhr.responseType = 'blob';
		xhr.onerror = async function() {
			var image = await getImageFromServer(url);
			resolve(image);
		}
		xhr.onload = async function() {
			if (xhr.status !== 200) {
				reject(xhr.status);
				return;
			}

			if (xhr.response.size === 0) {
				var image = await getImageFromServer(url);
				resolve(image);
				return;
			}

			var reader = new FileReader();
			reader.onloadend = function() {
				resolve(reader.result);
			}
			reader.readAsDataURL(xhr.response);
		};
		xhr.send();
	});
}

DEFAULT_TEMPLATE = 'default'
DEFAULT_IMG_URL = 'https://cdnb.artstation.com/p/assets/images/images/012/078/995/large/dmitry-petuhov-lenin.jpg'
DEFAULT_TEXT = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit';
DEFAULT_SITE = 'politsturm.com';
DEFAULT_CITY = '';

async function getSVG() {
	var template = document.getElementById('templates').value;
	if (template == '') {
		template = DEFAULT_TEMPLATE;
	}

	var uri = 'data/' + template + '.svg';
	return ajax(uri);
}

async function getFonts() {
	var fontsTags = document.getElementsByClassName('fonts');
	var fonts = '';
	for (const fontsTag of fontsTags) {
		var uri = fontsTag.href;
		fonts += await ajax(uri);
	}

	return fonts;
}

async function getStyle() {
	var tag = document.getElementById('style');
	var uri = tag.href;
	return ajax(uri);
}

var isDown = false;
var isHover = false;
var isShiftPressed = false;
var offset = null
var image = null;

async function injectStyle(svg, fonts) {
	var docu = new DOMParser().parseFromString(svg, 'application/xml');
	var style = docu.createElementNS('http://www.w3.org/2000/svg', 'style');
	style.setAttribute('type', 'text/css');

	var cdata = docu.createCDATASection(fonts);
	style.appendChild(cdata);
	docu.querySelector('defs').appendChild(style);
	return new XMLSerializer().serializeToString(docu);
}

async function onTemplateChange() {
	var svg = await getSVG();
	var fonts = await getFonts();
	svg = await injectStyle(svg, fonts);
	var style = await getStyle();
	svg = await injectStyle(svg, style);

	var svgBlock = document.getElementById('svg');
	svgBlock.innerHTML = svg;

	var images = document.getElementsByTagName('image')

	for (var i = 0; i < images.length; i++) {
		var isFixed = images[i].getAttribute('fixedposition');
		if (isFixed == "true") {
			continue;
		}

		image = images[i];
	}

	svgBlock.addEventListener('mousedown', function(e) {
		isDown = true;
		var imagePoint = getAttrPoint(image);
		var cursorPoint = pointPixToPoint(getClientPoint(e));
		offset = pointsDiff(imagePoint, cursorPoint);
	}, true);

	svgBlock.addEventListener('mouseover', function(e) {
		isHover = true;
	}, true);

	svgBlock.addEventListener('mouseout', function(e) {
		isHover = false;
	}, true);

	var svgElem = document.querySelector('svg');
	var canvasElem = document.querySelector('canvas');
	canvasElem.setAttribute('width', svgElem.getAttribute('width'));
	canvasElem.setAttribute('height', svgElem.getAttribute('height'));

	updateSVG();
}

document.addEventListener('keydown', function(e) {
	if (e.key == 'Shift') {
		isShiftPressed = true;
	}
}, true);

document.addEventListener('keyup', function(e) {
	if (e.key == 'Shift') {
		isShiftPressed = false;
	}
}, true);


function pointPixToPoint(pixPoint) {
	var viewBox = getViewBox(document.getElementsByTagName('svg')[0]);
	var imageRect = document.getElementById('svg').getBoundingClientRect();
	var pixToPoint = viewBox.width / imageRect.width;
	return pointMultiply(pixPoint, pixToPoint);
}

async function onURLChange() {
	var imgUrl = document.getElementById('url').value;
	if (imgUrl == '') {
		imgUrl = DEFAULT_IMG_URL;
	}

	var imageBase64 = await ajaxImage(imgUrl);
	var imageTags = document.querySelectorAll('svg image');
	for (var i = 0; i < imageTags.length; i++) {
		var tag = imageTags[i];
		var isFixed = tag.getAttribute('fixedimage');
		if (isFixed == "true") {
			continue;
		}
		tag.setAttribute('xlink:href', imageBase64);
	}
}

function getTextElements() {
	var textElems = document.getElementsByClassName('svg_text');
	if (textElems.length !== 0) {
		return textElems;
	}

	return [ document.getElementById('svg_text') ];
}

function onTitleChange() {
	var text = document.getElementById('title').value;
	if (text == '') {
		text = DEFAULT_TEXT;
	}

	var textElems = getTextElements();
	for (var i = 0; i < textElems.length; i++) {
		var elem = textElems[i];
		elem.innerHTML = text;
	}

	var words = text.split(' ');
	words.unshift('Без выделения')

	var accentList = document.getElementById('accent');
	accentList.innerHTML = '';
	for (var i = 0; i < words.length; i++) {
		var word = words[i];
		var option = document.createElement('option');
		option.appendChild(document.createTextNode(word));
		accentList.appendChild(option);
	}
}

function onSubtitleChange() {
	var text = document.getElementById('subtitle').value;
	if (text == '') {
		text = DEFAULT_TEXT;
	}

	var elem = document.getElementById('svg_subtitle');
	if (elem) {
		elem.innerHTML = text;
	}
}

function onAccentChange() {
	var text = document.getElementById('title').value;
	var selectedWord = document.getElementById('accent').value;
	var words = text.split(' ');
	var newText = '';
	for (var i = 0; i < words.length; i++) {
		var word = words[i];
		if (word == selectedWord) {
			word = '<font color="#fe0048">' + word + '</font>'
		}

		newText += word + ' ';
	}

	var textElems = getTextElements();
	for (var i = 0; i < textElems.length; i++) {
		var elem = textElems[i];
		elem.innerHTML = newText;
	}
}

function onSiteChange() {
	var site = document.getElementById('site').value;
	if (site == '') {
		site = DEFAULT_SITE;
	}
	var elem = document.getElementById('svg_site');
	if (!elem) {
		return;
	}
	elem.innerHTML = site;
}

function onCityChange() {
	var city = document.getElementById('city').value;
	var elem = document.getElementById('svg_city');
	if (!elem) {
		return;
	}
	var withoutTag = elem.getAttribute('withouttag');
	if (withoutTag != "true") {
		if (city == '') {
			city = DEFAULT_CITY;
		} else {
			city = '#' + city;
		}
	}
	elem.innerHTML = city;
}

function updateSVG() {
	onURLChange();
	onTitleChange();
	onSubtitleChange();
	onSiteChange();
	onCityChange();
}

document.addEventListener('mouseup', function() {
	isDown = false;
}, true);

document.addEventListener('mousemove', function(e) {
	e.preventDefault();

	if (!isShiftPressed) {
		return;
	}

	if (isDown) {
		var cursorPoint = pointPixToPoint(getClientPoint(e));
		var newPoint = pointsSum(cursorPoint, offset);
		setAttrPoint(image, newPoint);
	}
}, true);

function getViewBox(element) {
	var viewBox = element.getAttribute('viewBox');
	var arr = viewBox.split(' ');
	return {
		x: arr[0],
		y: arr[1],
		width: arr[2],
		height: arr[3],
	}
}

document.addEventListener('wheel', function(e) {
	if (!isHover) {
		return;
	}

	if (!isShiftPressed) {
		return;
	}

	if (e.deltaY == 0) {
		return;
	}

	e.preventDefault();
	var increaseCoef = 1.1;
	var decreaseCoef = 1 / increaseCoef;
	var coef = null;
	if (e.deltaY < 0) {
		coef = increaseCoef;
	} else if (e.deltaY > 0) {
		coef = decreaseCoef;
	}

	var imageData = getAttrRect(image);
	var imageRect = document.getElementById('svg').getBoundingClientRect();
	var imagePos = {
		x: imageRect.left,
		y: imageRect.top
	};
	// In pixels
	var cursorOnImagePoint = pointsDiff(getClientPoint(e), imagePos);
	var cursorPoint = pointPixToPoint(cursorOnImagePoint);
	imageData = scaleImage(imageData, cursorPoint, coef);
	setAttrRect(image, imageData);
}, {passive: false});

function triggerDownload(name, imgURI) {
	var evt = new MouseEvent('click', {
		view: window,
		bubbles: false,
		cancelable: true
	});

	var a = document.createElement('a');
	var filename = name.trim().replace(/ /g, '_') + '.png'
	a.setAttribute('download', filename);
	a.setAttribute('href', imgURI);
	a.setAttribute('target', '_blank');

	a.dispatchEvent(evt);
}

function download() {
	var canvas = document.querySelector('canvas');
	var svg = document.querySelector('svg');
	var ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	var data = (new XMLSerializer()).serializeToString(svg);
	var DOMURL = window.URL || window.webkitURL || window;

	var img = new Image();
	img.crossOrigin = "Anonymous";

	if (navigator.userAgent.indexOf('Chrome') != -1) {
		var url = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(data)));
	} else {
		var svgBlob = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
		var url = DOMURL.createObjectURL(svgBlob);
	}

	img.onload = function () {
		document.getElementById('download-help').classList.remove('d-none');
		canvas.classList.remove('d-none');
		ctx.drawImage(img, 0, 0);
		DOMURL.revokeObjectURL(url);

		var imgURI = canvas
			.toDataURL('image/png')
			.replace('image/png',
			'image/octet-stream');

		var text = getTextElements()[0].textContent;
		triggerDownload(text, imgURI);
	};

	img.src = url;
}

function createInput(name, title, checked) {
	var elem = document.createElement('option');
	elem.value = name;
	elem.innerHTML = title;
	return elem;
}

window.onload = async function() {
	var result = await ajax('data/templates.json');
	var templates = JSON.parse(result);
	var checked = true
	for (var name in templates) {
		var li = createInput(name, templates[name], checked);
		// Checked only first
		checked = false;

		var block = document.getElementById('templates')
		block.appendChild(li);
	}

	onTemplateChange();
}
