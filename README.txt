Steps:

1) Download 'apprio-hms-daemon' and 'apprio-hms-server' directories into the 'pi' directory. 

2) Install server dependencies. Change to the 'apprio-hms-server' directory and execute:
		
		npm install

3) Setup a cronjob to run daemon every 5 minutes: 
	1. Execute 'crontab -e'
	2. Change last line to:
		
		* /5 * * * * cd apprio-hms-daemon daemon && python ./sp_daemon.py >> daemon.log 2>&1

4) Setup server to initialize at startup:
	1. Run 'sudo nano /etc/rc.local'
	2. Add the following to the end of the file: 
		
		bash /home/pi/apprio-hms-server/init_server.sh &

		exit 0