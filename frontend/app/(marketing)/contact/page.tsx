import { Mail, MapPin, Phone } from 'lucide-react';
import { buildMetadata } from '@/lib/seo';
import { PageHeader } from '@/components/layout/PageHeader';
import { Container } from '@/components/ui/Container';
import { ContactForm } from '@/components/forms/ContactForm';
import { siteConfig } from '@/constants/site';

export const metadata = buildMetadata({
  title: 'Contact Us',
  description:
    'Get in touch with Bokaro Defence Academy. Call, email or visit us for admissions, course enquiries and counselling for NDA, CDS, AFCAT and more.',
  path: '/contact',
  keywords: ['contact Bokaro Defence Academy', 'defence academy admission Bokaro'],
});

const details = [
  { icon: Phone, label: 'Call us', value: siteConfig.contact.phone, href: `tel:${siteConfig.contact.phone.replace(/\s/g, '')}` },
  { icon: Mail, label: 'Email us', value: siteConfig.contact.email, href: `mailto:${siteConfig.contact.email}` },
  { icon: MapPin, label: 'Visit us', value: siteConfig.contact.address },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="Contact Us"
        subtitle="Have a question about admissions or courses? We'd love to hear from you."
        breadcrumbs={[{ name: 'Contact', path: '/contact' }]}
      />

      <section className="bg-background py-20">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          {/* Details */}
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground">Get in touch</h2>
            <p className="mt-3 text-muted">
              Our counsellors are available to guide you through the right course and batch for your goals.
            </p>
            <ul className="mt-8 space-y-6">
              {details.map((d) => {
                const Icon = d.icon;
                const content = (
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-600 dark:bg-navy-800 dark:text-navy-200">
                      <Icon size={20} />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-muted">{d.label}</p>
                      <p className="font-semibold text-foreground">{d.value}</p>
                    </div>
                  </div>
                );
                return (
                  <li key={d.label}>
                    {d.href ? (
                      <a href={d.href} className="transition-opacity hover:opacity-80">
                        {content}
                      </a>
                    ) : (
                      content
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="mt-8 overflow-hidden rounded-xl border border-border">
              <iframe
                title="Bokaro Defence Academy location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3655.049786618463!2d86.15925127579145!3d23.63838799306641!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f4239d7b617281%3A0x719095ec2c06bd92!2sBokaro%20Defence%20Academy!5e0!3m2!1sen!2sus!4v1783320726935!5m2!1sen!2sus"
                className="h-56 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          {/* Form */}
          <div className="rounded-2xl border border-border bg-surface-alt p-6 sm:p-8">
            <h2 className="mb-6 font-heading text-2xl font-bold text-foreground">Send us a message</h2>
            <ContactForm />
          </div>
        </Container>
      </section>
    </>
  );
}
