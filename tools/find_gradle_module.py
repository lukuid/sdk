#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Utility to locate a Gradle module path by name in settings.gradle(.kts)."""
from __future__ import annotations

import argparse
import pathlib
import re
import sys


def parse_args() -> argparse.Namespace:
  parser = argparse.ArgumentParser(description=__doc__)
  parser.add_argument("settings_file", type=pathlib.Path)
  parser.add_argument("module_name", help="Leaf module name to search for (e.g., lukuid-sdk)")
  return parser.parse_args()


def main() -> int:
  args = parse_args()
  settings_file: pathlib.Path = args.settings_file
  if not settings_file.is_file():
    print(f"Settings file {settings_file} does not exist", file=sys.stderr)
    return 1

  contents = settings_file.read_text()
  pattern = re.compile(r"include\s*\(\s*[\"']([^\"']+)[\"']\s*\)")
  for match in pattern.findall(contents):
    segments = [segment for segment in match.split(":") if segment]
    if segments and segments[-1] == args.module_name:
      print(match)
      return 0

  print(f"Module {args.module_name} not found in {settings_file}", file=sys.stderr)
  return 1


if __name__ == "__main__":
  raise SystemExit(main())
