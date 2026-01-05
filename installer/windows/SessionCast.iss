; SessionCast Windows Installer
; Inno Setup Script
; https://jrsoftware.org/isinfo.php

#define MyAppName "SessionCast"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "SessionCast"
#define MyAppURL "https://sessioncast.io"
#define MyAppExeName "sessioncast-agent.cmd"

[Setup]
; Basic info
AppId={{B8F2A9C4-1234-5678-ABCD-SESSIONCAST01}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}

; Installation settings
DefaultDirName=C:\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
LicenseFile=LICENSE.txt
InfoBeforeFile=README.txt
OutputDir=output
OutputBaseFilename=SessionCast-Setup-{#MyAppVersion}
SetupIconFile=icon.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin

; Appearance (wizard images are optional - uncomment if you have custom images)
; WizardImageFile=wizard-large.bmp
; WizardSmallImageFile=wizard-small.bmp

; Architecture
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

; Uninstall info
UninstallDisplayIcon={app}\icon.ico
UninstallDisplayName={#MyAppName}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "korean"; MessagesFile: "compiler:Languages\Korean.isl"

[Types]
Name: "full"; Description: "Full installation (Java + Node Agent)"
Name: "java"; Description: "Java Agent only"
Name: "node"; Description: "Node Agent only"
Name: "custom"; Description: "Custom installation"; Flags: iscustom

[Components]
Name: "core"; Description: "Core components (itmux)"; Types: full java node custom; Flags: fixed
Name: "java"; Description: "Java Agent + JRE 17"; Types: full java
Name: "node"; Description: "Node Agent + Node.js 20"; Types: full node

[Tasks]
Name: "envpath"; Description: "Add to PATH environment variable"; GroupDescription: "Additional options:"
Name: "desktopicon"; Description: "Create desktop shortcut"; GroupDescription: "Additional options:"
Name: "autostart"; Description: "Start agent on Windows startup"; GroupDescription: "Additional options:"

[Files]
; Core - itmux
Source: "packages\itmux\*"; DestDir: "{app}\itmux"; Components: core; Flags: ignoreversion recursesubdirs createallsubdirs

; Java Agent
Source: "packages\java\*"; DestDir: "{app}\java"; Components: java; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "packages\sessioncast-agent.jar"; DestDir: "{app}\bin"; Components: java; Flags: ignoreversion skipifsourcedoesntexist

; Node Agent
Source: "packages\node\*"; DestDir: "{app}\node"; Components: node; Flags: ignoreversion recursesubdirs createallsubdirs

; Scripts and config
Source: "scripts\sessioncast-agent.cmd"; DestDir: "{app}\bin"; Components: java; Flags: ignoreversion
Source: "scripts\sessioncast-node.cmd"; DestDir: "{app}\bin"; Components: node; Flags: ignoreversion
Source: "config\agent-config.yml"; DestDir: "{app}\config"; Flags: ignoreversion onlyifdoesntexist

; Icon
Source: "icon.ico"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist

[Dirs]
Name: "{app}\logs"; Permissions: users-modify
Name: "{app}\config"; Permissions: users-modify

[Icons]
; Start menu shortcuts
Name: "{group}\SessionCast Agent (Java)"; Filename: "{app}\bin\sessioncast-agent.cmd"; Components: java; IconFilename: "{app}\icon.ico"
Name: "{group}\SessionCast Agent (Node)"; Filename: "{app}\bin\sessioncast-node.cmd"; Components: node; IconFilename: "{app}\icon.ico"
Name: "{group}\Configuration"; Filename: "{app}\config"; IconFilename: "{sys}\shell32.dll"; IconIndex: 21
Name: "{group}\Logs"; Filename: "{app}\logs"; IconFilename: "{sys}\shell32.dll"; IconIndex: 20
Name: "{group}\Uninstall SessionCast"; Filename: "{uninstallexe}"; IconFilename: "{app}\icon.ico"

; Desktop shortcut
Name: "{autodesktop}\SessionCast Agent"; Filename: "{app}\bin\sessioncast-agent.cmd"; Tasks: desktopicon; Components: java; IconFilename: "{app}\icon.ico"

[Registry]
; Environment variables
Root: HKCU; Subkey: "Environment"; ValueType: string; ValueName: "SESSIONCAST_HOME"; ValueData: "{app}"; Flags: uninsdeletevalue
Root: HKCU; Subkey: "Environment"; ValueType: string; ValueName: "ITMUX_HOME"; ValueData: "{app}\itmux"; Flags: uninsdeletevalue

; Add to PATH
Root: HKCU; Subkey: "Environment"; ValueType: expandsz; ValueName: "Path"; ValueData: "{olddata};{app}\bin"; Tasks: envpath; Check: NeedsAddPath(ExpandConstant('{app}\bin'))

; Autostart
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "SessionCast"; ValueData: """{app}\bin\sessioncast-agent.cmd"""; Tasks: autostart; Components: java; Flags: uninsdeletevalue

[Run]
; Post-install actions
Filename: "{app}\config"; Description: "Open configuration folder"; Flags: postinstall shellexec skipifsilent
Filename: "notepad.exe"; Parameters: "{app}\config\agent-config.yml"; Description: "Edit configuration file"; Flags: postinstall skipifsilent unchecked

[UninstallDelete]
Type: filesandordirs; Name: "{app}\logs"
Type: filesandordirs; Name: "{app}\temp"

[Code]
// Check if path needs to be added
function NeedsAddPath(Param: string): boolean;
var
  OrigPath: string;
begin
  if not RegQueryStringValue(HKEY_CURRENT_USER, 'Environment', 'Path', OrigPath) then
  begin
    Result := True;
    exit;
  end;
  Result := Pos(';' + Param + ';', ';' + OrigPath + ';') = 0;
end;

// Custom initialization
procedure InitializeWizard;
begin
  // Add custom wizard pages if needed
end;

// Verify dependencies after install
procedure CurStepChanged(CurStep: TSetupStep);
var
  ResultCode: Integer;
begin
  if CurStep = ssPostInstall then
  begin
    // Verify itmux installation
    if not FileExists(ExpandConstant('{app}\itmux\bin\bash.exe')) then
    begin
      MsgBox('Warning: itmux installation may be incomplete. Please verify manually.', mbInformation, MB_OK);
    end;

    // Broadcast environment change
    RegWriteStringValue(HKEY_CURRENT_USER, 'Environment', 'SESSIONCAST_HOME', ExpandConstant('{app}'));
  end;
end;

// Custom uninstall
procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usPostUninstall then
  begin
    // Remove environment variables
    RegDeleteValue(HKEY_CURRENT_USER, 'Environment', 'SESSIONCAST_HOME');
    RegDeleteValue(HKEY_CURRENT_USER, 'Environment', 'ITMUX_HOME');
  end;
end;

// Check Windows version
function InitializeSetup(): Boolean;
var
  Version: TWindowsVersion;
begin
  GetWindowsVersionEx(Version);

  // Require Windows 10 1809 or later (build 17763)
  if (Version.Major < 10) or ((Version.Major = 10) and (Version.Build < 17763)) then
  begin
    MsgBox('SessionCast requires Windows 10 version 1809 or later.', mbError, MB_OK);
    Result := False;
    exit;
  end;

  Result := True;
end;
