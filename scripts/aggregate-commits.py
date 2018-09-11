#!/usr/bin/env python3

import datetime
import json
import os
from argparse import ArgumentParser


class CommitAggregator(object):
    def __init__(self):
        self.args = self.parse_arguments()
        self.date_format = '%Y-%m-%dT%H:%M:%S%z'

    def parse_arguments(self):
        parser = ArgumentParser()
        parser.add_argument('input_dir', help='Directory containing input JSON files')
        parser.add_argument('output_dir', help='Directory to put JSON files to')
        parser.add_argument('-C', '--cooldown', type=int, default=3,
                            help='Cooldown time in merged streaks (days)')
        return parser.parse_args()

    def merge_commits(self, in_path, out_path, cooldown):
        repo = None

        with open(in_path, 'r') as f:
            content = f.read()
            commits = json.loads(content)['commits']

        for commit in commits:
            commit['date'] = datetime.datetime.strptime(commit['date'], self.date_format)
            repo = commit['repo']
            del commit['repo']

        merged_commits = []

        for commit in commits:
            found = False
            for m_commit in merged_commits:
                if m_commit['start'] - cooldown < commit['date'] < m_commit['end'] + cooldown:
                    found = True
                    m_commit['commits'].append(commit)

                    if commit['date'] < m_commit['start']:
                        m_commit['start'] = commit['date']

                    if commit['date'] > m_commit['end']:
                        m_commit['end'] = commit['date']

            if not found:
                merged_commits.append({
                    'start': commit['date'],
                    'end': commit['date'],
                    'commits' : [commit]
                })

        with open(out_path, 'w') as f:
            f.write(json.dumps({
                'repo': repo,
                'streaks': merged_commits
            }, indent=2, default=lambda v: v.strftime(self.date_format)))

    def run(self):
        day = 24 * 60 * 60
        input_dir = os.path.realpath(self.args.input_dir)
        output_dir = os.path.realpath(self.args.output_dir)
        cooldown_delta = datetime.timedelta(seconds=self.args.cooldown*day)

        for file in os.listdir(input_dir):
            print('Processing {}'.format(file))
            file_path = os.path.join(input_dir, file)
            if os.path.isfile(file_path) and file_path[-5:] == '.json':
                output_path = os.path.join(output_dir, file)
                self.merge_commits(file_path, output_path, cooldown_delta)


if __name__ == '__main__':
    CommitAggregator().run()
