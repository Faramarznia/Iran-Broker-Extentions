/* ============================================================
   IranBroker NewTab — Hub Mode  (ib_hub_v2)
   ┌ right box : daily tasks
   ├ left box  : calendar (Shamsi+Gregorian, occasions + Forex
   │             Factory economic events) → weather beneath
   └ below     : customizable quick-access grid
   No external libraries · localStorage only · MV3 safe
   ============================================================ */
(function () {
  'use strict';

  var PERSIST_KEY = 'ib_hub_v2';

  /* ─────────── labels ─────────── */
  var JM = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور',
            'مهر','آبان','آذر','دی','بهمن','اسفند'];
  var GM_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var WD_FULL = ['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'];

  /* ─────────── Shamsi occasions  "jMonth-jDay" ─────────── */
  var OCC = {
    '1-1':{n:'جشن نوروز',h:1}, '1-2':{n:'عید نوروز',h:1}, '1-3':{n:'عید نوروز',h:1},
    '1-4':{n:'عید نوروز',h:1}, '1-12':{n:'روز جمهوری اسلامی',h:1}, '1-13':{n:'سیزده‌به‌در',h:1},
    '1-29':{n:'روز ارتش'}, '2-11':{n:'روز کارگر'}, '2-12':{n:'روز معلم'},
    '3-14':{n:'رحلت امام خمینی',h:1}, '3-15':{n:'قیام ۱۵ خرداد',h:1},
    '5-14':{n:'آزادسازی خرمشهر'}, '6-31':{n:'آغاز سال تحصیلی'},
    '7-8':{n:'روز بزرگداشت مولوی'}, '7-13':{n:'روز نیروی انتظامی'}, '7-20':{n:'روز حافظ'},
    '8-13':{n:'روز دانش‌آموز',h:1}, '9-1':{n:'روز کوروش بزرگ'}, '9-16':{n:'روز دانشجو'},
    '9-30':{n:'شب یلدا'}, '10-9':{n:'روز پژوهش'}, '11-19':{n:'روز نیروی هوایی'},
    '11-22':{n:'پیروزی انقلاب اسلامی',h:1}, '12-5':{n:'روز مهندس'},
    '12-29':{n:'ملی شدن صنعت نفت',h:1}, '12-30':{n:'آخرین روز سال'}
  };

  /* ─────────── task categories ─────────── */
  var CATS = [
    {id:'work',    e:'💼', l:'کاری',     c:'#6f9bf3'},
    {id:'trade',   e:'📊', l:'معاملاتی', c:'#f6a723'},
    {id:'learn',   e:'📚', l:'مطالعه',   c:'#2eb86e'},
    {id:'personal',e:'🌱', l:'شخصی',     c:'#a78bfa'},
    {id:'urgent',  e:'🔥', l:'فوری',     c:'#fb3748'}
  ];

  var QA_COLORS = ['#185adb','#e23636','#e27b36','#2eb86e',
                   '#9b36e2','#36b8e2','#e2a836','#fb3748'];

  /* impact → color */
  var IMP = {
    High:   {c:'#fb3748', l:'بالا'},
    Medium: {c:'#f6a723', l:'متوسط'},
    Low:    {c:'#9aa3b2', l:'پایین'},
    Holiday:{c:'#35d0c0', l:'تعطیلی'}
  };

  /* ─────────── state ─────────── */
  var DB = {
    tasks: {},                 // { 'YYYY-MM-DD': [ {id,text,cat,done} ] }
    quick: [],                 // user shortcuts
    weatherCity: null          // {name, lat, lon}
  };
  var calView = { jy:0, jm:0 };
  var activeCat = 'work';
  var ECON = {};               // { 'YYYY-MM-DD': [events] }  this week only
  var econLoaded = false;
  var qaEditColor = QA_COLORS[0];

  /* ═══════════════════════════════════════
     Jalaali ↔ Gregorian  (jalaali-js algorithm, MIT — proven correct)
  ═══════════════════════════════════════ */
  function _div(a,b){ return ~~(a/b); }
  function _mod(a,b){ return a-~~(a/b)*b; }
  function _jalCal(jy){
    var breaks=[-61,9,38,199,426,686,756,818,1111,1181,1210,1635,2060,2097,2192,2262,2324,2394,2456,3178];
    var bl=breaks.length,gy=jy+621,leapJ=-14,jp=breaks[0],jm,jump,leap,leapG,march,n,i;
    jump=0;
    for(i=1;i<bl;i+=1){
      jm=breaks[i]; jump=jm-jp;
      if(jy<jm) break;
      leapJ=leapJ+_div(jump,33)*8+_div(_mod(jump,33),4); jp=jm;
    }
    n=jy-jp;
    leapJ=leapJ+_div(n,33)*8+_div(_mod(n,33)+3,4);
    if(_mod(jump,33)===4&&jump-n===4) leapJ+=1;
    leapG=_div(gy,4)-_div((_div(gy,100)+1)*3,4)-150;
    march=20+leapJ-leapG;
    if(jump-n<6) n=n-jump+_div(jump+4,33)*33;
    leap=_mod(_mod(n+1,33)-1,4);
    if(leap===-1) leap=4;
    return {leap:leap,gy:gy,march:march};
  }
  function _g2d(gy,gm,gd){
    var d=_div((gy+_div(gm-8,6)+100100)*1461,4)+_div(153*_mod(gm+9,12)+2,5)+gd-34840408;
    d=d-_div(_div(gy+100100+_div(gm-8,6),100)*3,4)+752;
    return d;
  }
  function _d2g(jdn){
    var j,i,gd,gm,gy;
    j=4*jdn+139361631;
    j=j+_div(_div(4*jdn+183187720,146097)*3,4)*4-3908;
    i=_div(_mod(j,1461),4)*5+308;
    gd=_div(_mod(i,153),5)+1;
    gm=_mod(_div(i,153),12)+1;
    gy=_div(j,1461)-100100+_div(8-gm,6);
    return [gy,gm,gd];
  }
  function _j2d(jy,jm,jd){
    var r=_jalCal(jy);
    return _g2d(r.gy,3,r.march)+(jm-1)*31-_div(jm,7)*(jm-7)+jd-1;
  }
  /* public: arrays to match call sites */
  function g2j(gy,gm,gd){
    var jdn=_g2d(gy,gm,gd);
    var gyy=_d2g(jdn)[0],jy=gyy-621,r=_jalCal(jy),jdn1f=_g2d(r.gy,3,r.march),jd,jm,k;
    k=jdn-jdn1f;
    if(k>=0){
      if(k<=185){ jm=1+_div(k,31); jd=_mod(k,31)+1; return [jy,jm,jd]; }
      else { k-=186; }
    } else { jy-=1; k+=179; if(r.leap===1) k+=1; }
    jm=7+_div(k,30); jd=_mod(k,30)+1;
    return [jy,jm,jd];
  }
  function j2g(jy,jm,jd){ return _d2g(_j2d(jy,jm,jd)); }
  function jDaysInMonth(jy,jm){
    if(jm<=6) return 31;
    if(jm<=11) return 30;
    return _jalCal(jy).leap===0?30:29;   /* jalaali-js: leap year ⟺ leap===0 */
  }
  function jDow(jy,jm,jd){ var g=j2g(jy,jm,jd); return (new Date(g[0],g[1]-1,g[2]).getDay()+1)%7; }

  /* ─────────── utils ─────────── */
  function fa(n){ return String(n).replace(/\d/g,function(d){return '۰۱۲۳۴۵۶۷۸۹'[d];}); }
  function p2(n){ return n<10?'0'+n:''+n; }
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function escA(s){ return String(s).replace(/"/g,'&quot;'); }
  function $(id){ return document.getElementById(id); }
  function el(tag,cls,html){ var e=document.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e; }
  function catById(id){ for(var i=0;i<CATS.length;i++) if(CATS[i].id===id) return CATS[i]; return CATS[0]; }
  function gKey(g){ return g[0]+'-'+p2(g[1])+'-'+p2(g[2]); }      // gregorian array → key
  function todayKey(){ var n=new Date(); return n.getFullYear()+'-'+p2(n.getMonth()+1)+'-'+p2(n.getDate()); }

  /* ═══════════════════════════════════════
     BUILD — Calendar + Weather (left box)
  ═══════════════════════════════════════ */
  function buildCalBox(){
    var box=$('hub-cal-box');
    if(!box) return;
    box.innerHTML =
      /* weather on top */
      '<div class="hub-card hweather" id="hub-weather"></div>' +
      /* calendar below */
      '<div class="hub-card hcal">' +
        '<div class="hcal-head">' +
          '<button id="hub-cal-prev" class="hcal-nav" aria-label="ماه قبل">' +
            '<svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '</button>' +
          '<button id="hub-cal-title" class="hcal-title" title="برو به امروز"></button>' +
          '<button id="hub-cal-next" class="hcal-nav" aria-label="ماه بعد">' +
            '<svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="hcal-weekdays">' +
          '<span>ش</span><span>ی</span><span>د</span><span>س</span><span>چ</span><span>پ</span><span class="hcal-wd-fri">ج</span>' +
        '</div>' +
        '<div id="hub-cal-days" class="hcal-days"></div>' +
        '<div class="hcal-legend">' +
          '<span class="hcl-item"><i class="hcl-dot" style="background:#fb3748"></i>تعطیل/مهم</span>' +
          '<span class="hcl-item"><i class="hcl-dot" style="background:#f6a723"></i>مناسبت</span>' +
          '<span class="hcl-item"><i class="hcl-bar"></i>رویداد اقتصادی</span>' +
        '</div>' +
      '</div>';

    $('hub-cal-prev').addEventListener('click', prevMonth);
    $('hub-cal-next').addEventListener('click', nextMonth);
    $('hub-cal-title').addEventListener('click', goToday);
  }

  /* ═══════════════════════════════════════
     CALENDAR render
  ═══════════════════════════════════════ */
  function renderCalendar(){
    var now=new Date();
    var todJ=g2j(now.getFullYear(),now.getMonth()+1,now.getDate());

    var titleEl=$('hub-cal-title');
    if(titleEl){
      var g1=j2g(calView.jy,calView.jm,1);
      var gL=j2g(calView.jy,calView.jm,jDaysInMonth(calView.jy,calView.jm));
      var gStr=g1[1]===gL[1]?(GM_EN[g1[1]-1]+' '+g1[0])
                            :(GM_EN[g1[1]-1]+' – '+GM_EN[gL[1]-1]+' '+gL[0]);
      titleEl.innerHTML='<span class="hcal-jmon">'+JM[calView.jm-1]+' '+fa(calView.jy)+'</span>'+
                        '<span class="hcal-gmon">'+gStr+'</span>';
    }

    var daysEl=$('hub-cal-days');
    if(!daysEl) return;
    var firstDow=jDow(calView.jy,calView.jm,1);
    var total=jDaysInMonth(calView.jy,calView.jm);
    var html='';
    for(var e=0;e<firstDow;e++) html+='<div class="hcal-cell hcal-empty"></div>';

    for(var d=1;d<=total;d++){
      var dow=(firstDow+d-1)%7;
      var g=j2g(calView.jy,calView.jm,d);
      var key=gKey(g);
      var isToday=calView.jy===todJ[0]&&calView.jm===todJ[1]&&d===todJ[2];
      var isFri=dow===6;
      var occ=OCC[calView.jm+'-'+d];
      var ev=ECON[key];
      var topImp=ev?highestImpact(ev):null;

      var cls='hcal-cell'+
        (isToday?' hcal-today':'')+
        (isFri?' hcal-fri':'')+
        (occ&&occ.h?' hcal-hol':'');

      var dots='';
      if(occ) dots+='<i class="hcal-dot" style="background:'+(occ.h?'#fb3748':'#f6a723')+'"></i>';

      var bar = topImp ? '<i class="hcal-evbar" style="background:'+IMP[topImp].c+'"></i>' : '';

      html+='<button class="'+cls+'" data-key="'+key+'" data-d="'+d+'">'+
              bar+
              '<span class="hcal-jd">'+fa(d)+'</span>'+
              '<span class="hcal-gd">'+g[2]+'</span>'+
              (dots?'<span class="hcal-dots">'+dots+'</span>':'')+
            '</button>';
    }
    daysEl.innerHTML=html;

    Array.prototype.forEach.call(daysEl.querySelectorAll('.hcal-cell[data-key]'),function(cell){
      cell.addEventListener('click',function(){ openDayModal(cell.getAttribute('data-key'), parseInt(cell.getAttribute('data-d'))); });
    });
  }

  function highestImpact(events){
    var order=['High','Medium','Low','Holiday'];
    for(var i=0;i<order.length;i++) for(var j=0;j<events.length;j++) if(events[j].impact===order[i]) return order[i];
    return null;
  }

  function prevMonth(){ if(--calView.jm<1){calView.jm=12;calView.jy--;} renderCalendar(); }
  function nextMonth(){ if(++calView.jm>12){calView.jm=1;calView.jy++;} renderCalendar(); }
  function goToday(){ var n=new Date(),j=g2j(n.getFullYear(),n.getMonth()+1,n.getDate()); calView.jy=j[0];calView.jm=j[1]; renderCalendar(); }

  /* ─────────── day detail modal ─────────── */
  function openDayModal(key, jd){
    var modal=$('hub-day-modal'); if(!modal) return;
    var parts=key.split('-');
    var g=[+parts[0],+parts[1],+parts[2]];
    var dow=new Date(g[0],g[1]-1,g[2]).getDay();
    var occ=OCC[calView.jm+'-'+jd];
    var ev=ECON[key]||[];

    $('hub-day-title').innerHTML =
      '<span class="hdm-jd">'+fa(jd)+' '+JM[calView.jm-1]+'</span>'+
      '<span class="hdm-gd">'+WD_FULL[dow]+' · '+g[2]+' '+GM_EN[g[1]-1]+' '+g[0]+'</span>';

    var body='';
    if(occ){
      body+='<div class="hdm-occ '+(occ.h?'hdm-occ-hol':'')+'">'+
              '<span class="hdm-occ-ic">'+(occ.h?'🎌':'✦')+'</span>'+
              '<span>'+esc(occ.n)+(occ.h?' — تعطیل رسمی':'')+'</span>'+
            '</div>';
    }

    if(ev.length){
      body+='<div class="hdm-econ-label">تقویم اقتصادی <span>(فارکس فکتوری)</span></div>';
      body+='<div class="hdm-econ-list">';
      ev.slice().sort(function(a,b){return (a._t||0)-(b._t||0);}).forEach(function(it){
        var im=IMP[it.impact]||IMP.Low;
        body+='<div class="hdm-ev">'+
                '<span class="hdm-ev-imp" style="background:'+im.c+'" title="'+im.l+'"></span>'+
                '<span class="hdm-ev-time">'+(it._time||'--:--')+'</span>'+
                '<span class="hdm-ev-cur">'+esc(it.country||'')+'</span>'+
                '<span class="hdm-ev-title">'+esc(it.title||'')+'</span>'+
                (it.forecast||it.previous
                  ? '<span class="hdm-ev-fp">'+
                      (it.forecast?'<b>پیش‌بینی:</b> '+esc(it.forecast)+'  ':'')+
                      (it.previous?'<b>قبلی:</b> '+esc(it.previous):'')+
                    '</span>'
                  : '')+
              '</div>';
      });
      body+='</div>';
    } else if(!econLoaded){
      body+='<div class="hdm-empty">در حال بارگذاری تقویم اقتصادی…</div>';
    }

    if(!occ && !ev.length && econLoaded){
      body+='<div class="hdm-empty">رویداد مهمی برای این روز ثبت نشده است.</div>';
    }

    $('hub-day-body').innerHTML=body;
    modal.removeAttribute('hidden');
  }

  /* ═══════════════════════════════════════
     ECONOMIC CALENDAR (Forex Factory weekly feed)
  ═══════════════════════════════════════ */
  function loadEcon(){
    fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json')
      .then(function(r){ return r.ok?r.json():null; })
      .then(function(data){
        econLoaded=true;
        if(!Array.isArray(data)) return;
        ECON={};
        data.forEach(function(it){
          if(!it.date) return;
          var dt=new Date(it.date);
          if(isNaN(dt)) return;
          var key=dt.getFullYear()+'-'+p2(dt.getMonth()+1)+'-'+p2(dt.getDate());
          it._t=dt.getTime();
          it._time=p2(dt.getHours())+':'+p2(dt.getMinutes());
          (ECON[key]=ECON[key]||[]).push(it);
        });
        renderCalendar();
      })
      .catch(function(){ econLoaded=true; });
  }

  /* ═══════════════════════════════════════
     WEATHER (Open-Meteo)
  ═══════════════════════════════════════ */
  var WCODE = {
    0:{l:'صاف',i:'sun'},1:{l:'کمی ابری',i:'sun-cloud'},2:{l:'نیمه‌ابری',i:'sun-cloud'},
    3:{l:'ابری',i:'cloud'},45:{l:'مه',i:'fog'},48:{l:'مه یخی',i:'fog'},
    51:{l:'نم‌نم باران',i:'drizzle'},53:{l:'نم‌نم باران',i:'drizzle'},55:{l:'نم‌نم باران',i:'drizzle'},
    61:{l:'باران سبک',i:'rain'},63:{l:'باران',i:'rain'},65:{l:'باران شدید',i:'rain'},
    66:{l:'باران یخی',i:'rain'},67:{l:'باران یخی',i:'rain'},
    71:{l:'برف سبک',i:'snow'},73:{l:'برف',i:'snow'},75:{l:'برف سنگین',i:'snow'},77:{l:'دانه برف',i:'snow'},
    80:{l:'رگبار',i:'rain'},81:{l:'رگبار',i:'rain'},82:{l:'رگبار شدید',i:'rain'},
    85:{l:'بارش برف',i:'snow'},86:{l:'بارش برف',i:'snow'},
    95:{l:'رعدوبرق',i:'storm'},96:{l:'رعدوبرق و تگرگ',i:'storm'},99:{l:'رعدوبرق و تگرگ',i:'storm'}
  };

  function wIcon(name,isDay){
    var c='currentColor';
    switch(name){
      case 'sun': return isDay
        ? '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill="#ffd25a"/><g stroke="#ffd25a" stroke-width="2" stroke-linecap="round"><line x1="12" y1="1.5" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22.5"/><line x1="1.5" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22.5" y2="12"/><line x1="4.4" y1="4.4" x2="6.2" y2="6.2"/><line x1="17.8" y1="17.8" x2="19.6" y2="19.6"/><line x1="19.6" y1="4.4" x2="17.8" y2="6.2"/><line x1="6.2" y1="17.8" x2="4.4" y2="19.6"/></g></svg>'
        : '<svg viewBox="0 0 24 24" fill="none"><path d="M21 12.8A8 8 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z" fill="#cdd6ff"/></svg>';
      case 'sun-cloud': return '<svg viewBox="0 0 24 24" fill="none"><circle cx="8" cy="8" r="3.4" fill="#ffd25a"/><path d="M7 18h10a3.5 3.5 0 0 0 .2-7 5 5 0 0 0-9.6 1.4A3.3 3.3 0 0 0 7 18z" fill="#c3ccdd"/></svg>';
      case 'cloud': return '<svg viewBox="0 0 24 24" fill="none"><path d="M7 18h10a3.8 3.8 0 0 0 .2-7.6 5.4 5.4 0 0 0-10.4 1.5A3.6 3.6 0 0 0 7 18z" fill="#aab4c6"/></svg>';
      case 'fog': return '<svg viewBox="0 0 24 24" fill="none"><path d="M6 13h11a3.6 3.6 0 0 0 .2-7.2A5.2 5.2 0 0 0 7 7.2 3.4 3.4 0 0 0 6 13z" fill="#aab4c6"/><g stroke="#aab4c6" stroke-width="1.8" stroke-linecap="round"><line x1="4" y1="17" x2="20" y2="17"/><line x1="6" y1="20.5" x2="18" y2="20.5"/></g></svg>';
      case 'drizzle':
      case 'rain': return '<svg viewBox="0 0 24 24" fill="none"><path d="M7 14h10a3.6 3.6 0 0 0 .2-7.2A5.3 5.3 0 0 0 7 8 3.4 3.4 0 0 0 7 14z" fill="#aab4c6"/><g stroke="#5aa9ff" stroke-width="2" stroke-linecap="round"><line x1="9" y1="17" x2="8" y2="20"/><line x1="13" y1="17" x2="12" y2="20.5"/><line x1="17" y1="17" x2="16" y2="20"/></g></svg>';
      case 'snow': return '<svg viewBox="0 0 24 24" fill="none"><path d="M7 13h10a3.6 3.6 0 0 0 .2-7.2A5.3 5.3 0 0 0 7 7 3.4 3.4 0 0 0 7 13z" fill="#aab4c6"/><g fill="#cfe6ff"><circle cx="9" cy="18" r="1.2"/><circle cx="13" cy="20" r="1.2"/><circle cx="16.5" cy="18" r="1.2"/></g></svg>';
      case 'storm': return '<svg viewBox="0 0 24 24" fill="none"><path d="M7 13h10a3.6 3.6 0 0 0 .2-7.2A5.3 5.3 0 0 0 7 7 3.4 3.4 0 0 0 7 13z" fill="#8893a6"/><path d="M12 13l-2.5 4.5h2.2L11 22l4-5.2h-2.4L14 13z" fill="#ffd25a"/></svg>';
      default: return '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill="#ffd25a"/></svg>';
    }
  }

  function defaultCity(){ return DB.weatherCity || {name:'تهران', lat:35.6892, lon:51.3890}; }

  function loadWeather(){
    var box=$('hub-weather'); if(!box) return;
    var city=defaultCity();
    box.innerHTML='<div class="hw-loading">در حال دریافت آب‌وهوای '+esc(city.name)+'…</div>';

    var url='https://api.open-meteo.com/v1/forecast?latitude='+city.lat+'&longitude='+city.lon+
            '&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day'+
            '&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=4';

    fetch(url)
      .then(function(r){ return r.ok?r.json():null; })
      .then(function(d){ if(d&&d.current) renderWeather(d,city); else weatherError(); })
      .catch(weatherError);
  }

  function weatherError(){
    var box=$('hub-weather'); if(!box) return;
    box.innerHTML='<div class="hw-loading hw-err">آب‌وهوا در دسترس نیست'+
      '<button id="hub-weather-retry" class="hw-retry">تلاش دوباره</button></div>';
    var rb=$('hub-weather-retry'); if(rb) rb.addEventListener('click', loadWeather);
  }

  function renderWeather(d,city){
    var box=$('hub-weather'); if(!box) return;
    var cur=d.current;
    var isDay=cur.is_day===1;
    var code=cur.weather_code;
    var wc=WCODE[code]||{l:'—',i:'sun'};
    var temp=Math.round(cur.temperature_2m);
    var feels=Math.round(cur.apparent_temperature);
    var hum=Math.round(cur.relative_humidity_2m);
    var wind=Math.round(cur.wind_speed_10m);

    box.setAttribute('data-sky', isDay?(code<=2?'clear-day':'cloud-day'):(code<=2?'clear-night':'cloud-night'));

    var fc='';
    if(d.daily&&d.daily.time){
      var days=['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'];
      for(var i=1;i<d.daily.time.length;i++){
        var dt=new Date(d.daily.time[i]+'T00:00:00');
        var dwc=WCODE[d.daily.weather_code[i]]||{i:'sun'};
        var lbl = i===1 ? 'فردا' : days[dt.getDay()];
        fc+='<div class="hw-fc-day">'+
              '<span class="hw-fc-lbl">'+lbl+'</span>'+
              '<span class="hw-fc-ic">'+wIcon(dwc.i,true)+'</span>'+
              '<span class="hw-fc-tmp">'+fa(Math.round(d.daily.temperature_2m_max[i]))+'°<i>'+fa(Math.round(d.daily.temperature_2m_min[i]))+'°</i></span>'+
            '</div>';
      }
    }

    box.innerHTML=
      '<div class="hw-glow" aria-hidden="true"></div>'+
      '<div class="hw-main">'+
        '<div class="hw-icon">'+wIcon(wc.i,isDay)+'</div>'+
        '<div class="hw-now">'+
          '<div class="hw-temp">'+fa(temp)+'<span class="hw-deg">°C</span></div>'+
          '<div class="hw-cond">'+esc(wc.l)+'</div>'+
        '</div>'+
        '<button class="hw-city" id="hub-weather-city" title="تغییر شهر">'+
          '<svg viewBox="0 0 24 24" width="13" height="13" fill="none"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="10" r="2.4" stroke="currentColor" stroke-width="1.7"/></svg>'+
          '<span>'+esc(city.name)+'</span>'+
        '</button>'+
      '</div>'+
      '<div class="hw-meta">'+
        '<span class="hw-meta-i">حس‌ واقعی <b>'+fa(feels)+'°</b></span>'+
        '<span class="hw-meta-i">رطوبت <b>'+fa(hum)+'٪</b></span>'+
        '<span class="hw-meta-i">باد <b>'+fa(wind)+'</b> km/h</span>'+
      '</div>'+
      (fc?'<div class="hw-forecast">'+fc+'</div>':'');

    var cityBtn=$('hub-weather-city');
    if(cityBtn) cityBtn.addEventListener('click', promptCity);
  }

  function promptCity(){
    var box=$('hub-weather'); if(!box) return;
    var wrap=el('div','hw-city-edit',
      '<input type="text" id="hub-city-inp" placeholder="نام شهر (مثلاً Mashhad)…" autocomplete="off" />'+
      '<div class="hw-city-results" id="hub-city-results"></div>');
    box.appendChild(wrap);
    var inp=$('hub-city-inp'); inp.focus();
    var t;
    inp.addEventListener('input',function(){
      clearTimeout(t);
      var q=inp.value.trim();
      if(q.length<2){ $('hub-city-results').innerHTML=''; return; }
      t=setTimeout(function(){ searchCity(q); },350);
    });
    inp.addEventListener('keydown',function(e){ if(e.key==='Escape') loadWeather(); });
  }

  function searchCity(q){
    var box=$('hub-city-results'); if(!box) return;
    box.innerHTML='<div class="hw-city-loading">جستجو…</div>';
    fetch('https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(q)+'&count=5&language=fa')
      .then(function(r){ return r.ok?r.json():null; })
      .then(function(d){
        if(!d||!d.results||!d.results.length){ box.innerHTML='<div class="hw-city-loading">شهری یافت نشد</div>'; return; }
        box.innerHTML='';
        d.results.forEach(function(c){
          var nm=c.name+(c.admin1?'، '+c.admin1:'')+(c.country?' · '+c.country:'');
          var b=el('button','hw-city-opt',esc(nm));
          b.addEventListener('click',function(){
            DB.weatherCity={name:c.name, lat:c.latitude, lon:c.longitude};
            save(); loadWeather();
          });
          box.appendChild(b);
        });
      })
      .catch(function(){ box.innerHTML='<div class="hw-city-loading">خطا در جستجو</div>'; });
  }

  /* ═══════════════════════════════════════
     BUILD — Tasks (right box)
  ═══════════════════════════════════════ */
  function buildTasksBox(){
    var box=$('hub-tasks-box'); if(!box) return;
    var now=new Date();
    var todJ=g2j(now.getFullYear(),now.getMonth()+1,now.getDate());

    var cats='';
    CATS.forEach(function(c){
      cats+='<button class="htask-cat-btn" data-cat="'+c.id+'" title="'+c.l+'" style="--cc:'+c.c+'">'+c.e+'</button>';
    });

    box.innerHTML=
      '<div class="hub-card htasks">' +
        '<div class="htasks-head">' +
          '<div class="htasks-title">' +
            '<span class="htasks-title-main">برنامهٔ امروز</span>' +
            '<span class="htasks-title-date">'+WD_FULL[now.getDay()]+' · '+fa(todJ[2])+' '+JM[todJ[1]-1]+'</span>' +
          '</div>' +
          '<div id="hub-task-ring" class="htasks-ring"></div>' +
        '</div>' +
        '<div class="htask-cats" id="hub-task-cats">'+cats+'</div>' +
        '<div id="hub-task-list" class="htask-list"></div>' +
        '<div class="htask-foot">' +
          '<input type="text" id="hub-task-inp" class="htask-inp" placeholder="یک کار جدید بنویس و Enter بزن…" maxlength="120" autocomplete="off" />' +
          '<button id="hub-task-add" class="htask-add" aria-label="افزودن">' +
            '<svg viewBox="0 0 16 16" width="16" height="16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>';

    var catBtns=box.querySelectorAll('.htask-cat-btn');
    Array.prototype.forEach.call(catBtns,function(b){
      b.addEventListener('click',function(){
        Array.prototype.forEach.call(catBtns,function(x){x.classList.remove('active');});
        b.classList.add('active'); activeCat=b.getAttribute('data-cat');
      });
    });
    if(catBtns[0]) catBtns[0].classList.add('active');

    var inp=$('hub-task-inp'), add=$('hub-task-add');
    if(inp) inp.addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); addTask(inp.value); inp.value=''; } });
    if(add) add.addEventListener('click',function(){ if(inp){ addTask(inp.value); inp.value=''; inp.focus(); } });
  }

  function getTasks(){ return DB.tasks[todayKey()]||[]; }
  function setTasks(a){ DB.tasks[todayKey()]=a; save(); }
  function addTask(text){
    var t=text.trim(); if(!t) return;
    var a=getTasks(); a.push({id:Date.now(),text:t,cat:activeCat,done:false}); setTasks(a); renderTasks();
  }
  function toggleTask(id){ var a=getTasks(); a.forEach(function(t){ if(t.id===id)t.done=!t.done; }); setTasks(a); renderTasks(); }
  function delTask(id){ setTasks(getTasks().filter(function(t){ return t.id!==id; })); renderTasks(); }

  function renderTasks(){
    var list=$('hub-task-list'); if(!list) return;
    var tasks=getTasks();
    var undone=tasks.filter(function(t){return !t.done;});
    var done=tasks.filter(function(t){return t.done;});
    var sorted=undone.concat(done);

    /* progress ring */
    var ring=$('hub-task-ring');
    if(ring){
      if(!tasks.length){ ring.innerHTML=''; }
      else{
        var pct=Math.round(done.length/tasks.length*100);
        var R=15, C=2*Math.PI*R, off=C*(1-pct/100);
        ring.innerHTML='<svg viewBox="0 0 36 36" width="40" height="40">'+
          '<circle cx="18" cy="18" r="'+R+'" fill="none" stroke="var(--border)" stroke-width="3.4"/>'+
          '<circle cx="18" cy="18" r="'+R+'" fill="none" stroke="var(--green)" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+off.toFixed(1)+'" transform="rotate(-90 18 18)"/>'+
          '</svg><span class="htasks-ring-num">'+fa(done.length)+'/'+fa(tasks.length)+'</span>';
      }
    }

    if(!sorted.length){
      list.innerHTML='<div class="htask-empty"><span class="htask-empty-ic">🗒️</span>'+
        '<span class="htask-empty-t">امروز هنوز کاری ثبت نکرده‌ای</span>'+
        '<span class="htask-empty-s">یک دستهٔ بالا انتخاب کن و اولین کار را بنویس</span></div>';
      return;
    }

    list.innerHTML=sorted.map(function(t){
      var c=catById(t.cat);
      return '<div class="htask'+(t.done?' htask-done':'')+'">'+
        '<button class="htask-cb" data-id="'+t.id+'" style="--cc:'+c.c+'" aria-label="تغییر وضعیت">'+
          (t.done?'<svg viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5 6.5-7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>':'')+
        '</button>'+
        '<span class="htask-cat-pip" style="background:'+c.c+'" title="'+c.l+'"></span>'+
        '<span class="htask-text">'+esc(t.text)+'</span>'+
        '<button class="htask-del" data-id="'+t.id+'" aria-label="حذف">'+
          '<svg viewBox="0 0 16 16" width="13" height="13" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'+
        '</button>'+
      '</div>';
    }).join('');

    Array.prototype.forEach.call(list.querySelectorAll('.htask-cb'),function(b){
      b.addEventListener('click',function(){ toggleTask(+b.getAttribute('data-id')); });
    });
    Array.prototype.forEach.call(list.querySelectorAll('.htask-del'),function(b){
      b.addEventListener('click',function(){ delTask(+b.getAttribute('data-id')); });
    });
  }

  /* ═══════════════════════════════════════
     QUICK ACCESS (below)
  ═══════════════════════════════════════ */
  var IB_BRAND = { fixed:true, title:'ایران بروکر', url:'https://iranbroker.net/', brand:true, color:'#185adb' };
  var MAX_QA = 11; // + IB = 12 tiles

  function getInitial(str){
    if(!str) return '★';
    var cp=str.codePointAt?str.codePointAt(0):str.charCodeAt(0);
    return cp>0x2000 ? String.fromCodePoint(cp) : str.trim().charAt(0).toUpperCase();
  }

  function renderQuick(){
    var grid=$('hub-quick-grid'); if(!grid) return;
    var html='';

    /* pinned IranBroker tile with logo mark */
    html+='<a class="hqa-tile hqa-brand" href="'+IB_BRAND.url+'" target="_blank" rel="noopener" title="ایران بروکر">'+
            '<span class="hqa-ic hqa-ic-brand">'+
              '<svg viewBox="0 0 32 28" width="22" height="20" fill="none"><path d="M14.76 8.91c3.56-3.44 4.6-4.57 6.82-6.91.98.64 2.02 1.21 3.03 1.87-1.73 1.72-3.22 3.25-4.78 4.85 1.96 0 2.71.02 3.9 0 1.3.02 2.45-.13 3.69.34 1.66.62 2.9 2.09 3.37 3.79.6 1.98.02 4.19-1.3 5.74-1.17 1.4-2.96 1.94-4.73 2.02-3.43 0-6.53 0-9.72 0-1.86.07-3.78-.49-5.19-1.72-.45-.38-.81-.77-1.3-1.08-.24.7-.66 1.31-1.16 1.89-1.45 1.74-3.09 3.29-4.71 4.89-.9-.74-1.77-1.49-2.69-2.17 1.39-1.47 2.86-2.85 4.27-4.32.85-.89 1.9-2.12 1.26-3.34-.47-.47-.94-.96-1.41-1.45.81-.81 1.64-1.61 2.43-2.45 1.54 1.47 3.01 2.98 4.48 4.49.79.83 1.73 1.62 2.9 1.77 1.22.17 9.83 0 11.6 0 1.37-.08 2.58-1.57 2.41-2.95-.15-1.08-1.13-2.06-2.26-2.06-1.64-.02-6.7-.04-9.58-.04-.55-1.3-.76-1.89-1.34-3.15z" fill="#fff"/></svg>'+
            '</span>'+
            '<span class="hqa-name">ایران بروکر</span>'+
          '</a>';

    DB.quick.forEach(function(q,idx){
      var icon=q.icon||getInitial(q.title);
      html+='<div class="hqa-tile" style="--qac:'+(q.color||'#185adb')+'">'+
              '<a class="hqa-link" href="'+escA(q.url)+'" target="_blank" rel="noopener" title="'+escA(q.title)+'">'+
                '<span class="hqa-ic">'+esc(icon)+'</span>'+
                '<span class="hqa-name">'+esc(q.title)+'</span>'+
              '</a>'+
              '<button class="hqa-del" data-idx="'+idx+'" aria-label="حذف">'+
                '<svg viewBox="0 0 16 16" width="11" height="11" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'+
              '</button>'+
            '</div>';
    });

    var filled = 1 + DB.quick.length;          // brand + user tiles
    if(DB.quick.length<MAX_QA){
      html+='<button class="hqa-tile hqa-add" id="hub-qa-add">'+
              '<span class="hqa-add-plus">+</span>'+
              '<span class="hqa-add-lbl">افزودن میان‌بر</span>'+
            '</button>';
      filled++;
      /* ghost placeholders → fill the 3-col grid (min 9 = 3×3, up to 12) */
      var target = filled<=9 ? 9 : Math.min(12, Math.ceil(filled/3)*3);
      for(var g=filled; g<target; g++){
        html+='<button class="hqa-tile hqa-ghost" data-add="1" aria-label="افزودن میان‌بر">'+
                '<span class="hqa-ghost-plus">+</span>'+
              '</button>';
      }
    }

    grid.innerHTML=html;

    var addBtn=$('hub-qa-add');
    if(addBtn) addBtn.addEventListener('click', openQaModal);
    Array.prototype.forEach.call(grid.querySelectorAll('.hqa-ghost[data-add]'),function(b){
      b.addEventListener('click', openQaModal);
    });
    Array.prototype.forEach.call(grid.querySelectorAll('.hqa-del'),function(b){
      b.addEventListener('click',function(e){
        e.preventDefault(); e.stopPropagation();
        DB.quick.splice(+b.getAttribute('data-idx'),1); save(); renderQuick();
      });
    });
  }

  /* ─────────── quick-access modal ─────────── */
  function buildQaColors(){
    var wrap=$('hub-qa-colors'); if(!wrap) return;
    wrap.innerHTML='';
    QA_COLORS.forEach(function(c,i){
      var b=el('button','hqa-col-btn'+(i===0?' active':''));
      b.style.background=c; b.setAttribute('data-c',c);
      b.addEventListener('click',function(){
        Array.prototype.forEach.call(wrap.querySelectorAll('.hqa-col-btn'),function(x){x.classList.remove('active');});
        b.classList.add('active'); qaEditColor=c; updateQaPreview();
      });
      wrap.appendChild(b);
    });
    qaEditColor=QA_COLORS[0];
  }

  function updateQaPreview(){
    var prev=$('hub-qa-preview'), ic=$('hub-qa-prev-ic');
    if(!prev||!ic) return;
    prev.style.setProperty('--qac', qaEditColor);
    var emoji=($('hub-qa-inp-icon').value||'').trim();
    var title=($('hub-qa-inp-title').value||'').trim();
    ic.textContent = emoji || (title?getInitial(title):'+');
  }

  function openQaModal(){
    var m=$('hub-qa-modal'); if(!m) return;
    buildQaColors();
    $('hub-qa-inp-url').value='';
    $('hub-qa-inp-title').value='';
    $('hub-qa-inp-icon').value='';
    updateQaPreview();
    m.removeAttribute('hidden');
    setTimeout(function(){ $('hub-qa-inp-url').focus(); },50);
  }
  function closeQaModal(){ var m=$('hub-qa-modal'); if(m) m.setAttribute('hidden',''); }

  function saveQa(){
    var url=($('hub-qa-inp-url').value||'').trim();
    var title=($('hub-qa-inp-title').value||'').trim();
    if(!url){ flashErr($('hub-qa-inp-url')); return; }
    if(!/^https?:\/\//i.test(url)) url='https://'+url;
    if(!title){ try{ title=url.replace(/^https?:\/\//,'').replace(/\/.*$/,''); }catch(e){ title='میان‌بر'; } }
    var icon=($('hub-qa-inp-icon').value||'').trim();
    DB.quick.push({title:title,url:url,color:qaEditColor,icon:icon||null});
    save(); renderQuick(); closeQaModal();
  }

  function flashErr(node){
    if(!node) return;
    node.focus(); node.classList.add('hub-inp-err');
    setTimeout(function(){ node.classList.remove('hub-inp-err'); },800);
  }

  /* ═══════════════════════════════════════
     STORAGE
  ═══════════════════════════════════════ */
  function load(){
    try{
      var raw=localStorage.getItem(PERSIST_KEY);
      if(raw){
        var d=JSON.parse(raw);
        DB.tasks=(d.tasks&&typeof d.tasks==='object')?d.tasks:{};
        DB.quick=Array.isArray(d.quick)?d.quick:[];
        DB.weatherCity=d.weatherCity||null;
      }
    }catch(e){}
  }
  function save(){ try{ localStorage.setItem(PERSIST_KEY,JSON.stringify(DB)); }catch(e){} }

  /* ═══════════════════════════════════════
     INIT
  ═══════════════════════════════════════ */
  function init(){
    load();

    var now=new Date();
    var todJ=g2j(now.getFullYear(),now.getMonth()+1,now.getDate());
    calView.jy=todJ[0]; calView.jm=todJ[1];

    buildCalBox();
    buildTasksBox();

    /* day modal wiring */
    var dm=$('hub-day-modal'), dmx=$('hub-day-modal-x');
    if(dmx) dmx.addEventListener('click',function(){ dm.setAttribute('hidden',''); });
    if(dm)  dm.addEventListener('click',function(e){ if(e.target===dm) dm.setAttribute('hidden',''); });

    /* qa modal wiring */
    var qaSave=$('hub-qa-modal-save'), qaCancel=$('hub-qa-modal-cancel'),
        qaX=$('hub-qa-modal-x'), qaModal=$('hub-qa-modal');
    if(qaSave) qaSave.addEventListener('click', saveQa);
    if(qaCancel) qaCancel.addEventListener('click', closeQaModal);
    if(qaX) qaX.addEventListener('click', closeQaModal);
    if(qaModal) qaModal.addEventListener('click',function(e){ if(e.target===qaModal) closeQaModal(); });
    var qaUrl=$('hub-qa-inp-url'), qaTitle=$('hub-qa-inp-title'), qaIcon=$('hub-qa-inp-icon');
    if(qaUrl){ qaUrl.addEventListener('keydown',function(e){ if(e.key==='Enter') saveQa(); }); }
    if(qaTitle) qaTitle.addEventListener('input', updateQaPreview);
    if(qaIcon) qaIcon.addEventListener('input', updateQaPreview);

    document.addEventListener('keydown',function(e){
      if(e.key==='Escape'){
        if(qaModal&&!qaModal.hasAttribute('hidden')) closeQaModal();
        if(dm&&!dm.hasAttribute('hidden')) dm.setAttribute('hidden','');
      }
    });

    /* render */
    renderCalendar();
    renderTasks();
    renderQuick();

    /* async data — only fetch when relevant (always safe though) */
    loadEcon();
    loadWeather();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
