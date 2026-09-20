"""Package the dependency-free local extension without npm or a marketplace upload."""
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parents[1]
source = root / "tools" / "vscode-extension"
manifest = json.loads((source / "package.json").read_text(encoding="utf-8"))
out = root / "dist" / f"learning-arena-{manifest['version']}.vsix"
out.parent.mkdir(exist_ok=True)
vsix_manifest = f'''<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011">
 <Metadata><Identity Language="en-US" Id="{manifest['name']}" Version="{manifest['version']}" Publisher="{manifest['publisher']}"/>
 <DisplayName>Learning Arena</DisplayName><Description xml:space="preserve">Local tools for independent practice with GPT web.</Description>
 <Tags>learning,python</Tags><Categories>Education</Categories><GalleryFlags>Public</GalleryFlags>
 <Properties><Property Id="Microsoft.VisualStudio.Code.Engine" Value="^1.90.0"/><Property Id="Microsoft.VisualStudio.Code.ExtensionDependencies" Value=""/><Property Id="Microsoft.VisualStudio.Code.ExtensionPack" Value=""/><Property Id="Microsoft.VisualStudio.Code.LocalizedLanguages" Value=""/><Property Id="Microsoft.VisualStudio.Code.EnabledApiProposals" Value=""/><Property Id="Microsoft.VisualStudio.Code.PreRelease" Value="false"/></Properties>
 </Metadata><Installation><InstallationTarget Id="Microsoft.VisualStudio.Code"/></Installation><Dependencies/>
 <Assets><Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true"/><Asset Type="Microsoft.VisualStudio.Services.Content.Details" Path="extension/README.md" Addressable="true"/></Assets>
</PackageManifest>'''
content_types = '''<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="json" ContentType="application/json"/><Default Extension="cjs" ContentType="application/javascript"/><Default Extension="md" ContentType="text/markdown"/><Default Extension="svg" ContentType="image/svg+xml"/><Default Extension="vsixmanifest" ContentType="text/xml"/></Types>'''
with ZipFile(out, "w", ZIP_DEFLATED) as z:
    z.writestr("extension.vsixmanifest", vsix_manifest)
    z.writestr("[Content_Types].xml", content_types)
    for file in source.rglob("*"):
        if file.is_file():
            z.write(file, "extension/" + file.relative_to(source).as_posix())
print(out)
