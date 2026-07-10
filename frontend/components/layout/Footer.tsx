import Link from 'next/link';
import { Facebook, Instagram, Mail, Phone, Send, Youtube } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Logo } from './Logo';
import { siteConfig } from '@/constants/site';
import { footerNav } from '@/constants/navigation';

const socialLinks = [
  { label: 'Facebook', href: siteConfig.social.facebook, icon: Facebook },
  { label: 'Instagram', href: siteConfig.social.instagram, icon: Instagram },
  { label: 'YouTube', href: siteConfig.social.youtube, icon: Youtube },
  { label: 'Telegram', href: siteConfig.social.telegram, icon: Send },
  { label: 'Email', href: `mailto:${siteConfig.contact.email}`, icon: Mail },
];

function LinkColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-rust-400">
        {title}
      </h3>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-navy-100/80 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t-4 border-rust-500 bg-navy-800 text-white">
      <Container className="py-14">
        <div className="grid gap-10 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Logo invert />
            <p className="mt-5 max-w-xs text-sm text-navy-100/80">
              Empowering the youth of Bokaro to lead India&apos;s defense forces through discipline,
              knowledge, and physical excellence.
            </p>
            <a
              href={`tel:${siteConfig.contact.phone.replace(/\s/g, '')}`}
              className="mt-5 inline-flex items-center gap-2 font-semibold text-rust-300 hover:text-rust-200"
            >
              <Phone size={16} /> {siteConfig.contact.phone}
            </a>
            <div className="mt-5 flex flex-wrap gap-3">
              {socialLinks.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-700 text-white transition-colors hover:bg-rust-500"
                  >
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>
          </div>

          <LinkColumn title={footerNav.studyMaterial.title} links={footerNav.studyMaterial.links} />
          <LinkColumn title={footerNav.govtExams.title} links={footerNav.govtExams.links} />

          {/* Location */}
          <div>
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-rust-400">
              Our Location
            </h3>
            <div className="mt-4 overflow-hidden rounded-lg ring-1 ring-white/10">
              <iframe
                title="Bokaro Defence Academy location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3655.049786618463!2d86.15925127579145!3d23.63838799306641!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f4239d7b617281%3A0x719095ec2c06bd92!2sBokaro%20Defence%20Academy!5e0!3m2!1sen!2sus!4v1783320726935!5m2!1sen!2sus"
                className="h-40 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-sm text-navy-100/70">
          © {new Date().getFullYear()} {siteConfig.name}. All Rights Reserved. Built for Excellence.
        </div>
      </Container>
    </footer>
  );
}
