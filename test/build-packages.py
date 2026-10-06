"""Build minimal EXPath library packages (.xar) for every version in packages.json."""
import json
import re
import sys
import zipfile
from pathlib import Path

here = Path(__file__).parent
out = Path(sys.argv[1]) if len(sys.argv) > 1 else here / "packages"
out.mkdir(parents=True, exist_ok=True)

for name, versions in json.loads((here / "packages.json").read_text()).items():
    abbrev = re.sub(r"[^A-Za-z0-9-]", "-", name.rstrip("/").rsplit("/", 1)[-1])
    for version in versions:
        expath_pkg = f"""<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://expath.org/ns/pkg" name="{name}" abbrev="{abbrev}" version="{version}" spec="1.0">
    <title>{abbrev} (test fixture)</title>
    <dependency processor="http://exist-db.org" semver-min="5.0.0"/>
</package>
"""
        repo = f"""<?xml version="1.0" encoding="UTF-8"?>
<meta xmlns="http://exist-db.org/xquery/repo">
    <description>{abbrev} test fixture</description>
    <type>library</type>
    <target>{abbrev}</target>
    <status>stable</status>
</meta>
"""
        with zipfile.ZipFile(out / f"{abbrev}-{version}.xar", "w", zipfile.ZIP_DEFLATED) as xar:
            xar.writestr("expath-pkg.xml", expath_pkg)
            xar.writestr("repo.xml", repo)
        print(out / f"{abbrev}-{version}.xar")
