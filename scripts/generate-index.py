#!/usr/bin/env python3

from argparse import ArgumentParser
from functools import reduce
import json
import os


def add(a, b):
    return a + b


def get_file_statistics(file):
    with open(file, 'r') as f:
        content = json.loads(f.read())

        return {
            'filename': os.path.basename(file),
            'repo': content['repo'],
            'streaks': len(content['streaks']),
            'commits': reduce(add, [len(streak['commits']) for streak in content['streaks']]),
        }


def main():
    parser = ArgumentParser()
    parser.add_argument('dir', help='Directory to generate index for')
    args = parser.parse_args()

    json_dir = os.path.realpath(args.dir)
    indexed_files = []

    for file in os.listdir(json_dir):
        if file == '_index.json':
            continue

        print('Parsing {}'.format(file))
        file_path = os.path.join(json_dir, file)
        indexed_files.append(get_file_statistics(file_path))

    with open(os.path.join(json_dir, '_index.json'), 'w') as f:
        f.write(json.dumps(indexed_files, indent=2))


if __name__ == '__main__':
    main()
