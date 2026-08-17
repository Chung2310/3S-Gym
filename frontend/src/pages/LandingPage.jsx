import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2, 
  Sparkles, 
  Dumbbell, 
  Flame, 
  Zap, 
  HelpCircle,
  Calculator,
  Phone,
  MapPin
} from 'lucide-react';

const LandingPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);

  const bannerImages = [
    { src: '/images/banner_reception.jpg', title: 'TỔ HỢP THỂ THAO CAO CẤP 3S BẮC NINH', subtitle: 'GYM - YOGA - ZUMBA - KICKFIT & Giãn Cơ Trị Liệu' },
    { src: '/images/banner_yoga1.jpg', title: 'YOGA CHUYÊN SÂU & GIÃN CƠ TRỊ LIỆU', subtitle: 'Cân Bằng Thân - Tâm - Trí, Đỉnh Cao Phục Hồi Năng Lượng' },
    { src: '/images/banner_yoga2.jpg', title: 'PHỤC HỒI CHUYÊN SÂU & TĂNG ĐỘ LINH HOẠT', subtitle: 'Giáo Án Cá Nhân Hóa Chuẩn Y Khoa Cho Mọi Lứa Tuổi' },
    { src: '/images/banner_yoga3.jpg', title: 'BỨT PHÁ GIỚI HẠN & ĐỐT CHÁY CALO', subtitle: 'Hệ Thống Lớp GYM - ZUMBA - KICKFIT Năng Động' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [bannerImages.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="landing-page" style={{ overflowX: 'hidden' }}>
      
      {/* 4-Image Hero Banner Slider */}
      <section style={{ position: 'relative', width: '100%', height: '620px', overflow: 'hidden', background: '#07162c' }}>
        {bannerImages.map((banner, index) => (
          <div 
            key={index}
            style={{ 
              position: 'absolute',
              top: 0, left: 0, width: '100%', height: '100%',
              opacity: currentSlide === index ? 1 : 0,
              transition: 'opacity 0.8s ease-in-out',
              pointerEvents: currentSlide === index ? 'auto' : 'none'
            }}
          >
            <img 
              src={banner.src} 
              alt={banner.title} 
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.65)' }} 
            />
            <div 
              style={{ 
                position: 'absolute',
                top: 0, left: 0, width: '100%', height: '100%',
                background: 'linear-gradient(to right, rgba(0, 59, 112, 0.85) 0%, rgba(0, 164, 228, 0.3) 100%)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <div className="container">
                <div style={{ maxWidth: '780px', color: 'white' }}>
                  <div style={{ display: 'inline-block', padding: '6px 18px', background: 'rgba(0,164,228,0.25)', color: '#00a4e4', borderRadius: '30px', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '1px', marginBottom: '16px' }}>
                    GYM • YOGA • ZUMBA • KICKFIT
                  </div>
                  <h1 style={{ fontSize: '3.4rem', lineHeight: '1.15', marginBottom: '20px', fontFamily: "'Be Vietnam Pro', sans-serif", fontWeight: 800, letterSpacing: '-0.5px' }}>
                    {banner.title}
                  </h1>
                  <p style={{ fontSize: '1.3rem', opacity: 0.9, marginBottom: '32px', fontFamily: 'Montserrat' }}>
                    {banner.subtitle}
                  </p>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <Link to="/login" className="btn btn-secondary" style={{ fontSize: '1.1rem', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calculator size={20} /> PT PORTAL & DINH DƯỠNG
                    </Link>
                    <a href="tel:0889926222" className="btn btn-outline" style={{ color: 'white', borderColor: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone size={18} /> LIÊN HỆ HOTLINE
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel Navigation Arrows */}
        <button 
          onClick={prevSlide}
          style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '12px', borderRadius: '50%', cursor: 'pointer', zIndex: 10 }}
        >
          <ChevronLeft size={28} />
        </button>
        <button 
          onClick={nextSlide}
          style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '12px', borderRadius: '50%', cursor: 'pointer', zIndex: 10 }}
        >
          <ChevronRight size={28} />
        </button>

        {/* Dots Indicators */}
        <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', zIndex: 10 }}>
          {bannerImages.map((_, index) => (
            <div 
              key={index}
              onClick={() => setCurrentSlide(index)}
              style={{ 
                width: currentSlide === index ? '32px' : '10px', 
                height: '10px', 
                borderRadius: '5px', 
                background: currentSlide === index ? 'var(--secondary-color)' : 'rgba(255,255,255,0.5)', 
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
      </section>

      {/* Disciplines Section (GYM, YOGA, ZUMBA, KICKFIT) */}
      <section style={{ padding: '90px 0', background: 'var(--white)' }}>
        <div className="container">
          <div className="text-center animate-fade-in-up" style={{ marginBottom: '60px' }}>
            <span className="badge-tag">DỊCH VỤ TRỌNG TÂM</span>
            <h2 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '16px', fontFamily: "'Be Vietnam Pro', sans-serif" }}>
              TỔ HỢP 5 BỘ MÔN TẬP LUYỆN CAO CẤP
            </h2>
            <p style={{ color: 'var(--text-light)', maxWidth: '650px', margin: '0 auto', fontSize: '1.1rem' }}>
              GYM - YOGA - ZUMBA - KICKFIT & GIÃN CƠ TRỊ LIỆU CHUYÊN SÂU
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '30px' }}>
            
            {/* Card 1: GYM */}
            <div className="glass-card animate-fade-in-up delay-100" style={{ background: '#fafcfd' }}>
              <div style={{ background: 'rgba(0,59,112,0.1)', width: '60px', height: '60px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Dumbbell size={32} color="var(--primary-color)" />
              </div>
              <h3 style={{ fontSize: '1.6rem', color: 'var(--primary-color)', marginBottom: '12px', fontFamily: "'Be Vietnam Pro', sans-serif" }}>1. GYM FITNESS</h3>
              <p style={{ color: 'var(--text-light)', fontSize: '0.95rem', marginBottom: '16px' }}>
                Trang thiết bị nhập khẩu hiện đại, phân khu tập luyện chuyên biệt: Cardio, tạ tự do, máy cơ linh hoạt.
              </p>
              <ul style={{ listStyle: 'none', color: 'var(--text-dark)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="var(--secondary-color)"/> Thiết kế giáo án cá nhân</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="var(--secondary-color)"/> Đo chỉ số InBody định kỳ</li>
              </ul>
            </div>

            {/* Card 2: YOGA */}
            <div className="glass-card animate-fade-in-up delay-200" style={{ background: '#fafcfd' }}>
              <div style={{ background: 'rgba(0,164,228,0.1)', width: '60px', height: '60px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Sparkles size={32} color="var(--secondary-color)" />
              </div>
              <h3 style={{ fontSize: '1.6rem', color: 'var(--primary-color)', marginBottom: '12px', fontFamily: "'Be Vietnam Pro', sans-serif" }}>2. YOGA CHUYÊN SÂU</h3>
              <p style={{ color: 'var(--text-light)', fontSize: '0.95rem', marginBottom: '16px' }}>
                Đa dạng lớp học: Yoga Chuỗi tư thế, Yoga Nâng Cao, Yoga Cân Bằng, Yoga với gạch cùng Master chuyên nghiệp.
              </p>
              <ul style={{ listStyle: 'none', color: 'var(--text-dark)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="var(--secondary-color)"/> Giảng viên Ấn Độ kinh nghiệm</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="var(--secondary-color)"/> Giúp dẻo dai & thư giãn tâm trí</li>
              </ul>
            </div>

            {/* Card 3: ZUMBA */}
            <div className="glass-card animate-fade-in-up delay-300" style={{ background: '#fafcfd' }}>
              <div style={{ background: 'rgba(255,51,102,0.1)', width: '60px', height: '60px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Flame size={32} color="#ff3366" />
              </div>
              <h3 style={{ fontSize: '1.6rem', color: 'var(--primary-color)', marginBottom: '12px', fontFamily: "'Be Vietnam Pro', sans-serif" }}>3. ZUMBA DANCE</h3>
              <p style={{ color: 'var(--text-light)', fontSize: '0.95rem', marginBottom: '16px' }}>
                Khuấy động năng lượng trên nền nhạc Latin sôi động, đốt cháy tới 600-800 calo mỗi giờ tập luyện.
              </p>
              <ul style={{ listStyle: 'none', color: 'var(--text-dark)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="var(--secondary-color)"/> Đốt mỡ thừa hiệu quả</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="var(--secondary-color)"/> Không khí lớp học năng động</li>
              </ul>
            </div>

            {/* Card 4: KICKFIT */}
            <div className="glass-card animate-fade-in-up delay-400" style={{ background: '#fafcfd' }}>
              <div style={{ background: 'rgba(245,158,11,0.1)', width: '60px', height: '60px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Zap size={32} color="#f59e0b" />
              </div>
              <h3 style={{ fontSize: '1.6rem', color: 'var(--primary-color)', marginBottom: '12px', fontFamily: "'Be Vietnam Pro', sans-serif" }}>4. KICKFIT & BOXING</h3>
              <p style={{ color: 'var(--text-light)', fontSize: '0.95rem', marginBottom: '16px' }}>
                Kết hợp giữa võ thuật Kickboxing & Fitness. Rèn luyện phản xạ, sức bền và khả năng tự vệ cho cả người lớn & trẻ em.
              </p>
              <ul style={{ listStyle: 'none', color: 'var(--text-dark)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="var(--secondary-color)"/> Huấn luyện 1:1 sát sao</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="var(--secondary-color)"/> Thích hợp cho mọi lứa tuổi</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Showcase: Physical Therapy */}
      <section style={{ padding: '90px 0', background: 'linear-gradient(135deg, rgba(0,59,112,0.03), rgba(0,164,228,0.06))' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
            <div className="animate-fade-in-up">
              <img 
                src="/images/media_1786937862278.jpg" 
                alt="Phòng giãn cơ trị liệu 3S Wellness" 
                style={{ width: '100%', height: '480px', objectFit: 'cover', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
              />
            </div>
            <div className="animate-fade-in-up delay-200">
              <span className="badge-tag">ĐẶC QUYỀN HỘI VIÊN</span>
              <h2 className="text-gradient" style={{ fontSize: '2.8rem', marginBottom: '20px', fontFamily: "'Be Vietnam Pro', sans-serif" }}>
                PHÒNG GIÃN CƠ TRỊ LIỆU CHUYÊN SÂU
              </h2>
              <p style={{ color: 'var(--text-light)', fontSize: '1.05rem', marginBottom: '24px' }}>
                Tại 3S Wellness Bắc Ninh, chúng tôi hiểu rằng phục hồi cơ bắp là chìa khóa để tập luyện bền vững. Dịch vụ trị liệu chuẩn y khoa sử dụng kỹ thuật IASTM chuyên sâu giúp:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ background: 'var(--primary-color)', color: 'white', padding: '8px', borderRadius: '10px' }}>
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', color: 'var(--primary-color)', fontFamily: "'Be Vietnam Pro', sans-serif" }}>Giải tỏa áp lực nén cột sống & khớp</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Giảm đau nhức vai cổ gáy, thắt lưng ngay sau buổi tập đầu tiên.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ background: 'var(--secondary-color)', color: 'white', padding: '8px', borderRadius: '10px' }}>
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', color: 'var(--primary-color)', fontFamily: "'Be Vietnam Pro', sans-serif" }}>Xóa bỏ các điểm cơ căng cứng (Trigger points)</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Phục hồi mô cơ nhanh chóng, tăng độ linh hoạt khớp xương.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Non-overlapping Activities Gallery */}
      <section style={{ padding: '90px 0', background: 'var(--bg-color)' }}>
        <div className="container">
          <div className="text-center animate-fade-in-up" style={{ marginBottom: '50px' }}>
            <span className="badge-tag">HÌNH ẢNH THỰC TẾ</span>
            <h2 className="text-gradient" style={{ fontSize: '2.8rem', fontFamily: "'Be Vietnam Pro', sans-serif" }}>
              HOẠT ĐỘNG HUẤN LUYỆN PT 1:1
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            <div className="glass-card animate-fade-in-up delay-100" style={{ padding: '12px' }}>
              <img src="/images/media_1786937862284.jpg" alt="Kickfit Trẻ Em 3S" style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '12px' }} />
              <div style={{ padding: '16px 8px 8px', textAlign: 'center', fontWeight: '700', color: 'var(--primary-color)', fontSize: '1.1rem', fontFamily: "'Be Vietnam Pro', sans-serif" }}>
                Kickfit & Boxing Trẻ Em 1:1
              </div>
            </div>

            <div className="glass-card animate-fade-in-up delay-200" style={{ padding: '12px' }}>
              <img src="/images/media_1786937862291.jpg" alt="Tập Luyện Cùng HLV" style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '12px' }} />
              <div style={{ padding: '16px 8px 8px', textAlign: 'center', fontWeight: '700', color: 'var(--primary-color)', fontSize: '1.1rem', fontFamily: "'Be Vietnam Pro', sans-serif" }}>
                Kèm Sát Kỹ Thuật Đẩy Tạ & Sled
              </div>
            </div>

            <div className="glass-card animate-fade-in-up delay-300" style={{ padding: '12px' }}>
              <img src="/images/media_1786937862301.jpg" alt="Kickfit Nữ" style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '12px' }} />
              <div style={{ padding: '16px 8px 8px', textAlign: 'center', fontWeight: '700', color: 'var(--primary-color)', fontSize: '1.1rem', fontFamily: "'Be Vietnam Pro', sans-serif" }}>
                Tập Luyện Kickfit Nữ Năng Động
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ padding: '90px 0', background: 'var(--white)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div className="text-center animate-fade-in-up" style={{ marginBottom: '48px' }}>
            <span className="badge-tag">CÂU HỎI THƯỜNG GẶP</span>
            <h2 className="text-gradient" style={{ fontSize: '2.5rem', fontFamily: "'Be Vietnam Pro', sans-serif" }}>
              THẮC MẮC CỦA HỘI VIÊN
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { q: 'Phòng tập 3S Wellness Bắc Ninh ở đâu?', a: 'Phòng tập tọa lạc tại Tầng 5 Tòa Nhà VNPT - 33 Lý Thái Tổ - Tp. Bắc Ninh (Ngay trung tâm thành phố).' },
              { q: 'Hội viên có được kiểm tra InBody và tư vấn dinh dưỡng không?', a: 'Có! 100% hội viên tại 3S Wellness đều được kiểm tra chỉ số cơ thể InBody và hỗ trợ phân tích calo, dinh dưỡng hàng ngày.' },
              { q: 'Dịch vụ Giãn cơ trị liệu có bao gồm trong gói tập không?', a: 'Dịch vụ trị liệu có các gói đăng ký riêng hoặc được tặng kèm trong các gói tập Personal Trainer 1:1.' },
              { q: 'Thời gian mở cửa của phòng tập như thế nào?', a: '3S Wellness mở cửa từ 05:00 sáng đến 21:00 tối tất cả các ngày trong tuần.' }
            ].map((faq, idx) => (
              <div key={idx} className="glass-card animate-fade-in-up" style={{ padding: '20px', cursor: 'pointer' }} onClick={() => toggleFaq(idx)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '700', color: 'var(--primary-color)', fontFamily: "'Be Vietnam Pro', sans-serif" }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <HelpCircle size={20} color="var(--secondary-color)"/> {faq.q}
                  </span>
                  <span>{openFaq === idx ? '−' : '+'}</span>
                </div>
                {openFaq === idx && (
                  <p style={{ marginTop: '12px', color: 'var(--text-light)', fontSize: '0.95rem', borderTop: '1px solid #eee', paddingTop: '12px' }}>
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#07162c', color: 'white', padding: '70px 0 30px' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', marginBottom: '40px' }}>
          <div className="animate-fade-in-up">
            <img src="/images/logo-white.png" alt="3S Wellness Logo" style={{ height: '210px', width: 'auto', objectFit: 'contain', marginBottom: '16px' }} />
            <p style={{ opacity: 0.8, fontSize: '0.95rem', marginBottom: '16px' }}>
              Tổ hợp thể thao cao cấp 3S Bắc Ninh: GYM - YOGA - ZUMBA - KICKFIT & Giãn cơ trị liệu chuyên sâu.
            </p>
          </div>

          <div className="animate-fade-in-up delay-100">
            <h4 style={{ fontFamily: 'Oswald', fontSize: '1.3rem', color: 'white', marginBottom: '16px' }}>LIÊN HỆ PHÒNG TẬP</h4>
            <p style={{ opacity: 0.85, fontSize: '0.95rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} color="var(--secondary-color)" /> <span><b>Địa chỉ:</b> Tầng 5 Tòa Nhà VNPT - 33 Lý Thái Tổ - Tp. Bắc Ninh</span>
            </p>
            <p style={{ opacity: 0.85, fontSize: '0.95rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={18} color="var(--secondary-color)" /> <span><b>Hotline 1:</b> 088 9926 222</span>
            </p>
            <p style={{ opacity: 0.85, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={18} color="var(--secondary-color)" /> <span><b>Hotline 2:</b> 082 333 5977</span>
            </p>
          </div>

          <div className="animate-fade-in-up delay-200">
            <h4 style={{ fontFamily: 'Oswald', fontSize: '1.3rem', color: 'white', marginBottom: '16px' }}>DÀNH CHO PT & BQT</h4>
            <p style={{ opacity: 0.8, fontSize: '0.95rem', marginBottom: '16px' }}>
              Hệ thống công cụ hỗ trợ PT tính toán chỉ số BMR/TDEE & lên thực đơn cho hội viên.
            </p>
            <Link to="/login" className="btn btn-secondary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
              ĐĂNG NHẬP PT PORTAL
            </Link>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', textAlign: 'center', opacity: 0.6, fontSize: '0.85rem' }}>
          © 2026 3S WELLNESS FITNESS & YOGA. Bản quyền thuộc về 3S Bắc Ninh.
        </div>
      </footer>

      {/* Floating Action Buttons */}
      <a href="tel:0889926222" className="floating-call">
        <Phone size={22} />
        <span>GỌI 088 9926 222</span>
      </a>

    </div>
  );
};

export default LandingPage;
