import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function NavButtons() {
  const { signOut } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { path: '/home', label: 'Home' },
    { path: '/minha-agenda', label: 'Minha Agenda' },
    { path: '/meu-trabalho', label: 'Meu Trabalho' },
    { path: '/ferramentas-ia', label: 'Ferramentas & IA' },
    { path: '/comunidade', label: 'Comunidade' },
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
