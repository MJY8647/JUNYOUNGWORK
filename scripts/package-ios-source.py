#!/usr/bin/env python3
"""Create the Mac source download without build outputs or signing material."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
output = root / 'downloads/LUMI-iOS-source.zip'
files = sorted(p for p in (root / 'ios').rglob('*') if p.is_file()
               and not any(part in {'.build', '.swiftpm', 'xcuserdata', '.DS_Store'} for part in p.parts)
               and p.suffix not in {'.ipa', '.p12', '.mobileprovision'})
files += [root / name for name in ('FEATURES.md', 'scripts/test-ios-mac.sh',
          'scripts/check-ios-source.py', 'scripts/package-ios-source.py', '.github/workflows/ios-check.yml')]
output.parent.mkdir(exist_ok=True)
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    archive.writestr('LUMI-iOS/README.md', '# LUMI iOS\n\nMac 설치 방법은 ios/README.md를 확인하세요.\n\nXcode에서 ios/Lumi.xcodeproj를 여세요.\n')
    for file in files:
        archive.write(file, 'LUMI-iOS/' + file.relative_to(root).as_posix())
print(f'{output.name}: {len(files)} source files, {output.stat().st_size} bytes')
