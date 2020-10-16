import time
import urllib3

http = urllib3.PoolManager()

while True:
    try:
        currHour = time.localtime().tm_hour
        if currHour <= 23 and currHour >= 6:
            r = http.request("GET", "https://techclubbot.herokuapp.com")
            print("Bot awake. Current time: %s. Request status: %d" %(time.asctime(), r.status))
            time.sleep(15*60)
        else:
            print("Bot sleeping. Current time: %s" %time.asctime())
            time.sleep(5*60)
    except:
        print("Error encountered at %s. Continuing with loop in 1 minute..." %time.asctime())
        time.sleep(60)
