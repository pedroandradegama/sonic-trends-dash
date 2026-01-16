import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function NavButtons() {
  const { signOut } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { path: '/institucional', label: 'Institucional' },
    { path: '/', label: 'Repasse' },
    { path: '/casuistica', label: 'Casuística' },
    { path: '/nps', label: 'NPS' },
  ];

  return (
    <div className="flex gap-2">
      {navItems.map((item) => (
        <Button
          key={item.path}
          asChild
          variant={currentPath === item.path ? 'default' : 'outline'}
          size="sm"
          className="min-w-[90px]"
        >
          <Link to={item.path}>{item.label}</Link>
        </Button>
      ))}
      <Button onClick={signOut} variant="outline" size="sm" className="min-w-[60px]">
        Sair
      </Button>
    </div>
  );
}
