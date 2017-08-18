# Apprio HMS server/daemon
## Configuration steps 
### Intended to be deployed on the Raspberry Pi 3 in conjuction with the Microsoft Surface Hub.

#### Summary

The Apprio HMS server and daemon are two components of the three-part Apprio Hub Management System project. This document describes the project and what each component accomplishes as well as outlines the steps required to configure the server and daemon.

#### Daemon

The Apprio HMS daemon is a process that is configured with Cronjobs to run every five minutes. On a high level, it opens a serial port connection with the Hub to retrieve some information about from Hub, runs a quick system check on the Raspberry Pi itself, and updates a PostgresQL database with the gathered data. The output of the process is written to the daemon.log file.

#### Server 

Th

#### Steps 

1. Download 'apprio-hms-daemon' and 'apprio-hms-server' directories into the 'pi' directory. 

1. Install server dependencies. Change to the 'apprio-hms-server' directory and execute:
		
'''bash
npm install
'''

1. Setup a cronjob to run daemon every 5 minutes: 
	1. Execute 'crontab -e'
	1. Change last line to:
		
'''bash
* /5 * * * * cd apprio-hms-daemon daemon && python ./sp_daemon.py >> daemon.log 2>&1
'''

1. Setup server to initialize at startup:
	1. Run 

	'sudo nano /etc/rc.local'
	1. Add the following to the end of the file: 
		
'''bash
bash /home/pi/apprio-hms-server/init_server.sh &

exit 0
'''
