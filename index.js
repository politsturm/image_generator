var g_svg;

function ajax(uri, onload) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', uri);
	xhr.onload = function() {
		if (xhr.status === 200) {
			onload(xhr.responseText);
		} else {
			alert('Request failed.  Returned status of ' + xhr.status);
		}
	}
	xhr.send();
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

function get_svg(handler) {
	var img_url = document.getElementById('url').value;
	if (img_url == '') {
		img_url = DEFAULT_IMG_URL;
	}

	var template = get_current_template();
	if (template === undefined) {
		template = DEFAULT_TEMPLATE;
	}

	var uri = 'cgi-bin/generate' +
		'?url=' + img_url +
		'&template=' + template;
	ajax(uri, handler);
}

function on_svg_change() {
	get_svg(function(svg) {
		g_svg = svg;
		on_text_change();
	});
}

function on_text_change() {
	var text = document.getElementById('title').value;
	if (text == '') {
		text = DEFAULT_TEXT
	}
	var svg = g_svg.replace("%TEXT%", text);
	document.getElementById('svg').innerHTML = svg;
}

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

window.onload = function() {
	ajax('cgi-bin/templates', function(result) {
		var checked = true
		var templates = JSON.parse(result);
		for (var name in templates) {
			var li = createInput(name, templates[name], checked);
			// Checked only first
			checked = false;

			var block = document.getElementById('templates')
			block.appendChild(li);
		}
	});
	on_svg_change();
}
