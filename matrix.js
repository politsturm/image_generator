function multiply(a, b) {
	var aNumRows = a.length, aNumCols = a[0].length;
	var bNumRows = b.length, bNumCols = b[0].length;
	var m = new Array(aNumRows);  // initialize array of rows
	for (var r = 0; r < aNumRows; ++r) {
		m[r] = new Array(bNumCols); // initialize the current row
		for (var c = 0; c < bNumCols; ++c) {
			m[r][c] = 0;             // initialize the current cell
			for (var i = 0; i < aNumCols; ++i) {
				//var tmp = a[r][i] * b[i][c];
				//onsole.log(`a[${r}][${i}] = ${a[r][i]}`);
				//onsole.log(`b[${i}][${c}] = ${b[i][c]}`);
				//onsole.log(`a[${r}][${i}] * b[${i}][${c}] = ${tmp}`);
				m[r][c] += a[r][i] * b[i][c];
			}
		}
	}
	return m;
}

function scalePoint(point, origin, k) {
	var x = origin.x;
	var y = origin.y;
	var moveOriginMatrix = [
		[1, 0, -x],
		[0, 1, -y],
		[0, 0, 1],
	];

	var scaleMatrix = [
		[k, 0, 0],
		[0, k, 0],
		[0, 0, 1],
	];

	var moveBackMatrix = [
		[1, 0, x],
		[0, 1, y],
		[0, 0, 1],
	];

	var moved = multiply(moveOriginMatrix, point);
	var scaled = multiply(scaleMatrix, moved);
	return multiply(moveBackMatrix, scaled);
}

function scaleImage(image, origin, k) {
	var a = [
		[image.x],
		[image.y],
		[1]
	];

	var b = [
		[image.x + image.width],
		[image.y + image.height],
		[1]
	]

	var topLeft = scalePoint(a, origin, k);
	var bottomRight = scalePoint(b, origin, k);
	return {
		x: topLeft[0],
		y: topLeft[1],
		width: bottomRight[0] - topLeft[0],
		height: bottomRight[1] - topLeft[1],
	};
}
