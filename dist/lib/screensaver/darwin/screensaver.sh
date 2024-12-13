#! parameter $1 is a screensaver file defined in the properties if you want to set a screensaver

pmset displaysleepnow
osascript -e "do shell script \"osascript -e \\\"tell application \\\\\\\"Terminal\\\\\\\" to quit\\\" &> /dev/null &\""; exit
