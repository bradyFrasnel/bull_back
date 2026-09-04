const XLSX = require('xlsx'); 
const wb = XLSX.readFile('ASUR 2014-2015.xls'); 
wb.SheetNames.forEach(n => { 
  const s = wb.Sheets[n]; 
  const rows = XLSX.utils.sheet_to_json(s, {header:1, defval: null}); 
  if(rows[13]) console.log(n, rows[13].slice(0,3)); 
});
