/* Daily fraud awareness & education tips */

import { svg } from './utils.js';

const TIPS = [
  { tag: 'آگاهی از کلاهبرداری', text: 'هیچ نهاد مالی معتبری «سود تضمینی» بالای ۷۰٪ نمی‌دهد. چنین وعده‌هایی توجیه اقتصادی ندارند و معمولاً چیزی پشتشان پنهان است.' },
  { tag: 'انتخاب بروکر', text: 'قبل از افتتاح حساب، رگوله بروکر را بررسی کنید. رگوله‌های معتبر مثل FCA، ASIC و CySEC سطح حفاظت بالاتری دارند.' },
  { tag: 'مدیریت ریسک', text: 'هیچ‌گاه بیش از ۱ تا ۲ درصد سرمایه‌تان را روی یک معامله ریسک نکنید. حفظ سرمایه مقدم بر کسب سود است.' },
  { tag: 'اسپرد', text: 'اسپرد پایین همیشه یعنی هزینهٔ کمتر نیست؛ حساب‌های ECN اسپرد نزدیک صفر دارند اما کمیسیون جداگانه می‌گیرند.' },
  { tag: 'پراپ فرم', text: 'پراپ‌فرم معتبر هرگز برای «برداشت سود» هزینهٔ اضافه نمی‌خواهد. مراقب درخواست‌های پرداخت مشکوک باشید.' },
  { tag: 'آموزش', text: 'سودآوری مداوم در فارکس یک‌شبه به‌دست نمی‌آید؛ نیاز به سال‌ها تمرین، تجربه و پشتکار دارد.' },
  { tag: 'لوریج', text: 'لوریج بالا ابزار دو لبه است. بیشتر معامله‌گران مبتدی که با لوریج ۱:۵۰۰ کار می‌کنند، در ماه اول حساب‌شان را از دست می‌دهند.' },
  { tag: 'سیگنال‌فروشی', text: 'خرید سیگنال از افراد ناشناس در شبکه‌های اجتماعی یکی از رایج‌ترین روش‌های کلاهبرداری است. سود پایدار از طریق یادگیری ممکن است.' }
];

export function initTips(state, store) {
  const bgIc = document.getElementById('tip-bg-ic');
  if (bgIc) bgIc.innerHTML = svg('shieldCheck');

  function renderTip() {
    const idx = (store.get().tipIndex || 0) % TIPS.length;
    const t = TIPS[idx];
    const tagEl = document.getElementById('tip-tag');
    const textEl = document.getElementById('tip-text');
    if (tagEl) tagEl.textContent = t.tag;
    if (textEl) textEl.textContent = t.text;
  }

  renderTip();

  const nextIc = document.getElementById('tip-next-ic');
  if (nextIc) nextIc.innerHTML = '<span class="icon">' + svg('arrowLeft') + '</span>';

  const nextBtn = document.getElementById('tip-next');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const s = store.get();
      store.set({ tipIndex: ((s.tipIndex || 0) + 1) % TIPS.length });
      renderTip();
    });
  }
}
