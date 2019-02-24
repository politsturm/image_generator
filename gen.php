<!DOCTYPE html>
<style>
#canvas {
    display: none;
}
</style>

<?php
	$IGNORE_SSL = array(
		"ssl" => array(
			"verify_peer" => false,
			"verify_peer_name" => false,
		),
	);

	$img_url = $_GET['url'];
	$template = $_GET['template'];
	$text = $_GET['text'];

	$data = file_get_contents($img_url, false, stream_context_create($IGNORE_SSL));
	$base64 = 'data:image/' . $type . ';base64,' . base64_encode($data);

	$svg = file_get_contents("$template.svg");
	$svg = str_replace('%TEXT%', $text, $svg);
	$svg = str_replace('%IMAGE%', $base64, $svg);
	echo $svg;

	file_put_contents('test.svg', $svg);
	exec('convert test.svg test.png');
?>

<br>
<canvas id="canvas" width="1200" height="600"></canvas>
<br>

<button>Download</button>

<script>
	var btn = document.querySelector('button');
	var svg = document.querySelector('svg');
	var canvas = document.querySelector('canvas');

	function triggerDownload (imgURI) {
		var evt = new MouseEvent('click', {
			view: window,
			bubbles: false,
			cancelable: true
		});

		var a = document.createElement('a');
		a.setAttribute('download', 'MY_COOL_IMAGE.png');
		a.setAttribute('href', imgURI);
		a.setAttribute('target', '_blank');

		a.dispatchEvent(evt);
	}

	btn.addEventListener('click', function () {
		var canvas = document.getElementById('canvas');
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

			triggerDownload(imgURI);
		};

		img.src = url;
	});
<?php
	if ($_GET["download"] === "on") {
		echo "btn.click();";
	}
?>
</script>
