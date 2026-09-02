@echo off
rem OSEL-task2 production server launcher (run by Task Scheduler at logon).
rem ASCII only: cmd.exe reads batch files as CP949, so non-ASCII breaks parsing.
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "C:\Users\jhyun\Downloads\OSEL-task2"
call npm start >> "%TEMP%\osel-task2-server.log" 2>&1
