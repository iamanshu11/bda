import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-heading text-6xl font-extrabold text-navy-600 dark:text-navy-200">404</p>
      <h1 className="mt-4 font-heading text-2xl font-bold text-foreground">Position not found</h1>
      <p className="mt-2 max-w-md text-muted">
        The page you are looking for has been moved or never existed. Let&apos;s get you back on
        course.
      </p>
      <div className="mt-8">
        <Button href="/">Return Home</Button>
      </div>
    </Container>
  );
}
