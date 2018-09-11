#!/usr/bin/env python3

from argparse import ArgumentParser
import json
import os
import sys
import time

import requests
import yaml


def retry_on_rate_limit(func):
    def wrapper(*args, **kwargs):
        while True:
            sleep_time = 5
            try:
                return func(*args, **kwargs)
            except RateLimitExceededException:
                print('Got rate limited, waiting for {} seconds'.format(sleep_time))
                time.sleep(sleep_time)
                sleep_time *= 2

    return wrapper


class GithubStatsScraper(object):
    def __init__(self):
        self.args = self.parse_args()

        with open(os.path.expanduser('~/.config/hub'), 'r') as f:
            config = yaml.load(f.read())

        self.github_token = config['github.com'][0]['oauth_token']

        self.stat_num_repos = 0
        self.stat_num_commits = 0

    def log(self, message, *args, **kwargs):
        sys.stderr.write(message.format(*args, **kwargs))
        sys.stderr.flush()

    def parse_args(self):
        parser = ArgumentParser()
        parser.add_argument('-o', '--output-dir', type=str, default='.',
                            help='Directory to output raw data')
        parser.add_argument('-C', '--no-cache', action='store_true',
                            help='Do not use files in output_dir as cache')
        parser.add_argument('-x', '--exclude', action='append',
                            help='Exclude repository')
        return parser.parse_args()

    def _get_github_graphql(self, query):
        # print(query)
        headers = {'Authorization': 'Bearer {token}'.format(token=self.github_token)}
        response = requests.post('https://api.github.com/graphql', json={'query': query}, headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception('Query failed: {code} {query}'.format(code=response.status_code, query=query))

    def get_commits(self, repo_name):
        commits = []
        after = ''
        has_next_page = True
        while has_next_page:
            res = self._get_github_graphql('''{
                repository(name:"%(repo_name)s", owner:"prezi") {
                    ref(qualifiedName: "master") {
                        target {
                            ... on Commit {
                                history(first: 100 %(after)s) {
                                    pageInfo {
                                        hasNextPage
                                        endCursor
                                    }
                                    edges {
                                        node {
                                            id
                                            author {
                                                name
                                                user {
                                                    login
                                                }
                                                email
                                                date
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }''' % {'repo_name': repo_name, 'after': after})

            # print(json.dumps(res, indent=2))
            history = res['data']['repository']['ref']['target']['history']
            edges = history['edges']
            commits += [edge['node'] for edge in edges]

            has_next_page = history['pageInfo']['hasNextPage']
            if has_next_page:
                after = ', after:"{cursor}"'.format(cursor=history['pageInfo']['endCursor'])

        return commits

    def get_repos(self, org):
        repos = []
        has_next_page = True
        after = ''

        while has_next_page:
            res = self._get_github_graphql('''{
                organization(login: "%(org)s") {
                    repositories(first: 100 %(after)s) {
                        pageInfo {
                            hasNextPage
                            endCursor
                        }
                        edges {
                            node {
                                name
                                isFork
                            }
                        }
                    }
                }
            }''' % {'org': org, 'after': after})

            repositories = res['data']['organization']['repositories']
            repos += [edge['node'] for edge in repositories['edges']]

            has_next_page = repositories['pageInfo']['hasNextPage']
            if has_next_page:
                after = ', after:"{cursor}"'.format(cursor=repositories['pageInfo']['endCursor'])

        return repos

    def download_statistics_for_repo(self, repo):
        # Don't scrape forked, assessment and excluded repos
        if repo['isFork']:
            self.log('Skipping forked repository {}\n', repo['name'])
            return

        if 'assessment' in repo['name'] or 'assignment' in repo['name']:
            self.log('Skipping assessment repository {}\n', repo['name'])
            return

        if repo['name'] in self.args.exclude:
            self.log('Skipping excluded repository {}\n', repo['name'])
            return

        target_path = os.path.join(self.args.output_dir, '{}.json'.format(repo['name']))
        temp_path = target_path + '.partial'

        if os.path.exists(target_path) and not self.args.no_cache:
            self.log('Skipping already scraped repository {}\n', repo['name'])
            return

        with open(temp_path, 'w') as f:
            f.write('{\n  "commits": [')
            num_commits = 0
            commits = self.get_commits(repo_name=repo['name'])

            for commit in commits:
                self.log('\rDownloading statistics for repository {repo} ' +
                         '(#{num}, commits: {commits})...',
                         repo=repo['name'], num=self.stat_num_repos + 1,
                         commits=num_commits)

                commit_obj = {
                    'date': commit['author']['date'],
                    'repo': repo['name'],
                    'committer': {
                        'login': commit['author']['user']['login'] if commit['author']['user'] else None,
                        'name': commit['author']['name'],
                        'email': commit['author']['email'],
                    }
                }

                f.write((',' if num_commits > 0 else '') + '\n    ' + json.dumps(commit_obj))
                f.flush()
                num_commits += 1

            f.write('\n  ]\n}')
            self.log('Done\n')

        os.rename(temp_path, target_path)
        self.stat_num_commits += num_commits

    def run(self):
        self.log('Getting list of repositories\n')
        repos = self.get_repos('prezi')
        repo_idx = 0

        for repo in repos:
            repo_idx += 1
            self.log('Repository {name} ({idx}/{count})\n'.format(
                name=repo['name'], idx=repo_idx, count=len(repos)
            ))
            self.download_statistics_for_repo(repo)

            self.stat_num_repos += 1


if __name__ == "__main__":
    GithubStatsScraper().run()
