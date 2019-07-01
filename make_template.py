import xml.etree.ElementTree as ET
from xml.etree.ElementTree import Element, SubElement, Comment, tostring

import sys
import re

def get_parent(tree, node):
    for parent in tree.iter():
        for child in parent:
            if child == node:
                return parent

def is_news_text(text_tag):
    return text_tag.attrib['font-family'] == 'Proxima Nova Lt'

def is_tag_text(text_tag):
    return (text_tag.attrib['font-family'] == 'Proxima Nova Rg' and
            text_tag.attrib['font-weight'] == 'bold')

def is_site_name(text_tag):
    return (text_tag.attrib['font-family'] == 'Proxima Nova Rg' and
            text_tag.attrib['font-weight'] == 'normal')

def get_font_size(tag):
    font_size_str = tag.attrib['font-size']
    match = re.match(r'[0-9\.]+', font_size_str)
    return float(match.group(0))

def get_lineheight(tags):
    ys = [ float(tag.attrib['y']) for tag in tags ]
    ys = sorted(list(set(ys)))
    if len(ys) == 1:
        return None

    dy = ys[1] - ys[0]
    font_size = get_font_size(tags[0])
    return dy / font_size

def get_style(tags, letter_spacing):
    text = tags[0]
    text.attrib['color'] = text.attrib['fill']
    text.attrib['font-family'] = "'{}'".format(text.attrib['font-family'])
    text.attrib['letter-spacing'] = '{}em'.format(letter_spacing)
    line_height = get_lineheight(tags)
    if line_height:
        text.attrib['line-height'] = str(line_height)


    del text.attrib['fill']
    del text.attrib['x']
    del text.attrib['y']
    return ';'.join([ '{}:{}'.format(k, v) for (k, v) in text.attrib.items() ])

def create_foreign_object(tags, content, letter_spacing, width_k):
    min_x = min([ float(tag.attrib['x']) for tag in tags ])
    max_x = max([ float(tag.attrib['x']) for tag in tags ])
    min_y = min([ float(tag.attrib['y']) for tag in tags ])
    max_y = max([ float(tag.attrib['y']) for tag in tags ])

    font_size = get_font_size(tags[0])

    x = min_x
    y = min_y - font_size
    width  = (max_x - min_x + font_size) * width_k
    height = max_y - min_y + font_size * 2

    fo = Element('foreignObject')
    fo.set('x', str(x))
    fo.set('y', str(y))
    fo.set('width', str(width))
    fo.set('height', str(height))

    p = Element('p')
    p.attrib['style'] = get_style(tags, letter_spacing)
    p.text = content
    fo.append(p)

    return fo

def replace_text(tree, selector, content, letter_spacing, width_k=1.0):
    root = tree.getroot()
    tags = [ text
            for text in root.findall('.//{http://www.w3.org/2000/svg}text')
            if selector(text)
    ]

    first_text = tags[0]
    parent = get_parent(tree, first_text)
    fo = create_foreign_object(tags, content, letter_spacing, width_k)
    parent.append(fo)

    for tag in tags:
        parent.remove(tag)

def main(input_svg, output_svg):
    ET.register_namespace('', 'http://www.w3.org/2000/svg')
    ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')
    tree = ET.parse(input_svg)
    if not tree:
        print("Can't read {}".format(input_svg))
        return

    root = tree.getroot()
    root.attrib['width'] = '1920'
    root.attrib['height'] = '1080'
    for image in root.findall('.//{http://www.w3.org/2000/svg}image'):
        image.set('{http://www.w3.org/1999/xlink}href', '%IMAGE%')
        image.set('preserveAspectRatio', 'xMidYMid slice')

    replace_text(tree, is_news_text, '%TEXT%', letter_spacing=0.07)
    replace_text(tree, is_tag_text,  '%CITY%', letter_spacing=0.07, width_k=1.3)
    replace_text(tree, is_site_name, '%SITE%', letter_spacing=0.19, width_k=1.3)

    for tag in root.findall('.//{http://www.w3.org/2000/svg}font'):
        parent = get_parent(root, tag)
        parent.remove(tag)

    for tag in root.findall('.//{http://www.w3.org/2000/svg}metadata'):
        parent = get_parent(root, tag)
        parent.remove(tag)

    tree.write(output_svg)


if __name__ == "__main__":
    args = sys.argv
    if len(args) != 3:
        print("Usage: {} <input.svg> <output.svg>".format(args[0]))
        sys.exit(1)

    main(args[1], args[2])

