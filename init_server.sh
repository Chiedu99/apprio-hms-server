#!/bin/bash
### BEGIN INIT INFO
# Provides:          init_server.sh
# Required-Start:    $remote_fs $syslog
# Required-Stop:     $remote_fs $syslog
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Start daemon at boot time
# Description:       Enable service provided by daemon.
### END INIT INFO

cd /home/pi/apprio-hms-server
nodemon index >> server.log 2>&1