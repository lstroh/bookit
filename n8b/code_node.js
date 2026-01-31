// Loop over input items and add a new field called 'myNewField' to the JSON of each one

function formatBST(date) {
  const options = {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  };

  const formatter = new Intl.DateTimeFormat('en-GB', options);
  const parts = formatter.formatToParts(date);

  const lookup = Object.fromEntries(parts.map(p => [p.type, p.value]));

  // Format: YYYY-MM-DDTHH:mm:ss
  const isoLike = `${lookup.year}-${lookup.month}-${lookup.day}T${lookup.hour}:${lookup.minute}:${lookup.second}`;

  // Get offset in minutes and convert to ±HH:mm
  const offsetMinutes = -date.getTimezoneOffset(); // negative because JS returns offset from UTC
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const pad = n => String(Math.floor(Math.abs(n))).padStart(2, '0');
  const offset = `${sign}${pad(offsetMinutes / 60)}:${pad(offsetMinutes % 60)}`;

  return `${isoLike}${offset}`;
}


function formatInTimeZone(date, timeZone) {
  // Format local time in target zone
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map(p => [p.type, p.value]));

  const isoLike = `${lookup.year}-${lookup.month}-${lookup.day}T${lookup.hour}:${lookup.minute}:${lookup.second}`;

  // Create a date string in the target time zone
  const localString = `${lookup.year}-${lookup.month}-${lookup.day} ${lookup.hour}:${lookup.minute}:${lookup.second}`;
  const localDate = new Date(localString + ' GMT'); // interpreted as local time

  // Get offset between UTC and target zone
  const utcDate = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  ));

  const offsetMinutes = (localDate - utcDate) / 60000;
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const pad = n => String(Math.floor(Math.abs(n))).padStart(2, '0');
  const offset = `${sign}${pad(offsetMinutes / 60)}:${pad(offsetMinutes % 60)}`;

  return `${isoLike}${offset}`;
}


//console.log(formatBST(date)); // → "2025-09-10T07:00:00+01:00"



function createEvent(summary, description, location, start, end){
  return {
    "description": description,
    "end":end,
    "location":location,
    "start":start,
    "summary":summary
  };
  
}
function splitEvent(event){
  let res = [];
  let msPerDay = 1000 * 60 * 60 * 24;
  let startDate = new Date(event.start.dateTime);
  let currDate = new Date(event.start.dateTime);
  let endDate = new Date(event.end.dateTime);
  let diffInDays = currDate.getDate() == endDate.getDate();
  if(!diffInDays) {
    while (!diffInDays) {
      let plusOneDay = new Date(currDate);
      plusOneDay.setDate(currDate.getDate() + 1);
      
      res.push(createEvent(event.summary, event.description, event.location, currDate, plusOneDay));
      currDate = plusOneDay;
      diffInDays = currDate.getDate() == endDate.getDate();
    }
    res.push(createEvent(event.summary, event.description, event.location, currDate, endDate));
  } else {
    let plusOneDay = new Date(currDate);
    plusOneDay.setDate(currDate.getDate() + 1);
    res.push(createEvent(event.summary, event.description, event.location, startDate, endDate));
  }
  console.log("splitted on event to-" + res.length)
  return res;
}

function filterOldEvents(list) {
  let res = []
  const now = new Date();
  for (const event of list) {
    console.log("now-" + now);
    let startDate = new Date(event.start);
    console.log("startDate-" + startDate);
    if (startDate > now) {
      res.push(event);
    }
  }
  return res;
}

function applyTimeZone(list,timezone){
  let res = []
  for (let event of list) {
    event.start = formatInTimeZone(event.start,timezone);
    event.end = formatInTimeZone(event.end,timezone);
  }
  return list;
}
//summary, description, location, start, end
function compareEvents(event1, event2){
  if (event1.summary == event2.summary) {
    if (event1.description == event2.description) {
      if (event1.location == event2.location) {
        if (event1.start == event2.start) {
          if (event1.end == event2.end) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      } else {
        return false;
      }
    } else {
      return false;
    }
  } else {
    return false;
  }
}

function removeDuplication(list){
  let arr = [];
  for (let index = 0; index < list.length; index++) {
    const element = list[index];
    let found = false;
    for (let index1 = 0; index1 < arr.length; index1++) {
      if (compareEvents(list[index],arr[index1])) {
        found = true;
        break;
      }
    }
    if (!found) {
      arr.push(element);
    }
  }
  return arr;
}


let res = [];
let count = 0;
for (const item of $input.all()) {
  count = count + 1;
  let splittedEvents = splitEvent(item.json);
  for (const element of splittedEvents) {
   res.push(element); 
  }
}
res = filterOldEvents(res);
//res = removeDuplication(res);
//applyTimeZone(res, 'Europe/London');


return {'msg':res};