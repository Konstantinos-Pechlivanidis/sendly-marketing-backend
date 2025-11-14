import { Link } from 'react-router-dom';
import GlassButton from '../components/ui/GlassButton';
import GlassCard from '../components/ui/GlassCard';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <GlassCard className="text-center max-w-md">
        <h1 className="text-8xl font-bold text-ice-accent mb-4">404</h1>
        <h2 className="text-h2 font-bold mb-4">Page Not Found</h2>
        <p className="text-body text-border-subtle mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <GlassButton variant="primary" size="lg" as={Link} to="/">
          Go Home
        </GlassButton>
      </GlassCard>
    </div>
  );
}

