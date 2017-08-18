# Apprio HMS
### Mecca Parker
### 2017 Summer Internship Project

## Introduction

The Apprio HMS server and daemon are two components of the three-part Apprio Hub Management System project. This document gives an overview of the project and what each component accomplishes as well as outlines the steps required to configure the server and daemon. These components are intended to be deployed on the Raspberry Pi 3 in conjuction with the Microsoft Surface Hub.

## Overview

### About the Project 

About the prjoect

### Daemon

The Apprio HMS daemon is a process that is configured with Cronjobs to run every five minutes on the Raspberry Pi. On a high level, it opens a serial port connection with the Hub, retrieves information about the Hub, runs a quick system check on the Raspberry Pi itself, and updates a PostgresQL database with the gathered data. The output of the process is written to the daemon.log file.

### Server 

The Apprio HMS server is a server that runs on the Raspberry Pi that handles all the routing from the Apprio HMS app. When the user on the Apprio HMS app taps buttons to perform commands that require the serial port of the Microsoft Hub, the requests are sent the server on the Raspberry Pi and the Raspberry Pi executes the necessary code to perform the requested function. The server always responds with the most up to date information on all Hubs in JSON format or an error message. If a state change of the Hub occurs, the Raspberry Pi updates the database with the new state information of the Microsoft Hub. 

## Configuration steps 

1. Download **apprio-hms-daemon** and **apprio-hms-server** directories into the 'pi' directory. 

1. Move to the **apprio-hms-server** directory and install the npm dependencies by executing `npm install`.
		
1. Setup a cronjob to run every five minutes by opening the crontab file editor `crontab -e` and changing the last line to:
		
```bash
* /5 * * * * cd apprio-hms-daemon daemon && python ./sp_daemon.py >> daemon.log 2>&1
``` 
This runs the sp_daemon.py script every five minutes and writes the output to the daemon.log file.

1. Next, set up the server to initialize at startup. Open an editor for the rc.local script with `sudo nano /etc/rc.local` and append the following to the end of the file: 
		
```bash
bash /home/pi/apprio-hms-server/init_server.sh &

exit 0
``` 
This runs the server initialization script upon startup of the Raspberry Pi device.

