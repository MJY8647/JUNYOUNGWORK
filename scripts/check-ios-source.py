#!/usr/bin/env python3
"""Linux-side syntax/project validation; does not replace Xcode build or device tests."""
import json
import pathlib
import sys
import xml.etree.ElementTree as ET

try:
    from tree_sitter import Language, Parser
    import tree_sitter_swift
    from openstep_parser import OpenStepDecoder
except ImportError:
    sys.exit("Install tree-sitter, tree-sitter-swift and openstep-parser in a separate tool environment first.")

root = pathlib.Path(__file__).resolve().parents[1] / "ios"
parser = Parser(Language(tree_sitter_swift.language()))
files = list(root.rglob("*.swift"))
for file in files:
    tree = parser.parse(file.read_bytes())
    problems = []

    def visit(node):
        if node.type == "ERROR" or node.is_missing:
            problems.append((node.type, node.start_point))
        for child in node.children:
            visit(child)

    visit(tree.root_node)
    assert not problems, f"{file}: {problems}"

project = OpenStepDecoder.ParseFromString((root / "Lumi.xcodeproj/project.pbxproj").read_text())
objects = project["objects"]
main = objects[project["rootObject"]]
assert main["isa"] == "PBXProject"
assert len(main["targets"]) == 2

def verify_references(value):
    if isinstance(value, dict):
        for item in value.values():
            verify_references(item)
    elif isinstance(value, list):
        for item in value:
            verify_references(item)
    elif isinstance(value, str) and len(value) == 24 and all(c in "0123456789ABCDEF" for c in value):
        assert value in objects, f"Unresolved Xcode object: {value}"

verify_references(project)
source_phases = [obj for obj in objects.values() if obj["isa"] == "PBXSourcesBuildPhase"]
assert sorted(len(obj["files"]) for obj in source_phases) == [1, 7]
for obj in objects.values():
    if obj["isa"] == "PBXFileReference" and obj.get("lastKnownFileType") == "sourcecode.swift":
        folder = "LumiTests" if obj["path"] == "PixelEngineTests.swift" else "Lumi"
        assert (root / folder / obj["path"]).is_file()
scheme = ET.parse(root / "Lumi.xcodeproj/xcshareddata/xcschemes/Lumi.xcscheme")
for ref in scheme.iter("BuildableReference"):
    assert ref.attrib["BlueprintIdentifier"] in main["targets"]
for file in (root / "Lumi/Assets.xcassets").rglob("Contents.json"):
    json.loads(file.read_text())
print(f"PASS: {len(files)} Swift files parse; Xcode references, scheme and asset catalog are valid.")
print("Apple SDK type checking, iOS simulator execution, signing and device installation remain separate checks.")
