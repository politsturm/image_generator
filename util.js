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

