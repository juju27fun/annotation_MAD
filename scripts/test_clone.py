"""Verify a committed delivery from a clean clone; remove the test clone on exit."""
import argparse
import os
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]


def run(args, cwd, env=None):
    return subprocess.run(args, cwd=cwd, env=env, check=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--remote', help='Clone this Git URL instead of the local repository.')
    args = parser.parse_args()
    env = dict(os.environ, PYTHON_BIN=sys.executable, PYTHONDONTWRITEBYTECODE='1')
    with tempfile.TemporaryDirectory(prefix='annotation-mad-clone-') as temporary:
        clone = Path(temporary) / 'annotation_MAD'
        run(['git', 'clone', '--no-hardlinks', '--', args.remote or str(ROOT), str(clone)], ROOT)
        print('Verified commit:', subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=clone, text=True).strip(), flush=True)
        run([sys.executable, '-B', 'scripts/check_package.py'], clone, env)
        run(['pnpm', 'test'], clone, env)
        run([sys.executable, '-B', 'scripts/build.py'], clone, env)
        run(['git', 'diff', '--exit-code'], clone, env)
        run([sys.executable, '-B', 'scripts/check_package.py'], clone, env)
    print('PASS: clean clone, complete embedded data, annotation/export/resume logic and identical rebuild. Temporary clone removed.')
    print('Scope: simulated DOM; no claim of real-browser rendering validation.')


if __name__ == '__main__':
    main()
