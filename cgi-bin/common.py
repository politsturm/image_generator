import cgi
import argparse

def get_args():
    args = {}
    storage = cgi.FieldStorage()
    for key in storage.keys():
        args[key] = storage[key].value

    if len(args) != 0:
        args['cgi'] = True
        return args

    parser = argparse.ArgumentParser()
    parser.add_argument('-url', required=True)
    args = parser.parse_args().__dict__
    args['cgi'] = False
    return args

