screenSave = Null

Set WshShell = WScript.CreateObject("WScript.Shell")
For Each arg in WScript.Arguments
    screenSave = Trim(arg)
Next
   
WshShell.Run screenSave
