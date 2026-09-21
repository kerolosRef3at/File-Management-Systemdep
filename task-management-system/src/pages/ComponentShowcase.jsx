import React, { useState } from 'react';
import {
  Button,
  Input,
  Select,
  Textarea,
  Toggle,
  Checkbox,
  DateInput,
  TimeInput,
  DateTimeRangePicker,
  DateRangePicker,
  Badge,
  Card,
  StatCard,
  Modal,
  Table,
  Spinner,
  Avatar,
  Alert,
  PageHeader,
  FilterBar,
} from '../components/shared';

export default function ComponentShowcase({ lang = 'ar' }) {
  // State for interactive demo controls
  const [inputText, setInputText] = useState('');
  const [inputPass, setInputPass] = useState('');
  const [selectVal, setSelectVal] = useState('option1');
  const [textareaVal, setTextareaVal] = useState('');
  const [toggleState1, setToggleState1] = useState(true);
  const [toggleState2, setToggleState2] = useState(false);
  const [checkboxState1, setCheckboxState1] = useState(true);
  const [checkboxState2, setCheckboxState2] = useState(false);
  const [dateVal, setDateVal] = useState('2026-09-08');
  const [timeVal, setTimeVal] = useState('14:30');
  const [fromDate, setFromDate] = useState('2026-09-01');
  const [toDate, setToDate] = useState('2026-09-15');
  const [calendarRangeStart, setCalendarRangeStart] = useState('');
  const [calendarRangeEnd, setCalendarRangeEnd] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const demoTableData = [
    { id: 1, name: 'خلاطة خرسانة مرسيدس 3340', code: 'MIX-01', status: 'نشط', driver: 'أحمد محمود' },
    { id: 2, name: 'مضخة خرسانة بوتزميستر 42م', code: 'PUMP-04', status: 'صيانة', driver: 'سامي عبد الله' },
    { id: 3, name: 'محطة خلط إيطالية سيمكس 120م3', code: 'PLANT-B', status: 'نشط', driver: 'م. حسام' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Header */}
      <PageHeader
        title={lang === 'ar' ? 'معرض المكونات التفاعلي (UI Design System)' : 'UI Component Showcase'}
        subtitle={
          lang === 'ar'
            ? 'مكتبة عناصر واجهة المستخدم المصممة طبق الأصل لهوية النظام مع دعم الوضعين العربي والإنجليزية'
            : 'Reusable UI primitives matching design tokens and responsive architecture'
        }
        badge={
          <Badge variant="purple" size="md" dot>
            v1.0.0 Ready
          </Badge>
        }
        actions={
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            🚀 {lang === 'ar' ? 'تجربة النافذة المنبثقة (Modal)' : 'Open Demo Modal'}
          </Button>
        }
      />

      {/* ── Section 1: Alerts ── */}
      <Card>
        <Card.Header title={lang === 'ar' ? '1. التنبيهات والإشعارات (Alerts)' : '1. Alerts'} />
        <Card.Body>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Alert variant="info" title="معلومات النظام" dismissible>
              تمت مزامنة جميع مكونات النظام مع معايير AITU والخرسانة المصرية الألمانية.
            </Alert>
            <Alert variant="success" title="تم بنجاح" dismissible>
              تم حفظ التعديلات وإرسال التذكرة بنجاح إلى فريق الدعم.
            </Alert>
            <Alert variant="warning" title="تنبيه هام" dismissible>
              تجاوز وقت الاستجابة المحدد في اتفاقية مستوى الخدمة (SLA).
            </Alert>
            <Alert variant="error" title="خطأ في الاتصال" dismissible>
              تعذر الاتصال بقاعدة البيانات، يرجى المحاولة لاحقاً.
            </Alert>
          </div>
        </Card.Body>
      </Card>

      {/* ── Section 2: Buttons ── */}
      <Card>
        <Card.Header title={lang === 'ar' ? '2. الأزرار (Buttons)' : '2. Buttons'} />
        <Card.Body>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '8px' }}>
                {lang === 'ar' ? 'الأنماط (Variants):' : 'Variants:'}
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="success">Success</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="primary" loading>Loading</Button>
                <Button variant="primary" disabled>Disabled</Button>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '8px' }}>
                {lang === 'ar' ? 'الأحجام والأيقونات (Sizes & Icons):' : 'Sizes & Icons:'}
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Button variant="primary" size="sm">Small (32px)</Button>
                <Button variant="primary" size="md">Medium (40px)</Button>
                <Button variant="primary" size="lg">Large (48px)</Button>
                <Button variant="outline" icon={<span>⭐</span>}>With Icon</Button>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* ── Section 3: Form Inputs & Selects ── */}
      <Card>
        <Card.Header title={lang === 'ar' ? '3. حقول الإدخال والقوائم المنسدلة (Inputs & Selects)' : '3. Inputs & Selects'} />
        <Card.Body>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
            <Input
              label={lang === 'ar' ? 'حقل نصي عادي' : 'Standard Text Input'}
              placeholder="اكتب هنا..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              hint="توضيح للمستخدم"
            />

            <Input
              label={lang === 'ar' ? 'كلمة المرور مع زر إظهار/إخفاء' : 'Password Input'}
              type="password"
              placeholder="••••••••"
              value={inputPass}
              onChange={(e) => setInputPass(e.target.value)}
              showText={lang === 'ar' ? 'إظهار' : 'Show'}
              hideText={lang === 'ar' ? 'إخفاء' : 'Hide'}
              required
            />

            <Input
              label={lang === 'ar' ? 'حقل بحالة خطأ' : 'Input with Error'}
              value="بريد خاطئ"
              error={lang === 'ar' ? 'يرجى إدخال عنوان بريد إلكتروني صالح' : 'Invalid email address'}
            />

            <Select
              label={lang === 'ar' ? 'قائمة منسدلة مخصصة' : 'Custom Select Dropdown'}
              value={selectVal}
              onChange={(e) => setSelectVal(e.target.value)}
              options={[
                { value: 'option1', label: 'الخيار الأول (محطة برج العرب)' },
                { value: 'option2', label: 'الخيار الثاني (محطة أكتوبر)' },
                { value: 'option3', label: 'الخيار الثالث (محطة السادات)' },
              ]}
            />
          </div>

          <div style={{ marginTop: '18px' }}>
            <Textarea
              label={lang === 'ar' ? 'حقل نصي متعدد الأسطر (Textarea)' : 'Textarea Input'}
              placeholder="اكتب تفاصيل إضافية..."
              value={textareaVal}
              onChange={(e) => setTextareaVal(e.target.value)}
              rows={3}
              maxLength={200}
              showCount
            />
          </div>
        </Card.Body>
      </Card>

      {/* ── Section 4: Toggles & Checkboxes ── */}
      <Card>
        <Card.Header title={lang === 'ar' ? '4. مفاتيح التبديل وصناديق الاختيار (Toggles & Checkboxes)' : '4. Toggles & Checkboxes'} />
        <Card.Body>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>مفاتيح التبديل (Toggles):</div>
              <Toggle
                checked={toggleState1}
                onChange={setToggleState1}
                label="تفعيل الإشعارات الفورية"
                description="إرسال تنبيهات لحظية عند تحديث التذكرة"
              />
              <Toggle
                checked={toggleState2}
                onChange={setToggleState2}
                label="الوضع الليلي التلقائي"
                description="تحويل واجهة النظام تلقائياً حسب توقيت الجهاز"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>صناديق الاختيار (Checkboxes):</div>
              <Checkbox
                checked={checkboxState1}
                onChange={setCheckboxState1}
                label="الموافقة على شروط الاستخدام"
                description="تطبيق سياسة حماية بيانات الشركة"
              />
              <Checkbox
                checked={checkboxState2}
                onChange={setCheckboxState2}
                label="تثبيت التذكرة في أعلى القائمة"
              />
              <Checkbox
                indeterminate
                label="تحديد جزئي للبنود (Indeterminate)"
              />
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* ── Section 5: Date & Time Pickers ── */}
      <Card>
        <Card.Header title={lang === 'ar' ? '5. منتقي التاريخ والوقت (Date & Time Pickers)' : '5. Date & Time'} />
        <Card.Body>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <DateInput
              label={lang === 'ar' ? 'اختيار التاريخ' : 'Date Input'}
              value={dateVal}
              onChange={(e) => setDateVal(e.target.value)}
            />

            <TimeInput
              label={lang === 'ar' ? 'اختيار التوقيت' : 'Time Input'}
              value={timeVal}
              onChange={(e) => setTimeVal(e.target.value)}
            />

            <div style={{ gridColumn: '1 / -1' }}>
              <DateTimeRangePicker
                fromLabel={lang === 'ar' ? 'من تاريخ' : 'From Date'}
                toLabel={lang === 'ar' ? 'إلى تاريخ' : 'To Date'}
                fromDate={fromDate}
                toDate={toDate}
                onFromChange={(e) => setFromDate(e.target.value)}
                onToChange={(e) => setToDate(e.target.value)}
              />
            </div>

            {/*
              DateRangePicker — the single calendar-popover range picker used
              on the Logs page filter bar. Different component from
              DateTimeRangePicker above (which is two separate date inputs);
              use THIS one for any new "filter by date range" UI so every
              page stays visually consistent with Logs.
            */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#475569',
                  marginBottom: '8px',
                }}
              >
                {lang === 'ar'
                  ? 'منتقي نطاق التاريخ (تقويم منبثق) — المستخدم في صفحة السجلات'
                  : 'Date Range Picker (calendar popover) — used on the Logs page'}
              </label>
              <DateRangePicker
                startDate={calendarRangeStart}
                endDate={calendarRangeEnd}
                onChange={({ start, end }) => {
                  setCalendarRangeStart(start);
                  setCalendarRangeEnd(end);
                }}
                lang={lang}
                placeholder={lang === 'ar' ? 'اختر الفترة الزمنية' : 'Select date range'}
              />
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* ── Section 6: Badges & Avatars & Spinners ── */}
      <Card>
        <Card.Header title={lang === 'ar' ? '6. الشارات والصور الرمزية (Badges, Avatars & Spinners)' : '6. Badges & Avatars'} />
        <Card.Body>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '8px' }}>
                شارات الحالة (Badges):
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Badge variant="green" dot>مقبول / ناجح</Badge>
                <Badge variant="blue" dot>قيد التنفيذ</Badge>
                <Badge variant="amber" dot>معلق / قيد الانتظار</Badge>
                <Badge variant="red" dot>مرفوض / حرج</Badge>
                <Badge variant="purple" dot>مخصص</Badge>
                <Badge variant="gray">مغلق</Badge>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '8px' }}>
                الصور الرمزية (Avatars):
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Avatar name="أحمد حسني" size="sm" status="online" />
                <Avatar name="سارة مجدي" size="md" status="away" />
                <Avatar name="خالد كمال" size="lg" status="busy" />
                <Avatar name="عمرو فؤاد" size="xl" status="offline" />
              </div>
            </div>

            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '8px' }}>
                مؤشرات التحميل (Spinners):
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <Spinner size="sm" />
                <Spinner size="md" color="#16A34A" />
                <Spinner size="lg" color="#DC2626" />
                <Spinner size="xl" color="#6B21A8" />
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* ── Section 7: StatCards ── */}
      <div>
        <div style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', marginBottom: '12px' }}>
          7. بطاقات الإحصائيات (StatCards)
        </div>
        <div className="stats-grid">
          <StatCard
            label="إجمالي الأسطول"
            value="48"
            icon="🚚"
            color="blue"
            trend={{ value: '5%', isPositive: true }}
            note="سيارات خلاطة ومضخات"
          />
          <StatCard
            label="الخرسانة الموردة اليوم"
            value="1,240 م³"
            icon="🏗️"
            color="green"
            trend={{ value: '14%', isPositive: true }}
            note="عبر 4 محطات مركزية"
          />
          <StatCard
            label="تذاكر الصيانة الدورية"
            value="7"
            icon="🔧"
            color="amber"
            note="تحت الفحص الفني"
          />
          <StatCard
            label="أعطال مفاجئة متوقفة"
            value="0"
            icon="🛡️"
            color="purple"
            note="كل المحطات تعمل بكفاءة"
          />
        </div>
      </div>

      {/* ── Section 8: Responsive Table & FilterBar ── */}
      <Card>
        <Card.Header title={lang === 'ar' ? '8. شريط الفلترة والجداول (FilterBar & Table)' : '8. FilterBar & Table'} />
        <Card.Body>
          <FilterBar>
            <div style={{ flex: '1 1 200px' }}>
              <Input placeholder="بحث سريع في المعدات..." />
            </div>
            <div style={{ width: '160px' }}>
              <Select
                value="all"
                options={[
                  { value: 'all', label: 'كل الحالات' },
                  { value: 'active', label: 'نشط' },
                  { value: 'maintenance', label: 'تحت الصيانة' },
                ]}
              />
            </div>
            <Button variant="secondary">فلترة</Button>
          </FilterBar>

          <Table
            columns={[
              { key: 'code', title: 'كود المعدة' },
              { key: 'name', title: 'بيان المعدة والنوع', align: 'start' },
              {
                key: 'status',
                title: 'الحالة',
                render: (val) => (
                  <Badge variant={val === 'نشط' ? 'green' : 'amber'} dot>
                    {val}
                  </Badge>
                ),
              },
              { key: 'driver', title: 'المشرف / السائق' },
            ]}
            data={demoTableData}
          />
        </Card.Body>
      </Card>

      {/* Demo Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="نافذة تفاعلية منبثقة (Modal Dialog)"
        subtitle="مكون معياري مع إغلاق بالزر أو بالنقر بالخلفية أو بمفتاح ESC"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              إغلاق
            </Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>
              تأكيد العملية
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Alert variant="info">
            هذه نافذة تجريبية لعرض تكامل المكونات مع حقول الإدخال والأزرار.
          </Alert>
          <Input label="اسم البند أو التذكرة" placeholder="أدخل اسماً للتأكيد..." />
          <Toggle label="تأكيد تطبيق التغييرات فوراً" checked={true} onChange={() => {}} />
        </div>
      </Modal>
    </div>
  );
}
