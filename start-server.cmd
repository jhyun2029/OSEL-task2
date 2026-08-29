@echo off
rem OSEL-task2 운영 서버 시작 스크립트 (작업 스케줄러가 부팅 시 실행)
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "C:\Users\jhyun\Downloads\OSEL-task2"
call npm start >> "%TEMP%\osel-task2-server.log" 2>&1
