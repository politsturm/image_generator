var g_svg;

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

async function generate_svg(url, template) {
	var uri = 'cgi-bin/generate' +
	    '?url=' + url +
	    '&template=' + template;

	return ajax(uri);
}

function get_current_template() {
	var templates = document.getElementsByName('template');
	for(var i = 0; i < templates.length; i++) {
		if (templates[i].checked) {
			return templates[i].value;
		}
	}
}

DEFAULT_TEMPLATE = 'default'
DEFAULT_IMG_URL = 'https://cdnb.artstation.com/p/assets/images/images/012/078/995/large/dmitry-petuhov-lenin.jpg'
DEFAULT_TEXT = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam massa.';
DEFAULT_SITE = 'politsturm.com';
DEFAULT_CITY = '';

async function get_svg() {
	var img_url = document.getElementById('url').value;
	if (img_url == '') {
		img_url = DEFAULT_IMG_URL;
	}

	var template = get_current_template();
	if (template === undefined) {
		template = DEFAULT_TEMPLATE;
	}

	return generate_svg(img_url, template);
}

async function on_svg_change() {
	var svg = await get_svg();
	g_svg = svg;
	on_text_change();
}

var mousePosition;
var offset = [0,0];
var isDown = false;
var isHover = false;
var image = null;

function getClientPoint(e) {
	return {
		x: e.clientX,
		y: e.clientY
	};
}

function getAttrPoint(element) {
	return {
		x: parseFloat(element.getAttribute('x')),
		y: parseFloat(element.getAttribute('y')),
	}
}

function getAttrRect(element) {
	var point = getAttrPoint(element);
	return {
		x: point.x,
		y: point.y,
		width:  parseFloat(element.getAttribute('width')),
		height: parseFloat(element.getAttribute('height')),
	};
}

function setAttrPoint(element, point) {
	element.setAttribute('x', point.x);
	element.setAttribute('y', point.y);
}

function setAttrRect(element, rect) {
	setAttrPoint(element, {x: rect.x, y: rect.y});
	element.setAttribute('width', rect.width);
	element.setAttribute('height', rect.height);
}

function pointsDiff(a, b) {
	return {
		x: a.x - b.x,
		y: a.y - b.y,
	};
}

function pointsSum(a, b) {
	return {
		x: a.x + b.x,
		y: a.y + b.y,
	};
}

function pointMultiply(point, k) {
	return {
		x: point.x * k,
		y: point.y * k
	};
}

function pointPixToPoint(pixPoint) {
	var viewBox = getViewBox(document.getElementsByTagName('svg')[0]);
	var imageRect = document.getElementById('svg').getBoundingClientRect();
	var pixToPoint = viewBox.width / imageRect.width;
	return pointMultiply(pixPoint, pixToPoint);
}

function on_text_change() {
	var text = document.getElementById('title').value;
	if (text == '') {
		text = DEFAULT_TEXT;
	}

	var site = document.getElementById('site').value;
	if (site == '') {
		site = DEFAULT_SITE;
	}

	var city = document.getElementById('city').value;
	if (city == '') {
		city = DEFAULT_CITY;
	} else {
		city = '#' + city;
	}

	var svg = g_svg.replace("%TEXT%", text)
		           .replace("%SITE%", site)
		           .replace("%CITY%", city);
	var svg_block = document.getElementById('svg');
	svg_block.innerHTML = svg;

	image = document.getElementsByTagName('image')[0];
	svg_block.addEventListener('mousedown', function(e) {
		isDown = true;
		var imagePoint = getAttrPoint(image);
		var cursorPoint = pointPixToPoint(getClientPoint(e));
		offset = pointsDiff(imagePoint, cursorPoint);
	}, true);

	svg_block.addEventListener('mouseover', function(e) {
		isHover = true;
	}, true);

	svg_block.addEventListener('mouseout', function(e) {
		isHover = false;
	}, true);
}

document.addEventListener('mouseup', function() {
	isDown = false;
}, true);

document.addEventListener('mousemove', function(e) {
	e.preventDefault();
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
	if (isHover) {
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
	}
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
	on_svg_change();
	on_text_change();

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
		ctx.drawImage(img, 0, 0);
		DOMURL.revokeObjectURL(url);

		var imgURI = canvas
			.toDataURL('image/png')
			.replace('image/png',
			'image/octet-stream');

		var text = document.getElementById('title').value;
		triggerDownload(text, imgURI);
	};

	img.src = url;
}

function createInput(name, title, checked) {
	var elem = document.createElement('div');
	elem.classList.add('custom-control');
	elem.classList.add('custom-radio');

	var id = 'templ-' + name;

	var input = document.createElement('input');
	input.type = 'radio';
	input.name = 'template';
	input.id = id;
	input.value = name;
	input.checked = checked;
	input.onchange = on_svg_change;
	input.classList.add('custom-control-input');
	elem.appendChild(input);

	var label = document.createElement('label');
	label.setAttribute('for', id);
	label.classList.add('custom-control-label');
	label.innerHTML = title;
	elem.appendChild(label);

	return elem;
}

window.onload = async function() {
	var result = await ajax('cgi-bin/templates');
	var templates = JSON.parse(result);
	var checked = true
	for (var name in templates) {
		var li = createInput(name, templates[name], checked);
		// Checked only first
		checked = false;

		var block = document.getElementById('templates')
		block.appendChild(li);
	}

	on_svg_change();
}
