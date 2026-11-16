-- 009 (2026-11-16): new sections (aluminium, plumbing supplies, UKINOX sinks), UKINOX brand logo,
-- supplier portal logins, supply orders (أوامر التوريد) and email + WhatsApp alerts to suppliers.
-- Safe to run more than once.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_net;

-- ========== 1. website sections ==========
insert into public.categories (slug, custom, hidden, parent, sort, menu, icon, nav_ar, nav_en, h1_ar, h1_en, title_ar, title_en, desc_ar, desc_en, lead_ar, lead_en, body_ar, body_en, updated_at)
values
('aluminium', true, false, null, 6, true, 'door',
 'ألوميتال', 'Aluminium windows & doors',
 'توريد وتركيب ألوميتال — شبابيك وأبواب وواجهات ألومنيوم',
 'Aluminium windows, doors and glass facades — supply and installation',
 'ألوميتال للمشروعات | شبابيك وأبواب ألومنيوم جرار ومفصلي — كي بلس',
 'Aluminium windows & doors for projects in Egypt | K Plus',
 'توريد وتركيب ألوميتال للشقق والمشروعات: شبابيك جرار ومفصلي، أبواب ألومنيوم، واجهات زجاج وكرتن وول، بقطاعات وألوان متعددة. اطلب عرض سعر.',
 'Aluminium sliding and casement windows, doors, glass facades and office partitions, supplied and installed for apartments and projects across Egypt.',
 'بنورّد ونركّب شبابيك وأبواب ألوميتال للشقق والفيلات والمباني الإدارية والمشروعات السكنية، بقطاعات ألومنيوم متعددة وألوان إلكتروستاتيك وخشبي، وزجاج سادة أو دبل جلاس أو سيكوريت.',
 'Aluminium windows and doors for apartments, villas, offices and housing projects: several profile systems, powder-coated and wood-effect colours, single, double or tempered glass.',
 E'# أنواع الألوميتال اللي بنوردها\nشبابيك جرار (سحاب) بضلفتين أو ثلاث ضلف، شبابيك مفصلي وقلاب، أبواب بلكونة وأبواب مداخل ألومنيوم، واجهات زجاج وكرتن وول للمباني الإدارية والتجارية، وقواطيع ألومنيوم للمكاتب.\n\n# القطاعات والزجاج\nبنختار تخانة القطاع حسب المقاس والدور ومكان التركيب، مع زجاج سادة أو ملون أو عاكس أو دبل جلاس لعزل الصوت والحرارة، وسلك مانع للناموس وإكسسوارات وكوالين.\n\n# توريد وتركيب للمشروعات\nبناخد المقاسات من الموقع، ونجهز جدول كميات وعرض سعر لكل نموذج، والتصنيع والتركيب بيتم على مراحل حسب برنامج التشطيب، مع أسعار خاصة للمقاولين والمطورين العقاريين.\n\n# اطلب عرض سعر\nابعتلنا عدد الشبابيك والأبواب والمقاسات التقريبية ونوع القطاع واللون، وهنرد عليك بعرض سعر في أسرع وقت.',
 E'# What we supply\nSliding and casement windows, balcony and entrance doors, glass facades and curtain walls, and aluminium office partitions.\n\n# Supply and installation for projects\nSite measurements, a bill of quantities per window type, and fabrication and installation phased with the finishing programme. Wholesale prices for contractors and developers.',
 now()),
('plumbing', true, false, null, 7, true, 'bath',
 'لوازم صحية وسباكة', 'Plumbing supplies',
 'توريد لوازم صحية ومواسير سباكة بالجملة للمشروعات',
 'Plumbing supplies and pipes, wholesale for projects',
 'لوازم صحية بالجملة | مواسير PPR وصرف وخلاطات ومحابس — كي بلس',
 'Wholesale plumbing supplies: PPR and uPVC pipes, valves, mixers | K Plus',
 'توريد لوازم صحية وسباكة بالجملة للمقاولين: مواسير تغذية PPR، مواسير صرف uPVC، وصلات ومحابس، خلاطات، وأحواض مطبخ استانلس UKINOX. اطلب عرض سعر.',
 'Wholesale plumbing supplies for contractors in Egypt: PPR water pipes, uPVC drainage, fittings and valves, mixers and UKINOX stainless steel sinks.',
 'كل اللي تحتاجه أعمال السباكة في مشروعك من مكان واحد: مواسير التغذية والصرف، الوصلات والمحابس، الخلاطات والإكسسوارات، وأحواض المطابخ الاستانلس، بأسعار جملة وتوريد للموقع.',
 'Everything the plumbing works of a project need from one supplier: water and drainage pipes, fittings and valves, mixers, accessories and stainless steel kitchen sinks, delivered to site.',
 E'# لوازم التغذية\nمواسير ووصلات PPR للمياه الباردة والساخنة بأقطار مختلفة، محابس زاوية ومحابس رئيسية، وجلب ووصلات مرنة.\n\n# لوازم الصرف\nمواسير صرف uPVC بأقطار مختلفة مع الأكواع والمشتركات، صفايات أرضية وجريلات، وكل قطع الصرف للحمامات والمطابخ.\n\n# خلاطات وأحواض وإكسسوارات\nخلاطات حوض ودش ومطبخ، أحواض مطبخ استانلس ستيل UKINOX، وإكسسوارات الحمامات. ولأطقم الحمامات بنورد إيديال ستاندرد الأصلية.\n\n# توريد للمشروعات\nبنجهز قائمة كميات لكل وحدة حسب الرسومات، ونورد على مراحل حسب برنامج التنفيذ، مع أسعار خاصة للكميات وتوصيل للموقع.',
 E'# Supply for projects\nPPR water pipes and fittings, uPVC drainage pipes, valves, floor drains, mixers and UKINOX stainless steel sinks. Quantities per unit from your drawings, phased deliveries and wholesale prices.',
 now()),
('plumbing/ukinox-sinks', true, false, 'plumbing', 10, true, 'bath',
 'أحواض مطبخ استانلس UKINOX', 'UKINOX stainless steel sinks',
 'أحواض مطبخ استانلس ستيل UKINOX — توريد بالجملة',
 'UKINOX stainless steel kitchen sinks — wholesale supply',
 'أحواض مطبخ استانلس UKINOX | أسعار أحواض استانلس ستيل — كي بلس',
 'UKINOX stainless steel kitchen sinks in Egypt | K Plus',
 'توريد أحواض مطابخ استانلس ستيل UKINOX (يو كي إينوكس) بالجملة للمشروعات ومعارض المطابخ: حوض واحد وحوضين وبجناح، بمقاسات متعددة. اطلب عرض سعر.',
 'UKINOX stainless steel kitchen sinks, wholesale for housing projects, contractors and kitchen showrooms: single bowl, double bowl and with drainer.',
 'بنورّد أحواض المطابخ الاستانلس ستيل من UKINOX للمشروعات السكنية والمقاولين ومعارض المطابخ، بموديلات ومقاسات متعددة: حوض واحد، حوضين، وحوض بجناح للتصفية، مع الإكسسوارات.',
 'UKINOX stainless steel kitchen sinks for housing projects, contractors and kitchen showrooms: single bowl, double bowl and sinks with a drainer, plus accessories.',
 E'# ليه أحواض UKINOX؟\nأحواض استانلس ستيل سهلة التنظيف وبتستحمل الاستخدام اليومي، بتشطيبات تناسب المطابخ الحديثة.\n\n# الموديلات\nحوض واحد، حوضين، وحوض بجناح (مصفاة)، بمقاسات مختلفة حسب مساحة الرخامة، مع السيفون والإكسسوارات.\n\n# توريد للمشروعات والمعارض\nأسعار جملة للمطورين العقاريين والمقاولين ومعارض المطابخ، وتوريد حسب برنامج التشطيب.\n\n# اطلب عرض سعر\nابعت الموديل والعدد المطلوب أو مقاس الرخامة، وهنبعتلك الأسعار والموديلات المتاحة.',
 E'# Models\nSingle bowl, double bowl and sinks with a drainer in several sizes, with waste kits and accessories. Wholesale prices for developers, contractors and kitchen showrooms.',
 now()),
('plumbing/albedo-sinks', true, false, 'plumbing', 20, true, 'bath',
 'أحواض مطبخ استانلس Albedo', 'Albedo stainless steel sinks',
 'أحواض مطبخ استانلس ستيل 304 Albedo — حوض واحد وحوضين',
 'Albedo 304 stainless steel kitchen sinks — single and double bowl',
 'أحواض مطبخ Albedo استانلس 304 | موديلات HM و HMT و HML — كي بلس',
 'Albedo 304 stainless steel kitchen sinks: HM, HMT and HML models | K Plus',
 'أحواض مطابخ Albedo استانلس ستيل 304 بسمك 0.8 × 2.5 مم وعمق 215 مم: حوض واحد وحوضين وبمكان خلاط، تركيب فلش وسليم توب وتحت الرخام. اطلب عرض سعر.',
 'Albedo 304 stainless steel kitchen sinks, 0.8 × 2.5 mm, 215 mm deep: single bowl, double bowl and tap-deck models for flush, slim-top or undermount fitting.',
 'بنورّد أحواض مطابخ Albedo من الاستانلس ستيل 304 بتشطيب HL، بسمك 0.8 مم و2.5 مم للحافة وعمق 215 مم، في 12 موديل: حوض واحد (HM)، حوض واحد بمكان خلاط (HMT)، وحوضين (HML).',
 'Albedo kitchen sinks in 304 stainless steel with HL finish, 0.8 mm body and 2.5 mm rim, 215 mm deep, in 12 models: single bowl (HM), single bowl with tap deck (HMT) and double bowl (HML).',
 E'# مواصفات أحواض Albedo\nخامة استانلس ستيل 304، سمك 0.8 مم للجسم و2.5 مم للحافة، عمق الحوض 215 مم، تشطيب HL، زوايا داخلية R10، ومخرج صرف 3 بوصة.\n\n# الموديلات والمقاسات\nحوض واحد HM بعروض 550 و600 و700 و750 و800 مم، حوض واحد بمكان خلاط HMT بنفس العروض، وحوضين HML 700 و HML 775.\n\n# طرق التركيب\nكل الموديلات بتتركب فلش (Flush mount) أو سليم توب (Slim top) أو تحت الرخام (Under mount)، فتناسب رخام وكوارتز وجرانيت المطابخ الحديثة.\n\n# توريد للمشروعات والمعارض\nأسعار جملة للمطورين والمقاولين ومعارض المطابخ. ابعت الموديل والعدد وهنبعتلك عرض السعر.',
 E'# Specifications\n304 stainless steel, 0.8 mm body and 2.5 mm rim, 215 mm bowl depth, HL finish, R10 corners, 3-inch waste.\n\n# Models\nHM single bowl and HMT tap-deck models in 550, 600, 700, 750 and 800 mm, and HML 700 and HML 775 double bowls, for flush, slim-top or undermount fitting.',
 now()),
('plumbing/quartz', true, false, 'plumbing', 30, true, 'bath',
 'لوازم صحية Quartz', 'Quartz sanitary fittings',
 'لوازم صحية Quartz — محابس وصفايات وسيفونات ووصلات نحاس',
 'Quartz sanitary fittings — valves, drains, siphons and brass fittings',
 'لوازم صحية Quartz | محابس زاوية وصفايات دش وسيفونات وخراطيم — كي بلس',
 'Quartz sanitary fittings: angle valves, shower drains, siphons, hoses | K Plus',
 'توريد لوازم صحية Quartz المصرية بالجملة: محابس زاوية وغسالة، شطافات، سيفونات، صفايات دش طولية وأرضية، بلوف بانيو، وصلات نحاس وخراطيم مرنة. اطلب عرض سعر.',
 'Quartz sanitary fittings, Egyptian made: angle and washing-machine valves, hand sprayers, siphons, linear and floor drains, bathtub drains, brass fittings and flexible hoses.',
 'بنورّد منتجات Quartz للأدوات الصحية (صناعة مصرية من نحاس عالي الجودة) للمقاولين والمشروعات: محابس، شطافات، سيفونات، صفايات، بلوف بانيو، وصلات نحاس، خراطيم ووردات استانلس.',
 'Quartz sanitary fittings, made in Egypt from quality brass, for contractors and projects: valves, hand sprayers, siphons, drains, bathtub wastes, brass fittings, hoses and stainless cover plates.',
 E'# المحابس\nمحابس زاوية بأنواع مختلفة، محابس غسالة، ومحابس خدمة نحاس (هوز بيب) للحدائق والأماكن الخارجية.\n\n# الصفايات والسيفونات\nصفايات دش طولية استانلس بمقاسات متعددة، صفايات أرضية استانلس 15×15 عادي وبوب أب، بلوف وصفايات بانيو، وسيفونات نحاس كروم وبلاستيك للأحواض.\n\n# الوصلات والخراطيم\nوصلات نحاس (نبل، جلب تحويل، أكواع، طبات)، خراطيم مرنة استانلس بأطوال من 20 لـ 80 سم، شطافات بخرطوم 120 سم، ووردات استانلس.\n\n# توريد للمشروعات\nابعت قائمة الأصناف بالأكواد من الكتالوج والكميات، وهنبعتلك عرض السعر ونورد على مراحل حسب التنفيذ.',
 E'# Range\nAngle, washing-machine and brass service valves; stainless linear and floor drains; bathtub wastes; brass and plastic siphons; brass fittings; stainless flexible hoses 20–80 cm; hand sprayers and stainless cover plates. Send item codes and quantities for a quote.',
 now()),
('doors/accessories', true, false, 'doors', 50, true, 'door',
 'إكسسوارات الأبواب', 'Door hardware & accessories',
 'إكسسوارات الأبواب — كوالين وسلندرات AFM وأوكر ومفصلات',
 'Door hardware — AFM locks and cylinders, handles and hinges',
 'إكسسوارات أبواب بالجملة | كوالين وسلندرات AFM من الأهرام لنظم الأمان — كي بلس',
 'Door hardware wholesale: AFM locks and cylinders by Ahram Security | K Plus',
 'توريد إكسسوارات الأبواب بالجملة للمشروعات: كوالين AFM من الأهرام لنظم الأمان (خارجي وداخلي ومتعدد النقاط)، سلندرات، أوكر، مفصلات وماسكات أبواب. اطلب عرض سعر.',
 'Door hardware for projects in Egypt: AFM mortise, multipoint and rim locks and euro cylinders by Ahram Security Group, plus handles, hinges and door closers.',
 'بنورّد كل إكسسوارات الأبواب للمشروعات من مكان واحد: كوالين وسلندرات AFM من الأهرام لنظم الأمان، أوكر ومقابض، مفصلات، ماسكات ومصدات أبواب، للأبواب الخشب والحديد والمصفحة والمقاومة للحريق.',
 'All the door hardware a project needs from one supplier: AFM locks and cylinders by Ahram Security Group, handles, hinges, closers and stoppers for wooden, steel, security and fire-rated doors.',
 E'# كوالين AFM من الأهرام لنظم الأمان\nبنورّد كوالين AFM (مجموعة الأهرام لنظم الأمان): كوالين مورتيز للأبواب الخارجية، كوالين داخلية للغرف والحمامات، كوالين متعددة النقاط (Multipoint) للأبواب المصفحة، وكوالين تركيب خارجي (Rim Lock).\n\n# سلندرات (كوالين أسطوانية)\nسلندرات AFM بروفايل أوروبي بأطوال مختلفة، بمفتاح عادي أو كمبيوتر، ومنها أنواع بزرار من الداخل وأنواع ضد التخريم، مع إمكانية نظام ماستر كي للمشروعات.\n\n# أوكر ومفصلات وماسكات\nأوكر ومقابض بتشطيبات مختلفة، مفصلات أبواب، ماسكات أبواب (Door Closer) ومصدات أرضية وحائط، تناسب أبواب الشقق والفنادق والمستشفيات والمباني الإدارية.\n\n# توريد للمشروعات\nبنجهز جدول إكسسوارات لكل نوع باب مع الأبواب نفسها، ونورد على مراحل حسب برنامج التشطيب، بأسعار جملة للمقاولين والمطورين.',
 E'# AFM locks by Ahram Security Group\nMortise locks for external and internal doors, multipoint locks for security doors, rim locks and euro-profile cylinders with conventional or computer keys and master-key options.\n\n# Handles, hinges and closers\nHandles, hinges, door closers and stoppers, scheduled per door type and supplied with the doors at wholesale prices.',
 now())
on conflict (slug) do update set
  custom = excluded.custom, parent = excluded.parent, sort = excluded.sort, menu = excluded.menu, icon = excluded.icon,
  nav_ar = excluded.nav_ar, nav_en = excluded.nav_en, h1_ar = excluded.h1_ar, h1_en = excluded.h1_en,
  title_ar = excluded.title_ar, title_en = excluded.title_en, desc_ar = excluded.desc_ar, desc_en = excluded.desc_en,
  lead_ar = excluded.lead_ar, lead_en = excluded.lead_en, body_ar = excluded.body_ar, body_en = excluded.body_en, updated_at = now();

-- starter products (only when the section has none yet; edit them in /admin/products/)
insert into public.products (category, name_ar, name_en, spec_ar, spec_en, unit_ar, unit_en, sort)
select v.* from (values
  ('aluminium', 'شبابيك ألوميتال جرار', 'Aluminium sliding windows', 'ضلفتين أو 3 ضلف، قطاعات وألوان متعددة', '2 or 3 sashes, several profiles and colours', 'متر مربع', 'm²', 10),
  ('aluminium', 'شبابيك مفصلي وقلاب', 'Casement and tilt windows', 'فتح للداخل أو قلاب للتهوية', 'Inward opening or tilt', 'متر مربع', 'm²', 20),
  ('aluminium', 'أبواب بلكونة ومداخل ألومنيوم', 'Aluminium balcony and entrance doors', 'جرار أو مفصلي مع زجاج', 'Sliding or hinged, glazed', 'متر مربع', 'm²', 30),
  ('aluminium', 'واجهات زجاج وكرتن وول', 'Glass facades and curtain walls', 'للمباني الإدارية والتجارية', 'For office and commercial buildings', 'متر مربع', 'm²', 40),
  ('aluminium', 'قواطيع ألومنيوم للمكاتب', 'Aluminium office partitions', 'زجاج سادة أو فروستد', 'Clear or frosted glass', 'متر مربع', 'm²', 50),
  ('aluminium', 'سلك ناموس وإكسسوارات', 'Insect screens and accessories', 'ثابت أو متحرك', 'Fixed or sliding', 'متر مربع', 'm²', 60),
  ('plumbing', 'مواسير ووصلات تغذية PPR', 'PPR water pipes and fittings', 'للمياه الباردة والساخنة، أقطار مختلفة', 'Hot and cold water, several diameters', 'متر / قطعة', 'm / pc', 10),
  ('plumbing', 'مواسير صرف uPVC ووصلاتها', 'uPVC drainage pipes and fittings', 'أكواع ومشتركات وجلب، أقطار مختلفة', 'Elbows, tees and couplings, several diameters', 'متر / قطعة', 'm / pc', 20),
  ('plumbing', 'محابس زاوية ومحابس رئيسية', 'Angle and main valves', 'موديلات ومقاسات متعددة', 'Several models and sizes', 'قطعة', 'pc', 30),
  ('plumbing', 'خلاطات حوض ودش ومطبخ', 'Basin, shower and kitchen mixers', 'موديلات متعددة', 'Several models', 'قطعة', 'pc', 40),
  ('plumbing', 'صفايات أرضية وجريلات', 'Floor drains and gratings', 'مقاسات متعددة', 'Several sizes', 'قطعة', 'pc', 50),
  ('plumbing', 'أحواض مطبخ استانلس UKINOX', 'UKINOX stainless steel sinks', 'حوض واحد وحوضين وبجناح', 'Single, double and with drainer', 'قطعة', 'pc', 60),
  ('plumbing/ukinox-sinks', 'حوض مطبخ UKINOX حوض واحد', 'UKINOX single bowl sink', 'استانلس ستيل، مقاسات متعددة', 'Stainless steel, several sizes', 'قطعة', 'pc', 10),
  ('plumbing/ukinox-sinks', 'حوض مطبخ UKINOX حوضين', 'UKINOX double bowl sink', 'استانلس ستيل، مقاسات متعددة', 'Stainless steel, several sizes', 'قطعة', 'pc', 20),
  ('plumbing/ukinox-sinks', 'حوض مطبخ UKINOX بجناح (مصفاة)', 'UKINOX sink with drainer', 'استانلس ستيل، حسب الموديل', 'Stainless steel, by model', 'قطعة', 'pc', 30),
  ('plumbing/ukinox-sinks', 'إكسسوارات الأحواض', 'Sink accessories', 'سيفون وسلة تصفية', 'Waste kit and strainer basket', 'قطعة', 'pc', 40),
  ('plumbing/albedo-sinks', 'حوض Albedo حوض واحد HM (550 – 800 مم)', 'Albedo HM single bowl sink (550–800 mm)', 'استانلس 304، 0.8 × 2.5 مم، عمق 215 مم، HL', '304 stainless, 0.8 × 2.5 mm, 215 mm deep, HL', 'قطعة', 'pc', 10),
  ('plumbing/albedo-sinks', 'حوض Albedo بمكان خلاط HMT (550 – 800 مم)', 'Albedo HMT tap-deck sink (550–800 mm)', 'استانلس 304، 0.8 × 2.5 مم، عمق 215 مم، HL', '304 stainless, 0.8 × 2.5 mm, 215 mm deep, HL', 'قطعة', 'pc', 20),
  ('plumbing/albedo-sinks', 'حوض Albedo حوضين HML 700 / HML 775', 'Albedo HML 700 / 775 double bowl sink', 'استانلس 304، عمق 215 مم، فلش أو سليم توب أو تحت الرخام', '304 stainless, 215 mm deep, flush, slim-top or undermount', 'قطعة', 'pc', 30),
  ('plumbing/quartz', 'محابس زاوية Quartz', 'Quartz angle valves', 'نحاس كروم، أنواع ومقاسات متعددة', 'Chrome brass, several types and sizes', 'قطعة', 'pc', 10),
  ('plumbing/quartz', 'محابس غسالة Quartz', 'Quartz washing-machine valves', 'نحاس كروم', 'Chrome brass', 'قطعة', 'pc', 20),
  ('plumbing/quartz', 'محبس خدمة نحاس (هوز بيب) Quartz', 'Quartz brass service valve (hose bib)', 'للأماكن الخارجية', 'For outdoor use', 'قطعة', 'pc', 30),
  ('plumbing/quartz', 'شطافات Quartz', 'Quartz hand sprayers', 'كروم أو أبيض، خرطوم 120 سم', 'Chrome or white, 120 cm hose', 'قطعة', 'pc', 40),
  ('plumbing/quartz', 'سيفونات Quartz', 'Quartz siphons and bottle traps', 'نحاس كروم أو بلاستيك 1¼ بوصة', 'Chrome brass or plastic, 1¼ inch', 'قطعة', 'pc', 50),
  ('plumbing/quartz', 'صفايات دش طولية Quartz', 'Quartz linear shower drains', 'استانلس، مقاسات متعددة', 'Stainless steel, several lengths', 'قطعة', 'pc', 60),
  ('plumbing/quartz', 'صفايات أرضية Quartz', 'Quartz floor drains', 'استانلس 15×15، عادي وبوب أب', 'Stainless 15×15, standard and pop-up', 'قطعة', 'pc', 70),
  ('plumbing/quartz', 'بلوف وصفايات بانيو Quartz', 'Quartz bathtub drains', 'بوب أب وبفائض', 'Pop-up and with overflow', 'قطعة', 'pc', 80),
  ('plumbing/quartz', 'وصلات وأكواع نحاس Quartz', 'Quartz brass fittings', 'نبل، جلب تحويل، أكواع، طبات', 'Nipples, reducers, elbows, caps', 'قطعة', 'pc', 90),
  ('plumbing/quartz', 'خراطيم مرنة استانلس Quartz', 'Quartz stainless flexible hoses', 'أطوال من 20 لـ 80 سم', 'Lengths 20 to 80 cm', 'قطعة', 'pc', 100),
  ('plumbing/quartz', 'وردات استانلس Quartz', 'Quartz stainless cover plates', '3 و5 و7 و8 سم', '3, 5, 7 and 8 cm', 'قطعة', 'pc', 110),
  ('doors/accessories', 'كالون مورتيز خارجي AFM', 'AFM external mortise lock', 'للأبواب الخارجية، سنتر 72 و85 مم حسب الموديل', 'External doors, 72 or 85 mm centres by model', 'قطعة', 'pc', 10),
  ('doors/accessories', 'كالون داخلي AFM للغرف والحمامات', 'AFM internal mortise lock', 'كالون غرف وكالون حمام', 'Room and bathroom locks', 'قطعة', 'pc', 20),
  ('doors/accessories', 'كالون متعدد النقاط AFM (Multipoint)', 'AFM multipoint lock', 'للأبواب المصفحة والمداخل', 'For security and entrance doors', 'قطعة', 'pc', 30),
  ('doors/accessories', 'سلندر AFM بروفايل أوروبي', 'AFM euro-profile cylinder', 'مفتاح عادي أو كمبيوتر، بزرار أو مفتاحين', 'Conventional or computer key, thumb-turn or key/key', 'قطعة', 'pc', 40),
  ('doors/accessories', 'كالون تركيب خارجي AFM (Rim Lock)', 'AFM rim lock', 'مفتاح كمبيوتر', 'Computer key', 'قطعة', 'pc', 50),
  ('doors/accessories', 'أوكر ومقابض أبواب', 'Door handles', 'تشطيبات وموديلات متعددة', 'Several finishes and models', 'طقم', 'set', 60),
  ('doors/accessories', 'مفصلات أبواب', 'Door hinges', 'مقاسات متعددة', 'Several sizes', 'قطعة', 'pc', 70),
  ('doors/accessories', 'ماسكات أبواب ومصدات', 'Door closers and stoppers', 'ماسك علوي ومصد أرضي أو حائط', 'Overhead closers, floor and wall stoppers', 'قطعة', 'pc', 80)
) as v(category, name_ar, name_en, spec_ar, spec_en, unit_ar, unit_en, sort)
where not exists (select 1 from public.products p where p.category = v.category);

-- ========== 2. UKINOX in "وكلاء وموزعون" ==========
insert into public.partners (kind, name_ar, name_en, logo_url, sort, active)
select 'brand', 'يو كي إينوكس — أحواض استانلس ستيل', 'UKINOX stainless steel sinks', '/assets/partners/ukinox.webp?v=2', 100, true
where not exists (select 1 from public.partners where name_en ilike 'UKINOX%');
insert into public.partners (kind, name_ar, name_en, logo_url, sort, active)
select 'brand', 'الأهرام لنظم الأمان — كوالين AFM', 'AFM locks — Ahram Security Group', '/assets/partners/afm.webp?v=2', 110, true
where not exists (select 1 from public.partners where name_en ilike 'AFM%');
insert into public.partners (kind, name_ar, name_en, logo_url, sort, active)
select 'brand', 'كوارتز للأدوات الصحية', 'Quartz Sanitary Ware', '/assets/partners/quartz.webp?v=2', 120, true
where not exists (select 1 from public.partners where name_en ilike 'Quartz%');
insert into public.suppliers (company_name, categories, products, status, internal_notes)
select v.* from (values
  ('Albedo — أحواض استانلس ستيل', '{plumbing}'::text[], 'أحواض مطابخ استانلس 304 موديلات HM و HMT و HML', 'approved', 'كمّل اسم المسؤول والموبايل والإيميل علشان تبعتله أوامر التوريد.'),
  ('Quartz — كوارتز للأدوات الصحية', '{plumbing}'::text[], 'محابس، شطافات، سيفونات، صفايات، وصلات نحاس، خراطيم', 'approved', 'مصنع مصري (مدينة نصر). كمّل اسم المسؤول والموبايل والإيميل علشان تبعتله أوامر التوريد.')
) as v(company_name, categories, products, status, internal_notes)
where not exists (select 1 from public.suppliers s where s.company_name = v.company_name);

-- suppliers list (admin): contact person / email to be completed by K Plus
insert into public.suppliers (company_name, categories, products, status, internal_notes)
select 'الأهرام لنظم الأمان (AFM)', '{doors}', 'كوالين مورتيز خارجي وداخلي، كوالين متعددة النقاط، سلندرات، كوالين تركيب خارجي — ماركة AFM', 'approved',
       'مجموعة الأهرام لنظم الأمان. خط ساخن 16614. كمّل اسم المسؤول والموبايل والإيميل علشان تبعتله أوامر التوريد.'
where not exists (select 1 from public.suppliers where company_name ilike '%AFM%');
insert into public.suppliers (company_name, categories, products, status, internal_notes)
select 'UKINOX — أحواض استانلس ستيل', '{plumbing}', 'أحواض مطابخ استانلس ستيل UKINOX', 'approved',
       'كمّل اسم المسؤول والموبايل والإيميل علشان تبعتله أوامر التوريد.'
where not exists (select 1 from public.suppliers where company_name ilike '%UKINOX%');

-- ========== 3. helpers ==========
create or replace function public.h(t text) returns text language sql immutable as $$
  select replace(replace(replace(coalesce(t, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;');
$$;

-- Egyptian mobile -> +20...
create or replace function public.intl_phone(p text) returns text language sql immutable as $$
  select case
    when d ~ '^01\d{9}$' then '+2' || d
    when d ~ '^201\d{9}$' then '+' || d
    when d ~ '^1\d{9}$' then '+20' || d
    when d <> '' then '+' || d
    else null end
  from (select regexp_replace(coalesce(p, ''), '\D', '', 'g') as d) x;
$$;

-- email through Brevo (default) or Resend; settings in app_settings (admin page "المستخدمين والصلاحيات")
create or replace function public.send_mail(p_to text, p_subject text, p_html text) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare prov text; k text; frm text; nm text;
begin
  select value into prov from public.app_settings where key = 'mail_provider';
  select value into k from public.app_settings where key = 'mail_apikey';
  select value into frm from public.app_settings where key = 'mail_from';
  select value into nm from public.app_settings where key = 'mail_from_name';
  nm := coalesce(nullif(nm, ''), 'كي بلس للتوريدات العمومية');
  if coalesce(k, '') = '' or coalesce(frm, '') = '' or coalesce(p_to, '') = '' then return false; end if;
  if prov = 'resend' then
    perform net.http_post(url := 'https://api.resend.com/emails',
      body := jsonb_build_object('from', nm || ' <' || frm || '>', 'to', jsonb_build_array(p_to), 'subject', p_subject, 'html', p_html),
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || k));
  else
    perform net.http_post(url := 'https://api.brevo.com/v3/smtp/email',
      body := jsonb_build_object('sender', jsonb_build_object('name', nm, 'email', frm), 'to', jsonb_build_array(jsonb_build_object('email', p_to)),
                                 'subject', p_subject, 'htmlContent', p_html),
      headers := jsonb_build_object('Content-Type', 'application/json', 'accept', 'application/json', 'api-key', k));
  end if;
  return true;
exception when others then
  raise warning 'send_mail failed: %', sqlerrm;
  return false;
end $$;

-- WhatsApp to any number that activated CallMeBot (the supplier gets his own apikey once)
create or replace function public.wa_send(p_phone text, p_key text, p_msg text) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
begin
  if coalesce(p_phone, '') = '' or coalesce(p_key, '') = '' then return false; end if;
  perform net.http_get(url := 'https://api.callmebot.com/whatsapp.php',
    params := jsonb_build_object('phone', p_phone, 'apikey', p_key, 'text', left(p_msg, 1500)));
  return true;
exception when others then
  raise warning 'wa_send failed: %', sqlerrm;
  return false;
end $$;

create or replace function public.mail_wrap(p_title text, p_body text) returns text language sql immutable as $$
  select '<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;background:#f4f6f9;padding:24px">'
      || '<div style="max-width:560px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e3e7ee">'
      || '<div style="background:#0B2545;color:#fff;padding:16px 20px;font-size:18px;font-weight:bold">كي بلس للتوريدات العمومية — K Plus</div>'
      || '<div style="padding:20px;color:#1b2430;font-size:15px;line-height:1.8"><h2 style="margin:0 0 12px;font-size:18px;color:#0B2545">' || p_title || '</h2>'
      || p_body || '</div>'
      || '<div style="padding:12px 20px;background:#f4f6f9;color:#6b7686;font-size:12px">kplussupply.com · واتساب 01028879918</div></div></div>';
$$;

-- ========== 4. suppliers: portal + WhatsApp key ==========
alter table public.suppliers add column if not exists wa_apikey text;
alter table public.suppliers add column if not exists portal_invited_at timestamptz;

-- admin creates (or resets) the supplier's login and emails him the link + email + password
create or replace function public.admin_create_supplier_login(p_supplier uuid, p_email text, p_password text) returns jsonb
language plpgsql security definer set search_path = public, extensions, auth as $$
declare s public.suppliers%rowtype; uid uuid; em text := lower(trim(coalesce(p_email, ''))); existing boolean := false; mailed boolean;
        site text := 'https://kplussupply.com';
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  if em !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'الإيميل مش صحيح'; end if;
  if char_length(coalesce(p_password, '')) < 8 then raise exception 'كلمة السر لازم 8 حروف على الأقل'; end if;
  select * into s from public.suppliers where id = p_supplier;
  if not found then raise exception 'المورد مش موجود'; end if;

  select id into uid from auth.users where lower(email) = em limit 1;
  if uid is null then
    uid := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change)
    values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', em,
      extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('account_type', 'supplier', 'full_name', s.contact_name, 'phone', s.phone, 'company', s.company_name),
      now(), now(), '', '', '', '');
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), uid, uid::text,
      jsonb_build_object('sub', uid::text, 'email', em, 'email_verified', true, 'phone_verified', false),
      'email', now(), now(), now());
  else
    existing := true;
    if exists (select 1 from public.profiles where id = uid and role in ('admin', 'sales')) then
      raise exception 'الإيميل ده تبع حساب موظف، استخدم إيميل تاني للمورد';
    end if;
    update auth.users set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now() where id = uid;
  end if;

  insert into public.profiles (id, email, full_name, phone, company, role)
  values (uid, em, s.contact_name, s.phone, s.company_name, 'supplier')
  on conflict (id) do update set role = 'supplier', company = coalesce(public.profiles.company, excluded.company);

  update public.suppliers set user_id = null where user_id = uid and id <> p_supplier;
  update public.suppliers set user_id = uid, email = coalesce(email, em), portal_invited_at = now(),
    status = case when status = 'pending' then 'approved' else status end
  where id = p_supplier;

  mailed := public.send_mail(em, 'بيانات دخول صفحة المورد — كي بلس للتوريدات العمومية',
    public.mail_wrap('أهلاً ' || public.h(coalesce(s.contact_name, s.company_name)),
      '<p>اتعملك حساب على بوابة الموردين في كي بلس للتوريدات العمومية، علشان تستلم أوامر التوريد المحوّلة منّا وتتابعها وتحدّث حالتها.</p>'
      || '<p><b>رابط الدخول:</b> <a href="' || site || '/supplier/">' || site || '/supplier/</a><br>'
      || '<b>الإيميل:</b> <span dir="ltr">' || public.h(em) || '</span><br>'
      || '<b>كلمة السر:</b> <span dir="ltr">' || public.h(p_password) || '</span></p>'
      || '<p>ننصحك تغيّر كلمة السر من صفحتك بعد أول دخول.</p>'
      || '<p style="text-align:center"><a href="' || site || '/supplier/" style="display:inline-block;background:#E4A11B;color:#0B2545;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:bold">افتح صفحة المورد</a></p>'));
  return jsonb_build_object('user_id', uid, 'existing', existing, 'emailed', mailed, 'login_url', site || '/supplier/');
end $$;

-- ========== 5. supply orders (أوامر التوريد) ==========
create table if not exists public.supply_orders (
  id bigint generated always as identity primary key,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  quote_id bigint references public.quote_requests(id) on delete set null,
  items text not null check (char_length(items) between 2 and 4000),
  quantity text check (quantity is null or char_length(quantity) <= 300),
  delivery_location text check (delivery_location is null or char_length(delivery_location) <= 300),
  delivery_date date,
  delivery_contact text check (delivery_contact is null or char_length(delivery_contact) <= 200),
  notes text check (notes is null or char_length(notes) <= 2000),
  status text not null default 'new' check (status in ('new', 'accepted', 'preparing', 'delivered', 'rejected', 'cancelled')),
  supplier_note text check (supplier_note is null or char_length(supplier_note) <= 2000),
  notified jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists supply_orders_supplier_idx on public.supply_orders (supplier_id, created_at desc);
alter table public.supply_orders enable row level security;

create or replace function public.my_supplier_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select id from public.suppliers where user_id = auth.uid();
$$;

drop policy if exists p_so_staff on public.supply_orders;
create policy p_so_staff on public.supply_orders for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists p_so_sup_sel on public.supply_orders;
create policy p_so_sup_sel on public.supply_orders for select using (supplier_id in (select public.my_supplier_ids()));
drop policy if exists p_so_sup_upd on public.supply_orders;
create policy p_so_sup_upd on public.supply_orders for update
  using (supplier_id in (select public.my_supplier_ids())) with check (supplier_id in (select public.my_supplier_ids()));
revoke all on public.supply_orders from anon;
grant select, insert, update, delete on public.supply_orders to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- suppliers may only change the status (forward) and their own note
create or replace function public.protect_supply_order() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if auth.uid() is not null and not public.is_staff() then
    if new.status is distinct from old.status and (
         old.status in ('delivered', 'rejected', 'cancelled')
         or new.status not in ('accepted', 'preparing', 'delivered', 'rejected')) then
      new.status := old.status;
    end if;
    new.supplier_id := old.supplier_id; new.quote_id := old.quote_id; new.items := old.items; new.quantity := old.quantity;
    new.delivery_location := old.delivery_location; new.delivery_date := old.delivery_date; new.delivery_contact := old.delivery_contact;
    new.notes := old.notes; new.notified := old.notified; new.created_by := old.created_by; new.created_at := old.created_at;
  end if;
  return new;
end $$;
drop trigger if exists supply_orders_protect on public.supply_orders;
create trigger supply_orders_protect before update on public.supply_orders for each row execute function public.protect_supply_order();

create or replace function public.so_status_ar(s text) returns text language sql immutable as $$
  select case s when 'new' then 'جديد' when 'accepted' then 'اتقبل' when 'preparing' then 'جاري التجهيز'
    when 'delivered' then 'اتسلم' when 'rejected' then 'اعتذر المورد' when 'cancelled' then 'اتلغى' else s end;
$$;

-- send the order to the supplier (email + WhatsApp) and a copy to the K Plus WhatsApp
create or replace function public.notify_supply_order_send(p_id bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare o public.supply_orders%rowtype; s public.suppliers%rowtype; site text := 'https://kplussupply.com';
        link text; msg text; mailed boolean := false; wa boolean := false; res jsonb;
begin
  select * into o from public.supply_orders where id = p_id;
  if not found then return '{}'::jsonb; end if;
  select * into s from public.suppliers where id = o.supplier_id;
  link := site || '/supplier/?order=' || o.id;
  msg := concat_ws(E'\n',
    '📦 أمر توريد جديد رقم PO-' || o.id,
    'محوّل من: كي بلس للتوريدات العمومية (K Plus)',
    'الأصناف: ' || o.items,
    'الكمية: ' || o.quantity,
    'مكان التسليم: ' || o.delivery_location,
    'موعد التسليم: ' || to_char(o.delivery_date, 'YYYY-MM-DD'),
    'المسؤول في الموقع: ' || o.delivery_contact,
    'ملاحظات: ' || left(o.notes, 400),
    'تابع الأمر وحدّث حالته من صفحتك: ' || link);
  mailed := public.send_mail(s.email, 'أمر توريد جديد PO-' || o.id || ' محوّل من كي بلس للتوريدات العمومية',
    public.mail_wrap('أمر توريد جديد رقم PO-' || o.id,
      '<p>الأمر ده <b>محوّل من كي بلس للتوريدات العمومية</b> لشركتكم (' || public.h(s.company_name) || ').</p>'
      || '<table style="width:100%;border-collapse:collapse;font-size:14px">'
      || '<tr><td style="padding:6px;border:1px solid #e3e7ee;background:#f8fafc;width:35%"><b>الأصناف</b></td><td style="padding:6px;border:1px solid #e3e7ee">' || replace(public.h(o.items), E'\n', '<br>') || '</td></tr>'
      || '<tr><td style="padding:6px;border:1px solid #e3e7ee;background:#f8fafc"><b>الكمية</b></td><td style="padding:6px;border:1px solid #e3e7ee">' || public.h(o.quantity) || '</td></tr>'
      || '<tr><td style="padding:6px;border:1px solid #e3e7ee;background:#f8fafc"><b>مكان التسليم</b></td><td style="padding:6px;border:1px solid #e3e7ee">' || public.h(o.delivery_location) || '</td></tr>'
      || '<tr><td style="padding:6px;border:1px solid #e3e7ee;background:#f8fafc"><b>موعد التسليم</b></td><td style="padding:6px;border:1px solid #e3e7ee">' || coalesce(to_char(o.delivery_date, 'YYYY-MM-DD'), '') || '</td></tr>'
      || '<tr><td style="padding:6px;border:1px solid #e3e7ee;background:#f8fafc"><b>المسؤول في الموقع</b></td><td style="padding:6px;border:1px solid #e3e7ee">' || public.h(o.delivery_contact) || '</td></tr>'
      || '<tr><td style="padding:6px;border:1px solid #e3e7ee;background:#f8fafc"><b>ملاحظات</b></td><td style="padding:6px;border:1px solid #e3e7ee">' || replace(public.h(o.notes), E'\n', '<br>') || '</td></tr>'
      || '</table>'
      || '<p style="text-align:center;margin-top:18px"><a href="' || link || '" style="display:inline-block;background:#E4A11B;color:#0B2545;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:bold">افتح أمر التوريد وحدّث حالته</a></p>'));
  wa := public.wa_send(public.intl_phone(s.phone), s.wa_apikey, msg);
  perform public.wa_notify('✅ اتبعت أمر توريد PO-' || o.id || ' للمورد ' || s.company_name
    || E'\nإيميل: ' || case when mailed then 'اتبعت' else 'لأ (مفيش إيميل أو إعدادات البريد ناقصة)' end
    || E'\nواتساب المورد: ' || case when wa then 'اتبعت' else 'لأ (المورد مفعّلش تنبيهات واتساب)' end);
  res := jsonb_build_object('email', mailed, 'whatsapp', wa, 'at', now());
  update public.supply_orders set notified = res where id = o.id;
  return res;
end $$;

create or replace function public.notify_supply_order() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.notify_supply_order_send(new.id);
  elsif new.status is distinct from old.status and auth.uid() is not null and not public.is_staff() then
    perform public.wa_notify('📦 المورد ' || coalesce((select company_name from public.suppliers where id = new.supplier_id), '')
      || ' حدّث أمر التوريد PO-' || new.id || ': ' || public.so_status_ar(new.status)
      || case when coalesce(new.supplier_note, '') <> '' then E'\nملاحظة المورد: ' || left(new.supplier_note, 300) else '' end);
  end if;
  return new;
exception when others then
  raise warning 'notify_supply_order failed: %', sqlerrm;
  return new;
end $$;
drop trigger if exists supply_orders_notify on public.supply_orders;
create trigger supply_orders_notify after insert or update of status on public.supply_orders for each row execute function public.notify_supply_order();

-- staff button "إعادة إرسال التنبيه"
create or replace function public.resend_supply_order(p_id bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  return public.notify_supply_order_send(p_id);
end $$;

-- admin test button for email settings
create or replace function public.mail_test() returns text
language plpgsql security definer set search_path = public as $$
declare em text;
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  select email into em from public.profiles where id = auth.uid();
  if public.send_mail(em, 'تجربة إيميلات كي بلس', public.mail_wrap('تجربة الإيميلات', '<p>لو الرسالة دي وصلتك يبقى إيميلات أوامر التوريد ودعوات الموردين شغالة.</p>')) then
    return em;
  end if;
  raise exception 'إعدادات البريد ناقصة (المفتاح أو إيميل الإرسال)';
end $$;

-- ========== 6. function permissions ==========
revoke execute on function public.send_mail(text, text, text) from public, anon, authenticated;
revoke execute on function public.wa_send(text, text, text) from public, anon, authenticated;
revoke execute on function public.notify_supply_order_send(bigint) from public, anon, authenticated;
revoke execute on function public.notify_supply_order() from public, anon, authenticated;
revoke execute on function public.protect_supply_order() from public, anon, authenticated;
revoke execute on function public.admin_create_supplier_login(uuid, text, text) from public, anon;
grant execute on function public.admin_create_supplier_login(uuid, text, text) to authenticated;
revoke execute on function public.resend_supply_order(bigint) from public, anon;
grant execute on function public.resend_supply_order(bigint) to authenticated;
revoke execute on function public.mail_test() from public, anon;
grant execute on function public.mail_test() to authenticated;
revoke execute on function public.my_supplier_ids() from public, anon;
grant execute on function public.my_supplier_ids() to authenticated;
