#!/usr/bin/env python3

import json

def print_template(name, title, checked):
        print('<input type="radio" name="template" value="{}" {}>{}<br>'.format(
            name, 'checked' if checked else '', title))

print("Content-type: text/html")
print()
print('''
<!DOCTYPE html>

<meta encoding="utf-8">

<style>
.main {
	width: 600px;
	margin: 0 auto;
}
</style>
<div class="main">
	Если шрифт на конечном изображении с засечками, установите шрифт
	'Proxima Nova'. Можете попробовать файлы отсюда
	<a href="https://github.com/chrisronline/invision/tree/master/app/fonts/proxima-nova">отсюда</a>.
	<br>
	<br>

	<form action="gen.php">
		URL изображения:<br>
		<input type="text" name="url" value="">
		<br>
		<br>
		Заголовок новости:<br>
		<input type="text" name="text" value="">
		<br>
		<br>
		Шаблон:<br>
''')

with open('templates.json') as f:
    templates = json.load(f)
    checked = True
    for name, title in templates.items():
        print_template(name, title, checked)
        checked = False

print('''
		<br>
		<input type="checkbox" name="download" value="on" checked>
		Автоматически скачать изображение<br>
		<br>
		<input type="submit" value="Сгенерировать">
	</form>
</div>
''')
