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

  /* keyword → category (auto-detect while typing) */
  var CAT_KEYS = [
    {c:'trade',   w:['معامله','معاملات','ترید','تحلیل','چارت','پوزیشن','واچ‌لیست','واچلیست','ستاپ','ورود','خروج','ژورنال','بک‌تست','بکتست','بازار','نماد','سیگنال','ریسک']},
    {c:'learn',   w:['مطالعه','بخوان','کتاب','دوره','آموزش','وبینار','یاد','تمرین','مقاله','ویدیو','پادکست']},
    {c:'urgent',  w:['فوری','ددلاین','سررسید','همین','عجله']},
    {c:'personal',w:['ورزش','باشگاه','خرید','خانواده','دکتر','پزشک','قدم','آب','استراحت','ناهار','شام','خواب']},
    {c:'work',    w:['جلسه','ایمیل','گزارش','تماس','پروژه','تسک','ارائه','قرارداد','کار']}
  ];

  /* one-tap trading routines */
  var ROUTINES = [
    {id:'pre', e:'🌅', l:'پیش از بازار', items:[
      {t:'مرور تقویم اقتصادی روز', c:'trade', at:8*60+30},
      {t:'بررسی واچ‌لیست و سطوح کلیدی', c:'trade', at:9*60},
      {t:'تعیین سقف ریسک امروز', c:'trade', at:9*60+15}
    ]},
    {id:'post', e:'🌙', l:'بستن روز', items:[
      {t:'ثبت معاملات در ژورنال', c:'trade', at:20*60},
      {t:'مرور اشتباه‌ها و درس‌های امروز', c:'learn', at:20*60+20}
    ]},
    {id:'study', e:'📚', l:'مطالعه', items:[
      {t:'۳۰ دقیقه مطالعهٔ تحلیل تکنیکال', c:'learn', at:null},
      {t:'بازبینی یک معاملهٔ گذشته', c:'learn', at:null}
    ]}
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
    tasks: {},                 // { 'YYYY-MM-DD': [ {id,text,cat,done,at,pri,star} ] }
    quick: [],                 // user shortcuts
    weatherCity: null,         // {name, lat, lon}
    streak: {n:0, last:null},  // consecutive days with a completed task
    carried: null,             // last day-key we offered carry-over for
    showEv: true               // economic events inside the timeline
  };
  var calView = { jy:0, jm:0 };
  var activeCat = 'trade';
  var catLocked = false;       // user picked a category by hand → don't auto-override
  var ECON = {};               // { 'YYYY-MM-DD': [events] }  this week only
  var econLoaded = false;
  var qaEditColor = QA_COLORS[0];
  var lastDayKey = '';
  var undoBuf = null;          // {task, timer} for the delete-undo toast
  var editingId = null;

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
        renderTasks();          /* today's events land on the plan timeline */
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
     TODAY PLAN (right box) — timeline + smart composer
     ▸ کارها روی یک تایم‌لاین با خط «الان» می‌نشینند
     ▸ رویدادهای اقتصادی امروز داخل همان تایم‌لاین دیده می‌شوند
     ▸ ورودی، زمان/اولویت/دسته را از متن فارسی تشخیص می‌دهد
  ═══════════════════════════════════════ */

  /* ─────────── date helpers ─────────── */
  function keyOf(d){ return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate()); }
  function shiftKey(days){ var d=new Date(); d.setDate(d.getDate()+days); return keyOf(d); }
  function nowMins(){ var n=new Date(); return n.getHours()*60+n.getMinutes(); }
  function hhmm(m){ return fa(p2(Math.floor(m/60))+':'+p2(m%60)); }

  /* ─────────── natural-language parsing (fa) ───────────
     digits are normalised 1:1 so match indexes stay valid on the raw string */
  function toEnDigits(s){
    return String(s).replace(/[۰-۹]/g,function(d){ return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)); })
                    .replace(/[٠-٩]/g,function(d){ return String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)); });
  }
  var DAYPART = {'صبح':9,'ظهر':12,'عصر':16,'بعدازظهر':16,'شب':20};

  function parseInput(raw){
    var text=String(raw), norm=toEnDigits(text), at=null, pri=false, cat=null, m;

    function cut(idx,len){
      text = text.slice(0,idx)+' '+text.slice(idx+len);
      norm = norm.slice(0,idx)+' '+norm.slice(idx+len);
    }
    /* 1) 14:30 / ساعت ۱۴:۳۰  — colon only, so prices like ۱.۰۸ stay untouched */
    if((m=norm.match(/(?:ساعت\s*)?([01]?\d|2[0-3])\s*:\s*([0-5]\d)/))){
      at=+m[1]*60 + +m[2]; cut(m.index,m[0].length);
    }
    /* 2) ساعت ۸ / ساعت ۸ شب */
    else if((m=norm.match(/ساعت\s*([01]?\d|2[0-3])(?!\d)\s*(صبح|ظهر|عصر|بعدازظهر|شب)?/))){
      var h2=+m[1];
      if(m[2]&&(m[2]==='شب'||m[2]==='عصر'||m[2]==='بعدازظهر')&&h2<12) h2+=12;
      at=h2*60; cut(m.index,m[0].length);
    }
    /* 3) ۸ صبح / ۹ شب */
    else if((m=norm.match(/([01]?\d|2[0-3])\s*(صبح|ظهر|عصر|بعدازظهر|شب)/))){
      var h3=+m[1];
      if((m[2]==='شب'||m[2]==='عصر'||m[2]==='بعدازظهر')&&h3<12) h3+=12;
      at=h3*60; cut(m.index,m[0].length);
    }
    /* 4) فقط «صبح/ظهر/عصر/شب» → زمان پیش‌فرض آن بازه */
    else if((m=norm.match(/(^|\s)(صبح|ظهر|عصر|بعدازظهر|شب)(\s|$)/))){
      at=DAYPART[m[2]]*60; cut(m.index+m[1].length, m[2].length);
    }

    /* اولویت: هر «!» یا واژهٔ «فوری» */
    if((m=norm.match(/!+/))){ pri=true; cut(m.index, m[0].length); }
    if(/فوری/.test(norm)) pri=true;

    /* دسته از روی کلیدواژه */
    var low=norm;
    for(var i=0;i<CAT_KEYS.length && !cat;i++){
      for(var j=0;j<CAT_KEYS[i].w.length;j++){
        if(low.indexOf(CAT_KEYS[i].w[j])>-1){ cat=CAT_KEYS[i].c; break; }
      }
    }
    text=text.replace(/\s{2,}/g,' ').trim();
    return {text:text, at:at, pri:pri, cat:cat};
  }

  /* ─────────── data ─────────── */
  function getTasks(){ return DB.tasks[todayKey()]||[]; }
  function setTasks(a){ DB.tasks[todayKey()]=a; save(); }

  function addTask(raw){
    var p=parseInput(raw);
    if(!p.text) return false;
    var a=getTasks();
    a.push({
      id: Date.now()+Math.floor(Math.random()*1000),
      text: p.text,
      cat: (catLocked ? activeCat : (p.cat||activeCat)),
      at: p.at,
      pri: p.pri,
      done: false,
      star: false
    });
    setTasks(a); catLocked=false; renderTasks();
    return true;
  }
  function addRoutine(id){
    var r=null;
    ROUTINES.forEach(function(x){ if(x.id===id) r=x; });
    if(!r) return;
    var a=getTasks(), base=Date.now();
    r.items.forEach(function(it,i){
      var dup=false;
      a.forEach(function(t){ if(t.text===it.t) dup=true; });
      if(dup) return;
      a.push({id:base+i, text:it.t, cat:it.c, at:it.at, pri:false, done:false, star:false});
    });
    setTasks(a); renderTasks();
  }
  function toggleTask(id){
    var a=getTasks(), hit=null;
    a.forEach(function(t){ if(t.id===id){ t.done=!t.done; hit=t; } });
    setTasks(a);
    if(hit&&hit.done) bumpStreak();
    renderTasks();
  }
  function starTask(id){
    var a=getTasks();
    a.forEach(function(t){ t.star = (t.id===id) ? !t.star : false; });
    setTasks(a); renderTasks();
  }
  function delTask(id){
    var a=getTasks(), gone=null, idx=-1;
    a.forEach(function(t,i){ if(t.id===id){ gone=t; idx=i; } });
    if(!gone) return;
    setTasks(a.filter(function(t){ return t.id!==id; }));
    if(undoBuf&&undoBuf.timer) clearTimeout(undoBuf.timer);
    undoBuf={task:gone, idx:idx, timer:setTimeout(function(){ undoBuf=null; renderUndo(); },6000)};
    renderTasks();
  }
  function undoDel(){
    if(!undoBuf) return;
    var a=getTasks();
    a.splice(Math.min(undoBuf.idx,a.length),0,undoBuf.task);
    clearTimeout(undoBuf.timer); undoBuf=null;
    setTasks(a); renderTasks();
  }
  function editTask(id,text){
    var t=String(text).trim(); if(!t){ return; }
    var a=getTasks();
    a.forEach(function(x){ if(x.id===id) x.text=t; });
    setTasks(a);
  }
  function bumpStreak(){
    var tk=todayKey();
    if(DB.streak.last===tk) return;
    DB.streak.n = (DB.streak.last===shiftKey(-1)) ? DB.streak.n+1 : 1;
    DB.streak.last=tk; save();
  }
  function prune(){
    var keys=Object.keys(DB.tasks).sort();
    while(keys.length>90){ delete DB.tasks[keys.shift()]; }
  }

  /* ─────────── shell ─────────── */
  function buildTasksBox(){
    var box=$('hub-tasks-box'); if(!box) return;
    var now=new Date();
    var todJ=g2j(now.getFullYear(),now.getMonth()+1,now.getDate());
    lastDayKey=todayKey();

    var cats='';
    CATS.forEach(function(c){
      cats+='<button class="htask-cat-btn'+(c.id===activeCat?' active':'')+'" data-cat="'+c.id+'" title="'+c.l+'" style="--cc:'+c.c+'">'+
              '<span class="htcb-e">'+c.e+'</span><span class="htcb-l">'+c.l+'</span>'+
            '</button>';
    });

    var routines='';
    ROUTINES.forEach(function(r){
      routines+='<button class="htask-rt" data-rt="'+r.id+'"><span>'+r.e+'</span>'+r.l+'</button>';
    });

    box.innerHTML=
      '<div class="hub-card htasks">' +
        '<div class="htasks-head">' +
          '<div class="htasks-title">' +
            '<span class="htasks-title-main">برنامهٔ امروز</span>' +
            '<span class="htasks-title-date">'+WD_FULL[now.getDay()]+' · '+fa(todJ[2])+' '+JM[todJ[1]-1]+'</span>' +
          '</div>' +
          '<div class="htasks-hact">' +
            '<button id="hub-task-ev" class="htasks-ico" title="نمایش رویدادهای اقتصادی روی تایم‌لاین" aria-label="رویدادهای اقتصادی">' +
              '<svg viewBox="0 0 24 24" width="15" height="15" fill="none"><path d="M4 9h16M7 3v3M17 3v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><rect x="3.5" y="5.5" width="17" height="15" rx="3" stroke="currentColor" stroke-width="1.8"/><path d="M8 14l2.5 2.5L16 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '</button>' +
            '<div id="hub-task-ring" class="htasks-ring"></div>' +
          '</div>' +
        '</div>' +

        '<div class="htasks-meter">' +
          '<div id="hub-task-segs" class="htasks-segs"></div>' +
          '<div class="htasks-metarow">' +
            '<span id="hub-task-stat" class="htasks-stat"></span>' +
            '<span id="hub-task-streak" class="htasks-streak"></span>' +
          '</div>' +
        '</div>' +

        '<div id="hub-task-banner"></div>' +
        '<div id="hub-task-list" class="htask-list"></div>' +
        '<div id="hub-task-undo" class="htask-undo" hidden></div>' +

        '<div class="htask-foot">' +
          '<div class="htask-inpwrap">' +
            '<input type="text" id="hub-task-inp" class="htask-inp" placeholder="مثلاً: تحلیل یورودلار ساعت ۱۴:۳۰ !" maxlength="140" autocomplete="off" />' +
            '<button id="hub-task-add" class="htask-add" aria-label="افزودن">' +
              '<svg viewBox="0 0 16 16" width="16" height="16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>' +
            '</button>' +
          '</div>' +
          '<div id="hub-task-parse" class="htask-parse" hidden></div>' +
          '<div class="htask-cats" id="hub-task-cats">'+cats+'</div>' +
          '<div class="htask-rts" id="hub-task-rts">'+
            '<span class="htask-rts-l">روتین:</span>'+routines+
          '</div>' +
        '</div>' +
      '</div>';

    var catBtns=box.querySelectorAll('.htask-cat-btn');
    Array.prototype.forEach.call(catBtns,function(b){
      b.addEventListener('click',function(){
        activeCat=b.getAttribute('data-cat'); catLocked=true;
        paintCats();
        var i=$('hub-task-inp'); if(i) i.focus();
      });
    });

    Array.prototype.forEach.call(box.querySelectorAll('.htask-rt'),function(b){
      b.addEventListener('click',function(){ addRoutine(b.getAttribute('data-rt')); });
    });

    var evb=$('hub-task-ev');
    if(evb){
      evb.classList.toggle('on', !!DB.showEv);
      evb.addEventListener('click',function(){
        DB.showEv=!DB.showEv; save();
        evb.classList.toggle('on', !!DB.showEv);
        renderTasks();
      });
    }

    var inp=$('hub-task-inp'), add=$('hub-task-add');
    if(inp){
      inp.addEventListener('input', previewParse);
      inp.addEventListener('keydown',function(e){
        if(e.key==='Enter'){ e.preventDefault(); if(addTask(inp.value)){ inp.value=''; previewParse(); } }
        if(e.key==='Escape'){ inp.value=''; previewParse(); inp.blur(); }
      });
    }
    if(add) add.addEventListener('click',function(){
      if(inp && addTask(inp.value)){ inp.value=''; previewParse(); inp.focus(); }
    });
  }

  function paintCats(){
    var box=$('hub-task-cats'); if(!box) return;
    Array.prototype.forEach.call(box.querySelectorAll('.htask-cat-btn'),function(b){
      b.classList.toggle('active', b.getAttribute('data-cat')===activeCat);
    });
  }

  /* live chips under the composer */
  function previewParse(){
    var inp=$('hub-task-inp'), row=$('hub-task-parse');
    if(!inp||!row) return;
    var raw=inp.value;
    if(!raw.trim()){ row.setAttribute('hidden',''); row.innerHTML=''; return; }
    var p=parseInput(raw);
    if(!catLocked && p.cat){ activeCat=p.cat; paintCats(); }

    var chips='';
    if(p.at!=null) chips+='<span class="htp-chip htp-time">🕒 '+hhmm(p.at)+'</span>';
    if(p.pri)      chips+='<span class="htp-chip htp-pri">🔥 فوری</span>';
    var c=catById(activeCat);
    chips+='<span class="htp-chip" style="--cc:'+c.c+'">'+c.e+' '+c.l+'</span>';
    if(p.at==null) chips+='<span class="htp-hint">زمان بنویس تا روی تایم‌لاین بنشیند</span>';

    row.innerHTML=chips;
    row.removeAttribute('hidden');
  }

  /* ─────────── carry-over from yesterday ─────────── */
  function pendingCarry(){
    var y=DB.tasks[shiftKey(-1)]||[];
    return y.filter(function(t){ return !t.done; });
  }
  function renderBanner(){
    var b=$('hub-task-banner'); if(!b) return;
    var tk=todayKey();
    var left=pendingCarry();
    if(DB.carried===tk || !left.length){ b.innerHTML=''; return; }
    b.innerHTML=
      '<div class="htask-carry">'+
        '<span class="htask-carry-t">'+fa(left.length)+' کار ناتمام از دیروز</span>'+
        '<div class="htask-carry-a">'+
          '<button id="hub-carry-yes" class="htask-carry-y">انتقال به امروز</button>'+
          '<button id="hub-carry-no" class="htask-carry-n" aria-label="نادیده بگیر">×</button>'+
        '</div>'+
      '</div>';
    $('hub-carry-yes').addEventListener('click',function(){
      var a=getTasks(), base=Date.now();
      left.forEach(function(t,i){
        a.push({id:base+i, text:t.text, cat:t.cat, at:(t.at!=null?t.at:null), pri:!!t.pri, done:false, star:false});
      });
      DB.carried=tk; setTasks(a); renderTasks();
    });
    $('hub-carry-no').addEventListener('click',function(){ DB.carried=tk; save(); renderBanner(); });
  }

  /* ─────────── undo toast ─────────── */
  function renderUndo(){
    var u=$('hub-task-undo'); if(!u) return;
    if(!undoBuf){ u.setAttribute('hidden',''); u.innerHTML=''; return; }
    u.innerHTML='<span class="htu-t">«'+esc(undoBuf.task.text.slice(0,26))+'» حذف شد</span>'+
                '<button id="hub-task-undo-b" class="htu-b">بازگردانی</button>';
    u.removeAttribute('hidden');
    $('hub-task-undo-b').addEventListener('click', undoDel);
  }

  /* ─────────── today's economic events ─────────── */
  function todayEvents(){
    if(!DB.showEv) return [];
    var ev=ECON[todayKey()]||[];
    return ev.filter(function(e){ return e.impact==='High'||e.impact==='Medium'; })
             .map(function(e){
               var d=new Date(e._t||0);
               return {kind:'ev', at:d.getHours()*60+d.getMinutes(), ev:e};
             });
  }

  /* ═══════════════════════════════════════
     RENDER
  ═══════════════════════════════════════ */
  function renderTasks(){
    var list=$('hub-task-list'); if(!list) return;
    var tasks=getTasks();
    var done=tasks.filter(function(t){ return t.done; });
    var nm=nowMins();

    renderBanner();
    renderUndo();
    renderMeter(tasks,done);

    if(!tasks.length){
      list.innerHTML=
        '<div class="htask-empty">'+
          '<span class="htask-empty-ic">🗓️</span>'+
          '<span class="htask-empty-t">برنامهٔ امروزت خالی است</span>'+
          '<span class="htask-empty-s">کار را با زمانش بنویس تا خودش روی تایم‌لاین بنشیند —<br>«مرور واچ‌لیست ساعت ۹» یا یک روتین آماده را بزن.</span>'+
        '</div>';
      return;
    }

    /* ── build the timeline ── */
    var timed=[], anytime=[], star=null;
    tasks.forEach(function(t){
      if(t.star && !t.done){ star=t; return; }
      if(t.at!=null) timed.push({kind:'t', at:t.at, task:t});
      else anytime.push(t);
    });

    var rows=timed.concat(todayEvents());
    rows.sort(function(a,b){
      if(a.at!==b.at) return a.at-b.at;
      return a.kind==='ev' ? -1 : 1;
    });

    /* next undone timed task → «بعدی» */
    var nextId=null;
    for(var i=0;i<rows.length;i++){
      if(rows[i].kind==='t' && !rows[i].task.done && rows[i].at>=nm){ nextId=rows[i].task.id; break; }
    }

    var html='';
    if(star) html+=focusCard(star, nm);

    if(rows.length){
      html+='<div class="htl">';
      var nowPlaced=false;
      rows.forEach(function(r){
        if(!nowPlaced && r.at>nm){ html+=nowRow(nm); nowPlaced=true; }
        html+= r.kind==='ev' ? evRow(r) : taskRow(r.task, nm, nextId);
      });
      if(!nowPlaced) html+=nowRow(nm);
      html+='</div>';
    }

    if(anytime.length){
      var au=anytime.filter(function(t){ return !t.done; });
      var ad=anytime.filter(function(t){ return t.done; });
      html+='<div class="htask-sep"><span>بدون زمان</span></div>'+
            '<div class="htl htl-free">'+
              au.concat(ad).map(function(t){ return taskRow(t, nm, null); }).join('')+
            '</div>';
    }

    if(tasks.length && done.length===tasks.length){
      html+='<div class="htask-allgood">'+
              '<span class="htask-allgood-ic">🎉</span>'+
              '<span>همهٔ کارهای امروز انجام شد'+(DB.streak.n>1?' — '+fa(DB.streak.n)+' روز پیاپی':'')+'</span>'+
            '</div>';
    }

    list.innerHTML=html;
    wireRows(list);
  }

  function nowRow(nm){
    return '<div class="htl-now"><span class="htl-now-t">'+hhmm(nm)+'</span><i class="htl-now-line"></i><span class="htl-now-l">الان</span></div>';
  }

  function focusCard(t,nm){
    var c=catById(t.cat);
    return '<div class="htask-focus" style="--cc:'+c.c+'">'+
             '<div class="htf-head"><span class="htf-l">تمرکز اصلی امروز</span>'+
               (t.at!=null?'<span class="htf-time">'+hhmm(t.at)+'</span>':'')+
             '</div>'+
             '<div class="htf-body">'+
               '<button class="htask-cb htf-cb" data-id="'+t.id+'" style="--cc:'+c.c+'" aria-label="انجام شد"></button>'+
               '<span class="htf-text" data-edit="'+t.id+'">'+esc(t.text)+'</span>'+
               '<button class="htask-star on" data-star="'+t.id+'" aria-label="برداشتن تمرکز">★</button>'+
             '</div>'+
           '</div>';
  }

  function evRow(r){
    var e=r.ev, im=IMP[e.impact]||IMP.Low;
    return '<div class="htl-row htl-ev" data-ev="1" title="'+escA((e.title||'')+' — اثر '+im.l)+'">'+
             '<span class="htl-time">'+hhmm(r.at)+'</span>'+
             '<span class="htl-rail"><i class="htl-node htl-node-ev" style="background:'+im.c+'"></i></span>'+
             '<span class="htl-ev-body">'+
               '<span class="htl-ev-cur">'+esc(e.country||'')+'</span>'+
               '<span class="htl-ev-t">'+esc(e.title||'')+'</span>'+
             '</span>'+
           '</div>';
  }

  function taskRow(t,nm,nextId){
    var c=catById(t.cat);
    var late = !t.done && t.at!=null && t.at<nm;
    var isNext = t.id===nextId;
    var cls='htl-row htask'+(t.done?' htask-done':'')+(late?' htask-late':'')+(isNext?' htask-next':'')+(t.pri?' htask-pri':'');
    return '<div class="'+cls+'" style="--cc:'+c.c+'">'+
             '<span class="htl-time">'+(t.at!=null?hhmm(t.at):'<i class="htl-dash">—</i>')+'</span>'+
             '<span class="htl-rail"><i class="htl-node"></i></span>'+
             '<div class="htask-body">'+
               '<button class="htask-cb" data-id="'+t.id+'" aria-label="تغییر وضعیت">'+
                 (t.done?'<svg viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5 6.5-7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>':'')+
               '</button>'+
               '<span class="htask-text" data-edit="'+t.id+'" title="برای ویرایش دوبار کلیک کن">'+esc(t.text)+'</span>'+
               (t.pri&&!t.done?'<span class="htask-flag" title="فوری">🔥</span>':'')+
               (isNext?'<span class="htask-tag htask-tag-next">بعدی</span>':'')+
               (late?'<span class="htask-tag htask-tag-late">دیر شد</span>':'')+
               '<span class="htask-acts">'+
                 '<button class="htask-star'+(t.star?' on':'')+'" data-star="'+t.id+'" aria-label="تمرکز اصلی">★</button>'+
                 '<button class="htask-del" data-del="'+t.id+'" aria-label="حذف">'+
                   '<svg viewBox="0 0 16 16" width="12" height="12" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'+
                 '</button>'+
               '</span>'+
             '</div>'+
           '</div>';
  }

  function renderMeter(tasks,done){
    var segs=$('hub-task-segs'), stat=$('hub-task-stat'),
        streak=$('hub-task-streak'), ring=$('hub-task-ring');

    if(segs){
      if(!tasks.length){
        segs.innerHTML='<i class="htseg htseg-ghost"></i>';
      }else{
        segs.innerHTML=tasks.map(function(t){
          var c=catById(t.cat);
          return '<i class="htseg'+(t.done?' htseg-on':'')+'" style="--cc:'+c.c+'" title="'+escA(t.text)+'"></i>';
        }).join('');
      }
    }
    if(stat){
      if(!tasks.length) stat.textContent='هنوز کاری ثبت نشده';
      else{
        var left=tasks.length-done.length;
        stat.innerHTML = left
          ? '<b>'+fa(left)+'</b> کار باقی‌مانده از <b>'+fa(tasks.length)+'</b>'
          : 'همه انجام شد ✓';
      }
    }
    if(streak){
      streak.innerHTML = DB.streak.n>0
        ? '<span class="hts-fire">🔥</span>'+fa(DB.streak.n)+' روز پیاپی'
        : '';
    }
    if(ring){
      var pct = tasks.length ? Math.round(done.length/tasks.length*100) : 0;
      var R=15, C=2*Math.PI*R, off=C*(1-pct/100);
      ring.innerHTML='<svg viewBox="0 0 36 36" width="40" height="40">'+
        '<circle cx="18" cy="18" r="'+R+'" fill="none" stroke="var(--border)" stroke-width="3.4"/>'+
        '<circle cx="18" cy="18" r="'+R+'" fill="none" stroke="'+(pct===100?'var(--green)':'var(--primary)')+'" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+off.toFixed(1)+'" transform="rotate(-90 18 18)"/>'+
        '</svg><span class="htasks-ring-num">'+fa(pct)+'٪</span>';
    }
  }

  /* ─────────── row wiring ─────────── */
  function wireRows(list){
    Array.prototype.forEach.call(list.querySelectorAll('.htask-cb'),function(b){
      b.addEventListener('click',function(){ toggleTask(+b.getAttribute('data-id')); });
    });
    Array.prototype.forEach.call(list.querySelectorAll('.htask-del'),function(b){
      b.addEventListener('click',function(){ delTask(+b.getAttribute('data-del')); });
    });
    Array.prototype.forEach.call(list.querySelectorAll('.htask-star'),function(b){
      b.addEventListener('click',function(){ starTask(+b.getAttribute('data-star')); });
    });
    Array.prototype.forEach.call(list.querySelectorAll('.htl-ev'),function(r){
      r.addEventListener('click',function(){
        var n=new Date(), j=g2j(n.getFullYear(),n.getMonth()+1,n.getDate());
        calView.jy=j[0]; calView.jm=j[1]; renderCalendar();
        openDayModal(todayKey(), j[2]);
      });
    });
    Array.prototype.forEach.call(list.querySelectorAll('[data-edit]'),function(sp){
      sp.addEventListener('dblclick',function(){ startEdit(sp); });
    });
  }

  function startEdit(span){
    var id=+span.getAttribute('data-edit');
    if(editingId===id) return;
    editingId=id;
    var old=span.textContent;
    var inp=el('input','htask-edit');
    inp.type='text'; inp.value=old; inp.maxLength=140;
    span.replaceWith(inp);
    inp.focus(); inp.setSelectionRange(old.length,old.length);
    function commit(ok){
      editingId=null;
      if(ok) editTask(id, inp.value);
      renderTasks();
    }
    inp.addEventListener('keydown',function(e){
      if(e.key==='Enter'){ e.preventDefault(); commit(true); }
      if(e.key==='Escape'){ e.preventDefault(); commit(false); }
    });
    inp.addEventListener('blur',function(){ if(editingId===id) commit(true); });
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
  function getDomain(url){
    try{ return String(url).replace(/^https?:\/\//i,'').replace(/^www\./i,'').split(/[\/?#]/)[0]; }
    catch(e){ return ''; }
  }
  function faviconUrl(url){
    var d=getDomain(url);
    return d ? 'https://www.google.com/s2/favicons?sz=64&domain='+encodeURIComponent(d) : '';
  }

  function renderQuick(){
    var grid=$('hub-quick-grid'); if(!grid) return;
    var html='';

    /* pinned IranBroker tile — real site favicon */
    html+='<a class="hqa-tile hqa-brand" href="'+IB_BRAND.url+'" target="_blank" rel="noopener" title="ایران بروکر">'+
            '<span class="hqa-ic hqa-ic-brand hqa-ic-fav">'+
              '<span class="hqa-ic-txt">ا</span>'+
              '<img class="hqa-fav" alt="" src="'+escA(faviconUrl(IB_BRAND.url))+'">'+
            '</span>'+
            '<span class="hqa-name">ایران بروکر</span>'+
          '</a>';

    DB.quick.forEach(function(q,idx){
      var col=q.color||'#185adb';
      /* user emoji wins; otherwise the site favicon over a letter fallback */
      var inner = q.icon
        ? '<span class="hqa-ic-txt">'+esc(q.icon)+'</span>'
        : '<span class="hqa-ic-txt">'+esc(getInitial(q.title))+'</span>'+
          '<img class="hqa-fav" alt="" src="'+escA(faviconUrl(q.url))+'">';
      html+='<div class="hqa-tile" style="--qac:'+col+'">'+
              '<a class="hqa-link" href="'+escA(q.url)+'" target="_blank" rel="noopener" title="'+escA(q.title)+'">'+
                '<span class="hqa-ic'+(q.icon?'':' hqa-ic-fav')+'">'+inner+'</span>'+
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

    /* favicon: reveal on load, fall back to the letter on error (CSP blocks
       inline handlers, so wire them here) */
    Array.prototype.forEach.call(grid.querySelectorAll('.hqa-fav'),function(img){
      img.addEventListener('load', function(){ img.classList.add('hqa-fav-on'); });
      img.addEventListener('error', function(){ img.remove(); });
    });

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
    var url=($('hub-qa-inp-url').value||'').trim();
    if(emoji){
      ic.classList.remove('hqa-ic-fav');
      ic.innerHTML = esc(emoji);
    } else if(url && getDomain(url)){
      ic.classList.add('hqa-ic-fav');
      ic.innerHTML = '<span class="hqa-ic-txt">'+esc(title?getInitial(title):'★')+'</span>'+
                     '<img class="hqa-fav" alt="" src="'+escA(faviconUrl(url))+'">';
      var img=ic.querySelector('.hqa-fav');
      if(img){
        img.addEventListener('load', function(){ img.classList.add('hqa-fav-on'); });
        img.addEventListener('error', function(){ img.remove(); });
      }
    } else {
      ic.classList.remove('hqa-ic-fav');
      ic.innerHTML = esc(title?getInitial(title):'+');
    }
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
        DB.streak=(d.streak&&typeof d.streak==='object')?{n:+d.streak.n||0, last:d.streak.last||null}:{n:0,last:null};
        DB.carried=d.carried||null;
        DB.showEv=(d.showEv!==false);
        /* v1 tasks had no time/priority/star — normalise so renders stay safe */
        Object.keys(DB.tasks).forEach(function(k){
          if(!Array.isArray(DB.tasks[k])){ delete DB.tasks[k]; return; }
          DB.tasks[k].forEach(function(t){
            if(typeof t.at!=='number') t.at=null;
            t.pri=!!t.pri; t.star=!!t.star; t.done=!!t.done;
          });
        });
      }
    }catch(e){}
    prune();
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
    if(qaUrl){
      qaUrl.addEventListener('keydown',function(e){ if(e.key==='Enter') saveQa(); });
      qaUrl.addEventListener('input', updateQaPreview);
    }
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

    /* این پنل فقط در چیدمان «هاب» دیده می‌شود؛ در سایر چیدمان‌ها display:none است.
       برای پرهیز از فچ شبکه و تایمر دائمی بی‌مصرف، دادهٔ زنده فقط وقتی هاب واقعاً
       فعال است بارگذاری می‌شود (چه از ابتدا، چه با سوییچ چیدمان از تنظیمات). */
    var liveStarted = false;
    function startLiveData(){
      if (liveStarted) return;
      liveStarted = true;
      /* keep the «الان» line + late/next tags honest; rebuild after midnight */
      setInterval(function(){
        if(todayKey()!==lastDayKey){ buildTasksBox(); }
        if(!editingId) renderTasks();
      }, 30000);
      loadEcon();
      loadWeather();
    }

    if (document.body.getAttribute('data-layout') === 'hub') {
      startLiveData();
    } else {
      var layoutObs = new MutationObserver(function(){
        if (document.body.getAttribute('data-layout') === 'hub') {
          startLiveData();
          layoutObs.disconnect();
        }
      });
      layoutObs.observe(document.body, { attributes: true, attributeFilter: ['data-layout'] });
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
