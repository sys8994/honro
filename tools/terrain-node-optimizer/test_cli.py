"""Smoke tests for both documented command-line interfaces."""
import pathlib
import subprocess
import sys
import unittest

class HelpTests(unittest.TestCase):
    def test_package_help(self):
        self.check_help('optimize_package.py')

    def test_svg_help(self):
        self.check_help('optimize_svg.py')

    def check_help(self, name):
        result = subprocess.run([sys.executable, str(pathlib.Path(__file__).with_name(name)), '--help'], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('--epsilon', result.stdout)
