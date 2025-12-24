"use client";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="pp-footer">
      <div className="pp-footer__inner">
        {/* Cột 1 – Giới thiệu */}
        <div className="pp-footer__col">
          <h3 className="pp-footer__title">Giới thiệu</h3>
          <p className="pp-footer__desc">
            Picklepickle là nền tảng đặt sân pickleball trực tuyến giúp người
            chơi tìm và đặt sân nhanh chóng, dễ dàng.
          </p>

          <ul className="pp-footer__list">
            <li className="pp-footer__item">
              <span className="pp-footer__icon-wrapper">
                <Image
                  src="/aboutusIcon.svg"
                  alt="Về chúng tôi"
                  width={24}
                  height={24}
                />
              </span>
              <Link href="/about" className="pp-footer__link">
                Về chúng tôi
              </Link>
            </li>

            <li className="pp-footer__item">
              <span className="pp-footer__icon-wrapper">
                <Image
                  src="/termofuseIcon.svg"
                  alt="Điều khoản sử dụng"
                  width={24}
                  height={24}
                />
              </span>
              <Link href="/terms" className="pp-footer__link">
                Điều khoản sử dụng
              </Link>
            </li>

            <li className="pp-footer__item">
              <span className="pp-footer__icon-wrapper">
                <Image
                  src="/policyIcon.svg"
                  alt="Chính sách hoạt động"
                  width={24}
                  height={24}
                />
              </span>
              <Link href="/policies/operation" className="pp-footer__link">
                Chính sách hoạt động
              </Link>
            </li>
          </ul>
        </div>

        {/* Cột 2 – Thông tin */}
        <div className="pp-footer__col">
          <h3 className="pp-footer__title">Thông tin</h3>
          <ul className="pp-footer__list">
            <li className="pp-footer__item-text">
              <Link href="/guide/booking" className="pp-footer__link">
                Hướng dẫn đặt sân
              </Link>
            </li>
            <li className="pp-footer__item-text">
              <Link href="/policies/refund" className="pp-footer__link">
                Chính sách huỷ &amp; hoàn tiền
              </Link>
            </li>
            <li className="pp-footer__item-text">
              <Link href="/faq" className="pp-footer__link">
                Câu hỏi thường gặp (FAQ)
              </Link>
            </li>
          </ul>
        </div>

        {/* Cột 3 – Liên lạc */}
        <div className="pp-footer__col">
          <h3 className="pp-footer__title">Liên lạc</h3>
          <ul className="pp-footer__list">
            <li className="pp-footer__item">
              <span className="pp-footer__icon-wrapper">
                <Image
                  src="/locationIcon.svg"
                  alt="Địa chỉ"
                  width={24}
                  height={24}
                />
              </span>
              <span>Địa chỉ: TP. Hồ Chí Minh, Việt Nam</span>
            </li>

            <li className="pp-footer__item">
              <span className="pp-footer__icon-wrapper">
                <Image
                  src="/mailIcon.svg"
                  alt="Email"
                  width={24}
                  height={24}
                />
              </span>
              <span>Email: support@picklepickle.vn</span>
            </li>

            <li className="pp-footer__item">
              <span className="pp-footer__icon-wrapper">
                <Image
                  src="/globalIcon.svg"
                  alt="Mạng xã hội"
                  width={24}
                  height={24}
                />
              </span>

              <span className="pp-footer__social">
                Mạng xã hội:
                <span className="pp-footer__social-icons">
                  <span className="pp-footer__icon-wrapper">
                    <Image
                      src="/instagramIcon.svg"
                      alt="Instagram"
                      width={24}
                      height={24}
                    />
                  </span>
                </span>
              </span>
            </li>

          </ul>
        </div>
      </div>

      <div className="pp-footer__bottom">
        © 2025 Picklepickle. All rights reserved.
      </div>
    </footer>
  );
}
