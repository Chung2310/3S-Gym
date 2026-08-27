import { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronLeft,
  Dumbbell, 
  Flame, 
  Activity, 
  Target, 
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  Camera
} from 'lucide-react';

const LandingPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const bannerImages = [
    { 
      src: '/images/banner_reception.jpg', 
      tag: 'TỔ HỢP THỂ THAO CAO CẤP 3S BẮC NINH',
      title: 'BUILD YOUR BODY STRONG', 
      subtitle: 'GYM - YOGA - ZUMBA - KICKFIT & Giãn Cơ Trị Liệu Tại Tầng 5 Tòa VNPT - 33 Lý Thái Tổ' 
    },
    { 
      src: '/images/banner_yoga1.jpg', 
      tag: 'YOGA CHUYÊN SÂU & GIÃN CƠ TRỊ LIỆU',
      title: 'RECOVER & BALANCE YOUR MIND', 
      subtitle: 'Cân Bằng Thân - Tâm - Trí, Đỉnh Cao Phục Hồi Năng Lượng Cùng Master Ấn Độ' 
    },
    { 
      src: '/images/banner_yoga2.jpg', 
      tag: 'ZUMBA DANCE & KICKFIT CHUYÊN NGHIỆP',
      title: 'BURN CALORIES & BE FIT', 
      subtitle: 'Đốt Cháy 800+ Calo Sảng Khoái Theo Vũ Điệu Âm Nhạc & Khả Năng Tự Vệ Đỉnh Cao' 
    },
    { 
      src: '/images/banner_yoga3.jpg', 
      tag: 'TẬP LUYỆN KHÁNG LỰC VỚI PT CHUYÊN SÂU',
      title: 'TRANSFORM YOUR BODY TODAY', 
      subtitle: 'Giáo Án Cá Nhân Hóa Chuẩn Y Khoa - Đội Ngũ HLV PT Đồng Hành 1-On-1' 
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [bannerImages.length]);

  // Scroll reveal animation observer (Kéo lên kéo xuống tự động hiện chữ & ảnh)
  useEffect(() => {
    const observerOptions = {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal-on-scroll, .reveal-left, .reveal-right');
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);

  const toggleFaq = (idx: number) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  const programs = [
    {
      title: 'Yoga Therapy',
      icon: <Activity size={36} color="var(--secondary-color)" />,
      desc: 'Giãn cơ trị liệu & Yoga chuyên sâu cùng Master Ấn Độ. Cân bằng Thân - Tâm - Trí và phục hồi cột sống chuẩn y khoa.'
    },
    {
      title: 'Zumba Dance',
      icon: <Flame size={36} color="var(--secondary-color)" />,
      desc: 'Đốt cháy 800+ calo sảng khoái theo vũ điệu âm nhạc Latin sôi động, giảm căng thẳng và làm thon gọn vóc dáng.'
    },
    {
      title: 'Body Building / Gym',
      icon: <Dumbbell size={36} color="var(--secondary-color)" />,
      desc: 'Hệ thống máy móc tập luyện nhập khẩu 100% chuẩn quốc tế. Giáo án PT cá nhân hóa cho từng hội viên 3S.'
    },
    {
      title: 'Kickfit & Boxing',
      icon: <Target size={36} color="var(--secondary-color)" />,
      desc: 'Tổ hợp tập luyện đối kháng rèn luyện phản xạ, tăng cường sức bền, đốt mỡ thừa tối đa và nâng cao khả năng tự vệ.'
    }
  ];

  const galleryImages = [
    { src: '/images/banner_reception.jpg', title: 'Sảnh Lễ Tân & Đón Tiếp Sang Trọng', tag: 'Khu Vực Tiếp Đón', delay: 'delay-100' },
    { src: '/images/banner_yoga1.jpg', title: 'Lớp Yoga Trị Liệu & Phục Hồi Thân - Tâm', tag: 'Yoga Master', delay: 'delay-200' },
    { src: '/images/login_bg.jpg', title: 'Tập Luyện Kickfit & Đối Kháng Chuyên Nghiệp', tag: 'Kickfit / Boxing', delay: 'delay-300' },
    { src: '/images/banner_yoga2.jpg', title: 'Luyện Tập Dẻo Dai & Tăng Độ Linh Hoạt', tag: 'Giãn Cơ Trị Liệu', delay: 'delay-100' },
    { src: '/images/banner_yoga3.jpg', title: 'Lớp GroupX & Vũ Điệu Zumba Sôi Động', tag: 'Zumba Cardio', delay: 'delay-200' },
    { src: '/images/gym_pt_instruction.jpg', title: 'HLV PT 3S Gym Đồng Hành Hướng Dẫn Tập Luyện 1-On-1', tag: 'Gym & PT 1-1', delay: 'delay-300' }
  ];

  const workflowSteps = [
    { num: '01', title: 'Đăng Ký Tư Vấn', desc: 'Đăng ký tập thử hoặc gọi Hotline để nhận ưu đãi trải nghiệm 3S Gym.', delay: 'delay-100' },
    { num: '02', title: 'Đo Chỉ Số InBody', desc: 'Đo phân tích mỡ, cơ nạc, xương và calo cơ bản BMR/TDEE chuẩn y khoa.', delay: 'delay-200' },
    { num: '03', title: 'Nhận Lộ Trình PT', desc: 'Nhận giáo án tập luyện & Thực đơn dinh dưỡng từ Trợ lý AI 3S Gym.', delay: 'delay-300' },
    { num: '04', title: 'Biến Đổi Vóc Dáng', desc: 'Bắt đầu hành trình lột xác vóc dáng, tăng cơ đốt mỡ cùng HLV PT 3S.', delay: 'delay-400' }
  ];

  const faqs = [
    {
      q: 'Phòng tập 3S Gym Bắc Ninh nằm ở vị trí nào?',
      a: '3S Wellness Fitness & Yoga nằm tại Tầng 5 Tòa nhà VNPT - 33 Lý Thái Tổ, Thành phố Bắc Ninh. Vị trí trung tâm sầm uất, đỗ xe ô tô và xe máy rộng rãi miễn phí.'
    },
    {
      q: 'Tôi mới bắt đầu tập thì có được hướng dẫn không?',
      a: 'Có! 100% hội viên mới đều được hỗ trợ đo chỉ số cơ thể InBody miễn phí, phân tích thể trạng bằng AI và được HLV PT hướng dẫn sử dụng máy móc an toàn.'
    },
    {
      q: '3S Gym có những bộ môn tập luyện nào?',
      a: 'Tổ hợp 3S Gym bao gồm trọn gói: Gym & Fitness thể hình, Yoga Therapy chuyên sâu với Master Ấn Độ, Zumba Dance sôi động và Kickfit/Boxing đối kháng.'
    },
    {
      q: 'Giờ mở cửa của phòng tập 3S Gym như thế nào?',
      a: 'Phòng Gym mở cửa đón hội viên từ 05:30 sáng đến 21:00 tối tất cả các ngày trong tuần (kể cả Thứ 7 & Chủ Nhật).'
    }
  ];

  return (
    <div className="landing-page" style={{ overflowX: 'hidden', background: '#f8fafc' }}>
      
      {/* 4-IMAGE SLIDESHOW HERO BANNER SECTION */}
      <section style={{ position: 'relative', width: '100%', height: '620px', overflow: 'hidden', background: '#020b18' }}>
        {bannerImages.map((banner, index) => (
          <div 
            key={index}
            style={{ 
              position: 'absolute',
              top: 0, left: 0, width: '100%', height: '100%',
              opacity: currentSlide === index ? 1 : 0,
              transition: 'opacity 0.8s ease-in-out',
              pointerEvents: currentSlide === index ? 'auto' : 'none',
              zIndex: currentSlide === index ? 2 : 1
            }}
          >
            <img 
              src={banner.src} 
              alt={banner.title} 
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.38)' }} 
            />

            <div 
              style={{ 
                position: 'absolute',
                top: 0, left: 0, width: '100%', height: '100%',
                background: 'linear-gradient(to right, rgba(0, 38, 74, 0.88) 0%, rgba(0, 164, 228, 0.25) 100%)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <div className="container" style={{ paddingBottom: '60px' }}>
                <div style={{ maxWidth: '750px', color: 'white' }}>
                  
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'rgba(0,164,228,0.2)', border: '1px solid rgba(0,164,228,0.4)', color: '#00a4e4', borderRadius: '30px', fontWeight: 700, fontSize: 'clamp(0.72rem, 2vw, 0.85rem)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '16px', maxWidth: '100%' }}>
                    <ShieldCheck size={16} /> {banner.tag}
                  </div>

                  <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 3.5rem)', lineHeight: '1.15', marginBottom: '16px', fontFamily: "'Be Vietnam Pro', sans-serif", fontWeight: 900, letterSpacing: '-0.5px', textTransform: 'uppercase', wordBreak: 'break-word' }}>
                    {banner.title.split(' ')[0]} {banner.title.split(' ')[1]} <span style={{ color: 'var(--secondary-color)' }}>{banner.title.split(' ').slice(2).join(' ')}</span>
                  </h1>

                  <p style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.15rem)', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '28px', maxWidth: '650px' }}>
                    {banner.subtitle}
                  </p>

                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <a 
                      href="#about" 
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        padding: '14px 32px', 
                        borderRadius: '30px', 
                        border: '1.5px solid rgba(255,255,255,0.4)', 
                        background: 'rgba(0,0,0,0.4)', 
                        color: 'white', 
                        fontWeight: 700, 
                        fontSize: '0.95rem',
                        transition: 'all 0.3s ease' 
                      }}
                    >
                      Xem Thêm <ChevronRight size={18} />
                    </a>

                    <a 
                      href="tel:0889926222" 
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        padding: '14px 36px', 
                        borderRadius: '30px', 
                        background: 'linear-gradient(135deg, #00a4e4, #0082c5)', 
                        color: 'white', 
                        fontWeight: 700, 
                        fontSize: '0.95rem',
                        boxShadow: '0 6px 20px rgba(0,164,228,0.4)',
                        transition: 'all 0.3s ease' 
                      }}
                    >
                      Đăng Ký Tập <ChevronRight size={18} />
                    </a>
                  </div>

                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows */}
        <button 
          onClick={prevSlide}
          style={{ position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '14px', borderRadius: '50%', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Banner trước"
        >
          <ChevronLeft size={22} />
        </button>

        <button 
          onClick={nextSlide}
          style={{ position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '14px', borderRadius: '50%', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Banner tiếp theo"
        >
          <ChevronRight size={22} />
        </button>

        {/* Slide Indicator Dots */}
        <div style={{ position: 'absolute', bottom: '90px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', zIndex: 10 }}>
          {bannerImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              style={{
                width: currentSlide === idx ? '32px' : '10px',
                height: '10px',
                borderRadius: '10px',
                background: currentSlide === idx ? '#00a4e4' : 'rgba(255,255,255,0.4)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
      </section>

      {/* FLOATING 4-CARD PROGRAM FEATURE SECTION */}
      <section id="classes" style={{ position: 'relative', zIndex: 10, marginTop: '-70px', paddingBottom: '60px' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            {programs.map((prog, idx) => (
              <div 
                key={idx}
                className="card-hover-effect reveal-on-scroll"
                style={{ 
                  background: 'white', 
                  padding: '36px 28px', 
                  borderRadius: '16px', 
                  textAlign: 'center', 
                  boxShadow: '0 10px 30px rgba(0, 59, 112, 0.08)', 
                  border: '1px solid #edf2f7',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '70px', height: '70px', background: 'rgba(0,164,228,0.08)', borderRadius: '16px', marginBottom: '20px' }}>
                  {prog.icon}
                </div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-color)', fontWeight: 800, fontFamily: "'Be Vietnam Pro', sans-serif", marginBottom: '12px' }}>
                  {prog.title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                  {prog.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION: GIỚI THIỆU 3S GYM BẮC NINH */}
      <section id="about" style={{ padding: '60px 0 80px', background: 'white' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
            
            <div className="reveal-left" style={{ position: 'relative' }}>
              <img 
                src="/images/banner_reception.jpg" 
                alt="3S Gym Reception" 
                style={{ width: '100%', borderRadius: '20px', boxShadow: '0 12px 36px rgba(0,0,0,0.1)' }} 
              />
              <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', background: 'var(--primary-color)', color: 'white', padding: '24px 30px', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,59,112,0.3)', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1, color: 'var(--secondary-color)' }}>5+</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '4px', textTransform: 'uppercase' }}>Năm Đồng Hành</div>
              </div>
            </div>

            <div className="reveal-right">
              <div style={{ color: 'var(--secondary-color)', fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                VỀ THƯƠNG HIỆU 3S GYM
              </div>
              <h2 style={{ fontSize: '2.4rem', color: 'var(--primary-color)', fontWeight: 800, fontFamily: "'Be Vietnam Pro', sans-serif", lineHeight: 1.25, marginBottom: '20px' }}>
                Tổ Hợp Thể Thao Cao Cấp Hàng Đầu Tại Bắc Ninh
              </h2>
              <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.7, marginBottom: '24px' }}>
                3S Wellness Fitness & Yoga sở hữu không gian rộng rãi tại Tầng 5 Tòa nhà VNPT - 33 Lý Thái Tổ. Chúng tôi mang đến môi trường tập luyện văn minh, trang thiết bị nhập khẩu hiện đại cùng đội ngũ HLV cá nhân (PT) tận tâm.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                {[
                  '100% Máy móc nhập khẩu',
                  'Đội ngũ HLV PT chuẩn quốc tế',
                  'Lớp Yoga cùng Master Ấn Độ',
                  'Hỗ trợ đo InBody & Tư vấn AI'
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                    <CheckCircle2 size={18} color="var(--secondary-color)" /> {item}
                  </div>
                ))}
              </div>

              <a href="tel:0889926222" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '0.95rem', borderRadius: '30px' }}>
                GỌI TƯ VẤN HOTLINE
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* NEW SECTION 1: REAL PHOTO GALLERY */}
      <section style={{ padding: '80px 0', background: '#f1f5f9' }}>
        <div className="container">
          <div className="reveal-on-scroll" style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 48px' }}>
            <div style={{ color: 'var(--secondary-color)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Camera size={18} /> THƯ VIỆN HÌNH ẢNH THỰC TẾ
            </div>
            <h2 style={{ fontSize: '2.4rem', color: 'var(--primary-color)', fontWeight: 900, fontFamily: "'Be Vietnam Pro', sans-serif" }}>
              Không Gian Tập Luyện Đẳng Cấp Tại 3S Wellness
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '10px' }}>
              Hình ảnh thực tế không gian phòng tập, máy móc hiện đại và các lớp học sôi động tại 3S Gym Bắc Ninh.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {galleryImages.map((img, idx) => (
              <div 
                key={idx}
                className={`img-zoom-card reveal-on-scroll ${img.delay}`}
                style={{ 
                  position: 'relative', 
                  height: '260px', 
                  borderRadius: '16px', 
                  overflow: 'hidden', 
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  cursor: 'pointer'
                }}
              >
                <img 
                  src={img.src} 
                  alt={img.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to top, rgba(0, 38, 74, 0.88) 0%, rgba(0,0,0,0.1) 60%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '20px' }}>
                  <span style={{ display: 'inline-block', background: 'rgba(0,164,228,0.85)', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, width: 'fit-content', marginBottom: '6px' }}>
                    {img.tag}
                  </span>
                  <h4 style={{ color: 'white', fontSize: '1.05rem', fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
                    {img.title}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEW SECTION 2: QUY TRÌNH THAM GIA TẬP LUYỆN */}
      <section style={{ padding: '80px 0', background: 'white' }}>
        <div className="container">
          <div className="reveal-on-scroll" style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 48px' }}>
            <div style={{ color: 'var(--secondary-color)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>
              LỘ TRÌNH 4 BƯỚC ĐỒNG HÀNH
            </div>
            <h2 style={{ fontSize: '2.4rem', color: 'var(--primary-color)', fontWeight: 900, fontFamily: "'Be Vietnam Pro', sans-serif" }}>
              Quy Trình Tập Luyện Chuẩn Y Khoa
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            {workflowSteps.map((step, idx) => (
              <div 
                key={idx}
                className={`card-hover-effect reveal-on-scroll ${step.delay}`}
                style={{ 
                  background: '#f8fafc', 
                  padding: '32px 24px', 
                  borderRadius: '20px', 
                  border: '1px solid #e2e8f0',
                  position: 'relative',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--secondary-color)', opacity: 0.8, lineHeight: 1, marginBottom: '14px' }}>
                  {step.num}
                </div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-color)', fontWeight: 800, marginBottom: '10px' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEW SECTION 3: CÂU HỎI THƯỜNG GẶP (FAQ ACCORDION) */}
      <section style={{ padding: '80px 0', background: '#f1f5f9' }}>
        <div className="container" style={{ maxWidth: '850px' }}>
          <div className="reveal-on-scroll" style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ color: 'var(--secondary-color)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>
              GIẢI ĐÁP THẮC MẮC
            </div>
            <h2 style={{ fontSize: '2.3rem', color: 'var(--primary-color)', fontWeight: 900, fontFamily: "'Be Vietnam Pro', sans-serif" }}>
              Câu Hỏi Thường Gặp Của Hội Viên
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {faqs.map((faq, idx) => (
              <div 
                key={idx}
                className="reveal-on-scroll"
                style={{ 
                  background: 'white', 
                  borderRadius: '14px', 
                  overflow: 'hidden', 
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    background: 'white',
                    border: 'none',
                    textAlign: 'left',
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: 'var(--primary-color)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>{faq.q}</span>
                  <ChevronDown 
                    size={20} 
                    color="var(--secondary-color)" 
                    style={{ transform: activeFaq === idx ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }} 
                  />
                </button>

                {activeFaq === idx && (
                  <div style={{ padding: '14px 24px 20px 24px', fontSize: '0.92rem', color: '#475569', lineHeight: 1.6, borderTop: '1px solid #f1f5f9' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#001a33', color: '#94a3b8', padding: '60px 0 30px', borderTop: '3px solid var(--secondary-color)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '40px', marginBottom: '40px' }}>
            <div>
              <img src="/images/logo-white.png" alt="3S Wellness Fitness & Yoga Logo" style={{ height: '126px', width: 'auto', objectFit: 'contain', marginBottom: '16px' }} />
              <p style={{ fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '400px' }}>
                Tổ hợp thể thao cao cấp 3S Wellness Fitness & Yoga Bắc Ninh. Nâng tầm sức khỏe và vóc dáng cho cộng đồng.
              </p>
            </div>

            <div>
              <h4 style={{ color: 'white', fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>BỘ MÔN TẬP LUYỆN</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
                <li>Gym & Fitness</li>
                <li>Yoga Therapy</li>
                <li>Zumba Dance</li>
                <li>Kickfit & Boxing</li>
              </ul>
            </div>

            <div>
              <h4 style={{ color: 'white', fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>LIÊN HỆ</h4>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
                Địa chỉ: Tầng 5 Tòa nhà VNPT - 33 Lý Thái Tổ - Tp. Bắc Ninh<br />
                Hotline: 088 9926 222 / 082 333 5977
              </p>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px', textAlign: 'center', fontSize: '0.8rem' }}>
            © {new Date().getFullYear()} 3S Wellness Fitness & Yoga Bắc Ninh. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
