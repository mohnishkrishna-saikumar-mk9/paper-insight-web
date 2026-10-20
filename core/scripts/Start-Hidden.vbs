Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
coreDir = fso.GetParentFolderName(scriptDir)
rootDir = fso.GetParentFolderName(coreDir)

needsInstall = False

If Not fso.FolderExists(coreDir & "\node_modules\next") Then
    needsInstall = True
End If
If Not fso.FileExists(coreDir & "\backend\venv\Scripts\python.exe") Then
    needsInstall = True
End If

If needsInstall Then
    WshShell.Run """" & rootDir & "\PaperInsight.bat""", 1, False
    WScript.Quit
End If

' Kill any existing instances to prevent Port 8000 conflicts
WshShell.Run "cmd.exe /c taskkill /F /IM node.exe /T 2>NUL", 0, True
WshShell.Run "cmd.exe /c taskkill /F /IM python.exe /T 2>NUL", 0, True

WshShell.Run "cmd.exe /c cd /d """ & coreDir & "\backend"" && .\venv\Scripts\python.exe main.py", 0, False
WshShell.Run "cmd.exe /c cd /d """ & coreDir & """ && npm run dev", 0, False

Wscript.Sleep 12000

WshShell.Run "http://localhost:3000"
