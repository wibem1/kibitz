#!/usr/bin/env python3
import argparse, json, tomllib
from pathlib import Path

root = Path(__file__).resolve().parents[1]
def read_toml(path):
    with (root / path).open("rb") as f: return tomllib.load(f)
def read_json(path):
    with (root / path).open(encoding="utf-8") as f: return json.load(f)

p = argparse.ArgumentParser()
p.add_argument("--tag")
a = p.parse_args()
versions = {
    "root Cargo.toml": read_toml("Cargo.toml")["workspace"]["package"]["version"],
    "app Cargo.toml": read_toml("app/src-tauri/Cargo.toml")["package"]["version"],
    "Tauri config": read_json("app/src-tauri/tauri.conf.json")["version"],
    "package.json": read_json("app/package.json")["version"],
    "package-lock.json": read_json("app/package-lock.json")["packages"][""]["version"],
}
if len(set(versions.values())) != 1:
    raise SystemExit("Kibitz versions differ: " + ", ".join(f"{k}={v}" for k, v in versions.items()))
version = next(iter(versions.values()))
if a.tag and a.tag != "v" + version:
    raise SystemExit(f"Release tag {a.tag} does not match shared version v{version}")
print(f"All Mac, Windows, and shared app manifests use {version}.")
if a.tag: print(f"Release tag {a.tag} matches.")
